ALTER TABLE `events`
  ADD COLUMN `personal_qr_enabled` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `personal_qr_delivery_methods` VARCHAR(191) NOT NULL DEFAULT 'download,email,telegram';

ALTER TABLE `meetings`
  ADD COLUMN `personal_qr_enabled` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `personal_qr_delivery_methods` VARCHAR(191) NOT NULL DEFAULT 'download,email,telegram';

ALTER TABLE `event_registrations`
  ADD COLUMN `title` VARCHAR(191) NULL,
  ADD COLUMN `email` VARCHAR(191) NULL;

ALTER TABLE `meeting_participants`
  ADD COLUMN `title` VARCHAR(191) NULL;

CREATE INDEX `event_registrations_email_idx` ON `event_registrations`(`email`);
