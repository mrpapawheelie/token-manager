import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@token-manager/shared"],
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
