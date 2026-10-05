import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  serverExternalPackages: ["pg", "pg-pool", "@prisma/client", "@prisma/adapter-pg"],
};

export default nextConfig;
