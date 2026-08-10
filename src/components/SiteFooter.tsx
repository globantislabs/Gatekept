'use client'

import Image from 'next/image'
import {
  MessageCircle, Mail, Smartphone, MapPin,
  Instagram, Twitter, Linkedin, Youtube
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { Separator } from '@/components/ui/separator'

export default function SiteFooter() {
  const { navigateTo } = useAppStore()

  return (
    <footer className="mt-auto bg-[#1f1e1c] border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-6">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3">
              <Image src="/images/notjust-logo-clean.png" alt="NotJust" width={140} height={48} className="h-10 w-auto object-contain" />
            </div>
            <p className="text-white/40 text-sm leading-relaxed">
              NOTJUST WATER™ is a 50 ml pre-meal wellness shot designed to help lower the glycemic impact of your meal.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-white text-sm mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-white/40">
              <li><button onClick={() => navigateTo('landing')} className="hover:text-white transition-colors duration-300 min-h-[36px] flex items-center">Home</button></li>
              <li><button onClick={() => navigateTo('products')} className="hover:text-white transition-colors duration-300 min-h-[36px] flex items-center">Products</button></li>
              <li><button onClick={() => navigateTo('our-journey')} className="hover:text-white transition-colors duration-300 min-h-[36px] flex items-center">Our Journey</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-white text-sm mb-3">Contact</h4>
            <ul className="space-y-2 text-sm text-white/40">
              <li>
                <button className="flex items-center gap-2 hover:text-[#25D366] transition-colors min-h-[36px]" onClick={() => window.open('https://wa.me/919288007431?text=Hi%2C%20I%20have%20a%20question%20about%20NOTJUST%20Watr', '_blank')}>
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </button>
              </li>
              <li>
                <button className="flex items-center gap-2 hover:text-[#2e91b2] transition-colors min-h-[36px]" onClick={() => window.open('mailto:info@zh-onehealth.com?subject=Query%20about%20NOTJUST%20Watr', '_blank')}>
                  <Mail className="w-3.5 h-3.5" /> info@zh-onehealth.com
                </button>
              </li>
              <li>
                <button className="flex items-center gap-2 hover:text-[#48805b] transition-colors min-h-[36px]" onClick={() => window.open('tel:+919288007431', '_blank')}>
                  <Smartphone className="w-3.5 h-3.5" /> +91 92880 07431
                </button>
              </li>
              <li className="flex items-start gap-2 min-h-[36px]"><MapPin className="w-3.5 h-3.5 mt-0.5" /> <span>Zum Heilen Healthcare Pvt. Ltd.,<br />Bengaluru, Karnataka 560022</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-white text-sm mb-3">Follow Us</h4>
            <div className="flex gap-2">
              {[
                { Icon: Instagram, label: 'Instagram' },
                { Icon: Twitter, label: 'Twitter' },
                { Icon: Linkedin, label: 'LinkedIn' },
                { Icon: Youtube, label: 'YouTube' },
              ].map(({ Icon, label }, i) => (
                <button key={i} className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center text-white/40 hover:bg-[#48805b] hover:text-white transition-all duration-300" aria-label={`Follow us on ${label}`}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </div>
        <Separator className="my-6 bg-white/[0.06]" />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/30">
          <p>&copy; 2026 Zum Heilen Healthcare Private Limited. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <button onClick={() => navigateTo('policy-terms')} className="hover:text-white/60 transition-colors duration-300">Terms & Conditions</button>
            <button onClick={() => navigateTo('policy-privacy')} className="hover:text-white/60 transition-colors duration-300">Privacy Policy</button>
            <button onClick={() => navigateTo('policy-shipping')} className="hover:text-white/60 transition-colors duration-300">Shipping Policy</button>
            <button onClick={() => navigateTo('policy-refund')} className="hover:text-white/60 transition-colors duration-300">Refund Policy</button>
            <button onClick={() => navigateTo('policy-grievance')} className="hover:text-white/60 transition-colors duration-300">Grievance Policy</button>
            <button onClick={() => navigateTo('policy-about')} className="hover:text-white/60 transition-colors duration-300">About Us</button>
            <button onClick={() => navigateTo('policy-contact')} className="hover:text-white/60 transition-colors duration-300">Contact Us</button>
          </div>
        </div>
      </div>
    </footer>
  )
}
