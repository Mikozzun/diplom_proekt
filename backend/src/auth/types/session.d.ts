/**
 * Augment express-session's SessionData with our application fields.
 */

import 'express-session';

declare module 'express-session' {
  interface SessionData {
    /** Authenticated user id (bigint stored as string) */
    userId?: string;
    /** Email of the authenticated user */
    email?: string;
    /** Device / UA string for session listing */
    userAgent?: string;
    /** IP address captured at login */
    ip?: string;
    /** Timestamp of session creation */
    createdAt?: number;
  }
}
