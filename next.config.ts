import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Lot photographs are uploaded through a server action (5 MB limit + form overhead).
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
