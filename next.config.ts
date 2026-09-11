import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Emits .next/standalone: a self-contained server with only the traced
   *  dependencies, so the runtime image doesn't need node_modules. */
  output: "standalone",
};

export default nextConfig;