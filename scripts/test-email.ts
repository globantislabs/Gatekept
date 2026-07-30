// NOTJUST Watr — Email Test Script
// Run with: bun run scripts/test-email.ts
// This script tests email sending using picasocode@gmail.com as the test recipient
// ONLY use this for testing — in production, real customer emails are used

import { emailService } from '../src/lib/email-service'

const TEST_EMAIL = 'picasocode@gmail.com'

async function main() {
  console.log('🧪 NOTJUST Watr — Email Test Script')
  console.log('=====================================')
  console.log(`Test recipient: ${TEST_EMAIL}`)
  console.log(`Email service configured: ${emailService.isConfigured()}`)
  console.log('')

  if (!emailService.isConfigured()) {
    console.log('⚠️  No SMTP configured — emails will be logged to console only')
    console.log('   Set ZOHO_EMAIL and ZOHO_PASSWORD in .env to send real emails')
    console.log('')
  }

  // Test 1: OTP Email
  console.log('📧 Test 1: Sending OTP verification email...')
  const otpResult = await emailService.sendOtpEmail(TEST_EMAIL, '123456')
  console.log(`   Result: ${otpResult.success ? '✅ Success' : '❌ Failed'}`)
  console.log(`   Message: ${otpResult.message}`)
  console.log('')

  // Test 2: Password Reset Email
  console.log('📧 Test 2: Sending password reset email...')
  const resetResult = await emailService.sendPasswordResetEmail(TEST_EMAIL, '654321')
  console.log(`   Result: ${resetResult.success ? '✅ Success' : '❌ Failed'}`)
  console.log(`   Message: ${resetResult.message}`)
  console.log('')

  // Test 3: Order Placed Email
  console.log('📧 Test 3: Sending order placed email...')
  const orderResult = await emailService.sendOrderPlacedEmail(TEST_EMAIL, {
    orderNumber: 'TEST-001',
    totalAmount: 599,
    items: 'NOTJUST WATER™ Pre-Meal Wellness Shot x1',
  })
  console.log(`   Result: ${orderResult.success ? '✅ Success' : '❌ Failed'}`)
  console.log(`   Message: ${orderResult.message}`)
  console.log('')

  // Test 4: Login Notification Email
  console.log('📧 Test 4: Sending login notification email...')
  const loginResult = await emailService.sendLoginNotificationEmail(TEST_EMAIL, {
    name: 'Test User',
    time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    device: 'Chrome on Windows',
  })
  console.log(`   Result: ${loginResult.success ? '✅ Success' : '❌ Failed'}`)
  console.log(`   Message: ${loginResult.message}`)
  console.log('')

  console.log('✅ Email test complete!')
  console.log('')
  console.log('NOTE: This script uses picasocode@gmail.com for testing ONLY.')
  console.log('In production, real customer emails are sent automatically.')
}

main().catch(console.error)
