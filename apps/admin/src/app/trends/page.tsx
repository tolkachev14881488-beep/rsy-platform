"use client";

import { useEffect, useState } from "react";

interface Trend {
  id: string;
  keyword: string;
  category: string | null;
  score: number;
  direction: string;
  capturedAt: string;
}

export default function TrendsPage() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [rising, setRising] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/automation");
    const data = await res.json();
    if (res.ok) {
      setTrends(data.topTrends ?? []);
      setRising(data.rising ?? 0);
      setNewCount(data.newTrends ?? 0);
    }
    setLoading(false);
  }

  async function runNow() {
    setRunning(true);
    setMessage(null);
    const res = await fetch("/api/automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force: true }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(
        `Сканировано: ${data.trendsScanned}, новых: ${data.newTrends}, растущих: ${data.risingTrends}, статей: ${data.articlesPublished}`
      );
      load();
    } else {
      setMessage(data.error);
    }
    setRunning(false);
  }

  useEffect(() => {
    load();
  }, []);

  const directionLabel: Record<string, string> = {
    NEW: "Новый",
    RISING: "Растёт",
    STABLE: "Стабильный",
    FALLING: "Падает",
  };

  return (
    <div>
      <h1 className="page-title">Тренды (Яндекс Suggest)</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Растущие (48ч)</div>
          <div className="value">{rising}</div>
        </div>
        <div className="stat-card">
          <div className="label">Новые (48ч)</div>
          <div className="value">{newCount}</div>
        </div>
        <div className="stat-card">
          <div className="label">В топе</div>
          <div className="value">{trends.length}</div>
        </div>
      </div>

      <div className="card">
        <button className="btn" onClick={runNow} disabled={running}>
          {running ? "Сканирование..." : "Сканировать тренды и опубликовать статьи"}
        </button>
        {message && (
          <div className="alert alert-success" style={{ marginTop: "1rem" }}>
            {message}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Топ запросов</h2>
        {loading ? (
          <p>Загрузка...</p>
        ) : trends.length === 0 ? (
          <p>Нет данных. Нажмите «Сканировать» для первого сбора трендов.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Запрос</th>
                <th>Категория</th>
                <th>Score</th>
                <th>Тренд</th>
                <th>Обновлено</th>
              </tr>
            </thead>
            <tbody>
              {trends.map((t) => (
                <tr key={t.id}>
                  <td>{t.keyword}</td>
                  <td>{t.category ?? "—"}</td>
                  <td>{t.score.toFixed(0)}</td>
                  <td>
                    <span className={`badge badge-${t.direction.toLowerCase()}`}>
                      {directionLabel[t.direction] ?? t.direction}
                    </span>
                  </td>
                  <td>{new Date(t.capturedAt).toLocaleString("ru")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
