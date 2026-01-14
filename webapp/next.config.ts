import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
  turbopack: {
    rules: {
      "*.wasm": {
        loaders: ["wasm-loader"],
        as: "*.wasm",
      },
    },
  },
};

export default nextConfig;
