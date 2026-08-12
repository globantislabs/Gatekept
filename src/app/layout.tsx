import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter, Instrument_Serif, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-admin",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NotJust - Pre-Meal Wellness Shot | Gatekept Commerce & Learning Platform",
  description: "NOTJUST WATER(TM) 50 ml pre-meal wellness shot designed to help lower the glycemic impact of your meal.",
  keywords: ["NotJust", "wellness shot", "glycemic control", "pre-meal", "health", "sugar spike control"],
  icons: {
    icon: "/images/notjust-logo.png",
  },
};

// Proper mobile viewport — eliminates the legacy 300ms tap delay and
// prevents the "tap once does nothing, tap again works" symptom.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PhonePe checkout is handled server-side via API routes */}
      </head>
      <body className={`${plusJakarta.variable} ${inter.variable} ${instrumentSerif.variable} ${spaceGrotesk.variable} antialiased bg-background text-foreground font-[family-name:var(--font-body)]`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
