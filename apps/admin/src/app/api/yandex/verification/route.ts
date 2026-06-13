import { NextResponse } from "next/server";
import { siteConfig } from "@rsy/config";
import { YandexWebmasterClient } from "@rsy/yandex";

export async function GET() {
  try {
    const token = siteConfig.yandex.webmasterToken;
    const hostId = siteConfig.yandex.webmasterHostId;

    if (!token || !hostId) {
      return NextResponse.json({
        metaTag: null,
        message: "Задайте YANDEX_WEBMASTER_TOKEN и YANDEX_WEBMASTER_HOST_ID",
      });
    }

    const client = new YandexWebmasterClient(token);
    const { user_id } = await client.getUserId();
    const verificationCode = await client.getVerificationCode(user_id, hostId);

    return NextResponse.json({
      metaTag: `<meta name="yandex-verification" content="${verificationCode}" />`,
      verificationCode,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
