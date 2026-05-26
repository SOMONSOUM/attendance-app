-- AlterTable
ALTER TABLE `event_registrations` ADD COLUMN `shift_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `meeting_participants` ADD COLUMN `shift_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `meetings` ALTER COLUMN `mode` DROP DEFAULT;

-- CreateTable
CREATE TABLE `meeting_shifts` (
    `id` VARCHAR(191) NOT NULL,
    `meeting_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `start_time` TIME(0) NOT NULL,
    `end_time` TIME(0) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `meeting_shifts_meeting_id_idx`(`meeting_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `event_registrations_shift_id_idx` ON `event_registrations`(`shift_id`);

-- CreateIndex
CREATE INDEX `meeting_participants_shift_id_idx` ON `meeting_participants`(`shift_id`);

-- AddForeignKey
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_shift_id_fkey` FOREIGN KEY (`shift_id`) REFERENCES `event_shifts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meeting_shifts` ADD CONSTRAINT `meeting_shifts_meeting_id_fkey` FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meeting_participants` ADD CONSTRAINT `meeting_participants_shift_id_fkey` FOREIGN KEY (`shift_id`) REFERENCES `meeting_shifts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
