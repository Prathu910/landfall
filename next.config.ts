import { resolve } from "node:path";
import type { NextConfig } from "next";

/** Our cut-down copy of Next's client polyfills (see the file). */
const POLYFILL_MODULE = resolve(
  process.cwd(),
  "src/components/polyfills/polyfill-module.ts",
);

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
  webpack(config, { isServer, webpack }) {
    if (!isServer) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /[\\/]build[\\/]polyfills[\\/]polyfill-module(\.js)?$/,
          POLYFILL_MODULE,
        ),
      );
    }
    return config;
  },
};

export default nextConfig;
