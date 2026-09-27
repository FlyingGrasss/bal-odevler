import type { GradeLevel } from "@prisma/client";
import { Suspense } from "react";
import { getActiveSubjects, getNoteFeed } from "@/lib/data";
import { GRADE_OPTIONS } from "@/lib/constants";
import { NotesArchive, type NotesArchiveParams } from "@/components/notes-archive";
import { NotesArchiveLoading } from "@/components/notes-loading";

export const metadata = { title: "Notlarda ara", robots: { index: false, follow: false } };

export default function FilteredNotesPage({ searchParams }: { searchParams: Promise<NotesArchiveParams> }) {
  return <Suspense fallback={<NotesArchiveLoading />}><FilteredNotesContent searchParams={searchParams} /></Suspense>;
}

async function FilteredNotesContent({ searchParams }: { searchParams: Promise<NotesArchiveParams> }) {
  const params = await searchParams;
  const grade = GRADE_OPTIONS.some((item) => item.value === params.sinif) ? (params.sinif as GradeLevel) : undefined;
  const sort = params.sirala === "top" ? "top" : "new";
  const page = Math.max(Number.parseInt(params.sayfa || "1", 10) || 1, 1);
  const [feed, subjects] = await Promise.all([
    getNoteFeed({ grade, subject: params.ders || undefined, q: params.q?.trim() || undefined, sort, page }),
    getActiveSubjects(grade),
  ]);
  return <NotesArchive feed={feed} subjects={subjects} params={params} grade={grade} sort={sort} />;
}
