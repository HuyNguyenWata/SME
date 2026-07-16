-- AlterTable
ALTER TABLE "NewsAPIConfig" ADD COLUMN     "last_run_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "idx_newsapiconfig_active_lastrun" ON "NewsAPIConfig"("is_active", "last_run_at");
