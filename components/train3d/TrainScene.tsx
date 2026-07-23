"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useTexture } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import {
  BAY,
  CAM_BACK,
  EYE,
  cameraZ,
  lerp,
  smoothstep,
  samplePose,
  doorOpenForWall,
  type NavMode,
} from "./depthNav";
import { WAGONS } from "./wagonContent";
import { WAGON_PAINTS } from "./wallPaint";
import { WallTV } from "./WallTV";
import { NeonSign } from "./NeonSign";
import { PCSetup } from "./PCSetup";
import { DriverCabin } from "./DriverCabin";
import { TrainBench } from "./TrainBench";

// Геометрия вагона (переборка на z = i*BAY, см. depthNav).
const W = 4; // ширина
const H = 3; // высота
const DOOR_W = 1.8;
const DOOR_H = 2.2;
const PANEL_W = DOOR_W / 2;
const N = WAGONS.length;

// Протяжённость туннеля (общие для пола/стен/ламп/отделки).
const Z_START = -CAM_BACK - 3;
const Z_END = (N - 1) * BAY + 2;
const LEN = Z_END - Z_START;
const ZC = (Z_START + Z_END) / 2;

// Масштаб HTML-панели контента. В режиме «поворот» камера стоит к боковой
// стене ближе, чем к переборке в «прямом», поэтому масштабы разные. На парковке
// контент занимает кадр целиком — читается как обычный сайт. Подгоняются по месту.
const CONTENT_SCALE: Record<NavMode, number> = { turn: 1.65, straight: 3 };

const SPEEDS = { Быстро: 0.6, Обычно: 1.0, Медленно: 1.8 } as const;
type SpeedKey = keyof typeof SPEEDS;

// Переход между вагонами разбит на остановки: один тик колеса везёт до
// следующей. 0→0.5 — доворот в проход и подъезд к двери (она открывается);
// 0.5→1 — пролёт сквозь дверь, прибытие и доворот к стене нового вагона.
const STOPS = [0, 0.5, 1];

// Общее изменяемое состояние навигации: читается каждый кадр в useFrame, поэтому
// живёт в ref (без ре-рендера). React-состояние дублирует только то, что нужно
// шапке и видимости контента.
type NavState = {
  cur: number;
  tgt: number;
  progress: number; // прогресс всего перехода cur→tgt [0..1]
  segFrom: number; // текущий анимируемый отрезок (между остановками)
  segTo: number;
  segT: number; // прогресс внутри отрезка [0..1]
  stopIdx: number; // индекс остановки STOPS, к которой едем/на которой стоим
  animating: boolean;
  duration: number; // длительность полного перехода (сек)
  mode: NavMode;
};

// Ведёт камеру по позе из depthNav, двигая прогресс по отрезкам между
// остановками, и сообщает о полной парковке. Во время перехода следуем
// траектории точно; на парковке позу мягко доводим — так смена режима камеры
// разворачивает кадр плавно, а не рывком.
function CameraRig({
  navRef,
  onParked,
}: {
  navRef: React.MutableRefObject<NavState>;
  onParked: (i: number) => void;
}) {
  const pos = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const tmpP = useRef(new THREE.Vector3());
  const tmpT = useRef(new THREE.Vector3());
  const init = useRef(false);
  const idleT = useRef(0);
  const sway = useRef(0); // плавный ввод/вывод микро-движения
  const reduceMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  useFrame((state, dt) => {
    const nav = navRef.current;
    if (nav.animating) {
      // Длительность отрезка пропорциональна его доле пути (с нижним порогом,
      // чтобы короткий тик не был мгновенным).
      const span = Math.max(Math.abs(nav.segTo - nav.segFrom), 0.2);
      nav.segT = Math.min(1, nav.segT + dt / (nav.duration * span));
      nav.progress = lerp(nav.segFrom, nav.segTo, smoothstep(nav.segT));
      if (nav.segT >= 1) {
        nav.animating = false;
        nav.progress = nav.segTo;
        if (nav.progress >= 0.999) {
          // Доехали до конца перехода.
          nav.cur = nav.tgt;
          nav.progress = 1;
          nav.stopIdx = 0;
          onParked(nav.cur);
        } else if (nav.progress <= 0.001 && nav.tgt !== nav.cur) {
          // Откатились к началу — переход отменён.
          nav.tgt = nav.cur;
          nav.progress = 1;
          nav.stopIdx = 0;
          onParked(nav.cur);
        }
        // Иначе стоим на промежуточной остановке — ждём следующий тик.
      }
    }
    const pose = samplePose(nav.cur, nav.tgt, nav.progress, nav.mode);
    tmpP.current.set(pose.position[0], pose.position[1], pose.position[2]);
    tmpT.current.set(pose.target[0], pose.target[1], pose.target[2]);
    if (!init.current || nav.animating) {
      pos.current.copy(tmpP.current);
      look.current.copy(tmpT.current);
      init.current = true;
    } else {
      const k = Math.min(1, dt * 6);
      pos.current.lerp(tmpP.current, k);
      look.current.lerp(tmpT.current, k);
    }
    // Микро-движение на парковке: медленное «дыхание» камеры — едва заметные
    // качания позиции и взгляда. Плавно затухает на время переходов; при
    // prefers-reduced-motion отключено совсем.
    const targetSway = nav.animating || reduceMotion ? 0 : 1;
    sway.current = lerp(sway.current, targetSway, Math.min(1, dt * 1.5));
    idleT.current += dt;
    const a = sway.current;
    const x = idleT.current;
    const dy = a * (Math.sin(x * 0.55) * 0.012 + Math.sin(x * 1.31) * 0.004);
    const dz = a * Math.sin(x * 0.38) * 0.014;
    const ly = a * Math.sin(x * 0.47 + 1.2) * 0.024;
    const lz = a * Math.sin(x * 0.29 + 0.5) * 0.04;
    state.camera.position.set(pos.current.x, pos.current.y + dy, pos.current.z + dz);
    tmpT.current.set(look.current.x, look.current.y + ly, look.current.z + lz);
    state.camera.lookAt(tmpT.current);
  });
  return null;
}

// Даёт доступ к three-сцене снаружи Canvas (для экспорта объектов в .glb).
function SceneGrabber({
  sceneRef,
}: {
  sceneRef: React.MutableRefObject<THREE.Scene | null>;
}) {
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    sceneRef.current = scene;
  }, [scene, sceneRef]);
  return null;
}

// Экспорт процедурного объекта сцены в .glb — чтобы дорабатывать модель в
// Blender (File → Import → glTF 2.0). Ищем объект по имени и скачиваем файл.
async function exportObjectToGlb(scene: THREE.Scene | null, name: string) {
  if (!scene) return;
  const obj = scene.getObjectByName(name);
  if (!obj) {
    console.error(`Экспорт .glb: объект «${name}» не найден в сцене`);
    return;
  }
  const { GLTFExporter } = await import(
    "three/examples/jsm/exporters/GLTFExporter.js"
  );
  new GLTFExporter().parse(
    obj,
    (result) => {
      const blob = new Blob([result as ArrayBuffer], {
        type: "model/gltf-binary",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${name}.glb`;
      a.click();
      URL.revokeObjectURL(a.href);
    },
    (err) => console.error("Экспорт .glb не удался:", err),
    { binary: true },
  );
}

// Предупреждающие полосы для низа створок — рисуются один раз в текстуру.
function makeHazardTexture(): THREE.CanvasTexture {
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

// Створка двери: металлическое полотно, окошко с тёмным стеклом, кислотная
// кромка у стыка (светится и в bloom) и предупреждающие полосы снизу.
// inner: с какой стороны стык створок в локальных координатах (+1 — справа).
function DoorLeaf({
  inner,
  nor,
  rough,
  hazard,
}: {
  inner: 1 | -1;
  nor: THREE.Texture;
  rough: THREE.Texture;
  hazard: THREE.CanvasTexture;
}) {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[PANEL_W, DOOR_H, 0.08]} />
        <meshStandardMaterial
          color="#101210"
          metalness={0.55}
          roughness={0.5}
          normalMap={nor}
          roughnessMap={rough}
        />
      </mesh>
      {/* окно: рамка и тёмное отражающее стекло */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.4, 0.96, 0.085]} />
        <meshStandardMaterial color="#050505" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.32, 0.88, 0.09]} />
        <meshStandardMaterial color="#0a1408" metalness={0.9} roughness={0.12} />
      </mesh>
      {/* кислотная кромка у стыка створок */}
      <mesh position={[inner * (PANEL_W / 2 - 0.015), 0, 0]}>
        <boxGeometry args={[0.025, DOOR_H - 0.08, 0.085]} />
        <meshStandardMaterial
          color="#b6ff1a"
          emissive="#b6ff1a"
          emissiveIntensity={1.2}
          toneMapped={false}
        />
      </mesh>
      {/* предупреждающие полосы снизу, с обеих сторон полотна */}
      {[0.045, -0.045].map((z) => (
        <mesh
          key={z}
          position={[0, -DOOR_H / 2 + 0.22, z]}
          rotation={[0, z < 0 ? Math.PI : 0, 0]}
        >
          <planeGeometry args={[PANEL_W - 0.1, 0.24]} />
          <meshStandardMaterial map={hazard} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// Переборка вагона: рамка вокруг проёма + две створки, разъезжающиеся, когда
// камера пролетает сквозь них. Индикатор над проёмом разгорается при открытии.
function Bulkhead({
  index,
  navRef,
}: {
  index: number;
  navRef: React.MutableRefObject<NavState>;
}) {
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const indicator = useRef<THREE.MeshStandardMaterial>(null);
  const frame = useMemo(() => new THREE.PlaneGeometry(DOOR_W, DOOR_H), []);
  const sideW = (W - DOOR_W) / 2;

  // Металл для полотен (кеш useTexture общий, клоны — со своим тайлингом).
  const [metalNor, metalRough] = useTexture([
    "/textures/metal_plate_nor_gl_1k.jpg",
    "/textures/metal_plate_rough_1k.jpg",
  ]);
  const nor = useMemo(() => metalNor.clone(), [metalNor]);
  const rough = useMemo(() => metalRough.clone(), [metalRough]);
  const hazard = useMemo(() => makeHazardTexture(), []);
  useMemo(() => {
    tile(nor, 0.6, 1.5);
    tile(rough, 0.6, 1.5);
  }, [nor, rough]);

  useFrame(() => {
    const nav = navRef.current;
    const open = doorOpenForWall(index, nav.cur, nav.tgt, nav.progress, nav.mode);
    const shift = open * PANEL_W;
    if (left.current) left.current.position.x = -PANEL_W / 2 - shift;
    if (right.current) right.current.position.x = PANEL_W / 2 + shift;
    if (indicator.current) indicator.current.emissiveIntensity = 0.4 + open * 2;
  });

  return (
    <group position={[0, 0, index * BAY]}>
      <mesh position={[-(DOOR_W / 2 + sideW / 2), H / 2, 0]}>
        <planeGeometry args={[sideW, H]} />
        <meshStandardMaterial color="#141414" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[DOOR_W / 2 + sideW / 2, H / 2, 0]}>
        <planeGeometry args={[sideW, H]} />
        <meshStandardMaterial color="#141414" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, (H + DOOR_H) / 2, 0]}>
        <planeGeometry args={[DOOR_W, H - DOOR_H]} />
        <meshStandardMaterial color="#141414" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <lineSegments position={[0, DOOR_H / 2, 0.02]}>
        <edgesGeometry args={[frame]} />
        <lineBasicMaterial color="#b6ff1a" />
      </lineSegments>
      {/* индикатор над проёмом — разгорается, когда створки открываются */}
      <mesh position={[0, DOOR_H + 0.18, 0.05]}>
        <boxGeometry args={[0.3, 0.05, 0.04]} />
        <meshStandardMaterial
          ref={indicator}
          color="#b6ff1a"
          emissive="#b6ff1a"
          emissiveIntensity={0.4}
          toneMapped={false}
        />
      </mesh>
      <group position={[0, DOOR_H / 2, 0]}>
        <group ref={left}>
          <DoorLeaf inner={1} nor={nor} rough={rough} hazard={hazard} />
        </group>
        <group ref={right}>
          <DoorLeaf inner={-1} nor={nor} rough={rough} hazard={hazard} />
        </group>
      </group>
    </group>
  );
}

// Поручни и лавки по бортам туннеля. Лавки — гнутые, «поездного» типа
// (TrainBench), посекционно по вагонам, чтобы не пронзать переборки.
function Fixtures() {
  const railMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#7fae12", metalness: 0.7, roughness: 0.35 }),
    [],
  );
  const bays = Array.from({ length: N }, (_, b) => b);

  return (
    <group>
      {/* Правый борт — полный: две лавки на вагон, стойки с кронштейнами,
          продольный поручень. */}
      <mesh
        position={[1.6, 2.35, ZC]}
        rotation={[Math.PI / 2, 0, 0]}
        material={railMat}
        castShadow
      >
        <cylinderGeometry args={[0.04, 0.04, LEN, 12]} />
      </mesh>
      {bays.map((b) => {
        const cz = (b - 0.5) * BAY; // центр «комнаты» вагона b
        return (
          <group key={b}>
            <TrainBench length={2.2} position={[1.86, 0, cz - 1.35]} />
            <TrainBench length={2.2} position={[1.86, 0, cz + 1.35]} />
            {/* стойки: верх точно на высоте продольного поручня, и к нему
                идёт кронштейн — конструкция читается единым целым */}
            {[cz - 2.75, cz + 2.75].map((pz) => (
              <group key={pz}>
                <mesh position={[1.4, 1.175, pz]} material={railMat} castShadow>
                  <cylinderGeometry args={[0.035, 0.035, 2.35, 10]} />
                </mesh>
                <mesh
                  position={[1.5, 2.35, pz]}
                  rotation={[0, 0, Math.PI / 2]}
                  material={railMat}
                  castShadow
                >
                  <cylinderGeometry args={[0.03, 0.03, 0.24, 8]} />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}
      {/* Левый борт — контентная стена: короткая лавка узкой полосой у
          переборок. На парковке она вне кадра (HTML рисуется поверх сцены и не
          может быть заслонён), а при довороте в кадре немного объектов. */}
      {bays.map((b) => {
        const zb = b * BAY - 1.2; // полоса у переборки вагона b
        return (
          <group key={b}>
            <TrainBench length={1.3} position={[-1.86, 0, zb]} rotationY={Math.PI} />
            {/* стойка от пола до потолка у края лавки */}
            <mesh position={[-1.4, 1.45, b * BAY - 2.05]} material={railMat} castShadow>
              <cylinderGeometry args={[0.035, 0.035, 2.9, 10]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// Настройка тайлинга текстуры под размер поверхности.
function tile(t: THREE.Texture, x: number, y: number, srgb = false) {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(x, y);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.needsUpdate = true;
}

// Пол, потолок и боковые стены — сплошной туннель на все вагоны. Материалы —
// PBR-наборы Poly Haven (CC0): бетонный пол, металлический потолок; на стенах
// граффити-картинка поверх рельефа металлических панелей.
function Tunnel() {
  const [graffA, graffB] = useTexture(["/graffiti/wall-1.svg", "/graffiti/wall-2.svg"]);
  const floor = useTexture({
    map: "/textures/rubber_tiles_diff_1k.jpg",
    normalMap: "/textures/rubber_tiles_nor_gl_1k.jpg",
    roughnessMap: "/textures/rubber_tiles_rough_1k.jpg",
  });
  const metal = useTexture({
    map: "/textures/metal_plate_diff_1k.jpg",
    normalMap: "/textures/metal_plate_nor_gl_1k.jpg",
    roughnessMap: "/textures/metal_plate_rough_1k.jpg",
  });

  // useTexture кеширует по URL — для стен нужен свой тайлинг рельефа, поэтому
  // клонируем карты металла (картинка общая, трансформация своя).
  const wallNor = useMemo(() => metal.normalMap.clone(), [metal.normalMap]);
  const wallRough = useMemo(() => metal.roughnessMap.clone(), [metal.roughnessMap]);
  // Клоны для контентных секций стены (свой тайлинг под ширину секции).
  const bdNor = useMemo(() => metal.normalMap.clone(), [metal.normalMap]);
  const bdRough = useMemo(() => metal.roughnessMap.clone(), [metal.roughnessMap]);
  // «Краска» вагонов — статичный контент, нарисованный в текстуры секций.
  const paints = useMemo(() => WAGON_PAINTS.map((make) => make?.()), []);
  // Рельеф резины для дорожки прохода — свой тайлинг.
  const aisleNor = useMemo(() => floor.normalMap.clone(), [floor.normalMap]);

  useMemo(() => {
    for (const t of [graffA, graffB]) tile(t, LEN / 4, 1, true);
    tile(floor.map, 4, LEN, true);
    tile(floor.normalMap, 4, LEN);
    tile(floor.roughnessMap, 4, LEN);
    tile(aisleNor, 1.2, LEN);
    tile(metal.map, 2, LEN / 2, true);
    tile(metal.normalMap, 2, LEN / 2);
    tile(metal.roughnessMap, 2, LEN / 2);
    tile(wallNor, LEN / 2, 1.2);
    tile(wallRough, LEN / 2, 1.2);
    tile(bdNor, 3, 1.2);
    tile(bdRough, 3, 1.2);
  }, [graffA, graffB, floor, metal, wallNor, wallRough, bdNor, bdRough, aisleNor]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, ZC]} receiveShadow>
        <planeGeometry args={[W, LEN]} />
        <meshStandardMaterial
          map={floor.map}
          normalMap={floor.normalMap}
          roughnessMap={floor.roughnessMap}
          color="#4c4f4c"
        />
      </mesh>
      {/* Дорожка прохода по центру: тёмная резина с кислотной окантовкой —
          структурирует пол и ведёт взгляд к двери. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, ZC]} receiveShadow>
        <planeGeometry args={[1.3, LEN]} />
        <meshStandardMaterial color="#0c0d0c" roughness={0.9} normalMap={aisleNor} />
      </mesh>
      {[-0.68, 0.68].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.007, ZC]}>
          <planeGeometry args={[0.05, LEN]} />
          <meshStandardMaterial
            color="#b6ff1a"
            emissive="#b6ff1a"
            emissiveIntensity={0.25}
            toneMapped={false}
            roughness={0.6}
          />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, ZC]}>
        <planeGeometry args={[W, LEN]} />
        <meshStandardMaterial
          map={metal.map}
          normalMap={metal.normalMap}
          roughnessMap={metal.roughnessMap}
          color="#3c3f3c"
        />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-W / 2, H / 2, ZC]} receiveShadow>
        <planeGeometry args={[LEN, H]} />
        <meshStandardMaterial map={graffA} normalMap={wallNor} roughnessMap={wallRough} />
      </mesh>
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[W / 2, H / 2, ZC]} receiveShadow>
        <planeGeometry args={[LEN, H]} />
        <meshStandardMaterial map={graffB} normalMap={wallNor} roughnessMap={wallRough} />
      </mesh>
      {/* Контентные секции стены: тот же металл, но закрашенный тёмным — без
          граффити. У вагона 00 статичный текст «нарисован краской» прямо в
          текстуре секции (гибрид: интерактив остаётся DOM-ом на парковке). */}
      {WAGONS.map((_, i) => (
        <mesh
          key={i}
          rotation={[0, Math.PI / 2, 0]}
          position={[-W / 2 + 0.04, H / 2, i * BAY - CAM_BACK]}
          receiveShadow
        >
          <planeGeometry args={[6, H]} />
          {paints[i] ? (
            <meshStandardMaterial map={paints[i]} normalMap={bdNor} roughnessMap={bdRough} />
          ) : (
            <meshStandardMaterial color="#141614" normalMap={bdNor} roughnessMap={bdRough} />
          )}
        </mesh>
      ))}
      <Fixtures />
    </group>
  );
}

// Тёмный плинтус, скос под потолком и пилястры у переборок — «вагонная» отделка.
function TunnelTrim() {
  const trimMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#101210", metalness: 0.5, roughness: 0.6 }),
    [],
  );
  const bays = Array.from({ length: N }, (_, b) => b);
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * (W / 2 - 0.05), 0.09, ZC]} material={trimMat}>
            <boxGeometry args={[0.1, 0.18, LEN]} />
          </mesh>
          <mesh
            position={[s * (W / 2 - 0.1), H - 0.14, ZC]}
            rotation={[0, 0, s * Math.PI * 0.25]}
            material={trimMat}
          >
            <boxGeometry args={[0.05, 0.3, LEN]} />
          </mesh>
          {bays.map((b) => (
            <mesh
              key={b}
              position={[s * (W / 2 - 0.06), H / 2, b * BAY - 0.2]}
              material={trimMat}
            >
              <boxGeometry args={[0.12, H, 0.28]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// Бегущая полоска света для окна: тёмный «вид наружу» с проплывающим огнём.
function makeStreakTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 64;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#040605";
  ctx.fillRect(0, 0, w, h);
  const g = ctx.createLinearGradient(96, 0, 160, 0);
  g.addColorStop(0, "rgba(223,255,232,0)");
  g.addColorStop(0.5, "rgba(223,255,232,0.9)");
  g.addColorStop(1, "rgba(223,255,232,0)");
  ctx.fillStyle = g;
  ctx.fillRect(96, 8, 64, h - 16);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

// Окно-«световой короб» на стене: рамка + тёмное стекло, за которым проплывают
// огни туннеля. Во время пролёта огни ускоряются — усиливает ощущение хода.
function TunnelWindow({
  side,
  z,
  navRef,
}: {
  side: -1 | 1;
  z: number;
  navRef: React.MutableRefObject<NavState>;
}) {
  const tex = useMemo(() => {
    const t = makeStreakTexture();
    t.offset.x = Math.abs(z * 0.37) % 1; // рассинхрон окон между собой
    return t;
  }, [z]);

  useFrame((_, dt) => {
    const speed = navRef.current.animating ? 0.9 : 0.06;
    tex.offset.x = (tex.offset.x + dt * speed) % 1;
  });

  return (
    <group
      position={[side * (W / 2 - 0.1), 1.75, z]}
      rotation={[0, (-side * Math.PI) / 2, 0]}
    >
      <mesh>
        <planeGeometry args={[1.4, 0.7]} />
        <meshStandardMaterial
          color="#020302"
          emissive="#dfffe8"
          emissiveMap={tex}
          emissiveIntensity={1.6}
          toneMapped={false}
          roughness={0.2}
        />
      </mesh>
      {[
        { p: [0, 0.39, 0.02] as const, a: [1.56, 0.08, 0.06] as const },
        { p: [0, -0.39, 0.02] as const, a: [1.56, 0.08, 0.06] as const },
        { p: [-0.74, 0, 0.02] as const, a: [0.08, 0.86, 0.06] as const },
        { p: [0.74, 0, 0.02] as const, a: [0.08, 0.86, 0.06] as const },
      ].map((f, i) => (
        <mesh key={i} position={[f.p[0], f.p[1], f.p[2]]}>
          <boxGeometry args={[f.a[0], f.a[1], f.a[2]]} />
          <meshStandardMaterial color="#101010" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// Раскладка окон: правый борт — по два на вагон; на левом (контентном) — одно
// в полосе у переборки, вне кадра парковки (см. Fixtures).
function TunnelWindows({ navRef }: { navRef: React.MutableRefObject<NavState> }) {
  const bays = Array.from({ length: N }, (_, b) => b);
  return (
    <group>
      {bays.map((b) => (
        <group key={b}>
          <TunnelWindow side={1} z={b * BAY - 2} navRef={navRef} />
          <TunnelWindow side={1} z={b * BAY - 6} navRef={navRef} />
          <TunnelWindow side={-1} z={b * BAY - 1} navRef={navRef} />
        </group>
      ))}
    </group>
  );
}

// Способ отрисовки HTML-слоя:
//  - overlay: DOM поверх канваса (стандарт; между камерой и контентной стеной
//    ничего не ставим, см. Fixtures);
//  - blending: экспериментальное настоящее перекрытие (drei occlude="blending")
//    — HTML за канвасом, геометрия его реально заслоняет. Минусы: без bloom,
//    в области панели виден фон страницы, интерактив может не работать.
type HtmlLayerMode = "overlay" | "blending";

// HTML-контент вагона (drei Html в 3D). В режиме «поворот» панель висит на
// левой боковой стене напротив припаркованной камеры; в «прямом» — на
// переборке, развёрнутая к подъезжающей камере. Виден только текущий вагон.
function WagonPanel({
  index,
  mode,
  htmlMode,
  visible,
  children,
}: {
  index: number;
  mode: NavMode;
  htmlMode: HtmlLayerMode;
  visible: boolean;
  children: React.ReactNode;
}) {
  const onSideWall = mode === "turn";
  return (
    <Html
      transform
      position={
        onSideWall
          ? [-W / 2 + 0.12, EYE, index * BAY - CAM_BACK]
          : [0, EYE, index * BAY - 0.12]
      }
      rotation={onSideWall ? [0, Math.PI / 2, 0] : [0, Math.PI, 0]}
      distanceFactor={CONTENT_SCALE[mode]}
      occlude={htmlMode === "blending" ? "blending" : false}
      zIndexRange={htmlMode === "blending" ? undefined : [10, 0]}
    >
      <div
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity .35s ease",
          pointerEvents: visible ? "auto" : "none",
        }}
      >
        {children}
      </div>
    </Html>
  );
}

// «Депо оживает»: освещение по-вагонно. Активен вагон, в котором находится
// камера; при въезде лампы зажигаются с фликером люминесцентки, покинутый
// вагон плавно гаснет до дежурного полумрака.
const FLICKER = [0.15, 0.85, 0.1, 1, 0.4, 1];
const IDLE_LEVEL = 0.08; // дежурный уровень света в неактивном вагоне

function BayLights({
  b,
  navRef,
}: {
  b: number;
  navRef: React.MutableRefObject<NavState>;
}) {
  const cz = (b - 0.5) * BAY;
  const stripMat = useRef<THREE.MeshStandardMaterial>(null);
  const point = useRef<THREE.PointLight>(null);
  const spot = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0, 0, cz);
    return o;
  }, [cz]);
  useEffect(() => {
    if (spot.current) spot.current.target = target;
  }, [target]);
  // Камера стартует в вагоне 0 — он сразу горит, остальные в полумраке.
  const st = useRef({
    wasActive: b === 0,
    wake: 1,
    level: b === 0 ? 1 : IDLE_LEVEL,
  });

  useFrame((_, dt) => {
    const nav = navRef.current;
    const camZ = samplePose(nav.cur, nav.tgt, nav.progress, nav.mode).position[2];
    // Вагон b занимает z ∈ ((b-1)*BAY, b*BAY] — свет включается ровно в момент
    // пересечения переборки.
    const active = Math.floor(camZ / BAY) + 1 === b;
    const s = st.current;
    if (active) {
      if (!s.wasActive) {
        s.wasActive = true;
        s.wake = 0;
      }
      s.wake += dt;
      s.level =
        s.wake < 0.66 ? FLICKER[Math.min(5, Math.floor(s.wake / 0.11))] : 1;
    } else {
      s.wasActive = false;
      s.level = lerp(s.level, IDLE_LEVEL, Math.min(1, dt * 3));
    }
    if (stripMat.current) stripMat.current.emissiveIntensity = 0.08 + 1.5 * s.level;
    if (point.current) point.current.intensity = 10 * s.level;
    if (spot.current) spot.current.intensity = 26 * s.level;
  });

  return (
    <group>
      {/* плафон и светящаяся полоса лампы — её подхватывает bloom */}
      <mesh position={[0, H - 0.06, cz]}>
        <boxGeometry args={[0.5, 0.1, BAY - 2.5]} />
        <meshStandardMaterial color="#111311" roughness={0.9} />
      </mesh>
      <mesh position={[0, H - 0.13, cz]}>
        <boxGeometry args={[0.34, 0.03, BAY - 2.8]} />
        <meshStandardMaterial
          ref={stripMat}
          color="#eafcc7"
          emissive="#eafcc7"
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        ref={point}
        position={[0, H - 0.5, cz]}
        intensity={10}
        distance={9}
        color="#eafcc7"
      />
      <spotLight
        ref={spot}
        position={[0, H - 0.2, cz]}
        angle={1.15}
        penumbra={0.7}
        intensity={26}
        distance={13}
        color="#f2ffd9"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
      <primitive object={target} />
    </group>
  );
}

function Lights({ navRef }: { navRef: React.MutableRefObject<NavState> }) {
  const bays = Array.from({ length: N }, (_, b) => b);
  return (
    <>
      <ambientLight intensity={0.14} />
      {bays.map((b) => (
        <BayLights key={b} b={b} navRef={navRef} />
      ))}
      {/* кислотные LED-линии вдоль стыка стен и потолка */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (W / 2 - 0.16), H - 0.28, ZC]}>
          <boxGeometry args={[0.03, 0.03, LEN]} />
          <meshStandardMaterial
            color="#b6ff1a"
            emissive="#b6ff1a"
            emissiveIntensity={1.4}
            toneMapped={false}
          />
        </mesh>
      ))}
      {/* подсветка дальнего проёма */}
      <pointLight
        position={[0, DOOR_H / 2, (N - 1) * BAY]}
        intensity={8}
        distance={6}
        color="#b6ff1a"
      />
    </>
  );
}

export default function TrainScene() {
  const [current, setCurrent] = useState(0);
  const [inTransit, setInTransit] = useState(false);
  const [speed, setSpeed] = useState<SpeedKey>("Обычно");
  const [mode, setMode] = useState<NavMode>("turn");
  const [htmlMode, setHtmlMode] = useState<HtmlLayerMode>("overlay");
  const sceneRef = useRef<THREE.Scene | null>(null);
  const navRef = useRef<NavState>({
    cur: 0,
    tgt: 0,
    progress: 1,
    segFrom: 0,
    segTo: 1,
    segT: 1,
    stopIdx: 0,
    animating: false,
    duration: SPEEDS["Обычно"],
    mode: "turn",
  });

  // Тик колеса/клавиши: с парковки начинает переход до первой остановки, с
  // промежуточной остановки везёт к следующей (или назад — к предыдущей,
  // вплоть до отмены перехода).
  const step = useCallback((dir: 1 | -1) => {
    const nav = navRef.current;
    if (nav.animating) return;

    if (nav.cur === nav.tgt) {
      const t = nav.cur + dir;
      if (t < 0 || t >= N) return;
      nav.tgt = t;
      nav.progress = 0;
      nav.stopIdx = 1;
      nav.segFrom = 0;
      nav.segTo = STOPS[1];
      nav.segT = 0;
      nav.animating = true;
      setInTransit(true);
      return;
    }

    // Стоим между вагонами: тик по ходу перехода — дальше, против — назад.
    const trDir = Math.sign(nav.tgt - nav.cur);
    const next = dir === trDir ? nav.stopIdx + 1 : nav.stopIdx - 1;
    nav.segFrom = STOPS[nav.stopIdx];
    nav.segTo = STOPS[next];
    nav.stopIdx = next;
    nav.segT = 0;
    nav.animating = true;
  }, []);

  // Прыжок из шапки/CTA — единым пролётом без остановок. Если стоим посреди
  // перехода, любой прыжок сначала довозит до его конца.
  const jumpTo = useCallback((t: number) => {
    const nav = navRef.current;
    if (nav.animating) return;
    if (nav.cur !== nav.tgt) {
      nav.segFrom = nav.progress;
      nav.segTo = 1;
      nav.stopIdx = STOPS.length - 1;
      nav.segT = 0;
      nav.animating = true;
      return;
    }
    if (t < 0 || t >= N || t === nav.cur) return;
    nav.tgt = t;
    nav.progress = 0;
    nav.segFrom = 0;
    nav.segTo = 1;
    nav.stopIdx = STOPS.length - 1;
    nav.segT = 0;
    nav.animating = true;
    setInTransit(true);
  }, []);

  const onParked = useCallback((i: number) => {
    setCurrent(i);
    setInTransit(false);
  }, []);

  // Управление: колесо, клавиши, свайп. Читаем актуальный вагон из ref.
  useEffect(() => {
    let lastWheel = 0;
    let tx: number | null = null;
    let ty = 0;

    function onWheel(e: WheelEvent) {
      const now = Date.now();
      if (now - lastWheel < 550) return;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(d) < 12) return;
      lastWheel = now;
      step(d > 0 ? 1 : -1);
    }
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (["ArrowRight", "ArrowDown", "PageDown"].includes(e.key)) {
        e.preventDefault();
        step(1);
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        step(-1);
      }
    }
    function onTS(e: TouchEvent) {
      tx = e.touches[0].clientX;
      ty = e.touches[0].clientY;
    }
    function onTE(e: TouchEvent) {
      if (tx == null) return;
      const dx = e.changedTouches[0].clientX - tx;
      const dy = e.changedTouches[0].clientY - ty;
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 55) {
        if (dx < -55 || dy < -55) step(1);
        else step(-1);
      }
      tx = null;
    }

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTS, { passive: true });
    window.addEventListener("touchend", onTE, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTS);
      window.removeEventListener("touchend", onTE);
    };
  }, [step]);

  function changeSpeed(s: SpeedKey) {
    setSpeed(s);
    navRef.current.duration = SPEEDS[s];
  }

  // Смену режима камеры блокируем, пока не припаркованы, чтобы не ломать траекторию.
  function changeMode(m: NavMode) {
    const nav = navRef.current;
    if (nav.animating || nav.cur !== nav.tgt) return;
    setMode(m);
    nav.mode = m;
  }

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      {/* Шапка: логотип, номера вагонов (прыжок), скорость */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 border-b border-line bg-ink/70 px-4 py-3 backdrop-blur sm:px-8">
        <button
          type="button"
          onClick={() => jumpTo(0)}
          className="-rotate-2 font-display text-2xl font-bold text-acid drop-shadow-[2px_2px_0_#0a0a0a]"
        >
          [LOGO]
        </button>
        <nav className="flex items-center gap-1.5">
          {WAGONS.map((w, i) => (
            <button
              key={w.num}
              type="button"
              onClick={() => jumpTo(i)}
              title={w.label}
              className={
                "h-6 w-9 border font-display text-xs " +
                (i === current
                  ? "border-acid bg-acid text-ink"
                  : "border-line bg-ink-soft text-muted")
              }
            >
              {w.num}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportObjectToGlb(sceneRef.current, "train-bench")}
            className="border border-line bg-ink-soft px-2 py-1.5 text-xs text-fog"
            title="Скачать лавку как .glb для доработки в Blender"
          >
            Лавка → .glb
          </button>
          <select
            value={htmlMode}
            onChange={(e) => setHtmlMode(e.target.value as HtmlLayerMode)}
            className="border border-line bg-ink-soft px-2 py-1.5 text-xs text-fog"
            title="Отрисовка HTML-контента"
          >
            <option value="overlay">HTML: поверх</option>
            <option value="blending">HTML: в сцене (β)</option>
          </select>
          <select
            value={mode}
            onChange={(e) => changeMode(e.target.value as NavMode)}
            className="border border-line bg-ink-soft px-2 py-1.5 text-xs text-fog"
            title="Режим камеры"
          >
            <option value="turn">Поворот к стене</option>
            <option value="straight">Прямой пролёт</option>
          </select>
          <select
            value={speed}
            onChange={(e) => changeSpeed(e.target.value as SpeedKey)}
            className="border border-line bg-ink-soft px-2 py-1.5 text-xs text-fog"
            title="Скорость перехода"
          >
            {Object.keys(SPEEDS).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* key: смена способа отрисовки HTML пересоздаёт GL-контекст (alpha).
          В blending-режиме канвас прозрачный (дырки под HTML), фон — у страницы. */}
      <Canvas
        key={htmlMode}
        shadows
        gl={{ antialias: true, alpha: htmlMode === "blending" }}
        camera={{ fov: 60, near: 0.1, far: 100, position: [0, EYE, cameraZ(0)] }}
      >
        {htmlMode === "overlay" && <color attach="background" args={["#050505"]} />}
        <fog attach="fog" args={["#050505", 10, 40]} />
        <SceneGrabber sceneRef={sceneRef} />
        <Lights navRef={navRef} />
        <Suspense fallback={null}>
          <Tunnel />
          {WAGONS.map((_, i) => (
            <Bulkhead key={i} index={i} navRef={navRef} />
          ))}
          {/* «Голова» поезда за вагоном 00 — переборка кабины машиниста */}
          <DriverCabin z={Z_START + 0.02} w={W} h={H} />
        </Suspense>
        <TunnelTrim />
        <TunnelWindows navRef={navRef} />
        {/* Уникальные объекты вагонов: 00 — экран с видео, 01 — неоновая
            вывеска, 02 — шоурум ПК-сетапа. Всё в кадре парковки своего вагона. */}
        <WallTV position={[-W / 2 + 0.1, 1.5, cameraZ(0) + 2]} />
        <NeonSign position={[-W / 2 + 0.09, 1.55, cameraZ(1) + 2.25]} />
        <PCSetup z={cameraZ(2)} />
        {WAGONS.map((w, i) => (
          <WagonPanel
            key={w.num}
            index={i}
            mode={mode}
            htmlMode={htmlMode}
            visible={current === i && !inTransit}
          >
            {w.Content({ onDeeper: () => jumpTo(i + 1) })}
          </WagonPanel>
        ))}
        <CameraRig navRef={navRef} onParked={onParked} />
        {/* Постобработка затирает альфа-«дырки» blending-режима — только overlay. */}
        {htmlMode === "overlay" && (
          <EffectComposer multisampling={4}>
            <Bloom mipmapBlur intensity={0.45} luminanceThreshold={1} luminanceSmoothing={0.3} />
          </EffectComposer>
        )}
      </Canvas>

      {/* Атмосфера концепта: виньетка, уголки, сканлайны */}
      <div className="pointer-events-none fixed inset-0 z-40 shadow-[inset_0_0_180px_40px_rgba(0,0,0,0.85)]" />
      <div className="pointer-events-none fixed inset-4 z-40 border border-acid/15" />
      <div className="pointer-events-none fixed inset-0 z-[41] bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.16)_0_1px,transparent_1px_3px)] opacity-50 mix-blend-multiply" />
    </div>
  );
}
