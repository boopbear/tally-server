-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_departmentId_fkey`;

-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_otpTokenId_fkey`;

-- AlterTable
ALTER TABLE `users` MODIFY `departmentId` INTEGER NULL,
    MODIFY `otpTokenId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_otpTokenId_fkey` FOREIGN KEY (`otpTokenId`) REFERENCES `otptoken`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
