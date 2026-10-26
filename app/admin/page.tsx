import { Suspense } from "react";
import { HomeworkAdminPanel } from "@/components/homework-admin-panel";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { getHomeworkAdminData } from "@/lib/homework-data";

export const metadata = { title: "Yönetim", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <div className="container-shell py-10 sm:py-14">
      <div className="mb-7">
        <p className="eyebrow">Yönetim</p>
        <h1 className="section-title mt-2 text-4xl">BAL Ödevler yönetimi</h1>
        <p className="mt-3 text-muted">Ödev yazarlarını oluşturun, anahtarlarını yönetin ve paylaşımları denetleyin.</p>
      </div>
      <Suspense fallback={<AdminLoadingShell />}>
        <AdminPageContent />
      </Suspense>
    </div>
  );
}

async function AdminPageContent() {
  await requireAdmin();
  const data = await getHomeworkAdminData();
  return (
    <>
      <div className="mb-4 flex justify-end">
        <form action="/auth/cikis" method="post">
          <Button type="submit" variant="outline" size="sm">Çıkış yap</Button>
        </form>
      </div>
      <HomeworkAdminPanel writers={data.writers} homework={data.homework} />
    </>
  );
}

function AdminLoadingShell() {
  return (
    <div role="status" aria-busy="true" aria-label="Yönetim yükleniyor" className="space-y-10">
      <div className="mb-4 flex justify-end">
        <div className="h-9 w-24 animate-pulse rounded-xl bg-black/5 motion-reduce:animate-none" />
      </div>
      {[0, 1].map((section) => (
        <div key={section} className="paper-card animate-pulse p-6 motion-reduce:animate-none">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="h-6 w-40 rounded bg-black/5" />
              <div className="h-4 w-72 max-w-full rounded bg-black/5" />
            </div>
            <div className="h-9 w-28 rounded-xl bg-black/5" />
          </div>
          <div className="space-y-3">
            {[0, 1, 2].map((row) => (
              <div key={row} className="h-20 rounded-2xl border border-line bg-white" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
