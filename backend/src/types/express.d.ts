/**
 * Extended Express types
 *
 * Augments Express Request interface with custom properties
 */

import { JWTPayload } from '../utils/auth';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export {};
