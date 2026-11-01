-- AlterTable
ALTER TABLE "grievances"
  ADD COLUMN IF NOT EXISTS "detected_language_code" TEXT,
  ADD COLUMN IF NOT EXISTS "translation_error" TEXT,
  ADD COLUMN IF NOT EXISTS "translated_at" TIMESTAMP(3);
