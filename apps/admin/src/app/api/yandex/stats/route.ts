import { NextResponse } from "next/server";
import { siteConfig } from "@rsy/config";
import { YandexMetrikaClient, YandexWebmasterClient } from "@rsy/yandex";

export async function GET() {
  try {
    const metrikaId = siteConfig.yandex.metrikaId;
    const token = siteConfig.yandex.webmasterToken;

    const result: Record<string, unknown> = {};

    if (metrikaId && token) {
      const metrika = new YandexMetrikaClient(token);
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const dateTo = today.toISOString().slice(0, 10);
      const dateFrom = weekAgo.toISOString().slice(0, 10);

      result.metrika = await metrika.getStats(metrikaId, dateFrom, dateTo);
      result.topPages = await metrika.getTopPages(metrikaId, dateFrom, dateTo);
    } else {
      result.metrika = { error: "YANDEX_METRIKA_ID или token не заданы" };
    }

    const hostId = siteConfig.yandex.webmasterHostId;
    if (token && hostId) {
      const webmaster = new YandexWebmasterClient(token);
      const { user_id } = await webmaster.getUserId();
      result.webmaster = await webmaster.getIndexingStats(user_id, hostId);
    } else {
      result.webmaster = { error: "Webmaster host/token не заданы" };
    }

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Stats fetch failed" },
      { status: 500 }
    );
  }
}
