-- AlterTable
ALTER TABLE "SocialPost" ADD COLUMN     "product_id" INTEGER,
ADD COLUMN     "social_calendar_id" INTEGER;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_social_calendar_id_fkey" FOREIGN KEY ("social_calendar_id") REFERENCES "SocialCalendar"("id") ON DELETE SET NULL ON UPDATE CASCADE;
