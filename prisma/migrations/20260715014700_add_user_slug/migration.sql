-- AlterTable: Add slug column to User (nullable first for existing data)
ALTER TABLE "User" ADD COLUMN "slug" TEXT;

-- Backfill existing users with slugified name
UPDATE "User" SET "slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE("name", '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE "slug" IS NULL;

-- Handle potential duplicates by appending id
UPDATE "User" u1
SET "slug" = u1."slug" || '-' || u1."id"
WHERE EXISTS (
  SELECT 1 FROM "User" u2
  WHERE u2."slug" = u1."slug" AND u2."id" < u1."id"
);

-- Make slug NOT NULL and UNIQUE
ALTER TABLE "User" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_slug_key" ON "User"("slug");
