import { Suspense } from "react";
import { HomeworkAdminPanel } from "@/components/homework-admin-panel";
import { requireAdmin } from "@/lib/auth";
import { getHomeworkAdminData } from "@/lib/homework-data";

export const metadata = { title: "Yönetim", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <Suspense fallback={<AdminLoadingShell />}><AdminPageContent /></Suspense>;
}

async function AdminPageContent() {
  await requireAdmin();
  const data = await getHomeworkAdminData();
  return (
    <div className="container-shell py-10 sm:py-14">
      <div className="mb-7">
        <p className="eyebrow">Yönetim</p>
        <h1 className="section-title mt-2 text-4xl">BAL Ödevler yönetimi</h1>
        <p className="mt-3 text-muted">Ödev yazarlarını oluşturun, anahtarlarını yönetin ve paylaşımları denetleyin.</p>
      </div>
      <HomeworkAdminPanel writers={data.writers} homework={data.homework} />
    </div>
  );
}

function AdminLoadingShell() {
  return (
    <div className="container-shell py-10 sm:py-14" aria-busy="true" aria-label="Yönetim yükleniyor">
      <div className="mb-7 space-y-3">
        <div className="h-3 w-32 animate-pulse rounded-full bg-paper-deep" />
        <div className="h-11 w-80 max-w-full animate-pulse rounded-xl bg-paper-deep" />
        <div className="h-5 w-[32rem] max-w-full animate-pulse rounded-full bg-paper-deep" />
      </div>
      <div className="space-y-3">
        <div className="paper-card h-24 animate-pulse" />
        <div className="paper-card h-24 animate-pulse" />
        <div className="paper-card h-24 animate-pulse" />
      </div>
    </div>
  );
}
