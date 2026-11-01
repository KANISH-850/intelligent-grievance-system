ALTER TABLE "grievances"
  ADD COLUMN "translation_status" TEXT DEFAULT 'unavailable',
  ADD COLUMN "translation_method" TEXT,
  ADD COLUMN "routing_status" TEXT NOT NULL DEFAULT 'ASSIGNED';

ALTER TABLE "grievance_images"
  ADD COLUMN "analysis_status" TEXT DEFAULT 'pending',
  ADD COLUMN "image_description" TEXT,
  ADD COLUMN "detected_issue" TEXT,
  ADD COLUMN "visual_observations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "analysis_confidence" DOUBLE PRECISION,
  ADD COLUMN "human_review_required" BOOLEAN NOT NULL DEFAULT TRUE;
