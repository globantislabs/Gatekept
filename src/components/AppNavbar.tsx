'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import {
  Home, Store, Globe, ShoppingCart, Menu, BarChart3
} from 'lucide-react'
import { useAppStore, type AppView } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import {
  Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

const BRAND = {
  green: '#48805b',
  lime: '#afb75d',
  dark: '#1f1e1c',
  muted: '#88837b',
  surface: '#e3dfd8',
  bg: '#f4f3f0',
}

const navLinks: { label: string; view: AppView; icon: React.ElementType }[] = [
  { label: 'Home', view: 'landing', icon: Home },
  { label: 'Product', view: 'products', icon: Store },
  { label: 'Our Journey', view: 'our-journey', icon: Globe },
]

export default function AppNavbar() {
  const { navigateTo, user, cart, currentView } = useAppStore()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <button
            onClick={() => navigateTo('landing')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <Image
              src="/images/notjust-logo-clean.png"
              alt="NotJust Watr"
              width={120}
              height={40}
              className="h-9 w-auto object-contain transition-all duration-300 group-hover:scale-105"
              loading="eager"
              priority
            />
          </button>

          {/* Center Nav Links — Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <button
                key={link.label}
                onClick={() => navigateTo(link.view)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 min-h-[44px] ${
                  currentView === link.view
                    ? 'text-[#48805b] bg-[#48805b]/10'
                    : 'text-[#88837b] hover:text-[#48805b] hover:bg-[#48805b]/5'
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </button>
            ))}
          </div>

          {/* Right side — Cart + User */}
          <div className="flex items-center gap-2">
            {/* Admin Dashboard — only for admin */}
            {user?.is_admin && (
              <Button
                onClick={() => navigateTo('admin-dashboard')}
                className="rounded-full font-heading font-semibold text-xs min-h-[44px] bg-[#1f1e1c] hover:bg-[#2a2926] text-white"
              >
                <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                Dashboard
              </Button>
            )}

            {/* Cart Button */}
            <button
              onClick={() => navigateTo('cart')}
              className="relative flex items-center justify-center w-11 h-11 rounded-xl text-[#88837b] hover:text-[#48805b] hover:bg-[#48805b]/5 transition-all duration-300 min-h-[44px]"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#48805b] text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-[#48805b]/30">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            {/* User / Login */}
            {user ? (
              <button
                onClick={() => navigateTo('profile')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 min-h-[44px] text-[#1f1e1c] hover:bg-[#48805b]/5"
              >
                <div className="w-8 h-8 rounded-full bg-[#48805b] flex items-center justify-center text-white text-xs font-bold">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <span className="hidden sm:inline">{user.name}</span>
              </button>
            ) : (
              <Button
                onClick={() => navigateTo('auth-login')}
                className="rounded-full font-heading font-semibold text-sm min-h-[44px] bg-[#48805b] hover:bg-[#3a6a4a] text-white"
              >
                Login
              </Button>
            )}

            {/* Mobile Hamburger */}
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <button
                  className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg text-[#1f1e1c]"
                  aria-label="Open navigation menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[#1f1e1c] border-l border-white/[0.06]">
                <SheetHeader>
                  <SheetTitle className="text-white font-heading flex items-center gap-2">
                    <Image src="/images/notjust-logo-clean.png" alt="NotJust" width={100} height={32} className="h-8 w-auto object-contain" />
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 mt-6 px-2">
                  {navLinks.map(link => (
                    <button
                      key={link.label}
                      onClick={() => { navigateTo(link.view); setMobileNavOpen(false) }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium min-h-[44px] ${
                        currentView === link.view
                          ? 'text-white bg-white/[0.08]'
                          : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      <link.icon className="w-5 h-5" />
                      {link.label}
                    </button>
                  ))}

                  <Separator className="my-3 bg-white/[0.06]" />

                  <button
                    onClick={() => { navigateTo('cart'); setMobileNavOpen(false) }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.06] transition-all duration-300 text-sm font-medium min-h-[44px]"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Cart {cartCount > 0 && `(${cartCount})`}
                  </button>

                  {user ? (
                    <button
                      onClick={() => { navigateTo('profile'); setMobileNavOpen(false) }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.06] transition-all duration-300 text-sm font-medium min-h-[44px]"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#48805b] flex items-center justify-center text-white text-xs font-bold">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                      {user.name}
                    </button>
                  ) : (
                    <button
                      onClick={() => { navigateTo('auth-login'); setMobileNavOpen(false) }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#48805b] text-white hover:bg-[#3a6a4a] transition-all duration-300 text-sm font-medium min-h-[44px]"
                    >
                      Login
                    </button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
