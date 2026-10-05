import Link from "next/link";
import { Suspense } from "react";
import { ShieldAlert } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";

export const metadata = { title: "Giriş hatası", robots: { index: false, follow: false } };

function getMessage(kod: string | undefined): string {
  switch (kod) {
    case "yapilandirma":
      return "BAL ID bağlantısı henüz yapılandırılmamış.";
    case "gecersiz-istek":
      return "Giriş isteği doğrulanamadı. Lütfen yeniden deneyin.";
    case "oturum-suresi":
      return "Giriş isteğinin süresi doldu. Lütfen yeniden başlayın.";
    case "kimlik-hatasi":
      return "BAL ID doğrulanmış kimlik bilgilerini paylaşamadı.";
    case "yasakli-hesap":
      return "Bu hesap BAL Ödevler üzerinde yasaklanmış.";
    case "baglanti-hatasi":
      return "BAL ID ile bağlantı kurulamadı.";
    default:
      return "Beklenmeyen bir kimlik doğrulama hatası oluştu.";
  }
}

export default function AuthErrorPage({ searchParams }: { searchParams: Promise<{ kod?: string }> }) {
  return <Suspense fallback={<div className="container-shell py-24"><div className="paper-card mx-auto min-h-64 max-w-lg animate-pulse" /></div>}><AuthErrorContent searchParams={searchParams} /></Suspense>;
}

async function AuthErrorContent({ searchParams }: { searchParams: Promise<{ kod?: string }> }) {
  const { kod } = await searchParams;
  return <div className="container-shell py-24"><div className="paper-card mx-auto max-w-lg p-8 text-center"><ShieldAlert className="mx-auto text-bal" size={38} /><h1 className="mt-4 text-2xl font-black">Giriş tamamlanamadı</h1><p className="mt-2 text-sm leading-6 text-muted">{getMessage(kod || "")}</p><div className="mt-6 flex justify-center gap-2"><Link href="/auth/bal-id" className={buttonStyles()}>Tekrar Dene</Link><Link href="/" className={buttonStyles({ variant: "outline" })}>Ana Sayfa</Link></div></div></div>;
}