import { siteContent } from "@/content/site";
import { PreRegisterForm } from "./PreRegisterForm";

export function Footer() {
  const { telegram, vk, phone, address } = siteContent.contacts;
  return (
    <footer id="pre-register" className="px-6 py-20 border-t border-line bg-ink-soft scroll-mt-20">
      <div className="max-w-5xl mx-auto grid gap-12 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <span className="font-display text-3xl text-acid">{siteContent.clubName}</span>
          <a href={telegram} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-fog">Telegram</a>
          <a href={vk} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-fog">VK</a>
          <p className="text-muted">{phone}</p>
          <p className="text-muted">{address}</p>
        </div>
        <div>
          <h2 className="text-2xl text-fog mb-4">Узнать об открытии</h2>
          <PreRegisterForm />
        </div>
      </div>
    </footer>
  );
}
