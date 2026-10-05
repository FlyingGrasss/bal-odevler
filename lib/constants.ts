import type { HomeworkSubject } from "@prisma/client";

export const HOMEWORK_SUBJECT_OPTIONS: Array<{ value: HomeworkSubject; label: string }> = [
  { value: "EDEBIYAT", label: "Edebiyat" },
  { value: "MATEMATIK", label: "Matematik" },
  { value: "FIZIK", label: "Fizik" },
  { value: "KIMYA", label: "Kimya" },
  { value: "BIYOLOJI", label: "Biyoloji" },
  { value: "FELSEFE", label: "Felsefe" },
  { value: "TARIH", label: "Tarih" },
  { value: "COGRAFYA", label: "Coğrafya" },
  { value: "DIN_KULTURU", label: "Din Kültürü" },
];

export const HOMEWORK_SUBJECT_LABELS = Object.fromEntries(
  HOMEWORK_SUBJECT_OPTIONS.map((subject) => [subject.value, subject.label]),
) as Record<HomeworkSubject, string>;

export const HOMEWORK_WRITER_COOKIE = "bal_homework_writer";
export const HOMEWORK_WRITER_SESSION_DAYS = 30;
export const HOMEWORK_LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const HOMEWORK_LOGIN_MAX_ATTEMPTS = 10;

export const HOMEWORK_COMPLETED_STORAGE_KEY = "bal-odevler-tamamlanan";
export const OAUTH_STATE_COOKIE = "bal_odevler-oauth-state";
