"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Неоновая вывеска на стене: рамка-«трубка» из цилиндров со светящимся
// материалом (подхватывается bloom) и буквы в столбик. Изредка подмигивает,
// как настоящий неон.

const SIGN_W = 0.55;
const SIGN_H = 1.7;
const TUBE_R = 0.016;

function fontFamily(varName: string, fallback: string): string {
  const v = getComputedStyle(document.body).getPropertyValue(varName).trim();
  return v || fallback;
}

// Буквы в столбик: яркое «ядро» с кислотным ореолом на прозрачном фоне.
function makeLettersTexture(text: string): THREE.CanvasTexture {
  const w = 256;
  const h = 1024;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  const display = fontFamily("--font-oswald", "Impact, sans-serif");

  const chars = [...text];
  const step = h / (chars.length + 0.4);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${Math.min(180, step * 0.82)}px ${display}`;
  chars.forEach((ch, i) => {
    const y = step * (i + 0.7);
    ctx.shadowColor = "rgba(182,255,26,0.9)";
    ctx.shadowBlur = 34;
    ctx.fillStyle = "#f2ffd0";
    ctx.fillText(ch, w / 2, y);
    // второй проход усиливает ореол
    ctx.fillText(ch, w / 2, y);
    ctx.shadowBlur = 0;
  });

  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function NeonSign({
  position,
  text = "САЛОН",
}: {
  position: [number, number, number];
  text?: string;
}) {
  const letters = useMemo(() => makeLettersTexture(text), [text]);
  const tubeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#b6ff1a",
        emissive: "#b6ff1a",
        emissiveIntensity: 1.6,
        toneMapped: false,
      }),
    [],
  );
  const glow = useRef<THREE.PointLight>(null);
  const t = useRef(0);

  useFrame((_, dt) => {
    t.current += dt;
    // Редкое подмигивание: комбинация синусов даёт нерегулярные провалы.
    const x = t.current;
    const dip = Math.sin(x * 13.7) * Math.sin(x * 7.3) * Math.sin(x * 3.1);
    const level = dip > 0.93 ? 0.35 : 1;
    tubeMat.emissiveIntensity = 1.6 * level;
    if (glow.current) glow.current.intensity = 1.4 * level;
  });

  const hw = SIGN_W / 2;
  const hh = SIGN_H / 2;

  return (
    <group position={position} rotation={[0, Math.PI / 2, 0]}>
      {/* вертикальные трубки */}
      {[-hw, hw].map((x) => (
        <mesh key={`v${x}`} position={[x, 0, 0]} material={tubeMat}>
          <cylinderGeometry args={[TUBE_R, TUBE_R, SIGN_H, 10]} />
        </mesh>
      ))}
      {/* горизонтальные трубки */}
      {[-hh, hh].map((y) => (
        <mesh
          key={`h${y}`}
          position={[0, y, 0]}
          rotation={[0, 0, Math.PI / 2]}
          material={tubeMat}
        >
          <cylinderGeometry args={[TUBE_R, TUBE_R, SIGN_W, 10]} />
        </mesh>
      ))}
      {/* уголки */}
      {[-hw, hw].flatMap((x) =>
        [-hh, hh].map((y) => (
          <mesh key={`c${x}${y}`} position={[x, y, 0]} material={tubeMat}>
            <sphereGeometry args={[TUBE_R, 8, 8]} />
          </mesh>
        )),
      )}
      {/* буквы */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[SIGN_W * 0.8, SIGN_H * 0.92]} />
        <meshBasicMaterial map={letters} transparent toneMapped={false} />
      </mesh>
      {/* засветка на стену */}
      <pointLight ref={glow} position={[0, 0, 0.4]} intensity={1.4} distance={2.4} color="#b6ff1a" />
    </group>
  );
}
