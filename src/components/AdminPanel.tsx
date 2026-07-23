'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Package, BookOpen, Users, Megaphone,
  Plus, Pencil, Trash2, Copy, Search, Filter,
  ArrowLeft, Eye, Loader2,
  Shield, CheckCircle, XCircle, ChevronLeft, ChevronRight,
  RefreshCw, Leaf, Video,
  HelpCircle
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import {
  productService, productVideoService, productQuizService,
  adminStatsService, userService, campaignService,
  type Product, type ProductVideo, type ProductQuiz,
  type Campaign, type UserProfile,
  type AdminStatsResponse, type UsersListResponse,
} from '@/lib/data-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

// ─── Brand Constants ──────────────────────────────────────
const BRAND = {
  green: '#48805b',
  lime: '#afb75d',
  dark: '#1f1e1c',
  muted: '#88837b',
  surface: '#e3dfd8',
  bg: '#f4f3f0',
  blue: '#2e91b2',
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

// ─── Tab Definitions ─────────────────────────────────────
const TAB_ITEMS = [
  { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { value: 'products', label: 'Products', icon: Package },
  { value: 'learning', label: 'Learning', icon: BookOpen },
  { value: 'users', label: 'Users', icon: Users },
  { value: 'campaigns', label: 'Campaigns', icon: Megaphone },
] as const

type AdminTab = typeof TAB_ITEMS[number]['value']

// ─── Animations ──────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

// ─── Responsive Form Wrapper ─────────────────────────────
function FormWrapper({
  open, onClose, title, description, children, isMobile
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  isMobile: boolean
}) {
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="bottom" className="h-[92vh] rounded-t-2xl overflow-hidden">
          <SheetHeader className="pb-2">
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <ScrollArea className="flex-1 px-4 pb-4">
            {children}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    )
  }
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-2">
          {children}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT: AdminPanel
// ═══════════════════════════════════════════════════════════

export default function AdminPanel() {
  const { user, navigateTo } = useAppStore()
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')

  // Admin check
  useEffect(() => {
    if (!user?.is_admin) {
      navigateTo('landing')
    }
  }, [user, navigateTo])

  if (!user?.is_admin) return null

  return (
    <div className="min-h-screen" style={{ background: BRAND.bg }}>
      {/* Desktop sidebar + Mobile top tabs */}
      {isMobile ? (
        <MobileTopTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      ) : (
        <DesktopLayout activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </div>
  )
}

// ─── Desktop Layout ──────────────────────────────────────
function DesktopLayout({ activeTab, setActiveTab }: {
  activeTab: AdminTab
  setActiveTab: (t: AdminTab) => void
}) {
  const { user, navigateTo } = useAppStore()

  return (
    <div className="min-h-screen flex" style={{ background: BRAND.bg }}>
      {/* Sidebar */}
      <aside
        className="w-64 min-h-screen flex flex-col border-r"
        style={{ background: '#fff', borderColor: BRAND.surface }}
      >
        <div className="p-6 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: BRAND.green }}
          >
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm" style={{ color: BRAND.dark }}>NOTJUST Admin</h1>
            <p className="text-xs" style={{ color: BRAND.muted }}>{user?.name || 'Admin'}</p>
          </div>
        </div>
        <Separator />
        <nav className="flex-1 p-3 space-y-1">
          {TAB_ITEMS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px]"
              style={{
                background: activeTab === tab.value ? `${BRAND.green}15` : 'transparent',
                color: activeTab === tab.value ? BRAND.green : BRAND.muted,
              }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
        <Separator />
        <div className="p-3">
          <button
            onClick={() => navigateTo('landing')}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm min-h-[44px]"
            style={{ color: BRAND.muted }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial="hidden" animate="visible" variants={fadeInUp}>
            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'products' && <ProductsTab />}
            {activeTab === 'learning' && <LearningTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'campaigns' && <CampaignsTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

// ─── Mobile Top Tabs ─────────────────────────────────────
function MobileTopTabs({ activeTab, setActiveTab }: {
  activeTab: AdminTab
  setActiveTab: (t: AdminTab) => void
}) {
  const { user, navigateTo } = useAppStore()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BRAND.bg }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b px-4 py-3" style={{ borderColor: BRAND.surface }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: BRAND.green }}>
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-sm" style={{ color: BRAND.dark }}>Admin</h1>
          </div>
          <button
            onClick={() => navigateTo('landing')}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs min-h-[44px]"
            style={{ color: BRAND.muted }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </header>

      {/* Scrollable horizontal tabs */}
      <div className="sticky top-[56px] z-30 bg-white border-b overflow-x-auto" style={{ borderColor: BRAND.surface }}>
        <div className="flex px-2 py-1 gap-1 min-w-max">
          {TAB_ITEMS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap min-h-[44px]"
              style={{
                background: activeTab === tab.value ? `${BRAND.green}15` : 'transparent',
                color: activeTab === tab.value ? BRAND.green : BRAND.muted,
              }}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 p-4">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial="hidden" animate="visible" variants={fadeInUp}>
            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'products' && <ProductsTab />}
            {activeTab === 'learning' && <LearningTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'campaigns' && <CampaignsTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 1. DASHBOARD TAB
// ═══════════════════════════════════════════════════════════

function DashboardTab() {
  const [statsData, setStatsData] = useState<AdminStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const { navigateTo, user } = useAppStore()

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminStatsService.get(user?.id || '')
      setStatsData(data)
    } catch (err: any) {
      toast.error('Failed to load dashboard stats: ' + (err.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: BRAND.green }} />
      </div>
    )
  }

  if (!statsData) return <p className="text-center py-10" style={{ color: BRAND.muted }}>No stats data available</p>

  const { stats, recentUsers } = statsData
  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: BRAND.green, bgColor: `${BRAND.green}15` },
    { label: 'Total Products', value: stats.totalProducts, icon: Package, color: BRAND.lime, bgColor: `${BRAND.lime}15` },
    { label: 'Active Campaigns', value: stats.activeCampaigns, icon: Megaphone, color: BRAND.blue, bgColor: `${BRAND.blue}15` },
    { label: 'Learning Completions', value: stats.learningCompletions, icon: CheckCircle, color: BRAND.green, bgColor: `${BRAND.green}15` },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: BRAND.dark }}>Dashboard Overview</h2>
        <Button variant="outline" size="sm" onClick={loadStats} className="min-h-[44px]">
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <Card key={card.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: card.bgColor }}>
                  <card.icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: BRAND.dark }}>{card.value}</p>
                  <p className="text-xs" style={{ color: BRAND.muted }}>{card.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Breakdown */}
      {stats.progressByStatus && Object.keys(stats.progressByStatus).length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold" style={{ color: BRAND.dark }}>Learning Progress Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(stats.progressByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: BRAND.surface }}>
                  <Badge variant="outline" className="text-xs" style={{ borderColor: BRAND.green, color: BRAND.green }}>
                    {status}
                  </Badge>
                  <span className="font-semibold text-sm" style={{ color: BRAND.dark }}>{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Users */}
      {recentUsers && recentUsers.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold" style={{ color: BRAND.dark }}>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: BRAND.bg }}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: `${BRAND.green}15`, color: BRAND.green }}>
                      {u.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: BRAND.dark }}>{u.name}</p>
                      <p className="text-xs" style={{ color: BRAND.muted }}>{u.email || 'No email'}</p>
                    </div>
                  </div>
                  {u.is_admin && (
                    <Badge className="text-xs" style={{ background: `${BRAND.blue}15`, color: BRAND.blue }}>Admin</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => navigateTo('admin-products')}
          className="min-h-[44px]"
          style={{ background: BRAND.green, color: '#fff' }}
        >
          <Plus className="w-4 h-4 mr-1" /> Add Product
        </Button>
        <Button
          onClick={() => navigateTo('admin-campaigns')}
          className="min-h-[44px]"
          style={{ background: BRAND.blue, color: '#fff' }}
        >
          <Plus className="w-4 h-4 mr-1" /> Add Campaign
        </Button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 2. PRODUCTS TAB
// ═══════════════════════════════════════════════════════════

function ProductsTab() {
  const isMobile = useIsMobile()
  const { user } = useAppStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const emptyProduct = {
    name: '', slug: '', description: '', short_description: '',
    price: 0, mrp: 0, stock: 0, image_url: '',
    type: 'FIZZ', category: 'Wellness Shot', active: true, featured: false,
    brand: 'NOTJUST', flavor: '', sku: '', weight: '',
    ingredients: '', nutrition_info: '', tags: '',
    allergen_info: '', storage_info: '', shelf_life: '',
    country_origin: 'India', fssai_license: '', hsn_code: '',
    gst_rate: 18, min_order_qty: 1, max_order_qty: 10,
    discount_label: '', highlights: '',
  }
  const [form, setForm] = useState(emptyProduct)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await productService.list()
      setProducts(data)
    } catch (err: any) {
      toast.error('Failed to load products: ' + (err.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadProducts() }, [loadProducts])

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'active' && p.active) || (filter === 'inactive' && !p.active)
    return matchSearch && matchFilter
  })

  const openCreate = () => {
    setEditingProduct(null)
    setForm(emptyProduct)
    setShowForm(true)
  }

  const openEdit = (p: Product) => {
    setEditingProduct(p)
    setForm({
      name: p.name, slug: p.slug, description: p.description || '', short_description: p.short_description || '',
      price: p.price, mrp: p.mrp || 0, stock: p.stock, image_url: p.image_url || '',
      type: p.type, category: p.category || 'Wellness Shot', active: p.active, featured: p.featured || false,
      brand: p.brand || 'NOTJUST', flavor: p.flavor || '', sku: p.sku || '', weight: p.weight || '',
      ingredients: p.ingredients || '', nutrition_info: p.nutrition_info || '', tags: p.tags || '',
      allergen_info: p.allergen_info || '', storage_info: p.storage_info || '', shelf_life: p.shelf_life || '',
      country_origin: p.country_origin || 'India', fssai_license: p.fssai_license || '', hsn_code: p.hsn_code || '',
      gst_rate: p.gst_rate || 18, min_order_qty: p.min_order_qty || 1, max_order_qty: p.max_order_qty || 10,
      discount_label: p.discount_label || '', highlights: p.highlights || '',
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.slug) {
      toast.error('Name and slug are required')
      return
    }
    if (form.price <= 0) {
      toast.error('Price must be greater than 0')
      return
    }
    setSaving(true)
    try {
      if (editingProduct) {
        await productService.update(editingProduct.id, form, user?.id || '')
        toast.success('Product updated successfully')
      } else {
        await productService.create(form, user?.id || '')
        toast.success('Product created successfully')
      }
      setShowForm(false)
      loadProducts()
    } catch (err: any) {
      toast.error('Failed to save product: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await productService.delete(deleteTarget.id, user?.id || '')
      toast.success('Product deleted successfully')
      setDeleteTarget(null)
      loadProducts()
    } catch (err: any) {
      toast.error('Failed to delete product: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const copyShareLink = (p: Product) => {
    const url = `${window.location.origin}?product=${p.slug}`
    navigator.clipboard.writeText(url)
    toast.success('Share link copied!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: BRAND.green }} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header + Search */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold" style={{ color: BRAND.dark }}>Products</h2>
        <Button onClick={openCreate} className="min-h-[44px]" style={{ background: BRAND.green, color: '#fff' }}>
          <Plus className="w-4 h-4 mr-1" /> Add Product
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.muted }} />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 min-h-[44px]"
            style={{ background: '#fff' }}
          />
        </div>
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-[130px] min-h-[44px]" style={{ background: '#fff' }}>
            <Filter className="w-4 h-4 mr-1" style={{ color: BRAND.muted }} />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Display */}
      {filtered.length === 0 ? (
        <div className="text-center py-10" style={{ color: BRAND.muted }}>No products found</div>
      ) : isMobile ? (
        <div className="space-y-3">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} onEdit={openEdit} onDelete={setDeleteTarget} onCopy={copyShareLink} />
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow style={{ background: BRAND.bg }}>
                <TableHead className="text-xs font-semibold">Name</TableHead>
                <TableHead className="text-xs font-semibold">Type</TableHead>
                <TableHead className="text-xs font-semibold">Price</TableHead>
                <TableHead className="text-xs font-semibold">Stock</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {p.image_url && (
                        <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded-md object-cover" />
                      )}
                      <span className="font-medium text-sm" style={{ color: BRAND.dark }}>{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs" style={{ borderColor: BRAND.lime, color: BRAND.lime }}>
                      {p.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-sm">₹{p.price}</TableCell>
                  <TableCell className="text-sm">{p.stock}</TableCell>
                  <TableCell>
                    <Badge className="text-xs" style={{
                      background: p.active ? `${BRAND.green}15` : `${BRAND.muted}15`,
                      color: p.active ? BRAND.green : BRAND.muted,
                    }}>
                      {p.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-8 w-8 min-h-[44px]" onClick={() => openEdit(p)}>
                        <Pencil className="w-4 h-4" style={{ color: BRAND.blue }} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 min-h-[44px]" onClick={() => copyShareLink(p)}>
                        <Copy className="w-4 h-4" style={{ color: BRAND.lime }} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 min-h-[44px]" onClick={() => setDeleteTarget(p)}>
                        <Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Product Form */}
      <FormWrapper
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingProduct ? 'Edit Product' : 'Create Product'}
        description={editingProduct ? `Editing ${editingProduct.name}` : 'Add a new product to the catalog'}
        isMobile={isMobile}
      >
        <ProductForm form={form} setForm={setForm} saving={saving} onSave={handleSave} onCancel={() => setShowForm(false)} />
      </FormWrapper>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone and will also remove all associated videos and quizzes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="min-h-[44px]"
              style={{ background: '#ef4444', color: '#fff' }}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Product Card (Mobile) ────────────────────────────────
function ProductCard({ product, onEdit, onDelete, onCopy }: {
  product: Product
  onEdit: (p: Product) => void
  onDelete: (p: Product) => void
  onCopy: (p: Product) => void
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {product.image_url && (
            <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate" style={{ color: BRAND.dark }}>{product.name}</h3>
              <Badge variant="outline" className="text-xs shrink-0" style={{ borderColor: BRAND.lime, color: BRAND.lime }}>
                {product.type}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs mb-2" style={{ color: BRAND.muted }}>
              <span className="font-semibold" style={{ color: BRAND.dark }}>₹{product.price}</span>
              <span>Stock: {product.stock}</span>
            </div>
            <Badge className="text-xs" style={{
              background: product.active ? `${BRAND.green}15` : `${BRAND.muted}15`,
              color: product.active ? BRAND.green : BRAND.muted,
            }}>
              {product.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: BRAND.surface }}>
          <Button variant="outline" size="sm" className="min-h-[44px] text-xs" onClick={() => onEdit(product)}>
            <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
          </Button>
          <Button variant="outline" size="sm" className="min-h-[44px] text-xs" onClick={() => onCopy(product)}>
            <Copy className="w-3.5 h-3.5 mr-1" /> Copy Link
          </Button>
          <Button variant="outline" size="sm" className="min-h-[44px] text-xs" onClick={() => onDelete(product)} style={{ color: '#ef4444', borderColor: '#ef4444' }}>
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Product Form ─────────────────────────────────────────
function ProductForm({ form, setForm, saving, onSave, onCancel }: {
  form: any
  setForm: (f: any) => void
  saving: boolean
  onSave: () => void
  onCancel: () => void
}) {
  const updateField = (field: string, value: any) => setForm({ ...form, [field]: value })

  return (
    <div className="space-y-4 pb-4">
      {/* Basic Info */}
      <div className="space-y-3">
        <h4 className="font-semibold text-xs uppercase tracking-wider" style={{ color: BRAND.muted }}>Basic Info</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Name *</Label>
            <Input value={form.name} onChange={e => updateField('name', e.target.value)} className="min-h-[44px]" />
          </div>
          <div>
            <Label className="text-xs">Slug *</Label>
            <Input value={form.slug} onChange={e => updateField('slug', e.target.value)} className="min-h-[44px]" />
          </div>
          <div>
            <Label className="text-xs">Type</Label>
            <Select value={form.type} onValueChange={v => updateField('type', v)}>
              <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FIZZ">FIZZ</SelectItem>
                <SelectItem value="STILL">STILL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Input value={form.category} onChange={e => updateField('category', e.target.value)} className="min-h-[44px]" />
          </div>
        </div>
        <div>
          <Label className="text-xs">Short Description</Label>
          <Input value={form.short_description} onChange={e => updateField('short_description', e.target.value)} className="min-h-[44px]" />
        </div>
        <div>
          <Label className="text-xs">Description</Label>
          <Textarea value={form.description} onChange={e => updateField('description', e.target.value)} rows={3} />
        </div>
      </div>

      <Separator />

      {/* Pricing */}
      <div className="space-y-3">
        <h4 className="font-semibold text-xs uppercase tracking-wider" style={{ color: BRAND.muted }}>Pricing & Inventory</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Price (₹) *</Label>
            <Input type="number" value={form.price} onChange={e => updateField('price', parseFloat(e.target.value) || 0)} className="min-h-[44px]" />
          </div>
          <div>
            <Label className="text-xs">MRP (₹)</Label>
            <Input type="number" value={form.mrp} onChange={e => updateField('mrp', parseFloat(e.target.value) || 0)} className="min-h-[44px]" />
          </div>
          <div>
            <Label className="text-xs">Stock</Label>
            <Input type="number" value={form.stock} onChange={e => updateField('stock', parseInt(e.target.value) || 0)} className="min-h-[44px]" />
          </div>
          <div>
            <Label className="text-xs">GST Rate (%)</Label>
            <Input type="number" value={form.gst_rate} onChange={e => updateField('gst_rate', parseFloat(e.target.value) || 0)} className="min-h-[44px]" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Status */}
      <div className="space-y-3">
        <h4 className="font-semibold text-xs uppercase tracking-wider" style={{ color: BRAND.muted }}>Status</h4>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={form.active} onCheckedChange={v => updateField('active', v)} />
            <Label className="text-xs">Active</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.featured} onCheckedChange={v => updateField('featured', v)} />
            <Label className="text-xs">Featured</Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Details */}
      <div className="space-y-3">
        <h4 className="font-semibold text-xs uppercase tracking-wider" style={{ color: BRAND.muted }}>Product Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Brand</Label>
            <Input value={form.brand} onChange={e => updateField('brand', e.target.value)} className="min-h-[44px]" />
          </div>
          <div>
            <Label className="text-xs">Flavor</Label>
            <Input value={form.flavor} onChange={e => updateField('flavor', e.target.value)} className="min-h-[44px]" />
          </div>
          <div>
            <Label className="text-xs">SKU</Label>
            <Input value={form.sku} onChange={e => updateField('sku', e.target.value)} className="min-h-[44px]" />
          </div>
          <div>
            <Label className="text-xs">Weight</Label>
            <Input value={form.weight} onChange={e => updateField('weight', e.target.value)} className="min-h-[44px]" />
          </div>
          <div>
            <Label className="text-xs">Image URL</Label>
            <Input value={form.image_url} onChange={e => updateField('image_url', e.target.value)} className="min-h-[44px]" />
          </div>
          <div>
            <Label className="text-xs">Country Origin</Label>
            <Input value={form.country_origin} onChange={e => updateField('country_origin', e.target.value)} className="min-h-[44px]" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Health & Safety */}
      <div className="space-y-3">
        <h4 className="font-semibold text-xs uppercase tracking-wider" style={{ color: BRAND.muted }}>Health & Safety</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Ingredients</Label>
            <Textarea value={form.ingredients} onChange={e => updateField('ingredients', e.target.value)} rows={2} />
          </div>
          <div>
            <Label className="text-xs">Nutrition Info</Label>
            <Textarea value={form.nutrition_info} onChange={e => updateField('nutrition_info', e.target.value)} rows={2} />
          </div>
          <div>
            <Label className="text-xs">Allergen Info</Label>
            <Input value={form.allergen_info} onChange={e => updateField('allergen_info', e.target.value)} className="min-h-[44px]" />
          </div>
          <div>
            <Label className="text-xs">Storage Info</Label>
            <Input value={form.storage_info} onChange={e => updateField('storage_info', e.target.value)} className="min-h-[44px]" />
          </div>
          <div>
            <Label className="text-xs">Shelf Life</Label>
            <Input value={form.shelf_life} onChange={e => updateField('shelf_life', e.target.value)} className="min-h-[44px]" />
          </div>
          <div>
            <Label className="text-xs">FSSAI License</Label>
            <Input value={form.fssai_license} onChange={e => updateField('fssai_license', e.target.value)} className="min-h-[44px]" />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={onSave}
          disabled={saving}
          className="min-h-[44px] flex-1"
          style={{ background: BRAND.green, color: '#fff' }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
          {saving ? 'Saving...' : 'Save Product'}
        </Button>
        <Button variant="outline" onClick={onCancel} className="min-h-[44px]">Cancel</Button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 3. LEARNING CONTENT TAB
// ═══════════════════════════════════════════════════════════

function LearningTab() {
  const isMobile = useIsMobile()
  const { user } = useAppStore()
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [videos, setVideos] = useState<ProductVideo[]>([])
  const [quizzes, setQuizzes] = useState<ProductQuiz[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingContent, setLoadingContent] = useState(false)

  // Video CRUD state
  const [showVideoForm, setShowVideoForm] = useState(false)
  const [editingVideo, setEditingVideo] = useState<ProductVideo | null>(null)
  const [deleteVideoTarget, setDeleteVideoTarget] = useState<ProductVideo | null>(null)
  const [savingVideo, setSavingVideo] = useState(false)

  const emptyVideo = { title: '', duration: '5:00', description: '', order: 0, video_url: '', active: true }
  const [videoForm, setVideoForm] = useState(emptyVideo)

  // Quiz CRUD state
  const [showQuizForm, setShowQuizForm] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<ProductQuiz | null>(null)
  const [deleteQuizTarget, setDeleteQuizTarget] = useState<ProductQuiz | null>(null)
  const [savingQuiz, setSavingQuiz] = useState(false)

  const emptyQuizForm = { question: '', options: ['', '', '', ''], answer: 0, video_id: '', difficulty: 'EASY', order: 0, active: true }
  const [quizForm, setQuizForm] = useState(emptyQuizForm)

  // Load products for dropdown
  const loadProducts = useCallback(async () => {
    setLoadingProducts(true)
    try {
      const data = await productService.list()
      setProducts(data)
      if (data.length > 0 && !selectedProductId) {
        setSelectedProductId(data[0].id)
      }
    } catch (err: any) {
      toast.error('Failed to load products')
    } finally {
      setLoadingProducts(false)
    }
  }, [])

  useEffect(() => { loadProducts() }, [loadProducts])

  // Load videos and quizzes when product selected
  const loadContent = useCallback(async () => {
    if (!selectedProductId) return
    setLoadingContent(true)
    try {
      const [vData, qData] = await Promise.all([
        productVideoService.list(selectedProductId),
        productQuizService.list(selectedProductId),
      ])
      setVideos(vData)
      setQuizzes(qData)
    } catch (err: any) {
      toast.error('Failed to load learning content')
    } finally {
      setLoadingContent(false)
    }
  }, [selectedProductId])

  useEffect(() => { loadContent() }, [loadContent])

  // Video CRUD handlers
  const openCreateVideo = () => {
    setEditingVideo(null)
    setVideoForm({ ...emptyVideo, order: videos.length + 1 })
    setShowVideoForm(true)
  }

  const openEditVideo = (v: ProductVideo) => {
    setEditingVideo(v)
    setVideoForm({
      title: v.title, duration: v.duration, description: v.description || '',
      order: v.order, video_url: v.video_url || '', active: v.active,
    })
    setShowVideoForm(true)
  }

  const handleSaveVideo = async () => {
    if (!selectedProductId || !videoForm.title) {
      toast.error('Title is required')
      return
    }
    setSavingVideo(true)
    try {
      if (editingVideo) {
        await productVideoService.update(selectedProductId, editingVideo.id, videoForm, user?.id || '')
        toast.success('Video updated')
      } else {
        await productVideoService.create(selectedProductId, { ...videoForm, product_id: selectedProductId }, user?.id || '')
        toast.success('Video created')
      }
      setShowVideoForm(false)
      loadContent()
    } catch (err: any) {
      toast.error('Failed to save video: ' + (err.message || 'Unknown error'))
    } finally {
      setSavingVideo(false)
    }
  }

  const handleDeleteVideo = async () => {
    if (!deleteVideoTarget || !selectedProductId) return
    setSavingVideo(true)
    try {
      await productVideoService.delete(selectedProductId, deleteVideoTarget.id, user?.id || '')
      toast.success('Video deleted')
      setDeleteVideoTarget(null)
      loadContent()
    } catch (err: any) {
      toast.error('Failed to delete video')
    } finally {
      setSavingVideo(false)
    }
  }

  // Quiz CRUD handlers
  const openCreateQuiz = () => {
    setEditingQuiz(null)
    setQuizForm({ ...emptyQuizForm, order: quizzes.length + 1 })
    setShowQuizForm(true)
  }

  const openEditQuiz = (q: ProductQuiz) => {
    setEditingQuiz(q)
    setQuizForm({
      question: q.question,
      options: Array.isArray(q.options) ? q.options : ['', '', '', ''],
      answer: q.answer,
      video_id: q.video_id,
      difficulty: q.difficulty,
      order: q.order,
      active: q.active,
    })
    setShowQuizForm(true)
  }

  const handleSaveQuiz = async () => {
    if (!selectedProductId || !quizForm.question || !quizForm.video_id) {
      toast.error('Question and video reference are required')
      return
    }
    setSavingQuiz(true)
    try {
      if (editingQuiz) {
        await productQuizService.update(selectedProductId, editingQuiz.id, {
          ...quizForm,
          options: quizForm.options,
        }, user?.id || '')
        toast.success('Quiz updated')
      } else {
        await productQuizService.create(selectedProductId, {
          ...quizForm,
          product_id: selectedProductId,
          options: quizForm.options,
        }, user?.id || '')
        toast.success('Quiz created')
      }
      setShowQuizForm(false)
      loadContent()
    } catch (err: any) {
      toast.error('Failed to save quiz: ' + (err.message || 'Unknown error'))
    } finally {
      setSavingQuiz(false)
    }
  }

  const handleDeleteQuiz = async () => {
    if (!deleteQuizTarget || !selectedProductId) return
    setSavingQuiz(true)
    try {
      await productQuizService.delete(selectedProductId, deleteQuizTarget.id, user?.id || '')
      toast.success('Quiz deleted')
      setDeleteQuizTarget(null)
      loadContent()
    } catch (err: any) {
      toast.error('Failed to delete quiz')
    } finally {
      setSavingQuiz(false)
    }
  }

  if (loadingProducts) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: BRAND.green }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold" style={{ color: BRAND.dark }}>Learning Content</h2>

      {/* Product Selector */}
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium" style={{ color: BRAND.dark }}>Select Product:</Label>
        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
          <SelectTrigger className="min-w-[200px] min-h-[44px]" style={{ background: '#fff' }}>
            <SelectValue placeholder="Choose a product" />
          </SelectTrigger>
          <SelectContent>
            {products.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name} ({p.type})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loadingContent && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: BRAND.green }} />
        </div>
      )}

      {!loadingContent && selectedProductId && (
        <>
          {/* Videos Section */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: BRAND.dark }}>
                  <Video className="w-4 h-4" style={{ color: BRAND.green }} />
                  Videos ({videos.length})
                </CardTitle>
                <Button size="sm" className="min-h-[44px]" style={{ background: BRAND.green, color: '#fff' }} onClick={openCreateVideo}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Video
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {videos.length === 0 ? (
                <p className="text-center py-6 text-sm" style={{ color: BRAND.muted }}>No videos yet. Add the first one!</p>
              ) : (
                <ScrollArea className="max-h-96">
                  <div className="space-y-2">
                    {videos.map(v => (
                      <div key={v.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: BRAND.bg }}>
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0" style={{ background: `${BRAND.green}15`, color: BRAND.green }}>
                            {v.order}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: BRAND.dark }}>{v.title}</p>
                            <p className="text-xs" style={{ color: BRAND.muted }}>{v.duration} · {v.active ? 'Active' : 'Inactive'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8 min-h-[44px]" onClick={() => openEditVideo(v)}>
                            <Pencil className="w-3.5 h-3.5" style={{ color: BRAND.blue }} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 min-h-[44px]" onClick={() => setDeleteVideoTarget(v)}>
                            <Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Quizzes Section */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: BRAND.dark }}>
                  <HelpCircle className="w-4 h-4" style={{ color: BRAND.lime }} />
                  Quizzes ({quizzes.length})
                </CardTitle>
                <Button size="sm" className="min-h-[44px]" style={{ background: BRAND.lime, color: BRAND.dark }} onClick={openCreateQuiz}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Quiz
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {quizzes.length === 0 ? (
                <p className="text-center py-6 text-sm" style={{ color: BRAND.muted }}>No quizzes yet. Add the first one!</p>
              ) : (
                <ScrollArea className="max-h-96">
                  <div className="space-y-2">
                    {quizzes.map(q => (
                      <div key={q.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: BRAND.bg }}>
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0" style={{ background: `${BRAND.lime}15`, color: BRAND.lime }}>
                            {q.order}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: BRAND.dark }}>{q.question}</p>
                            <p className="text-xs" style={{ color: BRAND.muted }}>
                              {q.difficulty} · {q.category || 'General'} · {q.active ? 'Active' : 'Inactive'}
                              {q.video?.title && ` · Video: ${q.video.title}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8 min-h-[44px]" onClick={() => openEditQuiz(q)}>
                            <Pencil className="w-3.5 h-3.5" style={{ color: BRAND.blue }} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 min-h-[44px]" onClick={() => setDeleteQuizTarget(q)}>
                            <Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Video Form */}
      <FormWrapper
        open={showVideoForm}
        onClose={() => setShowVideoForm(false)}
        title={editingVideo ? 'Edit Video' : 'Add Video'}
        isMobile={isMobile}
      >
        <div className="space-y-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Title *</Label>
              <Input value={videoForm.title} onChange={e => setVideoForm({ ...videoForm, title: e.target.value })} className="min-h-[44px]" />
            </div>
            <div>
              <Label className="text-xs">Duration</Label>
              <Input value={videoForm.duration} onChange={e => setVideoForm({ ...videoForm, duration: e.target.value })} className="min-h-[44px]" placeholder="5:00" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea value={videoForm.description} onChange={e => setVideoForm({ ...videoForm, description: e.target.value })} rows={2} />
          </div>
          <div>
            <Label className="text-xs">Video URL</Label>
            <Input value={videoForm.video_url} onChange={e => setVideoForm({ ...videoForm, video_url: e.target.value })} className="min-h-[44px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Order</Label>
              <Input type="number" value={videoForm.order} onChange={e => setVideoForm({ ...videoForm, order: parseInt(e.target.value) || 0 })} className="min-h-[44px]" />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={videoForm.active} onCheckedChange={v => setVideoForm({ ...videoForm, active: v })} />
              <Label className="text-xs">Active</Label>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSaveVideo} disabled={savingVideo} className="min-h-[44px] flex-1" style={{ background: BRAND.green, color: '#fff' }}>
              {savingVideo ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {savingVideo ? 'Saving...' : 'Save Video'}
            </Button>
            <Button variant="outline" onClick={() => setShowVideoForm(false)} className="min-h-[44px]">Cancel</Button>
          </div>
        </div>
      </FormWrapper>

      {/* Quiz Form */}
      <FormWrapper
        open={showQuizForm}
        onClose={() => setShowQuizForm(false)}
        title={editingQuiz ? 'Edit Quiz Question' : 'Add Quiz Question'}
        isMobile={isMobile}
      >
        <div className="space-y-4 pb-4">
          <div>
            <Label className="text-xs">Video Reference *</Label>
            <Select value={quizForm.video_id} onValueChange={v => setQuizForm({ ...quizForm, video_id: v })}>
              <SelectTrigger className="min-h-[44px]" style={{ background: '#fff' }}>
                <SelectValue placeholder="Select a video" />
              </SelectTrigger>
              <SelectContent>
                {videos.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.title} (Order {v.order})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Question *</Label>
            <Textarea value={quizForm.question} onChange={e => setQuizForm({ ...quizForm, question: e.target.value })} rows={2} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Options (at least 2)</Label>
            {quizForm.options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{
                  background: quizForm.answer === idx ? BRAND.green : BRAND.surface,
                  color: quizForm.answer === idx ? '#fff' : BRAND.muted,
                }}>
                  {idx + 1}
                </div>
                <Input
                  value={opt}
                  onChange={e => {
                    const newOpts = [...quizForm.options]
                    newOpts[idx] = e.target.value
                    setQuizForm({ ...quizForm, options: newOpts })
                  }}
                  className="min-h-[44px] flex-1"
                  placeholder={`Option ${idx + 1}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setQuizForm({ ...quizForm, answer: idx })}
                  style={{ color: quizForm.answer === idx ? BRAND.green : BRAND.muted }}
                >
                  {quizForm.answer === idx ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </Button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Difficulty</Label>
              <Select value={quizForm.difficulty} onValueChange={v => setQuizForm({ ...quizForm, difficulty: v })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Order</Label>
              <Input type="number" value={quizForm.order} onChange={e => setQuizForm({ ...quizForm, order: parseInt(e.target.value) || 0 })} className="min-h-[44px]" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={quizForm.active} onCheckedChange={v => setQuizForm({ ...quizForm, active: v })} />
            <Label className="text-xs">Active</Label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSaveQuiz} disabled={savingQuiz} className="min-h-[44px] flex-1" style={{ background: BRAND.lime, color: BRAND.dark }}>
              {savingQuiz ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {savingQuiz ? 'Saving...' : 'Save Quiz'}
            </Button>
            <Button variant="outline" onClick={() => setShowQuizForm(false)} className="min-h-[44px]">Cancel</Button>
          </div>
        </div>
      </FormWrapper>

      {/* Delete Video Confirmation */}
      <AlertDialog open={!!deleteVideoTarget} onOpenChange={() => setDeleteVideoTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteVideoTarget?.title}"? This will also remove any associated quiz questions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVideo} className="min-h-[44px]" style={{ background: '#ef4444', color: '#fff' }} disabled={savingVideo}>
              {savingVideo ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Quiz Confirmation */}
      <AlertDialog open={!!deleteQuizTarget} onOpenChange={() => setDeleteQuizTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quiz question? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuiz} className="min-h-[44px]" style={{ background: '#ef4444', color: '#fff' }} disabled={savingQuiz}>
              {savingQuiz ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 4. USERS TAB
// ═══════════════════════════════════════════════════════════

function UsersTab() {
  const isMobile = useIsMobile()
  const { user: currentUser } = useAppStore()
  const [usersData, setUsersData] = useState<UsersListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [toggleLoading, setToggleLoading] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await userService.list({ page, limit: 20, search }, currentUser?.id || '')
      setUsersData(data)
    } catch (err: any) {
      toast.error('Failed to load users: ' + (err.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { loadUsers() }, [loadUsers])

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1) // Reset page on search
  }

  const toggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    setToggleLoading(userId)
    try {
      await userService.update(userId, { is_admin: !currentIsAdmin }, currentUser?.id || '')
      toast.success(`Admin status updated`)
      loadUsers()
    } catch (err: any) {
      toast.error('Failed to update admin status')
    } finally {
      setToggleLoading(null)
    }
  }

  if (loading && !usersData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: BRAND.green }} />
      </div>
    )
  }

  const users = usersData?.users || []
  const pagination = usersData?.pagination

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold" style={{ color: BRAND.dark }}>Users</h2>
        <span className="text-sm" style={{ color: BRAND.muted }}>
          {pagination ? `${pagination.total} total` : ''}
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.muted }} />
        <Input
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="pl-9 min-h-[44px]"
          style={{ background: '#fff' }}
        />
      </div>

      {/* Users Display */}
      {users.length === 0 ? (
        <div className="text-center py-10" style={{ color: BRAND.muted }}>No users found</div>
      ) : isMobile ? (
        <div className="space-y-3">
          {users.map(u => (
            <UserCard key={u.id} user={u} onToggleAdmin={toggleAdmin} onView={setSelectedUser} toggleLoading={toggleLoading} />
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow style={{ background: BRAND.bg }}>
                  <TableHead className="text-xs font-semibold">Name</TableHead>
                  <TableHead className="text-xs font-semibold">Email</TableHead>
                  <TableHead className="text-xs font-semibold">Phone</TableHead>
                  <TableHead className="text-xs font-semibold">Admin</TableHead>
                  <TableHead className="text-xs font-semibold">Learning</TableHead>
                  <TableHead className="text-xs font-semibold">Joined</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: `${BRAND.green}15`, color: BRAND.green }}>
                          {u.name?.charAt(0) || '?'}
                        </div>
                        <span className="font-medium text-sm" style={{ color: BRAND.dark }}>{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm" style={{ color: BRAND.muted }}>{u.email || '—'}</TableCell>
                    <TableCell className="text-sm" style={{ color: BRAND.muted }}>{u.phone || '—'}</TableCell>
                    <TableCell>
                      <Badge className="text-xs" style={{
                        background: u.is_admin ? `${BRAND.blue}15` : `${BRAND.muted}15`,
                        color: u.is_admin ? BRAND.blue : BRAND.muted,
                      }}>
                        {u.is_admin ? 'Admin' : 'User'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.learning_completed ? (
                        <CheckCircle className="w-4 h-4" style={{ color: BRAND.green }} />
                      ) : (
                        <XCircle className="w-4 h-4" style={{ color: BRAND.muted }} />
                      )}
                    </TableCell>
                    <TableCell className="text-xs" style={{ color: BRAND.muted }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8 min-h-[44px]" onClick={() => setSelectedUser(u)}>
                          <Eye className="w-4 h-4" style={{ color: BRAND.blue }} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 min-h-[44px]"
                          onClick={() => toggleAdmin(u.id, u.is_admin)}
                          disabled={toggleLoading === u.id}
                        >
                          {toggleLoading === u.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Shield className="w-4 h-4" style={{ color: u.is_admin ? BRAND.blue : BRAND.muted }} />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px]"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </Button>
          <span className="text-sm" style={{ color: BRAND.muted }}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px]"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* User Detail Dialog */}
      <FormWrapper
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="User Details"
        isMobile={isMobile}
      >
        {selectedUser && (
          <div className="space-y-4 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: `${BRAND.green}15`, color: BRAND.green }}>
                {selectedUser.name?.charAt(0) || '?'}
              </div>
              <div>
                <h3 className="font-bold text-lg" style={{ color: BRAND.dark }}>{selectedUser.name}</h3>
                <div className="flex gap-2 mt-1">
                  {selectedUser.is_admin && (
                    <Badge style={{ background: `${BRAND.blue}15`, color: BRAND.blue }}>
                      <Shield className="w-3 h-3 mr-1" /> Admin
                    </Badge>
                  )}
                  {selectedUser.learning_completed && (
                    <Badge style={{ background: `${BRAND.green}15`, color: BRAND.green }}>
                      <CheckCircle className="w-3 h-3 mr-1" /> Learning Complete
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Email', value: selectedUser.email || '—' },
                { label: 'Phone', value: selectedUser.phone || '—' },
                { label: 'Age', value: selectedUser.age?.toString() || '—' },
                { label: 'Gender', value: selectedUser.gender || '—' },
                { label: 'Country', value: selectedUser.country || '—' },
                { label: 'State', value: selectedUser.state || '—' },
                { label: 'User ID', value: selectedUser.user_id },
                { label: 'Joined', value: new Date(selectedUser.created_at).toLocaleDateString() },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-lg" style={{ background: BRAND.bg }}>
                  <p className="text-xs font-medium" style={{ color: BRAND.muted }}>{item.label}</p>
                  <p className="text-sm font-semibold" style={{ color: BRAND.dark }}>{item.value}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => toggleAdmin(selectedUser.id, selectedUser.is_admin)}
                disabled={toggleLoading === selectedUser.id}
                className="min-h-[44px] flex-1"
                style={{ background: selectedUser.is_admin ? BRAND.muted : BRAND.blue, color: '#fff' }}
              >
                {toggleLoading === selectedUser.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Shield className="w-4 h-4 mr-1" />}
                {selectedUser.is_admin ? 'Remove Admin' : 'Make Admin'}
              </Button>
              <Button variant="outline" onClick={() => setSelectedUser(null)} className="min-h-[44px]">Close</Button>
            </div>
          </div>
        )}
      </FormWrapper>
    </div>
  )
}

// ─── User Card (Mobile) ───────────────────────────────────
function UserCard({ user, onToggleAdmin, onView, toggleLoading }: {
  user: UserProfile
  onToggleAdmin: (id: string, isAdmin: boolean) => void
  onView: (u: UserProfile) => void
  toggleLoading: string | null
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: `${BRAND.green}15`, color: BRAND.green }}>
            {user.name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate" style={{ color: BRAND.dark }}>{user.name}</h3>
              {user.is_admin && (
                <Badge className="text-xs shrink-0" style={{ background: `${BRAND.blue}15`, color: BRAND.blue }}>
                  <Shield className="w-3 h-3 mr-0.5" /> Admin
                </Badge>
              )}
              {user.learning_completed && (
                <CheckCircle className="w-4 h-4 shrink-0" style={{ color: BRAND.green }} />
              )}
            </div>
            <p className="text-xs mb-1" style={{ color: BRAND.muted }}>{user.email || 'No email'}</p>
            <p className="text-xs" style={{ color: BRAND.muted }}>{user.phone || 'No phone'} · Joined {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: BRAND.surface }}>
          <Button variant="outline" size="sm" className="min-h-[44px] text-xs" onClick={() => onView(user)}>
            <Eye className="w-3.5 h-3.5 mr-1" /> View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] text-xs"
            onClick={() => onToggleAdmin(user.id, user.is_admin)}
            disabled={toggleLoading === user.id}
          >
            {toggleLoading === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Shield className="w-3.5 h-3.5 mr-1" />}
            {user.is_admin ? 'Remove Admin' : 'Make Admin'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════
// 5. CAMPAIGNS TAB
// ═══════════════════════════════════════════════════════════

function CampaignsTab() {
  const isMobile = useIsMobile()
  const { user } = useAppStore()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE' | 'PAUSED'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null)
  const [saving, setSaving] = useState(false)

  const emptyCampaign = {
    name: '', channel: 'HOTEL', partner_name: '', location: '',
    start_date: '', end_date: '', status: 'ACTIVE', qr_code_url: '',
  }
  const [form, setForm] = useState(emptyCampaign)

  const loadCampaigns = useCallback(async () => {
    setLoading(true)
    try {
      const data = await campaignService.list(filter !== 'all' ? { status: filter } : undefined)
      setCampaigns(data)
    } catch (err: any) {
      toast.error('Failed to load campaigns: ' + (err.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { loadCampaigns() }, [loadCampaigns])

  const openCreate = () => {
    setEditingCampaign(null)
    setForm(emptyCampaign)
    setShowForm(true)
  }

  const openEdit = (c: Campaign) => {
    setEditingCampaign(c)
    setForm({
      name: c.name,
      channel: c.channel,
      partner_name: c.partner_name || '',
      location: c.location || '',
      start_date: c.start_date ? new Date(c.start_date).toISOString().split('T')[0] : '',
      end_date: c.end_date ? new Date(c.end_date).toISOString().split('T')[0] : '',
      status: c.status,
      qr_code_url: c.qr_code_url || '',
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name) {
      toast.error('Campaign name is required')
      return
    }
    setSaving(true)
    try {
      const payload: any = {
        name: form.name,
        channel: form.channel,
        partner_name: form.partner_name || null,
        location: form.location || null,
        status: form.status,
        qr_code_url: form.qr_code_url || null,
      }
      if (form.start_date) payload.start_date = form.start_date
      if (form.end_date) payload.end_date = form.end_date

      if (editingCampaign) {
        await campaignService.update(editingCampaign.id, payload, user?.id || '')
        toast.success('Campaign updated')
      } else {
        await campaignService.create(payload, user?.id || '')
        toast.success('Campaign created')
      }
      setShowForm(false)
      loadCampaigns()
    } catch (err: any) {
      toast.error('Failed to save campaign: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await campaignService.delete(deleteTarget.id, user?.id || '')
      toast.success('Campaign deleted')
      setDeleteTarget(null)
      loadCampaigns()
    } catch (err: any) {
      toast.error('Failed to delete campaign')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: BRAND.green }} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold" style={{ color: BRAND.dark }}>Campaigns</h2>
        <Button onClick={openCreate} className="min-h-[44px]" style={{ background: BRAND.blue, color: '#fff' }}>
          <Plus className="w-4 h-4 mr-1" /> Add Campaign
        </Button>
      </div>

      <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
        <SelectTrigger className="w-[140px] min-h-[44px]" style={{ background: '#fff' }}>
          <Filter className="w-4 h-4 mr-1" style={{ color: BRAND.muted }} />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="INACTIVE">Inactive</SelectItem>
          <SelectItem value="PAUSED">Paused</SelectItem>
        </SelectContent>
      </Select>

      {/* Campaigns Display */}
      {campaigns.length === 0 ? (
        <div className="text-center py-10" style={{ color: BRAND.muted }}>No campaigns found</div>
      ) : isMobile ? (
        <div className="space-y-3">
          {campaigns.map(c => (
            <CampaignCard key={c.id} campaign={c} onEdit={openEdit} onDelete={setDeleteTarget} />
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow style={{ background: BRAND.bg }}>
                  <TableHead className="text-xs font-semibold">Name</TableHead>
                  <TableHead className="text-xs font-semibold">Channel</TableHead>
                  <TableHead className="text-xs font-semibold">Partner</TableHead>
                  <TableHead className="text-xs font-semibold">Location</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map(c => (
                  <TableRow key={c.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-sm" style={{ color: BRAND.dark }}>{c.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs" style={{ borderColor: BRAND.lime, color: BRAND.lime }}>
                        {c.channel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm" style={{ color: BRAND.muted }}>{c.partner_name || '—'}</TableCell>
                    <TableCell className="text-sm" style={{ color: BRAND.muted }}>{c.location || '—'}</TableCell>
                    <TableCell>
                      <CampaignStatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8 min-h-[44px]" onClick={() => openEdit(c)}>
                          <Pencil className="w-4 h-4" style={{ color: BRAND.blue }} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 min-h-[44px]" onClick={() => setDeleteTarget(c)}>
                          <Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      )}

      {/* Campaign Form */}
      <FormWrapper
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
        description={editingCampaign ? `Editing ${editingCampaign.name}` : 'Add a new marketing campaign'}
        isMobile={isMobile}
      >
        <div className="space-y-4 pb-4">
          <div>
            <Label className="text-xs">Campaign Name *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="min-h-[44px]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Channel</Label>
              <Select value={form.channel} onValueChange={v => setForm({ ...form, channel: v })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOTEL">Hotel</SelectItem>
                  <SelectItem value="RESTAURANT">Restaurant</SelectItem>
                  <SelectItem value="GYM">Gym</SelectItem>
                  <SelectItem value="SPA">Spa</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="SOCIAL_MEDIA">Social Media</SelectItem>
                  <SelectItem value="EVENT">Event</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Partner Name</Label>
              <Input value={form.partner_name} onChange={e => setForm({ ...form, partner_name: e.target.value })} className="min-h-[44px]" />
            </div>
            <div>
              <Label className="text-xs">Location</Label>
              <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="min-h-[44px]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Start Date</Label>
              <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="min-h-[44px]" />
            </div>
            <div>
              <Label className="text-xs">End Date</Label>
              <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="min-h-[44px]" />
            </div>
          </div>
          <div>
            <Label className="text-xs">QR Code URL</Label>
            <Input value={form.qr_code_url} onChange={e => setForm({ ...form, qr_code_url: e.target.value })} className="min-h-[44px]" />
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={saving} className="min-h-[44px] flex-1" style={{ background: BRAND.blue, color: '#fff' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
              {saving ? 'Saving...' : 'Save Campaign'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} className="min-h-[44px]">Cancel</Button>
          </div>
        </div>
      </FormWrapper>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="min-h-[44px]" style={{ background: '#ef4444', color: '#fff' }} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Campaign Card (Mobile) ───────────────────────────────
function CampaignCard({ campaign, onEdit, onDelete }: {
  campaign: Campaign
  onEdit: (c: Campaign) => void
  onDelete: (c: Campaign) => void
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate" style={{ color: BRAND.dark }}>{campaign.name}</h3>
              <CampaignStatusBadge status={campaign.status} />
            </div>
            <div className="flex items-center gap-2 text-xs mb-1" style={{ color: BRAND.muted }}>
              <Badge variant="outline" className="text-xs" style={{ borderColor: BRAND.lime, color: BRAND.lime }}>
                {campaign.channel}
              </Badge>
              {campaign.partner_name && <span>{campaign.partner_name}</span>}
              {campaign.location && <span>· {campaign.location}</span>}
            </div>
            {campaign.start_date && (
              <p className="text-xs" style={{ color: BRAND.muted }}>
                {new Date(campaign.start_date).toLocaleDateString()} — {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'Ongoing'}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: BRAND.surface }}>
          <Button variant="outline" size="sm" className="min-h-[44px] text-xs" onClick={() => onEdit(campaign)}>
            <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
          </Button>
          <Button variant="outline" size="sm" className="min-h-[44px] text-xs" onClick={() => onDelete(campaign)} style={{ color: '#ef4444', borderColor: '#ef4444' }}>
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Campaign Status Badge ────────────────────────────────
function CampaignStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    ACTIVE: { bg: `${BRAND.green}15`, color: BRAND.green },
    INACTIVE: { bg: `${BRAND.muted}15`, color: BRAND.muted },
    PAUSED: { bg: '#f59e0b15', color: '#f59e0b' },
  }
  const s = styles[status] || styles.INACTIVE
  return (
    <Badge className="text-xs" style={{ background: s.bg, color: s.color }}>
      {status}
    </Badge>
  )
}
