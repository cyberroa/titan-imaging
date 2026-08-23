import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve large enough variants for full-bleed heroes on retina displays
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    qualities: [75, 90, 95, 100],
  },
};

export default nextConfig;
