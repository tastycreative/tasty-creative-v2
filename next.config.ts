/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import CopyPlugin from "copy-webpack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nextConfig = {
  allowedDevOrigins: [
    "*.pike.replit.dev",
    "79090bbb-5655-4e25-bdb0-2f1c07ec943f-00-2xajzclpwd3ig.pike.replit.dev",
    "https://79090bbb-5655-4e25-bdb0-2f1c07ec943f-00-2xajzclpwd3ig.pike.replit.dev",
    "https://058bf6d3-6042-48a3-97e4-0a6aceb2bfa4-00-3ljqmwct17w2s.pike.replit.dev",
  ],
  experimental: {},
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn2.onlyfans.com",
        pathname: "/**",
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      {
        source: "/api/notifications",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, x-api-key",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack(config: any, { isServer }: { isServer: boolean }) {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        os: false,
        url: false,
      };

      const workerPath = path.resolve(
        __dirname,
        "node_modules/gif.js/dist/gif.worker.js"
      );

      config.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              from: workerPath,
              to: path.resolve(__dirname, "public/gif.worker.js"),
            },
          ],
        })
      );
    }

    return config;
  },
};

export default nextConfig;
