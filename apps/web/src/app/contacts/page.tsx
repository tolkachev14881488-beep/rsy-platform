import { siteConfig } from "@rsy/config";

export default function ContactsPage() {
  return (
    <div className="container static-page">
      <h1>Контакты</h1>
      <p>По вопросам сотрудничества и размещения рекламы:</p>
      <p>Email: info@{siteConfig.domain.replace("localhost:3000", "example.ru")}</p>
    </div>
  );
}
