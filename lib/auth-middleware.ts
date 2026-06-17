/**
 * Paint & Keep - Auth Middleware for API Routes
 *
 * Server-side middleware that validates session tokens from cookies,
 * enforces authentication, and provides role-based access control
 * for admin routes.
 *
 * - `withAuthRequired(handler)` — validates session from cookie, passes user to handler
 * - `withAdminRequired(handler, allowedRoles?)` — validates admin session + role check
 *
 * Returns 401 if no session, 403 if wrong role.
 *
 * Requirements: 26.8, 26.9, 14.1, 14.7, 14.8
 */

import { NextRequest, NextResponse } from 'next/server';

import { handleApiError, unauthorized, forbidden } from './api-error';
import { validateSession, type SessionData } from './session';

/** Cookie name for the session token */
export const SESSION_COOKIE_NAME = 'session_token';

/** Admin roles that can access the admin dashboard */
export type AdminRole = 'admin' | 'super_admin' | 'operations' | 'marketing' | 'customer_support';

/** All valid admin roles */
const ADMIN_ROLES: AdminRole[] = [
  'admin',
  'super_admin',
  'operations',
  'marketing',
  'customer_support',
];

/** Extended request context passed to authenticated handlers */
export interface AuthenticatedRequest extends NextRequest {
  /** Parsed session data for the authenticated user */
  session: SessionData;
}

/** Handler type for authenticated API routes */
export type AuthenticatedHandler = (
  request: AuthenticatedRequest,
  context?: { params: Record<string, string> }
) => Promise<NextResponse> | NextResponse;

/** Handler type for standard API routes */
export type RouteHandler = (
  request: NextRequest,
  context?: { params: Record<string, string> }
) => Promise<NextResponse> | NextResponse;

/**
 * Extract the session token from the request cookies.
 */
function getSessionToken(request: NextRequest): string | null {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME);
  return cookie?.value || null;
}

/**
 * Wraps an API route handler with authentication validation.
 *
 * - Reads the session token from the `session_token` cookie
 * - Validates the session against Redis (also refreshes TTL for sliding expiration)
 * - Passes session data to the handler via `request.session`
 * - Returns 401 Unauthorized if session is missing or invalid
 *
 * @param handler - The route handler to protect
 * @returns A wrapped route handler with auth enforcement
 */
export function withAuthRequired(handler: AuthenticatedHandler): RouteHandler {
  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    try {
      const token = getSessionToken(request);

      if (!token) {
        throw unauthorized('Authentication required');
      }

      const session = await validateSession(token);

      if (!session) {
        throw unauthorized('Session expired or invalid');
      }

      // Attach session to request for downstream use
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.session = session;

      return await handler(authenticatedRequest, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Wraps an API route handler with admin authentication and role-based access control.
 *
 * - Validates session (same as `withAuthRequired`)
 * - Checks that the user's role is in the allowed roles list
 * - Super Admin always has access to all admin routes
 * - Returns 401 if not authenticated, 403 if role is not authorized
 *
 * @param handler - The route handler to protect
 * @param allowedRoles - Optional list of specific admin roles allowed. If omitted, any admin role is accepted.
 * @returns A wrapped route handler with admin auth + role enforcement
 */
export function withAdminRequired(
  handler: AuthenticatedHandler,
  allowedRoles?: AdminRole[]
): RouteHandler {
  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    try {
      const token = getSessionToken(request);

      if (!token) {
        throw unauthorized('Authentication required');
      }

      const session = await validateSession(token);

      if (!session) {
        throw unauthorized('Session expired or invalid');
      }

      // Check if user has an admin role
      const userRole = session.role;
      const isAdminRole = ADMIN_ROLES.includes(userRole as AdminRole);

      if (!isAdminRole) {
        throw forbidden('Access denied. Admin privileges required.');
      }

      // If specific roles are required, check against them
      // Super Admin always bypasses role restrictions
      if (allowedRoles && allowedRoles.length > 0) {
        const hasAccess =
          userRole === 'super_admin' || allowedRoles.includes(userRole as AdminRole);

        if (!hasAccess) {
          throw forbidden('Access denied. Insufficient role permissions.');
        }
      }

      // Attach session to request
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.session = session;

      return await handler(authenticatedRequest, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
