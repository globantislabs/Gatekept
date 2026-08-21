#!/usr/bin/env node
/**
 * NOTJUST Watr — Production Database Migration Script
 *
 * Connects to the production MySQL/MariaDB database and applies the schema
 * migration (adds billing columns, invoice table, product_id on Campaign/QrScan,
 * subscription_price on Product, removes brand/flavor/category).
 *
 * Usage:
 *   bun run db:migrate-production
 *
 * Or with a custom DATABASE_URL:
 *   DATABASE_URL="mysql://user:pass@host:3306/db" bun run db:migrate-production
 *
 * The script is IDEMPOTENT — safe to run multiple times. It ignores
 * "Duplicate column" and "Table already exists" errors.
 */

const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

// ─── Load DATABASE_URL — prioritize .env.production (MySQL) over .env (SQLite) ───
function loadDbUrl() {
  // 1. Try .env.production first (has MySQL URL on Plesk)
  const envFiles = ['.env.production', '.env']
  for (const file of envFiles) {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      const match = content.match(/^DATABASE_URL=(.+)$/m)
      if (match) {
        const url = match[1].trim().replace(/^["']|["']$/g, '')
        if (url.startsWith('mysql://')) {
          console.log(`📄 Loaded MySQL DATABASE_URL from ${file}`)
          return url
        }
      }
    }
  }

  // 2. Check env var (must be MySQL)
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('mysql://')) {
    console.log('📄 Loaded MySQL DATABASE_URL from environment')
    return process.env.DATABASE_URL
  }

  console.error('❌ No MySQL DATABASE_URL found in .env.production or .env')
  console.error('')
  console.error('   To fix:')
  console.error('   1. Ensure .env.production exists with:')
  console.error('      DATABASE_URL=mysql://user:pass@host:3306/dbname')
  console.error('   2. Or pass it directly:')
  console.error('      DATABASE_URL="mysql://..." bun run db:migrate-production')
  process.exit(1)
}

// ─── Parse MySQL connection URL ───
function parseMysqlUrl(url) {
  const match = url.match(/^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/)
  if (!match) {
    console.error(`❌ Could not parse MySQL URL: ${url}`)
    process.exit(1)
  }
  return {
    host: match[3],
    port: parseInt(match[4], 10),
    user: match[1],
    password: match[2],
    database: match[5].split('?')[0],
  }
}

// ─── Migration statements (plain SQL, each is a separate statement) ───
const MIGRATION_STATEMENTS = [
  // Drop brand/flavor from Product
  { sql: 'ALTER TABLE `Product` DROP COLUMN `brand`', ignore: ['column does not exist', 'Unknown column'] },
  { sql: 'ALTER TABLE `Product` DROP COLUMN `flavor`', ignore: ['column does not exist', 'Unknown column'] },

  // Add subscription_price to Product
  { sql: 'ALTER TABLE `Product` ADD COLUMN `subscription_price` DOUBLE NULL', ignore: ['Duplicate column', 'already exists'] },

  // Drop category from ProductQuiz
  { sql: 'ALTER TABLE `ProductQuiz` DROP COLUMN `category`', ignore: ['column does not exist', 'Unknown column'] },

  // Add product_id to Campaign
  { sql: 'ALTER TABLE `Campaign` ADD COLUMN `product_id` VARCHAR(30) NULL', ignore: ['Duplicate column', 'already exists'] },

  // Add product_id to QrScan
  { sql: 'ALTER TABLE `QrScan` ADD COLUMN `product_id` VARCHAR(30) NULL', ignore: ['Duplicate column', 'already exists'] },

  // Order: billing columns
  { sql: 'ALTER TABLE `Order` ADD COLUMN `billing_name` VARCHAR(255) NULL', ignore: ['Duplicate column', 'already exists'] },
  { sql: 'ALTER TABLE `Order` ADD COLUMN `billing_phone` VARCHAR(20) NULL', ignore: ['Duplicate column', 'already exists'] },
  { sql: 'ALTER TABLE `Order` ADD COLUMN `billing_email` VARCHAR(191) NULL', ignore: ['Duplicate column', 'already exists'] },
  { sql: 'ALTER TABLE `Order` ADD COLUMN `billing_address` TEXT NULL', ignore: ['Duplicate column', 'already exists'] },
  { sql: 'ALTER TABLE `Order` ADD COLUMN `billing_city` VARCHAR(100) NULL', ignore: ['Duplicate column', 'already exists'] },
  { sql: 'ALTER TABLE `Order` ADD COLUMN `billing_state` VARCHAR(100) NULL', ignore: ['Duplicate column', 'already exists'] },
  { sql: 'ALTER TABLE `Order` ADD COLUMN `billing_pincode` VARCHAR(10) NULL', ignore: ['Duplicate column', 'already exists'] },
  { sql: 'ALTER TABLE `Order` ADD COLUMN `shipping_email` VARCHAR(191) NULL', ignore: ['Duplicate column', 'already exists'] },
  { sql: 'ALTER TABLE `Order` ADD COLUMN `same_as_billing` BOOLEAN NULL', ignore: ['Duplicate column', 'already exists'] },
  { sql: 'ALTER TABLE `Order` ADD COLUMN `invoice_number` VARCHAR(50) NULL', ignore: ['Duplicate column', 'already exists'] },
  { sql: 'ALTER TABLE `Order` ADD COLUMN `invoice_generated_at` DATETIME NULL', ignore: ['Duplicate column', 'already exists'] },

  // Unique index on Order.invoice_number
  { sql: 'ALTER TABLE `Order` ADD UNIQUE INDEX `Order_invoice_number_key`(`invoice_number`)', ignore: ['Duplicate key name', 'already exists'] },

  // Create Invoice table
  { sql: `CREATE TABLE IF NOT EXISTS \`Invoice\` (
    \`id\` VARCHAR(30) NOT NULL,
    \`order_id\` VARCHAR(30) NOT NULL,
    \`invoice_number\` VARCHAR(50) NOT NULL,
    \`user_id\` VARCHAR(30) NOT NULL,
    \`customer_name\` VARCHAR(255) NOT NULL,
    \`customer_phone\` VARCHAR(20) NULL,
    \`customer_email\` VARCHAR(191) NULL,
    \`billing_address\` TEXT NULL,
    \`billing_city\` VARCHAR(100) NULL,
    \`billing_state\` VARCHAR(100) NULL,
    \`billing_pincode\` VARCHAR(10) NULL,
    \`items\` TEXT NULL,
    \`subtotal\` DOUBLE NOT NULL DEFAULT 0,
    \`tax_amount\` DOUBLE NOT NULL DEFAULT 0,
    \`discount_amount\` DOUBLE NOT NULL DEFAULT 0,
    \`total_amount\` DOUBLE NOT NULL DEFAULT 0,
    \`payment_method\` VARCHAR(50) NULL,
    \`payment_status\` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    \`status\` VARCHAR(50) NOT NULL DEFAULT 'ISSUED',
    \`notes\` TEXT NULL,
    \`pdf_url\` TEXT NULL,
    \`issued_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    UNIQUE INDEX \`Invoice_order_id_key\`(\`order_id\`),
    UNIQUE INDEX \`Invoice_invoice_number_key\`(\`invoice_number\`),
    INDEX \`Invoice_user_id_idx\`(\`user_id\`),
    INDEX \`Invoice_invoice_number_idx\`(\`invoice_number\`),
    INDEX \`Invoice_status_idx\`(\`status\`),
    INDEX \`Invoice_issued_at_idx\`(\`issued_at\`),
    CONSTRAINT \`Invoice_order_id_fkey\` FOREIGN KEY (\`order_id\`) REFERENCES \`Order\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT \`Invoice_user_id_fkey\` FOREIGN KEY (\`user_id\`) REFERENCES \`UserProfile\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`, ignore: ['already exists'] },

  // Add indexes for Campaign and QrScan product_id
  { sql: 'ALTER TABLE `Campaign` ADD INDEX `Campaign_product_id_idx`(`product_id`)', ignore: ['Duplicate key name', 'already exists'] },
  { sql: 'ALTER TABLE `QrScan` ADD INDEX `QrScan_product_id_idx`(`product_id`)', ignore: ['Duplicate key name', 'already exists'] },
]

async function main() {
  const dbUrl = loadDbUrl()
  const config = parseMysqlUrl(dbUrl)

  console.log('═' .repeat(60))
  console.log('  NOTJUST Watr — Production Database Migration')
  console.log('═' .repeat(60))
  console.log(`  Host:     ${config.host}:${config.port}`)
  console.log(`  Database: ${config.database}`)
  console.log(`  User:     ${config.user}`)
  console.log('─' .repeat(60))
  console.log(`  Total statements: ${MIGRATION_STATEMENTS.length}`)
  console.log('═' .repeat(60))
  console.log('')

  let connection
  try {
    connection = await mysql.createConnection(config)
    console.log('✅ Connected to MySQL database\n')

    let success = 0
    let skipped = 0
    let failed = 0

    for (let i = 0; i < MIGRATION_STATEMENTS.length; i++) {
      const { sql, ignore = [] } = MIGRATION_STATEMENTS[i]
      const label = sql.length > 70 ? sql.substring(0, 67) + '...' : sql

      try {
        await connection.execute(sql)
        console.log(`  [${i + 1}/${MIGRATION_STATEMENTS.length}] ✅ ${label}`)
        success++
      } catch (err) {
        const errMsg = (err.message || '').toLowerCase()
        const isIgnorable = ignore.some(phrase => errMsg.includes(phrase.toLowerCase()))
        if (isIgnorable) {
          console.log(`  [${i + 1}/${MIGRATION_STATEMENTS.length}] ⏭️  ${label} (already exists — skipped)`)
          skipped++
        } else {
          console.error(`  [${i + 1}/${MIGRATION_STATEMENTS.length}] ❌ ${label}`)
          console.error(`     Error: ${err.message}`)
          failed++
        }
      }
    }

    console.log('')
    console.log('═' .repeat(60))
    console.log(`  Migration complete!`)
    console.log(`  ✅ Applied:  ${success}`)
    console.log(`  ⏭️  Skipped:  ${skipped} (already existed)`)
    if (failed > 0) {
      console.log(`  ❌ Failed:   ${failed}`)
      console.log('  Review the errors above and fix manually if needed.')
    } else {
      console.log('  No errors. Your database is now in sync with the schema.')
    }
    console.log('═' .repeat(60))

    // Verify: check if billing_name exists now
    const [rows] = await connection.execute(
      `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Order' AND COLUMN_NAME = 'billing_name'`,
      [config.database]
    )
    const billingExists = rows[0]?.cnt > 0
    console.log(`\n  Verification: Order.billing_name column exists = ${billingExists ? '✅ YES' : '❌ NO'}`)

    if (billingExists) {
      console.log('\n  🎉 Admin panel will now load without 500 errors.')
    } else {
      console.log('\n  ⚠️  billing_name still missing — check for errors above.')
    }

  } catch (err) {
    console.error(`\n❌ Connection failed: ${err.message}`)
    console.error('   Make sure you are running this on the Plesk server where MySQL is accessible.')
    process.exit(1)
  } finally {
    if (connection) await connection.end()
  }
}

main()
