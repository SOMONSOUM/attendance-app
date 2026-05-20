-- DropForeignKey
ALTER TABLE `event_registrations` DROP FOREIGN KEY `event_registrations_shift_id_fkey`;

-- DropIndex
DROP INDEX `event_registrations_shift_id_idx` ON `event_registrations`;

-- AlterTable
ALTER TABLE `event_registrations` DROP COLUMN `shift_id`;

-- AlterTable
ALTER TABLE `event_shifts`
    CHANGE `starts_at` `start_time` TIME NOT NULL,
    CHANGE `ends_at` `end_time` TIME NOT NULL;
