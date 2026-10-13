import { ProgramForm } from "@/components/admin/ProgramForm";
import { requirePageUser } from "@/lib/auth/guards";

export const metadata = { title: "Program baru" };

export default async function NewProgramPage() {
  await requirePageUser("content:write");
  return (
    <>
      <h1>Program baru</h1>
      <ProgramForm />
    </>
  );
}
