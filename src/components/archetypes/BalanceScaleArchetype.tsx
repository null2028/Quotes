import React from 'react';
import { ArchetypeComponentProps } from './types';

/**
 * MATCH_LIGHTING_CANDLE (Nhánh Ẩn Dụ Đồ Vật Đời Thường - V2.1 Slow Cinema):
 * - Hồi I: Que diêm nghiêng mình mang đốm lửa nhỏ tiến sát vào bấc của cây nến lớn đang tắt.
 * - Beat 1 & Beat 2 (beat2SettleGlow, 2.8s): Ngọn nến từ từ bừng sáng rực rỡ với ngọn lửa màu Đỏ Gạch (#D94E34).
 * - Beat 3 (beat3LingeringWalk, 6.5s): Ngọn nến tỏa vòng hào quang ấm áp trong khi thân que diêm cong lại và lùi nhẹ hóa xám tro.
 */
export const BalanceScaleArchetype: React.FC<ArchetypeComponentProps> = ({
  state,
  palette,
  strokeWidth,
}) => {
  const candleX = 320;
  const candleTopY = 235;

  // Que diêm tiến vào đầu bấc nến ở Hồi I, rồi hạ xuống chậm rãi trong 2.8s (beat2SettleGlow) và lùi nhẹ trong 6.5s (beat3LingeringWalk)
  const matchX = 165 + state.act1Progress * 120 - state.beat3LingeringWalk * 34;
  const matchY = 230 + state.beat2SettleGlow * 32;
  const matchBend = state.beat2SettleGlow * 18;
  const matchFlameScale = Math.max(0, 1 - state.beat2SettleGlow * 0.9);

  // Ngọn lửa nến lớn lên êm dịu trong 2.8s của beat2SettleGlow và bập bùng chậm rãi
  const flicker = Math.sin(state.continuousPhase * 2.2) * 2.2;
  const candleFlameScale = state.beat2SettleGlow;

  return (
    <svg viewBox="0 0 540 480" style={{ width: 600, height: 520, overflow: 'visible' }}>
      {/* Vòng hào quang ấm áp tỏa ra quanh ngọn nến ở Beat 2 & Beat 3 */}
      {state.beat2SettleGlow > 0.05 && (
        <g opacity={state.beat2SettleGlow}>
          <circle
            cx={candleX}
            cy={candleTopY - 38}
            r={44 + state.beat3LingeringWalk * 30 + flicker}
            fill="none"
            stroke={palette.accent}
            strokeWidth={1.5}
            strokeDasharray="4 8"
            opacity={0.45}
          />
          <circle
            cx={candleX}
            cy={candleTopY - 38}
            r={24 + flicker * 0.5}
            fill={palette.accent}
            opacity={0.18}
          />
        </g>
      )}

      {/* Thân cây nến lớn đứng vững chãi */}
      <g opacity={state.drawProgress}>
        <rect
          x={candleX - 28}
          y={candleTopY}
          width={56}
          height={155}
          rx={6}
          fill={palette.background}
          stroke={palette.inkPrimary}
          strokeWidth={strokeWidth}
        />
        <line
          x1={candleX}
          y1={candleTopY}
          x2={candleX}
          y2={candleTopY - 16}
          stroke={palette.inkPrimary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </g>

      {/* Ngọn lửa Đỏ Gạch bừng sáng trên đỉnh nến trong 2.8s của beat2SettleGlow */}
      {candleFlameScale > 0.02 && (
        <path
          d={`M ${candleX} ${candleTopY - 18} C ${candleX - 18 * candleFlameScale} ${candleTopY - 34} ${candleX - 10 * candleFlameScale} ${candleTopY - 58} ${candleX + flicker * 0.6} ${candleTopY - 68 * candleFlameScale - (1 - candleFlameScale) * 18} C ${candleX + 10 * candleFlameScale} ${candleTopY - 58} ${candleX + 18 * candleFlameScale} ${candleTopY - 34} ${candleX} ${candleTopY - 18} Z`}
          fill={palette.accent}
        />
      )}

      {/* Que diêm tự đốt cháy mình để truyền lửa */}
      <g
        transform={`translate(${matchX}, ${matchY}) rotate(-18)`}
        style={{ opacity: state.drawProgress }}
      >
        <path
          d={`M -95 28 Q -45 ${14 + matchBend} 0 0`}
          fill="none"
          stroke={state.beat2SettleGlow > 0.5 ? palette.inkSecondary : palette.inkPrimary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <circle
          cx={0}
          cy={0}
          r={5.5}
          fill={state.beat2SettleGlow > 0.6 ? palette.inkSecondary : palette.accent}
        />
        {matchFlameScale > 0.05 && (
          <path
            d={`M 0 -4 C ${-9 * matchFlameScale} -14 ${-5 * matchFlameScale} -26 0 ${-32 * matchFlameScale} C ${5 * matchFlameScale} -26 ${9 * matchFlameScale} -14 0 -4 Z`}
            fill={palette.accent}
          />
        )}
      </g>
    </svg>
  );
};
