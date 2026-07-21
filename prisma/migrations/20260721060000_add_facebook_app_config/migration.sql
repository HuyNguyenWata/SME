-- CreateTable
CREATE TABLE "FacebookAppConfig" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "app_id" TEXT NOT NULL,
    "app_secret" TEXT NOT NULL,
    "graph_api_version" TEXT NOT NULL DEFAULT 'v23.0',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacebookAppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FacebookAppConfig_user_id_key" ON "FacebookAppConfig"("user_id");

-- AddForeignKey
ALTER TABLE "FacebookAppConfig" ADD CONSTRAINT "FacebookAppConfig_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
