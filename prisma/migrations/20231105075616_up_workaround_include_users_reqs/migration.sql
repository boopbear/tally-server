-- AlterTable
ALTER TABLE `assetrequests` ADD COLUMN `requestorId` INTEGER NULL,
    ADD COLUMN `respondedId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `assetrequests` ADD CONSTRAINT `assetrequests_requestorId_fkey` FOREIGN KEY (`requestorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assetrequests` ADD CONSTRAINT `assetrequests_respondedId_fkey` FOREIGN KEY (`respondedId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
