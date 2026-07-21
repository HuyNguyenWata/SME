/*
  Warnings:

  - You are about to drop the `FacebookAppConfig` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FacebookAppConfig" DROP CONSTRAINT "FacebookAppConfig_user_id_fkey";

-- DropTable
DROP TABLE "FacebookAppConfig";

-- RenameSetting: the global Facebook Login App config now also powers admin
-- Page/Instagram publishing, so its Setting keys are renamed to be generic.
UPDATE "Setting" SET "key" = 'META_APP_ID' WHERE "key" = 'FACEBOOK_LOGIN_APP_ID';
UPDATE "Setting" SET "key" = 'META_APP_SECRET' WHERE "key" = 'FACEBOOK_LOGIN_APP_SECRET';
UPDATE "Setting" SET "key" = 'META_GRAPH_API_VERSION' WHERE "key" = 'FACEBOOK_LOGIN_GRAPH_VERSION';
