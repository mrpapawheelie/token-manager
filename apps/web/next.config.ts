import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@token-manager/shared"],
  // The studio is opened at 127.0.0.1. Next blocks server-action responses
  // from that host unless it is listed, and the browser then reloads the page.
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
