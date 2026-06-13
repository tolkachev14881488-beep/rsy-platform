const WEBMASTER_API = "https://api.webmaster.yandex.net/v4";
const METRIKA_API = "https://api-metrika.yandex.net";

export interface WebmasterHost {
  host_id: string;
  unicode_host_url: string;
  verified: boolean;
}

export interface MetrikaStats {
  visits: number;
  pageviews: number;
  users: number;
  bounceRate: number;
  avgVisitDurationSeconds: number;
}

export class YandexWebmasterClient {
  constructor(private token: string) {}

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${WEBMASTER_API}${path}`, {
      ...options,
      headers: {
        Authorization: `OAuth ${this.token}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Webmaster API ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  async getHosts(userId: number): Promise<{ hosts: WebmasterHost[] }> {
    return this.fetch(`/user/${userId}/hosts`);
  }

  async getUserId(): Promise<{ user_id: number }> {
    return this.fetch("/user");
  }

  async submitSitemap(userId: number, hostId: string, sitemapUrl: string): Promise<void> {
    await this.fetch(`/user/${userId}/hosts/${hostId}/user-added-sitemaps`, {
      method: "POST",
      body: JSON.stringify({ url: sitemapUrl }),
    });
  }

  async getIndexingStats(
    userId: number,
    hostId: string
  ): Promise<{ searchable_pages: number; excluded_pages: number }> {
    const data = await this.fetch<{ searchable_pages_count: number; excluded_pages_count: number }>(
      `/user/${userId}/hosts/${hostId}/summary`
    );
    return {
      searchable_pages: data.searchable_pages_count ?? 0,
      excluded_pages: data.excluded_pages_count ?? 0,
    };
  }

  async getVerificationCode(userId: number, hostId: string): Promise<string> {
    const data = await this.fetch<{ verification_uin: string }>(
      `/user/${userId}/hosts/${hostId}/verification?verification_type=META_TAG`
    );
    return data.verification_uin;
  }
}

export class YandexMetrikaClient {
  constructor(private token: string) {}

  private async fetch<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${METRIKA_API}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const res = await fetch(url.toString(), {
      headers: { Authorization: `OAuth ${this.token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Metrika API ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  async getStats(counterId: string, dateFrom: string, dateTo: string): Promise<MetrikaStats> {
    const data = await this.fetch<{
      totals: number[];
      query: { metrics: string[] };
    }>(`/stat/v1/data`, {
      ids: counterId,
      date1: dateFrom,
      date2: dateTo,
      metrics: "ym:s:visits,ym:s:pageviews,ym:s:users,ym:s:bounceRate,ym:s:avgVisitDurationSeconds",
    });

    const [visits, pageviews, users, bounceRate, avgVisitDurationSeconds] = data.totals;
    return {
      visits: visits ?? 0,
      pageviews: pageviews ?? 0,
      users: users ?? 0,
      bounceRate: bounceRate ?? 0,
      avgVisitDurationSeconds: avgVisitDurationSeconds ?? 0,
    };
  }

  async getTopPages(
    counterId: string,
    dateFrom: string,
    dateTo: string,
    limit = 20
  ): Promise<Array<{ url: string; visits: number }>> {
    const data = await this.fetch<{
      data: Array<{ dimensions: Array<{ name: string }>; metrics: number[] }>;
    }>(`/stat/v1/data`, {
      ids: counterId,
      date1: dateFrom,
      date2: dateTo,
      metrics: "ym:pv:pageviews",
      dimensions: "ym:pv:URLPath",
      sort: "-ym:pv:pageviews",
      limit: String(limit),
    });

    return (data.data ?? []).map((row) => ({
      url: row.dimensions[0]?.name ?? "",
      visits: row.metrics[0] ?? 0,
    }));
  }
}

export function buildMetrikaScript(counterId: string): string {
  return `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();
for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
ym(${counterId},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});`;
}

export function buildMetrikaNoscript(counterId: string): string {
  return `<img src="https://mc.yandex.ru/watch/${counterId}" style="position:absolute;left:-9999px;" alt="" />`;
}
