import type { NextRequest } from "next/server";

import { exchangeCodeForProfile, googleRedirectUri } from "@/lib/auth/google";
import { checkState, failSignIn, finishSignIn } from "@/lib/auth/oauth";

/** Step 2 of Google sign-in: verify the callback and mint our own session. */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  // The user pressed "cancel" on Google's screen.
  if (params.get("error")) return failSignIn(req, "google", "cancelled");

  const code = params.get("code");
  if (!code) return failSignIn(req, "google", "state_missing");

  const verified = checkState(req, "google");
  if (!verified.ok) return failSignIn(req, "google", verified.reason);

  try {
    const profile = await exchangeCodeForProfile(code, googleRedirectUri(req));
    return await finishSignIn(
      req,
      "google",
      {
        providerId: profile.sub,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.picture,
      },
      verified.state.next,
    );
  } catch {
    return failSignIn(req, "google", "signin_failed");
  }
}
