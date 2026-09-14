import { ReportsAdmin } from "@/components/admin/reports-admin";
import { requireAdmin } from "@/lib/auth/dal";

export default async function AdminReportsPage() {
  await requireAdmin();
  return <ReportsAdmin />;
}
