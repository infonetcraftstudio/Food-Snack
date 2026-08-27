import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async rewrites() {
    return [{ source: '/Admin', destination: '/admin' }, { source: '/Admin/:path*', destination: '/admin/:path*' }];
  },
};

export default nextConfig;
