import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Packages that need to be external in standalone mode because they
  // use native binaries or have special bundling requirements.
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "sharp",
    "better-sqlite3",
  ],

  // Allow cross-origin requests from the preview panel
  allowedDevOrigins: [
    '.space-z.ai',
    '.z.ai',
  ],

  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: false,

  // Image optimization configuration
  images: {
    // Disable image optimization in standalone mode to avoid sharp dependency issues
    unoptimized: true,
  },

  // SPA rewrites: all page routes → / so client-side routing works on refresh
  async rewrites() {
    return {
      beforeFiles: [
        // Rewrite all non-API, non-static, non-_next paths to /
        // This ensures refresh on /products, /admin, etc. works without 404
        {
          source: '/((?!api|_next|images|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\..*).*)',
          destination: '/',
        },
      ],
    }
  },
};

export default nextConfig;
