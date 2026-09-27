import Link from "next/link";
import { ArrowRight, BookOpen, Quote, Sparkles, TrendingUp } from "lucide-react";
import { getHomeData } from "@/lib/data";
import { NoteCard } from "@/components/note-card";
import { EmptyState } from "@/components/empty-state";
import { buttonStyles } from "@/components/ui/button";

export const metadata = {
  title: "Sınava hazırlık notları",
  description: "BAL öğrencilerinin ders notlarını ve sınavda çıkacağı söylenen konuları paylaştığı arşiv.",
};

export default async function HomePage() {
  const { recommended, popular, recent, quotes } = await getHomeData();
  return (
    <>
      <section className="container-shell py-8 sm:py-12">
        <div className="hero-panel grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_21rem] lg:items-end">
          <div>
            <p className="eyebrow text-[#ff9baa]">Bornova Anadolu Lisesi</p>
            <h1 className="display-title mt-4 max-w-4xl leading-[1.04] text-white">Notunu paylaş.<br /><span className="text-[#ff8999]">Birlikte sınava hazırlan.</span></h1>
            <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-white/65 sm:text-lg">Sınavlara hazırlanırken ihtiyacın olan ders notları ve öğretmenlerinin sınavda vurguladığı konular tek yerde.</p>
            <div className="mt-7 flex flex-wrap gap-3"><Link href="/notlar" className={buttonStyles({ size: "lg" })}><BookOpen size={19} /> Notları Keşfet</Link><Link href="/paylas" className={buttonStyles({ variant: "outline", size: "lg", className: "border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white/15" })}>Not Paylaş <ArrowRight size={18} /></Link></div>
          </div>
          <div className="hero-note relative overflow-hidden p-6 text-white sm:p-7">
            <Quote className="absolute -right-3 -top-3 text-white/10" size={110} />
            <p className="relative text-[10px] font-black uppercase tracking-[0.2em] text-white/60">BAL’da bugün</p>
            <blockquote className="relative mt-5 text-2xl font-black leading-tight">{quotes[0] ? `“${quotes[0].quote}”` : "Sınava hazırlanırken aradığın notu bul."}</blockquote>
            <p className="relative mt-4 text-sm font-bold text-white/70">{quotes[0] ? `— ${quotes[0].teacherName}` : "— Öğrencilerin ortak arşivi"}</p>
          </div>
        </div>
      </section>

      <section className="container-shell grid gap-4 py-8 sm:grid-cols-2 sm:py-10">
        <article className="paper-card p-6 sm:p-8">
          <p className="eyebrow">Sorun</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight">Sınava hazırlanırken doğru notu bulmak zor.</h2>
          <p className="mt-3 leading-7 text-muted">Ders notları, sınavda çıkacağı söylenen konular ve öğretmenlerin önemli gördüğü noktalar mesaj gruplarında hızla kayboluyor.</p>
        </article>
        <article className="paper-card border-bal/20 bg-bal-soft/45 p-6 sm:p-8">
          <p className="eyebrow">Çözüm</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight">BAL Notes, öğrencilerin sınav arşivi.</h2>
          <p className="mt-3 leading-7 text-muted">Öğrenciler kendi notlarını, öğretmenlerinin notlarını ve sınavda çıkacağını söylediği konuları paylaşır. Herkes bunları ders ve sınıfa göre bulur; gönderiler yayınlanmadan önce incelenir.</p>
        </article>
      </section>

      <HomeSection eyebrow="Editör seçkisi" title="Önerilen notlar" icon={<Sparkles size={18} />} href="/notlar">
        {recommended.length ? <div className="grid gap-4 lg:grid-cols-2">{recommended.map((note) => <NoteCard key={note.id} note={note} featured />)}</div> : <EmptyState title="Henüz önerilen not yok" description="İlk notlar onaylandığında burada görünecek." />}
      </HomeSection>

      <HomeSection eyebrow="Öğrencilerin seçimi" title="En çok oy alanlar" icon={<TrendingUp size={18} />} href="/notlar?sirala=top">
        {popular.length ? <div className="grid gap-4 lg:grid-cols-2">{popular.slice(0, 4).map((note) => <NoteCard key={note.id} note={note} />)}</div> : <EmptyState title="Oy bekleyen notlar" description="Onaylanan notlara oy vererek en faydalıları yukarı taşı." />}
      </HomeSection>

      <HomeSection eyebrow="Taze mürekkep" title="Yeni eklenenler" icon={<BookOpen size={18} />} href="/notlar?sirala=yeni">
        {recent.length ? <div className="grid gap-4 lg:grid-cols-2">{recent.slice(0, 4).map((note) => <NoteCard key={note.id} note={note} />)}</div> : <EmptyState title="Henüz not eklenmedi" description="BAL Notes’un ilk notunu paylaşan sen olabilirsin." />}
      </HomeSection>

      <section className="container-shell py-10 sm:py-12">
        <div className="rounded-3xl bg-ink p-6 text-white sm:p-10">
          <div className="flex items-end justify-between gap-4"><div><p className="eyebrow text-[#ff8da0]">Sınavda çıkacaklar</p><h2 className="section-title mt-2">Hocalar ne dedi?</h2></div><Link href="/sozler" className="shrink-0 text-sm font-bold text-white/70 hover:text-white">Tüm sözler <ArrowRight className="inline" size={16} /></Link></div>
          <div className="mt-7 grid gap-3 md:grid-cols-3">{quotes.slice(0, 3).map((quote) => <blockquote key={quote.id} className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-lg font-black leading-snug">“{quote.quote}”</p><footer className="mt-4 text-xs font-bold text-white/55">— {quote.teacherName}</footer></blockquote>)}</div>
        </div>
      </section>
    </>
  );
}

function HomeSection({ eyebrow, title, icon, href, children }: { eyebrow: string; title: string; icon: React.ReactNode; href: string; children: React.ReactNode }) {
  return <section className="container-shell py-8 sm:py-10"><div className="mb-6 flex items-end justify-between gap-4"><div><p className="eyebrow flex items-center gap-2">{icon}{eyebrow}</p><h2 className="section-title mt-2">{title}</h2></div><Link href={href} className="shrink-0 text-sm font-bold text-bal hover:text-bal-bright">Tümünü Gör <ArrowRight className="inline" size={16} /></Link></div>{children}</section>;
}
