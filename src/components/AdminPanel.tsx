'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard, Package, BookOpen, Users, Megaphone,
  Plus, Pencil, Trash2, Copy, Search,
  ArrowLeft, Eye, Loader2,
  Shield, CheckCircle, XCircle, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  RefreshCw, Leaf, Video, Play, Scan, Edit, Save, Star, AlertCircle,
  HelpCircle, QrCode, ShoppingCart, BarChart3,
  FileText, CreditCard, Bell, X, Download, ExternalLink,
  Home, GraduationCap, Menu, LogOut, TrendingUp, TrendingDown,
  Settings, Info, Tag, Sparkles, Check, Link as LinkIcon, EyeOff, Columns3, ClipboardList, DollarSign
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useAppStore } from '@/store/app-store'
import {
  productService, productVideoService, productQuizService,
  adminStatsService, userService, campaignService,
  orderService, subscriptionService, qrScanService, quizService,
  type Product, type ProductVideo, type ProductQuiz,
  type Campaign, type QrScan, type UserProfile,
  type Order, type Subscription,
  type AdminStatsResponse,
} from '@/lib/data-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip, Legend,
} from 'recharts'
import { toast } from 'sonner'

// ─── Admin Theme Constants (Jira/Huly Style) ─────────────
const A = {
  bg: '#f4f3f0',
  surface: '#ffffff',
  border: '#e3dfd8',
  borderLight: '#eeebe5',
  text: '#1f1e1c',
  textSecondary: '#6b6560',
  textMuted: '#99948d',
  green: '#48805b',
  greenLight: '#e8f0eb',
  lime: '#afb75d',
  limeLight: '#f4f5e8',
  blue: '#2e91b2',
  blueLight: '#e6f2f7',
  amber: '#c4880e',
  amberLight: '#fdf5e6',
  red: '#c44530',
  redLight: '#fceeed',
  sidebarBg: '#1f1e1c',
  sidebarText: '#c8c3bb',
  sidebarActive: '#48805b',
  sidebarHover: '#2a2926',
  destructive: '#c44530',
}

const CHART_COLORS = [A.green, A.lime, A.blue, A.amber, A.red, '#7c3aed']

// ─── Mobile Detection ────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

// ─── CSV Export Helper ────────────────────────────────────
function exportToCSV(data: any[], filename: string, columns: { key: string; label: string }[]) {
  const header = columns.map(c => c.label).join(',')
  const rows = data.map(row => columns.map(c => {
    const val = row[c.key]
    if (val === null || val === undefined) return ''
    return `"${String(val).replace(/"/g, '""')}"`
  }).join(','))
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Image Upload Helper ──────────────────────────────────
async function handleImageUploadApi(file: File): Promise<string | null> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.url) return data.url
    toast.error(data.error || 'Upload failed')
    return null
  } catch {
    toast.error('Upload failed')
    return null
  }
}

// ─── QuizQuestion type for content tab ────────────────────
interface QuizQuestion {
  id: string
  question: string
  options: string[]
  answer: number
  category?: string | null
  difficulty: string
  product_id?: string
  video_id?: string
  order?: number
}

// ============================================================
// ADMIN DASHBOARD — Jira/Huly Style Light Theme
// ============================================================

function AdminDashboard() {
  const { adminTab, setAdminTab, user, navigateTo } = useAppStore()
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [scans, setScans] = useState<QrScan[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [questions, setQuestions] = useState<QuizQuestion[]>([])

  const [loading, setLoading] = useState(true)
  const [userSearch, setUserSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [orderView, setOrderView] = useState<'kanban' | 'table'>('table')
  const [adminProducts, setAdminProducts] = useState<Product[]>([])
  const [adminSubscriptions, setAdminSubscriptions] = useState<Subscription[]>([])
  const [productVideoCounts, setProductVideoCounts] = useState<Record<string, number>>({})
  const [productQuizCounts, setProductQuizCounts] = useState<Record<string, number>>({})
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [productFilter, setProductFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [galleryUploading, setGalleryUploading] = useState(false)
  // Manage Learning Content dialog
  const [showManageLearning, setShowManageLearning] = useState(false)
  const [learningProductId, setLearningProductId] = useState<string | null>(null)
  const [learningVideos, setLearningVideos] = useState<ProductVideo[]>([])
  const [learningQuizzes, setLearningQuizzes] = useState<ProductQuiz[]>([])
  const [learningLoading, setLearningLoading] = useState(false)
  const [editingVideo, setEditingVideo] = useState<ProductVideo | null>(null)
  const [editingQuiz, setEditingQuiz] = useState<ProductQuiz | null>(null)
  const [showAddVideo, setShowAddVideo] = useState(false)
  const [showAddQuiz, setShowAddQuiz] = useState(false)
  const [newVideo, setNewVideo] = useState({ title: '', duration: '', description: '', order: 1, video_url: '' })
  const [newQuiz, setNewQuiz] = useState({ question: '', options: ['', '', '', ''], answer: 0, category: '', difficulty: 'EASY', order: 1, video_id: '' })
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', short_description: '', price: 0, mrp: 0, stock: 0,
    image_url: '', gallery_images: '', type: 'FIZZ', category: 'Wellness Shot',
    sku: '', weight: '', ingredients: '', nutrition_info: '', tags: '',
    active: true, featured: false,
    brand: '', flavor: '', serving_size: '', allergen_info: '', storage_info: '',
    shelf_life: '', country_origin: '', fssai_license: '', hsn_code: '',
    gst_rate: 0, min_order_qty: 1, max_order_qty: 10, discount_label: '', highlights: '',
  })

  const resetProductForm = () => {
    setNewProduct({
      name: '', description: '', short_description: '', price: 0, mrp: 0, stock: 0,
      image_url: '', gallery_images: '', type: 'FIZZ', category: 'Wellness Shot',
      sku: '', weight: '', ingredients: '', nutrition_info: '', tags: '',
      active: true, featured: false,
      brand: '', flavor: '', serving_size: '', allergen_info: '', storage_info: '',
      shelf_life: '', country_origin: '', fssai_license: '', hsn_code: '',
      gst_rate: 0, min_order_qty: 1, max_order_qty: 10, discount_label: '', highlights: '',
    })
    setEditingProduct(null)
  }

  const userId = user?.id || ''

  // Load learning content for a product
  const loadLearningContent = async (productId: string) => {
    setLearningProductId(productId)
    setShowManageLearning(true)
    setLearningLoading(true)
    try {
      const [videos, quizzes] = await Promise.all([
        productVideoService.list(productId),
        productQuizService.list(productId),
      ])
      setLearningVideos(videos)
      setLearningQuizzes(quizzes)
    } catch (err) {
      console.error('Failed to load learning content:', err)
    } finally {
      setLearningLoading(false)
    }
  }

  // Save video (create or update)
  const handleSaveVideo = async () => {
    if (!learningProductId || !newVideo.title) { toast.error('Title is required'); return }
    try {
      if (editingVideo) {
        await productVideoService.update(learningProductId, editingVideo.id, newVideo as any, userId)
        toast.success('Video updated!')
      } else {
        await productVideoService.create(learningProductId, { ...newVideo, product_id: learningProductId } as any, userId)
        toast.success('Video added!')
      }
      setEditingVideo(null)
      setShowAddVideo(false)
      setNewVideo({ title: '', duration: '', description: '', order: learningVideos.length + 1, video_url: '' })
      loadLearningContent(learningProductId)
    } catch {
      toast.error('Failed to save video')
    }
  }

  // Save quiz (create or update)
  const handleSaveQuiz = async () => {
    if (!learningProductId || !newQuiz.question || !newQuiz.video_id) { toast.error('Question and video are required'); return }
    try {
      if (editingQuiz) {
        await productQuizService.update(learningProductId, editingQuiz.id, { ...newQuiz, options: newQuiz.options } as any, userId)
        toast.success('Question updated!')
      } else {
        await productQuizService.create(learningProductId, { ...newQuiz, product_id: learningProductId, options: newQuiz.options } as any, userId)
        toast.success('Question added!')
      }
      setEditingQuiz(null)
      setShowAddQuiz(false)
      setNewQuiz({ question: '', options: ['', '', '', ''], answer: 0, category: '', difficulty: 'EASY', order: 1, video_id: '' })
      loadLearningContent(learningProductId)
    } catch {
      toast.error('Failed to save question')
    }
  }

  // Delete video
  const handleDeleteVideo = async (videoId: string) => {
    if (!learningProductId) return
    if (!confirm('Delete this video?')) return
    try {
      await productVideoService.delete(learningProductId, videoId, userId)
      toast.success('Video deleted')
      loadLearningContent(learningProductId)
    } catch {
      toast.error('Failed to delete video')
    }
  }

  // Delete quiz
  const handleDeleteQuiz = async (quizId: string) => {
    if (!learningProductId) return
    if (!confirm('Delete this quiz question?')) return
    try {
      await productQuizService.delete(learningProductId, quizId, userId)
      toast.success('Question deleted')
      loadLearningContent(learningProductId)
    } catch {
      toast.error('Failed to delete question')
    }
  }

  // Reorder video
  const handleReorderVideo = async (videoId: string, direction: 'up' | 'down') => {
    if (!learningProductId) return
    const videos = [...learningVideos]
    const idx = videos.findIndex(v => v.id === videoId)
    if (idx === -1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= videos.length) return
    const currentOrder = videos[idx].order
    const swapOrder = videos[swapIdx].order
    await Promise.all([
      productVideoService.update(learningProductId, videoId, { order: swapOrder }, userId),
      productVideoService.update(learningProductId, videos[swapIdx].id, { order: currentOrder }, userId),
    ])
    loadLearningContent(learningProductId)
  }

  // Reorder quiz
  const handleReorderQuiz = async (quizId: string, direction: 'up' | 'down') => {
    if (!learningProductId) return
    const quizzes = [...learningQuizzes]
    const idx = quizzes.findIndex(q => q.id === quizId)
    if (idx === -1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= quizzes.length) return
    const currentOrder = quizzes[idx].order
    const swapOrder = quizzes[swapIdx].order
    await Promise.all([
      productQuizService.update(learningProductId, quizId, { order: swapOrder }, userId),
      productQuizService.update(learningProductId, quizzes[swapIdx].id, { order: currentOrder }, userId),
    ])
    loadLearningContent(learningProductId)
  }

  const handleSaveProduct = async () => {
    if (!newProduct.name || !newProduct.price) { toast.error('Name and price are required'); return }
    try {
      if (editingProduct) {
        await productService.update(editingProduct.id, newProduct as any, userId)
        toast.success('Product updated!')
      } else {
        await productService.create(newProduct as any, userId)
        toast.success('Product created!')
      }
      setShowAddProduct(false)
      resetProductForm()
      refreshData()
    } catch {
      toast.error('Failed to save product')
    }
  }

  useEffect(() => {
    if (!user?.is_admin) { navigateTo('landing'); return }
    const load = async () => {
      try {
        const [statsRes, usersRes, camps, productsRes, ordersRes, subsRes] = await Promise.all([
          adminStatsService.get(userId),
          userService.list(undefined, userId),
          campaignService.list(),
          productService.getAllForAdmin(),
          orderService.getAll(userId),
          subscriptionService.getAll(userId),
        ])

        setStats(statsRes.stats)
        setUsers(usersRes.users)
        setCampaigns(camps)
        setAdminProducts(productsRes)
        setOrders(ordersRes)
        setAdminSubscriptions(subsRes)

        // Get quiz questions from all products
        const allQuestions: QuizQuestion[] = []
        for (const prod of productsRes) {
          const quizzes = await productQuizService.list(prod.id)
          for (const q of quizzes) {
            allQuestions.push({
              id: q.id,
              question: q.question,
              options: q.options,
              answer: q.answer,
              category: q.category,
              difficulty: q.difficulty,
              product_id: q.product_id,
              video_id: q.video_id,
              order: q.order,
            })
          }
        }
        setQuestions(allQuestions)

        // Fetch video/quiz counts per product
        const vCounts: Record<string, number> = {}
        const qCounts: Record<string, number> = {}
        for (const prod of productsRes) {
          const [vR, qR] = await Promise.all([
            productVideoService.list(prod.id),
            productQuizService.list(prod.id),
          ])
          vCounts[prod.id] = vR.length
          qCounts[prod.id] = qR.length
        }
        setProductVideoCounts(vCounts)
        setProductQuizCounts(qCounts)

        // Scans stub
        setScans([])

        setLoading(false)
      } catch (err) {
        console.error('Failed to load admin data:', err)
        setLoading(false)
      }
    }
    load()
  }, [user, navigateTo])

  const refreshData = async () => {
    setLoading(true)
    try {
      const [statsRes, usersRes, camps, productsRes, ordersRes, subsRes] = await Promise.all([
        adminStatsService.get(userId),
        userService.list(undefined, userId),
        campaignService.list(),
        productService.getAllForAdmin(),
        orderService.getAll(userId),
        subscriptionService.getAll(userId),
      ])
      setStats(statsRes.stats)
      setUsers(usersRes.users)
      setCampaigns(camps)
      setAdminProducts(productsRes)
      setOrders(ordersRes)
      setAdminSubscriptions(subsRes)
    } catch (err) {
      console.error('Failed to refresh data:', err)
    }
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: A.bg }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center animate-pulse" style={{ background: A.greenLight }}>
          <Leaf className="w-5 h-5" style={{ color: A.green }} />
        </div>
        <span className="text-sm" style={{ color: A.textMuted }}>Loading dashboard...</span>
      </div>
    </div>
  )
  if (!stats) return null

  const ordersByStatus = Object.entries(stats.ordersByStatus || {}).map(([name, value]) => ({ name, value: value as number }))
  const scansByCampaign = Object.entries(stats.scansByCampaign || {}).map(([name, value]) => ({ name: name.slice(0, 15), value: value as number }))
  const campaignsByChannel = Object.entries(stats.campaignsByChannel || {}).map(([name, value]) => ({ name, value: value as number }))

  const revenueTrend = [
    { month: 'Jan', revenue: Math.round(stats.totalRevenue * 0.1), orders: Math.round(stats.totalOrders * 0.08) },
    { month: 'Feb', revenue: Math.round(stats.totalRevenue * 0.12), orders: Math.round(stats.totalOrders * 0.1) },
    { month: 'Mar', revenue: Math.round(stats.totalRevenue * 0.18), orders: Math.round(stats.totalOrders * 0.15) },
    { month: 'Apr', revenue: Math.round(stats.totalRevenue * 0.22), orders: Math.round(stats.totalOrders * 0.18) },
    { month: 'May', revenue: Math.round(stats.totalRevenue * 0.28), orders: Math.round(stats.totalOrders * 0.22) },
    { month: 'Jun', revenue: Math.round(stats.totalRevenue * 0.32), orders: Math.round(stats.totalOrders * 0.27) },
  ]

  const sidebarItems = [
    { value: 'dashboard', label: 'Overview', icon: LayoutDashboard, badge: null },
    { value: 'users', label: 'Users', icon: Users, badge: users.length },
    { value: 'campaigns', label: 'Campaigns', icon: Megaphone, badge: campaigns.length },
    { value: 'products', label: 'Products', icon: Package, badge: null },
    { value: 'qr', label: 'QR Codes', icon: QrCode, badge: campaigns.filter(c => c.status === 'ACTIVE').length },
    { value: 'orders', label: 'Orders', icon: Package, badge: orders.length },
    { value: 'subscriptions', label: 'Subscriptions', icon: CreditCard, badge: null },
    { value: 'analytics', label: 'Analytics', icon: TrendingUp, badge: null },
    { value: 'content', label: 'Content', icon: FileText, badge: questions.length },
  ]

  const filteredUsers = userSearch
    ? users.filter((u) => u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()))
    : users

  const orderStatuses = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'] as const
  const ordersByKanbanStatus = (status: string) => orders.filter((o) => o.status === status)

  const statusColors: Record<string, { text: string; bg: string; dot: string }> = {
    PLACED: { text: A.amber, bg: A.amberLight, dot: A.amber },
    CONFIRMED: { text: A.blue, bg: A.blueLight, dot: A.blue },
    SHIPPED: { text: '#7c3aed', bg: '#f3f0ff', dot: '#7c3aed' },
    DELIVERED: { text: A.green, bg: A.greenLight, dot: A.green },
    CANCELLED: { text: A.red, bg: A.redLight, dot: A.red },
    ACTIVE: { text: A.green, bg: A.greenLight, dot: A.green },
    PAUSED: { text: A.amber, bg: A.amberLight, dot: A.amber },
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const c = statusColors[status] || { text: A.textMuted, bg: A.borderLight, dot: A.textMuted }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium" style={{ color: c.text, background: c.bg }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
        {status}
      </span>
    )
  }

  // ─── Render Content by Tab ──────────────────────────────
  const renderContent = () => {
    switch (adminTab) {
      // ─── DASHBOARD TAB ───────────────────────────────────
      case 'dashboard':
        return (
          <div className="space-y-5">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: stats.totalUsers, icon: Users, color: A.green, bgColor: A.greenLight, trend: '+12%', sub: `${stats.learningCompleted || stats.learningCompletions} completed learning` },
                { label: 'QR Scans', value: stats.totalScans, icon: QrCode, color: A.blue, bgColor: A.blueLight, trend: '+8%', sub: `${campaigns.filter(c => c.status === 'ACTIVE').length} active campaigns` },
                { label: 'Total Orders', value: stats.totalOrders, icon: Package, color: A.lime, bgColor: A.limeLight, trend: '+23%', sub: `${orders.filter((o) => o.status === 'DELIVERED').length} delivered` },
                { label: 'Revenue', value: `₹${(stats.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: A.green, bgColor: A.greenLight, trend: '+15%', sub: `₹${stats.totalRevenue ? Math.round(stats.totalRevenue * 0.3).toLocaleString() : 0} this month` },
              ].map(card => (
                <div key={card.label} className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow" style={{ borderColor: A.border }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: card.bgColor }}>
                      <card.icon className="w-4 h-4" style={{ color: card.color }} />
                    </div>
                    <span className="text-[11px] font-medium px-1.5 py-0.5 rounded" style={{ color: A.green, background: A.greenLight }}>{card.trend}</span>
                  </div>
                  <p className="text-xl font-bold" style={{ color: A.text }}>{card.value}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: A.textSecondary }}>{card.label}</p>
                  <p className="text-[11px] mt-1" style={{ color: A.textMuted }}>{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="bg-white border rounded-lg p-5" style={{ borderColor: A.border }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold" style={{ color: A.text }}>Revenue Trend</h3>
                  <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: A.greenLight, color: A.green }}>6 months</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeebe5" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: A.textMuted }} axisLine={{ stroke: A.border }} />
                    <YAxis tick={{ fontSize: 11, fill: A.textMuted }} axisLine={{ stroke: A.border }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: `1px solid ${A.border}`, borderRadius: 8, color: A.text, fontSize: 12 }} />
                    <Line type="monotone" dataKey="revenue" stroke={A.green} strokeWidth={2} dot={{ r: 3, fill: A.green }} />
                    <Line type="monotone" dataKey="orders" stroke={A.lime} strokeWidth={2} dot={{ r: 3, fill: A.lime }} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white border rounded-lg p-5" style={{ borderColor: A.border }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold" style={{ color: A.text }}>Orders by Status</h3>
                  <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: A.blueLight, color: A.blue }}>{orders.length} total</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={ordersByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" strokeWidth={0}>
                      {ordersByStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: `1px solid ${A.border}`, borderRadius: 8, color: A.text, fontSize: 12 }} />
                    <Legend formatter={(value: string) => <span style={{ color: A.textSecondary, fontSize: 12 }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Activity + Quick Stats */}
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white border rounded-lg p-5" style={{ borderColor: A.border }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: A.text }}>Recent Activity</h3>
                <div className="space-y-1">
                  {(stats.recentUsers || []).slice(0, 4).map((u: UserProfile) => (
                    <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#f8f7f5] transition-colors">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: A.greenLight }}>
                        <span className="text-[11px] font-bold" style={{ color: A.green }}>{u.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: A.text }}>{u.name} <span style={{ color: A.textMuted }}>registered</span></p>
                        <p className="text-[11px]" style={{ color: A.textMuted }}>{new Date(u.created_at).toLocaleDateString()}</p>
                      </div>
                      <StatusBadge status={u.learning_completed ? 'DELIVERED' : 'PLACED'} />
                    </div>
                  ))}
                  {orders.slice(0, 3).map((o) => (
                    <div key={o.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#f8f7f5] transition-colors">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: A.blueLight }}>
                        <Package className="w-3.5 h-3.5" style={{ color: A.blue }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: A.text }}>Order ₹{(o.total_amount || 0).toLocaleString()}</p>
                        <p className="text-[11px]" style={{ color: A.textMuted }}>{new Date(o.created_at).toLocaleDateString()}</p>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border rounded-lg p-5" style={{ borderColor: A.border }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: A.text }}>Quick Stats</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12px]" style={{ color: A.textSecondary }}>Conversion Rate</span>
                      <span className="text-[12px] font-semibold" style={{ color: A.green }}>{stats.conversionRate}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: A.borderLight }}>
                      <div className="h-full rounded-full" style={{ width: `${stats.conversionRate}%`, background: A.green }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12px]" style={{ color: A.textSecondary }}>Learning Completion</span>
                      <span className="text-[12px] font-semibold" style={{ color: A.blue }}>{stats.totalUsers ? Math.round(((stats.learningCompleted || stats.learningCompletions) / stats.totalUsers) * 100) : 0}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: A.borderLight }}>
                      <div className="h-full rounded-full" style={{ width: `${stats.totalUsers ? Math.round(((stats.learningCompleted || stats.learningCompletions) / stats.totalUsers) * 100) : 0}%`, background: A.blue }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12px]" style={{ color: A.textSecondary }}>Order Fulfillment</span>
                      <span className="text-[12px] font-semibold" style={{ color: A.lime }}>{stats.totalOrders ? Math.round((orders.filter((o) => o.status === 'DELIVERED').length / stats.totalOrders) * 100) : 0}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: A.borderLight }}>
                      <div className="h-full rounded-full" style={{ width: `${stats.totalOrders ? Math.round((orders.filter((o) => o.status === 'DELIVERED').length / stats.totalOrders) * 100) : 0}%`, background: A.lime }} />
                    </div>
                  </div>
                  <Separator style={{ background: A.border }} />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg p-3 text-center" style={{ background: A.bg }}>
                      <p className="font-bold text-lg" style={{ color: A.text }}>{stats.learningCompleted || stats.learningCompletions}</p>
                      <p className="text-[10px]" style={{ color: A.textMuted }}>Completed</p>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ background: A.bg }}>
                      <p className="font-bold text-lg" style={{ color: A.text }}>{stats.totalUsers - (stats.learningCompleted || stats.learningCompletions)}</p>
                      <p className="text-[10px]" style={{ color: A.textMuted }}>Pending</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      // ─── USERS TAB ───────────────────────────────────────
      case 'users':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold" style={{ color: A.text }}>Users</h2>
                <p className="text-[12px]" style={{ color: A.textMuted }}>{users.length} registered users</p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: A.textMuted }} />
                <Input placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="pl-9 w-64 h-8 text-sm" style={{ background: '#fff', borderColor: A.border, color: A.text }} />
              </div>
            </div>
            <div className="bg-white border rounded-lg overflow-hidden" style={{ borderColor: A.border }}>
              <Table>
                <TableHeader>
                  <TableRow style={{ borderColor: A.borderLight }} className="hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>User</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Contact</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Learning</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id} className="hover:bg-[#f8f7f5]" style={{ borderColor: A.borderLight }}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: A.greenLight }}>
                            <span className="text-[11px] font-bold" style={{ color: A.green }}>{u.name?.charAt(0) || '?'}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: A.text }}>{u.name}</p>
                            {u.is_admin && <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ color: A.green, background: A.greenLight }}>Admin</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[12px]" style={{ color: A.textSecondary }}>{u.email || u.phone || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: A.borderLight }}>
                            <div className="h-full rounded-full" style={{ width: u.learning_completed ? '100%' : '0%', background: u.learning_completed ? A.green : A.amber }} />
                          </div>
                          <span className="text-[11px]" style={{ color: A.textMuted }}>{u.learning_completed ? '100%' : '0%'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[11px]" style={{ color: A.textMuted }}>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )

      // ─── CAMPAIGNS TAB ───────────────────────────────────
      case 'campaigns':
        return <CampaignManagerInner campaigns={campaigns} setCampaigns={setCampaigns} scans={scans} orders={orders} userId={userId} />

      // ─── QR CODES TAB ────────────────────────────────────
      case 'qr':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold" style={{ color: A.text }}>QR Codes</h2>
                <p className="text-[12px]" style={{ color: A.textMuted }}>Generate and manage QR codes for campaigns</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.filter(c => c.status === 'ACTIVE').map(campaign => {
                const campaignScans = scans.filter(s => s.campaign_id === campaign.id)
                const qrUrl = `https://notjustwatr.com/scan/${campaign.id}`
                return (
                  <div key={campaign.id} className="bg-white border rounded-lg p-5 text-center hover:shadow-sm transition-shadow" style={{ borderColor: A.border }}>
                    <div className="mb-4 inline-block p-3 bg-white rounded-lg border" style={{ borderColor: A.borderLight }}>
                      <QRCodeSVG value={qrUrl} size={120} bgColor="#ffffff" fgColor="#1f1e1c" level="M" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1" style={{ color: A.text }}>{campaign.name}</h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded mb-3" style={{ color: A.blue, background: A.blueLight }}>{campaign.channel}</span>
                    <div className="flex items-center justify-center gap-4 text-[11px] mb-4" style={{ color: A.textSecondary }}>
                      <span className="flex items-center gap-1"><Scan className="w-3 h-3" /> {campaignScans.length} scans</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 rounded-md text-[11px] h-8" style={{ borderColor: A.border, color: A.text }} onClick={() => { navigator.clipboard.writeText(qrUrl); toast.success('QR URL copied!') }}>
                        <Copy className="w-3 h-3 mr-1" /> Copy URL
                      </Button>
                    </div>
                  </div>
                )
              })}
              {campaigns.filter(c => c.status === 'ACTIVE').length === 0 && (
                <div className="col-span-full bg-white border rounded-lg py-16 text-center" style={{ borderColor: A.border }}>
                  <QrCode className="w-10 h-10 mx-auto mb-3" style={{ color: A.border }} />
                  <p className="text-sm" style={{ color: A.textMuted }}>No active campaigns. Create one to generate QR codes.</p>
                </div>
              )}
            </div>
          </div>
        )

      // ─── ORDERS TAB ──────────────────────────────────────
      case 'orders':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold" style={{ color: A.text }}>Orders</h2>
                <p className="text-[12px]" style={{ color: A.textMuted }}>{orders.length} total orders</p>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-md border" style={{ borderColor: A.border, background: '#fff' }}>
                <button onClick={() => setOrderView('table')} className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${orderView === 'table' ? 'text-white' : ''}`} style={orderView === 'table' ? { background: A.green, color: '#fff' } : { color: A.textSecondary }}>
                  <ClipboardList className="w-3.5 h-3.5 inline mr-1" /> Table
                </button>
                <button onClick={() => setOrderView('kanban')} className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${orderView === 'kanban' ? 'text-white' : ''}`} style={orderView === 'kanban' ? { background: A.green, color: '#fff' } : { color: A.textSecondary }}>
                  <Columns3 className="w-3.5 h-3.5 inline mr-1" /> Board
                </button>
              </div>
            </div>

            {orderView === 'kanban' ? (
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                {orderStatuses.map(status => {
                  const statusOrders = ordersByKanbanStatus(status)
                  const c = statusColors[status] || { text: A.textMuted, bg: A.bg, dot: A.textMuted }
                  return (
                    <div key={status} className="rounded-lg p-3" style={{ background: A.bg, border: `1px solid ${A.border}` }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: c.dot }} />
                          <h3 className="text-xs font-semibold" style={{ color: c.text }}>{status}</h3>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: c.text, background: c.bg }}>{statusOrders.length}</span>
                      </div>
                      <div className="space-y-2 max-h-[420px] overflow-y-auto">
                        {statusOrders.map((o) => (
                          <div key={o.id} className="bg-white border rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow" style={{ borderColor: A.border }} onClick={() => setSelectedOrder(o)}>
                            <p className="font-mono text-[9px] mb-1" style={{ color: A.textMuted }}>{o.id.slice(0, 10)}</p>
                            <p className="text-[12px] font-medium truncate" style={{ color: A.text }}>{(o as any).user?.name || 'Customer'}</p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="font-semibold text-[12px]" style={{ color: A.green }}>₹{(o.total_amount || 0).toLocaleString()}</p>
                              <Select value={o.status} onValueChange={async (newStatus) => { await orderService.updateStatus(o.id, newStatus, userId); setOrders(prev => prev.map(p => p.id === o.id ? { ...p, status: newStatus } : p)); toast.success('Status updated') }}>
                                <SelectTrigger className="h-5 text-[9px] w-[70px]" style={{ background: A.bg, borderColor: A.border, color: A.textSecondary }} onClick={e => e.stopPropagation()}><SelectValue /></SelectTrigger>
                                <SelectContent style={{ background: '#fff', borderColor: A.border }}>
                                  <SelectItem value="PLACED" style={{ color: A.text }}>Placed</SelectItem>
                                  <SelectItem value="CONFIRMED" style={{ color: A.text }}>Confirmed</SelectItem>
                                  <SelectItem value="SHIPPED" style={{ color: A.text }}>Shipped</SelectItem>
                                  <SelectItem value="DELIVERED" style={{ color: A.text }}>Delivered</SelectItem>
                                  <SelectItem value="CANCELLED" style={{ color: A.text }}>Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <p className="text-[9px] mt-1" style={{ color: A.textMuted }}>{new Date(o.created_at).toLocaleDateString()}</p>
                          </div>
                        ))}
                        {statusOrders.length === 0 && <p className="text-[10px] text-center py-6" style={{ color: A.textMuted }}>No orders</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white border rounded-lg overflow-hidden" style={{ borderColor: A.border }}>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent" style={{ borderColor: A.borderLight }}>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Order ID</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Customer</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Amount</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Status</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Payment</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => (
                      <TableRow key={o.id} className="hover:bg-[#f8f7f5] cursor-pointer" style={{ borderColor: A.borderLight }} onClick={() => setSelectedOrder(o)}>
                        <TableCell className="font-mono text-[11px]" style={{ color: A.textMuted }}>{o.id.slice(0, 10)}</TableCell>
                        <TableCell className="text-[12px]" style={{ color: A.text }}>{(o as any).user?.name || 'Customer'}</TableCell>
                        <TableCell className="font-semibold text-[12px]" style={{ color: A.green }}>₹{(o.total_amount || 0).toLocaleString()}</TableCell>
                        <TableCell><StatusBadge status={o.status} /></TableCell>
                        <TableCell className="text-[11px]" style={{ color: A.textSecondary }}>{o.payment_method || 'N/A'}</TableCell>
                        <TableCell className="text-[11px]" style={{ color: A.textMuted }}>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
              <DialogContent className="max-w-md" style={{ background: '#fff', borderColor: A.border, color: A.text }}>
                <DialogHeader><DialogTitle style={{ color: A.text }}>Order Details</DialogTitle></DialogHeader>
                {selectedOrder && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-[11px]" style={{ color: A.textMuted }}>Order ID</span><p className="font-mono text-[11px]" style={{ color: A.text }}>{selectedOrder.id}</p></div>
                      <div><span className="text-[11px]" style={{ color: A.textMuted }}>Customer</span><p className="font-medium" style={{ color: A.text }}>{(selectedOrder as any).user?.name || selectedOrder.user_id}</p></div>
                      <div><span className="text-[11px]" style={{ color: A.textMuted }}>Amount</span><p className="font-bold" style={{ color: A.green }}>₹{(selectedOrder.total_amount || 0).toLocaleString()}</p></div>
                      <div><span className="text-[11px]" style={{ color: A.textMuted }}>Status</span><StatusBadge status={selectedOrder.status} /></div>
                      <div><span className="text-[11px]" style={{ color: A.textMuted }}>Payment</span><p className="text-[11px]" style={{ color: A.text }}>{selectedOrder.payment_method || 'N/A'}</p></div>
                      <div><span className="text-[11px]" style={{ color: A.textMuted }}>Date</span><p className="text-[11px]" style={{ color: A.text }}>{new Date(selectedOrder.created_at).toLocaleDateString()}</p></div>
                    </div>
                    <Separator style={{ background: A.border }} />
                    <Select value={selectedOrder.status} onValueChange={async (newStatus) => { await orderService.updateStatus(selectedOrder.id, newStatus, userId); setOrders(prev => prev.map(p => p.id === selectedOrder.id ? { ...p, status: newStatus } : p)); setSelectedOrder({ ...selectedOrder, status: newStatus }); toast.success('Status updated') }}>
                      <SelectTrigger className="rounded-md" style={{ borderColor: A.border, color: A.text }}><SelectValue /></SelectTrigger>
                      <SelectContent style={{ background: '#fff', borderColor: A.border }}>
                        <SelectItem value="PLACED" style={{ color: A.text }}>Placed</SelectItem>
                        <SelectItem value="CONFIRMED" style={{ color: A.text }}>Confirmed</SelectItem>
                        <SelectItem value="SHIPPED" style={{ color: A.text }}>Shipped</SelectItem>
                        <SelectItem value="DELIVERED" style={{ color: A.text }}>Delivered</SelectItem>
                        <SelectItem value="CANCELLED" style={{ color: A.text }}>Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )

      // ─── SUBSCRIPTIONS TAB ───────────────────────────────
      case 'subscriptions':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold" style={{ color: A.text }}>Subscriptions</h2>
                <p className="text-[12px]" style={{ color: A.textMuted }}>{adminSubscriptions.length} total subscriptions</p>
              </div>
            </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: 'Active', value: adminSubscriptions.filter(s => s.status === 'ACTIVE').length, color: A.green, bgColor: A.greenLight },
                { label: 'Paused', value: adminSubscriptions.filter(s => s.status === 'PAUSED').length, color: A.amber, bgColor: A.amberLight },
                { label: 'Revenue', value: `₹${adminSubscriptions.filter(s => s.status === 'ACTIVE').reduce((sum, s) => sum + (s.unit_price || 0), 0).toLocaleString()}`, color: A.blue, bgColor: A.blueLight },
                { label: 'Total', value: adminSubscriptions.length, color: A.lime, bgColor: A.limeLight },
              ].map(card => (
                <div key={card.label} className="bg-white border rounded-lg p-4" style={{ borderColor: A.border }}>
                  <div className="w-8 h-8 rounded-md flex items-center justify-center mb-2" style={{ backgroundColor: card.bgColor }}>
                    <CreditCard className="w-4 h-4" style={{ color: card.color }} />
                  </div>
                  <p className="text-xl font-bold" style={{ color: A.text }}>{card.value}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: A.textMuted }}>{card.label}</p>
                </div>
              ))}
            </div>
            {/* Subscription Table */}
            <div className="bg-white border rounded-lg overflow-hidden" style={{ borderColor: A.border }}>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent" style={{ borderColor: A.borderLight }}>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>ID</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>User</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Product</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Pack</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Amount</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Status</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Next Delivery</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminSubscriptions.map(sub => {
                    const subUser = users.find(u => u.id === sub.user_id)
                    const subProduct = adminProducts.find(p => p.id === sub.product_id)
                    return (
                      <TableRow key={sub.id} className="hover:bg-[#f8f7f5]" style={{ borderColor: A.borderLight }}>
                        <TableCell className="font-mono text-[10px]" style={{ color: A.textMuted }}>{sub.id?.slice(0, 8)}</TableCell>
                        <TableCell className="text-[12px]" style={{ color: A.text }}>{subUser?.name || sub.user_id?.slice(0, 8)}</TableCell>
                        <TableCell className="text-[12px]" style={{ color: A.text }}>{subProduct?.name || sub.product_name || sub.product_id?.slice(0, 8)}</TableCell>
                        <TableCell className="text-[11px]" style={{ color: A.textSecondary }}>{sub.pack_type}</TableCell>
                        <TableCell className="font-semibold text-[12px]" style={{ color: A.green }}>₹{(sub.unit_price || 0).toLocaleString()}</TableCell>
                        <TableCell><StatusBadge status={sub.status} /></TableCell>
                        <TableCell className="text-[11px]" style={{ color: A.textMuted }}>{sub.next_delivery ? new Date(sub.next_delivery).toLocaleDateString() : '-'}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              {adminSubscriptions.length === 0 && (
                <div className="py-16 text-center">
                  <CreditCard className="w-10 h-10 mx-auto mb-3" style={{ color: A.border }} />
                  <p className="text-sm" style={{ color: A.textMuted }}>No subscriptions yet.</p>
                </div>
              )}
            </div>
          </div>
        )

      // ─── ANALYTICS TAB ───────────────────────────────────
      case 'analytics':
        return (
          <div className="space-y-4">
            <h2 className="text-base font-semibold" style={{ color: A.text }}>Analytics</h2>
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="bg-white border rounded-lg p-5" style={{ borderColor: A.border }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: A.text }}>Campaigns by Channel</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={campaignsByChannel}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeebe5" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: A.textMuted }} axisLine={{ stroke: A.border }} />
                    <YAxis tick={{ fontSize: 10, fill: A.textMuted }} axisLine={{ stroke: A.border }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: `1px solid ${A.border}`, borderRadius: 8, color: A.text, fontSize: 12 }} />
                    <Bar dataKey="value" fill={A.lime} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white border rounded-lg p-5" style={{ borderColor: A.border }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: A.text }}>Orders by Status</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={ordersByStatus}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeebe5" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: A.textMuted }} axisLine={{ stroke: A.border }} />
                    <YAxis tick={{ fontSize: 10, fill: A.textMuted }} axisLine={{ stroke: A.border }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: `1px solid ${A.border}`, borderRadius: 8, color: A.text, fontSize: 12 }} />
                    <Bar dataKey="value" fill={A.green} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white border rounded-lg p-5" style={{ borderColor: A.border }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: A.text }}>Conversion Funnel</h3>
                <div className="flex items-center justify-center h-[280px]">
                  <div className="text-center">
                    <p className="text-5xl font-bold" style={{ color: A.green }}>{stats.conversionRate}%</p>
                    <p className="mt-2 text-sm" style={{ color: A.textSecondary }}>Learning Completion Rate</p>
                    <div className="mt-6 grid grid-cols-2 gap-6">
                      <div className="rounded-lg p-4" style={{ background: A.bg }}><p className="font-bold text-xl" style={{ color: A.green }}>{stats.learningCompleted || stats.learningCompletions}</p><p className="text-[11px]" style={{ color: A.textMuted }}>Completed</p></div>
                      <div className="rounded-lg p-4" style={{ background: A.bg }}><p className="font-bold text-xl" style={{ color: A.amber }}>{stats.totalUsers - (stats.learningCompleted || stats.learningCompletions)}</p><p className="text-[11px]" style={{ color: A.textMuted }}>Pending</p></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white border rounded-lg p-5" style={{ borderColor: A.border }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: A.text }}>Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeebe5" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: A.textMuted }} axisLine={{ stroke: A.border }} />
                    <YAxis tick={{ fontSize: 10, fill: A.textMuted }} axisLine={{ stroke: A.border }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: `1px solid ${A.border}`, borderRadius: 8, color: A.text, fontSize: 12 }} />
                    <Line type="monotone" dataKey="revenue" stroke={A.green} strokeWidth={2.5} dot={{ r: 4, fill: A.green }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )

      // ─── CONTENT TAB ─────────────────────────────────────
      case 'content':
        return <QuizManagerInner questions={questions} setQuestions={setQuestions} />

      // ─── PRODUCTS TAB ────────────────────────────────────
      case 'products': {
        const filteredProducts = adminProducts.filter(p => {
          const matchSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.type.toLowerCase().includes(productSearch.toLowerCase()) || (p.category || '').toLowerCase().includes(productSearch.toLowerCase()) || (p.brand || '').toLowerCase().includes(productSearch.toLowerCase())
          const matchFilter = productFilter === 'all' || (productFilter === 'active' ? p.active : !p.active)
          return matchSearch && matchFilter
        })
        const getGalleryUrls = (): string[] => newProduct.gallery_images ? newProduct.gallery_images.split(',').filter(u => u.trim()) : []
        const addGalleryImage = (url: string) => { const urls = getGalleryUrls(); urls.push(url); setNewProduct({ ...newProduct, gallery_images: urls.join(',') }) }
        const removeGalleryImage = (index: number) => { const urls = getGalleryUrls(); urls.splice(index, 1); setNewProduct({ ...newProduct, gallery_images: urls.join(',') }) }
        return (
          <div className="space-y-5">
            {/* ═══ HEADER ═══ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold" style={{ color: A.text }}>Products</h2>
                <p className="text-[12px]" style={{ color: A.textMuted }}>{adminProducts.length} products · {adminProducts.filter(p => p.active).length} active · {adminProducts.filter(p => p.featured).length} featured</p>
              </div>
              <Dialog open={showAddProduct} onOpenChange={(open) => { setShowAddProduct(open); if (!open) resetProductForm() }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2 text-xs font-bold rounded-lg shadow-sm" style={{ background: A.green, color: '#fff' }}>
                    <Plus className="w-4 h-4" /> Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[92vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle className="text-lg">{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                    <DialogDescription>{editingProduct ? 'Update product details.' : 'Fill in details to create a new product.'}</DialogDescription>
                  </DialogHeader>
                  <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <TabsList className="w-full grid grid-cols-4 h-9 shrink-0">
                      <TabsTrigger value="basic" className="text-[11px] gap-1"><Package className="w-3 h-3" />Basic</TabsTrigger>
                      <TabsTrigger value="pricing" className="text-[11px] gap-1"><Tag className="w-3 h-3" />Classification</TabsTrigger>
                      <TabsTrigger value="details" className="text-[11px] gap-1"><Info className="w-3 h-3" />Details</TabsTrigger>
                      <TabsTrigger value="status" className="text-[11px] gap-1"><Shield className="w-3 h-3" />Status</TabsTrigger>
                    </TabsList>

                    {/* ─── TAB 1: Basic Info ─── */}
                    <TabsContent value="basic" className="flex-1 min-h-0 mt-0 overflow-y-auto" style={{ maxHeight: 'calc(92vh - 180px)' }}>
                      <div className="space-y-5 p-1 pr-3">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Main Product Image</Label>
                          <div className="flex items-start gap-4">
                            <div className="relative w-36 h-36 rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center group cursor-pointer shrink-0" style={{ borderColor: newProduct.image_url ? A.green : A.border, background: newProduct.image_url ? 'transparent' : A.bg }}>
                              {newProduct.image_url ? (
                                <img src={newProduct.image_url} alt="Product" className="w-full h-full object-cover" />
                              ) : (
                                <div className="text-center">
                                  <p className="text-[9px]" style={{ color: A.textMuted }}>Click to upload</p>
                                </div>
                              )}
                              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async e => {
                                const file = e.target.files?.[0]
                                if (file) { setUploadingImage(true); const url = await handleImageUploadApi(file); setUploadingImage(false); if (url) setNewProduct({ ...newProduct, image_url: url }) }
                              }} />
                            </div>
                            <div className="flex-1 space-y-2">
                              <Button variant="outline" size="sm" className="text-xs gap-1.5 w-full" disabled={uploadingImage}>
                                {uploadingImage ? 'Uploading...' : 'Upload Image'}
                              </Button>
                              <Input placeholder="Or paste image URL..." value={newProduct.image_url} onChange={e => setNewProduct({ ...newProduct, image_url: e.target.value })} className="text-xs h-8" />
                            </div>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-3">
                          <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Basic Information</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                              <Label className="text-xs mb-1">Product Name *</Label>
                              <Input placeholder="e.g. NOTJUST Watr Berry Blast" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="text-sm h-9" />
                            </div>
                            <div className="sm:col-span-2">
                              <Label className="text-xs mb-1">Short Description</Label>
                              <Input placeholder="Brief one-liner" value={newProduct.short_description} onChange={e => setNewProduct({ ...newProduct, short_description: e.target.value })} className="text-sm h-9" />
                            </div>
                            <div className="sm:col-span-2">
                              <Label className="text-xs mb-1">Full Description</Label>
                              <Textarea placeholder="Detailed description..." rows={3} value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="text-sm resize-none" />
                            </div>
                            <div>
                              <Label className="text-xs mb-1">Brand</Label>
                              <Input placeholder="NOTJUST" value={newProduct.brand} onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })} className="text-sm h-9" />
                            </div>
                            <div>
                              <Label className="text-xs mb-1">Flavor</Label>
                              <Input placeholder="e.g. Original" value={newProduct.flavor} onChange={e => setNewProduct({ ...newProduct, flavor: e.target.value })} className="text-sm h-9" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* ─── TAB 2: Classification & Pricing ─── */}
                    <TabsContent value="pricing" className="flex-1 min-h-0 mt-0 overflow-y-auto" style={{ maxHeight: 'calc(92vh - 180px)' }}>
                      <div className="space-y-5 p-1 pr-3">
                        <div className="space-y-3">
                          <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Classification</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs mb-1">Product Type *</Label>
                              <Select value={newProduct.type} onValueChange={v => setNewProduct({ ...newProduct, type: v })}>
                                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {['FIZZ', 'STILL', 'BERRY', 'HERBAL', 'OTHER'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs mb-1">Category</Label>
                              <Select value={newProduct.category} onValueChange={v => setNewProduct({ ...newProduct, category: v })}>
                                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {['Wellness Shot', 'Health Drink', 'Supplement', 'Functional Beverage', 'Other'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-3">
                          <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Pricing</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs mb-1">Selling Price (₹) *</Label>
                              <Input type="number" placeholder="2999" value={newProduct.price || ''} onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })} className="text-sm h-9" />
                            </div>
                            <div>
                              <Label className="text-xs mb-1">MRP (₹)</Label>
                              <Input type="number" placeholder="3499" value={newProduct.mrp || ''} onChange={e => setNewProduct({ ...newProduct, mrp: Number(e.target.value) })} className="text-sm h-9" />
                            </div>
                            <div>
                              <Label className="text-xs mb-1">Stock Quantity</Label>
                              <Input type="number" placeholder="500" value={newProduct.stock || ''} onChange={e => setNewProduct({ ...newProduct, stock: Number(e.target.value) })} className="text-sm h-9" />
                            </div>
                            <div>
                              <Label className="text-xs mb-1">Discount Label</Label>
                              <Input placeholder="e.g. Launch Offer" value={newProduct.discount_label} onChange={e => setNewProduct({ ...newProduct, discount_label: e.target.value })} className="text-sm h-9" />
                            </div>
                          </div>
                          {newProduct.mrp && newProduct.mrp > newProduct.price && (
                            <div className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold" style={{ background: A.greenLight, color: A.green }}>
                              <Tag className="w-3.5 h-3.5" />
                              {Math.round((1 - newProduct.price / newProduct.mrp) * 100)}% off — Save ₹{(newProduct.mrp - newProduct.price).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    {/* ─── TAB 3: Details ─── */}
                    <TabsContent value="details" className="flex-1 min-h-0 mt-0 overflow-y-auto" style={{ maxHeight: 'calc(92vh - 180px)' }}>
                      <div className="space-y-5 p-1 pr-3">
                        <div className="space-y-3">
                          <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Ingredients & Nutrition</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                              <Label className="text-xs mb-1">Ingredients</Label>
                              <Textarea placeholder="Key ingredients..." rows={2} value={newProduct.ingredients} onChange={e => setNewProduct({ ...newProduct, ingredients: e.target.value })} className="text-sm resize-none" />
                            </div>
                            <div className="sm:col-span-2">
                              <Label className="text-xs mb-1">Nutrition Info</Label>
                              <Textarea placeholder="Calories, sugar..." rows={2} value={newProduct.nutrition_info} onChange={e => setNewProduct({ ...newProduct, nutrition_info: e.target.value })} className="text-sm resize-none" />
                            </div>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-3">
                          <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Highlights & Tags</Label>
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <Label className="text-xs mb-1">Highlights (comma separated)</Label>
                              <Input placeholder="e.g. Zero sugar, Zero calories" value={newProduct.highlights} onChange={e => setNewProduct({ ...newProduct, highlights: e.target.value })} className="text-sm h-9" />
                            </div>
                            <div>
                              <Label className="text-xs mb-1">Tags (comma separated)</Label>
                              <Input placeholder="e.g. vegan, sugar-free" value={newProduct.tags} onChange={e => setNewProduct({ ...newProduct, tags: e.target.value })} className="text-sm h-9" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* ─── TAB 4: Status ─── */}
                    <TabsContent value="status" className="flex-1 min-h-0 mt-0 overflow-y-auto" style={{ maxHeight: 'calc(92vh - 180px)' }}>
                      <div className="space-y-5 p-1 pr-3">
                        <div className="space-y-3">
                          <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Visibility</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center justify-between rounded-lg p-3" style={{ background: A.bg }}>
                              <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4" style={{ color: A.green }} />
                                <div>
                                  <Label className="text-xs font-medium" style={{ color: A.text }}>Active</Label>
                                  <p className="text-[10px]" style={{ color: A.textMuted }}>Visible to customers</p>
                                </div>
                              </div>
                              <Switch checked={newProduct.active} onCheckedChange={v => setNewProduct({ ...newProduct, active: v })} />
                            </div>
                            <div className="flex items-center justify-between rounded-lg p-3" style={{ background: A.bg }}>
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4" style={{ color: A.lime }} />
                                <div>
                                  <Label className="text-xs font-medium" style={{ color: A.text }}>Featured</Label>
                                  <p className="text-[10px]" style={{ color: A.textMuted }}>Highlight on storefront</p>
                                </div>
                              </div>
                              <Switch checked={newProduct.featured} onCheckedChange={v => setNewProduct({ ...newProduct, featured: v })} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  <DialogFooter className="gap-2 pt-2 border-t" style={{ borderColor: A.borderLight }}>
                    <Button variant="outline" onClick={() => { setShowAddProduct(false); resetProductForm() }} className="text-sm">Cancel</Button>
                    <Button onClick={handleSaveProduct} disabled={!newProduct.name || !newProduct.price || uploadingImage} className="text-sm font-bold gap-2" style={{ background: A.green, color: '#fff' }}>
                      {editingProduct ? <><Save className="w-4 h-4" /> Save Changes</> : <><Plus className="w-4 h-4" /> Create Product</>}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* ═══ QUICK STATS ═══ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Products', value: adminProducts.length, icon: Package, color: A.green, bg: A.greenLight },
                { label: 'Active', value: adminProducts.filter(p => p.active).length, icon: Eye, color: A.blue, bg: A.blueLight },
                { label: 'Featured', value: adminProducts.filter(p => p.featured).length, icon: Star, color: A.lime, bg: A.limeLight },
                { label: 'Out of Stock', value: adminProducts.filter(p => p.stock === 0).length, icon: AlertCircle, color: A.red, bg: A.redLight },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl p-4 transition-shadow hover:shadow-md" style={{ background: stat.bg }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.7)' }}>
                      <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: stat.color }}>{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* ═══ SEARCH & FILTER ═══ */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: A.textMuted }} />
                <Input placeholder="Search by name, type, category, or brand..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="pl-9 h-9 text-sm" />
              </div>
              <div className="flex gap-1.5">
                {(['all', 'active', 'inactive'] as const).map(filter => (
                  <button key={filter} onClick={() => setProductFilter(filter)} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${productFilter === filter ? 'text-white' : ''}`} style={productFilter === filter ? { background: A.green, color: '#fff' } : { background: A.bg, color: A.textSecondary }}>
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* ═══ PRODUCT CARDS GRID ═══ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map(product => {
                const vCount = productVideoCounts[product.id] || 0
                const qCount = productQuizCounts[product.id] || 0
                const discount = product.mrp && product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0

                return (
                  <div key={product.id} className="rounded-xl border overflow-hidden transition-all hover:shadow-lg group" style={{ borderColor: A.border, background: '#fff' }}>
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden" style={{ background: A.bg }}>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="w-12 h-12" style={{ color: A.textMuted }} />
                        </div>
                      )}
                      {/* Badges overlay */}
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {discount > 0 && <Badge className="text-[9px] font-bold px-1.5 py-0 h-5 rounded-md" style={{ background: A.red, color: '#fff' }}>{discount}% OFF</Badge>}
                        {product.featured && <Badge className="text-[9px] font-bold px-1.5 py-0 h-5 rounded-md" style={{ background: A.lime, color: '#fff' }}>Featured</Badge>}
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge className="text-[9px] font-bold px-1.5 py-0 h-5 rounded-md" style={{ background: product.active ? A.green : A.red, color: '#fff' }}>
                          {product.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-semibold rounded-md" style={{ borderColor: A.green, color: A.green }}>{product.type}</Badge>
                        {product.category && <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 rounded-md" style={{ borderColor: A.border, color: A.textSecondary }}>{product.category}</Badge>}
                      </div>

                      <h3 className="text-sm font-bold leading-tight" style={{ color: A.text }}>{product.name}</h3>

                      {product.short_description && <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: A.textSecondary }}>{product.short_description}</p>}

                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold" style={{ color: A.green }}>₹{product.price.toLocaleString()}</span>
                        {product.mrp && product.mrp > product.price && <span className="text-xs line-through" style={{ color: A.textMuted }}>₹{product.mrp.toLocaleString()}</span>}
                      </div>

                      {/* Mini Stats */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        {[
                          { label: 'Videos', value: vCount, icon: Play },
                          { label: 'Quizzes', value: qCount, icon: BookOpen },
                          { label: 'Stock', value: product.stock, icon: Package },
                        ].map(s => (
                          <div key={s.label} className="text-center p-1.5 rounded-lg" style={{ background: A.bg }}>
                            <s.icon className="w-3 h-3 mx-auto mb-0.5" style={{ color: A.textMuted }} />
                            <p className="text-[10px] font-bold" style={{ color: A.text }}>{s.value}</p>
                            <p className="text-[8px]" style={{ color: A.textMuted }}>{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 pt-2 border-t" style={{ borderColor: A.borderLight }}>
                        <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1 flex-1" style={{ color: A.blue }} onClick={() => {
                          setEditingProduct(product)
                          setNewProduct({
                            name: product.name, description: product.description || '', short_description: product.short_description || '',
                            price: product.price, mrp: product.mrp || 0, stock: product.stock,
                            image_url: product.image_url || '', gallery_images: product.gallery_images || '',
                            type: product.type, category: product.category || 'Wellness Shot',
                            sku: product.sku || '', weight: product.weight || '',
                            ingredients: product.ingredients || '', nutrition_info: product.nutrition_info || '',
                            tags: product.tags || '', active: product.active, featured: product.featured || false,
                            brand: product.brand || '', flavor: product.flavor || '',
                            serving_size: product.serving_size || '', allergen_info: product.allergen_info || '',
                            storage_info: product.storage_info || '', shelf_life: product.shelf_life || '',
                            country_origin: product.country_origin || '', fssai_license: product.fssai_license || '',
                            hsn_code: product.hsn_code || '', gst_rate: product.gst_rate || 0,
                            min_order_qty: product.min_order_qty || 1, max_order_qty: product.max_order_qty || 10,
                            discount_label: product.discount_label || '', highlights: product.highlights || '',
                          })
                          setShowAddProduct(true)
                        }}>
                          <Pencil className="w-3 h-3" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1 flex-1" style={{ color: A.green }} onClick={() => loadLearningContent(product.id)}>
                          <BookOpen className="w-3 h-3" /> Learning
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1 flex-1" style={{ color: A.destructive }} onClick={async () => {
                          if (confirm('Delete this product?')) {
                            try {
                              await productService.delete(product.id, userId)
                              toast.success('Product deleted')
                              refreshData()
                            } catch {
                              toast.error('Failed to delete')
                            }
                          }
                        }}>
                          <Trash2 className="w-3 h-3" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <Package className="w-14 h-14 mx-auto mb-3" style={{ color: A.textMuted }} />
                  <p className="text-sm font-semibold" style={{ color: A.textSecondary }}>No products found</p>
                </div>
              )}
            </div>

            {/* ═══ MANAGE LEARNING CONTENT DIALOG ═══ */}
            <Dialog open={showManageLearning} onOpenChange={(open) => { setShowManageLearning(open); if (!open) { setLearningProductId(null); setLearningVideos([]); setLearningQuizzes([]); setShowAddVideo(false); setShowAddQuiz(false); setEditingVideo(null); setEditingQuiz(null) } }}>
              <DialogContent className="sm:max-w-[900px] max-h-[92vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5" style={{ color: A.green }} /> Manage Learning Content
                  </DialogTitle>
                  <DialogDescription>
                    {learningProductId ? `Manage content for ${adminProducts.find(p => p.id === learningProductId)?.name || 'product'}` : 'Select a product'}
                  </DialogDescription>
                </DialogHeader>

                {learningLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <RefreshCw className="w-8 h-8 animate-spin" style={{ color: A.green }} />
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-6 pr-1" style={{ maxHeight: 'calc(92vh - 120px)' }}>
                    {/* ─── VIDEOS SECTION ─── */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: A.text }}>
                          <Play className="w-4 h-4" style={{ color: A.green }} /> Videos ({learningVideos.length})
                        </h3>
                        <Button size="sm" className="text-xs gap-1 h-7" style={{ background: A.green, color: '#fff' }} onClick={() => { setShowAddVideo(true); setEditingVideo(null); setNewVideo({ title: '', duration: '', description: '', order: learningVideos.length + 1, video_url: '' }) }}>
                          <Plus className="w-3 h-3" /> Add Video
                        </Button>
                      </div>

                      {learningVideos.length === 0 ? (
                        <div className="text-center py-8 rounded-lg" style={{ background: A.bg }}>
                          <Play className="w-8 h-8 mx-auto mb-2" style={{ color: A.textMuted }} />
                          <p className="text-xs" style={{ color: A.textMuted }}>No videos yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {learningVideos.map((video, idx) => (
                            <div key={video.id} className="flex items-start gap-2 p-3 rounded-lg border group" style={{ borderColor: A.borderLight, background: '#fff' }}>
                              <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
                                <button onClick={() => handleReorderVideo(video.id, 'up')} disabled={idx === 0} className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronUp className="w-3 h-3" style={{ color: A.textMuted }} /></button>
                                <button onClick={() => handleReorderVideo(video.id, 'down')} disabled={idx === learningVideos.length - 1} className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronDown className="w-3 h-3" style={{ color: A.textMuted }} /></button>
                              </div>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold" style={{ background: A.greenLight, color: A.green }}>{video.order}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold truncate" style={{ color: A.text }}>{video.title}</p>
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 shrink-0" style={{ borderColor: A.border, color: A.textMuted }}>{video.duration}</Badge>
                                </div>
                                <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: A.textMuted }}>{video.description}</p>
                                {/* Quizzes for this video */}
                                {learningQuizzes.filter(q => q.video_id === video.id).length > 0 && (
                                  <div className="mt-2 space-y-1.5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Quiz ({learningQuizzes.filter(q => q.video_id === video.id).length})</p>
                                    {learningQuizzes.filter(q => q.video_id === video.id).map((quiz) => (
                                      <div key={quiz.id} className="flex items-start gap-1.5 p-2 rounded-md border" style={{ borderColor: A.borderLight, background: A.bg }}>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[11px] font-medium" style={{ color: A.text }}>{quiz.question}</p>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {quiz.options.map((opt, oi) => (
                                              <span key={oi} className={`text-[9px] px-1.5 py-0.5 rounded ${oi === quiz.answer ? 'font-bold' : ''}`} style={{ background: oi === quiz.answer ? A.limeLight : A.bg, color: oi === quiz.answer ? A.green : A.textMuted }}>
                                                {String.fromCharCode(65 + oi)}: {opt}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                        <div className="flex gap-0.5 shrink-0">
                                          <button className="p-1 rounded hover:bg-red-50" style={{ color: A.red }} onClick={() => handleDeleteQuiz(quiz.id)}><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-0.5 shrink-0">
                                <button className="p-1.5 rounded hover:bg-blue-50" style={{ color: A.blue }} onClick={() => { setEditingVideo(video); setShowAddVideo(true); setNewVideo({ title: video.title, duration: video.duration, description: video.description || '', order: video.order, video_url: video.video_url || '' }) }}><Pencil className="w-3.5 h-3.5" /></button>
                                <button className="p-1.5 rounded hover:bg-red-50" style={{ color: A.red }} onClick={() => handleDeleteVideo(video.id)}><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ─── ADD/EDIT VIDEO FORM ─── */}
                    {showAddVideo && (
                      <div className="p-4 rounded-lg border" style={{ borderColor: A.lime, background: A.limeLight }}>
                        <h4 className="text-xs font-bold mb-3 flex items-center gap-1" style={{ color: A.green }}>
                          <Play className="w-3.5 h-3.5" /> {editingVideo ? 'Edit Video' : 'Add Video'}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-2"><Label className="text-xs mb-1">Title *</Label><Input placeholder="e.g. Introduction" value={newVideo.title} onChange={e => setNewVideo({ ...newVideo, title: e.target.value })} className="h-8 text-sm" /></div>
                          <div><Label className="text-xs mb-1">Duration</Label><Input placeholder="e.g. 4:32" value={newVideo.duration} onChange={e => setNewVideo({ ...newVideo, duration: e.target.value })} className="h-8 text-sm" /></div>
                          <div><Label className="text-xs mb-1">Order</Label><Input type="number" value={newVideo.order} onChange={e => setNewVideo({ ...newVideo, order: Number(e.target.value) })} className="h-8 text-sm" /></div>
                          <div className="sm:col-span-2"><Label className="text-xs mb-1">Description</Label><Textarea placeholder="Video description..." rows={2} value={newVideo.description} onChange={e => setNewVideo({ ...newVideo, description: e.target.value })} className="text-sm resize-none" /></div>
                          <div className="sm:col-span-2"><Label className="text-xs mb-1">Video URL</Label><Input placeholder="https://..." value={newVideo.video_url} onChange={e => setNewVideo({ ...newVideo, video_url: e.target.value })} className="h-8 text-sm" /></div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" className="text-xs h-7" style={{ background: A.green, color: '#fff' }} onClick={handleSaveVideo}><Save className="w-3 h-3 mr-1" /> {editingVideo ? 'Update' : 'Add'} Video</Button>
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setShowAddVideo(false); setEditingVideo(null) }}>Cancel</Button>
                        </div>
                      </div>
                    )}

                    {/* ─── ADD/EDIT QUIZ FORM ─── */}
                    {showAddQuiz && (
                      <div className="p-4 rounded-lg border" style={{ borderColor: A.blue, background: A.blueLight }}>
                        <h4 className="text-xs font-bold mb-3 flex items-center gap-1" style={{ color: A.blue }}>
                          <BookOpen className="w-3.5 h-3.5" /> {editingQuiz ? 'Edit Quiz' : 'Add Quiz'}
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          <div><Label className="text-xs mb-1">Question *</Label><Input placeholder="What is the main benefit?" value={newQuiz.question} onChange={e => setNewQuiz({ ...newQuiz, question: e.target.value })} className="h-8 text-sm" /></div>
                          <div>
                            <Label className="text-xs mb-1">Linked Video *</Label>
                            <Select value={newQuiz.video_id} onValueChange={v => setNewQuiz({ ...newQuiz, video_id: v })}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select video..." /></SelectTrigger>
                              <SelectContent>
                                {learningVideos.map(v => <SelectItem key={v.id} value={v.id}>{v.title}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {newQuiz.options.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <button onClick={() => setNewQuiz({ ...newQuiz, answer: i })} className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold border-2 transition-colors" style={{ borderColor: i === newQuiz.answer ? A.green : A.border, background: i === newQuiz.answer ? A.greenLight : 'transparent', color: i === newQuiz.answer ? A.green : A.textMuted }}>
                                  {String.fromCharCode(65 + i)}
                                </button>
                                <Input placeholder={`Option ${String.fromCharCode(65 + i)}`} value={opt} onChange={e => { const opts = [...newQuiz.options]; opts[i] = e.target.value; setNewQuiz({ ...newQuiz, options: opts }) }} className="h-8 text-sm flex-1" />
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div><Label className="text-xs mb-1">Category</Label><Input placeholder="e.g. intro, usage" value={newQuiz.category} onChange={e => setNewQuiz({ ...newQuiz, category: e.target.value })} className="h-8 text-sm" /></div>
                            <div>
                              <Label className="text-xs mb-1">Difficulty</Label>
                              <Select value={newQuiz.difficulty} onValueChange={v => setNewQuiz({ ...newQuiz, difficulty: v })}>
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>{['EASY', 'MEDIUM', 'HARD'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div><Label className="text-xs mb-1">Order</Label><Input type="number" value={newQuiz.order} onChange={e => setNewQuiz({ ...newQuiz, order: Number(e.target.value) })} className="h-8 text-sm" /></div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" className="text-xs h-7" style={{ background: A.blue, color: '#fff' }} onClick={handleSaveQuiz}><Save className="w-3 h-3 mr-1" /> {editingQuiz ? 'Update' : 'Add'} Question</Button>
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setShowAddQuiz(false); setEditingQuiz(null) }}>Cancel</Button>
                        </div>
                      </div>
                    )}

                    {/* ─── ADD QUIZ BUTTON ─── */}
                    {!showAddQuiz && learningVideos.length > 0 && (
                      <div className="flex justify-center pt-2">
                        <Button size="sm" className="text-xs gap-1 h-7" style={{ background: A.blue, color: '#fff' }} onClick={() => { setShowAddQuiz(true); setEditingQuiz(null); setNewQuiz({ question: '', options: ['', '', '', ''], answer: 0, category: '', difficulty: 'EASY', order: 1, video_id: learningVideos[0]?.id || '' }) }}>
                          <Plus className="w-3 h-3" /> Add Quiz Question
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )
      }

      default: return null
    }
  }

  // ─── Main Layout ────────────────────────────────────────
  return (
    <div className="min-h-screen flex" style={{ background: A.bg }}>
      {/* Sidebar — Dark */}
      <aside className={`${sidebarCollapsed ? 'w-[56px]' : 'w-[220px]'} flex flex-col flex-shrink-0 sticky top-0 h-screen transition-all duration-200`} style={{ background: A.sidebarBg, borderRight: '1px solid #2a2926' }}>
        <div className="px-3 py-3 flex items-center gap-2.5 h-[52px]" style={{ borderBottom: '1px solid #2a2926' }}>
          <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: A.green }}>
            <Leaf className="w-3.5 h-3.5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[12px] text-white truncate">NotJust</p>
              <p className="text-[8px]" style={{ color: '#6b6560' }}>Admin Console</p>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-5 h-5 rounded flex items-center justify-center hover:bg-[#2a2926] transition-colors flex-shrink-0" style={{ color: '#6b6560' }}>
            <ChevronLeft className={`w-3 h-3 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
          {sidebarItems.map(item => (
            <button key={item.value} onClick={() => setAdminTab(item.value)} className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all`} style={adminTab === item.value ? { background: A.green, color: '#fff' } : { color: A.sidebarText, background: 'transparent' }} onMouseEnter={e => { if (adminTab !== item.value) (e.currentTarget as HTMLElement).style.background = A.sidebarHover }} onMouseLeave={e => { if (adminTab !== item.value) (e.currentTarget as HTMLElement).style.background = 'transparent' }} title={sidebarCollapsed ? item.label : undefined}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && (<><span className="flex-1 text-left">{item.label}</span>{item.badge !== null && item.badge !== undefined && (<span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded`} style={adminTab === item.value ? { background: 'rgba(255,255,255,0.2)', color: '#fff' } : { background: '#2a2926', color: '#6b6560' }}>{item.badge}</span>)}</>)}
            </button>
          ))}
        </nav>
        <div className="px-3 py-3" style={{ borderTop: '1px solid #2a2926' }}>
          <button onClick={() => navigateTo('landing')} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all hover:bg-[#2a2926]" style={{ color: A.sidebarText }}>
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>Back to Site</span>}
          </button>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 mt-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: A.greenLight }}>
                <span className="font-bold text-[10px]" style={{ color: A.green }}>{user?.name?.charAt(0) || 'A'}</span>
              </div>
              <div className="flex-1 min-w-0"><p className="text-[11px] font-medium text-white truncate">{user?.name || 'Admin'}</p><p className="text-[9px]" style={{ color: '#6b6560' }}>Administrator</p></div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Area — Light */}
      <main className="flex-1 min-h-screen">
        {/* Top Bar */}
        <div className="bg-white border-b px-5 h-[52px] flex items-center justify-between sticky top-0 z-10" style={{ borderColor: A.border }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: A.greenLight }}>
                {(() => { const Item = sidebarItems.find(i => i.value === adminTab); return Item ? <Item.icon className="w-3 h-3" style={{ color: A.green }} /> : null })()}
              </div>
              <span className="font-semibold text-[13px]" style={{ color: A.text }}>{sidebarItems.find(i => i.value === adminTab)?.label || 'Overview'}</span>
            </div>
            <div className="h-4 w-px" style={{ background: A.border }} />
            <span className="text-[11px]" style={{ color: A.textMuted }}>
              {adminTab === 'dashboard' && `${stats.totalUsers} users · ${stats.totalOrders} orders · ₹${(stats.totalRevenue || 0).toLocaleString()} revenue`}
              {adminTab === 'users' && `${filteredUsers.length} shown`}
              {adminTab === 'campaigns' && `${campaigns.length} campaigns`}
              {adminTab === 'products' && `${adminProducts.length} products`}
              {adminTab === 'qr' && `${campaigns.filter(c => c.status === 'ACTIVE').length} QR codes`}
              {adminTab === 'orders' && `${orders.length} orders`}
              {adminTab === 'subscriptions' && `${adminSubscriptions.length} subscriptions`}
              {adminTab === 'analytics' && 'Real-time analytics'}
              {adminTab === 'content' && `${questions.length} questions`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {adminTab !== 'dashboard' && (
              <>
                <button onClick={() => {
                  if (adminTab === 'users') exportToCSV(filteredUsers, 'notjust-users', [{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }, { key: 'country', label: 'Country' }, { key: 'learning_completed', label: 'Learning' }, { key: 'created_at', label: 'Joined' }])
                  else if (adminTab === 'orders') exportToCSV(orders, 'notjust-orders', [{ key: 'id', label: 'Order ID' }, { key: 'status', label: 'Status' }, { key: 'total_amount', label: 'Amount' }, { key: 'created_at', label: 'Date' }])
                  else if (adminTab === 'campaigns') exportToCSV(campaigns, 'notjust-campaigns', [{ key: 'name', label: 'Name' }, { key: 'channel', label: 'Channel' }, { key: 'partner_name', label: 'Partner' }, { key: 'status', label: 'Status' }])
                }} className="h-7 px-2.5 rounded-md flex items-center gap-1.5 text-[11px] font-medium border transition-colors hover:bg-[#f8f7f5]" style={{ borderColor: A.border, color: A.textSecondary }} title="Export CSV">
                  <Download className="w-3 h-3" /> CSV
                </button>
              </>
            )}
            <button onClick={refreshData} className="w-7 h-7 rounded-md flex items-center justify-center border transition-colors hover:bg-[#f8f7f5]" style={{ borderColor: A.border, color: A.textMuted }} title="Refresh data"><RefreshCw className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <div className="p-5">{renderContent()}</div>
      </main>
    </div>
  )
}

// ============================================================
// CAMPAIGN MANAGER — Light Theme
// ============================================================
function CampaignManagerInner({ campaigns, setCampaigns, scans, orders, userId }: { campaigns: Campaign[]; setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>; scans: QrScan[]; orders: Order[]; userId: string }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null)
  const [form, setForm] = useState({ name: '', channel: 'HOTEL', partner_name: '', location: '' })

  const channelIcons: Record<string, string> = {
    HOTEL: '🏨', HOSPITAL: '🏥', CLINIC: '🏥', DOCTOR: '👨‍⚕️',
    EVENT: '🎉', CORPORATE: '🏢', INFLUENCER: '📱', WELLNESS: '🧘',
  }

  const handleCreate = async () => {
    if (!form.name) { toast.error('Campaign name is required'); return }
    try {
      const result = await campaignService.create(form as any, userId)
      setCampaigns(prev => [result, ...prev])
      toast.success('Campaign created')
      setDialogOpen(false)
      setForm({ name: '', channel: 'HOTEL', partner_name: '', location: '' })
    } catch {
      toast.error('Failed to create campaign')
    }
  }

  const toggleStatus = async (id: string, status: string) => {
    const newStatus = status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE'
    try {
      await campaignService.update(id, { status: newStatus }, userId)
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
      toast.success('Status updated')
    } catch {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: A.text }}>Campaigns</h2>
          <p className="text-[12px]" style={{ color: A.textMuted }}>{campaigns.length} total campaigns</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-md text-[12px] h-8 text-white" style={{ background: A.green }}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent style={{ background: '#fff', borderColor: A.border, color: A.text }}>
            <DialogHeader><DialogTitle style={{ color: A.text }}>Create Campaign</DialogTitle></DialogHeader>
            <div className="space-y-3 py-4">
              <div className="space-y-1.5"><Label style={{ color: A.textSecondary }}>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Campaign name" className="rounded-md" style={{ borderColor: A.border, color: A.text }} /></div>
              <div className="space-y-1.5">
                <Label style={{ color: A.textSecondary }}>Channel</Label>
                <Select value={form.channel} onValueChange={v => setForm(p => ({ ...p, channel: v }))}>
                  <SelectTrigger className="rounded-md" style={{ borderColor: A.border, color: A.text }}><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: '#fff', borderColor: A.border }}>
                    {['HOTEL', 'HOSPITAL', 'CLINIC', 'DOCTOR', 'EVENT', 'CORPORATE', 'INFLUENCER', 'WELLNESS'].map(c => <SelectItem key={c} value={c} style={{ color: A.text }}>{channelIcons[c]} {c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label style={{ color: A.textSecondary }}>Partner</Label><Input value={form.partner_name} onChange={e => setForm(p => ({ ...p, partner_name: e.target.value }))} className="rounded-md" style={{ borderColor: A.border, color: A.text }} /></div>
              <div className="space-y-1.5"><Label style={{ color: A.textSecondary }}>Location</Label><Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="rounded-md" style={{ borderColor: A.border, color: A.text }} /></div>
              <div className="flex items-center gap-2 p-3 rounded-md" style={{ background: A.greenLight, border: `1px solid ${A.green}20` }}>
                <QrCode className="w-4 h-4" style={{ color: A.green }} />
                <span className="text-[11px]" style={{ color: A.green }}>QR code will be auto-generated for this campaign</span>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} className="rounded-md text-white" style={{ background: A.green }}>Create & Generate QR</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {campaigns.map(campaign => {
          const qrUrl = `https://notjustwatr.com/scan/${campaign.id}`
          return (
            <div key={campaign.id} className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow" style={{ borderColor: A.border }}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 p-2 bg-white rounded-md border" style={{ borderColor: A.borderLight }}>
                  <QRCodeSVG value={qrUrl} size={56} bgColor="#ffffff" fgColor="#1f1e1c" level="L" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate" style={{ color: A.text }}>{campaign.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ color: A.blue, background: A.blueLight }}>{channelIcons[campaign.channel] || '📋'} {campaign.channel}</span>
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: A.textMuted }}>{campaign.partner_name || 'No partner'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${A.borderLight}` }}>
                <span className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded" style={campaign.status === 'ACTIVE' ? { color: A.green, background: A.greenLight } : { color: A.textMuted, background: A.bg }}>{campaign.status}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" style={{ color: A.textSecondary }} onClick={() => setDetailCampaign(campaign)}><Eye className="w-3 h-3 mr-0.5" /> View</Button>
                  <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" style={{ color: A.textSecondary }} onClick={() => toggleStatus(campaign.id, campaign.status)}>{campaign.status === 'ACTIVE' ? 'Archive' : 'Activate'}</Button>
                </div>
              </div>
            </div>
          )
        })}
        {campaigns.length === 0 && (
          <div className="col-span-full bg-white border rounded-lg py-16 text-center" style={{ borderColor: A.border }}>
            <Megaphone className="w-10 h-10 mx-auto mb-3" style={{ color: A.border }} />
            <p className="text-sm" style={{ color: A.textMuted }}>No campaigns yet. Create one to get started.</p>
          </div>
        )}
      </div>

      <Dialog open={!!detailCampaign} onOpenChange={() => setDetailCampaign(null)}>
        <DialogContent className="max-w-lg" style={{ background: '#fff', borderColor: A.border, color: A.text }}>
          <DialogHeader><DialogTitle style={{ color: A.text }}>Campaign Details</DialogTitle></DialogHeader>
          {detailCampaign && (
            <div className="space-y-4">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-white rounded-lg border" style={{ borderColor: A.border }}>
                  <QRCodeSVG value={`https://notjustwatr.com/scan/${detailCampaign.id}`} size={130} bgColor="#ffffff" fgColor="#1f1e1c" level="M" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-bold text-lg" style={{ color: A.text }}>{detailCampaign.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{ color: A.blue, background: A.blueLight }}>{channelIcons[detailCampaign.channel] || '📋'} {detailCampaign.channel}</span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded" style={detailCampaign.status === 'ACTIVE' ? { color: A.green, background: A.greenLight } : { color: A.textMuted, background: A.bg }}>{detailCampaign.status}</span>
                  </div>
                  <div className="text-[12px] space-y-1" style={{ color: A.textSecondary }}>
                    <p>Partner: {detailCampaign.partner_name || '-'}</p>
                    <p>Location: {detailCampaign.location || '-'}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="rounded-md text-[11px] h-8" style={{ borderColor: A.border, color: A.text }} onClick={() => { navigator.clipboard.writeText(`https://notjustwatr.com/scan/${detailCampaign.id}`); toast.success('QR URL copied!') }}>
                      <Copy className="w-3 h-3 mr-1" /> Copy URL
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-md text-[11px] h-8" style={{ borderColor: A.border, color: A.text }} onClick={() => toggleStatus(detailCampaign.id, detailCampaign.status)}>
                      {detailCampaign.status === 'ACTIVE' ? 'Archive' : 'Activate'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// QUIZ MANAGER — Light Theme
// ============================================================
function QuizManagerInner({ questions, setQuestions }: { questions: QuizQuestion[]; setQuestions: React.Dispatch<React.SetStateAction<QuizQuestion[]>> }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ question: '', option1: '', option2: '', option3: '', option4: '', answer: '0', category: 'usage', difficulty: 'EASY' })
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')

  const filtered = questions.filter(q => {
    if (filterCategory !== 'all' && q.category !== filterCategory) return false
    if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) return false
    return true
  })

  const categories = ['all', ...Array.from(new Set(questions.map(q => q.category).filter(Boolean)))]
  const difficulties = ['all', ...Array.from(new Set(questions.map(q => q.difficulty).filter(Boolean)))]

  const difficultyColors: Record<string, { text: string; bg: string }> = {
    EASY: { text: A.green, bg: A.greenLight },
    MEDIUM: { text: A.amber, bg: A.amberLight },
    HARD: { text: A.red, bg: A.redLight },
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: A.text }}>Quiz Questions</h2>
          <p className="text-[12px]" style={{ color: A.textMuted }}>{questions.length} total questions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-36 rounded-md h-8 text-[11px]" style={{ background: '#fff', borderColor: A.border, color: A.text }}><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent style={{ background: '#fff', borderColor: A.border }}>
            {categories.map(c => <SelectItem key={c} value={c || 'all'} style={{ color: A.text }}>{c === 'all' ? 'All Categories' : c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
          <SelectTrigger className="w-32 rounded-md h-8 text-[11px]" style={{ background: '#fff', borderColor: A.border, color: A.text }}><SelectValue placeholder="Difficulty" /></SelectTrigger>
          <SelectContent style={{ background: '#fff', borderColor: A.border }}>
            {difficulties.map(d => <SelectItem key={d} value={d} style={{ color: A.text }}>{d === 'all' ? 'All Levels' : d}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-[10px] px-2 py-0.5 rounded" style={{ color: A.textSecondary, background: A.bg }}>{filtered.length} shown</span>
      </div>

      {/* Questions Table */}
      <div className="bg-white border rounded-lg overflow-hidden" style={{ borderColor: A.border }}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent" style={{ borderColor: A.borderLight }}>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Question</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Category</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Difficulty</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Answer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((q, idx) => (
              <TableRow key={q.id || idx} className="hover:bg-[#f8f7f5]" style={{ borderColor: A.borderLight }}>
                <TableCell className="text-[12px] max-w-md truncate" style={{ color: A.text }}>{q.question}</TableCell>
                <TableCell><span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ color: A.blue, background: A.blueLight }}>{q.category || '-'}</span></TableCell>
                <TableCell><span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ color: (difficultyColors[q.difficulty]?.text) || A.textMuted, background: (difficultyColors[q.difficulty]?.bg) || A.bg }}>{q.difficulty || '-'}</span></TableCell>
                <TableCell className="text-[11px]" style={{ color: A.textSecondary }}>Option {(q.answer || 0) + 1}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ============================================================
// MAIN EXPORT — AdminPanel
// ============================================================
export default function AdminPanel() {
  const isMobile = useIsMobile()
  const { user, navigateTo } = useAppStore()

  if (!user?.is_admin) {
    navigateTo('landing')
    return null
  }

  // On mobile, still render the full dashboard (with responsive CSS)
  return <AdminDashboard />
}
