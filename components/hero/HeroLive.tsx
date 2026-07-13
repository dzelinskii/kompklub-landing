import { siteContent } from "@/content/site";

export function HeroLive() {
  return (
    <section className="min-h-[80vh] flex flex-col justify-center gap-8 px-6 py-20 text-center">
      <p className="text-sm uppercase tracking-widest text-acid">Посадка открыта</p>
      <h1 className="text-6xl md:text-8xl text-fog">{siteContent.sloganLive}</h1>
      <p className="text-lg text-muted">Открыто {siteContent.contacts.hours}</p>
      <div className="flex justify-center">
        <a
          href={siteContent.contacts.telegram}
          className="bg-acid text-ink font-display uppercase px-6 py-3"
        >
          Забронировать место
        </a>
      </div>
    </section>
  );
}
