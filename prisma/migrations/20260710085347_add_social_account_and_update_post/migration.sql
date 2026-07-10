-- AlterTable
ALTER TABLE "SocialPost" ADD COLUMN     "account_id" INTEGER,
ADD COLUMN     "last_sync_at" TIMESTAMP(3),
ADD COLUMN     "permalink" TEXT,
ADD COLUMN     "raw_response" JSONB;

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "platform_id" INTEGER NOT NULL,
    "account_name" TEXT,
    "account_id" TEXT NOT NULL,
    "page_id" TEXT,
    "instagram_id" TEXT,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "app_id" TEXT,
    "app_secret" TEXT,
    "webhook_secret" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "SocialPlatform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "SocialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
