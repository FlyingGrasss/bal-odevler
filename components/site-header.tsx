import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { BookOpen, Menu, Plus, Quote, Shield, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { NotesMobileMenu } from "@/components/notes-mobile-menu";
import { Avatar } from "@/components/avatar";
import { buttonStyles } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="site-header fixed left-0 right-0 top-0 z-50 flex h-16 border-b border-gray-100 bg-white/95 shadow-md backdrop-blur-xl">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex h-full items-center justify-between">
          <Link href="/" className="flex items-center gap-2" aria-label="BAL Notes ana sayfa">
            <Image src="/bal-logo.png" alt="Bornova Anadolu Lisesi" width={40} height={40} priority className="size-10 rounded-full object-contain" />
            <span className="whitespace-nowrap text-sm font-bold tracking-tight text-ink sm:text-xl">BAL Notes</span>
          </Link>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Ana menü">
            <Link href="/" className="text-sm font-medium text-gray-500 transition-colors hover:text-bal">Ana Sayfa</Link>
            <Link href="/notlar" className="text-sm font-medium text-gray-500 transition-colors hover:text-bal"><BookOpen className="mr-1 inline" size={15} />Notlar</Link>
            <Link href="/sozler" className="text-sm font-medium text-gray-500 transition-colors hover:text-bal"><Quote className="mr-1 inline" size={15} />Hoca Sözleri</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Suspense fallback={<HeaderAuthFallback />}><SiteHeaderAuth /></Suspense>
            <Suspense fallback={<MobileMenuFallback />}><NotesMobileMenu><Suspense fallback={null}><SiteHeaderMobileAuth /></Suspense></NotesMobileMenu></Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}

async function SiteHeaderAuth() {
  const user = await getCurrentUser();
  if (!user) return <Link href="/auth/bal-id" className={`${buttonStyles({ size: "sm" })} hidden sm:inline-flex`}>BAL ID ile Giriş</Link>;
  return <div className="flex items-center gap-3"><Link href="/paylas" className={`${buttonStyles({ size: "sm" })} hidden sm:inline-flex`}><Plus size={16} /> Paylaş</Link>{user.isAdmin ? <Link href="/admin" aria-label="Yönetim" className="hidden size-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 sm:flex"><Shield size={16} /></Link> : null}<Link href="/profil" aria-label="Profil"><Avatar name={user.name} picture={user.picture} className="size-8" /></Link></div>;
}

async function SiteHeaderMobileAuth() {
  const user = await getCurrentUser();
  if (!user) return <MobileAuthLink href="/auth/bal-id" label="BAL ID ile Giriş" icon={<UserRound size={18} />} />;
  return <>{user.isAdmin ? <MobileAuthLink href="/admin" label="Yönetim" icon={<Shield size={18} />} /> : null}<MobileAuthLink href="/paylas" label="Paylaş" icon={<Plus size={18} />} /><MobileAuthLink href="/profil" label="Profilim" icon={<UserRound size={18} />} /></>;
}

function MobileAuthLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return <Link href={href} className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-bal">{icon}<span>{label}</span></Link>;
}

function HeaderAuthFallback() {
  return <div className="hidden h-8 w-24 sm:block" aria-hidden="true" />;
}

function MobileMenuFallback() {
  return <div className="p-2 text-ink lg:hidden" aria-hidden="true"><Menu size={24} /></div>;
}

export function HomeworkHeader() {
  return (
    <header className="site-header fixed left-0 right-0 top-0 z-50 flex h-16 border-b border-gray-100 bg-white/95 shadow-md backdrop-blur-xl">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex h-full items-center">
          <Link href="/" className="flex items-center gap-2" aria-label="BAL Ödevler ana sayfa">
            <Image src="/bal-logo.png" alt="Bornova Anadolu Lisesi" width={40} height={40} priority className="size-10 rounded-full object-contain" />
            <span className="whitespace-nowrap text-sm font-bold tracking-tight text-ink sm:text-xl">BAL Ödevler</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
