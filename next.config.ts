import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Prisma and SQLite need to be bundled as external packages for standalone mode.
  // This ensures the native SQLite bindings are available at runtime in production.
  serverExternalPackages: ["@prisma/client", "better-sqlite3"],
  typescript: {
    // Keep ignoreBuildErrors true during active development.
    // For a strict production build, set this to false.
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
