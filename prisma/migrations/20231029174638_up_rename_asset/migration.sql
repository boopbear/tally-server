/*
  Warnings:

  - You are about to drop the column `inventoryAssetId` on the `inventoryassetlogs` table. All the data in the column will be lost.
  - You are about to drop the column `responsibleUserId` on the `inventoryassetlogs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `inventoryassetlogs` DROP FOREIGN KEY `inventoryassetlogs_inventoryAssetId_fkey`;

-- DropForeignKey
ALTER TABLE `inventoryassetlogs` DROP FOREIGN KEY `inventoryassetlogs_responsibleUserId_fkey`;

-- AlterTable
ALTER TABLE `inventoryassetlogs` DROP COLUMN `inventoryAssetId`,
    DROP COLUMN `responsibleUserId`,
    ADD COLUMN `inventoryAssettId` INTEGER NULL,
    ADD COLUMN `responsibleId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `inventoryassetlogs` ADD CONSTRAINT `inventoryassetlogs_responsibleId_fkey` FOREIGN KEY (`responsibleId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryassetlogs` ADD CONSTRAINT `inventoryassetlogs_inventoryAssettId_fkey` FOREIGN KEY (`inventoryAssettId`) REFERENCES `inventoryasset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
