CREATE TABLE `places` (
  `id` VARCHAR(191) NOT NULL,
  `tenant_id` VARCHAR(191) NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `require_location` BOOLEAN NOT NULL DEFAULT false,
  `location_name` TEXT NULL,
  `latitude` DECIMAL(10, 7) NULL,
  `longitude` DECIMAL(10, 7) NULL,
  `radius_meters` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `places_tenant_id_name_key` (`tenant_id`, `name`),
  INDEX `places_tenant_id_idx` (`tenant_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `chairpersons` (
  `id` VARCHAR(191) NOT NULL,
  `tenant_id` VARCHAR(191) NULL,
  `honorific_title_en` VARCHAR(191) NOT NULL,
  `honorific_title_km` VARCHAR(191) NOT NULL,
  `first_name_en` VARCHAR(191) NOT NULL,
  `first_name_km` VARCHAR(191) NOT NULL,
  `last_name_en` VARCHAR(191) NOT NULL,
  `last_name_km` VARCHAR(191) NOT NULL,
  `position` VARCHAR(191) NULL,
  `organization` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `chairpersons_tenant_id_idx` (`tenant_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `places`
  ADD CONSTRAINT `places_tenant_id_fkey`
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `chairpersons`
  ADD CONSTRAINT `chairpersons_tenant_id_fkey`
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `event_places` ADD COLUMN `catalog_place_id` VARCHAR(191) NULL;
CREATE INDEX `event_places_catalog_place_id_idx` ON `event_places`(`catalog_place_id`);
ALTER TABLE `event_places`
  ADD CONSTRAINT `event_places_catalog_place_id_fkey`
  FOREIGN KEY (`catalog_place_id`) REFERENCES `places`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `meeting_places` ADD COLUMN `catalog_place_id` VARCHAR(191) NULL;
CREATE INDEX `meeting_places_catalog_place_id_idx` ON `meeting_places`(`catalog_place_id`);
ALTER TABLE `meeting_places`
  ADD CONSTRAINT `meeting_places_catalog_place_id_fkey`
  FOREIGN KEY (`catalog_place_id`) REFERENCES `places`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `meeting_chairpersons` ADD COLUMN `catalog_chairperson_id` VARCHAR(191) NULL;
CREATE INDEX `meeting_chairpersons_catalog_chairperson_id_idx` ON `meeting_chairpersons`(`catalog_chairperson_id`);
ALTER TABLE `meeting_chairpersons`
  ADD CONSTRAINT `meeting_chairpersons_catalog_chairperson_id_fkey`
  FOREIGN KEY (`catalog_chairperson_id`) REFERENCES `chairpersons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
