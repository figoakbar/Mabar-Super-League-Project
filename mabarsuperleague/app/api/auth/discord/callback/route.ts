import type { NextRequest } from "next/server";

import {
  DiscordEmailUnverified,
  discordRedirectUri,
  exchangeCodeForProfile,
} from "@/lib/auth/discord";
import { checkState, failSignIn, finishSignIn } from "@/lib/auth/oauth";

/** Step 2 of Discord sign-in: verify the callback and mint our own session. */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  // The user pressed "cancel" on Discord's screen (arrives as access_denied).
  if (params.get("error")) return failSignIn(req, "discord", "cancelled");

  const code = params.get("code");
  if (!code) return failSignIn(req, "discord", "state_missing");

  const verified = checkState(req, "discord");
  if (!verified.ok) return failSignIn(req, "discord", verified.reason);

  try {
    const profile = await exchangeCodeForProfile(code, discordRedirectUri(req));
    return await finishSignIn(req, "discord", profile, verified.state.next);
  } catch (err) {
    const reason =
      err instanceof DiscordEmailUnverified ? "email_unverified" : "signin_failed";
    return failSignIn(req, "discord", reason);
  }
}
