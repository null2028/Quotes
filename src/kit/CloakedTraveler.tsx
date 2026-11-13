import React from 'react';

export type TravelerPose =
  | 'walk'
  | 'stand'
  | 'push'
  | 'sit_lean'
  | 'look_up'
  | 'reach_out'
  | 'hold_up'
  | 'give';

export interface CloakedTravelerProps {
  x: number;
  y: number;
  scale?: number;
  facing?: 'left' | 'right';
  pose?: TravelerPose;
  leanDeg?: number;
  sitProgress?: number;
  walkPhase?: number;
  walkActivity?: number;
  breathPhase?: number;
  color: string;
  accentColor?: string;
  bgColor?: string;
  showTeaCup?: boolean | number;
  solidFill?: boolean;
  strokeWidth?: number;
  opacity?: number;
}

export const CloakedTraveler: React.FC<CloakedTravelerProps> = ({
  x,
  y,
  scale = 1,
  facing = 'right',
  pose = 'stand',
  leanDeg = 0,
  sitProgress,
  walkPhase = 0,
  walkActivity = 1,
  breathPhase = 0,
  color,
  accentColor = '#CE472E',
  bgColor = '#F1EAE0',
  showTeaCup = false,
  solidFill = false,
  strokeWidth = 2.6,
  opacity = 1,
}) => {
  const dir = facing === 'right' ? 1 : -1;
  const effectiveSit =
    sitProgress !== undefined
      ? Math.max(0, Math.min(1, sitProgress))
      : pose === 'sit_lean'
        ? 1
        : 0;

  const teaCupOpacity =
    typeof showTeaCup === 'number'
      ? Math.max(0, Math.min(1, showTeaCup))
      : showTeaCup
        ? 1
        : 0;

  const breathSin = Math.sin(breathPhase);
  const breezeCos = Math.cos(breathPhase * 0.5);
  const breathLiftY = breathSin * 0.55;
  const breathScaleY = 1 + breathSin * 0.012;
  const hemFlutter = breezeCos * 1.15;
  const steamWave = Math.sin(breathPhase * 1.0);
  const steamLift = ((breathPhase / (Math.PI * 2)) % 1 + 1) % 1;

  const strokeScaleFactor = strokeWidth / 2.6;
  const effStroke =
    (1.35 * strokeScaleFactor) / Math.pow(Math.max(0.5, scale), 0.78);
  const limbMult = solidFill ? 0.84 : 0.92;
  const limbOpacity = solidFill ? 0.92 : 0.86;

  if (pose === 'sit_lean' && sitProgress === undefined) {
    const sitCloakD = `M ${(-7.2 + hemFlutter * 0.45).toFixed(2)} -1.2 C -7.8 -9.5 -6.6 -17.5 -4.2 -21.5 Q 0.5 -22.2 3.2 -19.5 C 6.8 -15.5 8.2 -8.2 ${(7.5 + hemFlutter * 0.3).toFixed(2)} -1.2 Q 0 -0.4 ${(-7.2 + hemFlutter * 0.45).toFixed(2)} -1.2 Z`;
    return (
      <g
        transform={`translate(${x}, ${y}) scale(${dir * scale}, ${scale})`}
        style={{ opacity }}
      >
        <path
          d="M 3 -4.2 Q 11 -3.2 19.5 -1.2"
          fill="none"
          stroke={color}
          strokeWidth={effStroke * limbMult}
          strokeLinecap="round"
          opacity={limbOpacity}
        />
        <path
          d="M 2 -5.2 Q 8.5 -3.8 14.5 -1.2"
          fill="none"
          stroke={color}
          strokeWidth={effStroke * (limbMult * 0.9)}
          strokeLinecap="round"
          opacity={solidFill ? 0.78 : 0.72}
        />
        <g
          transform={`translate(0, ${(-breathLiftY * 0.7).toFixed(2)}) scale(1, ${breathScaleY.toFixed(4)})`}
        >
          {solidFill ? (
            <>
              <path d={sitCloakD} fill={color} stroke="none" />
              <path
                d="M -2.0 -18.2 Q 1.2 -11.5 2.4 -3.2"
                fill="none"
                stroke={bgColor}
                strokeWidth={effStroke * 0.45}
                strokeLinecap="round"
                opacity={0.44}
              />
              <circle
                cx={-1}
                cy={-29.0 - breathLiftY * 0.35}
                r={5.9}
                fill={color}
                stroke="none"
              />
            </>
          ) : (
            <>
              <path d={sitCloakD} fill={bgColor} stroke="none" />
              <path
                d={sitCloakD}
                fill={color}
                fillOpacity={0.12}
                stroke={color}
                strokeWidth={effStroke}
                strokeOpacity={0.88}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M -2.2 -18.5 Q 1.2 -11.5 2.5 -3.0"
                fill="none"
                stroke={color}
                strokeWidth={effStroke * 0.58}
                strokeLinecap="round"
                opacity={0.42}
              />
              <circle
                cx={-1}
                cy={-28.2 - breathLiftY * 0.35}
                r={6.2}
                fill={bgColor}
              />
              <circle
                cx={-1}
                cy={-28.2 - breathLiftY * 0.35}
                r={6.2}
                fill={color}
                fillOpacity={0.13}
                stroke={color}
                strokeWidth={effStroke}
                strokeOpacity={0.88}
              />
            </>
          )}
        </g>
        {teaCupOpacity > 0.01 && (
          <g opacity={teaCupOpacity}>
            <path
              d="M 21.5 -5.5 Q 22.1 -1.2 23.0 -0.5 L 27.0 -0.5 Q 27.9 -1.2 28.5 -5.5 Z"
              fill={bgColor}
            />
            <path
              d="M 21.5 -5.5 Q 22.1 -1.2 23.0 -0.5 L 27.0 -0.5 Q 27.9 -1.2 28.5 -5.5 Z"
              fill={accentColor}
              fillOpacity={solidFill ? 0.95 : 0.22}
              stroke={accentColor}
              strokeWidth={effStroke * (solidFill ? 0.4 : 0.82)}
              strokeLinejoin="round"
            />
            <path
              d={`M 25 -8 Q ${(23.6 + steamWave * 1.5).toFixed(2)} -12.0 ${(25.4 - steamWave * 1.1).toFixed(2)} ${(-15.5 - steamLift * 2.4).toFixed(2)} Q ${(26.8 + steamWave * 1.3).toFixed(2)} -18.5 ${(24.8 - steamWave * 0.8).toFixed(2)} ${(-21.2 - steamLift * 2.8).toFixed(2)}`}
              fill="none"
              stroke={accentColor}
              strokeWidth={effStroke * 0.52}
              strokeLinecap="round"
              opacity={0.48 + 0.22 * Math.sin(steamLift * Math.PI)}
            />
          </g>
        )}
      </g>
    );
  }

  const isWalking = (pose === 'walk' || pose === 'push') && effectiveSit < 0.3;
  const act = isWalking ? walkActivity * (1 - effectiveSit) : 0;
  const stepSin = Math.sin(walkPhase);
  const stepBob = act * Math.abs(stepSin) * 1.5;
  const legSwing = act * stepSin * 4.4;
  const sitDrop = effectiveSit * 11.5;

  const headOffsetX =
    (pose === 'push' ? 3.2 : pose === 'look_up' ? -1.1 : 0) +
    (1 - act) * breezeCos * 0.22;
  const headOffsetY =
    (pose === 'look_up' ? -43.0 : -42.3) - breathLiftY * 0.42;

  const backHemX = (solidFill ? -9.8 : -9.2) + hemFlutter * 0.85;
  const frontHemX = (solidFill ? 7.5 : 7.8) + hemFlutter * 0.38;
  const cloakD = solidFill
    ? `M -3.3 -34.6 C -7.8 -26.2 ${(-10.8 + hemFlutter * 0.65).toFixed(2)} -15.8 ${backHemX.toFixed(2)} -10.4 Q -1.8 -8.9 ${frontHemX.toFixed(2)} -10.8 C 8.3 -16.8 7.0 -26.4 3.3 -34.6 Q 0 -35.6 -3.3 -34.6 Z`
    : `M -3.8 -34.8 C -8.6 -26.0 ${(-10.8 + hemFlutter * 0.65).toFixed(2)} -16.2 ${backHemX.toFixed(2)} -10.5 Q -1.2 -9.2 ${frontHemX.toFixed(2)} -10.8 C 8.8 -16.8 7.6 -26.2 3.8 -34.8 Q 0 -35.8 -3.8 -34.8 Z`;

  return (
    <g
      transform={`translate(${x}, ${y}) scale(${dir * scale}, ${scale})`}
      style={{ opacity }}
    >
      {effectiveSit < 0.55 ? (
        <>
          <path
            d={`M -2.0 ${(-11.0 - stepBob + sitDrop).toFixed(1)} Q ${(-1.8 + legSwing * 0.45).toFixed(1)} ${(-5.5 + sitDrop * 0.5).toFixed(1)} ${(-2.0 + legSwing).toFixed(1)} 0`}
            fill="none"
            stroke={color}
            strokeWidth={effStroke * limbMult}
            strokeLinecap="round"
            opacity={limbOpacity}
          />
          <path
            d={`M 2.1 ${(-11.0 - stepBob + sitDrop).toFixed(1)} Q ${(2.3 - legSwing * 0.45).toFixed(1)} ${(-5.5 + sitDrop * 0.5).toFixed(1)} ${(2.1 - legSwing).toFixed(1)} 0`}
            fill="none"
            stroke={color}
            strokeWidth={effStroke * (limbMult * 0.92)}
            strokeLinecap="round"
            opacity={solidFill ? 0.8 : 0.76}
          />
        </>
      ) : (
        <>
          <path
            d="M 2 -3.5 Q 10.5 -2.5 18.5 -1.1"
            fill="none"
            stroke={color}
            strokeWidth={effStroke * limbMult}
            strokeLinecap="round"
            opacity={limbOpacity}
          />
          <path
            d="M 1 -4.5 Q 7.8 -3.2 13.8 -1.1"
            fill="none"
            stroke={color}
            strokeWidth={effStroke * (limbMult * 0.9)}
            strokeLinecap="round"
            opacity={solidFill ? 0.78 : 0.72}
          />
        </>
      )}

      <g
        transform={`translate(0, ${(sitDrop - stepBob - breathLiftY * 0.55).toFixed(2)}) rotate(${(leanDeg + (1 - act) * breathSin * 0.45).toFixed(2)} 0 -11) scale(1, ${breathScaleY.toFixed(4)})`}
      >
        {solidFill ? (
          <>
            <path d={cloakD} fill={color} stroke="none" />
            <path
              d={`M -1.2 -30.5 C -2.8 -22.8 ${(-3.5 + hemFlutter * 0.35).toFixed(2)} -16.2 ${(-2.6 + hemFlutter * 0.45).toFixed(2)} -10.8`}
              fill="none"
              stroke={bgColor}
              strokeWidth={effStroke * 0.44}
              strokeLinecap="round"
              opacity={0.45}
            />
            <circle
              cx={headOffsetX}
              cy={headOffsetY - 0.5}
              r={5.95}
              fill={color}
              stroke="none"
            />
          </>
        ) : (
          <>
            <path d={cloakD} fill={bgColor} stroke="none" />
            <path
              d={cloakD}
              fill={color}
              fillOpacity={0.12}
              stroke={color}
              strokeWidth={effStroke}
              strokeOpacity={0.88}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={`M -1.4 -31.2 C -3.0 -23.0 ${(-3.8 + hemFlutter * 0.35).toFixed(2)} -16.0 ${(-2.8 + hemFlutter * 0.45).toFixed(2)} -10.8`}
              fill="none"
              stroke={color}
              strokeWidth={effStroke * 0.58}
              strokeLinecap="round"
              opacity={0.42}
            />

            <circle cx={headOffsetX} cy={headOffsetY} r={6.2} fill={bgColor} />
            <circle
              cx={headOffsetX}
              cy={headOffsetY}
              r={6.2}
              fill={color}
              fillOpacity={0.13}
              stroke={color}
              strokeWidth={effStroke}
              strokeOpacity={0.88}
            />
          </>
        )}

        {(pose === 'reach_out' || pose === 'give') && (
          <path
            d={`M 3.4 -27.5 Q 10.8 -26.5 17.5 ${(pose === 'give' ? -23.8 : -29.2) - breathSin * 0.5}`}
            fill="none"
            stroke={color}
            strokeWidth={effStroke * (limbMult * 0.92)}
            strokeLinecap="round"
            opacity={limbOpacity}
          />
        )}
        {pose === 'hold_up' && (
          <path
            d={`M 3.2 -28.5 Q 9.2 -34.2 13.6 ${-41.0 - breathSin * 0.5}`}
            fill="none"
            stroke={color}
            strokeWidth={effStroke * (limbMult * 0.92)}
            strokeLinecap="round"
            opacity={limbOpacity}
          />
        )}
        {pose === 'push' && (
          <path
            d="M 4.8 -29.5 Q 12.2 -32.2 19.2 -33.5"
            fill="none"
            stroke={color}
            strokeWidth={effStroke * (limbMult * 0.92)}
            strokeLinecap="round"
            opacity={limbOpacity}
          />
        )}
      </g>

      {teaCupOpacity > 0.01 && (
        <g opacity={teaCupOpacity}>
          <path
            d="M 21.5 -5.5 Q 22.1 -1.2 23.0 -0.5 L 27.0 -0.5 Q 27.9 -1.2 28.5 -5.5 Z"
            fill={bgColor}
          />
          <path
            d="M 21.5 -5.5 Q 22.1 -1.2 23.0 -0.5 L 27.0 -0.5 Q 27.9 -1.2 28.5 -5.5 Z"
            fill={accentColor}
            fillOpacity={solidFill ? 0.95 : 0.22}
            stroke={accentColor}
            strokeWidth={effStroke * (solidFill ? 0.4 : 0.82)}
            strokeLinejoin="round"
          />
          <path
            d={`M 25 -8 Q ${(23.6 + steamWave * 1.5).toFixed(2)} -12.0 ${(25.4 - steamWave * 1.1).toFixed(2)} ${(-15.5 - steamLift * 2.4).toFixed(2)} Q ${(26.8 + steamWave * 1.3).toFixed(2)} -18.5 ${(24.8 - steamWave * 0.8).toFixed(2)} ${(-21.2 - steamLift * 2.8).toFixed(2)}`}
            fill="none"
            stroke={accentColor}
            strokeWidth={effStroke * 0.52}
            strokeLinecap="round"
            opacity={0.48 + 0.22 * Math.sin(steamLift * Math.PI)}
          />
        </g>
      )}
    </g>
  );
};
