-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN     "ai_generated" BOOLEAN DEFAULT false,
ADD COLUMN     "alt_text" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "GeneratedContent" ADD COLUMN     "instagram_post" TEXT;

-- AlterTable
ALTER TABLE "SourceArticle" ADD COLUMN     "author" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "content" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "creator" TEXT[],
ADD COLUMN     "datatype" TEXT,
ADD COLUMN     "duplicate" BOOLEAN,
ADD COLUMN     "fetched_at" TIMESTAMPTZ(6),
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "keywords" TEXT[],
ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "source_icon" TEXT,
ADD COLUMN     "source_id" TEXT,
ADD COLUMN     "source_priority" INTEGER,
ADD COLUMN     "source_url" TEXT,
ADD COLUMN     "video_url" TEXT;

-- AlterTable
ALTER TABLE "PromptTemplate" ADD COLUMN     "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "temperature" DECIMAL(3,2),
ADD COLUMN     "top_p" DECIMAL(3,2),
ADD COLUMN     "updated_at" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER DEFAULT 1;

-- AlterTable
ALTER TABLE "AIJob" ADD COLUMN     "cost" DECIMAL(10,6),
ADD COLUMN     "duration_ms" INTEGER,
ADD COLUMN     "input_tokens" INTEGER,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "node_name" TEXT,
ADD COLUMN     "output_tokens" INTEGER,
ADD COLUMN     "request" JSONB,
ADD COLUMN     "response" JSONB,
ADD COLUMN     "retry" INTEGER DEFAULT 0,
ADD COLUMN     "workflow_name" TEXT;

-- AlterTable
ALTER TABLE "MarketingProduct" ADD COLUMN     "brand_voice" TEXT,
ADD COLUMN     "forbidden_words" JSONB,
ADD COLUMN     "marketing_goal" TEXT,
ADD COLUMN     "pain_points" JSONB,
ADD COLUMN     "seasonal_keywords" JSONB,
ADD COLUMN     "tone_of_voice" TEXT;

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "budget" DECIMAL(12,2),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "objective" TEXT;

-- AlterTable
ALTER TABLE "SocialCalendar" ADD COLUMN     "failed_reason" TEXT,
ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "retry_count" INTEGER DEFAULT 0,
ADD COLUMN     "timezone" TEXT;

-- CreateIndex
CREATE INDEX "idx_generatedcontent_created" ON "GeneratedContent"("created_at");

-- CreateIndex
CREATE INDEX "idx_socialpost_postid" ON "SocialPost"("post_id");

