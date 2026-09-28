import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  // Lean, self-contained server output for the Docker image (see Dockerfile).
  output: "standalone",
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Avoid registering/caching in local dev, where hot-reload and a stale
  // service worker fight each other constantly.
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
