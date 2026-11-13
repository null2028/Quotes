import React from 'react';
import { evolvePath } from '@remotion/paths';
import { ArchetypeComponentProps } from '../../components/archetypes/types';
import { SlowRain } from '../../kit/Atmosphere';

/**
 * 11. BROKEN_BRANCH_SPROUT:
 * - Hồi I: Cành cây khô gãy gập trĩu xuống dưới cơn mưa lạnh.
 * - Hồi II (pivotFrame): Mưa ngớt dần, ngay tại vết gãy xước nảy lên một thân mầm mới.
 * - Hồi III: Hai chiếc lá non màu Đỏ Gạch bung nở vươn thẳng lên bầu trời sáng.
 */
export const BrokenBranchSproutScene: React.FC<ArchetypeComponentProps> = ({
  state,
  palette,
  strokeWidth,
}) => {
  const mainBranch = 'M 75 295 L 255 255';
  const brokenPart = 'M 255 255 L 385 335';
  const mainEvo = evolvePath(state.drawProgress, mainBranch);
  const brokenEvo = evolvePath(state.drawProgress, brokenPart);

  const rainOpacity = state.drawProgress * Math.max(0, 1 - state.beat1StopClear);
  const brokenTremor =
    (1 - state.beat1StopClear) * Math.sin(state.continuousPhase * 2.2) * 3;

  // Mầm non vươn lên từ điểm gãy (255, 255)
  const sproutGrow = state.beat2SettleGlow;
  const leafSway = Math.sin(state.continuousPhase * 1.5) * 2.5;
  const stemHeight = 64 * sproutGrow;
  const leafScale = Math.max(
    0,
    Math.min(1, (state.beat2SettleGlow - 0.25) / 0.75 + state.beat3LingeringWalk * 0.15)
  );

  return (
    <svg
      viewBox="0 0 540 480"
      style={{ width: 600, height: 520, overflow: 'visible' }}
    >
      <SlowRain
        frame={state.frame}
        opacity={rainOpacity}
        color={palette.inkSecondary}
        count={14}
      />

      {/* Cành cây chính */}
      <path
        d={mainBranch}
        fill="none"
        stroke={palette.inkPrimary}
        strokeWidth={strokeWidth + 0.8}
        strokeLinecap="round"
        strokeDasharray={mainEvo.strokeDasharray}
        strokeDashoffset={mainEvo.strokeDashoffset}
      />

      {/* Đoạn cành gãy rũ xuống */}
      <g
        transform={`translate(255, 255) rotate(${brokenTremor.toFixed(2)}) translate(-255, -255)`}
      >
        <path
          d={brokenPart}
          fill="none"
          stroke={palette.inkSecondary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={brokenEvo.strokeDasharray}
          strokeDashoffset={brokenEvo.strokeDashoffset}
        />
      </g>

      {/* Chồi non & Đôi lá mầm Đỏ Gạch vươn thẳng lên từ vết gãy */}
      {sproutGrow > 0.02 && (
        <g transform={`translate(255, 255)`}>
          <path
            d={`M 0 0 Q ${leafSway * 0.5} ${-stemHeight * 0.5} ${leafSway} ${-stemHeight}`}
            fill="none"
            stroke={palette.accent}
            strokeWidth={strokeWidth - 0.2}
            strokeLinecap="round"
          />
          {leafScale > 0.02 && (
            <g
              transform={`translate(${leafSway}, ${-stemHeight}) scale(${leafScale.toFixed(2)})`}
            >
              {/* Lá bên trái */}
              <path
                d="M 0 0 C -18 -6 -24 -22 -8 -28 C 0 -22 2 -10 0 0 Z"
                fill={palette.accent}
              />
              {/* Lá bên phải */}
              <path
                d="M 0 4 C 18 -2 24 -18 10 -24 C 2 -18 0 -6 0 4 Z"
                fill={palette.accent}
                opacity={0.9}
              />
            </g>
          )}
        </g>
      )}
    </svg>
  );
};
