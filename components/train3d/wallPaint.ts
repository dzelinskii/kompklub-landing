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

// Фабрики «краски» по индексу вагона; undefined — секция остаётся пустой тёмной.
export const WAGON_PAINTS: Array<(() => THREE.CanvasTexture) | undefined> = [
  makeWagon00Paint,
  makeWagon01Paint,
  makeWagon02Paint,
];
