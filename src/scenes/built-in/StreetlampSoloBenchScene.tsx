import React from 'react';
import { ArchetypeComponentProps } from '../../components/archetypes/types';
import { CloakedTraveler } from '../../kit/CloakedTraveler';
import { FlatHorizon } from '../../kit/WorldStage';

/**
 * 10. STREETLAMP_SOLO_BENCH:
 * - Hồi I: Hai người ngồi cạnh nhau trên chiếc ghế dài dưới ngọn đèn đường ấm.
 * - Hồi II (pivotFrame): Người bên phải đứng dậy và bước đi chậm rãi về phía xa.
 * - Hồi III: Một chiếc lá thu màu Đỏ Gạch xoay nhẹ rơi xuống đúng chỗ ngồi vừa bỏ trống.
 */
export const StreetlampSoloBenchScene: React.FC<ArchetypeComponentProps> = ({
  state,
  palette,
  strokeWidth,
}) => {
  const walkAwayT = state.beat3LingeringWalk;
  const p2X = 268 + walkAwayT * 175;
  const p2Opacity = state.drawProgress * (1 - walkAwayT * 0.65);

  // Chiếc lá Đỏ Gạch rơi từ tán cây/đèn xuống mặt ghế trống (y = -18 so với mặt đất) ở Hồi II-III
  const leafFallT = Math.min(
    1,
    state.beat2SettleGlow * 0.7 + state.beat3LingeringWalk * 0.3
  );
  const leafSway = Math.sin(leafFallT * Math.PI * 3) * 16 * (1 - leafFallT);
  const leafX = 266 + leafSway;
  const leafY = -165 * (1 - leafFallT) + -20 * leafFallT;
  const leafRot = (1 - leafFallT) * 140 - 12;

  return (
    <svg
      viewBox="0 0 540 480"
      style={{ width: 600, height: 520, overflow: 'visible' }}
    >
      <FlatHorizon
        y={355}
        drawProgress={state.drawProgress}
        stroke={palette.inkPrimary}
        strokeWidth={strokeWidth}
      >
        {/* Cột đèn đường tối giản bên trái ghế */}
        <g transform="translate(175, 0)">
          <path
            d="M 0 0 L 0 -185 Q 0 -210 26 -210 L 38 -210"
            fill="none"
            stroke={palette.inkPrimary}
            strokeWidth={strokeWidth - 0.2}
            strokeLinecap="round"
          />
          {/* Chụp đèn & Quầng sáng mờ */}
          <path
            d="M 28 -210 L 48 -210 L 54 -200 L 22 -200 Z"
            fill={palette.inkPrimary}
          />
          <polygon
            points="24,-198 52,-198 92,0 -16,0"
            fill={palette.inkSecondary}
            opacity={0.07}
          />
        </g>

        {/* Chiếc ghế gỗ công viên */}
        <g transform="translate(245, 0)">
          <line
            x1={-34}
            y1={-18}
            x2={38}
            y2={-18}
            stroke={palette.inkPrimary}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <line
            x1={-32}
            y1={-32}
            x2={36}
            y2={-32}
            stroke={palette.inkPrimary}
            strokeWidth={strokeWidth - 0.6}
            strokeLinecap="round"
          />
          <line
            x1={-26}
            y1={-18}
            x2={-26}
            y2={0}
            stroke={palette.inkPrimary}
            strokeWidth={strokeWidth - 0.4}
          />
          <line
            x1={28}
            y1={-18}
            x2={28}
            y2={0}
            stroke={palette.inkPrimary}
            strokeWidth={strokeWidth - 0.4}
          />
        </g>

        {/* Người thứ 1 ngồi yên trên nửa trái chiếc ghế */}
        <g transform="translate(226, -18)">
          <path
            d="M -6 0 L -5 -19 C 3 -19 7 -12 7 0 Z"
            fill={palette.inkPrimary}
          />
          <circle cx={0} cy={-27} r={7} fill={palette.inkPrimary} />
          <line
            x1={2}
            y1={0}
            x2={4}
            y2={18}
            stroke={palette.inkPrimary}
            strokeWidth={strokeWidth - 0.4}
            strokeLinecap="round"
          />
        </g>

        {/* Người thứ 2: Hồi I ngồi bên cạnh -> Từ pivotFrame đứng dậy bước xa dần */}
        {state.beat1StopClear < 0.45 ? (
          <g
            transform="translate(262, -18)"
            opacity={1 - state.beat1StopClear * 2}
          >
            <path
              d="M -6 0 L -5 -19 C 3 -19 7 -12 7 0 Z"
              fill={palette.inkPrimary}
            />
            <circle cx={0} cy={-27} r={7} fill={palette.inkPrimary} />
            <line
              x1={2}
              y1={0}
              x2={4}
              y2={18}
              stroke={palette.inkPrimary}
              strokeWidth={strokeWidth - 0.4}
              strokeLinecap="round"
            />
          </g>
        ) : (
          <CloakedTraveler
            x={p2X}
            y={0}
            scale={1 - walkAwayT * 0.22}
            facing="right"
            pose="walk"
            walkPhase={state.continuousPhase * 2.0}
            walkActivity={Math.sin(Math.min(1, walkAwayT + 0.15) * Math.PI * 0.85)}
            color={palette.inkPrimary}
            strokeWidth={strokeWidth}
            opacity={p2Opacity}
          />
        )}

        {/* Chiếc lá thu Đỏ Gạch rơi nhẹ đậu xuống đúng chỗ ngồi trống */}
        {state.beat2SettleGlow > 0.05 && (
          <ellipse
            cx={leafX}
            cy={leafY}
            rx={6.5}
            ry={3.0}
            fill={palette.accent}
            opacity={state.beat2SettleGlow}
            transform={`rotate(${leafRot.toFixed(1)} ${leafX.toFixed(1)} ${leafY.toFixed(1)})`}
          />
        )}
      </FlatHorizon>
    </svg>
  );
};
