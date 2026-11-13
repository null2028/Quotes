import React from 'react';

function periodicCycle(
  frame: number | undefined,
  phase: number | undefined,
  periodFrames: number,
  offsetRatio = 0
): number {
  const rawFrame =
    frame !== undefined ? frame : phase !== undefined ? phase * 18 : 0;
  return ((rawFrame / periodFrames + offsetRatio) % 1 + 1) % 1;
}

export const SlowRain: React.FC<{
  frame?: number;
  phase?: number;
  opacity?: number;
  color: string;
  count?: number;
  shelterZone?: { minX: number; maxX: number; topY: number };
}> = ({ frame = 0, phase, opacity = 1, color, count = 15, shelterZone }) => {
  if (opacity <= 0.01) return null;
  return (
    <g opacity={opacity * 0.44}>
      {Array.from({ length: count }).map((_, i) => {
        const cycle = periodicCycle(frame, phase, 180, (i * 0.173) % 1);
        const rx = 85 + ((i * 31) % 360) - cycle * 38;
        const ry = 75 + cycle * 245;
        let x2 = rx - 6.8;
        let y2 = ry + 17.5;
        if (
          shelterZone &&
          rx >= shelterZone.minX &&
          rx <= shelterZone.maxX
        ) {
          if (ry >= shelterZone.topY) return null;
          if (y2 > shelterZone.topY) {
            const ratio = Math.max(0, (shelterZone.topY - ry) / 17.5);
            x2 = rx - 6.8 * ratio;
            y2 = shelterZone.topY;
          }
        }
        return (
          <line
            key={i}
            x1={rx}
            y1={ry}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={0.72}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
};

export const WindBreeze: React.FC<{
  frame?: number;
  phase?: number;
  opacity?: number;
  color: string;
  direction?: 'left' | 'right';
  count?: number;
}> = ({
  frame = 0,
  phase,
  opacity = 1,
  color,
  direction = 'left',
  count = 5,
}) => {
  if (opacity <= 0.01) return null;
  const dir = direction === 'left' ? -1 : 1;

  return (
    <g opacity={opacity * 0.36}>
      {Array.from({ length: count }).map((_, i) => {
        const cycle = periodicCycle(frame, phase, 300, (i * 0.219) % 1);
        const startX = direction === 'left' ? 455 : 85;
        const wx = startX + dir * cycle * 360;
        const wy = 185 + i * 32 + Math.sin(cycle * Math.PI * 2 + i) * 5;
        const fade = Math.sin(cycle * Math.PI);
        const len = 34 + (i % 3) * 14;
        return (
          <path
            key={i}
            d={`M ${wx.toFixed(1)} ${wy.toFixed(1)} Q ${(wx + dir * len * 0.5).toFixed(1)} ${(wy - 3.5).toFixed(1)} ${(wx + dir * len).toFixed(1)} ${wy.toFixed(1)}`}
            fill="none"
            stroke={color}
            strokeWidth={1.05}
            strokeLinecap="round"
            opacity={fade}
          />
        );
      })}
    </g>
  );
};

export const NotificationRings: React.FC<{
  x?: number;
  y?: number;
  frame?: number;
  phase?: number;
  color: string;
  opacity?: number;
  maxRadius?: number;
}> = ({
  x = 0,
  y = 0,
  frame = 0,
  phase,
  color,
  opacity = 1,
  maxRadius = 26,
}) => {
  if (opacity <= 0.01) return null;
  const p1 = periodicCycle(frame, phase, 180, 0);
  const p2 = periodicCycle(frame, phase, 180, 0.5);

  return (
    <g transform={`translate(${x}, ${y})`} opacity={opacity}>
      <circle cx={0} cy={0} r={5} fill={color} opacity={0.12} />
      <circle
        cx={0}
        cy={0}
        r={4 + p1 * maxRadius}
        fill="none"
        stroke={color}
        strokeWidth={1.15}
        opacity={(1 - p1) * 0.72}
      />
      <circle
        cx={0}
        cy={0}
        r={4 + p2 * maxRadius}
        fill="none"
        stroke={color}
        strokeWidth={0.95}
        opacity={(1 - p2) * 0.55}
      />
    </g>
  );
};

export const FallingLeaves: React.FC<{
  frame?: number;
  phase?: number;
  opacity?: number;
  color: string;
  accentColor?: string;
  count?: number;
}> = ({ frame = 0, phase, opacity = 1, color, accentColor, count = 7 }) => {
  if (opacity <= 0.01) return null;
  return (
    <g opacity={opacity}>
      {Array.from({ length: count }).map((_, i) => {
        const cycle = periodicCycle(frame, phase, 450, (i * 0.167) % 1);
        const sway = Math.sin(cycle * Math.PI * 4 + i) * 14;
        const lx = 120 + ((i * 49) % 300) + sway;
        const ly = 165 + cycle * 180;
        const rot = cycle * 180 + i * 35;
        const isAccent = i === 0 && Boolean(accentColor);
        return (
          <ellipse
            key={i}
            cx={lx}
            cy={ly}
            rx={3.8}
            ry={1.6}
            fill={isAccent ? accentColor : color}
            opacity={(isAccent ? 0.78 : 0.36) * Math.sin(cycle * Math.PI)}
            transform={`rotate(${rot.toFixed(1)} ${lx.toFixed(1)} ${ly.toFixed(1)})`}
          />
        );
      })}
    </g>
  );
};

export const RisingSteam: React.FC<{
  x: number;
  y: number;
  frame?: number;
  phase?: number;
  color: string;
  opacity?: number;
  height?: number;
}> = ({ x, y, frame, phase, color, opacity = 1, height = 30 }) => {
  if (opacity <= 0.01) return null;
  const c1 = periodicCycle(frame, phase, 300, 0);
  const c2 = periodicCycle(frame, phase, 300, 0.5);

  const renderWisp = (cycle: number, key: number, xShift: number) => {
    const fade = Math.sin(cycle * Math.PI) * opacity;
    const driftX = Math.sin(cycle * Math.PI * 2 + key) * 3.0;
    const topY = y - 5 - cycle * height;
    return (
      <path
        key={key}
        d={`M ${x + xShift} ${y} Q ${x + xShift - 3.0 + driftX} ${(y + topY) * 0.5} ${x + xShift + 1.2 - driftX * 0.6} ${topY}`}
        fill="none"
        stroke={color}
        strokeWidth={1.12}
        strokeLinecap="round"
        opacity={fade * 0.72}
      />
    );
  };

  return (
    <g>
      {renderWisp(c1, 1, 0)}
      {renderWisp(c2, 2, 2.4)}
    </g>
  );
};

export const DistantBirds: React.FC<{
  progress?: number;
  driftProgress?: number;
  phase?: number;
  color: string;
  startX?: number;
  startY?: number;
  x?: number;
  y?: number;
  opacity?: number;
}> = ({
  progress,
  driftProgress,
  phase = 0,
  color,
  startX,
  startY,
  x,
  y,
  opacity = 1,
}) => {
  if (opacity <= 0.01) return null;
  const actualProgress = (progress ?? driftProgress ?? 0) * 0.5;
  const actualX = startX ?? x ?? 225;
  const actualY = startY ?? y ?? 198;
  const dx = actualProgress * 70;
  const dy = actualProgress * -14;
  const flap = Math.sin(phase * 0.56) * 2.0;

  return (
    <g opacity={opacity * 0.72}>
      <path
        d={`M ${actualX + dx} ${actualY + dy + flap} Q ${actualX + 7 + dx} ${actualY - 7 + dy} ${actualX + 14 + dx} ${actualY + dy} Q ${actualX + 21 + dx} ${actualY - 7 + dy} ${actualX + 28 + dx} ${actualY + dy + flap}`}
        fill="none"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <path
        d={`M ${actualX + 38 + dx * 0.88} ${actualY - 13 + dy * 0.85 - flap * 0.8} Q ${actualX + 43 + dx * 0.88} ${actualY - 19 + dy * 0.85} ${actualX + 48 + dx * 0.88} ${actualY - 13 + dy * 0.85} Q ${actualX + 53 + dx * 0.88} ${actualY - 19 + dy * 0.85} ${actualX + 58 + dx * 0.88} ${actualY - 13 + dy * 0.85 - flap * 0.8}`}
        fill="none"
        stroke={color}
        strokeWidth={1.0}
        strokeLinecap="round"
        opacity={0.68}
      />
    </g>
  );
};

export const CelestialBody: React.FC<{
  type?: 'sun' | 'hollow_sun' | 'crescent';
  x?: number;
  y?: number;
  cx?: number;
  cy?: number;
  radius?: number;
  r?: number;
  frame?: number;
  color: string;
  bgColor?: string;
  opacity?: number;
  progress?: number;
}> = ({
  type = 'sun',
  x,
  y,
  cx,
  cy,
  radius,
  r,
  frame = 0,
  color,
  opacity,
  progress,
}) => {
  const actualX = x ?? cx ?? 420;
  const actualY = y ?? cy ?? 125;
  const baseRadius = radius ?? r ?? 25;
  const breathCycle = periodicCycle(frame, undefined, 300, 0);
  const pulseMult = 1 + Math.sin(breathCycle * Math.PI * 2) * 0.028;
  const actualRadius = baseRadius * pulseMult;
  const actualOpacity = opacity ?? progress ?? 1;

  if (actualOpacity <= 0.01) return null;

  if (type === 'hollow_sun') {
    return (
      <g opacity={actualOpacity}>
        <circle
          cx={actualX}
          cy={actualY}
          r={actualRadius}
          fill="none"
          stroke={color}
          strokeWidth={2.4}
        />
        <circle
          cx={actualX}
          cy={actualY}
          r={actualRadius * 0.5}
          fill={color}
          opacity={0.28}
        />
      </g>
    );
  }

  if (type === 'crescent') {
    const rad = actualRadius;
    const d = `M ${actualX - rad * 0.2} ${actualY - rad * 0.92} A ${rad} ${rad} 0 1 0 ${actualX + rad * 0.88} ${actualY + rad * 0.42} A ${rad * 0.82} ${rad * 0.82} 0 1 1 ${actualX - rad * 0.2} ${actualY - rad * 0.92} Z`;
    return <path d={d} fill={color} opacity={actualOpacity} />;
  }

  return (
    <circle
      cx={actualX}
      cy={actualY}
      r={actualRadius}
      fill={color}
      opacity={actualOpacity * 0.88}
    />
  );
};
