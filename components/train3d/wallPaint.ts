import * as THREE from "three";

// «Краска» на стене: статичный контент вагонов рисуется в canvas-текстуры и
// становится частью 3D-мира — его заслоняют поручни, на него ложится свет и
// туман, он виден в пролёте под любым углом. Интерактив (кнопки/формы) остаётся
// живым DOM и проявляется на парковке (см. wagonContent).
//
// Секция стены 6×3 м → канвас 2048×1024 (~341 px/м): текст чёткий с расстояния
// парковки камеры (~2.7 м).

const W_PX = 2048;
const H_PX = 1024;

type Fonts = { display: string; body: string };

// Семейство шрифта из CSS-переменной next/font с запасным вариантом: в ctx.font
// CSS-переменные не работают, поэтому читаем вычисленное значение.
function fontFamily(varName: string, fallback: string): string {
  const v = getComputedStyle(document.body).getPropertyValue(varName).trim();
  return v || fallback;
}

// Общий каркас: тёмная закраска фоном, отрисовка сразу и повторно после
// загрузки web-шрифтов.
function createPaint(
  draw: (ctx: CanvasRenderingContext2D, fonts: Fonts) => void,
): THREE.CanvasTexture {
  const cv = document.createElement("canvas");
  cv.width = W_PX;
  cv.height = H_PX;
  const ctx = cv.getContext("2d")!;
  const texture = new THREE.CanvasTexture(cv);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  const paint = () => {
    const fonts: Fonts = {
      display: fontFamily("--font-oswald", "Impact, sans-serif"),
      body: fontFamily("--font-inter", "Arial, sans-serif"),
    };
    ctx.fillStyle = "#141614";
    ctx.fillRect(0, 0, W_PX, H_PX);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.letterSpacing = "0px";
    draw(ctx, fonts);
    texture.needsUpdate = true;
  };

  paint();
  document.fonts.ready.then(paint).catch(() => {});
  return texture;
}

// Перенос текста по словам. Возвращает y-координату последней строки.
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const word of words) {
    const probe = line ? line + " " + word : word;
    if (line && ctx.measureText(probe).width > maxWidth) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = probe;
    }
  }
  if (line) ctx.fillText(line, x, yy);
  return yy;
}

// Вагон 00 · Платформа (hero). Ниже текста оставлена зона под DOM-кнопку.
export function makeWagon00Paint(): THREE.CanvasTexture {
  return createPaint((ctx, fonts) => {
    const left = 554; // левый край блока (~1.4 м левее центра секции)

    ctx.letterSpacing = "10px";
    ctx.font = `600 30px ${fonts.display}`;
    ctx.fillStyle = "#9a9a9a";
    ctx.fillText("НОЧНОЕ ДЕПО · ПЛАТФОРМА 00 · ПОСАДКА ОТКРЫТА", left, 225);
    ctx.letterSpacing = "0px";

    // [LOGO] — крупно, с наклоном, жёсткой тенью и свечением
    ctx.save();
    ctx.translate(left, 445);
    ctx.rotate((-3 * Math.PI) / 180);
    ctx.font = `700 185px ${fonts.display}`;
    ctx.fillStyle = "#0a0a0a";
    ctx.fillText("[LOGO]", 8, 9);
    ctx.shadowColor = "rgba(182,255,26,0.45)";
    ctx.shadowBlur = 40;
    ctx.fillStyle = "#b6ff1a";
    ctx.fillText("[LOGO]", 0, 0);
    ctx.restore();

    ctx.font = `600 60px ${fonts.display}`;
    ctx.fillStyle = "#ededed";
    ctx.fillText("ИГРОВОЙ КЛУБ, КОТОРЫЙ", left, 575);
    ctx.fillText("ИДЁТ ПО СВОЕМУ МАРШРУТУ", left, 645);

    ctx.font = `400 33px ${fonts.body}`;
    ctx.fillStyle = "#9a9a9a";
    ctx.fillText("Семь вагонов, одна ветка. Ныряй в первую дверь —", left, 725);
    ctx.fillText("и двигайся вглубь поезда, из вагона в вагон.", left, 772);
  });
}

// Вагон 01 · О клубе: заголовок, абзац и три карточки-«постера».
export function makeWagon01Paint(): THREE.CanvasTexture {
  return createPaint((ctx, fonts) => {
    const cardW = 380;
    const cardH = 330;
    const gap = 40;
    const left = (W_PX - (cardW * 3 + gap * 2)) / 2; // блок по центру секции

    ctx.letterSpacing = "10px";
    ctx.font = `600 30px ${fonts.display}`;
    ctx.fillStyle = "#b6ff1a";
    ctx.fillText("ВАГОН 01 · САЛОН", left, 195);
    ctx.letterSpacing = "0px";

    ctx.font = `700 64px ${fonts.display}`;
    ctx.fillStyle = "#ededed";
    ctx.fillText("НЕ ЗАЛ С КОМПАМИ.", left, 285);
    ctx.fillStyle = "#b6ff1a";
    ctx.fillText("ЭТО СТАНЦИЯ ДЛЯ СВОИХ.", left, 360);

    ctx.font = `400 32px ${fonts.body}`;
    ctx.fillStyle = "#9a9a9a";
    wrapText(
      ctx,
      "Приглушённый свет, гул кулеров и стены в тегах. Место, куда хочется вернуться после каждого матча — с железом, которое не подведёт.",
      left,
      425,
      1150,
      44,
    );

    const cards = [
      {
        n: "01",
        t: "ТОП-ЖЕЛЕЗО",
        d: "RTX 40-й серии, мониторы 180–240 Гц, интернет без лагов.",
      },
      {
        n: "02",
        t: "ПЕРИФЕРИЯ",
        d: "Механика, лёгкие мыши, качественный звук в каждой гарнитуре.",
      },
      {
        n: "03",
        t: "АТМОСФЕРА",
        d: "Уличный арт на стенах, бар всю ночь и живое комьюнити.",
      },
    ];
    const top = 540;
    cards.forEach((c, i) => {
      const x = left + i * (cardW + gap);
      ctx.fillStyle = "rgba(18,20,18,0.92)";
      ctx.fillRect(x, top, cardW, cardH);
      ctx.strokeStyle = "#2a2a2a";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, top + 1, cardW - 2, cardH - 2);
      ctx.fillStyle = "#b6ff1a";
      ctx.fillRect(x, top, cardW, 6);

      ctx.font = `600 26px ${fonts.display}`;
      ctx.fillStyle = "#b6ff1a";
      ctx.fillText(c.n, x + 28, top + 64);
      ctx.font = `700 40px ${fonts.display}`;
      ctx.fillStyle = "#ededed";
      ctx.fillText(c.t, x + 28, top + 130);
      ctx.font = `400 26px ${fonts.body}`;
      ctx.fillStyle = "#9a9a9a";
      wrapText(ctx, c.d, x + 28, top + 180, cardW - 56, 36);
    });
  });
}

// Вагон 02 · Шоурум сетапа: перед стеной стоит ПК-сетап (PCSetup), поэтому
// текст — только в верхней части секции, над столом и монитором.
export function makeWagon02Paint(): THREE.CanvasTexture {
  return createPaint((ctx, fonts) => {
    ctx.textAlign = "center";
    const cx = W_PX / 2;

    ctx.letterSpacing = "10px";
    ctx.font = `600 30px ${fonts.display}`;
    ctx.fillStyle = "#b6ff1a";
    ctx.fillText("ВАГОН 02 · ШОУРУМ", cx, 175);
    ctx.letterSpacing = "0px";

    ctx.font = `700 64px ${fonts.display}`;
    ctx.fillStyle = "#ededed";
    ctx.fillText("ТВОЁ МЕСТО ВЫГЛЯДИТ ТАК", cx, 265);

    ctx.font = `400 32px ${fonts.body}`;
    ctx.fillStyle = "#9a9a9a";
    ctx.fillText("Железо, за которое не стыдно. Садись и играй.", cx, 330);
    ctx.textAlign = "left";
  });
}

// Вагон 03 · Зоны: пять карточек-витрин с ценами.
export function makeWagon03Paint(): THREE.CanvasTexture {
  return createPaint((ctx, fonts) => {
    const cardW = 350;
    const cardH = 560;
    const gap = 30;
    const left = (W_PX - (cardW * 5 + gap * 4)) / 2;

    ctx.letterSpacing = "10px";
    ctx.font = `600 30px ${fonts.display}`;
    ctx.fillStyle = "#b6ff1a";
    ctx.fillText("ВАГОН 03 · ВИТРИНА", left, 170);
    ctx.letterSpacing = "0px";
    ctx.font = `700 58px ${fonts.display}`;
    ctx.fillStyle = "#ededed";
    ctx.fillText("ВЫБЕРИ СВОЮ ЗОНУ", left, 255);

    const zones = [
      { t: "СТАНДАРТ", d: "Основной зал на 24 места. Ровный пинг, удобные кресла.", s: "RTX 4070 · 180 ГЦ", p: "от 150 ₽/час" },
      { t: "VIP", d: "Реклайнеры, приватный свет и максимальные настройки графики.", s: "RTX 4080 · 240 ГЦ · 49″", p: "от 300 ₽/час" },
      { t: "КОНСОЛИ", d: "Диваны, большие экраны, компания. PS5 и Xbox наготове.", s: "PS5 · XBOX · 65″ OLED", p: "от 250 ₽/час" },
      { t: "БУТКЕМП", d: "Приватная комната на 5 мест — для команд и тренировок.", s: "ГОЛОСОВАЯ · ДОСКА", p: "от 1200 ₽/час" },
      { t: "БАР", d: "Кофе, энергетики и стрит-фуд. Топливо для ночных заездов.", s: "РАБОТАЕТ ВСЮ НОЧЬ", p: "от 90 ₽" },
    ];
    const top = 330;
    zones.forEach((z, i) => {
      const x = left + i * (cardW + gap);
      ctx.fillStyle = "rgba(16,18,16,0.92)";
      ctx.fillRect(x, top, cardW, cardH);
      ctx.strokeStyle = "#2a2a2a";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, top + 1, cardW - 2, cardH - 2);
      ctx.fillStyle = "#b6ff1a";
      ctx.fillRect(x, top, cardW, 6);

      ctx.font = `700 40px ${fonts.display}`;
      ctx.fillStyle = "#ededed";
      ctx.fillText(z.t, x + 26, top + 74);
      ctx.font = `400 24px ${fonts.body}`;
      ctx.fillStyle = "#9a9a9a";
      wrapText(ctx, z.d, x + 26, top + 130, cardW - 52, 33);
      ctx.strokeStyle = "#2a2a2a";
      ctx.beginPath();
      ctx.moveTo(x + 26, top + cardH - 118);
      ctx.lineTo(x + cardW - 26, top + cardH - 118);
      ctx.stroke();
      ctx.font = `600 23px ${fonts.display}`;
      ctx.fillStyle = "#ededed";
      ctx.fillText(z.s, x + 26, top + cardH - 78);
      ctx.font = `700 36px ${fonts.display}`;
      ctx.fillStyle = "#b6ff1a";
      ctx.fillText(z.p, x + 26, top + cardH - 28);
    });
  });
}

// Вагон 04 · Цены: три «билета» с перфорированным краем, ночной — хит.
export function makeWagon04Paint(): THREE.CanvasTexture {
  return createPaint((ctx, fonts) => {
    const tw = 560;
    const th = 520;
    const gap = 60;
    const left = (W_PX - (tw * 3 + gap * 2)) / 2;

    ctx.letterSpacing = "10px";
    ctx.font = `600 30px ${fonts.display}`;
    ctx.fillStyle = "#b6ff1a";
    ctx.fillText("ВАГОН 04 · КАССА", left, 170);
    ctx.letterSpacing = "0px";
    ctx.font = `700 58px ${fonts.display}`;
    ctx.fillStyle = "#ededed";
    ctx.fillText("БИЛЕТ НА ЗАЕЗД", left, 255);

    const tickets = [
      { tag: "ТАРИФ", t: "ДНЕВНОЙ", time: "10:00 — 22:00", p: "150 ₽", per: "/час", n: "Будни · стандарт-зона · без брони", hit: false },
      { tag: "ТАРИФ · ХИТ", t: "НОЧНОЙ", time: "22:00 — 10:00", p: "800 ₽", per: "/ночь", n: "Безлимит до утра · любая зона · вода в подарок", hit: true },
      { tag: "ПАКЕТ", t: "5 ЧАСОВ", time: "в любое время", p: "600 ₽", per: "", n: "Экономия 25% · не сгорает в течение месяца", hit: false },
    ];
    const top = 330;
    tickets.forEach((tk, i) => {
      const x = left + i * (tw + gap);
      if (tk.hit) {
        ctx.shadowColor = "rgba(182,255,26,0.5)";
        ctx.shadowBlur = 40;
      }
      ctx.fillStyle = "#101210";
      ctx.fillRect(x, top, tw, th);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = tk.hit ? "#b6ff1a" : "#2a2a2a";
      ctx.lineWidth = tk.hit ? 3 : 2;
      ctx.strokeRect(x + 1, top + 1, tw - 2, th - 2);
      // перфорированный край билета
      ctx.fillStyle = "#b6ff1a";
      for (let y = top + 10; y < top + th - 10; y += 24) {
        ctx.fillRect(x + 8, y, 14, 12);
      }

      const cx = x + 56;
      ctx.letterSpacing = "6px";
      ctx.font = `600 24px ${fonts.display}`;
      ctx.fillStyle = tk.hit ? "#b6ff1a" : "#9a9a9a";
      ctx.fillText(tk.tag, cx, top + 66);
      ctx.letterSpacing = "0px";
      ctx.font = `700 56px ${fonts.display}`;
      ctx.fillStyle = "#ededed";
      ctx.fillText(tk.t, cx, top + 140);
      ctx.font = `600 26px ${fonts.display}`;
      ctx.fillStyle = "#9a9a9a";
      ctx.fillText(tk.time, cx, top + 185);

      ctx.font = `700 84px ${fonts.display}`;
      ctx.fillStyle = "#b6ff1a";
      ctx.fillText(tk.p, cx, top + 300);
      if (tk.per) {
        const w = ctx.measureText(tk.p).width;
        ctx.font = `600 30px ${fonts.display}`;
        ctx.fillStyle = "#9a9a9a";
        ctx.fillText(tk.per, cx + w + 12, top + 300);
      }

      // пунктирный отрыв и примечание
      ctx.strokeStyle = "#2a2a2a";
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(cx, top + 360);
      ctx.lineTo(x + tw - 30, top + 360);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = `400 24px ${fonts.body}`;
      ctx.fillStyle = "#9a9a9a";
      wrapText(ctx, tk.n, cx, top + 410, tw - 100, 34);
    });
  });
}

// Вагон 05 · Галерея: заголовок сверху, ниже на стене висят 3D-лайтбоксы.
export function makeWagon05Paint(): THREE.CanvasTexture {
  return createPaint((ctx, fonts) => {
    ctx.textAlign = "center";
    const cx = W_PX / 2;
    ctx.letterSpacing = "10px";
    ctx.font = `600 30px ${fonts.display}`;
    ctx.fillStyle = "#b6ff1a";
    ctx.fillText("ВАГОН 05 · ВИДЫ ИЗ ОКОН", cx, 170);
    ctx.letterSpacing = "0px";
    ctx.font = `700 64px ${fonts.display}`;
    ctx.fillStyle = "#ededed";
    ctx.fillText("ГАЛЕРЕЯ", cx, 262);
    ctx.font = `400 30px ${fonts.body}`;
    ctx.fillStyle = "#9a9a9a";
    ctx.fillText("Первые кадры клуба — скоро добавим больше.", cx, 322);
    ctx.textAlign = "left";
  });
}

// Вагон 06 · Станция: табло назначения с адресом и часами.
export function makeWagon06Paint(): THREE.CanvasTexture {
  return createPaint((ctx, fonts) => {
    const bx = 350;
    const bw = 1350;

    ctx.letterSpacing = "10px";
    ctx.font = `600 30px ${fonts.display}`;
    ctx.fillStyle = "#b6ff1a";
    ctx.fillText("ВАГОН 06 · КОНЕЧНАЯ СТАНЦИЯ", bx, 160);
    ctx.letterSpacing = "0px";

    // корпус табло
    ctx.fillStyle = "rgba(11,11,11,0.94)";
    ctx.fillRect(bx, 210, bw, 640);
    ctx.strokeStyle = "#2a2a2a";
    ctx.lineWidth = 2;
    ctx.strokeRect(bx + 1, 211, bw - 2, 638);

    ctx.letterSpacing = "8px";
    ctx.font = `600 28px ${fonts.display}`;
    ctx.fillStyle = "#9a9a9a";
    ctx.fillText("ТАБЛО НАЗНАЧЕНИЯ", bx + 40, 280);
    ctx.fillStyle = "#b6ff1a";
    ctx.fillText("В ПУТИ", bx + bw - 190, 280);
    ctx.letterSpacing = "0px";
    ctx.strokeStyle = "#2a2a2a";
    ctx.beginPath();
    ctx.moveTo(bx + 40, 310);
    ctx.lineTo(bx + bw - 40, 310);
    ctx.stroke();

    const rows: [string, string, string][] = [
      ["ПУНКТ", "ИГРОВОЙ КЛУБ «[LOGO]»", "#ededed"],
      ["АДРЕС", "Г. ГОРОД, УЛ. УЛИЦА, Д. 0", "#b6ff1a"],
      ["ЧАСЫ", "ЕЖЕДНЕВНО 12:00–00:00", "#ededed"],
      ["ПЛАТФОРМА", "00 · ВХОД СО ДВОРА", "#ededed"],
    ];
    rows.forEach(([k, v, c], i) => {
      const y = 385 + i * 105;
      ctx.font = `600 34px ${fonts.display}`;
      ctx.fillStyle = "#5a5a5a";
      ctx.fillText(k, bx + 40, y);
      ctx.font = `600 40px ${fonts.display}`;
      ctx.fillStyle = c;
      ctx.fillText(v, bx + 340, y);
      if (i < rows.length - 1) {
        ctx.strokeStyle = "#1c1c1c";
        ctx.beginPath();
        ctx.moveTo(bx + 40, y + 32);
        ctx.lineTo(bx + bw - 40, y + 32);
        ctx.stroke();
      }
    });
    // кнопка «Открыть в Яндекс.Картах» — живой DOM поверх, ниже табло
  });
}

// Вагон 07 · Контакты: заголовок краской, ссылки и форма — живым DOM.
export function makeWagon07Paint(): THREE.CanvasTexture {
  return createPaint((ctx, fonts) => {
    const left = 300;
    ctx.letterSpacing = "10px";
    ctx.font = `600 30px ${fonts.display}`;
    ctx.fillStyle = "#b6ff1a";
    ctx.fillText("ВАГОН 07 · БУДКА ПРОВОДНИКА", left, 180);
    ctx.letterSpacing = "0px";
    ctx.font = `700 76px ${fonts.display}`;
    ctx.fillStyle = "#ededed";
    ctx.fillText("НА СВЯЗИ", left, 290);
    ctx.font = `400 30px ${fonts.body}`;
    ctx.fillStyle = "#9a9a9a";
    ctx.fillText("Оставь контакт — позовём на предпоказ перед открытием.", left, 350);
  });
}

// Фабрики «краски» по индексу вагона; undefined — секция остаётся пустой тёмной.
export const WAGON_PAINTS: Array<(() => THREE.CanvasTexture) | undefined> = [
  makeWagon00Paint,
  makeWagon01Paint,
  makeWagon02Paint,
  makeWagon03Paint,
  makeWagon04Paint,
  makeWagon05Paint,
  makeWagon06Paint,
  makeWagon07Paint,
];
