import { siteConfig } from "@rsy/config";

export default function PrivacyPage() {
  return (
    <div className="container static-page">
      <h1>Политика конфиденциальности</h1>
      <p>
        Сайт {siteConfig.name} ({siteConfig.url}) использует файлы cookie и сервис
        Яндекс.Метрика для анализа посещаемости. Рекламные блоки РСЯ могут использовать
        cookie для показа релевантной рекламы.
      </p>
      <p>
        Продолжая использовать сайт, вы соглашаетесь с обработкой данных в соответствии
        с политикой Яндекса и настоящим документом.
      </p>
    </div>
  );
}
