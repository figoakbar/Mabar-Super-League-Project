import { UsersAdmin } from "@/components/admin/users-admin";
import { requireAdmin } from "@/lib/auth/dal";

export default async function AdminUsersPage() {
  // The layout already gates /admin; re-checking here gives us the actor's id
  // and keeps the page safe if it is ever mounted outside that layout.
  const admin = await requireAdmin();
  return <UsersAdmin currentUserId={admin.id} />;
}
