-- AlterTable
ALTER TABLE `users` ADD COLUMN `validRme` VARCHAR(191) NULL,
    ADD COLUMN `validRmeExpiration` DATETIME(3) NULL;
