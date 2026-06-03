ALTER TABLE `events` DROP FOREIGN KEY `events_card_template_id_fkey`;
ALTER TABLE `meetings` DROP FOREIGN KEY `meetings_card_template_id_fkey`;

DROP INDEX `events_card_template_id_idx` ON `events`;
DROP INDEX `meetings_card_template_id_idx` ON `meetings`;

ALTER TABLE `events` DROP COLUMN `card_template_id`;
ALTER TABLE `meetings` DROP COLUMN `card_template_id`;

DROP TABLE IF EXISTS `event_card_designs`;
DROP TABLE IF EXISTS `meeting_card_designs`;
DROP TABLE IF EXISTS `card_templates`;
