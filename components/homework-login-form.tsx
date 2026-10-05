"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { loginHomeworkWriter } from "@/actions/homework";
import { Button } from "@/components/ui/button";

export function HomeworkLoginForm({ initialKey = "" }: { initialKey?: string }) {
  const router = useRouter();
  const [key, setKey] = useState(initialKey);
  const [pending, startTransition] = useTransition();
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); startTransition(async () => { const result = await loginHomeworkWriter(key); if (!result.success) { toast.error(result.error); return; } toast.success("Giriş yapıldı."); router.push("/panel"); router.refresh(); }); }
  return <form onSubmit={submit} className="paper-card mx-auto max-w-xl space-y-5 p-6 sm:p-8"><div><label className="label">Giriş anahtarı</label><input className="field" type="password" value={key} onChange={(event) => setKey(event.target.value)} placeholder="Size verilen anahtar" autoComplete="off" required /></div><Button type="submit" className="w-full" disabled={pending}>Giriş yap</Button></form>;
}
