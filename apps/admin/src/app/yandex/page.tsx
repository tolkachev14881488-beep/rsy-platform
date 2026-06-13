"use client";

import { useState } from "react";
import { siteConfig } from "@rsy/config";

export default function YandexPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);

  async function submitSitemap() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/yandex/sitemap", { method: "POST" });
      const data = await res.json();
      setMessage(res.ok ? data.message : data.error);
    } catch (e) {
      setMessage(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/yandex/stats");
      const data = await res.json();
      if (res.ok) {
        setStats(data);
        setMessage("Данные получены");
      } else {
        setMessage(data.error);
      }
    } catch (e) {
      setMessage(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Яндекс: Метрика и Вебмастер</h1>

      <div className="card">
        <h2>Текущие настройки</h2>
        <table>
          <tbody>
            <tr><td>Metrika ID</td><td>{siteConfig.yandex.metrikaId || "не задан"}</td></tr>
            <tr><td>Webmaster token</td><td>{siteConfig.yandex.webmasterToken ? "••••" : "не задан"}</td></tr>
            <tr><td>Host ID</td><td>{siteConfig.yandex.webmasterHostId || "не задан"}</td></tr>
            <tr><td>Sitemap</td><td>{siteConfig.url}/sitemap.xml</td></tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Действия</h2>
        <button className="btn" onClick={submitSitemap} disabled={loading}>
          Отправить sitemap в Вебмастер
        </button>
        <button className="btn btn-secondary" onClick={fetchStats} disabled={loading} style={{ marginLeft: "0.5rem" }}>
          Получить статистику Метрики
        </button>
        {message && (
          <div className={`alert ${message.includes("ошиб") || message.includes("не задан") ? "alert-error" : "alert-success"}`} style={{ marginTop: "1rem" }}>
            {message}
          </div>
        )}
        {stats && (
          <pre style={{ marginTop: "1rem", fontSize: "0.8rem", overflow: "auto" }}>
            {JSON.stringify(stats, null, 2)}
          </pre>
        )}
      </div>

      <div className="card">
        <h2>Верификация сайта</h2>
        <p style={{ fontSize: "0.875rem" }}>
          Добавьте meta-тег из Вебмастера в layout или используйте DNS.
          API endpoint: <code>GET /api/yandex/verification</code>
        </p>
      </div>
    </div>
  );
}
