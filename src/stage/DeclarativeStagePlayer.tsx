import React from 'react';
import { interpolateColors } from 'remotion';
import { EvaluatedMotionState } from '../engine/motionPhysics';
import { TimelineSyncResult } from '../engine/timelineSync';
import {
  LAYOUT_TOKENS,
  ThemePalette,
  isDarkThemePalette,
} from '../theme/palettes';
import { CloakedTraveler } from '../kit/CloakedTraveler';
import {
  SlowRain,
  WindBreeze,
  NotificationRings,
  FallingLeaves,
  RisingSteam,
  DistantBirds,
  CelestialBody,
} from '../kit/Atmosphere';
import {
  AtmosphereItem,
  StageLayer,
  StageScript,
} from './stageScriptSchema';
import {
  EvaluatedTerrainSegment,
  normalizeTerrainConfig,
  resolveXCoord,
  STAGE_VIEWBOX,
  TerrainRenderer,
} from './terrainSystem';
import { evaluateEnterLeaveMultiplier } from './timeResolver';
import {
  applyHorizonOffsetToTerrain,
  EvaluatedActorState,
  EvaluatedPropState,
  evaluateStageScriptAtFrame,
  resolveRoleColor,
} from './trackCompiler';
import { ResolvedVisualDNA } from '../engine/visualDnaResolver';
import {
  BUILT_IN_PROP_CATALOG,
  StagePropRenderer,
} from './propCatalog';
import { isLegacyStageScript } from './legacySceneIds';
import { validateStageScriptHard } from './stageValidator';
import {
  getActorWorldBBox,
  getPropWorldBBox,
  resolveEffectiveSemanticLayer,
} from './stageGeometry';

function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export const DeclarativeStagePlayer: React.FC<{
  script: StageScript;
  state: EvaluatedMotionState;
  palette: ThemePalette;
  strokeWidth: number;
  frame: number;
  fps: number;
  durationInFrames: number;
  timeline: TimelineSyncResult;
  visualDNA?: ResolvedVisualDNA;
  stageBox?: { width: number; height: number };
  frameMode?: 'NONE' | 'WINDOW_ARCH' | 'ASYMMETRIC_CARD';
  showDebugBBoxes?: boolean;
}> = ({
  script,
  state,
  palette,
  strokeWidth,
  frame,
  fps,
  durationInFrames,
  timeline,
  visualDNA,
  stageBox,
  frameMode = 'NONE',
  showDebugBBoxes = false,
}) => {
  const svgWidth = stageBox?.width ?? LAYOUT_TOKENS.swissGrid.stageWidth;
  const svgHeight = stageBox?.height ?? LAYOUT_TOKENS.swissGrid.stageHeight;
  const isLegacy = isLegacyStageScript(script, script.sceneId);

  // Bước 2: Validator chặn cứng trước mọi lần render cho kịch bản mới (trong cả Studio lẫn CLI)
  const validation = React.useMemo(
    () => (isLegacy ? null : validateStageScriptHard(script, timeline)),
    [isLegacy, script, timeline]
  );

  if (validation && !validation.valid) {
    if (
      typeof process !== 'undefined' &&
      process.env &&
      process.env.STAGE_STRICT_THROW === '1'
    ) {
      throw new Error(
        `Stage Validator chặn cứng (${validation.issues.length} lỗi):\n` +
          validation.issues.map((i) => `- ${i.message}`).join('\n')
      );
    }
    return (
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={STAGE_VIEWBOX}
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: 'visible', background: 'transparent' }}
      >
        <rect
          x="74"
          y="138"
          width="392"
          height="224"
          rx="6"
          fill="#FDF2F0"
          stroke="#CE472E"
          strokeWidth="1.4"
        />
        <text
          x="88"
          y="160"
          fontFamily="Georgia, serif"
          fontSize="11"
          fontWeight="bold"
          fill="#CE472E"
        >
          {`CHẶN RENDER — ${validation.issues.length} lỗi kịch bản sân khấu:`}
        </text>
        {validation.issues.slice(0, 8).map((iss, idx) => (
          <text
            key={idx}
            x="88"
            y={180 + idx * 20}
            fontFamily="Georgia, serif"
            fontSize="8.8"
            fill="#1E1B18"
          >
            {`• ${iss.message.slice(0, 72)}`}
          </text>
        ))}
      </svg>
    );
  }

  const isDarkSpotTheme = isDarkThemePalette(palette.id);
  const propAccentColor = palette.accentProp || palette.accent;
  const compiledNow = evaluateStageScriptAtFrame(
    script,
    frame,
    timeline,
    palette,
    visualDNA
  );

  const isSemantic = Boolean(script.tags?.includes('semantic_v1'));
  const loopBlend = state.seamlessLoopBlend ?? 0;
  // T8-DNA-a #4: Gói Chén (`semantic_v1`) KHÔNG kéo ngược vật đỏ/camera về frame 0;
  // thay bằng mờ dần cả vùng hình về giấy trong 0.8s cuối để khớp khung đầu.
  const isLoopClosing = !isSemantic && loopBlend > 0.002;
  const compiledZero = isLoopClosing
    ? evaluateStageScriptAtFrame(script, 0, timeline, palette, visualDNA)
    : null;

  const effFps = fps || timeline.fps || 60;
  const outroFadeFrames = Math.max(1, Math.round(0.8 * effFps));
  const outroStartFrame = Math.max(
    timeline.pivotFrame + Math.round(1.0 * effFps),
    durationInFrames - outroFadeFrames
  );
  const rawOutroU =
    isSemantic && frame >= outroStartFrame
      ? Math.max(
          0,
          Math.min(
            1,
            (frame - outroStartFrame) /
              Math.max(1, durationInFrames - 1 - outroStartFrame)
          )
        )
      : 0;
  const stageOutroOpacity = isSemantic
    ? 1 - (0.5 - 0.5 * Math.cos(Math.PI * rawOutroU))
    : 1;

  const isPrePivot = frame < timeline.pivotFrame - 6;
  const isAfterPivot = isSemantic
    ? !isPrePivot
    : !isPrePivot && loopBlend < 0.75;
  const postPivotFade = isSemantic
    ? 1
    : frame > timeline.pivotFrame
      ? state.drawProgress
      : 1;
  const phase = state.continuousPhase;
  const isSolidStyle =
    Boolean(script.tags?.includes('solid_style')) ||
    Boolean(script.tags?.includes('semantic_v1')) ||
    Boolean(visualDNA?.forceSolidStyle);
  const horizonOffsetPx =
    visualDNA && !visualDNA.isLegacyLocked ? visualDNA.horizonOffsetPx : 0;

  const effectiveTerrain =
    compiledZero && isLoopClosing
      ? applyHorizonOffsetToTerrain(
          normalizeTerrainConfig(
            script.terrain,
            lerpNum(
              compiledNow.terrain.bridgeProgress,
              compiledZero.terrain.bridgeProgress,
              loopBlend
            )
          ),
          horizonOffsetPx
        )
      : compiledNow.terrain;

  const cam =
    compiledZero && isLoopClosing
      ? {
          zoom: lerpNum(compiledNow.camera.zoom, compiledZero.camera.zoom, loopBlend),
          panX: lerpNum(compiledNow.camera.panX, compiledZero.camera.panX, loopBlend),
          panY: lerpNum(compiledNow.camera.panY, compiledZero.camera.panY, loopBlend),
        }
      : compiledNow.camera;

  const blendedActors: Array<{ key: string; actor: EvaluatedActorState }> = [];
  if (compiledZero && isLoopClosing) {
    for (const curA of compiledNow.actors) {
      const zeroA = compiledZero.actorMap[curA.id];
      if (!zeroA) {
        blendedActors.push({
          key: `${curA.id}-cur`,
          actor: { ...curA, opacity: curA.opacity * (1 - loopBlend) },
        });
        continue;
      }
      const dist = Math.hypot(curA.x - zeroA.x, curA.y - zeroA.y);
      const bothVisible =
        curA.opacity > 0.08 && zeroA.opacity > 0.08 && curA.dissolveToCloud < 0.3;
      if (bothVisible && dist <= 36) {
        blendedActors.push({
          key: curA.id,
          actor: {
            ...curA,
            x: lerpNum(curA.x, zeroA.x, loopBlend),
            y: lerpNum(curA.y, zeroA.y, loopBlend),
            groundY: lerpNum(curA.groundY, zeroA.groundY, loopBlend),
            scale: lerpNum(curA.scale, zeroA.scale, loopBlend),
            leanDeg: lerpNum(curA.leanDeg, zeroA.leanDeg, loopBlend),
            sitProgress: lerpNum(curA.sitProgress, zeroA.sitProgress, loopBlend),
            showTeaCup: lerpNum(curA.showTeaCup, zeroA.showTeaCup, loopBlend),
            drawProgress: lerpNum(curA.drawProgress, zeroA.drawProgress, loopBlend),
            opacity: lerpNum(curA.opacity, zeroA.opacity, loopBlend),
            color:
              curA.color === zeroA.color
                ? curA.color
                : interpolateColors(loopBlend, [0, 1], [curA.color, zeroA.color]),
            facing: loopBlend < 0.55 ? curA.facing : zeroA.facing,
            pose: loopBlend < 0.55 ? curA.pose : zeroA.pose,
            poseWeights: {
              lookUp: lerpNum(
                curA.poseWeights.lookUp,
                zeroA.poseWeights.lookUp,
                loopBlend
              ),
              reachOut: lerpNum(
                curA.poseWeights.reachOut,
                zeroA.poseWeights.reachOut,
                loopBlend
              ),
              give: lerpNum(
                curA.poseWeights.give,
                zeroA.poseWeights.give,
                loopBlend
              ),
              holdUp: lerpNum(
                curA.poseWeights.holdUp,
                zeroA.poseWeights.holdUp,
                loopBlend
              ),
              push: lerpNum(
                curA.poseWeights.push,
                zeroA.poseWeights.push,
                loopBlend
              ),
            },
          },
        });
      } else {
        if (curA.opacity * (1 - loopBlend) > 0.01) {
          blendedActors.push({
            key: `${curA.id}-out`,
            actor: { ...curA, opacity: curA.opacity * (1 - loopBlend) },
          });
        }
        if (zeroA.opacity * loopBlend > 0.01) {
          blendedActors.push({
            key: `${zeroA.id}-in`,
            actor: {
              ...zeroA,
              breathPhase: curA.breathPhase,
              opacity: zeroA.opacity * loopBlend,
            },
          });
        }
      }
    }
  } else {
    for (const curA of compiledNow.actors) {
      blendedActors.push({ key: curA.id, actor: curA });
    }
  }

  const blendedProps: Array<{ key: string; prop: EvaluatedPropState }> = [];
  if (compiledZero && isLoopClosing) {
    const zeroPropMap = new Map<string, EvaluatedPropState>();
    for (const zp of compiledZero.props) {
      zeroPropMap.set(zp.id, zp);
    }
    for (const curP of compiledNow.props) {
      const zeroP = zeroPropMap.get(curP.id);
      if (!zeroP) {
        blendedProps.push({
          key: `${curP.id}-cur`,
          prop: { ...curP, opacity: curP.opacity * (1 - loopBlend) },
        });
        continue;
      }
      const dist = Math.hypot(curP.x - zeroP.x, curP.y - zeroP.y);
      const bothVisible =
        curP.opacity > 0.08 && zeroP.opacity > 0.08 && curP.floatAwayProgress < 0.25;
      if (bothVisible && dist <= 42) {
        blendedProps.push({
          key: curP.id,
          prop: {
            ...curP,
            x: lerpNum(curP.x, zeroP.x, loopBlend),
            y: lerpNum(curP.y, zeroP.y, loopBlend),
            scale: lerpNum(curP.scale, zeroP.scale, loopBlend),
            rotate: lerpNum(curP.rotate, zeroP.rotate, loopBlend),
            opacity: lerpNum(curP.opacity, zeroP.opacity, loopBlend),
            motionActivity: lerpNum(
              curP.motionActivity,
              zeroP.motionActivity,
              loopBlend
            ),
            travelDist: lerpNum(
              curP.travelDist,
              zeroP.travelDist,
              loopBlend
            ),
            drawProgress: lerpNum(curP.drawProgress, zeroP.drawProgress, loopBlend),
            morphProgress: lerpNum(curP.morphProgress, zeroP.morphProgress, loopBlend),
            splitProgress: lerpNum(curP.splitProgress, zeroP.splitProgress, loopBlend),
            floatAwayProgress: lerpNum(
              curP.floatAwayProgress,
              zeroP.floatAwayProgress,
              loopBlend
            ),
            isAccentActive:
              loopBlend < 0.65 ? curP.isAccentActive : zeroP.isAccentActive,
            color:
              curP.color === zeroP.color
                ? curP.color
                : interpolateColors(loopBlend, [0, 1], [curP.color, zeroP.color]),
            emitters: {
              steam: lerpNum(curP.emitters.steam, zeroP.emitters.steam, loopBlend),
              pulseRing: lerpNum(
                curP.emitters.pulseRing,
                zeroP.emitters.pulseRing,
                loopBlend
              ),
              spill: lerpNum(curP.emitters.spill, zeroP.emitters.spill, loopBlend),
              glow: lerpNum(curP.emitters.glow, zeroP.emitters.glow, loopBlend),
              color:
                curP.emitters.color === zeroP.emitters.color
                  ? curP.emitters.color
                  : interpolateColors(
                      loopBlend,
                      [0, 1],
                      [curP.emitters.color, zeroP.emitters.color]
                    ),
              steamColor:
                curP.emitters.steamColor === zeroP.emitters.steamColor
                  ? curP.emitters.steamColor
                  : interpolateColors(
                      loopBlend,
                      [0, 1],
                      [curP.emitters.steamColor, zeroP.emitters.steamColor]
                    ),
            },
          },
        });
      } else {
        if (curP.opacity * (1 - loopBlend) > 0.01) {
          blendedProps.push({
            key: `${curP.id}-out`,
            prop: { ...curP, opacity: curP.opacity * (1 - loopBlend) },
          });
        }
        if (zeroP.opacity * loopBlend > 0.01) {
          blendedProps.push({
            key: `${zeroP.id}-in`,
            prop: { ...zeroP, opacity: zeroP.opacity * loopBlend },
          });
        }
      }
    }
  } else {
    for (const curP of compiledNow.props) {
      blendedProps.push({ key: curP.id, prop: curP });
    }
  }

  const blendedTerrainSegments: EvaluatedTerrainSegment[] =
    compiledZero && isLoopClosing
      ? compiledNow.terrainSegments.map((curS) => {
          const zeroS = compiledZero.terrainSegments.find(
            (zs) => zs.id === curS.id
          );
          if (!zeroS) {
            return { ...curS, opacity: curS.opacity * (1 - loopBlend) };
          }
          return {
            ...curS,
            strokeWidth: lerpNum(curS.strokeWidth, zeroS.strokeWidth, loopBlend),
            opacity: lerpNum(curS.opacity, zeroS.opacity, loopBlend),
            color:
              curS.color === zeroS.color
                ? curS.color
                : interpolateColors(loopBlend, [0, 1], [curS.color, zeroS.color]),
            isAccentActive:
              loopBlend < 0.65 ? curS.isAccentActive : zeroS.isAccentActive,
          };
        })
      : compiledNow.terrainSegments;

  const activeOpenUmbrella = blendedProps.find(
    ({ prop: p }) =>
      p.opacity > 0.3 &&
      p.morphProgress > 0.55 &&
      (p.id.includes('umbrella') || p.type.includes('umbrella'))
  )?.prop;
  const rainShelterZone = activeOpenUmbrella
    ? {
        minX: activeOpenUmbrella.x - 38 * activeOpenUmbrella.scale,
        maxX: activeOpenUmbrella.x + 38 * activeOpenUmbrella.scale,
        topY: activeOpenUmbrella.y - 22 * activeOpenUmbrella.scale,
      }
    : undefined;

  const renderAtmosphereItem = (item: AtmosphereItem, idx: number) => {
    const enterLeaveNow = evaluateEnterLeaveMultiplier(
      frame,
      timeline,
      item.enterAt,
      item.leaveAt,
      item.fadeDuration ?? 1.5
    );
    const enterLeaveZero = isLoopClosing
      ? evaluateEnterLeaveMultiplier(
          0,
          timeline,
          item.enterAt,
          item.leaveAt,
          item.fadeDuration ?? 1.5
        )
      : enterLeaveNow;
    const enterLeave = lerpNum(enterLeaveNow, enterLeaveZero, loopBlend);

    const focusCap =
      item.focusRole === 'ambient'
        ? isDarkSpotTheme
          ? 0.56
          : 0.48
        : item.focusRole === 'support'
          ? isDarkSpotTheme
            ? 0.64
            : 0.52
          : 0.95;
    const atmoIntroMult =
      item.enterAt !== undefined
        ? 1
        : Math.max(0, Math.min(1, (frame - Math.round(0.55 * timeline.fps)) / Math.max(1, Math.round(0.75 * timeline.fps))));
    const stageOutroGate =
      frame > timeline.pivotFrame ? state.drawProgress : 1;
    const rawItemOpacity =
      (item.opacity ?? 1) * enterLeave * atmoIntroMult * stageOutroGate;
    const itemOpacity =
      item.focusRole === 'ambient' || item.focusRole === 'support'
        ? Math.min(focusCap, rawItemOpacity)
        : rawItemOpacity * 0.95;
    if (itemOpacity <= 0.01) return null;

    const baseRole =
      item.colorRole ??
      (item.type === 'ring_pulse' ? 'accent' : 'secondary');
    const colorNow = resolveRoleColor(baseRole, palette, isPrePivot);
    const colorZero = resolveRoleColor(baseRole, palette, true);
    const color =
      isLoopClosing && colorNow !== colorZero
        ? interpolateColors(loopBlend, [0, 1], [colorNow, colorZero])
        : colorNow;

    const isCelestial =
      item.type === 'sun' ||
      item.type === 'hollow_sun' ||
      item.type === 'crescent';
    const rawX = resolveXCoord(
      item.x,
      item.type === 'birds' ? 235 : isCelestial ? 375 : 355
    );
    const rawY =
      item.y ?? (item.type === 'steam' ? 332 : isCelestial ? 185 : 215);
    const x = isCelestial ? Math.max(125, Math.min(415, rawX)) : rawX;
    const y = isCelestial ? Math.max(138, Math.min(250, rawY)) : rawY;

    switch (item.type) {
      case 'rain':
        return (
          <SlowRain
            key={item.id ?? `atmo-${idx}`}
            frame={frame}
            opacity={itemOpacity}
            color={color}
            count={item.count ?? 14}
            shelterZone={rainShelterZone}
          />
        );
      case 'wind':
        return (
          <WindBreeze
            key={item.id ?? `atmo-${idx}`}
            frame={frame}
            opacity={itemOpacity}
            color={color}
            direction={item.direction ?? 'left'}
            count={item.count ?? 5}
          />
        );
      case 'leaves':
        return (
          <FallingLeaves
            key={item.id ?? `atmo-${idx}`}
            frame={frame}
            opacity={itemOpacity}
            color={color}
            accentColor={isAfterPivot ? propAccentColor : palette.inkSecondary}
            count={item.count ?? 6}
          />
        );
      case 'steam':
        return (
          <RisingSteam
            key={item.id ?? `atmo-${idx}`}
            x={x}
            y={y}
            frame={frame}
            color={color}
            opacity={itemOpacity}
          />
        );
      case 'birds':
        return (
          <DistantBirds
            key={item.id ?? `atmo-${idx}`}
            progress={state.beat3LingeringWalk}
            phase={phase}
            color={color}
            startX={x}
            startY={y}
            opacity={itemOpacity}
          />
        );
      case 'sun':
      case 'hollow_sun':
      case 'crescent':
        return (
          <CelestialBody
            key={item.id ?? `atmo-${idx}`}
            type={item.type}
            x={x}
            y={y}
            radius={item.radius ?? 18}
            frame={frame}
            color={color}
            opacity={itemOpacity}
          />
        );
      case 'ring_pulse':
        return (
          <NotificationRings
            key={item.id ?? `atmo-${idx}`}
            x={x}
            y={y}
            frame={frame}
            color={color}
            opacity={itemOpacity}
            maxRadius={item.radius ?? 24}
          />
        );
      default:
        return null;
    }
  };

  const renderActorNode = (key: string, actor: EvaluatedActorState) => {
    const isFar = actor.layer === 'far';
    const focusStrokeMult =
      actor.focusRole === 'hero'
        ? 1.1
        : actor.focusRole === 'support'
          ? 0.72
          : actor.focusRole === 'ambient'
            ? 0.55
            : isFar
              ? 0.72
              : 1.0;
    // Nhân focusStrokeMult trên zoomStroke (đã bù zoom) → nét cố định trên màn hình (non-scaling-stroke)
    const effStroke = zoomStroke * focusStrokeMult;
    const dissolveMult = Math.max(0, 1 - actor.dissolveToCloud * 1.25);
    const rawActorOpacity = actor.opacity * dissolveMult;
    const effOpacity =
      actor.focusRole === 'ambient'
        ? Math.min(isDarkSpotTheme ? 0.36 : 0.24, rawActorOpacity)
        : actor.focusRole === 'support' || isFar
          ? Math.min(isDarkSpotTheme ? 0.52 : 0.38, rawActorOpacity)
          : isSolidStyle
            ? Math.min(1, rawActorOpacity)
            : rawActorOpacity * 0.95;

    const cloudP = actor.dissolveCloudProgress;
    const cloudOpacity =
      cloudP > 0.01 && cloudP < 0.995
        ? Math.sin(cloudP * Math.PI) * 0.72 * (1 - loopBlend)
        : 0;

    const rigName = actor.rig?.trim();
    const isCustomRig =
      Boolean(rigName) &&
      rigName !== 'traveler' &&
      rigName !== 'cloaked_traveler' &&
      rigName !== 'human' &&
      Boolean(
        script.customPropsResolved?.[rigName!] ??
          BUILT_IN_PROP_CATALOG[rigName!]
      );

    const safeTotalFrames = Math.max(2, timeline.durationInFrames);
    const actorLoopProgress =
      (((frame % safeTotalFrames) + safeTotalFrames) % safeTotalFrames) /
      safeTotalFrames;
    const actorDirSign = actor.facing === 'left' ? -1 : 1;

    const actorSpec = (script.actors ?? []).find((x) => x.id === actor.id);
    // Quy tắc 3: ở kịch bản mới, chén trà trên tay Lữ khách mặc định màu mực (inkPrimary) kiểu nét+wash T2,
    // chỉ đổi đỏ sau Pivot nếu `teaCupRed === true` (hoặc kịch bản legacy giữ nguyên tương thích cũ).
    const isTeaCupRedNow =
      isAfterPivot && (isLegacy || actorSpec?.teaCupRed === true);
    const teaCupHighlightColor = isTeaCupRedNow
      ? propAccentColor
      : palette.inkPrimary;

    const actorStageGate =
      frame > timeline.pivotFrame ? state.drawProgress : 1;
    return (
      <g key={`actor-${key}`} opacity={actorStageGate}>
        {effOpacity > 0.01 &&
          actor.dissolveToCloud < 0.8 &&
          (isCustomRig && rigName ? (
            <StagePropRenderer
              propState={{
                id: actor.id,
                type: rigName,
                layer: actor.layer,
                focusRole: actor.focusRole,
                x: actor.x,
                y: actor.y,
                scale: actor.scale,
                rotate: actor.leanDeg,
                opacity: effOpacity,
                color: actor.color,
                isAccentActive: isAfterPivot && actor.color === propAccentColor,
                loopProgress: actorLoopProgress,
                motionActivity: actor.walkActivity,
                travelDist:
                  actorDirSign *
                  (actor.walkPhase / Math.PI) *
                  8.8 *
                  Math.max(0.6, actor.scale),
                drawProgress: actor.drawProgress,
                morphProgress: isAfterPivot ? actor.sitProgress : 0,
                splitProgress: 0,
                floatAwayProgress: 0,
                emitters: {
                  steam: actor.showTeaCup,
                  pulseRing: 0,
                  spill: 0,
                  glow: 0,
                  color: propAccentColor,
                  steamColor: isAfterPivot
                    ? propAccentColor
                    : palette.inkSecondary,
                },
                spec: {
                  id: actor.id,
                  type: rigName,
                },
              }}
              palette={palette}
              strokeWidth={zoomStroke}
              frame={frame}
              durationInFramesOverride={durationInFrames}
              isAfterPivot={isAfterPivot}
              customPropsMap={script.customPropsResolved}
              flipX={actor.facing === 'left'}
            />
          ) : (
            <CloakedTraveler
              x={actor.x}
              y={actor.y}
              scale={actor.scale}
              facing={actor.facing}
              pose={actor.pose}
              poseWeights={actor.poseWeights}
              leanDeg={actor.leanDeg}
              sitProgress={actor.sitProgress}
              gazeX={actor.gazeX}
              gazeY={actor.gazeY}
              hasLookTarget={actor.hasLookTarget}
              walkPhase={actor.walkPhase}
              walkActivity={actor.walkActivity}
              breathPhase={actor.breathPhase}
              color={actor.color}
              accentColor={teaCupHighlightColor}
              bgColor={palette.background}
              showTeaCup={actor.showTeaCup}
              teaCupRed={isTeaCupRedNow}
              role={actor.role}
              ponytail={actor.ponytail}
              solidFill={isSolidStyle}
              strokeWidth={effStroke}
              opacity={effOpacity}
              drawProgress={actor.drawProgress}
            />
          ))}

        {cloudOpacity > 0.01 && (
          <g
            transform={`translate(${(actor.x + Math.sin(cloudP * Math.PI * 1.4) * 12).toFixed(1)}, ${(actor.groundY - 26 - cloudP * 74).toFixed(1)}) scale(${(0.88 + cloudP * 0.28).toFixed(2)})`}
            opacity={cloudOpacity}
          >
            <path
              d="M -18 2 C -13 -5 -5 -5 0 -1 C 5 -6 14 -5 19 1"
              fill="none"
              stroke={palette.inkSecondary}
              strokeWidth={zoomStroke * 0.65}
              strokeLinecap="round"
            />
            <path
              d="M -11 6 C -5 2 4 2 12 5"
              fill="none"
              stroke={palette.inkSecondary}
              strokeWidth={zoomStroke * 0.55}
              strokeLinecap="round"
              opacity={0.75}
            />
          </g>
        )}
      </g>
    );
  };

  const renderPropsByLayer = (layer: StageLayer) =>
    blendedProps
      .filter((entry) => entry.prop.layer === layer)
      .map(({ key, prop }) => (
        <StagePropRenderer
          key={`prop-${key}`}
          propState={prop}
          palette={palette}
          strokeWidth={zoomStroke}
          frame={frame}
          durationInFramesOverride={durationInFrames}
          isAfterPivot={isAfterPivot}
          customPropsMap={script.customPropsResolved}
        />
      ));

  const renderActorsByLayer = (layer: StageLayer) =>
    blendedActors
      .filter((entry) => entry.actor.layer === layer)
      .map(({ key, actor }) => renderActorNode(key, actor));

  // Bước 3: Chế độ vẽ hộp bao (bounding boxes) & điểm neo của từng vật để kiểm tra trực quan va chạm
  const renderDebugBBoxOverlay = () => {
    if (!showDebugBBoxes) return null;
    const layerColor: Record<string, string> = {
      nen: '#6B7280',
      giua: '#2563EB',
      truoc: '#9333EA',
    };
    const nodes: React.ReactNode[] = [];

    for (const { key, prop } of blendedProps) {
      if (prop.opacity <= 0.1) continue;
      const box = getPropWorldBBox(
        prop,
        script.customPropsResolved,
        isAfterPivot
      );
      if (!box) continue;
      const catDef = BUILT_IN_PROP_CATALOG[prop.type];
      const semLayer = resolveEffectiveSemanticLayer(
        prop.spec.semanticLayer ?? catDef?.defaultLayer,
        prop.layer,
        `${prop.id} ${prop.type}`
      );
      const col = layerColor[semLayer] || '#2563EB';
      nodes.push(
        <g key={`dbg-p-${key}`}>
          <rect
            x={box.x0}
            y={box.y0}
            width={Math.max(0.5, box.x1 - box.x0)}
            height={Math.max(0.5, box.y1 - box.y0)}
            fill="none"
            stroke={col}
            strokeWidth="0.7"
            strokeDasharray="2.2 1.6"
          />
          <circle cx={prop.x} cy={prop.y} r="1.2" fill="#16A34A" />
          <text
            x={box.x0}
            y={box.y0 - 1.8}
            fontFamily="Georgia, serif"
            fontSize="5.2"
            fill={col}
          >
            {`${prop.id}[${semLayer}]`}
          </text>
          {Object.entries(catDef?.anchors ?? {}).map(([aName, [ax, ay]]) => (
            <circle
              key={aName}
              cx={prop.x + ax * prop.scale}
              cy={prop.y + ay * prop.scale}
              r="1.35"
              fill="#EA580C"
            />
          ))}
        </g>
      );
    }

    for (const { key, actor } of blendedActors) {
      if (actor.opacity <= 0.1) continue;
      const box = getActorWorldBBox(
        actor,
        script.customPropsResolved,
        isAfterPivot
      );
      if (!box) continue;
      const aSpec = (script.actors ?? []).find((x) => x.id === actor.id);
      const semLayer = resolveEffectiveSemanticLayer(
        aSpec?.semanticLayer,
        actor.layer,
        `${actor.id} ${actor.rig || 'human'}`
      );
      const col = layerColor[semLayer] || '#2563EB';
      nodes.push(
        <g key={`dbg-a-${key}`}>
          <rect
            x={box.x0}
            y={box.y0}
            width={Math.max(0.5, box.x1 - box.x0)}
            height={Math.max(0.5, box.y1 - box.y0)}
            fill="none"
            stroke={col}
            strokeWidth="0.75"
            strokeDasharray="2.5 1.5"
          />
          <circle cx={actor.x} cy={actor.y} r="1.2" fill="#16A34A" />
          <text
            x={box.x0}
            y={box.y0 - 1.8}
            fontFamily="Georgia, serif"
            fontSize="5.2"
            fill={col}
          >
            {`${actor.id}[${semLayer}]`}
          </text>
        </g>
      );
    }

    return <g pointerEvents="none">{nodes}</g>;
  };

  const parallax =
    compiledZero && isLoopClosing
      ? {
          sky: lerpNum(
            compiledNow.layerParallaxX.sky,
            compiledZero.layerParallaxX.sky,
            loopBlend
          ),
          far: lerpNum(
            compiledNow.layerParallaxX.far,
            compiledZero.layerParallaxX.far,
            loopBlend
          ),
          mid: lerpNum(
            compiledNow.layerParallaxX.mid,
            compiledZero.layerParallaxX.mid,
            loopBlend
          ),
          fore: lerpNum(
            compiledNow.layerParallaxX.fore,
            compiledZero.layerParallaxX.fore,
            loopBlend
          ),
        }
      : compiledNow.layerParallaxX;

  const spotlight =
    compiledZero && isLoopClosing
      ? {
          strength: lerpNum(
            compiledNow.spotlight.strength,
            compiledZero.spotlight.strength,
            loopBlend
          ),
          focusX: lerpNum(
            compiledNow.spotlight.focusX,
            compiledZero.spotlight.focusX,
            loopBlend
          ),
          focusY: lerpNum(
            compiledNow.spotlight.focusY,
            compiledZero.spotlight.focusY,
            loopBlend
          ),
        }
      : compiledNow.spotlight;

  const spotGradId = `stage-spotlight-${(script.sceneId || 'cup').replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const peripheryDim =
    spotlight.strength > 0.005
      ? 1 - spotlight.strength * (isDarkSpotTheme ? 0.38 : 0.32)
      : 1;

  const cameraTransform = `translate(270, 315) scale(${cam.zoom.toFixed(5)}) translate(${(-270 - cam.panX).toFixed(3)}, ${(-315 - cam.panY).toFixed(3)})`;
  // strokeWidth đã bù zoom cho mọi phần tử nằm trong cameraTransform group
  const zoomStroke = strokeWidth / cam.zoom;

  // T7e #2: Khi đẩy máy (zoom > 1.02), kéo dài đường đất ra vượt mép vùng hình ở mọi mức zoom & pan
  // để không bao giờ bị cụt nét hay mờ mất ở mép khung nhìn
  const renderTerrain = (() => {
    if (cam.zoom <= 1.02) return effectiveTerrain;
    const visHalfW = 270 / cam.zoom;
    const visMinX = 270 + cam.panX - parallax.mid - visHalfW;
    const visMaxX = 270 + cam.panX - parallax.mid + visHalfW;
    const padX = Math.max(visHalfW * 0.9, 120);
    const extStartX = Math.min(effectiveTerrain.startX, visMinX - padX);
    const extEndX = Math.max(effectiveTerrain.endX, visMaxX + padX);
    if (extStartX === effectiveTerrain.startX && extEndX === effectiveTerrain.endX) {
      return effectiveTerrain;
    }
    return {
      ...effectiveTerrain,
      startX: Number(extStartX.toFixed(1)),
      endX: Number(extEndX.toFixed(1)),
    };
  })();

  const hasBackdropSet = Boolean(
    script.tags?.some((t) => t.startsWith('boi_canh_bo:'))
  );

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={STAGE_VIEWBOX}
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: 'visible', background: 'transparent' }}
    >
      {spotlight.strength > 0.005 && (
        <defs>
          <radialGradient
            id={spotGradId}
            cx={spotlight.focusX.toFixed(1)}
            cy={spotlight.focusY.toFixed(1)}
            r="146"
            gradientUnits="userSpaceOnUse"
          >
            <stop
              offset="0%"
              stopColor={isDarkSpotTheme ? '#FFEAD2' : '#FFF5E0'}
              stopOpacity={(
                spotlight.strength * (isDarkSpotTheme ? 0.16 : 0.22)
              ).toFixed(3)}
            />
            <stop
              offset="52%"
              stopColor={propAccentColor}
              stopOpacity={(spotlight.strength * 0.045).toFixed(3)}
            />
            <stop
              offset="100%"
              stopColor={propAccentColor}
              stopOpacity="0"
            />
          </radialGradient>
        </defs>
      )}
      <g transform={cameraTransform} opacity={stageOutroOpacity.toFixed(4)}>
        <g
          opacity={postPivotFade * peripheryDim}
          transform={`translate(${parallax.sky.toFixed(2)}, 0)`}
        >
          {renderPropsByLayer('sky')}
        </g>
        <g
          opacity={peripheryDim}
          transform={`translate(${parallax.sky.toFixed(2)}, 0)`}
        >
          {(script.atmosphere ?? []).map((item, idx) =>
            renderAtmosphereItem(item, idx)
          )}
        </g>

        <g
          opacity={postPivotFade * peripheryDim}
          transform={`translate(${parallax.far.toFixed(2)}, 0)`}
        >
          {renderPropsByLayer('far')}
          {renderActorsByLayer('far')}
        </g>

        {spotlight.strength > 0.005 && (
          <circle
            cx={spotlight.focusX.toFixed(1)}
            cy={spotlight.focusY.toFixed(1)}
            r="146"
            fill={`url(#${spotGradId})`}
            pointerEvents="none"
          />
        )}

        <g transform={`translate(${parallax.mid.toFixed(2)}, 0)`}>
          <TerrainRenderer
            terrain={renderTerrain}
            terrainSegments={blendedTerrainSegments}
            drawProgress={
              isSemantic
                ? compiledNow.openingTerrainProgress
                : Math.min(state.drawProgress, compiledNow.openingTerrainProgress)
            }
            phase={phase}
            stroke={palette.inkPrimary}
            secondaryStroke={palette.inkSecondary}
            accentStroke={isAfterPivot ? propAccentColor : palette.inkPrimary}
            strokeWidth={zoomStroke}
            solidHorizon={isSolidStyle}
          />

          <g opacity={postPivotFade}>
            {renderPropsByLayer('mid')}
            {renderActorsByLayer('mid')}
          </g>
        </g>

        <g
          opacity={postPivotFade}
          transform={`translate(${parallax.fore.toFixed(2)}, 0)`}
        >
          {renderActorsByLayer('fore')}
          {renderPropsByLayer('fore')}
        </g>

        {renderDebugBBoxOverlay()}
      </g>

      {frameMode === 'WINDOW_ARCH' && !hasBackdropSet && (
        <path
          d="M 122 362 L 122 246 A 148 114 0 0 1 418 246 L 418 362"
          fill="none"
          stroke={palette.surfaceSubtle}
          strokeWidth={1.15}
          strokeLinecap="round"
          opacity={(0.82 * state.drawProgress).toFixed(3)}
          pointerEvents="none"
        />
      )}
    </svg>
  );
};
