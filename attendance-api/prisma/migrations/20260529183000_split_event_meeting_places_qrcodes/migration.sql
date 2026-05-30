-- Split event/meeting snapshots and QR codes back into dedicated tables.

ALTER TABLE `attendances` DROP FOREIGN KEY `attendances_place_id_fkey`;
ALTER TABLE `event_registrations` DROP FOREIGN KEY `event_registrations_place_id_fkey`;
ALTER TABLE `meeting_participants` DROP FOREIGN KEY `meeting_participants_place_id_fkey`;
ALTER TABLE `qr_codes` DROP FOREIGN KEY `qr_codes_event_id_fkey`;
ALTER TABLE `qr_codes` DROP FOREIGN KEY `qr_codes_meeting_id_fkey`;
ALTER TABLE `qr_codes` DROP FOREIGN KEY `qr_codes_place_id_fkey`;
ALTER TABLE `places` DROP FOREIGN KEY `places_event_id_fkey`;
ALTER TABLE `places` DROP FOREIGN KEY `places_meeting_id_fkey`;
ALTER TABLE `places` DROP FOREIGN KEY `places_catalog_place_id_fkey`;

CREATE TABLE `event_places` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` VARCHAR(191) NOT NULL,
  `catalog_place_id` VARCHAR(191) NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `require_location` BOOLEAN NOT NULL DEFAULT false,
  `location_name` TEXT NULL,
  `latitude` DECIMAL(10, 7) NULL,
  `longitude` DECIMAL(10, 7) NULL,
  `radius_meters` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `event_places_event_id_idx`(`event_id`),
  INDEX `event_places_catalog_place_id_idx`(`catalog_place_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `meeting_places` (
  `id` VARCHAR(191) NOT NULL,
  `meeting_id` VARCHAR(191) NOT NULL,
  `catalog_place_id` VARCHAR(191) NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `require_location` BOOLEAN NOT NULL DEFAULT false,
  `location_name` TEXT NULL,
  `latitude` DECIMAL(10, 7) NULL,
  `longitude` DECIMAL(10, 7) NULL,
  `radius_meters` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `meeting_places_meeting_id_idx`(`meeting_id`),
  INDEX `meeting_places_catalog_place_id_idx`(`catalog_place_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `event_places` (
  `id`, `event_id`, `catalog_place_id`, `name`, `description`,
  `require_location`, `location_name`, `latitude`, `longitude`,
  `radius_meters`, `created_at`, `updated_at`
)
SELECT
  `id`, `event_id`, `catalog_place_id`, `name`, `description`,
  `require_location`, `location_name`, `latitude`, `longitude`,
  `radius_meters`, `created_at`, `updated_at`
FROM `places`
WHERE `event_id` IS NOT NULL;

INSERT INTO `meeting_places` (
  `id`, `meeting_id`, `catalog_place_id`, `name`, `description`,
  `require_location`, `location_name`, `latitude`, `longitude`,
  `radius_meters`, `created_at`, `updated_at`
)
SELECT
  `id`, `meeting_id`, `catalog_place_id`, `name`, `description`,
  `require_location`, `location_name`, `latitude`, `longitude`,
  `radius_meters`, `created_at`, `updated_at`
FROM `places`
WHERE `meeting_id` IS NOT NULL;

INSERT IGNORE INTO `event_places` (
  `id`, `event_id`, `name`, `require_location`, `location_name`,
  `latitude`, `longitude`, `radius_meters`, `created_at`, `updated_at`
)
SELECT
  CONCAT(`id`, '-place'), `id`,
  CASE WHEN `location_name` IS NULL OR `location_name` = '' THEN `name` ELSE `location_name` END,
  `require_location`, `location_name`, `latitude`, `longitude`, `radius_meters`,
  CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `events`
WHERE NOT EXISTS (
  SELECT 1 FROM `places` WHERE `places`.`event_id` = `events`.`id`
);

INSERT IGNORE INTO `meeting_places` (
  `id`, `meeting_id`, `name`, `require_location`, `location_name`,
  `latitude`, `longitude`, `radius_meters`, `created_at`, `updated_at`
)
SELECT
  CONCAT(`id`, '-place'), `id`,
  CASE WHEN `location_name` IS NULL OR `location_name` = '' THEN `name` ELSE `location_name` END,
  `require_location`, `location_name`, `latitude`, `longitude`, `radius_meters`,
  CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `meetings`
WHERE NOT EXISTS (
  SELECT 1 FROM `places` WHERE `places`.`meeting_id` = `meetings`.`id`
);

CREATE TABLE `event_qr_codes` (
  `id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `event_id` VARCHAR(191) NOT NULL,
  `place_id` VARCHAR(191) NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `expires_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `event_qr_codes_code_key`(`code`),
  INDEX `event_qr_codes_event_id_idx`(`event_id`),
  INDEX `event_qr_codes_place_id_idx`(`place_id`),
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
  INDEX `meeting_qr_codes_meeting_id_idx`(`meeting_id`),
  INDEX `meeting_qr_codes_place_id_idx`(`place_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `event_qr_codes` (
  `id`, `code`, `event_id`, `place_id`, `active`, `expires_at`, `created_at`, `updated_at`
)
SELECT
  `id`, `code`, `event_id`, COALESCE(`place_id`, CONCAT(`event_id`, '-place')),
  `active`, `expires_at`, `created_at`, `updated_at`
FROM `qr_codes`
WHERE `target` = 'EVENT' AND `event_id` IS NOT NULL;

INSERT INTO `meeting_qr_codes` (
  `id`, `code`, `meeting_id`, `place_id`, `active`, `expires_at`, `created_at`, `updated_at`
)
SELECT
  `id`, `code`, `meeting_id`, COALESCE(`place_id`, CONCAT(`meeting_id`, '-place')),
  `active`, `expires_at`, `created_at`, `updated_at`
FROM `qr_codes`
WHERE `target` = 'MEETING' AND `meeting_id` IS NOT NULL;

DROP TABLE `qr_codes`;

DELETE FROM `places` WHERE `event_id` IS NOT NULL OR `meeting_id` IS NOT NULL;

ALTER TABLE `events`
  DROP COLUMN `require_location`,
  DROP COLUMN `location_name`,
  DROP COLUMN `latitude`,
  DROP COLUMN `longitude`,
  DROP COLUMN `radius_meters`;

ALTER TABLE `meetings`
  DROP COLUMN `require_location`,
  DROP COLUMN `location_name`,
  DROP COLUMN `latitude`,
  DROP COLUMN `longitude`,
  DROP COLUMN `radius_meters`;

ALTER TABLE `places`
  DROP COLUMN `event_id`,
  DROP COLUMN `meeting_id`,
  DROP COLUMN `catalog_place_id`;

CREATE UNIQUE INDEX `places_tenant_id_name_key` ON `places`(`tenant_id`, `name`);

ALTER TABLE `event_places` ADD CONSTRAINT `event_places_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `event_places` ADD CONSTRAINT `event_places_catalog_place_id_fkey` FOREIGN KEY (`catalog_place_id`) REFERENCES `places`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `meeting_places` ADD CONSTRAINT `meeting_places_meeting_id_fkey` FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `meeting_places` ADD CONSTRAINT `meeting_places_catalog_place_id_fkey` FOREIGN KEY (`catalog_place_id`) REFERENCES `places`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `event_qr_codes` ADD CONSTRAINT `event_qr_codes_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `event_qr_codes` ADD CONSTRAINT `event_qr_codes_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `event_places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `meeting_qr_codes` ADD CONSTRAINT `meeting_qr_codes_meeting_id_fkey` FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `meeting_qr_codes` ADD CONSTRAINT `meeting_qr_codes_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `meeting_places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `event_places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `event_places`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `meeting_participants` ADD CONSTRAINT `meeting_participants_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `meeting_places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
