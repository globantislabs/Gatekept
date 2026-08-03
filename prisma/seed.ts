import { db } from '../src/lib/db'
import { createHash } from 'crypto'

async function seed() {
  console.log('🌱 Seeding database...')

  // ─── Admin User ────────────────────────────────────────
  const adminId = 'usr_admin_001'
  // Hash the admin password with SHA-256 before storing
  const adminPasswordHash = createHash('sha256').update('admin123').digest('hex')
  await db.userProfile.upsert({
    where: { user_id: adminId },
    update: { password_hash: adminPasswordHash }, // Always update to ensure hash is current
    create: {
      id: 'usr_001',
      user_id: adminId,
      name: 'Admin',
      age: 35,
      gender: 'male',
      phone: '+919876543210',
      email: 'admin@notjustwatr.com',
      country: 'India',
      state: 'Maharashtra',
      learning_completed: true,
      is_admin: true,
      password_hash: adminPasswordHash, // SHA-256 hashed, not plain text
    },
  })

  // ─── Demo Users ────────────────────────────────────────
  const users = [
    { id: 'usr_002', user_id: 'user_priya', name: 'Priya Sharma', age: 42, gender: 'female', phone: '+919812345678', email: 'priya@email.com', country: 'India', state: 'Karnataka', learning_completed: true },
    { id: 'usr_003', user_id: 'user_rajesh', name: 'Rajesh Kumar', age: 55, gender: 'male', phone: '+919823456789', email: 'rajesh@email.com', country: 'India', state: 'Tamil Nadu', learning_completed: true },
    { id: 'usr_004', user_id: 'user_anita', name: 'Anita Desai', age: 38, gender: 'female', phone: '+919834567890', email: 'anita@email.com', country: 'India', state: 'Delhi', learning_completed: false },
    { id: 'usr_005', user_id: 'user_vikram', name: 'Vikram Patel', age: 47, gender: 'male', phone: '+919845678901', email: 'vikram@email.com', country: 'India', state: 'Gujarat', learning_completed: true },
    { id: 'usr_006', user_id: 'user_meera', name: 'Meera Nair', age: 33, gender: 'female', email: 'meera@email.com', country: 'India', state: 'Kerala', learning_completed: false },
    { id: 'usr_007', user_id: 'user_suresh', name: 'Suresh Menon', age: 60, gender: 'male', phone: '+919867890123', email: 'suresh@email.com', country: 'India', state: 'Goa', learning_completed: true },
    { id: 'usr_008', user_id: 'user_deepa', name: 'Deepa Iyer', age: 29, gender: 'female', phone: '+919878901234', country: 'India', state: 'Maharashtra', learning_completed: false },
    { id: 'usr_009', user_id: 'user_arjun', name: 'Arjun Reddy', age: 51, gender: 'male', phone: '+919889012345', email: 'arjun@email.com', country: 'India', state: 'Telangana', learning_completed: true },
    { id: 'usr_010', user_id: 'user_kavita', name: 'Kavita Joshi', age: 44, gender: 'female', phone: '+919890123456', email: 'kavita@email.com', country: 'India', state: 'Rajasthan', learning_completed: true },
  ]

  for (const u of users) {
    await db.userProfile.upsert({
      where: { user_id: u.user_id },
      update: {},
      create: u,
    })
  }

  // ─── Products ──────────────────────────────────────────
  const fizzProduct = await db.product.upsert({
    where: { slug: 'notjust-watr-fizz' },
    update: {},
    create: {
      id: 'prod_001',
      name: 'NOTJUST Watr Fizz',
      slug: 'notjust-watr-fizz',
      description: 'Sparkling 50 ml pre-meal wellness shots designed to help reduce the GI impact of carbohydrate-rich meals. Available as a Monthly Pack with 60 shots for daily use.',
      short_description: 'Sparkling pre-meal wellness shot for glycemic support',
      price: 2999,
      mrp: 3499,
      stock: 500,
      image_url: '/images/product-fizz.webp',
      type: 'FIZZ',
      category: 'Wellness Shot',
      sku: 'NJW-FIZZ-060',
      weight: '50ml per shot, 60 shots',
      ingredients: 'Carbonated water, apple cider vinegar, green tea extract, chromium picolinate, natural flavors',
      nutrition_info: 'Calories: 0, Sugar: 0g, Sodium: 5mg per 50ml shot',
      tags: 'sugar-free, zero-calorie, carbonated, pre-meal',
      active: true,
      featured: true,
      brand: 'NOTJUST',
      flavor: 'Original Sparkling',
      serving_size: '50ml (1 shot)',
      allergen_info: 'Contains apple cider vinegar. May contain traces of sulphites.',
      storage_info: 'Store in a cool, dry place away from direct sunlight. Refrigerate after opening.',
      shelf_life: '12 months from manufacture',
      country_origin: 'India',
      fssai_license: 'FSSAI-12345678000123',
      hsn_code: '2202',
      gst_rate: 18,
      min_order_qty: 1,
      max_order_qty: 10,
      discount_label: 'Launch Offer',
      highlights: 'Zero sugar, Zero calories, Pre-meal glycemic support, 60 shots per pack, Carbonated',
    },
  })

  const stillProduct = await db.product.upsert({
    where: { slug: 'notjust-watr-still' },
    update: {},
    create: {
      id: 'prod_002',
      name: 'NOTJUST Watr Still',
      slug: 'notjust-watr-still',
      description: 'Still 50 ml pre-meal wellness shots designed to support healthy blood sugar management. Available with an eco-friendly refill pack that is sustainable and affordable.',
      short_description: 'Smooth non-carbonated wellness shot for daily health',
      price: 2499,
      mrp: 2999,
      stock: 300,
      image_url: '/images/product-still.webp',
      type: 'STILL',
      category: 'Wellness Shot',
      sku: 'NJW-STIL-014',
      weight: '50ml per shot, 14 shots per pack',
      ingredients: 'Purified water, apple cider vinegar, gymnema sylvestre, fenugreek extract, natural flavors',
      nutrition_info: 'Calories: 0, Sugar: 0g, Sodium: 3mg per 50ml shot',
      tags: 'sugar-free, zero-calorie, still, eco-friendly',
      active: true,
      featured: false,
      brand: 'NOTJUST',
      flavor: 'Original Still',
      serving_size: '50ml (1 shot)',
      allergen_info: 'Contains apple cider vinegar and fenugreek. May contain traces of sulphites.',
      storage_info: 'Store in a cool, dry place away from direct sunlight. Refrigerate after opening.',
      shelf_life: '12 months from manufacture',
      country_origin: 'India',
      fssai_license: 'FSSAI-12345678000124',
      hsn_code: '2202',
      gst_rate: 18,
      min_order_qty: 1,
      max_order_qty: 10,
      discount_label: 'Eco Save',
      highlights: 'Zero sugar, Zero calories, Eco-friendly refill pack, Gymnema & Fenugreek extract, 14 shots per pack',
    },
  })

  // ─── Product Videos ────────────────────────────────────
  const fizzVideos = [
    { id: 'vid_fizz_1', product_id: fizzProduct.id, title: 'What is NOTJUST Watr Fizz?', duration: '3:30', description: 'Introduction to the NOTJUST Watr Fizz wellness shot — what it is, how it works, and why it matters for your health.', order: 1, video_url: '', active: true },
    { id: 'vid_fizz_2', product_id: fizzProduct.id, title: 'How to Use NOTJUST Watr Fizz', duration: '4:15', description: 'Step-by-step guide on when and how to consume your NOTJUST Watr Fizz shot before meals for optimal results.', order: 2, video_url: '', active: true },
    { id: 'vid_fizz_3', product_id: fizzProduct.id, title: 'The Science Behind NOTJUST Watr Fizz', duration: '5:00', description: 'Deep dive into the science of glycemic control — how apple cider vinegar, chromium, and green tea extract work together.', order: 3, video_url: '', active: true },
  ]

  const stillVideos = [
    { id: 'vid_still_1', product_id: stillProduct.id, title: 'What is NOTJUST Watr Still?', duration: '3:45', description: 'Introduction to the NOTJUST Watr Still wellness shot — smooth, non-carbonated, and packed with natural extracts.', order: 1, video_url: '', active: true },
    { id: 'vid_still_2', product_id: stillProduct.id, title: 'How to Use NOTJUST Watr Still', duration: '4:00', description: 'How to incorporate NOTJUST Watr Still into your daily routine for the best health outcomes.', order: 2, video_url: '', active: true },
    { id: 'vid_still_3', product_id: stillProduct.id, title: 'The Science Behind NOTJUST Watr Still', duration: '5:15', description: 'Understanding gymnema sylvestre and fenugreek extracts — ancient wisdom meets modern wellness science.', order: 3, video_url: '', active: true },
  ]

  for (const v of [...fizzVideos, ...stillVideos]) {
    await db.productVideo.upsert({
      where: { id: v.id },
      update: {},
      create: v,
    })
  }

  // ─── Product Quiz Questions (5 per video = 80% threshold = 4 correct needed) ──
  const fizzQuizzes = [
    // After Video 1 — Introduction
    { id: 'quiz_fizz_1a', product_id: fizzProduct.id, video_id: 'vid_fizz_1', question: 'When should you consume the NOTJUST pre-meal shot?', options: JSON.stringify(['After dinner', 'Before a meal', 'During exercise', 'Before sleeping']), answer: 1, category: 'usage', difficulty: 'EASY', order: 1, active: true },
    { id: 'quiz_fizz_1b', product_id: fizzProduct.id, video_id: 'vid_fizz_1', question: 'What is NOTJUST Watr Fizz primarily designed for?', options: JSON.stringify(['Weight loss', 'Glycemic control — reducing sugar spikes', 'Muscle building', 'Better sleep']), answer: 1, category: 'science', difficulty: 'EASY', order: 2, active: true },
    { id: 'quiz_fizz_1c', product_id: fizzProduct.id, video_id: 'vid_fizz_1', question: 'How many shots are in the NOTJUST Watr Fizz monthly pack?', options: JSON.stringify(['30', '45', '60', '90']), answer: 2, category: 'product', difficulty: 'EASY', order: 3, active: true },
    { id: 'quiz_fizz_1d', product_id: fizzProduct.id, video_id: 'vid_fizz_1', question: 'NOTJUST Watr Fizz is a carbonated beverage.', options: JSON.stringify(['False', 'True', 'Only slightly', 'It depends on the flavor']), answer: 1, category: 'product', difficulty: 'EASY', order: 4, active: true },
    { id: 'quiz_fizz_1e', product_id: fizzProduct.id, video_id: 'vid_fizz_1', question: 'What type of meal is NOTJUST Watr most effective before?', options: JSON.stringify(['A protein-only meal', 'A carbohydrate-rich meal', 'A fat-only meal', 'An empty stomach']), answer: 1, category: 'science', difficulty: 'MEDIUM', order: 5, active: true },
    // After Video 2 — Usage
    { id: 'quiz_fizz_2a', product_id: fizzProduct.id, video_id: 'vid_fizz_2', question: 'What is the recommended usage frequency?', options: JSON.stringify(['Once a week', 'Once before each main meal', 'Only on weekends', 'Three times a day regardless of meals']), answer: 1, category: 'usage', difficulty: 'EASY', order: 1, active: true },
    { id: 'quiz_fizz_2b', product_id: fizzProduct.id, video_id: 'vid_fizz_2', question: 'What should you do if you miss a dose before a meal?', options: JSON.stringify(['Double the next dose', 'Take it as soon as you remember, or skip and take before next meal', 'Stop entirely', 'Take it after the meal instead']), answer: 1, category: 'usage', difficulty: 'MEDIUM', order: 2, active: true },
    { id: 'quiz_fizz_2c', product_id: fizzProduct.id, video_id: 'vid_fizz_2', question: 'How long before a meal should you take the shot?', options: JSON.stringify(['1 hour before', 'Immediately before (5-15 minutes)', 'After the first bite', 'The night before']), answer: 1, category: 'usage', difficulty: 'EASY', order: 3, active: true },
    { id: 'quiz_fizz_2d', product_id: fizzProduct.id, video_id: 'vid_fizz_2', question: 'Can NOTJUST Watr Fizz be taken with other beverages?', options: JSON.stringify(['No, never', 'Yes, it can be taken alongside water or other drinks', 'Only with milk', 'Only with juice']), answer: 1, category: 'usage', difficulty: 'MEDIUM', order: 4, active: true },
    { id: 'quiz_fizz_2e', product_id: fizzProduct.id, video_id: 'vid_fizz_2', question: 'What is the recommended storage for opened NOTJUST Watr Fizz?', options: JSON.stringify(['Freezer', 'Room temperature only', 'Refrigerate after opening', 'Direct sunlight']), answer: 2, category: 'product', difficulty: 'EASY', order: 5, active: true },
    // After Video 3 — Science
    { id: 'quiz_fizz_3a', product_id: fizzProduct.id, video_id: 'vid_fizz_3', question: 'The NOTJUST shot works by:', options: JSON.stringify(['Replacing meals', 'Slowing carbohydrate absorption', 'Increasing insulin production', 'Eliminating sugar from food']), answer: 1, category: 'science', difficulty: 'MEDIUM', order: 1, active: true },
    { id: 'quiz_fizz_3b', product_id: fizzProduct.id, video_id: 'vid_fizz_3', question: 'Which ingredient in NOTJUST Watr Fizz helps with glycemic control?', options: JSON.stringify(['Caffeine', 'Apple cider vinegar', 'Artificial sweeteners', 'Protein isolate']), answer: 1, category: 'science', difficulty: 'EASY', order: 2, active: true },
    { id: 'quiz_fizz_3c', product_id: fizzProduct.id, video_id: 'vid_fizz_3', question: 'Chromium picolinate in the shot helps with:', options: JSON.stringify(['Bone density', 'Insulin sensitivity', 'Muscle growth', 'Digestion']), answer: 1, category: 'science', difficulty: 'MEDIUM', order: 3, active: true },
    { id: 'quiz_fizz_3d', product_id: fizzProduct.id, video_id: 'vid_fizz_3', question: 'Green tea extract in NOTJUST Watr Fizz provides:', options: JSON.stringify(['Caffeine boost only', 'Antioxidants that support metabolic health', 'Artificial flavoring', 'Color enhancement']), answer: 1, category: 'science', difficulty: 'MEDIUM', order: 4, active: true },
    { id: 'quiz_fizz_3e', product_id: fizzProduct.id, video_id: 'vid_fizz_3', question: 'The glycemic index (GI) measures:', options: JSON.stringify(['How much protein is in food', 'How quickly a food raises blood sugar', 'How many calories a food has', 'How much fat is in food']), answer: 1, category: 'science', difficulty: 'HARD', order: 5, active: true },
  ]

  const stillQuizzes = [
    // After Video 1 — Introduction
    { id: 'quiz_still_1a', product_id: stillProduct.id, video_id: 'vid_still_1', question: 'What makes NOTJUST Watr Still different from Fizz?', options: JSON.stringify(['It is carbonated', 'It is non-carbonated and smooth', 'It has more calories', 'It is only for athletes']), answer: 1, category: 'product', difficulty: 'EASY', order: 1, active: true },
    { id: 'quiz_still_1b', product_id: stillProduct.id, video_id: 'vid_still_1', question: 'Which natural extract is unique to NOTJUST Watr Still?', options: JSON.stringify(['Green tea extract', 'Gymnema sylvestre', 'Chromium picolinate', 'Caffeine']), answer: 1, category: 'product', difficulty: 'EASY', order: 2, active: true },
    { id: 'quiz_still_1c', product_id: stillProduct.id, video_id: 'vid_still_1', question: 'NOTJUST Watr Still is best described as:', options: JSON.stringify(['A sports drink', 'A smooth non-carbonated wellness shot', 'A meal replacement', 'A protein shake']), answer: 1, category: 'product', difficulty: 'EASY', order: 3, active: true },
    { id: 'quiz_still_1d', product_id: stillProduct.id, video_id: 'vid_still_1', question: 'What is the primary benefit of NOTJUST Watr Still?', options: JSON.stringify(['Energy boost', 'Supports healthy blood sugar management', 'Weight loss overnight', 'Muscle recovery']), answer: 1, category: 'science', difficulty: 'EASY', order: 4, active: true },
    { id: 'quiz_still_1e', product_id: stillProduct.id, video_id: 'vid_still_1', question: 'Which pack type is available for NOTJUST Watr Still?', options: JSON.stringify(['Only single shots', 'Eco-friendly refill pack', 'Large bottle only', 'No packaging']), answer: 1, category: 'product', difficulty: 'MEDIUM', order: 5, active: true },
    // After Video 2 — Usage
    { id: 'quiz_still_2a', product_id: stillProduct.id, video_id: 'vid_still_2', question: 'How many shots are in the eco-friendly refill pack?', options: JSON.stringify(['30', '60', '14', '90']), answer: 2, category: 'product', difficulty: 'EASY', order: 1, active: true },
    { id: 'quiz_still_2b', product_id: stillProduct.id, video_id: 'vid_still_2', question: 'What does glycemic control help with?', options: JSON.stringify(['Hair growth', 'Blood sugar management after meals', 'Skin complexion', 'Eye health']), answer: 1, category: 'science', difficulty: 'EASY', order: 2, active: true },
    { id: 'quiz_still_2c', product_id: stillProduct.id, video_id: 'vid_still_2', question: 'When is the best time to take NOTJUST Watr Still?', options: JSON.stringify(['Before bed', 'Before a meal', 'After exercise', 'First thing in morning']), answer: 1, category: 'usage', difficulty: 'EASY', order: 3, active: true },
    { id: 'quiz_still_2d', product_id: stillProduct.id, video_id: 'vid_still_2', question: 'The eco-friendly refill pack is designed to be:', options: JSON.stringify(['More expensive', 'Sustainable and affordable', 'Single-use only', 'Disposable']), answer: 1, category: 'product', difficulty: 'MEDIUM', order: 4, active: true },
    { id: 'quiz_still_2e', product_id: stillProduct.id, video_id: 'vid_still_2', question: 'NOTJUST Watr Still can be consumed by people who are sensitive to:', options: JSON.stringify(['Carbonation', 'Protein', 'Fiber', 'Fat']), answer: 0, category: 'product', difficulty: 'MEDIUM', order: 5, active: true },
    // After Video 3 — Science
    { id: 'quiz_still_3a', product_id: stillProduct.id, video_id: 'vid_still_3', question: 'Gymnema sylvestre is known as:', options: JSON.stringify(['The sugar destroyer', 'The protein builder', 'The fat burner', 'The sleep inducer']), answer: 0, category: 'science', difficulty: 'EASY', order: 1, active: true },
    { id: 'quiz_still_3b', product_id: stillProduct.id, video_id: 'vid_still_3', question: 'Fenugreek extract helps with:', options: JSON.stringify(['Skin health', 'Blood sugar regulation and digestion', 'Bone strength', 'Eye sight']), answer: 1, category: 'science', difficulty: 'EASY', order: 2, active: true },
    { id: 'quiz_still_3c', product_id: stillProduct.id, video_id: 'vid_still_3', question: 'Apple cider vinegar in NOTJUST Watr Still works by:', options: JSON.stringify(['Adding flavor only', 'Slowing gastric emptying and reducing glucose absorption', 'Providing calories', 'Increasing appetite']), answer: 1, category: 'science', difficulty: 'MEDIUM', order: 3, active: true },
    { id: 'quiz_still_3d', product_id: stillProduct.id, video_id: 'vid_still_3', question: 'The combination of gymnema and fenugreek is:', options: JSON.stringify(['A modern invention', 'Rooted in traditional Ayurvedic medicine', 'Only used in cosmetics', 'A weight loss formula']), answer: 1, category: 'science', difficulty: 'MEDIUM', order: 4, active: true },
    { id: 'quiz_still_3e', product_id: stillProduct.id, video_id: 'vid_still_3', question: 'What does "pre-meal wellness" mean in the context of NOTJUST?', options: JSON.stringify(['Eating before exercise', 'Taking a wellness shot before eating to support glycemic response', 'Skipping meals entirely', 'A type of diet plan']), answer: 1, category: 'science', difficulty: 'HARD', order: 5, active: true },
  ]

  for (const q of [...fizzQuizzes, ...stillQuizzes]) {
    await db.productQuiz.upsert({
      where: { id: q.id },
      update: {},
      create: q,
    })
  }

  // ─── Campaigns ─────────────────────────────────────────
  const campaigns = [
    { id: 'camp_001', name: 'Taj Palace Mumbai Launch', channel: 'HOTEL', partner_name: 'Taj Hotels', location: 'Mumbai, Maharashtra', status: 'ACTIVE', start_date: new Date('2026-06-01'), end_date: new Date('2026-07-31') },
    { id: 'camp_002', name: 'Apollo Hospital Delhi', channel: 'HOSPITAL', partner_name: 'Apollo Hospitals', location: 'New Delhi, Delhi', status: 'ACTIVE', start_date: new Date('2026-06-05'), end_date: new Date('2026-08-05') },
    { id: 'camp_003', name: 'Wellness Expo Bangalore', channel: 'EVENT', partner_name: 'Wellness India Expo', location: 'Bangalore, Karnataka', status: 'ACTIVE', start_date: new Date('2026-06-10'), end_date: new Date('2026-06-12') },
    { id: 'camp_004', name: 'Dr. Rao Clinic Program', channel: 'CLINIC', partner_name: 'Dr. Rao Wellness Clinic', location: 'Hyderabad, Telangana', status: 'ACTIVE', start_date: new Date('2026-06-01'), end_date: new Date('2026-12-31') },
    { id: 'camp_005', name: 'Soul Spa Partnership', channel: 'WELLNESS', partner_name: 'Soul Spa & Wellness', location: 'Goa', status: 'ACTIVE', start_date: new Date('2026-06-15'), end_date: new Date('2026-09-15') },
    { id: 'camp_006', name: 'Infosys Corporate Health', channel: 'CORPORATE', partner_name: 'Infosys Ltd', location: 'Bangalore, Karnataka', status: 'ACTIVE', start_date: new Date('2026-06-01'), end_date: new Date('2026-06-30') },
    { id: 'camp_007', name: 'Dr. Mehta Referral Network', channel: 'DOCTOR', partner_name: 'Dr. Anil Mehta', location: 'Mumbai, Maharashtra', status: 'ACTIVE', start_date: new Date('2026-06-01'), end_date: new Date('2026-12-31') },
    { id: 'camp_008', name: 'FitInfluencer Campaign', channel: 'INFLUENCER', partner_name: 'FitWithPriya (Instagram)', location: 'Pan India', status: 'ACTIVE', start_date: new Date('2026-06-10'), end_date: new Date('2026-07-10') },
    { id: 'camp_009', name: 'Old Pharmacy Trial', channel: 'HOSPITAL', partner_name: 'City Pharmacy', location: 'Chennai, Tamil Nadu', status: 'ARCHIVED', start_date: new Date('2026-05-01'), end_date: new Date('2026-05-31') },
  ]

  for (const c of campaigns) {
    await db.campaign.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    })
  }

  // ─── Learning Progress for completed users ─────────────
  const completedUsers = ['usr_002', 'usr_003', 'usr_005', 'usr_007', 'usr_009', 'usr_010']
  for (const uid of completedUsers) {
    const user = await db.userProfile.findUnique({ where: { id: uid } })
    if (user) {
      await db.productLearningProgress.upsert({
        where: { user_id_product_id: { user_id: uid, product_id: fizzProduct.id } },
        update: {},
        create: {
          user_id: uid,
          product_id: fizzProduct.id,
          video_progress: JSON.stringify({ vid_fizz_1: 100, vid_fizz_2: 100, vid_fizz_3: 100 }),
          quiz_answers: JSON.stringify({ quiz_fizz_1a: 1, quiz_fizz_1b: 1, quiz_fizz_1c: 2, quiz_fizz_1d: 1, quiz_fizz_1e: 1, quiz_fizz_2a: 1, quiz_fizz_2b: 1, quiz_fizz_2c: 1, quiz_fizz_2d: 1, quiz_fizz_2e: 2, quiz_fizz_3a: 1, quiz_fizz_3b: 1, quiz_fizz_3c: 1, quiz_fizz_3d: 1, quiz_fizz_3e: 1 }),
          quiz_completed: true,
          quiz_score: 15,
          status: 'COMPLETED',
          completed_at: new Date(),
        },
      })
    }
  }

  // ─── QR Scans ──────────────────────────────────────────
  const scans = [
    { id: 'scan_001', campaign_id: 'camp_001', user_id: 'usr_002', device: 'iPhone 15', location: 'Mumbai' },
    { id: 'scan_002', campaign_id: 'camp_001', device: 'Samsung Galaxy S24', location: 'Mumbai' },
    { id: 'scan_003', campaign_id: 'camp_002', user_id: 'usr_003', device: 'OnePlus 12', location: 'Delhi' },
    { id: 'scan_004', campaign_id: 'camp_002', user_id: 'usr_004', device: 'iPhone 14', location: 'Delhi' },
    { id: 'scan_005', campaign_id: 'camp_003', user_id: 'usr_005', device: 'Pixel 8', location: 'Bangalore' },
    { id: 'scan_006', campaign_id: 'camp_004', user_id: 'usr_007', device: 'Samsung Galaxy S23', location: 'Hyderabad' },
    { id: 'scan_007', campaign_id: 'camp_006', user_id: 'usr_009', device: 'iPhone 15 Pro', location: 'Bangalore' },
    { id: 'scan_008', campaign_id: 'camp_001', user_id: 'usr_010', device: 'Xiaomi 14', location: 'Mumbai' },
    { id: 'scan_009', campaign_id: 'camp_005', device: 'Unknown', location: 'Goa' },
    { id: 'scan_010', campaign_id: 'camp_003', device: 'iPad', location: 'Bangalore' },
  ]

  for (const s of scans) {
    await db.qrScan.upsert({
      where: { id: s.id },
      update: {},
      create: { ...s, created_at: new Date('2026-06-15') },
    })
  }

  console.log('✅ Seeding complete!')
  console.log(`  Users: ${await db.userProfile.count()}`)
  console.log(`  Products: ${await db.product.count()}`)
  console.log(`  Videos: ${await db.productVideo.count()}`)
  console.log(`  Quizzes: ${await db.productQuiz.count()}`)
  console.log(`  Campaigns: ${await db.campaign.count()}`)
  console.log(`  QR Scans: ${await db.qrScan.count()}`)
  console.log(`  Learning Progress: ${await db.productLearningProgress.count()}`)
}

seed()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })
