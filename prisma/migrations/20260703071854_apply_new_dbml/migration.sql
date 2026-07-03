/*
  Warnings:

  - You are about to drop the column `source_doc_id` on the `GeneratedContent` table. All the data in the column will be lost.
  - You are about to drop the column `platform` on the `SocialPost` table. All the data in the column will be lost.
  - You are about to drop the `CrawlDoc` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RawDoc` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `platform_id` to the `SocialPost` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CrawlDoc" DROP CONSTRAINT "CrawlDoc_raw_doc_id_fkey";

-- DropForeignKey
ALTER TABLE "GeneratedContent" DROP CONSTRAINT "GeneratedContent_source_doc_id_fkey";

-- DropForeignKey
ALTER TABLE "RawDoc" DROP CONSTRAINT "RawDoc_user_id_fkey";

-- AlterTable
ALTER TABLE "GeneratedContent" DROP COLUMN "source_doc_id";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "embedding_status" TEXT,
ADD COLUMN     "embedding_updated_at" TIMESTAMP(3),
ADD COLUMN     "specifications" JSONB;

-- AlterTable
ALTER TABLE "PromptTemplate" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "SocialPost" DROP COLUMN "platform",
ADD COLUMN     "platform_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "CrawlDoc";

-- DropTable
DROP TABLE "RawDoc";

-- CreateTable
CREATE TABLE "SocialPlatform" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIJob" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "target_id" INTEGER,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "AIJob_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "SocialPlatform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
