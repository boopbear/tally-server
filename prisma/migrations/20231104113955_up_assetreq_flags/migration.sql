-- AlterTable
ALTER TABLE `assetrequests` ADD COLUMN `isAnswered` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isApproved` BOOLEAN NOT NULL DEFAULT false;
