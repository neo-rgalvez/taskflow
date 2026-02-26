-- Add missing fields from implementation plan

-- User.last_login_at (APPLICATION-PLAN.md §2.2)
ALTER TABLE "users" ADD COLUMN "last_login_at" TIMESTAMP(3);

-- Project.portal_token (APPLICATION-PLAN.md §2.2, IMPLEMENTATION-PLAN.md)
ALTER TABLE "projects" ADD COLUMN "portal_token" TEXT;
CREATE UNIQUE INDEX "projects_portal_token_key" ON "projects"("portal_token");

-- CHECK constraints from DATA-MODEL-AUDIT

-- Audit fix #13: Prevent orphaned file attachments (must have project or task parent)
ALTER TABLE "file_attachments"
  ADD CONSTRAINT "file_attachments_parent_check"
  CHECK ("project_id" IS NOT NULL OR "task_id" IS NOT NULL);

-- Audit fix #17: Budget alert threshold must be 0.00–1.00
ALTER TABLE "projects"
  ADD CONSTRAINT "projects_budget_alert_threshold_check"
  CHECK ("budget_alert_threshold" >= 0.00 AND "budget_alert_threshold" <= 1.00);
