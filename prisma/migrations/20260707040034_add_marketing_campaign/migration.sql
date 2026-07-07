-- CreateTable
CREATE TABLE "MarketingProduct" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "selling_points" JSONB,
    "target_customer" TEXT,
    "promotion_text" TEXT,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "last_posted_at" TIMESTAMP(3),
    "post_frequency_days" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialCalendar" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER,
    "campaign_id" INTEGER,
    "platform_id" INTEGER NOT NULL,
    "publish_at" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "generated_content_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialCalendar_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MarketingProduct" ADD CONSTRAINT "MarketingProduct_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialCalendar" ADD CONSTRAINT "SocialCalendar_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialCalendar" ADD CONSTRAINT "SocialCalendar_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialCalendar" ADD CONSTRAINT "SocialCalendar_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "SocialPlatform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialCalendar" ADD CONSTRAINT "SocialCalendar_generated_content_id_fkey" FOREIGN KEY ("generated_content_id") REFERENCES "GeneratedContent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

