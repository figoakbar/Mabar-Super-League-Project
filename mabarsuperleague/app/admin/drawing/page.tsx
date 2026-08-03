import { DrawingAdmin } from "@/components/admin/drawing-admin";
import { requireAdmin } from "@/lib/auth/dal";

export default async function AdminDrawingPage() {
  await requireAdmin();
  return <DrawingAdmin />;
}
