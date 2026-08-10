'use client'

import { ArrowLeft, FileText } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import SiteFooter from '@/components/SiteFooter'

const BRAND = {
  green: '#48805b',
  dark: '#1f1e1c',
  muted: '#88837b',
  surface: '#e3dfd8',
  bg: '#f4f3f0',
} as const

const POLICY_CONFIG: Record<string, { title: string; sections: { heading?: string; body: string }[] }> = {
  'policy-terms': {
    title: 'Terms & Conditions',
    sections: [
      { heading: '1. Acceptance of Terms', body: 'By accessing and using the NOTJUST Watr website and purchasing our products, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our services.' },
      { heading: '2. Products & Pricing', body: 'All product descriptions and prices are subject to change without prior notice. We make every effort to ensure accuracy, but we reserve the right to correct errors. Prices are inclusive of applicable taxes unless stated otherwise.' },
      { heading: '3. Orders & Payment', body: 'By placing an order, you make an offer to purchase the product. We reserve the right to accept or decline any order. Payment must be made at the time of placing the order through our available payment methods.' },
      { heading: '4. Health Disclaimer', body: 'NOTJUST Watr is a wellness supplement and not a substitute for medical advice or treatment. Individual results may vary. Consult your healthcare provider before using any dietary supplement, especially if you are pregnant, nursing, or on medication.' },
      { heading: '5. Intellectual Property', body: 'All content on this website, including text, graphics, logos, and images, is the property of Zum Heilen Healthcare Pvt. Ltd. and is protected by intellectual property laws.' },
      { heading: '6. Limitation of Liability', body: 'Zum Heilen Healthcare Pvt. Ltd. shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or website.' },
      { heading: '7. Governing Law', body: 'These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Bengaluru, Karnataka.' },
    ],
  },
  'policy-privacy': {
    title: 'Privacy Policy',
    sections: [
      { heading: '1. Information We Collect', body: 'We collect personal information that you provide when placing orders, creating an account, or contacting us. This includes your name, email address, phone number, shipping address, and payment information.' },
      { heading: '2. How We Use Your Information', body: 'We use your information to process orders, provide customer support, send order updates, and improve our services. We may also use your information for marketing communications with your consent.' },
      { heading: '3. Data Protection', body: 'We implement appropriate security measures to protect your personal information from unauthorized access, alteration, or disclosure. Your payment information is processed through secure, PCI-compliant payment gateways.' },
      { heading: '4. Cookies', body: 'We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookie preferences through your browser settings.' },
      { heading: '5. Third-Party Sharing', body: 'We do not sell your personal information. We may share information with trusted service providers who assist in operating our website, processing orders, and delivering products.' },
      { heading: '6. Your Rights', body: 'You have the right to access, correct, or delete your personal information. You may also opt out of marketing communications at any time by contacting us.' },
      { heading: '7. Contact', body: 'For privacy-related inquiries, contact us at info@zh-onehealth.com or call +91 92880 07431.' },
    ],
  },
  'policy-shipping': {
    title: 'Shipping & Delivery Policy',
    sections: [
      { heading: '1. Shipping Coverage', body: 'We currently ship across India. Orders are dispatched from our warehouse in Bengaluru, Karnataka.' },
      { heading: '2. Shipping Timelines', body: 'Orders are processed within 1-2 business days. Delivery typically takes 3-7 business days depending on your location. Remote areas may take up to 10 business days.' },
      { heading: '3. Shipping Charges', body: 'Free shipping is available on orders above a specified value. For orders below this threshold, standard shipping charges apply as shown at checkout.' },
      { heading: '4. Order Tracking', body: 'Once your order is shipped, you will receive a tracking number via email and SMS. You can track your order through the link provided or on our website.' },
      { heading: '5. Delivery Issues', body: 'If you experience delivery issues such as delays or damaged packages, please contact us within 48 hours of receiving your order. We will work with our logistics partner to resolve the issue.' },
      { heading: '6. Undeliverable Orders', body: 'If an order is returned as undeliverable due to incorrect address or refusal, we will contact you. Additional shipping charges may apply for re-delivery.' },
    ],
  },
  'policy-refund': {
    title: 'Refund, Cancellation & Return Policy',
    sections: [
      { heading: '1. Cancellation', body: 'You may cancel your order within 24 hours of placing it, provided it has not been shipped. To cancel, contact us at info@zh-onehealth.com or call +91 92880 07431.' },
      { heading: '2. Returns', body: 'We accept returns within 7 days of delivery if the product is damaged, defective, or incorrect. The product must be in its original packaging in unused condition.' },
      { heading: '3. Refund Process', body: 'Approved refunds will be processed within 7-10 business days. Refunds will be issued to the original payment method. For COD orders, refunds will be processed via bank transfer.' },
      { heading: '4. Non-Refundable Items', body: 'Products that have been opened, used, or are not in original condition are not eligible for returns or refunds. Perishable items and items purchased during sale events may have different return policies.' },
      { heading: '5. How to Initiate', body: 'To initiate a return or refund, contact our customer support team at info@zh-onehealth.com with your order number and reason for return. You may also reach us via WhatsApp at +91 92880 07431.' },
    ],
  },
  'policy-grievance': {
    title: 'Grievance Redressal Policy',
    sections: [
      { heading: '1. Grievance Officer', body: 'Mr. Athishmon, Grievance Officer\nZum Heilen Healthcare Pvt. Ltd.\nBengaluru, Karnataka 560022\nEmail: info@zh-onehealth.com\nPhone: +91 92880 07431' },
      { heading: '2. Filing a Grievance', body: 'You may file a grievance by contacting our Grievance Officer through any of the channels mentioned above. Please provide your order details, nature of the grievance, and preferred resolution.' },
      { heading: '3. Resolution Timeline', body: 'We acknowledge grievances within 48 hours and aim to resolve them within 30 days. Complex cases may take longer, and you will be kept informed of the progress.' },
      { heading: '4. Escalation', body: 'If your grievance is not resolved to your satisfaction, you may escalate it to senior management. You also have the right to approach consumer courts as per applicable laws.' },
      { heading: '5. Online Dispute Resolution', body: 'As per the IT Act, consumers can approach the online grievance redressal portal for e-commerce related disputes.' },
    ],
  },
  'policy-about': {
    title: 'About Us',
    sections: [
      { heading: 'Zum Heilen Healthcare Pvt. Ltd.', body: 'Zum Heilen Healthcare Pvt. Ltd. is a Bengaluru-based health and wellness company dedicated to creating innovative, science-backed wellness products that make a real difference in people\'s lives.' },
      { heading: 'Our Mission', body: 'To empower individuals to take control of their health through accessible, effective, and natural wellness solutions. We believe that good health should not be a compromise.' },
      { heading: 'NOTJUST Watr', body: 'NOTJUST Watr is our flagship product — a 50 ml pre-meal wellness shot designed to help lower the glycemic impact of your meal. Made with carefully selected natural ingredients, it\'s wellness in every sip.' },
      { heading: 'Our Commitment', body: 'We are committed to quality, transparency, and your wellbeing. Every product undergoes rigorous testing and is FSSAI certified. We use only natural ingredients with no added sugar or artificial preservatives.' },
      { heading: 'Contact Us', body: 'Zum Heilen Healthcare Pvt. Ltd.\nBengaluru, Karnataka 560022\nEmail: info@zh-onehealth.com\nPhone: +91 92880 07431\nWhatsApp: +91 92880 07431' },
    ],
  },
  'policy-contact': {
    title: 'Contact Us',
    sections: [
      { heading: 'Get in Touch', body: 'We\'d love to hear from you! Whether you have a question about our products, need help with an order, or just want to say hello, our team is here to help.' },
      { heading: 'Customer Support', body: 'Email: info@zh-onehealth.com\nPhone: +91 92880 07431\nWhatsApp: +91 92880 07431\nAvailable: Monday to Saturday, 9:00 AM to 6:00 PM IST' },
      { heading: 'Office Address', body: 'Zum Heilen Healthcare Pvt. Ltd.\nBengaluru, Karnataka 560022\nIndia' },
      { heading: 'WhatsApp', body: 'For the quickest response, reach out to us on WhatsApp. Click the chat button on our website or message us directly at +91 92880 07431.' },
      { heading: 'Grievance Officer', body: 'For grievance-related matters:\nMr. Athishmon\nEmail: info@zh-onehealth.com\nPhone: +91 92880 07431' },
    ],
  },
}

export default function PolicyPage() {
  const { currentView, navigateTo } = useAppStore()
  const config = POLICY_CONFIG[currentView]

  if (!config) return null

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: BRAND.bg }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1">
        {/* Back button */}
        <button
          onClick={() => navigateTo('landing')}
          className="inline-flex items-center gap-2 text-sm font-medium mb-6 hover:opacity-70 transition-opacity min-h-[44px]"
          style={{ color: BRAND.green }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${BRAND.green}12` }}>
            <FileText className="w-5 h-5" style={{ color: BRAND.green }} />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold" style={{ color: BRAND.dark }}>
            {config.title}
          </h1>
        </div>

        {/* Last updated */}
        <p className="text-xs mb-8" style={{ color: BRAND.muted }}>
          Last Updated: June 2026
        </p>

        {/* Content */}
        <div className="space-y-6">
          {config.sections.map((section, i) => (
            <div key={i} className="p-5 sm:p-6 rounded-xl bg-white border" style={{ borderColor: BRAND.surface }}>
              {section.heading && (
                <h2 className="font-heading text-base sm:text-lg font-semibold mb-3" style={{ color: BRAND.dark }}>
                  {section.heading}
                </h2>
              )}
              <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: BRAND.muted }}>
                {section.body}
              </div>
            </div>
          ))}
        </div>

        {/* Need Help CTA */}
        <div className="mt-10 p-6 rounded-xl text-center" style={{ backgroundColor: `${BRAND.green}08`, borderColor: `${BRAND.green}20`, border: `1px solid ${BRAND.green}20` }}>
          <p className="font-heading font-semibold text-base mb-2" style={{ color: BRAND.dark }}>Need Help?</p>
          <p className="text-sm mb-4" style={{ color: BRAND.muted }}>Contact our support team for any questions or concerns.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => window.open('https://wa.me/919288007431?text=Hi%2C%20I%20have%20a%20question', '_blank')}
              className="min-h-[44px] font-heading font-semibold"
              style={{ backgroundColor: BRAND.green, color: '#fff' }}
            >
              Chat on WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('mailto:info@zh-onehealth.com', '_blank')}
              className="min-h-[44px] font-heading font-semibold"
              style={{ borderColor: BRAND.green, color: BRAND.green }}
            >
              Email Us
            </Button>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
