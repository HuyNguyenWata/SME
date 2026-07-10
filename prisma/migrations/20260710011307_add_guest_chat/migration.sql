-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_user_id_fkey";

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "guest_id" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Conversation_guest_id_idx" ON "Conversation"("guest_id");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
