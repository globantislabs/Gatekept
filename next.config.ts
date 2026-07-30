import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Packages that need to be external in standalone mode because they
  // use native binaries or have special bundling requirements.
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "sharp",          // Native image processing — must be external for standalone
    "better-sqlite3", // SQLite native driver (local dev only)
  ],
  typescript: {
    // Keep ignoreBuildErrors true during active development.
    // For a strict production build, set this to false.
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
