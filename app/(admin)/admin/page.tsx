/**
 * Paint & Keep - Admin Dashboard Overview
 *
 * Displays key business metrics: total orders, revenue,
 * pending orders, and low stock count. Data fetched client-side
 * for real-time accuracy.
 *
 * Requirements: 14.2
 */

'use client';

import { useEffect, useState } from 'react';

interface DashboardMetrics {
  totalOrders: number;
  revenue: number;
  pendingOrders: number;
  lowStockCount: number;
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/admin/dashboard/metrics', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          // If the metrics API doesn't exist yet, show placeholder data
          setMetrics({
            totalOrders: 0,
            revenue: 0,
            pendingOrders: 0,
            lowStockCount: 0,
          });
          return;
        }

        const data = await response.json();
        setMetrics(data);
      } catch {
        // Fallback to zero metrics if the API is not available yet
        setMetrics({
          totalOrders: 0,
          revenue: 0,
          pendingOrders: 0,
          lowStockCount: 0,
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  return (
    <div className="p-6 lg:p-8">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="font-heading text-display-sm text-brand-dark">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Welcome to the Paint & Keep admin panel. Here&apos;s an overview of your store.
        </p>
      </div>

      {/* Metrics Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-status-error/20 bg-status-error/5 p-4 text-sm text-status-error">
          {error}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Orders"
            value={metrics?.totalOrders ?? 0}
            icon="📦"
            format="number"
            color="blue"
          />
          <MetricCard
            title="Revenue"
            value={metrics?.revenue ?? 0}
            icon="💰"
            format="currency"
            color="green"
          />
          <MetricCard
            title="Pending Orders"
            value={metrics?.pendingOrders ?? 0}
            icon="⏳"
            format="number"
            color="orange"
          />
          <MetricCard
            title="Low Stock Items"
            value={metrics?.lowStockCount ?? 0}
            icon="⚠️"
            format="number"
            color="red"
          />
        </div>
      )}

      {/* Quick Links Section */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            title="Manage Products"
            description="Add, edit, or remove products from the catalog"
            href="/admin/products"
            icon="🎨"
          />
          <QuickAction
            title="View Orders"
            description="Track and update order statuses"
            href="/admin/orders"
            icon="📦"
          />
          <QuickAction
            title="Moderate Gallery"
            description="Approve or reject customer artwork submissions"
            href="/admin/gallery"
            icon="🖼️"
          />
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

interface MetricCardProps {
  title: string;
  value: number;
  icon: string;
  format: 'number' | 'currency';
  color: 'blue' | 'green' | 'orange' | 'red';
}

function MetricCard({ title, value, icon, format, color }: MetricCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-paint-blue/10 text-paint-blue',
    green: 'bg-status-success/10 text-status-success',
    orange: 'bg-brand-primary/10 text-brand-primary',
    red: 'bg-status-error/10 text-status-error',
  };

  const formattedValue =
    format === 'currency'
      ? new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        }).format(value)
      : value.toLocaleString();

  return (
    <div className="rounded-xl bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-secondary">{title}</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">
            {formattedValue}
          </p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClasses[color]}`}
        >
          <span className="text-xl" aria-hidden="true">
            {icon}
          </span>
        </div>
      </div>
    </div>
  );
}

function MetricCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="mt-2 h-7 w-16 rounded bg-gray-200" />
        </div>
        <div className="h-12 w-12 rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}

interface QuickActionProps {
  title: string;
  description: string;
  href: string;
  icon: string;
}

function QuickAction({ title, description, href, icon }: QuickActionProps) {
  return (
    <a
      href={href}
      className="group rounded-xl border border-gray-100 bg-white p-5 shadow-card transition-all hover:border-brand-primary/20 hover:shadow-card-hover"
    >
      <div className="flex items-start gap-4">
        <span className="text-2xl" aria-hidden="true">
          {icon}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-text-primary group-hover:text-brand-primary">
            {title}
          </h3>
          <p className="mt-1 text-xs text-text-secondary">{description}</p>
        </div>
      </div>
    </a>
  );
}
