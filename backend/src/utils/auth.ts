import jwt, { Secret } from 'jsonwebtoken';
import { SiweMessage } from 'siwe';
import crypto from 'crypto';

// Require JWT_SECRET - fail fast if not set
if (!process.env.JWT_SECRET) {
  throw new Error(
    'FATAL: JWT_SECRET environment variable is not set. ' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}

const JWT_SECRET: Secret = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

// JWT payload interface
export interface JWTPayload {
  userId: string;
  walletAddress: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * Verify SIWE message signature
 */
export async function verifySiweMessage(
  message: string,
  signature: string
): Promise<{ success: boolean; address?: string; error?: string }> {
  try {
    const siweMessage = new SiweMessage(message);
    const { success, data } = await siweMessage.verify({ signature });

    if (!success) {
      return { success: false, error: 'Invalid signature' };
    }

    return {
      success: true,
      address: data.address,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * Generate nonce for SIWE
 * Must be alphanumeric only (at least 8 characters, only A-Z, a-z, 0-9)
 */
export function generateNonce(): string {
  // SIWE requires ONLY alphanumeric characters (no _, -, +, /, =, etc.)
  // Generate 16 random bytes and convert to hex (0-9, a-f only)
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Create JWT access token
 */
export function createAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as any,
  });
}

/**
 * Create JWT refresh token
 */
export function createRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN as any,
  });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Decode JWT token without verification (for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
}
