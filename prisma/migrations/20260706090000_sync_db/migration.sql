-- AlterTable
ALTER TABLE "GeneratedContent" DROP COLUMN "content",
DROP COLUMN "status",
DROP COLUMN "user_id",
ADD COLUMN     "facebook_post" TEXT,
ADD COLUMN     "hashtags" JSONB,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "relevant" BOOLEAN,
ADD COLUMN     "seo_keywords" JSONB,
ADD COLUMN     "source_article_id" BIGINT,
ADD COLUMN     "website_article" TEXT;

-- CreateTable
CREATE TABLE "SourceArticle" (
    "id" BIGSERIAL NOT NULL,
    "external_id" TEXT,
    "title" TEXT,
    "description" TEXT,
    "url" TEXT,
    "source_name" TEXT,
    "language" TEXT,
    "raw_data" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceArticle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SourceArticle_external_id_key" ON "SourceArticle"("external_id");

-- AddForeignKey
ALTER TABLE "GeneratedContent" ADD CONSTRAINT "GeneratedContent_source_article_id_fkey" FOREIGN KEY ("source_article_id") REFERENCES "SourceArticle"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
