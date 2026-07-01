// Mock Supabase Data Layer
// This provides a complete in-memory + localStorage implementation
// that mirrors the Supabase JS API. When real Supabase credentials
// are configured, the app switches to the real backend seamlessly.

export interface UserProfile {
  id: string
  user_id: string
  name: string
  age?: number
  gender?: string
  phone?: string
  email?: string
  country: string
  state?: string
  learning_completed: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  name: string
  channel: string
  partner_name?: string
  location?: string
  start_date?: string
  end_date?: string
  status: string
  created_at: string
}

export interface QrScan {
  id: string
  campaign_id?: string
  user_id?: string
  device?: string
  location?: string
  created_at: string
}

export interface LearningProgress {
  id: string
  user_id: string
  video_progress: Record<string, number>
  quiz_completed: boolean
  quiz_score: number
  completed_at?: string
  created_at: string
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  answer: number
  category?: string
  difficulty: string
  active: boolean
}

export interface Product {
  id: string
  name: string
  description?: string
  short_description?: string
  price: number
  mrp?: number
  stock: number
  image_url?: string
  gallery_images?: string
  type: string
  category?: string
  sku?: string
  weight?: string
  ingredients?: string
  nutrition_info?: string
  tags?: string
  active: boolean
  featured?: boolean
  brand?: string
  flavor?: string
  serving_size?: string
  allergen_info?: string
  storage_info?: string
  shelf_life?: string
  country_origin?: string
  fssai_license?: string
  hsn_code?: string
  gst_rate?: number
  min_order_qty?: number
  max_order_qty?: number
  discount_label?: string
  highlights?: string
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  status: string
  amount: number
  payment_gateway?: string
  payment_id?: string
  shipping_address?: any
  created_at: string
  updated_at: string
  items?: OrderItem[]
  user?: UserProfile
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  product?: Product
}

export interface ProductVideo {
  id: string
  product_id: string
  title: string
  duration: string
  description: string
  order: number  // sequence within product
  video_url?: string
  active: boolean
}

export interface ProductQuiz {
  id: string
  product_id: string
  video_id: string  // linked to which video
  question: string
  options: string[]
  answer: number
  category?: string
  difficulty: string
  order: number
  active: boolean
}

export interface ProductLearningProgress {
  id: string
  user_id: string
  product_id: string
  video_progress: Record<string, number>  // videoId -> percentage
  quiz_answers: Record<string, number>  // quizId -> selectedOptionIndex
  quiz_completed: boolean
  quiz_score: number
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'PENDING_REEVALUATION' | 'COMPLETED' | 'UNLOCKED'
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  product_id: string
  pack_type: string  // 30_DAY, 60_DAY, 90_DAY, 180_DAY, CUSTOM
  pack_duration_days: number
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED'
  amount: number
  start_date: string
  end_date: string
  auto_renew: boolean
  payment_id?: string
  created_at: string
  updated_at: string
}

export interface ReorderReminder {
  id: string
  user_id: string
  subscription_id: string
  product_id: string
  reminder_date: string
  channel: string  // WHATSAPP, EMAIL, SMS, PUSH
  status: 'PENDING' | 'SENT' | 'DISMISSED'
  message: string
  created_at: string
}

type TableName = 'users_profile' | 'campaigns' | 'qr_scans' | 'learning_progress' | 'quiz_questions' | 'products' | 'orders' | 'order_items' | 'product_videos' | 'product_quizzes' | 'product_learning_progress' | 'subscriptions' | 'reorder_reminders'

// ============================================================
// Data Store with localStorage persistence
// ============================================================
class MockDataStore {
  private data: Record<TableName, any[]> = {
    users_profile: [],
    campaigns: [],
    qr_scans: [],
    learning_progress: [],
    quiz_questions: [],
    products: [],
    orders: [],
    order_items: [],
    product_videos: [],
    product_quizzes: [],
    product_learning_progress: [],
    subscriptions: [],
    reorder_reminders: [],
  }

  constructor() {
    this.load()
  }

  private load() {
    if (typeof window === 'undefined') return
    try {
      const storedVersion = localStorage.getItem('notjust_mock_db_version')
      const currentVersion = 'v9' // Increment when seed data changes
      if (storedVersion === currentVersion) {
        const stored = localStorage.getItem('notjust_mock_db')
        if (stored) {
          this.data = JSON.parse(stored)
          return
        }
      }
      // Version mismatch or first load — reseed
      this.seed()
      localStorage.setItem('notjust_mock_db_version', currentVersion)
    } catch {
      this.seed()
    }
  }

  private save() {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('notjust_mock_db', JSON.stringify(this.data))
    } catch { /* ignore */ }
  }

  seed() {
    const now = new Date().toISOString()

    // Admin user
    this.data.users_profile = [
      {
        id: 'usr_001',
        user_id: 'admin_001',
        name: 'Admin',
        age: 35,
        gender: 'male',
        phone: '+919876543210',
        email: 'admin@notjust.com',
        country: 'India',
        state: 'Maharashtra',
        learning_completed: true,
        is_admin: true,
        created_at: '2026-06-01T10:00:00Z',
        updated_at: now,
      },
    ]

    // Demo users
    const demoUsers: UserProfile[] = [
      { id: 'usr_002', user_id: 'user_002', name: 'Priya Sharma', age: 42, gender: 'female', phone: '+919812345678', email: 'priya@email.com', country: 'India', state: 'Karnataka', learning_completed: true, is_admin: false, created_at: '2026-06-05T08:30:00Z', updated_at: now },
      { id: 'usr_003', user_id: 'user_003', name: 'Rajesh Kumar', age: 55, gender: 'male', phone: '+919823456789', email: 'rajesh@email.com', country: 'India', state: 'Tamil Nadu', learning_completed: true, is_admin: false, created_at: '2026-06-06T14:20:00Z', updated_at: now },
      { id: 'usr_004', user_id: 'user_004', name: 'Anita Desai', age: 38, gender: 'female', phone: '+919834567890', email: 'anita@email.com', country: 'India', state: 'Delhi', learning_completed: false, is_admin: false, created_at: '2026-06-08T09:15:00Z', updated_at: now },
      { id: 'usr_005', user_id: 'user_005', name: 'Vikram Patel', age: 47, gender: 'male', phone: '+919845678901', email: 'vikram@email.com', country: 'India', state: 'Gujarat', learning_completed: true, is_admin: false, created_at: '2026-06-09T16:45:00Z', updated_at: now },
      { id: 'usr_006', user_id: 'user_006', name: 'Meera Nair', age: 33, gender: 'female', email: 'meera@email.com', country: 'India', state: 'Kerala', learning_completed: false, is_admin: false, created_at: '2026-06-10T11:00:00Z', updated_at: now },
      { id: 'usr_007', user_id: 'user_007', name: 'Suresh Menon', age: 60, gender: 'male', phone: '+919867890123', email: 'suresh@email.com', country: 'India', state: 'Goa', learning_completed: true, is_admin: false, created_at: '2026-06-11T13:30:00Z', updated_at: now },
      { id: 'usr_008', user_id: 'user_008', name: 'Deepa Iyer', age: 29, gender: 'female', phone: '+919878901234', country: 'India', state: 'Maharashtra', learning_completed: false, is_admin: false, created_at: '2026-06-12T07:20:00Z', updated_at: now },
      { id: 'usr_009', user_id: 'user_009', name: 'Arjun Reddy', age: 51, gender: 'male', phone: '+919889012345', email: 'arjun@email.com', country: 'India', state: 'Telangana', learning_completed: true, is_admin: false, created_at: '2026-06-13T10:10:00Z', updated_at: now },
      { id: 'usr_010', user_id: 'user_010', name: 'Kavita Joshi', age: 44, gender: 'female', phone: '+919890123456', email: 'kavita@email.com', country: 'India', state: 'Rajasthan', learning_completed: true, is_admin: false, created_at: '2026-06-13T15:40:00Z', updated_at: now },
    ]
    this.data.users_profile.push(...demoUsers)

    // Learning progress
    this.data.learning_progress = this.data.users_profile.map((u: UserProfile) => ({
      id: `lp_${u.id}`,
      user_id: u.user_id,
      video_progress: u.learning_completed ? { 'intro': 100, 'usage': 100, 'science': 100 } : u.id === 'usr_004' ? { 'intro': 100, 'usage': 60 } : u.id === 'usr_006' ? { 'intro': 30 } : {},
      quiz_completed: u.learning_completed,
      quiz_score: u.learning_completed ? 80 + Math.floor(Math.random() * 20) : 0,
      completed_at: u.learning_completed ? u.created_at : undefined,
      created_at: u.created_at,
    }))

    // Campaigns
    this.data.campaigns = [
      { id: 'camp_001', name: 'Taj Palace Mumbai Launch', channel: 'HOTEL', partner_name: 'Taj Hotels', location: 'Mumbai, Maharashtra', start_date: '2026-06-01', end_date: '2026-07-31', status: 'ACTIVE', created_at: '2026-06-01T08:00:00Z' },
      { id: 'camp_002', name: 'Apollo Hospital Delhi', channel: 'HOSPITAL', partner_name: 'Apollo Hospitals', location: 'New Delhi, Delhi', start_date: '2026-06-05', end_date: '2026-08-05', status: 'ACTIVE', created_at: '2026-06-05T09:00:00Z' },
      { id: 'camp_003', name: 'Wellness Expo Bangalore', channel: 'EVENT', partner_name: 'Wellness India Expo', location: 'Bangalore, Karnataka', start_date: '2026-06-10', end_date: '2026-06-12', status: 'ACTIVE', created_at: '2026-06-08T10:00:00Z' },
      { id: 'camp_004', name: 'Dr. Rao Clinic Program', channel: 'CLINIC', partner_name: 'Dr. Rao Wellness Clinic', location: 'Hyderabad, Telangana', start_date: '2026-06-01', end_date: '2026-12-31', status: 'ACTIVE', created_at: '2026-06-01T07:00:00Z' },
      { id: 'camp_005', name: 'Soul Spa Partnership', channel: 'WELLNESS', partner_name: 'Soul Spa & Wellness', location: 'Goa', start_date: '2026-06-15', end_date: '2026-09-15', status: 'ACTIVE', created_at: '2026-06-14T08:00:00Z' },
      { id: 'camp_006', name: 'Infosys Corporate Health', channel: 'CORPORATE', partner_name: 'Infosys Ltd', location: 'Bangalore, Karnataka', start_date: '2026-06-01', end_date: '2026-06-30', status: 'ACTIVE', created_at: '2026-05-28T12:00:00Z' },
      { id: 'camp_007', name: 'Dr. Mehta Referral Network', channel: 'DOCTOR', partner_name: 'Dr. Anil Mehta', location: 'Mumbai, Maharashtra', start_date: '2026-06-01', end_date: '2026-12-31', status: 'ACTIVE', created_at: '2026-06-01T06:00:00Z' },
      { id: 'camp_008', name: 'FitInfluencer Campaign', channel: 'INFLUENCER', partner_name: 'FitWithPriya (Instagram)', location: 'Pan India', start_date: '2026-06-10', end_date: '2026-07-10', status: 'ACTIVE', created_at: '2026-06-09T14:00:00Z' },
      { id: 'camp_009', name: 'Old Pharmacy Trial', channel: 'HOSPITAL', partner_name: 'City Pharmacy', location: 'Chennai, Tamil Nadu', start_date: '2026-05-01', end_date: '2026-05-31', status: 'ARCHIVED', created_at: '2026-04-28T08:00:00Z' },
    ]

    // QR Scans — 25 scans across campaigns and time range
    this.data.qr_scans = [
      { id: 'scan_001', campaign_id: 'camp_001', user_id: 'user_002', device: 'iPhone 15', location: 'Mumbai', created_at: '2026-05-03T08:30:00Z' },
      { id: 'scan_002', campaign_id: 'camp_001', device: 'Samsung Galaxy S24', location: 'Mumbai', created_at: '2026-05-05T09:15:00Z' },
      { id: 'scan_003', campaign_id: 'camp_002', user_id: 'user_003', device: 'OnePlus 12', location: 'Delhi', created_at: '2026-05-06T14:20:00Z' },
      { id: 'scan_004', campaign_id: 'camp_002', user_id: 'user_004', device: 'iPhone 14', location: 'Delhi', created_at: '2026-05-08T09:15:00Z' },
      { id: 'scan_005', campaign_id: 'camp_003', user_id: 'user_005', device: 'Pixel 8', location: 'Bangalore', created_at: '2026-05-10T10:00:00Z' },
      { id: 'scan_006', campaign_id: 'camp_004', user_id: 'user_007', device: 'Samsung Galaxy S23', location: 'Hyderabad', created_at: '2026-05-11T13:30:00Z' },
      { id: 'scan_007', campaign_id: 'camp_006', user_id: 'user_009', device: 'iPhone 15 Pro', location: 'Bangalore', created_at: '2026-05-12T10:00:00Z' },
      { id: 'scan_008', campaign_id: 'camp_001', user_id: 'user_010', device: 'Xiaomi 14', location: 'Mumbai', created_at: '2026-05-13T11:20:00Z' },
      { id: 'scan_009', campaign_id: 'camp_005', device: 'Unknown', location: 'Goa', created_at: '2026-05-14T08:30:00Z' },
      { id: 'scan_010', campaign_id: 'camp_003', device: 'iPad', location: 'Bangalore', created_at: '2026-05-16T09:00:00Z' },
      { id: 'scan_011', campaign_id: 'camp_007', user_id: 'user_002', device: 'iPhone 15', location: 'Mumbai', created_at: '2026-05-18T14:00:00Z' },
      { id: 'scan_012', campaign_id: 'camp_008', device: 'Samsung A54', location: 'Mumbai', created_at: '2026-05-20T16:00:00Z' },
      { id: 'scan_013', campaign_id: 'camp_001', user_id: 'user_004', device: 'iPhone 16', location: 'Mumbai', created_at: '2026-05-22T10:30:00Z' },
      { id: 'scan_014', campaign_id: 'camp_002', device: 'Samsung S25', location: 'Delhi', created_at: '2026-05-24T11:45:00Z' },
      { id: 'scan_015', campaign_id: 'camp_006', device: 'MacBook', location: 'Bangalore', created_at: '2026-05-26T09:20:00Z' },
      { id: 'scan_016', campaign_id: 'camp_005', user_id: 'user_007', device: 'Pixel 9', location: 'Goa', created_at: '2026-06-01T08:00:00Z' },
      { id: 'scan_017', campaign_id: 'camp_001', device: 'iPhone 15', location: 'Mumbai', created_at: '2026-06-02T09:30:00Z' },
      { id: 'scan_018', campaign_id: 'camp_004', device: 'OnePlus 13', location: 'Hyderabad', created_at: '2026-06-03T14:15:00Z' },
      { id: 'scan_019', campaign_id: 'camp_007', user_id: 'user_003', device: 'Samsung Galaxy S24', location: 'Mumbai', created_at: '2026-06-04T11:00:00Z' },
      { id: 'scan_020', campaign_id: 'camp_002', user_id: 'user_010', device: 'iPhone 14 Pro', location: 'Delhi', created_at: '2026-06-05T13:45:00Z' },
      { id: 'scan_021', campaign_id: 'camp_003', device: 'iPad Pro', location: 'Bangalore', created_at: '2026-06-07T10:00:00Z' },
      { id: 'scan_022', campaign_id: 'camp_008', user_id: 'user_005', device: 'Samsung S24 Ultra', location: 'Pan India', created_at: '2026-06-08T15:30:00Z' },
      { id: 'scan_023', campaign_id: 'camp_006', device: 'ThinkPad X1', location: 'Bangalore', created_at: '2026-06-09T08:45:00Z' },
      { id: 'scan_024', campaign_id: 'camp_001', user_id: 'user_009', device: 'Pixel 8a', location: 'Mumbai', created_at: '2026-06-10T12:00:00Z' },
      { id: 'scan_025', campaign_id: 'camp_005', device: 'Unknown', location: 'Goa', created_at: '2026-06-11T09:15:00Z' },
    ]

    // Quiz questions
    this.data.quiz_questions = [
      { id: 'qq_001', question: 'When should you consume the NotJust pre-meal shot?', options: ['After dinner', 'Before a meal', 'During exercise', 'Before sleeping'], answer: 1, category: 'usage', difficulty: 'EASY', active: true },
      { id: 'qq_002', question: 'What is the primary benefit of the NotJust shot?', options: ['Weight loss', 'Muscle building', 'Glycemic control - reducing sugar spikes', 'Better sleep'], answer: 2, category: 'science', difficulty: 'EASY', active: true },
      { id: 'qq_003', question: 'How many shots are in a Monthly Pack?', options: ['15', '30', '60', '90'], answer: 2, category: 'product', difficulty: 'EASY', active: true },
      { id: 'qq_004', question: 'What does glycemic control help with?', options: ['Hair growth', 'Blood sugar management after meals', 'Skin complexion', 'Eye health'], answer: 1, category: 'science', difficulty: 'MEDIUM', active: true },
      { id: 'qq_005', question: 'What is the recommended usage frequency?', options: ['Once a week', 'Once before each main meal', 'Only on weekends', 'Three times a day regardless of meals'], answer: 1, category: 'usage', difficulty: 'MEDIUM', active: true },
      { id: 'qq_006', question: 'The NotJust shot works by:', options: ['Replacing meals entirely', 'Slowing carbohydrate absorption in the digestive system', 'Increasing insulin production', 'Eliminating sugar from food'], answer: 1, category: 'science', difficulty: 'HARD', active: true },
      { id: 'qq_007', question: 'Which pack offers sustainable packaging?', options: ['Monthly Pack', 'Eco-Friendly Refill Pack', 'Trial Pack', 'Family Pack'], answer: 1, category: 'product', difficulty: 'EASY', active: true },
      { id: 'qq_008', question: 'What should you do if you miss a dose before a meal?', options: ['Double the next dose', 'Take it as soon as you remember, or skip and take before the next meal', 'Stop the course entirely', 'Take it after the meal instead'], answer: 1, category: 'usage', difficulty: 'MEDIUM', active: true },
    ]

    // Products
    this.data.products = [
      { id: 'prod_001', name: 'NOTJUST Watr Fizz', description: 'Sparkling 50 ml pre-meal wellness shots designed to help reduce the GI impact of carbohydrate-rich meals. Available as a Monthly Pack with 60 shots for daily use.', short_description: 'Sparkling pre-meal wellness shot for glycemic support', price: 2999, mrp: 3499, stock: 500, image_url: '/images/product-fizz.webp', gallery_images: '', type: 'FIZZ', category: 'Wellness Shot', sku: 'NJW-FIZZ-060', weight: '50ml per shot, 60 shots', ingredients: 'Carbonated water, apple cider vinegar, green tea extract, chromium picolinate, natural flavors', nutrition_info: 'Calories: 0, Sugar: 0g, Sodium: 5mg per 50ml shot', tags: 'sugar-free, zero-calorie, carbonated, pre-meal', active: true, featured: true, brand: 'NOTJUST', flavor: 'Original Sparkling', serving_size: '50ml (1 shot)', allergen_info: 'Contains apple cider vinegar. May contain traces of sulphites.', storage_info: 'Store in a cool, dry place away from direct sunlight. Refrigerate after opening.', shelf_life: '12 months from manufacture', country_origin: 'India', fssai_license: 'FSSAI-12345678000123', hsn_code: '2202', gst_rate: 18, min_order_qty: 1, max_order_qty: 10, discount_label: 'Launch Offer', highlights: 'Zero sugar, Zero calories, Pre-meal glycemic support, 60 shots per pack, Carbonated', created_at: '2026-06-01T00:00:00Z' },
      { id: 'prod_002', name: 'NOTJUST Watr Still', description: 'Still 50 ml pre-meal wellness shots designed to support healthy blood sugar management. Available with an eco-friendly refill pack that is sustainable and affordable.', short_description: 'Smooth non-carbonated wellness shot for daily health', price: 2499, mrp: 2999, stock: 300, image_url: '/images/product-still.webp', gallery_images: '', type: 'STILL', category: 'Wellness Shot', sku: 'NJW-STIL-014', weight: '50ml per shot, 14 shots per pack', ingredients: 'Purified water, apple cider vinegar, gymnema sylvestre, fenugreek extract, natural flavors', nutrition_info: 'Calories: 0, Sugar: 0g, Sodium: 3mg per 50ml shot', tags: 'sugar-free, zero-calorie, still, eco-friendly', active: true, featured: false, brand: 'NOTJUST', flavor: 'Original Still', serving_size: '50ml (1 shot)', allergen_info: 'Contains apple cider vinegar and fenugreek. May contain traces of sulphites.', storage_info: 'Store in a cool, dry place away from direct sunlight. Refrigerate after opening.', shelf_life: '12 months from manufacture', country_origin: 'India', fssai_license: 'FSSAI-12345678000124', hsn_code: '2202', gst_rate: 18, min_order_qty: 1, max_order_qty: 10, discount_label: 'Eco Save', highlights: 'Zero sugar, Zero calories, Eco-friendly refill pack, Gymnema & Fenugreek extract, 14 shots per pack', created_at: '2026-06-01T00:00:00Z' },
    ]

    // Orders — 18 orders covering all statuses and time range
    this.data.orders = [
      { id: 'ord_001', user_id: 'user_002', status: 'DELIVERED', amount: 2999, payment_gateway: 'RAZORPAY', payment_id: 'pay_rz_001', shipping_address: { name: 'Priya Sharma', line1: '42 MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001' }, created_at: '2026-05-02T10:30:00Z', updated_at: '2026-05-05T14:00:00Z' },
      { id: 'ord_002', user_id: 'user_003', status: 'DELIVERED', amount: 2499, payment_gateway: 'RAZORPAY', payment_id: 'pay_rz_002', shipping_address: { name: 'Rajesh Kumar', line1: '15 Anna Nagar', city: 'Chennai', state: 'Tamil Nadu', pincode: '600040' }, created_at: '2026-05-05T15:30:00Z', updated_at: '2026-05-08T09:00:00Z' },
      { id: 'ord_003', user_id: 'user_005', status: 'DELIVERED', amount: 2999, payment_gateway: 'RAZORPAY', payment_id: 'pay_rz_003', shipping_address: { name: 'Vikram Patel', line1: '78 CG Road', city: 'Ahmedabad', state: 'Gujarat', pincode: '380006' }, created_at: '2026-05-10T11:00:00Z', updated_at: '2026-05-13T11:05:00Z' },
      { id: 'ord_004', user_id: 'user_007', status: 'DELIVERED', amount: 2499, payment_gateway: 'RAZORPAY', payment_id: 'pay_rz_004', shipping_address: { name: 'Suresh Menon', line1: '23 Panaji Market', city: 'Panaji', state: 'Goa', pincode: '403001' }, created_at: '2026-05-14T14:00:00Z', updated_at: '2026-05-17T14:05:00Z' },
      { id: 'ord_005', user_id: 'user_002', status: 'DELIVERED', amount: 799, payment_gateway: 'RAZORPAY', payment_id: 'pay_rz_005', shipping_address: { name: 'Priya Sharma', line1: '42 MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001' }, created_at: '2026-05-18T09:20:00Z', updated_at: '2026-05-21T10:00:00Z' },
      { id: 'ord_006', user_id: 'user_009', status: 'DELIVERED', amount: 2999, payment_gateway: 'RAZORPAY', payment_id: 'pay_rz_006', shipping_address: { name: 'Arjun Reddy', line1: '56 Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033' }, created_at: '2026-05-22T16:45:00Z', updated_at: '2026-05-25T10:00:00Z' },
      { id: 'ord_007', user_id: 'user_010', status: 'DELIVERED', amount: 2499, payment_gateway: 'RAZORPAY', payment_id: 'pay_rz_007', shipping_address: { name: 'Kavita Joshi', line1: '9 MI Road', city: 'Jaipur', state: 'Rajasthan', pincode: '302001' }, created_at: '2026-05-26T11:30:00Z', updated_at: '2026-05-29T09:00:00Z' },
      { id: 'ord_008', user_id: 'user_003', status: 'SHIPPED', amount: 2999, payment_gateway: 'RAZORPAY', payment_id: 'pay_rz_008', shipping_address: { name: 'Rajesh Kumar', line1: '15 Anna Nagar', city: 'Chennai', state: 'Tamil Nadu', pincode: '600040' }, created_at: '2026-06-02T08:15:00Z', updated_at: '2026-06-04T07:00:00Z' },
      { id: 'ord_009', user_id: 'user_005', status: 'SHIPPED', amount: 2499, payment_gateway: 'RAZORPAY', payment_id: 'pay_rz_009', shipping_address: { name: 'Vikram Patel', line1: '78 CG Road', city: 'Ahmedabad', state: 'Gujarat', pincode: '380006' }, created_at: '2026-06-04T13:40:00Z', updated_at: '2026-06-06T11:00:00Z' },
      { id: 'ord_010', user_id: 'user_007', status: 'SHIPPED', amount: 799, payment_gateway: 'RAZORPAY', payment_id: 'pay_rz_010', shipping_address: { name: 'Suresh Menon', line1: '23 Panaji Market', city: 'Panaji', state: 'Goa', pincode: '403001' }, created_at: '2026-06-06T10:20:00Z', updated_at: '2026-06-08T09:00:00Z' },
      { id: 'ord_011', user_id: 'user_002', status: 'CONFIRMED', amount: 2999, payment_gateway: 'RAZORPAY', payment_id: 'pay_rz_011', shipping_address: { name: 'Priya Sharma', line1: '42 MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001' }, created_at: '2026-06-08T15:10:00Z', updated_at: '2026-06-08T15:15:00Z' },
      { id: 'ord_012', user_id: 'user_009', status: 'CONFIRMED', amount: 2499, payment_gateway: 'RAZORPAY', payment_id: 'pay_rz_012', shipping_address: { name: 'Arjun Reddy', line1: '56 Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033' }, created_at: '2026-06-09T09:45:00Z', updated_at: '2026-06-09T09:50:00Z' },
      { id: 'ord_013', user_id: 'user_010', status: 'CONFIRMED', amount: 2999, payment_gateway: 'RAZORPAY', payment_id: 'pay_rz_013', shipping_address: { name: 'Kavita Joshi', line1: '9 MI Road', city: 'Jaipur', state: 'Rajasthan', pincode: '302001' }, created_at: '2026-06-10T14:30:00Z', updated_at: '2026-06-10T14:35:00Z' },
      { id: 'ord_014', user_id: 'user_003', status: 'CONFIRMED', amount: 799, payment_gateway: 'RAZORPAY', payment_id: 'pay_rz_014', shipping_address: { name: 'Rajesh Kumar', line1: '15 Anna Nagar', city: 'Chennai', state: 'Tamil Nadu', pincode: '600040' }, created_at: '2026-06-11T08:00:00Z', updated_at: '2026-06-11T08:05:00Z' },
      { id: 'ord_015', user_id: 'user_005', status: 'PENDING', amount: 2999, payment_gateway: null, payment_id: null, shipping_address: { name: 'Vikram Patel', line1: '78 CG Road', city: 'Ahmedabad', state: 'Gujarat', pincode: '380006' }, created_at: '2026-06-12T11:20:00Z', updated_at: '2026-06-12T11:20:00Z' },
      { id: 'ord_016', user_id: 'user_007', status: 'PENDING', amount: 2499, payment_gateway: null, payment_id: null, shipping_address: { name: 'Suresh Menon', line1: '23 Panaji Market', city: 'Panaji', state: 'Goa', pincode: '403001' }, created_at: '2026-06-13T09:30:00Z', updated_at: '2026-06-13T09:30:00Z' },
      { id: 'ord_017', user_id: 'user_002', status: 'CANCELLED', amount: 799, payment_gateway: 'RAZORPAY', payment_id: 'pay_rz_017', shipping_address: { name: 'Priya Sharma', line1: '42 MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001' }, created_at: '2026-05-08T10:00:00Z', updated_at: '2026-05-09T08:00:00Z' },
      { id: 'ord_018', user_id: 'user_009', status: 'CANCELLED', amount: 2499, payment_gateway: 'RAZORPAY', payment_id: 'pay_rz_018', shipping_address: { name: 'Arjun Reddy', line1: '56 Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033' }, created_at: '2026-05-15T14:00:00Z', updated_at: '2026-05-16T10:00:00Z' },
    ]

    // Order items — one item per order, matching product prices
    this.data.order_items = [
      { id: 'oi_001', order_id: 'ord_001', product_id: 'prod_001', quantity: 1, price: 2999 },
      { id: 'oi_002', order_id: 'ord_002', product_id: 'prod_002', quantity: 1, price: 2499 },
      { id: 'oi_003', order_id: 'ord_003', product_id: 'prod_001', quantity: 1, price: 2999 },
      { id: 'oi_004', order_id: 'ord_004', product_id: 'prod_002', quantity: 1, price: 2499 },
      { id: 'oi_005', order_id: 'ord_005', product_id: 'prod_001', quantity: 1, price: 799 },
      { id: 'oi_006', order_id: 'ord_006', product_id: 'prod_001', quantity: 1, price: 2999 },
      { id: 'oi_007', order_id: 'ord_007', product_id: 'prod_002', quantity: 1, price: 2499 },
      { id: 'oi_008', order_id: 'ord_008', product_id: 'prod_001', quantity: 1, price: 2999 },
      { id: 'oi_009', order_id: 'ord_009', product_id: 'prod_002', quantity: 1, price: 2499 },
      { id: 'oi_010', order_id: 'ord_010', product_id: 'prod_001', quantity: 1, price: 799 },
      { id: 'oi_011', order_id: 'ord_011', product_id: 'prod_001', quantity: 1, price: 2999 },
      { id: 'oi_012', order_id: 'ord_012', product_id: 'prod_002', quantity: 1, price: 2499 },
      { id: 'oi_013', order_id: 'ord_013', product_id: 'prod_001', quantity: 1, price: 2999 },
      { id: 'oi_014', order_id: 'ord_014', product_id: 'prod_001', quantity: 1, price: 799 },
      { id: 'oi_015', order_id: 'ord_015', product_id: 'prod_001', quantity: 1, price: 2999 },
      { id: 'oi_016', order_id: 'ord_016', product_id: 'prod_002', quantity: 1, price: 2499 },
      { id: 'oi_017', order_id: 'ord_017', product_id: 'prod_001', quantity: 1, price: 799 },
      { id: 'oi_018', order_id: 'ord_018', product_id: 'prod_002', quantity: 1, price: 2499 },
    ]

    // ─── NEW: Product Videos (3 per product = 6 total) ───
    this.data.product_videos = [
      // Product 1: NOTJUST Watr Fizz
      { id: 'pvid_001', product_id: 'prod_001', title: 'Introduction to NOTJUST Watr Fizz', duration: '4:32', description: 'Learn what NOTJUST Watr Fizz is, how it works, and why pre-meal wellness shots are transforming glycemic health management.', order: 1, video_url: undefined, active: true },
      { id: 'pvid_002', product_id: 'prod_001', title: 'How to Use Fizz', duration: '3:15', description: 'A step-by-step guide on when and how to consume your NOTJUST Watr Fizz shot for maximum effectiveness before meals.', order: 2, video_url: undefined, active: true },
      { id: 'pvid_003', product_id: 'prod_001', title: 'Science Behind Fizz', duration: '5:48', description: 'Deep dive into the science of sparkling pre-meal shots — how carbonation and active ingredients slow carbohydrate absorption.', order: 3, video_url: undefined, active: true },
      // Product 2: NOTJUST Watr Still
      { id: 'pvid_004', product_id: 'prod_002', title: 'Introduction to NOTJUST Watr Still', duration: '4:10', description: 'Discover NOTJUST Watr Still — the gentle, non-carbonated pre-meal wellness shot designed for daily blood sugar support.', order: 1, video_url: undefined, active: true },
      { id: 'pvid_005', product_id: 'prod_002', title: 'How to Use Still', duration: '3:05', description: 'Learn the recommended usage pattern for NOTJUST Watr Still, including timing, dosage, and tips for best results.', order: 2, video_url: undefined, active: true },
      { id: 'pvid_006', product_id: 'prod_002', title: 'Science Behind Still', duration: '5:22', description: 'Explore the clinical science behind NOTJUST Watr Still and how its formulation supports healthy post-meal glycemic response.', order: 3, video_url: undefined, active: true },
    ]

    // ─── NEW: Product Quizzes (5 per video = 30 total) ───
    this.data.product_quizzes = [
      // Video 1: Introduction to Fizz (5 questions)
      { id: 'pq_001', product_id: 'prod_001', video_id: 'pvid_001', question: 'What is NOTJUST Watr Fizz primarily designed for?', options: ['Hydration during exercise', 'Reducing the glycemic impact of carbohydrate-rich meals', 'Replacing your daily water intake', 'Enhancing muscle recovery'], answer: 1, category: 'intro', difficulty: 'EASY', order: 1, active: true },
      { id: 'pq_002', product_id: 'prod_001', video_id: 'pvid_001', question: 'When should you take the NOTJUST Watr Fizz shot?', options: ['After dinner', 'Before a meal', 'During a workout', 'Right before sleeping'], answer: 1, category: 'intro', difficulty: 'EASY', order: 2, active: true },
      { id: 'pq_013', product_id: 'prod_001', video_id: 'pvid_001', question: 'What type of beverage is NOTJUST Watr Fizz?', options: ['A protein shake', 'A pre-meal carbonated wellness shot', 'A post-workout recovery drink', 'A meal replacement smoothie'], answer: 1, category: 'intro', difficulty: 'EASY', order: 3, active: true },
      { id: 'pq_014', product_id: 'prod_001', video_id: 'pvid_001', question: 'What is the key health concern that NOTJUST Watr Fizz addresses?', options: ['Joint pain and inflammation', 'Post-meal blood sugar spikes', 'Vitamin D deficiency', 'Dehydration during sports'], answer: 1, category: 'intro', difficulty: 'MEDIUM', order: 4, active: true },
      { id: 'pq_015', product_id: 'prod_001', video_id: 'pvid_001', question: 'Which of the following best describes the NOTJUST Watr Fizz product format?', options: ['A large bottle to drink throughout the day', 'A small 50ml shot taken before meals', 'A powder to mix with water', 'A capsule supplement'], answer: 1, category: 'intro', difficulty: 'EASY', order: 5, active: true },
      // Video 2: How to Use Fizz (5 questions)
      { id: 'pq_003', product_id: 'prod_001', video_id: 'pvid_002', question: 'How many minutes before a meal is the Fizz shot recommended?', options: ['1-2 minutes', '5-10 minutes', '30 minutes', '60 minutes'], answer: 1, category: 'usage', difficulty: 'EASY', order: 1, active: true },
      { id: 'pq_004', product_id: 'prod_001', video_id: 'pvid_002', question: 'What should you do if you forget to take your Fizz shot before a meal?', options: ['Skip it entirely', 'Double the dose next time', 'Take it as soon as you remember or before the next meal', 'Take it after the meal'], answer: 2, category: 'usage', difficulty: 'MEDIUM', order: 2, active: true },
      { id: 'pq_016', product_id: 'prod_001', video_id: 'pvid_002', question: 'How many Fizz shots are included in a standard pack?', options: ['7 shots', '30 shots', '60 shots', '14 shots'], answer: 2, category: 'usage', difficulty: 'EASY', order: 3, active: true },
      { id: 'pq_017', product_id: 'prod_001', video_id: 'pvid_002', question: 'Can NOTJUST Watr Fizz be taken on an empty stomach?', options: ['No, it must always be taken with food', 'Yes, but it is designed to be taken shortly before eating', 'Only with breakfast', 'It should only be taken after a heavy meal'], answer: 1, category: 'usage', difficulty: 'MEDIUM', order: 4, active: true },
      { id: 'pq_018', product_id: 'prod_001', video_id: 'pvid_002', question: 'What is the recommended daily usage pattern for NOTJUST Watr Fizz?', options: ['One shot per day regardless of meals', 'One shot before each main meal (up to 2-3 times daily)', 'Multiple shots at bedtime', 'Only on weekends'], answer: 1, category: 'usage', difficulty: 'EASY', order: 5, active: true },
      // Video 3: Science Behind Fizz (5 questions)
      { id: 'pq_005', product_id: 'prod_001', video_id: 'pvid_003', question: 'How does the carbonation in Fizz help with glycemic control?', options: ['It increases insulin production', 'It slows down gastric emptying and carbohydrate absorption', 'It directly neutralizes sugar in the blood', 'It has no effect on glycemic control'], answer: 1, category: 'science', difficulty: 'MEDIUM', order: 1, active: true },
      { id: 'pq_006', product_id: 'prod_001', video_id: 'pvid_003', question: 'Which mechanism is central to how NOTJUST Watr Fizz works?', options: ['Increasing metabolic rate', 'Replacing carbohydrate intake', 'Slowing carbohydrate absorption in the digestive system', 'Stimulating the pancreas'], answer: 2, category: 'science', difficulty: 'HARD', order: 2, active: true },
      { id: 'pq_019', product_id: 'prod_001', video_id: 'pvid_003', question: 'What key ingredient in NOTJUST Watr Fizz contributes to glycemic control?', options: ['Caffeine', 'Apple cider vinegar', 'Artificial sweeteners', 'High-fructose corn syrup'], answer: 1, category: 'science', difficulty: 'MEDIUM', order: 3, active: true },
      { id: 'pq_020', product_id: 'prod_001', video_id: 'pvid_003', question: 'What does research show about pre-meal vinegar consumption and blood sugar?', options: ['It has no measurable effect', 'It can reduce post-meal blood sugar spikes by up to 30-40%', 'It dramatically increases blood sugar', 'It only works during exercise'], answer: 1, category: 'science', difficulty: 'HARD', order: 4, active: true },
      { id: 'pq_021', product_id: 'prod_001', video_id: 'pvid_003', question: 'Why is the Fizz shot carbonated rather than still?', options: ['Carbonation makes it taste sweeter', 'Carbonation helps slow gastric emptying, enhancing the glycemic benefit', 'Carbonation is required by food safety regulations', 'Carbonation has no functional purpose'], answer: 1, category: 'science', difficulty: 'MEDIUM', order: 5, active: true },
      // Video 4: Introduction to Still (5 questions)
      { id: 'pq_007', product_id: 'prod_002', video_id: 'pvid_004', question: 'What makes NOTJUST Watr Still different from Fizz?', options: ['It contains caffeine', 'It is non-carbonated and gentler on the stomach', 'It is only for children', 'It has no active ingredients'], answer: 1, category: 'intro', difficulty: 'EASY', order: 1, active: true },
      { id: 'pq_008', product_id: 'prod_002', video_id: 'pvid_004', question: 'Who is NOTJUST Watr Still best suited for?', options: ['Athletes only', 'People who prefer a non-sparkling option for blood sugar support', 'People who want to lose weight quickly', 'Children under 12'], answer: 1, category: 'intro', difficulty: 'EASY', order: 2, active: true },
      { id: 'pq_022', product_id: 'prod_002', video_id: 'pvid_004', question: 'What is the serving size of one NOTJUST Watr Still shot?', options: ['200ml', '50ml', '500ml', '100ml'], answer: 1, category: 'intro', difficulty: 'EASY', order: 3, active: true },
      { id: 'pq_023', product_id: 'prod_002', video_id: 'pvid_004', question: 'Which botanical extract is unique to the Still formulation compared to Fizz?', options: ['Green tea extract', 'Gymnema and Fenugreek extract', 'Turmeric extract', 'Ginger root extract'], answer: 1, category: 'intro', difficulty: 'MEDIUM', order: 4, active: true },
      { id: 'pq_024', product_id: 'prod_002', video_id: 'pvid_004', question: 'How many shots are included in the NOTJUST Watr Still Eco Refill Pack?', options: ['60 shots', '30 shots', '14 shots', '7 shots'], answer: 2, category: 'intro', difficulty: 'EASY', order: 5, active: true },
      // Video 5: How to Use Still (5 questions)
      { id: 'pq_009', product_id: 'prod_002', video_id: 'pvid_005', question: 'How is the Still shot typically consumed?', options: ['Mixed with hot tea', 'Drunk directly before a meal', 'Applied topically', 'Diluted in a liter of water'], answer: 1, category: 'usage', difficulty: 'EASY', order: 1, active: true },
      { id: 'pq_010', product_id: 'prod_002', video_id: 'pvid_005', question: 'What is the recommended frequency for taking NOTJUST Watr Still?', options: ['Once a week', 'Once before each main meal', 'Only when you feel unwell', 'Three times a day regardless of meals'], answer: 1, category: 'usage', difficulty: 'MEDIUM', order: 2, active: true },
      { id: 'pq_025', product_id: 'prod_002', video_id: 'pvid_005', question: 'Should NOTJUST Watr Still be refrigerated?', options: ['Yes, it must always be refrigerated', 'It should be stored in a cool dry place and refrigerated after opening', 'It must be frozen before use', 'Refrigeration is not allowed'], answer: 1, category: 'usage', difficulty: 'EASY', order: 3, active: true },
      { id: 'pq_026', product_id: 'prod_002', video_id: 'pvid_005', question: 'Can NOTJUST Watr Still be taken alongside prescription diabetes medication?', options: ['Yes, it replaces the need for medication', 'It can be used as a complementary wellness product, but consult your doctor', 'No, it should never be taken with any medication', 'It is only for people not on any medication'], answer: 1, category: 'usage', difficulty: 'MEDIUM', order: 4, active: true },
      { id: 'pq_027', product_id: 'prod_002', video_id: 'pvid_005', question: 'What is the best way to incorporate Still shots into a daily routine?', options: ['Take them only on weekends', 'Take one shot 5-10 minutes before each main meal consistently', 'Take all daily shots at once in the morning', 'Only take them when blood sugar feels high'], answer: 1, category: 'usage', difficulty: 'EASY', order: 5, active: true },
      // Video 6: Science Behind Still (5 questions)
      { id: 'pq_011', product_id: 'prod_002', video_id: 'pvid_006', question: 'What does clinical research suggest about the Still formulation?', options: ['It cures diabetes', 'It supports healthy post-meal glycemic response', 'It replaces the need for medication', 'It increases blood sugar levels'], answer: 1, category: 'science', difficulty: 'MEDIUM', order: 1, active: true },
      { id: 'pq_012', product_id: 'prod_002', video_id: 'pvid_006', question: 'Which of the following is NOT a mechanism of the Still formulation?', options: ['Slowing carbohydrate absorption', 'Directly reducing blood glucose', 'Supporting digestive health', 'Modulating glycemic response'], answer: 1, category: 'science', difficulty: 'HARD', order: 2, active: true },
      { id: 'pq_028', product_id: 'prod_002', video_id: 'pvid_006', question: 'What role does Gymnema sylvestre play in the Still formulation?', options: ['It adds flavor and sweetness', 'It is traditionally used to support healthy blood sugar levels', 'It acts as a preservative', 'It provides carbonation'], answer: 1, category: 'science', difficulty: 'MEDIUM', order: 3, active: true },
      { id: 'pq_029', product_id: 'prod_002', video_id: 'pvid_006', question: 'How does Fenugreek contribute to the Still formulation\'s effect?', options: ['It acts as a flavoring agent only', 'It may help slow sugar absorption and improve glycemic response', 'It increases carbonation', 'It has no known health benefit'], answer: 1, category: 'science', difficulty: 'HARD', order: 4, active: true },
      { id: 'pq_030', product_id: 'prod_002', video_id: 'pvid_006', question: 'Is the glycemic benefit of NOTJUST Watr Still clinically proven?', options: ['Yes, it is an FDA-approved treatment for diabetes', 'Clinical studies suggest it supports glycemic response, but individual results may vary', 'No, there is no research at all', 'It has been proven to cure type 2 diabetes'], answer: 1, category: 'science', difficulty: 'MEDIUM', order: 5, active: true },
    ]

    // ─── NEW: Product Learning Progress ───
    this.data.product_learning_progress = [
      // admin_001: completed for both products
      {
        id: 'plp_001',
        user_id: 'admin_001',
        product_id: 'prod_001',
        video_progress: { 'pvid_001': 100, 'pvid_002': 100, 'pvid_003': 100 },
        quiz_answers: { 'pq_001': 1, 'pq_002': 1, 'pq_003': 1, 'pq_004': 2, 'pq_005': 1, 'pq_006': 2, 'pq_013': 1, 'pq_014': 1, 'pq_015': 1, 'pq_016': 2, 'pq_017': 1, 'pq_018': 1, 'pq_019': 1, 'pq_020': 1, 'pq_021': 1 },
        quiz_completed: true,
        quiz_score: 100,
        status: 'COMPLETED',
        completed_at: '2026-06-01T12:00:00Z',
        created_at: '2026-06-01T10:00:00Z',
        updated_at: '2026-06-01T12:00:00Z',
      },
      {
        id: 'plp_002',
        user_id: 'admin_001',
        product_id: 'prod_002',
        video_progress: { 'pvid_004': 100, 'pvid_005': 100, 'pvid_006': 100 },
        quiz_answers: { 'pq_007': 1, 'pq_008': 1, 'pq_009': 1, 'pq_010': 1, 'pq_011': 1, 'pq_012': 1, 'pq_022': 1, 'pq_023': 1, 'pq_024': 2, 'pq_025': 1, 'pq_026': 1, 'pq_027': 1, 'pq_028': 1, 'pq_029': 1, 'pq_030': 1 },
        quiz_completed: true,
        quiz_score: 100,
        status: 'COMPLETED',
        completed_at: '2026-06-01T14:00:00Z',
        created_at: '2026-06-01T10:00:00Z',
        updated_at: '2026-06-01T14:00:00Z',
      },
      // user_002 (Priya): completed for prod_001, in_progress for prod_002
      {
        id: 'plp_003',
        user_id: 'user_002',
        product_id: 'prod_001',
        video_progress: { 'pvid_001': 100, 'pvid_002': 100, 'pvid_003': 100 },
        quiz_answers: { 'pq_001': 1, 'pq_002': 1, 'pq_003': 1, 'pq_004': 2, 'pq_005': 1, 'pq_006': 0, 'pq_013': 1, 'pq_014': 1, 'pq_015': 1, 'pq_016': 2, 'pq_017': 1, 'pq_018': 1, 'pq_019': 1, 'pq_020': 0, 'pq_021': 1 },
        quiz_completed: true,
        quiz_score: 87,
        status: 'COMPLETED',
        completed_at: '2026-06-06T09:00:00Z',
        created_at: '2026-06-05T08:30:00Z',
        updated_at: '2026-06-06T09:00:00Z',
      },
      {
        id: 'plp_004',
        user_id: 'user_002',
        product_id: 'prod_002',
        video_progress: { 'pvid_004': 100, 'pvid_005': 80 },
        quiz_answers: { 'pq_007': 1, 'pq_008': 1 },
        quiz_completed: false,
        quiz_score: 0,
        status: 'IN_PROGRESS',
        completed_at: undefined,
        created_at: '2026-06-05T08:30:00Z',
        updated_at: now,
      },
      // user_003 (Rajesh): completed for prod_001, NOT_STARTED for prod_002
      {
        id: 'plp_005',
        user_id: 'user_003',
        product_id: 'prod_001',
        video_progress: { 'pvid_001': 100, 'pvid_002': 100, 'pvid_003': 100 },
        quiz_answers: { 'pq_001': 1, 'pq_002': 1, 'pq_003': 0, 'pq_004': 2, 'pq_005': 1, 'pq_006': 2, 'pq_013': 1, 'pq_014': 1, 'pq_015': 1, 'pq_016': 2, 'pq_017': 1, 'pq_018': 1, 'pq_019': 0, 'pq_020': 1, 'pq_021': 1 },
        quiz_completed: true,
        quiz_score: 87,
        status: 'COMPLETED',
        completed_at: '2026-06-07T16:00:00Z',
        created_at: '2026-06-06T14:20:00Z',
        updated_at: '2026-06-07T16:00:00Z',
      },
      {
        id: 'plp_006',
        user_id: 'user_003',
        product_id: 'prod_002',
        video_progress: {},
        quiz_answers: {},
        quiz_completed: false,
        quiz_score: 0,
        status: 'NOT_STARTED',
        completed_at: undefined,
        created_at: '2026-06-06T14:20:00Z',
        updated_at: '2026-06-06T14:20:00Z',
      },
      // user_004 (Anita): IN_PROGRESS for prod_001 (video 1 done, video 2 at 60%)
      {
        id: 'plp_007',
        user_id: 'user_004',
        product_id: 'prod_001',
        video_progress: { 'pvid_001': 100, 'pvid_002': 60 },
        quiz_answers: { 'pq_001': 1, 'pq_002': 0 },
        quiz_completed: false,
        quiz_score: 0,
        status: 'IN_PROGRESS',
        completed_at: undefined,
        created_at: '2026-06-08T09:15:00Z',
        updated_at: now,
      },
      {
        id: 'plp_008',
        user_id: 'user_004',
        product_id: 'prod_002',
        video_progress: {},
        quiz_answers: {},
        quiz_completed: false,
        quiz_score: 0,
        status: 'NOT_STARTED',
        completed_at: undefined,
        created_at: '2026-06-08T09:15:00Z',
        updated_at: '2026-06-08T09:15:00Z',
      },
      // user_005 (Vikram): NOT_STARTED for both
      {
        id: 'plp_009',
        user_id: 'user_005',
        product_id: 'prod_001',
        video_progress: {},
        quiz_answers: {},
        quiz_completed: false,
        quiz_score: 0,
        status: 'NOT_STARTED',
        completed_at: undefined,
        created_at: '2026-06-09T16:45:00Z',
        updated_at: '2026-06-09T16:45:00Z',
      },
      {
        id: 'plp_010',
        user_id: 'user_005',
        product_id: 'prod_002',
        video_progress: {},
        quiz_answers: {},
        quiz_completed: false,
        quiz_score: 0,
        status: 'NOT_STARTED',
        completed_at: undefined,
        created_at: '2026-06-09T16:45:00Z',
        updated_at: '2026-06-09T16:45:00Z',
      },
      // user_006 (Meera): NOT_STARTED for both
      {
        id: 'plp_011',
        user_id: 'user_006',
        product_id: 'prod_001',
        video_progress: {},
        quiz_answers: {},
        quiz_completed: false,
        quiz_score: 0,
        status: 'NOT_STARTED',
        completed_at: undefined,
        created_at: '2026-06-10T11:00:00Z',
        updated_at: '2026-06-10T11:00:00Z',
      },
      {
        id: 'plp_012',
        user_id: 'user_006',
        product_id: 'prod_002',
        video_progress: {},
        quiz_answers: {},
        quiz_completed: false,
        quiz_score: 0,
        status: 'NOT_STARTED',
        completed_at: undefined,
        created_at: '2026-06-10T11:00:00Z',
        updated_at: '2026-06-10T11:00:00Z',
      },
      // user_007 (Suresh): NOT_STARTED for both
      {
        id: 'plp_013',
        user_id: 'user_007',
        product_id: 'prod_001',
        video_progress: {},
        quiz_answers: {},
        quiz_completed: false,
        quiz_score: 0,
        status: 'NOT_STARTED',
        completed_at: undefined,
        created_at: '2026-06-11T13:30:00Z',
        updated_at: '2026-06-11T13:30:00Z',
      },
      {
        id: 'plp_014',
        user_id: 'user_007',
        product_id: 'prod_002',
        video_progress: {},
        quiz_answers: {},
        quiz_completed: false,
        quiz_score: 0,
        status: 'NOT_STARTED',
        completed_at: undefined,
        created_at: '2026-06-11T13:30:00Z',
        updated_at: '2026-06-11T13:30:00Z',
      },
      // user_008 (Deepa): NOT_STARTED for both
      {
        id: 'plp_015',
        user_id: 'user_008',
        product_id: 'prod_001',
        video_progress: {},
        quiz_answers: {},
        quiz_completed: false,
        quiz_score: 0,
        status: 'NOT_STARTED',
        completed_at: undefined,
        created_at: '2026-06-12T07:20:00Z',
        updated_at: '2026-06-12T07:20:00Z',
      },
      {
        id: 'plp_016',
        user_id: 'user_008',
        product_id: 'prod_002',
        video_progress: {},
        quiz_answers: {},
        quiz_completed: false,
        quiz_score: 0,
        status: 'NOT_STARTED',
        completed_at: undefined,
        created_at: '2026-06-12T07:20:00Z',
        updated_at: '2026-06-12T07:20:00Z',
      },
      // user_009 (Arjun): NOT_STARTED for both
      {
        id: 'plp_017',
        user_id: 'user_009',
        product_id: 'prod_001',
        video_progress: {},
        quiz_answers: {},
        quiz_completed: false,
        quiz_score: 0,
        status: 'NOT_STARTED',
        completed_at: undefined,
        created_at: '2026-06-13T10:10:00Z',
        updated_at: '2026-06-13T10:10:00Z',
      },
      {
        id: 'plp_018',
        user_id: 'user_009',
        product_id: 'prod_002',
        video_progress: {},
        quiz_answers: {},
        quiz_completed: false,
        quiz_score: 0,
        status: 'NOT_STARTED',
        completed_at: undefined,
        created_at: '2026-06-13T10:10:00Z',
        updated_at: '2026-06-13T10:10:00Z',
      },
      // user_010 (Kavita): NOT_STARTED for both
      {
        id: 'plp_019',
        user_id: 'user_010',
        product_id: 'prod_001',
        video_progress: {},
        quiz_answers: {},
        quiz_completed: false,
        quiz_score: 0,
        status: 'NOT_STARTED',
        completed_at: undefined,
        created_at: '2026-06-13T15:40:00Z',
        updated_at: '2026-06-13T15:40:00Z',
      },
      {
        id: 'plp_020',
        user_id: 'user_010',
        product_id: 'prod_002',
        video_progress: {},
        quiz_answers: {},
        quiz_completed: false,
        quiz_score: 0,
        status: 'NOT_STARTED',
        completed_at: undefined,
        created_at: '2026-06-13T15:40:00Z',
        updated_at: '2026-06-13T15:40:00Z',
      },
    ]

    // ─── NEW: Subscriptions ───
    this.data.subscriptions = [
      // user_002 (Priya): ACTIVE 30-Day subscription for prod_001
      {
        id: 'sub_001',
        user_id: 'user_002',
        product_id: 'prod_001',
        pack_type: '30_DAY',
        pack_duration_days: 30,
        status: 'ACTIVE',
        amount: 2999,
        start_date: '2026-06-05',
        end_date: '2026-07-05',
        auto_renew: true,
        payment_id: 'pay_rz_sub_001',
        created_at: '2026-06-05T08:30:00Z',
        updated_at: now,
      },
      // user_003 (Rajesh): ACTIVE 60-Day subscription for prod_002
      {
        id: 'sub_002',
        user_id: 'user_003',
        product_id: 'prod_002',
        pack_type: '60_DAY',
        pack_duration_days: 60,
        status: 'ACTIVE',
        amount: 4499,
        start_date: '2026-06-06',
        end_date: '2026-08-05',
        auto_renew: true,
        payment_id: 'pay_rz_sub_002',
        created_at: '2026-06-06T14:20:00Z',
        updated_at: now,
      },
      // user_005 (Vikram): PAUSED 30-Day subscription for prod_001
      {
        id: 'sub_003',
        user_id: 'user_005',
        product_id: 'prod_001',
        pack_type: '30_DAY',
        pack_duration_days: 30,
        status: 'PAUSED',
        amount: 2999,
        start_date: '2026-06-01',
        end_date: '2026-07-01',
        auto_renew: false,
        payment_id: 'pay_rz_sub_003',
        created_at: '2026-06-01T10:00:00Z',
        updated_at: '2026-06-10T09:00:00Z',
      },
    ]

    // ─── NEW: Reorder Reminders ───
    this.data.reorder_reminders = [
      {
        id: 'rem_001',
        user_id: 'user_002',
        subscription_id: 'sub_001',
        product_id: 'prod_001',
        reminder_date: '2026-06-28',
        channel: 'WHATSAPP',
        status: 'PENDING',
        message: 'Hi Priya! Your NOTJUST Watr Fizz 30-Day pack is ending soon on July 5th. Reorder now to keep your wellness routine on track! 🌿',
        created_at: '2026-06-20T08:00:00Z',
      },
      {
        id: 'rem_002',
        user_id: 'user_003',
        subscription_id: 'sub_002',
        product_id: 'prod_002',
        reminder_date: '2026-07-20',
        channel: 'EMAIL',
        status: 'PENDING',
        message: 'Dear Rajesh, your NOTJUST Watr Still 60-Day subscription expires on August 5th. Renew today and continue your wellness journey.',
        created_at: '2026-06-20T08:00:00Z',
      },
      {
        id: 'rem_003',
        user_id: 'user_005',
        subscription_id: 'sub_003',
        product_id: 'prod_001',
        reminder_date: '2026-06-20',
        channel: 'SMS',
        status: 'SENT',
        message: 'Vikram, your NOTJUST Watr Fizz subscription is currently paused. Resume anytime from your account settings. Stay healthy!',
        created_at: '2026-06-15T10:00:00Z',
      },
    ]

    this.save()
  }

  // ============================================
  // CRUD Operations (mirror Supabase from().select() API)
  // ============================================

  getAll<T>(table: TableName): T[] {
    return this.data[table] as T[]
  }

  getById<T>(table: TableName, id: string): T | undefined {
    return (this.data[table] as any[]).find((item: any) => item.id === id) as T | undefined
  }

  find<T>(table: TableName, filter: Partial<T>): T[] {
    return (this.data[table] as any[]).filter((item: any) => {
      return Object.entries(filter).every(([key, value]) => {
        if (value === undefined || value === null) return true
        return item[key] === value
      })
    }) as T[]
  }

  findOne<T>(table: TableName, filter: Partial<T>): T | undefined {
    return this.find<T>(table, filter)[0]
  }

  insert<T>(table: TableName, record: any): T {
    const item = { ...record, id: record.id || `${table.slice(0, 4)}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }
    ;(this.data[table] as any[]).push(item)
    this.save()
    return item as T
  }

  update<T>(table: TableName, id: string, updates: Partial<T>): T | undefined {
    const idx = (this.data[table] as any[]).findIndex((item: any) => item.id === id)
    if (idx === -1) return undefined
    this.data[table][idx] = { ...this.data[table][idx], ...updates }
    this.save()
    return this.data[table][idx] as T
  }

  delete(table: TableName, id: string): boolean {
    const idx = (this.data[table] as any[]).findIndex((item: any) => item.id === id)
    if (idx === -1) return false
    this.data[table].splice(idx, 1)
    this.save()
    return true
  }

  count(table: TableName, filter?: Record<string, any>): number {
    if (filter) return this.find(table, filter).length
    return this.data[table].length
  }

  // Reset and reseed
  reset() {
    this.seed()
  }
}

// Singleton instance
let _store: MockDataStore | null = null

export function getMockStore(): MockDataStore {
  if (!_store) {
    _store = new MockDataStore()
  }
  return _store
}

// Convenience: check if we should use mock
// Force mock mode for demo — set NEXT_PUBLIC_USE_MOCK=true to always use mock,
// or leave unset and we'll check if Supabase URL is missing.
// Since Supabase tables aren't set up yet, we force mock for demo.
export function shouldUseMockSupabase(): boolean {
  const forceMock = process.env.NEXT_PUBLIC_USE_MOCK
  if (forceMock === 'true') return true
  if (forceMock === 'false') return false
  // Default: use mock for demo (tables not set up yet)
  // Change to: return url.length === 0  ...when Supabase is fully set up
  return true
}
