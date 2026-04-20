import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  experimental: {
    proxyTimeout: 300_000,
  },
};

export default nextConfig;
