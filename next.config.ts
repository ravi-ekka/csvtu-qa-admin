// next.config.js
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  trailingSlash: false, // ✅
  output: "standalone", // ✅ keeps API support
};

export default nextConfig;
