import React from 'react';
import { evolvePath } from '@remotion/paths';
import { ArchetypeComponentProps } from '../../components/archetypes/types';
import { RisingSteam } from '../../kit/Atmosphere';

/**
 * 12. HOURGLASS_TEA_BREW:
 * - Hồi I: Cát chảy dần qua eo chiếc đồng hồ cát tối giản (thời gian trôi, sự chờ đợi).
 * - Hồi II (pivotFrame): Hạt cát cuối cùng hóa thành giọt trà Đỏ Gạch ấm áp nhỏ xuống tách sứ bên dưới.
 * - Hồi III: Tách trà đầy ắp sắc Đỏ Gạch bốc làn khói thơm dịu dàng.
 */
export const HourglassTeaBrewScene: React.FC<ArchetypeComponentProps> = ({
  state,
  palette,
  strokeWidth,
}) => {
  const cx = 270;
  const glassLeft = 'M 225 135 L 315 135 L 276 205 L 315 275 L 225 275 L 264 205 Z';
  const glassEvo = evolvePath(state.drawProgress, glassLeft);

  // Lượng cát ở bầu trên vơi dần trong Hồi I
  const upperSandLevel = Math.max(0.08, 1 - state.act1Progress * 0.85);
  const sandStreamActive = state.act1Progress < 0.98 && state.beat1StopClear < 0.6;

  // Giọt trà Đỏ Gạch rơi từ đáy đồng hồ cát xuống tách sứ bên dưới ở Beat 2
  const dropT = Math.min(1, state.beat2SettleGlow * 1.4);
  const dropY = 280 + dropT * 68;

  return (
    <svg
      viewBox="0 0 540 480"
      style={{ width: 600, height: 520, overflow: 'visible' }}
    >
      {/* Khung đồng hồ cát lơ lửng phía trên */}
      <g opacity={state.drawProgress * (1 - state.beat3LingeringWalk * 0.35)}>
        <path
          d={glassLeft}
          fill="none"
          stroke={palette.inkPrimary}
          strokeWidth={strokeWidth - 0.3}
          strokeLinejoin="round"
          strokeDasharray={glassEvo.strokeDasharray}
          strokeDashoffset={glassEvo.strokeDashoffset}
        />
        {/* Cát ở bầu trên */}
        <polygon
          points={`${cx - 26 * upperSandLevel},${202 - 42 * upperSandLevel} ${cx + 26 * upperSandLevel},${202 - 42 * upperSandLevel} ${cx},203`}
          fill={palette.inkSecondary}
          opacity={0.55}
        />
        {/* Tia cát chảy nhỏ ở Hồi I */}
        {sandStreamActive && (
          <line
            x1={cx}
            y1={205}
            x2={cx}
            y2={272}
            stroke={palette.inkSecondary}
            strokeWidth={1.6}
            strokeDasharray="3 4"
          />
        )}
      </g>

      {/* Giọt trà Đỏ Gạch nhỏ xuống ở khoảnh khắc chuyển hóa */}
      {state.beat2SettleGlow > 0.02 && dropT < 0.98 && (
        <circle cx={cx} cy={dropY} r={4.5} fill={palette.accent} />
      )}

      {/* Tách trà sứ tối giản đặt trên đĩa ở bên dưới (y = 365) */}
      <g transform={`translate(${cx}, 365)`} style={{ opacity: state.drawProgress }}>
        {/* Đĩa lót */}
        <line
          x1={-46}
          y1={16}
          x2={46}
          y2={16}
          stroke={palette.inkPrimary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Thân tách trà */}
        <path
          d="M -28 -18 L -22 14 L 22 14 L 28 -18 Z"
          fill={
            state.beat2SettleGlow > 0.35 ? palette.accent : palette.background
          }
          stroke={
            state.beat2SettleGlow > 0.35 ? palette.accent : palette.inkPrimary
          }
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        {/* Quai tách */}
        <path
          d="M 27 -12 C 40 -12 40 6 24 8"
          fill="none"
          stroke={
            state.beat2SettleGlow > 0.35 ? palette.accent : palette.inkPrimary
          }
          strokeWidth={strokeWidth - 0.3}
          strokeLinecap="round"
        />
      </g>

      {/* Làn khói trà ấm bay lên từ tách trà suốt Hồi II & Hồi III */}
      <RisingSteam
        x={cx}
        y={340}
        frame={state.frame}
        color={palette.accent}
        opacity={state.beat2SettleGlow}
        height={44}
      />
    </svg>
  );
};
