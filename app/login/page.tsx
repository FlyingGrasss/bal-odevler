import { Suspense } from "react";
import Link from "next/link";
import { HomeworkLoginForm } from "@/components/homework-login-form";
import { buttonStyles } from "@/components/ui/button";

export const metadata = { title: "Ödev yazarı girişi", robots: { index: false, follow: false } };

export default function HomeworkLoginPage({ searchParams }: { searchParams: Promise<{ anahtar?: string }> }) {
  return <Suspense fallback={<div className="container-shell py-10"><div className="paper-card mx-auto min-h-96 max-w-xl animate-pulse" /></div>}><HomeworkLoginContent searchParams={searchParams} /></Suspense>;
}

async function HomeworkLoginContent({ searchParams }: { searchParams: Promise<{ anahtar?: string }> }) {
  const { anahtar } = await searchParams;
  return <div className="container-shell py-10 sm:py-14"><div className="mx-auto mb-8 max-w-xl"><p className="eyebrow">Ödev yazarı</p><h1 className="section-title mt-2 text-4xl">Giriş yap</h1><p className="mt-3 text-muted">Size verilen giriş anahtarını yazın veya QR kodu tarayarak bu sayfayı açın.</p></div><HomeworkLoginForm initialKey={anahtar || ""} /><div className="mx-auto mt-5 max-w-xl"><Link href="/" className={buttonStyles({ variant: "ghost", size: "sm" })}>Ödevlere dön</Link></div></div>;
}
