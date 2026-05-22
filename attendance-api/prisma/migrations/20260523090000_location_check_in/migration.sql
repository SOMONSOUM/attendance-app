ALTER TABLE `events`
  ADD COLUMN `require_location` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `meetings`
  ADD COLUMN `require_location` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `latitude` DECIMAL(10, 7) NOT NULL DEFAULT 0,
  ADD COLUMN `longitude` DECIMAL(10, 7) NOT NULL DEFAULT 0,
  ADD COLUMN `radius_meters` INTEGER NOT NULL DEFAULT 0;

ALTER TABLE `meeting_participants`
  ADD COLUMN `latitude` DECIMAL(10, 7) NULL,
  ADD COLUMN `longitude` DECIMAL(10, 7) NULL,
  ADD COLUMN `distance_meters` INTEGER NOT NULL DEFAULT 0;
