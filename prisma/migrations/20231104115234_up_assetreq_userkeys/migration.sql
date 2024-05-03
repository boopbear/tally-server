-- AlterTable
ALTER TABLE `assetrequests` ADD COLUMN `respondedId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `assetrequests` ADD CONSTRAINT `assetrequests_respondedId_fkey` FOREIGN KEY (`respondedId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
