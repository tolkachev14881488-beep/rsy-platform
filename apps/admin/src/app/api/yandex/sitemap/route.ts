import { NextResponse } from "next/server";
import { siteConfig } from "@rsy/config";
import { YandexWebmasterClient } from "@rsy/yandex";
import { requireProject } from "@/lib/project";

export async function POST() {
  try {
    const token = siteConfig.yandex.webmasterToken;
    const hostId = siteConfig.yandex.webmasterHostId;

    if (!token || !hostId) {
      return NextResponse.json(
        { error: "YANDEX_WEBMASTER_TOKEN и YANDEX_WEBMASTER_HOST_ID не заданы в .env" },
        { status: 400 }
      );
    }

    const project = await requireProject();
    const client = new YandexWebmasterClient(token);
    const { user_id } = await client.getUserId();
    const sitemapUrl = `${project.siteUrl}/sitemap.xml`;

    await client.submitSitemap(user_id, hostId, sitemapUrl);

    return NextResponse.json({
      message: `Sitemap отправлен: ${sitemapUrl}`,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sitemap submit failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const token = siteConfig.yandex.webmasterToken;
    const hostId = siteConfig.yandex.webmasterHostId;

    if (!token || !hostId) {
      return NextResponse.json(
        { error: "Webmaster credentials not configured" },
        { status: 400 }
      );
    }

    const client = new YandexWebmasterClient(token);
    const { user_id } = await client.getUserId();
    const indexing = await client.getIndexingStats(user_id, hostId);
    const verificationCode = await client.getVerificationCode(user_id, hostId);

    return NextResponse.json({ indexing, verificationCode });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Verification fetch failed" },
      { status: 500 }
    );
  }
}
