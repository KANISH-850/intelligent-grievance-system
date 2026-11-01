-- CreateTable
CREATE TABLE "grievance_images" (
    "id" TEXT NOT NULL,
    "grievance_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grievance_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "grievance_images" ADD CONSTRAINT "grievance_images_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "grievances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
