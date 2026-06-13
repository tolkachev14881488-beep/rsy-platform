import type { NextConfig } from "next";
import path from "path";
import { config } from "dotenv";

config({ path: path.resolve(__dirname, "../../.env") });

const nextConfig: NextConfig = {
  transpilePackages: ["@rsy/db", "@rsy/rsy", "@rsy/seo", "@rsy/config", "@rsy/yandex", "@rsy/queue", "@rsy/automation", "@rsy/trends"],
};

export default nextConfig;
