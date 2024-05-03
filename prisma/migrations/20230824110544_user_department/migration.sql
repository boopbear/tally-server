-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `sharedId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `role` ENUM('OFFICE_ADMIN', 'SUPER_ADMIN') NULL DEFAULT 'OFFICE_ADMIN',
    `departmentId` INTEGER NOT NULL,
    `otpTokenId` INTEGER NOT NULL,
    `lastOtpQrScan` DATETIME(3) NULL,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_otpTokenId_key`(`otpTokenId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `otptoken` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `otp_ascii` VARCHAR(191) NULL,
    `otp_hex` VARCHAR(191) NULL,
    `otp_base32` VARCHAR(191) NULL,
    `otp_auth_url` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `department` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_otpTokenId_fkey` FOREIGN KEY (`otpTokenId`) REFERENCES `otptoken`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
