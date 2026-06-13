import type { Metadata } from "next";
import { siteConfig } from "@rsy/config";
import { YandexMetrika } from "@/components/YandexMetrika";
import "./globals.css";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.tagline,
  metadataBase: new URL(siteConfig.url),
  verification: process.env.YANDEX_VERIFICATION
    ? { yandex: process.env.YANDEX_VERIFICATION }
    : undefined,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <header className="site-header">
          <div className="container">
            <a href="/" className="logo">{siteConfig.name}</a>
            <nav>
              <a href="/">Главная</a>
              <a href="/privacy">Конфиденциальность</a>
              <a href="/contacts">Контакты</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="container">
            <p>&copy; {new Date().getFullYear()} {siteConfig.name}. {siteConfig.tagline}</p>
          </div>
        </footer>
        <YandexMetrika />
      </body>
    </html>
  );
}
