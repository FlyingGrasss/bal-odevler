export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-[#171717] py-10 text-white sm:py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xl font-black tracking-tight">BAL Ödevler</p>
          <p className="mt-2 text-sm font-medium text-white/55">Bornova Anadolu Lisesi öğrencileri için ortak ödev takibi.</p>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/45">Made by <a href="https://www.instagram.com/emre.bozqurt/" target="_blank" rel="noopener noreferrer" className="text-white transition hover:text-[#ff6b79]">Emre Bozkurt</a></p>
      </div>
    </footer>
  );
}
