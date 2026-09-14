import type { Metadata } from "next";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdmin } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Admin",
  // Keep the admin area out of search results.
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authoritative gate for every /admin page. Non-admins never reach `children`,
  // and the backend independently rejects their API calls, so this is defence in
  // depth rather than the only lock.
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0B0D] font-body text-white md:flex-row">
      <AdminSidebar username={admin.username} />
      <main className="min-w-0 flex-1 p-5 sm:p-8">{children}</main>
    </div>
  );
}
