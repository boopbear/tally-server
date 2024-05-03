/*
  Warnings:

  - You are about to drop the column `assetCode` on the `inventoryassetlogs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `assetrequests` ADD COLUMN `assetCodeBackup` TEXT NULL,
    ADD COLUMN `eventTitle` TEXT NULL;

-- AlterTable
ALTER TABLE `inventoryassetlogs` DROP COLUMN `assetCode`,
    ADD COLUMN `assetCodeBackup` TEXT NULL;
