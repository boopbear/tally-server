/*
  Warnings:

  - You are about to drop the column `postId` on the `attachment` table. All the data in the column will be lost.
  - You are about to drop the column `reportId` on the `attachment` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `attachment` DROP FOREIGN KEY `attachment_postId_fkey`;

-- DropForeignKey
ALTER TABLE `attachment` DROP FOREIGN KEY `attachment_reportId_fkey`;

-- AlterTable
ALTER TABLE `attachment` DROP COLUMN `postId`,
    DROP COLUMN `reportId`;

-- CreateTable
CREATE TABLE `postuploads` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `postId` INTEGER NULL,
    `attachmentId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reportuploads` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reportId` INTEGER NULL,
    `attachmentId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventoryassetuploads` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `inventoryAssetId` INTEGER NULL,
    `attachmentId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `postuploads` ADD CONSTRAINT `postuploads_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `postuploads` ADD CONSTRAINT `postuploads_attachmentId_fkey` FOREIGN KEY (`attachmentId`) REFERENCES `attachment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reportuploads` ADD CONSTRAINT `reportuploads_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `discrepancyreports`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reportuploads` ADD CONSTRAINT `reportuploads_attachmentId_fkey` FOREIGN KEY (`attachmentId`) REFERENCES `attachment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryassetuploads` ADD CONSTRAINT `inventoryassetUploads_inventoryAssetId_fkey` FOREIGN KEY (`inventoryAssetId`) REFERENCES `inventoryasset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryassetuploads` ADD CONSTRAINT `inventoryassetUploads_attachmentId_fkey` FOREIGN KEY (`attachmentId`) REFERENCES `attachment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
