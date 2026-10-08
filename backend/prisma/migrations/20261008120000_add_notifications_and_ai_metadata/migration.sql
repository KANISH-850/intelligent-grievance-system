-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('GRIEVANCE_SUBMITTED', 'GRIEVANCE_ASSIGNED', 'STATUS_CHANGED', 'HIGH_PRIORITY', 'CRITICAL_PRIORITY', 'GRIEVANCE_RESOLVED', 'GRIEVANCE_REJECTED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "department_id" TEXT;

-- AlterTable
ALTER TABLE "grievances" ADD COLUMN "ai_confidence" DOUBLE PRECISION,
ADD COLUMN "ai_confidence_level" TEXT,
ADD COLUMN "ai_review_required" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "ai_classification_method" TEXT,
ADD COLUMN "ai_explanation_terms" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "ai_original_category" TEXT,
ADD COLUMN "is_human_corrected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "human_corrected_by" TEXT,
ADD COLUMN "human_corrected_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "grievance_id" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "grievances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
