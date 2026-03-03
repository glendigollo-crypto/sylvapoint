// ---------------------------------------------------------------------------
// Admin Authentication — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------
// Password verification, JWT token management, and brute-force protection
// for the admin dashboard.
// ---------------------------------------------------------------------------

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase/admin';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminTokenPayload {
  userId: string;
  iat: number;
  exp: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** JWT token expiry: 24 hours. */
const TOKEN_EXPIRY = '24h';

/** Max failed login attempts before lockout. */
const MAX_FAILED_ATTEMPTS = 5;

/** Lockout duration in minutes. */
const LOCKOUT_DURATION_MINUTES = 15;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getJwtSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error(
      'Missing environment variable: ADMIN_JWT_SECRET. ' +
        'Add it to your .env.local file.',
    );
  }
  return secret;
}

function getPasswordHash(): string {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    throw new Error(
      'Missing environment variable: ADMIN_PASSWORD_HASH. ' +
        'Generate one with: npx bcryptjs hash <password>',
    );
  }
  return hash;
}

// ---------------------------------------------------------------------------
// Public API: Password Verification
// ---------------------------------------------------------------------------

/**
 * Verify an admin password against the stored bcrypt hash.
 *
 * @param password - The plaintext password to verify.
 * @returns `true` if the password matches, `false` otherwise.
 */
export async function verifyAdminPassword(
  password: string,
): Promise<boolean> {
  const hash = getPasswordHash();
  return bcrypt.compare(password, hash);
}

// ---------------------------------------------------------------------------
// Public API: Token Management
// ---------------------------------------------------------------------------

/**
 * Create a signed JWT token for an authenticated admin user.
 *
 * The token includes the user ID and expires after 24 hours.
 *
 * @param userId - The admin user's ID.
 * @returns A signed JWT string.
 */
export async function createAdminToken(userId: string): Promise<string> {
  const secret = getJwtSecret();

  const token = jwt.sign({ userId }, secret, {
    expiresIn: TOKEN_EXPIRY,
    algorithm: 'HS256',
  });

  return token;
}

/**
 * Verify and decode an admin JWT token.
 *
 * @param token - The JWT string to verify.
 * @returns The decoded payload with userId, or `null` if invalid/expired.
 */
export async function verifyAdminToken(
  token: string,
): Promise<{ userId: string } | null> {
  const secret = getJwtSecret();

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    }) as AdminTokenPayload;

    return { userId: decoded.userId };
  } catch {
    // Token is invalid, expired, or tampered with
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API: Admin Rate Limiting (brute-force protection)
// ---------------------------------------------------------------------------

/**
 * Check whether an admin login attempt is allowed.
 *
 * Implements a lockout mechanism: after MAX_FAILED_ATTEMPTS failed attempts
 * within the lockout window, the identifier is blocked for
 * LOCKOUT_DURATION_MINUTES.
 *
 * @param identifier - The identifier to rate-limit (IP address or email).
 * @returns `true` if the attempt is allowed, `false` if locked out.
 */
export async function checkAdminRateLimit(
  identifier: string,
): Promise<boolean> {
  try {
    const windowStart = new Date();
    windowStart.setMinutes(
      windowStart.getMinutes() - LOCKOUT_DURATION_MINUTES,
    );

    const { count, error } = await supabaseAdmin
      .from('admin_login_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('identifier', identifier)
      .eq('success', false)
      .gte('created_at', windowStart.toISOString());

    if (error) {
      console.error(
        '[admin-auth] Failed to check rate limit:',
        error.message,
      );
      // Fail-open: allow the attempt if the DB query fails
      return true;
    }

    return (count ?? 0) < MAX_FAILED_ATTEMPTS;
  } catch (error) {
    console.error(
      '[admin-auth] Rate limit check error:',
      error instanceof Error ? error.message : error,
    );
    return true;
  }
}

/**
 * Record a login attempt (success or failure) for rate-limiting purposes.
 *
 * @param identifier - The identifier (IP or email).
 * @param success - Whether the login attempt was successful.
 */
export async function recordLoginAttempt(
  identifier: string,
  success: boolean,
): Promise<void> {
  try {
    await supabaseAdmin.from('admin_login_attempts').insert({
      identifier,
      success,
      created_at: new Date().toISOString(),
    });

    // If login succeeded, clear previous failed attempts for this identifier
    // so they don't count towards future lockouts.
    if (success) {
      await supabaseAdmin
        .from('admin_login_attempts')
        .delete()
        .eq('identifier', identifier)
        .eq('success', false);
    }
  } catch (error) {
    // Non-critical — log but don't throw
    console.error(
      '[admin-auth] Failed to record login attempt:',
      error instanceof Error ? error.message : error,
    );
  }
}
