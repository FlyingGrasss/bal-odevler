import type { SubmissionStatus } from "@prisma/client";
import { Suspense } from "react";
import { AdminDashboard } from "@/components/admin-dashboard";
import { requireAdmin } from "@/lib/auth";
import { getAdminData } from "@/lib/data";

export const metadata = { title: "Yönetim", robots: { index: false, follow: false } };

export default function AdminPage({ searchParams }: { searchParams: Promise<{ durum?: string }> }) {
  return <Suspense fallback={<AdminLoadingShell />}><AdminPageContent searchParams={searchParams} /></Suspense>;
}

async function AdminPageContent({ searchParams }: { searchParams: Promise<{ durum?: string }> }) {
  await requireAdmin();
  const { durum } = await searchParams;
  const status = (["PENDING", "APPROVED", "REJECTED"] as SubmissionStatus[]).includes(durum as SubmissionStatus) ? durum as SubmissionStatus : "PENDING";
  const data = await getAdminData();
  return <div className="container-shell py-10 sm:py-14"><div className="mb-7"><p className="eyebrow">Yönetim merkezi</p><h1 className="section-title mt-2 text-4xl">BAL Notes yönetimi</h1><p className="mt-3 text-muted">İçerikleri incele, ders listesini düzenle ve topluluk güvenliğini yönet.</p></div><AdminDashboard status={status} notes={data.notes.map((note) => ({ id: note.id, title: note.title, description: note.description, gradeLevel: note.gradeLevel, subjectName: note.subject?.name || null, customSubject: note.customSubject, status: note.status, rejectionReason: note.rejectionReason, isRecommended: note.isRecommended, author: note.author, assets: note.assets.map(({ id, contentType, originalName }) => ({ id, contentType, originalName })), updatedAt: note.updatedAt.toISOString() }))} quotes={data.quotes.map((quote) => ({ id: quote.id, teacherName: quote.teacherName, quote: quote.quote, context: quote.context, gradeLevel: quote.gradeLevel, subjectName: quote.subject?.name || null, status: quote.status, rejectionReason: quote.rejectionReason, author: quote.author, updatedAt: quote.updatedAt.toISOString() }))} subjects={data.subjects.map(({ id, name, gradeLevel, sortOrder, isActive }) => ({ id, name, gradeLevel, sortOrder, isActive }))} users={data.users.map((user) => ({ id: user.id, email: user.email, name: user.name, picture: user.picture, status: user.status, banReason: user.banReason, createdAt: user.createdAt.toISOString(), noteCount: user._count.notes, quoteCount: user._count.teacherQuotes }))} homeworkWriters={data.writers} homework={data.homework.map(({ id, title, description, subject, dueText, dueDate, writer, updatedAt }) => ({ id, title, description, subject, dueText, dueDate, writer, updatedAt }))} counts={data.counts} /></div>;
}

function AdminLoadingShell() {
  return (
    <div className="container-shell py-10 sm:py-14" aria-busy="true" aria-label="Yönetim yükleniyor">
      <div className="mb-7 space-y-3">
        <div className="h-3 w-32 animate-pulse rounded-full bg-paper-deep" />
        <div className="h-11 w-80 max-w-full animate-pulse rounded-xl bg-paper-deep" />
        <div className="h-5 w-[32rem] max-w-full animate-pulse rounded-full bg-paper-deep" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {["not", "söz", "hesap"].map((item) => <div key={item} className="paper-card flex items-center gap-4 p-5"><div className="size-11 animate-pulse rounded-xl bg-paper-deep" /><div className="space-y-2"><div className="h-7 w-12 animate-pulse rounded-lg bg-paper-deep" /><div className="h-3 w-24 animate-pulse rounded-full bg-paper-deep" /></div></div>)}
      </div>
      <div className="mt-7 flex gap-2 overflow-hidden rounded-2xl border border-line bg-card p-1.5">
        {["notlar", "sözler", "dersler", "kullanıcılar", "ödevler"].map((item) => <div key={item} className="h-10 w-24 shrink-0 animate-pulse rounded-xl bg-paper-deep" />)}
      </div>
      <div className="mt-6 flex gap-2"><div className="h-10 w-24 animate-pulse rounded-xl bg-paper-deep" /><div className="h-10 w-24 animate-pulse rounded-xl bg-paper-deep" /><div className="h-10 w-24 animate-pulse rounded-xl bg-paper-deep" /></div>
      <div className="paper-card mt-4 overflow-hidden"><div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_18rem]"><div className="space-y-4"><div className="flex gap-2"><div className="h-6 w-20 animate-pulse rounded-full bg-paper-deep" /><div className="h-6 w-24 animate-pulse rounded-full bg-paper-deep" /></div><div className="h-7 w-3/4 animate-pulse rounded-lg bg-paper-deep" /><div className="h-12 w-full animate-pulse rounded-xl bg-paper-deep" /><div className="h-7 w-48 animate-pulse rounded-full bg-paper-deep" /></div><div className="grid grid-cols-2 gap-2"><div className="aspect-square animate-pulse rounded-xl bg-paper-deep" /><div className="aspect-square animate-pulse rounded-xl bg-paper-deep" /></div></div><div className="h-16 animate-pulse border-t border-line bg-paper-deep/50" /></div>
    </div>
  );
}
