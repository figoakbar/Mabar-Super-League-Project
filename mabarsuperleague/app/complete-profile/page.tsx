import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { CompleteProfileForm } from "@/components/auth/complete-profile-form";
import { safeNext } from "@/lib/auth/constants";
import { requireSession } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Complete your profile",
  robots: { index: false, follow: false },
};

/**
 * The one page an incomplete account is allowed to see. It needs a session but
 * deliberately not a completed profile — `requireUser` would send it straight
 * back here in a loop.
 */
export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: rawNext } = await searchParams;
  const next = safeNext(rawNext);

  const user = await requireSession(next);
  if (user.profileComplete) redirect(next);

  return (
    <AuthShell
      title="Complete your profile"
      subtitle="Pick your username and add your gamer IDs so opponents can find you. Takes a minute — you only do this once."
    >
      <CompleteProfileForm user={user} next={next} />
    </AuthShell>
  );
}
