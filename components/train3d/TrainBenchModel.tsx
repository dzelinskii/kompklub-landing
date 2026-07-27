"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Лавка из Blender-модели (public/models/train-bench.glb). Модель: длина вдоль
// X, спинка смотрит в −Z, origin на полу по центру длины. Чтобы поставить вдоль
// вагона (длина по Z, спинка к стене), крутим по Y на ±90° через rotationY.
// scaleX укорачивает лавку по длине (для короткой у переборки).

useGLTF.preload("/models/train-bench.glb");

export function TrainBenchModel({
  position,
  rotationY = 0,
  scaleX = 1,
}: {
  position: [number, number, number];
  rotationY?: number;
  scaleX?: number;
}) {
  const { scene } = useGLTF("/models/train-bench.glb");
  // Клон на каждый экземпляр (общая геометрия/материалы), с тенями.
  const obj = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);

  return (
    <primitive
      object={obj}
      position={position}
      rotation={[0, rotationY, 0]}
      scale={[scaleX, 1, 1]}
    />
  );
}
