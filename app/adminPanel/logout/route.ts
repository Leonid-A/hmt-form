import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/admin/auth";

export async function POST() {
  await clearAdminSession();
  return NextResponse.redirect(new URL("/adminPanel/login", process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"));
}
