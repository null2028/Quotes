import { BUILT_IN_PROP_CATALOG } from './propCatalog';
import { interpolate, interpolateColors, Easing } from 'remotion';
import { TimelineSyncResult } from '../engine/timelineSync';
import { ResolvedVisualDNA } from '../engine/visualDnaResolver';
import { ThemePalette } from '../theme/palettes';
import { levitateWeightless } from '../kit/SlowMotionVerbs';
import type { TravelerPoseWeights } from '../kit/CloakedTraveler';
import { TEMPO, MIN_RED_AREA_PX2 } from './stageConstants';
import { isFreeModeStageScript } from './legacySceneIds';
import {
  computePropRedStageArea,
  PX2_PER_STAGE_UNIT2,
} from './stageGeometry';
import {
  ColorRole,
  FocusRole,
  PropIdle,
  PropSpec,
  StageLayer,
  StageScript,
  StageTravelerPose,
} from './stageScriptSchema';
import {
  EvaluatedTerrainSegment,
  getTerrainPoint,
  NormalizedTerrainConfig,
  normalizeTerrainConfig,
  resolveXCoord,
} from './terrainSystem';
import {
  evaluateEnterLeaveMultiplier,
  resolveCueFrame,
} from './timeResolver';

export interface NumericSegment {
  startFrame: number;
  endFrame: number;
  toValue: number;
  arcY?: number;
}

// Easing chậm hai đầu đối xứng (Nhịp Trà Nguội — không tuyến tính, không bật nảy)
const CINEMAGRAPH_EASING = Easing.inOut(Easing.cubic);

/**
 * Đảm bảo khoảng lặng giữ tư thế tối thiểu (`holdFrames` ≥ 1.0s) giữa 2 chuyển động kế tiếp của cùng nhân vật.
 * - Bỏ qua các đoạn không đổi giá trị (vd cue khởi tạo `bat_dau`).
 * - Giữ nguyên cặp nửa nhịp nội bộ của một cử chỉ đơn (vd `khung_lai` recoil 0.24s nối liền settle).
 * - Không đẩy một chuyển động trước cú lật vượt sang sau `pivotFrame`.
 */
function enforcePostMotionHold(
  rawSegments: NumericSegment[],
  initialValue: number,
  holdFrames: number,
  pivotFrame: number,
  fps: number
): NumericSegment[] {
  if (rawSegments.length <= 1 || holdFrames <= 0) return rawSegments;
  const sorted = [...rawSegments]
    .sort((a, b) => a.startFrame - b.startFrame)
    .map((s) => ({ ...s }));
  const flinchPairMaxFrames = Math.round(0.45 * fps);

  let runningVal = initialValue;
  let lastRealEndFrame = -Infinity;
  let lastRealSpan = 0;

  for (let i = 0; i < sorted.length; i++) {
    const seg = sorted[i];
    const isRealChange = Math.abs(seg.toValue - runningVal) > 1e-3;
    const span = Math.max(1, seg.endFrame - seg.startFrame);

    if (isRealChange && lastRealEndFrame > -Infinity) {
      const isInternalPair =
        lastRealSpan <= flinchPairMaxFrames &&
        Math.abs(seg.startFrame - lastRealEndFrame) <= 2;
      if (!isInternalPair && seg.startFrame < lastRealEndFrame + holdFrames) {
        const desiredStart = lastRealEndFrame + holdFrames;
        const wasPrePivot = seg.startFrame < pivotFrame;
        const clampedStart = wasPrePivot
          ? Math.max(seg.startFrame, Math.min(desiredStart, pivotFrame - span))
          : desiredStart;
        seg.startFrame = clampedStart;
        seg.endFrame = clampedStart + span;
      }
    }

    if (isRealChange) {
      lastRealEndFrame = seg.endFrame;
      lastRealSpan = span;
      runningVal = seg.toValue;
    }
  }
  return sorted;
}

function resolveCinemagraphDurationFrames(
  rawDurationSec: number | undefined,
  startFrame: number,
  pivotFrame: number,
  fps: number,
  fallbackSec = 2.2,
  exactDuration = false
): number {
  const isPostPivot = startFrame >= pivotFrame - 6;
  let sec = rawDurationSec ?? (isPostPivot ? 4.2 : fallbackSec);
  // Mặc định (giữ nguyên các Chén đã duyệt): cue sau Pivot dài 0.6–3.4s được giãn thành 3.8s.
  // Đặt `exactDuration: true` trên cue để giữ đúng thời lượng khai báo.
  if (isPostPivot && !(exactDuration && rawDurationSec !== undefined) && sec >= 0.6 && sec < 3.4) {
    sec = 3.8;
  }
  return Math.max(1, Math.round(sec * fps));
}

export function resolveRoleColor(
  role: ColorRole | undefined,
  palette: ThemePalette,
  isPrePivot = false
): string {
  if (role === 'accent') {
    return isPrePivot ? palette.inkPrimary : palette.accentProp || palette.accent;
  }
  if (role === 'secondary') return palette.inkSecondary;
  return palette.inkPrimary;
}

export function evaluateNumericChannel(
  frame: number,
  initialValue: number,
  rawSegments: NumericSegment[]
): { value: number; arcOffset: number } {
  if (rawSegments.length === 0) {
    return { value: initialValue, arcOffset: 0 };
  }

  const sorted = [...rawSegments].sort((a, b) => a.startFrame - b.startFrame);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].endFrame > sorted[i + 1].startFrame) {
      sorted[i] = {
        ...sorted[i],
        endFrame: Math.max(sorted[i].startFrame + 1, sorted[i + 1].startFrame),
      };
    }
  }

  let currentVal = initialValue;
  let arcOffset = 0;

  for (const seg of sorted) {
    if (frame < seg.startFrame) {
      break;
    }
    if (frame >= seg.endFrame) {
      currentVal = seg.toValue;
      continue;
    }
    const span = Math.max(1, seg.endFrame - seg.startFrame);
    const rawP = Math.max(0, Math.min(1, (frame - seg.startFrame) / span));
    const p = CINEMAGRAPH_EASING(rawP);
    currentVal = currentVal + (seg.toValue - currentVal) * p;
    if (seg.arcY) {
      arcOffset = 4 * p * (1 - p) * seg.arcY;
    }
    break;
  }

  return { value: currentVal, arcOffset };
}

interface WalkChain {
  knots: Array<{ frame: number; x: number }>;
}

export function evaluateActorWalkXChannel(
  frame: number,
  initialX: number,
  rawSegments: NumericSegment[],
  fps: number
): { x: number; cumDist: number } {
  if (rawSegments.length === 0) {
    return { x: initialX, cumDist: 0 };
  }

  const sorted = [...rawSegments].sort((a, b) => a.startFrame - b.startFrame);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].endFrame > sorted[i + 1].startFrame) {
      sorted[i] = {
        ...sorted[i],
        endFrame: Math.max(sorted[i].startFrame + 1, sorted[i + 1].startFrame),
      };
    }
  }

  interface ResolvedSeg {
    startFrame: number;
    endFrame: number;
    fromX: number;
    toX: number;
  }

  const resolved: ResolvedSeg[] = [];
  let cursorX = initialX;
  for (const seg of sorted) {
    const dx = seg.toValue - cursorX;
    if (Math.abs(dx) > 1e-4) {
      resolved.push({
        startFrame: seg.startFrame,
        endFrame: Math.max(seg.startFrame + 1, seg.endFrame),
        fromX: cursorX,
        toX: seg.toValue,
      });
    }
    cursorX = seg.toValue;
  }

  if (resolved.length === 0) {
    return { x: initialX, cumDist: 0 };
  }

  const maxBridgeGapFrames = Math.round(0.45 * fps);
  const chains: WalkChain[] = [];

  for (const seg of resolved) {
    const lastChain = chains[chains.length - 1];
    if (lastChain) {
      const prevEndKnot = lastChain.knots[lastChain.knots.length - 1];
      const prevStartKnot = lastChain.knots[lastChain.knots.length - 2];
      const prevDx = prevEndKnot.x - prevStartKnot.x;
      const curDx = seg.toX - seg.fromX;
      const gap = seg.startFrame - prevEndKnot.frame;

      if (gap <= maxBridgeGapFrames && prevDx * curDx > 0) {
        if (gap > 0) {
          prevEndKnot.frame = seg.startFrame;
        }
        lastChain.knots.push({ frame: seg.endFrame, x: seg.toX });
        continue;
      }
    }

    chains.push({
      knots: [
        { frame: seg.startFrame, x: seg.fromX },
        { frame: seg.endFrame, x: seg.toX },
      ],
    });
  }

  const evalSingleChainAt = (chain: WalkChain, f: number): number => {
    const { knots } = chain;
    const k = knots.length - 1;
    const first = knots[0];
    const last = knots[k];
    if (f <= first.frame) return first.x;
    if (f >= last.frame) return last.x;

    if (k === 1) {
      const T = Math.max(1, last.frame - first.frame);
      const D = last.x - first.x;
      const dt = f - first.frame;
      if (T >= Math.round(1.6 * fps)) {
        const eIn = Math.max(
          1,
          Math.min(Math.round(0.85 * fps), Math.round(0.24 * T))
        );
        const eOut = Math.max(
          1,
          Math.min(Math.round(1.05 * fps), Math.round(0.28 * T))
        );
        const denom = Math.max(1, T - 0.5 * eIn - 0.5 * eOut);
        const vCruise = D / denom;
        if (dt < eIn) {
          return (
            first.x +
            vCruise *
              0.5 *
              (dt - (eIn / Math.PI) * Math.sin((Math.PI * dt) / eIn))
          );
        }
        if (dt <= T - eOut) {
          return first.x + vCruise * (0.5 * eIn + (dt - eIn));
        }
        const u = dt - (T - eOut);
        return (
          first.x +
          vCruise *
            (0.5 * eIn +
              (T - eIn - eOut) +
              0.5 * (u + (eOut / Math.PI) * Math.sin((Math.PI * u) / eOut)))
        );
      }
      const u = dt / T;
      return first.x + D * 0.5 * (1 - Math.cos(Math.PI * u));
    }

    const h: number[] = [];
    const m: number[] = [];
    for (let j = 0; j < k; j++) {
      const span = Math.max(1, knots[j + 1].frame - knots[j].frame);
      h.push(span);
      m.push((knots[j + 1].x - knots[j].x) / span);
    }

    const v: number[] = new Array(k + 1).fill(0);
    v[0] = 0;
    v[k] = 0;
    for (let j = 1; j < k; j++) {
      if (m[j - 1] * m[j] > 0) {
        const w1 = 2 * h[j] + h[j - 1];
        const w2 = h[j] + 2 * h[j - 1];
        v[j] = (w1 + w2) / (w1 / m[j - 1] + w2 / m[j]);
      }
    }
    for (let j = 0; j < k; j++) {
      if (Math.abs(m[j]) < 1e-6) {
        v[j] = 0;
        v[j + 1] = 0;
        continue;
      }
      const alpha = v[j] / m[j];
      const beta = v[j + 1] / m[j];
      const mag = Math.hypot(alpha, beta);
      if (mag > 3) {
        const tau = 3 / mag;
        v[j] *= tau;
        v[j + 1] *= tau;
      }
    }

    let idx = k - 1;
    for (let j = 0; j < k; j++) {
      if (f < knots[j + 1].frame) {
        idx = j;
        break;
      }
    }
    const span = h[idx];
    const u = Math.max(0, Math.min(1, (f - knots[idx].frame) / span));
    const u2 = u * u;
    const u3 = u2 * u;
    return (
      (2 * u3 - 3 * u2 + 1) * knots[idx].x +
      (u3 - 2 * u2 + u) * span * v[idx] +
      (-2 * u3 + 3 * u2) * knots[idx + 1].x +
      (u3 - u2) * span * v[idx + 1]
    );
  };

  let currentX = initialX;
  let cumDist = 0;

  for (const chain of chains) {
    const startF = chain.knots[0].frame;
    const endF = chain.knots[chain.knots.length - 1].frame;
    const startX = chain.knots[0].x;
    const endX = chain.knots[chain.knots.length - 1].x;
    if (frame < startF) {
      break;
    }
    if (frame >= endF) {
      currentX = endX;
      cumDist += Math.abs(endX - startX);
      continue;
    }
    currentX = evalSingleChainAt(chain, frame);
    cumDist += Math.abs(currentX - startX);
    break;
  }

  return { x: currentX, cumDist };
}

function evaluateDiscreteChannel<T>(
  frame: number,
  initialValue: T,
  events: Array<{ frame: number; value: T }>
): T {
  if (events.length === 0) return initialValue;
  const sorted = [...events].sort((a, b) => a.frame - b.frame);
  let current = initialValue;
  for (const ev of sorted) {
    if (frame >= ev.frame) {
      current = ev.value;
    } else {
      break;
    }
  }
  return current;
}

function evaluateColorChannel(
  frame: number,
  initialRole: ColorRole,
  events: Array<{ startFrame: number; endFrame: number; role: ColorRole }>,
  palette: ThemePalette,
  isPrePivot = false
): { color: string; activeRole: ColorRole } {
  const initialColor = resolveRoleColor(initialRole, palette, isPrePivot);
  if (events.length === 0) {
    return {
      color: initialColor,
      activeRole: isPrePivot && initialRole === 'accent' ? 'ink' : initialRole,
    };
  }

  const sorted = [...events].sort((a, b) => a.startFrame - b.startFrame);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].endFrame > sorted[i + 1].startFrame) {
      sorted[i] = {
        ...sorted[i],
        endFrame: Math.max(sorted[i].startFrame + 1, sorted[i + 1].startFrame),
      };
    }
  }

  let currentColor = initialColor;
  let activeRole: ColorRole =
    isPrePivot && initialRole === 'accent' ? 'ink' : initialRole;

  for (const ev of sorted) {
    const targetColor = resolveRoleColor(ev.role, palette, isPrePivot);
    if (frame < ev.startFrame) break;
    if (frame >= ev.endFrame) {
      currentColor = targetColor;
      activeRole = isPrePivot && ev.role === 'accent' ? 'ink' : ev.role;
      continue;
    }
    activeRole = isPrePivot && ev.role === 'accent' ? 'ink' : ev.role;
    if (currentColor === targetColor) {
      break;
    }
    const span = Math.max(1, ev.endFrame - ev.startFrame);
    const p = CINEMAGRAPH_EASING(
      Math.max(0, Math.min(1, (frame - ev.startFrame) / span))
    );
    currentColor = interpolateColors(p, [0, 1], [currentColor, targetColor]);
    break;
  }

  return { color: currentColor, activeRole };
}

export interface EvaluatedActorState {
  id: string;
  rig?: string;
  layer: StageLayer;
  focusRole?: FocusRole;
  x: number;
  y: number;
  groundY: number;
  terrainAngleDeg: number;
  scale: number;
  facing: 'left' | 'right';
  pose: StageTravelerPose;
  poseWeights: TravelerPoseWeights;
  leanDeg: number;
  sitProgress: number;
  lookAtTarget?: string | null;
  gazeX: number;
  gazeY: number;
  hasLookTarget: boolean;
  walkPhase: number;
  walkActivity: number;
  breathPhase: number;
  color: string;
  showTeaCup: number;
  dissolveToCloud: number;
  dissolveCloudProgress: number;
  drawProgress: number;
  opacity: number;
  role?: 'lu_khach' | 'nguoi_b';
  ponytail?: boolean;
}

export interface EvaluatedPropState {
  id: string;
  type: string;
  variant?: string;
  layer: StageLayer;
  focusRole?: FocusRole;
  x: number;
  y: number;
  scale: number;
  rotate: number;
  opacity: number;
  color: string;
  isAccentActive: boolean;
  isDropping?: boolean;
  activeFollow?: string | null;
  attachedActorFacing?: 'left' | 'right';
  loopProgress: number;
  motionActivity: number;
  travelDist: number;
  drawProgress: number;
  morphProgress: number;
  splitProgress: number;
  floatAwayProgress: number;
  emitters: {
    steam: number;
    pulseRing: number;
    spill: number;
    glow: number;
    color: string;
    steamColor: string;
  };
  spec: PropSpec;
}

export interface CompiledStageFrame {
  terrain: NormalizedTerrainConfig;
  terrainSegments: EvaluatedTerrainSegment[];
  camera: {
    zoom: number;
    panX: number;
    panY: number;
  };
  layerParallaxX: {
    sky: number;
    far: number;
    mid: number;
    fore: number;
  };
  spotlight: {
    strength: number;
    focusX: number;
    focusY: number;
  };
  actors: EvaluatedActorState[];
  actorMap: Record<string, EvaluatedActorState>;
  props: EvaluatedPropState[];
  /** T7c: Tiến trình vẽ đường đất mở màn (0→1 trong MO_MAN_TERRAIN_DUR_SEC) */
  openingTerrainProgress: number;
}

export function applyHorizonOffsetToTerrain(
  terrain: NormalizedTerrainConfig,
  horizonOffsetPx: number
): NormalizedTerrainConfig {
  if (!horizonOffsetPx) return terrain;
  const dy = horizonOffsetPx * 0.45;
  return {
    ...terrain,
    y: Math.max(305, Math.min(368, Number((terrain.y + dy).toFixed(2)))),
  };
}

export function resolveActorSocketWorldPos(
  actor: EvaluatedActorState,
  socketName: string,
  terrain: NormalizedTerrainConfig,
  phase: number
): { x: number; y: number } {
  const dir = actor.facing === 'right' ? 1 : -1;
  const s = actor.scale;
  const sitDrop = actor.sitProgress * 1.6 * s;
  const leanRad = (actor.leanDeg * Math.PI) / 180;
  const leanShiftX = Math.sin(leanRad) * 18 * s * dir;

  switch (socketName) {
    case 'head':
      return {
        x: actor.x + leanShiftX * 0.85,
        y: actor.y - 49 * s + sitDrop,
      };

    case 'back':
      return {
        x: actor.x - dir * 9.5 * s + leanShiftX * 0.4,
        y: actor.y - 26 * s + sitDrop * 0.7,
      };

    case 'ground_front': {
      const gx = actor.x + dir * 24 * s;
      const pt = getTerrainPoint(terrain, gx, phase);
      return {
        x: gx,
        y: pt.y,
      };
    }

    case 'hand':
    default: {
      const reachExtra =
        actor.pose === 'give' || actor.pose === 'reach_out'
          ? 18
          : actor.pose === 'hold_up'
            ? 14
            : actor.pose === 'push'
              ? 19
              : 12;
      const handBaseY =
        actor.pose === 'hold_up'
          ? -41
          : actor.pose === 'give'
            ? -25
            : -28;
      return {
        x: actor.x + dir * reachExtra * s + leanShiftX * 0.65,
        y: actor.y + handBaseY * s + sitDrop * 0.8,
      };
    }
  }
}

export function evaluateStageScriptAtFrame(
  script: StageScript,
  frame: number,
  timeline: TimelineSyncResult,
  palette: ThemePalette,
  visualDNA?: ResolvedVisualDNA
): CompiledStageFrame {
  const { fps, durationInFrames } = timeline;
  const safeTotalFrames = Math.max(2, durationInFrames);
  const loopProgress =
    (((frame % safeTotalFrames) + safeTotalFrames) % safeTotalFrames) /
    safeTotalFrames;
  const isPrePivot = frame < timeline.pivotFrame - 6;

  const phase = loopProgress * Math.PI * 2 * 8;
  const cues = script.timeline ?? [];

  const initialTerrainCfg = normalizeTerrainConfig(script.terrain);
  const bridgeSegs: NumericSegment[] = [];

  if (
    typeof script.terrain === 'object' &&
    script.terrain.bridgeAt !== undefined
  ) {
    const startF = resolveCueFrame(script.terrain.bridgeAt, timeline);
    const durF = Math.round((script.terrain.bridgeDuration ?? 2.2) * fps);
    bridgeSegs.push({
      startFrame: startF,
      endFrame: startF + durF,
      toValue: 1,
    });
  }

  for (const cue of cues) {
    if (cue.target === 'terrain' && cue.bridgeProgress !== undefined) {
      const startF = resolveCueFrame(cue.at ?? cue.when, timeline);
      const durF = Math.max(1, Math.round((cue.duration ?? 2.0) * fps));
      bridgeSegs.push({
        startFrame: startF,
        endFrame: startF + durF,
        toValue: cue.bridgeProgress,
      });
    }
  }

  const evaluatedBridge = evaluateNumericChannel(
    frame,
    initialTerrainCfg.bridgeProgress,
    bridgeSegs
  ).value;

  const rawTerrain = normalizeTerrainConfig(script.terrain, evaluatedBridge);
  const activeHorizonOffsetPx =
    visualDNA && !visualDNA.isLegacyLocked ? visualDNA.horizonOffsetPx : 0;
  const terrain = applyHorizonOffsetToTerrain(rawTerrain, activeHorizonOffsetPx);

  const terrainSegments: EvaluatedTerrainSegment[] = (terrain.segments ?? []).map(
    (seg) => {
      const segCues = cues.filter((c) => c.target === seg.id);
      const colorEvents: Array<{
        startFrame: number;
        endFrame: number;
        role: ColorRole;
      }> = [];
      const strokeWidthSegs: NumericSegment[] = [];
      const opacitySegs: NumericSegment[] = [];

      for (const cue of segCues) {
        const startF = resolveCueFrame(cue.at ?? cue.when, timeline);
        const durF = resolveCinemagraphDurationFrames(
          cue.duration,
          startF,
          timeline.pivotFrame,
          fps,
          1.2,
          cue.exactDuration === true
        );
        const endF = startF + durF;
        if (cue.colorRole !== undefined) {
          colorEvents.push({
            startFrame: startF,
            endFrame: endF,
            role: cue.colorRole,
          });
        }
        if (cue.strokeWidth !== undefined) {
          strokeWidthSegs.push({
            startFrame: startF,
            endFrame: endF,
            toValue: cue.strokeWidth,
          });
        }
        if (cue.opacity !== undefined) {
          opacitySegs.push({
            startFrame: startF,
            endFrame: endF,
            toValue: cue.opacity,
          });
        }
      }

      const colorEval = evaluateColorChannel(
        frame,
        seg.colorRole ?? 'ink',
        colorEvents,
        palette,
        isPrePivot
      );
      const strokeWidth = evaluateNumericChannel(
        frame,
        seg.strokeWidth ?? 1.4,
        strokeWidthSegs
      ).value;
      const opacity = evaluateNumericChannel(
        frame,
        seg.opacity ?? 1,
        opacitySegs
      ).value;

      return {
        id: seg.id,
        startX: seg.startX,
        endX: seg.endX,
        color: colorEval.color,
        isAccentActive: !isPrePivot && colorEval.activeRole === 'accent',
        strokeWidth: Math.max(0.4, strokeWidth),
        opacity: Math.max(0, Math.min(1, opacity)),
      };
    }
  );

  const camZoomSegs: NumericSegment[] = [];
  const camPanXSegs: NumericSegment[] = [];
  const camPanYSegs: NumericSegment[] = [];

  for (const cue of cues) {
    if (cue.target !== 'camera') continue;
    const startF = resolveCueFrame(cue.at ?? cue.when, timeline);
    const durF = Math.max(1, Math.round((cue.duration ?? 2.4) * fps));
    if (cue.zoom !== undefined) {
      camZoomSegs.push({
        startFrame: startF,
        endFrame: startF + durF,
        toValue: cue.zoom,
      });
    }
    if (cue.panX !== undefined) {
      camPanXSegs.push({
        startFrame: startF,
        endFrame: startF + durF,
        toValue: cue.panX,
      });
    }
    if (cue.panY !== undefined) {
      camPanYSegs.push({
        startFrame: startF,
        endFrame: startF + durF,
        toValue: cue.panY,
      });
    }
  }

  const baseZoomInit = script.camera?.zoom ?? 1;
  const basePanXInit = script.camera?.panX ?? 0;
  const basePanYInit = script.camera?.panY ?? 0;

  let evaluatedZoom: number;
  let evaluatedPanX: number;
  let evaluatedPanY: number;

  const pStart = Math.max(1, timeline.pivotFrame - Math.round(0.2 * fps));
  const pEnd = Math.min(
    safeTotalFrames - Math.round(1.5 * fps),
    pStart + Math.round(2.4 * fps)
  );
  const pivotCurve = interpolate(
    frame,
    [0, pStart, Math.max(pStart + 1, pEnd)],
    [0, 0.22, 1],
    {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  const isSemantic = Boolean(script.tags?.includes('semantic_v1'));
  const isFreeMode = isFreeModeStageScript(script);

  // T8-DNA-a #1 & TF5 #1: Gói Chén (`semantic_v1`) và Làn tự do (`che_do: "tu_do"`)
  // KHÔNG chịu ảnh hưởng từ Visual DNA Trục 4 (`pivotMechanic`);
  // với `tu_do`, camera chỉ chạy đúng theo `camera` / `timeline[]` kịch bản ghi (không tự zoom/pan/drift).
  const activePivotMechanic =
    isSemantic || isFreeMode
      ? 'NONE'
      : visualDNA && !visualDNA.isLegacyLocked
        ? visualDNA.pivotMechanic
        : 'ACCENT_PUSH_IN';

  if (camZoomSegs.length > 0) {
    evaluatedZoom = evaluateNumericChannel(
      frame,
      baseZoomInit,
      camZoomSegs
    ).value;
    if (activePivotMechanic === 'PULLBACK_REVEAL') {
      evaluatedZoom = Number(
        (evaluatedZoom * (1.065 - 0.085 * pivotCurve)).toFixed(4)
      );
    }
  } else if (isSemantic || isFreeMode) {
    evaluatedZoom = baseZoomInit;
  } else if (activePivotMechanic === 'PULLBACK_REVEAL') {
    const breathZoom = Math.sin(loopProgress * Math.PI * 2) * 0.003;
    evaluatedZoom =
      baseZoomInit * (1.085 - 0.1 * pivotCurve + breathZoom);
  } else if (activePivotMechanic === 'PARALLAX_DRIFT') {
    const breathZoom = Math.sin(loopProgress * Math.PI * 2) * 0.004;
    evaluatedZoom =
      baseZoomInit *
      (1.015 + 0.018 * Math.sin(pivotCurve * Math.PI * 0.5) + breathZoom);
  } else if (activePivotMechanic === 'SPOTLIGHT_DIM') {
    evaluatedZoom = baseZoomInit * (1.012 + 0.024 * pivotCurve);
  } else {
    const autoPush = interpolate(
      frame,
      [0, pStart, Math.max(pStart + 1, pEnd)],
      [1.0, 1.01, 1.048],
      {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    );
    const breathZoom = Math.sin(loopProgress * Math.PI * 2 * 2) * 0.004;
    evaluatedZoom = baseZoomInit * (autoPush + breathZoom);
  }

  if (camPanXSegs.length > 0) {
    evaluatedPanX = evaluateNumericChannel(
      frame,
      basePanXInit,
      camPanXSegs
    ).value;
  } else if (isSemantic || isFreeMode) {
    evaluatedPanX = basePanXInit;
  } else {
    evaluatedPanX = basePanXInit + Math.sin(loopProgress * Math.PI * 2) * 1.4;
  }

  let layerParallaxX = { sky: 0, far: 0, mid: 0, fore: 0 };
  if (activePivotMechanic === 'PARALLAX_DRIFT') {
    const panDrift = (pivotCurve - 0.35) * 9.5;
    evaluatedPanX = Number((evaluatedPanX + panDrift * 0.45).toFixed(2));
    layerParallaxX = {
      sky: Number((-panDrift * 0.28).toFixed(2)),
      far: Number((panDrift * 0.38).toFixed(2)),
      mid: Number((-panDrift * 0.65).toFixed(2)),
      fore: Number((panDrift * 1.15).toFixed(2)),
    };
  }

  const spotlightStrength =
    activePivotMechanic === 'SPOTLIGHT_DIM'
      ? Number(
          interpolate(
            frame,
            [
              0,
              pStart,
              Math.max(pStart + 1, timeline.pivotFrame + Math.round(0.3 * fps)),
            ],
            [0.06, 0.14, 0.36],
            {
              easing: Easing.out(Easing.cubic),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          ).toFixed(3)
        )
      : 0;

  if (camPanYSegs.length > 0) {
    evaluatedPanY = evaluateNumericChannel(
      frame,
      basePanYInit,
      camPanYSegs
    ).value;
  } else if (isSemantic || isFreeMode) {
    evaluatedPanY = basePanYInit;
  } else {
    const autoLiftY = interpolate(
      frame,
      [0, pStart, Math.max(pStart + 1, pEnd)],
      [0, -0.8, -3.5],
      {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    );
    evaluatedPanY = basePanYInit + autoLiftY;
  }

  const camera = {
    zoom: evaluatedZoom,
    panX: evaluatedPanX,
    panY: evaluatedPanY,
  };

  const holdFrames = Math.round(TEMPO.POST_MOTION_HOLD_SEC * fps);
  const actorLookAtTransitions = new Map<
    string,
    {
      initial: string | null;
      events: Array<{ startFrame: number; endFrame: number; value: string | null }>;
    }
  >();

  const actorMap: Record<string, EvaluatedActorState> = {};
  const actors: EvaluatedActorState[] = (script.actors ?? []).map(
    (actor, actorIdx) => {
      const actorCues = cues.filter((c) => c.target === actor.id);

      const xSegs: NumericSegment[] = [];
      const yOffSegs: NumericSegment[] = [];
      const scaleSegs: NumericSegment[] = [];
      const opacitySegs: NumericSegment[] = [];
      const leanSegs: NumericSegment[] = [];
      const sitSegs: NumericSegment[] = [];
      const teaSegs: NumericSegment[] = [];
      const dissolveSegs: NumericSegment[] = [];
      const facingEvents: Array<{ frame: number; value: 'left' | 'right' }> = [];
      const poseEvents: Array<{ frame: number; value: StageTravelerPose }> = [];
      const lookAtEvents: Array<{
        startFrame: number;
        endFrame: number;
        value: string | null;
      }> = [];
      const poseRampFrames = Math.max(8, Math.round(0.45 * fps));
      const poseWeightChannels: Array<{
        poseName: StageTravelerPose;
        key: keyof TravelerPoseWeights;
      }> = [
        { poseName: 'look_up', key: 'lookUp' },
        { poseName: 'reach_out', key: 'reachOut' },
        { poseName: 'give', key: 'give' },
        { poseName: 'hold_up', key: 'holdUp' },
        { poseName: 'push', key: 'push' },
      ];
      const poseWeightSegs: Record<
        keyof TravelerPoseWeights,
        NumericSegment[]
      > = {
        lookUp: [],
        reachOut: [],
        give: [],
        holdUp: [],
        push: [],
      };
      const colorEvents: Array<{
        startFrame: number;
        endFrame: number;
        role: ColorRole;
      }> = [];

      for (const cue of actorCues) {
        const startF = resolveCueFrame(cue.at ?? cue.when, timeline);
        const durF = resolveCinemagraphDurationFrames(
          cue.duration,
          startF,
          timeline.pivotFrame,
          fps,
          2.2,
          cue.exactDuration === true
        );
        const endF = startF + durF;

        const targetX = cue.toX ?? cue.x;
        if (targetX !== undefined) {
          xSegs.push({
            startFrame: startF,
            endFrame: endF,
            toValue: resolveXCoord(targetX),
          });
        }
        if (
          cue.yOffset !== undefined ||
          cue.toY !== undefined ||
          cue.y !== undefined
        ) {
          yOffSegs.push({
            startFrame: startF,
            endFrame: endF,
            toValue: cue.yOffset ?? cue.toY ?? cue.y ?? 0,
            arcY: cue.arcY,
          });
        }
        if (cue.scale !== undefined) {
          scaleSegs.push({
            startFrame: startF,
            endFrame: endF,
            toValue: cue.scale,
          });
        }
        if (cue.opacity !== undefined) {
          opacitySegs.push({
            startFrame: startF,
            endFrame: endF,
            toValue: cue.opacity,
          });
        }
        if (cue.leanDeg !== undefined) {
          leanSegs.push({
            startFrame: startF,
            endFrame: endF,
            toValue: cue.leanDeg,
          });
        }
        if (cue.sitProgress !== undefined) {
          sitSegs.push({
            startFrame: startF,
            endFrame: endF,
            toValue: cue.sitProgress,
          });
        }
        if (cue.showTeaCup !== undefined) {
          teaSegs.push({
            startFrame: startF,
            endFrame: endF,
            toValue:
              typeof cue.showTeaCup === 'boolean'
                ? cue.showTeaCup
                  ? 1
                  : 0
                : cue.showTeaCup,
          });
        }
        if (cue.dissolveToCloud !== undefined) {
          dissolveSegs.push({
            startFrame: startF,
            endFrame: endF,
            toValue: cue.dissolveToCloud,
          });
        }
        if (cue.facing !== undefined) {
          facingEvents.push({ frame: startF, value: cue.facing });
        }
        if (cue.lookAtTarget !== undefined) {
          const minLookFrames = isSemantic
            ? Math.round(TEMPO.MIN_LOOK_TURN_SEC * fps)
            : 1;
          lookAtEvents.push({
            startFrame: startF,
            endFrame: startF + Math.max(durF, minLookFrames),
            value: cue.lookAtTarget || null,
          });
        }
        if (cue.pose !== undefined) {
          poseEvents.push({ frame: startF, value: cue.pose });
          for (const { poseName, key } of poseWeightChannels) {
            poseWeightSegs[key].push({
              startFrame: startF,
              endFrame: startF + poseRampFrames,
              toValue: cue.pose === poseName ? 1 : 0,
            });
          }
        }
        if (cue.colorRole !== undefined) {
          colorEvents.push({
            startFrame: startF,
            endFrame: endF,
            role: cue.colorRole,
          });
        }
      }

      const initX = resolveXCoord(actor.x, 270);
      const effectiveXSegs = isSemantic
        ? enforcePostMotionHold(xSegs, initX, holdFrames, timeline.pivotFrame, fps)
        : xSegs;
      const effectiveLeanSegs = isSemantic
        ? enforcePostMotionHold(
            leanSegs,
            actor.leanDeg ?? 0,
            holdFrames,
            timeline.pivotFrame,
            fps
          )
        : leanSegs;

      const curWalk = evaluateActorWalkXChannel(frame, initX, effectiveXSegs, fps);
      const prevWalk = evaluateActorWalkXChannel(
        Math.max(0, frame - 1),
        initX,
        effectiveXSegs,
        fps
      );
      const nextWalk = evaluateActorWalkXChannel(frame + 1, initX, effectiveXSegs, fps);
      const curX = curWalk.x;

      const yOffEval = evaluateNumericChannel(
        frame,
        actor.yOffset ?? 0,
        yOffSegs
      );
      const scale = evaluateNumericChannel(
        frame,
        actor.scale ?? 1,
        scaleSegs
      ).value;

      const speedPxPerFrame = Math.abs(nextWalk.x - prevWalk.x) * 0.5;
      const walkActivity =
        speedPxPerFrame <= 0.012
          ? 0
          : Math.min(1, (speedPxPerFrame - 0.012) / 0.36);
      const stridePx =
        (isSemantic ? 8.8 * TEMPO.WALK_STRIDE_MULT : 8.8) * Math.max(0.6, scale);
      const walkPhase =
        effectiveXSegs.length > 0
          ? (curWalk.cumDist / stridePx) * Math.PI
          : loopProgress * Math.PI * 2 * 6;

      // Số chu kỳ nguyên chẵn theo TEMPO.BREATH_CYCLE_SEC (~4.5s/nhịp thở tĩnh) để khép vòng 100%
      const breathCycles = isSemantic
        ? Math.max(2, Math.round(safeTotalFrames / fps / TEMPO.BREATH_CYCLE_SEC)) * 2
        : 4;
      const breathPhase =
        loopProgress * Math.PI * 2 * breathCycles + actorIdx * 1.15;

      const baseOpacity = evaluateNumericChannel(
        frame,
        actor.opacity ?? 1,
        opacitySegs
      ).value;
      const enterLeaveMult = evaluateEnterLeaveMultiplier(
        frame,
        timeline,
        actor.enterAt,
        actor.leaveAt,
        actor.fadeDuration ?? 1.2
      );
      const rawLeanDeg = evaluateNumericChannel(
        frame,
        actor.leanDeg ?? 0,
        effectiveLeanSegs
      ).value;
      const isMidLean =
        isSemantic &&
        effectiveLeanSegs.some((s) => frame >= s.startFrame && frame < s.endFrame);
      const stillBreathLean =
        isSemantic && walkActivity < 0.05 && !isMidLean
          ? Math.sin(breathPhase) * TEMPO.STILL_LEAN_BREATH_AMP_DEG
          : 0;
      const leanDeg = rawLeanDeg + stillBreathLean;
      const sitProgress = evaluateNumericChannel(
        frame,
        actor.sitProgress ?? (actor.pose === 'sit_lean' ? 1 : 0),
        sitSegs
      ).value;
      const initTea =
        typeof actor.showTeaCup === 'boolean'
          ? actor.showTeaCup
            ? 1
            : 0
          : actor.showTeaCup ?? 0;
      const showTeaCup = evaluateNumericChannel(frame, initTea, teaSegs).value;
      const dissolveToCloud = evaluateNumericChannel(
        frame,
        actor.dissolveToCloud ?? 0,
        dissolveSegs
      ).value;

      const facing = evaluateDiscreteChannel(
        frame,
        actor.facing ?? 'right',
        facingEvents
      );
      actorLookAtTransitions.set(actor.id, {
        initial: actor.lookAtTarget ?? null,
        events: [...lookAtEvents].sort((a, b) => a.startFrame - b.startFrame),
      });
      const lookAtTarget = evaluateDiscreteChannel<string | null>(
        frame,
        actor.lookAtTarget ?? null,
        lookAtEvents.map((e) => ({ frame: e.startFrame, value: e.value }))
      );
      const initialPose = actor.pose ?? 'stand';
      let pose = evaluateDiscreteChannel(frame, initialPose, poseEvents);
      if (walkActivity > 0.22 && pose === 'stand') {
        pose = 'walk';
      } else if (walkActivity === 0 && pose === 'walk') {
        pose = 'stand';
      }

      const poseWeights: TravelerPoseWeights = {
        lookUp: 0,
        reachOut: 0,
        give: 0,
        holdUp: 0,
        push: 0,
      };
      for (const { poseName, key } of poseWeightChannels) {
        poseWeights[key] = evaluateNumericChannel(
          frame,
          initialPose === poseName ? 1 : 0,
          poseWeightSegs[key]
        ).value;
      }

      const terrainPt = getTerrainPoint(terrain, curX, phase);
      const dissolveLift = -dissolveToCloud * 12;
      const worldY =
        terrainPt.y + yOffEval.value + yOffEval.arcOffset + dissolveLift;

      let dissolveCloudProgress = 0;
      const activeDissolveSeg = dissolveSegs.find((s) => s.toValue > 0.1);
      if (activeDissolveSeg && frame >= activeDissolveSeg.startFrame) {
        dissolveCloudProgress = Math.max(
          0,
          Math.min(1, (frame - activeDissolveSeg.startFrame) / (2.5 * fps))
        );
      } else if ((actor.dissolveToCloud ?? 0) > 0.1) {
        dissolveCloudProgress = Math.max(0, Math.min(1, frame / (2.5 * fps)));
      }

      const colorEval = evaluateColorChannel(
        frame,
        actor.colorRole ?? 'ink',
        colorEvents,
        palette,
        isPrePivot
      );

      const dissolveOpacityMult = Math.max(0, 1 - dissolveToCloud * 1.25);

      const state: EvaluatedActorState = {
        id: actor.id,
        rig: actor.rig,
        layer: actor.layer ?? 'mid',
        focusRole: actor.focusRole,
        x: curX,
        y: worldY,
        groundY: terrainPt.y,
        terrainAngleDeg: terrainPt.angleDeg,
        scale,
        facing,
        pose,
        poseWeights,
        leanDeg: leanDeg + terrainPt.angleDeg * 0.35,
        sitProgress,
        lookAtTarget,
        gazeX: 0.35,
        gazeY: 0.05,
        hasLookTarget: Boolean(lookAtTarget),
        walkPhase,
        walkActivity,
        breathPhase,
        color: colorEval.color,
        showTeaCup: !script.tags?.includes('semantic_v1') && isPrePivot ? 0 : showTeaCup,
        dissolveToCloud,
        dissolveCloudProgress,
        drawProgress: 1,
        opacity: Math.max(
          0,
          Math.min(1, baseOpacity * enterLeaveMult * dissolveOpacityMult)
        ),
        role: actor.role,
        ponytail: actor.ponytail,
      };

      actorMap[actor.id] = state;
      return state;
    }
  );

  interface PropPoseNode {
    follow: string | null;
    x: number;
    y: number;
  }

  const resolvePropPoseToWorld = (
    pose: PropPoseNode,
    propSpec: PropSpec
  ): { x: number; y: number } => {
    if (pose.follow) {
      const [actorId, rawSocket] = pose.follow.split(':');
      const targetActor = actorMap[actorId];
      if (targetActor) {
        const socketPos = resolveActorSocketWorldPos(
          targetActor,
          rawSocket || 'hand',
          terrain,
          phase
        );
        return {
          x: socketPos.x + pose.x,
          y: socketPos.y + pose.y,
        };
      }
    }

    const wx = pose.x;
    if (propSpec.layer === 'sky') {
      return { x: wx, y: pose.y };
    }
    const pt = getTerrainPoint(terrain, wx, phase);
    return { x: wx, y: pt.y + pose.y };
  };

  const props: EvaluatedPropState[] = (script.props ?? []).map((prop) => {
    const propCues = cues.filter((c) => c.target === prop.id);

    const initFollow = prop.follow ?? null;
    const initX =
      initFollow !== null && prop.x === 'center'
        ? 0
        : resolveXCoord(prop.x, 270);
    const initY = prop.y ?? 0;

    interface PosSegment {
      startFrame: number;
      endFrame: number;
      fromPose: PropPoseNode;
      toPose: PropPoseNode;
      arcY: number;
      dropGravity?: boolean;
    }

    const posSegments: PosSegment[] = [];
    let runningPose: PropPoseNode = {
      follow: initFollow,
      x: initX,
      y: initY,
    };

    const sortedPosCues = propCues
      .filter(
        (c) =>
          c.follow !== undefined ||
          c.x !== undefined ||
          c.toX !== undefined ||
          c.y !== undefined ||
          c.toY !== undefined ||
          c.yOffset !== undefined ||
          c.arcY !== undefined
      )
      .map((c) => ({
        cue: c,
        startFrame: resolveCueFrame(c.at ?? c.when, timeline),
      }))
      .sort((a, b) => a.startFrame - b.startFrame);

    for (let i = 0; i < sortedPosCues.length; i++) {
      const { cue, startFrame } = sortedPosCues[i];
      const durF = resolveCinemagraphDurationFrames(
        cue.duration,
        startFrame,
        timeline.pivotFrame,
        fps,
        2.2,
        cue.exactDuration === true
      );
      const nextStart =
        i < sortedPosCues.length - 1
          ? sortedPosCues[i + 1].startFrame
          : startFrame + durF;
      const endFrame = Math.max(
        startFrame + 1,
        Math.min(startFrame + durF, nextStart)
      );

      const nextFollow =
        cue.follow !== undefined ? cue.follow : runningPose.follow;
      const rawTargetX = cue.toX ?? cue.x;
      const nextX =
        rawTargetX !== undefined
          ? resolveXCoord(rawTargetX, 0)
          : cue.follow !== undefined && cue.follow !== runningPose.follow
            ? nextFollow
              ? 0
              : runningPose.x
            : runningPose.x;
      const rawTargetY = cue.toY ?? cue.y ?? cue.yOffset;
      const nextY =
        rawTargetY !== undefined
          ? rawTargetY
          : cue.follow !== undefined && cue.follow !== runningPose.follow
            ? 0
            : runningPose.y;

      const toPose: PropPoseNode = {
        follow: nextFollow,
        x: nextX,
        y: nextY,
      };

      posSegments.push({
        startFrame,
        endFrame,
        fromPose: { ...runningPose },
        toPose,
        arcY: cue.arcY ?? 0,
        dropGravity: cue.dropGravity === true,
      });

      runningPose = toPose;
    }

    let activeFollow = initFollow;
    let worldPos = resolvePropPoseToWorld(
      { follow: initFollow, x: initX, y: initY },
      prop
    );
    let travelDist = 0;
    let motionActivity = 0;
    let isDropping = false;

    for (const seg of posSegments) {
      if (frame < seg.startFrame) break;
      const fromW = resolvePropPoseToWorld(seg.fromPose, prop);
      const toW = resolvePropPoseToWorld(seg.toPose, prop);
      if (frame >= seg.endFrame) {
        activeFollow = seg.toPose.follow;
        worldPos = toW;
        travelDist += toW.x - fromW.x;
        continue;
      }
      activeFollow = seg.toPose.follow ?? seg.fromPose.follow;
      const span = Math.max(1, seg.endFrame - seg.startFrame);
      const rawP = Math.max(0, Math.min(1, (frame - seg.startFrame) / span));
      if (seg.dropGravity) {
        isDropping = true;
        const px = Easing.inOut(Easing.sin)(Math.min(1, rawP));
        const py = Easing.inOut(Easing.quad)(Math.min(1, rawP));
        worldPos = {
          x: fromW.x + (toW.x - fromW.x) * px,
          y: fromW.y + (toW.y - fromW.y) * py,
        };
        travelDist += (toW.x - fromW.x) * px;
        motionActivity = rawP < 0.92 ? 0.9 : 0.2;
        break;
      }
      const p = CINEMAGRAPH_EASING(rawP);
      const pPrev = CINEMAGRAPH_EASING(
        Math.max(0, Math.min(1, (frame - 1 - seg.startFrame) / span))
      );
      const pNext = CINEMAGRAPH_EASING(
        Math.max(0, Math.min(1, (frame + 1 - seg.startFrame) / span))
      );
      const arcOffset = seg.arcY ? 4 * p * (1 - p) * seg.arcY : 0;
      worldPos = {
        x: fromW.x + (toW.x - fromW.x) * p,
        y: fromW.y + (toW.y - fromW.y) * p + arcOffset,
      };
      travelDist += (toW.x - fromW.x) * p;
      const speedPx =
        Math.hypot(toW.x - fromW.x, toW.y - fromW.y) * (pNext - pPrev) * 0.5;
      motionActivity =
        speedPx <= 0.01 ? 0 : Math.min(1, (speedPx - 0.01) / 0.34);
      break;
    }

    let attachedActorFacing: 'left' | 'right' | undefined;
    if (activeFollow) {
      const [actorId] = activeFollow.split(':');
      const targetActor = actorMap[actorId];
      if (targetActor) {
        attachedActorFacing = targetActor.facing;
        motionActivity = Math.max(motionActivity, targetActor.walkActivity);
        const dirSign = targetActor.facing === 'left' ? -1 : 1;
        travelDist +=
          dirSign *
          (targetActor.walkPhase / Math.PI) *
          8.8 *
          Math.max(0.6, targetActor.scale);
      }
    }

    const scaleSegs: NumericSegment[] = [];
    const rotSegs: NumericSegment[] = [];
    const opacitySegs: NumericSegment[] = [];
    const drawSegs: NumericSegment[] = [];
    const morphSegs: NumericSegment[] = [];
    const splitSegs: NumericSegment[] = [];
    const floatAwaySegs: NumericSegment[] = [];
    const steamSegs: NumericSegment[] = [];
    const pulseRingSegs: NumericSegment[] = [];
    const spillSegs: NumericSegment[] = [];
    const glowSegs: NumericSegment[] = [];
    const variantEvents: Array<{ frame: number; value: string | undefined }> = [];
    const colorEvents: Array<{
      startFrame: number;
      endFrame: number;
      role: ColorRole;
    }> = [];

    for (const cue of propCues) {
      const startF = resolveCueFrame(cue.at ?? cue.when, timeline);
      const durF = resolveCinemagraphDurationFrames(
        cue.duration,
        startF,
        timeline.pivotFrame,
        fps,
        2.2,
        cue.exactDuration === true
      );
      const endF = startF + durF;

      if (cue.scale !== undefined) {
        scaleSegs.push({
          startFrame: startF,
          endFrame: endF,
          toValue: cue.scale,
        });
      }
      if (cue.rotate !== undefined) {
        rotSegs.push({
          startFrame: startF,
          endFrame: endF,
          toValue: cue.rotate,
        });
      }
      if (cue.opacity !== undefined) {
        opacitySegs.push({
          startFrame: startF,
          endFrame: endF,
          toValue: cue.opacity,
        });
      }
      if (cue.drawProgress !== undefined) {
        drawSegs.push({
          startFrame: startF,
          endFrame: endF,
          toValue: cue.drawProgress,
        });
      }
      if (cue.morphProgress !== undefined) {
        morphSegs.push({
          startFrame: startF,
          endFrame: endF,
          toValue: cue.morphProgress,
        });
      }
      if (cue.splitProgress !== undefined) {
        splitSegs.push({
          startFrame: startF,
          endFrame: endF,
          toValue: cue.splitProgress,
        });
      }
      if (cue.floatAwayProgress !== undefined) {
        floatAwaySegs.push({
          startFrame: startF,
          endFrame: endF,
          toValue: cue.floatAwayProgress,
        });
      }
      if (cue.variant !== undefined) {
        variantEvents.push({ frame: startF, value: cue.variant });
      }
      if (cue.colorRole !== undefined) {
        colorEvents.push({
          startFrame: startF,
          endFrame: endF,
          role: cue.colorRole,
        });
      }
      if (cue.emitters) {
        const toNum = (v: boolean | number | undefined) =>
          v === undefined ? undefined : typeof v === 'boolean' ? (v ? 1 : 0) : v;
        const st = toNum(cue.emitters.steam);
        const pr = toNum(cue.emitters.pulseRing);
        const sp = toNum(cue.emitters.spill);
        const gl = toNum(cue.emitters.glow);
        if (st !== undefined) {
          steamSegs.push({ startFrame: startF, endFrame: endF, toValue: st });
        }
        if (pr !== undefined) {
          pulseRingSegs.push({
            startFrame: startF,
            endFrame: endF,
            toValue: pr,
          });
        }
        if (sp !== undefined) {
          spillSegs.push({ startFrame: startF, endFrame: endF, toValue: sp });
        }
        if (gl !== undefined) {
          glowSegs.push({ startFrame: startF, endFrame: endF, toValue: gl });
        }
      }
    }

    let scale = evaluateNumericChannel(frame, prop.scale ?? 1, scaleSegs).value;
    let rotate = evaluateNumericChannel(frame, prop.rotate ?? 0, rotSegs).value;
    const baseOpacity = evaluateNumericChannel(
      frame,
      prop.opacity ?? 1,
      opacitySegs
    ).value;
    const enterLeaveMult = evaluateEnterLeaveMultiplier(
      frame,
      timeline,
      prop.enterAt,
      prop.leaveAt,
      prop.fadeDuration ?? 1.2
    );

    const drawProgress = evaluateNumericChannel(
      frame,
      prop.drawProgress ?? 1,
      drawSegs
    ).value;
    const morphProgress = evaluateNumericChannel(
      frame,
      prop.morphProgress ?? 0,
      morphSegs
    ).value;
    const splitProgress = evaluateNumericChannel(
      frame,
      prop.splitProgress ?? 0,
      splitSegs
    ).value;
    const floatAwayProgress = evaluateNumericChannel(
      frame,
      prop.floatAwayProgress ?? 0,
      floatAwaySegs
    ).value;

    const effectiveIdle: PropIdle = prop.idle ?? {
      type: 'sway',
      speed: 0.85,
      amplitude: 0.22,
    };
    const idleOffset = evaluateIdleOscillator(
      effectiveIdle,
      loopProgress,
      prop.id
    );
    let finalX = worldPos.x + idleOffset.dx;
    let finalY = worldPos.y + idleOffset.dy;
    rotate += idleOffset.dRot;
    scale *= idleOffset.scaleMult;
    let finalOpacity = baseOpacity * enterLeaveMult * idleOffset.opacityMult;

    if (floatAwayProgress > 0.001) {
      const lev = levitateWeightless(floatAwayProgress, 0);
      finalX += lev.translateX;
      finalY += lev.translateY;
      rotate += lev.rotateDeg;
      finalOpacity *= lev.opacity;
    }

    const toInitNum = (v: boolean | number | undefined) =>
      v === undefined ? 0 : typeof v === 'boolean' ? (v ? 1 : 0) : v;

    const steam = evaluateNumericChannel(
      frame,
      toInitNum(prop.emitters?.steam),
      steamSegs
    ).value;
    const pulseRing = evaluateNumericChannel(
      frame,
      toInitNum(prop.emitters?.pulseRing),
      pulseRingSegs
    ).value;
    const spill = evaluateNumericChannel(
      frame,
      toInitNum(prop.emitters?.spill),
      spillSegs
    ).value;
    const glow = evaluateNumericChannel(
      frame,
      toInitNum(prop.emitters?.glow),
      glowSegs
    ).value;

    const colorEval = evaluateColorChannel(
      frame,
      prop.colorRole ?? 'ink',
      colorEvents,
      palette,
      isPrePivot
    );
    const isAccentActive =
      !isPrePivot &&
      (colorEval.activeRole === 'accent' || morphProgress > 0.1);
    const emitterColor = resolveRoleColor(
      prop.emitters?.colorRole ?? (isAccentActive ? 'accent' : 'secondary'),
      palette,
      isPrePivot
    );
    const steamColor = isAccentActive
      ? resolveRoleColor(
          prop.emitters?.colorRole ?? 'accent',
          palette,
          isPrePivot
        )
      : palette.inkSecondary;

    const activeVariant = evaluateDiscreteChannel(
      frame,
      prop.variant,
      variantEvents
    );

    return {
      id: prop.id,
      type: prop.type ?? 'custom',
      variant: activeVariant,
      layer: prop.layer ?? 'mid',
      focusRole: prop.focusRole,
      x: finalX,
      y: finalY,
      scale,
      rotate,
      opacity: Math.max(0, Math.min(1, finalOpacity)),
      color: colorEval.color,
      isAccentActive,
      isDropping,
      activeFollow,
      attachedActorFacing,
      loopProgress,
      motionActivity,
      travelDist,
      drawProgress,
      morphProgress,
      splitProgress,
      floatAwayProgress,
      emitters: {
        steam,
        pulseRing: isPrePivot || script.tags?.includes('semantic_v1') ? 0 : pulseRing,
        spill,
        glow: script.tags?.includes('semantic_v1') ? 0 : glow,
        color: emitterColor,
        steamColor,
      },
      spec: prop,
    };
  });

  // Tự động tính hướng mắt (gazeX, gazeY) từ đầu nhân vật tới vật thể trong nhin_theo (nội suy mượt ≥ 1.2s cho semantic_v1)
  const computeTargetGaze = (
    actor: EvaluatedActorState,
    targetId: string | null
  ): { gazeX: number; gazeY: number; hasLookTarget: boolean } => {
    if (!targetId) {
      return {
        gazeX: 0.35,
        gazeY: actor.leanDeg >= 16 ? 0.55 : 0.05,
        hasLookTarget: false,
      };
    }
    const targetProp = props.find((p) => p.id === targetId);
    const targetActor = actorMap[targetId];
    let tx: number | undefined;
    let ty: number | undefined;
    if (targetProp) {
      const catDef = BUILT_IN_PROP_CATALOG[targetProp.type];
      const vDef =
        targetProp.variant && catDef?.variants
          ? catDef.variants[targetProp.variant]
          : undefined;
      const box = vDef?.box ?? catDef?.box ?? [-5, -10, 5, 0];
      tx = targetProp.x + ((box[0] + box[2]) * 0.5) * targetProp.scale;
      ty = targetProp.y + ((box[1] + box[3]) * 0.5) * targetProp.scale;
    } else if (targetActor) {
      tx = targetActor.x;
      ty = targetActor.y - 38 * targetActor.scale;
    }
    if (tx !== undefined && ty !== undefined) {
      const dir = actor.facing === 'right' ? 1 : -1;
      const hx = actor.x + dir * (4.0 + (actor.leanDeg > 12 ? 5.5 : 0)) * actor.scale;
      const hy = actor.y - (41.5 - (actor.leanDeg > 12 ? 5.5 : 0)) * actor.scale;
      const dxLocal = (tx - hx) * dir;
      const dyLocal = ty - hy;
      const dist = Math.max(1, Math.hypot(dxLocal, dyLocal));
      const horizReach = Math.min(1.5, Math.max(-1.1, (dxLocal / dist) * 1.15 + (dxLocal - 24) * 0.018));
      const vertReach = Math.min(1.25, Math.max(-1.0, (dyLocal / dist) * 1.1));
      return {
        gazeX: Number(horizReach.toFixed(3)),
        gazeY: Number(vertReach.toFixed(3)),
        hasLookTarget: true,
      };
    }
    return {
      gazeX: 0.35,
      gazeY: actor.leanDeg >= 16 ? 0.55 : 0.05,
      hasLookTarget: false,
    };
  };

  for (const actor of actors) {
    const trans = actorLookAtTransitions.get(actor.id);
    if (!isSemantic || !trans || trans.events.length === 0) {
      const g = computeTargetGaze(actor, actor.lookAtTarget ?? null);
      actor.gazeX = g.gazeX;
      actor.gazeY = g.gazeY;
      actor.hasLookTarget = g.hasLookTarget;
      continue;
    }
    let prevTarget = trans.initial;
    let curGaze = computeTargetGaze(actor, prevTarget);
    for (const ev of trans.events) {
      if (frame < ev.startFrame) break;
      const nextGaze = computeTargetGaze(actor, ev.value);
      if (frame >= ev.endFrame || ev.value === prevTarget) {
        curGaze = nextGaze;
        prevTarget = ev.value;
        continue;
      }
      const span = Math.max(1, ev.endFrame - ev.startFrame);
      const p = CINEMAGRAPH_EASING(
        Math.max(0, Math.min(1, (frame - ev.startFrame) / span))
      );
      curGaze = {
        gazeX: Number((curGaze.gazeX + (nextGaze.gazeX - curGaze.gazeX) * p).toFixed(3)),
        gazeY: Number((curGaze.gazeY + (nextGaze.gazeY - curGaze.gazeY) * p).toFixed(3)),
        hasLookTarget: curGaze.hasLookTarget || nextGaze.hasLookTarget,
      };
      break;
    }
    actor.gazeX = curGaze.gazeX;
    actor.gazeY = curGaze.gazeY;
    actor.hasLookTarget = curGaze.hasLookTarget;
  }

  // === T7c: Nghi thức Mở màn & Đẩy máy cú lật ===
  // openingTerrainProgress: tiến trình vẽ đường đất (0→1) dùng cho cả semantic lẫn non-semantic
  let openingTerrainProgress = 1;

  if (isSemantic) {
    // ========================================================================
    // NGHI THỨC MỞ MÀN cho Gói Chén (semantic_v1) — T7c
    // 1. Đường đất vẽ trái→phải (evolvePath)       0s .. TERRAIN_DUR
    // 2. Đạo cụ hiện lần lượt trái→phải (nền→giữa) TERRAIN_DUR .. propEndSec
    //    Vật đặt trên vật khác hiện SAU vật chủ.
    //    Vật đỏ có xuat_hien "cu_lat" KHÔNG hiện.
    // 3. Nhân vật hiện cuối cùng                     propEndSec .. actorEndSec
    // Tổng gói trong dòng chữ thứ nhất (≤ MO_MAN_TOTAL_MAX_SEC)
    // ========================================================================
    const terrainDurSec = TEMPO.MO_MAN_TERRAIN_DUR_SEC;
    const propDurSec = TEMPO.MO_MAN_PROP_DUR_SEC;
    const propStaggerSec = TEMPO.MO_MAN_PROP_STAGGER_SEC;
    const actorDurSec = TEMPO.MO_MAN_ACTOR_DUR_SEC;
    const totalMaxSec = TEMPO.MO_MAN_TOTAL_MAX_SEC;

    // Terrain progress
    const terrainEndFrame = Math.round(terrainDurSec * fps);
    openingTerrainProgress = interpolate(
      frame,
      [0, Math.max(1, terrainEndFrame)],
      [0, 1],
      {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    );

    // Sort props: layer priority (far/sky first, then mid, then fore), then X left→right
    // Props with dat_tren (placed on host) come after their host.
    const layerOrder: Record<string, number> = { sky: 0, far: 1, mid: 2, fore: 3 };
    const propWithIndex = props.map((p, i) => ({ p, origIdx: i }));

    // Build host→child dependency: child must appear after host
    const hostOf = new Map<string, string>();
    for (const pw of propWithIndex) {
      const datTren = pw.p.spec.placedOn;
      if (datTren) {
        const hostId = datTren.split('.')[0];
        hostOf.set(pw.p.id, hostId);
      }
    }

    // Determine if prop is a cu_lat red prop (should NOT appear at opening)
    const isCuLatRedProp = (p: EvaluatedPropState): boolean => {
      return (
        p.spec.colorRole === 'accent' &&
        p.spec.enterAt !== undefined &&
        (typeof p.spec.enterAt === 'string'
          ? p.spec.enterAt.includes('pivot')
          : false)
      );
    };

    // Sort: layer order → x position
    propWithIndex.sort((a, b) => {
      const la = layerOrder[a.p.layer] ?? 2;
      const lb = layerOrder[b.p.layer] ?? 2;
      if (la !== lb) return la - lb;
      return a.p.x - b.p.x;
    });

    // Reorder so that hosted props come after their host (duyệt xuôi để giữ đúng thứ tự lớp nền far -> giữa mid -> trước fore, trái→phải)
    const ordered: typeof propWithIndex = [];
    const placed = new Set<string>();
    const pending = [...propWithIndex];
    let safety = pending.length * 2;
    while (pending.length > 0 && safety-- > 0) {
      let i = 0;
      while (i < pending.length) {
        const pw = pending[i];
        const host = hostOf.get(pw.p.id);
        if (!host || placed.has(host)) {
          ordered.push(pw);
          placed.add(pw.p.id);
          pending.splice(i, 1);
        } else {
          i += 1;
        }
      }
    }
    // Any remaining (circular dep) just append
    ordered.push(...pending);

    // Calculate timing for each prop in the opening
    const propsToReveal = ordered.filter((pw) => {
      // Skip props with explicit enterAt (they have their own timing)
      if (pw.p.spec.enterAt !== undefined) return false;
      return true;
    });

    // Compute available time for props
    const propStartSec = terrainDurSec;
    const propCount = propsToReveal.length;
    // If too many props, compress stagger so total stays within budget
    const rawPropTotalSec = propCount > 0
      ? propDurSec + (propCount - 1) * propStaggerSec
      : 0;
    const actorBudgetSec = actorDurSec;
    const maxPropTotalSec = Math.max(0.4, totalMaxSec - propStartSec - actorBudgetSec);
    const compressionRatio = rawPropTotalSec > maxPropTotalSec && rawPropTotalSec > 0
      ? maxPropTotalSec / rawPropTotalSec
      : 1;
    const effPropDurSec = propDurSec * compressionRatio;
    const effPropStaggerSec = propStaggerSec * compressionRatio;

    // Apply drawProgress + opacity to each prop
    for (let i = 0; i < propsToReveal.length; i++) {
      const pw = propsToReveal[i];
      const p = pw.p;

      // cu_lat red props: completely hidden during opening, appear only at pivot
      if (isCuLatRedProp(p)) continue;

      const pStart = propStartSec + i * effPropStaggerSec;
      const pEnd = pStart + effPropDurSec;
      const pStartF = Math.round(pStart * fps);
      const pEndF = Math.round(pEnd * fps);

      const propDraw = interpolate(
        frame,
        [pStartF, Math.max(pStartF + 1, pEndF)],
        [0, 1],
        {
          easing: Easing.linear,
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }
      );
      const propInkGate = interpolate(
        frame,
        [pStartF, Math.max(pStartF + 1, pStartF + Math.round(0.25 * fps))],
        [0, 1],
        {
          easing: Easing.inOut(Easing.sin),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }
      );
      // Mực loang + nâng nhẹ 1–2px
      const liftPx = propDraw < 1 ? (1 - propDraw) * 1.5 : 0;

      p.drawProgress = Number(Math.min(p.drawProgress, propDraw).toFixed(3));
      p.opacity = Number((p.opacity * propInkGate).toFixed(3));
      if (liftPx > 0.01) {
        p.y = Number((p.y - liftPx).toFixed(2));
      }
    }

    // Actor reveal: last, after all props
    const actorStartSec = Math.min(
      totalMaxSec - actorBudgetSec,
      propStartSec + (propsToReveal.length > 0
        ? (propsToReveal.length - 1) * effPropStaggerSec + effPropDurSec * 0.5
        : 0)
    );

    actors.forEach((actor) => {
      const actorSpec = (script.actors ?? []).find((a) => a.id === actor.id);
      const hasExplicitEnterAt = actorSpec?.enterAt !== undefined;
      if (hasExplicitEnterAt) return; // has di_vao or explicit enter — keep its timing

      const aStartF = Math.round(actorStartSec * fps);
      const aEndF = Math.round((actorStartSec + actorDurSec) * fps);

      const actorDraw = interpolate(
        frame,
        [aStartF, Math.max(aStartF + 1, aEndF)],
        [0, 1],
        {
          easing: Easing.linear,
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }
      );
      const actorInkGate = interpolate(
        frame,
        [aStartF, Math.max(aStartF + 1, aStartF + Math.round(0.3 * fps))],
        [0, 1],
        {
          easing: Easing.inOut(Easing.sin),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }
      );

      actor.drawProgress = Number(Math.min(actor.drawProgress, actorDraw).toFixed(3));
      actor.opacity = Number((actor.opacity * actorInkGate).toFixed(3));
    });

    // Đạo cụ có enterAt tường minh (gồm kiểu `xuat_hien` hiện ở `pivot`): tự vẽ nét + mực loang mượt khi vào cảnh
    for (const pw of ordered) {
      const p = pw.p;
      if (p.spec.enterAt === undefined) continue;
      const enterF = resolveCueFrame(p.spec.enterAt, timeline);
      if (enterF <= 6) continue;
      const drawDurF = Math.max(1, Math.round(TEMPO.RED_TRANSITION_SEC * fps));
      const cueDraw = interpolate(
        frame,
        [enterF, enterF + drawDurF],
        [0, 1],
        {
          easing: Easing.inOut(Easing.cubic),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }
      );
      p.drawProgress = Number(Math.min(p.drawProgress, cueDraw).toFixed(3));
      if (frame < enterF) {
        p.opacity = 0;
      }
    }

    // Terrain segments: also stagger along with terrain
    for (const seg of terrainSegments) {
      seg.opacity = Number((seg.opacity * openingTerrainProgress).toFixed(3));
    }

    // ========================================================================
    // T8-DNA-a #1: MỘT BỘ ĐIỀU KHIỂN CAMERA DUY NHẤT Ở CÚ LẬT (`kieu_cu_lat`)
    // - `day_may` (mặc định): đẩy chậm 2.0s hướng vật đỏ, kẹp zoom ≤ 2.2
    // - `xuat_hien`: vật đỏ vẽ nét + loang ở cú lật rồi đẩy máy nhẹ
    // - `keo_rong`: mở màn ở cận cảnh (1.55×), cú lật lùi ra 1.0× lộ bối cảnh lớn hơn
    // - `dung_lang`: giữ máy đứng yên 100%, chỉ vật đổi đỏ
    // ========================================================================
    const kieuTag = script.tags?.find((t) => t.startsWith('kieu_cu_lat:'));
    const kieuCuLat = (
      kieuTag ? kieuTag.slice('kieu_cu_lat:'.length) : 'day_may'
    ) as 'day_may' | 'xuat_hien' | 'keo_rong' | 'dung_lang';

    const heroActor = actors.find((a) => a.focusRole === 'hero') ?? actors[0];
    const activeRedProp = props.find((p) => p.isAccentActive);
    const plannedRedProp =
      activeRedProp ??
      props.find((p) => p.spec.focusRole === 'hero' && p.layer !== 'far');
    const handCupActor = !activeRedProp
      ? actors.find((a) => {
          const aSpec = (script.actors ?? []).find((x) => x.id === a.id);
          return a.showTeaCup > 0.2 && aSpec?.teaCupRed === true;
        })
      : undefined;

    const pushStartF =
      timeline.pivotFrame +
      Math.round(TEMPO.RED_COLOR_DELAY_AFTER_PIVOT_SEC * fps);
    const pushEndF = pushStartF + Math.round(TEMPO.PIVOT_PUSH_DUR_SEC * fps);
    const pushProgress = interpolate(
      frame,
      [pushStartF, Math.max(pushStartF + 1, pushEndF)],
      [0, 1],
      {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    );

    const computeGroundedPan = (
      focusX: number,
      focusY: number,
      targetZoom: number
    ) => {
      const targetPanX = focusX - 270;
      let targetPanY = focusY - 315 + 22 / Math.max(1, targetZoom);
      if (terrain.y - focusY <= 90) {
        const minPanYForGround =
          terrain.y - 315 - 47 / Math.max(1, targetZoom);
        targetPanY = Math.max(targetPanY, minPanYForGround);
      }
      return { targetPanX, targetPanY };
    };

    if (kieuCuLat === 'keo_rong') {
      // Mở màn ở cận cảnh quanh nhân vật/vật đỏ, sau cú lật kéo máy lùi dần về toàn cảnh 1.0×
      const startZoom = 1.55;
      const focusX = plannedRedProp
        ? plannedRedProp.x * 0.55 + (heroActor?.x ?? plannedRedProp.x) * 0.45
        : heroActor?.x ?? 270;
      const focusY = plannedRedProp
        ? plannedRedProp.y * 0.55 + (heroActor?.y ?? plannedRedProp.y) * 0.45
        : (heroActor?.y ?? 352) - 24;
      const { targetPanX: startPanX, targetPanY: startPanY } =
        computeGroundedPan(focusX, focusY, startZoom);
      const keepCloseWeight = 1 - pushProgress;
      camera.zoom = Number(
        (1 + (startZoom - 1) * keepCloseWeight).toFixed(4)
      );
      camera.panX = Number((startPanX * keepCloseWeight).toFixed(2));
      camera.panY = Number((startPanY * keepCloseWeight).toFixed(2));
    } else if (
      (kieuCuLat === 'day_may' || kieuCuLat === 'xuat_hien') &&
      heroActor &&
      frame >= timeline.pivotFrame &&
      (activeRedProp || handCupActor)
    ) {
      const redX = activeRedProp ? activeRedProp.x : handCupActor!.x;
      const redY = activeRedProp ? activeRedProp.y : handCupActor!.y - 24;
      const baseRedPx2 = activeRedProp
        ? computePropRedStageArea(activeRedProp) * PX2_PER_STAGE_UNIT2
        : 7 * 5 * 0.88 * handCupActor!.scale * handCupActor!.scale * PX2_PER_STAGE_UNIT2;

      const areaMult =
        kieuCuLat === 'xuat_hien' ? 1.25 : TEMPO.PIVOT_PUSH_RED_AREA_MULT;
      const targetArea = MIN_RED_AREA_PX2 * areaMult;
      let neededZoom: number = TEMPO.PIVOT_PUSH_MIN_ZOOM;
      if (baseRedPx2 > 0 && baseRedPx2 < targetArea) {
        neededZoom = Math.sqrt(targetArea / baseRedPx2);
      }
      const maxZoomCap =
        kieuCuLat === 'xuat_hien' && baseRedPx2 >= MIN_RED_AREA_PX2
          ? Math.min(1.38, TEMPO.PIVOT_PUSH_MAX_ZOOM)
          : TEMPO.PIVOT_PUSH_MAX_ZOOM;
      neededZoom = Math.max(
        TEMPO.PIVOT_PUSH_MIN_ZOOM,
        Math.min(maxZoomCap, neededZoom)
      );

      if (pushProgress > 0.001) {
        const baseCamZoom = Math.min(TEMPO.PIVOT_PUSH_MAX_ZOOM, camera.zoom);
        const targetZoom = Math.min(
          TEMPO.PIVOT_PUSH_MAX_ZOOM,
          Math.max(baseCamZoom, neededZoom)
        );
        const finalZoom = Number(
          (baseCamZoom + (targetZoom - baseCamZoom) * pushProgress).toFixed(4)
        );
        const targetCenterX = redX * 0.8 + heroActor.x * 0.2;
        const targetCenterY = redY * 0.8 + heroActor.y * 0.2;
        const { targetPanX, targetPanY } = computeGroundedPan(
          targetCenterX,
          targetCenterY,
          Math.max(1, targetZoom)
        );

        camera.zoom = finalZoom;
        camera.panX = Number(
          (camera.panX + (targetPanX - camera.panX) * pushProgress).toFixed(2)
        );
        camera.panY = Number(
          (camera.panY + (targetPanY - camera.panY) * pushProgress).toFixed(2)
        );
      }
    }
    // `dung_lang`: giữ nguyên camera tĩnh (zoom=1, panX=0, panY=0)
  } else if ((!visualDNA || !visualDNA.isLegacyLocked)) {
    // Kiến trúc Khai bút Mở màn 4 Pha V8.6.1 (Hướng C — Slow Calligraphic Layered Choreography):
    // - CHOREO-03 (Trọng lực Nhân quả chậm rãi): Lớp nền/Cửa sổ/Ghế ngồi vẽ trước (Tier 1: 0.40s..2.25s)
    //   -> Bàn & Đạo cụ mặt đất vẽ tiếp theo (Tier 2: 1.15s..3.10s)
    //   -> Vật đặt trên mặt bàn vẽ sau khi có bàn (Tier 3: 1.95s..3.85s)
    //   -> Nhân vật ngồi tự họa nét sau khi ghế đã thành hình (1.20s..3.05s); nhân vật đi bộ họa nét ở 0.35s..2.00s.
    // - CHOREO-06 (Bảo toàn Cue Câu Thơ): Đạo cụ và nhân vật có enterAt (như walking_bill ở câu 3) giữ nguyên mốc cue
    //   và tự họa nét thư pháp chậm rãi trong 1.50s..1.55s.
    const timeScale = visualDNA?.shotMode === 'BRUSH_DRAW' ? 1.12 : 1.0;

    props.forEach((p, propIdx) => {
      // TF5 #2: Với làn tự do (`tu_do`), đạo cụ nào kịch bản đã tự định nhịp (có cue `drawProgress` trong timeline
      // hoặc có `enterAt` kèm `fadeDuration`) → dùng đúng nhịp kịch bản, không min/không ép 1.55s V8.6.1.
      if (isFreeMode) {
        const hasScriptDrawCue = cues.some(
          (c) => c.target === p.id && c.drawProgress !== undefined
        );
        const hasExplicitEnterAndFade =
          p.spec.enterAt !== undefined && p.spec.fadeDuration !== undefined;
        if (hasScriptDrawCue || hasExplicitEnterAndFade) {
          return;
        }
      }

      const hasExplicitEnterAt = p.spec.enterAt !== undefined;
      const enterFrame = hasExplicitEnterAt
        ? resolveCueFrame(p.spec.enterAt, timeline)
        : 0;

      if (hasExplicitEnterAt && enterFrame > 6) {
        // Đạo cụ xuất hiện theo nhịp câu thơ (ví dụ câu 2, câu 3, hoặc pivot)
        const cueDrawEnd = enterFrame + Math.round(1.55 * timeScale * fps);
        const cueDraw = interpolate(
          frame,
          [enterFrame, Math.max(enterFrame + 1, cueDrawEnd)],
          [0, 1],
          {
            easing: Easing.linear,
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }
        );
        p.drawProgress = Number(Math.min(p.drawProgress, cueDraw).toFixed(3));
        return;
      }

      // Phân tầng Trọng lực Nhân quả cho các đạo cụ bối cảnh Hồi I
      const idTypeKey = `${p.id} ${p.type}`.toLowerCase();
      const isSeatingOrFar =
        p.layer === 'far' ||
        p.layer === 'sky' ||
        /chair|bench|stool|seat|window|gate|arch|tree/.test(idTypeKey);
      const isTabletopOrAttached =
        (p.spec.y ?? 0) <= -11 ||
        Boolean(p.spec.follow) ||
        /calendar|laptop|bowl|cup|teapot|tray|pad|chart|book|vase|lamp|clock|note|letter|envelope|pen|phone|candle/.test(
          idTypeKey
        );

      let tierStartSec = 1.15;
      let tierDurSec = 1.95;
      if (isSeatingOrFar) {
        tierStartSec = 0.4 + Math.min(propIdx, 3) * 0.14;
        tierDurSec = 1.85;
      } else if (isTabletopOrAttached) {
        tierStartSec = 1.95 + Math.min(propIdx, 3) * 0.14;
        tierDurSec = 1.85;
      } else {
        tierStartSec = 1.15 + Math.min(propIdx, 3) * 0.14;
        tierDurSec = 1.95;
      }

      const staggerStart = Math.round(tierStartSec * timeScale * fps);
      const staggerEnd = Math.min(
        Math.max(
          staggerStart + Math.round(1.2 * fps),
          timeline.pivotFrame - Math.round(0.2 * fps)
        ),
        staggerStart + Math.round(tierDurSec * timeScale * fps)
      );

      // Dùng Easing.linear ở tầng Track để bộ vẽ nét trong propCatalog điều tiết Cosine S-Curve mượt mà không bị nhân đôi gia tốc
      const propDraw = interpolate(
        frame,
        [staggerStart, Math.max(staggerStart + 1, staggerEnd)],
        [0, 1],
        {
          easing: Easing.linear,
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }
      );
      const propInkGate = interpolate(
        frame,
        [
          staggerStart,
          Math.max(staggerStart + 1, staggerStart + Math.round(0.35 * fps)),
        ],
        [0, 1],
        {
          easing: Easing.inOut(Easing.sin),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }
      );

      p.drawProgress = Number(Math.min(p.drawProgress, propDraw).toFixed(3));
      p.opacity = Number((p.opacity * propInkGate).toFixed(3));
    });

    actors.forEach((actor, actorIdx) => {
      const actorSpec = (script.actors ?? [])[actorIdx];
      // TF5 #2: Với làn tự do (`tu_do`), nhân vật nào kịch bản đã tự định nhịp (có cue `drawProgress` trong timeline
      // hoặc có `enterAt` kèm `fadeDuration`) → dùng đúng nhịp kịch bản, không ép hiện nét 1.5s V8.6.1.
      if (isFreeMode) {
        const hasScriptDrawCue = cues.some(
          (c) => c.target === actor.id && c.drawProgress !== undefined
        );
        const hasExplicitEnterAndFade =
          actorSpec?.enterAt !== undefined &&
          actorSpec?.fadeDuration !== undefined;
        if (hasScriptDrawCue || hasExplicitEnterAndFade) {
          return;
        }
      }

      const hasExplicitEnterAt = actorSpec?.enterAt !== undefined;
      const enterFrame = hasExplicitEnterAt
        ? resolveCueFrame(actorSpec?.enterAt, timeline)
        : 0;
      if (hasExplicitEnterAt && enterFrame > 6) {
        const cueActorEnd = enterFrame + Math.round(1.5 * timeScale * fps);
        const cueActorDraw = interpolate(
          frame,
          [enterFrame, Math.max(enterFrame + 1, cueActorEnd)],
          [0, 1],
          {
            easing: Easing.linear,
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }
        );
        actor.drawProgress = Number(cueActorDraw.toFixed(3));
        return;
      }

      const isSeatedInitially =
        actor.sitProgress >= 0.5 || actorSpec?.pose === 'sit_lean';
      const actorStartSec = isSeatedInitially
        ? (1.2 + actorIdx * 0.16) * timeScale
        : (0.35 + actorIdx * 0.16) * timeScale;
      const actorDurSec = (isSeatedInitially ? 1.85 : 1.65) * timeScale;
      const aStart = Math.round(actorStartSec * fps);
      const aEnd = Math.min(
        Math.max(
          aStart + Math.round(1.15 * fps),
          timeline.pivotFrame - Math.round(0.2 * fps)
        ),
        aStart + Math.round(actorDurSec * fps)
      );

      const actorDraw = interpolate(frame, [aStart, aEnd], [0, 1], {
        easing: Easing.linear,
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      const actorInkGate = interpolate(
        frame,
        [aStart, Math.max(aStart + 1, aStart + Math.round(0.35 * fps))],
        [0, 1],
        {
          easing: Easing.inOut(Easing.sin),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }
      );
      actor.drawProgress = Number(actorDraw.toFixed(3));
      actor.opacity = Number((actor.opacity * actorInkGate).toFixed(3));
      if (isSeatedInitially && actorDraw < 1) {
        const settleEase = 0.5 - 0.5 * Math.cos(Math.PI * actorDraw);
        actor.y = Number((actor.y - (1 - settleEase) * 1.8).toFixed(2));
      }
    });

    if (visualDNA?.shotMode === 'MACRO_PROP') {
      const focalProp =
        props.find((p) => p.spec.focusRole === 'hero') ??
        props.find((p) => p.spec.colorRole === 'accent') ??
        props.find((p) => p.layer === 'mid' || p.layer === 'fore') ??
        props[0];
      if (focalProp) {
        const macroZoomProgress = interpolate(
          frame,
          [0, Math.max(1, timeline.pivotFrame + Math.round(0.3 * fps))],
          [0.28, 1],
          {
            easing: Easing.inOut(Easing.cubic),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }
        );
        camera.zoom = Number(
          Math.min(
            1.52,
            camera.zoom * (1.22 + 0.18 * macroZoomProgress)
          ).toFixed(4)
        );
        const targetPanX = Math.max(-96, Math.min(96, focalProp.x - 270));
        const targetPanY = Math.max(
          -88,
          Math.min(42, focalProp.y - 16 - 315)
        );
        camera.panX = Number(
          (camera.panX * 0.35 + targetPanX * 0.65).toFixed(2)
        );
        camera.panY = Number(
          (camera.panY * 0.35 + targetPanY * 0.65).toFixed(2)
        );
        for (const actor of actors) {
          actor.opacity = Number((actor.opacity * 0.14).toFixed(3));
        }
      }
    }
  }

  const focalTarget =
    props.find((p) => p.spec.focusRole === 'hero') ??
    props.find((p) => p.spec.colorRole === 'accent') ??
    actors.find((a) => a.focusRole === 'hero') ??
    actors[0] ??
    props[0];

  return {
    terrain,
    terrainSegments,
    camera,
    layerParallaxX,
    spotlight: {
      strength: spotlightStrength,
      focusX: focalTarget ? focalTarget.x : 270,
      focusY: focalTarget ? focalTarget.y - 16 : 315,
    },
    actors,
    actorMap,
    props,
    openingTerrainProgress,
  };
}

function evaluateIdleOscillator(
  idle: PropIdle | undefined,
  loopProgress: number,
  seedStr: string
): {
  dx: number;
  dy: number;
  dRot: number;
  scaleMult: number;
  opacityMult: number;
} {
  if (!idle) {
    return { dx: 0, dy: 0, dRot: 0, scaleMult: 1, opacityMult: 1 };
  }
  const cfg =
    typeof idle === 'string'
      ? { type: idle, speed: 1, amplitude: 1, spanX: 0, spanY: 0 }
      : {
          type: idle.type,
          speed: idle.speed ?? 1,
          amplitude: idle.amplitude ?? 1,
          spanX: idle.spanX ?? 0,
          spanY: idle.spanY ?? 0,
        };

  if (cfg.type === 'none') {
    return { dx: 0, dy: 0, dRot: 0, scaleMult: 1, opacityMult: 1 };
  }

  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) % 997;
  }
  const seedPhase = (hash % 100) * 0.0628318;
  const harm = Math.max(1, Math.round(cfg.speed * 3));
  const t = loopProgress * Math.PI * 2 * harm + seedPhase;
  const amp = cfg.amplitude;

  switch (cfg.type) {
    case 'float':
      return {
        dx: Math.cos(t) * 1.6 * amp,
        dy: Math.sin(t) * 2.4 * amp,
        dRot: Math.sin(t) * 1.1 * amp,
        scaleMult: 1,
        opacityMult: 1,
      };

    case 'bob':
      return {
        dx: 0,
        dy: Math.sin(t * 2) * 1.8 * amp,
        dRot: Math.cos(t) * 1.5 * amp,
        scaleMult: 1,
        opacityMult: 1,
      };

    case 'sway':
      return {
        dx: 0,
        dy: 0,
        dRot: Math.sin(t) * 2.0 * amp,
        scaleMult: 1,
        opacityMult: 1,
      };

    case 'pulse': {
      const wave = 0.5 + 0.5 * Math.sin(t * 2);
      return {
        dx: 0,
        dy: 0,
        dRot: 0,
        scaleMult: 0.96 + wave * 0.08 * amp,
        opacityMult: 0.82 + wave * 0.18,
      };
    }

    case 'drift': {
      const cycle = (loopProgress * harm + (hash % 100) / 100) % 1;
      return {
        dx: (cycle - 0.5) * (cfg.spanX || 36) * amp,
        dy: Math.sin(cycle * Math.PI * 2) * (cfg.spanY || 4) * amp,
        dRot: 0,
        scaleMult: 1,
        opacityMult: Math.sin(cycle * Math.PI),
      };
    }

    default:
      return { dx: 0, dy: 0, dRot: 0, scaleMult: 1, opacityMult: 1 };
  }
}
