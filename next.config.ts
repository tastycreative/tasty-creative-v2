import type { NextConfig } from "next";
import path from "path";
import CopyPlugin from "copy-webpack-plugin";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // AWS Amplify SSR Fix: Embed environment variables during build
  // This is required because Amplify doesn't pass env vars to Lambda runtime properly
  env: {
    // These will be embedded in the build and available at runtime
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || '',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || '',
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID || '',
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET || '',
    DATABASE_URL: process.env.DATABASE_URL || '',
    ABLY_API_KEY: process.env.ABLY_API_KEY || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
    REDIS_URL: process.env.REDIS_URL || '',
    S3_REGION: process.env.S3_REGION || '',
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID || '',
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || '',
    S3_BUCKET: process.env.S3_BUCKET || '',
  },

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
    localPatterns: [
      { pathname: "/api/image-proxy", search: "**" },
      { pathname: "/**" },
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
