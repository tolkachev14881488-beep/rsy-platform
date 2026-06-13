import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "RSY Platform Admin",
  description: "Панель управления монетизацией РСЯ",
};

const nav = [
  { href: "/", label: "Дашборд" },
  { href: "/articles", label: "Статьи" },
  { href: "/clusters", label: "Кластеры" },
  { href: "/trends", label: "Тренды" },
  { href: "/automation", label: "Автоматизация" },
  { href: "/revenue", label: "Доходность" },
  { href: "/layout-tests", label: "A/B Layout" },
  { href: "/yandex", label: "Яндекс" },
  { href: "/settings", label: "Настройки" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <div className="admin-shell">
          <aside className="sidebar">
            <h1 className="brand">RSY Platform</h1>
            <nav>
              {nav.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}
