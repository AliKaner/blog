import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the dev badge clear of the left nav rail and the corner decor.
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
