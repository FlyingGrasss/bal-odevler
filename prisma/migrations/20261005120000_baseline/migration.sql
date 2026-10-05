-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BANNED');

-- CreateEnum
CREATE TYPE "HomeworkSubject" AS ENUM ('EDEBIYAT', 'MATEMATIK', 'FIZIK', 'KIMYA', 'BIYOLOJI', 'FELSEFE', 'TARIH', 'COGRAFYA', 'DIN_KULTURU');

-- CreateEnum
CREATE TYPE "HomeworkWriterKind" AS ENUM ('TEACHER', 'SMART_BOARD');

-- CreateTable
CREATE TABLE "balnotes_profile_info" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "picture" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "banReason" TEXT,
    "bannedAt" TIMESTAMP(3),
    "bannedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "balnotes_profile_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homework_writers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "HomeworkWriterKind" NOT NULL,
    "fixedSubject" "HomeworkSubject",
    "keyHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homework_writers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homework_writer_sessions" (
    "id" TEXT NOT NULL,
    "writerId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "homework_writer_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homework" (
    "id" TEXT NOT NULL,
    "writerId" TEXT NOT NULL,
    "subject" "HomeworkSubject" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueText" TEXT NOT NULL DEFAULT 'Belirtilmedi',
    "dueDate" DATE,
    "isPast" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homework_login_rate_limits" (
    "bucketKey" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homework_login_rate_limits_pkey" PRIMARY KEY ("bucketKey")
);

-- CreateIndex
CREATE UNIQUE INDEX "balnotes_profile_info_email_key" ON "balnotes_profile_info"("email");
CREATE INDEX "balnotes_profile_info_status_idx" ON "balnotes_profile_info"("status");
CREATE UNIQUE INDEX "homework_writers_keyHash_key" ON "homework_writers"("keyHash");
CREATE INDEX "homework_writers_kind_fixedSubject_idx" ON "homework_writers"("kind", "fixedSubject");
CREATE UNIQUE INDEX "homework_writer_sessions_tokenHash_key" ON "homework_writer_sessions"("tokenHash");
CREATE INDEX "homework_writer_sessions_writerId_expiresAt_idx" ON "homework_writer_sessions"("writerId", "expiresAt");
CREATE INDEX "homework_writer_sessions_expiresAt_idx" ON "homework_writer_sessions"("expiresAt");
CREATE INDEX "homework_isPast_dueDate_subject_idx" ON "homework"("isPast", "dueDate", "subject");
CREATE INDEX "homework_writerId_updatedAt_idx" ON "homework"("writerId", "updatedAt");
CREATE INDEX "homework_login_rate_limits_windowStart_idx" ON "homework_login_rate_limits"("windowStart");

-- AddForeignKey
ALTER TABLE "homework_writer_sessions" ADD CONSTRAINT "homework_writer_sessions_writerId_fkey" FOREIGN KEY ("writerId") REFERENCES "homework_writers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework" ADD CONSTRAINT "homework_writerId_fkey" FOREIGN KEY ("writerId") REFERENCES "homework_writers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "oauth_attempts" (
    "stateHash" TEXT NOT NULL,
    "codeVerifier" TEXT NOT NULL,
    "nextPath" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_attempts_pkey" PRIMARY KEY ("stateHash")
);

-- CreateIndex
CREATE UNIQUE INDEX "oauth_attempts_stateHash_key" ON "oauth_attempts"("stateHash");
CREATE INDEX "oauth_attempts_expiresAt_idx" ON "oauth_attempts"("expiresAt");
