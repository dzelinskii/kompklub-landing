"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Эскиз ПК-сетапа для вагона-шоурума: стол у контентной стены, монитор с
// «геймплейной» заставкой, системник с LED-полосой, клавиатура, мышь и кресло.
// Собран из примитивов-заглушек — расстановку и масштаб оцениваем сейчас,
// позже заменяем детали готовыми .glb-моделями.

function fontFamily(varName: string, fallback: string): string {
  const v = getComputedStyle(document.body).getPropertyValue(varName).trim();
  return v || fallback;
}

// Заставка на мониторе: сетка-«горизонт», прицел и полоса счёта.
function makeGameScreen(): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  const display = fontFamily("--font-oswald", "Impact, sans-serif");

  ctx.fillStyle = "#050a05";
  ctx.fillRect(0, 0, w, h);

  // перспективная сетка
  ctx.strokeStyle = "rgba(182,255,26,0.5)";
  ctx.lineWidth = 1;
  const horizon = h * 0.45;
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(w / 2 + i * 26, h);
    ctx.lineTo(w / 2 + i * 7, horizon);
    ctx.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const y = horizon + (h - horizon) * (i / 6) ** 1.7;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  // «солнце»
  ctx.fillStyle = "rgba(182,255,26,0.25)";
  ctx.beginPath();
  ctx.arc(w / 2, horizon - 26, 40, 0, Math.PI * 2);
  ctx.fill();
  // прицел
  ctx.strokeStyle = "#ededed";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 10, h / 2);
  ctx.lineTo(w / 2 + 10, h / 2);
  ctx.moveTo(w / 2, h / 2 - 10);
  ctx.lineTo(w / 2, h / 2 + 10);
  ctx.stroke();
  // HUD
  ctx.font = `600 24px ${display}`;
  ctx.fillStyle = "#b6ff1a";
  ctx.fillText("240 FPS", 16, 34);
  ctx.textAlign = "right";
  ctx.fillText("K/D 2.4", w - 16, 34);

  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function PCSetup({ z }: { z: number }) {
  const screenTex = useMemo(() => makeGameScreen(), []);
  const screenMat = useRef<THREE.MeshBasicMaterial>(null);
  const deskMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#151715", metalness: 0.3, roughness: 0.55 }),
    [],
  );
  const darkMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#101210", metalness: 0.5, roughness: 0.45 }),
    [],
  );
  const t = useRef(0);

  // Лёгкая пульсация экрана — «живой» монитор.
  useFrame((_, dt) => {
    t.current += dt;
    if (screenMat.current) {
      screenMat.current.color.setScalar(0.92 + 0.08 * Math.sin(t.current * 2.2));
    }
  });

  return (
    <group position={[0, 0, z]}>
      {/* столешница и ноги */}
      <mesh position={[-1.5, 0.74, 0]} material={deskMat} castShadow>
        <boxGeometry args={[0.7, 0.04, 1.6]} />
      </mesh>
      {[
        [-1.82, -0.74],
        [-1.82, 0.74],
        [-1.18, -0.74],
        [-1.18, 0.74],
      ].map(([x, dz]) => (
        <mesh key={`${x}${dz}`} position={[x, 0.36, dz]} material={darkMat}>
          <boxGeometry args={[0.05, 0.72, 0.05]} />
        </mesh>
      ))}

      {/* монитор: стойка, панель, экран (смотрит в салон, +X) */}
      <mesh position={[-1.72, 0.86, 0]} material={darkMat}>
        <boxGeometry args={[0.06, 0.2, 0.24]} />
      </mesh>
      <mesh position={[-1.7, 1.14, 0]} material={darkMat} castShadow>
        <boxGeometry args={[0.05, 0.46, 0.94]} />
      </mesh>
      <mesh position={[-1.67, 1.14, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.88, 0.4]} />
        <meshBasicMaterial ref={screenMat} map={screenTex} toneMapped={false} />
      </mesh>

      {/* клавиатура и мышь */}
      <mesh position={[-1.34, 0.775, -0.1]} material={darkMat}>
        <boxGeometry args={[0.16, 0.02, 0.5]} />
      </mesh>
      <mesh position={[-1.32, 0.775, 0.42]} material={darkMat}>
        <boxGeometry args={[0.12, 0.03, 0.07]} />
      </mesh>

      {/* системник с LED-полосой */}
      <mesh position={[-1.6, 0.25, 1.12]} material={darkMat} castShadow>
        <boxGeometry args={[0.24, 0.5, 0.46]} />
      </mesh>
      <mesh position={[-1.47, 0.25, 1.12]}>
        <boxGeometry args={[0.005, 0.42, 0.03]} />
        <meshStandardMaterial
          color="#b6ff1a"
          emissive="#b6ff1a"
          emissiveIntensity={1.3}
          toneMapped={false}
        />
      </mesh>

      {/* кресло: база, колонна, сиденье, высокая спинка с акцентами */}
      <group position={[-0.82, 0, 0]} rotation={[0, 0.3, 0]}>
        <mesh position={[0, 0.03, 0]} material={darkMat}>
          <cylinderGeometry args={[0.3, 0.32, 0.05, 16]} />
        </mesh>
        <mesh position={[0, 0.3, 0]} material={darkMat}>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 10]} />
        </mesh>
        <mesh position={[0, 0.56, 0]} material={deskMat} castShadow>
          <boxGeometry args={[0.52, 0.09, 0.52]} />
        </mesh>
        <mesh position={[0.27, 1.0, 0]} rotation={[0, 0, -0.12]} material={deskMat} castShadow>
          <boxGeometry args={[0.08, 0.85, 0.5]} />
        </mesh>
        {[-0.12, 0.12].map((dz) => (
          <mesh key={dz} position={[0.305, 1.0, dz]} rotation={[0, 0, -0.12]}>
            <boxGeometry args={[0.02, 0.7, 0.05]} />
            <meshStandardMaterial
              color="#b6ff1a"
              emissive="#b6ff1a"
              emissiveIntensity={0.7}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
