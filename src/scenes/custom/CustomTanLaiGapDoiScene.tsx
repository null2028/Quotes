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

export const CustomTanLaiGapDoiScene: React.FC<ArchetypeComponentProps> = ({
  state,
  palette,
  strokeWidth,
  frame,
  fps,
  timeline,
}) => {
  const t = frame / fps;
  const pivot = timeline.pivotFrame;
  const pivotSec = pivot / fps;
  const loopFade = 1 - state.seamlessLoopBlend;
  const cinnabar = palette.accentProp || palette.accent;
  const groundY = 348;

  // 1. Nét cọ mặt đất mềm mại, gọn và vuốt nhọn 2 đầu
  const lineDraw = interpolate(frame, [0, Math.round(1.05 * fps)], [0.001, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  }) * loopFade + 0.001 * (1 - loopFade);
  const mainGroundD = 'M 164 349.4 C 214 347.1 324 347.3 376 349.2';
  const washGroundD = 'M 200 351.4 Q 270 349.9 340 351.3';
  const mainEvo = evolvePath(Math.max(0.001, lineDraw), mainGroundD);
  const washEvo = evolvePath(Math.max(0.001, lineDraw), washGroundD);

  // 2. Nhịp xuất hiện từ tốn sau khi nét cọ chạy xong
  const heroFade = smooth(frame, Math.round(0.95 * fps), Math.round(1.95 * fps)) * loopFade;
  const flowerFade = smooth(frame, Math.round(1.15 * fps), Math.round(2.05 * fps)) * loopFade;
  const belovedFade = smooth(frame, Math.round(1.45 * fps), Math.round(2.45 * fps)) * loopFade;

  // 3. Diễn xuất Hồi 1 -> Hồi 2 -> Hồi 3 (bước lại gần & đung đưa trò chuyện, không đứng đơ)
  const line3Start = timeline.segmentTimings[2]?.startFrame ?? Math.round(4.1 * fps);
  const aloofP =
    smooth(frame, line3Start - Math.round(0.15 * fps), line3Start + Math.round(0.75 * fps)) *
    (1 - smooth(frame, pivot - Math.round(0.32 * fps), pivot - Math.round(0.04 * fps)));

  const stepCloserP = smooth(
    frame,
    pivot + Math.round(0.45 * fps),
    pivot + Math.round(2.45 * fps)
  );
  const coupleChatEnv = smooth(
    frame,
    pivot + Math.round(2.1 * fps),
    pivot + Math.round(3.1 * fps)
  );

  const heroScale = 1.28;
  const belovedScale = 1.22;

  const heroX = interpolate(stepCloserP, [0, 1], [224, 236]);
  const heroWalkAct = Math.sin(stepCloserP * Math.PI) * 0.55;
  const chatSway = Math.sin(Math.max(0, t - pivotSec) * 1.65) * 2.1 * coupleChatEnv;

  const heroPrePull =
    smooth(frame, line3Start, line3Start + Math.round(0.75 * fps)) *
    (1 - smooth(frame, pivot - Math.round(0.15 * fps), pivot + Math.round(0.25 * fps)));
  const heroPostWarm = smooth(frame, pivot, pivot + Math.round(0.6 * fps));
  const heroLean = 2.2 - heroPrePull * 1.6 + heroPostWarm * 1.4 + chatSway * 0.85;

  const belovedAloofStep = smooth(
    frame,
    line3Start - Math.round(0.1 * fps),
    line3Start + Math.round(0.85 * fps)
  );
  const belovedPreX = interpolate(belovedAloofStep, [0, 1], [306, 313]);
  const belovedX = interpolate(stepCloserP, [0, 1], [belovedPreX, 286]);
  const belovedWalkAct = Math.max(
    Math.sin(belovedAloofStep * Math.PI) * 0.35 * (1 - stepCloserP),
    Math.sin(stepCloserP * Math.PI) * 0.78
  );

  const belovedTurned = frame >= pivot + Math.round(0.2 * fps);
  const belovedFacing: 'left' | 'right' = belovedTurned ? 'left' : 'right';
  const reachP = smooth(
    frame,
    pivot + Math.round(0.25 * fps),
    pivot + Math.round(1.15 * fps)
  );
  const belovedLean = belovedTurned
    ? interpolate(reachP, [0, 1], [0.4, 2.8]) - chatSway * 0.95
    : 1.4 + aloofP * 3.2;

  // 4. Tính chính xác tọa độ bàn tay của Anh để bông hoa / bó hoa bám khít 100%
  const heroRad = (heroLean * Math.PI) / 180;
  const localHandX = 17.5 * Math.cos(heroRad) + 12.8 * Math.sin(heroRad);
  const localHandY = -11 + 17.5 * Math.sin(heroRad) - 12.8 * Math.cos(heroRad);
  const handX = heroX + localHandX * heroScale;
  const handY = groundY + localHandY * heroScale;

  // 5. Biến hình 1 bông hồng Đỏ Chu Sa -> Bó hoa Đỏ Chu Sa lớn
  const bloomP = smooth(frame, pivot, pivot + Math.round(0.52 * fps));
  const pulseP = smooth(frame, pivot, pivot + Math.round(1.35 * fps));
  const stemSway = Math.sin(t * 2.1) * 3.2 * (1 - bloomP * 0.45) + chatSway * 0.9;
  const ribbonFlutter = Math.sin(t * 3.1) * 6.5;

  // 6. Trái tim Đỏ Chu Sa bay lên thật chậm rãi (~5.8s cho 38px) + 1 tim nhỏ nối nhịp Hồi 3
  const heart1P = interpolate(
    frame,
    [pivot + Math.round(0.85 * fps), pivot + Math.round(6.65 * fps)],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.sin) }
  );
  const heart1Op =
    interpolate(heart1P, [0, 0.14, 0.76, 1], [0, 0.94, 0.82, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }) * loopFade;
  const heart1X = (heroX + belovedX) * 0.5 + 2 + Math.sin(heart1P * Math.PI * 1.6) * 5.5;
  const heart1Y = groundY - 64 - heart1P * 38;
  const heart1Rot = Math.sin(heart1P * Math.PI * 1.4) * 6;
  const heart1Scale = interpolate(heart1P, [0, 0.25, 1], [0.72, 1.04, 0.96]);

  const heart2P = interpolate(
    frame,
    [pivot + Math.round(2.65 * fps), pivot + Math.round(7.6 * fps)],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.sin) }
  );
  const heart2Op =
    interpolate(heart2P, [0, 0.18, 0.75, 1], [0, 0.72, 0.58, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }) * loopFade;
  const heart2X = (heroX + belovedX) * 0.5 - 5 - Math.sin(heart2P * Math.PI * 1.5) * 4.5;
  const heart2Y = groundY - 58 - heart2P * 32;

  return (
    <svg
      width={552}
      height={498}
      viewBox='62 126 416 250'
      style={{ overflow: 'visible', background: 'transparent' }}
    >
      <defs>
        <linearGradient
          id='tan-lai-brush-grad'
          gradientUnits='userSpaceOnUse'
          x1='164'
          y1='348'
          x2='376'
          y2='348'
        >
          <stop offset='0%' stopColor={palette.inkPrimary} stopOpacity='0' />
          <stop offset='20%' stopColor={palette.inkPrimary} stopOpacity='0.52' />
          <stop offset='50%' stopColor={palette.inkPrimary} stopOpacity='0.82' />
          <stop offset='80%' stopColor={palette.inkPrimary} stopOpacity='0.52' />
          <stop offset='100%' stopColor={palette.inkPrimary} stopOpacity='0' />
        </linearGradient>
      </defs>

      {/* Đường cọ mặt đất mềm mại */}
      <path
        d={mainGroundD}
        fill='none'
        stroke='url(#tan-lai-brush-grad)'
        strokeWidth={1.35}
        strokeLinecap='round'
        strokeDasharray={mainEvo.strokeDasharray}
        strokeDashoffset={mainEvo.strokeDashoffset}
      />
      <path
        d={washGroundD}
        fill='none'
        stroke={palette.inkSecondary}
        strokeWidth={0.75}
        strokeLinecap='round'
        opacity={0.24 * lineDraw}
        strokeDasharray={washEvo.strokeDasharray}
        strokeDashoffset={washEvo.strokeDashoffset}
      />

      {/* Nhân vật Anh */}
      {heroFade > 0.01 && (
        <CloakedTraveler
          x={heroX}
          y={groundY}
          scale={heroScale}
          facing='right'
          pose={heroWalkAct > 0.12 ? 'walk' : 'give'}
          poseWeights={{ lookUp: 0, reachOut: 0, give: 1, holdUp: 0, push: 0 }}
          leanDeg={heroLean}
          walkPhase={t * 4.4}
          walkActivity={heroWalkAct}
          breathPhase={t * 1.9}
          color={palette.inkPrimary}
          accentColor={cinnabar}
          bgColor={palette.background}
          solidFill={true}
          strokeWidth={strokeWidth}
          opacity={heroFade}
        />
      )}

      {/* Nhân vật Em */}
      {belovedFade > 0.01 && (
        <CloakedTraveler
          x={belovedX}
          y={groundY}
          scale={belovedScale}
          facing={belovedFacing}
          pose={belovedWalkAct > 0.14 ? 'walk' : reachP > 0.3 ? 'reach_out' : 'stand'}
          poseWeights={{
            lookUp: coupleChatEnv * 0.25,
            reachOut: reachP,
            give: 0,
            holdUp: 0,
            push: 0,
          }}
          leanDeg={belovedLean}
          walkPhase={t * 4.6 + 0.8}
          walkActivity={belovedWalkAct}
          breathPhase={t * 1.9 + 1.2}
          color={palette.inkPrimary}
          accentColor={cinnabar}
          bgColor={palette.background}
          solidFill={true}
          strokeWidth={strokeWidth}
          opacity={belovedFade}
        />
      )}

      {/* Vòng sóng điểm nhấn tại Pivot */}
      {pulseP > 0.01 && pulseP < 0.99 && (
        <circle
          cx={handX + 12}
          cy={handY - 12}
          r={6 + pulseP * 22}
          fill='none'
          stroke={cinnabar}
          strokeWidth={1.05}
          opacity={(1 - pulseP) * 0.52 * loopFade}
        />
      )}

      {/* 1 Bông Hoa Đỏ Chu Sa (Hồi 1) -> Bó Hoa Đỏ Chu Sa Lớn (Hồi 2 & 3) */}
      {flowerFade > 0.01 && (
        <g
          transform={`translate(${handX.toFixed(2)}, ${handY.toFixed(2)}) rotate(${stemSway.toFixed(2)})`}
          opacity={flowerFade}
        >
          {/* Hồi 1: 1 nhành hồng Đỏ Chu Sa mảnh mai */}
          {bloomP < 0.99 && (
            <g opacity={1 - bloomP}>
              <path
                d='M -1.5 3.5 Q 4.2 -4.8 10.5 -13.2 M 4.5 -4.8 Q 9.2 -6.2 10.2 -3.4 Q 6.8 -2.2 4.5 -4.8'
                fill='none'
                stroke={palette.inkPrimary}
                strokeWidth={1.25}
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <circle cx={12.0} cy={-15.6} r={3.9} fill={cinnabar} />
              <path
                d='M 10.4 -15.8 Q 12.0 -14.0 13.6 -15.8'
                fill='none'
                stroke={palette.background}
                strokeWidth={0.78}
                strokeLinecap='round'
              />
            </g>
          )}

          {/* Hồi 2 & 3: Bó hoa lớn gói giấy mực than + 6 bông Đỏ Chu Sa + ruy-băng bay */}
          {bloomP > 0.01 && (
            <g
              opacity={bloomP}
              transform={`scale(${(0.76 + 0.24 * bloomP).toFixed(3)})`}
            >
              <path
                d='M -4.5 5.8 L -1.2 7.2 L 1.5 1.4 L -1.4 0 Z'
                fill={palette.inkPrimary}
              />
              <path
                d='M -1.0 1.0 L 3.4 -15.2 Q 11.8 -13.4 18.2 -4.2 L 1.4 2.0 Z'
                fill={palette.inkPrimary}
              />
              <path
                d='M 0.6 0.2 L 10.4 -9.0'
                fill='none'
                stroke={palette.background}
                strokeWidth={0.78}
                strokeLinecap='round'
                opacity={0.75}
              />
              <g transform={`rotate(${ribbonFlutter.toFixed(2)}, 0.6, 1.4)`}>
                <path
                  d='M 0.3 1.4 C -1.8 5.8 -0.8 9.8 1.2 12.6 M 1.0 1.4 C 2.6 5.4 4.8 8.4 6.6 10.6'
                  fill='none'
                  stroke={cinnabar}
                  strokeWidth={1.05}
                  strokeLinecap='round'
                />
              </g>
              <circle cx={6.8} cy={-16.8} r={4.6} fill={cinnabar} />
              <circle cx={12.8} cy={-17.6} r={5.1} fill={cinnabar} />
              <circle cx={11.2} cy={-11.8} r={4.9} fill={cinnabar} />
              <circle cx={17.6} cy={-12.6} r={4.7} fill={cinnabar} />
              <circle cx={16.2} cy={-6.8} r={4.2} fill={cinnabar} />
              <circle cx={6.2} cy={-11.2} r={4.1} fill={cinnabar} />
              <path
                d='M 10.6 -17.6 Q 12.8 -15.4 15.0 -17.6 M 9.2 -11.8 Q 11.2 -9.6 13.2 -11.8 M 15.6 -12.6 Q 17.6 -10.5 19.6 -12.6'
                fill='none'
                stroke={palette.background}
                strokeWidth={0.82}
                strokeLinecap='round'
              />
            </g>
          )}
        </g>
      )}

      {/* Trái tim chính bay bồng bềnh thật chậm */}
      {heart1Op > 0.01 && (
        <g
          transform={`translate(${heart1X.toFixed(2)}, ${heart1Y.toFixed(2)}) rotate(${heart1Rot.toFixed(2)}) scale(${heart1Scale.toFixed(3)})`}
          opacity={heart1Op}
        >
          <path
            d='M 0 6.6 C -3.2 3.6 -7.2 1.0 -7.2 -2.5 C -7.2 -6.0 -2.4 -6.8 0 -2.6 C 2.4 -6.8 7.2 -6.0 7.2 -2.5 C 7.2 1.0 3.2 3.6 0 6.6 Z'
            fill={cinnabar}
            fillOpacity={0.26}
            stroke={cinnabar}
            strokeWidth={1.22}
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </g>
      )}

      {/* Trái tim nhỏ thứ hai nối nhịp dịu dàng ở Hồi 3 */}
      {heart2Op > 0.01 && (
        <g
          transform={`translate(${heart2X.toFixed(2)}, ${heart2Y.toFixed(2)}) rotate(${(-heart1Rot * 0.8).toFixed(2)}) scale(0.62)`}
          opacity={heart2Op}
        >
          <path
            d='M 0 6.6 C -3.2 3.6 -7.2 1.0 -7.2 -2.5 C -7.2 -6.0 -2.4 -6.8 0 -2.6 C 2.4 -6.8 7.2 -6.0 7.2 -2.5 C 7.2 1.0 3.2 3.6 0 6.6 Z'
            fill={cinnabar}
            fillOpacity={0.22}
            stroke={cinnabar}
            strokeWidth={1.35}
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </g>
      )}
    </svg>
  );
};
