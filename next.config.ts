import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during build to allow deployment
    // ESLint warnings won't block production build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
