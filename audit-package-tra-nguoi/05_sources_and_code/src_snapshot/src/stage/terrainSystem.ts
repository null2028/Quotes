import React from 'react';
import { evolvePath } from '@remotion/paths';
import {
  TerrainConfigInput,
  TerrainType,
  XCoord,
  XKeyword,
} from './stageScriptSchema';

export const STAGE_VIEWBOX = '62 126 416 250';
export const DEFAULT_GROUND_Y = 352;

export const X_KEYWORD_MAP: Record<XKeyword, number> = {
  far_left: 115,
  left: 175,
  center_left: 225,
  center: 270,
  center_right: 315,
  right: 365,
  far_right: 425,
};

export function resolveXCoord(val: XCoord | undefined, fallback = 270): number {
  if (val === undefined) return fallback;
  if (typeof val === 'number') return val;
  return X_KEYWORD_MAP[val] ?? fallback;
}

export interface NormalizedTerrainConfig {
  type: TerrainType;
  y: number;
  startX: number;
  endX: number;
  angleDeg: number;
  hillCenterX: number;
  hillHeight: number;
  hillWidth: number;
  forkAtX: number;
  forkAngleDeg: number;
  shoreX: number;
  waterSide: 'left' | 'right';
  waveAmplitude: number;
  gapCenterX: number;
  gapHalfWidth: number;
  bridgeProgress: number;
  stepCount: number;
  stepRise: number;
  stairsStartX: number;
  stairsEndX: number;
  points: Array<[number, number]>;
  smooth: boolean;
  customSvgD?: string;
}

export function normalizeTerrainConfig(
  input: TerrainConfigInput | undefined,
  dynamicBridgeProgress?: number
): NormalizedTerrainConfig {
  if (!input || typeof input === 'string') {
    const type: TerrainType = input || 'flat';
    return {
      type,
      y: DEFAULT_GROUND_Y,
      startX: 70,
      endX: 470,
      angleDeg: type === 'slope' ? -10 : 0,
      hillCenterX: 270,
      hillHeight: 24,
      hillWidth: 180,
      forkAtX: 260,
      forkAngleDeg: -14,
      shoreX: 255,
      waterSide: 'right',
      waveAmplitude: 4.0,
      gapCenterX: 270,
      gapHalfWidth: 48,
      bridgeProgress: dynamicBridgeProgress ?? 0,
      stepCount: 4,
      stepRise: -8,
      stairsStartX: 190,
      stairsEndX: 350,
      points: [],
      smooth: true,
    };
  }

  const rawPoints = Array.isArray(input.points)
    ? [...input.points]
        .filter(
          (pt): pt is [number, number] =>
            Array.isArray(pt) &&
            pt.length >= 2 &&
            Number.isFinite(pt[0]) &&
            Number.isFinite(pt[1])
        )
        .sort((a, b) => a[0] - b[0])
    : [];

  const inferredType: TerrainType =
    input.type ?? (rawPoints.length >= 2 ? 'custom_path' : 'flat');

  const defaultStartX =
    rawPoints.length >= 2 ? Math.min(70, rawPoints[0][0]) : 70;
  const defaultEndX =
    rawPoints.length >= 2
      ? Math.max(470, rawPoints[rawPoints.length - 1][0])
      : 470;

  return {
    type: inferredType,
    y: input.y ?? (rawPoints.length >= 2 ? rawPoints[0][1] : DEFAULT_GROUND_Y),
    startX: input.startX ?? defaultStartX,
    endX: input.endX ?? defaultEndX,
    angleDeg: input.angleDeg ?? -10,
    hillCenterX: resolveXCoord(input.hillCenterX, 270),
    hillHeight: input.hillHeight ?? 24,
    hillWidth: Math.max(40, input.hillWidth ?? 180),
    forkAtX: resolveXCoord(input.forkAtX, 260),
    forkAngleDeg: input.forkAngleDeg ?? -14,
    shoreX: resolveXCoord(input.shoreX, 255),
    waterSide: input.waterSide ?? 'right',
    waveAmplitude: input.waveAmplitude ?? 4.0,
    gapCenterX: resolveXCoord(input.gapCenterX, 270),
    gapHalfWidth: input.gapHalfWidth ?? 48,
    bridgeProgress: dynamicBridgeProgress ?? input.bridgeProgress ?? 0,
    stepCount: Math.max(1, Math.min(16, Math.round(input.stepCount ?? 4))),
    stepRise: input.stepRise ?? -8,
    stairsStartX: resolveXCoord(input.stairsStartX, 190),
    stairsEndX: resolveXCoord(input.stairsEndX, 350),
    points: rawPoints,
    smooth: input.smooth ?? true,
    customSvgD: input.customSvgD,
  };
}

/**
 * Tính cao độ mặt đất y và góc nghiêng tiếp tuyến angleDeg tại hoành độ x
 * Giúp mọi nhân vật và đạo cụ mặt đất luôn bám khít địa hình 100%.
 */
export function getTerrainPoint(
  terrainInput: TerrainConfigInput | NormalizedTerrainConfig | undefined,
  x: number,
  phase: number = 0,
  dynamicBridgeProgress?: number
): { y: number; angleDeg: number } {
  const cfg: NormalizedTerrainConfig =
    terrainInput &&
    typeof terrainInput === 'object' &&
    typeof (terrainInput as NormalizedTerrainConfig).hillCenterX === 'number'
      ? (terrainInput as NormalizedTerrainConfig)
      : normalizeTerrainConfig(
          terrainInput as TerrainConfigInput | undefined,
          dynamicBridgeProgress
        );

  const baseY = cfg.y;

  switch (cfg.type) {
    case 'flat':
    case 'fork':
      return { y: baseY, angleDeg: 0 };

    case 'slope': {
      const clampedDeg = Math.max(-25, Math.min(25, cfg.angleDeg));
      const rad = (clampedDeg * Math.PI) / 180;
      const y = baseY + (x - 270) * Math.tan(rad);
      return { y, angleDeg: clampedDeg };
    }

    case 'hill': {
      const halfW = cfg.hillWidth / 2;
      const u = (x - cfg.hillCenterX) / halfW;
      if (Math.abs(u) >= 1) {
        return { y: baseY, angleDeg: 0 };
      }
      const dy = -cfg.hillHeight * 0.5 * (1 + Math.cos(Math.PI * u));
      const slope =
        (cfg.hillHeight * 0.5 * Math.PI * Math.sin(Math.PI * u)) / halfW;
      const angleDeg = (Math.atan(slope) * 180) / Math.PI;
      return { y: baseY + dy, angleDeg };
    }

    case 'water_shore': {
      const isWater =
        cfg.waterSide === 'right' ? x > cfg.shoreX + 6 : x < cfg.shoreX - 6;
      if (!isWater) {
        return { y: baseY, angleDeg: 0 };
      }
      const dist = Math.abs(x - cfg.shoreX);
      const env = Math.min(1, dist / 28);
      const waveArg = (x - cfg.shoreX) * 0.065 + phase * 0.35 * 1.3;
      const waveY =
        baseY + 5 * env + Math.sin(waveArg) * cfg.waveAmplitude * env;
      const waveSlope =
        Math.cos(waveArg) * 0.065 * cfg.waveAmplitude * env;
      const angleDeg = (Math.atan(waveSlope) * 180) / Math.PI;
      return { y: waveY, angleDeg };
    }

    case 'cliff_gap': {
      const leftEdge = cfg.gapCenterX - cfg.gapHalfWidth;
      const rightEdge = cfg.gapCenterX + cfg.gapHalfWidth;
      if (x >= leftEdge && x <= rightEdge && cfg.bridgeProgress > 0.25) {
        const u = (x - cfg.gapCenterX) / Math.max(1, cfg.gapHalfWidth);
        const archY = baseY - 12 * (1 - u * u);
        const slope = (24 * u) / Math.max(1, cfg.gapHalfWidth);
        return {
          y: archY,
          angleDeg: (Math.atan(slope) * 180) / Math.PI,
        };
      }
      return { y: baseY, angleDeg: 0 };
    }

    case 'stairs': {
      const sStart = Math.min(cfg.stairsStartX, cfg.stairsEndX - 24);
      const sEnd = Math.max(cfg.stairsEndX, sStart + 24);
      const steps = Math.max(1, cfg.stepCount);
      const stepW = (sEnd - sStart) / steps;
      const totalRise = cfg.stepRise * steps;

      if (x <= sStart) {
        return { y: baseY, angleDeg: 0 };
      }
      if (x >= sEnd) {
        return { y: baseY + totalRise, angleDeg: 0 };
      }

      // Chuyển tiếp mượt quanh gờ bậc (~28% bề rộng bậc) để bước chân leo bậc êm 60fps
      const rawPos = (x - sStart) / stepW;
      const stepIdx = Math.min(steps - 1, Math.floor(rawPos));
      const frac = rawPos - stepIdx;
      const bevelZone = 0.28;
      let localLift = 1;
      let slope = 0;
      if (frac < bevelZone) {
        const u = frac / bevelZone;
        localLift = 0.5 * (1 - Math.cos(Math.PI * u));
        slope =
          (cfg.stepRise * 0.5 * Math.PI * Math.sin(Math.PI * u)) /
          Math.max(1, stepW * bevelZone);
      }
      const y = baseY + cfg.stepRise * (stepIdx + localLift);
      const angleDeg = Math.max(
        -18,
        Math.min(18, (Math.atan(slope) * 180) / Math.PI)
      );
      return { y, angleDeg };
    }

    case 'custom_path': {
      const pts = cfg.points;
      if (!pts || pts.length < 2) {
        return { y: baseY, angleDeg: 0 };
      }
      if (x <= pts[0][0]) {
        return { y: pts[0][1], angleDeg: 0 };
      }
      const last = pts[pts.length - 1];
      if (x >= last[0]) {
        return { y: last[1], angleDeg: 0 };
      }

      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[i + 1];
        if (x >= x0 && x <= x1) {
          const dx = Math.max(0.001, x1 - x0);
          const dy = y1 - y0;
          const u = (x - x0) / dx;
          if (cfg.smooth !== false && dx >= 6) {
            const y = y0 + dy * 0.5 * (1 - Math.cos(Math.PI * u));
            const slope = (dy * 0.5 * Math.PI * Math.sin(Math.PI * u)) / dx;
            const angleDeg = Math.max(
              -26,
              Math.min(26, (Math.atan(slope) * 180) / Math.PI)
            );
            return { y, angleDeg };
          }
          const y = y0 + dy * u;
          // Với gờ thẳng đứng (dx < 5), giữ góc nghiêng êm nhẹ để nhân vật không bị đổ ngang
          const angleDeg =
            dx < 5
              ? 0
              : Math.max(-24, Math.min(24, (Math.atan2(dy, dx) * 180) / Math.PI));
          return { y, angleDeg };
        }
      }
      return { y: last[1], angleDeg: 0 };
    }

    default:
      return { y: baseY, angleDeg: 0 };
  }
}

export const TerrainRenderer: React.FC<{
  terrain: NormalizedTerrainConfig;
  drawProgress: number;
  phase: number;
  stroke: string;
  secondaryStroke: string;
  accentStroke: string;
  strokeWidth: number;
  solidHorizon?: boolean;
}> = ({
  terrain,
  drawProgress,
  phase,
  stroke,
  secondaryStroke,
  accentStroke,
  solidHorizon = false,
}) => {
  const safeDraw = Math.max(0, Math.min(1, drawProgress));
  if (safeDraw <= 0.002) {
    return null;
  }
  const evoDraw = Math.max(0.001, safeDraw);
  const rawInkGate = Math.max(0, Math.min(1, safeDraw / 0.18));
  const inkAlpha = 0.5 - 0.5 * Math.cos(Math.PI * rawInkGate);
  const rawShadowGate = Math.max(0, Math.min(1, (safeDraw - 0.45) / 0.55));
  const shadowAlphaMult = 0.5 - 0.5 * Math.cos(Math.PI * rawShadowGate);
  const fineHorizonStrokeWidth = solidHorizon ? 1.28 : 1.15;
  const gradId = `terrain-fade-grad-${terrain.type}-${Math.round(terrain.startX)}-${Math.round(terrain.endX)}-${solidHorizon ? 's' : 'w'}`;
  const span = Math.max(40, terrain.endX - terrain.startX);
  const shadowStartX = terrain.startX + span * (solidHorizon ? 0.2 : 0.12);
  const shadowEndX = terrain.endX - span * (solidHorizon ? 0.2 : 0.12);

  const gradientDefs = React.createElement(
    'defs',
    null,
    React.createElement(
      'linearGradient',
      {
        id: gradId,
        gradientUnits: 'userSpaceOnUse',
        x1: terrain.startX,
        y1: terrain.y,
        x2: terrain.endX,
        y2: terrain.y,
      },
      React.createElement('stop', {
        offset: '0%',
        stopColor: stroke,
        stopOpacity: 0,
      }),
      React.createElement('stop', {
        offset: solidHorizon ? '16%' : '10%',
        stopColor: stroke,
        stopOpacity: solidHorizon ? 0.72 : 0.42,
      }),
      React.createElement('stop', {
        offset: '50%',
        stopColor: stroke,
        stopOpacity: solidHorizon ? 0.92 : 0.68,
      }),
      React.createElement('stop', {
        offset: solidHorizon ? '84%' : '90%',
        stopColor: stroke,
        stopOpacity: solidHorizon ? 0.72 : 0.42,
      }),
      React.createElement('stop', {
        offset: '100%',
        stopColor: stroke,
        stopOpacity: 0,
      })
    )
  );

  if (terrain.type === 'flat' || terrain.type === 'fork') {
    const mainPath = `M ${terrain.startX} ${terrain.y} L ${terrain.endX} ${terrain.y}`;
    const shadowPath = `M ${shadowStartX.toFixed(1)} ${(terrain.y + 2.2).toFixed(1)} L ${shadowEndX.toFixed(1)} ${(terrain.y + 2.2).toFixed(1)}`;
    const mainEvo = evolvePath(evoDraw, mainPath);

    let forkNode: React.ReactNode = null;
    if (terrain.type === 'fork') {
      const rad = (terrain.forkAngleDeg * Math.PI) / 180;
      const branchLen = 155;
      const endForkX = terrain.forkAtX + Math.cos(rad) * branchLen;
      const endForkY = terrain.y + Math.sin(rad) * branchLen;
      const ctrlX = terrain.forkAtX + branchLen * 0.45;
      const ctrlY = terrain.y + Math.sin(rad) * branchLen * 0.25;
      const forkPath = `M ${terrain.forkAtX} ${terrain.y} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${endForkX.toFixed(1)} ${endForkY.toFixed(1)}`;
      forkNode = React.createElement('path', {
        d: forkPath,
        fill: 'none',
        stroke: secondaryStroke,
        strokeWidth: 1.0,
        strokeLinecap: 'round',
        strokeDasharray: '5 5',
        opacity: shadowAlphaMult * 0.48,
      });
    }

    return React.createElement(
      'g',
      { opacity: inkAlpha },
      gradientDefs,
      forkNode,
      React.createElement('path', {
        d: mainPath,
        fill: 'none',
        stroke: `url(#${gradId})`,
        strokeWidth: fineHorizonStrokeWidth,
        strokeLinecap: 'round',
        strokeDasharray: mainEvo.strokeDasharray,
        strokeDashoffset: mainEvo.strokeDashoffset,
      }),
      React.createElement('path', {
        d: shadowPath,
        fill: 'none',
        stroke,
        strokeWidth: solidHorizon ? 0.52 : 0.85,
        strokeLinecap: 'round',
        opacity: (solidHorizon ? 0.14 : 0.1) * shadowAlphaMult,
      })
    );
  }

  if (terrain.type === 'slope' || terrain.type === 'hill') {
    const steps = 48;
    const cmds: string[] = [];
    const shadowCmds: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = terrain.startX + t * (terrain.endX - terrain.startX);
      const pt = getTerrainPoint(terrain, px, phase);
      cmds.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${pt.y.toFixed(1)}`);
      if (t >= 0.12 && t <= 0.88) {
        shadowCmds.push(
          `${shadowCmds.length === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${(pt.y + 2.5).toFixed(1)}`
        );
      }
    }
    const d = cmds.join(' ');
    const shadowD = shadowCmds.join(' ');
    const evo = evolvePath(evoDraw, d);
    return React.createElement(
      'g',
      { opacity: inkAlpha },
      gradientDefs,
      React.createElement('path', {
        d,
        fill: 'none',
        stroke: `url(#${gradId})`,
        strokeWidth: fineHorizonStrokeWidth,
        strokeLinecap: 'round',
        strokeDasharray: evo.strokeDasharray,
        strokeDashoffset: evo.strokeDashoffset,
      }),
      React.createElement('path', {
        d: shadowD,
        fill: 'none',
        stroke,
        strokeWidth: 0.85,
        strokeLinecap: 'round',
        opacity: 0.1 * shadowAlphaMult,
      })
    );
  }

  if (terrain.type === 'water_shore') {
    const shoreX = terrain.shoreX;
    const landStart = terrain.waterSide === 'right' ? terrain.startX : shoreX;
    const landEnd = terrain.waterSide === 'right' ? shoreX : terrain.endX;
    const waterStart = terrain.waterSide === 'right' ? shoreX : terrain.startX;
    const waterEnd = terrain.waterSide === 'right' ? terrain.endX : shoreX;

    const landPath = `M ${landStart} ${terrain.y} L ${landEnd} ${terrain.y}`;
    const landEvo = evolvePath(evoDraw, landPath);

    const steps = 36;
    const waveCmds: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const wx = waterStart + t * (waterEnd - waterStart);
      const pt = getTerrainPoint(terrain, wx, phase);
      waveCmds.push(
        `${i === 0 ? 'M' : 'L'} ${wx.toFixed(1)} ${pt.y.toFixed(1)}`
      );
    }
    const wavePath = waveCmds.join(' ');
    const waveEvo = evolvePath(evoDraw, wavePath);

    return React.createElement(
      'g',
      { opacity: inkAlpha },
      gradientDefs,
      React.createElement('path', {
        d: landPath,
        fill: 'none',
        stroke: `url(#${gradId})`,
        strokeWidth: fineHorizonStrokeWidth,
        strokeLinecap: 'round',
        strokeDasharray: landEvo.strokeDasharray,
        strokeDashoffset: landEvo.strokeDashoffset,
      }),
      React.createElement('path', {
        d: wavePath,
        fill: 'none',
        stroke: `url(#${gradId})`,
        strokeWidth: 1.05,
        strokeLinecap: 'round',
        strokeDasharray: waveEvo.strokeDasharray,
        strokeDashoffset: waveEvo.strokeDashoffset,
      })
    );
  }

  if (terrain.type === 'stairs') {
    const sStart = Math.min(terrain.stairsStartX, terrain.stairsEndX - 24);
    const sEnd = Math.max(terrain.stairsEndX, sStart + 24);
    const steps = Math.max(1, terrain.stepCount);
    const stepW = (sEnd - sStart) / steps;
    const cmds: string[] = [
      `M ${terrain.startX.toFixed(1)} ${terrain.y.toFixed(1)}`,
      `L ${sStart.toFixed(1)} ${terrain.y.toFixed(1)}`,
    ];
    for (let i = 0; i < steps; i++) {
      const riserX = sStart + i * stepW;
      const treadEnd = sStart + (i + 1) * stepW;
      const stepY = terrain.y + terrain.stepRise * (i + 1);
      cmds.push(`L ${riserX.toFixed(1)} ${stepY.toFixed(1)}`);
      cmds.push(`L ${treadEnd.toFixed(1)} ${stepY.toFixed(1)}`);
    }
    const finalY = terrain.y + terrain.stepRise * steps;
    cmds.push(`L ${terrain.endX.toFixed(1)} ${finalY.toFixed(1)}`);
    const d = cmds.join(' ');
    const evo = evolvePath(evoDraw, d);

    return React.createElement(
      'g',
      { opacity: inkAlpha },
      gradientDefs,
      terrain.customSvgD
        ? React.createElement('path', {
            d: terrain.customSvgD,
            fill: 'none',
            stroke: secondaryStroke,
            strokeWidth: 0.9,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            opacity: 0.42 * shadowAlphaMult,
          })
        : null,
      React.createElement('path', {
        d,
        fill: 'none',
        stroke: `url(#${gradId})`,
        strokeWidth: fineHorizonStrokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeDasharray: evo.strokeDasharray,
        strokeDashoffset: evo.strokeDashoffset,
      })
    );
  }

  if (terrain.type === 'custom_path') {
    const pts = terrain.points;
    let d: string;
    let shadowD = '';
    if (!pts || pts.length < 2) {
      d = `M ${terrain.startX} ${terrain.y} L ${terrain.endX} ${terrain.y}`;
    } else if (terrain.smooth === false) {
      const polyPts: Array<[number, number]> = [];
      if (terrain.startX < pts[0][0] - 1) {
        polyPts.push([terrain.startX, pts[0][1]]);
      }
      polyPts.push(...pts);
      const last = pts[pts.length - 1];
      if (terrain.endX > last[0] + 1) {
        polyPts.push([terrain.endX, last[1]]);
      }
      d = polyPts
        .map(
          ([px, py], idx) =>
            `${idx === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`
        )
        .join(' ');
    } else {
      const steps = 64;
      const cmds: string[] = [];
      const shadowCmds: string[] = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = terrain.startX + t * (terrain.endX - terrain.startX);
        const pt = getTerrainPoint(terrain, px, phase);
        cmds.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${pt.y.toFixed(1)}`);
        if (t >= 0.14 && t <= 0.86) {
          shadowCmds.push(
            `${shadowCmds.length === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${(pt.y + 2.4).toFixed(1)}`
          );
        }
      }
      d = cmds.join(' ');
      shadowD = shadowCmds.join(' ');
    }
    const evo = evolvePath(evoDraw, d);
    return React.createElement(
      'g',
      { opacity: inkAlpha },
      gradientDefs,
      terrain.customSvgD
        ? React.createElement('path', {
            d: terrain.customSvgD,
            fill: 'none',
            stroke: secondaryStroke,
            strokeWidth: 0.92,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            opacity: 0.45 * shadowAlphaMult,
          })
        : null,
      React.createElement('path', {
        d,
        fill: 'none',
        stroke: `url(#${gradId})`,
        strokeWidth: fineHorizonStrokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeDasharray: evo.strokeDasharray,
        strokeDashoffset: evo.strokeDashoffset,
      }),
      shadowD
        ? React.createElement('path', {
            d: shadowD,
            fill: 'none',
            stroke,
            strokeWidth: 0.82,
            strokeLinecap: 'round',
            opacity: 0.1 * shadowAlphaMult,
          })
        : null
    );
  }

  // cliff_gap
  const leftEdge = terrain.gapCenterX - terrain.gapHalfWidth;
  const rightEdge = terrain.gapCenterX + cfgGapHalf(terrain);
  const leftPath = `M ${terrain.startX} ${terrain.y} L ${leftEdge} ${terrain.y} L ${leftEdge - 8} ${terrain.y + 42}`;
  const rightPath = `M ${rightEdge + 8} ${terrain.y + 42} L ${rightEdge} ${terrain.y} L ${terrain.endX} ${terrain.y}`;
  const bridgePath = `M ${leftEdge} ${terrain.y} Q ${terrain.gapCenterX} ${terrain.y - 14} ${rightEdge} ${terrain.y}`;

  const leftEvo = evolvePath(evoDraw, leftPath);
  const rightEvo = evolvePath(evoDraw, rightPath);
  const bridgeEvo = evolvePath(
    Math.max(0.001, terrain.bridgeProgress),
    bridgePath
  );

  return React.createElement(
    'g',
    { opacity: inkAlpha },
    gradientDefs,
    React.createElement('path', {
      d: leftPath,
      fill: 'none',
      stroke: `url(#${gradId})`,
      strokeWidth: fineHorizonStrokeWidth,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeDasharray: leftEvo.strokeDasharray,
      strokeDashoffset: leftEvo.strokeDashoffset,
    }),
    React.createElement('path', {
      d: rightPath,
      fill: 'none',
      stroke: `url(#${gradId})`,
      strokeWidth: fineHorizonStrokeWidth,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeDasharray: rightEvo.strokeDasharray,
      strokeDashoffset: rightEvo.strokeDashoffset,
    }),
    terrain.bridgeProgress > 0.02
      ? React.createElement('path', {
          d: bridgePath,
          fill: 'none',
          stroke: accentStroke,
          strokeWidth: 1.25,
          strokeLinecap: 'round',
          strokeDasharray: bridgeEvo.strokeDasharray,
          strokeDashoffset: bridgeEvo.strokeDashoffset,
          opacity: 0.85,
        })
      : null
  );
};

function cfgGapHalf(t: NormalizedTerrainConfig): number {
  return t.gapHalfWidth;
}
