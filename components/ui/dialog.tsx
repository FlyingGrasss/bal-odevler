"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ className, children, title, description, ...props }: ComponentProps<typeof DialogPrimitive.Content> & { title: string; description?: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm" />
      <DialogPrimitive.Content
        className={cn("dialog-content fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[min(92vw,36rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-white/30 bg-card p-6 shadow-2xl", className)}
        {...props}
      >
        <div className="pr-9">
          <DialogPrimitive.Title className="text-xl font-black tracking-tight text-ink">{title}</DialogPrimitive.Title>
          {description ? <DialogPrimitive.Description className="mt-1 text-sm leading-6 text-muted">{description}</DialogPrimitive.Description> : null}
        </div>
        <DialogPrimitive.Close className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-muted hover:bg-black/5 hover:text-ink" aria-label="Kapat">
          <X size={18} />
        </DialogPrimitive.Close>
        <div className="mt-5">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, pending, danger = true, onConfirm, children }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pending?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  children?: ReactNode;
}) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm" />
        <AlertDialogPrimitive.Content className="dialog-content fixed left-1/2 top-1/2 z-50 w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/30 bg-card p-6 shadow-2xl">
          <AlertDialogPrimitive.Title className="text-xl font-black text-ink">{title}</AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="mt-2 text-sm leading-6 text-muted">{description}</AlertDialogPrimitive.Description>
          {children ? <div className="mt-4">{children}</div> : null}
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialogPrimitive.Cancel className="h-11 rounded-xl border border-line bg-white px-4 text-sm font-bold text-ink hover:bg-black/5">Vazgeç</AlertDialogPrimitive.Cancel>
            <button disabled={pending} onClick={onConfirm} className={cn("h-11 rounded-xl px-4 text-sm font-bold text-white disabled:opacity-50", danger ? "bg-red-700 hover:bg-red-800" : "bg-bal hover:bg-bal-bright")}>
              {pending ? "İşleniyor…" : confirmLabel}
            </button>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
