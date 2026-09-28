import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  // Lean, self-contained server output for the Docker image (see Dockerfile).
  output: "standalone",
  experimental: {
    // Server Actions default to a 1MB body limit — uploadMiniAppFilesAction
    // enforces its own 30MB total (10MB/file) ceiling, so the request body
    // itself needs enough room for that plus multipart overhead.
    serverActions: {
      bodySizeLimit: "35mb",
    },
  },
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Avoid registering/caching in local dev, where hot-reload and a stale
  // service worker fight each other constantly.
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
