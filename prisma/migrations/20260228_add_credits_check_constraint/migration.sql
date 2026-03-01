-- Add CHECK constraint to prevent negative credits at the database level.
-- Application logic already prevents this, but this is a safety net.
ALTER TABLE "users" ADD CONSTRAINT "credits_non_negative" CHECK ("credits" >= 0);
