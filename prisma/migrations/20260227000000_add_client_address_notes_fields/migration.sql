-- AlterTable: Add address and notes fields, set default for default_payment_terms
ALTER TABLE "clients" ADD COLUMN "address" TEXT;
ALTER TABLE "clients" ADD COLUMN "notes" TEXT;
ALTER TABLE "clients" ALTER COLUMN "default_payment_terms" SET NOT NULL;
ALTER TABLE "clients" ALTER COLUMN "default_payment_terms" SET DEFAULT 30;
