import type { NextConfig } from "next";
import path from "path";
import CopyPlugin from "copy-webpack-plugin";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "drive.google.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "cdn2.onlyfans.com", pathname: "/**" },
      { protocol: "https", hostname: "allthiscash.com", pathname: "/**" },
      { protocol: "https", hostname: "www.allthiscash.com", pathname: "/**" },
      { protocol: "https", hostname: "betterfans.app", pathname: "/**" },
      { protocol: "https", hostname: "www.betterfans.app", pathname: "/**" },
      { protocol: "https", hostname: "tastycreative-site.s3.us-east-1.amazonaws.com", pathname: "/**" },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "unsafe-none" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        ],
      },
    ];
  },

  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        os: false,
        url: false,
      };

      // Copy gif.worker.js using CopyPlugin
      const workerPath = path.join(
        process.cwd(),
        "node_modules/gif.js/dist/gif.worker.js"
      );

      config.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              from: workerPath,
              to: path.join(process.cwd(), "public/gif.worker.js"),
            },
          ],
        })
      );
    }

    return config;
  },
};

export default nextConfig;
