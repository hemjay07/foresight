import { Router, Request, Response } from 'express';
import db from '../utils/db';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { optionalAuthenticate, authenticate } from '../middleware/auth';

const router: Router = Router();

/**
 * POST /api/errors/log
 * Log an error from frontend or backend
 */
router.post(
  '/log',
  optionalAuthenticate, // Optional - can log errors even if not authenticated
  asyncHandler(async (req: Request, res: Response) => {
    const {
      error_type,
      severity = 'error',
      message,
      stack_trace,
      component,
      user_action,
      metadata,
      url,
      method,
      status_code,
      environment = 'production',
      app_version,
    } = req.body;

    // Validation
    if (!error_type || !message) {
      throw new AppError('error_type and message are required', 400);
    }

    if (!['frontend', 'backend', 'api'].includes(error_type)) {
      throw new AppError('error_type must be frontend, backend, or api', 400);
    }

    if (!['error', 'warning', 'critical'].includes(severity)) {
      throw new AppError('severity must be error, warning, or critical', 400);
    }

    // Get user info if authenticated
    const userId = (req as any).user?.userId || null;
    const walletAddress = req.body.wallet_address || (req as any).user?.walletAddress || null;

    // Insert error log
    const [errorLog] = await db('error_logs')
      .insert({
        error_type,
        severity,
        message,
        stack_trace,
        component,
        user_action,
        metadata: metadata ? JSON.stringify(metadata) : null,
        user_id: userId,
        wallet_address: walletAddress,
        session_id: req.body.session_id || req.sessionID,
        url,
        method,
        status_code,
        environment,
        app_version,
      })
      .returning('*');

    // Log critical errors to console immediately
    if (severity === 'critical') {
      console.error('🚨 CRITICAL ERROR:', {
        id: errorLog.id,
        message,
        component,
        user_id: userId,
      });
    }

    res.status(201).json({
      success: true,
      error_id: errorLog.id,
      message: 'Error logged successfully',
    });
  })
);

/**
 * GET /api/errors
 * Get error logs (admin or own errors if authenticated)
 * Query params: limit, offset, severity, error_type, resolved
 */
router.get(
  '/',
  optionalAuthenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const severity = req.query.severity as string;
    const errorType = req.query.error_type as string;
    const resolved = req.query.resolved === 'true';

    let query = db('error_logs')
      .select(
        'error_logs.*',
        'users.username',
        'users.wallet_address as user_wallet'
      )
      .leftJoin('users', 'error_logs.user_id', 'users.id')
      .orderBy('error_logs.created_at', 'desc');

    // Filter by user if not admin (for now, just show own errors)
    if (userId) {
      query = query.where('error_logs.user_id', userId);
    }

    // Apply filters
    if (severity) {
      query = query.where('error_logs.severity', severity);
    }

    if (errorType) {
      query = query.where('error_logs.error_type', errorType);
    }

    if (req.query.resolved !== undefined) {
      query = query.where('error_logs.resolved', resolved);
    }

    const errors = await query.limit(limit).offset(offset);

    // Get total count
    const totalQuery = db('error_logs').count('* as count');
    if (userId) {
      totalQuery.where('user_id', userId);
    }
    const [{ count }] = await totalQuery;

    res.json({
      errors,
      total: parseInt(count as string),
      limit,
      offset,
    });
  })
);

/**
 * GET /api/errors/stats
 * Get error statistics
 */
router.get(
  '/stats',
  optionalAuthenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const hours = parseInt(req.query.hours as string) || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    let query = db('error_logs').where('created_at', '>=', since);

    if (userId) {
      query = query.where('user_id', userId);
    }

    // Count by severity
    const severityCounts = await query
      .clone()
      .select('severity')
      .count('* as count')
      .groupBy('severity');

    // Count by error type
    const typeCounts = await query
      .clone()
      .select('error_type')
      .count('* as count')
      .groupBy('error_type');

    // Recent errors
    const recentErrors = await query
      .clone()
      .select('id', 'severity', 'message', 'component', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(10);

    // Total count
    const [{ count: totalCount }] = await query.clone().count('* as count');

    res.json({
      total_errors: parseInt(totalCount as string),
      by_severity: severityCounts.reduce((acc, row) => {
        acc[row.severity] = parseInt(row.count as string);
        return acc;
      }, {} as Record<string, number>),
      by_type: typeCounts.reduce((acc, row) => {
        acc[row.error_type] = parseInt(row.count as string);
        return acc;
      }, {} as Record<string, number>),
      recent_errors: recentErrors,
      period_hours: hours,
    });
  })
);

/**
 * PATCH /api/errors/:id/resolve
 * Mark an error as resolved (admin only)
 */
router.patch(
  '/:id/resolve',
  authenticate, // Require authentication
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const [error] = await db('error_logs')
      .where({ id })
      .update({
        resolved: true,
        resolved_at: db.fn.now(),
      })
      .returning('*');

    if (!error) {
      throw new AppError('Error log not found', 404);
    }

    res.json({
      success: true,
      error,
    });
  })
);

export default router;
