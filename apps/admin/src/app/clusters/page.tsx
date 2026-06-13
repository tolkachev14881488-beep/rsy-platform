"use client";

import { useState } from "react";

export default function ClustersPage() {
  const [csv, setCsv] = useState(
    "keyword,category,volume\nкак почистить микроволновку,Кухня,5400\nкак убрать накипь в чайнике,Кухня,8900"
  );
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function importCsv() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/clusters/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json();
      setResult(res.ok ? `Создано кластеров: ${data.clusters}, статей: ${data.articles}` : data.error);
    } catch (e) {
      setResult(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function generateAll() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/content/generate", { method: "POST" });
      const data = await res.json();
      setResult(res.ok ? `Сгенерировано статей: ${data.generated}` : data.error);
    } catch (e) {
      setResult(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Кластеры ключей</h1>

      <div className="card">
        <h2>Импорт CSV</h2>
        <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1rem" }}>
          Формат: keyword, category, volume (по одной строке на кластер)
        </p>
        <textarea value={csv} onChange={(e) => setCsv(e.target.value)} />
        <button className="btn" onClick={importCsv} disabled={loading}>
          Импортировать
        </button>
        <button className="btn btn-secondary" onClick={generateAll} disabled={loading} style={{ marginLeft: "0.5rem" }}>
          Сгенерировать статьи для всех кластеров без статей
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
