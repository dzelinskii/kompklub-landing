import { getSiteMode } from "@/lib/siteMode";
import { TrainShell, type CarDef } from "@/components/train/TrainShell";
import { HeroTeaser } from "@/components/hero/HeroTeaser";
import { HeroLive } from "@/components/hero/HeroLive";
import { About } from "@/components/About";
import { Zones } from "@/components/Zones";
import { Pricing } from "@/components/Pricing";
import { Gallery } from "@/components/Gallery";
import { FindUs } from "@/components/FindUs";
import { Footer } from "@/components/Footer";

export default function Home() {
  const mode = getSiteMode();

  const cars: CarDef[] = [
    { id: "hero", label: "Начало", content: mode === "teaser" ? <HeroTeaser /> : <HeroLive /> },
    { id: "about", label: "О клубе", content: <About /> },
    { id: "zones", label: "Зоны", content: <Zones /> },
    { id: "pricing", label: "Цены", content: <Pricing mode={mode} /> },
    { id: "gallery", label: "Галерея", content: <Gallery /> },
    { id: "find-us", label: "Как найти", content: <FindUs /> },
    { id: "contacts", label: "Контакты", content: <Footer /> },
  ];

  return <TrainShell mode={mode} cars={cars} />;
}
