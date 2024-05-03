/*
  Warnings:

  - You are about to drop the column `isHidden` on the `inventoryasset` table. All the data in the column will be lost.
  - You are about to drop the column `reasonHide` on the `inventoryasset` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `inventoryasset` DROP COLUMN `isHidden`,
    DROP COLUMN `reasonHide`;
