ALTER TABLE `event_places`
  ADD COLUMN `require_location` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `latitude` DECIMAL(10, 7) NULL,
  ADD COLUMN `longitude` DECIMAL(10, 7) NULL,
  ADD COLUMN `radius_meters` INTEGER NOT NULL DEFAULT 0;

ALTER TABLE `meeting_places`
  ADD COLUMN `require_location` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `latitude` DECIMAL(10, 7) NULL,
  ADD COLUMN `longitude` DECIMAL(10, 7) NULL,
  ADD COLUMN `radius_meters` INTEGER NOT NULL DEFAULT 0;
