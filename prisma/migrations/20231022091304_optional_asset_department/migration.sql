-- DropForeignKey
ALTER TABLE `inventoryasset` DROP FOREIGN KEY `inventoryasset_departmentId_fkey`;

-- AlterTable
ALTER TABLE `inventoryasset` MODIFY `departmentId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `inventoryasset` ADD CONSTRAINT `inventoryasset_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
