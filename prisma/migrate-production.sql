-- ════════════════════════════════════════════════════════════════════
-- NOTJUST Watr — Database Migration Script (MySQL / Plesk)
-- Run this in phpMyAdmin > notjustwatr_com database > SQL tab
-- Safe to run multiple times — checks if column exists before adding
-- ════════════════════════════════════════════════════════════════════

-- Drop brand and flavor from Product (if they exist)
ALTER TABLE `Product` DROP COLUMN IF EXISTS `brand`;
ALTER TABLE `Product` DROP COLUMN IF EXISTS `flavor`;

-- Add subscription_price to Product (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Product' AND COLUMN_NAME = 'subscription_price');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Product` ADD COLUMN `subscription_price` DOUBLE NULL', 'SELECT "subscription_price already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPREPARE stmt;

-- Drop category from ProductQuiz (if exists)
ALTER TABLE `ProductQuiz` DROP COLUMN IF EXISTS `category`;

-- Add product_id to Campaign (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Campaign' AND COLUMN_NAME = 'product_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Campaign` ADD COLUMN `product_id` VARCHAR(30) NULL', 'SELECT "Campaign.product_id already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPREPARE stmt;

-- Add product_id to QrScan (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'QrScan' AND COLUMN_NAME = 'product_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `QrScan` ADD COLUMN `product_id` VARCHAR(30) NULL', 'SELECT "QrScan.product_id already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPREPARE stmt;

-- ═══ Order table: add billing + shipping_email + invoice columns ═══

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Order' AND COLUMN_NAME = 'billing_name');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Order` ADD COLUMN `billing_name` VARCHAR(255) NULL', 'SELECT "billing_name exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Order' AND COLUMN_NAME = 'billing_phone');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Order` ADD COLUMN `billing_phone` VARCHAR(20) NULL', 'SELECT "billing_phone exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Order' AND COLUMN_NAME = 'billing_email');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Order` ADD COLUMN `billing_email` VARCHAR(191) NULL', 'SELECT "billing_email exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Order' AND COLUMN_NAME = 'billing_address');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Order` ADD COLUMN `billing_address` TEXT NULL', 'SELECT "billing_address exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Order' AND COLUMN_NAME = 'billing_city');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Order` ADD COLUMN `billing_city` VARCHAR(100) NULL', 'SELECT "billing_city exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Order' AND COLUMN_NAME = 'billing_state');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Order` ADD COLUMN `billing_state` VARCHAR(100) NULL', 'SELECT "billing_state exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Order' AND COLUMN_NAME = 'billing_pincode');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Order` ADD COLUMN `billing_pincode` VARCHAR(10) NULL', 'SELECT "billing_pincode exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPREPARE stmt;

-- shipping_email (was missing before)
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Order' AND COLUMN_NAME = 'shipping_email');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Order` ADD COLUMN `shipping_email` VARCHAR(191) NULL', 'SELECT "shipping_email exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPREPARE stmt;

-- same_as_billing
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Order' AND COLUMN_NAME = 'same_as_billing');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Order` ADD COLUMN `same_as_billing` BOOLEAN NULL', 'SELECT "same_as_billing exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPREPARE stmt;

-- invoice_number + invoice_generated_at on Order
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Order' AND COLUMN_NAME = 'invoice_number');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Order` ADD COLUMN `invoice_number` VARCHAR(50) NULL', 'SELECT "invoice_number exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Order' AND COLUMN_NAME = 'invoice_generated_at');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Order` ADD COLUMN `invoice_generated_at` DATETIME NULL', 'SELECT "invoice_generated_at exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPREPARE stmt;

-- Add unique index on Order.invoice_number (if not exists)
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Order' AND INDEX_NAME = 'Order_invoice_number_key');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE `Order` ADD UNIQUE INDEX `Order_invoice_number_key`(`invoice_number`)', 'SELECT "index exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPREPARE stmt;

-- ═══ Create Invoice table (if not exists) ═══

CREATE TABLE IF NOT EXISTS `Invoice` (
  `id` VARCHAR(30) NOT NULL,
  `order_id` VARCHAR(30) NOT NULL,
  `invoice_number` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(30) NOT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_phone` VARCHAR(20) NULL,
  `customer_email` VARCHAR(191) NULL,
  `billing_address` TEXT NULL,
  `billing_city` VARCHAR(100) NULL,
  `billing_state` VARCHAR(100) NULL,
  `billing_pincode` VARCHAR(10) NULL,
  `items` TEXT NULL,
  `subtotal` DOUBLE NOT NULL DEFAULT 0,
  `tax_amount` DOUBLE NOT NULL DEFAULT 0,
  `discount_amount` DOUBLE NOT NULL DEFAULT 0,
  `total_amount` DOUBLE NOT NULL DEFAULT 0,
  `payment_method` VARCHAR(50) NULL,
  `payment_status` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  `status` VARCHAR(50) NOT NULL DEFAULT 'ISSUED',
  `notes` TEXT NULL,
  `pdf_url` TEXT NULL,
  `issued_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Invoice_order_id_key`(`order_id`),
  UNIQUE INDEX `Invoice_invoice_number_key`(`invoice_number`),
  INDEX `Invoice_user_id_idx`(`user_id`),
  INDEX `Invoice_invoice_number_idx`(`invoice_number`),
  INDEX `Invoice_status_idx`(`status`),
  INDEX `Invoice_issued_at_idx`(`issued_at`),
  CONSTRAINT `Invoice_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Invoice_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `UserProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add Campaign.product_id foreign key index (if not exists)
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Campaign' AND INDEX_NAME = 'Campaign_product_id_idx');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE `Campaign` ADD INDEX `Campaign_product_id_idx`(`product_id`)', 'SELECT "index exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPREPARE stmt;

-- Add QrScan.product_id index (if not exists)
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'QrScan' AND INDEX_NAME = 'QrScan_product_id_idx');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE `QrScan` ADD INDEX `QrScan_product_id_idx`(`product_id`)', 'SELECT "index exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPREPARE stmt;

-- Done!
SELECT 'Migration completed successfully!' AS result;
