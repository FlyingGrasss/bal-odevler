export type HomeworkSubjectValue = "EDEBIYAT" | "MATEMATIK" | "FIZIK" | "KIMYA" | "BIYOLOJI" | "FELSEFE" | "TARIH" | "COGRAFYA" | "DIN_KULTURU";
export type HomeworkWriterKindValue = "TEACHER" | "SMART_BOARD";

export type HomeworkDto = {
  id: string;
  title: string;
  description: string | null;
  subject: HomeworkSubjectValue;
  dueText: string;
  dueDate: string | null;
  isPast: boolean;
  writer: { id: string; name: string; kind: HomeworkWriterKindValue };
  updatedAt: string;
};

export type HomeworkWriterView = {
  id: string;
  name: string;
  kind: HomeworkWriterKindValue;
  fixedSubject: HomeworkSubjectValue | null;
  isActive: boolean;
  lastLoginAt: string | null;
};
