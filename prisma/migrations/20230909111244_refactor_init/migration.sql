/*
  Warnings:

  - You are about to drop the column `statusDetails` on the `inventoryasset` table. All the data in the column will be lost.
  - You are about to drop the `postslogs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reportslogs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `postslogs` DROP FOREIGN KEY `postslogs_postId_fkey`;

-- DropForeignKey
ALTER TABLE `postslogs` DROP FOREIGN KEY `postslogs_responsibleId_fkey`;

-- DropForeignKey
ALTER TABLE `reportslogs` DROP FOREIGN KEY `reportslogs_reportId_fkey`;

-- DropForeignKey
ALTER TABLE `reportslogs` DROP FOREIGN KEY `reportslogs_responsibleId_fkey`;

-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_departmentId_fkey`;

-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_otpTokenId_fkey`;

-- AlterTable
ALTER TABLE `inventoryasset` DROP COLUMN `statusDetails`,
    ADD COLUMN `department` VARCHAR(191) NULL,
    ADD COLUMN `endUser` VARCHAR(191) NULL,
    ADD COLUMN `location` VARCHAR(191) NULL,
    ADD COLUMN `owner` VARCHAR(191) NULL,
    ADD COLUMN `purchaseOrderNo` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `postslogs`;

-- DropTable
DROP TABLE `reportslogs`;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_otpTokenId_fkey` FOREIGN KEY (`otpTokenId`) REFERENCES `otptoken`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `users` RENAME INDEX `users_email_key` TO `users_email_key`;

-- RenameIndex
ALTER TABLE `users` RENAME INDEX `users_otpTokenId_key` TO `users_otpTokenId_key`;

-- RenameIndex
ALTER TABLE `users` RENAME INDEX `users_sharedId_key` TO `users_sharedId_key`;
