export function dateOnlyToDate(value: string) {
  if (!value) return null;
  return new Date(`${value}T00:00:00+03:00`);
}

export function formatHomeworkDate(value: Date | string) {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export type HomeworkDateStatus = "overdue" | "today" | "upcoming";

export function getHomeworkDateStatus(value: Date | string | null, isPast = false, now = new Date()): HomeworkDateStatus | null {
  if (isPast) return "overdue";
  if (!value) return null;
  const dueDate = typeof value === "string" ? value : new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(value);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(now);
  if (dueDate < today) return "overdue";
  if (dueDate === today) return "today";
  return "upcoming";
}
