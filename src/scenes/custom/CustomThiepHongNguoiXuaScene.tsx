import React from 'react';
import { interpolate, Easing } from 'remotion';
import { ArchetypeComponentProps } from '../../components/archetypes/types';
import { CloakedTraveler, TravelerPose } from '../../kit/CloakedTraveler';
import { FlatHorizon } from '../../kit/WorldStage';
import { RisingSteam } from '../../kit/Atmosphere';

function smoothStep(frame: number, start: number, end: number): number {
  return interpolate(frame, [start, Math.max(start + 1, end)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
}

export const CustomThiepHongNguoiXuaScene: React.FC<ArchetypeComponentProps> = ({
  state,
  palette,
  strokeWidth,
  frame,
  fps,
  timeline,
}) => {
  const pivot = timeline.pivotFrame;
  const groundY = 350;
  const sw = strokeWidth * 0.65;
  const t = frame / fps;

  // 1. Kẻ Lữ Hành
  const hopApproach = smoothStep(frame, Math.round(4.2 * fps), Math.round(5.8 * fps));
  const heroX = interpolate(hopApproach, [0, 1], [326, 312]);
  const heroWalkAct = Math.sin(hopApproach * Math.PI) * 0.65;
  const sitP = smoothStep(frame, pivot + Math.round(3.3 * fps), pivot + Math.round(5.2 * fps));
  const heroFacing: 'left' | 'right' = frame > pivot + Math.round(3.6 * fps) ? 'right' : 'left';

  const holdCardP =
    smoothStep(frame, Math.round(3.6 * fps), Math.round(4.5 * fps)) *
    (1 - smoothStep(frame, pivot + Math.round(3.1 * fps), pivot + Math.round(3.8 * fps)));

  const heroPose: TravelerPose =
    sitP > 0.5 ? 'sit_lean' : holdCardP > 0.45 ? 'reach_out' : heroWalkAct > 0.1 ? 'walk' : 'stand';
  const heroLean =
    hopApproach * 4.5 * (1 - smoothStep(frame, pivot, pivot + Math.round(0.8 * fps))) - sitP * 4;

  // 2. Người xưa
  const exEnter = smoothStep(frame, Math.round(0.9 * fps), Math.round(3.9 * fps));
  const exRetreat = smoothStep(frame, pivot + Math.round(0.4 * fps), pivot + Math.round(2.4 * fps));
  const coupleDepart = smoothStep(frame, pivot + Math.round(2.4 * fps), pivot + Math.round(6.8 * fps));

  const exX =
    frame < pivot + Math.round(0.4 * fps)
      ? interpolate(exEnter, [0, 1], [194, 260])
      : frame < pivot + Math.round(2.4 * fps)
      ? interpolate(exRetreat, [0, 1], [260, 206])
      : interpolate(coupleDepart, [0, 1], [206, 158]);

  const exWalkAct = Math.max(
    Math.sin(exEnter * Math.PI),
    Math.sin(exRetreat * Math.PI),
    Math.sin(coupleDepart * Math.PI) * 0.85
  );
  const exFacing: 'left' | 'right' = frame >= pivot + Math.round(0.4 * fps) ? 'left' : 'right';
  const isGiving = frame >= Math.round(3.4 * fps) && frame < pivot + Math.round(0.35 * fps);
  const exPose: TravelerPose = isGiving ? 'give' : exWalkAct > 0.08 ? 'walk' : 'stand';
  const exOpacity =
    smoothStep(frame, Math.round(0.5 * fps), Math.round(1.5 * fps)) *
    interpolate(coupleDepart, [0, 1], [0.94, 0.34]);

  // 3. Chú rể
  const groomAppear = smoothStep(frame, pivot + Math.round(0.65 * fps), pivot + Math.round(2.35 * fps));
  const groomX =
    frame < pivot + Math.round(2.4 * fps)
      ? interpolate(groomAppear, [0, 1], [154, 184])
      : interpolate(coupleDepart, [0, 1], [184, 136]);
  const groomWalkAct = Math.max(
    Math.sin(groomAppear * Math.PI),
    Math.sin(coupleDepart * Math.PI) * 0.85
  );
  const groomFacing: 'left' | 'right' = frame >= pivot + Math.round(2.3 * fps) ? 'left' : 'right';
  const groomOpacity = groomAppear * interpolate(coupleDepart, [0, 1], [0.9, 0.34]);

  // 4. Phong thư -> Thiệp Hồng Đỏ Gạch
  const cardAppear = smoothStep(frame, Math.round(3.2 * fps), Math.round(4.1 * fps));
  const cardPass = smoothStep(frame, Math.round(3.6 * fps), Math.round(5.1 * fps));
  const cardRedP = smoothStep(frame, pivot, pivot + Math.round(1.1 * fps));
  const cardX = interpolate(sitP, [0, 1], [interpolate(cardPass, [0, 1], [273, heroX - 13]), heroX - 19]);
  const cardY = interpolate(sitP, [0, 1], [-28 + Math.sin(t * 1.8) * (1 - sitP), -4.5]);
  const cardRot = interpolate(sitP, [0, 1], [-3, -10]);

  // 5. Tim mực tưởng bở & Khăn voan cô dâu
  const hopeIn = smoothStep(frame, Math.round(4.7 * fps), Math.round(6.4 * fps));
  const hopeBreak = smoothStep(frame, pivot, pivot + Math.round(1.6 * fps));
  const hopeOpacity = hopeIn * (1 - hopeBreak) * 0.82;

  const veilOpacity =
    smoothStep(frame, pivot + Math.round(1.0 * fps), pivot + Math.round(2.3 * fps)) *
    interpolate(coupleDepart, [0, 1], [0.9, 0.34]);
  const breezeWave = Math.sin(t * 2.3) * 2.8;
  const ringP = smoothStep(frame, pivot + Math.round(0.08 * fps), pivot + Math.round(1.9 * fps));
  const teaSteamOp = smoothStep(frame, pivot + Math.round(4.8 * fps), pivot + Math.round(6.0 * fps));

  return (
    <svg viewBox="95 215 350 165" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      {/* Gió se lạnh tháng mười một */}
      {[0, 1, 2].map((i) => {
        const c = (t * 0.22 + i * 0.33) % 1;
        const wx = interpolate(c, [0, 1], [410, 130]);
        const wy = 246 + i * 22 + Math.sin(c * Math.PI * 2 + i) * 3.5;
        return (
          <path
            key={i}
            d={`M ${wx} ${wy} Q ${wx - 22} ${wy - 4} ${wx - 44} ${wy + 1}`}
            fill="none"
            stroke={palette.inkSecondary}
            strokeWidth={sw * 0.55}
            strokeLinecap="round"
            opacity={Math.sin(c * Math.PI) * 0.34}
          />
        );
      })}

      <FlatHorizon
        y={groundY}
        startX={112}
        endX={428}
        drawProgress={state.drawProgress}
        stroke={palette.inkPrimary}
        strokeWidth={sw}
      >
        {groomOpacity > 0.01 && (
          <CloakedTraveler
            x={groomX}
            y={0}
            scale={1.15}
            facing={groomFacing}
            pose={groomWalkAct > 0.08 ? 'walk' : 'stand'}
            walkPhase={t * 4.2 + 1.1}
            walkActivity={groomWalkAct}
            color={palette.inkPrimary}
            accentColor={palette.accent}
            strokeWidth={sw}
            opacity={groomOpacity}
          />
        )}

        {exOpacity > 0.01 && (
          <g>
            <CloakedTraveler
              x={exX}
              y={0}
              scale={1.05}
              facing={exFacing}
              pose={exPose}
              walkPhase={t * 4.2}
              walkActivity={exWalkAct}
              color={palette.inkPrimary}
              accentColor={palette.accent}
              strokeWidth={sw}
              opacity={exOpacity}
            />
            {veilOpacity > 0.01 && (
              <g transform={`translate(${exX}, 0)`} opacity={veilOpacity}>
                <path
                  d={`M 2 -43 Q ${17 + breezeWave} -41 ${30 + breezeWave * 1.3} -26`}
                  fill="none"
                  stroke={palette.inkSecondary}
                  strokeWidth={sw * 0.68}
                  strokeLinecap="round"
                />
                <path
                  d={`M 1 -39 Q ${14 + breezeWave * 0.8} -33 ${22 + breezeWave} -19`}
                  fill="none"
                  stroke={palette.inkSecondary}
                  strokeWidth={sw * 0.58}
                  strokeLinecap="round"
                />
              </g>
            )}
          </g>
        )}

        {veilOpacity > 0.02 && (
          <g
            transform={`translate(${(groomX + exX) / 2}, ${-66 + Math.sin(t * 2.4) * 2}) scale(0.7)`}
            opacity={veilOpacity * 0.95}
          >
            <path
              d="M 0 5 C -2 2 -8 -1 -8 -5 C -8 -8 -4 -10 0 -6 C 4 -10 8 -8 8 -5 C 8 -1 2 2 0 5 Z"
              fill={palette.accent}
            />
          </g>
        )}

        {hopeOpacity > 0.01 && (
          <g transform={`translate(286, ${-72 - hopeBreak * 14}) scale(1.12)`} opacity={hopeOpacity}>
            <path
              d="M 0 6 C -3 2 -9 -1 -9 -6 C -9 -10 -4 -11 0 -7"
              transform={`translate(${-hopeBreak * 6.5}, 0) rotate(${-hopeBreak * 15})`}
              fill="none"
              stroke={palette.inkSecondary}
              strokeWidth={sw * 0.72}
              strokeLinecap="round"
              strokeDasharray="24"
              strokeDashoffset={interpolate(hopeIn, [0, 1], [24, 2])}
            />
            <path
              d="M 0 -7 C 4 -11 9 -10 9 -6 C 9 -1 3 2 0 6"
              transform={`translate(${hopeBreak * 6.5}, 0) rotate(${hopeBreak * 15})`}
              fill="none"
              stroke={palette.inkSecondary}
              strokeWidth={sw * 0.72}
              strokeLinecap="round"
              strokeDasharray="24"
              strokeDashoffset={interpolate(hopeIn, [0, 1], [24, 2])}
            />
          </g>
        )}

        <CloakedTraveler
          x={heroX}
          y={0}
          scale={1.1}
          facing={heroFacing}
          pose={heroPose}
          walkPhase={t * 3.8}
          walkActivity={heroWalkAct}
          leanDeg={heroLean}
          sitProgress={sitP}
          color={palette.inkPrimary}
          accentColor={palette.accent}
          strokeWidth={sw}
          showTeaCup={sitP > 0.78}
        />

        {teaSteamOp > 0.02 && (
          <RisingSteam
            x={heroX + 13}
            y={-15}
            frame={frame}
            color={palette.accent}
            opacity={teaSteamOp * 0.75}
            height={20}
          />
        )}

        {ringP > 0.01 && ringP < 0.99 && (
          <circle
            cx={cardX}
            cy={cardY}
            r={7 + ringP * 20}
            fill="none"
            stroke={palette.accent}
            strokeWidth={sw * 0.55}
            opacity={(1 - ringP) * 0.55}
          />
        )}

        {cardAppear > 0.01 && (
          <g transform={`translate(${cardX}, ${cardY}) rotate(${cardRot})`} opacity={cardAppear}>
            <g opacity={1 - cardRedP * 0.95}>
              <rect
                x={-10}
                y={-6.5}
                width={20}
                height={13}
                rx={2}
                fill={palette.background}
                stroke={palette.inkPrimary}
                strokeWidth={sw * 0.78}
              />
              <path
                d="M -8.8 -5.3 L 0 1.2 L 8.8 -5.3"
                fill="none"
                stroke={palette.inkPrimary}
                strokeWidth={sw * 0.65}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            {cardRedP > 0.01 && (
              <g opacity={cardRedP}>
                <rect x={-10.5} y={-6.8} width={21} height={13.6} rx={2.2} fill={palette.accent} />
                <path
                  d="M -9 -5.5 L 0 1.3 L 9 -5.5"
                  fill="none"
                  stroke={palette.background}
                  strokeWidth={sw * 0.65}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            )}
          </g>
        )}
      </FlatHorizon>
    </svg>
  );
};

export default CustomThiepHongNguoiXuaScene;
