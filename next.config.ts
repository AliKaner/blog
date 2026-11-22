import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev badge top-right (the cursor picker steps aside for it in development).
  devIndicators: { position: "top-right" },

  async redirects() {
    return [
      // The pet corner became "Keepsakes"; keep old links working.
      { source: "/pets", destination: "/keepsakes", permanent: true },
      { source: "/pets/:path*", destination: "/keepsakes/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
