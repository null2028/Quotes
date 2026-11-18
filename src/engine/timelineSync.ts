import { VideoInputProps } from '../schemas/videoSchema';
import { LAYOUT_TOKENS } from '../theme/palettes';

export const STAGE_LEAD_IN_SECONDS = 0.35;
export const TYPO_LOOP_FADE_SECONDS = 0.8;

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
  recommendedCoverFrame: number;
  headerDissolveStartFrame: number;
  headerDissolveEndFrame: number;
  loopRestoreStartFrame: number;
}

/**
 * Hàm băm tất định FNV-1a tạo seed ổn định theo cupId + từ khóa trọng tâm.
 */
export function hashCupSeed(seedText: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Sinh tổng số frame động (13.5s – 16.5s theo bước 30f tại 60fps, loại trừ mốc cứng 900f)
 * dựa trên số âm tiết thực tế và seed của từng Chén.
 */
export function computeDynamicDurationFrames(
  props: Pick<VideoInputProps, 'id' | 'segments' | 'pivotWord'>,
  fps: number = LAYOUT_TOKENS.fps
): number {
  const { count } = auditVietnameseSyllables(props.segments);
  const pool60 =
    count < 18
      ? [810, 840, 870]
      : count <= 28
        ? [840, 870, 930, 960]
        : [930, 960, 990];
  const seed = hashCupSeed(`${props.id}::${props.pivotWord || ''}`);
  const pickedAt60 = pool60[seed % pool60.length];
  if (fps === 60) return pickedAt60;
  return Math.max(240, Math.round((pickedAt60 / 60) * fps));
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
      skimSeconds: 0 + skimSeconds,
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
  if (count <= 40) {
    return {
      count,
      band: 'long',
      skimSeconds,
      contemplateSeconds,
      label: 'Sát trần (29–40 âm)',
    };
  }
  return {
    count,
    band: 'overflow',
    skimSeconds,
    contemplateSeconds,
    label: 'Vượt trần (>40 âm)',
  };
}

export function computeTimelineSync(
  props: VideoInputProps,
  fps: number = LAYOUT_TOKENS.fps
): TimelineSyncResult {
  const durationInFrames =
    props.durationMode === 'AUTO_SEED'
      ? computeDynamicDurationFrames(props, fps)
      : Math.round((props.targetDurationSeconds ?? 15) * fps);
  const targetDurationSec = durationInFrames / fps;

  // Hướng 1: Nhịp thở sân khấu 0.35s đầu (Frame 0 -> 21 @ 60fps) trước khi Dòng 1 thấm mực
  const introBufferFrames = Math.round(STAGE_LEAD_IN_SECONDS * fps);

  const nonEmptyLines = props.segments.filter(
    (s) => stripInlineMarkdown(s).trim().length > 0
  );
  const activeLineCount = Math.max(1, nonEmptyLines.length);
  const fadeDurationFrames = Math.round(1.05 * fps);

  // Phân bổ đều các dòng từ 0.35s đến ~6.20s (bước 1.95s cho thơ 4 câu, tối đa 2.25s cho câu 2-3 dòng)
  const maxRevealWindowSec = Math.min(
    5.85,
    Math.max(3.6, targetDurationSec * 0.39)
  );
  const remainingLines = Math.max(1, activeLineCount - 1);
  const effectiveRevealWindowSec = Math.min(
    maxRevealWindowSec,
    remainingLines * 2.25
  );
  const stepBetweenLinesFrames =
    activeLineCount > 1
      ? Math.round((effectiveRevealWindowSec * fps) / remainingLines)
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
  let lastNonEmptyStartFrame = introBufferFrames;
  let lastNonEmptyEndFrame = introBufferFrames + fadeDurationFrames;

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
    } else {
      isFirstActiveLine = activeLineCursor === 0;
      startFrame =
        introBufferFrames + activeLineCursor * stepBetweenLinesFrames;
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
      const charRatio =
        cleanText.length > 0
          ? Math.max(0, Math.min(1, targetCharIndex / cleanText.length))
          : 0.5;
      const readDelaySec = 0.36 + charRatio * 0.52;
      detectedPivotFrame = isFirstActiveLine
        ? Math.round(targetDurationSec * 0.44 * fps)
        : Math.max(
            introBufferFrames + Math.round(0.38 * fps),
            startFrame + Math.round(readDelaySec * fps)
          );
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
    Math.max(
      Math.round(5.6 * fps),
      lastNonEmptyStartFrame + Math.round(0.38 * fps)
    );

  // Ràng buộc B.1: Neo mốc Header tan mực theo recommendedCoverFrame để Ảnh Bìa 3:4 sắc nét chữ tập
  // và bảo đảm Header tan xong hoàn toàn trước pivotFrame (chừa Hồi 2 & Hồi 3 sạch khung tĩnh).
  const pivotSeg = segmentTimings.find((s) => s.containsPivot);
  const spoilerStartFrame =
    pivotSeg && !pivotSeg.isFirstActiveLine
      ? pivotSeg.startFrame
      : Math.max(
          introBufferFrames + Math.round(0.9 * fps),
          pivotFrame - Math.round(0.6 * fps)
        );
  const setupSegments = segmentTimings.filter(
    (s) =>
      stripInlineMarkdown(s.text).trim().length > 0 &&
      !s.containsPivot &&
      s.startFrame < spoilerStartFrame
  );
  const lastSetupSeg =
    setupSegments.length > 0
      ? setupSegments[setupSegments.length - 1]
      : undefined;
  const rawCoverFrame = lastSetupSeg
    ? Math.min(
        lastSetupSeg.endTypingFrame,
        Math.max(
          introBufferFrames + Math.round(0.5 * fps),
          spoilerStartFrame - Math.round(0.2 * fps)
        )
      )
    : Math.max(
        introBufferFrames + Math.round(0.5 * fps),
        spoilerStartFrame - Math.round(0.25 * fps)
      );

  const holdAfterCoverFrames = Math.round(0.3 * fps); // 18 frames @ 60fps
  const minDissolveFrames = Math.round(0.55 * fps);
  const targetDissolveFrames = Math.round(0.8 * fps);
  const dissolveDeadlineFrame = Math.max(
    introBufferFrames + Math.round(0.7 * fps),
    pivotFrame - Math.max(4, Math.round(0.1 * fps))
  );

  let recommendedCoverFrame: number;
  let headerDissolveStartFrame: number;
  let headerDissolveEndFrame: number;

  if (
    rawCoverFrame + holdAfterCoverFrames + minDissolveFrames <=
    dissolveDeadlineFrame
  ) {
    recommendedCoverFrame = Math.max(introBufferFrames + 12, rawCoverFrame);
    headerDissolveStartFrame = recommendedCoverFrame + holdAfterCoverFrames;
    headerDissolveEndFrame = Math.min(
      dissolveDeadlineFrame,
      headerDissolveStartFrame + targetDissolveFrames
    );
  } else {
    headerDissolveEndFrame = dissolveDeadlineFrame;
    headerDissolveStartFrame = Math.max(
      introBufferFrames + Math.round(0.4 * fps),
      headerDissolveEndFrame - Math.round(0.6 * fps)
    );
    recommendedCoverFrame = Math.max(
      introBufferFrames + 6,
      Math.min(rawCoverFrame, headerDissolveStartFrame - holdAfterCoverFrames)
    );
  }

  const loopWindowFrames = Math.min(
    Math.round(TYPO_LOOP_FADE_SECONDS * fps),
    Math.floor(durationInFrames * 0.18)
  );
  const loopRestoreStartFrame = Math.max(
    pivotFrame + Math.round(0.4 * fps),
    durationInFrames - loopWindowFrames
  );

  return {
    fps,
    introBufferFrames,
    segmentTimings,
    pivotFrame,
    allTextFinishedFrame,
    durationInFrames,
    recommendedCoverFrame,
    headerDissolveStartFrame,
    headerDissolveEndFrame,
    loopRestoreStartFrame,
  };
}
