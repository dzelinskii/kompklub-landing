export type Zone = {
  id: "pc" | "vip" | "console" | "private" | "bar";
  title: string;
  description: string;
  spec: string;
  priceFrom?: string;
  image: string;
};

export type Tariff = {
  id: string;
  title: string;
  price: string;
  note?: string;
};

export type Contacts = {
  telegram: string;
  vk: string;
  phone: string;
  address: string;
  hours: string;
  yandexMapsUrl: string;
};

export type SiteContent = {
  clubName: string;
  openingDate: string; // ISO-строка, например "2026-09-01T18:00:00+03:00"
  sloganTeaser: string;
  sloganLive: string;
  about: {
    text: string;
    features: { title: string; text: string }[];
  };
  zones: Zone[];
  tariffs: Tariff[];
  showTariffsInTeaser: boolean;
  gallery: string[];
  contacts: Contacts;
};
