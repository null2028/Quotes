import { interpolate, Easing } from 'remotion';
import {
  TimelineSyncResult,
  stripInlineMarkdown,
} from '../engine/timelineSync';
import { TimeExpr } from './stageScriptSchema';

/**
 * Giải mã biểu thức thời gian ngữ nghĩa sang frame chính xác theo dữ liệu câu chữ thực tế.
 * Hỗ trợ:
 * - Số giây trực tiếp: 1.5, "2.4s", "0"
 * - Mốc cấu trúc: "start", "line_1".."line_N", "last_line", "pivot", "text_done", "end"
 * - Phép cộng/trừ bù giây: "line_2+0.6s", "pivot-0.3s", "pivot+2.4s", "end-2.0s"
 * - Phần trăm theo Hồi: "act1:50%", "act2:50%", "act3:50%"
 */
export function resolveCueFrame(
  whenExpr: TimeExpr | undefined,
  timeline: TimelineSyncResult
): number {
  const { fps, pivotFrame, allTextFinishedFrame, durationInFrames } = timeline;
  if (whenExpr === undefined || whenExpr === null) return 0;

  if (typeof whenExpr === 'number') {
    return clampFrame(Math.round(whenExpr * fps), durationInFrames);
  }

  const raw = whenExpr.trim().toLowerCase();
  if (!raw || raw === 'start') return 0;

  // 1. Phần trăm theo Hồi: "act1:50%", "act2:50%", "act3:50%"
  const actMatch = raw.match(/^act([123])\s*:\s*(\d+(?:\.\d+)?)%?$/);
  if (actMatch) {
    const actNum = Number(actMatch[1]);
    const pct = Math.max(0, Math.min(100, Number(actMatch[2]))) / 100;
    if (actNum === 1) {
      return clampFrame(Math.round(pivotFrame * pct), durationInFrames);
    }
    if (actNum === 2) {
      const act2End = Math.min(
        durationInFrames,
        pivotFrame + Math.round(2.6 * fps)
      );
      return clampFrame(
        Math.round(pivotFrame + (act2End - pivotFrame) * pct),
        durationInFrames
      );
    }
    const act3Start = Math.min(
      durationInFrames,
      pivotFrame + Math.round(0.3 * fps)
    );
    return clampFrame(
      Math.round(act3Start + (durationInFrames - act3Start) * pct),
      durationInFrames
    );
  }

  // 2. Số giây trực tiếp: "2.4s" hoặc "2.4"
  const directSecMatch = raw.match(/^([+-]?\d+(?:\.\d+)?)s?$/);
  if (directSecMatch) {
    const sec = Number(directSecMatch[1]);
    return clampFrame(Math.round(sec * fps), durationInFrames);
  }

  // 3. Mốc ngữ nghĩa kèm phép cộng/trừ bù giây: VD "line_2+0.6s", "pivot-0.3s", "end-2.0s"
  const anchorMatch = raw.match(
    /^([a-z0-9_]+)\s*([+-]\s*\d+(?:\.\d+)?)?s?$/
  );
  if (anchorMatch) {
    const anchorToken = anchorMatch[1];
    const offsetSecStr = anchorMatch[2]?.replace(/\s+/g, '');
    const offsetFrames = offsetSecStr
      ? Math.round(Number(offsetSecStr) * fps)
      : 0;

    const baseFrame = resolveAnchorTokenFrame(anchorToken, timeline);
    return clampFrame(baseFrame + offsetFrames, durationInFrames);
  }

  return 0;
}

function resolveAnchorTokenFrame(
  token: string,
  timeline: TimelineSyncResult
): number {
  const { segmentTimings, pivotFrame, allTextFinishedFrame, durationInFrames } =
    timeline;

  const nonEmptyTimings = segmentTimings.filter(
    (s) => stripInlineMarkdown(s.text).trim().length > 0
  );

  if (token === 'start') return 0;
  if (token === 'pivot') return pivotFrame;
  if (token === 'text_done' || token === 'all_text_done') {
    return allTextFinishedFrame;
  }
  if (token === 'end') return durationInFrames;
  if (token === 'last_line') {
    return (
      nonEmptyTimings[nonEmptyTimings.length - 1]?.startFrame ?? pivotFrame
    );
  }

  const lineMatch = token.match(/^line_(\d+)$/);
  if (lineMatch && nonEmptyTimings.length > 0) {
    const oneBasedIdx = Math.max(1, Number(lineMatch[1]));
    const clampedIdx = Math.min(nonEmptyTimings.length - 1, oneBasedIdx - 1);
    return nonEmptyTimings[clampedIdx].startFrame;
  }

  return 0;
}

function clampFrame(frame: number, durationInFrames: number): number {
  return Math.max(0, Math.min(durationInFrames, frame));
}

/**
 * Tính hệ số opacity mượt mà theo enterAt / leaveAt (dùng chung cho atmosphere[], actors[], props[])
 */
export function evaluateEnterLeaveMultiplier(
  frame: number,
  timeline: TimelineSyncResult,
  enterAt?: TimeExpr,
  leaveAt?: TimeExpr,
  fadeDurationSec: number = 1.5
): number {
  const fadeFrames = Math.max(6, Math.round(fadeDurationSec * timeline.fps));
  let mult = 1;

  if (enterAt !== undefined) {
    const enterFrame = resolveCueFrame(enterAt, timeline);
    const enterProg = interpolate(
      frame,
      [enterFrame, enterFrame + fadeFrames],
      [0, 1],
      {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    );
    mult *= enterProg;
  }

  if (leaveAt !== undefined) {
    const leaveFrame = resolveCueFrame(leaveAt, timeline);
    const leaveProg = interpolate(
      frame,
      [leaveFrame, leaveFrame + fadeFrames],
      [1, 0],
      {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    );
    mult *= leaveProg;
  }

  return mult;
}
