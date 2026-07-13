import { siteContent } from "@/content/site";
import { Countdown } from "./Countdown";

export function HeroTeaser() {
  return (
    <section className="min-h-[80vh] flex flex-col justify-center gap-8 px-6 py-20 text-center">
      <h1 className="text-6xl md:text-8xl text-fog">Скоро отправление</h1>
      <p className="text-lg text-muted max-w-xl mx-auto">{siteContent.sloganTeaser}</p>
      <div className="flex justify-center">
        <Countdown targetDate={siteContent.openingDate} />
      </div>
      <div className="flex justify-center">
        <a href="#pre-register" className="bg-acid text-ink font-display uppercase px-6 py-3">
          Предварительная регистрация
        </a>
      </div>
    </section>
  );
}
