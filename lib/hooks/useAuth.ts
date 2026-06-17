/**
 * Paint & Keep - useAuth Client Hook
 *
 * React hook for managing authentication state on the client side.
 * Fetches the current user from GET /api/auth/me and provides
 * auth state, user data, and logout functionality.
 *
 * Uses React Context (via AuthProvider) for shared state across components.
 *
 * Requirements: 26.8, 26.9, 14.1
 */

'use client';

import { useCallback, useContext } from 'react';

import { AuthContext, type AuthContextValue } from '@/components/providers/AuthProvider';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Hook to access authentication state and actions.
 *
 * Must be used within an AuthProvider.
 *
 * @returns Auth state and actions: { user, isLoading, isAuthenticated, logout, refresh }
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

/**
 * Hook to require authentication for a component.
 * Redirects to login page if not authenticated after loading.
 *
 * @param redirectTo - URL to redirect to if not authenticated (default: '/login')
 * @returns Auth state (user is guaranteed non-null when isAuthenticated is true)
 */
export function useRequireAuth(redirectTo: string = '/login'): AuthContextValue {
  const auth = useAuth();

  // Client-side redirect when not authenticated
  if (!auth.isLoading && !auth.isAuthenticated && typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    window.location.href = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
  }

  return auth;
}

/**
 * Fetch the current user from the auth API.
 * Used internally by AuthProvider.
 */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user || null;
  } catch {
    return null;
  }
}

/**
 * Call the logout API and clear session.
 * Used internally by AuthProvider.
 */
export async function logoutUser(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    return response.ok;
  } catch {
    return false;
  }
}
