import { redirect } from "next/navigation";
import { getAdminId } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Admin login" };

export default async function LoginPage() {
  if (await getAdminId()) redirect("/admin");
  return (
    <div className="card mx-auto max-w-sm p-8">
      <h1 className="mb-6 font-display text-2xl font-extrabold">Admin login</h1>
      <LoginForm />
    </div>
  );
}
