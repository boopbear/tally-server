/*
  Warnings:

  - A unique constraint covering the columns `[sharedId]` on the table `InventoryAsset` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `inventoryasset` ADD COLUMN `sharedId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `InventoryAsset_sharedId_key` ON `inventoryasset`(`sharedId`);
