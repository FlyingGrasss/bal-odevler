import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Shield } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

// The header itself is static: only the admin link depends on the session, so
// only that link is streamed in. Keeping the bar in the shell means it is
// painted with the rest of the page instead of popping in afterwards.
export function SiteHeader() {
  return (
    <header className="site-header fixed left-0 right-0 top-0 z-50 flex h-16 border-b border-gray-100 bg-white/95 shadow-md backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="BAL Ödevler ana sayfa">
          <Image src="/bal-logo.png" alt="Bornova Anadolu Lisesi" width={40} height={40} priority className="size-10 rounded-full object-contain" />
          <span className="whitespace-nowrap text-sm font-bold tracking-tight text-ink sm:text-xl">BAL Ödevler</span>
        </Link>
        <Suspense fallback={<span className="size-9 shrink-0" aria-hidden="true" />}>
          <AdminLink />
        </Suspense>
      </div>
    </header>
  );
}

async function AdminLink() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return null;
  return (
    <Link href="/admin" aria-label="Yönetim" className="grid size-9 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-bal">
      <Shield size={17} />
    </Link>
  );
}
