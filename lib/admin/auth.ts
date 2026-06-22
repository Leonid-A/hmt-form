import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "admin_session";
const SESSION_TOKEN = "hmt-admin-authenticated";

export function getAdminCredentials() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD must be set in .env.local");
  }
  return { username, password };
}

export async function setAdminSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, SESSION_TOKEN, {
    httpOnly: true,
    sameSite: "lax",
    path: "/adminPanel",
    maxAge: 60 * 60 * 8, // 8 hours
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function requireAdminSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token !== SESSION_TOKEN) {
    redirect("/adminPanel/login");
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value === SESSION_TOKEN;
}
