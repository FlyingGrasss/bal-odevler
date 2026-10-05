import { cookies } from "next/headers";
import { HomeworkPublicPage } from "@/components/homework-page";
import { COMPLETED_HOMEWORK_COOKIE } from "@/lib/constants";
import { parseCompletedIds } from "@/lib/homework-completed";
import { getPublicHomework } from "@/lib/homework-data";
import { appUrl } from "@/lib/utils";

export const metadata = { title: "Okul ödevleri", description: "Bornova Anadolu Lisesi ders ödevleri ve teslim tarihleri.", alternates: { canonical: appUrl() } };

// Completed homework is read from a request cookie so the list is server
// rendered in its final shape. That needs the whole route to wait for the
// cookie instead of shipping a shell and patching the cards in afterwards;
// the homework query itself stays cached (`getPublicHomework`).
export const instant = false;

export default async function HomeworkPage() {
  const [homework, cookieStore] = await Promise.all([getPublicHomework(), cookies()]);
  const completedIds = parseCompletedIds(cookieStore.get(COMPLETED_HOMEWORK_COOKIE)?.value);
  return (
    <div className="container-shell py-10 sm:py-14">
      <HomeworkPublicPage homework={homework} initialCompletedIds={completedIds} />
    </div>
  );
}
