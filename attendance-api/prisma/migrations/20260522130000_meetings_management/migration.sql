CREATE TABLE `meetings` (
  `id` VARCHAR(191) NOT NULL,
  `tenant_id` VARCHAR(191) NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `location_name` TEXT NOT NULL,
  `starts_at` DATETIME(3) NOT NULL,
  `ends_at` DATETIME(3) NOT NULL,
  `created_by_id` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `meetings_tenant_id_idx`(`tenant_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `meeting_hosts` (
  `id` VARCHAR(191) NOT NULL,
  `meeting_id` VARCHAR(191) NOT NULL,
  `role` ENUM('CHAIRPERSON', 'HOST') NOT NULL DEFAULT 'HOST',
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
  INDEX `meeting_hosts_meeting_id_idx`(`meeting_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `meeting_participants` (
  `id` VARCHAR(191) NOT NULL,
  `meeting_id` VARCHAR(191) NOT NULL,
  `full_name_en` VARCHAR(191) NOT NULL,
  `full_name_km` VARCHAR(191) NULL,
  `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL,
  `position` VARCHAR(191) NULL,
  `department` VARCHAR(191) NULL,
  `email` VARCHAR(191) NULL,
  `status` ENUM('INVITED', 'JOINED', 'CANCELLED') NOT NULL DEFAULT 'INVITED',
  `joined_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `meeting_participants_meeting_id_full_name_en_idx`(`meeting_id`, `full_name_en`),
  INDEX `meeting_participants_meeting_id_full_name_km_idx`(`meeting_id`, `full_name_km`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `meetings` ADD CONSTRAINT `meetings_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `meeting_hosts` ADD CONSTRAINT `meeting_hosts_meeting_id_fkey` FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `meeting_participants` ADD CONSTRAINT `meeting_participants_meeting_id_fkey` FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

INSERT IGNORE INTO `permissions` (`id`, `resource`, `action`, `created_at`, `updated_at`)
VALUES
  ('permission-meetings-create', 'meetings', 'create', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('permission-meetings-read', 'meetings', 'read', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('permission-meetings-update', 'meetings', 'update', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('permission-meetings-delete', 'meetings', 'delete', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT `roles`.`id`, `permissions`.`id`
FROM `roles`
JOIN `permissions` ON `permissions`.`resource` = 'meetings'
WHERE `roles`.`name` IN ('admin', 'owner');
