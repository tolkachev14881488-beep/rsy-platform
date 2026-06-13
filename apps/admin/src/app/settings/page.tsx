import { siteConfig } from "@rsy/config";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="page-title">Настройки проекта</h1>

      <div className="card">
        <h2>Сайт</h2>
        <table>
          <tbody>
            <tr><td>Название</td><td>{siteConfig.name}</td></tr>
            <tr><td>Домен</td><td>{siteConfig.domain}</td></tr>
            <tr><td>URL</td><td>{siteConfig.url}</td></tr>
            <tr><td>Ниша</td><td>{siteConfig.niche.label}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>РСЯ</h2>
        <p style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
          Создайте блоки в partner.yandex.ru и укажите ID в <code>.env</code>
        </p>
        <table>
          <tbody>
            <tr><td>Partner ID</td><td>{siteConfig.rsy.partnerId || "—"}</td></tr>
            <tr><td>Header block</td><td>{siteConfig.rsy.blocks.header || "—"}</td></tr>
            <tr><td>In-content block</td><td>{siteConfig.rsy.blocks.inContent || "—"}</td></tr>
            <tr><td>Sidebar block</td><td>{siteConfig.rsy.blocks.sidebar || "—"}</td></tr>
            <tr><td>Footer block</td><td>{siteConfig.rsy.blocks.footer || "—"}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Запуск</h2>
        <pre style={{ fontSize: "0.8rem", background: "#f8fafc", padding: "1rem", borderRadius: "6px" }}>
{`npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev:web    # :3000 — публичный SEO-сайт
npm run dev:admin  # :3001 — панель управления
npm run worker     # фоновые задачи (нужен Redis)`}
        </pre>
      </div>
    </div>
  );
}
