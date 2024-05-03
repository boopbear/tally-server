/*
  Warnings:

  - You are about to drop the column `itemCategoryId` on the `inventoryassetlogs` table. All the data in the column will be lost.
  - You are about to drop the column `itemStatusId` on the `inventoryassetlogs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `inventoryassetlogs` DROP FOREIGN KEY `inventoryassetlogs_itemCategoryId_fkey`;

-- DropForeignKey
ALTER TABLE `inventoryassetlogs` DROP FOREIGN KEY `inventoryassetlogs_itemStatusId_fkey`;

-- AlterTable
ALTER TABLE `inventoryassetlogs` DROP COLUMN `itemCategoryId`,
    DROP COLUMN `itemStatusId`,
    ADD COLUMN `assetStatusId` INTEGER NULL,
    ADD COLUMN `inventoryCategoryId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `inventoryassetlogs` ADD CONSTRAINT `inventoryassetlogs_inventoryCategoryId_fkey` FOREIGN KEY (`inventoryCategoryId`) REFERENCES `inventorycategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryassetlogs` ADD CONSTRAINT `inventoryassetlogs_assetStatusId_fkey` FOREIGN KEY (`assetStatusId`) REFERENCES `inventoryassetstatus`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
