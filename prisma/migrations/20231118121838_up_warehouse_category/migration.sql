-- AlterTable
ALTER TABLE `warehouseitem` ADD COLUMN `categoryId` INTEGER NULL;

-- CreateTable
CREATE TABLE `warehouseitemcategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `warehouseitem` ADD CONSTRAINT `warehouseitem_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `warehouseitemcategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
