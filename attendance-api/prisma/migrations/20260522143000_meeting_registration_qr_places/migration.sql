ALTER TABLE `meetings`
  ADD COLUMN `mode` ENUM('PRE_REGISTERED', 'OPEN_REGISTRATION') NOT NULL DEFAULT 'PRE_REGISTERED',
  ADD COLUMN `separate_qr_by_place` BOOLEAN NOT NULL DEFAULT false;

RENAME TABLE `meeting_hosts` TO `meeting_chairpersons`;
ALTER TABLE `meeting_chairpersons` DROP COLUMN `role`;
ALTER TABLE `meeting_chairpersons` RENAME INDEX `meeting_hosts_meeting_id_idx` TO `meeting_chairpersons_meeting_id_idx`;
ALTER TABLE `meeting_chairpersons` DROP FOREIGN KEY `meeting_hosts_meeting_id_fkey`;
ALTER TABLE `meeting_chairpersons` ADD CONSTRAINT `meeting_chairpersons_meeting_id_fkey` FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `meeting_places` (
  `id` VARCHAR(191) NOT NULL,
  `meeting_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `location_name` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `meeting_places_meeting_id_idx`(`meeting_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `meeting_qr_codes` (
  `id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `meeting_id` VARCHAR(191) NOT NULL,
  `place_id` VARCHAR(191) NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `expires_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `meeting_qr_codes_code_key`(`code`),
  INDEX `meeting_qr_codes_place_id_idx`(`place_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `meeting_participants`
  ADD COLUMN `place_id` VARCHAR(191) NULL,
  ADD COLUMN `source` VARCHAR(191) NOT NULL DEFAULT 'MANUAL';

CREATE INDEX `meeting_participants_place_id_idx` ON `meeting_participants`(`place_id`);

ALTER TABLE `meeting_places` ADD CONSTRAINT `meeting_places_meeting_id_fkey` FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `meeting_qr_codes` ADD CONSTRAINT `meeting_qr_codes_meeting_id_fkey` FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `meeting_qr_codes` ADD CONSTRAINT `meeting_qr_codes_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `meeting_places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `meeting_participants` ADD CONSTRAINT `meeting_participants_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `meeting_places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

INSERT IGNORE INTO `meeting_qr_codes` (`id`, `code`, `meeting_id`, `place_id`, `active`, `created_at`, `updated_at`)
SELECT CONCAT('meeting-qr-', `id`), CONCAT('meeting-', `id`), `id`, NULL, true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `meetings`;
