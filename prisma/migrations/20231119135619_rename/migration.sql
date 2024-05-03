-- DropForeignKey
ALTER TABLE `assetrequests` DROP FOREIGN KEY `assetrequests_inventoryAssetId_fkey`;

-- DropForeignKey
ALTER TABLE `assetrequests` DROP FOREIGN KEY `assetrequests_inventoryCategoryId_fkey`;

-- DropForeignKey
ALTER TABLE `assetrequests` DROP FOREIGN KEY `assetrequests_requestorId_fkey`;

-- DropForeignKey
ALTER TABLE `assetrequests` DROP FOREIGN KEY `assetrequests_respondedId_fkey`;

-- DropForeignKey
ALTER TABLE `assetrequestsuploads` DROP FOREIGN KEY `assetrequestsuploads_assetRequestId_fkey`;

-- DropForeignKey
ALTER TABLE `assetrequestsuploads` DROP FOREIGN KEY `assetrequestsuploads_attachmentId_fkey`;

-- DropForeignKey
ALTER TABLE `discrepancyreportusers` DROP FOREIGN KEY `discrepancyreportusers_reportId_fkey`;

-- DropForeignKey
ALTER TABLE `discrepancyreportusers` DROP FOREIGN KEY `discrepancyreportusers_sharedWithId_fkey`;

-- DropForeignKey
ALTER TABLE `inventoryasset` DROP FOREIGN KEY `inventoryasset_assetStatusId_fkey`;

-- DropForeignKey
ALTER TABLE `inventoryasset` DROP FOREIGN KEY `inventoryasset_departmentId_fkey`;

-- DropForeignKey
ALTER TABLE `inventoryasset` DROP FOREIGN KEY `inventoryasset_inventoryCategoryId_fkey`;

-- DropForeignKey
ALTER TABLE `inventoryassetlogs` DROP FOREIGN KEY `inventoryassetlogs_assetStatusId_fkey`;

-- DropForeignKey
ALTER TABLE `inventoryassetlogs` DROP FOREIGN KEY `inventoryassetlogs_inventoryAssetId_fkey`;

-- DropForeignKey
ALTER TABLE `inventoryassetlogs` DROP FOREIGN KEY `inventoryassetlogs_inventoryCategoryId_fkey`;

-- DropForeignKey
ALTER TABLE `inventoryassetlogs` DROP FOREIGN KEY `inventoryassetlogs_responsibleId_fkey`;

-- DropForeignKey
ALTER TABLE `inventoryassetstatus` DROP FOREIGN KEY `inventoryassetstatus_inventoryCategoryId_fkey`;

-- DropForeignKey
ALTER TABLE `inventoryassetuploads` DROP FOREIGN KEY `inventoryassetuploads_attachmentId_fkey`;

-- DropForeignKey
ALTER TABLE `inventoryassetuploads` DROP FOREIGN KEY `inventoryassetuploads_inventoryAssetId_fkey`;

-- DropForeignKey
ALTER TABLE `notification` DROP FOREIGN KEY `notification_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `notificationuseraction` DROP FOREIGN KEY `notificationuseraction_notificationId_fkey`;

-- DropForeignKey
ALTER TABLE `notificationuseraction` DROP FOREIGN KEY `notificationuseraction_notifiedUserId_fkey`;

-- DropForeignKey
ALTER TABLE `postuploads` DROP FOREIGN KEY `postUploads_attachmentId_fkey`;

-- DropForeignKey
ALTER TABLE `postuploads` DROP FOREIGN KEY `postUploads_postId_fkey`;

-- DropForeignKey
ALTER TABLE `profile` DROP FOREIGN KEY `profile_profilePicId_fkey`;

-- DropForeignKey
ALTER TABLE `profile` DROP FOREIGN KEY `profile_userId_fkey`;

-- DropForeignKey
ALTER TABLE `reportuploads` DROP FOREIGN KEY `reportuploads_attachmentId_fkey`;

-- DropForeignKey
ALTER TABLE `reportuploads` DROP FOREIGN KEY `reportuploads_reportId_fkey`;

-- DropForeignKey
ALTER TABLE `warehouseitem` DROP FOREIGN KEY `warehouseitem_categoryId_fkey`;

-- AddForeignKey
ALTER TABLE `profile` ADD CONSTRAINT `profile_profilePicId_fkey` FOREIGN KEY (`profilePicId`) REFERENCES `attachment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profile` ADD CONSTRAINT `profile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `postuploads` ADD CONSTRAINT `postuploads_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `postuploads` ADD CONSTRAINT `postuploads_attachmentId_fkey` FOREIGN KEY (`attachmentId`) REFERENCES `attachment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reportuploads` ADD CONSTRAINT `reportuploads_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `discrepancyreports`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reportuploads` ADD CONSTRAINT `reportuploads_attachmentId_fkey` FOREIGN KEY (`attachmentId`) REFERENCES `attachment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `discrepancyreportusers` ADD CONSTRAINT `discrepancyreportusers_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `discrepancyreports`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `discrepancyreportusers` ADD CONSTRAINT `discrepancyreportusers_sharedWithId_fkey` FOREIGN KEY (`sharedWithId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryasset` ADD CONSTRAINT `inventoryasset_assetStatusId_fkey` FOREIGN KEY (`assetStatusId`) REFERENCES `inventoryassetstatus`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryasset` ADD CONSTRAINT `inventoryasset_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryasset` ADD CONSTRAINT `inventoryasset_inventoryCategoryId_fkey` FOREIGN KEY (`inventoryCategoryId`) REFERENCES `inventorycategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryassetuploads` ADD CONSTRAINT `inventoryassetuploads_inventoryAssetId_fkey` FOREIGN KEY (`inventoryAssetId`) REFERENCES `inventoryasset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryassetuploads` ADD CONSTRAINT `inventoryassetuploads_attachmentId_fkey` FOREIGN KEY (`attachmentId`) REFERENCES `attachment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryassetstatus` ADD CONSTRAINT `inventoryassetstatus_inventoryCategoryId_fkey` FOREIGN KEY (`inventoryCategoryId`) REFERENCES `inventorycategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assetrequests` ADD CONSTRAINT `assetrequests_inventoryCategoryId_fkey` FOREIGN KEY (`inventoryCategoryId`) REFERENCES `inventorycategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assetrequests` ADD CONSTRAINT `assetrequests_requestorId_fkey` FOREIGN KEY (`requestorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assetrequests` ADD CONSTRAINT `assetrequests_respondedId_fkey` FOREIGN KEY (`respondedId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assetrequests` ADD CONSTRAINT `assetrequests_inventoryAssetId_fkey` FOREIGN KEY (`inventoryAssetId`) REFERENCES `inventoryasset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assetrequestsuploads` ADD CONSTRAINT `assetrequestsuploads_assetRequestId_fkey` FOREIGN KEY (`assetRequestId`) REFERENCES `assetrequests`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assetrequestsuploads` ADD CONSTRAINT `assetrequestsuploads_attachmentId_fkey` FOREIGN KEY (`attachmentId`) REFERENCES `attachment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryassetlogs` ADD CONSTRAINT `inventoryassetlogs_responsibleId_fkey` FOREIGN KEY (`responsibleId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryassetlogs` ADD CONSTRAINT `inventoryassetlogs_inventoryAssetId_fkey` FOREIGN KEY (`inventoryAssetId`) REFERENCES `inventoryasset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryassetlogs` ADD CONSTRAINT `inventoryassetlogs_inventoryCategoryId_fkey` FOREIGN KEY (`inventoryCategoryId`) REFERENCES `inventorycategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryassetlogs` ADD CONSTRAINT `inventoryassetlogs_assetStatusId_fkey` FOREIGN KEY (`assetStatusId`) REFERENCES `inventoryassetstatus`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `warehouseitem` ADD CONSTRAINT `warehouseitem_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `warehouseitemcategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `notification_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificationuseraction` ADD CONSTRAINT `notificationuseraction_notifiedUserId_fkey` FOREIGN KEY (`notifiedUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificationuseraction` ADD CONSTRAINT `notificationuseraction_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `notification`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `inventoryasset` RENAME INDEX `inventoryasset_sharedId_key` TO `inventoryasset_sharedId_key`;

-- RenameIndex
ALTER TABLE `profile` RENAME INDEX `profile_profilePicId_key` TO `profile_profilePicId_key`;

-- RenameIndex
ALTER TABLE `profile` RENAME INDEX `profile_userId_key` TO `profile_userId_key`;
