import "server-only";

import type { NextRequest } from "next/server";

import type { OAuthProfile } from "@/lib/auth/oauth";

/** Thrown when Discord reports the account's email as unverified. */
export class DiscordEmailUnverified extends Error {
  constructor() {
    super("Your Discord email address is not verified");
    this.name = "DiscordEmailUnverified";
  }
}

export function discordRedirectUri(req: NextRequest): string {
  return (
    process.env.DISCORD_REDIRECT_URI ??
    new URL("/api/auth/discord/callback", req.nextUrl.origin).toString()
  );
}

type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
  email?: string | null;
  verified?: boolean;
  avatar?: string | null;
};

/**
 * Swap the authorization code for an access token, then read the profile.
 *
 * Discord issues no ID token for the `identify email` scopes, so the identity
 * comes from the users/@me call made with the token we just received over TLS
 * using the client secret — the same trust basis as Google's token endpoint.
 * An unverified email is refused: our backend links accounts by email, so
 * accepting one would let anyone claim an address they do not control.
 */
export async function exchangeCodeForProfile(
  code: string,
  redirectUri: string,
): Promise<OAuthProfile> {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Discord is not configured");

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
  });
  const tokenBody = (await tokenRes.json()) as {
    access_token?: string;
    error_description?: string;
  };
  if (!tokenRes.ok || !tokenBody.access_token) {
    throw new Error(tokenBody.error_description ?? "Discord token exchange failed");
  }

  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${tokenBody.access_token}` },
    cache: "no-store",
  });
  if (!userRes.ok) throw new Error("Could not read the Discord profile");
  const user = (await userRes.json()) as DiscordUser;

  if (!user.id || !user.email) throw new Error("Discord did not return an email");
  if (user.verified !== true) throw new DiscordEmailUnverified();

  return {
    providerId: user.id,
    email: user.email,
    name: user.global_name || user.username,
    avatarUrl: user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
      : undefined,
  };
}
