import React from 'react';
import { ArchetypeComponentProps } from '../../components/archetypes/types';
import { CloakedTraveler } from '../../kit/CloakedTraveler';
import { FlatHorizon } from '../../kit/WorldStage';

/**
 * 08. KITE_RELEASE_WIND:
 * - Hồi I: Kẻ Lữ Hành gồng mình giữ sợi dây diều căng cứng giữa gió ngược.
 * - Hồi II (pivotFrame): Buông tay thả sợi dây, cánh diều Đỏ Gạch vút lên êm ái.
 * - Hồi III: Cánh diều Đỏ Gạch bay bổng tự do trên bầu trời rộng mở với đuôi diều uốn lượn.
 */
export const KiteReleaseWindScene: React.FC<ArchetypeComponentProps> = ({
  state,
  palette,
  strokeWidth,
}) => {
  const travelerX = 155;
  const releaseT =
    state.beat2SettleGlow * 0.4 + state.beat3LingeringWalk * 0.6;

  // Tọa độ cánh diều Đỏ Gạch: giằng co ở Hồi I -> bay bổng cao xa ở Hồi II & III
  const struggleJitter =
    (1 - state.beat1StopClear) * Math.sin(state.continuousPhase * 2.6) * 8;
  const kiteX = 285 + releaseT * 135;
  const kiteY =
    215 + struggleJitter - state.beat2SettleGlow * 45 - state.beat3LingeringWalk * 65;
  const kiteTilt = 22 - releaseT * 12 + Math.sin(state.continuousPhase * 1.5) * 4;

  // Sợi dây: căng thẳng từ tay người ở Hồi I -> đứt rời bay lơ lửng theo đuôi diều ở Hồi II & III
  const handX = travelerX + 14;
  const handY = 350 - 40;
  const stringStartX =
    handX * (1 - state.beat2SettleGlow) + (kiteX - 42) * state.beat2SettleGlow;
  const stringStartY =
    handY * (1 - state.beat2SettleGlow) + (kiteY + 52) * state.beat2SettleGlow;

  const tailWave = Math.sin(state.continuousPhase * 2.4) * 9;

  return (
    <svg
      viewBox="0 0 540 480"
      style={{ width: 600, height: 520, overflow: 'visible' }}
    >
      {/* Vệt gió nhẹ ở Hồi I */}
      {state.beat1StopClear < 0.95 && (
        <g opacity={(1 - state.beat1StopClear) * 0.35}>
          {[0, 1, 2].map((i) => {
            const wx = 390 - (((state.frame * 2.2 + i * 90) % 280));
            const wy = 165 + i * 52;
            return (
              <line
                key={i}
                x1={wx}
                y1={wy}
                x2={wx + 42}
                y2={wy}
                stroke={palette.inkSecondary}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            );
          })}
        </g>
      )}

      {/* Sợi dây diều */}
      <path
        d={`M ${stringStartX.toFixed(1)} ${stringStartY.toFixed(1)} Q ${((stringStartX + kiteX) * 0.5).toFixed(1)} ${((stringStartY + kiteY) * 0.5 + 16 * state.beat2SettleGlow).toFixed(1)} ${kiteX.toFixed(1)} ${(kiteY + 18).toFixed(1)}`}
        fill="none"
        stroke={palette.inkSecondary}
        strokeWidth={1.6}
        strokeLinecap="round"
        opacity={state.drawProgress * (1 - state.beat3LingeringWalk * 0.35)}
      />

      {/* Cánh diều Đỏ Gạch (#CE472E) */}
      <g
        transform={`translate(${kiteX.toFixed(1)}, ${kiteY.toFixed(1)}) rotate(${kiteTilt.toFixed(1)})`}
        style={{ opacity: state.drawProgress }}
      >
        <polygon
          points="0,-24 17,0 0,24 -17,0"
          fill={palette.accent}
        />
        {/* Đuôi lụa của cánh diều */}
        <path
          d={`M 0 24 Q ${tailWave} 42 ${-tailWave * 0.7} 60`}
          fill="none"
          stroke={palette.accent}
          strokeWidth={2.0}
          strokeLinecap="round"
        />
      </g>

      {/* Mặt đất & Kẻ Lữ Hành ngước nhìn theo cánh diều */}
      <FlatHorizon
        y={350}
        drawProgress={state.drawProgress}
        stroke={palette.inkPrimary}
        strokeWidth={strokeWidth}
      >
        <CloakedTraveler
          x={travelerX}
          y={0}
          facing="right"
          pose={state.beat2SettleGlow < 0.3 ? 'hold_up' : 'look_up'}
          color={palette.inkPrimary}
          strokeWidth={strokeWidth}
        />
      </FlatHorizon>
    </svg>
  );
};
