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

export interface TravelerPoseWeights {
  lookUp: number;
  reachOut: number;
  give: number;
  holdUp: number;
  push: number;
}

export interface CloakedTravelerProps {
  x: number;
  y: number;
  scale?: number;
  facing?: 'left' | 'right';
  pose?: TravelerPose;
  poseWeights?: TravelerPoseWeights;
  leanDeg?: number;
  sitProgress?: number;
  gazeX?: number;
  gazeY?: number;
  hasLookTarget?: boolean;
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
  drawProgress?: number;
}

/**
 * Bộ giải động học ngược 2 xương (Analytic Two-Bone IK Solver — Định lý Cosin)
 */
function solveTwoBoneIK(
  rx: number,
  ry: number,
  tx: number,
  ty: number,
  L1: number,
  L2: number,
  bendDir: 1 | -1
): { jx: number; jy: number; ex: number; ey: number } {
  const dx = tx - rx;
  const dy = ty - ry;
  const rawDist = Math.hypot(dx, dy);
  const minDist = Math.abs(L1 - L2) + 0.05;
  const maxDist = L1 + L2 - 0.02;
  const d = Math.max(minDist, Math.min(maxDist, rawDist));

  const baseAngle = Math.atan2(dy, dx);
  const cosAngle1 = Math.max(
    -1,
    Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))
  );
  const angle1 = baseAngle + bendDir * Math.acos(cosAngle1);

  const jx = rx + L1 * Math.cos(angle1);
  const jy = ry + L1 * Math.sin(angle1);

  const reachScale = rawDist > maxDist && rawDist > 1e-4 ? maxDist / rawDist : 1;
  const ex = rx + dx * reachScale;
  const ey = ry + dy * reachScale;

  return { jx, jy, ex, ey };
}

export const CloakedTraveler: React.FC<CloakedTravelerProps> = ({
  x,
  y,
  scale = 1,
  facing = 'right',
  pose = 'stand',
  poseWeights,
  leanDeg = 0,
  sitProgress,
  gazeX = 0.35,
  gazeY = 0.05,
  hasLookTarget = false,
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
  drawProgress = 1,
}) => {
  const safeDraw = Math.max(0, Math.min(1, drawProgress));
  if (safeDraw <= 0.002 || opacity <= 0.005) {
    return null;
  }
  const isDrawing = safeDraw < 0.999;
  const smoothCos = (u: number) => {
    const c = Math.max(0, Math.min(1, u));
    return 0.5 - 0.5 * Math.cos(Math.PI * c);
  };
  const headStrokeP = isDrawing ? smoothCos(safeDraw / 0.58) : 1;
  const cloakStrokeP = isDrawing ? smoothCos((safeDraw - 0.12) / 0.68) : 1;
  const limbStrokeP = isDrawing ? smoothCos((safeDraw - 0.26) / 0.64) : 1;
  const washMult = isDrawing ? smoothCos((safeDraw - 0.5) / 0.5) : 1;
  const headInkGate = isDrawing ? smoothCos(headStrokeP / 0.22) : 1;
  const cloakInkGate = isDrawing ? smoothCos(cloakStrokeP / 0.22) : 1;
  const limbInkGate = isDrawing ? smoothCos(limbStrokeP / 0.22) : 1;

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
  const breathLiftY = breathSin * 0.14;
  const breathScaleY = 1 + breathSin * 0.0025;
  const hemFlutter = breezeCos * 0.75;
  const steamWave = Math.sin(breathPhase * 1.0);
  const steamLift = ((breathPhase / (Math.PI * 2)) % 1 + 1) % 1;

  const strokeScaleFactor = strokeWidth / 2.6;
  const effStroke =
    (1.35 * strokeScaleFactor) / Math.pow(Math.max(0.5, scale), 0.78);
  const limbMult = solidFill ? 0.84 : 0.92;
  const limbOpacity = solidFill ? 0.92 : 0.86;

  const isWalking = (pose === 'walk' || pose === 'push') && effectiveSit < 0.3;
  const act = isWalking ? walkActivity * (1 - effectiveSit) : 0;
  const stepSin = Math.sin(walkPhase);
  const stepBob = act * Math.abs(stepSin) * 0.48;
  const legSwing = act * stepSin * 4.4;
  const sitDrop = effectiveSit * 1.2;

  const wLookUp = poseWeights
    ? poseWeights.lookUp
    : pose === 'look_up'
      ? 1
      : 0;
  const wReachOut = poseWeights
    ? poseWeights.reachOut
    : pose === 'reach_out'
      ? 1
      : 0;
  const wGive = poseWeights ? poseWeights.give : pose === 'give' ? 1 : 0;
  const wHoldUp = poseWeights
    ? poseWeights.holdUp
    : pose === 'hold_up'
      ? 1
      : 0;
  const wPush = poseWeights ? poseWeights.push : pose === 'push' ? 1 : 0;
  const wSitSlump =
    effectiveSit * Math.max(0, Math.min(1, (leanDeg - 3) / 16));
  const deepSlump =
    effectiveSit * Math.max(0, Math.min(1, (leanDeg - 13) / 9));

  // === 1. CỘT SỐNG BÉZIER 2 TẦNG (nhìn ngang: khi deepSlump=1 ở dòng 3, Lữ khách gục đầu xuống mặt bàn phía trước +X, không cúi về phía người xem) ===
  const clampedLean = Math.max(-12, Math.min(26, leanDeg));
  const pelvisTiltDeg =
    clampedLean * (1 - effectiveSit * 0.88) * 0.28 +
    (1 - act) * breathSin * 0.1;
  const spineBendDeg = clampedLean - pelvisTiltDeg;
  const spineBendRad = (spineBendDeg * Math.PI) / 180;

  const midSpineShiftX = Math.sin(spineBendRad) * 3.6 + 3.2 * deepSlump;
  const shoulderShiftX = Math.sin(spineBendRad) * 7.8 + 4.8 * deepSlump;
  const shoulderDropY =
    (1 - Math.cos(spineBendRad)) * 5.2 +
    effectiveSit * 0.6 +
    8.6 * deepSlump;

  // Khi gục xuống bàn (deepSlump = 1), đầu hạ thấp xuống sát mặt bàn (headOffsetY ≈ -25.4, đáy đầu y ≈ -19.2 trùng khít mặt bàn!) và vươn về phía bàn (+X ≈ +10.6)
  const headOffsetX =
    shoulderShiftX +
    Math.sin(spineBendRad) * 2.8 +
    2.2 * deepSlump +
    2.4 * wPush -
    1.2 * wLookUp +
    (1 - act) * breezeCos * 0.14;
  const headOffsetY =
    -42.3 +
    shoulderDropY +
    (1 - Math.cos(spineBendRad)) * 3.4 +
    6.4 * deepSlump -
    0.7 * wLookUp -
    breathLiftY * 0.18;

  const backHemX =
    (solidFill ? -9.6 : -9.0) + 0.6 * effectiveSit + hemFlutter * 0.75;
  const frontHemX =
    (solidFill ? 7.6 : 7.8) + 1.0 * effectiveSit + hemFlutter * 0.35;
  const topBackX = (solidFill ? -3.3 : -3.8) + shoulderShiftX;
  const topFrontX = (solidFill ? 3.3 : 3.8) + shoulderShiftX;
  const topShoulderY = (solidFill ? -34.6 : -34.8) + shoulderDropY;

  const backCtrl1X = -7.8 + shoulderShiftX * 0.68;
  const backCtrl2X =
    -10.6 + midSpineShiftX * 0.35 + hemFlutter * 0.55;
  const frontCtrl1X = 8.2 + midSpineShiftX * 0.55;
  const frontCtrl2X = 7.0 + shoulderShiftX * 0.72;

  const cloakD = `M ${topBackX.toFixed(2)} ${topShoulderY.toFixed(2)} C ${backCtrl1X.toFixed(2)} ${(-26.2 + shoulderDropY * 0.65).toFixed(2)} ${backCtrl2X.toFixed(2)} -15.8 ${backHemX.toFixed(2)} -10.4 Q -1.2 -9.0 ${frontHemX.toFixed(2)} -10.8 C ${frontCtrl1X.toFixed(2)} -16.8 ${frontCtrl2X.toFixed(2)} ${(-26.4 + shoulderDropY * 0.65).toFixed(2)} ${topFrontX.toFixed(2)} ${topShoulderY.toFixed(2)} Q ${shoulderShiftX.toFixed(2)} ${(topShoulderY - 1.0).toFixed(2)} ${topBackX.toFixed(2)} ${topShoulderY.toFixed(2)} Z`;

  // === 2. CHÂN 2-BONE ANALYTIC IK ===
  const thighLen = 5.7 + 2.4 * effectiveSit;
  const calfLen = 5.7 + 3.8 * effectiveSit;
  const hipY = -11.0 - stepBob + sitDrop;

  const backStepLift = act * Math.max(0, -stepSin) * 1.25;
  const frontStepLift = act * Math.max(0, stepSin) * 1.25;

  const backHipX = -1.8 + 2.6 * effectiveSit;
  const backFootTargetX = -1.8 + legSwing + 9.2 * effectiveSit;
  const backFootTargetY = -backStepLift;
  const backLegIK = solveTwoBoneIK(
    backHipX,
    hipY,
    backFootTargetX,
    backFootTargetY,
    thighLen,
    calfLen,
    -1
  );

  const frontHipX = 1.9 + 1.2 * effectiveSit;
  const frontFootTargetX = 1.9 - legSwing + 7.4 * effectiveSit;
  const frontFootTargetY = -frontStepLift;
  const frontLegIK = solveTwoBoneIK(
    frontHipX,
    hipY,
    frontFootTargetX,
    frontFootTargetY,
    thighLen,
    calfLen,
    -1
  );

  // === 3. TAY 2-BONE ANALYTIC IK (khi ngồi vào bàn, tay đặt lên mặt bàn/bàn phím; khi gục, cẳng tay trải trên mặt bàn đỡ đầu) ===
  const shoulderX = 3.0 + shoulderShiftX * 0.88;
  const shoulderY = -27.8 + shoulderDropY * 0.85;
  const upperArmLen = 7.6;
  const forearmLen = 8.4;

  // === 4. NHÌN NGANG (SIDE PROFILE): MẮT Ở MÉP TRƯỚC MẶT (+X) & LÁ TRÀ TRÊN ĐỈNH ĐẦU ===
  const clampedGazeX = Math.max(-0.8, Math.min(1.4, gazeX));
  const clampedGazeY = Math.max(-1.0, Math.min(1.2, gazeY));
  // Ở góc nhìn ngang (facing right -> +X là phía trước mặt), mắt nằm sát mép phải của khuôn mặt (headOffsetX + 3.8..4.8), tuyệt đối không nằm giữa đầu!
  const eyeCenterX = headOffsetX + 3.65 + clampedGazeX * 0.85;
  const eyeCenterY =
    headOffsetY +
    0.25 +
    deepSlump * (hasLookTarget ? -0.35 : 0.95) +
    clampedGazeY * 0.75;
  const isTiredDroopEye = deepSlump > 0.55 && !hasLookTarget;

  // Lá trà trên đỉnh đầu: ngồi thẳng dựng đứng (~4°); gục xuống bàn thì rủ về trước (~68°); khi đang gục mà liếc nhìn hoá đơn thì nhổm lên (~24°)
  const leafBaseDeg =
    clampedLean <= 2.5
      ? 4
      : deepSlump > 0.55
        ? hasLookTarget
          ? 24
          : 68
        : 16 + wSitSlump * 24;
  const leafDeg = leafBaseDeg + breezeCos * 1.6;
  const leafRootX = headOffsetX + 0.2;
  const leafRootY = headOffsetY - (solidFill ? 6.45 : 6.2);

  const limbDrawProps = isDrawing
    ? {
        pathLength: 1000,
        strokeDasharray: '1000',
        strokeDashoffset: (1000 * (1 - limbStrokeP)).toFixed(1),
      }
    : {};
  const cloakDrawProps = isDrawing
    ? {
        pathLength: 1000,
        strokeDasharray: '1000',
        strokeDashoffset: (1000 * (1 - cloakStrokeP)).toFixed(1),
      }
    : {};
  const headDrawProps = isDrawing
    ? {
        pathLength: 1000,
        strokeDasharray: '1000',
        strokeDashoffset: (1000 * (1 - headStrokeP)).toFixed(1),
      }
    : {};

  return (
    <g
      transform={`translate(${x}, ${y}) scale(${dir * scale}, ${scale})`}
      style={{ opacity }}
    >
      {/* Hai chân giải bằng 2-Bone IK: Đùi -> Đầu gối -> Bàn chân */}
      {limbStrokeP > 0.002 && (
        <>
          <path
            d={`M ${backHipX.toFixed(2)} ${hipY.toFixed(2)} L ${backLegIK.jx.toFixed(2)} ${backLegIK.jy.toFixed(2)} L ${backLegIK.ex.toFixed(2)} ${backLegIK.ey.toFixed(2)}`}
            fill="none"
            stroke={color}
            strokeWidth={effStroke * (limbMult * 0.92)}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={(solidFill ? 0.8 : 0.76) * limbInkGate}
            {...limbDrawProps}
          />
          <path
            d={`M ${frontHipX.toFixed(2)} ${hipY.toFixed(2)} L ${frontLegIK.jx.toFixed(2)} ${frontLegIK.jy.toFixed(2)} L ${frontLegIK.ex.toFixed(2)} ${frontLegIK.ey.toFixed(2)}`}
            fill="none"
            stroke={color}
            strokeWidth={effStroke * limbMult}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={limbOpacity * limbInkGate}
            {...limbDrawProps}
          />
        </>
      )}

      <g
        transform={`translate(0, ${(sitDrop - stepBob - breathLiftY * 0.35).toFixed(2)}) rotate(${pelvisTiltDeg.toFixed(2)} 0 -11) scale(1, ${breathScaleY.toFixed(4)})`}
      >
        {solidFill ? (
          <>
            {washMult > 0.005 && (
              <path
                d={cloakD}
                fill={bgColor}
                stroke="none"
                opacity={washMult}
              />
            )}
            <path
              d={cloakD}
              fill={color}
              fillOpacity={washMult}
              stroke={isDrawing ? color : 'none'}
              strokeWidth={isDrawing ? effStroke * 0.92 : 0}
              strokeOpacity={isDrawing ? 0.88 * cloakInkGate : 0}
              strokeLinecap="round"
              strokeLinejoin="round"
              {...cloakDrawProps}
            />
            {washMult > 0.05 && (
              <path
                d={`M ${(-1.2 + shoulderShiftX * 0.75).toFixed(2)} ${(-30.5 + shoulderDropY * 0.8).toFixed(2)} C ${(-2.8 + midSpineShiftX * 0.45).toFixed(2)} -22.8 ${(-3.5 + hemFlutter * 0.35).toFixed(2)} -16.2 ${(-2.6 + hemFlutter * 0.45).toFixed(2)} -10.8`}
                fill="none"
                stroke={bgColor}
                strokeWidth={effStroke * 0.44}
                strokeLinecap="round"
                opacity={0.45 * washMult}
              />
            )}
            {washMult > 0.005 && (
              <circle
                cx={headOffsetX}
                cy={headOffsetY - 0.5}
                r={5.95}
                fill={bgColor}
                stroke="none"
                opacity={washMult}
              />
            )}
            <circle
              cx={headOffsetX}
              cy={headOffsetY - 0.5}
              r={5.95}
              fill={color}
              fillOpacity={washMult}
              stroke={isDrawing ? color : 'none'}
              strokeWidth={isDrawing ? effStroke * 0.92 : 0}
              strokeOpacity={isDrawing ? 0.88 * headInkGate : 0}
              {...headDrawProps}
            />
          </>
        ) : (
          <>
            {washMult > 0.005 && (
              <path
                d={cloakD}
                fill={bgColor}
                stroke="none"
                opacity={washMult}
              />
            )}
            <path
              d={cloakD}
              fill={color}
              fillOpacity={0.12 * washMult}
              stroke={color}
              strokeWidth={effStroke}
              strokeOpacity={0.88 * cloakInkGate}
              strokeLinecap="round"
              strokeLinejoin="round"
              {...cloakDrawProps}
            />
            {washMult > 0.05 && (
              <path
                d={`M ${(-1.4 + shoulderShiftX * 0.75).toFixed(2)} ${(-31.2 + shoulderDropY * 0.8).toFixed(2)} C ${(-3.0 + midSpineShiftX * 0.45).toFixed(2)} -23.0 ${(-3.8 + hemFlutter * 0.35).toFixed(2)} -16.0 ${(-2.8 + hemFlutter * 0.45).toFixed(2)} -10.8`}
                fill="none"
                stroke={color}
                strokeWidth={effStroke * 0.58}
                strokeLinecap="round"
                opacity={0.42 * washMult}
              />
            )}

            {/* Cánh tay làm việc / gối lên mặt bàn khi ngồi vào bàn (khuỷu tay và cẳng tay nằm trên mặt bàn y ≈ -19.6, không thò xuống gầm bàn) */}
            {limbStrokeP > 0.002 && effectiveSit > 0.4 && (
              <path
                d={(() => {
                  const elbowX = shoulderX + 3.2 + deepSlump * 1.4;
                  const elbowY = -20.2 + deepSlump * 0.6;
                  const handX = 13.8 + deepSlump * 2.4;
                  const handY = -19.8 - breathSin * 0.06;
                  return `M ${shoulderX.toFixed(2)} ${shoulderY.toFixed(2)} L ${elbowX.toFixed(2)} ${elbowY.toFixed(2)} L ${handX.toFixed(2)} ${handY.toFixed(2)}`;
                })()}
                fill="none"
                stroke={color}
                strokeWidth={effStroke * (limbMult * 0.92)}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={limbOpacity * effectiveSit * limbInkGate}
                {...limbDrawProps}
              />
            )}

            {washMult > 0.005 && (
              <circle
                cx={headOffsetX}
                cy={headOffsetY}
                r={6.2}
                fill={bgColor}
                opacity={washMult}
              />
            )}
            <circle
              cx={headOffsetX}
              cy={headOffsetY}
              r={6.2}
              fill={color}
              fillOpacity={0.13 * washMult}
              stroke={color}
              strokeWidth={effStroke}
              strokeOpacity={0.88 * headInkGate}
              {...headDrawProps}
            />

            {/* Nét tóc gợi hướng đầu nhìn ngang về phía trước (+X) */}
            {headStrokeP > 0.3 && (
              <path
                d={`M ${(headOffsetX - 3.6).toFixed(2)} ${(headOffsetY - 4.2).toFixed(2)} Q ${(headOffsetX + 0.6).toFixed(2)} ${(headOffsetY - 5.6).toFixed(2)} ${(headOffsetX + 4.2).toFixed(2)} ${(headOffsetY - 3.4).toFixed(2)}`}
                fill="none"
                stroke={color}
                strokeWidth={effStroke * 0.48}
                strokeLinecap="round"
                opacity={0.52 * headInkGate}
              />
            )}

            {/* Lá trà trên đỉnh đầu Lữ khách (dựng đứng khi tỉnh táo, rủ về phía bàn khi gục mỏi) */}
            {headStrokeP > 0.25 && (
              <g
                transform={`rotate(${leafDeg.toFixed(1)} ${leafRootX.toFixed(2)} ${leafRootY.toFixed(2)})`}
                opacity={headInkGate}
              >
                <path
                  d={`M ${leafRootX.toFixed(2)} ${leafRootY.toFixed(2)} C ${(leafRootX - 0.5).toFixed(2)} ${(leafRootY - 2.3).toFixed(2)} ${(leafRootX + 0.8).toFixed(2)} ${(leafRootY - 4.4).toFixed(2)} ${(leafRootX + 2.6).toFixed(2)} ${(leafRootY - 5.0).toFixed(2)} C ${(leafRootX + 2.9).toFixed(2)} ${(leafRootY - 2.7).toFixed(2)} ${(leafRootX + 1.8).toFixed(2)} ${(leafRootY - 0.9).toFixed(2)} ${leafRootX.toFixed(2)} ${leafRootY.toFixed(2)} Z`}
                  fill={bgColor}
                  stroke="#4E5840"
                  strokeWidth={effStroke * 0.68}
                  strokeLinejoin="round"
                />
                <path
                  d={`M ${(leafRootX + 0.15).toFixed(2)} ${(leafRootY - 0.25).toFixed(2)} Q ${(leafRootX + 1.1).toFixed(2)} ${(leafRootY - 2.4).toFixed(2)} ${(leafRootX + 2.3).toFixed(2)} ${(leafRootY - 4.5).toFixed(2)}`}
                  fill="none"
                  stroke="#4E5840"
                  strokeWidth={effStroke * 0.42}
                  strokeLinecap="round"
                  opacity={0.75}
                />
              </g>
            )}

            {/* Ánh nhìn ngang (Side-Profile Eye nằm sát mép trước mặt +X, hướng theo nhin_theo) */}
            {headStrokeP > 0.35 && (
              <g opacity={headInkGate}>
                {isTiredDroopEye ? (
                  <path
                    d={`M ${(eyeCenterX - 1.05).toFixed(2)} ${(eyeCenterY + 0.2).toFixed(2)} Q ${eyeCenterX.toFixed(2)} ${(eyeCenterY + 0.85).toFixed(2)} ${(eyeCenterX + 0.95).toFixed(2)} ${(eyeCenterY + 0.35).toFixed(2)}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={effStroke * 0.72}
                    strokeLinecap="round"
                  />
                ) : (
                  <>
                    {hasLookTarget && deepSlump > 0.35 && (
                      <path
                        d={`M ${(eyeCenterX - 0.95).toFixed(2)} ${(eyeCenterY - 1.55).toFixed(2)} Q ${eyeCenterX.toFixed(2)} ${(eyeCenterY - 2.05).toFixed(2)} ${(eyeCenterX + 0.95).toFixed(2)} ${(eyeCenterY - 1.45).toFixed(2)}`}
                        fill="none"
                        stroke={color}
                        strokeWidth={effStroke * 0.55}
                        strokeLinecap="round"
                        opacity={0.82}
                      />
                    )}
                    <ellipse
                      cx={eyeCenterX.toFixed(2)}
                      cy={eyeCenterY.toFixed(2)}
                      rx={hasLookTarget && deepSlump > 0.35 ? 0.96 : 0.82}
                      ry={hasLookTarget && deepSlump > 0.35 ? 1.28 : 1.1}
                      fill={color}
                      opacity={0.92}
                    />
                    <circle
                      cx={(eyeCenterX + 0.24).toFixed(2)}
                      cy={(eyeCenterY - 0.34).toFixed(2)}
                      r={0.28}
                      fill={bgColor}
                    />
                  </>
                )}
              </g>
            )}
          </>
        )}

        {limbStrokeP > 0.002 &&
          effectiveSit <= 0.4 &&
          (
            [
              {
                key: 'reach_out',
                weight: wReachOut,
                target: [
                  16.8 + shoulderShiftX * 0.5,
                  -28.5 + shoulderDropY * 0.5 - breathSin * 0.12,
                ],
              },
              {
                key: 'give',
                weight: wGive,
                target: [
                  16.6 + shoulderShiftX * 0.5,
                  -23.6 + shoulderDropY * 0.5 - breathSin * 0.12,
                ],
              },
              {
                key: 'hold_up',
                weight: wHoldUp,
                target: [
                  13.4 + shoulderShiftX * 0.4,
                  -39.8 + shoulderDropY * 0.4 - breathSin * 0.12,
                ],
              },
              {
                key: 'push',
                weight: wPush,
                target: [
                  17.8 + shoulderShiftX * 0.5,
                  -31.5 + shoulderDropY * 0.5,
                ],
              },
            ] as const
          ).map(({ key, weight, target }) => {
            if (weight <= 0.01) return null;
            const w = Math.max(0, Math.min(1, weight));
            const restX = shoulderX + 2.2;
            const restY = shoulderY + 9.5;
            const tx = restX + (target[0] - restX) * w;
            const ty = restY + (target[1] - restY) * w;
            const armIK = solveTwoBoneIK(
              shoulderX,
              shoulderY,
              tx,
              ty,
              upperArmLen,
              forearmLen,
              1
            );
            return (
              <path
                key={key}
                d={`M ${shoulderX.toFixed(2)} ${shoulderY.toFixed(2)} L ${armIK.jx.toFixed(2)} ${armIK.jy.toFixed(2)} L ${armIK.ex.toFixed(2)} ${armIK.ey.toFixed(2)}`}
                fill="none"
                stroke={color}
                strokeWidth={effStroke * (limbMult * 0.92)}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={limbOpacity * w * limbInkGate}
                {...limbDrawProps}
              />
            );
          })}
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
            opacity={0.48 + 0.22 * Math.sin(steamLift * 0.01 + steamLift * Math.PI)}
          />
        </g>
      )}
    </g>
  );
};
