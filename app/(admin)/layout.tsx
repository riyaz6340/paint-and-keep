/**
 * Paint & Keep - Admin Route Group Layout
 *
 * Minimal wrapper for the (admin) route group.
 * The actual admin chrome (sidebar, header) is handled by
 * app/(admin)/admin/layout.tsx which has auth + RBAC logic.
 */
export default function AdminGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
