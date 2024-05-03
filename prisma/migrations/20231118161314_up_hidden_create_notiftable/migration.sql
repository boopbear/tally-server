-- AlterTable
ALTER TABLE `assetrequests` ADD COLUMN `isHiddenAdmin` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isHiddenNonAdmin` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `department` ADD COLUMN `isHidden` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `reasonHide` TEXT NULL;

-- AlterTable
ALTER TABLE `inventoryasset` ADD COLUMN `isHidden` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `reasonHide` TEXT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `isHidden` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `reasonHide` TEXT NULL;

-- CreateTable
CREATE TABLE `notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` TEXT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdById` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notificationuseraction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `viewed` BOOLEAN NOT NULL DEFAULT false,
    `hidden` BOOLEAN NOT NULL DEFAULT false,
    `notifiedUserId` INTEGER NULL,
    `notificationId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `notification_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificationuseraction` ADD CONSTRAINT `notificationuseraction_notifiedUserId_fkey` FOREIGN KEY (`notifiedUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificationuseraction` ADD CONSTRAINT `notificationuseraction_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `notification`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
