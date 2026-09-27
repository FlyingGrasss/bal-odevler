import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileText, Share2 } from "lucide-react";
import { getNote } from "@/lib/data";
import { db } from "@/lib/db";
import { GRADE_LABELS } from "@/lib/constants";
import { appUrl, formatDate } from "@/lib/utils";
import { Avatar } from "@/components/avatar";
import { VoteButton } from "@/components/vote-button";
import { ShareDialog } from "@/components/share-dialog";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const note = await getNote(id);
  if (!note) return { title: "Not bulunamadı" };
  const description = note.description || `${GRADE_LABELS[note.gradeLevel]} ${note.subject?.name || note.customSubject || "ders"} notu`;
  const canonical = appUrl(`/notlar/${note.id}`);
  return { title: note.title, description, alternates: { canonical }, openGraph: { title: note.title, description, url: canonical, type: "article" } };
}

export async function generateStaticParams() {
  const notes = await db.note.findMany({ where: { status: "APPROVED" }, select: { id: true } });
  return notes.map(({ id }) => ({ id }));
}

export default async function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const note = await getNote(id);
  if (!note) notFound();
  const subject = note.subject?.name || note.customSubject || "Diğer";
  const date = note.submittedAt || note.createdAt;

  return (
    <div className="container-shell py-8 sm:py-12">
      <Link href="/notlar" className="inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-bal"><ArrowLeft size={17} /> Notlara dön</Link>
      <div className="mt-5 grid gap-6 lg:grid-cols-[4.5rem_minmax(0,1fr)_17rem]">
        <aside className="hidden lg:block"><div className="sticky top-24"><VoteButton noteId={note.id} initialCount={note._count.votes} /></div></aside>
        <article className="paper-card overflow-hidden">
          <header className="border-b border-line/80 p-5 sm:p-8">
            <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.1em]"><span className="rounded-full bg-bal px-3 py-1.5 text-white">{GRADE_LABELS[note.gradeLevel]}</span><span className="rounded-full bg-bal-soft px-3 py-1.5 text-bal">{subject}</span></div>
            <h1 className="mt-5 text-3xl font-black leading-[1.05] tracking-[-0.045em] sm:text-5xl">{note.title}</h1>
            {note.description ? <p className="mt-5 whitespace-pre-wrap text-base leading-7 text-muted">{note.description}</p> : null}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3"><Avatar name={note.author.name} picture={note.author.picture} /><div><p className="text-sm font-black">{note.author.name}</p><p className="mt-1 text-xs text-muted">{formatDate(date)}</p></div></div>
              <div className="flex items-center gap-3 lg:hidden"><VoteButton noteId={note.id} initialCount={note._count.votes} compact /><ShareDialog noteId={note.id} title={note.title} trigger={<><Share2 size={17} /> Paylaş</>} /></div>
            </div>
          </header>
          <div className="space-y-5 p-4 sm:p-8">
            {note.assets.map((asset, index) => (
              <figure key={asset.id} className="overflow-hidden rounded-2xl border border-line bg-paper-deep">
                {asset.contentType.startsWith("image/") ? <Image src={`/api/assets/${asset.id}`} alt={`${note.title} — sayfa ${index + 1}`} width={1600} height={2100} unoptimized className="h-auto w-full object-contain" /> : <iframe src={`/api/assets/${asset.id}`} title={asset.originalName} className="h-[70vh] min-h-[32rem] w-full bg-white" />}
                <figcaption className="flex items-center justify-between gap-3 border-t border-line bg-card px-4 py-3 text-xs text-muted"><span className="flex min-w-0 items-center gap-2 truncate"><FileText size={15} className="shrink-0" />{asset.originalName}</span><a href={`/api/assets/${asset.id}`} download className="flex shrink-0 items-center gap-1 font-bold text-bal hover:text-bal-bright"><Download size={15} /> İndir</a></figcaption>
              </figure>
            ))}
          </div>
        </article>
        <aside className="hidden lg:block">
          <div className="paper-card sticky top-24 p-5"><p className="eyebrow">Bu not faydalı mı?</p><p className="mt-3 text-sm leading-6 text-muted">Oy vererek iyi notların daha fazla öğrenciye ulaşmasına yardımcı ol.</p><div className="mt-5 border-t border-line pt-5"><ShareDialog noteId={note.id} title={note.title} trigger={<><Share2 size={17} /> Arkadaşlarınla paylaş</>} /></div></div>
        </aside>
      </div>
    </div>
  );
}
