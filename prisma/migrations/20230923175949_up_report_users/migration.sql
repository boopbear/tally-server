-- CreateTable
CREATE TABLE `discrepancyreportusers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reportId` INTEGER NULL,
    `sharedWithId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `discrepancyreportusers` ADD CONSTRAINT `discrepancyreportusers_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `discrepancyreports`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `discrepancyreportusers` ADD CONSTRAINT `discrepancyreportusers_sharedWithId_fkey` FOREIGN KEY (`sharedWithId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
