"use server";

import { redirect } from "next/navigation";
import { setAdminSession, getAdminCredentials } from "@/lib/admin/auth";

export type LoginState = { error: string } | null;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = formData.get("username");
  const password = formData.get("password");

  let creds: { username: string; password: string };
  try {
    creds = getAdminCredentials();
  } catch {
    return { error: "Admin credentials are not configured on the server." };
  }

  if (username !== creds.username || password !== creds.password) {
    return { error: "Invalid username or password." };
  }

  await setAdminSession();
  redirect("/adminPanel");
}
