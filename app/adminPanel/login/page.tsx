import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { LoginForm } from "./LoginForm";

export default async function AdminLoginPage() {
  const authed = await isAdminAuthenticated();
  if (authed) redirect("/adminPanel");

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Admin Panel
        </h1>
        <LoginForm />
      </div>
    </div>
  );
}
