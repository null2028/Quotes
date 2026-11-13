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
    };
  }

  return {
    type: input.type ?? 'flat',
    y: input.y ?? DEFAULT_GROUND_Y,
    startX: input.startX ?? 70,
    endX: input.endX ?? 470,
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
  const safeDraw = Math.max(0.001, Math.min(1, drawProgress));
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
    const mainEvo = evolvePath(safeDraw, mainPath);

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
        opacity: safeDraw * 0.48,
      });
    }

    return React.createElement(
      'g',
      { opacity: safeDraw },
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
        opacity: solidHorizon ? 0.14 : 0.1,
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
    const evo = evolvePath(safeDraw, d);
    return React.createElement(
      'g',
      { opacity: safeDraw },
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
        opacity: 0.1,
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
    const landEvo = evolvePath(safeDraw, landPath);

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
    const waveEvo = evolvePath(safeDraw, wavePath);

    return React.createElement(
      'g',
      { opacity: safeDraw },
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

  // cliff_gap
  const leftEdge = terrain.gapCenterX - terrain.gapHalfWidth;
  const rightEdge = terrain.gapCenterX + cfgGapHalf(terrain);
  const leftPath = `M ${terrain.startX} ${terrain.y} L ${leftEdge} ${terrain.y} L ${leftEdge - 8} ${terrain.y + 42}`;
  const rightPath = `M ${rightEdge + 8} ${terrain.y + 42} L ${rightEdge} ${terrain.y} L ${terrain.endX} ${terrain.y}`;
  const bridgePath = `M ${leftEdge} ${terrain.y} Q ${terrain.gapCenterX} ${terrain.y - 14} ${rightEdge} ${terrain.y}`;

  const leftEvo = evolvePath(safeDraw, leftPath);
  const rightEvo = evolvePath(safeDraw, rightPath);
  const bridgeEvo = evolvePath(
    Math.max(0.001, terrain.bridgeProgress),
    bridgePath
  );

  return React.createElement(
    'g',
    { opacity: safeDraw },
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
