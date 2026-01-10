import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: process.cwd(),
  },
  // Increase API route timeout for long-running campaign generation
  serverExternalPackages: ['@modelcontextprotocol/sdk'],
};

export default nextConfig;
