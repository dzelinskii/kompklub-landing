"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Вертикальный экран-«телевизор» на стене вагона 00. Если по адресу
// /video/promo.mp4 лежит ролик — крутится он (VideoTexture); пока файла нет,
// работает встроенная канвас-заставка: слайды с глитч-полосой и сканлайнами.

const SCREEN_W = 0.66; // м
const SCREEN_H = 1.18; // м

function fontFamily(varName: string, fallback: string): string {
  const v = getComputedStyle(document.body).getPropertyValue(varName).trim();
  return v || fallback;
}

const SLIDES: [string, string][] = [
  ["СКОРО", "ОТКРЫТИЕ"],
  ["RTX 40", "240 ГЦ"],
  ["[LOGO]", "ЖДЁТ ТЕБЯ"],
];

function makeScreenCanvas() {
  const w = 512;
  const h = 912;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  const texture = new THREE.CanvasTexture(cv);
  texture.colorSpace = THREE.SRGBColorSpace;

  function draw(t: number) {
    const display = fontFamily("--font-oswald", "Impact, sans-serif");
    ctx.fillStyle = "#04070a";
    ctx.fillRect(0, 0, w, h);

    // Текущий слайд
    const slide = SLIDES[Math.floor(t / 2.4) % SLIDES.length];
    ctx.textAlign = "center";
    ctx.font = `700 96px ${display}`;
    ctx.fillStyle = "#b6ff1a";
    ctx.shadowColor = "rgba(182,255,26,0.6)";
    ctx.shadowBlur = 24;
    ctx.fillText(slide[0], w / 2, h / 2 - 30);
    ctx.shadowBlur = 0;
    ctx.font = `600 64px ${display}`;
    ctx.fillStyle = "#ededed";
    ctx.fillText(slide[1], w / 2, h / 2 + 70);

    // Бегущая глитч-полоса
    const gy = ((t * 160) % (h + 80)) - 40;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(0, gy, w, 10);
    ctx.fillStyle = "rgba(182,255,26,0.10)";
    ctx.fillRect(0, gy + 14, w, 4);

    // Редкий «шум»
    for (let i = 0; i < 4; i++) {
      const ny = Math.random() * h;
      ctx.fillStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.05})`;
      ctx.fillRect(Math.random() * w * 0.5, ny, w * (0.2 + Math.random() * 0.5), 2);
    }

    // Сканлайны
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);

    // Статусная строка с миганием
    ctx.textAlign = "left";
    ctx.font = `600 26px ${display}`;
    ctx.fillStyle = Math.floor(t * 2) % 2 ? "#b6ff1a" : "#375211";
    ctx.fillText("● LIVE", 24, h - 28);

    texture.needsUpdate = true;
  }

  return { texture, draw };
}

export function WallTV({ position }: { position: [number, number, number] }) {
  const screen = useMemo(() => makeScreenCanvas(), []);
  const [videoTex, setVideoTex] = useState<THREE.VideoTexture | null>(null);
  const time = useRef(0);
  const lastDraw = useRef(-1);

  // Пробуем настоящее видео; при отсутствии файла остаёмся на заставке.
  useEffect(() => {
    const video = document.createElement("video");
    video.src = "/video/promo.mp4";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    const onCanPlay = () => {
      video.play().catch(() => {});
      const t = new THREE.VideoTexture(video);
      t.colorSpace = THREE.SRGBColorSpace;
      setVideoTex(t);
    };
    video.addEventListener("canplay", onCanPlay);
    return () => {
      video.removeEventListener("canplay", onCanPlay);
      video.pause();
      video.removeAttribute("src");
    };
  }, []);

  useFrame((_, dt) => {
    if (videoTex) return;
    time.current += dt;
    // Заставке хватает ~15 кадров в секунду
    if (time.current - lastDraw.current > 1 / 15) {
      lastDraw.current = time.current;
      screen.draw(time.current);
    }
  });

  return (
    <group position={position} rotation={[0, Math.PI / 2, 0]}>
      {/* корпус */}
      <mesh castShadow>
        <boxGeometry args={[SCREEN_W + 0.12, SCREEN_H + 0.14, 0.07]} />
        <meshStandardMaterial color="#0d0d0d" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* экран — светится сам (не зависит от ламп) */}
      <mesh position={[0, 0, 0.045]}>
        <planeGeometry args={[SCREEN_W, SCREEN_H]} />
        <meshBasicMaterial map={videoTex ?? screen.texture} toneMapped={false} />
      </mesh>
      {/* мягкая подсветка стены от экрана */}
      <pointLight position={[0, 0, 0.5]} intensity={1.6} distance={2.2} color="#9fd44a" />
    </group>
  );
}
