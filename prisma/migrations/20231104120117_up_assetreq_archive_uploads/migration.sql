-- AlterTable
ALTER TABLE `assetrequests` ADD COLUMN `isArchived` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `assetrequestsuploads` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `assetRequestId` INTEGER NULL,
    `attachmentId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `assetrequestsuploads` ADD CONSTRAINT `assetrequestsuploads_assetRequestId_fkey` FOREIGN KEY (`assetRequestId`) REFERENCES `assetrequests`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assetrequestsuploads` ADD CONSTRAINT `assetrequestsuploads_attachmentId_fkey` FOREIGN KEY (`attachmentId`) REFERENCES `attachment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
