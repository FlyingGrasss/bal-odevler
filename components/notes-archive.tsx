import type { GradeLevel } from "@prisma/client";
import Link from "next/link";
import { Filter, Search } from "lucide-react";
import { GRADE_OPTIONS } from "@/lib/constants";
import type { NoteCardData } from "@/lib/data";
import { NoteCard } from "@/components/note-card";
import { EmptyState } from "@/components/empty-state";
import { buttonStyles } from "@/components/ui/button";

export type NotesArchiveParams = { sinif?: string; ders?: string; q?: string; sirala?: string; sayfa?: string };

type NotesArchiveProps = {
  feed: { notes: NoteCardData[]; total: number; page: number; pages: number };
  subjects: Array<{ id: string; name: string; gradeLevel: GradeLevel }>;
  params: NotesArchiveParams;
  grade?: GradeLevel;
  sort: "new" | "top";
};

export function NotesArchive({ feed, subjects, params, grade, sort }: NotesArchiveProps) {
  function pageHref(nextPage: number) {
    const query = new URLSearchParams();
    if (grade) query.set("sinif", grade);
    if (params.ders) query.set("ders", params.ders);
    if (params.q) query.set("q", params.q);
    if (sort === "top") query.set("sirala", "top");
    query.set("sayfa", String(nextPage));
    return `/notlar?${query}`;
  }

  return (
    <div className="container-shell py-10 sm:py-14">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="eyebrow">Ders arşivi</p><h1 className="section-title mt-2 text-4xl sm:text-5xl">Notları keşfet</h1><p className="mt-3 text-muted">{feed.total} onaylanmış not arasından ihtiyacını bul.</p></div>
        <Link href="/paylas" className={buttonStyles()}>Kendi Notunu Paylaş</Link>
      </div>

      <form className="paper-card mt-8 grid gap-3 p-4 lg:grid-cols-[1fr_11rem_14rem_10rem_auto]" action="/notlar">
        <label className="relative"><span className="sr-only">Notlarda ara</span><Search className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" size={17} /><input className="field pr-11" name="q" defaultValue={params.q} placeholder="Başlık veya konu ara…" /></label>
        <label><span className="sr-only">Sınıf</span><select className="field" name="sinif" defaultValue={grade || ""}><option value="">Tüm sınıflar</option>{GRADE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label><span className="sr-only">Ders</span><select className="field" name="ders" defaultValue={params.ders || ""}><option value="">Tüm dersler</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}{grade ? "" : ` · ${GRADE_OPTIONS.find((item) => item.value === subject.gradeLevel)?.label}`}</option>)}</select></label>
        <label><span className="sr-only">Sıralama</span><select className="field" name="sirala" defaultValue={sort === "top" ? "top" : "yeni"}><option value="yeni">En yeni</option><option value="top">En çok oy</option></select></label>
        <button className={buttonStyles({ className: "h-auto min-h-11" })} type="submit"><Filter size={17} /> Uygula</button>
      </form>

      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        {feed.notes.map((note) => <NoteCard key={note.id} note={note} />)}
      </div>
      {!feed.notes.length ? <div className="mt-7"><EmptyState title="Bu filtrelerde not yok" description="Filtreleri temizleyebilir veya aradığın ders için ilk notu paylaşabilirsin." /></div> : null}

      {feed.pages > 1 ? <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Sayfalar"><Link aria-disabled={feed.page <= 1} className={buttonStyles({ variant: "outline", size: "sm", className: feed.page <= 1 ? "pointer-events-none opacity-40" : "" })} href={pageHref(feed.page - 1)}>Önceki</Link><span className="text-sm font-bold text-muted">{feed.page} / {feed.pages}</span><Link aria-disabled={feed.page >= feed.pages} className={buttonStyles({ variant: "outline", size: "sm", className: feed.page >= feed.pages ? "pointer-events-none opacity-40" : "" })} href={pageHref(feed.page + 1)}>Sonraki</Link></nav> : null}
    </div>
  );
}
