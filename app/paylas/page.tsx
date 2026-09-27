import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getActiveSubjects } from "@/lib/data";
import { SubmissionForms } from "@/components/submission-forms";
import { SharePageLoading } from "@/components/notes-loading";

export const metadata = { title: "İçerik paylaş", robots: { index: false, follow: false } };

export default function SharePage() {
  return <Suspense fallback={<SharePageLoading />}><SharePageContent /></Suspense>;
}

async function SharePageContent() {
  await requireUser("/paylas");
  const subjects = await getActiveSubjects();
  return (
    <div className="container-shell py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="mb-7"><p className="eyebrow">Arşive katkı</p><h1 className="section-title mt-2 text-4xl">Ne paylaşmak istersin?</h1><p className="mt-3 max-w-2xl leading-7 text-muted">Bu sayfa not dosyası yüklemek veya bir öğretmen sözünü incelemeye göndermek içindir.</p></div>
        <SubmissionForms subjects={subjects.map(({ id, name, gradeLevel }) => ({ id, name, gradeLevel }))} />
      </div>
    </div>
  );
}
