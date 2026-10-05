import { BookDashed } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="paper-card p-8 text-center"><BookDashed className="mx-auto text-bal/50" size={36} /><h3 className="mt-4 text-lg font-black">{title}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{description}</p></div>;
}
