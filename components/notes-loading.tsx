import { ArrowBigUp, FileText, Filter, Search } from "lucide-react";

function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-paper-deep ${className}`} />;
}

export function NotesArchiveLoading() {
  return (
    <div className="container-shell py-10 sm:py-14" aria-busy="true" aria-label="Notlar yükleniyor">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="space-y-3"><Block className="h-3 w-28" /><Block className="h-12 w-72 max-w-full rounded-2xl" /><Block className="h-4 w-80 max-w-full rounded-full" /></div>
        <Block className="h-11 w-40 rounded-xl" />
      </div>
      <div className="paper-card mt-8 grid gap-3 p-4 lg:grid-cols-[1fr_11rem_14rem_10rem_auto]">
        <div className="relative"><Block className="h-12 w-full" /><Search className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted/40" size={17} /></div>
        <Block className="h-12" /><Block className="h-12" /><Block className="h-12" /><div className="flex h-12 items-center justify-center gap-2 rounded-xl bg-paper-deep"><Filter size={17} className="text-muted/40" /><Block className="h-3 w-12" /></div>
      </div>
      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        {[0, 1, 2, 3].map((item) => <div key={item} className="paper-card overflow-hidden p-4 sm:p-5"><div className="flex gap-3"><div className="flex h-20 w-12 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-bal/10 bg-bal-soft/40"><ArrowBigUp size={20} className="text-bal/40" /><Block className="h-3 w-5" /></div><div className="min-w-0 flex-1 space-y-3"><div className="flex gap-2"><Block className="h-6 w-16 rounded-full" /><Block className="h-6 w-20 rounded-full" /></div><Block className="h-6 w-4/5" /><Block className="h-4 w-full rounded-full" /><Block className="h-4 w-2/3 rounded-full" /><div className="flex gap-2 pt-2"><Block className="size-6 rounded-full" /><Block className="h-3 w-32 rounded-full" /></div></div></div></div>)}
      </div>
    </div>
  );
}

export function NoteDetailLoading() {
  return (
    <div className="container-shell py-8 sm:py-12" aria-busy="true" aria-label="Not yükleniyor">
      <Block className="h-4 w-28 rounded-full" />
      <div className="mt-5 grid gap-6 lg:grid-cols-[4.5rem_minmax(0,1fr)_17rem]">
        <div className="hidden lg:block"><Block className="h-20 w-12" /></div>
        <article className="paper-card overflow-hidden"><header className="space-y-5 border-b border-line/80 p-5 sm:p-8"><div className="flex gap-2"><Block className="h-7 w-16 rounded-full" /><Block className="h-7 w-24 rounded-full" /></div><Block className="h-12 w-4/5 rounded-2xl" /><Block className="h-5 w-full rounded-full" /><Block className="h-5 w-2/3 rounded-full" /><div className="flex justify-between gap-4 pt-2"><div className="flex items-center gap-3"><Block className="size-10 rounded-full" /><div className="space-y-2"><Block className="h-3 w-28 rounded-full" /><Block className="h-3 w-20 rounded-full" /></div></div><div className="flex gap-2"><Block className="h-10 w-16" /><Block className="h-10 w-20" /></div></div></header><div className="space-y-5 p-4 sm:p-8"><Block className="h-[32rem] w-full rounded-2xl" /><Block className="h-12 w-full rounded-2xl" /></div></article>
        <aside className="hidden lg:block"><div className="paper-card p-5"><Block className="h-3 w-28" /><Block className="mt-4 h-16 w-full" /><Block className="mt-5 h-11 w-full" /></div></aside>
      </div>
    </div>
  );
}

export function SharePageLoading() {
  return (
    <div className="container-shell py-10 sm:py-14" aria-busy="true" aria-label="Paylaşım sayfası yükleniyor">
      <div className="mx-auto max-w-3xl"><div className="mb-7 space-y-3"><Block className="h-3 w-28" /><Block className="h-12 w-80 max-w-full rounded-2xl" /><Block className="h-4 w-full max-w-2xl rounded-full" /><Block className="h-4 w-2/3 max-w-2xl rounded-full" /></div><div className="paper-card overflow-hidden"><div className="grid grid-cols-2 gap-2 border-b border-line bg-paper-deep/60 p-2"><Block className="h-12" /><Block className="h-12" /></div><div className="space-y-5 p-5 sm:p-8"><Block className="h-8 w-56" /><Block className="h-4 w-full max-w-xl rounded-full" /><Block className="h-12 w-full" /><Block className="h-28 w-full" /><div className="grid gap-4 sm:grid-cols-2"><Block className="h-12" /><Block className="h-12" /></div><div className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-bal/10 bg-bal-soft/30"><FileText className="text-bal/35" size={28} /><Block className="h-4 w-28" /></div><Block className="h-12 w-full" /></div></div></div>
    </div>
  );
}
