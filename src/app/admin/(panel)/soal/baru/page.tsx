import { QuestionSetForm } from "@/components/admin/QuestionForms";
import { requirePageUser } from "@/lib/auth/guards";

export const metadata = { title: "Set soal baru" };

export default async function NewQuestionSetPage() {
  await requirePageUser("questions:write");
  return (
    <>
      <h1>Set soal baru</h1>
      <p className="admin-lede">Buat set dulu, lalu tambahkan soal satu per satu.</p>
      <QuestionSetForm />
    </>
  );
}
