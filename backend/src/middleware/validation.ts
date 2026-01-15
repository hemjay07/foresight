/**
 * Input Validation Middleware
 *
 * Provides validation rules for common input patterns
 * using express-validator
 */

import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check validation results and return errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
    return;
  }
  next();
};

/**
 * Common validation rules
 */
export const validators = {
  /**
   * Ethereum wallet address validation
   */
  walletAddress: () =>
    body('walletAddress')
      .trim()
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid Ethereum address format'),

  /**
   * Username validation
   */
  username: () =>
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be 3-50 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),

  /**
   * Twitter handle validation
   */
  twitterHandle: () =>
    body('twitterHandle')
      .optional()
      .trim()
      .isLength({ min: 1, max: 15 })
      .withMessage('Twitter handle must be 1-15 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Invalid Twitter handle format'),

  /**
   * UUID validation (for path params)
   */
  uuid: (field: string = 'id') =>
    param(field).isUUID().withMessage(`${field} must be a valid UUID`),

  /**
   * UUID validation (for request body)
   */
  uuidBody: (field: string) =>
    body(field).isUUID().withMessage(`${field} must be a valid UUID`),

  /**
   * Positive integer validation
   */
  positiveInteger: (field: string) =>
    body(field)
      .isInt({ min: 1 })
      .withMessage(`${field} must be a positive integer`),

  /**
   * Non-negative integer validation
   */
  nonNegativeInteger: (field: string) =>
    body(field)
      .isInt({ min: 0 })
      .withMessage(`${field} must be a non-negative integer`),

  /**
   * String sanitization (prevent XSS)
   */
  sanitizeString: (field: string, maxLength: number = 500) =>
    body(field)
      .trim()
      .escape()
      .isLength({ max: maxLength })
      .withMessage(`${field} must be ${maxLength} characters or less`),

  /**
   * Limit validation for pagination
   */
  paginationLimit: () =>
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),

  /**
   * Offset validation for pagination
   */
  paginationOffset: () =>
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be non-negative')
      .toInt(),

  /**
   * Amount validation (for FS, XP, etc.)
   */
  amount: (field: string = 'amount') =>
    body(field)
      .isInt({ min: 1, max: 1000000 })
      .withMessage(`${field} must be between 1 and 1,000,000`),

  /**
   * Contest ID validation
   */
  contestId: () =>
    param('contestId')
      .isInt({ min: 1 })
      .withMessage('Contest ID must be a positive integer')
      .toInt(),

  /**
   * Influencer ID validation
   */
  influencerId: () =>
    param('influencerId')
      .isInt({ min: 1 })
      .withMessage('Influencer ID must be a positive integer')
      .toInt(),
};
