ALTER TABLE `users` ADD COLUMN `organization` VARCHAR(191) NULL;

UPDATE `event_registrations` SET `organization` = `department` WHERE `organization` IS NULL;
UPDATE `attendances` SET `organization` = `department` WHERE `organization` IS NULL;
UPDATE `meeting_participants` SET `organization` = `department` WHERE `organization` IS NULL;
UPDATE `registration_import_rows` SET `organization` = `department` WHERE `organization` IS NULL;
UPDATE `users` SET `organization` = `department` WHERE `organization` IS NULL;
