import React from 'react';
import { evolvePath } from '@remotion/paths';

/** 1 Đơn vị chiều cao chuẩn của Kẻ Lữ Hành (46px). Mọi vật thể đều nhân theo U! */
export const U = 46;

/**
 * Mặt đất mở không khung hộp (Open Horizon Ground).
 * Mọi phần tử con đặt bên trong đều lấy y = 0 làm mặt đất chuẩn!
 */
export const OpenGroundStage: React.FC<{
  groundY?: number;
  slopeDeg?: number;
  drawProgress: number;
  lineColor: string;
  strokeWidth?: number;
  children: React.ReactNode;
}> = ({
  groundY = 345,
  slopeDeg = 0,
  drawProgress,
  lineColor,
  strokeWidth = 3.0,
  children,
}) => {
  const safeProgress = Math.max(0.001, Math.min(1, drawProgress));
  const groundLine = 'M -215 0 L 215 0';
  const evo = evolvePath(safeProgress, groundLine);

  return (
    <g
      style={{
        transform: `translate(270px, ${groundY}px) rotate(${slopeDeg}deg)`,
        transformOrigin: '0px 0px',
      }}
    >
      <path
        d={groundLine}
        fill="none"
        stroke={lineColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={evo.strokeDasharray}
        strokeDashoffset={evo.strokeDashoffset}
      />
      {children}
    </g>
  );
};

/**
 * Lớp Hậu cảnh mờ xa (Dùng khi câu chữ so sánh "Thiên hạ / Đám đông" với "Mình")
 */
export const DistantBackdropGroup: React.FC<{
  x?: number;
  offsetY?: number;
  opacity?: number;
  children: React.ReactNode;
}> = ({ x = -95, offsetY = -6, opacity = 0.28, children }) => (
  <g
    style={{
      transform: `translate(${x}px, ${offsetY}px) scale(0.68)`,
      opacity,
    }}
  >
    {children}
  </g>
);

/**
 * Nhân vật Kẻ Lữ Hành có sẵn khớp gắn Đạo cụ trên lưng (backSlot) và trên tay (handSlot).
 * Chân luôn chạm khít y = 0!
 */
export const AnchoredTraveler: React.FC<{
  x: number;
  facing?: 'left' | 'right';
  leanDeg?: number;        // Góc cúi gồng (+14) hoặc ngả người thư thái (-10)
  walkPhase?: number;
  strideAmount?: number;   // 0 = đứng yên, 1 = bước đi bình thường
  sitProgress?: number;    // 0 = đứng/đi, 1 = ngồi bệt thư thái trên mặt đất
  color: string;
  opacity?: number;
  backSlot?: React.ReactNode; // Gốc (0,0) nằm ngay giữa lưng nhân vật
  handSlot?: React.ReactNode; // Gốc (0,0) nằm ngay đầu bàn tay phía trước ngực
}> = ({
  x,
  facing = 'right',
  leanDeg = 0,
  walkPhase = 0,
  strideAmount = 0,
  sitProgress = 0,
  color,
  opacity = 1,
  backSlot,
  handSlot,
}) => {
  const dir = facing === 'right' ? 1 : -1;
  const clampedSit = Math.max(0, Math.min(1, sitProgress));
  const stride = Math.sin(walkPhase) * 4.5 * strideAmount * (1 - clampedSit);
  const stepBob =
    Math.abs(Math.sin(walkPhase)) * 1.8 * strideAmount * (1 - clampedSit);
  const sitDrop = clampedSit * 13; // Hạ thấp thân người khi ngồi xuống

  return (
    <g
      style={{
        transform: `translate(${x}px, 0px) scaleX(${dir})`,
        opacity,
      }}
    >
      {/* Phần thân trên (Đầu + Áo choàng + Khớp Lưng + Khớp Tay) nghiêng theo leanDeg */}
      <g
        style={{
          transform: `translate(0px, ${sitDrop - stepBob}px) rotate(${leanDeg}deg)`,
          transformOrigin: '0px -8px',
        }}
      >
        {/* Đầu nhân vật */}
        <circle cx={0} cy={-38} r={7.2} fill={color} />
        {/* Thân áo choàng */}
        <path
          d="M -3 -29 C -8 -20 -10 -11 -8 -7 L 8 -7 C 9 -11 7 -20 3 -29 Z"
          fill={color}
        />

        {/* Khớp gắn Gánh nặng / Ba lô trên lưng (backSlot) */}
        {backSlot && (
          <g style={{ transform: 'translate(-9px, -22px)' }}>{backSlot}</g>
        )}

        {/* Cánh tay đưa ra phía trước + Khớp gắn Đạo cụ trên tay (handSlot) */}
        {handSlot && (
          <g>
            <line
              x1={4}
              y1={-22}
              x2={14}
              y2={-20}
              stroke={color}
              strokeWidth={2.4}
              strokeLinecap="round"
            />
            <g style={{ transform: 'translate(16px, -21px)' }}>{handSlot}</g>
          </g>
        )}
      </g>

      {/* Hai chân: bước đi khi đứng hoặc duỗi ra phía trước khi ngồi */}
      {clampedSit < 0.5 ? (
        <>
          <line
            x1={-2.5}
            y1={-7 + sitDrop - stepBob}
            x2={-2.5 + stride}
            y2={0}
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <line
            x1={2.5}
            y1={-7 + sitDrop - stepBob}
            x2={2.5 - stride}
            y2={0}
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </>
      ) : (
        <line
          x1={4}
          y1={-2}
          x2={18}
          y2={-1}
          stroke={color}
          strokeWidth={2.7}
          strokeLinecap="round"
        />
      )}
    </g>
  );
};
