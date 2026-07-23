'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User, Mail, Phone, MapPin, Shield, Edit, LogOut, ArrowLeft,
  CheckCircle, Award, Eye, EyeOff, AlertCircle, Globe, RefreshCw,
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { userService, productLearningService, productService } from '@/lib/data-service'
import type { UserProfile, ProductLearningProgress, Product } from '@/lib/data-service'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Progress } from '@/components/ui/progress'
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

// ─── Indian States List ────────────────────────────────────
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

// ─── Animation ────────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

// ─── Helper: Get initials from name ────────────────────────
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ============================================================
// PROFILE PAGE
// ============================================================
export function ProfilePage() {
  const { user, navigateTo, setUser, goBack } = useAppStore()
  const [learningProgress, setLearningProgress] = useState<ProductLearningProgress[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProgress, setLoadingProgress] = useState(true)
  const [editOpen, setEditOpen] = useState(false)

  // Fetch learning progress and products
  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      setLoadingProgress(true)
      try {
        const progress = await productLearningService.get(user.user_id)
        setLearningProgress(progress)
        const prods = await productService.list({ active: true })
        setProducts(prods)
      } catch {
        // Silently fail - progress is optional
      } finally {
        setLoadingProgress(false)
      }
    }
    fetchData()
  }, [user])

  // Redirect if no user
  if (!user) {
    navigateTo('auth-login')
    return null
  }

  const handleLogout = () => {
    setUser(null)
    navigateTo('landing')
    toast.info('You have been logged out')
  }

  // Find product name by id
  const getProductById = (productId: string) => {
    return products.find(p => p.id === productId)
  }

  return (
    <div className="min-h-screen bg-[#f4f3f0] pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          {/* Header with Back + Logout */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={goBack}
              className="flex items-center gap-2 text-[#88837b] hover:text-[#1f1e1c] min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="flex items-center gap-2 text-[#88837b] hover:text-red-600 min-h-[44px]"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* ─── User Info Card ─── */}
            <Card className="border-[#e3dfd8] md:col-span-1">
              <CardContent className="p-6">
                {/* Avatar */}
                <div className="flex flex-col items-center mb-6">
                  <Avatar className="w-20 h-20 mb-3">
                    <AvatarFallback
                      className="bg-[#48805b] text-white text-2xl font-bold font-heading"
                    >
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="font-bold text-xl text-[#1f1e1c] text-center">{user.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {user.is_admin && (
                      <Badge className="bg-[#2e91b2]/10 text-[#2e91b2] border-[#2e91b2]/20">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {user.learning_completed && (
                      <Badge className="bg-[#48805b]/10 text-[#48805b] border-[#48805b]/20">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Learning Complete
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator className="bg-[#e3dfd8] mb-4" />

                {/* User Details */}
                <div className="space-y-3">
                  {user.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-[#48805b]" />
                      <span className="text-[#88837b]">Email:</span>
                      <span className="text-[#1f1e1c] font-medium">{user.email}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-[#48805b]" />
                      <span className="text-[#88837b]">Phone:</span>
                      <span className="text-[#1f1e1c] font-medium">{user.phone}</span>
                    </div>
                  )}
                  {user.age && (
                    <div className="flex items-center gap-3 text-sm">
                      <User className="w-4 h-4 text-[#48805b]" />
                      <span className="text-[#88837b]">Age:</span>
                      <span className="text-[#1f1e1c] font-medium">{user.age}</span>
                    </div>
                  )}
                  {user.gender && (
                    <div className="flex items-center gap-3 text-sm">
                      <User className="w-4 h-4 text-[#48805b]" />
                      <span className="text-[#88837b]">Gender:</span>
                      <span className="text-[#1f1e1c] font-medium">{user.gender}</span>
                    </div>
                  )}
                  {user.country && (
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="w-4 h-4 text-[#48805b]" />
                      <span className="text-[#88837b]">Country:</span>
                      <span className="text-[#1f1e1c] font-medium">{user.country}</span>
                    </div>
                  )}
                  {user.state && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-[#48805b]" />
                      <span className="text-[#88837b]">State:</span>
                      <span className="text-[#1f1e1c] font-medium">{user.state}</span>
                    </div>
                  )}
                </div>

                <Separator className="bg-[#e3dfd8] mt-4 mb-4" />

                {/* Edit Profile button */}
                <EditProfileButton
                  user={user}
                  setUser={setUser}
                  editOpen={editOpen}
                  setEditOpen={setEditOpen}
                />
              </CardContent>
            </Card>

            {/* ─── Learning Progress & Details ─── */}
            <div className="md:col-span-2 space-y-6">
              {/* Learning Progress Card */}
              <Card className="border-[#e3dfd8]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-heading font-bold flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#48805b]" />
                    Learning Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingProgress ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-5 h-5 animate-spin text-[#48805b]" />
                      <span className="ml-2 text-sm text-[#88837b]">Loading progress...</span>
                    </div>
                  ) : learningProgress.length === 0 ? (
                    <div className="text-center py-8">
                      <Award className="w-10 h-10 text-[#e3dfd8] mx-auto mb-3" />
                      <p className="text-sm text-[#88837b]">No learning progress yet.</p>
                      <Button
                        onClick={() => navigateTo('products')}
                        variant="outline"
                        className="mt-3 border-[#48805b] text-[#48805b] hover:bg-[#48805b]/10 min-h-[44px]"
                      >
                        Start Learning
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {learningProgress.map((lp) => {
                        const product = getProductById(lp.product_id)
                        return (
                          <div
                            key={lp.id}
                            className="p-4 rounded-xl bg-[#f4f3f0] border border-[#e3dfd8]"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-[#1f1e1c]">
                                  {product?.name || 'Unknown Product'}
                                </span>
                              </div>
                              <Badge
                                className={
                                  lp.status === 'COMPLETED'
                                    ? 'bg-[#48805b]/10 text-[#48805b] border-[#48805b]/20'
                                    : lp.status === 'IN_PROGRESS'
                                      ? 'bg-[#2e91b2]/10 text-[#2e91b2] border-[#2e91b2]/20'
                                      : 'bg-[#e3dfd8] text-[#88837b]'
                                }
                              >
                                {lp.status === 'COMPLETED' ? 'Completed' : lp.status === 'IN_PROGRESS' ? 'In Progress' : 'Not Started'}
                              </Badge>
                            </div>

                            {/* Video Progress */}
                            {lp.video_progress && Object.keys(lp.video_progress).length > 0 && (
                              <div className="space-y-2 mb-2">
                                {Object.entries(lp.video_progress).map(([videoId, progress]) => (
                                  <div key={videoId} className="flex items-center gap-2">
                                    <span className="text-xs text-[#88837b] w-24 truncate">
                                      Video {videoId.slice(-3)}
                                    </span>
                                    <Progress
                                      value={progress}
                                      className="flex-1 h-2 bg-[#e3dfd8]"
                                    />
                                    <span className="text-xs text-[#88837b] w-8 text-right">{progress}%</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Quiz Score */}
                            {lp.quiz_completed && (
                              <div className="flex items-center gap-2 mt-2">
                                <CheckCircle className="w-4 h-4 text-[#48805b]" />
                                <span className="text-sm text-[#1f1e1c]">
                                  Quiz Score: <strong>{lp.quiz_score}%</strong>
                                </span>
                                {lp.quiz_score >= 80 && (
                                  <Badge className="bg-[#afb75d]/10 text-[#afb75d] border-[#afb75d]/20 text-xs">
                                    <Award className="w-3 h-3 mr-1" /> Passed
                                  </Badge>
                                )}
                              </div>
                            )}

                            {lp.completed_at && (
                              <p className="text-xs text-[#88837b] mt-2">
                                Completed on {new Date(lp.completed_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Details Card */}
              <Card className="border-[#e3dfd8]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-heading font-bold flex items-center gap-2">
                    <User className="w-5 h-5 text-[#48805b]" />
                    Account Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailItem label="User ID" value={user.user_id} icon={<User className="w-4 h-4" />} />
                    <DetailItem label="Email" value={user.email || 'Not provided'} icon={<Mail className="w-4 h-4" />} />
                    <DetailItem label="Phone" value={user.phone || 'Not provided'} icon={<Phone className="w-4 h-4" />} />
                    <DetailItem label="Age" value={user.age ? String(user.age) : 'Not provided'} icon={<User className="w-4 h-4" />} />
                    <DetailItem label="Gender" value={user.gender || 'Not provided'} icon={<User className="w-4 h-4" />} />
                    <DetailItem label="Country" value={user.country || 'Not provided'} icon={<Globe className="w-4 h-4" />} />
                    <DetailItem label="State" value={user.state || 'Not provided'} icon={<MapPin className="w-4 h-4" />} />
                    <DetailItem label="Admin" value={user.is_admin ? 'Yes' : 'No'} icon={<Shield className="w-4 h-4" />} />
                    <DetailItem
                      label="Joined"
                      value={new Date(user.created_at).toLocaleDateString()}
                      icon={<CheckCircle className="w-4 h-4" />}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// ─── Detail Item Helper ────────────────────────────────────
function DetailItem({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  const isNotProvided = value === 'Not provided'
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#f4f3f0]/50 border border-[#e3dfd8]/50">
      <div className="text-[#48805b] mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-[#88837b] font-medium">{label}</p>
        <p className={`text-sm font-medium ${isNotProvided ? 'text-[#88837b]' : 'text-[#1f1e1c]'}`}>
          {value}
        </p>
      </div>
    </div>
  )
}

// ============================================================
// EDIT PROFILE BUTTON + DIALOG/SHEET
// Uses Sheet on mobile, Dialog on desktop
// ============================================================
function EditProfileButton({
  user,
  setUser,
  editOpen,
  setEditOpen,
}: {
  user: UserProfile
  setUser: (user: UserProfile | null) => void
  editOpen: boolean
  setEditOpen: (open: boolean) => void
}) {
  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    age: user.age ? String(user.age) : '',
    gender: user.gender || '',
    state: user.state || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when dialog opens
  useEffect(() => {
    if (editOpen) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        age: user.age ? String(user.age) : '',
        gender: user.gender || '',
        state: user.state || '',
      })
      setError(null)
    }
  }, [editOpen, user])

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSave = async () => {
    setError(null)

    if (!form.name.trim()) {
      setError('Name is required')
      return
    }

    setLoading(true)
    try {
      const updatedUser = await userService.update(user.id, {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        age: form.age ? parseInt(form.age) : null,
        gender: form.gender || null,
        state: form.state || null,
      }, user.id)

      setUser(updatedUser)
      setEditOpen(false)
      toast.success('Profile updated successfully!')
    } catch (err: any) {
      const msg = err?.message || 'Update failed'
      setError('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const editFormContent = (
    <div className="space-y-4">
      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Name */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Full Name <span className="text-[#48805b]">*</span></Label>
        <Input
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          className="h-11 border-[#e3dfd8] focus:border-[#48805b]"
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Email</Label>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => updateField('email', e.target.value)}
          className="h-11 border-[#e3dfd8] focus:border-[#48805b]"
        />
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Phone</Label>
        <Input
          type="tel"
          value={form.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          className="h-11 border-[#e3dfd8] focus:border-[#48805b]"
        />
      </div>

      {/* Age */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Age</Label>
        <Input
          type="number"
          value={form.age}
          onChange={(e) => updateField('age', e.target.value)}
          className="h-11 border-[#e3dfd8] focus:border-[#48805b]"
          min={1}
          max={120}
        />
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Gender</Label>
        <Select
          value={form.gender}
          onValueChange={(v) => updateField('gender', v)}
        >
          <SelectTrigger className="h-11 border-[#e3dfd8] focus:border-[#48805b] w-full">
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* State */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">State</Label>
        <Select
          value={form.state}
          onValueChange={(v) => updateField('state', v)}
        >
          <SelectTrigger className="h-11 border-[#e3dfd8] focus:border-[#48805b] w-full">
            <SelectValue placeholder="Select your state" />
          </SelectTrigger>
          <SelectContent className="max-h-48">
            {INDIAN_STATES.map((state) => (
              <SelectItem key={state} value={state}>{state}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 h-11 bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold min-h-[44px]"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            'Save Changes'
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => setEditOpen(false)}
          disabled={loading}
          className="flex-1 h-11 border-[#e3dfd8] text-[#88837b] hover:text-[#1f1e1c] min-h-[44px]"
        >
          Cancel
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Edit Profile Button */}
      <Button
        onClick={() => setEditOpen(true)}
        className="w-full h-11 bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold min-h-[44px] flex items-center gap-2"
      >
        <Edit className="w-4 h-4" />
        Edit Profile
      </Button>

      {/* Desktop: Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md border-[#e3dfd8] max-h-[85vh] overflow-y-auto hidden md:block">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
              <Edit className="w-5 h-5 text-[#48805b]" />
              Edit Profile
            </DialogTitle>
            <DialogDescription className="text-[#88837b]">
              Update your personal information
            </DialogDescription>
          </DialogHeader>
          <Separator className="bg-[#e3dfd8]" />
          {editFormContent}
        </DialogContent>
      </Dialog>

      {/* Mobile: Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent
          side="bottom"
          className="h-[90vh] md:hidden rounded-t-2xl border-[#e3dfd8] overflow-y-auto"
        >
          <SheetHeader className="px-6 pt-4 pb-2">
            <SheetTitle className="font-heading text-lg font-bold flex items-center gap-2">
              <Edit className="w-5 h-5 text-[#48805b]" />
              Edit Profile
            </SheetTitle>
            <SheetDescription className="text-[#88837b]">
              Update your personal information
            </SheetDescription>
          </SheetHeader>
          <Separator className="bg-[#e3dfd8]" />
          <div className="px-6 pt-4 pb-6">
            {editFormContent}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
