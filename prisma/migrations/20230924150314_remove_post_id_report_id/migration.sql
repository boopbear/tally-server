/*
  Warnings:

  - You are about to drop the column `reporterId` on the `discrepancyreports` table. All the data in the column will be lost.
  - You are about to drop the column `authorId` on the `posts` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `discrepancyreports` DROP FOREIGN KEY `discrepancyreports_reporterId_fkey`;

-- DropForeignKey
ALTER TABLE `posts` DROP FOREIGN KEY `posts_authorId_fkey`;

-- AlterTable
ALTER TABLE `discrepancyreports` DROP COLUMN `reporterId`;

-- AlterTable
ALTER TABLE `posts` DROP COLUMN `authorId`;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_publisherId_fkey` FOREIGN KEY (`publisherId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `discrepancyreports` ADD CONSTRAINT `discrepancyreports_publisherId_fkey` FOREIGN KEY (`publisherId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
