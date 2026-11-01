-- CreateTable
CREATE TABLE "grievance_department_assignments" (
    "id" TEXT NOT NULL,
    "grievance_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ASSIGNED',
    "routing_reason" TEXT,
    "assigned_officer_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grievance_department_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "grievance_department_assignments_grievance_id_department_id_key" ON "grievance_department_assignments"("grievance_id", "department_id");

-- CreateIndex
CREATE INDEX "grievance_department_assignments_department_id_idx" ON "grievance_department_assignments"("department_id");

-- CreateIndex
CREATE INDEX "grievance_department_assignments_grievance_id_idx" ON "grievance_department_assignments"("grievance_id");

-- AddForeignKey
ALTER TABLE "grievance_department_assignments" ADD CONSTRAINT "grievance_department_assignments_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "grievances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grievance_department_assignments" ADD CONSTRAINT "grievance_department_assignments_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grievance_department_assignments" ADD CONSTRAINT "grievance_department_assignments_assigned_officer_id_fkey" FOREIGN KEY ("assigned_officer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill existing grievances into assignments table if not already present
INSERT INTO "grievance_department_assignments" ("id", "grievance_id", "department_id", "status", "routing_reason", "created_at", "updated_at")
SELECT
    gen_random_uuid()::text,
    g.id,
    g.department_id,
    g.status,
    'Primary department assignment backfilled from grievance creation',
    g.created_at,
    g.updated_at
FROM "grievances" g
ON CONFLICT ("grievance_id", "department_id") DO NOTHING;
