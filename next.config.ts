import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Prisma needs to be bundled as an external package for standalone mode.
  // For MySQL/MariaDB, mysql2 is automatically handled by Prisma.
  // For SQLite (local dev), better-sqlite3 would need to be added here:
  //   serverExternalPackages: ["@prisma/client", "better-sqlite3"]
  serverExternalPackages: ["@prisma/client"],
  typescript: {
    // Keep ignoreBuildErrors true during active development.
    // For a strict production build, set this to false.
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
