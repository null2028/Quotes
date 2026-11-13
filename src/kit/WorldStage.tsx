import React from 'react';
import { evolvePath } from '@remotion/paths';

/**
 * Mặt phẳng chân trời ngang chuẩn Open Paper Horizon (nhân vật bên trong đặt tại groundY = 0)
 */
export const FlatHorizon: React.FC<{
  y?: number;
  startX?: number;
  endX?: number;
  x1?: number;
  x2?: number;
  drawProgress: number;
  stroke: string;
  strokeWidth?: number;
  children?: React.ReactNode;
}> = ({
  y = 350,
  startX,
  endX,
  x1,
  x2,
  drawProgress,
  stroke,
  children,
}) => {
  const actualStartX = startX ?? x1 ?? 55;
  const actualEndX = endX ?? x2 ?? 485;
  const span = Math.max(40, actualEndX - actualStartX);
  const shadowStartX = actualStartX + span * 0.15;
  const shadowEndX = actualEndX - span * 0.15;
  const gradId = `flat-horizon-grad-${Math.round(actualStartX)}-${Math.round(actualEndX)}`;
  const path = `M ${actualStartX} 0 L ${actualEndX} 0`;
  const shadowPath = `M ${shadowStartX.toFixed(1)} 2.5 L ${shadowEndX.toFixed(1)} 2.5`;
  const evo = evolvePath(Math.max(0.001, drawProgress), path);

  return (
    <g transform={`translate(0, ${y})`} style={{ opacity: drawProgress }}>
      <defs>
        <linearGradient
          id={gradId}
          gradientUnits="userSpaceOnUse"
          x1={actualStartX}
          y1={0}
          x2={actualEndX}
          y2={0}
        >
          <stop offset="0%" stopColor={stroke} stopOpacity={0} />
          <stop offset="18%" stopColor={stroke} stopOpacity={0.38} />
          <stop offset="50%" stopColor={stroke} stopOpacity={0.65} />
          <stop offset="82%" stopColor={stroke} stopOpacity={0.38} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={1.15}
        strokeLinecap="round"
        strokeDasharray={evo.strokeDasharray}
        strokeDashoffset={evo.strokeDashoffset}
      />
      <path
        d={shadowPath}
        fill="none"
        stroke={stroke}
        strokeWidth={0.85}
        strokeLinecap="round"
        opacity={0.1}
      />
      {children}
    </g>
  );
};

/**
 * Mặt dốc nghiêng chuẩn hệ trục cục bộ (mọi nhân vật và đạo cụ đặt bên trong có y = 0 luôn bám khít dốc)
 */
export const SlopedStage: React.FC<{
  originX?: number;
  originY?: number;
  cx?: number;
  cy?: number;
  angleDeg?: number;
  halfLength?: number;
  length?: number;
  drawProgress: number;
  stroke: string;
  strokeWidth?: number;
  children?: React.ReactNode;
}> = ({
  originX,
  originY,
  cx,
  cy,
  angleDeg = -15.5,
  halfLength,
  length,
  drawProgress,
  stroke,
  children,
}) => {
  const actualOriginX = originX ?? cx ?? 275;
  const actualOriginY = originY ?? cy ?? 295;
  const actualHalf = halfLength ?? (length ? length / 2 : 225);
  const shadowHalf = actualHalf * 0.7;
  const gradId = `sloped-stage-grad-${Math.round(actualHalf)}`;
  const path = `M ${-actualHalf} 0 L ${actualHalf} 0`;
  const shadowPath = `M ${-shadowHalf.toFixed(1)} 2.5 L ${shadowHalf.toFixed(1)} 2.5`;
  const evo = evolvePath(Math.max(0.001, drawProgress), path);

  return (
    <g
      transform={`translate(${actualOriginX}, ${actualOriginY}) rotate(${angleDeg})`}
      style={{ opacity: drawProgress }}
    >
      <defs>
        <linearGradient
          id={gradId}
          gradientUnits="userSpaceOnUse"
          x1={-actualHalf}
          y1={0}
          x2={actualHalf}
          y2={0}
        >
          <stop offset="0%" stopColor={stroke} stopOpacity={0} />
          <stop offset="18%" stopColor={stroke} stopOpacity={0.38} />
          <stop offset="50%" stopColor={stroke} stopOpacity={0.65} />
          <stop offset="82%" stopColor={stroke} stopOpacity={0.38} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={1.15}
        strokeLinecap="round"
        strokeDasharray={evo.strokeDasharray}
        strokeDashoffset={evo.strokeDashoffset}
      />
      <path
        d={shadowPath}
        fill="none"
        stroke={stroke}
        strokeWidth={0.85}
        strokeLinecap="round"
        opacity={0.1}
      />
      {children}
    </g>
  );
};

/**
 * Mặt nước gợn sóng êm nhẹ (dùng cho cảnh thuyền giấy, ánh trăng đáy hồ...)
 */
export const WaterSurface: React.FC<{
  y?: number;
  startX?: number;
  endX?: number;
  phase: number;
  amplitude?: number;
  drawProgress: number;
  stroke: string;
  strokeWidth?: number;
  children?: React.ReactNode;
}> = ({
  y = 355,
  startX = 50,
  endX = 490,
  phase,
  amplitude = 4.5,
  drawProgress,
  stroke,
  children,
}) => {
  const steps = 48;
  const cmds: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = startX + t * (endX - startX);
    const py =
      Math.sin(t * Math.PI * 5 + phase * 0.35 * 1.4) *
      amplitude *
      Math.sin(t * Math.PI);
    cmds.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  const wavePath = cmds.join(' ');
  const evo = evolvePath(Math.max(0.001, drawProgress), wavePath);
  const gradId = `water-surface-grad-${Math.round(startX)}-${Math.round(endX)}`;

  return (
    <g transform={`translate(0, ${y})`} style={{ opacity: drawProgress }}>
      <defs>
        <linearGradient
          id={gradId}
          gradientUnits="userSpaceOnUse"
          x1={startX}
          y1={0}
          x2={endX}
          y2={0}
        >
          <stop offset="0%" stopColor={stroke} stopOpacity={0} />
          <stop offset="18%" stopColor={stroke} stopOpacity={0.38} />
          <stop offset="50%" stopColor={stroke} stopOpacity={0.65} />
          <stop offset="82%" stopColor={stroke} stopOpacity={0.38} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d={wavePath}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={1.15}
        strokeLinecap="round"
        strokeDasharray={evo.strokeDasharray}
        strokeDashoffset={evo.strokeDashoffset}
      />
      {children}
    </g>
  );
};

/**
 * Hai mỏm đá cách nhau bởi vực sâu và nhịp cầu có thể nối lại
 */
export const CliffBridge: React.FC<{
  y?: number;
  gapHalfWidth?: number;
  bridgeProgress?: number;
  drawProgress: number;
  stroke: string;
  accentStroke: string;
  strokeWidth?: number;
  children?: React.ReactNode;
}> = ({
  y = 345,
  gapHalfWidth = 55,
  bridgeProgress = 0,
  drawProgress,
  stroke,
  accentStroke,
  strokeWidth = 3.0,
  children,
}) => {
  const leftPath = `M 55 0 L ${270 - gapHalfWidth} 0 L ${270 - gapHalfWidth - 10} 65`;
  const rightPath = `M ${270 + gapHalfWidth + 10} 65 L ${270 + gapHalfWidth} 0 L 485 0`;
  const bridgePath = `M ${270 - gapHalfWidth} 0 Q 270 -16 ${270 + gapHalfWidth} 0`;

  const leftEvo = evolvePath(drawProgress, leftPath);
  const rightEvo = evolvePath(drawProgress, rightPath);
  const bridgeEvo = evolvePath(Math.max(0.001, bridgeProgress), bridgePath);

  return (
    <g transform={`translate(0, ${y})`} style={{ opacity: drawProgress }}>
      <path
        d={leftPath}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={leftEvo.strokeDasharray}
        strokeDashoffset={leftEvo.strokeDashoffset}
      />
      <path
        d={rightPath}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={rightEvo.strokeDasharray}
        strokeDashoffset={rightEvo.strokeDashoffset}
      />
      {bridgeProgress > 0.02 && (
        <path
          d={bridgePath}
          fill="none"
          stroke={accentStroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={bridgeEvo.strokeDasharray}
          strokeDashoffset={bridgeEvo.strokeDashoffset}
        />
      )}
      {children}
    </g>
  );
};
