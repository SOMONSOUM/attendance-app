CREATE TABLE `registration_imports` (
  `id` VARCHAR(191) NOT NULL,
  `file_name` VARCHAR(191) NOT NULL,
  `original_name` VARCHAR(191) NOT NULL,
  `row_count` INTEGER NOT NULL DEFAULT 0,
  `status` VARCHAR(191) NOT NULL DEFAULT 'IMPORTED',
  `uploaded_by_id` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  INDEX `registration_imports_uploaded_by_id_idx`(`uploaded_by_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `registration_import_rows` (
  `id` VARCHAR(191) NOT NULL,
  `import_id` VARCHAR(191) NOT NULL,
  `full_name_en` VARCHAR(191) NOT NULL,
  `full_name_km` VARCHAR(191) NULL,
  `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL,
  `position` VARCHAR(191) NULL,
  `department` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  INDEX `registration_import_rows_import_id_full_name_en_idx`(`import_id`, `full_name_en`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `registration_imports`
  ADD CONSTRAINT `registration_imports_uploaded_by_id_fkey`
  FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `registration_import_rows`
  ADD CONSTRAINT `registration_import_rows_import_id_fkey`
  FOREIGN KEY (`import_id`) REFERENCES `registration_imports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
