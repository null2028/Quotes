import { VideoInputProps, VideoInputSchema } from '../schemas/videoSchema';

/**
 * Đảm bảo pivotWord luôn tồn tại nguyên vẹn bên trong ít nhất 1 segment (ưu tiên segment cuối)
 */
export function ensureValidPivotSubstring(
  segments: string[],
  candidatePivot: string
): string {
  const stripMd = (s: string) => s.replace(/\*+/g, '').trim();
  const cleanCandidate = stripMd(candidatePivot);
  const nonEmptySegments = segments
    .map((s) => stripMd(s))
    .filter((s) => s.length > 0);

  const existsInSegments =
    cleanCandidate.length > 0 &&
    nonEmptySegments.some((seg) =>
      seg.toLowerCase().includes(cleanCandidate.toLowerCase())
    );

  if (existsInSegments) {
    return cleanCandidate;
  }

  // Self-healing fallback: lấy 2 từ cuối của dòng có chữ cuối cùng (bỏ dấu chấm than/dấu chấm ở rìa)
  const lastSegment =
    nonEmptySegments[nonEmptySegments.length - 1] || '';
  const words = lastSegment
    .replace(/[.!?…]+$/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words.slice(-2).join(' ') || cleanCandidate;
}

/**
 * Đảm bảo độ tương phản vật lý giữa State A và State B luôn đủ lớn để mắt người xem nhận biết,
 * đồng thời bảo toàn chiều biến thiên ngữ nghĩa (ví dụ: ORBIT_DISTANCE hợp hay tan).
 */
export function enforceMotionContrast(
  motion: VideoInputProps['motion']
): VideoInputProps['motion'] {
  const cloned = structuredClone(motion);
  const { archetype, stateA, stateB } = cloned;

  switch (archetype) {
    case 'TENSION_RELEASE':
    case 'CHAOS_TO_ORDER': {
      if (Math.abs(stateA.intensity - stateB.intensity) < 0.45) {
        cloned.stateA.intensity = 0.85;
        cloned.stateB.intensity = archetype === 'CHAOS_TO_ORDER' ? 0.0 : 0.05;
      }
      break;
    }
    case 'ORBIT_DISTANCE': {
      if (Math.abs(stateA.spread - stateB.spread) < 0.3) {
        // Giữ nguyên chiều hướng: nếu stateA > stateB (gần lại / thấu hiểu) vs stateA <= stateB (chia xa)
        if (stateA.spread > stateB.spread) {
          cloned.stateA.spread = 0.82;
          cloned.stateB.spread = 0.15;
        } else {
          cloned.stateA.spread = 0.18;
          cloned.stateB.spread = 0.85;
        }
      }
      break;
    }
    case 'LINE_RUPTURE_HEAL': {
      if (Math.abs(stateA.spread - stateB.spread) < 0.2) {
        cloned.stateA.spread = 0.65;
        cloned.stateB.spread = 0.4;
      }
      break;
    }
    case 'BALANCE_SCALE':
    case 'GAUGE_TRANSITION': {
      if (Math.abs(stateA.tiltDeg - stateB.tiltDeg) < 15) {
        cloned.stateA.tiltDeg = -24;
        cloned.stateB.tiltDeg = archetype === 'BALANCE_SCALE' ? 0 : 28;
      }
      break;
    }
  }

  return cloned;
}

export function validateAndNormalizeVideoProps(
  rawProps: VideoInputProps
): VideoInputProps {
  const parsed = VideoInputSchema.parse(rawProps);
  parsed.pivotWord = ensureValidPivotSubstring(parsed.segments, parsed.pivotWord);
  parsed.motion = enforceMotionContrast(parsed.motion);
  return parsed;
}
