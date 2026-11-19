import {
  CustomPropDefinition,
  CustomPropDefinitionSchema,
  InlineShape,
  StageScript,
  StageScriptSchema,
  formatStageScriptZodError,
} from '../stage/stageScriptSchema';
import { resolveXCoord } from '../stage/terrainSystem';
import {
  AudioMode,
  AudioModeEnum,
  DurationMode,
  DurationModeEnum,
  FoleyPivotStyle,
  PacingModeEnum,
  StageTuning,
  StageTuningSchema,
  ThemeIdEnum,
  VisualDNASpec,
  VisualDNASchema,
} from '../schemas/videoSchema';
import {
  auditTikTokSeoCaption,
  generateSeedCommentForCup,
  stripBannedHashtags,
} from './captionBuilder';
import { ensureValidPivotSubstring } from './validator';
import { auditVietnameseSyllables, computeTimelineSync } from '../engine/timelineSync';
import { resolveVisualDNA } from '../engine/visualDnaResolver';
import { isGoiChen, parseGoiChen, GoiChenResult } from '../stage/goiChenParser';
import { validateStageScriptHard } from '../stage/stageValidator';

export interface StageLayoutWarning {
  code:
    | 'HEADROOM_OVERLAP'
    | 'EDGE_SAFETY'
    | 'POST_COLLISION'
    | 'DRAFT_PROP'
    | 'FREE_MODE_WARN';
  severity: 'warn' | 'info';
  targetId: string;
  timeSec?: number;
  message: string;
  suggestedLiftY?: number;
}

export interface SanitizedCupBundle {
  bundleVersion: string;
  mode: 'create_new' | 'overwrite_cup';
  targetCupId?: string;
  cupId?: string;
  /** Nguyên văn JSON Gói Chén người dùng đã dán khi nhập (để đối chiếu kịch bản ↔ output) */
  goiChenGoc?: Record<string, unknown>;
  /** Nguyên văn JSON kịch bản Làn tự do (`che_do: "tu_do"`) người dùng đã dán khi nhập */
  scriptGoc?: Record<string, unknown>;
  /** true nếu đây là kịch bản Làn tự do chính thức (`che_do: "tu_do"`) */
  isFreeMode?: boolean;
  title: string;
  author: string;
  textFormat: 'POEM' | 'PROSE';
  segments: string[];
  pivotWord: string;
  fontSizeScale: number;
  themeId: 'MINIMAL_LIGHT' | 'MINIMAL_DARK' | 'WARM_NOIR';
  pacingMode: 'CONTEMPLATIVE' | 'WRY_BATHOS';
  durationMode: DurationMode;
  targetDurationSeconds: number;
  stageTuning: StageTuning;
  visualDNA?: VisualDNASpec;
  audioMode: AudioMode;
  foleyPivotStyle: FoleyPivotStyle;
  publishSlot: 'Morning' | 'Anytime' | 'Night';
  publishMood: string;
  publishTopic: string;
  sourceRecordId?: string;
  customCaption?: string;
  seedComment?: string;
  customProps: Record<string, CustomPropDefinition>;
  sceneId?: string;
  stageScript?: StageScript;
  tsxCode?: string;
  tsxMeta?: {
    sceneId: string;
    name?: string;
    description?: string;
    act1?: string;
    act2AtPivot?: string;
    act3Afterimage?: string;
    redProp?: string;
  };
  syllableCount: number;
  syllableLabel: string;
  layoutWarnings: StageLayoutWarning[];
  autoFixesApplied: string[];
  engineCapabilities: {
    hasArticulatedProps: boolean;
    hasCustomTerrain: boolean;
    hasCustomActorRig: boolean;
    hasCustomTsxCode: boolean;
  };
}

const ATMOSPHERE_SYNONYM_MAP: Record<string, string> = {
  breeze: 'wind',
  gust: 'wind',
  drizzle: 'rain',
  shower: 'rain',
  leaf: 'leaves',
  falling_leaves: 'leaves',
  smoke: 'steam',
  mist: 'steam',
  bird: 'birds',
  flock: 'birds',
  morning_sun: 'hollow_sun',
  moon: 'crescent',
  crescent_moon: 'crescent',
  pulse: 'ring_pulse',
  ripple: 'ring_pulse',
};

const POSE_SYNONYM_MAP: Record<string, string> = {
  walking: 'walk',
  stroll: 'walk',
  standing: 'stand',
  idle: 'stand',
  wait: 'stand',
  pushing: 'push',
  sit: 'sit_lean',
  sitting: 'sit_lean',
  seated: 'sit_lean',
  gaze: 'look_up',
  look: 'look_up',
  reach: 'reach_out',
  invite: 'give',
  offer: 'give',
  hand_over: 'give',
  raise: 'hold_up',
  lift: 'hold_up',
};

const COLOR_ROLE_SYNONYM_MAP: Record<string, 'ink' | 'secondary' | 'accent'> = {
  ink: 'ink',
  primary: 'ink',
  black: 'ink',
  charcoal: 'ink',
  secondary: 'secondary',
  muted: 'secondary',
  gray: 'secondary',
  grey: 'secondary',
  wash: 'secondary',
  accent: 'accent',
  red: 'accent',
  cinnabar: 'accent',
  vermilion: 'accent',
  highlight: 'accent',
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v && typeof v === 'object' && !Array.isArray(v));
}

/**
 * Tách thông minh khối JSON từ nội dung người dùng copy trên Gemini Web
 * (kể cả khi copy dính lời dẫn tiếng Việt bên ngoài hoặc hàng rào ```json ... ```).
 */
export function extractJsonFromGeminiPaste(rawText: string): unknown {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error('Nội dung dán đang trống. Hãy dán gói JSON từ Gemini vào đây.');
  }

  // 1. Thử parse trực tiếp nếu đã là JSON thuần
  try {
    return JSON.parse(trimmed);
  } catch {
    // tiếp tục bóc tách bên dưới
  }

  // 2. Ưu tiên khối ```json ... ``` hoặc ``` ... ``` lớn nhất
  const fenceRegex = /```(?:json|jsonc|javascript|js)?\s*([\s\S]*?)```/gi;
  const candidates: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = fenceRegex.exec(trimmed)) !== null) {
    if (match[1]?.trim()) {
      candidates.push(match[1].trim());
    }
  }
  candidates.sort((a, b) => b.length - a.length);
  for (const cand of candidates) {
    try {
      return JSON.parse(cand);
    } catch {
      // thử ứng viên tiếp theo
    }
  }

  // 3. Quét cặp ngoặc nhọn ngoài cùng { ... } có cân bằng chuỗi
  const firstBrace = trimmed.indexOf('{');
  if (firstBrace !== -1) {
    let depth = 0;
    let inStr = false;
    let escaped = false;
    for (let i = firstBrace; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (inStr) {
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === '"') {
          inStr = false;
        }
        continue;
      }
      if (ch === '"') {
        inStr = true;
      } else if (ch === '{') {
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0) {
          const slice = trimmed.slice(firstBrace, i + 1);
          try {
            return JSON.parse(slice);
          } catch {
            // thử tìm đến dấu } cuối cùng bên dưới
          }
          break;
        }
      }
    }

    const lastBrace = trimmed.lastIndexOf('}');
    if (lastBrace > firstBrace) {
      const fallbackSlice = trimmed.slice(firstBrace, lastBrace + 1);
      return JSON.parse(fallbackSlice);
    }
  }

  throw new Error(
    'Không tìm thấy khối JSON hợp lệ trong nội dung vừa dán. Hãy copy trọn vẹn khối ```json ... ``` mà Gemini xuất ra.'
  );
}

function normalizePublishSlot(raw?: unknown): 'Morning' | 'Anytime' | 'Night' {
  const s = String(raw ?? '').trim().toLowerCase();
  if (!s) return 'Anytime';
  if (s === 'morning' || /sáng|binh minh|bình minh|06:|07:/i.test(s)) {
    return 'Morning';
  }
  if (s === 'night' || /tối|đêm|khuya|21:|22:/i.test(s)) {
    return 'Night';
  }
  return 'Anytime';
}

function normalizeThemeId(
  raw?: unknown
): 'MINIMAL_LIGHT' | 'MINIMAL_DARK' | 'WARM_NOIR' {
  const key = String(raw ?? '')
    .trim()
    .toUpperCase();
  const parsed = ThemeIdEnum.safeParse(key);
  if (parsed.success) return parsed.data;
  if (
    key.includes('CONTEMPLATIVE') ||
    key.includes('INK_NIGHT') ||
    key.includes('DARK_NOIR') ||
    key.includes('DARK_NIGHT') ||
    key.includes('NIGHT_INK') ||
    key.includes('NOIR') ||
    key.includes('SEPIA') ||
    key.includes('OLONG') ||
    (key.includes('WARM') && key.includes('DARK'))
  ) {
    return 'WARM_NOIR';
  }
  if (key.includes('DARK')) return 'MINIMAL_DARK';
  return 'MINIMAL_LIGHT';
}

function normalizePacingMode(raw?: unknown): 'CONTEMPLATIVE' | 'WRY_BATHOS' {
  const key = String(raw ?? '')
    .trim()
    .toUpperCase();
  const parsed = PacingModeEnum.safeParse(key);
  if (parsed.success) return parsed.data;
  if (/BATHOS|WRY|FUNNY|HUMOR|HAI|HÀI/i.test(key)) return 'WRY_BATHOS';
  return 'CONTEMPLATIVE';
}

function normalizeFoleyStyle(raw?: unknown): FoleyPivotStyle {
  const key = String(raw ?? '')
    .trim()
    .toUpperCase();
  if (
    key === 'TEA_CUP' ||
    key === 'TEACUP' ||
    key === 'TEA_CUP_SETTLE' ||
    key === 'PORCELAIN_POUR' ||
    key.includes('TEA') ||
    key.includes('POUR') ||
    key.includes('CUP')
  ) {
    return 'TEA_CUP';
  }
  if (
    key === 'WIND_CHIME' ||
    key === 'CHIME' ||
    key === 'WARM_BELL' ||
    key === 'PAPER_BREEZE' ||
    key.includes('BELL') ||
    key.includes('CHIME') ||
    key.includes('BREEZE')
  ) {
    return 'WIND_CHIME';
  }
  if (
    key === 'WOOD_SEAL' ||
    key === 'BAMBOO_TAP' ||
    key === 'SEAL' ||
    key === 'STAMP' ||
    key.includes('WOOD') ||
    key.includes('BAMBOO') ||
    key.includes('TAP') ||
    key.includes('SEAL')
  ) {
    return 'WOOD_SEAL';
  }
  return 'AUTO';
}

function normalizeColorRole(
  raw: unknown
): 'ink' | 'secondary' | 'accent' | undefined {
  if (typeof raw !== 'string') return undefined;
  const k = raw.trim().toLowerCase();
  return COLOR_ROLE_SYNONYM_MAP[k];
}

function normalizeLayer(
  raw: unknown,
  targetLabel?: string,
  autoFixes?: string[]
): 'sky' | 'far' | 'mid' | 'fore' | undefined {
  if (raw === undefined || raw === null) return undefined;
  const k = String(raw).trim().toLowerCase();
  if (k === 'sky' || k === 'far' || k === 'mid' || k === 'fore') {
    return k;
  }
  let mapped: 'sky' | 'far' | 'mid' | 'fore' = 'mid';
  if (k === 'heaven' || k === 'top' || k === 'clouds' || k === 'air' || k === 'upper') {
    mapped = 'sky';
  } else if (
    k === 'back' ||
    k === 'background' ||
    k === 'bg' ||
    k === 'behind' ||
    k === 'rear' ||
    k === 'deep' ||
    k === 'distant'
  ) {
    mapped = 'far';
  } else if (
    k === 'front' ||
    k === 'foreground' ||
    k === 'fg' ||
    k === 'near' ||
    k === 'overlay'
  ) {
    mapped = 'fore';
  }
  if (autoFixes && targetLabel) {
    autoFixes.push(
      `Tự chuẩn hóa layer "${String(raw)}" -> "${mapped}" cho "${targetLabel}"`
    );
  }
  return mapped;
}

function normalizeFocusRole(
  raw: unknown
): 'hero' | 'support' | 'ambient' | undefined {
  if (raw === undefined || raw === null) return undefined;
  const k = String(raw).trim().toLowerCase();
  if (k === 'hero' || k === 'support' || k === 'ambient') return k;
  if (k === 'main' || k === 'primary' || k === 'lead' || k === 'focus') {
    return 'hero';
  }
  if (k === 'background' || k === 'bg' || k === 'decor' || k === 'env' || k === 'atmosphere') {
    return 'ambient';
  }
  return 'support';
}

function normalizeAnchorType(
  raw: unknown
): 'ground' | 'hand' | 'center' | undefined {
  if (raw === undefined || raw === null) return undefined;
  const k = String(raw).trim().toLowerCase();
  if (k === 'ground' || k === 'hand' || k === 'center') return k;
  if (k === 'hold' || k === 'held' || k === 'actor') return 'hand';
  if (k === 'middle' || k === 'mid' || k === 'air' || k === 'float') {
    return 'center';
  }
  return 'ground';
}

function normalizeDirectionSide(raw: unknown): 'left' | 'right' | undefined {
  if (raw === undefined || raw === null) return undefined;
  const k = String(raw).trim().toLowerCase();
  if (k === 'left' || k === 'west' || k === 'l' || k === 'backward') {
    return 'left';
  }
  if (k === 'right' || k === 'east' || k === 'r' || k === 'forward') {
    return 'right';
  }
  return 'right';
}

function normalizeXCoordValue(raw: unknown): unknown {
  if (typeof raw === 'number') return raw;
  if (typeof raw !== 'string') return raw;
  const k = raw.trim().toLowerCase();
  const asNum = Number(k);
  if (k !== '' && Number.isFinite(asNum)) return asNum;
  if (
    k === 'far_left' ||
    k === 'left' ||
    k === 'center_left' ||
    k === 'center' ||
    k === 'center_right' ||
    k === 'right' ||
    k === 'far_right'
  ) {
    return k;
  }
  if (k === 'mid_left' || k === 'middle_left') return 'center_left';
  if (k === 'mid_right' || k === 'middle_right') return 'center_right';
  if (k === 'middle' || k === 'mid') return 'center';
  return 'center';
}

function normalizeIdleValue(raw: unknown): unknown {
  const mapMode = (m: unknown): 'none' | 'float' | 'bob' | 'sway' | 'pulse' | 'drift' => {
    const k = String(m ?? '').trim().toLowerCase();
    if (k === 'float' || k === 'bob' || k === 'sway' || k === 'pulse' || k === 'drift' || k === 'none') {
      return k;
    }
    if (k === 'hover') return 'float';
    if (k === 'bounce') return 'bob';
    if (k === 'wave' || k === 'rock' || k === 'breeze') return 'sway';
    if (k === 'breathe' || k === 'glow') return 'pulse';
    if (k === 'glide') return 'drift';
    return 'none';
  };
  if (typeof raw === 'string') return mapMode(raw);
  if (isRecord(raw)) {
    return { ...raw, type: mapMode(raw.type) };
  }
  return undefined;
}

function normalizeTerrainType(
  raw: unknown
):
  | 'flat'
  | 'slope'
  | 'hill'
  | 'fork'
  | 'water_shore'
  | 'cliff_gap'
  | 'stairs'
  | 'custom_path' {
  const k = String(raw ?? '').trim().toLowerCase();
  if (
    k === 'flat' ||
    k === 'slope' ||
    k === 'hill' ||
    k === 'fork' ||
    k === 'water_shore' ||
    k === 'cliff_gap' ||
    k === 'stairs' ||
    k === 'custom_path'
  ) {
    return k;
  }
  if (k === 'step' || k === 'steps' || k === 'stair' || k === 'staircase' || k === 'terrace') {
    return 'stairs';
  }
  if (
    k === 'custom' ||
    k === 'path' ||
    k === 'curve' ||
    k === 'spline' ||
    k === 'polyline' ||
    k === 'arch' ||
    k === 'rooftop' ||
    k === 'deck'
  ) {
    return 'custom_path';
  }
  if (k === 'incline' || k === 'uphill' || k === 'downhill') return 'slope';
  if (k === 'mound' || k === 'dune' || k === 'ridge') return 'hill';
  if (k === 'crossroad' || k === 'split') return 'fork';
  if (k === 'shore' || k === 'river' || k === 'lake' || k === 'water') {
    return 'water_shore';
  }
  if (k === 'cliff' || k === 'gap' || k === 'bridge' || k === 'chasm') {
    return 'cliff_gap';
  }
  return 'flat';
}

function sanitizeShapeAnim(rawAnim: unknown): Record<string, unknown> | undefined {
  if (!isRecord(rawAnim)) return undefined;
  const k = String(rawAnim.type ?? 'swing').trim().toLowerCase();
  let animType: 'spin' | 'swing' | 'bob' | 'pulse' | 'flutter' = 'swing';
  if (
    k === 'spin' ||
    k === 'rotate' ||
    k === 'wheel' ||
    k === 'roll' ||
    k === 'turn'
  ) {
    animType = 'spin';
  } else if (
    k === 'swing' ||
    k === 'rock' ||
    k === 'sway' ||
    k === 'pendulum' ||
    k === 'wag' ||
    k === 'walk_leg'
  ) {
    animType = 'swing';
  } else if (k === 'flutter' || k === 'wave' || k === 'flap') {
    animType = 'flutter';
  } else if (k === 'bob' || k === 'float' || k === 'bounce' || k === 'up_down') {
    animType = 'bob';
  } else if (k === 'pulse' || k === 'breathe' || k === 'scale' || k === 'throb') {
    animType = 'pulse';
  }

  const out: Record<string, unknown> = { type: animType };
  if (
    Array.isArray(rawAnim.pivot) &&
    rawAnim.pivot.length >= 2 &&
    Number.isFinite(Number(rawAnim.pivot[0])) &&
    Number.isFinite(Number(rawAnim.pivot[1]))
  ) {
    out.pivot = [Number(rawAnim.pivot[0]), Number(rawAnim.pivot[1])];
  }
  if (rawAnim.speed !== undefined && Number.isFinite(Number(rawAnim.speed))) {
    out.speed = Number(rawAnim.speed);
  } else if (rawAnim.freq !== undefined && Number.isFinite(Number(rawAnim.freq))) {
    out.speed = Number(rawAnim.freq);
  }
  if (
    rawAnim.amplitude !== undefined &&
    Number.isFinite(Number(rawAnim.amplitude))
  ) {
    out.amplitude = Number(rawAnim.amplitude);
  } else if (
    rawAnim.ampDeg !== undefined &&
    Number.isFinite(Number(rawAnim.ampDeg))
  ) {
    out.amplitude = Number(rawAnim.ampDeg);
  }
  if (rawAnim.phase !== undefined && Number.isFinite(Number(rawAnim.phase))) {
    out.phase = Number(rawAnim.phase);
  }
  if (rawAnim.direction !== undefined) {
    const d = String(rawAnim.direction).trim().toLowerCase();
    out.direction =
      d === '-1' || d === 'ccw' || d === 'left' || d === 'counterclockwise'
        ? -1
        : 1;
  }
  const driveRaw =
    rawAnim.driveByMotion ?? rawAnim.driveByWalk ?? rawAnim.linkToMotion;
  if (driveRaw !== undefined) {
    out.driveByMotion = Boolean(driveRaw);
  }
  return out;
}

function sanitizeInlineShapes(rawShapes: unknown): unknown {
  if (!Array.isArray(rawShapes)) return rawShapes;
  return rawShapes.map((sh) => {
    if (!isRecord(sh)) return sh;
    const next: Record<string, unknown> = { ...sh };
    if (next.role !== undefined) {
      next.role = normalizeColorRole(next.role) ?? 'ink';
    }
    if (typeof next.fill === 'string') {
      const f = next.fill.trim().toLowerCase();
      if (f === 'red' || f === 'cinnabar' || f === 'vermilion') next.fill = 'accent';
      else if (f === 'paper' || f === 'background') next.fill = 'bg';
      else if (f === 'primary' || f === 'black' || f === 'charcoal') next.fill = 'ink';
      else if (f === 'muted' || f === 'gray' || f === 'grey') next.fill = 'secondary';
      else if (f !== 'none' && f !== 'bg' && f !== 'ink' && f !== 'secondary' && f !== 'accent') {
        next.fill = 'none';
      }
    }
    if (next.splitSide !== undefined) {
      next.splitSide = normalizeDirectionSide(next.splitSide);
    }
    if (typeof next.show === 'string') {
      const s = next.show.trim().toLowerCase();
      if (s !== 'always' && s !== 'before_pivot' && s !== 'after_pivot') {
        next.show = 'always';
      }
    }
    const rawAnimCandidate = next.anim ?? next.motion;
    if (rawAnimCandidate !== undefined) {
      const cleanedAnim = sanitizeShapeAnim(rawAnimCandidate);
      if (cleanedAnim) {
        next.anim = cleanedAnim;
      } else {
        delete next.anim;
      }
      delete next.motion;
    }
    return next;
  });
}

export function sanitizeStageScriptObject(
  rawScript: Record<string, unknown>,
  autoFixes: string[] = []
): StageScript {
  const clone: Record<string, unknown> = { ...rawScript };

  if (typeof clone.terrain === 'string') {
    clone.terrain = normalizeTerrainType(clone.terrain);
  } else if (isRecord(clone.terrain)) {
    const t = { ...clone.terrain };
    if (Array.isArray(t.points)) {
      t.points = t.points
        .filter(
          (pt) =>
            Array.isArray(pt) &&
            pt.length >= 2 &&
            Number.isFinite(Number(pt[0])) &&
            Number.isFinite(Number(pt[1]))
        )
        .map((pt) => [Number((pt as unknown[])[0]), Number((pt as unknown[])[1])]);
      if ((t.points as unknown[]).length < 2) {
        delete t.points;
      }
    }
    if (t.type !== undefined) {
      t.type = normalizeTerrainType(t.type);
    } else if (Array.isArray(t.points) && t.points.length >= 2) {
      t.type = 'custom_path';
    }
    if (t.type === 'flat' && Array.isArray(t.points) && t.points.length >= 2) {
      t.type = 'custom_path';
    }
    if (t.hillCenterX !== undefined) t.hillCenterX = normalizeXCoordValue(t.hillCenterX);
    if (t.forkAtX !== undefined) t.forkAtX = normalizeXCoordValue(t.forkAtX);
    if (t.shoreX !== undefined) t.shoreX = normalizeXCoordValue(t.shoreX);
    if (t.gapCenterX !== undefined) t.gapCenterX = normalizeXCoordValue(t.gapCenterX);
    if (t.stairsStartX !== undefined) {
      t.stairsStartX = normalizeXCoordValue(t.stairsStartX);
    }
    if (t.stairsEndX !== undefined) {
      t.stairsEndX = normalizeXCoordValue(t.stairsEndX);
    }
    if (t.waterSide !== undefined) t.waterSide = normalizeDirectionSide(t.waterSide);
    clone.terrain = t;
  }

  if (Array.isArray(clone.atmosphere)) {
    clone.atmosphere = clone.atmosphere.map((item) => {
      if (!isRecord(item)) return item;
      const next = { ...item };
      if (typeof next.type === 'string') {
        const key = next.type.trim().toLowerCase();
        if (ATMOSPHERE_SYNONYM_MAP[key]) {
          autoFixes.push(
            `Chuẩn hóa atmosphere.type "${next.type}" -> "${ATMOSPHERE_SYNONYM_MAP[key]}"`
          );
          next.type = ATMOSPHERE_SYNONYM_MAP[key];
        }
      }
      if (next.x !== undefined) next.x = normalizeXCoordValue(next.x);
      if (next.direction !== undefined) {
        next.direction = normalizeDirectionSide(next.direction);
      }
      if (next.colorRole !== undefined) {
        next.colorRole = normalizeColorRole(next.colorRole) ?? 'secondary';
      }
      if (next.focusRole !== undefined) {
        next.focusRole = normalizeFocusRole(next.focusRole);
      }
      return next;
    });
  }

  if (Array.isArray(clone.actors)) {
    clone.actors = clone.actors.map((act) => {
      if (!isRecord(act)) return act;
      const next = { ...act };
      const actorId = String(next.id || 'actor');
      if (next.x !== undefined) next.x = normalizeXCoordValue(next.x);
      if (next.facing !== undefined) {
        next.facing = normalizeDirectionSide(next.facing);
      }
      if (typeof next.pose === 'string') {
        const key = next.pose.trim().toLowerCase();
        if (POSE_SYNONYM_MAP[key]) {
          autoFixes.push(
            `Chuẩn hóa actor "${actorId}" pose "${next.pose}" -> "${POSE_SYNONYM_MAP[key]}"`
          );
          next.pose = POSE_SYNONYM_MAP[key];
        }
      }
      if (next.pose === 'sit_lean' && next.sitProgress === undefined) {
        next.sitProgress = 1;
      }
      if (next.colorRole !== undefined) {
        next.colorRole = normalizeColorRole(next.colorRole) ?? 'ink';
      }
      if (next.focusRole !== undefined) {
        next.focusRole = normalizeFocusRole(next.focusRole);
      }
      if (next.layer !== undefined) {
        next.layer = normalizeLayer(next.layer, actorId, autoFixes);
      }
      return next;
    });
  }

  if (Array.isArray(clone.props)) {
    clone.props = clone.props.map((pr) => {
      if (!isRecord(pr)) return pr;
      const next = { ...pr };
      const propId = String(next.id || next.type || 'prop');
      if (next.x !== undefined) next.x = normalizeXCoordValue(next.x);
      if (next.layer !== undefined) {
        next.layer = normalizeLayer(next.layer, propId, autoFixes);
      }
      if (next.focusRole !== undefined) {
        next.focusRole = normalizeFocusRole(next.focusRole);
      }
      if (next.anchorType !== undefined) {
        next.anchorType = normalizeAnchorType(next.anchorType);
      }
      if (next.idle !== undefined) {
        next.idle = normalizeIdleValue(next.idle);
      }
      if (next.colorRole !== undefined) {
        next.colorRole = normalizeColorRole(next.colorRole) ?? 'ink';
      }
      if (next.shapes) next.shapes = sanitizeInlineShapes(next.shapes);
      if (next.altShapes) next.altShapes = sanitizeInlineShapes(next.altShapes);
      return next;
    });
  }

  if (Array.isArray(clone.timeline)) {
    clone.timeline = clone.timeline.map((cue) => {
      if (!isRecord(cue)) return cue;
      const next = { ...cue };
      if (next.x !== undefined) next.x = normalizeXCoordValue(next.x);
      if (next.toX !== undefined) next.toX = normalizeXCoordValue(next.toX);
      if (next.facing !== undefined) {
        next.facing = normalizeDirectionSide(next.facing);
      }
      if (typeof next.pose === 'string') {
        const key = next.pose.trim().toLowerCase();
        if (POSE_SYNONYM_MAP[key]) {
          next.pose = POSE_SYNONYM_MAP[key];
        }
      }
      if (next.colorRole !== undefined) {
        next.colorRole = normalizeColorRole(next.colorRole) ?? 'accent';
      }
      if (isRecord(next.emitters) && next.emitters.colorRole !== undefined) {
        next.emitters = {
          ...next.emitters,
          colorRole: normalizeColorRole(next.emitters.colorRole) ?? 'accent',
        };
      }
      return next;
    });
  }

  if (clone.che_do === 'tu_do') {
    delete clone.legacy;
  }

  const parsed = StageScriptSchema.safeParse(clone);
  if (!parsed.success) {
    throw new Error(
      `Lỗi cấu trúc Kịch bản Sân khấu (StageScript):\n${formatStageScriptZodError(
        parsed.error
      )}`
    );
  }
  return parsed.data;
}

function estimateOverheadLowestCanopyY(shapes: InlineShape[] | undefined): {
  spansWideCanopy: boolean;
  canopyBottomY: number | null;
} {
  if (!shapes || shapes.length === 0) {
    return { spansWideCanopy: false, canopyBottomY: null };
  }
  let minX = 0;
  let maxX = 0;
  const highNegativeYs: number[] = [];

  for (const sh of shapes) {
    if (typeof sh.d === 'string') {
      const nums = sh.d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
      for (let i = 0; i + 1 < nums.length; i += 2) {
        const x = nums[i];
        const y = nums[i + 1];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        // Các nét thuộc phần vòm mái / tán che trên cao (y nằm trong vùng -95..-30)
        if (y <= -30 && y >= -95 && Math.abs(x) >= 12) {
          highNegativeYs.push(y);
        }
      }
    }
    if (Array.isArray(sh.rect) && sh.rect.length >= 4) {
      const [rx, ry, rw, rh] = sh.rect;
      const x2 = rx + rw;
      if (rx < minX) minX = rx;
      if (x2 > maxX) maxX = x2;
      const bottomY = ry + rh;
      if (rw >= 32 && bottomY <= -30 && ry >= -98) {
        highNegativeYs.push(bottomY);
      }
    }
    if (Array.isArray(sh.line) && sh.line.length >= 4) {
      const [lx1, ly1, lx2, ly2] = sh.line;
      if (Math.min(lx1, lx2) < minX) minX = Math.min(lx1, lx2);
      if (Math.max(lx1, lx2) > maxX) maxX = Math.max(lx1, lx2);
      const lowY = Math.max(ly1, ly2);
      if (Math.abs(lx2 - lx1) >= 32 && lowY <= -30 && lowY >= -98) {
        highNegativeYs.push(lowY);
      }
    }
  }

  const width = maxX - minX;
  if (width >= 48 && highNegativeYs.length > 0) {
    const lowestInCanopy = Math.max(...highNegativeYs);
    return { spansWideCanopy: true, canopyBottomY: lowestInCanopy };
  }
  return { spansWideCanopy: false, canopyBottomY: null };
}

/**
 * Kiểm tra va chạm thị giác trên sân khấu (Đặc biệt: lỗi mái hiên / tán ô cắt ngang đỉnh đầu nhân vật).
 */
export function auditStageVisualLayout(
  script: StageScript | undefined,
  customProps: Record<string, CustomPropDefinition> = {}
): StageLayoutWarning[] {
  if (!script) return [];
  const warnings: StageLayoutWarning[] = [];
  const cues = script.timeline ?? [];

  // Đỉnh đầu cao nhất của các nhân vật chính (hero / support đứng)
  const mainActors = (script.actors ?? []).filter(
    (a) => a.focusRole !== 'ambient' && a.layer !== 'far'
  );

  let highestActorHeadY = -48.2; // mặt đất = 0, âm là hướng lên trời
  const actorXRanges: Array<{ id: string; minX: number; maxX: number; headTopY: number }> = [];

  for (const actor of mainActors) {
    const scale = actor.scale ?? 1.15;
    const isSitting =
      actor.pose === 'sit_lean' || (actor.sitProgress ?? 0) >= 0.6;
    const headTopY =
      (isSitting ? -34.4 : -48.2) * scale + (actor.yOffset ?? 0);
    if (headTopY < highestActorHeadY) {
      highestActorHeadY = headTopY;
    }

    const xs = [resolveXCoord(actor.x, 270)];
    for (const c of cues) {
      if (c.target === actor.id && (c.toX !== undefined || c.x !== undefined)) {
        xs.push(resolveXCoord(c.toX ?? c.x, xs[0]));
      }
    }
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    actorXRanges.push({ id: actor.id, minX, maxX, headTopY });

    if (minX < 92 || maxX > 448) {
      warnings.push({
        code: 'EDGE_SAFETY',
        severity: 'warn',
        targetId: actor.id,
        message: `Nhân vật "${actor.id}" di chuyển sát mép cắt 9:19.5 (X=${Math.round(
          minX
        )}..${Math.round(maxX)}). Nên giữ X trong khoảng 105..435.`,
      });
    }
  }

  for (const prop of script.props ?? []) {
    if (prop.layer === 'sky') continue;
    const def =
      prop.shapes || prop.altShapes
        ? { shapes: prop.shapes ?? [], altShapes: prop.altShapes }
        : prop.type
          ? customProps[prop.type]
          : undefined;
    if (!def) continue;

    let maxScale = prop.scale ?? 1;
    let minPropY = prop.y ?? 0;
    const propXs = [resolveXCoord(prop.x, 270)];
    for (const c of cues) {
      if (c.target === prop.id) {
        if (c.scale !== undefined && c.scale > maxScale) maxScale = c.scale;
        if (c.toY !== undefined && c.toY < minPropY) minPropY = c.toY;
        if (c.y !== undefined && c.y < minPropY) minPropY = c.y;
        if (c.toX !== undefined || c.x !== undefined) {
          propXs.push(resolveXCoord(c.toX ?? c.x, propXs[0]));
        }
      }
    }

    const checkPrimary = estimateOverheadLowestCanopyY(def.shapes);
    const checkAlt = estimateOverheadLowestCanopyY(def.altShapes);
    const activeCanopyBottom =
      checkAlt.spansWideCanopy && checkAlt.canopyBottomY !== null
        ? checkAlt.canopyBottomY
        : checkPrimary.spansWideCanopy
          ? checkPrimary.canopyBottomY
          : null;

    if (activeCanopyBottom !== null && !prop.follow) {
      const worldCanopyBottom = minPropY + activeCanopyBottom * maxScale;
      const centerPropX = propXs[propXs.length - 1];
      const overlapsActor = actorXRanges.some(
        (a) => a.maxX >= centerPropX - 48 && a.minX <= centerPropX + 48
      );
      if (overlapsActor && worldCanopyBottom > highestActorHeadY - 4) {
        const neededLift = Math.ceil(
          worldCanopyBottom - (highestActorHeadY - 7)
        );
        warnings.push({
          code: 'HEADROOM_OVERLAP',
          severity: 'warn',
          targetId: prop.id,
          suggestedLiftY: -Math.max(4, neededLift),
          message: `Đạo cụ vòm/mái "${prop.id}" đang đặt hơi thấp (gầm y≈${worldCanopyBottom.toFixed(
            0
          )} so với đỉnh đầu nhân vật y≈${highestActorHeadY.toFixed(
            0
          )}), dễ đè ngang đầu nhân vật. Bấm "Tự nâng thoáng đầu" hoặc kéo Cao độ Y xuống thêm ${-Math.max(
            4,
            neededLift
          )}px.`,
        });
      }
    }
  }

  return warnings;
}

/**
 * Tự động nâng nhẹ đạo cụ vòm/mái bị thấp để không chạm đầu nhân vật.
 */
export function applyAutoHeadroomFix(
  script: StageScript,
  warnings: StageLayoutWarning[]
): StageScript {
  const liftMap = new Map<string, number>();
  for (const w of warnings) {
    if (w.code === 'HEADROOM_OVERLAP' && w.suggestedLiftY) {
      liftMap.set(w.targetId, w.suggestedLiftY);
    }
  }
  if (liftMap.size === 0) return script;

  return {
    ...script,
    props: (script.props ?? []).map((p) => {
      const dy = liftMap.get(p.id);
      if (!dy) return p;
      return {
        ...p,
        y: Math.round(((p.y ?? 0) + dy) * 10) / 10,
      };
    }),
    timeline: (script.timeline ?? []).map((c) => {
      const dy = liftMap.get(c.target);
      if (!dy) return c;
      if (c.toY === undefined && c.y === undefined) return c;
      return {
        ...c,
        ...(c.toY !== undefined ? { toY: Math.round((c.toY + dy) * 10) / 10 } : {}),
        ...(c.y !== undefined ? { y: Math.round((c.y + dy) * 10) / 10 } : {}),
      };
    }),
  };
}

function toSafeCustomSceneId(rawId?: string, fallbackTitle?: string): string {
  const base = (rawId && rawId.trim()) || (fallbackTitle && fallbackTitle.trim()) || 'SCENE';
  const clean = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '_')
    .replace(/^CUSTOM_+/, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/, '');
  return `CUSTOM_${clean || 'SCENE'}`;
}

function toSafeSceneComponentName(safeSceneId: string): string {
  const pascal = safeSceneId
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return pascal.endsWith('Scene') ? pascal : `${pascal}Scene`;
}

/**
 * Bộ tự hàn gắn (Auto-Sanitizer) cho mã cảnh React/SVG `.tsx` do AI sinh ra trong gói CupBundle.
 * Tự động bóc rào markdown, chuẩn hóa đường dẫn import tương đối (`../../kit/...`), bổ sung khai báo
 * kiểu `ArchetypeComponentProps` và chuyển đổi `export default` sang `export const Custom...Scene`.
 */
export function sanitizeGeneratedTsxSceneCode(
  rawCode: string,
  rawSceneId?: string,
  autoFixes: string[] = [],
  fallbackTitle?: string
): { tsxCode: string; sceneId: string; componentName: string } {
  let code = rawCode.trim();

  // 1. Bóc hàng rào ```tsx ... ``` nếu AI bọc thừa trong chuỗi JSON
  const fenceMatch = code.match(
    /^```(?:tsx|typescript|ts|jsx|javascript|js)?\s*([\s\S]*?)```$/i
  );
  if (fenceMatch?.[1]) {
    code = fenceMatch[1].trim();
    autoFixes.push('Đã tự bóc hàng rào markdown thừa trong tsxCode');
  }

  // 2. Giải mã \n bị escape kép nếu toàn bộ chuỗi chưa có ký tự xuống dòng thật
  if (!code.includes('\n') && code.includes('\\n')) {
    code = code
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '  ')
      .replace(/\\"/g, '"');
    autoFixes.push('Đã tự giải mã ký tự xuống dòng bị escape trong tsxCode');
  }

  // 3. Tự sửa đường dẫn import tương đối để khớp vị trí `src/scenes/custom/<Name>.tsx`
  const beforeImports = code;
  code = code
    .replace(
      /from\s+['"](?:@\/|src\/|(?:\.\.?\/)+)?components\/archetypes\/types['"]/g,
      "from '../../components/archetypes/types'"
    )
    .replace(
      /from\s+['"](?:@\/|src\/|(?:\.\.?\/)+)?archetypes\/types['"]/g,
      "from '../../components/archetypes/types'"
    )
    .replace(
      /from\s+['"](?:@\/|src\/|(?:\.\.?\/)+)?(kit|engine|theme|stage|schemas)\/([A-Za-z0-9_/-]+)['"]/g,
      "from '../../$1/$2'"
    );
  if (code !== beforeImports) {
    autoFixes.push(
      'Đã tự chuẩn hóa đường dẫn import tương đối trong mô-đun .tsx'
    );
  }

  const safeSceneId = toSafeCustomSceneId(rawSceneId, fallbackTitle);
  let componentName = toSafeSceneComponentName(safeSceneId);

  // 4. Đảm bảo có import React và ArchetypeComponentProps
  const prependLines: string[] = [];
  if (!/import\s+(?:\*\s+as\s+)?React\b/.test(code)) {
    prependLines.push("import React from 'react';");
    autoFixes.push('Tự bổ sung import React cho mô-đun .tsx');
  }
  if (!/ArchetypeComponentProps/.test(code)) {
    prependLines.push(
      "import type { ArchetypeComponentProps } from '../../components/archetypes/types';"
    );
  } else if (
    !/import\s+.*ArchetypeComponentProps.*from/.test(code)
  ) {
    prependLines.push(
      "import type { ArchetypeComponentProps } from '../../components/archetypes/types';"
    );
    autoFixes.push(
      'Tự bổ sung import kiểu ArchetypeComponentProps cho mô-đun .tsx'
    );
  }
  if (prependLines.length > 0) {
    code = `${prependLines.join('\n')}\n${code}`;
  }

  // 5. Đảm bảo xuất đúng dạng `export const <ComponentName>: React.FC<ArchetypeComponentProps>`
  const exportedConstMatch = code.match(
    /export\s+const\s+([A-Za-z0-9_]+)\s*(?::|\s*=)/
  );
  if (exportedConstMatch?.[1]) {
    componentName = exportedConstMatch[1];
  } else {
    const defaultFnMatch = code.match(
      /export\s+default\s+function\s+([A-Za-z0-9_]+)/
    );
    const namedFnMatch = code.match(/export\s+function\s+([A-Za-z0-9_]+)/);
    const defaultIdentMatch = code.match(
      /export\s+default\s+([A-Za-z0-9_]+)\s*;?/
    );
    if (defaultFnMatch?.[1]) {
      const fnName = defaultFnMatch[1];
      code = code.replace(
        /export\s+default\s+function\s+([A-Za-z0-9_]+)/,
        'function $1'
      );
      code += `\nexport const ${componentName}: React.FC<ArchetypeComponentProps> = ${fnName} as React.FC<ArchetypeComponentProps>;\n`;
      autoFixes.push(
        `Tự chuẩn hóa export default function "${fnName}" -> export const ${componentName}`
      );
    } else if (namedFnMatch?.[1]) {
      const fnName = namedFnMatch[1];
      code = code.replace(/export\s+function\s+([A-Za-z0-9_]+)/, 'function $1');
      code += `\nexport const ${componentName}: React.FC<ArchetypeComponentProps> = ${fnName} as React.FC<ArchetypeComponentProps>;\n`;
      autoFixes.push(
        `Tự chuẩn hóa export function "${fnName}" -> export const ${componentName}`
      );
    } else if (defaultIdentMatch?.[1]) {
      const ident = defaultIdentMatch[1];
      code = code.replace(/export\s+default\s+[A-Za-z0-9_]+\s*;?/, '');
      code += `\nexport const ${componentName}: React.FC<ArchetypeComponentProps> = ${ident} as React.FC<ArchetypeComponentProps>;\n`;
      autoFixes.push(
        `Tự chuyển export default "${ident}" -> export const ${componentName}`
      );
    }
  }

  return {
    tsxCode: code.trim(),
    sceneId: safeSceneId,
    componentName,
  };
}

/**
 * Lỗi validation Gói Chén — mang theo danh sách lỗi để UI hiện từng dòng.
 */
export class GoiChenValidationError extends Error {
  public readonly errors: string[];
  constructor(errors: string[]) {
    super(errors.join('\n'));
    this.name = 'GoiChenValidationError';
    this.errors = errors;
  }
}

/**
 * Chuyển đổi Gói Chén đã validate → SanitizedCupBundle.
 */
function convertGoiChenToBundle(
  obj: Record<string, unknown>,
  options?: {
    defaultMode?: 'create_new' | 'overwrite_cup';
    targetCupId?: string;
    fallbackCupProps?: {
      title?: string;
      segments?: string[];
      pivotWord?: string;
      textFormat?: 'POEM' | 'PROSE';
    };
  }
): SanitizedCupBundle {
  const result = parseGoiChen(obj, { cupId: options?.targetCupId });
  if (!result.ok || !result.compiled) {
    throw new GoiChenValidationError(result.errors);
  }

  const segments = result.cau ?? [];
  const pivotWord = result.cuLat ?? '';
  const title = result.tieuDe ?? 'Gói Chén';
  const author = result.tacGia ?? '';

  const nonEmptyLines = segments.filter((s) => s.trim().length > 0);
  const inferredPoem =
    nonEmptyLines.length >= 2 &&
    nonEmptyLines.every((s) => s.split(/\s+/).length <= 10 && s.length <= 54);
  const textFormat: 'POEM' | 'PROSE' = inferredPoem ? 'POEM' : 'PROSE';

  const syl = auditVietnameseSyllables(segments);
  const fontSizeScale =
    textFormat === 'POEM' && syl.count > 20 ? 0.84 : 1.0;

  const requestedMode =
    options?.defaultMode ?? 'create_new';

  const draftPropWarnings: StageLayoutWarning[] = (result.warnings ?? []).map(
    (msg, idx) => ({
      code: 'DRAFT_PROP',
      severity: 'warn',
      targetId: `draft_prop_${idx + 1}`,
      message: msg,
    })
  );

  return {
    bundleVersion: 'goichen_1',
    mode: requestedMode,
    targetCupId: options?.targetCupId,
    goiChenGoc: obj,
    title,
    author,
    textFormat,
    segments,
    pivotWord,
    fontSizeScale,
    themeId: 'MINIMAL_LIGHT',
    pacingMode: 'WRY_BATHOS',
    durationMode: 'AUTO_SEED',
    targetDurationSeconds: 15,
    stageTuning: { offsetX: 0, offsetY: 0, scale: 1, strokeScale: 1 },
    audioMode: 'FOLEY_MASTER',
    foleyPivotStyle: 'AUTO',
    publishSlot: 'Anytime',
    publishMood: '',
    publishTopic: '',
    customProps: {},
    stageScript: result.compiled,
    syllableCount: syl.count,
    syllableLabel: syl.label,
    layoutWarnings: draftPropWarnings,
    autoFixesApplied: ['Gói Chén v1 → biên dịch ngữ nghĩa tự động'],
    engineCapabilities: {
      hasArticulatedProps: false,
      hasCustomTerrain: false,
      hasCustomActorRig: false,
      hasCustomTsxCode: false,
    },
  };
}

/**
 * Chuẩn hóa toàn diện gói JSON dán từ Gemini Web thành SanitizedCupBundle sạch 100%.
 */
export function sanitizeAndNormalizeCupBundle(
  rawInput: unknown,
  options?: {
    defaultMode?: 'create_new' | 'overwrite_cup';
    targetCupId?: string;
    fallbackCupProps?: {
      title?: string;
      segments?: string[];
      pivotWord?: string;
      textFormat?: 'POEM' | 'PROSE';
    };
  }
): SanitizedCupBundle {
  const parsedRoot =
    typeof rawInput === 'string' ? extractJsonFromGeminiPaste(rawInput) : rawInput;

  if (!isRecord(parsedRoot)) {
    throw new Error('Gói dữ liệu phải là một đối tượng JSON ({ ... }).');
  }

  // ── Nhận dạng Gói Chén (phien_ban_goi + cau + cu_lat) ──
  if (isGoiChen(parsedRoot)) {
    return convertGoiChenToBundle(parsedRoot, options);
  }

  const autoFixes: string[] = [];

  // Cho phép người dùng dán cả: (A) CupBundle V8.5/V8.4, (B) CupRecord { props: ... }, hoặc (C) chỉ nguyên StageScript { actors, props, timeline }
  const isStandaloneStageScript =
    !Array.isArray(parsedRoot.segments) &&
    !isRecord(parsedRoot.props) &&
    (Array.isArray(parsedRoot.actors) || Array.isArray(parsedRoot.timeline));

  const propWrapper =
    !isStandaloneStageScript &&
    isRecord(parsedRoot.props) &&
    Array.isArray((parsedRoot.props as Record<string, unknown>).segments)
      ? (parsedRoot.props as Record<string, unknown>)
      : null;

  const src = propWrapper ? { ...parsedRoot, ...propWrapper } : parsedRoot;

  let rawSegments: string[] = [];
  if (Array.isArray(src.segments)) {
    rawSegments = src.segments.map((s) => String(s ?? '').trim());
  } else if (typeof src.quote === 'string' || typeof src.rawText === 'string') {
    const txt = String(src.quote ?? src.rawText ?? '');
    rawSegments = txt
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l, idx, arr) => l.length > 0 || (idx > 0 && arr[idx - 1] !== ''));
    autoFixes.push('Tự động tách dòng văn bản sang mảng segments[]');
  } else if (
    isStandaloneStageScript &&
    options?.fallbackCupProps?.segments?.length
  ) {
    rawSegments = [...options.fallbackCupProps.segments];
    autoFixes.push(
      'Phát hiện bạn dán riêng StageScript -> Giữ nguyên câu chữ của Chén đang mở'
    );
  }

  if (rawSegments.filter((s) => s.trim().length > 0).length === 0) {
    throw new Error(
      'Thiếu nội dung câu chữ ("segments": ["Dòng 1", "Dòng 2", ...]).'
    );
  }

  const nonEmptyLines = rawSegments.filter((s) => s.length > 0);
  const inferredPoem =
    nonEmptyLines.length >= 2 &&
    nonEmptyLines.every((s) => s.split(/\s+/).length <= 10 && s.length <= 54);

  const rawFormat = String(
    src.textFormat ?? options?.fallbackCupProps?.textFormat ?? ''
  )
    .trim()
    .toUpperCase();
  const textFormat: 'POEM' | 'PROSE' =
    rawFormat === 'PROSE'
      ? 'PROSE'
      : rawFormat === 'POEM'
        ? 'POEM'
        : inferredPoem
          ? 'POEM'
          : 'PROSE';

  const candidatePivot = String(
    src.pivotWord ?? options?.fallbackCupProps?.pivotWord ?? ''
  ).trim();
  const pivotWord = ensureValidPivotSubstring(rawSegments, candidatePivot);
  if (candidatePivot && pivotWord.toLowerCase() !== candidatePivot.toLowerCase()) {
    autoFixes.push(
      `Tự khớp lại pivotWord "${candidatePivot}" -> "${pivotWord}" để nằm đúng trong câu`
    );
  }

  const title =
    String(
      src.title ??
        (isStandaloneStageScript ? options?.fallbackCupProps?.title : '') ??
        'Trà Sớm'
    ).trim() || 'Trà Sớm';
  const author = String(src.author ?? '').trim();

  const fontSizeScaleRaw = Number(src.fontSizeScale ?? 1.0);
  const fontSizeScale = Number.isFinite(fontSizeScaleRaw)
    ? Math.max(0.88, Math.min(1.15, fontSizeScaleRaw))
    : 1.0;

  const themeId = normalizeThemeId(src.themeId ?? src.themeVariant);
  const motionObj = isRecord(src.motion) ? src.motion : {};
  const pacingMode = normalizePacingMode(
    src.pacingMode ?? motionObj.pacingMode
  );

  const durRaw = Number(src.targetDurationSeconds ?? 15);
  const targetDurationSeconds = Number.isFinite(durRaw)
    ? Math.max(12, Math.min(22, Math.round(durRaw)))
    : 15;
  const parsedDurationMode = DurationModeEnum.safeParse(src.durationMode);
  const durationMode: DurationMode = parsedDurationMode.success
    ? parsedDurationMode.data
    : src.targetDurationSeconds !== undefined
      ? 'FIXED'
      : 'AUTO_SEED';

  const parsedTuning = StageTuningSchema.safeParse(src.stageTuning ?? {});
  const stageTuning: StageTuning = parsedTuning.success
    ? parsedTuning.data
    : { offsetX: 0, offsetY: 0, scale: 1.05, strokeScale: 1 };

  const parsedVisualDNA = src.visualDNA
    ? VisualDNASchema.safeParse(src.visualDNA)
    : null;
  const visualDNA: VisualDNASpec | undefined =
    parsedVisualDNA && parsedVisualDNA.success ? parsedVisualDNA.data : undefined;

  const bgmObj = isRecord(src.bgm) ? src.bgm : {};
  const parsedAudioMode = AudioModeEnum.safeParse(src.audioMode ?? bgmObj.audioMode);
  const audioMode: AudioMode = parsedAudioMode.success
    ? parsedAudioMode.data
    : 'PIVOT_ACCENT';
  const foleyPivotStyle = normalizeFoleyStyle(
    src.foleyPivotStyle ?? bgmObj.foleyPivotStyle
  );

  const publishSlot = normalizePublishSlot(src.publishSlot ?? src.slot);
  const publishMood = String(src.publishMood ?? src.mood ?? 'Nhẹ nhàng').trim();
  const publishTopic = String(src.publishTopic ?? src.topic ?? '').trim();
  const sourceRecordId = src.sourceRecordId
    ? String(src.sourceRecordId).trim()
    : undefined;

  let customCaption: string | undefined;
  const rawCaption = String(src.customCaption ?? src.captionText ?? '').trim();
  if (rawCaption) {
    const cleanedCap = stripBannedHashtags(rawCaption);
    const seoCheck = auditTikTokSeoCaption(cleanedCap, rawSegments);
    if (!seoCheck.duplicatesQuoteVerbatim) {
      customCaption = cleanedCap;
    } else {
      autoFixes.push(
        'Caption AI sinh bị lặp nguyên văn câu chữ -> Đã chuyển sang bộ sinh Caption SEO sạch chuẩn kênh'
      );
    }
  }

  // Gom toàn bộ customProps từ cấp gốc hoặc trong stageScript.customProps / customPropsResolved
  const customProps: Record<string, CustomPropDefinition> = {};
  const rawStageCandidate = isStandaloneStageScript
    ? parsedRoot
    : isRecord(src.stageScript)
      ? src.stageScript
      : isRecord(motionObj.stageScript)
        ? motionObj.stageScript
        : isRecord(src.scene) &&
            (Array.isArray((src.scene as Record<string, unknown>).actors) ||
              Array.isArray((src.scene as Record<string, unknown>).timeline))
          ? (src.scene as Record<string, unknown>)
          : null;

  const rawCustomSources = [
    isRecord(src.customProps) ? src.customProps : null,
    rawStageCandidate && isRecord(rawStageCandidate.customProps)
      ? (rawStageCandidate.customProps as Record<string, unknown>)
      : null,
    rawStageCandidate && isRecord(rawStageCandidate.customPropsResolved)
      ? (rawStageCandidate.customPropsResolved as Record<string, unknown>)
      : null,
  ];

  for (const mapCandidate of rawCustomSources) {
    if (!mapCandidate) continue;
    for (const [propKey, rawDef] of Object.entries(mapCandidate)) {
      if (!isRecord(rawDef)) continue;
      const sanitizedDef = {
        ...rawDef,
        ...(rawDef.anchorType !== undefined
          ? { anchorType: normalizeAnchorType(rawDef.anchorType) }
          : {}),
        shapes: sanitizeInlineShapes(rawDef.shapes),
        ...(rawDef.altShapes
          ? { altShapes: sanitizeInlineShapes(rawDef.altShapes) }
          : {}),
      };
      const defParsed = CustomPropDefinitionSchema.safeParse(sanitizedDef);
      if (defParsed.success) {
        customProps[propKey.trim()] = defParsed.data;
      }
    }
  }

  let stageScript: StageScript | undefined;
  if (rawStageCandidate) {
    stageScript = sanitizeStageScriptObject(rawStageCandidate, autoFixes);
    for (const p of stageScript.props ?? []) {
      if (p.saveAs && p.shapes && p.shapes.length > 0) {
        customProps[p.saveAs.trim()] = {
          anchorType: p.anchorType ?? 'ground',
          emitterOffset: p.emitterOffset,
          tiltPivot: p.tiltPivot,
          shapes: p.shapes,
          altShapes: p.altShapes,
        };
      }
    }
  }

  let tsxCode: string | undefined;
  let tsxMeta: SanitizedCupBundle['tsxMeta'];
  const rawSceneObj = isRecord(src.scene) ? src.scene : undefined;
  const rawTsxCandidate =
    typeof rawSceneObj?.tsxCode === 'string' && rawSceneObj.tsxCode.trim()
      ? rawSceneObj.tsxCode
      : typeof src.tsxCode === 'string' && src.tsxCode.trim()
        ? src.tsxCode
        : undefined;

  if (rawTsxCandidate) {
    const healedTsx = sanitizeGeneratedTsxSceneCode(
      rawTsxCandidate,
      String(rawSceneObj?.sceneId ?? src.sceneId ?? ''),
      autoFixes,
      title
    );
    tsxCode = healedTsx.tsxCode;
    tsxMeta = {
      sceneId: healedTsx.sceneId,
      name: rawSceneObj?.name
        ? String(rawSceneObj.name)
        : `Cảnh Tự Động — ${title}`,
      description: rawSceneObj?.description
        ? String(rawSceneObj.description)
        : undefined,
      act1: rawSceneObj?.act1 ? String(rawSceneObj.act1) : undefined,
      act2AtPivot: rawSceneObj?.act2AtPivot
        ? String(rawSceneObj.act2AtPivot)
        : undefined,
      act3Afterimage: rawSceneObj?.act3Afterimage
        ? String(rawSceneObj.act3Afterimage)
        : undefined,
      redProp: rawSceneObj?.redProp ? String(rawSceneObj.redProp) : undefined,
    };
  }

  const explicitSceneId = String(
    tsxMeta?.sceneId ??
      stageScript?.sceneId ??
      src.sceneId ??
      motionObj.sceneId ??
      (rawSceneObj ? rawSceneObj.sceneId : '') ??
      ''
  ).trim();

  const hasShapeAnim = (shapes?: InlineShape[]) =>
    Boolean(shapes?.some((sh) => Boolean(sh.anim)));
  const hasArticulatedProps =
    Object.values(customProps).some(
      (def) => hasShapeAnim(def.shapes) || hasShapeAnim(def.altShapes)
    ) ||
    Boolean(
      stageScript?.props?.some(
        (p) => hasShapeAnim(p.shapes) || hasShapeAnim(p.altShapes)
      )
    );
  const terrainTypeVal =
    typeof stageScript?.terrain === 'string'
      ? stageScript.terrain
      : stageScript?.terrain?.type;
  const hasCustomTerrain =
    terrainTypeVal === 'custom_path' ||
    terrainTypeVal === 'stairs' ||
    Boolean(
      typeof stageScript?.terrain === 'object' &&
        stageScript.terrain.points &&
        stageScript.terrain.points.length >= 2
    );
  const hasCustomActorRig = Boolean(
    stageScript?.actors?.some(
      (a) =>
        Boolean(a.rig) &&
        a.rig !== 'traveler' &&
        a.rig !== 'cloaked_traveler' &&
        a.rig !== 'human'
    )
  );

  const syl = auditVietnameseSyllables(rawSegments);
  const seedComment =
    String(src.seedComment ?? '').trim() ||
    generateSeedCommentForCup(
      {
        title,
        author,
        segments: rawSegments,
        pivotWord,
        themeId,
        publishSlot,
        publishMood,
        publishTopic,
        motion: {
          archetype: 'BOULDER_TO_BENCH',
          pacingMode,
          stateA: { intensity: 0.8, spread: 0.2, tiltDeg: -16 },
          stateB: { intensity: 0.1, spread: 0.75, tiltDeg: 0 },
        },
      },
      publishSlot,
      publishMood
    );

  const isFreeMode = stageScript?.che_do === 'tu_do';
  let layoutWarnings: StageLayoutWarning[];

  if (isFreeMode && stageScript) {
    // TF1: Chạy validator vỡ hình làn tự do; chỉ chặn cứng (throw) khi có lỗi chặn, cảnh báo vàng cho qua
    const scriptWithResolvedCustom: StageScript =
      Object.keys(customProps).length > 0
        ? {
            ...stageScript,
            customPropsResolved: {
              ...(stageScript.customPropsResolved ?? {}),
              ...customProps,
            },
          }
        : stageScript;
    const tlProps = {
      id:
        options?.targetCupId ||
        (src.cupId ? String(src.cupId).trim() : '') ||
        stageScript.sceneId ||
        'tudo-validate',
      textFormat,
      segments: rawSegments,
      pivotWord,
      highlightStyle: 'BOTH' as const,
      targetDurationSeconds,
      durationMode,
      typingSpeedMsPerChar: 55,
      holdAfterFinishSeconds: 5.5,
      themeId,
      ...(visualDNA ? { visualDNA } : {}),
      motion: {
        archetype: 'BOULDER_TO_BENCH',
        pacingMode,
        stateA: { intensity: 0.8, spread: 0.2, tiltDeg: -16 },
        stateB: { intensity: 0.1, spread: 0.75, tiltDeg: 0 },
      },
      bgm: { audioMode, foleyPivotStyle },
      brandText: 'TRÀ NGUỘI',
    };
    const tl = computeTimelineSync(tlProps);
    const vdna = resolveVisualDNA(tlProps, scriptWithResolvedCustom);
    const freeVal = validateStageScriptHard(scriptWithResolvedCustom, tl, vdna);
    if (!freeVal.valid) {
      throw new GoiChenValidationError(freeVal.issues.map((i) => i.message));
    }
    layoutWarnings = (freeVal.warnings ?? []).map((w, idx) => ({
      code: 'FREE_MODE_WARN' as const,
      severity: 'warn' as const,
      targetId: `${w.code}_${idx + 1}`,
      timeSec: w.timeSec,
      message: w.message,
    }));
  } else {
    layoutWarnings = auditStageVisualLayout(stageScript, customProps);
  }

  const requestedMode =
    options?.defaultMode ??
    (src.mode === 'overwrite_cup' ? 'overwrite_cup' : 'create_new');

  return {
    bundleVersion: isFreeMode ? 'tudo_1' : String(src.bundleVersion ?? '8.5'),
    mode: isStandaloneStageScript ? 'overwrite_cup' : requestedMode,
    targetCupId: options?.targetCupId,
    cupId: src.cupId ? String(src.cupId).trim() : undefined,
    ...(isFreeMode ? { scriptGoc: parsedRoot, isFreeMode: true } : {}),
    title,
    author,
    textFormat,
    segments: rawSegments,
    pivotWord,
    fontSizeScale,
    themeId,
    pacingMode,
    durationMode,
    targetDurationSeconds,
    stageTuning,
    ...(visualDNA ? { visualDNA } : {}),
    audioMode,
    foleyPivotStyle,
    publishSlot,
    publishMood,
    publishTopic,
    sourceRecordId,
    customCaption,
    seedComment,
    customProps,
    sceneId: explicitSceneId || undefined,
    stageScript,
    tsxCode,
    tsxMeta,
    syllableCount: syl.count,
    syllableLabel: syl.label,
    layoutWarnings,
    autoFixesApplied: autoFixes,
    engineCapabilities: {
      hasArticulatedProps,
      hasCustomTerrain,
      hasCustomActorRig,
      hasCustomTsxCode: Boolean(tsxCode),
    },
  };
}

/**
 * Định danh & Mô tả chuẩn cho Gemini Skills (chuẩn mở SKILL.md mới thay thế Gems trên gemini.google.com).
 */
export const GEMINI_SKILL_NAME = 'dao-dien-tra-nguoi';

export const GEMINI_SKILL_DESCRIPTION =
  'Đạo diễn câu chữ 3 bước và xuất Gói Chén JSON cho kênh Trà Nguội (@tranguoi.15s). Dùng khi tạo Chén mới, viết thơ/quote, hoặc thiết kế cảnh.';

