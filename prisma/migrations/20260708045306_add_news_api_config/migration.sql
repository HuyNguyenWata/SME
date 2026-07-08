-- CreateTable
CREATE TABLE "NewsAPIConfig" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "keyword" TEXT,
    "category_id" INTEGER,
    "language" TEXT NOT NULL DEFAULT 'en',
    "fetch_size" INTEGER NOT NULL DEFAULT 10,
    "target_post_count" INTEGER NOT NULL DEFAULT 10,
    "loop_count" INTEGER NOT NULL DEFAULT 1,
    "image_requirement" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsAPIConfig_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NewsAPIConfig" ADD CONSTRAINT "NewsAPIConfig_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsAPIConfig" ADD CONSTRAINT "NewsAPIConfig_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
