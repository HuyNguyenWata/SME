-- Temporary: Ensure that there is a store 4 (or something) to associate these customers, 
-- but since store_id is also a FK to User, we just use the user_id itself as store_id 
-- assuming the user exists in User table.
INSERT INTO "Customer" ("id", "store_id", "email", "password", "name", "is_active", "created_at", "updated_at")
SELECT DISTINCT c."user_id", 4, 'migrated_' || c."user_id" || '@example.com', 'migrated', 'Migrated Shopper ' || c."user_id", true, NOW(), NOW()
FROM "Conversation" c
WHERE c."user_id" IS NOT NULL
ON CONFLICT ("id") DO NOTHING;

-- Copy data from user_id to customer_id
UPDATE "Conversation" SET "customer_id" = "user_id" WHERE "user_id" IS NOT NULL;

-- Drop old foreign key
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_user_id_fkey";

-- Rename column and index
ALTER TABLE "Conversation" RENAME COLUMN "user_id" TO "store_id";
ALTER INDEX "Conversation_user_id_idx" RENAME TO "Conversation_store_id_idx";

-- Clear the store_id column because old data was actually shopper IDs, not store IDs
-- (If you want to preserve them as store IDs, remove this line)
UPDATE "Conversation" SET "store_id" = NULL;

-- Add new foreign key for store_id
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
