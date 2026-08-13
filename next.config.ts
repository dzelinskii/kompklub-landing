import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Автономная сборка для деплоя: .next/standalone содержит server.js и
  // минимальные node_modules — на сервере нужен только Node, без npm install.
  output: "standalone",
};

export default nextConfig;
