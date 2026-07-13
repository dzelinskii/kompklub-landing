import { siteContent } from "@/content/site";

export function FindUs() {
  const { address, hours, yandexMapsUrl } = siteContent.contacts;
  return (
    <section className="px-6 py-20 max-w-5xl mx-auto">
      <h2 className="text-4xl text-fog mb-10">Как нас найти</h2>
      <div className="border border-line bg-ink-soft p-8 flex flex-col gap-3">
        <p className="text-fog text-xl">{address}</p>
        <p className="text-muted">Режим работы: {hours}</p>
        <a
          href={yandexMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-acid text-ink font-display uppercase px-5 py-2 w-fit"
        >
          Открыть в Яндекс.Картах
        </a>
      </div>
    </section>
  );
}
