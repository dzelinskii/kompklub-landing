import type { SiteMode } from "@/lib/siteMode";
import { siteContent } from "@/content/site";

export function Pricing({ mode }: { mode: SiteMode }) {
  const hideTariffs = mode === "teaser" && !siteContent.showTariffsInTeaser;

  return (
    <section className="px-6 py-20 max-w-5xl mx-auto">
      <h2 className="text-4xl text-fog mb-10">Цены</h2>
      {hideTariffs ? (
        <p className="text-muted text-lg">Тарифы скоро — следите за открытием.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {siteContent.tariffs.map((t) => (
            <div key={t.id} className="border border-line bg-ink-soft p-6">
              <h3 className="text-xl text-acid mb-2">{t.title}</h3>
              <p className="text-3xl font-display text-fog">{t.price}</p>
              {t.note && <p className="text-xs text-muted mt-2">{t.note}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
