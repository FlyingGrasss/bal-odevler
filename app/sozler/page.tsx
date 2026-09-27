import Link from "next/link";
import { Quote } from "lucide-react";
import { getApprovedQuotes } from "@/lib/data";
import { GRADE_LABELS } from "@/lib/constants";
import { formatRelativeDate } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { buttonStyles } from "@/components/ui/button";
import { appUrl } from "@/lib/utils";

export const metadata = { title: "Hoca sözleri", description: "BAL öğrencilerinin sınavlarda ve derslerde duyduğu unutulmayan öğretmen sözleri.", alternates: { canonical: appUrl("/sozler") } };

export default async function QuotesPage() {
  const quotes = await getApprovedQuotes();
  return (
    <div className="container-shell py-10 sm:py-14">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Sınavda çıkacaklar</p><h1 className="section-title mt-2 text-4xl sm:text-5xl">Hocalar ne dedi?</h1><p className="mt-3 max-w-xl leading-7 text-muted">Öğretmenlerin sınavda çıkacağını söylediği konuları ve önemli uyarıları burada toplayın.</p></div><Link href="/paylas" className={buttonStyles()}>Bir Söz Ekle</Link></div>
      {quotes.length ? <div className="mt-9 columns-1 gap-4 md:columns-2 lg:columns-3">{quotes.map((item, index) => <article key={item.id} className={`paper-card mb-4 break-inside-avoid p-6 ${index % 5 === 0 ? "bg-bal text-white" : ""}`}><Quote size={25} className={index % 5 === 0 ? "text-white/35" : "text-bal/35"} /><blockquote className="mt-5 text-xl font-black leading-snug">“{item.quote}”</blockquote><div className={`mt-5 border-t pt-4 text-xs ${index % 5 === 0 ? "border-white/15 text-white/65" : "border-line text-muted"}`}><p className="font-black">— {item.teacherName}</p>{item.context ? <p className="mt-1">{item.context}</p> : null}<p className="mt-2">{item.subject?.name ? `${item.subject.name} · ` : ""}{item.gradeLevel ? GRADE_LABELS[item.gradeLevel] + " · " : ""}{formatRelativeDate(item.publishedAt || item.createdAt)}</p></div></article>)}</div> : <div className="mt-8"><EmptyState title="Henüz söz eklenmedi" description="İlk unutulmaz hoca sözünü sen gönder; onaylandıktan sonra burada yerini alsın." /></div>}
    </div>
  );
}
