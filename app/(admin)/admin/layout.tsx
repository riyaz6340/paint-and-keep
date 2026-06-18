/**
 * Paint & Keep - Admin Layout
 *
 * Layout wrapper for all admin pages. Handles:
 * - Session validation (redirect to login if unauthenticated)
 * - Role-based access control (deny + error + redirect within 3 seconds)
 * - Sidebar navigation with role-filtered links
 * - Top header with admin info and logout
 *
 * Requirements: 14.1, 14.7, 14.8
 */

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { AdminHeader } from '@/components/admin/AdminHeader';
import {
  AdminSidebar,
  type AdminRole,
  getDefaultModuleForRole,
  isPathAuthorizedForRole,
} from '@/components/admin/AdminSidebar';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState<string>('');

  // Fetch admin session on mount
  const fetchAdminSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        // Not authenticated — redirect to admin login
        router.replace('/admin/login');
        return;
      }

      const data = await response.json();
      const user = data.user;

      // Check if this is an admin session (not a customer)
      const adminRoles = ['super_admin', 'operations', 'marketing', 'customer_support'];
      if (!user || !adminRoles.includes(user.role)) {
        router.replace('/admin/login');
        return;
      }

      // Map session role to AdminRole enum format
      const roleMap: Record<string, AdminRole> = {
        super_admin: 'SUPER_ADMIN',
        operations: 'OPERATIONS',
        marketing: 'MARKETING',
        customer_support: 'CUSTOMER_SUPPORT',
      };

      setAdmin({
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        role: roleMap[user.role] || 'OPERATIONS',
      });
    } catch {
      router.replace('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Skip auth check on login page
    if (pathname === '/admin/login') {
      setIsLoading(false);
      return;
    }

    fetchAdminSession();
  }, [pathname, fetchAdminSession]);

  // Check role-based access whenever pathname or admin changes
  useEffect(() => {
    if (!admin || pathname === '/admin/login') return;

    const authorized = isPathAuthorizedForRole(pathname, admin.role);
    if (!authorized) {
      const defaultModule = getDefaultModuleForRole(admin.role);
      setRedirectTarget(defaultModule);
      setAccessDenied(true);

      // Redirect within 3 seconds per requirement 14.7
      const timer = setTimeout(() => {
        setAccessDenied(false);
        router.replace(defaultModule);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setAccessDenied(false);
    }
  }, [pathname, admin, router]);

  // Login page doesn't use the admin layout chrome
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-secondary">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
          <p className="text-sm text-text-secondary">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Not authenticated (shouldn't reach here, but safety net)
  if (!admin) {
    return null;
  }

  // Access denied state with redirect countdown
  if (accessDenied) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-secondary">
        <div className="mx-auto max-w-md rounded-xl bg-white p-8 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-status-error/10">
            <span className="text-3xl" aria-hidden="true">🚫</span>
          </div>
          <h1 className="mb-2 font-heading text-xl font-semibold text-text-primary">
            Access Denied
          </h1>
          <p className="mb-4 text-sm text-text-secondary">
            You do not have permission to access this page. Your role ({formatRoleDisplay(admin.role)}) does not include access to this module.
          </p>
          <p className="text-xs text-text-muted">
            Redirecting to your default module in 3 seconds...
          </p>
          <div className="mt-4">
            <button
              onClick={() => router.replace(redirectTarget)}
              className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90"
            >
              Go now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-secondary">
      {/* Sidebar */}
      <AdminSidebar role={admin.role} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col lg:ml-0">
        {/* Header */}
        <AdminHeader
          adminName={admin.name}
          adminEmail={admin.email}
          role={admin.role}
        />

        {/* Page content */}
        <main id="main-content" role="main" className="flex-1 overflow-y-auto p-4 pt-16 lg:p-6 lg:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function formatRoleDisplay(role: AdminRole): string {
  const names: Record<AdminRole, string> = {
    SUPER_ADMIN: 'Super Admin',
    OPERATIONS: 'Operations',
    MARKETING: 'Marketing',
    CUSTOMER_SUPPORT: 'Customer Support',
  };
  return names[role] || role;
}
