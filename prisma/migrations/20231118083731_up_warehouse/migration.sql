-- CreateTable
CREATE TABLE `warehouseitem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `itemCode` TEXT NULL,
    `description` TEXT NULL,
    `oum` TEXT NULL,
    `totalQty` INTEGER NOT NULL DEFAULT 0,
    `remQty` INTEGER NOT NULL DEFAULT 0,
    `location` TEXT NULL,
    `pendingOrder` TEXT NULL,
    `poNumber` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `isHidden` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `warehouselogs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `itemCode` TEXT NULL,
    `description` TEXT NULL,
    `oum` TEXT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `dateReceived` DATETIME(3) NULL,
    `affiliation` TEXT NULL,
    `reason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
