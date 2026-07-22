import { describe, it, expect } from "vitest";
import {
  BAY,
  CAM_BACK,
  EYE,
  SIDE_X,
  cameraZ,
  sampleCameraZ,
  samplePose,
  parkedPose,
  doorOpenForWall,
  smoothstep,
} from "./depthNav";

describe("cameraZ", () => {
  it("вагон i припаркован на CAM_BACK ближе своей переборки", () => {
    expect(cameraZ(0)).toBe(-CAM_BACK);
    expect(cameraZ(1)).toBe(BAY - CAM_BACK);
    expect(cameraZ(3)).toBe(3 * BAY - CAM_BACK);
  });
});

describe("smoothstep", () => {
  it("сглажен на краях, линеен в центре", () => {
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(1)).toBe(1);
    expect(smoothstep(0.5)).toBe(0.5);
  });
});

describe("sampleCameraZ", () => {
  it("совпадает с парковочными позициями на краях перехода", () => {
    expect(sampleCameraZ(0, 1, 0)).toBeCloseTo(cameraZ(0));
    expect(sampleCameraZ(0, 1, 1)).toBeCloseTo(cameraZ(1));
  });

  it("припаркованы (current===target) — камера стоит на месте", () => {
    expect(sampleCameraZ(2, 2, 0.4)).toBeCloseTo(cameraZ(2));
  });

  it("едет вперёд монотонно при переходе глубже", () => {
    let prev = -Infinity;
    for (let p = 0; p <= 1.0001; p += 0.1) {
      const z = sampleCameraZ(0, 1, p);
      expect(z).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = z;
    }
  });
});

describe("parkedPose", () => {
  it("straight: камера в центре прохода, смотрит вперёд по Z", () => {
    const p = parkedPose(1, "straight");
    expect(p.position).toEqual([0, EYE, cameraZ(1)]);
    expect(p.target[2]).toBeGreaterThan(p.position[2]);
  });

  it("turn: камера смещена вправо и смотрит на левую стену перпендикулярно", () => {
    const p = parkedPose(1, "turn");
    expect(p.position[0]).toBe(SIDE_X);
    expect(p.target[0]).toBeLessThan(p.position[0]);
    expect(p.target[2]).toBeCloseTo(p.position[2]);
  });
});

describe("samplePose (turn)", () => {
  it("края перехода совпадают с парковочными позами", () => {
    // Сравнение покомпонентно с допуском: lerp(a, b, 1) даёт b с точностью
    // до ошибки округления float.
    const closeToPose = (
      got: ReturnType<typeof samplePose>,
      want: ReturnType<typeof parkedPose>,
    ) => {
      for (let k = 0; k < 3; k++) {
        expect(got.position[k]).toBeCloseTo(want.position[k], 10);
        expect(got.target[k]).toBeCloseTo(want.target[k], 10);
      }
    };
    closeToPose(samplePose(0, 1, 0, "turn"), parkedPose(0, "turn"));
    closeToPose(samplePose(0, 1, 1, "turn"), parkedPose(1, "turn"));
  });

  it("в середине перехода камера в проходе и смотрит вперёд", () => {
    const p = samplePose(0, 1, 0.5, "turn");
    expect(p.position[0]).toBeCloseTo(0);
    expect(p.target[2]).toBeGreaterThan(p.position[2]);
  });

  it("назад: в середине перехода смотрит в хвост поезда", () => {
    const p = samplePose(1, 0, 0.5, "turn");
    expect(p.target[2]).toBeLessThan(p.position[2]);
  });

  it("припаркованы — поза стены независимо от p", () => {
    expect(samplePose(2, 2, 0.7, "turn")).toEqual(parkedPose(2, "turn"));
  });
});

describe("doorOpenForWall", () => {
  it("припаркованы — все проёмы закрыты", () => {
    expect(doorOpenForWall(0, 1, 1, 0.5)).toBe(0);
    expect(doorOpenForWall(1, 1, 1, 0.5)).toBe(0);
  });

  it("straight: проём на пути открывается в середине перехода", () => {
    expect(doorOpenForWall(0, 0, 1, 0)).toBeLessThan(0.5);
    expect(doorOpenForWall(0, 0, 1, 0.5)).toBeGreaterThan(0.5);
  });

  it("проёмы, мимо которых не летим, остаются закрытыми", () => {
    for (let p = 0; p <= 1.0001; p += 0.25) {
      expect(doorOpenForWall(1, 0, 1, p)).toBe(0);
    }
  });

  it("симметрично по направлению: 1→0 открывает ту же переборку k=0", () => {
    expect(doorOpenForWall(0, 1, 0, 0.5)).toBeGreaterThan(0.5);
  });

  it("turn: проём на пути открыт в середине пролёта и закрыт на старте", () => {
    expect(doorOpenForWall(0, 0, 1, 0, "turn")).toBe(0);
    expect(doorOpenForWall(0, 0, 1, 0.5, "turn")).toBeGreaterThan(0.9);
  });
});
