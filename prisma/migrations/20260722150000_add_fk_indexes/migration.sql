-- Add missing indexes on foreign-key columns to avoid full table scans as data grows.
-- Postgres does not auto-index FK columns, so these must be created explicitly.

CREATE INDEX IF NOT EXISTS "User_category_id_idx" ON "User"("category_id");
CREATE INDEX IF NOT EXISTS "Customer_store_id_idx" ON "Customer"("store_id");
CREATE INDEX IF NOT EXISTS "Product_user_id_idx" ON "Product"("user_id");
CREATE INDEX IF NOT EXISTS "ProductImage_product_id_idx" ON "ProductImage"("product_id");
CREATE INDEX IF NOT EXISTS "ProductComment_product_id_idx" ON "ProductComment"("product_id");
CREATE INDEX IF NOT EXISTS "Chat_conversation_id_idx" ON "Chat"("conversation_id");
CREATE INDEX IF NOT EXISTS "RSSSource_category_id_idx" ON "RSSSource"("category_id");
CREATE INDEX IF NOT EXISTS "GeneratedContent_user_id_idx" ON "GeneratedContent"("user_id");
CREATE INDEX IF NOT EXISTS "GeneratedContent_source_article_id_idx" ON "GeneratedContent"("source_article_id");
CREATE INDEX IF NOT EXISTS "SocialAccount_user_id_idx" ON "SocialAccount"("user_id");
CREATE INDEX IF NOT EXISTS "SocialAccount_platform_id_idx" ON "SocialAccount"("platform_id");
CREATE INDEX IF NOT EXISTS "SocialPost_generated_content_id_idx" ON "SocialPost"("generated_content_id");
CREATE INDEX IF NOT EXISTS "SocialPost_platform_id_idx" ON "SocialPost"("platform_id");
CREATE INDEX IF NOT EXISTS "SocialPost_account_id_idx" ON "SocialPost"("account_id");
CREATE INDEX IF NOT EXISTS "SocialPost_product_id_idx" ON "SocialPost"("product_id");
CREATE INDEX IF NOT EXISTS "SocialPost_social_calendar_id_idx" ON "SocialPost"("social_calendar_id");
CREATE INDEX IF NOT EXISTS "SocialComment_social_post_id_idx" ON "SocialComment"("social_post_id");
CREATE INDEX IF NOT EXISTS "InventoryHistory_product_id_idx" ON "InventoryHistory"("product_id");
CREATE INDEX IF NOT EXISTS "MarketingProduct_product_id_idx" ON "MarketingProduct"("product_id");
CREATE INDEX IF NOT EXISTS "SocialCalendar_product_id_idx" ON "SocialCalendar"("product_id");
CREATE INDEX IF NOT EXISTS "SocialCalendar_campaign_id_idx" ON "SocialCalendar"("campaign_id");
CREATE INDEX IF NOT EXISTS "SocialCalendar_platform_id_idx" ON "SocialCalendar"("platform_id");
CREATE INDEX IF NOT EXISTS "SocialCalendar_generated_content_id_idx" ON "SocialCalendar"("generated_content_id");
CREATE INDEX IF NOT EXISTS "NewsAPIConfig_user_id_idx" ON "NewsAPIConfig"("user_id");
CREATE INDEX IF NOT EXISTS "NewsAPIConfig_category_id_idx" ON "NewsAPIConfig"("category_id");
