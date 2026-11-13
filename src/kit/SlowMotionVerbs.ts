import { interpolate, Easing } from 'remotion';
import { EvaluatedMotionState } from '../engine/motionPhysics';

export type { EvaluatedMotionState };

/**
 * 1. Hóa không trọng lực bay bồng bềnh chậm rãi lên cao rồi tan mờ (4.5s)
 * Dùng cho mọi gánh nặng/áp lực được giải tỏa nhẹ tênh theo kiểu "Phi lý êm ái"
 */
export function levitateWeightless(progress: number, indexOffset: number = 0) {
  const safeOffset = Math.min(0.72, Math.max(0, indexOffset * 0.08));
  const delayed = Math.max(0, Math.min(1, (progress - safeOffset) / (1 - safeOffset)));
  const eased = Easing.inOut(Easing.sin)(delayed);
  return {
    translateY: -eased * (95 + indexOffset * 22),
    translateX: Math.sin(delayed * Math.PI * 1.5 + indexOffset * 1.7) * (14 + indexOffset * 4),
    rotateDeg: Math.sin(delayed * Math.PI + indexOffset) * 9,
    opacity: interpolate(delayed, [0, 0.65, 1], [1, 0.75, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  };
}

/**
 * 2. Hiện êm và nở nhẹ từ tốn (2.8s) cho Đạo cụ Trung tâm ở Hồi II
 */
export function slowEmergence(progress: number) {
  const eased = Easing.out(Easing.cubic)(Math.max(0, Math.min(1, progress)));
  return {
    opacity: eased,
    translateY: (1 - eased) * 14,
    scale: 0.92 + eased * 0.08,
  };
}

/**
 * 3. Lùi êm về góc ký ức (dùng khi vật ở Hồi I/II nhường tiêu điểm chính cho vật ở Hồi III)
 */
export function recedeToMemory(progress: number) {
  const eased = Easing.inOut(Easing.cubic)(Math.max(0, Math.min(1, progress)));
  return {
    opacity: 1 - eased * 0.65,
    scale: 1 - eased * 0.35,
    translateY: -eased * 24,
  };
}

/**
 * 4. Nhịp thở / đung đưa vi mô chu kỳ chậm (~4.5s) CHỈ dành cho nhóm detail-motion (khăn, lá, khói, cành)
 */
export function gentleSwayDeg(
  continuousPhase: number,
  maxDeg: number = 3.0,
  phaseOffset: number = 0
): number {
  return Math.sin(continuousPhase * 0.65 + phaseOffset) * maxDeg;
}

/**
 * 5. Cuộn dọc tuần hoàn chậm rãi (0.32px/frame) cho danh sách, dòng chảy, tờ lịch
 */
export function slowScrollOffset(
  frame: number,
  totalSpanPx: number,
  speedPxPerFrame: number = 0.32
): number {
  const safeSpan = Math.max(1, totalSpanPx);
  return (frame * speedPxPerFrame) % safeSpan;
}

/**
 * 6. ĐỊNH LUẬT KHÓA ĐỘNG HỌC BƯỚC CHÂN (Velocity-Coupled Locomotion):
 * Khi |toX - fromX| < 12px (nhân vật đứng yên 1 cụm), legStride BẮT BUỘC = 0 tuyệt đối!
 * Vĩnh viễn triệt tiêu lỗi "chân giật đi bộ tại chỗ" trên toàn hệ thống.
 */
export function computeCoupledWalk(
  fromX: number,
  toX: number,
  moveProgress: number,
  continuousPhase: number
) {
  const clamped = Math.max(0, Math.min(1, moveProgress));
  const eased = Easing.inOut(Easing.quad)(clamped);
  const currentX = fromX + (toX - fromX) * eased;
  const distance = Math.abs(toX - fromX);

  // Vận tốc tức thời bằng 0 ở đầu, cuối và khi quãng đường < 12px
  const velocityEnvelope =
    distance < 12 ? 0 : Math.sin(clamped * Math.PI) * Math.min(1, distance / 60);
  const legStride = velocityEnvelope * Math.sin(continuousPhase * 1.1) * 4.0;

  return { currentX, legStride, isMoving: velocityEnvelope > 0.05 };
}
