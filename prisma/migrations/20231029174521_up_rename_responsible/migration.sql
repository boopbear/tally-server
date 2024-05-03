/*
  Warnings:

  - You are about to drop the column `responsibleId` on the `inventoryassetlogs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `inventoryassetlogs` DROP FOREIGN KEY `inventoryassetlogs_responsibleId_fkey`;

-- AlterTable
ALTER TABLE `inventoryassetlogs` DROP COLUMN `responsibleId`,
    ADD COLUMN `responsibleUserId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `inventoryassetlogs` ADD CONSTRAINT `inventoryassetLogs_responsibleUserId_fkey` FOREIGN KEY (`responsibleUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
