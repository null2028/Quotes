import React from 'react';
import { evolvePath } from '@remotion/paths';
import { ArchetypeComponentProps } from './types';

/**
 * KEY_CHANGED_LOCK (Nhánh Ẩn Dụ Đồ Vật Đời Thường):
 * - Hồi I: Chiếc chìa khóa cũ từ từ tiến về phía ổ khóa ở giữa khung cửa.
 * - Hồi II (tại pivotFrame): Tâm ổ khóa xoay ngang 90 độ đổi cấu trúc rãnh và chuyển sang màu Đỏ Gạch (#D94E34).
 * - Hồi III: Chiếc chìa khóa khựng lại và lùi nhẹ ra ngoài khoảng không khi cánh cửa đã khép lại.
 */
export const LineRuptureHealArchetype: React.FC<ArchetypeComponentProps> = ({
  state,
  palette,
  strokeWidth,
}) => {
  // Khung ổ khóa ở bên phải (x = 355, y = 250)
  const lockX = 355;
  const lockY = 250;

  // Chìa khóa tiến tới gần ổ khóa ở Hồi I, rồi khựng lại & lùi ra ở Hồi II - III
  const approachX = 110 + state.act1Progress * 125;
  const retreatX = state.transitionProgress * 32 + state.act3Progress * 48;
  const keyX = approachX - retreatX;
  const keyHoverY =
    250 + (1 - state.transitionProgress) * Math.sin(state.continuousPhase * 2) * 4;

  const doorLineTop = 'M 355 95 L 355 188';
  const doorLineBottom = 'M 355 312 L 355 405';
  const topEvo = evolvePath(state.drawProgress, doorLineTop);
  const bottomEvo = evolvePath(state.drawProgress, doorLineBottom);

  return (
    <svg viewBox="0 0 540 480" style={{ width: 600, height: 520, overflow: 'visible' }}>
      {/* Đường ranh giới cánh cửa */}
      <path
        d={doorLineTop}
        fill="none"
        stroke={palette.inkPrimary}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={topEvo.strokeDasharray}
        strokeDashoffset={topEvo.strokeDashoffset}
      />
      <path
        d={doorLineBottom}
        fill="none"
        stroke={palette.inkPrimary}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={bottomEvo.strokeDasharray}
        strokeDashoffset={bottomEvo.strokeDashoffset}
      />

      {/* Ổ khóa tròn & Rãnh khóa xoay 90 độ hóa màu Đỏ Gạch tại pivotFrame */}
      <g opacity={state.drawProgress}>
        <circle
          cx={lockX}
          cy={lockY}
          r={48}
          fill={palette.background}
          stroke={state.accentReveal > 0.3 ? palette.accent : palette.inkPrimary}
          strokeWidth={strokeWidth}
        />
        <g
          style={{
            transform: `rotate(${state.transitionProgress * 90}deg)`,
            transformOrigin: `${lockX}px ${lockY}px`,
          }}
        >
          <circle
            cx={lockX}
            cy={lockY - 8}
            r={9}
            fill={state.accentReveal > 0.3 ? palette.accent : palette.inkPrimary}
          />
          <path
            d={`M ${lockX - 5} ${lockY - 2} L ${lockX - 8} ${lockY + 18} L ${lockX + 8} ${lockY + 18} L ${lockX + 5} ${lockY - 2} Z`}
            fill={state.accentReveal > 0.3 ? palette.accent : palette.inkPrimary}
          />
        </g>
      </g>

      {/* Chiếc Chìa Khóa Cũ bên trái */}
      <g
        style={{
          transform: `translate(${keyX}px, ${keyHoverY}px)`,
          opacity: state.drawProgress * (1 - state.act3Progress * 0.25),
        }}
      >
        {/* Chuôi chìa khóa tròn */}
        <circle
          cx={0}
          cy={0}
          r={22}
          fill="none"
          stroke={palette.inkPrimary}
          strokeWidth={strokeWidth}
        />
        {/* Thân chìa khóa */}
        <line
          x1={22}
          y1={0}
          x2={86}
          y2={0}
          stroke={palette.inkPrimary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Răng chìa khóa */}
        <line
          x1={68}
          y1={0}
          x2={68}
          y2={16}
          stroke={palette.inkPrimary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <line
          x1={80}
          y1={0}
          x2={80}
          y2={12}
          stroke={palette.inkPrimary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};
