// Чистая математика дискретной навигации «вагон за вагоном» — без three и DOM,
// чтобы покрыть тестами. Сцена лишь применяет результат к камере и дверям.
//
// Модель: вагоны стоят вдоль оси Z, переборка с дверью вагона i — на z = i*BAY.
// Камера паркуется на CAM_BACK метров ближе переборки своего вагона.
//
// Два режима камеры:
//  - «turn»: контент на левой боковой стене; на парковке камера смещена вправо
//    от оси и смотрит на стену. Переход: доворот в проход → пролёт сквозь
//    раскрывающиеся переборки → доворот к стене нового вагона.
//  - «straight»: контент на переборке; камера всегда смотрит вперёд по Z и
//    просто пролетает сквозь переборки «в глубину».

export const BAY = 8; // расстояние между переборками вагонов, м
export const CAM_BACK = 5; // на сколько камера стоит ближе своей переборки, м
export const EYE = 1.6; // высота глаз, м
export const SIDE_X = 0.8; // смещение камеры от оси на парковке (режим turn)
const WALL_LOOK_X = -2; // куда смотрим на парковке: левая боковая стена

// Проём открывается по близости камеры к переборке (мягкая шторка).
const OPEN_FAR = 4.5; // дальше — закрыто
const OPEN_NEAR = 1.2; // ближе — полностью открыто

// Раскладка перехода в режиме turn: крайние доли уходят на довороты.
const TURN_IN = 0.22; // до этой доли — доворот из стены в проход
const TURN_OUT = 0.78; // с этой доли — доворот к стене нового вагона

export type Vec3 = [number, number, number];
export type Pose = { position: Vec3; target: Vec3 };
export type NavMode = "turn" | "straight";

export function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

export function lerp(a: number, b: number, u: number): number {
  return a + (b - a) * u;
}

export function smoothstep(u: number): number {
  const c = clamp01(u);
  return c * c * (3 - 2 * c);
}

function lerpVec3(a: Vec3, b: Vec3, u: number): Vec3 {
  return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
}

// Сглаженная интерполяция целой позы между ключевыми положениями.
function blend(a: Pose, b: Pose, u: number): Pose {
  const e = smoothstep(u);
  return {
    position: lerpVec3(a.position, b.position, e),
    target: lerpVec3(a.target, b.target, e),
  };
}

// Z-координата камеры, припаркованной в вагоне i.
export function cameraZ(i: number): number {
  return i * BAY - CAM_BACK;
}

// Z камеры в переходе current→target с прогрессом p (режим straight).
export function sampleCameraZ(current: number, target: number, p: number): number {
  return lerp(cameraZ(current), cameraZ(target), smoothstep(p));
}

// Парковочная поза камеры в вагоне i. В режиме turn камера смотрит на стену
// строго перпендикулярно: на парковке пользователь читает контент как обычный
// сайт во весь кадр, поезд заметен только в пролётах.
export function parkedPose(i: number, mode: NavMode): Pose {
  const z = cameraZ(i);
  if (mode === "straight") {
    return { position: [0, EYE, z], target: [0, EYE, z + 10] };
  }
  return { position: [SIDE_X, EYE, z], target: [WALL_LOOK_X, EYE, z] };
}

// Поза камеры в переходе current→target с прогрессом p ∈ [0..1].
export function samplePose(
  current: number,
  target: number,
  p: number,
  mode: NavMode,
): Pose {
  const pc = clamp01(p);
  if (current === target) return parkedPose(current, mode);

  if (mode === "straight") {
    const z = sampleCameraZ(current, target, pc);
    return { position: [0, EYE, z], target: [0, EYE, z + 10] };
  }

  // turn: стена → проход → пролёт → проход → стена нового вагона.
  const zc = cameraZ(current);
  const zt = cameraZ(target);
  const dir = target > current ? 1 : -1;
  const aisle = (z: number): Pose => ({
    position: [0, EYE, z],
    target: [0, EYE, z + dir * 10],
  });

  if (pc <= TURN_IN) return blend(parkedPose(current, mode), aisle(zc), pc / TURN_IN);
  if (pc <= TURN_OUT)
    return blend(aisle(zc), aisle(zt), (pc - TURN_IN) / (TURN_OUT - TURN_IN));
  return blend(aisle(zt), parkedPose(target, mode), (pc - TURN_OUT) / (1 - TURN_OUT));
}

// Насколько открыт проём переборки k во время перехода current→target [0..1].
// Открываются только переборки, сквозь которые реально пролетает камера.
export function doorOpenForWall(
  k: number,
  current: number,
  target: number,
  p: number,
  mode: NavMode = "straight",
): number {
  if (current === target) return 0; // припаркованы — всё закрыто
  const lo = Math.min(current, target);
  const hi = Math.max(current, target);
  if (!(k >= lo && k < hi)) return 0; // переборка не на пути
  const camZ = samplePose(current, target, p, mode).position[2];
  const dist = Math.abs(camZ - k * BAY);
  return clamp01((OPEN_FAR - dist) / (OPEN_FAR - OPEN_NEAR));
}
