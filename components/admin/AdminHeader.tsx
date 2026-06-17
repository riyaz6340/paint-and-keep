/**
 * Paint & Keep - Admin Header
 *
 * Top header bar for the admin panel.
 * Displays the current admin's name, role, and a logout button.
 *
 * Requirements: 14.1, 14.8
 */

'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { type AdminRole } from './AdminSidebar';

interface AdminHeaderProps {
  adminName: string;
  adminEmail: string;
  role: AdminRole;
}

/** Format the AdminRole enum to a human-readable label */
function formatRoleName(role: AdminRole): string {
  const roleNames: Record<AdminRole, string> = {
    SUPER_ADMIN: 'Super Admin',
    OPERATIONS: 'Operations',
    MARKETING: 'Marketing',
    CUSTOMER_SUPPORT: 'Customer Support',
  };
  return roleNames[role] || role;
}

export function AdminHeader({ adminName, adminEmail, role }: AdminHeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect on failure since session might be invalid
      router.push('/admin/login');
    }
  }, [router]);

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Left side - Page context */}
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-medium text-text-secondary">
          Admin Panel
        </h2>
      </div>

      {/* Right side - User info and logout */}
      <div className="flex items-center gap-4">
        {/* Admin info */}
        <div className="text-right">
          <p className="text-sm font-medium text-text-primary">{adminName}</p>
          <p className="text-xs text-text-muted">
            {formatRoleName(role)} &middot; {adminEmail}
          </p>
        </div>

        {/* Avatar placeholder */}
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary/10 text-sm font-semibold text-brand-primary"
          aria-hidden="true"
        >
          {adminName.charAt(0).toUpperCase()}
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-status-error hover:text-status-error disabled:opacity-50"
          aria-label="Log out of admin panel"
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </header>
  );
}
