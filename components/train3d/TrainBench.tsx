"use client";

import { useMemo } from "react";
import * as THREE from "three";

// Лавка в стиле пригородного поезда (референс — Mumbai Local Passenger Seat):
// гнутое сиденье с «водопадным» передним краем, наклонённая гнутая спинка,
// металлические торцевые накладки и две ножки-тумбы с фланцами. Целиком
// параметрическая: длина/цвета крутятся пропами и константами.
//
// Локальная система: спинка у x≈+0.1 (ставится к стене), сидящий смотрит в −X;
// длина лавки — вдоль Z, origin в центре.

// Боковой профиль сиденья: слегка выпуклый верх и загнутый вниз передний край.
function panShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0.4);
  s.lineTo(0, 0.45);
  s.quadraticCurveTo(-0.25, 0.5, -0.4, 0.47);
  s.quadraticCurveTo(-0.47, 0.455, -0.46, 0.385);
  s.quadraticCurveTo(-0.44, 0.37, -0.42, 0.375);
  s.quadraticCurveTo(-0.4, 0.42, -0.24, 0.445);
  s.quadraticCurveTo(-0.08, 0.435, 0, 0.4);
  return s;
}

// Боковой профиль спинки: лёгкий прогиб под спину и скруглённый верх.
function backShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.02, 0.52);
  s.quadraticCurveTo(0.0, 0.8, 0.05, 1.03);
  s.quadraticCurveTo(0.075, 1.09, 0.1, 1.03);
  s.quadraticCurveTo(0.06, 0.78, 0.035, 0.5);
  s.quadraticCurveTo(0.005, 0.47, -0.02, 0.52);
  return s;
}

function extrude(shape: THREE.Shape, depth: number): THREE.ExtrudeGeometry {
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 16,
  });
}

export function TrainBench({
  length = 2.2,
  position,
  rotationY = 0,
}: {
  length?: number;
  position: [number, number, number];
  rotationY?: number;
}) {
  const seatMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#20261e",
        roughness: 0.45,
        clearcoat: 0.7,
        clearcoatRoughness: 0.3,
      }),
    [],
  );
  const trimMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#565b56",
        metalness: 0.85,
        roughness: 0.35,
      }),
    [],
  );

  const pan = useMemo(() => extrude(panShape(), length), [length]);
  const back = useMemo(() => extrude(backShape(), length), [length]);
  // Торцевые накладки — те же профили тонкими «пластинами» из металла.
  const panCap = useMemo(() => extrude(panShape(), 0.04), []);
  const backCap = useMemo(() => extrude(backShape(), 0.04), []);

  const legZ = [length * 0.25, length * 0.75];

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <group position={[0, 0, -length / 2]}>
        <mesh geometry={pan} material={seatMat} castShadow />
        <mesh geometry={back} material={seatMat} castShadow />
        {/* металлические торцы */}
        <mesh geometry={panCap} material={trimMat} position={[0, 0, -0.035]} />
        <mesh geometry={backCap} material={trimMat} position={[0, 0, -0.035]} />
        <mesh geometry={panCap} material={trimMat} position={[0, 0, length - 0.005]} />
        <mesh geometry={backCap} material={trimMat} position={[0, 0, length - 0.005]} />
        {/* ножки-тумбы с фланцами */}
        {legZ.map((z) => (
          <group key={z} position={[-0.24, 0, z]}>
            <mesh position={[0, 0.19, 0]} material={trimMat} castShadow>
              <cylinderGeometry args={[0.033, 0.033, 0.38, 12]} />
            </mesh>
            <mesh position={[0, 0.01, 0]} material={trimMat}>
              <cylinderGeometry args={[0.09, 0.1, 0.02, 16]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
