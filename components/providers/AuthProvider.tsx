/**
 * Paint & Keep - Auth Provider
 *
 * React context provider that manages authentication state for the
 * entire client-side application. Wraps the useAuth hook logic
 * and provides shared state to all child components.
 *
 * Features:
 * - Fetches current user on mount
 * - Caches user data in state
 * - Provides logout function
 * - Provides refresh function to re-fetch user state
 *
 * Requirements: 26.8, 26.9
 */

'use client';

import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import { type AuthUser, fetchCurrentUser, logoutUser } from '@/lib/hooks/useAuth';

export interface AuthContextValue {
  /** Current authenticated user, or null if not authenticated */
  user: AuthUser | null;
  /** Whether the initial auth check is in progress */
  isLoading: boolean;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Log out the current user and clear session */
  logout: () => Promise<void>;
  /** Refresh the user data from the server */
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch the current user from the API.
   */
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Log out the current user.
   */
  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  // Fetch user on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      logout,
      refresh,
    }),
    [user, isLoading, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
