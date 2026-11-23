import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
  // The default merger glues small route stylesheets together until each
  // chunk reaches ~30 KB, which put the check, report and homepage CSS on
  // every route. Keeping webpack's own per-route chunks measured smaller on
  // every route and needed fewer requests (docs/HANDOFF.md, 23 Nov 2026).
  experimental: { cssChunking: false },
};

export default nextConfig;
