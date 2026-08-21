#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * NOTJUST Watr — Create/Update Admin User
 *
 * Creates or updates the admin user with the specified credentials.
 *
 * Usage:
 *   bun run db:seed-admin              (uses SQLite local)
 *   DATABASE_URL="mysql://..." bun run db:seed-admin  (production MySQL)
 */

const crypto = require('crypto')
const path = require('path')
const fs = require('fs')

// ─── Admin credentials ───
const ADMIN = {
  name: 'Zh-OneHealth Admin',
  email: 'info@zh-onehealth.com',
  phone: '7994004422',
  password: 'Zh-OneHealth@2929',
  user_id: 'admin_zh_onehealth',
  is_admin: true,
  country: 'India',
  state: 'Karnataka',
}

// SHA-256 hash (same as the app's hashPassword function)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

async function main() {
  // Dynamically import Prisma client
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()

  try {
    const passwordHash = hashPassword(ADMIN.password)

    // Check if admin exists (by email)
    const existing = await prisma.userProfile.findUnique({
      where: { email: ADMIN.email },
    })

    if (existing) {
      // Update existing user to admin
      await prisma.userProfile.update({
        where: { email: ADMIN.email },
        data: {
          name: ADMIN.name,
          phone: ADMIN.phone,
          password_hash: passwordHash,
          is_admin: true,
          state: ADMIN.state,
        },
      })
      console.log('✅ Admin user updated:')
    } else {
      // Create new admin user
      await prisma.userProfile.create({
        data: {
          user_id: ADMIN.user_id,
          name: ADMIN.name,
          email: ADMIN.email,
          phone: ADMIN.phone,
          password_hash: passwordHash,
          is_admin: true,
          country: ADMIN.country,
          state: ADMIN.state,
        },
      })
      console.log('✅ Admin user created:')
    }

    console.log('═'.repeat(60))
    console.log(`  Email:    ${ADMIN.email}`)
    console.log(`  Password: ${ADMIN.password}`)
    console.log(`  Phone:    ${ADMIN.phone}`)
    console.log(`  Name:     ${ADMIN.name}`)
    console.log(`  Admin:    ${ADMIN.is_admin ? 'YES' : 'NO'}`)
    console.log('═'.repeat(60))
    console.log('  Login at: /login (or /auth-login)')
    console.log('')
  } catch (err) {
    console.error('❌ Error:', err.message)
    if (err.code === 'P2002') {
      console.error('   (Unique constraint violation — a user with this email/phone already exists with different credentials)')
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
