/*
  Warnings:

  - You are about to drop the column `otp_ascii` on the `otptoken` table. All the data in the column will be lost.
  - You are about to drop the column `otp_hex` on the `otptoken` table. All the data in the column will be lost.
  - You are about to drop the column `lastOtpQrScan` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `otptoken` DROP COLUMN `otp_ascii`,
    DROP COLUMN `otp_hex`;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `lastOtpQrScan`,
    ADD COLUMN `lastOtpQrGenerate` DATETIME(3) NULL;
