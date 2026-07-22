-- AlterTable
ALTER TABLE "SocialComment" ADD COLUMN     "hidden_at" TIMESTAMP(3),
ADD COLUMN     "is_hidden" BOOLEAN NOT NULL DEFAULT false;
