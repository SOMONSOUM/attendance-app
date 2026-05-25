ALTER TABLE `event_registrations`
  ADD COLUMN `check_in_code` VARCHAR(191) NULL;

ALTER TABLE `meeting_participants`
  ADD COLUMN `check_in_code` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `event_registrations_check_in_code_key` ON `event_registrations`(`check_in_code`);
CREATE UNIQUE INDEX `meeting_participants_check_in_code_key` ON `meeting_participants`(`check_in_code`);
