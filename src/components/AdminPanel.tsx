'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard, Package, BookOpen, Users, Megaphone,
  Plus, Pencil, Trash2, Copy, Search,
  Eye, EyeOff, Loader2,
  Shield, CheckCircle, XCircle, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  RefreshCw, Leaf, Video, Play, Scan, Edit, Save, Star, AlertCircle,
  HelpCircle, QrCode, ShoppingCart,
  FileText, CreditCard, X, Download, ExternalLink,
  TrendingUp,
  Info, Tag, Columns3, ClipboardList, DollarSign, Upload,
  Receipt, IndianRupee, Clock,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useAppStore } from '@/store/app-store'
import {
  productService, productVideoService, productQuizService,
  adminStatsService, userService, campaignService,
  orderService, subscriptionService, qrScanService, invoiceService,
  type Product, type ProductVideo, type ProductQuiz,
  type Campaign, type QrScan, type UserProfile,
  type Order, type Subscription, type Invoice, type InvoiceListItem,
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
const PUBLIC_SITE_URL = 'https://notjustwatr.com'

function slugifyProduct(product: Pick<Product, 'name' | 'slug'>) {
  return product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function buildProductUrl(product: Pick<Product, 'name' | 'slug'>, campaignId?: string | null) {
  const url = new URL('/product', PUBLIC_SITE_URL)
  if (campaignId) url.searchParams.set('campaign', campaignId)
  url.searchParams.set('product', slugifyProduct(product))
  return url.toString()
}

function buildCampaignUrl(campaign: Campaign, product?: Product | null) {
  if (product) return buildProductUrl(product, campaign.id)
  const url = new URL('/', PUBLIC_SITE_URL)
  url.searchParams.set('campaign', campaign.id)
  return url.toString()
}

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

// ─── Invoice line-item parser ─────────────────────────────
// The Invoice.items field is a JSON string; this safely parses it.
function parseInvoiceItems(itemsJson: string | undefined | null) {
  if (!itemsJson) return [] as Array<{ name: string; quantity: number; unit_price: number; total_price: number; pack_type?: string | null }>
  try {
    const parsed = JSON.parse(itemsJson)
    if (Array.isArray(parsed)) return parsed
    return []
  } catch {
    return []
  }
}

// ─── Image Upload Helper ──────────────────────────────────
async function handleImageUploadApi(file: File): Promise<string | null> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'image')
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

// ─── QR Code Download Helper ──────────────────────────────
function downloadQrCodeAsPng(svgElement: SVGElement | null, filename: string) {
  if (!svgElement) return
  const svgData = new XMLSerializer().serializeToString(svgElement)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const img = new Image()
  img.onload = () => {
    canvas.width = 400
    canvas.height = 400
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 400, 400)
    ctx.drawImage(img, 0, 0, 400, 400)
    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
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
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [editUserForm, setEditUserForm] = useState({ name: '', email: '', phone: '', age: '', gender: '', country: 'India', state: '', is_admin: false, learning_completed: false, new_password: '' })
  const [editUserLoading, setEditUserLoading] = useState(false)
  const [editUserError, setEditUserError] = useState<string | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null)
  const [deleteUserLoading, setDeleteUserLoading] = useState(false)
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
  const [showProductQrCodes, setShowProductQrCodes] = useState(false)
  const [qrPopupProduct, setQrPopupProduct] = useState<Product | null>(null)
  // Invoice state
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceListItem | null>(null)
  const [generatingInvoiceFor, setGeneratingInvoiceFor] = useState<string | null>(null)
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
  const [videoUploading, setVideoUploading] = useState(false)
  const learningScrollRef = useRef<HTMLDivElement>(null)
  const [newVideo, setNewVideo] = useState({ title: '', duration: '', description: '', order: 1, video_url: '', thumbnail_url: '' })
  const [newQuiz, setNewQuiz] = useState({ question: '', options: ['', '', '', ''], answer: 0, difficulty: 'EASY', order: 1, video_id: '' })
  const [quizQueue, setQuizQueue] = useState<Array<{ question: string; options: string[]; answer: number; difficulty: string; order: number; video_id: string }>>([])
  const [newProduct, setNewProduct] = useState({
    name: '', slug: '', description: '', short_description: '', price: 0, subscription_price: 0, mrp: 0, stock: 0,
    image_url: '', gallery_images: '', type: 'FIZZ', category: '',
    sku: '', weight: '', ingredients: '', nutrition_info: '', tags: '',
    active: true, featured: false,
    serving_size: '', allergen_info: '', storage_info: '',
    shelf_life: '', country_origin: '', fssai_license: '', hsn_code: '',
    gst_rate: 0, min_order_qty: 1, max_order_qty: 10, discount_label: '', highlights: '',
  })

  const resetProductForm = () => {
    setNewProduct({
      name: '', slug: '', description: '', short_description: '', price: 0, subscription_price: 0, mrp: 0, stock: 0,
      image_url: '', gallery_images: '', type: 'FIZZ', category: '',
      sku: '', weight: '', ingredients: '', nutrition_info: '', tags: '',
      active: true, featured: false,
      serving_size: '', allergen_info: '', storage_info: '',
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
      setNewVideo({ title: '', duration: '', description: '', order: learningVideos.length + 1, video_url: '', thumbnail_url: '' })
      loadLearningContent(learningProductId)
    } catch (err) {
      console.error('Failed to save video:', err)
      toast.error('Failed to save video — check console for details')
    }
  }

  // Save quiz (create or update) — also handles batch queue saving
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
      setNewQuiz({ question: '', options: ['', '', '', ''], answer: 0, difficulty: 'EASY', order: 1, video_id: '' })
      loadLearningContent(learningProductId)
    } catch (err) {
      console.error('Failed to save question:', err)
      toast.error('Failed to save question — check console for details')
    }
  }

  // Add current quiz form to queue (without API call)
  const handleAddQuizToQueue = () => {
    if (!newQuiz.question || !newQuiz.video_id) { toast.error('Question and video are required'); return }
    setQuizQueue(prev => [...prev, { ...newQuiz, options: [...newQuiz.options] }])
    toast.success('Question added to queue')
    setNewQuiz({ question: '', options: ['', '', '', ''], answer: 0, difficulty: 'EASY', order: quizQueue.length + 2, video_id: newQuiz.video_id })
  }

  // Remove a queued quiz question
  const handleRemoveFromQueue = (idx: number) => {
    setQuizQueue(prev => prev.filter((_, i) => i !== idx))
  }

  // Save all queued quiz questions at once
  const handleSaveAllQuizzes = async () => {
    if (!learningProductId) { toast.error('No product selected'); return }
    if (quizQueue.length === 0) { toast.error('Queue is empty'); return }
    let success = 0, failed = 0
    for (const q of quizQueue) {
      try {
        await productQuizService.create(learningProductId, { ...q, product_id: learningProductId, options: q.options } as any, userId)
        success++
      } catch { failed++ }
    }
    if (success > 0) toast.success(`${success} question${success > 1 ? 's' : ''} saved!`)
    if (failed > 0) toast.error(`${failed} question${failed > 1 ? 's' : ''} failed to save`)
    setQuizQueue([])
    setShowAddQuiz(false)
    loadLearningContent(learningProductId)
  }

  // Delete video
  const handleDeleteVideo = async (videoId: string) => {
    if (!learningProductId) return
    if (!confirm('Delete this video?')) return
    try {
      await productVideoService.delete(learningProductId, videoId, userId)
      toast.success('Video deleted')
      loadLearningContent(learningProductId)
    } catch (err) {
      console.error('Failed to delete video:', err)
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
    } catch (err) {
      console.error('Failed to delete question:', err)
      toast.error('Failed to delete question')
    }
  }

  const handleToggleProductLearningSkip = async () => {
    if (!learningProductId) return
    const shouldUnskip = learningVideos.length > 0 && learningVideos.every(v => v.active === false)
    if (!confirm(shouldUnskip ? 'Unskip learning for this product?' : 'Skip learning for this product? Existing videos and quizzes will be made inactive, not deleted.')) return
    try {
      const active = shouldUnskip
      await Promise.all([
        ...learningVideos.filter(v => v.active !== active).map(v => productVideoService.update(learningProductId, v.id, { active }, userId)),
        ...learningQuizzes.filter(q => q.active !== active).map(q => productQuizService.update(learningProductId, q.id, { active }, userId)),
      ])
      toast.success(shouldUnskip ? 'Product learning enabled' : 'Product learning skipped')
      loadLearningContent(learningProductId)
    } catch (err) {
      console.error('Failed to update learning skip:', err)
      toast.error('Failed to update learning skip')
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
      // Auto-generate slug from name if not provided
      const slug = newProduct.slug || newProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const productData = { ...newProduct, slug }
      if (editingProduct) {
        await productService.update(editingProduct.id, productData as any, userId)
        toast.success('Product updated!')
      } else {
        await productService.create(productData as any, userId)
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
        const [statsRes, usersRes, camps, productsRes, ordersRes, subsRes, invoicesRes] = await Promise.all([
          adminStatsService.get(userId),
          userService.list(undefined, userId),
          campaignService.list(),
          productService.getAllForAdmin(),
          orderService.getAll(userId),
          subscriptionService.getAll(userId),
          invoiceService.list(userId).catch(() => [] as InvoiceListItem[]),
        ])

        setStats(statsRes.stats)
        setUsers(usersRes.users)
        setCampaigns(camps)
        setAdminProducts(productsRes)
        setOrders(ordersRes)
        setAdminSubscriptions(subsRes)
        setInvoices(invoicesRes)

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

        // Fetch QR scans
        try {
          const scansRes = await qrScanService.list()
          setScans(scansRes)
        } catch {
          setScans([])
        }

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
      const [statsRes, usersRes, camps, productsRes, ordersRes, subsRes, invoicesRes] = await Promise.all([
        adminStatsService.get(userId),
        userService.list(undefined, userId),
        campaignService.list(),
        productService.getAllForAdmin(),
        orderService.getAll(userId),
        subscriptionService.getAll(userId),
        invoiceService.list(userId).catch(() => [] as InvoiceListItem[]),
      ])
      setStats(statsRes.stats)
      setUsers(usersRes.users)
      setCampaigns(camps)
      setAdminProducts(productsRes)
      setOrders(ordersRes)
      setAdminSubscriptions(subsRes)
      setInvoices(invoicesRes)
    } catch (err) {
      console.error('Failed to refresh data:', err)
    }
    setLoading(false)
  }

  // ─── Invoice handlers ───────────────────────────────────────
  const handleGenerateInvoice = async (orderId: string) => {
    setGeneratingInvoiceFor(orderId)
    try {
      const created = await invoiceService.create({ order_id: orderId }, userId)
      // Refresh invoices list and orders (so the order.invoice relation is updated)
      const [refreshedInvoices, refreshedOrders] = await Promise.all([
        invoiceService.list(userId).catch(() => [] as InvoiceListItem[]),
        orderService.getAll(userId),
      ])
      setInvoices(refreshedInvoices)
      setOrders(refreshedOrders)
      setSelectedInvoice(created)
      toast.success(`Invoice ${created.invoice_number} generated`)
    } catch (err: any) {
      console.error('Failed to generate invoice:', err)
      toast.error(err?.message || 'Failed to generate invoice')
    } finally {
      setGeneratingInvoiceFor(null)
    }
  }

  const openInvoice = (invoice: InvoiceListItem) => {
    setSelectedInvoice(invoice)
  }

  const handleInvoiceStatusChange = async (newStatus: string) => {
    if (!selectedInvoice) return
    try {
      const updated = await invoiceService.update(selectedInvoice.id, { status: newStatus }, userId)
      setSelectedInvoice(updated)
      setInvoices(prev => prev.map(i => i.id === updated.id ? updated : i))
      toast.success(`Invoice marked as ${newStatus}`)
    } catch (err: any) {
      console.error('Failed to update invoice:', err)
      toast.error(err?.message || 'Failed to update invoice')
    }
  }

  const handlePrintInvoice = (invoiceId: string) => {
    // Open the printable HTML page in a new tab
    window.open(invoiceService.getDownloadUrl(invoiceId), '_blank', 'noopener,noreferrer')
  }

  // ─── User CRUD handlers ────────────────────────────────────
  const openEditUser = (u: UserProfile) => {
    setEditingUser(u)
    setEditUserForm({
      name: u.name || '', email: u.email || '', phone: u.phone || '',
      age: u.age ? String(u.age) : '', gender: u.gender || '',
      country: u.country || 'India', state: u.state || '',
      is_admin: u.is_admin || false, learning_completed: u.learning_completed || false,
      new_password: '',
    })
    setEditUserError(null)
  }

  const handleEditUser = async () => {
    if (!editingUser) return
    setEditUserLoading(true)
    setEditUserError(null)
    try {
      const body: Record<string, unknown> = {
        name: editUserForm.name.trim(),
        email: editUserForm.email.trim() || null,
        phone: editUserForm.phone.trim() || null,
        age: editUserForm.age ? parseInt(editUserForm.age) : null,
        gender: editUserForm.gender || null,
        country: editUserForm.country || 'India',
        state: editUserForm.state || null,
        is_admin: editUserForm.is_admin,
        learning_completed: editUserForm.learning_completed,
      }
      if (editUserForm.new_password.trim()) {
        if (editUserForm.new_password.trim().length < 6) {
          setEditUserError('New password must be at least 6 characters')
          setEditUserLoading(false)
          return
        }
        body.new_password = editUserForm.new_password.trim()
      }
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'true', 'x-user-id': userId },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update user')
      // Update local state
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...data.user } : u))
      toast.success(`User "${data.user.name}" updated successfully`)
      setEditingUser(null)
    } catch (err: any) {
      setEditUserError(err.message || 'Failed to update user')
    } finally {
      setEditUserLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return
    setDeleteUserLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': 'true', 'x-user-id': userId },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete user')
      setUsers(prev => prev.filter(u => u.id !== deletingUser.id))
      toast.success(`User "${deletingUser.name}" deleted successfully`)
      setDeletingUser(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user')
    } finally {
      setDeleteUserLoading(false)
    }
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
    { value: 'products', label: 'Products', icon: Package, badge: null },
    { value: 'campaigns', label: 'Campaigns', icon: Megaphone, badge: campaigns.length },
    { value: 'qr', label: 'QR Codes', icon: QrCode, badge: campaigns.filter(c => c.status === 'ACTIVE').length },
    { value: 'orders', label: 'Orders', icon: ShoppingCart, badge: orders.length },
    { value: 'invoices', label: 'Invoices', icon: Receipt, badge: invoices.length },
    { value: 'subscriptions', label: 'Subscriptions', icon: CreditCard, badge: null },
    { value: 'users', label: 'Users', icon: Users, badge: users.length },
    { value: 'analytics', label: 'Analytics', icon: TrendingUp, badge: null },
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
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right" style={{ color: A.textMuted }}>Actions</TableHead>
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
                      <TableCell className="text-[12px]" style={{ color: A.textSecondary }}>
                        <div>{u.email || '-'}</div>
                        <div className="text-[10px]" style={{ color: A.textMuted }}>{u.phone || ''}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: A.borderLight }}>
                            <div className="h-full rounded-full" style={{ width: u.learning_completed ? '100%' : '0%', background: u.learning_completed ? A.green : A.amber }} />
                          </div>
                          <span className="text-[11px]" style={{ color: A.textMuted }}>{u.learning_completed ? '100%' : '0%'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[11px]" style={{ color: A.textMuted }}>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditUser(u)} title="Edit user">
                            <Pencil className="w-3.5 h-3.5" style={{ color: A.blue }} />
                          </Button>
                          {u.id !== userId && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeletingUser(u)} title="Delete user">
                              <Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* ─── Edit User Dialog ─── */}
            <Dialog open={!!editingUser} onOpenChange={(open) => { if (!open) setEditingUser(null) }}>
              <DialogContent className="sm:max-w-lg border-[#e3dfd8] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
                    <Edit className="w-5 h-5" style={{ color: A.green }} />
                    Edit User — {editingUser?.name}
                  </DialogTitle>
                  <DialogDescription className="text-[#88837b]">Update user details, admin status, or reset password</DialogDescription>
                </DialogHeader>
                <Separator style={{ background: A.borderLight }} />
                {editUserError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" /><span>{editUserError}</span>
                  </div>
                )}
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Name</Label>
                      <Input value={editUserForm.name} onChange={e => setEditUserForm(p => ({ ...p, name: e.target.value }))} className="h-9 text-sm" style={{ borderColor: A.border }} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Email</Label>
                      <Input type="email" value={editUserForm.email} onChange={e => setEditUserForm(p => ({ ...p, email: e.target.value }))} className="h-9 text-sm" style={{ borderColor: A.border }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Phone</Label>
                      <Input type="tel" value={editUserForm.phone} onChange={e => setEditUserForm(p => ({ ...p, phone: e.target.value }))} className="h-9 text-sm" style={{ borderColor: A.border }} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Age</Label>
                      <Input type="number" value={editUserForm.age} onChange={e => setEditUserForm(p => ({ ...p, age: e.target.value }))} className="h-9 text-sm" style={{ borderColor: A.border }} min={1} max={120} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Gender</Label>
                      <Select value={editUserForm.gender} onValueChange={v => setEditUserForm(p => ({ ...p, gender: v }))}>
                        <SelectTrigger className="h-9 text-sm" style={{ borderColor: A.border }}><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Country</Label>
                      <Select value={editUserForm.country} onValueChange={v => setEditUserForm(p => ({ ...p, country: v }))}>
                        <SelectTrigger className="h-9 text-sm" style={{ borderColor: A.border }}><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="India">India</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {editUserForm.country === 'India' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">State</Label>
                      <Input value={editUserForm.state} onChange={e => setEditUserForm(p => ({ ...p, state: e.target.value }))} className="h-9 text-sm" style={{ borderColor: A.border }} />
                    </div>
                  )}
                  <Separator style={{ background: A.borderLight }} />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs font-medium">Admin Access</Label>
                        <p className="text-[10px]" style={{ color: A.textMuted }}>Grant or revoke admin privileges</p>
                      </div>
                      <Switch checked={editUserForm.is_admin} onCheckedChange={v => setEditUserForm(p => ({ ...p, is_admin: v }))} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs font-medium">Learning Completed</Label>
                        <p className="text-[10px]" style={{ color: A.textMuted }}>Mark learning as completed</p>
                      </div>
                      <Switch checked={editUserForm.learning_completed} onCheckedChange={v => setEditUserForm(p => ({ ...p, learning_completed: v }))} />
                    </div>
                  </div>
                  <Separator style={{ background: A.borderLight }} />
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Reset Password</Label>
                    <p className="text-[10px]" style={{ color: A.textMuted }}>Leave empty to keep current password. Min 6 characters.</p>
                    <Input type="password" value={editUserForm.new_password} onChange={e => setEditUserForm(p => ({ ...p, new_password: e.target.value }))} placeholder="Enter new password" className="h-9 text-sm" style={{ borderColor: A.border }} />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setEditingUser(null)} disabled={editUserLoading} className="border-[#e3dfd8] text-[#88837b]">Cancel</Button>
                  <Button onClick={handleEditUser} disabled={editUserLoading} className="text-white" style={{ background: A.green }}>
                    {editUserLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* ─── Delete User Confirmation ─── */}
            <Dialog open={!!deletingUser} onOpenChange={(open) => { if (!open) setDeletingUser(null) }}>
              <DialogContent className="sm:max-w-md border-[#e3dfd8]">
                <DialogHeader>
                  <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    Delete User
                  </DialogTitle>
                  <DialogDescription className="text-[#88837b]">
                    Are you sure you want to delete <strong>{deletingUser?.name}</strong>? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  All associated data (orders, subscriptions, learning progress) will be permanently deleted.
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setDeletingUser(null)} disabled={deleteUserLoading} className="border-[#e3dfd8] text-[#88837b]">Cancel</Button>
                  <Button onClick={handleDeleteUser} disabled={deleteUserLoading} className="bg-red-500 hover:bg-red-600 text-white">
                    {deleteUserLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</> : <><Trash2 className="w-4 h-4 mr-2" />Delete User</>}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )

      // ─── CAMPAIGNS TAB ───────────────────────────────────
      case 'campaigns':
        return <CampaignManagerInner campaigns={campaigns} setCampaigns={setCampaigns} scans={scans} orders={orders} userId={userId} products={adminProducts} />

      // ─── QR CODES TAB ────────────────────────────────────
      case 'qr':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold" style={{ color: A.text }}>QR Codes</h2>
                <p className="text-[12px]" style={{ color: A.textMuted }}>Generate and manage QR codes for campaigns</p>
              </div>
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5" onClick={refreshData}>
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.filter(c => c.status === 'ACTIVE').map(campaign => {
                const campaignScans = scans.filter(s => s.campaign_id === campaign.id)
                const linkedProduct = campaign.product || adminProducts.find(p => p.id === campaign.product_id) || null
                const qrUrl = buildCampaignUrl(campaign, linkedProduct)
                const revenue = linkedProduct ? campaignScans.length * linkedProduct.price : 0
                return (
                  <div key={campaign.id} className="bg-white border rounded-lg p-5 text-center hover:shadow-sm transition-shadow" style={{ borderColor: A.border }}>
                    <div className="mb-4 inline-block p-3 bg-white rounded-lg border" style={{ borderColor: A.borderLight }}>
                      <QRCodeSVG value={qrUrl} size={120} bgColor="#ffffff" fgColor="#1f1e1c" level="M" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1" style={{ color: A.text }}>{campaign.name}</h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded mb-3" style={{ color: A.blue, background: A.blueLight }}>{campaign.channel}</span>
                    {linkedProduct ? (
                      <div className="mb-3 px-3 py-2 rounded-md border text-left" style={{ borderColor: A.borderLight, background: A.greenLight }}>
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3 h-3" style={{ color: A.green }} />
                          <span className="text-[11px] font-semibold truncate" style={{ color: A.green }}>{linkedProduct.name}</span>
                          <span className="text-[11px] font-bold ml-auto" style={{ color: A.green }}>₹{linkedProduct.price.toLocaleString()}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="mb-3 text-[10px] italic" style={{ color: A.textMuted }}>No linked product</p>
                    )}
                    <div className="flex items-center justify-center gap-4 text-[11px] mb-4" style={{ color: A.textSecondary }}>
                      <span className="flex items-center gap-1"><Scan className="w-3 h-3" /> {campaignScans.length} scans</span>
                      {linkedProduct && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" style={{ color: A.green }} /> ₹{revenue.toLocaleString()}</span>}
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
        // ── Invoice summary metrics (computed from invoices list) ──
        const totalInvoices = invoices.length
        const totalInvoicedAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
        const paidInvoices = invoices.filter(i => (i.payment_status || i.status) === 'COMPLETED' || i.status === 'PAID')
        const pendingInvoices = invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED' && (i.payment_status || 'PENDING') !== 'COMPLETED')
        const paidAmount = paidInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
        const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)

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

            {/* ═══ Invoice Summary Cards ═══ */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: 'Invoices Issued', value: totalInvoices, icon: Receipt, color: A.green, bgColor: A.greenLight, sub: `${orders.filter(o => (o as any).invoice).length} of ${orders.length} orders` },
                { label: 'Invoiced Amount', value: `₹${totalInvoicedAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: IndianRupee, color: A.blue, bgColor: A.blueLight, sub: 'across all invoices' },
                { label: 'Paid', value: `₹${paidAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: CheckCircle, color: A.green, bgColor: A.greenLight, sub: `${paidInvoices.length} invoices` },
                { label: 'Pending', value: `₹${pendingAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: AlertCircle, color: A.amber, bgColor: A.amberLight, sub: `${pendingInvoices.length} invoices` },
              ].map(card => (
                <div key={card.label} className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow" style={{ borderColor: A.border }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: card.bgColor }}>
                      <card.icon className="w-4 h-4" style={{ color: card.color }} />
                    </div>
                  </div>
                  <p className="text-xl font-bold" style={{ color: A.text }}>{card.value}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: A.textSecondary }}>{card.label}</p>
                  <p className="text-[11px] mt-1" style={{ color: A.textMuted }}>{card.sub}</p>
                </div>
              ))}
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
                        {statusOrders.map((o) => {
                          const inv = (o as any).invoice as InvoiceListItem | null | undefined
                          return (
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
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-[9px]" style={{ color: A.textMuted }}>{new Date(o.created_at).toLocaleDateString()}</p>
                                {inv ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openInvoice(inv) }}
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors"
                                    style={{ color: A.green, background: A.greenLight, border: `1px solid ${A.greenLight}` }}
                                    title={`Invoice ${inv.invoice_number}`}
                                  >
                                    <Receipt className="w-2.5 h-2.5" /> {inv.invoice_number}
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleGenerateInvoice(o.id) }}
                                    disabled={generatingInvoiceFor === o.id}
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors"
                                    style={{ color: A.textSecondary, background: A.bg, border: `1px solid ${A.borderLight}` }}
                                    title="Generate Invoice"
                                  >
                                    {generatingInvoiceFor === o.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Plus className="w-2.5 h-2.5" />}
                                    Invoice
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
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
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right" style={{ color: A.textMuted }}>Invoice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => {
                      const inv = (o as any).invoice as InvoiceListItem | null | undefined
                      return (
                        <TableRow key={o.id} className="hover:bg-[#f8f7f5] cursor-pointer" style={{ borderColor: A.borderLight }} onClick={() => setSelectedOrder(o)}>
                          <TableCell className="font-mono text-[11px]" style={{ color: A.textMuted }}>{o.id.slice(0, 10)}</TableCell>
                          <TableCell className="text-[12px]" style={{ color: A.text }}>{(o as any).user?.name || 'Customer'}</TableCell>
                          <TableCell className="font-semibold text-[12px]" style={{ color: A.green }}>₹{(o.total_amount || 0).toLocaleString()}</TableCell>
                          <TableCell><StatusBadge status={o.status} /></TableCell>
                          <TableCell className="text-[11px]" style={{ color: A.textSecondary }}>{o.payment_method || 'N/A'}</TableCell>
                          <TableCell className="text-[11px]" style={{ color: A.textMuted }}>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                            {inv ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1.5 text-[11px] rounded-md"
                                style={{ borderColor: A.green, color: A.green, background: A.greenLight }}
                                onClick={() => openInvoice(inv)}
                              >
                                <Eye className="w-3 h-3" /> {inv.invoice_number}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1.5 text-[11px] rounded-md"
                                style={{ borderColor: A.border, color: A.textSecondary }}
                                onClick={() => handleGenerateInvoice(o.id)}
                                disabled={generatingInvoiceFor === o.id}
                              >
                                {generatingInvoiceFor === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                Generate
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* ═══ Order Detail Dialog ═══ */}
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
                    <Select value={selectedOrder.status} onValueChange={async (newStatus) => { try { await orderService.updateStatus(selectedOrder.id, newStatus, userId); setOrders(prev => prev.map(p => p.id === selectedOrder.id ? { ...p, status: newStatus } : p)); setSelectedOrder({ ...selectedOrder, status: newStatus }); toast.success('Status updated') } catch (err) { toast.error('Failed to update status'); console.error(err) } }}>
                      <SelectTrigger className="rounded-md" style={{ borderColor: A.border, color: A.text }}><SelectValue /></SelectTrigger>
                      <SelectContent style={{ background: '#fff', borderColor: A.border }}>
                        <SelectItem value="PLACED" style={{ color: A.text }}>Placed</SelectItem>
                        <SelectItem value="CONFIRMED" style={{ color: A.text }}>Confirmed</SelectItem>
                        <SelectItem value="SHIPPED" style={{ color: A.text }}>Shipped</SelectItem>
                        <SelectItem value="DELIVERED" style={{ color: A.text }}>Delivered</SelectItem>
                        <SelectItem value="CANCELLED" style={{ color: A.text }}>Cancelled</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* ─── Invoice action ─── */}
                    <Separator style={{ background: A.border }} />
                    {(() => {
                      const inv = (selectedOrder as any).invoice as InvoiceListItem | null | undefined
                      if (inv) {
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[11px] uppercase tracking-wider" style={{ color: A.textMuted }}>Invoice</p>
                                <p className="font-mono font-semibold text-[13px]" style={{ color: A.green }}>{inv.invoice_number}</p>
                                <p className="text-[10px]" style={{ color: A.textMuted }}>Issued {new Date(inv.issued_at).toLocaleDateString()}</p>
                              </div>
                              <StatusBadge status={inv.status} />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1 h-8 text-[11px] rounded-md text-white"
                                style={{ background: A.green }}
                                onClick={() => openInvoice(inv)}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" /> View Invoice
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-[11px] rounded-md"
                                style={{ borderColor: A.border, color: A.text }}
                                onClick={() => handlePrintInvoice(inv.id)}
                              >
                                <ExternalLink className="w-3.5 h-3.5 mr-1" /> Print
                              </Button>
                            </div>
                          </div>
                        )
                      }
                      return (
                        <Button
                          size="sm"
                          className="w-full h-8 text-[11px] rounded-md text-white"
                          style={{ background: A.green }}
                          onClick={() => handleGenerateInvoice(selectedOrder.id)}
                          disabled={generatingInvoiceFor === selectedOrder.id}
                        >
                          {generatingInvoiceFor === selectedOrder.id
                            ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Generating...</>
                            : <><FileText className="w-3.5 h-3.5 mr-1" /> Generate Invoice</>}
                        </Button>
                      )
                    })()}
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* ═══ Invoice View Dialog ═══ */}
            <Dialog open={!!selectedInvoice} onOpenChange={(open) => { if (!open) setSelectedInvoice(null) }}>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: '#fff', borderColor: A.border, color: A.text }}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2" style={{ color: A.text }}>
                    <Receipt className="w-5 h-5" style={{ color: A.green }} />
                    Invoice {selectedInvoice?.invoice_number}
                  </DialogTitle>
                  <DialogDescription className="text-[#88837b]">Review invoice details and print or save as PDF</DialogDescription>
                </DialogHeader>
                {selectedInvoice && (() => {
                  const lineItems = parseInvoiceItems(selectedInvoice.items as unknown as string)
                  const invStatus = selectedInvoice.status
                  return (
                    <div className="space-y-4">
                      {/* Invoice meta */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-[11px] uppercase tracking-wider" style={{ color: A.textMuted }}>Invoice No</p>
                          <p className="font-mono font-semibold text-[12px]" style={{ color: A.text }}>{selectedInvoice.invoice_number}</p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wider" style={{ color: A.textMuted }}>Issue Date</p>
                          <p className="text-[12px]" style={{ color: A.text }}>{new Date(selectedInvoice.issued_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wider" style={{ color: A.textMuted }}>Order Ref</p>
                          <p className="font-mono text-[11px]" style={{ color: A.textSecondary }}>{selectedInvoice.order?.order_number || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wider" style={{ color: A.textMuted }}>Status</p>
                          <StatusBadge status={invStatus} />
                        </div>
                      </div>

                      <Separator style={{ background: A.border }} />

                      {/* Customer details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: A.textMuted }}>Bill To</p>
                          <p className="text-[13px] font-medium" style={{ color: A.text }}>{selectedInvoice.customer_name}</p>
                          {selectedInvoice.customer_phone && <p className="text-[11px]" style={{ color: A.textSecondary }}>📞 {selectedInvoice.customer_phone}</p>}
                          {selectedInvoice.customer_email && <p className="text-[11px]" style={{ color: A.textSecondary }}>✉ {selectedInvoice.customer_email}</p>}
                          {selectedInvoice.billing_address && (
                            <p className="text-[11px] mt-1" style={{ color: A.textSecondary }}>
                              {selectedInvoice.billing_address}
                              {selectedInvoice.billing_city ? `, ${selectedInvoice.billing_city}` : ''}
                              {selectedInvoice.billing_state ? `, ${selectedInvoice.billing_state}` : ''}
                              {selectedInvoice.billing_pincode ? ` - ${selectedInvoice.billing_pincode}` : ''}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: A.textMuted }}>Payment</p>
                          <p className="text-[12px]" style={{ color: A.text }}>{selectedInvoice.payment_method || '—'}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: A.textSecondary }}>Status: {selectedInvoice.payment_status}</p>
                        </div>
                      </div>

                      <Separator style={{ background: A.border }} />

                      {/* Line items table */}
                      <div className="bg-white border rounded-lg overflow-hidden" style={{ borderColor: A.border }}>
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent" style={{ borderColor: A.borderLight, background: A.bg }}>
                              <TableHead className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Item</TableHead>
                              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-center" style={{ color: A.textMuted }}>Qty</TableHead>
                              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-right" style={{ color: A.textMuted }}>Unit Price</TableHead>
                              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-right" style={{ color: A.textMuted }}>Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {lineItems.length === 0 ? (
                              <TableRow><TableCell colSpan={4} className="text-center text-[11px] py-4" style={{ color: A.textMuted }}>No items</TableCell></TableRow>
                            ) : (
                              lineItems.map((it, idx) => (
                                <TableRow key={idx} style={{ borderColor: A.borderLight }}>
                                  <TableCell className="text-[12px]" style={{ color: A.text }}>
                                    {it.name}
                                    {it.pack_type && (
                                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ color: A.blue, background: A.blueLight }}>
                                        {it.pack_type.replace(/_/g, ' ')}
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-[11px] text-center" style={{ color: A.textSecondary }}>{it.quantity}</TableCell>
                                  <TableCell className="text-[11px] text-right" style={{ color: A.textSecondary }}>₹{Number(it.unit_price || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                                  <TableCell className="text-[11px] text-right font-semibold" style={{ color: A.green }}>₹{Number(it.total_price || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Totals */}
                      <div className="ml-auto w-full sm:w-64 space-y-1.5 text-[12px]">
                        <div className="flex justify-between" style={{ color: A.textSecondary }}>
                          <span>Subtotal</span><span>₹{Number(selectedInvoice.subtotal || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between" style={{ color: A.textSecondary }}>
                          <span>Tax (GST)</span><span>₹{Number(selectedInvoice.tax_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between" style={{ color: A.textSecondary }}>
                          <span>Discount</span><span>− ₹{Number(selectedInvoice.discount_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t-2 font-bold text-[14px]" style={{ borderColor: A.text, color: A.text }}>
                          <span>Total</span><span style={{ color: A.green }}>₹{Number(selectedInvoice.total_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </div>
                      </div>

                      {selectedInvoice.notes && (
                        <div className="p-3 rounded-md border text-[11px]" style={{ borderColor: A.borderLight, background: A.bg, color: A.textSecondary }}>
                          <p className="font-medium mb-0.5" style={{ color: A.text }}>Notes</p>
                          {selectedInvoice.notes}
                        </div>
                      )}

                      {/* Status changer */}
                      <Separator style={{ background: A.border }} />
                      <div className="flex items-center gap-2">
                        <span className="text-[11px]" style={{ color: A.textMuted }}>Update status:</span>
                        <Select value={invStatus} onValueChange={(v) => handleInvoiceStatusChange(v)}>
                          <SelectTrigger className="h-8 text-[11px] flex-1 rounded-md" style={{ borderColor: A.border, color: A.text }}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent style={{ background: '#fff', borderColor: A.border }}>
                            <SelectItem value="ISSUED" style={{ color: A.text }}>Issued</SelectItem>
                            <SelectItem value="PAID" style={{ color: A.text }}>Paid</SelectItem>
                            <SelectItem value="OVERDUE" style={{ color: A.text }}>Overdue</SelectItem>
                            <SelectItem value="CANCELLED" style={{ color: A.text }}>Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Print / download */}
                      <DialogFooter className="gap-2 sm:gap-2">
                        <Button
                          variant="outline"
                          className="h-9 text-[12px] rounded-md"
                          style={{ borderColor: A.border, color: A.text }}
                          onClick={() => setSelectedInvoice(null)}
                        >
                          Close
                        </Button>
                        <Button
                          className="h-9 text-[12px] rounded-md text-white"
                          style={{ background: A.green }}
                          onClick={() => handlePrintInvoice(selectedInvoice.id)}
                        >
                          <Download className="w-4 h-4 mr-1.5" /> Print / Save as PDF
                        </Button>
                      </DialogFooter>
                    </div>
                  )
                })()}
              </DialogContent>
            </Dialog>
          </div>
        )

      // ─── SUBSCRIPTIONS TAB ───────────────────────────────
      // ─── INVOICES TAB ─────────────────────────────────────
      case 'invoices': {
        const totalInvoices = invoices.length
        const totalInvoicedAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
        const paidInvoices = invoices.filter(i => (i.payment_status || i.status) === 'COMPLETED' || i.status === 'PAID')
        const pendingInvoices = invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED' && (i.payment_status || 'PENDING') !== 'COMPLETED')
        const paidAmount = paidInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
        const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold" style={{ color: A.text }}>Invoices</h2>
                <p className="text-[12px]" style={{ color: A.textMuted }}>{totalInvoices} invoices · ₹{totalInvoicedAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} total value</p>
              </div>
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5" onClick={() => {
                exportToCSV(invoices.map(inv => ({
                  invoice_number: inv.invoice_number,
                  order_number: inv.order?.order_number || '',
                  customer: inv.customer_name,
                  phone: inv.customer_phone || '',
                  email: inv.customer_email || '',
                  subtotal: inv.subtotal,
                  tax: inv.tax_amount,
                  discount: inv.discount_amount,
                  total: inv.total_amount,
                  payment_method: inv.payment_method || '',
                  payment_status: inv.payment_status,
                  status: inv.status,
                  issued_at: new Date(inv.issued_at).toISOString(),
                })), 'invoices-export', [
                  { key: 'invoice_number', label: 'Invoice Number' },
                  { key: 'order_number', label: 'Order Number' },
                  { key: 'customer', label: 'Customer' },
                  { key: 'phone', label: 'Phone' },
                  { key: 'email', label: 'Email' },
                  { key: 'subtotal', label: 'Subtotal' },
                  { key: 'tax', label: 'Tax' },
                  { key: 'discount', label: 'Discount' },
                  { key: 'total', label: 'Total' },
                  { key: 'payment_method', label: 'Payment Method' },
                  { key: 'payment_status', label: 'Payment Status' },
                  { key: 'status', label: 'Status' },
                  { key: 'issued_at', label: 'Issued At' },
                ])
                toast.success('Invoices exported!')
              }}>
                <Download className="w-3.5 h-3.5" /> Export CSV
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white border rounded-lg p-4" style={{ borderColor: A.border }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: A.greenLight }}>
                    <Receipt className="w-3.5 h-3.5" style={{ color: A.green }} />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: A.textMuted }}>Total Issued</span>
                </div>
                <p className="text-xl font-bold" style={{ color: A.text }}>{totalInvoices}</p>
                <p className="text-[10px]" style={{ color: A.textMuted }}>invoices generated</p>
              </div>
              <div className="bg-white border rounded-lg p-4" style={{ borderColor: A.border }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: A.greenLight }}>
                    <IndianRupee className="w-3.5 h-3.5" style={{ color: A.green }} />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: A.textMuted }}>Invoiced</span>
                </div>
                <p className="text-xl font-bold" style={{ color: A.text }}>₹{totalInvoicedAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                <p className="text-[10px]" style={{ color: A.textMuted }}>total value</p>
              </div>
              <div className="bg-white border rounded-lg p-4" style={{ borderColor: A.border }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: A.greenLight }}>
                    <CheckCircle className="w-3.5 h-3.5" style={{ color: A.green }} />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: A.textMuted }}>Paid</span>
                </div>
                <p className="text-xl font-bold" style={{ color: A.green }}>₹{paidAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                <p className="text-[10px]" style={{ color: A.textMuted }}>{paidInvoices.length} invoices</p>
              </div>
              <div className="bg-white border rounded-lg p-4" style={{ borderColor: A.border }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: A.amberLight }}>
                    <Clock className="w-3.5 h-3.5" style={{ color: A.amber }} />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: A.textMuted }}>Pending</span>
                </div>
                <p className="text-xl font-bold" style={{ color: A.amber }}>₹{pendingAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                <p className="text-[10px]" style={{ color: A.textMuted }}>{pendingInvoices.length} invoices</p>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white border rounded-lg overflow-hidden" style={{ borderColor: A.border }}>
              {invoices.length === 0 ? (
                <div className="p-12 text-center">
                  <Receipt className="w-12 h-12 mx-auto mb-3" style={{ color: A.textMuted, opacity: 0.3 }} />
                  <p className="text-sm font-medium" style={{ color: A.text }}>No invoices yet</p>
                  <p className="text-[12px] mt-1" style={{ color: A.textMuted }}>Invoices are auto-generated when orders are placed.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[11px]" style={{ color: A.textMuted }}>Invoice #</TableHead>
                        <TableHead className="text-[11px]" style={{ color: A.textMuted }}>Order</TableHead>
                        <TableHead className="text-[11px]" style={{ color: A.textMuted }}>Customer</TableHead>
                        <TableHead className="text-[11px] text-right" style={{ color: A.textMuted }}>Amount</TableHead>
                        <TableHead className="text-[11px]" style={{ color: A.textMuted }}>Payment</TableHead>
                        <TableHead className="text-[11px]" style={{ color: A.textMuted }}>Status</TableHead>
                        <TableHead className="text-[11px]" style={{ color: A.textMuted }}>Issued</TableHead>
                        <TableHead className="text-[11px] text-right" style={{ color: A.textMuted }}>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map(inv => (
                        <TableRow key={inv.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedInvoice(inv)}>
                          <TableCell className="text-[12px] font-mono font-semibold" style={{ color: A.text }}>{inv.invoice_number}</TableCell>
                          <TableCell className="text-[11px] font-mono" style={{ color: A.textSecondary }}>{inv.order?.order_number || '—'}</TableCell>
                          <TableCell className="text-[12px]" style={{ color: A.text }}>
                            <div>
                              <p className="font-medium">{inv.customer_name}</p>
                              {inv.customer_phone && <p className="text-[10px]" style={{ color: A.textMuted }}>{inv.customer_phone}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="text-[12px] text-right font-bold" style={{ color: A.green }}>₹{Number(inv.total_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                          <TableCell className="text-[11px]" style={{ color: A.textSecondary }}>{inv.payment_method || '—'}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold" style={{
                              background: inv.status === 'PAID' ? A.greenLight : inv.status === 'CANCELLED' ? A.redLight : A.amberLight,
                              color: inv.status === 'PAID' ? A.green : inv.status === 'CANCELLED' ? A.red : A.amber,
                            }}>{inv.status}</span>
                          </TableCell>
                          <TableCell className="text-[11px]" style={{ color: A.textMuted }}>{new Date(inv.issued_at).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={(e) => { e.stopPropagation(); handlePrintInvoice(inv.id) }} className="p-1.5 rounded hover:bg-gray-100" title="View / Print">
                                <ExternalLink className="w-3.5 h-3.5" style={{ color: A.blue }} />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        )
      }

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-base font-semibold" style={{ color: A.text }}>Analytics</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5" onClick={() => {
                  exportToCSV(campaigns.map(c => {
                    const cScans = scans.filter(s => s.campaign_id === c.id)
                    const product = c.product || adminProducts.find(p => p.id === c.product_id) || null
                    return {
                      campaign: c.name,
                      channel: c.channel,
                      partner: c.partner_name || '',
                      location: c.location || '',
                      linked_product: product?.name || '',
                      product_price: product?.price || 0,
                      scans: cScans.length,
                      estimated_revenue: product ? cScans.length * product.price : 0,
                      status: c.status,
                    }
                  }), 'campaign-analytics', [
                    { key: 'campaign', label: 'Campaign' },
                    { key: 'channel', label: 'Channel' },
                    { key: 'partner', label: 'Partner' },
                    { key: 'location', label: 'Location' },
                    { key: 'linked_product', label: 'Linked Product' },
                    { key: 'product_price', label: 'Product Price' },
                    { key: 'scans', label: 'Scans' },
                    { key: 'estimated_revenue', label: 'Estimated Revenue' },
                    { key: 'status', label: 'Status' },
                  ])
                  toast.success('Campaign analytics exported!')
                }}>
                  <Download className="w-3.5 h-3.5" /> Export Campaigns
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5" onClick={() => {
                  exportToCSV(scans.map(s => {
                    const camp = campaigns.find(c => c.id === s.campaign_id)
                    const product = camp?.product || adminProducts.find(p => p.id === camp?.product_id) || null
                    return {
                      scan_id: s.id,
                      campaign: camp?.name || '',
                      channel: camp?.channel || '',
                      linked_product: product?.name || '',
                      product_price: product?.price || 0,
                      device: s.device || '',
                      location: s.location || '',
                      scanned_at: new Date(s.created_at).toISOString(),
                    }
                  }), 'qr-scan-analytics', [
                    { key: 'scan_id', label: 'Scan ID' },
                    { key: 'campaign', label: 'Campaign' },
                    { key: 'channel', label: 'Channel' },
                    { key: 'linked_product', label: 'Linked Product' },
                    { key: 'product_price', label: 'Product Price' },
                    { key: 'device', label: 'Device' },
                    { key: 'location', label: 'Location' },
                    { key: 'scanned_at', label: 'Scanned At' },
                  ])
                  toast.success('QR scan data exported!')
                }}>
                  <Download className="w-3.5 h-3.5" /> Export QR Scans
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5" onClick={() => {
                  exportToCSV(orders.map(o => ({
                    order_number: o.order_number,
                    invoice_number: o.invoice_number || '',
                    customer: o.shipping_name || o.billing_name || '',
                    phone: o.billing_phone || o.shipping_phone || '',
                    email: o.billing_email || o.shipping_email || '',
                    total: o.total_amount,
                    status: o.status,
                    payment_method: o.payment_method || '',
                    payment_status: o.payment_status,
                    created_at: new Date(o.created_at).toISOString(),
                  })), 'order-analytics', [
                    { key: 'order_number', label: 'Order Number' },
                    { key: 'invoice_number', label: 'Invoice Number' },
                    { key: 'customer', label: 'Customer' },
                    { key: 'phone', label: 'Phone' },
                    { key: 'email', label: 'Email' },
                    { key: 'total', label: 'Total Amount' },
                    { key: 'status', label: 'Order Status' },
                    { key: 'payment_method', label: 'Payment Method' },
                    { key: 'payment_status', label: 'Payment Status' },
                    { key: 'created_at', label: 'Created At' },
                  ])
                  toast.success('Order analytics exported!')
                }}>
                  <Download className="w-3.5 h-3.5" /> Export Orders
                </Button>
              </div>
            </div>
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

            {/* ═══ Campaign Performance — scan counts × product price ═══ */}
            <div className="bg-white border rounded-lg p-5" style={{ borderColor: A.border }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: A.text }}>Campaign Performance</h3>
                  <p className="text-[11px]" style={{ color: A.textMuted }}>Scan counts with linked product price · estimated revenue = scans × price</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: A.textMuted }}>Total Scans</p>
                  <p className="text-lg font-bold" style={{ color: A.blue }}>{scans.length}</p>
                </div>
              </div>
              {(() => {
                const rows = campaigns.map(c => {
                  const cScans = scans.filter(s => s.campaign_id === c.id)
                  const product = c.product || adminProducts.find(p => p.id === c.product_id) || null
                  const revenue = product ? cScans.length * product.price : 0
                  return { campaign: c, scans: cScans.length, product, revenue }
                }).sort((a, b) => b.scans - a.scans)
                const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0)
                const maxScans = Math.max(1, ...rows.map(r => r.scans))
                if (rows.length === 0) {
                  return <p className="text-[12px] py-6 text-center" style={{ color: A.textMuted }}>No campaigns yet.</p>
                }
                return (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[11px]" style={{ color: A.textMuted }}>Campaign</TableHead>
                            <TableHead className="text-[11px]" style={{ color: A.textMuted }}>Channel</TableHead>
                            <TableHead className="text-[11px]" style={{ color: A.textMuted }}>Linked Product</TableHead>
                            <TableHead className="text-[11px] text-right" style={{ color: A.textMuted }}>Price</TableHead>
                            <TableHead className="text-[11px] text-right" style={{ color: A.textMuted }}>Scans</TableHead>
                            <TableHead className="text-[11px] text-right" style={{ color: A.textMuted }}>Revenue</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.map(r => (
                            <TableRow key={r.campaign.id}>
                              <TableCell className="text-[12px] font-medium" style={{ color: A.text }}>{r.campaign.name}</TableCell>
                              <TableCell className="text-[11px]" style={{ color: A.textSecondary }}>{r.campaign.channel}</TableCell>
                              <TableCell className="text-[12px]" style={{ color: A.textSecondary }}>
                                {r.product ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: A.greenLight, color: A.green }}>
                                    <Tag className="w-3 h-3" />
                                    <span className="truncate max-w-[160px]">{r.product.name}</span>
                                  </span>
                                ) : <span className="italic" style={{ color: A.textMuted }}>—</span>}
                              </TableCell>
                              <TableCell className="text-[12px] text-right font-semibold" style={{ color: A.text }}>
                                {r.product ? `₹${r.product.price.toLocaleString()}` : '—'}
                              </TableCell>
                              <TableCell className="text-[12px] text-right" style={{ color: A.textSecondary }}>
                                <div className="flex items-center justify-end gap-2">
                                  <div className="hidden sm:block w-24 h-1.5 rounded-full" style={{ background: A.borderLight }}>
                                    <div className="h-full rounded-full" style={{ width: `${(r.scans / maxScans) * 100}%`, background: A.blue }} />
                                  </div>
                                  <span className="font-semibold" style={{ color: A.blue }}>{r.scans}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-[12px] text-right font-bold" style={{ color: A.green }}>
                                {r.revenue > 0 ? `₹${r.revenue.toLocaleString()}` : '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="mt-4 flex items-center justify-between px-4 py-3 rounded-md" style={{ background: A.greenLight }}>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider" style={{ color: A.green }}>Campaign-Attributed Revenue</p>
                        <p className="text-[10px]" style={{ color: A.textMuted }}>Sum of (scans × linked product price) across all campaigns</p>
                      </div>
                      <p className="text-xl font-bold" style={{ color: A.green }}>₹{totalRevenue.toLocaleString()}</p>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )

      // ─── CONTENT TAB ─────────────────────────────────────
      case 'content':
        return <QuizManagerInner questions={questions} setQuestions={setQuestions} />

      // ─── PRODUCTS TAB ────────────────────────────────────
      case 'products': {
        const filteredProducts = adminProducts.filter(p => {
          const matchSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.type.toLowerCase().includes(productSearch.toLowerCase()) || (p.category || '').toLowerCase().includes(productSearch.toLowerCase())
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
                                <img src={newProduct.image_url?.startsWith('/uploads/') ? `/api${newProduct.image_url}` : newProduct.image_url} alt="Product" className="w-full h-full object-cover" />
                              ) : (
                                <div className="text-center">
                                  <p className="text-[9px]" style={{ color: A.textMuted }}>Click to upload</p>
                                </div>
                              )}
                              <input type="file" accept="image/jpeg,image/jpg,image/png" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async e => {
                                const file = e.target.files?.[0]
                                if (file) { if (file.size > 2 * 1024 * 1024) { toast.error('Image too large (max 2MB)'); return } setUploadingImage(true); const url = await handleImageUploadApi(file); setUploadingImage(false); if (url) setNewProduct({ ...newProduct, image_url: url }) }
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
                        {/* ─── Gallery Images ─── */}
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Gallery Images</Label>
                          <div className="flex flex-wrap gap-2">
                            {getGalleryUrls().map((url, idx) => (
                              <div key={idx} className="relative w-20 h-20 rounded-lg border overflow-hidden group" style={{ borderColor: A.border }}>
                                <img src={url.startsWith('/uploads/') ? `/api${url}` : url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                                <button onClick={() => removeGalleryImage(idx)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                              </div>
                            ))}
                            <label className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: A.border }}>
                              <div className="text-center">
                                <Upload className="w-4 h-4 mx-auto" style={{ color: A.textMuted }} />
                                <p className="text-[8px] mt-0.5" style={{ color: A.textMuted }}>Add</p>
                              </div>
                              <input type="file" accept="image/jpeg,image/jpg,image/png" className="hidden" onChange={async e => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                if (file.size > 2 * 1024 * 1024) { toast.error('Image too large (max 2MB)'); return }
                                setGalleryUploading(true)
                                const url = await handleImageUploadApi(file)
                                setGalleryUploading(false)
                                if (url) addGalleryImage(url)
                              }} disabled={galleryUploading} />
                            </label>
                          </div>
                          {galleryUploading && <p className="text-[10px]" style={{ color: A.textMuted }}>Uploading...</p>}
                          <Input placeholder="Or paste gallery image URL and press Enter..." className="text-xs h-8" onKeyDown={e => {
                            if (e.key === 'Enter') {
                              const val = (e.target as HTMLInputElement).value.trim()
                              if (val) { addGalleryImage(val); (e.target as HTMLInputElement).value = '' }
                            }
                          }} />
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
                              <Label className="text-xs mb-1">Slug <span className="font-normal" style={{ color: A.textMuted }}>(auto-generated from name if empty)</span></Label>
                              <Input placeholder="e.g. notjust-watr-berry-blast" value={newProduct.slug} onChange={e => setNewProduct({ ...newProduct, slug: e.target.value })} className="text-sm h-9" />
                            </div>
                            <div className="sm:col-span-2">
                              <Label className="text-xs mb-1">Short Description</Label>
                              <Input placeholder="Brief one-liner (max 150 chars)" maxLength={150} value={newProduct.short_description} onChange={e => setNewProduct({ ...newProduct, short_description: e.target.value })} className="text-sm h-9" />
                              <p className="text-[10px] text-right" style={{ color: A.textMuted }}>{(newProduct.short_description || '').length}/150</p>
                            </div>
                            <div className="sm:col-span-2">
                              <Label className="text-xs mb-1">Full Description</Label>
                              <Textarea placeholder="Detailed description (max 5000 chars)..." rows={6} maxLength={5000} value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="text-sm resize-y" />
                              <p className="text-[10px] text-right" style={{ color: A.textMuted }}>{(newProduct.description || '').length}/5000</p>
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
                              <Input placeholder="e.g. FIZZ, STILL, BERRY" value={newProduct.type} onChange={e => setNewProduct({ ...newProduct, type: e.target.value })} className="text-sm h-9" />
                            </div>
                            <div>
                              <Label className="text-xs mb-1">Category</Label>
                              <Input placeholder="e.g. Wellness Shot" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} className="text-sm h-9" />
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
                            <div className="sm:col-span-2">
                              <Label className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: A.textSecondary }}>Subscription Plans (Customizable Cycles)</Label>
                              <p className="text-[10px] mb-2" style={{ color: A.textMuted }}>Add custom subscription cycles with individual pricing. Users choose from these at checkout.</p>
                              {(() => {
                                // Parse current subscription_plans JSON into array for editing
                                let plans: Array<{cycle: number, price: number, label: string}> = []
                                try { plans = JSON.parse(newProduct.subscription_plans || '[]') } catch { plans = [] }
                                const updatePlans = (newPlans: Array<{cycle: number, price: number, label: string}>) => {
                                  setNewProduct({ ...newProduct, subscription_plans: JSON.stringify(newPlans) })
                                }
                                return (
                                  <div className="space-y-2">
                                    {plans.map((plan, idx) => (
                                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border" style={{ borderColor: A.border, background: A.bg }}>
                                        <Input type="number" placeholder="Days (e.g. 30)" value={plan.cycle || ''} onChange={e => { const n = [...plans]; n[idx] = { ...n[idx], cycle: Number(e.target.value) }; updatePlans(n) }} className="text-xs h-8 w-24" />
                                        <Input type="number" step="0.01" placeholder="Price (₹)" value={plan.price || ''} onChange={e => { const n = [...plans]; n[idx] = { ...n[idx], price: Number(e.target.value) }; updatePlans(n) }} className="text-xs h-8 w-28" />
                                        <Input placeholder="Label (e.g. Monthly)" value={plan.label || ''} onChange={e => { const n = [...plans]; n[idx] = { ...n[idx], label: e.target.value }; updatePlans(n) }} className="text-xs h-8 flex-1" />
                                        <button onClick={() => updatePlans(plans.filter((_, i) => i !== idx))} className="p-1.5 rounded-md hover:bg-red-50 shrink-0" style={{ color: A.red }} title="Remove cycle"><Trash2 className="w-3.5 h-3.5" /></button>
                                      </div>
                                    ))}
                                    <Button variant="outline" size="sm" className="text-xs h-8 gap-1 w-full border-dashed" onClick={() => updatePlans([...plans, { cycle: 30, price: 0, label: '' }])}>
                                      <Plus className="w-3.5 h-3.5" /> Add Subscription Cycle
                                    </Button>
                                    {plans.length > 0 && (
                                      <div className="text-[10px] p-2 rounded-lg" style={{ background: A.greenLight, color: A.green }}>
                                        {plans.length} cycle(s) configured · {plans.map(p => `${p.label || p.cycle + 'd'}: ₹${p.price}`).join(', ')}
                                      </div>
                                    )}
                                  </div>
                                )
                              })()}
                            </div>
                            <div>
                              <Label className="text-xs mb-1">Subscription Price (₹) <span className="font-normal" style={{ color: A.textMuted }}>(per cycle)</span></Label>
                              <Input type="number" placeholder="e.g. 2499" value={newProduct.subscription_price || ''} onChange={e => setNewProduct({ ...newProduct, subscription_price: Number(e.target.value) })} className="text-sm h-9" />
                            </div>
                            <div>
                              <Label className="text-xs mb-1">MRP (₹)</Label>
                              <Input type="number" placeholder="3499" value={newProduct.mrp || ''} onChange={e => setNewProduct({ ...newProduct, mrp: Number(e.target.value) })} className="text-sm h-9" />
                            </div>
                            <div>
                              <Label className="text-xs mb-1">Stock Quantity</Label>
                              <Input type="number" placeholder="500" value={newProduct.stock || ''} onChange={e => setNewProduct({ ...newProduct, stock: Number(e.target.value) })} className="text-sm h-9" />
                            </div>
                            <div className="sm:col-span-2">
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
                        <Separator />
                        <div className="space-y-3">
                          <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Storage & Allergen Info</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                              <Label className="text-xs mb-1">Storage Instructions</Label>
                              <Textarea placeholder="e.g. Store in cool dry place, refrigerate after opening..." rows={2} value={newProduct.storage_info} onChange={e => setNewProduct({ ...newProduct, storage_info: e.target.value })} className="text-sm resize-none" />
                            </div>
                            <div>
                              <Label className="text-xs mb-1">Shelf Life</Label>
                              <Input placeholder="e.g. 12 months" value={newProduct.shelf_life} onChange={e => setNewProduct({ ...newProduct, shelf_life: e.target.value })} className="text-sm h-9" />
                            </div>
                            <div>
                              <Label className="text-xs mb-1">Serving Size</Label>
                              <Input placeholder="e.g. 50ml per shot" value={newProduct.serving_size} onChange={e => setNewProduct({ ...newProduct, serving_size: e.target.value })} className="text-sm h-9" />
                            </div>
                            <div className="sm:col-span-2">
                              <Label className="text-xs mb-1">Allergen Information</Label>
                              <Textarea placeholder="e.g. Contains apple cider vinegar. May contain traces of sulphites..." rows={2} value={newProduct.allergen_info} onChange={e => setNewProduct({ ...newProduct, allergen_info: e.target.value })} className="text-sm resize-none" />
                            </div>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-3">
                          <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Legal & Compliance</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs mb-1">FSSAI License</Label>
                              <Input placeholder="e.g. 12345678901234" value={newProduct.fssai_license} onChange={e => setNewProduct({ ...newProduct, fssai_license: e.target.value })} className="text-sm h-9" />
                            </div>
                            <div>
                              <Label className="text-xs mb-1">HSN Code</Label>
                              <Input placeholder="e.g. 22029000" value={newProduct.hsn_code} onChange={e => setNewProduct({ ...newProduct, hsn_code: e.target.value })} className="text-sm h-9" />
                            </div>
                            <div>
                              <Label className="text-xs mb-1">GST Rate (%)</Label>
                              <Input placeholder="e.g. 18" type="number" value={newProduct.gst_rate || ''} onChange={e => setNewProduct({ ...newProduct, gst_rate: Number(e.target.value) })} className="text-sm h-9" />
                            </div>
                            <div>
                              <Label className="text-xs mb-1">Country of Origin</Label>
                              <Input placeholder="e.g. India" value={newProduct.country_origin} onChange={e => setNewProduct({ ...newProduct, country_origin: e.target.value })} className="text-sm h-9" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
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
                <Input placeholder="Search by name, type, or category..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="pl-9 h-9 text-sm" />
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
                const slug = slugifyProduct(product)
                const productQrUrl = buildProductUrl(product)
                const productQrId = `mini-qr-${product.id}`

                return (
                  <div key={product.id} className="rounded-xl border overflow-hidden transition-all hover:shadow-lg group" style={{ borderColor: A.border, background: '#fff' }}>
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden" style={{ background: A.bg }}>
                      {product.image_url ? (
                        <img src={product.image_url?.startsWith('/uploads/') ? `/api${product.image_url}` : product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => { (e.target as HTMLImageElement).src = product.type === 'STILL' ? '/images/product-still.webp' : '/images/product-fizz.webp' }}
                        />
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
                      {/* Small QR overlay */}
                      <div className="absolute bottom-2 right-2 p-1 bg-white rounded-md border shadow-sm cursor-pointer hover:scale-110 transition-transform" style={{ borderColor: A.borderLight }} title="Product QR — click to copy URL" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(productQrUrl); toast.success('QR URL copied!') }}>
                        <QRCodeSVG id={productQrId} value={productQrUrl} size={36} bgColor="#ffffff" fgColor="#1f1e1c" level="L" />
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
                            price: product.price, subscription_price: (product as any).subscription_price || 0, mrp: product.mrp || 0, stock: product.stock,
                            image_url: product.image_url || '', gallery_images: product.gallery_images || '',
                            type: product.type, category: product.category || '',
                            sku: product.sku || '', weight: product.weight || '',
                            ingredients: product.ingredients || '', nutrition_info: product.nutrition_info || '',
                            tags: product.tags || '', active: product.active, featured: product.featured || false,
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
                        <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1" style={{ color: A.textSecondary }} onClick={() => setQrPopupProduct(product)}>
                          <QrCode className="w-3 h-3" /> QR
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

            {/* ═══ PRODUCT QR CODES ═══ */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: A.border, background: '#fff' }}>
              <button onClick={() => setShowProductQrCodes(!showProductQrCodes)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4" style={{ color: A.green }} />
                  <h3 className="text-sm font-bold" style={{ color: A.text }}>Product QR Codes</h3>
                  <Badge className="text-[9px] font-bold px-1.5 py-0 h-5 rounded-md" style={{ background: A.greenLight, color: A.green }}>{filteredProducts.length}</Badge>
                </div>
                {showProductQrCodes ? <ChevronUp className="w-4 h-4" style={{ color: A.textMuted }} /> : <ChevronDown className="w-4 h-4" style={{ color: A.textMuted }} />}
              </button>
              {showProductQrCodes && (
                <div className="p-4 pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredProducts.map(product => {
                      const slug = slugifyProduct(product)
                      const qrUrl = buildProductUrl(product)
                      const qrId = `product-qr-${product.id}`
                      return (
                        <div key={product.id} className="rounded-lg border p-3 text-center hover:shadow-sm transition-shadow" style={{ borderColor: A.borderLight, background: A.bg }}>
                          <div className="inline-block p-2 bg-white rounded-lg border mb-2" style={{ borderColor: A.borderLight }}>
                            <QRCodeSVG id={qrId} value={qrUrl} size={100} bgColor="#ffffff" fgColor="#1f1e1c" level="M" />
                          </div>
                          <h4 className="text-xs font-semibold truncate mb-1" style={{ color: A.text }}>{product.name}</h4>
                          <p className="text-[9px] truncate mb-2" style={{ color: A.textMuted }}>{qrUrl}</p>
                          <div className="flex gap-1 justify-center">
                            <Button variant="outline" size="sm" className="text-[9px] h-6 px-1.5 gap-0.5" style={{ borderColor: A.border, color: A.textSecondary }} onClick={() => {
                              const svgEl = document.getElementById(qrId) as unknown as SVGElement | null
                              downloadQrCodeAsPng(svgEl, `qr-${slug}`)
                            }}>
                              <Download className="w-2.5 h-2.5" /> PNG
                            </Button>
                            <Button variant="outline" size="sm" className="text-[9px] h-6 px-1.5 gap-0.5" style={{ borderColor: A.border, color: A.textSecondary }} onClick={() => {
                              navigator.clipboard.writeText(qrUrl)
                              toast.success('QR URL copied!')
                            }}>
                              <Copy className="w-2.5 h-2.5" /> URL
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                    {filteredProducts.length === 0 && (
                      <div className="col-span-full text-center py-8">
                        <QrCode className="w-10 h-10 mx-auto mb-2" style={{ color: A.textMuted }} />
                        <p className="text-xs" style={{ color: A.textMuted }}>No products to generate QR codes for</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ═══ PRODUCT QR POPUP DIALOG ═══ */}
            <Dialog open={!!qrPopupProduct} onOpenChange={(open) => { if (!open) setQrPopupProduct(null) }}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="text-lg flex items-center gap-2">
                    <QrCode className="w-5 h-5" style={{ color: A.green }} /> Product QR Code
                  </DialogTitle>
                  <DialogDescription>Scan or download the QR code for this product</DialogDescription>
                </DialogHeader>
                {qrPopupProduct && (() => {
                  const slug = slugifyProduct(qrPopupProduct)
                  const qrUrl = buildProductUrl(qrPopupProduct)
                  const qrId = `popup-qr-${qrPopupProduct.id}`
                  return (
                    <div className="flex flex-col items-center gap-4 py-4">
                      <div className="inline-block p-4 bg-white rounded-xl border" style={{ borderColor: A.border }}>
                        <QRCodeSVG id={qrId} value={qrUrl} size={200} bgColor="#ffffff" fgColor="#1f1e1c" level="M" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-sm" style={{ color: A.text }}>{qrPopupProduct.name}</p>
                        <p className="text-[10px] mt-1 break-all" style={{ color: A.textMuted }}>{qrUrl}</p>
                      </div>
                      <div className="flex gap-2 w-full">
                        <Button className="flex-1 rounded-md text-xs h-9 text-white" style={{ background: A.green }} onClick={() => {
                          const svgEl = document.getElementById(qrId) as unknown as SVGElement | null
                          downloadQrCodeAsPng(svgEl, `qr-${slug}`)
                        }}>
                          <Download className="w-3.5 h-3.5 mr-1.5" /> Download PNG
                        </Button>
                        <Button variant="outline" className="flex-1 rounded-md text-xs h-9" style={{ borderColor: A.border, color: A.text }} onClick={() => { navigator.clipboard.writeText(qrUrl); toast.success('QR URL copied!') }}>
                          <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy URL
                        </Button>
                      </div>
                    </div>
                  )
                })()}
              </DialogContent>
            </Dialog>

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
                {learningProductId && (
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" style={{ borderColor: A.amber, color: A.amber }} onClick={handleSkipProductLearning}>
                      <EyeOff className="w-3.5 h-3.5" /> Skip Learning
                    </Button>
                  </div>
                )}

                {learningLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <RefreshCw className="w-8 h-8 animate-spin" style={{ color: A.green }} />
                  </div>
                ) : (
                  <div ref={learningScrollRef} className="flex-1 overflow-y-auto space-y-6 pr-1" style={{ maxHeight: 'calc(92vh - 120px)' }}>
                    {/* ─── VIDEOS SECTION ─── */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: A.text }}>
                          <Play className="w-4 h-4" style={{ color: A.green }} /> Videos ({learningVideos.length})
                        </h3>
                        <Button size="sm" className="text-xs gap-1 h-7" style={{ background: A.green, color: '#fff' }} onClick={() => { setShowAddVideo(true); setEditingVideo(null); setNewVideo({ title: '', duration: '', description: '', order: learningVideos.length + 1, video_url: '', thumbnail_url: '' }) }}>
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
                            <div key={video.id} className={`flex items-start gap-2 p-3 rounded-lg border group transition-colors ${editingVideo?.id === video.id ? 'ring-2' : ''}`} style={{ borderColor: editingVideo?.id === video.id ? A.lime : A.borderLight, background: editingVideo?.id === video.id ? A.limeLight : '#fff' }}>
                              <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
                                <button onClick={() => handleReorderVideo(video.id, 'up')} disabled={idx === 0} className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronUp className="w-3 h-3" style={{ color: A.textMuted }} /></button>
                                <button onClick={() => handleReorderVideo(video.id, 'down')} disabled={idx === learningVideos.length - 1} className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronDown className="w-3 h-3" style={{ color: A.textMuted }} /></button>
                              </div>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold" style={{ background: A.greenLight, color: A.green }}>{idx + 1}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold truncate" style={{ color: A.text }}>{video.title}</p>
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 shrink-0" style={{ borderColor: A.border, color: A.textMuted }}>{video.duration || '—'}</Badge>
                                  {video.video_url && <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 shrink-0" style={{ borderColor: A.green, color: A.green }}>Video ✓</Badge>}
                                </div>
                                <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: A.textMuted }}>{video.description}</p>
                                {/* Video preview thumbnail */}
                                {video.video_url && (
                                  <div className="mt-2 w-32 h-20 rounded-md overflow-hidden bg-black flex items-center justify-center">
                                    <video
                                      src={video.video_url.startsWith('/uploads/') ? `/api${video.video_url}` : video.video_url}
                                      className="w-full h-full object-cover"
                                      muted
                                      preload="metadata"
                                      onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none'; const parent = (e.target as HTMLVideoElement).parentElement; if (parent) parent.innerHTML = '<span class="text-[9px] text-red-400 p-1 text-center">Video unavailable</span>'; }}
                                    />
                                  </div>
                                )}
                                {/* Quizzes for this video */}
                                {learningQuizzes.filter(q => q.video_id === video.id).length > 0 && (
                                  <div className="mt-2 space-y-1.5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Quiz ({learningQuizzes.filter(q => q.video_id === video.id).length})</p>
                                    {learningQuizzes.filter(q => q.video_id === video.id).map((quiz, qIdx) => (
                                      <div key={quiz.id} className={`flex items-start gap-1.5 p-2 rounded-md border transition-colors ${editingQuiz?.id === quiz.id ? 'ring-2' : ''}`} style={{ borderColor: editingQuiz?.id === quiz.id ? A.blue : A.borderLight, background: editingQuiz?.id === quiz.id ? A.blueLight : A.bg }}>
                                        <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
                                          <button onClick={() => handleReorderQuiz(quiz.id, 'up')} disabled={qIdx === 0} className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronUp className="w-2.5 h-2.5" style={{ color: A.textMuted }} /></button>
                                          <button onClick={() => handleReorderQuiz(quiz.id, 'down')} disabled={qIdx === learningQuizzes.filter(q => q.video_id === video.id).length - 1} className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronDown className="w-2.5 h-2.5" style={{ color: A.textMuted }} /></button>
                                        </div>
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
                                        <div className="flex gap-1 shrink-0">
                                          <Button size="sm" variant="outline" className="text-[10px] h-6 px-1.5 gap-0.5" style={{ borderColor: A.blue, color: A.blue }} onClick={() => { setEditingQuiz(quiz); setShowAddQuiz(true); setNewQuiz({ question: quiz.question, options: quiz.options, answer: quiz.answer, category: quiz.category || '', difficulty: quiz.difficulty || 'EASY', order: quiz.order, video_id: quiz.video_id }); setTimeout(() => learningScrollRef.current?.querySelector('#edit-quiz-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100) }}><Pencil className="w-2.5 h-2.5" /> Edit</Button>
                                          <Button size="sm" variant="outline" className="text-[10px] h-6 px-1.5 gap-0.5" style={{ borderColor: A.red, color: A.red }} onClick={() => handleDeleteQuiz(quiz.id)}><Trash2 className="w-2.5 h-2.5" /> Del</Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Button size="sm" variant="outline" className="text-[10px] h-6 px-1.5 gap-0.5" style={{ borderColor: A.blue, color: A.blue }} onClick={() => { setEditingVideo(video); setShowAddVideo(true); setNewVideo({ title: video.title, duration: video.duration, description: video.description || '', order: video.order, video_url: video.video_url || '', thumbnail_url: video.thumbnail_url || '' }); setTimeout(() => learningScrollRef.current?.querySelector('#edit-video-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100) }}><Pencil className="w-2.5 h-2.5" /> Edit</Button>
                                <Button size="sm" variant="outline" className="text-[10px] h-6 px-1.5 gap-0.5" style={{ borderColor: A.red, color: A.red }} onClick={() => handleDeleteVideo(video.id)}><Trash2 className="w-2.5 h-2.5" /> Del</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ─── ADD/EDIT VIDEO FORM ─── */}
                    {showAddVideo && (
                      <div id="edit-video-form" className="p-4 rounded-lg border" style={{ borderColor: A.lime, background: A.limeLight }}>
                        <h4 className="text-xs font-bold mb-3 flex items-center gap-1" style={{ color: A.green }}>
                          <Play className="w-3.5 h-3.5" /> {editingVideo ? `Edit Video: ${editingVideo.title}` : 'Add Video'}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-2"><Label className="text-xs mb-1">Title *</Label><Input placeholder="e.g. Introduction" value={newVideo.title} onChange={e => setNewVideo({ ...newVideo, title: e.target.value })} className="h-8 text-sm" /></div>
                          <div><Label className="text-xs mb-1">Duration</Label><Input placeholder="e.g. 4:32" value={newVideo.duration} onChange={e => setNewVideo({ ...newVideo, duration: e.target.value })} className="h-8 text-sm" /></div>
                          <div><Label className="text-xs mb-1">Order</Label><Input type="number" value={newVideo.order} onChange={e => setNewVideo({ ...newVideo, order: Number(e.target.value) })} className="h-8 text-sm" /></div>
                          <div className="sm:col-span-2"><Label className="text-xs mb-1">Description</Label><Textarea placeholder="Video description..." rows={2} value={newVideo.description} onChange={e => setNewVideo({ ...newVideo, description: e.target.value })} className="text-sm resize-none" /></div>
                          <div className="sm:col-span-2">
                            <Label className="text-xs mb-1">Video File</Label>
                            <div className="space-y-2">
                              <label className="flex items-center gap-2 p-2 rounded-lg border border-dashed cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: A.border }}>
                                <Upload className="w-4 h-4 shrink-0" style={{ color: A.textMuted }} />
                                <span className="text-xs truncate" style={{ color: A.textMuted }}>{videoUploading ? 'Uploading...' : 'Upload video file (MP4/MOV/WebM, max 50MB)'}</span>
                                <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.mov,.webm,.avi" className="hidden" onChange={async (e) => {
                                  const f = e.target.files?.[0]
                                  if (!f) return
                                  if (f.size > 50 * 1024 * 1024) { toast.error('Video too large (max 50MB)'); return }
                                  // Check video duration (max 10 minutes for learning content)
                                  const durationOk = await new Promise<boolean>((resolve) => {
                                    const v = document.createElement('video')
                                    v.preload = 'metadata'
                                    v.onloadedmetadata = () => {
                                      URL.revokeObjectURL(v.src)
                                      resolve(v.duration <= 600) // 10 min
                                    }
                                    v.onerror = () => resolve(true) // allow if can't check
                                    v.src = URL.createObjectURL(f)
                                  })
                                  if (!durationOk) { toast.error('Video too long (max 10 minutes)'); return }
                                  setVideoUploading(true)
                                  const fd = new FormData()
                                  fd.append('file', f)
                                  fd.append('type', 'video')
                                  try {
                                    const res = await fetch('/api/upload', { method: 'POST', body: fd })
                                    const data = await res.json()
                                    if (data.url) { setNewVideo({ ...newVideo, video_url: data.url }); toast.success('Video uploaded!') }
                                    else toast.error(data.error || 'Upload failed')
                                  } catch { toast.error('Upload failed') } finally { setVideoUploading(false) }
                                }} disabled={videoUploading} />
                              </label>
                              {newVideo.video_url && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: A.bg }}>
                                    <Play className="w-3 h-3" style={{ color: A.green }} />
                                    <span className="text-xs truncate flex-1" style={{ color: A.text }}>{newVideo.video_url}</span>
                                    <button onClick={() => setNewVideo({ ...newVideo, video_url: '' })} className="text-xs text-red-500 hover:underline">Remove</button>
                                  </div>
                                  {/* Video preview */}
                                  <div className="w-full max-w-sm rounded-lg overflow-hidden bg-black">
                                    <video
                                      src={newVideo.video_url.startsWith('/uploads/') ? `/api${newVideo.video_url}` : newVideo.video_url}
                                      className="w-full aspect-video"
                                      controls
                                      playsInline
                                      preload="metadata"
                                      onError={(e) => { const el = e.target as HTMLVideoElement; el.style.display = 'none'; const next = el.nextElementSibling; if (next) return; const msg = document.createElement('div'); msg.className = 'p-3 text-center text-xs text-red-400'; msg.textContent = 'Video file could not be loaded — it may be corrupt or missing'; el.parentElement?.appendChild(msg); }}
                                    />
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center gap-2 pt-1">
                                <span className="text-[10px] font-medium" style={{ color: A.textMuted }}>Or paste URL:</span>
                                <Input placeholder="https://..." value={newVideo.video_url} onChange={e => setNewVideo({ ...newVideo, video_url: e.target.value })} className="h-8 text-sm flex-1" />
                              </div>
                            </div>
                          </div>
                          <div className="sm:col-span-2">
                            <Label className="text-xs mb-1">Thumbnail Image</Label>
                            <div className="space-y-2">
                              <div className="flex items-start gap-3">
                                <div className="relative w-20 h-14 rounded-lg border-2 border-dashed overflow-hidden flex items-center justify-center shrink-0 cursor-pointer" style={{ borderColor: newVideo.thumbnail_url ? A.green : A.border, background: newVideo.thumbnail_url ? 'transparent' : A.bg }}>
                                  {newVideo.thumbnail_url ? (
                                    <img src={newVideo.thumbnail_url?.startsWith('/uploads/') ? `/api${newVideo.thumbnail_url}` : newVideo.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
                                  ) : (
                                    <p className="text-[8px] text-center" style={{ color: A.textMuted }}>Upload</p>
                                  )}
                                  <input type="file" accept="image/jpeg,image/jpg,image/png" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                                    const f = e.target.files?.[0]
                                    if (!f) return
                                    if (f.size > 2 * 1024 * 1024) { toast.error('Image too large (max 2MB)'); return }
                                    setVideoUploading(true)
                                    const url = await handleImageUploadApi(f)
                                    setVideoUploading(false)
                                    if (url) setNewVideo({ ...newVideo, thumbnail_url: url })
                                  }} disabled={videoUploading} />
                                </div>
                                <div className="flex-1">
                                  <Input placeholder="Or paste thumbnail URL..." value={newVideo.thumbnail_url} onChange={e => setNewVideo({ ...newVideo, thumbnail_url: e.target.value })} className="h-8 text-sm" />
                                  {newVideo.thumbnail_url && (
                                    <button onClick={() => setNewVideo({ ...newVideo, thumbnail_url: '' })} className="text-[10px] text-red-500 hover:underline mt-1">Remove thumbnail</button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" className="text-xs h-7" style={{ background: A.green, color: '#fff' }} onClick={handleSaveVideo}><Save className="w-3 h-3 mr-1" /> {editingVideo ? 'Update' : 'Add'} Video</Button>
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setShowAddVideo(false); setEditingVideo(null) }}>Cancel</Button>
                        </div>
                      </div>
                    )}

                    {/* ─── ADD/EDIT QUIZ FORM ─── */}
                    {showAddQuiz && (
                      <div id="edit-quiz-form" className="p-4 rounded-lg border" style={{ borderColor: A.blue, background: A.blueLight }}>
                        <h4 className="text-xs font-bold mb-3 flex items-center gap-1" style={{ color: A.blue }}>
                          <BookOpen className="w-3.5 h-3.5" /> {editingQuiz ? `Edit Question: ${editingQuiz.question?.substring(0, 40)}...` : 'Add Quiz Question'}
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                        {/* Queued questions preview */}
                        {quizQueue.length > 0 && (
                          <div className="mt-3 p-2 rounded-lg border" style={{ borderColor: A.border, background: A.bg }}>
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Queued ({quizQueue.length})</p>
                              <button onClick={() => setQuizQueue([])} className="text-[9px]" style={{ color: A.red }}>Clear all</button>
                            </div>
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                              {quizQueue.map((q, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-1.5 rounded border" style={{ borderColor: A.border, background: A.surface }}>
                              <span className="text-[9px] font-bold shrink-0" style={{ color: A.green }}>Q{idx + 1}</span>
                              <p className="text-[10px] flex-1 truncate" style={{ color: A.text }}>{q.question}</p>
                              <span className="text-[8px]" style={{ color: A.textMuted }}>{q.difficulty}</span>
                              <button onClick={() => handleRemoveFromQueue(idx)} className="text-[9px] shrink-0" style={{ color: A.red }}><X className="w-3 h-3" /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                      )}
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {!editingQuiz && (
                            <Button size="sm" className="text-xs h-7" style={{ background: A.lime, color: A.dark }} onClick={handleAddQuizToQueue}><Plus className="w-3 h-3 mr-1" /> Add to Queue</Button>
                          )}
                          {!editingQuiz && quizQueue.length > 0 && (
                            <Button size="sm" className="text-xs h-7" style={{ background: A.green, color: '#fff' }} onClick={handleSaveAllQuizzes}><Save className="w-3 h-3 mr-1" /> Save All ({quizQueue.length})</Button>
                          )}
                          <Button size="sm" className="text-xs h-7" style={{ background: A.blue, color: '#fff' }} onClick={handleSaveQuiz}><Save className="w-3 h-3 mr-1" /> {editingQuiz ? 'Update' : 'Save Now'}</Button>
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setShowAddQuiz(false); setEditingQuiz(null); setQuizQueue([]) }}>Cancel</Button>
                        </div>
                      </div>
                    )}

                    {/* ─── ADD QUIZ BUTTON ─── */}
                    {!showAddQuiz && learningVideos.length > 0 && (
                      <div className="flex justify-center pt-2">
                        <Button size="sm" className="text-xs gap-1 h-7" style={{ background: A.blue, color: '#fff' }} onClick={() => { setShowAddQuiz(true); setEditingQuiz(null); setQuizQueue([]); setNewQuiz({ question: '', options: ['', '', '', ''], answer: 0, difficulty: 'EASY', order: 1, video_id: learningVideos[0]?.id || '' }) }}>
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
function CampaignManagerInner({ campaigns, setCampaigns, scans, orders, userId, products }: { campaigns: Campaign[]; setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>; scans: QrScan[]; orders: Order[]; userId: string; products: Product[] }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null)
  const [form, setForm] = useState<{ name: string; channel: string; partner_name: string; location: string; product_id: string }>({ name: '', channel: 'HOTEL', partner_name: '', location: '', product_id: '' })

  const channelIcons: Record<string, string> = {
    HOTEL: '🏨', HOSPITAL: '🏥', CLINIC: '🏥', DOCTOR: '👨‍⚕️',
    EVENT: '🎉', CORPORATE: '🏢', INFLUENCER: '📱', WELLNESS: '🧘',
  }

  const getProductById = (id?: string | null) => products.find(p => p.id === id) || null

  const handleCreate = async () => {
    if (!form.name) { toast.error('Campaign name is required'); return }
    try {
      const payload: Partial<Campaign> = {
        name: form.name,
        channel: form.channel,
        partner_name: form.partner_name || undefined,
        location: form.location || undefined,
        product_id: form.product_id || null,
      }
      const result = await campaignService.create(payload, userId)
      // Fetch full record (with product relation) so UI shows linked product immediately
      const full = await campaignService.get(result.id)
      const merged = full || { ...result, product: getProductById(result.product_id) || null }
      setCampaigns(prev => [merged, ...prev])
      toast.success('Campaign created')
      setDialogOpen(false)
      setForm({ name: '', channel: 'HOTEL', partner_name: '', location: '', product_id: '' })
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

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Delete this campaign?')) return
    try {
      await campaignService.delete(id, userId)
      setCampaigns(prev => prev.filter(c => c.id !== id))
      if (detailCampaign?.id === id) setDetailCampaign(null)
      toast.success('Campaign deleted')
    } catch {
      toast.error('Failed to delete campaign')
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
              <div className="space-y-1.5">
                <Label style={{ color: A.textSecondary }}>Linked Product</Label>
                <Select value={form.product_id || undefined} onValueChange={v => setForm(p => ({ ...p, product_id: v === '__none__' ? '' : v }))}>
                  <SelectTrigger className="rounded-md w-full" style={{ borderColor: A.border, color: A.text }}>
                    <SelectValue placeholder="Select a product to track scans & revenue" />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#fff', borderColor: A.border }}>
                    {products.length === 0 && <SelectItem value="__none__" disabled style={{ color: A.textMuted }}>No products available</SelectItem>}
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id} style={{ color: A.text }}>
                        <span className="flex items-center justify-between w-full">
                          <span className="truncate">{p.name}</span>
                          <span className="text-[10px] font-semibold ml-2" style={{ color: A.green }}>₹{p.price.toLocaleString()}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px]" style={{ color: A.textMuted }}>Each scan on this campaign's QR will track revenue at the linked product's price.</p>
              </div>
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
          const linkedProduct = campaign.product || getProductById(campaign.product_id)
          const qrUrl = buildCampaignUrl(campaign, linkedProduct)
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
                  {linkedProduct ? (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] px-2 py-1 rounded" style={{ background: A.greenLight, color: A.green }}>
                      <Tag className="w-3 h-3" />
                      <span className="font-medium truncate">{linkedProduct.name}</span>
                      <span className="font-bold ml-auto">₹{linkedProduct.price.toLocaleString()}</span>
                    </div>
                  ) : (
                    <p className="text-[10px] mt-2 italic" style={{ color: A.textMuted }}>No linked product</p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${A.borderLight}` }}>
                <span className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded" style={campaign.status === 'ACTIVE' ? { color: A.green, background: A.greenLight } : { color: A.textMuted, background: A.bg }}>{campaign.status}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" style={{ color: A.textSecondary }} onClick={() => setDetailCampaign(campaign)}><Eye className="w-3 h-3 mr-0.5" /> View</Button>
                  <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" style={{ color: A.textSecondary }} onClick={() => toggleStatus(campaign.id, campaign.status)}>{campaign.status === 'ACTIVE' ? 'Archive' : 'Activate'}</Button>
                  <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" style={{ color: A.red }} onClick={() => handleDeleteCampaign(campaign.id)}><Trash2 className="w-3 h-3 mr-0.5" /> Delete</Button>
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
          {detailCampaign && (() => {
            const detailProduct = detailCampaign.product || getProductById(detailCampaign.product_id)
            const detailScans = scans.filter(s => s.campaign_id === detailCampaign.id)
            const revenue = detailProduct ? detailScans.length * detailProduct.price : 0
            const detailQrUrl = buildCampaignUrl(detailCampaign, detailProduct)
            return (
            <div className="space-y-4">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-white rounded-lg border" style={{ borderColor: A.border }}>
                  <QRCodeSVG value={detailQrUrl} size={130} bgColor="#ffffff" fgColor="#1f1e1c" level="M" />
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
                    <p className="flex items-center gap-1.5">
                      <span>Linked Product:</span>
                      {detailProduct ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: A.greenLight, color: A.green }}>
                          <Tag className="w-3 h-3" />
                          <span className="font-medium">{detailProduct.name}</span>
                          <span className="font-bold">· ₹{detailProduct.price.toLocaleString()}</span>
                        </span>
                      ) : <span style={{ color: A.textMuted }}>Not linked</span>}
                    </p>
                    <p>Total Scans: <span className="font-semibold" style={{ color: A.text }}>{detailScans.length}</span></p>
                    {detailProduct && (
                      <p>Estimated Revenue: <span className="font-bold" style={{ color: A.green }}>₹{revenue.toLocaleString()}</span> <span className="text-[10px]" style={{ color: A.textMuted }}>({detailScans.length} × ₹{detailProduct.price.toLocaleString()})</span></p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="rounded-md text-[11px] h-8" style={{ borderColor: A.border, color: A.text }} onClick={() => { navigator.clipboard.writeText(detailQrUrl); toast.success('QR URL copied!') }}>
                      <Copy className="w-3 h-3 mr-1" /> Copy URL
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-md text-[11px] h-8" style={{ borderColor: A.border, color: A.text }} onClick={() => toggleStatus(detailCampaign.id, detailCampaign.status)}>
                      {detailCampaign.status === 'ACTIVE' ? 'Archive' : 'Activate'}
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-md text-[11px] h-8" style={{ borderColor: A.red, color: A.red }} onClick={() => handleDeleteCampaign(detailCampaign.id)}>
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            )
          })()}
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
  const [form, setForm] = useState({ question: '', option1: '', option2: '', option3: '', option4: '', answer: '0', difficulty: 'EASY' })
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
