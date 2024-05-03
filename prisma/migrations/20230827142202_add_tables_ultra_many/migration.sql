/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `googleId` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `discrepancyreports` DROP FOREIGN KEY `discrepancyreports_reporterId_fkey`;

-- DropForeignKey
ALTER TABLE `posts` DROP FOREIGN KEY `posts_authorId_fkey`;

-- AlterTable
ALTER TABLE `discrepancyreports` MODIFY `reporterId` INTEGER NULL;

-- AlterTable
ALTER TABLE `posts` MODIFY `authorId` INTEGER NULL;

-- AlterTable
ALTER TABLE `profile` ADD COLUMN `employeeNumber` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `googleId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `inventoryasset` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `assetCode` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `serialNumber` VARCHAR(191) NULL,
    `statusDetails` JSON NULL,
    `itemCategoryId` INTEGER NULL,
    `itemStatusId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventoryassetstatus` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventorycategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assetrequests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NULL,
    `details` JSON NULL,
    `assetId` INTEGER NULL,
    `requestorId` INTEGER NULL,

    UNIQUE INDEX `assetrequests_assetId_key`(`assetId`),
    UNIQUE INDEX `assetrequests_requestorId_key`(`requestorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `userlogs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventTitle` VARCHAR(191) NULL,
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `responsibleId` INTEGER NULL,

    UNIQUE INDEX `userlogs_responsibleId_key`(`responsibleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `postslogs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventTitle` VARCHAR(191) NULL,
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `responsibleId` INTEGER NULL,
    `postId` INTEGER NULL,

    UNIQUE INDEX `postslogs_responsibleId_key`(`responsibleId`),
    UNIQUE INDEX `postslogs_postId_key`(`postId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reportslogs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventTitle` VARCHAR(191) NULL,
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `responsibleId` INTEGER NULL,
    `reportId` INTEGER NULL,

    UNIQUE INDEX `reportslogs_responsibleId_key`(`responsibleId`),
    UNIQUE INDEX `reportslogs_reportId_key`(`reportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventoryassetlogs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventTitle` VARCHAR(191) NULL,
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `responsibleId` INTEGER NULL,
    `inventoryAssetId` INTEGER NULL,
    `itemCategoryId` INTEGER NULL,
    `itemStatusId` INTEGER NULL,

    UNIQUE INDEX `inventoryassetlogs_responsibleId_key`(`responsibleId`),
    UNIQUE INDEX `inventoryassetlogs_inventoryAssetId_key`(`inventoryAssetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `users_googleId_key` ON `users`(`googleId`);

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `discrepancyreports` ADD CONSTRAINT `discrepancyreports_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryasset` ADD CONSTRAINT `inventoryasset_itemCategoryId_fkey` FOREIGN KEY (`itemCategoryId`) REFERENCES `inventorycategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryasset` ADD CONSTRAINT `inventoryasset_itemStatusId_fkey` FOREIGN KEY (`itemStatusId`) REFERENCES `inventoryassetstatus`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assetrequests` ADD CONSTRAINT `assetrequests_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `inventoryasset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assetrequests` ADD CONSTRAINT `assetrequests_requestorId_fkey` FOREIGN KEY (`requestorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userlogs` ADD CONSTRAINT `userlogs_responsibleId_fkey` FOREIGN KEY (`responsibleId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `postslogs` ADD CONSTRAINT `postslogs_responsibleId_fkey` FOREIGN KEY (`responsibleId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `postslogs` ADD CONSTRAINT `postslogs_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reportslogs` ADD CONSTRAINT `reportslogs_responsibleId_fkey` FOREIGN KEY (`responsibleId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reportslogs` ADD CONSTRAINT `reportslogs_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `discrepancyreports`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryassetlogs` ADD CONSTRAINT `inventoryassetlogs_responsibleId_fkey` FOREIGN KEY (`responsibleId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryassetlogs` ADD CONSTRAINT `inventoryassetlogs_inventoryAssetId_fkey` FOREIGN KEY (`inventoryAssetId`) REFERENCES `inventoryasset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryassetlogs` ADD CONSTRAINT `inventoryassetlogs_itemCategoryId_fkey` FOREIGN KEY (`itemCategoryId`) REFERENCES `inventorycategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryassetlogs` ADD CONSTRAINT `inventoryassetlogs_itemStatusId_fkey` FOREIGN KEY (`itemStatusId`) REFERENCES `inventoryassetstatus`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
