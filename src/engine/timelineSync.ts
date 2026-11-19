import { VideoInputProps } from '../schemas/videoSchema';
import { LAYOUT_TOKENS } from '../theme/palettes';

export const STAGE_LEAD_IN_SECONDS = 0.35;
export const TYPO_LOOP_FADE_SECONDS = 0.8;
export const ELASTIC_DURATION_MIN_SEC = 8.5;
export const ELASTIC_DURATION_MAX_SEC = 24.0;

export type ElasticDurationBand = 'BAND_S' | 'BAND_M' | 'BAND_L' | 'BAND_XL';

export type AutoPacingProfileId =
  | 'CONTEMPLATIVE_POEM'
  | 'LITERARY_PROSE'
  | 'WRY_BATHOS';

export interface AutoPacingProfile {
  id: AutoPacingProfileId;
  labelVi: string;
  /** Thời gian thấm mực 1 nhịp theo Ease-Out Cubic (giây) */
  tFadeSec: number;
  /** Nhịp đệm định vị mắt đầu nhịp (Split-Attention, giây) */
  tAnchorSec: number;
  /** Trọng số đọc nội tâm mỗi âm tiết tiếng Việt (giây/âm tiết) */
  tauSylSec: number;
  /** Nhịp nghỉ thêm khi cuối nhịp có dấu kết ý (. ! ? … :) hoặc ngắt khổ (giây) */
  tPausePunctSec: number;
  /** Khoảng nín thở trước nhịp chứa pivotWord (giây) */
  tPrePivotSec: number;
  /** Khoảng lắng hậu vị Hồi 2–3 sau khi chữ cuối đọc thấu (giây) */
  tDwellSec: number;
}

/**
 * 3 hồ sơ tốc độ đọc tự động theo nghiên cứu TNS-RES-TYPO-ELASTIC-V1.0 (PA-B):
 * Căn tự động theo `motion.pacingMode` + `textFormat` (không cần người dùng chỉnh tay).
 */
export const AUTO_PACING_PROFILES: Record<AutoPacingProfileId, AutoPacingProfile> =
  {
    CONTEMPLATIVE_POEM: {
      id: 'CONTEMPLATIVE_POEM',
      labelVi: 'Chiêm nghiệm · Thơ lắng',
      tFadeSec: 0.95,
      tAnchorSec: 0.5,
      tauSylSec: 0.32,
      tPausePunctSec: 0.3,
      tPrePivotSec: 0.5,
      tDwellSec: 4.5,
    },
    LITERARY_PROSE: {
      id: 'LITERARY_PROSE',
      labelVi: 'Văn học · Tản văn',
      tFadeSec: 0.85,
      tAnchorSec: 0.45,
      tauSylSec: 0.3,
      tPausePunctSec: 0.3,
      tPrePivotSec: 0.45,
      tDwellSec: 4.6,
    },
    WRY_BATHOS: {
      id: 'WRY_BATHOS',
      labelVi: 'Tự trào · Hài / Công sở',
      tFadeSec: 0.65,
      tAnchorSec: 0.38,
      tauSylSec: 0.24,
      tPausePunctSec: 0.25,
      tPrePivotSec: 0.4,
      tDwellSec: 3.6,
    },
  };

export function resolveAutoPacingProfile(
  props: Partial<Pick<VideoInputProps, 'textFormat' | 'motion'>>
): AutoPacingProfile {
  if (props.motion?.pacingMode === 'WRY_BATHOS') {
    return AUTO_PACING_PROFILES.WRY_BATHOS;
  }
  if (props.textFormat === 'PROSE') {
    return AUTO_PACING_PROFILES.LITERARY_PROSE;
  }
  return AUTO_PACING_PROFILES.CONTEMPLATIVE_POEM;
}

export function classifyElasticDurationBand(
  durationSec: number
): ElasticDurationBand {
  if (durationSec <= 11.5) return 'BAND_S';
  if (durationSec <= 16.0) return 'BAND_M';
  if (durationSec <= 19.5) return 'BAND_L';
  return 'BAND_XL';
}

/**
 * Bảo toàn nguyên trạng 7 Chén đã đóng băng (quote-001..quote-007) khi không bật AUTO_SEED:
 * giữ nguyên nhịp chia đều cũ & Ease-In-Out Sin để không xê dịch bất kỳ frame nào.
 */
export function isLegacyTimingCup(
  props: Pick<VideoInputProps, 'id' | 'durationMode'>
): boolean {
  if (props.durationMode === 'AUTO_SEED') return false;
  return /^quote-0*([1-7])$/i.test((props.id || '').trim());
}

export interface SegmentBeatChunk {
  /** Văn bản mảnh giữ nguyên *nghiêng* / **đậm**, đã bỏ ký hiệu nhịp "+" và " / " */
  rawText: string;
  /** Văn bản thuần hiển thị (đã bỏ markdown và ký hiệu nhịp) */
  cleanText: string;
  /** Vị trí ký tự bắt đầu của mảnh trong chuỗi cleanText đầy đủ của cả dòng */
  cleanCharOffset: number;
  /** Chỉ số nhịp 0-based trên toàn bài */
  beatIndex: number;
  startFrame: number;
  endTypingFrame: number;
  containsPivot: boolean;
}

export interface SegmentTiming {
  index: number;
  text: string;
  startFrame: number;
  endTypingFrame: number;
  isFirstActiveLine: boolean;
  containsPivot: boolean;
  pivotCharStartIndex: number;
  pivotCharEndIndex: number;
  /** Danh sách các mảnh nhịp trong cùng 1 dòng hiển thị (1 mảnh nếu dòng không có " / ") */
  chunks: SegmentBeatChunk[];
}

export interface TimelineSyncResult {
  fps: number;
  introBufferFrames: number;
  fadeDurationFrames: number;
  segmentTimings: SegmentTiming[];
  totalBeats: number;
  pivotFrame: number;
  allTextFinishedFrame: number;
  durationInFrames: number;
  durationBand: ElasticDurationBand;
  pacingProfileId: AutoPacingProfileId;
  effectiveCps: number;
  isLegacyTiming: boolean;
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

function countSyllablesInText(cleanText: string): number {
  const cleaned = cleanText
    .replace(/[.,;!?…""''“”‘’()[\]{}—–\-•/\\|]+/g, ' ')
    .trim();
  if (!cleaned) return 0;
  let count = 0;
  for (const part of cleaned.split(/\s+/)) {
    if (/[\p{L}\p{N}]/u.test(part)) count += 1;
  }
  return count;
}

function hasStrongPauseEnding(cleanText: string): boolean {
  const trimmed = cleanText.trim();
  if (!trimmed) return false;
  return /[.!?…:;»”"']$/.test(trimmed);
}

interface ParsedLinePlan {
  index: number;
  displayRawText: string;
  cleanText: string;
  isEmpty: boolean;
  parts: Array<{
    rawText: string;
    cleanText: string;
    cleanCharOffset: number;
    beatIndex: number;
  }>;
}

interface BeatMetrics {
  beatIndex: number;
  syllables: number;
  chars: number;
  hasStrongPauseAfter: boolean;
  containsPivot: boolean;
}

function buildLineAndBeatPlan(
  segments: string[],
  pivotWord: string
): {
  linePlans: ParsedLinePlan[];
  beats: BeatMetrics[];
  totalBeats: number;
  targetSegmentIndex: number;
  targetCharIndex: number;
  normalizedPivot: string;
} {
  let beatCursor = -1;
  let hasAnyActiveLine = false;
  const linePlans: ParsedLinePlan[] = segments.map((rawText, index) => {
    const parsed = parseSegmentBeatStructure(rawText);
    if (parsed.cleanText.length === 0) {
      return {
        index,
        displayRawText: '',
        cleanText: '',
        isEmpty: true,
        parts: [],
      };
    }

    const rawParts =
      parsed.rawParts.length > 0 ? parsed.rawParts : [parsed.displayRawText];
    const parts: ParsedLinePlan['parts'] = [];
    let cleanOffset = 0;

    for (let pIdx = 0; pIdx < rawParts.length; pIdx++) {
      if (pIdx === 0 && parsed.joinPreviousBeat && hasAnyActiveLine) {
        // Nối cùng nhịp với mảnh cuối của dòng trên
      } else {
        beatCursor += 1;
      }
      const partRaw = rawParts[pIdx];
      const partClean = partRaw.replace(/\*+/g, '');
      parts.push({
        rawText: partRaw,
        cleanText: partClean,
        cleanCharOffset: cleanOffset,
        beatIndex: Math.max(0, beatCursor),
      });
      cleanOffset += partClean.length + (pIdx < rawParts.length - 1 ? 1 : 0);
    }

    hasAnyActiveLine = true;
    return {
      index,
      displayRawText: parsed.displayRawText,
      cleanText: parsed.cleanText,
      isEmpty: false,
      parts,
    };
  });

  const normalizedPivot = stripInlineMarkdown(pivotWord).trim().toLowerCase();
  let targetSegmentIndex = -1;
  let targetCharIndex = -1;

  if (normalizedPivot.length > 0) {
    for (let i = linePlans.length - 1; i >= 0; i--) {
      const cleanSeg = linePlans[i].cleanText;
      if (!cleanSeg) continue;
      const idx = cleanSeg.toLowerCase().lastIndexOf(normalizedPivot);
      if (idx !== -1) {
        targetSegmentIndex = i;
        targetCharIndex = idx;
        break;
      }
    }
  }

  const totalBeats = Math.max(1, beatCursor + 1);
  const beats: BeatMetrics[] = Array.from({ length: totalBeats }, (_, bi) => ({
    beatIndex: bi,
    syllables: 0,
    chars: 0,
    hasStrongPauseAfter: false,
    containsPivot: false,
  }));

  let lastBeatSeen = -1;
  for (const plan of linePlans) {
    if (plan.isEmpty) {
      if (lastBeatSeen >= 0 && beats[lastBeatSeen]) {
        beats[lastBeatSeen].hasStrongPauseAfter = true;
      }
      continue;
    }
    const segHasPivot =
      plan.index === targetSegmentIndex && targetCharIndex !== -1;
    const pivotCharEnd = segHasPivot
      ? targetCharIndex + normalizedPivot.length
      : -1;
    for (const pt of plan.parts) {
      const b = beats[pt.beatIndex];
      b.syllables += countSyllablesInText(pt.cleanText);
      b.chars += pt.cleanText.length;
      if (hasStrongPauseEnding(pt.cleanText)) {
        b.hasStrongPauseAfter = true;
      }
      if (
        segHasPivot &&
        targetCharIndex < pt.cleanCharOffset + pt.cleanText.length &&
        pivotCharEnd > pt.cleanCharOffset
      ) {
        b.containsPivot = true;
      }
      lastBeatSeen = pt.beatIndex;
    }
  }

  return {
    linePlans,
    beats,
    totalBeats,
    targetSegmentIndex,
    targetCharIndex,
    normalizedPivot,
  };
}

/**
 * Tính bảng mốc nhịp thô (giây) & thời lượng đàn hồi đề xuất (8.5s–24.0s, bước 0.5s, né 15.0s/900f)
 * theo phương trình trọng số âm tiết của nghiên cứu TNS-RES-TYPO-ELASTIC-V1.0 (PA-B).
 */
function computeElasticBeatScheduleSec(
  props: Pick<VideoInputProps, 'id' | 'segments' | 'pivotWord'> &
    Partial<Pick<VideoInputProps, 'textFormat' | 'motion' | 'author'>>,
  beats: BeatMetrics[],
  profile: AutoPacingProfile
): {
  rawStepsSec: number[];
  lastBeatReadSec: number;
  elasticDurationSec: number;
  hasAuthorExtraSec: number;
} {
  const rawStepsSec: number[] = [];
  for (let b = 0; b < beats.length - 1; b++) {
    const cur = beats[b];
    const next = beats[b + 1];
    let dt = profile.tAnchorSec + cur.syllables * profile.tauSylSec;
    if (cur.hasStrongPauseAfter) dt += profile.tPausePunctSec;
    if (next.containsPivot) dt += profile.tPrePivotSec;
    // Sàn tối thiểu để nhịp rất ngắn vẫn kịp bắt nét dễ chịu
    dt = Math.max(profile.tFadeSec + 0.15, dt);
    rawStepsSec.push(dt);
  }

  const lastBeat = beats[beats.length - 1] ?? {
    syllables: 0,
    chars: 0,
    hasStrongPauseAfter: false,
    containsPivot: false,
    beatIndex: 0,
  };
  const lastBeatReadSec = Math.max(
    profile.tFadeSec,
    profile.tAnchorSec * 0.6 + lastBeat.syllables * profile.tauSylSec
  );
  const hasAuthorExtraSec = (props.author ?? '').trim().length > 0 ? 0.45 : 0;

  const rawSpanSec = rawStepsSec.reduce((sum, v) => sum + v, 0);
  const rawTotalSec =
    STAGE_LEAD_IN_SECONDS +
    rawSpanSec +
    lastBeatReadSec +
    hasAuthorExtraSec +
    profile.tDwellSec +
    TYPO_LOOP_FADE_SECONDS;

  let roundedSec = Math.round(rawTotalSec * 2) / 2;
  roundedSec = Math.max(
    ELASTIC_DURATION_MIN_SEC,
    Math.min(ELASTIC_DURATION_MAX_SEC, roundedSec)
  );
  // Giữ nguyên kỷ luật né mốc cứng 15.0s (900f @ 60fps) chống trùng nền tảng bằng seed tất định
  if (Math.abs(roundedSec - 15.0) < 0.001) {
    const seed = hashCupSeed(`${props.id}::${props.pivotWord || ''}`);
    roundedSec = seed % 2 === 0 ? 15.5 : 14.5;
  }

  return {
    rawStepsSec,
    lastBeatReadSec,
    elasticDurationSec: roundedSec,
    hasAuthorExtraSec,
  };
}

/**
 * Sinh tổng số frame đàn hồi theo nội dung (8.5s – 24.0s, bước 30f tại 60fps, né mốc cứng 900f)
 * dựa trên nhịp trọng số âm tiết thực tế, chế độ pacingMode/textFormat và seed của từng Chén.
 */
export function computeDynamicDurationFrames(
  props: Pick<VideoInputProps, 'id' | 'segments' | 'pivotWord'> &
    Partial<Pick<VideoInputProps, 'textFormat' | 'motion' | 'author'>>,
  fps: number = LAYOUT_TOKENS.fps
): number {
  const profile = resolveAutoPacingProfile(props);
  const { beats } = buildLineAndBeatPlan(props.segments, props.pivotWord);
  const { elasticDurationSec } = computeElasticBeatScheduleSec(
    props,
    beats,
    profile
  );
  const framesAt60 = Math.round(elasticDurationSec * 60);
  if (fps === 60) return framesAt60;
  return Math.max(240, Math.round((framesAt60 / 60) * fps));
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

/**
 * Gỡ 2 ký hiệu nhịp TF6 khỏi một dòng quote (giữ nguyên *nghiêng* / **đậm**):
 * - "+" đầu dòng (nối nhịp với dòng trên)
 * - " / " giữa dòng (tách nhịp cùng dòng hiển thị → nối lại bằng 1 dấu cách)
 */
export function stripBeatMarkers(raw: string): string {
  const trimmed = String(raw || '').trim();
  const withoutJoin =
    trimmed.startsWith('+') && trimmed.slice(1).trim().length > 0
      ? trimmed.slice(1).trimStart()
      : trimmed;
  return withoutJoin
    .split(/\s+\/\s+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .join(' ');
}

export function stripInlineMarkdown(raw: string): string {
  return stripBeatMarkers(raw).replace(/\*+/g, '');
}

/**
 * Tách 1 dòng raw thành thông tin nối nhịp ("+" đầu dòng) và các mảnh tách nhịp (" / " giữa dòng).
 */
export function parseSegmentBeatStructure(raw: string): {
  joinPreviousBeat: boolean;
  rawParts: string[];
  displayRawText: string;
  cleanText: string;
} {
  const trimmed = String(raw || '').trim();
  const joinPreviousBeat =
    trimmed.startsWith('+') && trimmed.slice(1).trim().length > 0;
  const withoutJoin = joinPreviousBeat
    ? trimmed.slice(1).trimStart()
    : trimmed;
  const rawParts = withoutJoin
    .split(/\s+\/\s+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  const displayRawText = rawParts.join(' ');
  const cleanText = displayRawText.replace(/\*+/g, '').trim();
  return { joinPreviousBeat, rawParts, displayRawText, cleanText };
}

/**
 * Đếm tổng số nhịp hiện chữ của mảng segments (dùng cho UI ô biên tập & timelineSync).
 */
export function countQuoteBeats(segments: string[]): number {
  let beatCursor = -1;
  let hasAnyActiveLine = false;
  for (const raw of segments) {
    const parsed = parseSegmentBeatStructure(raw);
    if (parsed.cleanText.length === 0) continue;
    const parts = parsed.rawParts.length > 0 ? parsed.rawParts : [parsed.displayRawText];
    for (let pIdx = 0; pIdx < parts.length; pIdx++) {
      if (pIdx === 0 && parsed.joinPreviousBeat && hasAnyActiveLine) {
        // Nối cùng nhịp với dòng trên
      } else {
        beatCursor += 1;
      }
    }
    hasAnyActiveLine = true;
  }
  return beatCursor >= 0 ? beatCursor + 1 : 0;
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
  const legacyTiming = isLegacyTimingCup(props);
  const profile = resolveAutoPacingProfile(props);
  const {
    linePlans,
    beats,
    totalBeats,
    targetSegmentIndex,
    targetCharIndex,
    normalizedPivot,
  } = buildLineAndBeatPlan(props.segments, props.pivotWord);

  // Hướng 1: Nhịp thở sân khấu 0.35s đầu (Frame 0 -> 21 @ 60fps) trước khi Nhịp 1 thấm mực
  const introBufferFrames = Math.round(STAGE_LEAD_IN_SECONDS * fps);

  let durationInFrames: number;
  let targetDurationSec: number;
  let fadeDurationFrames: number;
  let beatStartFrames: number[];
  let revealTotalReadSec: number;

  if (legacyTiming) {
    // Nhánh bảo toàn nguyên trạng 7 Chén cũ (quote-001..007): không đổi 1 frame nào
    durationInFrames = Math.round((props.targetDurationSeconds ?? 15) * fps);
    targetDurationSec = durationInFrames / fps;
    fadeDurationFrames = Math.round(1.05 * fps);

    const maxRevealWindowSec = Math.min(
      5.85,
      Math.max(3.6, targetDurationSec * 0.39)
    );
    const remainingBeats = Math.max(1, totalBeats - 1);
    const effectiveRevealWindowSec = Math.min(
      maxRevealWindowSec,
      remainingBeats * 2.25
    );
    const stepBetweenBeatsFrames =
      totalBeats > 1
        ? Math.round((effectiveRevealWindowSec * fps) / remainingBeats)
        : 0;
    beatStartFrames = Array.from(
      { length: totalBeats },
      (_, bi) => introBufferFrames + bi * stepBetweenBeatsFrames
    );
    revealTotalReadSec = Math.max(
      1.05,
      (beatStartFrames[beatStartFrames.length - 1] - introBufferFrames) / fps +
        1.05
    );
  } else {
    // Nhánh PA-B: Nhịp trọng số âm tiết từng nhịp + Thời lượng đàn hồi 8.5s–24.0s
    const {
      rawStepsSec,
      lastBeatReadSec,
      elasticDurationSec,
      hasAuthorExtraSec,
    } = computeElasticBeatScheduleSec(props, beats, profile);

    if (props.durationMode === 'AUTO_SEED') {
      targetDurationSec = elasticDurationSec;
      durationInFrames = Math.round(targetDurationSec * fps);
    } else {
      durationInFrames = Math.round((props.targetDurationSeconds ?? 15) * fps);
      targetDurationSec = durationInFrames / fps;
    }

    fadeDurationFrames = Math.round(profile.tFadeSec * fps);

    // Đảm bảo vẫn giữ đủ khoảng lắng hậu vị (Hồi 2–3) nếu bị kẹp ở trần 24s hoặc khi người dùng chọn FIXED ngắn
    const minDwellSec =
      props.durationMode === 'AUTO_SEED'
        ? Math.min(profile.tDwellSec, 3.8)
        : Math.min(profile.tDwellSec, Math.max(2.8, targetDurationSec * 0.28));
    const maxAllowedSpanSec = Math.max(
      1.2,
      targetDurationSec -
        STAGE_LEAD_IN_SECONDS -
        lastBeatReadSec -
        hasAuthorExtraSec -
        minDwellSec -
        TYPO_LOOP_FADE_SECONDS
    );
    const rawSpanSec = rawStepsSec.reduce((sum, v) => sum + v, 0);
    const spanScale =
      rawSpanSec > maxAllowedSpanSec && rawSpanSec > 0
        ? maxAllowedSpanSec / rawSpanSec
        : 1;

    const beatStartSecs: number[] = [STAGE_LEAD_IN_SECONDS];
    for (const s of rawStepsSec) {
      beatStartSecs.push(beatStartSecs[beatStartSecs.length - 1] + s * spanScale);
    }
    beatStartFrames = beatStartSecs.map((sec) => Math.round(sec * fps));
    revealTotalReadSec = Math.max(
      profile.tFadeSec,
      beatStartSecs[beatStartSecs.length - 1] -
        STAGE_LEAD_IN_SECONDS +
        lastBeatReadSec
    );
  }

  let detectedPivotFrame: number | null = null;
  let detectedPivotChunkStartFrame: number | null = null;
  let activeLineCursor = 0;
  let lastNonEmptyStartFrame = introBufferFrames;
  let lastNonEmptyEndFrame = introBufferFrames + fadeDurationFrames;

  const segmentTimings: SegmentTiming[] = linePlans.map((plan) => {
    const isEmptyStanzaBreak = plan.isEmpty;
    let isFirstActiveLine = false;

    let startFrame: number;
    let endTypingFrame: number;
    let chunks: SegmentBeatChunk[] = [];

    const containsPivot =
      !isEmptyStanzaBreak &&
      plan.index === targetSegmentIndex &&
      targetCharIndex !== -1;
    const pivotCharEnd = containsPivot
      ? targetCharIndex + normalizedPivot.length
      : -1;

    if (isEmptyStanzaBreak) {
      startFrame = lastNonEmptyStartFrame;
      endTypingFrame = lastNonEmptyEndFrame;
    } else {
      isFirstActiveLine = activeLineCursor === 0;
      chunks = plan.parts.map((pt) => {
        const cStart =
          beatStartFrames[pt.beatIndex] ?? introBufferFrames;
        const cEnd = cStart + fadeDurationFrames;
        const ptEndOffset = pt.cleanCharOffset + pt.cleanText.length;
        const chunkHasPivot =
          containsPivot &&
          targetCharIndex < ptEndOffset &&
          pivotCharEnd > pt.cleanCharOffset;
        return {
          rawText: pt.rawText,
          cleanText: pt.cleanText,
          cleanCharOffset: pt.cleanCharOffset,
          beatIndex: pt.beatIndex,
          startFrame: cStart,
          endTypingFrame: cEnd,
          containsPivot: chunkHasPivot,
        };
      });

      // Mốc line_N = nhịp đầu của dòng hiển thị N
      startFrame = chunks[0].startFrame;
      endTypingFrame = chunks[chunks.length - 1].endTypingFrame;
      lastNonEmptyStartFrame = chunks[chunks.length - 1].startFrame;
      lastNonEmptyEndFrame = endTypingFrame;
      activeLineCursor += 1;
    }

    if (containsPivot && chunks.length > 0) {
      // Tính pivot trong đúng NHỊP chứa pivotWord
      const pivotChunk =
        chunks.find(
          (c) =>
            targetCharIndex >= c.cleanCharOffset &&
            targetCharIndex < c.cleanCharOffset + c.cleanText.length
        ) ??
        chunks.find((c) => c.containsPivot) ??
        chunks[chunks.length - 1];
      const localOffset = Math.max(
        0,
        targetCharIndex - pivotChunk.cleanCharOffset
      );
      const charRatio =
        pivotChunk.cleanText.length > 0
          ? Math.max(0, Math.min(1, localOffset / pivotChunk.cleanText.length))
          : 0.5;
      const isPivotFirstBeat = pivotChunk.beatIndex === 0;
      detectedPivotChunkStartFrame = pivotChunk.startFrame;

      if (legacyTiming) {
        const readDelaySec = 0.36 + charRatio * 0.52;
        detectedPivotFrame = isPivotFirstBeat
          ? Math.round(targetDurationSec * 0.44 * fps)
          : Math.max(
              introBufferFrames + Math.round(0.38 * fps),
              pivotChunk.startFrame + Math.round(readDelaySec * fps)
            );
      } else {
        const pivotChunkSyl = Math.max(
          1,
          countSyllablesInText(pivotChunk.cleanText)
        );
        const rawReadDelay =
          0.32 +
          charRatio * Math.max(0.45, pivotChunkSyl * profile.tauSylSec * 0.55);
        const readDelaySec = Math.max(0.35, Math.min(1.35, rawReadDelay));
        const maxPivotFrame = Math.max(
          introBufferFrames + Math.round(0.8 * fps),
          durationInFrames - Math.round(3.0 * fps)
        );
        const computedPivot = isPivotFirstBeat
          ? Math.round(targetDurationSec * 0.42 * fps)
          : Math.max(
              introBufferFrames + Math.round(0.38 * fps),
              pivotChunk.startFrame + Math.round(readDelaySec * fps)
            );
        detectedPivotFrame = Math.min(maxPivotFrame, computedPivot);
      }
    }

    return {
      index: plan.index,
      text: plan.displayRawText,
      startFrame,
      endTypingFrame,
      isFirstActiveLine,
      containsPivot,
      pivotCharStartIndex: containsPivot ? targetCharIndex : -1,
      pivotCharEndIndex: pivotCharEnd,
      chunks,
    };
  });

  const minAllFinishedFloorFrames = legacyTiming
    ? Math.round(5.2 * fps)
    : Math.round(Math.min(5.2, targetDurationSec * 0.35) * fps);
  const allTextFinishedFrame = Math.max(
    lastNonEmptyEndFrame,
    minAllFinishedFloorFrames
  );

  const pivotFrame =
    detectedPivotFrame ??
    Math.min(
      Math.max(
        introBufferFrames + Math.round(0.8 * fps),
        durationInFrames - Math.round(3.0 * fps)
      ),
      Math.max(
        Math.round(Math.min(5.6, targetDurationSec * 0.42) * fps),
        lastNonEmptyStartFrame + Math.round(0.38 * fps)
      )
    );

  // Ràng buộc B.1: Neo mốc Header tan mực theo recommendedCoverFrame để Ảnh Bìa 3:4 sắc nét chữ tập
  // và bảo đảm Header tan xong hoàn toàn trước pivotFrame (chừa Hồi 2 & Hồi 3 sạch khung tĩnh).
  const pivotSeg = segmentTimings.find((s) => s.containsPivot);
  const spoilerStartFrame =
    detectedPivotChunkStartFrame !== null &&
    detectedPivotChunkStartFrame > introBufferFrames
      ? detectedPivotChunkStartFrame
      : pivotSeg && !pivotSeg.isFirstActiveLine
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

  const totalCleanChars = beats.reduce((sum, b) => sum + b.chars, 0);
  const effectiveCps = Number(
    (totalCleanChars / Math.max(0.5, revealTotalReadSec)).toFixed(1)
  );

  return {
    fps,
    introBufferFrames,
    fadeDurationFrames,
    segmentTimings,
    totalBeats,
    pivotFrame,
    allTextFinishedFrame,
    durationInFrames,
    durationBand: classifyElasticDurationBand(targetDurationSec),
    pacingProfileId: profile.id,
    effectiveCps,
    isLegacyTiming: legacyTiming,
    recommendedCoverFrame,
    headerDissolveStartFrame,
    headerDissolveEndFrame,
    loopRestoreStartFrame,
  };
}
