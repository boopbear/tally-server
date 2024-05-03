/*
  Warnings:

  - You are about to drop the column `lastModifiedDate` on the `attachment` table. All the data in the column will be lost.
  - You are about to drop the column `uploadId` on the `attachment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `attachment` DROP COLUMN `lastModifiedDate`,
    DROP COLUMN `uploadId`,
    ADD COLUMN `size` INTEGER NULL;
