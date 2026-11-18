import React from 'react';
import {
  INK_EFF_STROKE_FACTOR,
  INK_SCALE_POWER,
  INK_BASE_STROKE_WIDTH,
  INK_LIMB_MULT_SOLID,
  INK_LIMB_MULT_OUTLINE,
  INK_LIMB_OPACITY_SOLID,
  INK_LIMB_OPACITY_OUTLINE,
  INK_BACK_LEG_OPACITY_SOLID,
  INK_BACK_LEG_OPACITY_OUTLINE,
  INK_CLOAK_STROKE_MULT_SOLID,
  INK_STROKE_OPACITY,
  INK_CLOAK_FILL_OPACITY_OUTLINE,
  INK_HEAD_FILL_OPACITY_OUTLINE,
  INK_FOLD_STROKE_MULT_SOLID,
  INK_FOLD_OPACITY_SOLID,
  INK_FOLD_STROKE_MULT_OUTLINE,
  INK_FOLD_OPACITY_OUTLINE,
  INK_UPPER_ARM_LEN,
  INK_FOREARM_LEN,
  INK_HEAD_RADIUS_SOLID,
  INK_HEAD_RADIUS_OUTLINE,
  INK_MAX_LEAN_DEG_STAND,
  INK_MAX_LEAN_DEG_SLUMP,
  INK_SIT_SLUMP_DIVISOR,
} from '../stage/stageConstants';

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
  /** Hiện mắt, lá trà, nét tóc — mặc định TẮT (Lữ khách bóng mực đen đặc gốc) */
  showFace?: boolean;
  walkPhase?: number;
  walkActivity?: number;
  breathPhase?: number;
  color: string;
  accentColor?: string;
  bgColor?: string;
  showTeaCup?: boolean | number;
  teaCupRed?: boolean;
  role?: 'lu_khach' | 'nguoi_b';
  ponytail?: boolean;
  solidFill?: boolean;
  strokeWidth?: number;
  opacity?: number;
  drawProgress?: number;
}

/**
 * Bộ giải động học ngược 2 xương (Analytic Two-Bone IK Solver — Định lý Cosin)
 * Tham chiếu chuẩn Rive IK Constraint & Unity Two-Bone IK:
 * - Giữ nguyên độ dài xương L1, L2 không bị co giãn khi chuyển tư thế.
 * - bendDir = -1: khớp giữa (đầu gối) gập về phía trước (+X).
 * - bendDir = +1: khớp giữa (khuỷu tay) gập xuống dưới (+Y) tự nhiên.
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
  showFace = false,
  walkPhase = 0,
  walkActivity = 1,
  breathPhase = 0,
  color,
  accentColor = '#CE472E',
  bgColor = '#F1EAE0',
  showTeaCup = false,
  teaCupRed = false,
  role = 'lu_khach',
  ponytail = false,
  solidFill = false,
  strokeWidth = INK_BASE_STROKE_WIDTH,
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

  const strokeScaleFactor = strokeWidth / INK_BASE_STROKE_WIDTH;
  const effStroke =
    (INK_EFF_STROKE_FACTOR * strokeScaleFactor) / Math.pow(Math.max(0.5, scale), INK_SCALE_POWER);
  const limbMult = solidFill ? INK_LIMB_MULT_SOLID : INK_LIMB_MULT_OUTLINE;
  const limbOpacity = solidFill ? INK_LIMB_OPACITY_SOLID : INK_LIMB_OPACITY_OUTLINE;

  const isWalking = (pose === 'walk' || pose === 'push') && effectiveSit < 0.3;
  const act = isWalking ? walkActivity * (1 - effectiveSit) : 0;
  const stepSin = Math.sin(walkPhase);
  const stepBob = act * Math.abs(stepSin) * 0.48;
  const legSwing = act * stepSin * 4.4;
  // Khi ngồi ghế (effectiveSit = 1), hông chỉ hạ nhẹ 1.2px để đặt phẳng trên mặt ghế (y ≈ -10.5)
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
    effectiveSit * Math.max(0, Math.min(1, (leanDeg - 3) / INK_SIT_SLUMP_DIVISOR));
  // deepSlump: khả năng mới — gục đầu xuống bàn khi leanDeg > 13 và đang ngồi
  const deepSlump =
    effectiveSit * Math.max(0, Math.min(1, (leanDeg - 13) / 9));

  // === 1. CỘT SỐNG BÉZIER 2 TẦNG (2-Segment Bézier Spine — Chuẩn RubberHose / Duik) ===
  // Khung chậu (Pelvis) khóa gần như thẳng đứng trên mặt ghế khi ngồi (effectiveSit = 1),
  // chỉ xoay nhẹ khi đứng/bước. Phần leanDeg còn lại chuyển thành độ uốn cong chữ C của lưng trên & cổ.
  // clampedLean: mở rộng tới INK_MAX_LEAN_DEG_SLUMP (26) khi deepSlump > 0, giữ nguyên 24 khi đứng
  const maxLean = deepSlump > 0 ? INK_MAX_LEAN_DEG_SLUMP : INK_MAX_LEAN_DEG_STAND;
  const clampedLean = Math.max(-12, Math.min(maxLean, leanDeg));
  const pelvisTiltDeg =
    clampedLean * (1 - effectiveSit * 0.88) * 0.28 +
    (1 - act) * breathSin * 0.1;
  const spineBendDeg = clampedLean - pelvisTiltDeg;
  const spineBendRad = (spineBendDeg * Math.PI) / 180;

  // Độ dịch chuyển ngang (X) và độ rũ vai (Y) dọc theo cột sống từ Hông (-10.6) -> Ngực (-23) -> Vai (-34.6) -> Đầu (-42.3)
  // deepSlump chỉ bổ sung dịch chuyển khi thực sự gục (đứng mặc định không có deepSlump → giống hệt bản cũ)
  const midSpineShiftX = Math.sin(spineBendRad) * 3.6 + 3.2 * deepSlump;
  const shoulderShiftX = Math.sin(spineBendRad) * 7.8 + 4.8 * deepSlump;
  const shoulderDropY =
    (1 - Math.cos(spineBendRad)) * 5.2 +
    effectiveSit * 0.6 +
    8.6 * deepSlump;

  // Khi gục xuống bàn (deepSlump = 1), đầu hạ thấp xuống sát mặt bàn và vươn về phía bàn (+X)
  // Khi hasLookTarget && !showFace: đầu dịch nhẹ (+X) và nhấc nhẹ (-Y) về phía vật thay cho ánh mắt
  const gazeHeadShiftX = hasLookTarget && !showFace ? 1.6 * deepSlump : 0;
  const gazeHeadLiftY = hasLookTarget && !showFace ? -1.4 * deepSlump : 0;
  const headOffsetX =
    shoulderShiftX +
    Math.sin(spineBendRad) * 2.8 +
    2.2 * deepSlump +
    2.4 * wPush -
    1.2 * wLookUp +
    (1 - act) * breezeCos * 0.14 +
    gazeHeadShiftX;
  const headOffsetY =
    -42.3 +
    shoulderDropY +
    (1 - Math.cos(spineBendRad)) * 3.4 +
    6.4 * deepSlump -
    0.7 * wLookUp -
    breathLiftY * 0.18 +
    gazeHeadLiftY;

  // Tà áo dưới (Hip Base) luôn nằm ngang vững chãi trên ghế/mặt đất; lưng áo trên uốn mượt theo cột sống
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

  const cloakD = `M ${topBackX.toFixed(2)} ${topShoulderY.toFixed(2)} C ${backCtrl1X.toFixed(2)} ${(-26.2 + shoulderDropY * 0.65).toFixed(2)} ${backCtrl2X.toFixed(2)} -15.8 ${backHemX.toFixed(2)} -10.4 Q -1.2 -9.0 ${frontHemX.toFixed(2)} -10.8 C ${frontCtrl1X.toFixed(2)} -16.8 ${frontCtrl2X.toFixed(2)} ${(-26.4 + shoulderDropY * 0.65).toFixed(2)} ${topFrontX.toFixed(2)} ${topShoulderY.toFixed(2)} Q ${(shoulderShiftX).toFixed(2)} ${(topShoulderY - 1.0).toFixed(2)} ${topBackX.toFixed(2)} ${topShoulderY.toFixed(2)} Z`;

  // === 2. CHÂN 2-BONE ANALYTIC IK (Hip -> Knee -> Foot) ===
  // Chiều dài đùi (thighLen) & cẳng chân (calfLen) giải bằng định lý Cosin, đầu gối luôn gập về phía trước (bendDir = -1)
  const thighLen = 5.7 + 2.4 * effectiveSit;
  const calfLen = 5.7 + 3.8 * effectiveSit;
  const hipY = -11.0 - stepBob + sitDrop;

  // Khi đi bộ, bàn chân đang bước về trước nhấc nhẹ lên khỏi mặt đất để đầu gối gập tự nhiên
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

  // === 3. TAY 2-BONE ANALYTIC IK (Shoulder -> Elbow -> Hand) ===
  const shoulderX = 3.0 + shoulderShiftX * 0.88;
  const shoulderY = -27.8 + shoulderDropY * 0.85;
  const upperArmLen = INK_UPPER_ARM_LEN;
  const forearmLen = INK_FOREARM_LEN;

  // === 4. NHÌN NGANG (SIDE PROFILE): MẮT Ở MÉP TRƯỚC MẶT (+X) & LÁ TRÀ TRÊN ĐỈNH ĐẦU ===
  const clampedGazeX = Math.max(-0.8, Math.min(1.4, gazeX));
  const clampedGazeY = Math.max(-1.0, Math.min(1.2, gazeY));
  const eyeCenterX = headOffsetX + 3.65 + clampedGazeX * 0.85;
  const eyeCenterY =
    headOffsetY +
    0.25 +
    deepSlump * (hasLookTarget ? -0.35 : 0.95) +
    clampedGazeY * 0.75;
  const isTiredDroopEye = deepSlump > 0.55 && !hasLookTarget;

  // Lá trà trên đỉnh đầu: đứng thẳng dựng đứng (~4°); gục xuống bàn thì rủ về trước (~68°); liếc nhìn thì nhổm (~24°)
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

  const headR = solidFill ? INK_HEAD_RADIUS_SOLID : INK_HEAD_RADIUS_OUTLINE;
  const headCenterY = headOffsetY - (solidFill ? 0.5 : 0);
  const inkFillMult = role === 'nguoi_b' ? 0.85 : 1;

  const ponytailNode = (() => {
    if (!ponytail || washMult <= 0.005) return null;
    const tieX = headOffsetX - headR * 0.82;
    const tieY = headCenterY + 0.85;
    const swayTail = stepSin * act * 0.85 + breezeCos * 0.65 - act * 1.4;
    const tailD = `M ${(tieX - 0.25).toFixed(2)} ${(tieY - 0.95).toFixed(2)} C ${(tieX - 3.6 + swayTail * 0.45).toFixed(2)} ${(tieY - 1.25).toFixed(2)} ${(tieX - 5.9 + swayTail).toFixed(2)} ${(tieY + 2.7).toFixed(2)} ${(tieX - 5.0 + swayTail * 1.15).toFixed(2)} ${(tieY + 8.6).toFixed(2)} C ${(tieX - 3.7 + swayTail * 0.8).toFixed(2)} ${(tieY + 5.7).toFixed(2)} ${(tieX - 2.3 + swayTail * 0.4).toFixed(2)} ${(tieY + 2.6).toFixed(2)} ${(tieX - 0.25).toFixed(2)} ${(tieY + 1.05).toFixed(2)} Z`;
    return (
      <g>
        <path d={tailD} fill={bgColor} stroke="none" opacity={washMult} />
        <circle cx={tieX - 0.5} cy={tieY + 0.1} r={1.05} fill={color} opacity={washMult * inkFillMult} />
        <path
          d={tailD}
          fill={color}
          fillOpacity={solidFill ? washMult * inkFillMult : INK_HEAD_FILL_OPACITY_OUTLINE * washMult * inkFillMult}
          stroke={solidFill ? 'none' : color}
          strokeWidth={solidFill ? 0 : effStroke * 0.72}
          strokeLinejoin="round"
        />
      </g>
    );
  })();

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
            opacity={(solidFill ? INK_BACK_LEG_OPACITY_SOLID : INK_BACK_LEG_OPACITY_OUTLINE) * limbInkGate}
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
              fillOpacity={washMult * inkFillMult}
              stroke={isDrawing ? color : 'none'}
              strokeWidth={isDrawing ? effStroke * INK_CLOAK_STROKE_MULT_SOLID : 0}
              strokeOpacity={isDrawing ? INK_STROKE_OPACITY * cloakInkGate : 0}
              strokeLinecap="round"
              strokeLinejoin="round"
              {...cloakDrawProps}
            />
            {washMult > 0.05 && (
              <path
                d={`M ${(-1.2 + shoulderShiftX * 0.75).toFixed(2)} ${(-30.5 + shoulderDropY * 0.8).toFixed(2)} C ${(-2.8 + midSpineShiftX * 0.45).toFixed(2)} -22.8 ${(-3.5 + hemFlutter * 0.35).toFixed(2)} -16.2 ${(-2.6 + hemFlutter * 0.45).toFixed(2)} -10.8`}
                fill="none"
                stroke={bgColor}
                strokeWidth={effStroke * INK_FOLD_STROKE_MULT_SOLID}
                strokeLinecap="round"
                opacity={INK_FOLD_OPACITY_SOLID * washMult}
              />
            )}
            {ponytailNode}
            {washMult > 0.005 && (
              <circle
                cx={headOffsetX}
                cy={headCenterY}
                r={headR}
                fill={bgColor}
                stroke="none"
                opacity={washMult}
              />
            )}
            <circle
              cx={headOffsetX}
              cy={headCenterY}
              r={headR}
              fill={color}
              fillOpacity={washMult * inkFillMult}
              stroke={isDrawing ? color : 'none'}
              strokeWidth={isDrawing ? effStroke * INK_CLOAK_STROKE_MULT_SOLID : 0}
              strokeOpacity={isDrawing ? INK_STROKE_OPACITY * headInkGate : 0}
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
              fillOpacity={INK_CLOAK_FILL_OPACITY_OUTLINE * washMult}
              stroke={color}
              strokeWidth={effStroke}
              strokeOpacity={INK_STROKE_OPACITY * cloakInkGate}
              strokeLinecap="round"
              strokeLinejoin="round"
              {...cloakDrawProps}
            />
            {washMult > 0.05 && (
              <path
                d={`M ${(-1.4 + shoulderShiftX * 0.75).toFixed(2)} ${(-31.2 + shoulderDropY * 0.8).toFixed(2)} C ${(-3.0 + midSpineShiftX * 0.45).toFixed(2)} -23.0 ${(-3.8 + hemFlutter * 0.35).toFixed(2)} -16.0 ${(-2.8 + hemFlutter * 0.45).toFixed(2)} -10.8`}
                fill="none"
                stroke={color}
                strokeWidth={effStroke * INK_FOLD_STROKE_MULT_OUTLINE}
                strokeLinecap="round"
                opacity={INK_FOLD_OPACITY_OUTLINE * washMult}
              />
            )}

            {/* Cánh tay làm việc / gối lên mặt bàn khi ngồi vào bàn (khả năng mới: khuỷu tay và cẳng tay nằm trên mặt bàn, không thò xuống gầm bàn) */}
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

            {ponytailNode}
            {washMult > 0.005 && (
              <circle
                cx={headOffsetX}
                cy={headCenterY}
                r={headR}
                fill={bgColor}
                opacity={washMult}
              />
            )}
            <circle
              cx={headOffsetX}
              cy={headCenterY}
              r={headR}
              fill={color}
              fillOpacity={INK_HEAD_FILL_OPACITY_OUTLINE * washMult}
              stroke={color}
              strokeWidth={effStroke}
              strokeOpacity={INK_STROKE_OPACITY * headInkGate}
              {...headDrawProps}
            />

            {/* Nét tóc gợi hướng đầu nhìn ngang về phía trước (+X) — chỉ khi showFace */}
            {showFace && headStrokeP > 0.3 && (
              <path
                d={`M ${(headOffsetX - 3.6).toFixed(2)} ${(headOffsetY - 4.2).toFixed(2)} Q ${(headOffsetX + 0.6).toFixed(2)} ${(headOffsetY - 5.6).toFixed(2)} ${(headOffsetX + 4.2).toFixed(2)} ${(headOffsetY - 3.4).toFixed(2)}`}
                fill="none"
                stroke={color}
                strokeWidth={effStroke * 0.48}
                strokeLinecap="round"
                opacity={0.52 * headInkGate}
              />
            )}

            {/* Lá trà trên đỉnh đầu Lữ khách (dựng đứng khi tỉnh táo, rủ về phía bàn khi gục mỏi) — chỉ khi showFace */}
            {showFace && headStrokeP > 0.25 && (
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

            {/* Ánh nhìn ngang (Side-Profile Eye) — chỉ khi showFace */}
            {showFace && headStrokeP > 0.35 && (
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
          (() => {
            const poseArms = [
              {
                key: 'reach_out',
                weight: wReachOut,
                target: [
                  16.8 + shoulderShiftX * 0.5,
                  -28.5 + shoulderDropY * 0.5 - breathSin * 0.12,
                ] as const,
              },
              {
                key: 'give',
                weight: wGive,
                target: [
                  16.6 + shoulderShiftX * 0.5,
                  -23.6 + shoulderDropY * 0.5 - breathSin * 0.12,
                ] as const,
              },
              {
                key: 'hold_up',
                weight: wHoldUp,
                target: [
                  13.4 + shoulderShiftX * 0.4,
                  -39.8 + shoulderDropY * 0.4 - breathSin * 0.12,
                ] as const,
              },
              {
                key: 'push',
                weight: wPush,
                target: [
                  17.8 + shoulderShiftX * 0.5,
                  -31.5 + shoulderDropY * 0.5,
                ] as const,
              },
              {
                key: 'sit_slump',
                weight: wSitSlump,
                target: [
                  frontLegIK.jx - 0.4,
                  frontLegIK.jy - 1.8 - breathSin * 0.08,
                ] as const,
              },
              {
                key: 'hold_teacup',
                weight:
                  teaCupOpacity *
                  Math.max(
                    0,
                    1 - (wReachOut + wGive + wHoldUp + wPush + wSitSlump)
                  ),
                target: [
                  14.8 + shoulderShiftX * 0.6,
                  -24.2 + shoulderDropY * 0.6 - breathSin * 0.12,
                ] as const,
              },
            ];
            return poseArms.map(({ key, weight, target }) => {
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
            });
          })()}

        {teaCupOpacity > 0.01 &&
          (() => {
            const holdStandTargetX =
              14.8 + shoulderShiftX * 0.6;
            const holdStandTargetY =
              -24.2 + shoulderDropY * 0.6 - breathSin * 0.12;
            const standCupIK = solveTwoBoneIK(
              shoulderX,
              shoulderY,
              holdStandTargetX +
                wHoldUp * (13.4 + shoulderShiftX * 0.4 - holdStandTargetX) +
                wReachOut * (16.8 + shoulderShiftX * 0.5 - holdStandTargetX) +
                wGive * (16.6 + shoulderShiftX * 0.5 - holdStandTargetX),
              holdStandTargetY +
                wHoldUp * (-39.8 + shoulderDropY * 0.4 - holdStandTargetY) +
                wReachOut * (-28.5 + shoulderDropY * 0.5 - holdStandTargetY) +
                wGive * (-23.6 + shoulderDropY * 0.5 - holdStandTargetY),
              upperArmLen,
              forearmLen,
              1
            );
            const seatedHandX = 13.8 + deepSlump * 2.4;
            const seatedHandY = -19.8 - breathSin * 0.06;
            const cupBaseX =
              (standCupIK.ex + 1.5) * (1 - effectiveSit) +
              (seatedHandX + 2.2) * effectiveSit;
            const cupBaseY =
              (standCupIK.ey + 0.2) * (1 - effectiveSit) +
              seatedHandY * effectiveSit;

            const cupD = `M ${(cupBaseX - 3.5).toFixed(2)} ${(cupBaseY - 5.0).toFixed(2)} Q ${(cupBaseX - 2.9).toFixed(2)} ${(cupBaseY - 0.7).toFixed(2)} ${(cupBaseX - 2.0).toFixed(2)} ${cupBaseY.toFixed(2)} L ${(cupBaseX + 2.0).toFixed(2)} ${cupBaseY.toFixed(2)} Q ${(cupBaseX + 2.9).toFixed(2)} ${(cupBaseY - 0.7).toFixed(2)} ${(cupBaseX + 3.5).toFixed(2)} ${(cupBaseY - 5.0).toFixed(2)} Z`;
            const cupInkColor = teaCupRed ? accentColor : color;
            const cupWashOpacity = teaCupRed
              ? (solidFill ? 0.38 : 0.24)
              : (solidFill ? 0.12 : 0.1);

            return (
              <g opacity={teaCupOpacity * limbInkGate}>
                <path d={cupD} fill={bgColor} />
                <path
                  d={cupD}
                  fill={cupInkColor}
                  fillOpacity={cupWashOpacity}
                  stroke={cupInkColor}
                  strokeWidth={effStroke * (teaCupRed ? 0.78 : 0.68)}
                  strokeLinejoin="round"
                />
                <path
                  d={`M ${cupBaseX.toFixed(2)} ${(cupBaseY - 7.5).toFixed(2)} Q ${(cupBaseX - 1.4 + steamWave * 1.5).toFixed(2)} ${(cupBaseY - 11.5).toFixed(2)} ${(cupBaseX + 0.4 - steamWave * 1.1).toFixed(2)} ${(cupBaseY - 15.0 - steamLift * 2.4).toFixed(2)} Q ${(cupBaseX + 1.8 + steamWave * 1.3).toFixed(2)} ${(cupBaseY - 18.0).toFixed(2)} ${(cupBaseX - 0.2 - steamWave * 0.8).toFixed(2)} ${(cupBaseY - 20.7 - steamLift * 2.8).toFixed(2)}`}
                  fill="none"
                  stroke={cupInkColor}
                  strokeWidth={effStroke * 0.52}
                  strokeLinecap="round"
                  opacity={0.48 + 0.22 * Math.sin(steamLift * 0.01 + steamLift * Math.PI)}
                />
              </g>
            );
          })()}
      </g>
    </g>
  );
};
