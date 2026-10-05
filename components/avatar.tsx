import Image from "next/image";
import { cn, initials } from "@/lib/utils";

export function Avatar({ name, picture, className }: { name: string; picture?: string | null; className?: string }) {
  if (picture) {
    return <Image src={picture} alt="" width={48} height={48} unoptimized className={cn("size-10 rounded-full border border-bal/15 object-cover", className)} />;
  }
  return <span aria-hidden className={cn("grid size-10 place-items-center rounded-full bg-bal-soft text-xs font-black text-bal", className)}>{initials(name)}</span>;
}
