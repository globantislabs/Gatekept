-- ════════════════════════════════════════════════════════════════════
-- NOTJUST Watr — Database Migration for phpMyAdmin (MariaDB/MySQL)
-- ════════════════════════════════════════════════════════════════════
-- HOW TO USE:
--   1. Open phpMyAdmin
--   2. Select your database (notjustwatrdb) from the left sidebar
--   3. Click the "SQL" tab at the top
--   4. Copy ALL the text below (from the first ALTER to the last SELECT)
--   5. Paste it into the SQL box
--   6. Click "Go" (bottom right)
--   7. You'll see "Your SQL query has been executed successfully"
--
-- This script is IDEMPOTENT — safe to run multiple times.
-- Uses MariaDB IF EXISTS / IF NOT EXISTS syntax (no errors on re-run).
-- ════════════════════════════════════════════════════════════════════


-- ─── Product table: drop brand/flavor, add subscription_price ───
ALTER TABLE `Product` DROP COLUMN IF EXISTS `brand`;
ALTER TABLE `Product` DROP COLUMN IF EXISTS `flavor`;
ALTER TABLE `Product` ADD COLUMN IF NOT EXISTS `subscription_price` DOUBLE NULL;

-- ─── ProductQuiz: drop category ───
ALTER TABLE `ProductQuiz` DROP COLUMN IF EXISTS `category`;

-- ─── Campaign: add product_id ───
ALTER TABLE `Campaign` ADD COLUMN IF NOT EXISTS `product_id` VARCHAR(30) NULL;

-- ─── QrScan: add product_id ───
ALTER TABLE `QrScan` ADD COLUMN IF NOT EXISTS `product_id` VARCHAR(30) NULL;

-- ─── Order table: add billing + shipping_email + invoice columns ───
ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `billing_name` VARCHAR(255) NULL;
ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `billing_phone` VARCHAR(20) NULL;
ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `billing_email` VARCHAR(191) NULL;
ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `billing_address` TEXT NULL;
ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `billing_city` VARCHAR(100) NULL;
ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `billing_state` VARCHAR(100) NULL;
ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `billing_pincode` VARCHAR(10) NULL;
ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `shipping_email` VARCHAR(191) NULL;
ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `same_as_billing` BOOLEAN NULL;
ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `invoice_number` VARCHAR(50) NULL;
ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `invoice_generated_at` DATETIME NULL;

-- ─── Order: unique index on invoice_number ───
ALTER TABLE `Order` ADD UNIQUE INDEX IF NOT EXISTS `Order_invoice_number_key` (`invoice_number`);

-- ─── Campaign: index on product_id ───
ALTER TABLE `Campaign` ADD INDEX IF NOT EXISTS `Campaign_product_id_idx` (`product_id`);

-- ─── QrScan: index on product_id ───
ALTER TABLE `QrScan` ADD INDEX IF NOT EXISTS `QrScan_product_id_idx` (`product_id`);

-- ─── Create Invoice table ───
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
  UNIQUE INDEX `Invoice_order_id_key` (`order_id`),
  UNIQUE INDEX `Invoice_invoice_number_key` (`invoice_number`),
  INDEX `Invoice_user_id_idx` (`user_id`),
  INDEX `Invoice_invoice_number_idx` (`invoice_number`),
  INDEX `Invoice_status_idx` (`status`),
  INDEX `Invoice_issued_at_idx` (`issued_at`),
  CONSTRAINT `Invoice_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `Order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Invoice_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `UserProfile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Done! Verify ───
SELECT '✅ Migration complete! billing_name exists:' AS status,
       (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Order' AND COLUMN_NAME = 'billing_name') AS billing_name_present,
       (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Invoice') AS invoice_table_present;

-- ─── Order: campaign_id (campaign attribution for conversion tracking) ───
ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `campaign_id` VARCHAR(30) NULL;
ALTER TABLE `Order` ADD INDEX IF NOT EXISTS `Order_campaign_id_idx` (`campaign_id`);
