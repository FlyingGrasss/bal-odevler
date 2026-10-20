import { HomeworkAdminPanel } from "@/components/homework-admin-panel";
import { requireAdmin } from "@/lib/auth";
import { getHomeworkAdminData } from "@/lib/homework-data";

export const metadata = { title: "Yönetim", robots: { index: false, follow: false } };
export const instant = false;

export default function AdminPage() {
  return <AdminPageContent />;
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
