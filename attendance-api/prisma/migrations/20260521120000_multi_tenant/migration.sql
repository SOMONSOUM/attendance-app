CREATE TABLE `tenants` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `status` ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  `owner_user_id` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `tenants_slug_key`(`slug`),
  UNIQUE INDEX `tenants_owner_user_id_key`(`owner_user_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `users` ADD COLUMN `tenant_id` VARCHAR(191) NULL;
ALTER TABLE `roles` ADD COLUMN `tenant_id` VARCHAR(191) NULL;
ALTER TABLE `events` ADD COLUMN `tenant_id` VARCHAR(191) NULL;
ALTER TABLE `registration_imports` ADD COLUMN `tenant_id` VARCHAR(191) NULL;

INSERT INTO `tenants` (`id`, `name`, `slug`, `status`, `owner_user_id`, `created_at`, `updated_at`)
VALUES ('default-tenant', 'Default Tenant', 'default', 'ACTIVE', NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

UPDATE `users` SET `tenant_id` = 'default-tenant' WHERE `tenant_id` IS NULL;
UPDATE `roles` SET `tenant_id` = 'default-tenant' WHERE `tenant_id` IS NULL;
UPDATE `events` SET `tenant_id` = 'default-tenant' WHERE `tenant_id` IS NULL;
UPDATE `registration_imports` SET `tenant_id` = 'default-tenant' WHERE `tenant_id` IS NULL;

UPDATE `tenants`
SET `owner_user_id` = (SELECT `id` FROM `users` WHERE `email` = 'admin@example.com' LIMIT 1)
WHERE `id` = 'default-tenant';

ALTER TABLE `roles` DROP INDEX `roles_name_key`;
CREATE UNIQUE INDEX `roles_tenant_id_name_key` ON `roles`(`tenant_id`, `name`);
CREATE INDEX `users_tenant_id_idx` ON `users`(`tenant_id`);
CREATE INDEX `roles_tenant_id_idx` ON `roles`(`tenant_id`);
CREATE INDEX `events_tenant_id_idx` ON `events`(`tenant_id`);
CREATE INDEX `registration_imports_tenant_id_idx` ON `registration_imports`(`tenant_id`);

ALTER TABLE `tenants` ADD CONSTRAINT `tenants_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `users` ADD CONSTRAINT `users_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `roles` ADD CONSTRAINT `roles_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `events` ADD CONSTRAINT `events_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `registration_imports` ADD CONSTRAINT `registration_imports_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

INSERT IGNORE INTO `permissions` (`id`, `resource`, `action`, `created_at`, `updated_at`)
VALUES
  ('permission-tenants-read', 'tenants', 'read', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('permission-tenants-update', 'tenants', 'update', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT `roles`.`id`, 'permission-tenants-read'
FROM `roles`
WHERE `roles`.`tenant_id` = 'default-tenant' AND `roles`.`name` = 'admin';

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT `roles`.`id`, 'permission-tenants-update'
FROM `roles`
WHERE `roles`.`tenant_id` = 'default-tenant' AND `roles`.`name` = 'admin';
