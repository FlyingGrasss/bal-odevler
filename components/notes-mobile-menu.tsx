"use client";

import Link from "next/link";
import { BookOpen, Home, Menu, Quote, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function NotesMobileMenu({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <button type="button" onClick={() => setOpen((value) => !value)} className="p-2 text-ink lg:hidden" aria-label={open ? "Menüyü kapat" : "Menüyü aç"} aria-expanded={open} aria-controls="site-mobile-navigation">
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>
      {open ? <div id="site-mobile-navigation" className="absolute left-0 right-0 top-16 border-t border-gray-100 bg-white shadow-xl lg:hidden">
        <nav className="flex flex-col gap-2 p-4" aria-label="Mobil menü">
          <MobileLink href="/" label="Ana Sayfa" icon={<Home size={18} />} active={pathname === "/"} onClick={() => setOpen(false)} />
          <MobileLink href="/notlar" label="Notlar" icon={<BookOpen size={18} />} active={active("/notlar")} onClick={() => setOpen(false)} />
          <MobileLink href="/sozler" label="Hoca Sözleri" icon={<Quote size={18} />} active={active("/sozler")} onClick={() => setOpen(false)} />
          {children}
        </nav>
      </div> : null}
    </>
  );
}

function MobileLink({ href, label, icon, active = false, onClick }: { href: string; label: string; icon: React.ReactNode; active?: boolean; onClick: () => void }) {
  return <Link href={href} onClick={onClick} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all ${active ? "font-bold text-bal" : "text-gray-600 hover:bg-gray-50 hover:text-bal"}`}>{icon}<span>{label}</span></Link>;
}
