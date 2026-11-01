-- Safe migration: Multi-department assignment fields and assignment-specific history
-- 1. Extend Status enum with PARTIALLY_RESOLVED
ALTER TYPE "Status" ADD VALUE IF NOT EXISTS 'PARTIALLY_RESOLVED' AFTER 'IN_PROGRESS';

-- 2. Add columns to grievance_department_assignments
ALTER TABLE "grievance_department_assignments"
  ADD COLUMN IF NOT EXISTS "remarks" TEXT,
  ADD COLUMN IF NOT EXISTS "resolution_description" TEXT,
  ADD COLUMN IF NOT EXISTS "started_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "resolved_at" TIMESTAMP(3);

-- 3. Create grievance_assignment_history table
CREATE TABLE IF NOT EXISTS "grievance_assignment_history" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "grievance_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "previous_status" "Status",
    "status" "Status" NOT NULL,
    "remarks" TEXT,
    "changed_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grievance_assignment_history_pkey" PRIMARY KEY ("id")
);

-- Indices
CREATE INDEX IF NOT EXISTS "grievance_assignment_history_assignment_id_idx" ON "grievance_assignment_history"("assignment_id");
CREATE INDEX IF NOT EXISTS "grievance_assignment_history_grievance_id_idx" ON "grievance_assignment_history"("grievance_id");
CREATE INDEX IF NOT EXISTS "grievance_assignment_history_department_id_idx" ON "grievance_assignment_history"("department_id");

-- Foreign Keys with safe idempotent DO blocks
DO $$ BEGIN
  ALTER TABLE "grievance_assignment_history" ADD CONSTRAINT "grievance_assignment_history_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "grievance_department_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "grievance_assignment_history" ADD CONSTRAINT "grievance_assignment_history_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "grievances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "grievance_assignment_history" ADD CONSTRAINT "grievance_assignment_history_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "grievance_assignment_history" ADD CONSTRAINT "grievance_assignment_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
