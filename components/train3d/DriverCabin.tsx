"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

// Торец «головы» поезда за вагоном 00 — переборка кабины машиниста вместо
// пустой темноты: дверь со служебной табличкой, окошко с тлеющей приборной
// подсветкой и мигающий индикатор. Дверь не открывается — это граница мира.

const DW = 0.9; // дверь кабины
const DH = 2.05;

function fontFamily(varName: string, fallback: string): string {
  const v = getComputedStyle(document.body).getPropertyValue(varName).trim();
  return v || fallback;
}

// Табличка «КАБИНА МАШИНИСТА».
function makeCabinSign(): THREE.CanvasTexture {
  const w = 512;
  const h = 96;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  const display = fontFamily("--font-oswald", "Impact, sans-serif");
  ctx.fillStyle = "#0d0d0d";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#b6ff1a";
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, w - 12, h - 12);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "8px";
  ctx.font = `600 44px ${display}`;
  ctx.fillStyle = "#b6ff1a";
  ctx.fillText("КАБИНА МАШИНИСТА", w / 2, h / 2 + 2);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Окошко двери: тёмная кабина с огоньками приборной панели.
function makeCabinWindow(): THREE.CanvasTexture {
  const s = 256;
  const cv = document.createElement("canvas");
  cv.width = s;
  cv.height = s;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, s);
  g.addColorStop(0, "#071009");
  g.addColorStop(1, "#030503");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  // силуэт пульта
  ctx.fillStyle = "#0a120b";
  ctx.fillRect(0, s * 0.62, s, s * 0.38);
  // огоньки приборов
  const dots: Array<[number, number, string]> = [
    [40, 190, "#b6ff1a"],
    [70, 200, "#eafcc7"],
    [104, 186, "#b6ff1a"],
    [150, 198, "#7fae12"],
    [186, 190, "#eafcc7"],
    [216, 202, "#b6ff1a"],
  ];
  for (const [x, y, c] of dots) {
    ctx.shadowColor = c;
    ctx.shadowBlur = 10;
    ctx.fillStyle = c;
    ctx.fillRect(x, y, 6, 4);
  }
  ctx.shadowBlur = 0;
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Предупреждающие полосы (низ двери).
function makeStripes(): THREE.CanvasTexture {
  const w = 256;
  const h = 64;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#101010";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#b6ff1a";
  for (let x = -h; x < w; x += 44) {
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.lineTo(x + 18, h);
    ctx.lineTo(x + 18 + h, 0);
    ctx.lineTo(x + h, 0);
    ctx.closePath();
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function DriverCabin({ z, w, h }: { z: number; w: number; h: number }) {
  const sign = useMemo(() => makeCabinSign(), []);
  const win = useMemo(() => makeCabinWindow(), []);
  const stripes = useMemo(() => makeStripes(), []);
  const [metalNor, metalRough] = useTexture([
    "/textures/metal_plate_nor_gl_1k.jpg",
    "/textures/metal_plate_rough_1k.jpg",
  ]);
  const nor = useMemo(() => {
    const t = metalNor.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 1.5);
    t.needsUpdate = true;
    return t;
  }, [metalNor]);
  const rough = useMemo(() => {
    const t = metalRough.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 1.5);
    t.needsUpdate = true;
    return t;
  }, [metalRough]);

  const winMat = useRef<THREE.MeshBasicMaterial>(null);
  const lampMat = useRef<THREE.MeshStandardMaterial>(null);
  const t = useRef(0);

  useFrame((_, dt) => {
    t.current += dt;
    const x = t.current;
    // тлеющая подсветка кабины и редкое мигание служебного индикатора
    if (winMat.current) {
      winMat.current.color.setScalar(0.8 + 0.2 * Math.sin(x * 1.7) * Math.sin(x * 0.9));
    }
    if (lampMat.current) {
      lampMat.current.emissiveIntensity = Math.sin(x * 2.6) > 0.65 ? 1.2 : 0.25;
    }
  });

  return (
    <group position={[0, 0, z]}>
      {/* стена торца */}
      <mesh position={[0, h / 2, 0]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          color="#161816"
          metalness={0.4}
          roughness={0.7}
          normalMap={nor}
          roughnessMap={rough}
        />
      </mesh>
      {/* рама и дверь кабины */}
      <mesh position={[0, DH / 2, 0.03]}>
        <boxGeometry args={[DW + 0.14, DH + 0.1, 0.05]} />
        <meshStandardMaterial color="#0c0e0c" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, DH / 2, 0.06]}>
        <boxGeometry args={[DW, DH, 0.05]} />
        <meshStandardMaterial
          color="#101210"
          metalness={0.55}
          roughness={0.5}
          normalMap={nor}
          roughnessMap={rough}
        />
      </mesh>
      {/* окошко с приборной подсветкой */}
      <mesh position={[0, 1.55, 0.085]}>
        <boxGeometry args={[0.4, 0.54, 0.02]} />
        <meshStandardMaterial color="#050505" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.55, 0.097]}>
        <planeGeometry args={[0.34, 0.48]} />
        <meshBasicMaterial ref={winMat} map={win} toneMapped={false} />
      </mesh>
      {/* ручка */}
      <mesh position={[0.34, 1.02, 0.1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 0.16, 8]} />
        <meshStandardMaterial color="#2a2d2a" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* предупреждающие полосы снизу двери */}
      <mesh position={[0, 0.24, 0.09]}>
        <planeGeometry args={[DW - 0.08, 0.2]} />
        <meshStandardMaterial map={stripes} roughness={0.7} />
      </mesh>
      {/* табличка над дверью */}
      <mesh position={[0, DH + 0.32, 0.03]}>
        <planeGeometry args={[1.3, 0.24]} />
        <meshBasicMaterial map={sign} toneMapped={false} />
      </mesh>
      {/* служебный индикатор (мигает) и дежурный огонёк */}
      <mesh position={[-0.75, DH + 0.32, 0.04]}>
        <boxGeometry args={[0.07, 0.07, 0.03]} />
        <meshStandardMaterial
          ref={lampMat}
          color="#b6ff1a"
          emissive="#b6ff1a"
          emissiveIntensity={0.25}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.75, DH + 0.32, 0.04]}>
        <boxGeometry args={[0.07, 0.07, 0.03]} />
        <meshStandardMaterial
          color="#eafcc7"
          emissive="#eafcc7"
          emissiveIntensity={0.5}
          toneMapped={false}
        />
      </mesh>
      {/* лёгкая подсветка зоны двери */}
      <pointLight position={[0, 1.6, 0.7]} intensity={2.2} distance={3.2} color="#cfe9a0" />
    </group>
  );
}
