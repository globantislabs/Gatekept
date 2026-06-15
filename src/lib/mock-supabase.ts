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
  price: number
  stock: number
  image_url?: string
  type: string
  active: boolean
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

export interface GuaranteePlan {
  id: string
  name: string
  description: string
  duration: string
  price: number
  features: string[]
  active: boolean
  created_at: string
}

type TableName = 'users_profile' | 'campaigns' | 'qr_scans' | 'learning_progress' | 'quiz_questions' | 'products' | 'orders' | 'order_items' | 'guarantee_plans'

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
    guarantee_plans: [],
  }

  constructor() {
    this.load()
  }

  private load() {
    if (typeof window === 'undefined') return
    try {
      const storedVersion = localStorage.getItem('notjust_mock_db_version')
      const currentVersion = 'v5' // Increment when seed data changes
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
      { id: 'prod_001', name: 'NOTJUST Watr Fizz', description: 'Sparkling 50 ml pre-meal wellness shots designed to help reduce the GI impact of carbohydrate-rich meals. Available as a Monthly Pack with 60 shots for daily use.', price: 2999, stock: 500, image_url: '/images/notjust-logo.png', type: 'FIZZ', active: true, created_at: '2026-06-01T00:00:00Z' },
      { id: 'prod_002', name: 'NOTJUST Watr Still', description: 'Still 50 ml pre-meal wellness shots designed to support healthy blood sugar management. Available with an eco-friendly refill pack that is sustainable and affordable.', price: 2499, stock: 300, image_url: '/images/notjust-logo.png', type: 'STILL', active: true, created_at: '2026-06-01T00:00:00Z' },
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

    // Guarantee Plans
    this.data.guarantee_plans = [
      { id: 'gp_001', name: '30-Day Satisfaction Guarantee', description: 'If you are not satisfied with the product within 30 days of purchase, get a full refund. No questions asked.', duration: '30 days', price: 0, features: ['Full refund within 30 days', 'No questions asked', 'Free return shipping', 'Dedicated support'], active: true, created_at: '2026-06-01T00:00:00Z' },
      { id: 'gp_002', name: '60-Day Wellness Promise', description: 'Our extended guarantee ensures you see real results. If glycemic response improvement is not observed within 60 days, receive a full refund plus a complimentary consultation with our wellness advisor.', duration: '60 days', price: 0, features: ['Full refund within 60 days', 'Complimentary wellness consultation', 'Priority customer support', 'Extended return window', 'Free return shipping'], active: true, created_at: '2026-06-01T00:00:00Z' },
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
