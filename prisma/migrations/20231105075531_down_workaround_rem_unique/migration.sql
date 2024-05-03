/*
  Warnings:

  - You are about to drop the column `requestorId` on the `assetrequests` table. All the data in the column will be lost.
  - You are about to drop the column `respondedId` on the `assetrequests` table. All the data in the column will be lost.
  - You are about to drop the `userlogs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `assetrequests` DROP FOREIGN KEY `assetrequests_requestorId_fkey`;

-- DropForeignKey
ALTER TABLE `assetrequests` DROP FOREIGN KEY `assetrequests_respondedId_fkey`;

-- DropForeignKey
ALTER TABLE `userlogs` DROP FOREIGN KEY `userlogs_responsibleId_fkey`;

-- AlterTable
ALTER TABLE `assetrequests` DROP COLUMN `requestorId`,
    DROP COLUMN `respondedId`;

-- DropTable
DROP TABLE `userlogs`;
