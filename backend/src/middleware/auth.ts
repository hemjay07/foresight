import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '../utils/auth';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Authentication middleware
 * Reads JWT from httpOnly cookie (preferred) or Authorization header (fallback).
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const cookieKeys = Object.keys(req.cookies || {});
  const hasAccessToken = !!req.cookies?.accessToken;
  const hasAuthHeader = !!req.headers.authorization;
  console.log(`[AUTH-DEBUG] authenticate() path=${req.path} cookieKeys=[${cookieKeys.join(',')}] hasAccessToken=${hasAccessToken} hasAuthHeader=${hasAuthHeader}`);

  const token = req.cookies?.accessToken || extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    console.log(`[AUTH-DEBUG] authenticate() REJECTED - no token. Origin=${req.headers.origin} Referer=${req.headers.referer}`);
    res.status(401).json({ success: false, error: 'No token provided' });
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
    return;
  }

  req.user = payload;
  next();
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
export function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.cookies?.accessToken || extractTokenFromHeader(req.headers.authorization);

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
}

/**
 * Admin authorization middleware
 * Requires authenticated user with 'admin' role
 * Must be used AFTER authenticate middleware
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }

  next();
}
