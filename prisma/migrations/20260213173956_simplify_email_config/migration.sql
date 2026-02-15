/*
  Warnings:

  - You are about to drop the column `fromEmail` on the `EmailConfig` table. All the data in the column will be lost.
  - You are about to drop the column `fromName` on the `EmailConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmailConfig" DROP COLUMN "fromEmail",
DROP COLUMN "fromName";
