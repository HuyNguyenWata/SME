/*
  Warnings:

  - You are about to drop the column `fetch_size` on the `NewsAPIConfig` table. All the data in the column will be lost.
  - You are about to drop the column `loop_count` on the `NewsAPIConfig` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "NewsAPIConfig" DROP CONSTRAINT "NewsAPIConfig_category_id_fkey";

-- AlterTable
ALTER TABLE "NewsAPIConfig" DROP COLUMN "fetch_size",
DROP COLUMN "loop_count",
ADD COLUMN     "loop_hour" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "NewsCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "NewsCategory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NewsAPIConfig" ADD CONSTRAINT "NewsAPIConfig_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "NewsCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
