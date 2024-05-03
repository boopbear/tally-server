-- AlterTable
ALTER TABLE `discrepancyreports` ADD COLUMN `publisherId` INTEGER NULL;

-- AlterTable
ALTER TABLE `posts` ADD COLUMN `publisherId` INTEGER NULL;

UPDATE `discrepancyreports` SET publisherId = reporterId;
UPDATE `posts` SET publisherId = authorId;