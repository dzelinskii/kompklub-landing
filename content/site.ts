import type { SiteContent } from "./types";

export const siteContent: SiteContent = {
  clubName: "[LOGO]",
  openingDate: "2026-09-01T18:00:00+03:00",
  sloganTeaser: "Скоро на районе появится своя точка",
  sloganLive: "Твоя точка. Заходи и играй.",
  about: {
    text:
      "Компьютерный клуб в уличной эстетике: тёмные залы, топовое железо и своя атмосфера. Место, где собираются свои.",
    features: [
      { title: "Топ-железо", text: "Игровые ПК с производительными видеокартами и высоким FPS." },
      { title: "Периферия", text: "Механические клавиатуры, мыши и мониторы с высокой частотой." },
      { title: "Атмосфера", text: "Уличный стиль, свет и звук — не как везде." },
    ],
  },
  zones: [
    { id: "pc", title: "Стандарт", description: "Основная игровая зона для повседневного гейминга.", spec: "Игровые ПК, мониторы 144 Гц", priceFrom: "от 000 ₽/час", image: "/gallery/placeholder-1.svg" },
    { id: "vip", title: "VIP", description: "Мощнее железо, кресла получше, приватность.", spec: "Топовые ПК, мониторы 240 Гц", priceFrom: "от 000 ₽/час", image: "/gallery/placeholder-2.svg" },
    { id: "console", title: "Консоли", description: "PS5 и Xbox на больших экранах, удобные диваны.", spec: "PS5 / Xbox, большие ТВ", priceFrom: "от 000 ₽/час", image: "/gallery/placeholder-3.svg" },
    { id: "private", title: "Приватная комната", description: "Отдельная комната под команду, тренировки и дни рождения.", spec: "До 00 мест, звукоизоляция", priceFrom: "от 000 ₽/час", image: "/gallery/placeholder-4.svg" },
    { id: "bar", title: "Бар", description: "Кофе, снеки и энергетики, чтобы держать темп.", spec: "Напитки и снеки", image: "/gallery/placeholder-5.svg" },
  ],
  tariffs: [
    { id: "day", title: "Дневной", price: "000 ₽/час", note: "с 08:00 до 18:00" },
    { id: "night", title: "Ночной", price: "000 ₽", note: "с 22:00 до 08:00, пакет" },
    { id: "pack", title: "Пакет 5 часов", price: "000 ₽", note: "выгоднее поштучного" },
  ],
  showTariffsInTeaser: false,
  gallery: [
    "/gallery/placeholder-1.svg",
    "/gallery/placeholder-2.svg",
    "/gallery/placeholder-3.svg",
    "/gallery/placeholder-4.svg",
  ],
  contacts: {
    telegram: "https://t.me/example",
    vk: "https://vk.com/example",
    phone: "+7 (000) 000-00-00",
    address: "г. Город, ул. Улица, д. 0",
    hours: "ежедневно 12:00–00:00",
    yandexMapsUrl: "https://yandex.ru/maps/",
  },
};
