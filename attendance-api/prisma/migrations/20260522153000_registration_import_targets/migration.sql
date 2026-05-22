ALTER TABLE `registration_imports`
  ADD COLUMN `target` ENUM('EVENT', 'MEETING') NOT NULL DEFAULT 'EVENT';
