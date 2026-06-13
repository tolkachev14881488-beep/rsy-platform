import { siteConfig } from "@rsy/config";
import { buildRobotsTxt } from "@rsy/seo";

export function GET() {
  return new Response(buildRobotsTxt(siteConfig.url), {
    headers: { "Content-Type": "text/plain" },
  });
}
