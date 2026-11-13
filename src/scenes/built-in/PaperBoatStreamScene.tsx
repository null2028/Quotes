import React from 'react';
import { ArchetypeComponentProps } from '../../components/archetypes/types';
import { CloakedTraveler } from '../../kit/CloakedTraveler';
import { WaterSurface } from '../../kit/WorldStage';
import { DistantBirds, CelestialBody } from '../../kit/Atmosphere';

/**
 * 07. PAPER_BOAT_STREAM:
 * - Hồi I: Kẻ Lữ Hành bước tới mép bờ sông, cúi thả chiếc thuyền giấy màu Đỏ Gạch xuống dòng nước.
 * - Hồi II (pivotFrame): Buông tay để chiếc thuyền giấy Đỏ Gạch bắt đầu trôi êm theo con sóng.
 * - Hồi III: Thuyền giấy trôi xa dần về phía chân trời rộng mở dưới vầng trăng và cánh chim.
 */
export const PaperBoatStreamScene: React.FC<ArchetypeComponentProps> = ({
  state,
  palette,
  strokeWidth,
}) => {
  const bankPath = 'M 45 348 L 168 348 L 182 362';
  const travelerX = 95 + state.act1Progress * 52;
  const isWalking = state.act1Progress < 0.96 && state.beat1StopClear < 0.3;

  // Thuyền giấy Đỏ Gạch: ở Hồi I nằm gần bờ (x=192), từ pivotFrame trôi xa dần tới x=445
  const driftProgress =
    state.beat2SettleGlow * 0.25 + state.beat3LingeringWalk * 0.75;
  const boatX = 192 + driftProgress * 248;
  const boatBobY =
    Math.sin(state.continuousPhase * 1.8 + driftProgress * 6) * 3.5;
  const boatTilt = Math.cos(state.continuousPhase * 1.6) * 4.5;
  const boatScale = 1 - driftProgress * 0.22;

  return (
    <svg
      viewBox="0 0 540 480"
      style={{ width: 600, height: 520, overflow: 'visible' }}
    >
      <CelestialBody
        type="hollow_sun"
        x={425}
        y={128 - state.beat3LingeringWalk * 12}
        radius={24}
        color={palette.accent}
        opacity={state.beat2SettleGlow}
      />
      <DistantBirds
        progress={state.beat3LingeringWalk}
        phase={state.continuousPhase}
        color={palette.inkPrimary}
        startX={280}
        startY={135}
        opacity={state.beat3LingeringWalk}
      />

      {/* Bờ đất bên trái */}
      <path
        d={bankPath}
        fill="none"
        stroke={palette.inkPrimary}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={state.drawProgress}
      />

      {/* Dòng nước gợn sóng bên phải */}
      <WaterSurface
        y={358}
        startX={176}
        endX={495}
        phase={state.continuousPhase}
        amplitude={4.2}
        drawProgress={state.drawProgress}
        stroke={palette.inkPrimary}
        strokeWidth={strokeWidth - 0.3}
      >
        {/* Chiếc thuyền giấy Origami màu Đỏ Gạch */}
        <g
          transform={`translate(${boatX.toFixed(1)}, ${(-3 + boatBobY).toFixed(1)}) rotate(${boatTilt.toFixed(1)}) scale(${boatScale.toFixed(2)})`}
          style={{ opacity: Math.max(0.45, state.drawProgress) }}
        >
          <polygon
            points="-22,0 22,0 13,9 -13,9"
            fill={palette.accent}
          />
          <polygon
            points="-10,-1 0,-18 10,-1"
            fill={palette.accent}
            opacity={0.9}
          />
        </g>
      </WaterSurface>

      {/* Kẻ Lữ Hành đứng bên bờ sông tiễn chiếc thuyền trôi xa */}
      <CloakedTraveler
        x={travelerX}
        y={348}
        facing="right"
        pose={isWalking ? 'walk' : state.beat2SettleGlow < 0.4 ? 'give' : 'stand'}
        walkPhase={state.continuousPhase * 2.0}
        walkActivity={isWalking ? 1 : 0}
        color={palette.inkPrimary}
        strokeWidth={strokeWidth}
        opacity={state.drawProgress}
      />
    </svg>
  );
};
