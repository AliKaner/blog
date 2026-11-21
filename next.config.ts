import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the dev badge clear of the left nav rail and the corner decor.
  devIndicators: { position: "top-right" },
};

export default nextConfig;
