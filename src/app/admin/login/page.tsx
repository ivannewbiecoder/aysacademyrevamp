import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Masuk" };

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/admin");
  return (
    <main className="login-wrap">
      <div className="login-card">
        <p className="eyebrow">Panel admin</p>
        <h1>Masuk ke AYS CMS</h1>
        <LoginForm />
      </div>
    </main>
  );
}
