import React from 'react';
import { ArchetypeComponentProps } from '../../components/archetypes/types';
import { CloakedTraveler } from '../../kit/CloakedTraveler';
import { WaterSurface } from '../../kit/WorldStage';
import { CelestialBody } from '../../kit/Atmosphere';

/**
 * 09. LADDER_MOON_REFLECTION:
 * - Hồi I: Chiếc thang gỗ cao vút dựng chênh vênh giữa trời định với tới vầng trăng mờ xa tắp.
 * - Hồi II (pivotFrame): Kẻ Lữ Hành rời chiếc thang, ngồi xuống bên bờ hồ phẳng lặng.
 * - Hồi III: Dưới mặt nước hồ hiện lên bóng vầng trăng Đỏ Gạch ấm áp gần ngay trước mắt.
 */
export const LadderMoonReflectionScene: React.FC<ArchetypeComponentProps> = ({
  state,
  palette,
  strokeWidth,
}) => {
  // Vầng trăng xa mờ trên cao
  const skyMoonY = 105;
  // Nhân vật từ chân thang (x=145) bước sang bờ hồ (x=215) và ngồi xuống ở Hồi II
  const sitT = state.beat2SettleGlow;
  const charX = 148 + state.act1Progress * 42 + sitT * 18;

  const rippleWave = Math.sin(state.continuousPhase * 1.8) * 4;

  return (
    <svg
      viewBox="0 0 540 480"
      style={{ width: 600, height: 520, overflow: 'visible' }}
    >
      {/* Vầng trăng khuyết mờ xa trên cao */}
      <CelestialBody
        type="crescent"
        x={380}
        y={skyMoonY}
        radius={19}
        color={palette.inkSecondary}
        bgColor={palette.background}
        opacity={state.drawProgress * 0.55}
      />

      {/* Chiếc thang cao dựng nghiêng bên trái */}
      <g
        transform="translate(132, 348) rotate(8)"
        style={{ opacity: state.drawProgress * (1 - state.beat3LingeringWalk * 0.25) }}
      >
        <line
          x1={-12}
          y1={0}
          x2={-12}
          y2={-195}
          stroke={palette.inkPrimary}
          strokeWidth={strokeWidth - 0.3}
          strokeLinecap="round"
        />
        <line
          x1={12}
          y1={0}
          x2={12}
          y2={-195}
          stroke={palette.inkPrimary}
          strokeWidth={strokeWidth - 0.3}
          strokeLinecap="round"
        />
        {[0, 1, 2, 3, 4, 5].map((r) => (
          <line
            key={r}
            x1={-12}
            y1={-28 - r * 30}
            x2={12}
            y2={-28 - r * 30}
            stroke={palette.inkPrimary}
            strokeWidth={2.0}
          />
        ))}
      </g>

      {/* Bờ hồ bên trái */}
      <path
        d="M 55 348 L 238 348 L 250 360"
        fill="none"
        stroke={palette.inkPrimary}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={state.drawProgress}
      />

      {/* Mặt hồ bên phải & Ánh trăng Đỏ Gạch phản chiếu dưới lòng hồ ở Hồi II & III */}
      <WaterSurface
        y={360}
        startX={246}
        endX={490}
        phase={state.continuousPhase}
        amplitude={2.5}
        drawProgress={state.drawProgress}
        stroke={palette.inkPrimary}
        strokeWidth={strokeWidth - 0.4}
      >
        {state.beat2SettleGlow > 0.03 && (
          <g opacity={state.beat2SettleGlow}>
            <circle
              cx={375 + rippleWave * 0.6}
              cy={34}
              r={20}
              fill={palette.accent}
              opacity={0.85}
            />
            <line
              x1={348 - rippleWave}
              y1={28}
              x2={402 + rippleWave}
              y2={28}
              stroke={palette.background}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            <line
              x1={355 + rippleWave}
              y1={40}
              x2={395 - rippleWave}
              y2={40}
              stroke={palette.background}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
          </g>
        )}
      </WaterSurface>

      {/* Kẻ Lữ Hành ngồi bên mép hồ ngắm trăng dưới nước */}
      <CloakedTraveler
        x={charX}
        y={348}
        facing="right"
        pose={sitT > 0.45 ? 'sit_lean' : state.act1Progress < 0.95 ? 'walk' : 'look_up'}
        walkPhase={state.continuousPhase * 2.0}
        walkActivity={1 - state.beat1StopClear}
        color={palette.inkPrimary}
        strokeWidth={strokeWidth}
        opacity={state.drawProgress}
      />
    </svg>
  );
};
