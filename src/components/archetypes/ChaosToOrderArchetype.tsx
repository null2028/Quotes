import React from 'react';
import { evolvePath } from '@remotion/paths';
import { ArchetypeComponentProps } from './types';

/**
 * KNOT_TO_BIRD (Nhánh Ẩn Dụ Đồ Vật Đời Thường):
 * - Hồi I: Sợi dây dài đang xoắn rối nhiều vòng ở giữa màn hình (overthinking / lo âu).
 * - Hồi II (tại pivotFrame): Sợi dây tự cởi nút, duỗi phẳng thành đường chân trời êm dịu;
 *   từ nút thắt ở tâm, một cánh chim màu Đỏ Gạch (#D94E34) mở cánh.
 * - Hồi III: Cánh chim đỏ vỗ cánh bay vút lên bầu trời thoáng đãng khi camera lùi ra xa.
 */
export const ChaosToOrderArchetype: React.FC<ArchetypeComponentProps> = ({
  state,
  palette,
  strokeWidth,
}) => {
  const pointsCount = 84;
  const startX = 45;
  const endX = 495;
  const baseY = 300;
  const chaosFactor = Math.max(0, 1 - state.transitionProgress);

  // Sinh chuỗi SVG Path: Hồi I cuộn xoắn nút ở tâm -> Hồi II duỗi phẳng thành đường chân trời
  const pathCommands: string[] = [];
  for (let i = 0; i <= pointsCount; i++) {
    const t = i / pointsCount;
    const linearX = startX + t * (endX - startX);
    const centerBell = Math.exp(-Math.pow((t - 0.5) * 4.2, 2));

    // Xoắn nút Lissajous ở giữa sợi dây khi chaosFactor > 0
    const knotAngle = t * Math.PI * 10 + state.continuousPhase * 1.5;
    const knotLoopX = Math.cos(knotAngle) * 42 * centerBell * chaosFactor;
    const knotLoopY =
      (Math.sin(knotAngle * 1.5) * 68 +
        Math.cos(t * Math.PI * 6 - state.continuousPhase) * 24) *
      centerBell *
      chaosFactor;

    const x = linearX + knotLoopX;
    const y = baseY + knotLoopY;
    pathCommands.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }

  const fullPath = pathCommands.join(' ');
  const evolution = evolvePath(state.drawProgress, fullPath);

  // Cánh chim Đỏ Gạch thoát ra từ nút thắt ở Hồi II và bay lên cao ở Hồi III
  const birdFlightT = Math.min(1, state.transitionProgress * 0.35 + state.act3Progress * 0.65);
  const birdX = 270 + birdFlightT * 65;
  const birdY = baseY - 12 - birdFlightT * 155;
  const wingFlap = Math.sin(state.continuousPhase * 3.2) * 10;
  const wingSpan = 26 * state.accentReveal;

  return (
    <svg viewBox="0 0 540 480" style={{ width: 600, height: 520, overflow: 'visible' }}>
      {/* Sợi chỉ rối tự tháo nút thành đường chân trời */}
      <path
        d={fullPath}
        fill="none"
        stroke={palette.inkPrimary}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={evolution.strokeDasharray}
        strokeDashoffset={evolution.strokeDashoffset}
      />

      {/* Cánh chim Đỏ Gạch hóa thân từ nút thắt và bay lên bầu trời */}
      {state.accentReveal > 0.05 && (
        <g
          style={{
            transform: `translate(${birdX}px, ${birdY}px) rotate(-12deg)`,
            opacity: state.accentReveal,
          }}
        >
          <path
            d={`M ${-wingSpan} ${wingFlap} Q ${-wingSpan * 0.45} ${-14 + wingFlap * 0.3} 0 0 Q ${wingSpan * 0.45} ${-14 + wingFlap * 0.3} ${wingSpan} ${wingFlap}`}
            fill="none"
            stroke={palette.accent}
            strokeWidth={strokeWidth + 0.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={0} cy={0} r={4} fill={palette.accent} />
        </g>
      )}
    </svg>
  );
};
