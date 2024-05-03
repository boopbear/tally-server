/*
  Warnings:

  - You are about to drop the column `size` on the `attachment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `attachment` DROP COLUMN `size`,
    ADD COLUMN `imageSize` INTEGER NULL;
