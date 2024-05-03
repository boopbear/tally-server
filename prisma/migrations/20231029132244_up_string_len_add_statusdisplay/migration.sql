-- AlterTable
ALTER TABLE `assetrequests` MODIFY `type` TEXT NULL;

-- AlterTable
ALTER TABLE `inventoryasset` MODIFY `assetCode` TEXT NULL,
    MODIFY `description` TEXT NULL,
    MODIFY `serialNumber` TEXT NULL,
    MODIFY `endUser` TEXT NULL,
    MODIFY `owner` TEXT NULL,
    MODIFY `poNumber` TEXT NULL,
    MODIFY `qrKey` TEXT NULL;

-- AlterTable
ALTER TABLE `inventoryassetlogs` MODIFY `eventTitle` TEXT NULL;

-- AlterTable
ALTER TABLE `inventoryassetstatus` ADD COLUMN `display` TEXT NULL,
    MODIFY `name` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `inventorycategory` MODIFY `name` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `userlogs` MODIFY `eventTitle` TEXT NULL;
