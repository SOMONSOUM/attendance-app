CREATE TABLE `event_card_designs` (
  `event_id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL DEFAULT 'Attendance Card',
  `subtitle` TEXT NULL,
  `logo_text` VARCHAR(191) NULL,
  `footer_text` TEXT NULL,
  `primary_color` VARCHAR(191) NOT NULL DEFAULT '#0876cf',
  `background_color` VARCHAR(191) NOT NULL DEFAULT '#003c98',
  `accent_color` VARCHAR(191) NOT NULL DEFAULT '#40d5f7',
  `layout` VARCHAR(191) NOT NULL DEFAULT 'classic',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`event_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `meeting_card_designs` (
  `meeting_id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL DEFAULT 'Participant Card',
  `subtitle` TEXT NULL,
  `logo_text` VARCHAR(191) NULL,
  `footer_text` TEXT NULL,
  `primary_color` VARCHAR(191) NOT NULL DEFAULT '#0876cf',
  `background_color` VARCHAR(191) NOT NULL DEFAULT '#003c98',
  `accent_color` VARCHAR(191) NOT NULL DEFAULT '#40d5f7',
  `layout` VARCHAR(191) NOT NULL DEFAULT 'classic',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`meeting_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `event_card_designs`
  ADD CONSTRAINT `event_card_designs_event_id_fkey`
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `meeting_card_designs`
  ADD CONSTRAINT `meeting_card_designs_meeting_id_fkey`
  FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
