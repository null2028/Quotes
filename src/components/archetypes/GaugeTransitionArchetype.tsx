import React from 'react';
import { evolvePath } from '@remotion/paths';
import { ArchetypeComponentProps } from './types';

/**
 * PASSING_CLOCK_HANDS (Nhánh Ẩn Dụ Đồ Vật Đời Thường - V2.1 Slow Cinema):
 * - Hồi I: Mặt đồng hồ tối giản không số; kim ngắn và kim dài xoay tiến sát về phía nhau.
 * - Beat 1 & Beat 2 (beat2SettleGlow, 2.8s): Hai kim trùng khít lên nhau tạo vòng sóng cộng hưởng màu Đỏ Gạch (#D94E34).
 * - Beat 3 (beat3LingeringWalk, 6.5s): Kim dài tiếp tục xoay tách ra xa thật chậm theo quy luật thời gian, để lại kim ngắn ở lại.
 */
export const GaugeTransitionArchetype: React.FC<ArchetypeComponentProps> = ({
  state,
  palette,
  strokeWidth,
}) => {
  const cx = 270;
  const cy = 245;
  const radius = 148;

  const rimPath = `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.1} ${cy - radius}`;
  const rimEvo = evolvePath(state.drawProgress, rimPath);

  // Góc gặp nhau định mệnh tại pivotFrame = 35 độ
  const meetAngleDeg = 35;
  // Kim ngắn (di chuyển rất chậm)
  const hourAngleDeg =
    meetAngleDeg - (1 - state.act1Progress) * 28 + state.beat3LingeringWalk * 12;
  // Kim dài (tiến lại gần ở Hồi I, dừng giao nhau ở Beat 1, rồi từ từ xoay rời xa suốt 6.5s của Beat 3)
  const minuteAngleDeg =
    meetAngleDeg - (1 - state.act1Progress) * 135 + state.beat3LingeringWalk * 120;

  return (
    <svg viewBox="0 0 540 480" style={{ width: 600, height: 520, overflow: 'visible' }}>
      <path
        d={rimPath}
        fill="none"
        stroke={palette.inkPrimary}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={rimEvo.strokeDasharray}
        strokeDashoffset={rimEvo.strokeDashoffset}
      />

      {/* 12 vạch khắc giờ mảnh */}
      <g opacity={state.drawProgress * 0.55}>
        {Array.from({ length: 12 }).map((_, i) => {
          const deg = i * 30;
          const rad = ((deg - 90) * Math.PI) / 180;
          const x1 = cx + Math.cos(rad) * (radius - 12);
          const y1 = cy + Math.sin(rad) * (radius - 12);
          const x2 = cx + Math.cos(rad) * radius;
          const y2 = cy + Math.sin(rad) * radius;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={palette.inkSecondary}
              strokeWidth={i % 3 === 0 ? 2.5 : 1.5}
              strokeLinecap="round"
            />
          );
        })}
      </g>

      {/* Vòng sóng cộng hưởng Đỏ Gạch phát sáng êm dịu trong 2.8s của beat2SettleGlow */}
      {state.beat2SettleGlow > 0.05 && (
        <circle
          cx={cx}
          cy={cy}
          r={18 + state.beat2SettleGlow * 44}
          fill="none"
          stroke={palette.accent}
          strokeWidth={2}
          opacity={state.beat2SettleGlow * (1 - state.beat3LingeringWalk * 0.6)}
        />
      )}

      {/* Kim ngắn (Người ở lại) */}
      <g
        style={{
          transform: `rotate(${hourAngleDeg}deg)`,
          transformOrigin: `${cx}px ${cy}px`,
          opacity: state.drawProgress,
        }}
      >
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - 82}
          stroke={palette.inkPrimary}
          strokeWidth={strokeWidth + 1.2}
          strokeLinecap="round"
        />
      </g>

      {/* Kim dài (Người lướt qua đời - Đổi sang màu Đỏ Gạch từ khoảnh khắc chạm nhau) */}
      <g
        style={{
          transform: `rotate(${minuteAngleDeg}deg)`,
          transformOrigin: `${cx}px ${cy}px`,
          opacity: state.drawProgress,
        }}
      >
        <line
          x1={cx}
          y1={cy + 18}
          x2={cx}
          y2={cy - 122}
          stroke={state.beat2SettleGlow > 0.25 ? palette.accent : palette.inkPrimary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </g>

      {/* Tâm chốt đồng hồ */}
      <circle
        cx={cx}
        cy={cy}
        r={6.5}
        fill={state.beat2SettleGlow > 0.25 ? palette.accent : palette.inkPrimary}
        opacity={state.drawProgress}
      />
    </svg>
  );
};
