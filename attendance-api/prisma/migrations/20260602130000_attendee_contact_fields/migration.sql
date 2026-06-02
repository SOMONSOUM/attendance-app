ALTER TABLE `event_registrations`
  ADD COLUMN `organization` VARCHAR(191) NULL,
  ADD COLUMN `phone_number` VARCHAR(191) NULL;

ALTER TABLE `attendances`
  ADD COLUMN `organization` VARCHAR(191) NULL,
  ADD COLUMN `phone_number` VARCHAR(191) NULL;

ALTER TABLE `meeting_participants`
  ADD COLUMN `organization` VARCHAR(191) NULL,
  ADD COLUMN `phone_number` VARCHAR(191) NULL;

ALTER TABLE `registration_import_rows`
  ADD COLUMN `organization` VARCHAR(191) NULL,
  ADD COLUMN `phone_number` VARCHAR(191) NULL;

ALTER TABLE `users`
  ADD COLUMN `organization` VARCHAR(191) NULL;

UPDATE `event_registrations` SET `organization` = `department` WHERE `organization` IS NULL;
UPDATE `attendances` SET `organization` = `department` WHERE `organization` IS NULL;
UPDATE `meeting_participants` SET `organization` = `department` WHERE `organization` IS NULL;
UPDATE `registration_import_rows` SET `organization` = `department` WHERE `organization` IS NULL;
UPDATE `users` SET `organization` = `department` WHERE `organization` IS NULL;

ALTER TABLE `event_registrations` DROP COLUMN `department`;
ALTER TABLE `attendances` DROP COLUMN `department`;
ALTER TABLE `meeting_participants` DROP COLUMN `department`;
ALTER TABLE `registration_import_rows` DROP COLUMN `department`;
ALTER TABLE `users` DROP COLUMN `department`;

CREATE INDEX `event_registrations_phone_number_idx` ON `event_registrations`(`phone_number`);
CREATE INDEX `meeting_participants_phone_number_idx` ON `meeting_participants`(`phone_number`);
