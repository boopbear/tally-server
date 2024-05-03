/*
  Warnings:

  - You are about to drop the column `assetId` on the `assetrequests` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `assetrequests` table. All the data in the column will be lost.
  - Added the required column `eventType` to the `AssetRequests` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `assetrequests` DROP FOREIGN KEY `assetrequests_assetId_fkey`;

-- AlterTable
ALTER TABLE `assetrequests` DROP COLUMN `assetId`,
    DROP COLUMN `type`,
    ADD COLUMN `eventType` INTEGER NOT NULL,
    ADD COLUMN `inventoryAssetId` INTEGER NULL,
    ADD COLUMN `inventoryCategoryId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `assetrequests` ADD CONSTRAINT `assetrequests_inventoryCategoryId_fkey` FOREIGN KEY (`inventoryCategoryId`) REFERENCES `inventorycategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assetrequests` ADD CONSTRAINT `assetrequests_inventoryAssetId_fkey` FOREIGN KEY (`inventoryAssetId`) REFERENCES `inventoryasset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
