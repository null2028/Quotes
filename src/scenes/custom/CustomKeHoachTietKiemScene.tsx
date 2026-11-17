import React from 'react';
import { interpolate, Easing } from 'remotion';
import { evolvePath } from '@remotion/paths';
import type { ArchetypeComponentProps } from '../../components/archetypes/types';
import { CloakedTraveler } from '../../kit/CloakedTraveler';

function smooth(frame: number, start: number, end: number): number {
  return interpolate(frame, [start, Math.max(start + 1, end)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
}

export const CustomKeHoachTietKiemScene: React.FC<ArchetypeComponentProps> = ({
  state,
  palette,
  strokeWidth,
  frame,
  fps,
  timeline,
}) => {
  const t = frame / fps;
  const pivot = timeline.pivotFrame;
  const loopFade = 1 - state.seamlessLoopBlend;
  const cinnabar = palette.accentProp || palette.accent;
  const groundY = 348;

  const lineDraw = interpolate(frame, [0, Math.round(1.05 * fps)], [0.001, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  }) * loopFade + 0.001 * (1 - loopFade);
  const groundD = 'M 164 349.4 C 214 347.1 324 347.3 376 349.2';
  const groundEvo = evolvePath(Math.max(0.001, lineDraw), groundD);

  const heroFade = smooth(frame, Math.round(0.98 * fps), Math.round(2.0 * fps)) * loopFade;
  const otherStart = timeline.segmentTimings[2]?.startFrame ?? Math.round(4.0 * fps);
  const otherFade = smooth(frame, otherStart, otherStart + Math.round(0.9 * fps)) * loopFade;

  const bloom = smooth(frame, pivot, pivot + Math.round(0.62 * fps));
  const jarOpacity = (1 - bloom) * heroFade;
  const bouquetOpacity = bloom * heroFade;

  const approach = smooth(frame, pivot + Math.round(0.35 * fps), pivot + Math.round(2.5 * fps));
  const heroScale = 1.28;
  const otherScale = 1.24;
  const heroX = interpolate(approach, [0, 1], [216, 294]);
  const otherX = interpolate(approach, [0, 1], [366, 330]);
  const heroWalk = Math.sin(approach * Math.PI) * 0.72;
  const otherWalk = Math.sin(approach * Math.PI) * 0.62;
  const chat = smooth(frame, pivot + Math.round(2.0 * fps), pivot + Math.round(3.0 * fps));
  const sway = Math.sin(Math.max(0, t - pivot / fps) * 1.65) * 2.0 * chat;
  const heroLean = 1.2 + bloom * 1.4 + sway;
  const otherLean = 1.0 + chat * 1.5 - sway * 0.7;

  const jarX = 252;
  const jarY = groundY - 2;
  const coinA = smooth(frame, Math.round(2.0 * fps), Math.round(2.65 * fps));
  const coinB = smooth(frame, Math.round(2.85 * fps), Math.round(3.5 * fps));
  const coinC = smooth(frame, Math.round(3.65 * fps), Math.round(4.3 * fps));
  const coinDrop = (p: number, delay: number) => ({
    y: interpolate(p, [0, 1], [jarY - 48 - delay, jarY - 13]),
    opacity: (1 - smooth(frame, Math.round((4.15 + delay / 100) * fps), Math.round((4.4 + delay / 100) * fps))) * heroFade,
  });

  const heroRad = (heroLean * Math.PI) / 180;
  const localHandX = 17.5 * Math.cos(heroRad) + 12.8 * Math.sin(heroRad);
  const localHandY = -11 + 17.5 * Math.sin(heroRad) - 12.8 * Math.cos(heroRad);
  const handX = heroX + localHandX * heroScale;
  const handY = groundY + localHandY * heroScale;

  const bouquetSway = Math.sin(t * 2.0) * 2.6 + sway;
  const ribbonSway = Math.sin(t * 2.7) * 4.2;
  const lastCoinRoll = smooth(frame, pivot + Math.round(0.45 * fps), pivot + Math.round(1.25 * fps));
  const lastCoinX = interpolate(lastCoinRoll, [0, 1], [jarX + 4, jarX + 31]);
  const lastCoinRot = lastCoinRoll * 190;

  return (
    <svg
      width={552}
      height={498}
      viewBox='62 126 416 250'
      style={{ overflow: 'visible', background: 'transparent' }}
    >
      <defs>
        <linearGradient id='saving-ground-brush' gradientUnits='userSpaceOnUse' x1='164' y1='348' x2='376' y2='348'>
          <stop offset='0%' stopColor={palette.inkPrimary} stopOpacity='0' />
          <stop offset='20%' stopColor={palette.inkPrimary} stopOpacity='0.5' />
          <stop offset='50%' stopColor={palette.inkPrimary} stopOpacity='0.8' />
          <stop offset='80%' stopColor={palette.inkPrimary} stopOpacity='0.5' />
          <stop offset='100%' stopColor={palette.inkPrimary} stopOpacity='0' />
        </linearGradient>
      </defs>

      <path
        d={groundD}
        fill='none'
        stroke='url(#saving-ground-brush)'
        strokeWidth={1.35}
        strokeLinecap='round'
        strokeDasharray={groundEvo.strokeDasharray}
        strokeDashoffset={groundEvo.strokeDashoffset}
      />

      {heroFade > 0.01 && (
        <CloakedTraveler
          x={heroX}
          y={groundY}
          scale={heroScale}
          facing='right'
          pose={heroWalk > 0.12 ? 'walk' : bloom > 0.5 ? 'give' : 'stand'}
          poseWeights={{ lookUp: 0, reachOut: bloom, give: bloom, holdUp: 0, push: 0 }}
          leanDeg={heroLean}
          walkPhase={t * 4.4}
          walkActivity={heroWalk}
          breathPhase={t * 1.9}
          color={palette.inkPrimary}
          accentColor={cinnabar}
          bgColor={palette.background}
          solidFill={true}
          strokeWidth={strokeWidth}
          opacity={heroFade}
        />
      )}

      {otherFade > 0.01 && (
        <CloakedTraveler
          x={otherX}
          y={groundY}
          scale={otherScale}
          facing='left'
          pose={otherWalk > 0.12 ? 'walk' : chat > 0.2 ? 'reach_out' : 'stand'}
          poseWeights={{ lookUp: chat * 0.2, reachOut: chat * 0.55, give: 0, holdUp: 0, push: 0 }}
          leanDeg={otherLean}
          walkPhase={t * 4.2 + 0.7}
          walkActivity={otherWalk}
          breathPhase={t * 1.8 + 1.1}
          color={palette.inkPrimary}
          accentColor={cinnabar}
          bgColor={palette.background}
          solidFill={true}
          strokeWidth={strokeWidth}
          opacity={otherFade}
        />
      )}

      {jarOpacity > 0.01 && (
        <g transform={`translate(${jarX}, ${jarY})`} opacity={jarOpacity}>
          <path d='M -12 -26 L 12 -26 L 10 -5 Q 9 2 0 3 Q -9 2 -10 -5 Z' fill={palette.surfaceSubtle} stroke={palette.inkPrimary} strokeWidth={1.25} />
          <path d='M -14 -29 L 14 -29 L 13 -25 L -13 -25 Z' fill={palette.background} stroke={palette.inkPrimary} strokeWidth={1.15} />
          <path d='M -8 -17 Q 0 -20 8 -17' fill='none' stroke={palette.inkSecondary} strokeWidth={0.8} />
          <path d='M -5 -10 Q 0 -12 5 -10' fill='none' stroke={palette.inkSecondary} strokeWidth={0.7} opacity={0.7} />
          <circle cx='0' cy='-34' r='2.4' fill={palette.inkPrimary} />
        </g>
      )}

      {jarOpacity > 0.01 && (
        <g>
          <circle cx={jarX - 3} cy={coinDrop(coinA, 0).y} r='2.7' fill={cinnabar} opacity={coinA * heroFade} />
          <circle cx={jarX + 4} cy={coinDrop(coinB, 10).y} r='2.5' fill={cinnabar} opacity={coinB * heroFade} />
          <circle cx={jarX - 1} cy={coinDrop(coinC, 20).y} r='2.4' fill={cinnabar} opacity={coinC * heroFade} />
        </g>
      )}

      {bouquetOpacity > 0.01 && (
        <g transform={`translate(${handX.toFixed(2)}, ${handY.toFixed(2)}) rotate(${bouquetSway.toFixed(2)})`} opacity={bouquetOpacity}>
          <path d='M -4 4 L 1 12 L 8 10 L 3 2 Z' fill={palette.inkPrimary} />
          <path d='M -1 2 Q 2 -7 8 -17 M 2 3 Q 10 -5 14 -16 M 4 4 Q 1 -4 -1 -13' fill='none' stroke={palette.inkPrimary} strokeWidth={1.15} strokeLinecap='round' />
          <path d='M 1 -4 Q -7 -9 -8 -2 Q -2 1 1 -4 M 7 -8 Q 14 -13 16 -6 Q 11 -3 7 -8' fill='none' stroke={palette.inkPrimary} strokeWidth={1.0} />
          <g transform={`rotate(${ribbonSway.toFixed(2)}, 2, 3)`}>
            <path d='M -1 2 Q -5 9 -2 14 M 2 3 Q 8 8 10 13' fill='none' stroke={cinnabar} strokeWidth={1.25} strokeLinecap='round' />
          </g>
          <circle cx='-3' cy='-17' r='4.2' fill={cinnabar} />
          <circle cx='4' cy='-21' r='4.6' fill={cinnabar} />
          <circle cx='11' cy='-16' r='4.2' fill={cinnabar} />
          <circle cx='2' cy='-12' r='4.1' fill={cinnabar} />
          <circle cx='9' cy='-10' r='3.8' fill={cinnabar} />
        </g>
      )}

      {bloom > 0.75 && (
        <g opacity={loopFade * 0.92}>
          <circle cx={lastCoinX} cy={groundY - 2} r='3.1' fill={cinnabar} transform={`rotate(${lastCoinRot.toFixed(1)}, ${lastCoinX}, ${groundY - 2})`} />
          <path d={`M ${jarX + 22} ${groundY - 1} Q ${jarX + 27} ${groundY - 5} ${jarX + 32} ${groundY - 1}`} fill='none' stroke={palette.inkSecondary} strokeWidth='0.7' opacity='0.5' />
        </g>
      )}
    </svg>
  );
};
