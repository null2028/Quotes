import { VideoInputProps } from '../schemas/videoSchema';
import { LAYOUT_TOKENS } from '../theme/palettes';

export interface SegmentTiming {
  index: number;
  text: string;
  startFrame: number;
  endTypingFrame: number;
  isFirstActiveLine: boolean;
  containsPivot: boolean;
  pivotCharStartIndex: number;
  pivotCharEndIndex: number;
}

export interface TimelineSyncResult {
  fps: number;
  introBufferFrames: number;
  segmentTimings: SegmentTiming[];
  pivotFrame: number;
  allTextFinishedFrame: number;
  durationInFrames: number;
}

export type SyllableBand =
  | 'empty'
  | 'concise'
  | 'optimal'
  | 'long'
  | 'overflow';

export interface SyllableAuditResult {
  count: number;
  band: SyllableBand;
  skimSeconds: number;
  contemplateSeconds: number;
  label: string;
}

export function stripInlineMarkdown(raw: string): string {
  return raw.replace(/\*+/g, '');
}

export function auditVietnameseSyllables(
  segments: string[]
): SyllableAuditResult {
  const tokens: string[] = [];
  for (const raw of segments) {
    const cleaned = stripInlineMarkdown(raw)
      .replace(/[.,;!?…""''“”‘’()[\]{}—–\-•/\\|]+/g, ' ')
      .trim();
    if (!cleaned) continue;
    for (const part of cleaned.split(/\s+/)) {
      if (/[\p{L}\p{N}]/u.test(part)) {
        tokens.push(part);
      }
    }
  }

  const count = tokens.length;
  const skimSeconds = Number((count / 4.0).toFixed(1));
  const contemplateSeconds = Number((count / 2.6).toFixed(1));

  if (count === 0) {
    return {
      count: 0,
      band: 'empty',
      skimSeconds: 0,
      contemplateSeconds: 0,
      label: 'Chưa có chữ',
    };
  }
  if (count < 14) {
    return {
      count,
      band: 'concise',
      skimSeconds,
      contemplateSeconds,
      label: 'Cô đọng (<14 âm)',
    };
  }
  if (count <= 28) {
    return {
      count,
      band: 'optimal',
      skimSeconds,
      contemplateSeconds,
      label: 'Chuẩn vàng (14–28 âm)',
    };
  }
  if (count <= 36) {
    return {
      count,
      band: 'long',
      skimSeconds,
      contemplateSeconds,
      label: 'Sát trần (29–36 âm)',
    };
  }
  return {
    count,
    band: 'overflow',
    skimSeconds,
    contemplateSeconds,
    label: 'Vượt trần (>36 âm)',
  };
}

export function computeTimelineSync(
  props: VideoInputProps,
  fps: number = LAYOUT_TOKENS.fps
): TimelineSyncResult {
  const targetDurationSec = props.targetDurationSeconds ?? 15;
  const durationInFrames = Math.round(targetDurationSec * fps);

  const introBufferFrames = Math.round(1.35 * fps);

  const nonEmptyLines = props.segments.filter(
    (s) => stripInlineMarkdown(s).trim().length > 0
  );
  const activeLineCount = Math.max(1, nonEmptyLines.length);
  const fadeDurationFrames = Math.round(1.05 * fps);

  const totalRevealSpanSec = Math.min(
    8.2,
    Math.max(4.8, targetDurationSec * 0.54)
  );
  const remainingLines = Math.max(1, activeLineCount - 1);
  const stepBetweenLinesFrames =
    activeLineCount > 1
      ? Math.round(((totalRevealSpanSec - 1.35) * fps) / remainingLines)
      : 0;

  const normalizedPivot = stripInlineMarkdown(props.pivotWord)
    .trim()
    .toLowerCase();
  let targetSegmentIndex = -1;
  let targetCharIndex = -1;

  if (normalizedPivot.length > 0) {
    for (let i = props.segments.length - 1; i >= 0; i--) {
      const cleanSeg = stripInlineMarkdown(props.segments[i]).trim();
      if (!cleanSeg) continue;
      const idx = cleanSeg.toLowerCase().lastIndexOf(normalizedPivot);
      if (idx !== -1) {
        targetSegmentIndex = i;
        targetCharIndex = idx;
        break;
      }
    }
  }

  let detectedPivotFrame: number | null = null;
  let activeLineCursor = 0;
  let lastNonEmptyStartFrame = 0;
  let lastNonEmptyEndFrame = Math.round(0.35 * fps);

  const segmentTimings: SegmentTiming[] = props.segments.map((rawText, index) => {
    const text = rawText.trim();
    const cleanText = stripInlineMarkdown(text).trim();
    const isEmptyStanzaBreak = cleanText.length === 0;
    let isFirstActiveLine = false;

    let startFrame: number;
    let endTypingFrame: number;

    if (isEmptyStanzaBreak) {
      startFrame = lastNonEmptyStartFrame;
      endTypingFrame = lastNonEmptyEndFrame;
    } else if (activeLineCursor === 0) {
      isFirstActiveLine = true;
      startFrame = 0;
      endTypingFrame = Math.round(0.35 * fps);
      lastNonEmptyStartFrame = startFrame;
      lastNonEmptyEndFrame = endTypingFrame;
      activeLineCursor += 1;
    } else {
      startFrame =
        introBufferFrames + (activeLineCursor - 1) * stepBetweenLinesFrames;
      endTypingFrame = startFrame + fadeDurationFrames;
      lastNonEmptyStartFrame = startFrame;
      lastNonEmptyEndFrame = endTypingFrame;
      activeLineCursor += 1;
    }

    const containsPivot =
      !isEmptyStanzaBreak &&
      index === targetSegmentIndex &&
      targetCharIndex !== -1;

    if (containsPivot) {
      detectedPivotFrame = isFirstActiveLine
        ? Math.round(targetDurationSec * 0.44 * fps)
        : Math.max(introBufferFrames, startFrame - Math.round(0.22 * fps));
    }

    return {
      index,
      text,
      startFrame,
      endTypingFrame,
      isFirstActiveLine,
      containsPivot,
      pivotCharStartIndex: containsPivot ? targetCharIndex : -1,
      pivotCharEndIndex: containsPivot
        ? targetCharIndex + normalizedPivot.length
        : -1,
    };
  });

  const allTextFinishedFrame = Math.max(
    lastNonEmptyEndFrame,
    Math.round(5.2 * fps)
  );

  const pivotFrame =
    detectedPivotFrame ??
    Math.max(Math.round(5.6 * fps), lastNonEmptyStartFrame);

  return {
    fps,
    introBufferFrames,
    segmentTimings,
    pivotFrame,
    allTextFinishedFrame,
    durationInFrames,
  };
}
