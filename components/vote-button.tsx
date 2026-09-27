"use client";

import { useState, useTransition } from "react";
import { ArrowBigUp } from "lucide-react";
import { toast } from "sonner";
import { toggleVote } from "@/actions/notes";
import { cn } from "@/lib/utils";

export function VoteButton({ noteId, initialCount, initialVoted = false, compact = false }: { noteId: string; initialCount: number; initialVoted?: boolean; compact?: boolean }) {
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState(initialVoted);
  const [pending, startTransition] = useTransition();

  function vote(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    startTransition(async () => {
      const result = await toggleVote(noteId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setVoted(result.data.voted);
      setCount(result.data.count);
    });
  }

  return (
    <button
      type="button"
      onClick={vote}
      disabled={pending}
      aria-label={voted ? "Oyu geri al" : "Nota oy ver"}
      aria-pressed={voted}
      className={cn(
        "group flex h-fit shrink-0 self-start items-center justify-center gap-1 rounded-xl border font-black",
        compact ? "h-10 min-w-12 flex-row px-2 text-xs" : "w-12 flex-col py-2 text-sm",
        voted ? "border-bal bg-bal text-white" : "border-bal/15 bg-bal-soft/60 text-bal hover:border-bal/35 hover:bg-bal-soft",
        pending && "opacity-60",
      )}
    >
      <ArrowBigUp size={compact ? 17 : 20} fill={voted ? "currentColor" : "none"} className="transition-transform group-hover:-translate-y-0.5" />
      <span>{count}</span>
    </button>
  );
}
