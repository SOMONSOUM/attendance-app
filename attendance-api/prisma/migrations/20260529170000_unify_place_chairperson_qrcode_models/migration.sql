-- DropForeignKey
ALTER TABLE `attendances` DROP FOREIGN KEY `attendances_place_id_fkey`;

-- DropForeignKey
ALTER TABLE `event_places` DROP FOREIGN KEY `event_places_catalog_place_id_fkey`;

-- DropForeignKey
ALTER TABLE `event_places` DROP FOREIGN KEY `event_places_event_id_fkey`;

-- DropForeignKey
ALTER TABLE `event_registrations` DROP FOREIGN KEY `event_registrations_place_id_fkey`;

-- DropForeignKey
ALTER TABLE `meeting_chairpersons` DROP FOREIGN KEY `meeting_chairpersons_catalog_chairperson_id_fkey`;

-- DropForeignKey
ALTER TABLE `meeting_chairpersons` DROP FOREIGN KEY `meeting_chairpersons_meeting_id_fkey`;

-- DropForeignKey
ALTER TABLE `meeting_participants` DROP FOREIGN KEY `meeting_participants_place_id_fkey`;

-- DropForeignKey
ALTER TABLE `meeting_places` DROP FOREIGN KEY `meeting_places_catalog_place_id_fkey`;

-- DropForeignKey
ALTER TABLE `meeting_places` DROP FOREIGN KEY `meeting_places_meeting_id_fkey`;

-- DropForeignKey
ALTER TABLE `meeting_qr_codes` DROP FOREIGN KEY `meeting_qr_codes_meeting_id_fkey`;

-- DropForeignKey
ALTER TABLE `meeting_qr_codes` DROP FOREIGN KEY `meeting_qr_codes_place_id_fkey`;

-- DropForeignKey
ALTER TABLE `places` DROP FOREIGN KEY `places_tenant_id_fkey`;

-- DropForeignKey
ALTER TABLE `qr_codes` DROP FOREIGN KEY `qr_codes_place_id_fkey`;

-- DropIndex
DROP INDEX `places_tenant_id_name_key` ON `places`;

-- AlterTable
ALTER TABLE `chairpersons` ADD COLUMN `catalog_chairperson_id` VARCHAR(191) NULL,
    ADD COLUMN `meeting_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `meetings` ALTER COLUMN `mode` DROP DEFAULT;

-- AlterTable
ALTER TABLE `places` ADD COLUMN `catalog_place_id` VARCHAR(191) NULL,
    ADD COLUMN `event_id` VARCHAR(191) NULL,
    ADD COLUMN `meeting_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `qr_codes` ADD COLUMN `meeting_id` VARCHAR(191) NULL,
    ADD COLUMN `target` ENUM('EVENT', 'MEETING') NOT NULL DEFAULT 'EVENT',
    MODIFY `event_id` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `event_places`;

-- DropTable
DROP TABLE `meeting_chairpersons`;

-- DropTable
DROP TABLE `meeting_places`;

-- DropTable
DROP TABLE `meeting_qr_codes`;

-- CreateIndex
CREATE INDEX `chairpersons_meeting_id_idx` ON `chairpersons`(`meeting_id`);

-- CreateIndex
CREATE INDEX `chairpersons_catalog_chairperson_id_idx` ON `chairpersons`(`catalog_chairperson_id`);

-- CreateIndex
CREATE INDEX `places_event_id_idx` ON `places`(`event_id`);

-- CreateIndex
CREATE INDEX `places_meeting_id_idx` ON `places`(`meeting_id`);

-- CreateIndex
CREATE INDEX `places_catalog_place_id_idx` ON `places`(`catalog_place_id`);

-- CreateIndex
CREATE INDEX `qr_codes_meeting_id_idx` ON `qr_codes`(`meeting_id`);

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `places` ADD CONSTRAINT `places_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `places` ADD CONSTRAINT `places_meeting_id_fkey` FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `places` ADD CONSTRAINT `places_catalog_place_id_fkey` FOREIGN KEY (`catalog_place_id`) REFERENCES `places`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chairpersons` ADD CONSTRAINT `chairpersons_meeting_id_fkey` FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chairpersons` ADD CONSTRAINT `chairpersons_catalog_chairperson_id_fkey` FOREIGN KEY (`catalog_chairperson_id`) REFERENCES `chairpersons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qr_codes` ADD CONSTRAINT `qr_codes_meeting_id_fkey` FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qr_codes` ADD CONSTRAINT `qr_codes_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meeting_participants` ADD CONSTRAINT `meeting_participants_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `qr_codes` RENAME INDEX `qr_codes_event_id_fkey` TO `qr_codes_event_id_idx`;
