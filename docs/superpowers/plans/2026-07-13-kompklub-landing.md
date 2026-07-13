# План реализации — Этап 1: промо-лендинг компьютерного клуба

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Собрать промо-сайт компьютерного клуба в виде «поезда» на Next.js: дискретная навигация «вагон за вагоном» с запасным вертикальным режимом, два режима (тизер/работаем), форма предварительной регистрации и базовый фирменный стиль, готовый принять финальный дизайн из Claude Design.

**Architecture:** Next.js (App Router, TypeScript) как чистый фронтенд + одна serverless-функция (Route Handler) для приёма предрегистраций и отправки их владельцу в Telegram. Разделы оформлены как вагоны поезда: серверная страница собирает список вагонов, клиентская оболочка `TrainShell` отвечает за навигацию, индикатор и запасной режим; контент всех вагонов присутствует в DOM (SEO). Контент вынесен в типизированную модель-заглушку, режим сайта управляется переменной окружения. Заложен изолированный слой запросов под будущий Python-API. Базовый визуал (тёмный фон + кислотно-зелёный акцент) задаётся дизайн-токенами; финальный дизайн из Claude Design накладывается в конце.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, Zod, Vitest + Testing Library, деплой на Vercel.

---

## Структура файлов

```
app/
  layout.tsx                     — корневой layout, шрифты, метаданные, lang="ru"
  page.tsx                       — сборка: TrainShell + вагоны по порядку (Hero по режиму)
  globals.css                    — Tailwind + дизайн-токены (тёмная база, кислотно-зелёный)
  api/pre-register/route.ts      — POST-обработчик предрегистрации
components/
  train/TrainShell.tsx           — оболочка-поезд: навигация, дверь, прогресс, fallback
  train/Car.tsx                  — семантическая обёртка вагона (section, id, aria)
  train/TrainProgress.tsx        — индикатор-схема поезда (номера вагонов)
  train/Door.tsx                 — визуал раздвижной двери между вагонами
  hero/HeroTeaser.tsx            — вагон 0, режим «тизер» (экстерьер, «Скоро отправление»)
  hero/HeroLive.tsx              — вагон 0, режим «работаем» («Посадка открыта»)
  hero/Countdown.tsx             — отсчёт до открытия (клиентский компонент)
  About.tsx                      — вагон 1: «О клубе» + преимущества
  Zones.tsx                      — вагон 2: карточки зон (data-driven)
  Pricing.tsx                    — вагон 3: тарифы (зависит от режима)
  Gallery.tsx                    — вагон 4: сетка фото (заглушки)
  FindUs.tsx                     — вагон 5: адрес, часы, ссылка на Яндекс.Карты
  Footer.tsx                     — вагон 6: контакты + форма предрегистрации
  PreRegisterForm.tsx            — клиентская форма предрегистрации
lib/
  siteMode.ts                    — getSiteMode(): 'teaser' | 'live'
  useTrainNavigation.ts          — хук навигации по вагонам (индекс, next/prev, reduced-motion)
  api/client.ts                  — заготовка изолированного слоя запросов к будущему API
  preRegister/schema.ts          — Zod-схема + тип PreRegisterInput
  preRegister/notify.ts          — отправка уведомления в Telegram
content/
  types.ts                       — типы контента (SiteContent, Zone, Tariff, ...)
  site.ts                        — данные-заглушки (зоны, тарифы, контакты, дата)
vitest.config.mts, vitest.setup.ts
package.json, tsconfig.json, next.config.ts, postcss.config.mjs, .env.example
```

Каждый файл — одна ответственность. Вагоны разбиты по смыслу; компоненты берут
данные из `content/site.ts`, поэтому правка контента не трогает вёрстку.
Содержимое вагонов (About/Zones/Pricing/Gallery/FindUs/Footer) не зависит от
навигации — их можно строить и тестировать независимо от оболочки-поезда.

> **Примечание о пересмотре (концепция сайта-поезда).** Фазы 0–2 (Tasks 1–10:
> каркас, контент, режим, API-слой, предрегистрация) от концепции не зависят и
> идут без изменений. Изменилась Фаза 3: вместо «шапка + вертикальные секции»
> — оболочка-поезд с дискретной навигацией «вагон за вагоном» и запасным
> вертикальным режимом. Точная анимация двери и вид вагонов дорабатываются в
> браузере и по handoff-бандлу из Claude Design (Task 22).

---

## Фаза 0. Каркас проекта

### Task 1: Инициализация Next.js-проекта

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `.env.example`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`

- [ ] **Step 1: Создать `package.json`**

```json
{
  "name": "kompklub-landing",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "postcss": "^8.4.0",
    "vitest": "^2.1.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^25.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/user-event": "^14.5.0",
    "vite-tsconfig-paths": "^5.0.0"
  }
}
```

- [ ] **Step 2: Создать `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Создать `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 4: Создать `.env.example`**

```bash
# Режим сайта: teaser (скоро открытие) или live (работаем). По умолчанию teaser.
SITE_MODE=teaser

# Telegram-бот для приёма заявок предрегистрации
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Заготовка: адрес будущего Python-API (Этап 2). Пока не используется.
NEXT_PUBLIC_API_BASE_URL=
```

- [ ] **Step 5: Создать временный `app/layout.tsx`**

```tsx
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: Создать временный `app/page.tsx`**

```tsx
export default function Home() {
  return <main>Каркас работает</main>;
}
```

- [ ] **Step 7: Установить зависимости и проверить сборку**

Run: `npm install && npm run build`
Expected: сборка проходит без ошибок, в выводе есть строка про route `/`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Инициализировать Next.js-проект (TypeScript, App Router)"
```

---

### Task 2: Tailwind, дизайн-токены и шрифты

**Files:**
- Create: `postcss.config.mjs`
- Create: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Создать `postcss.config.mjs`**

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

- [ ] **Step 2: Создать `app/globals.css` с базовыми токенами**

Тёмная база + кислотно-зелёный акцент. Эти значения — стартовые; финальные придут из Claude Design (Task 22).

```css
@import "tailwindcss";

@theme {
  /* Тёмная база */
  --color-ink: #0a0a0a;
  --color-ink-soft: #151515;
  --color-line: #2a2a2a;

  /* Фирменный акцент — кислотно-зелёный (матовая уличная краска) */
  --color-acid: #b6ff1a;
  --color-acid-dim: #7fae12;

  /* Текст */
  --color-fog: #ededed;
  --color-muted: #9a9a9a;

  /* Шрифты (переменные приходят из next/font в layout) */
  --font-display: var(--font-oswald), system-ui, sans-serif;
  --font-body: var(--font-inter), system-ui, sans-serif;
}

body {
  background-color: var(--color-ink);
  color: var(--color-fog);
  font-family: var(--font-body);
}

h1, h2, h3 {
  font-family: var(--font-display);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
```

- [ ] **Step 3: Обновить `app/layout.tsx` — подключить шрифты и стили**

Oswald и Inter поддерживают кириллицу (важно для русских заголовков).

```tsx
import type { ReactNode } from "react";
import { Oswald, Inter } from "next/font/google";
import "./globals.css";

const display = Oswald({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700"],
  variable: "--font-oswald",
});

const body = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Проверить сборку**

Run: `npm run build`
Expected: сборка проходит без ошибок.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Подключить Tailwind, дизайн-токены и шрифты"
```

---

### Task 3: Настройка Vitest и Testing Library

**Files:**
- Create: `vitest.config.mts`
- Create: `vitest.setup.ts`
- Create: `lib/smoke.test.ts`

Расширение `.mts` (а не `.ts`) — чтобы конфиг всегда грузился как ESM: плагин
`vite-tsconfig-paths` v5 поставляется только в ESM, и при обычном `.ts` без
`"type": "module"` в package.json он падает при загрузке. `.mts` решает это
точечно, не меняя семантику модулей всего проекта.

- [ ] **Step 1: Создать `vitest.config.mts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

- [ ] **Step 2: Создать `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Написать проверочный тест `lib/smoke.test.ts`**

```ts
import { describe, it, expect } from "vitest";

describe("окружение тестов", () => {
  it("складывает числа", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Запустить тесты**

Run: `npm test`
Expected: 1 тест проходит (PASS).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Настроить Vitest и Testing Library"
```

---

## Фаза 1. Логика и контент

### Task 4: Модель контента

**Files:**
- Create: `content/types.ts`
- Create: `content/site.ts`
- Test: `content/site.test.ts`

- [ ] **Step 1: Написать тест `content/site.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { siteContent } from "@/content/site";

describe("модель контента", () => {
  it("содержит все зоны клуба", () => {
    const ids = siteContent.zones.map((z) => z.id);
    expect(ids).toEqual(["pc", "vip", "console", "private", "bar"]);
  });

  it("у каждой зоны есть заголовок и описание", () => {
    for (const zone of siteContent.zones) {
      expect(zone.title.length).toBeGreaterThan(0);
      expect(zone.description.length).toBeGreaterThan(0);
    }
  });

  it("содержит контакты и ссылку на Яндекс.Карты", () => {
    expect(siteContent.contacts.telegram).toMatch(/^https?:\/\//);
    expect(siteContent.contacts.yandexMapsUrl).toMatch(/^https?:\/\//);
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- content/site.test.ts`
Expected: FAIL — модуль `@/content/site` не найден.

- [ ] **Step 3: Создать `content/types.ts`**

```ts
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
```

- [ ] **Step 4: Создать `content/site.ts` с заглушками**

```ts
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
```

- [ ] **Step 5: Создать заглушки изображений**

Создать `public/gallery/placeholder-1.svg` … `placeholder-5.svg`. Каждый файл — простой тёмный SVG-плейсхолдер:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#151515"/>
  <text x="400" y="300" fill="#b6ff1a" font-family="sans-serif" font-size="32" text-anchor="middle" dominant-baseline="middle">ФОТО СКОРО</text>
</svg>
```

(Пять файлов с одинаковым содержимым — реальные фото подставятся позже.)

- [ ] **Step 6: Запустить тест — убедиться, что проходит**

Run: `npm test -- content/site.test.ts`
Expected: PASS (3 теста).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Добавить модель контента сайта"
```

---

### Task 5: Определение режима сайта

**Files:**
- Create: `lib/siteMode.ts`
- Test: `lib/siteMode.test.ts`

- [ ] **Step 1: Написать тест `lib/siteMode.test.ts`**

```ts
import { describe, it, expect, afterEach } from "vitest";
import { getSiteMode } from "@/lib/siteMode";

afterEach(() => {
  delete process.env.SITE_MODE;
});

describe("getSiteMode", () => {
  it("по умолчанию возвращает teaser", () => {
    delete process.env.SITE_MODE;
    expect(getSiteMode()).toBe("teaser");
  });

  it("возвращает live, если задано в окружении", () => {
    process.env.SITE_MODE = "live";
    expect(getSiteMode()).toBe("live");
  });

  it("при некорректном значении откатывается на teaser", () => {
    process.env.SITE_MODE = "нечто";
    expect(getSiteMode()).toBe("teaser");
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- lib/siteMode.test.ts`
Expected: FAIL — модуль не найден.

- [ ] **Step 3: Создать `lib/siteMode.ts`**

```ts
export type SiteMode = "teaser" | "live";

export function getSiteMode(): SiteMode {
  return process.env.SITE_MODE === "live" ? "live" : "teaser";
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npm test -- lib/siteMode.test.ts`
Expected: PASS (3 теста).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Добавить определение режима сайта (getSiteMode)"
```

---

### Task 6: Заготовка слоя запросов к будущему API

Изолированный слой под Python-API Этапа 2 (по требованию спецификации). Пока не используется, но фиксирует адрес API и способ вызова.

**Files:**
- Create: `lib/api/client.ts`
- Test: `lib/api/client.test.ts`

- [ ] **Step 1: Написать тест `lib/api/client.test.ts`**

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { apiFetch } from "@/lib/api/client";

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.NEXT_PUBLIC_API_BASE_URL;
});

describe("apiFetch", () => {
  it("бросает ошибку, если базовый URL не задан", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    await expect(apiFetch("/ping")).rejects.toThrow(/API_BASE_URL/);
  });

  it("собирает полный URL и пробрасывает init в fetch", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    const init = { method: "POST" };
    await apiFetch("/ping", init);

    expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/ping", init);
  });

  it("склеивает базу и путь ровно одним слэшем", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com/";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    await apiFetch("/ping");

    expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/ping", undefined);
  });

  it("возвращает ответ, который вернул fetch", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("ok", { status: 200 }));

    const res = await apiFetch("/ping");

    expect(await res.text()).toBe("ok");
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- lib/api/client.test.ts`
Expected: FAIL — модуль не найден.

- [ ] **Step 3: Создать `lib/api/client.ts`**

```ts
/**
 * Изолированный слой запросов к будущему Python-API (Этап 2).
 * Сейчас не вызывается; существует, чтобы адрес API и способ вызова
 * были в одном месте и переход на реальный бэкенд не задел вёрстку.
 * База и путь склеиваются ровно одним слэшем — независимо от того, есть ли
 * завершающий слэш у базы и начальный у пути.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL не задан");
  }
  const url = `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  return fetch(url, init);
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npm test -- lib/api/client.test.ts`
Expected: PASS (2 теста).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Добавить заготовку клиента будущего API"
```

---

## Фаза 2. Предварительная регистрация

### Task 7: Схема валидации предрегистрации

**Files:**
- Create: `lib/preRegister/schema.ts`
- Test: `lib/preRegister/schema.test.ts`

- [ ] **Step 1: Написать тест `lib/preRegister/schema.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { preRegisterSchema } from "@/lib/preRegister/schema";

describe("preRegisterSchema", () => {
  it("принимает корректную заявку", () => {
    const result = preRegisterSchema.safeParse({ name: "Иван", contact: "@ivan" });
    expect(result.success).toBe(true);
  });

  it("отклоняет пустое имя", () => {
    const result = preRegisterSchema.safeParse({ name: "", contact: "@ivan" });
    expect(result.success).toBe(false);
  });

  it("отклоняет слишком короткий контакт", () => {
    const result = preRegisterSchema.safeParse({ name: "Иван", contact: "a" });
    expect(result.success).toBe(false);
  });

  it("разрешает необязательное honeypot-поле website", () => {
    const result = preRegisterSchema.safeParse({ name: "Иван", contact: "@ivan", website: "спам" });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- lib/preRegister/schema.test.ts`
Expected: FAIL — модуль не найден.

- [ ] **Step 3: Создать `lib/preRegister/schema.ts`**

```ts
import { z } from "zod";

export const preRegisterSchema = z.object({
  name: z.string().trim().min(1, "Укажите имя").max(80),
  contact: z.string().trim().min(3, "Укажите способ связи").max(120),
  // Honeypot: настоящие пользователи оставляют поле пустым; боты часто заполняют.
  website: z.string().max(200).optional(),
});

export type PreRegisterInput = z.infer<typeof preRegisterSchema>;
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npm test -- lib/preRegister/schema.test.ts`
Expected: PASS (4 теста).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Добавить схему валидации предрегистрации"
```

---

### Task 8: Отправка уведомления в Telegram

**Files:**
- Create: `lib/preRegister/notify.ts`
- Test: `lib/preRegister/notify.test.ts`

- [ ] **Step 1: Написать тест `lib/preRegister/notify.test.ts`**

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { sendPreRegisterNotification } from "@/lib/preRegister/notify";

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_CHAT_ID;
});

describe("sendPreRegisterNotification", () => {
  it("бросает ошибку, если Telegram не сконфигурирован", async () => {
    await expect(
      sendPreRegisterNotification({ name: "Иван", contact: "@ivan" }),
    ).rejects.toThrow(/Telegram/);
  });

  it("вызывает Telegram API с именем и контактом", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "TOKEN";
    process.env.TELEGRAM_CHAT_ID = "123";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    await sendPreRegisterNotification({ name: "Иван", contact: "@ivan" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/botTOKEN/sendMessage");
    expect(String(init?.body)).toContain("Иван");
    expect(String(init?.body)).toContain("@ivan");
  });

  it("бросает ошибку, если Telegram вернул не-2xx", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "TOKEN";
    process.env.TELEGRAM_CHAT_ID = "123";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("fail", { status: 500 }));

    await expect(
      sendPreRegisterNotification({ name: "Иван", contact: "@ivan" }),
    ).rejects.toThrow(/500/);
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- lib/preRegister/notify.test.ts`
Expected: FAIL — модуль не найден.

- [ ] **Step 3: Создать `lib/preRegister/notify.ts`**

```ts
import type { PreRegisterInput } from "./schema";

export async function sendPreRegisterNotification(input: PreRegisterInput): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    throw new Error("Telegram не сконфигурирован (нет TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID)");
  }

  const text = `Новая предварительная регистрация\nИмя: ${input.name}\nКонтакт: ${input.contact}`;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  if (!res.ok) {
    throw new Error(`Telegram API вернул ${res.status}`);
  }
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npm test -- lib/preRegister/notify.test.ts`
Expected: PASS (3 теста).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Добавить отправку уведомления о предрегистрации в Telegram"
```

---

### Task 9: Обработчик POST /api/pre-register

**Files:**
- Create: `app/api/pre-register/route.ts`
- Test: `app/api/pre-register/route.test.ts`

- [ ] **Step 1: Написать тест `app/api/pre-register/route.test.ts`**

```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import * as notify from "@/lib/preRegister/notify";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/pre-register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/pre-register", () => {
  it("на корректную заявку отвечает 200 и шлёт уведомление", async () => {
    const spy = vi.spyOn(notify, "sendPreRegisterNotification").mockResolvedValue();
    const res = await POST(makeRequest({ name: "Иван", contact: "@ivan" }));
    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("на некорректную заявку отвечает 400 и не шлёт уведомление", async () => {
    const spy = vi.spyOn(notify, "sendPreRegisterNotification").mockResolvedValue();
    const res = await POST(makeRequest({ name: "", contact: "" }));
    expect(res.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });

  it("при заполненном honeypot тихо отвечает 200, но не шлёт уведомление", async () => {
    const spy = vi.spyOn(notify, "sendPreRegisterNotification").mockResolvedValue();
    const res = await POST(makeRequest({ name: "Бот", contact: "@bot", website: "http://spam" }));
    expect(res.status).toBe(200);
    expect(spy).not.toHaveBeenCalled();
  });

  it("при ошибке уведомления отвечает 502", async () => {
    vi.spyOn(notify, "sendPreRegisterNotification").mockRejectedValue(new Error("нет сети"));
    const res = await POST(makeRequest({ name: "Иван", contact: "@ivan" }));
    expect(res.status).toBe(502);
  });

  it("на битый JSON отвечает 400 и не шлёт уведомление", async () => {
    const spy = vi.spyOn(notify, "sendPreRegisterNotification").mockResolvedValue();
    const req = new Request("http://localhost/api/pre-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "не json {",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- app/api/pre-register/route.test.ts`
Expected: FAIL — модуль `./route` не найден.

- [ ] **Step 3: Создать `app/api/pre-register/route.ts`**

```ts
import { NextResponse } from "next/server";
import { preRegisterSchema } from "@/lib/preRegister/schema";
import { sendPreRegisterNotification } from "@/lib/preRegister/notify";

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = preRegisterSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  // Honeypot заполнен — почти наверняка бот. Отвечаем «ок», но заявку не шлём.
  if (parsed.data.website && parsed.data.website.length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  try {
    await sendPreRegisterNotification(parsed.data);
  } catch (err) {
    // Заявка — единственный канал лидов; не глотаем молча, пишем в лог сервера.
    console.error("Не удалось отправить уведомление о предрегистрации:", err);
    return NextResponse.json({ error: "notify_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npm test -- app/api/pre-register/route.test.ts`
Expected: PASS (4 теста).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Добавить обработчик POST /api/pre-register"
```

---

### Task 10: Форма предварительной регистрации

**Files:**
- Create: `components/PreRegisterForm.tsx`
- Test: `components/PreRegisterForm.test.tsx`

- [ ] **Step 1: Написать тест `components/PreRegisterForm.test.tsx`**

```tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PreRegisterForm } from "./PreRegisterForm";

afterEach(() => vi.restoreAllMocks());

describe("PreRegisterForm", () => {
  it("отправляет заявку и показывает успех", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    render(<PreRegisterForm />);
    await userEvent.type(screen.getByLabelText("Имя"), "Иван");
    await userEvent.type(screen.getByLabelText("Как связаться"), "@ivan");
    await userEvent.click(screen.getByRole("button", { name: /регистрац/i }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/спасибо/i));
    expect(fetchMock).toHaveBeenCalledWith("/api/pre-register", expect.any(Object));
  });

  it("показывает ошибку при неуспешном ответе", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("fail", { status: 500 }));

    render(<PreRegisterForm />);
    await userEvent.type(screen.getByLabelText("Имя"), "Иван");
    await userEvent.type(screen.getByLabelText("Как связаться"), "@ivan");
    await userEvent.click(screen.getByRole("button", { name: /регистрац/i }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/ошибка/i));
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- components/PreRegisterForm.test.tsx`
Expected: FAIL — модуль не найден.

- [ ] **Step 3: Создать `components/PreRegisterForm.tsx`**

```tsx
"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function PreRegisterForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? ""),
      contact: String(data.get("contact") ?? ""),
      website: String(data.get("website") ?? ""),
    };
    try {
      const res = await fetch("/api/pre-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 max-w-sm">
      <label className="flex flex-col gap-1 text-sm text-muted">
        Имя
        <input
          name="name"
          required
          className="bg-ink-soft border border-line px-3 py-2 text-fog focus:border-acid outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-muted">
        Как связаться
        <input
          name="contact"
          required
          placeholder="Telegram или телефон"
          className="bg-ink-soft border border-line px-3 py-2 text-fog focus:border-acid outline-none"
        />
      </label>
      {/* Honeypot: скрыт от людей, ловит ботов. */}
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-acid text-ink font-display uppercase px-5 py-2 disabled:opacity-60"
      >
        {status === "loading" ? "Отправляем…" : "Предварительная регистрация"}
      </button>
      {status === "success" && (
        <p role="status" className="text-acid text-sm">
          Спасибо! Мы напишем, когда откроемся.
        </p>
      )}
      {status === "error" && (
        <p role="status" className="text-red-400 text-sm">
          Ошибка отправки. Попробуйте ещё раз или напишите нам в Telegram.
        </p>
      )}
    </form>
  );
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npm test -- components/PreRegisterForm.test.tsx`
Expected: PASS (2 теста).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Добавить форму предварительной регистрации"
```

---

## Фаза 3. Оболочка-поезд и вагоны

Разделы оформлены как вагоны поезда с дискретной навигацией «вагон за вагоном».
Содержимое вагонов (Tasks 12–18) не зависит от навигации и берёт данные из
`content/site.ts`. Оболочка-поезд (Task 11) отвечает за перемещение между
вагонами, индикатор-схему, клавиатуру и запасной вертикальный режим.

**Про визуал и анимацию.** Базовая стилизация (тёмный фон + кислотно-зелёный)
и рабочая навигация делаются здесь; точный вид вагонов/двери и тонкая анимация
дорабатываются в браузере и по handoff-бандлу из Claude Design (Task 22).
Обязательный инвариант: контент всех вагонов присутствует в DOM по порядку
(SEO + запасной режим), поэтому тесты проверяют наличие контента и поведение
навигации, а не пиксели.

### Task 11: Оболочка-поезд (навигация, вагон, индикатор, дверь)

**Files:**
- Create: `lib/useTrainNavigation.ts`
- Create: `components/train/Car.tsx`
- Create: `components/train/TrainProgress.tsx`
- Create: `components/train/Door.tsx`
- Create: `components/train/TrainShell.tsx`
- Modify: `app/globals.css` (раскладка вагонов/трека)
- Test: `lib/useTrainNavigation.test.ts`
- Test: `components/train/TrainProgress.test.tsx`
- Test: `components/train/TrainShell.test.tsx`

- [ ] **Step 1: Написать тест `lib/useTrainNavigation.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTrainNavigation } from "@/lib/useTrainNavigation";

describe("useTrainNavigation", () => {
  it("стартует с нулевого вагона", () => {
    const { result } = renderHook(() => useTrainNavigation(4));
    expect(result.current.index).toBe(0);
    expect(result.current.isFirst).toBe(true);
  });

  it("next не выходит за последний вагон", () => {
    const { result } = renderHook(() => useTrainNavigation(2));
    act(() => result.current.next());
    act(() => result.current.next());
    act(() => result.current.next());
    expect(result.current.index).toBe(1);
    expect(result.current.isLast).toBe(true);
  });

  it("prev не выходит за нулевой вагон", () => {
    const { result } = renderHook(() => useTrainNavigation(3));
    act(() => result.current.prev());
    expect(result.current.index).toBe(0);
  });

  it("goTo зажимает индекс в границах", () => {
    const { result } = renderHook(() => useTrainNavigation(3));
    act(() => result.current.goTo(10));
    expect(result.current.index).toBe(2);
    act(() => result.current.goTo(-5));
    expect(result.current.index).toBe(0);
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- lib/useTrainNavigation.test.ts`
Expected: FAIL — модуль не найден.

- [ ] **Step 3: Создать `lib/useTrainNavigation.ts`**

```ts
"use client";

import { useCallback, useEffect, useState } from "react";

/** Навигация по вагонам: индекс с зажимом в границах. */
export function useTrainNavigation(carCount: number) {
  const [index, setIndex] = useState(0);
  const next = useCallback(() => setIndex((i) => Math.min(i + 1, carCount - 1)), [carCount]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);
  const goTo = useCallback(
    (i: number) => setIndex(Math.max(0, Math.min(i, carCount - 1))),
    [carCount],
  );
  return { index, next, prev, goTo, isFirst: index === 0, isLast: index === carCount - 1 };
}

/** true, если пользователь просит уменьшить движение. Безопасно в SSR/jsdom. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npm test -- lib/useTrainNavigation.test.ts`
Expected: PASS (4 теста).

- [ ] **Step 5: Создать `components/train/Car.tsx`**

```tsx
import type { ReactNode } from "react";

/** Семантическая обёртка вагона. */
export function Car({
  id,
  label,
  index,
  children,
}: {
  id: string;
  label: string;
  index: number;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-label={label} data-car-index={index} className="train-car">
      {children}
    </section>
  );
}
```

- [ ] **Step 6: Написать тест `components/train/TrainProgress.test.tsx`**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrainProgress } from "./TrainProgress";

describe("TrainProgress", () => {
  it("рисует кнопку на каждый вагон и помечает текущий", () => {
    render(<TrainProgress count={4} current={2} onSelect={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(4);
    expect(buttons[2]).toHaveAttribute("aria-current", "true");
  });
});
```

- [ ] **Step 7: Создать `components/train/TrainProgress.tsx`**

```tsx
/** Индикатор-схема поезда: по метке на каждый вагон, текущий подсвечен. */
export function TrainProgress({
  count,
  current,
  onSelect,
}: {
  count: number;
  current: number;
  onSelect: (index: number) => void;
}) {
  return (
    <ol className="hidden md:flex items-center gap-2" aria-label="Схема поезда">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <button
            type="button"
            aria-label={`Вагон ${i + 1}`}
            aria-current={i === current ? "true" : undefined}
            onClick={() => onSelect(i)}
            className={`block h-1 w-6 ${i === current ? "bg-acid" : "bg-line"}`}
          />
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 8: Запустить тест — убедиться, что проходит**

Run: `npm test -- components/train/TrainProgress.test.tsx`
Expected: PASS (1 тест).

- [ ] **Step 9: Создать `components/train/Door.tsx`**

Декоративная раздвижная дверь (визуал дорабатывается в Task 22). Без теста —
чисто оформление, aria-hidden.

```tsx
/** Декоративная дверь-переход между вагонами. */
export function Door({ open }: { open: boolean }) {
  return (
    <div aria-hidden="true" className={`train-door${open ? " train-door--open" : ""}`}>
      <span className="train-door__leaf train-door__leaf--left" />
      <span className="train-door__leaf train-door__leaf--right" />
    </div>
  );
}
```

- [ ] **Step 10: Добавить раскладку в `app/globals.css`**

Добавить в конец файла (базовая геометрия поезда; вид дорабатывается позже):

```css
@layer components {
  .train-viewport {
    overflow: hidden;
  }
  .train-track {
    display: flex;
    width: 100%;
    transition: transform 500ms ease;
  }
  .train-track > .train-car {
    flex: 0 0 100%;
    min-height: 100vh;
  }
  /* Запасной режим: обычная вертикаль. */
  .train-stacked .train-car {
    min-height: auto;
  }
  @media (prefers-reduced-motion: reduce) {
    .train-track {
      transition: none;
    }
  }
}
```

- [ ] **Step 11: Написать тест `components/train/TrainShell.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrainShell } from "./TrainShell";

const cars = [
  { id: "a", label: "Вагон A", content: <p>Контент A</p> },
  { id: "b", label: "Вагон B", content: <p>Контент B</p> },
  { id: "c", label: "Вагон C", content: <p>Контент C</p> },
];

describe("TrainShell", () => {
  it("держит контент всех вагонов в DOM (важно для SEO)", () => {
    render(<TrainShell mode="teaser" cars={cars} />);
    expect(screen.getByText("Контент A")).toBeInTheDocument();
    expect(screen.getByText("Контент B")).toBeInTheDocument();
    expect(screen.getByText("Контент C")).toBeInTheDocument();
  });

  it("в режиме teaser показывает кнопку предрегистрации", () => {
    render(<TrainShell mode="teaser" cars={cars} />);
    expect(screen.getByRole("link", { name: /предварительная регистрация/i })).toBeInTheDocument();
  });

  it("в режиме live показывает кнопку бронирования", () => {
    render(<TrainShell mode="live" cars={cars} />);
    expect(screen.getByRole("link", { name: /забронировать/i })).toBeInTheDocument();
  });

  it("кнопка «следующий вагон» продвигает индикатор", async () => {
    render(<TrainShell mode="teaser" cars={cars} />);
    await userEvent.click(screen.getByRole("button", { name: /следующий вагон/i }));
    expect(screen.getByRole("button", { name: "Вагон 2" })).toHaveAttribute("aria-current", "true");
  });
});
```

- [ ] **Step 12: Запустить тест — убедиться, что падает**

Run: `npm test -- components/train/TrainShell.test.tsx`
Expected: FAIL — модуль не найден.

- [ ] **Step 13: Создать `components/train/TrainShell.tsx`**

Базовая рабочая навигация: клавиатура (стрелки), кнопки «вперёд/назад», клики
по индикатору. Колесо/свайп добавляются при доводке в браузере (Task 22).

```tsx
"use client";

import type { ReactNode } from "react";
import type { SiteMode } from "@/lib/siteMode";
import { siteContent } from "@/content/site";
import { useTrainNavigation, usePrefersReducedMotion } from "@/lib/useTrainNavigation";
import { Car } from "./Car";
import { Door } from "./Door";
import { TrainProgress } from "./TrainProgress";

export type CarDef = { id: string; label: string; content: ReactNode };

export function TrainShell({ mode, cars }: { mode: SiteMode; cars: CarDef[] }) {
  const reduced = usePrefersReducedMotion();
  const { index, next, prev, goTo, isFirst, isLast } = useTrainNavigation(cars.length);

  const cta =
    mode === "teaser"
      ? { label: "Предварительная регистрация", href: "#pre-register" }
      : { label: "Забронировать", href: siteContent.contacts.telegram };

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      prev();
    }
  }

  const carEls = cars.map((c, i) => (
    <Car key={c.id} id={c.id} label={c.label} index={i}>
      {c.content}
    </Car>
  ));

  return (
    <div className={reduced ? "train train-stacked" : "train"} onKeyDown={onKeyDown} tabIndex={0}>
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-line bg-ink/90 px-6 py-4 backdrop-blur">
        <span className="font-display text-2xl text-acid">{siteContent.clubName}</span>
        {!reduced && <TrainProgress count={cars.length} current={index} onSelect={goTo} />}
        <a href={cta.href} className="bg-acid px-4 py-2 font-display text-sm uppercase text-ink">
          {cta.label}
        </a>
      </header>

      {reduced ? (
        <main>{carEls}</main>
      ) : (
        <main className="train-viewport relative">
          <div className="train-track" style={{ transform: `translateX(-${index * 100}%)` }}>
            {carEls}
          </div>
          <Door open={false} />
          <div className="train-controls fixed bottom-6 right-6 z-50 flex gap-3">
            <button
              type="button"
              onClick={prev}
              disabled={isFirst}
              aria-label="Предыдущий вагон"
              className="bg-ink-soft px-4 py-2 text-fog disabled:opacity-40"
            >
              ←
            </button>
            <button
              type="button"
              onClick={next}
              disabled={isLast}
              aria-label="Следующий вагон"
              className="bg-acid px-4 py-2 text-ink disabled:opacity-40"
            >
              →
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
```

- [ ] **Step 14: Запустить тест — убедиться, что проходит**

Run: `npm test -- components/train/TrainShell.test.tsx`
Expected: PASS (4 теста).

- [ ] **Step 15: Проверить сборку и закоммитить**

Run: `npm run build`
Expected: сборка успешна.

```bash
git add -A
git commit -m "Добавить оболочку-поезд: навигацию, вагон, индикатор, дверь"
```

---

### Task 12: Главный экран (тизер/работаем) и отсчёт

**Files:**
- Create: `components/hero/Countdown.tsx`
- Create: `components/hero/HeroTeaser.tsx`
- Create: `components/hero/HeroLive.tsx`
- Test: `components/hero/Countdown.test.tsx`
- Test: `components/hero/HeroTeaser.test.tsx`
- Test: `components/hero/HeroLive.test.tsx`

- [ ] **Step 1: Написать тест `components/hero/Countdown.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Countdown } from "./Countdown";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("Countdown", () => {
  it("показывает количество дней до целевой даты", () => {
    vi.setSystemTime(new Date("2026-08-30T18:00:00+03:00"));
    render(<Countdown targetDate="2026-09-01T18:00:00+03:00" />);
    // 2 дня до цели
    expect(screen.getByTestId("countdown-days")).toHaveTextContent("2");
  });

  it("после наступления даты показывает нули", () => {
    vi.setSystemTime(new Date("2026-09-02T18:00:00+03:00"));
    render(<Countdown targetDate="2026-09-01T18:00:00+03:00" />);
    expect(screen.getByTestId("countdown-days")).toHaveTextContent("0");
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- components/hero/Countdown.test.tsx`
Expected: FAIL — модуль не найден.

- [ ] **Step 3: Создать `components/hero/Countdown.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";

function diff(target: number, now: number) {
  // Защита от некорректной даты: при NaN показываем нули, а не "NaN".
  const ms = Number.isNaN(target) ? 0 : Math.max(0, target - now);
  const sec = Math.floor(ms / 1000);
  return {
    days: Math.floor(sec / 86400),
    hours: Math.floor((sec % 86400) / 3600),
    minutes: Math.floor((sec % 3600) / 60),
    seconds: sec % 60,
  };
}

export function Countdown({ targetDate }: { targetDate: string }) {
  const target = new Date(targetDate).getTime();
  const [left, setLeft] = useState(() => diff(target, Date.now()));

  useEffect(() => {
    const id = setInterval(() => setLeft(diff(target, Date.now())), 1000);
    return () => clearInterval(id);
  }, [target]);

  const cell = (value: number, label: string, testId: string) => (
    <div className="flex flex-col items-center">
      <span data-testid={testId} className="font-display text-5xl text-acid">
        {value}
      </span>
      <span className="text-xs uppercase text-muted">{label}</span>
    </div>
  );

  return (
    <div className="flex gap-6">
      {cell(left.days, "дней", "countdown-days")}
      {cell(left.hours, "часов", "countdown-hours")}
      {cell(left.minutes, "минут", "countdown-minutes")}
      {cell(left.seconds, "секунд", "countdown-seconds")}
    </div>
  );
}
```

- [ ] **Step 4: Запустить тест Countdown — убедиться, что проходит**

Run: `npm test -- components/hero/Countdown.test.tsx`
Expected: PASS (2 теста).

- [ ] **Step 5: Написать тест `components/hero/HeroTeaser.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroTeaser } from "./HeroTeaser";

describe("HeroTeaser", () => {
  it("показывает заголовок «скоро отправление» и отсчёт", () => {
    render(<HeroTeaser />);
    expect(screen.getByRole("heading", { name: /скоро отправление/i })).toBeInTheDocument();
    expect(screen.getByTestId("countdown-days")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Запустить тест — убедиться, что падает**

Run: `npm test -- components/hero/HeroTeaser.test.tsx`
Expected: FAIL — модуль не найден.

- [ ] **Step 7: Создать `components/hero/HeroTeaser.tsx`**

```tsx
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
```

- [ ] **Step 8: Запустить тест HeroTeaser — убедиться, что проходит**

Run: `npm test -- components/hero/HeroTeaser.test.tsx`
Expected: PASS (1 тест).

- [ ] **Step 9: Написать тест `components/hero/HeroLive.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroLive } from "./HeroLive";

describe("HeroLive", () => {
  it("показывает слоган и кнопку бронирования", () => {
    render(<HeroLive />);
    expect(screen.getByRole("link", { name: /забронировать/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 10: Запустить тест — убедиться, что падает**

Run: `npm test -- components/hero/HeroLive.test.tsx`
Expected: FAIL — модуль не найден.

- [ ] **Step 11: Создать `components/hero/HeroLive.tsx`**

```tsx
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
```

- [ ] **Step 12: Запустить тест HeroLive — убедиться, что проходит**

Run: `npm test -- components/hero/HeroLive.test.tsx`
Expected: PASS (1 тест).

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "Добавить главный экран (тизер/работаем) и отсчёт"
```

---

### Task 13: Блок «О клубе»

**Files:**
- Create: `components/About.tsx`
- Test: `components/About.test.tsx`

- [ ] **Step 1: Написать тест `components/About.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { About } from "./About";
import { siteContent } from "@/content/site";

describe("About", () => {
  it("показывает все преимущества из контента", () => {
    render(<About />);
    for (const f of siteContent.about.features) {
      expect(screen.getByText(f.title)).toBeInTheDocument();
    }
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- components/About.test.tsx`
Expected: FAIL — модуль не найден.

- [ ] **Step 3: Создать `components/About.tsx`**

```tsx
import { siteContent } from "@/content/site";

export function About() {
  const { text, features } = siteContent.about;
  return (
    <section className="px-6 py-20 max-w-5xl mx-auto">
      <h2 className="text-4xl text-fog mb-6">О клубе</h2>
      <p className="text-muted text-lg mb-10 max-w-2xl">{text}</p>
      <div className="grid gap-6 md:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="border border-line p-6 bg-ink-soft">
            <h3 className="text-xl text-acid mb-2">{f.title}</h3>
            <p className="text-muted text-sm">{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npm test -- components/About.test.tsx`
Expected: PASS (1 тест).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Добавить блок «О клубе»"
```

---

### Task 14: Блок «Зоны»

**Files:**
- Create: `components/Zones.tsx`
- Test: `components/Zones.test.tsx`

- [ ] **Step 1: Написать тест `components/Zones.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Zones } from "./Zones";
import { siteContent } from "@/content/site";

describe("Zones", () => {
  it("рендерит карточку для каждой зоны", () => {
    render(<Zones />);
    for (const z of siteContent.zones) {
      expect(screen.getByRole("heading", { name: z.title })).toBeInTheDocument();
    }
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- components/Zones.test.tsx`
Expected: FAIL — модуль не найден.

- [ ] **Step 3: Создать `components/Zones.tsx`**

```tsx
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
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npm test -- components/Zones.test.tsx`
Expected: PASS (1 тест).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Добавить блок «Зоны»"
```

---

### Task 15: Блок «Цены»

**Files:**
- Create: `components/Pricing.tsx`
- Test: `components/Pricing.test.tsx`

- [ ] **Step 1: Написать тест `components/Pricing.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Pricing } from "./Pricing";
import { siteContent } from "@/content/site";

describe("Pricing", () => {
  it("в режиме live показывает тарифы", () => {
    render(<Pricing mode="live" />);
    expect(screen.getByText(siteContent.tariffs[0].title)).toBeInTheDocument();
  });

  it("в режиме teaser при скрытых тарифах показывает «скоро»", () => {
    render(<Pricing mode="teaser" />);
    expect(screen.getByText(/тарифы скоро/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- components/Pricing.test.tsx`
Expected: FAIL — модуль не найден.

- [ ] **Step 3: Создать `components/Pricing.tsx`**

```tsx
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
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npm test -- components/Pricing.test.tsx`
Expected: PASS (2 теста).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Добавить блок «Цены»"
```

---

### Task 16: Блок «Галерея»

**Files:**
- Create: `components/Gallery.tsx`
- Test: `components/Gallery.test.tsx`

- [ ] **Step 1: Написать тест `components/Gallery.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Gallery } from "./Gallery";
import { siteContent } from "@/content/site";

describe("Gallery", () => {
  it("рендерит по изображению на каждый элемент галереи", () => {
    render(<Gallery />);
    expect(screen.getAllByRole("img")).toHaveLength(siteContent.gallery.length);
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- components/Gallery.test.tsx`
Expected: FAIL — модуль не найден.

- [ ] **Step 3: Создать `components/Gallery.tsx`**

```tsx
import { siteContent } from "@/content/site";

export function Gallery() {
  return (
    <section className="px-6 py-20 max-w-6xl mx-auto">
      <h2 className="text-4xl text-fog mb-10">Галерея</h2>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {siteContent.gallery.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt={`Фото клуба ${i + 1}`} className="w-full h-40 object-cover border border-line" />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npm test -- components/Gallery.test.tsx`
Expected: PASS (1 тест).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Добавить блок «Галерея»"
```

---

### Task 17: Блок «Как нас найти»

**Files:**
- Create: `components/FindUs.tsx`
- Test: `components/FindUs.test.tsx`

- [ ] **Step 1: Написать тест `components/FindUs.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FindUs } from "./FindUs";
import { siteContent } from "@/content/site";

describe("FindUs", () => {
  it("показывает адрес и ссылку на Яндекс.Карты", () => {
    render(<FindUs />);
    expect(screen.getByText(siteContent.contacts.address)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /яндекс/i });
    expect(link).toHaveAttribute("href", siteContent.contacts.yandexMapsUrl);
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- components/FindUs.test.tsx`
Expected: FAIL — модуль не найден.

- [ ] **Step 3: Создать `components/FindUs.tsx`**

Встроенную интерактивную карту добавим, когда будут известны точные координаты (открытый вопрос в спецификации); пока — адрес, часы и кнопка-переход в Яндекс.Карты.

```tsx
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
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npm test -- components/FindUs.test.tsx`
Expected: PASS (1 тест).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Добавить блок «Как нас найти»"
```

---

### Task 18: Подвал с контактами и формой

**Files:**
- Create: `components/Footer.tsx`
- Test: `components/Footer.test.tsx`

- [ ] **Step 1: Написать тест `components/Footer.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";
import { siteContent } from "@/content/site";

describe("Footer", () => {
  it("показывает контакты Telegram, VK и телефон", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: /telegram/i })).toHaveAttribute("href", siteContent.contacts.telegram);
    expect(screen.getByRole("link", { name: /vk/i })).toHaveAttribute("href", siteContent.contacts.vk);
    expect(screen.getByText(siteContent.contacts.phone)).toBeInTheDocument();
  });

  it("содержит форму предрегистрации", () => {
    render(<Footer />);
    expect(screen.getByLabelText("Имя")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- components/Footer.test.tsx`
Expected: FAIL — модуль не найден.

- [ ] **Step 3: Создать `components/Footer.tsx`**

```tsx
import { siteContent } from "@/content/site";
import { PreRegisterForm } from "./PreRegisterForm";

export function Footer() {
  const { telegram, vk, phone, address } = siteContent.contacts;
  return (
    <footer id="pre-register" className="px-6 py-20 border-t border-line bg-ink-soft scroll-mt-20">
      <div className="max-w-5xl mx-auto grid gap-12 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <span className="font-display text-3xl text-acid">{siteContent.clubName}</span>
          <a href={telegram} className="text-muted hover:text-fog">Telegram</a>
          <a href={vk} className="text-muted hover:text-fog">VK</a>
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
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npm test -- components/Footer.test.tsx`
Expected: PASS (2 теста).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Добавить подвал с контактами и формой"
```

---

### Task 19: Композиция страницы

**Files:**
- Modify: `app/page.tsx`
- Test: `app/page.test.tsx`

- [ ] **Step 1: Написать тест `app/page.test.tsx`**

```tsx
import { describe, it, expect, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

afterEach(() => {
  delete process.env.SITE_MODE;
});

describe("страница лендинга", () => {
  it("в режиме teaser показывает вагон-тизер «скоро отправление»", () => {
    delete process.env.SITE_MODE;
    render(<Home />);
    expect(screen.getByRole("heading", { name: /скоро отправление/i })).toBeInTheDocument();
  });

  it("в режиме live держит вагон «зоны» в DOM", () => {
    process.env.SITE_MODE = "live";
    render(<Home />);
    expect(screen.getByRole("heading", { name: /зоны/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- app/page.test.tsx`
Expected: FAIL — страница пока выводит «Каркас работает».

- [ ] **Step 3: Обновить `app/page.tsx`**

Страница (серверный компонент) собирает список вагонов и передаёт его в
клиентскую оболочку `TrainShell`. Hero-вагон выбирается по режиму. Все вагоны
попадают в DOM по порядку (важно для SEO и запасного режима).

```tsx
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
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npm test -- app/page.test.tsx`
Expected: PASS (2 теста).

- [ ] **Step 5: Проверить полную сборку и все тесты**

Run: `npm run build && npm test`
Expected: сборка успешна, все тесты проходят.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Собрать страницу лендинга"
```

---

## Фаза 4. SEO, доступность, адаптивность

### Task 20: SEO-метаданные

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Добавить метаданные в `app/layout.tsx`**

Добавить экспорт `metadata` (после импортов, до компонента). Значения-заглушки заменяются вместе с названием клуба.

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Компьютерный клуб — скоро открытие",
  description:
    "Компьютерный клуб в уличной эстетике: топовое железо, VIP-зона, консоли, приватная комната и бар. Скоро открытие.",
  openGraph: {
    title: "Компьютерный клуб — скоро открытие",
    description: "Топовое железо, уличная атмосфера. Скоро открытие.",
    type: "website",
    locale: "ru_RU",
  },
  robots: { index: true, follow: true },
};
```

- [ ] **Step 2: Проверить сборку**

Run: `npm run build`
Expected: сборка успешна.

- [ ] **Step 3: Ручная проверка в браузере**

Run: `npm run dev`
Открыть `http://localhost:3000`, во вкладке браузера — корректный заголовок; в исходнике страницы (View Source) присутствуют мета-теги `description` и `og:*`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Добавить SEO-метаданные"
```

---

### Task 21: Проверка адаптивности и доступности

Ручная проходка; правки — точечные, без изменения логики.

**Files:**
- Modify: любые компоненты по результатам проверки (только классы стилей).

- [ ] **Step 1: Запустить дев-сервер и проверить мобильный вид**

Run: `npm run dev`
В браузере включить эмуляцию мобильного (375px). Проверить: шапка не ломается, вагоны читаемы, сетки перестраиваются в один столбец, кнопки не обрезаны.

- [ ] **Step 2: Проверить навигацию по вагонам и запасной режим**

На десктопе проверить: кнопки «следующий/предыдущий вагон» и клики по индикатору переключают вагоны; стрелки на клавиатуре тоже. Включить в системе/эмуляции `prefers-reduced-motion: reduce` и убедиться, что сайт разворачивается в обычную вертикаль (вагоны идут стопкой, без горизонтального трека). На мобильном (375px) убедиться, что контент всех вагонов доступен.

- [ ] **Step 3: Проверить оба режима**

Перезапустить с `SITE_MODE=live npm run dev` и убедиться, что hero-вагон, цены и CTA соответствуют режиму «работаем». Затем вернуть `teaser`.

- [ ] **Step 4: Базовая доступность**

Проверить: у всех `img` есть `alt`; поля формы связаны с подписями (клик по подписи фокусирует поле); контраст текста на тёмном/граффити фоне читаем; навигация по Tab доходит до кнопок навигации и формы; переключение вагонов работает с клавиатуры.

- [ ] **Step 5: Commit (если были правки)**

```bash
git add -A
git commit -m "Поправить адаптивность и доступность лендинга"
```

---

## Фаза 5. Интеграция дизайна из Claude Design

### Task 22: Приём handoff-бандла и рестайл

Эта задача выполняется, **когда готовы макеты в Claude Design**. До этого момента лендинг уже функционален с базовым стилем. Здесь throwaway-кода нет — только замена стилевого слоя, структура и логика не меняются.

**Files:**
- Modify: `app/globals.css` (дизайн-токены: точные цвета, тени/glow, фактуры; раскладка/анимация вагонов и двери)
- Modify: вагоны в `components/*` и оболочку `components/train/*` (классы стилей, декоративные элементы, вид двери/индикатора)
- Возможно Create: `public/*` (реальные шрифты/ассеты из бандла, если отличаются)

- [ ] **Step 1: Получить handoff-бандл**

В Claude Design завершить макеты сайта-поезда (экстерьер, вид вагонов, раздвижная граффити-дверь, индикатор-схема; тёмная база + кислотно-зелёный, дозированный glow — см. бриф `docs/superpowers/claude-design-brief.md` и раздел 8 спецификации) и экспортировать handoff-бандл для Claude Code. Здесь же дорабатывается тонкая анимация двери и, при желании, навигация колесом/свайпом поверх готовой клавиатурной и кнопочной.

- [ ] **Step 2: Синхронизировать дизайн-токены**

Перенести точные значения цветов, шрифтов и эффектов из бандла в `@theme` в `app/globals.css`. Компоненты уже используют семантические токены (`bg-ink`, `text-acid` и т.д.), поэтому смена значений применяется глобально.

- [ ] **Step 3: Наложить визуал по вагонам и оболочке**

Для каждого вагона и для оболочки-поезда (дверь, индикатор) привести классы/разметку к макету (декоративные теги, подтёки, трафарет, вид двери). Менять только представление; пропсы, данные из `content/site.ts` и логику навигации не трогать.

- [ ] **Step 4: Прогнать тесты — структура не должна сломаться**

Run: `npm test`
Expected: все тесты проходят (они проверяют контент и поведение, а не пиксели).

- [ ] **Step 5: Проверить сборку и вид в браузере**

Run: `npm run build && npm run dev`
Сверить оба режима с макетами на десктопе и мобильном.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Наложить финальный дизайн из Claude Design"
```

---

## Фаза 6. Деплой

### Task 23: Деплой на Vercel

Действия владельца (backend-разработчик справится); внешние действия с аккаунтом не автоматизируются.

**Files:** —

- [ ] **Step 1: Запушить репозиторий на GitHub/GitLab**

```bash
git remote add origin <адрес-репозитория>
git push -u origin main
```

- [ ] **Step 2: Подключить проект в Vercel**

В панели Vercel: New Project → импортировать репозиторий. Vercel сам определит Next.js.

- [ ] **Step 3: Задать переменные окружения в Vercel**

Добавить (Production): `SITE_MODE=teaser`, `TELEGRAM_BOT_TOKEN=<токен>`, `TELEGRAM_CHAT_ID=<id>`. `NEXT_PUBLIC_API_BASE_URL` пока можно оставить пустым.

- [ ] **Step 4: Задеплоить и проверить**

Дождаться сборки. Открыть выданный URL, проверить: показывается тизер, отсчёт идёт, форма предрегистрации присылает заявку в Telegram.

- [ ] **Step 5: Проверить переключение режима**

В день открытия сменить в Vercel `SITE_MODE` на `live` и передеплоить (redeploy). Убедиться, что сайт переключился на режим «работаем».

---

## Итог

После Task 23 у клуба есть рабочий лендинг в режиме «тизер», принимающий предрегистрации, готовый к переключению в «работаем» и к наложению финального дизайна из Claude Design. Дальнейшее — Этап 2 (онлайн-бронирование, Python-бэкенд, интеграция с Gizmo), отдельным циклом.
