-- AlterTable
ALTER TABLE `events` ADD COLUMN `separate_qr_by_place` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `event_places` (
    `id` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `location_name` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `event_places_event_id_idx`(`event_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `qr_codes` ADD COLUMN `place_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `event_registrations` ADD COLUMN `place_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `attendances` ADD COLUMN `place_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `qr_codes_place_id_idx` ON `qr_codes`(`place_id`);

-- CreateIndex
CREATE INDEX `event_registrations_place_id_idx` ON `event_registrations`(`place_id`);

-- CreateIndex
CREATE INDEX `attendances_place_id_idx` ON `attendances`(`place_id`);

-- AddForeignKey
ALTER TABLE `event_places` ADD CONSTRAINT `event_places_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qr_codes` ADD CONSTRAINT `qr_codes_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `event_places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `event_places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `event_places`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
