-- AlterTable: Add address and notes fields, set default for default_payment_terms
ALTER TABLE "clients" ADD COLUMN "address" TEXT;
ALTER TABLE "clients" ADD COLUMN "notes" TEXT;

-- Backfill existing NULL payment terms to 30 before adding NOT NULL constraint
UPDATE "clients" SET "default_payment_terms" = 30 WHERE "default_payment_terms" IS NULL;
ALTER TABLE "clients" ALTER COLUMN "default_payment_terms" SET DEFAULT 30;
ALTER TABLE "clients" ALTER COLUMN "default_payment_terms" SET NOT NULL;
