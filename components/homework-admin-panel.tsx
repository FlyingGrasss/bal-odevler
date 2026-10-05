"use client";

import { CheckSquare, Pencil, Plus, RefreshCw, ShieldOff, Square, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { createHomework, createHomeworkWriter, deleteHomework, deleteHomeworkWriter, rotateHomeworkWriterKey, setHomeworkPast, setHomeworkWriterActive, updateHomework, updateHomeworkWriter } from "@/actions/homework";
import { HOMEWORK_SUBJECT_LABELS, HOMEWORK_SUBJECT_OPTIONS } from "@/lib/constants";
import { formatHomeworkDate } from "@/lib/homework-display";
import type { HomeworkDto, HomeworkSubjectValue, HomeworkWriterKindValue, HomeworkWriterView } from "@/lib/homework-types";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog, DialogContent } from "@/components/ui/dialog";

type AdminHomeworkWriter = HomeworkWriterView & { createdAt: string };
type Credential = { writer: { id: string; name: string; kind: HomeworkWriterKindValue; fixedSubject: HomeworkSubjectValue | null }; loginUrl: string; qrDataUrl: string };

export function HomeworkAdminPanel({ writers, homework }: { writers: AdminHomeworkWriter[]; homework: HomeworkDto[] }) {
  return <div className="space-y-10"><WriterAccounts writers={writers} /><HomeworkOversight writers={writers} homework={homework} /></div>;
}

function WriterAccounts({ writers }: { writers: AdminHomeworkWriter[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editWriter, setEditWriter] = useState<AdminHomeworkWriter | null>(null);
  const [credential, setCredential] = useState<Credential | null>(null);
  const [rotateWriter, setRotateWriter] = useState<AdminHomeworkWriter | null>(null);
  const [revokeWriter, setRevokeWriter] = useState<AdminHomeworkWriter | null>(null);
  const [deleteWriter, setDeleteWriter] = useState<AdminHomeworkWriter | null>(null);
  const [pending, startTransition] = useTransition();
  function removeWriter() { if (!deleteWriter) return; startTransition(async () => { const result = await deleteHomeworkWriter(deleteWriter.id); if (!result.success) { toast.error(result.error); return; } toast.success("Yazar ve ödevleri silindi."); setDeleteWriter(null); router.refresh(); }); }
  function rotateKey() { if (!rotateWriter) return; startTransition(async () => { const result = await rotateHomeworkWriterKey(rotateWriter.id); if (!result.success) { toast.error(result.error); return; } setRotateWriter(null); setCredential(result.data); router.refresh(); }); }
  function revoke() { if (!revokeWriter) return; startTransition(async () => { const result = await setHomeworkWriterActive(revokeWriter.id, false); if (!result.success) { toast.error(result.error); return; } toast.success("Yazar erişimi askıya alındı."); setRevokeWriter(null); router.refresh(); }); }
  function reactivate(writer: AdminHomeworkWriter) { startTransition(async () => { const result = await setHomeworkWriterActive(writer.id, true); if (!result.success) { toast.error(result.error); return; } toast.success("Yazar yeniden etkinleştirildi."); router.refresh(); }); }
  return <section><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-xl font-black">Ödev yazarları</h2><p className="mt-1 text-sm text-muted">QR anahtarları yalnızca oluşturma veya yenileme anında gösterilir.</p></div><Button size="sm" onClick={() => setCreateOpen(true)}><Plus size={15} /> Yazar ekle</Button></div><div className="space-y-3">{writers.length ? writers.map((writer) => <article key={writer.id} className="paper-card flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center"><div><p className="font-black">{writer.name}</p><p className="mt-1 text-xs text-muted">{writer.kind === "TEACHER" ? `Öğretmen · ${HOMEWORK_SUBJECT_LABELS[writer.fixedSubject!]}` : "Akıllı tahta · tüm dersler"}</p><p className="mt-1 text-xs text-muted">{writer.lastLoginAt ? `Son giriş: ${formatHomeworkDate(writer.lastLoginAt)}` : "Henüz giriş yapmadı"}</p><p className={`mt-1 text-xs font-bold ${writer.isActive ? "text-green-700" : "text-red-700"}`}>{writer.isActive ? "Etkin" : "Askıya alındı"}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => setEditWriter(writer)}><Pencil size={14} /> Düzenle</Button>{writer.isActive ? <Button variant="outline" size="sm" onClick={() => setRevokeWriter(writer)}><ShieldOff size={14} /> Askıya al</Button> : <Button variant="outline" size="sm" onClick={() => reactivate(writer)}><RefreshCw size={14} /> Yeniden etkinleştir</Button>}<Button variant="outline" size="sm" onClick={() => setRotateWriter(writer)}><RefreshCw size={14} /> Anahtarı yenile</Button><Button variant="danger" size="sm" onClick={() => setDeleteWriter(writer)}><Trash2 size={14} /> Sil</Button></div></article>) : <div className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">Henüz ödev yazarı yok.</div>}</div><WriterForm open={createOpen} onOpenChange={setCreateOpen} onCreated={(value) => { setCreateOpen(false); setCredential(value); router.refresh(); }} /><WriterForm writer={editWriter} open={Boolean(editWriter)} onOpenChange={(open) => !open && setEditWriter(null)} onUpdated={() => { setEditWriter(null); router.refresh(); }} /><CredentialDialog credential={credential} onOpenChange={(open) => !open && setCredential(null)} /><ConfirmDialog open={Boolean(revokeWriter)} onOpenChange={(open) => !open && setRevokeWriter(null)} title="Yazarı askıya al" description="Aktif oturumlar sonlandırılacak ve giriş anahtarı yeniden etkinleştirilene kadar çalışmayacak." confirmLabel="Askıya Al" pending={pending} onConfirm={revoke} danger={false} /><ConfirmDialog open={Boolean(rotateWriter)} onOpenChange={(open) => !open && setRotateWriter(null)} title="Giriş anahtarını yenile" description="Eski QR kodu ve giriş anahtarı hemen geçersiz olacak." confirmLabel="Anahtarı Yenile" pending={pending} onConfirm={rotateKey} danger={false} /><ConfirmDialog open={Boolean(deleteWriter)} onOpenChange={(open) => !open && setDeleteWriter(null)} title="Yazarı sil" description="Yazarın tüm ödevleri ve aktif oturumları kalıcı olarak kaldırılacak." confirmLabel="Yazarı Sil" pending={pending} onConfirm={removeWriter} /></section>;
}

function WriterForm({ writer = null, open, onOpenChange, onCreated, onUpdated }: { writer?: AdminHomeworkWriter | null; open: boolean; onOpenChange: (open: boolean) => void; onCreated?: (credential: Credential) => void; onUpdated?: () => void }) {
  const [pending, startTransition] = useTransition();
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); const kind = String(data.get("kind") || "TEACHER") as HomeworkWriterKindValue; const input = { name: String(data.get("name") || ""), kind, fixedSubject: kind === "TEACHER" ? String(data.get("fixedSubject") || "") as HomeworkSubjectValue : null }; startTransition(async () => { if (writer) { const result = await updateHomeworkWriter(writer.id, input); if (!result.success) { toast.error(result.error); return; } toast.success("Yazar güncellendi."); onUpdated?.(); return; } const result = await createHomeworkWriter(input); if (!result.success) { toast.error(result.error); return; } toast.success("Yazar oluşturuldu."); onCreated?.(result.data); }); }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent title={writer ? "Yazarı düzenle" : "Yeni ödev yazarı"} description="Yazar anahtarı yalnızca oluşturulduktan sonra gösterilir."><form onSubmit={submit} className="space-y-4"><div><label className="label">Yazar adı</label><input className="field" name="name" defaultValue={writer?.name || ""} required minLength={2} maxLength={80} /></div><div><label className="label">Yazar türü</label><select className="field" name="kind" defaultValue={writer?.kind || "TEACHER"}><option value="TEACHER">Öğretmen</option><option value="SMART_BOARD">Akıllı tahta</option></select></div><div><label className="label">Sabit ders</label><select className="field" name="fixedSubject" defaultValue={writer?.fixedSubject || "EDEBIYAT"}><option value="">Akıllı tahta için ders seçilmez</option>{HOMEWORK_SUBJECT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div><Button className="w-full" type="submit" disabled={pending}>Kaydet</Button></form></DialogContent></Dialog>;
}

function CredentialDialog({ credential, onOpenChange }: { credential: Credential | null; onOpenChange: (open: boolean) => void }) {
  return <Dialog open={Boolean(credential)} onOpenChange={onOpenChange}><DialogContent title="Yazar giriş kartı" description="Bu QR kodu ve bağlantıyı şimdi kaydedin. Pencere kapatılınca tekrar gösterilmez.">{credential ? <div className="space-y-4"><div className="flex justify-center rounded-2xl bg-white p-4"><Image src={credential.qrDataUrl} alt="Ödev yazarı giriş QR kodu" width={320} height={320} unoptimized className="size-64" /></div><div><p className="label">Giriş bağlantısı</p><a className="block break-all rounded-xl border border-line bg-paper-deep p-3 text-sm text-bal underline" href={credential.loginUrl}>{credential.loginUrl}</a></div><p className="text-xs leading-5 text-muted">Bağlantı ve QR kodu kapattıktan sonra güvenlik nedeniyle yeniden gösterilemez. Gerekirse anahtarı yenileyin.</p></div> : null}</DialogContent></Dialog>;
}

function HomeworkOversight({ writers, homework }: { writers: AdminHomeworkWriter[]; homework: HomeworkDto[] }) {
  const router = useRouter();
  const [showPast, setShowPast] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<HomeworkDto | null>(null);
  const [deleteItem, setDeleteItem] = useState<HomeworkDto | null>(null);
  const [pending, startTransition] = useTransition();

  const activeHomework = useMemo(
    () => homework.filter((item) => !item.isPast),
    [homework]
  );

  const pastHomework = useMemo(
    () => homework.filter((item) => item.isPast).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [homework]
  );

  const displayedItems = showPast ? pastHomework : activeHomework;

  function togglePast(item: HomeworkDto) {
    startTransition(async () => {
      const nextState = !item.isPast;
      const result = await setHomeworkPast(item.id, nextState);
      if (!result.success) { toast.error(result.error); return; }
      toast.success(nextState ? "Ödev geçmişe taşındı." : "Ödev güncele taşındı.");
      router.refresh();
    });
  }

  function remove() {
    if (!deleteItem) return;
    startTransition(async () => {
      const result = await deleteHomework(deleteItem.id);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Ödev silindi.");
      setDeleteItem(null);
      router.refresh();
    });
  }

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Ödev denetimi</h2>
          <p className="mt-1 text-sm text-muted">Tüm yazarların ödevlerini düzenleyin, geçmişe taşıyın veya yeni ödev ekleyin.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={15} /> Yeni ödev ekle
          </Button>
          <div className="flex rounded-xl border border-line bg-paper-deep p-1 text-xs font-black">
            <button
              type="button"
              onClick={() => setShowPast(false)}
              className={`rounded-lg px-3.5 py-1.5 transition ${!showPast ? "bg-white text-bal shadow-sm" : "text-muted hover:text-ink"}`}
            >
              Güncel ({activeHomework.length})
            </button>
            <button
              type="button"
              onClick={() => setShowPast(true)}
              className={`rounded-lg px-3.5 py-1.5 transition ${showPast ? "bg-white text-bal shadow-sm" : "text-muted hover:text-ink"}`}
            >
              Geçmiş ({pastHomework.length})
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {displayedItems.length ? (
          displayedItems.map((item) => (
            <article key={item.id} className="paper-card flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-bal-soft px-2.5 py-1 text-[10px] font-black uppercase text-bal">
                    {HOMEWORK_SUBJECT_LABELS[item.subject]}
                  </span>
                  <span className="text-xs font-bold text-muted">Teslim: {item.dueText || "belirtilmedi"}</span>
                  {item.isPast ? (
                    <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-bold text-stone-700">Geçmiş</span>
                  ) : null}
                </div>
                <h3 className="mt-2 font-black">{item.title}</h3>
                <p className="mt-1 text-xs text-muted">{item.writer.name}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => togglePast(item)}
                  disabled={pending}
                  className={item.isPast ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100" : ""}
                >
                  {item.isPast ? <CheckSquare size={14} /> : <Square size={14} />}
                  {item.isPast ? "Geçmişte" : "Geçmişe at"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditItem(item)}>
                  <Pencil size={14} /> Düzenle
                </Button>
                <Button variant="danger" size="sm" onClick={() => setDeleteItem(item)}>
                  <Trash2 size={14} /> Sil
                </Button>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">
            {showPast ? "Henüz geçmiş ödev yok." : "Henüz güncel ödev yok."}
          </div>
        )}
      </div>

      <AdminCreateHomeworkDialog writers={writers} open={createOpen} onOpenChange={setCreateOpen} onSaved={() => { setCreateOpen(false); router.refresh(); }} />
      <AdminHomeworkEditDialog writers={writers} item={editItem} onClose={() => setEditItem(null)} onSaved={() => { setEditItem(null); router.refresh(); }} />
      <ConfirmDialog open={Boolean(deleteItem)} onOpenChange={(open) => !open && setDeleteItem(null)} title="Ödevi sil" description="Bu ödev ve bağlı açıklaması kalıcı olarak kaldırılacak." confirmLabel="Ödevi Sil" pending={pending} onConfirm={remove} />
    </section>
  );
}

function AdminCreateHomeworkDialog({ writers, open, onOpenChange, onSaved }: { writers: AdminHomeworkWriter[]; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const [pending, startTransition] = useTransition();
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const writerId = String(data.get("writerId") || "");
    const input = {
      title: String(data.get("title") || ""),
      description: String(data.get("description") || ""),
      subject: String(data.get("subject") || "") as HomeworkSubjectValue,
      dueText: String(data.get("dueText") || ""),
      dueDate: String(data.get("dueDate") || ""),
      isPast: data.get("isPast") === "on",
      writerId,
    };
    startTransition(async () => {
      const result = await createHomework(input);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Ödev oluşturuldu.");
      onOpenChange(false);
      onSaved();
    });
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Yeni ödev ekle" description="Ödevi ve atamak istediğiniz yazarı seçin.">
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label">Başlık</label><input className="field" name="title" required minLength={2} maxLength={120} /></div>
          <div>
            <label className="label">Yazar / Paylaşan</label>
            <select className="field" name="writerId" required>
              {writers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.kind === "TEACHER" ? HOMEWORK_SUBJECT_LABELS[w.fixedSubject!] : "Akıllı Tahta"})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Ders</label>
            <select className="field" name="subject" defaultValue="MATEMATIK">
              {HOMEWORK_SUBJECT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div><label className="label">Teslim <span className="font-normal text-muted">(isteğe bağlı)</span></label><input className="field" name="dueText" placeholder="Örn. ilk derse veya haftaya salı" maxLength={160} /></div>
          <div><label className="label">Sıralama tarihi <span className="font-normal text-muted">(isteğe bağlı)</span></label><input className="field" name="dueDate" type="date" /></div>
          <div><label className="label">Açıklama <span className="font-normal text-muted">(isteğe bağlı)</span></label><textarea className="field min-h-24" name="description" maxLength={2000} /></div>
          <div>
            <label className="inline-flex items-center gap-2 text-sm font-bold text-ink">
              <input type="checkbox" name="isPast" className="size-4 rounded border-line text-bal focus:ring-bal" />
              Geçmiş ödev olarak işaretle
            </label>
          </div>
          <Button type="submit" className="w-full" disabled={pending}>Ödevi Yayınla</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdminHomeworkEditDialog({ writers, item, onClose, onSaved }: { writers: AdminHomeworkWriter[]; item: HomeworkDto | null; onClose: () => void; onSaved: () => void }) {
  const [pending, startTransition] = useTransition();
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item) return;
    const data = new FormData(event.currentTarget);
    const writerId = String(data.get("writerId") || "");
    startTransition(async () => {
      const result = await updateHomework(item.id, {
        title: String(data.get("title") || ""),
        description: String(data.get("description") || ""),
        subject: String(data.get("subject") || "") as HomeworkSubjectValue,
        dueText: String(data.get("dueText") || ""),
        dueDate: String(data.get("dueDate") || ""),
        isPast: data.get("isPast") === "on",
        writerId,
      });
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Ödev güncellendi.");
      onSaved();
    });
  }
  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent title="Ödevi düzenle" description="Ödev bilgilerini ve atanan yazarı güncelleyin.">
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label">Başlık</label><input className="field" name="title" defaultValue={item?.title || ""} required minLength={2} maxLength={120} /></div>
          <div>
            <label className="label">Yazar / Paylaşan</label>
            <select className="field" name="writerId" defaultValue={item?.writer.id} required>
              {writers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.kind === "TEACHER" ? HOMEWORK_SUBJECT_LABELS[w.fixedSubject!] : "Akıllı Tahta"})
                </option>
              ))}
            </select>
          </div>
          <div><label className="label">Ders</label><select className="field" name="subject" defaultValue={item?.subject || "EDEBIYAT"}>{HOMEWORK_SUBJECT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
          <div><label className="label">Teslim <span className="font-normal text-muted">(isteğe bağlı)</span></label><input className="field" name="dueText" defaultValue={item?.dueText || ""} maxLength={160} /></div>
          <div><label className="label">Sıralama tarihi <span className="font-normal text-muted">(isteğe bağlı)</span></label><input className="field" name="dueDate" type="date" defaultValue={item?.dueDate || ""} /></div>
          <div><label className="label">Açıklama <span className="font-normal text-muted">(isteğe bağlı)</span></label><textarea className="field min-h-24" name="description" defaultValue={item?.description || ""} maxLength={2000} /></div>
          <div>
            <label className="inline-flex items-center gap-2 text-sm font-bold text-ink">
              <input type="checkbox" name="isPast" defaultChecked={item?.isPast || false} className="size-4 rounded border-line text-bal focus:ring-bal" />
              Geçmiş ödev olarak işaretle
            </label>
          </div>
          <Button type="submit" className="w-full" disabled={pending}>Kaydet</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
