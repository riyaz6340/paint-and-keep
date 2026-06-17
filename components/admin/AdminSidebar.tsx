/**
 * Paint & Keep - Admin Sidebar Navigation
 *
 * Displays role-based navigation links in the admin panel sidebar.
 * Navigation items are filtered based on the current admin's role:
 * - Super Admin: ALL modules
 * - Operations: Products, Orders, Inventory, Customers
 * - Marketing: Gallery, Instagram, Testimonials, Coupons, Analytics, Content Management
 * - Customer Support: Customers, Orders, Reviews
 *
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type AdminRole = 'SUPER_ADMIN' | 'OPERATIONS' | 'MARKETING' | 'CUSTOMER_SUPPORT';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  /** Which roles can see this nav item */
  roles: AdminRole[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: '📊',
    roles: ['SUPER_ADMIN', 'OPERATIONS', 'MARKETING', 'CUSTOMER_SUPPORT'],
  },
  {
    label: 'Products',
    href: '/admin/products',
    icon: '🎨',
    roles: ['SUPER_ADMIN', 'OPERATIONS'],
  },
  {
    label: 'Orders',
    href: '/admin/orders',
    icon: '📦',
    roles: ['SUPER_ADMIN', 'OPERATIONS', 'CUSTOMER_SUPPORT'],
  },
  {
    label: 'Inventory',
    href: '/admin/inventory',
    icon: '📋',
    roles: ['SUPER_ADMIN', 'OPERATIONS'],
  },
  {
    label: 'Customers',
    href: '/admin/customers',
    icon: '👥',
    roles: ['SUPER_ADMIN', 'OPERATIONS', 'CUSTOMER_SUPPORT'],
  },
  {
    label: 'Reviews',
    href: '/admin/reviews',
    icon: '⭐',
    roles: ['SUPER_ADMIN', 'CUSTOMER_SUPPORT'],
  },
  {
    label: 'Gallery',
    href: '/admin/gallery',
    icon: '🖼️',
    roles: ['SUPER_ADMIN', 'MARKETING'],
  },
  {
    label: 'Instagram',
    href: '/admin/instagram',
    icon: '📸',
    roles: ['SUPER_ADMIN', 'MARKETING'],
  },
  {
    label: 'Testimonials',
    href: '/admin/testimonials',
    icon: '💬',
    roles: ['SUPER_ADMIN', 'MARKETING'],
  },
  {
    label: 'Coupons',
    href: '/admin/coupons',
    icon: '🏷️',
    roles: ['SUPER_ADMIN', 'MARKETING'],
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: '📈',
    roles: ['SUPER_ADMIN', 'MARKETING'],
  },
  {
    label: 'Content Management',
    href: '/admin/cms',
    icon: '📝',
    roles: ['SUPER_ADMIN', 'MARKETING'],
  },
  {
    label: 'Homepage Management',
    href: '/admin/homepage',
    icon: '🏠',
    roles: ['SUPER_ADMIN'],
  },
];

interface AdminSidebarProps {
  role: AdminRole;
}

export function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname();

  // Filter nav items based on role
  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside
      className="flex h-full w-64 flex-col bg-surface-dark text-text-inverse"
      aria-label="Admin navigation"
    >
      {/* Brand / Logo */}
      <div className="flex items-center gap-2 border-b border-white/10 px-6 py-5">
        <span className="text-2xl">🎨</span>
        <span className="font-heading text-lg font-semibold text-white">
          Paint & Keep
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1" role="list">
          {visibleItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-primary/20 text-brand-primary'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="text-lg" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Role badge at bottom */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="rounded-md bg-white/10 px-3 py-2 text-center text-xs text-white/60">
          {formatRoleName(role)}
        </div>
      </div>
    </aside>
  );
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

/**
 * Get the default module path for a given admin role.
 * Used for redirects when an admin accesses an unauthorized URL.
 */
export function getDefaultModuleForRole(role: AdminRole): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin';
    case 'OPERATIONS':
      return '/admin/products';
    case 'MARKETING':
      return '/admin/gallery';
    case 'CUSTOMER_SUPPORT':
      return '/admin/customers';
    default:
      return '/admin';
  }
}

/**
 * Check if a given path is accessible by the specified role.
 */
export function isPathAuthorizedForRole(pathname: string, role: AdminRole): boolean {
  // Dashboard is accessible to all roles
  if (pathname === '/admin') return true;

  // Find matching nav item for the path
  const matchingItem = navItems.find(
    (item) => item.href !== '/admin' && pathname.startsWith(item.href)
  );

  // If no matching nav item found, deny access (unknown route)
  if (!matchingItem) return false;

  return matchingItem.roles.includes(role);
}
