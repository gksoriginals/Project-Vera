import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    devtoolSegmentExplorer: false
  }
};

export default nextConfig;
