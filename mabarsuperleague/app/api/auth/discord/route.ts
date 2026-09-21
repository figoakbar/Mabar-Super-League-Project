import { NextResponse, type NextRequest } from "next/server";

import { discordRedirectUri } from "@/lib/auth/discord";
import { beginSignIn } from "@/lib/auth/oauth";

/** Step 1 of Discord sign-in: send the user to Discord's authorization screen. */
export async function GET(req: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/login?error=discord_not_configured", req.url),
    );
  }

  const authUrl = new URL("https://discord.com/oauth2/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", discordRedirectUri(req));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "identify email");
  // Always show the authorization screen so the account being used is obvious.
  authUrl.searchParams.set("prompt", "consent");

  return beginSignIn(req, "discord", authUrl);
}
