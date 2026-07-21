-- AlterTable
ALTER TABLE "SocialComment" ADD COLUMN     "external_id" TEXT;

-- AlterTable
ALTER TABLE "SocialPost" ADD COLUMN     "comments_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "likes_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shares_count" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "SocialComment_external_id_key" ON "SocialComment"("external_id");
