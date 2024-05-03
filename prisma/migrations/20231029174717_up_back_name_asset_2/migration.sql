/*
  Warnings:

  - You are about to drop the column `inventoryAssettId` on the `inventoryassetlogs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `inventoryassetlogs` DROP FOREIGN KEY `inventoryassetLogs_inventoryAssettId_fkey`;

-- AlterTable
ALTER TABLE `inventoryassetlogs` DROP COLUMN `inventoryAssettId`,
    ADD COLUMN `inventoryAssetId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `inventoryassetlogs` ADD CONSTRAINT `inventoryassetlogs_inventoryAssetId_fkey` FOREIGN KEY (`inventoryAssetId`) REFERENCES `inventoryasset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
