import React from 'react';
import { interpolateColors } from 'remotion';
import { EvaluatedMotionState } from '../engine/motionPhysics';
import { TimelineSyncResult } from '../engine/timelineSync';
import { LAYOUT_TOKENS, ThemePalette } from '../theme/palettes';
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
  normalizeTerrainConfig,
  resolveXCoord,
  STAGE_VIEWBOX,
  TerrainRenderer,
} from './terrainSystem';
import { evaluateEnterLeaveMultiplier } from './timeResolver';
import {
  EvaluatedActorState,
  EvaluatedPropState,
  evaluateStageScriptAtFrame,
  resolveRoleColor,
} from './trackCompiler';
import { StagePropRenderer } from './propCatalog';

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
}> = ({
  script,
  state,
  palette,
  strokeWidth,
  frame,
  timeline,
}) => {
  const compiledNow = evaluateStageScriptAtFrame(
    script,
    frame,
    timeline,
    palette
  );

  // Pha thu hồi Seamless Loop (13.5s -> 15.0s): khớp khít 100% về trạng thái 0.0s
  const loopBlend = state.seamlessLoopBlend ?? 0;
  const isLoopClosing = loopBlend > 0.002;
  const compiledZero = isLoopClosing
    ? evaluateStageScriptAtFrame(script, 0, timeline, palette)
    : null;

  const isPrePivot = frame < timeline.pivotFrame - 6;
  const isAfterPivot = !isPrePivot && loopBlend < 0.75;
  const phase = state.continuousPhase;
  const isSolidStyle = Boolean(script.tags?.includes('solid_style'));

  const effectiveTerrain =
    compiledZero && isLoopClosing
      ? normalizeTerrainConfig(
          script.terrain,
          lerpNum(
            compiledNow.terrain.bridgeProgress,
            compiledZero.terrain.bridgeProgress,
            loopBlend
          )
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
            opacity: lerpNum(curA.opacity, zeroA.opacity, loopBlend),
            color:
              curA.color === zeroA.color
                ? curA.color
                : interpolateColors(loopBlend, [0, 1], [curA.color, zeroA.color]),
            facing: loopBlend < 0.55 ? curA.facing : zeroA.facing,
            pose: loopBlend < 0.55 ? curA.pose : zeroA.pose,
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
        ? 0.48
        : item.focusRole === 'support'
          ? 0.52
          : 0.95;
    const rawItemOpacity =
      (item.opacity ?? 1) * enterLeave * state.drawProgress;
    const itemOpacity =
      item.focusRole === 'ambient' || item.focusRole === 'support'
        ? Math.min(focusCap, rawItemOpacity)
        : rawItemOpacity * 0.95;
    if (itemOpacity <= 0.01) return null;

    const baseRole =
      item.colorRole ??
      (item.type === 'sun' ||
      item.type === 'hollow_sun' ||
      item.type === 'crescent' ||
      item.type === 'ring_pulse'
        ? 'accent'
        : 'secondary');
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
            accentColor={isAfterPivot ? palette.accent : palette.inkSecondary}
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
    const effStroke = strokeWidth * focusStrokeMult;
    const dissolveMult = Math.max(0, 1 - actor.dissolveToCloud * 1.25);
    const rawActorOpacity = actor.opacity * dissolveMult;
    const effOpacity =
      actor.focusRole === 'ambient'
        ? Math.min(0.24, rawActorOpacity)
        : actor.focusRole === 'support' || isFar
          ? Math.min(0.38, rawActorOpacity)
          : isSolidStyle
            ? Math.min(1, rawActorOpacity)
            : rawActorOpacity * 0.95;

    const cloudP = actor.dissolveCloudProgress;
    const cloudOpacity =
      cloudP > 0.01 && cloudP < 0.995
        ? Math.sin(cloudP * Math.PI) * 0.72 * (1 - loopBlend)
        : 0;

    return (
      <g key={`actor-${key}`} opacity={state.drawProgress}>
        {effOpacity > 0.01 && actor.dissolveToCloud < 0.8 && (
          <CloakedTraveler
            x={actor.x}
            y={actor.y}
            scale={actor.scale}
            facing={actor.facing}
            pose={actor.pose}
            leanDeg={actor.leanDeg}
            sitProgress={actor.sitProgress}
            walkPhase={actor.walkPhase}
            walkActivity={actor.walkActivity}
            breathPhase={actor.breathPhase}
            color={actor.color}
            accentColor={isAfterPivot ? palette.accent : palette.inkPrimary}
            bgColor={palette.background}
            showTeaCup={actor.showTeaCup}
            solidFill={isSolidStyle}
            strokeWidth={effStroke}
            opacity={effOpacity}
          />
        )}

        {cloudOpacity > 0.01 && (
          <g
            transform={`translate(${(actor.x + Math.sin(cloudP * Math.PI * 1.4) * 12).toFixed(1)}, ${(actor.groundY - 26 - cloudP * 74).toFixed(1)}) scale(${(0.88 + cloudP * 0.28).toFixed(2)})`}
            opacity={cloudOpacity}
          >
            <path
              d="M -18 2 C -13 -5 -5 -5 0 -1 C 5 -6 14 -5 19 1"
              fill="none"
              stroke={palette.inkSecondary}
              strokeWidth={strokeWidth * 0.65}
              strokeLinecap="round"
            />
            <path
              d="M -11 6 C -5 2 4 2 12 5"
              fill="none"
              stroke={palette.inkSecondary}
              strokeWidth={strokeWidth * 0.55}
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
          strokeWidth={strokeWidth}
          frame={frame}
          isAfterPivot={isAfterPivot}
          customPropsMap={script.customPropsResolved}
        />
      ));

  const renderActorsByLayer = (layer: StageLayer) =>
    blendedActors
      .filter((entry) => entry.actor.layer === layer)
      .map(({ key, actor }) => renderActorNode(key, actor));

  const cameraTransform = `translate(270, 315) scale(${cam.zoom.toFixed(3)}) translate(${(-270 - cam.panX).toFixed(2)}, ${(-315 - cam.panY).toFixed(2)})`;

  return (
    <svg
      width={LAYOUT_TOKENS.swissGrid.stageWidth}
      height={LAYOUT_TOKENS.swissGrid.stageHeight}
      viewBox={STAGE_VIEWBOX}
      style={{ overflow: 'visible' }}
    >
      <g transform={cameraTransform}>
        <g opacity={state.drawProgress}>{renderPropsByLayer('sky')}</g>
        {(script.atmosphere ?? []).map((item, idx) =>
          renderAtmosphereItem(item, idx)
        )}

        <g opacity={state.drawProgress}>
          {renderPropsByLayer('far')}
          {renderActorsByLayer('far')}
        </g>

        <TerrainRenderer
          terrain={effectiveTerrain}
          drawProgress={state.drawProgress}
          phase={phase}
          stroke={palette.inkPrimary}
          secondaryStroke={palette.inkSecondary}
          accentStroke={isAfterPivot ? palette.accent : palette.inkPrimary}
          strokeWidth={strokeWidth}
          solidHorizon={isSolidStyle}
        />

        <g opacity={state.drawProgress}>
          {renderPropsByLayer('mid')}
          {renderActorsByLayer('mid')}
        </g>

        <g opacity={state.drawProgress}>
          {renderActorsByLayer('fore')}
          {renderPropsByLayer('fore')}
        </g>
      </g>
    </svg>
  );
};
