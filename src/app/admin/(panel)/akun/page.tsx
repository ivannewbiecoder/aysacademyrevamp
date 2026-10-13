import { ChangePasswordForm } from "@/components/admin/SmallForms";
import { requirePageUser } from "@/lib/auth/guards";

export const metadata = { title: "Akun saya" };

export default async function AccountPage() {
  const user = await requirePageUser();
  return (
    <>
      <h1>Akun saya</h1>
      <p className="admin-lede">
        {user.name} · {user.email} · {user.role}
      </p>
      <ChangePasswordForm />
    </>
  );
}
