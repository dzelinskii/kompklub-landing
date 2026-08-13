"use client";

import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

// Галерея вагона 05: фото как светящиеся лайтбоксы-«окна» на стене. Кадры
// подсвечены изнутри (не зависят от ламп вагона) и дают мягкий отсвет на стену.
// Фото берутся из public/gallery — при замене плейсхолдеров на реальные снимки
// достаточно обновить список PHOTOS.

const PHOTOS = [
  "/gallery/placeholder-1.svg",
  "/gallery/placeholder-2.svg",
  "/gallery/placeholder-3.svg",
];

const BOX_W = 1.1;
const BOX_H = 0.8;

export function GalleryLightboxes({ z }: { z: number }) {
  const textures = useTexture(PHOTOS);
  useMemo(() => {
    for (const t of textures) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
    }
  }, [textures]);

  const frameMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#101210",
        metalness: 0.6,
        roughness: 0.4,
      }),
    [],
  );

  const offsets = [-1.45, 0, 1.45];

  return (
    <group>
      {textures.map((tex, i) => (
        <group
          key={PHOTOS[i]}
          position={[-2 + 0.09, 1.35, z + offsets[i]]}
          rotation={[0, Math.PI / 2, 0]}
        >
          {/* корпус лайтбокса */}
          <mesh material={frameMat} castShadow>
            <boxGeometry args={[BOX_W + 0.1, BOX_H + 0.1, 0.07]} />
          </mesh>
          {/* светящийся кадр */}
          <mesh position={[0, 0, 0.045]}>
            <planeGeometry args={[BOX_W, BOX_H]} />
            <meshBasicMaterial map={tex} toneMapped={false} />
          </mesh>
          {/* кислотная кромка снизу */}
          <mesh position={[0, -(BOX_H + 0.1) / 2 + 0.015, 0.045]}>
            <boxGeometry args={[BOX_W + 0.1, 0.02, 0.02]} />
            <meshStandardMaterial
              color="#b6ff1a"
              emissive="#b6ff1a"
              emissiveIntensity={1.2}
              toneMapped={false}
            />
          </mesh>
          {/* отсвет кадра на стену */}
          <pointLight position={[0, 0, 0.45]} intensity={0.9} distance={1.8} color="#cfe9c0" />
        </group>
      ))}
    </group>
  );
}
