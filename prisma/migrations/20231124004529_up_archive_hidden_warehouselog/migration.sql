-- AlterTable
ALTER TABLE `warehouselogs` ADD COLUMN `isArchived` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isHidden` BOOLEAN NOT NULL DEFAULT false;
