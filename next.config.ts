import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Monorepo / multiple lockfiles: keep Turbopack rooted in this app
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
