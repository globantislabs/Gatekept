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
};

export default nextConfig;
