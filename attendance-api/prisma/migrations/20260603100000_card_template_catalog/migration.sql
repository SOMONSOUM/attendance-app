CREATE TABLE `card_templates` (
  `id` VARCHAR(191) NOT NULL,
  `tenant_id` VARCHAR(191) NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `target` ENUM('EVENT', 'MEETING') NOT NULL DEFAULT 'EVENT',
  `canvas_width` INTEGER NOT NULL DEFAULT 1080,
  `canvas_height` INTEGER NOT NULL DEFAULT 1536,
  `background_color` VARCHAR(191) NOT NULL DEFAULT '#003c98',
  `border_radius` INTEGER NOT NULL DEFAULT 32,
  `elements` JSON NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `card_templates_tenant_id_name_key`
  ON `card_templates`(`tenant_id`, `name`);

CREATE INDEX `card_templates_tenant_id_idx`
  ON `card_templates`(`tenant_id`);

ALTER TABLE `card_templates`
  ADD CONSTRAINT `card_templates_tenant_id_fkey`
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `events`
  ADD COLUMN `card_template_id` VARCHAR(191) NULL;

CREATE INDEX `events_card_template_id_idx`
  ON `events`(`card_template_id`);

ALTER TABLE `events`
  ADD CONSTRAINT `events_card_template_id_fkey`
  FOREIGN KEY (`card_template_id`) REFERENCES `card_templates`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `meetings`
  ADD COLUMN `card_template_id` VARCHAR(191) NULL;

CREATE INDEX `meetings_card_template_id_idx`
  ON `meetings`(`card_template_id`);

ALTER TABLE `meetings`
  ADD CONSTRAINT `meetings_card_template_id_fkey`
  FOREIGN KEY (`card_template_id`) REFERENCES `card_templates`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
