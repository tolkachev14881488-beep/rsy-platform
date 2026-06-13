"use client";

import { useEffect, useState } from "react";

interface Settings {
  enabled: boolean;
  autoPublish: boolean;
  maxArticlesPerRun: number;
  maxArticlesPerDay: number;
  scanIntervalHours: number;
  seedKeywords: string[];
  lastRunAt: string | null;
  lastRunResult: Record<string, unknown> | null;
  articlesToday: number;
}

export default function AutomationPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [seeds, setSeeds] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/automation");
    const data = await res.json();
    if (res.ok && data.settings) {
      setSettings(data.settings);
      setSeeds(
        Array.isArray(data.settings.seedKeywords)
          ? data.settings.seedKeywords.join("\n")
          : ""
      );
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/automation/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...settings,
        seedKeywords: seeds.split("\n").map((s) => s.trim()).filter(Boolean),
      }),
    });

    const data = await res.json();
    setMessage(res.ok ? "Настройки сохранены" : data.error);
    if (res.ok) setSettings(data);
    setSaving(false);
  }

  if (!settings) {
    return (
      <div>
        <h1 className="page-title">Автоматизация</h1>
        <p>Загрузка... Если пусто — запустите npm run db:push && npm run db:seed</p>
      </div>
    );
  }

  const last = settings.lastRunResult as {
    trendsScanned?: number;
    articlesPublished?: number;
    risingTrends?: number;
  } | null;

  return (
    <div>
      <h1 className="page-title">Автоматизация контента</h1>

      <div className="alert alert-info">
        Система каждые {settings.scanIntervalHours} ч сканирует Яндекс Suggest,
        находит растущие запросы и автоматически публикует статьи.
        Запуск: <code>npm run worker</code> или <code>npm run automate</code>
      </div>

      <div className="card">
        <h2>Настройки</h2>

        <div className="form-row">
          <label>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
            />{" "}
            Автоматизация включена
          </label>
        </div>

        <div className="form-row">
          <label>
            <input
              type="checkbox"
              checked={settings.autoPublish}
              onChange={(e) => setSettings({ ...settings, autoPublish: e.target.checked })}
            />{" "}
            Автопубликация статей (без модерации)
          </label>
        </div>

        <div className="form-row">
          <label>Статей за один запуск</label>
          <input
            type="number"
            value={settings.maxArticlesPerRun}
            onChange={(e) =>
              setSettings({ ...settings, maxArticlesPerRun: parseInt(e.target.value, 10) || 1 })
            }
          />
        </div>

        <div className="form-row">
          <label>Лимит статей в день</label>
          <input
            type="number"
            value={settings.maxArticlesPerDay}
            onChange={(e) =>
              setSettings({ ...settings, maxArticlesPerDay: parseInt(e.target.value, 10) || 1 })
            }
          />
        </div>

        <div className="form-row">
          <label>Интервал сканирования (часы)</label>
          <input
            type="number"
            value={settings.scanIntervalHours}
            onChange={(e) =>
              setSettings({ ...settings, scanIntervalHours: parseInt(e.target.value, 10) || 6 })
            }
          />
        </div>

        <div className="form-row">
          <label>Seed-запросы (по одному на строку)</label>
          <textarea value={seeds} onChange={(e) => setSeeds(e.target.value)} rows={8} />
        </div>

        <button className="btn" onClick={save} disabled={saving}>
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
        {message && (
          <div className="alert alert-success" style={{ marginTop: "1rem" }}>
            {message}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Последний запуск</h2>
        <table>
          <tbody>
            <tr>
              <td>Время</td>
              <td>
                {settings.lastRunAt
                  ? new Date(settings.lastRunAt).toLocaleString("ru")
                  : "Ещё не запускалось"}
              </td>
            </tr>
            <tr>
              <td>Статей сегодня</td>
              <td>
                {settings.articlesToday} / {settings.maxArticlesPerDay}
              </td>
            </tr>
            {last && (
              <>
                <tr>
                  <td>Трендов просканировано</td>
                  <td>{last.trendsScanned ?? "—"}</td>
                </tr>
                <tr>
                  <td>Растущих</td>
                  <td>{last.risingTrends ?? "—"}</td>
                </tr>
                <tr>
                  <td>Опубликовано</td>
                  <td>{last.articlesPublished ?? "—"}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
