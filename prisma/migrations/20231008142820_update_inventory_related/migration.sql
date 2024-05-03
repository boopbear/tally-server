/*
  Warnings:

  - You are about to drop the column `department` on the `inventoryasset` table. All the data in the column will be lost.
  - You are about to drop the column `itemCategoryId` on the `inventoryasset` table. All the data in the column will be lost.
  - You are about to drop the column `itemStatusId` on the `inventoryasset` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `inventoryasset` table. All the data in the column will be lost.
  - You are about to drop the column `purchaseOrderNo` on the `inventoryasset` table. All the data in the column will be lost.
  - Added the required column `departmentId` to the `InventoryAsset` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `inventoryasset` DROP FOREIGN KEY `inventoryasset_itemCategoryId_fkey`;

-- DropForeignKey
ALTER TABLE `inventoryasset` DROP FOREIGN KEY `inventoryasset_itemStatusId_fkey`;

-- AlterTable
ALTER TABLE `inventoryasset` DROP COLUMN `department`,
    DROP COLUMN `itemCategoryId`,
    DROP COLUMN `itemStatusId`,
    DROP COLUMN `location`,
    DROP COLUMN `purchaseOrderNo`,
    ADD COLUMN `assetStatusId` INTEGER NULL,
    ADD COLUMN `dateReceived` DATETIME(3) NULL,
    ADD COLUMN `departmentId` INTEGER NOT NULL,
    ADD COLUMN `inventoryCategoryId` INTEGER NULL,
    ADD COLUMN `poNumber` VARCHAR(191) NULL,
    ADD COLUMN `qrKey` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `inventoryassetstatus` ADD COLUMN `inventoryCategoryId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `inventoryasset` ADD CONSTRAINT `inventoryasset_assetStatusId_fkey` FOREIGN KEY (`assetStatusId`) REFERENCES `inventoryassetstatus`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryasset` ADD CONSTRAINT `inventoryasset_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryasset` ADD CONSTRAINT `inventoryasset_inventoryCategoryId_fkey` FOREIGN KEY (`inventoryCategoryId`) REFERENCES `inventorycategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryassetstatus` ADD CONSTRAINT `inventoryassetstatus_inventoryCategoryId_fkey` FOREIGN KEY (`inventoryCategoryId`) REFERENCES `inventorycategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
