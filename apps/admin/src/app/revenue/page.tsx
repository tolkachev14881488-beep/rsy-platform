"use client";

import { useState } from "react";

export default function RevenuePage() {
  const [csv, setCsv] = useState(
    "date,url,impressions,clicks,revenue\n2026-06-01,/article/kak-ubrat-pyatna-s-divana,1200,15,45.50"
  );
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function importRevenue() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/revenue/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json();
      setResult(
        res.ok
          ? `Импортировано строк: ${data.imported}. Доход: ${data.summary.totalRevenue.toFixed(2)} ₽, RPM: ${data.summary.avgRpm.toFixed(2)}`
          : data.error
      );
    } catch (e) {
      setResult(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Доходность РСЯ</h1>

      <div className="alert alert-info">
        Экспортируйте отчёт из кабинета partner.yandex.ru (CSV) и вставьте ниже.
        Платформа свяжет URL со статьями и покажет RPM по страницам.
      </div>

      <div className="card">
        <h2>Импорт CSV из РСЯ</h2>
        <textarea value={csv} onChange={(e) => setCsv(e.target.value)} />
        <button className="btn" onClick={importRevenue} disabled={loading}>
          Импортировать
        </button>
        {result && (
          <div className={`alert ${result.includes("ошиб") ? "alert-error" : "alert-success"}`} style={{ marginTop: "1rem" }}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
