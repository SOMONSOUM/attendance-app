-- CreateTable
CREATE TABLE `event_shifts` (
    `id` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `starts_at` DATETIME(3) NOT NULL,
    `ends_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `event_shifts_event_id_idx`(`event_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `event_registrations` ADD COLUMN `shift_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `attendances` ADD COLUMN `shift_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `event_registrations_shift_id_idx` ON `event_registrations`(`shift_id`);

-- CreateIndex
CREATE INDEX `attendances_shift_id_idx` ON `attendances`(`shift_id`);

-- AddForeignKey
ALTER TABLE `event_shifts` ADD CONSTRAINT `event_shifts_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_shift_id_fkey` FOREIGN KEY (`shift_id`) REFERENCES `event_shifts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_shift_id_fkey` FOREIGN KEY (`shift_id`) REFERENCES `event_shifts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
