import { siteContent } from "@/content/site";

export function Zones() {
  return (
    <section className="px-6 py-20 max-w-6xl mx-auto">
      <h2 className="text-4xl text-fog mb-10">Зоны</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {siteContent.zones.map((z) => (
          <article key={z.id} className="border border-line bg-ink-soft overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={z.image} alt={z.title} className="w-full h-40 object-cover" />
            <div className="p-5">
              <h3 className="text-2xl text-acid mb-1">{z.title}</h3>
              <p className="text-muted text-sm mb-3">{z.description}</p>
              <p className="text-xs text-muted">{z.spec}</p>
              {z.priceFrom && <p className="text-sm text-fog mt-2">{z.priceFrom}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
