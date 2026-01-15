/**
 * Standardized API Response Utilities
 *
 * All API endpoints should use these utilities to ensure
 * consistent response format across the application.
 *
 * Standard Format:
 * - Success: { success: true, data: T }
 * - Error: { success: false, error: string, details?: any }
 */

import { Response } from 'express';

/**
 * Standard success response structure
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
}

/**
 * Standard error response structure
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: any;
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Send a standardized success response
 *
 * @example
 * sendSuccess(res, { user: { id: '123', name: 'John' } })
 * // Returns: { success: true, data: { user: { id: '123', name: 'John' } } }
 */
export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200): Response {
  return res.status(statusCode).json({
    success: true,
    data,
  } as ApiSuccessResponse<T>);
}

/**
 * Send a standardized error response
 *
 * @example
 * sendError(res, 'User not found', 404)
 * // Returns: { success: false, error: 'User not found' }
 */
export function sendError(
  res: Response,
  error: string,
  statusCode: number = 400,
  details?: any
): Response {
  const response: ApiErrorResponse = {
    success: false,
    error,
  };

  if (details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
}

/**
 * Send a standardized validation error response
 *
 * @example
 * sendValidationError(res, [{ field: 'email', message: 'Invalid email' }])
 */
export function sendValidationError(
  res: Response,
  errors: Array<{ field: string; message: string }>
): Response {
  return sendError(res, 'Validation failed', 400, errors);
}

/**
 * Send a standardized not found error
 *
 * @example
 * sendNotFound(res, 'User')
 * // Returns: { success: false, error: 'User not found' }
 */
export function sendNotFound(res: Response, resource: string): Response {
  return sendError(res, `${resource} not found`, 404);
}

/**
 * Send a standardized unauthorized error
 */
export function sendUnauthorized(res: Response, message: string = 'Unauthorized'): Response {
  return sendError(res, message, 401);
}

/**
 * Send a standardized forbidden error
 */
export function sendForbidden(res: Response, message: string = 'Forbidden'): Response {
  return sendError(res, message, 403);
}

/**
 * Send a standardized internal server error
 */
export function sendServerError(res: Response, message: string = 'Internal server error'): Response {
  return sendError(res, message, 500);
}

/**
 * Send a standardized created response (201)
 */
export function sendCreated<T>(res: Response, data: T): Response {
  return sendSuccess(res, data, 201);
}

/**
 * Send a standardized no content response (204)
 */
export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}
