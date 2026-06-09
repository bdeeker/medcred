import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://13.222.12.123:8080/api/:path*",
      },
    ];
  },
};

export default nextConfig;
