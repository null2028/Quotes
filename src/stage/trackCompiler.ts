import { interpolate, interpolateColors, Easing } from 'remotion';
import { TimelineSyncResult } from '../engine/timelineSync';
import { ThemePalette } from '../theme/palettes';
import { levitateWeightless } from '../kit/SlowMotionVerbs';
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

const CINEMAGRAPH_EASING = Easing.bezier(0.42, 0.0, 0.25, 1.0);

function resolveCinemagraphDurationFrames(
  rawDurationSec: number | undefined,
  startFrame: number,
  pivotFrame: number,
  fps: number,
  fallbackSec = 2.2
): number {
  const isPostPivot = startFrame >= pivotFrame - 6;
  let sec = rawDurationSec ?? (isPostPivot ? 4.2 : fallbackSec);
  if (isPostPivot && sec >= 0.6 && sec < 3.4) {
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
    return isPrePivot ? palette.inkPrimary : palette.accent;
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
  layer: StageLayer;
  focusRole?: FocusRole;
  x: number;
  y: number;
  groundY: number;
  terrainAngleDeg: number;
  scale: number;
  facing: 'left' | 'right';
  pose: StageTravelerPose;
  leanDeg: number;
  sitProgress: number;
  walkPhase: number;
  walkActivity: number;
  breathPhase: number;
  color: string;
  showTeaCup: number;
  dissolveToCloud: number;
  dissolveCloudProgress: number;
  opacity: number;
}

export interface EvaluatedPropState {
  id: string;
  type: string;
  layer: StageLayer;
  focusRole?: FocusRole;
  x: number;
  y: number;
  scale: number;
  rotate: number;
  opacity: number;
  color: string;
  isAccentActive: boolean;
  attachedActorFacing?: 'left' | 'right';
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
  camera: {
    zoom: number;
    panX: number;
    panY: number;
  };
  actors: EvaluatedActorState[];
  actorMap: Record<string, EvaluatedActorState>;
  props: EvaluatedPropState[];
}

export function resolveActorSocketWorldPos(
  actor: EvaluatedActorState,
  socketName: string,
  terrain: NormalizedTerrainConfig,
  phase: number
): { x: number; y: number } {
  const dir = actor.facing === 'right' ? 1 : -1;
  const s = actor.scale;
  const sitDrop = actor.sitProgress * 11.5 * s;
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
  palette: ThemePalette
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

  const terrain = normalizeTerrainConfig(script.terrain, evaluatedBridge);

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

  if (camZoomSegs.length > 0) {
    evaluatedZoom = evaluateNumericChannel(
      frame,
      baseZoomInit,
      camZoomSegs
    ).value;
  } else {
    const pStart = Math.max(1, timeline.pivotFrame - Math.round(0.15 * fps));
    const pEnd = Math.min(
      safeTotalFrames - Math.round(1.5 * fps),
      pStart + Math.round(2.4 * fps)
    );
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
  } else {
    evaluatedPanX = basePanXInit + Math.sin(loopProgress * Math.PI * 2) * 1.4;
  }

  if (camPanYSegs.length > 0) {
    evaluatedPanY = evaluateNumericChannel(
      frame,
      basePanYInit,
      camPanYSegs
    ).value;
  } else {
    const pStart = Math.max(1, timeline.pivotFrame - Math.round(0.15 * fps));
    const pEnd = Math.min(
      safeTotalFrames - Math.round(1.5 * fps),
      pStart + Math.round(2.4 * fps)
    );
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
          2.2
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
        if (cue.pose !== undefined) {
          poseEvents.push({ frame: startF, value: cue.pose });
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
      const curWalk = evaluateActorWalkXChannel(frame, initX, xSegs, fps);
      const prevWalk = evaluateActorWalkXChannel(
        Math.max(0, frame - 1),
        initX,
        xSegs,
        fps
      );
      const nextWalk = evaluateActorWalkXChannel(frame + 1, initX, xSegs, fps);
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
      const stridePx = 8.8 * Math.max(0.6, scale);
      const walkPhase =
        xSegs.length > 0
          ? (curWalk.cumDist / stridePx) * Math.PI
          : loopProgress * Math.PI * 2 * 10;

      const breathPhase =
        loopProgress * Math.PI * 2 * 16 + actorIdx * 1.15;

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
      const leanDeg = evaluateNumericChannel(
        frame,
        actor.leanDeg ?? 0,
        leanSegs
      ).value;
      const sitProgress = evaluateNumericChannel(
        frame,
        actor.sitProgress ?? 0,
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
      let pose = evaluateDiscreteChannel(
        frame,
        actor.pose ?? 'stand',
        poseEvents
      );
      if (walkActivity > 0.08 && pose === 'stand') {
        pose = 'walk';
      } else if (walkActivity === 0 && pose === 'walk') {
        pose = 'stand';
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
        layer: actor.layer ?? 'mid',
        focusRole: actor.focusRole,
        x: curX,
        y: worldY,
        groundY: terrainPt.y,
        terrainAngleDeg: terrainPt.angleDeg,
        scale,
        facing,
        pose,
        leanDeg: leanDeg + terrainPt.angleDeg * 0.35,
        sitProgress,
        walkPhase,
        walkActivity,
        breathPhase,
        color: colorEval.color,
        showTeaCup: isPrePivot ? 0 : showTeaCup,
        dissolveToCloud,
        dissolveCloudProgress,
        opacity: Math.max(
          0,
          Math.min(1, baseOpacity * enterLeaveMult * dissolveOpacityMult)
        ),
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
        2.2
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
      });

      runningPose = toPose;
    }

    let activeFollow = initFollow;
    let worldPos = resolvePropPoseToWorld(
      { follow: initFollow, x: initX, y: initY },
      prop
    );

    for (const seg of posSegments) {
      if (frame < seg.startFrame) break;
      if (frame >= seg.endFrame) {
        activeFollow = seg.toPose.follow;
        worldPos = resolvePropPoseToWorld(seg.toPose, prop);
        continue;
      }
      activeFollow = seg.toPose.follow ?? seg.fromPose.follow;
      const span = Math.max(1, seg.endFrame - seg.startFrame);
      const rawP = Math.max(0, Math.min(1, (frame - seg.startFrame) / span));
      const p = CINEMAGRAPH_EASING(rawP);
      const fromW = resolvePropPoseToWorld(seg.fromPose, prop);
      const toW = resolvePropPoseToWorld(seg.toPose, prop);
      const arcOffset = seg.arcY ? 4 * p * (1 - p) * seg.arcY : 0;
      worldPos = {
        x: fromW.x + (toW.x - fromW.x) * p,
        y: fromW.y + (toW.y - fromW.y) * p + arcOffset,
      };
      break;
    }

    let attachedActorFacing: 'left' | 'right' | undefined;
    if (activeFollow) {
      const [actorId] = activeFollow.split(':');
      if (actorMap[actorId]) {
        attachedActorFacing = actorMap[actorId].facing;
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
        2.2
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

    return {
      id: prop.id,
      type: prop.type ?? 'custom',
      layer: prop.layer ?? 'mid',
      focusRole: prop.focusRole,
      x: finalX,
      y: finalY,
      scale,
      rotate,
      opacity: Math.max(0, Math.min(1, finalOpacity)),
      color: colorEval.color,
      isAccentActive,
      attachedActorFacing,
      drawProgress,
      morphProgress,
      splitProgress,
      floatAwayProgress,
      emitters: {
        steam,
        pulseRing: isPrePivot ? 0 : pulseRing,
        spill,
        glow,
        color: emitterColor,
        steamColor,
      },
      spec: prop,
    };
  });

  return {
    terrain,
    camera,
    actors,
    actorMap,
    props,
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
