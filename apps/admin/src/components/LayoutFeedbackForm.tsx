"use client";

import { useState } from "react";

export function LayoutFeedbackForm() {
  const [variant, setVariant] = useState<"A" | "B">("A");
  const [revenue, setRevenue] = useState("");
  const [impressions, setImpressions] = useState("");
  const [bounceRate, setBounceRate] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch("/api/layout/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variant,
        revenue: parseFloat(revenue) || 0,
        impressions: parseInt(impressions, 10) || 0,
        bounceRate: parseFloat(bounceRate) || undefined,
      }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Метрики обновлены" : data.error);
  }

  return (
    <div className="card">
      <h2>Обновить метрики варианта (feedback-цикл)</h2>
      <form onSubmit={submit}>
        <div className="form-row">
          <label>Вариант</label>
          <select value={variant} onChange={(e) => setVariant(e.target.value as "A" | "B")}>
            <option value="A">A</option>
            <option value="B">B</option>
          </select>
        </div>
        <div className="form-row">
          <label>Доход (₽)</label>
          <input value={revenue} onChange={(e) => setRevenue(e.target.value)} type="number" step="0.01" />
        </div>
        <div className="form-row">
          <label>Показы</label>
          <input value={impressions} onChange={(e) => setImpressions(e.target.value)} type="number" />
        </div>
        <div className="form-row">
          <label>Bounce rate (%)</label>
          <input value={bounceRate} onChange={(e) => setBounceRate(e.target.value)} type="number" step="0.1" />
        </div>
        <button type="submit" className="btn">Сохранить</button>
      </form>
      {message && <div className="alert alert-success" style={{ marginTop: "1rem" }}>{message}</div>}
    </div>
  );
}
