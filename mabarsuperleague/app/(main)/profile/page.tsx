import type { Metadata } from "next";

import { ProfileEditor } from "@/components/profile/profile-editor";
import { requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "My Profile",
};

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  return <ProfileEditor user={user} />;
}
