"use server";

import { redirect } from "next/navigation";

import { createSession, deleteSession } from "@/lib/auth/session";

// NOTE: Mock auth — accepts any email/password without checking a database.
// Replace the body of these actions with real credential checks later.

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const username = email.split("@")[0] || "player";

  await createSession(username);
  redirect("/");
}

export async function register(formData: FormData) {
  const username = String(formData.get("username") ?? "player");

  await createSession(username);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
