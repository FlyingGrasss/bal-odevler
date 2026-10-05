import { Suspense } from "react";
import { redirect } from "next/navigation";
import { HomeworkWriterDashboard } from "@/components/homework-page";
import { getCurrentHomeworkWriter } from "@/lib/homework-auth";
import { getHomeworkWriterPageData } from "@/lib/homework-data";

export const metadata = { title: "Ödev paneli", robots: { index: false, follow: false } };

export default function HomeworkPanelPage() {
  return <Suspense fallback={<div className="container-shell py-10"><div className="paper-card min-h-96 animate-pulse" /></div>}><HomeworkPanelContent /></Suspense>;
}

async function HomeworkPanelContent() {
  const writer = await getCurrentHomeworkWriter();
  if (!writer) redirect("/login");
  const data = await getHomeworkWriterPageData();
  return <div className="container-shell py-10 sm:py-14"><HomeworkWriterDashboard writer={writer} homework={data.homework} /></div>;
}
