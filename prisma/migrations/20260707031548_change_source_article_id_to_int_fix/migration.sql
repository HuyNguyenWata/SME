-- DropForeignKey
ALTER TABLE "GeneratedContent" DROP CONSTRAINT IF EXISTS "GeneratedContent_source_article_id_fkey";

-- AlterTable
ALTER TABLE "GeneratedContent" ALTER COLUMN "source_article_id" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "SourceArticle" DROP CONSTRAINT "SourceArticle_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "SourceArticle_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "GeneratedContent" ADD CONSTRAINT "GeneratedContent_source_article_id_fkey" FOREIGN KEY ("source_article_id") REFERENCES "SourceArticle"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
