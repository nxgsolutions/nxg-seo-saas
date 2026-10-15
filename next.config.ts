import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // In development, keep browser requests and auth cookies on the page origin.
  // The upstream still follows the existing API URL configuration.
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];
    const upstream = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
    return [{ source: "/api/:path*", destination: `${upstream}/api/:path*` }];
  },
  // Emit a minimal standalone server bundle for slim production Docker images.
  output: "standalone",
};

export default nextConfig;
