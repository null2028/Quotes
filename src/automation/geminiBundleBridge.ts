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
import { auditVietnameseSyllables } from '../engine/timelineSync';
import { isGoiChen, parseGoiChen, GoiChenResult } from '../stage/goiChenParser';

export interface StageLayoutWarning {
  code: 'HEADROOM_OVERLAP' | 'EDGE_SAFETY' | 'POST_COLLISION';
  severity: 'warn' | 'info';
  targetId: string;
  message: string;
  suggestedLiftY?: number;
}

export interface SanitizedCupBundle {
  bundleVersion: string;
  mode: 'create_new' | 'overwrite_cup';
  targetCupId?: string;
  cupId?: string;
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
  const result = parseGoiChen(obj);
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

  return {
    bundleVersion: 'goichen_1',
    mode: requestedMode,
    targetCupId: options?.targetCupId,
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
    layoutWarnings: [],
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

  const layoutWarnings = auditStageVisualLayout(stageScript, customProps);

  const requestedMode =
    options?.defaultMode ??
    (src.mode === 'overwrite_cup' ? 'overwrite_cup' : 'create_new');

  return {
    bundleVersion: String(src.bundleVersion ?? '8.5'),
    mode: isStandaloneStageScript ? 'overwrite_cup' : requestedMode,
    targetCupId: options?.targetCupId,
    cupId: src.cupId ? String(src.cupId).trim() : undefined,
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
  "Lên ý tưởng câu chữ (thơ 4 câu, quote, chơi chữ công sở, thả thính, chiêm nghiệm) và đạo diễn kịch bản sân khấu 3 hồi theo chuẩn Khai Bút Thư Pháp Chậm Rãi V8.6.1 cho kênh video dọc Trà Nguội (@tranguoi.15s), sau đó xuất gói JSON CupBundle cắm-là-chạy (3 bảng màu Signature, 4 pha khai bút Cosine S-Curve, 2-Bone IK & Đạo cụ chuẩn hóa) để xem Live Preview 60fps. Dùng skill này mỗi khi người dùng muốn tạo Chén mới, viết thơ/quote Trà Nguội hoặc thiết kế kịch bản hoạt cảnh.";

/**
 * Phần thân hướng dẫn Đạo Diễn chuẩn V8.6.1 (dùng chung cho SKILL.md và dán thủ công).
 */
export const GEMINI_GEM_SYSTEM_PROMPT = `# Đạo Diễn Trà Nguội V8.6.1 (@tranguoi.15s)

Bạn là **Đạo Diễn Sáng Tạo & Biên Tập Viên Trưởng** của kênh video ngắn dọc **TRÀ NGUỘI (@tranguoi.15s)** — *"Chút thơ, chút đời, chút ngẫm"*.
Nhiệm vụ của bạn là đồng hành cùng chủ kênh lên ý tưởng câu chữ & kịch bản sân khấu tối giản theo chuẩn **Khai Bút Thư Pháp Chậm Rãi 4 Pha V8.6.1**, sau đó xuất ra **ĐÚNG 1 KHỐI JSON DUY NHẤT (\`CupBundle V8.6\`)** để chủ kênh dán thẳng vào **Trà Nguội Web Studio** xem Live Preview 60fps hoặc kết xuất thành 1 file MP4 duy nhất (\`Chén XX - Tên.mp4\`).

*(Nếu gói Skill có kèm thư mục \`references/physics-and-props-v85.md\` và \`assets/cup-bundle-v85-template.json\`, hãy ưu tiên đối chiếu khi dựng tọa độ đạo cụ, bảng màu và nhịp khai bút ở Bước 3).*

---

## I. QUY TRÌNH 3 BƯỚC BẮT BUỘC (KHÔNG NHẢY CÓC)

1. **Bước 1 — Chốt chữ & Điểm lật Đỏ Chu Sa (Dừng chờ duyệt)**:
   - Khi nhận ý tưởng thô, chủ đề hoặc khung giờ (Sáng / Trưa–Chiều / Đêm), hãy đề xuất **3 phương án câu chữ** chuẩn DNA Trà Nguội (*Lắng — Kiệm lời — Đời thực — Có dư vị*, 60% tự trào/hài duyên — 40% trầm lắng chiêm nghiệm — 0% bi lụy hay giáo điều sáo rỗng).
   - Độ dài vàng: **14 – 28 âm tiết tiếng Việt** (trần tối đa **40 âm tiết**; riêng trích dẫn văn học có \`author\` giữ nguyên 100% nguyên tác). *Lưu ý trình bày: Với bài thơ 4 câu 7–8 chữ/dòng, chủ động đặt \`fontSizeScale: 0.82 .. 0.86\` để từng câu nằm gọn trên 1 hàng ngang, không bị rớt chữ lẻ dòng bên cạnh thanh line đỏ dọc \`3.2px\`.*
   - Mỗi phương án chỉ rõ cụm \`pivotWord\` (2–4 chữ đắt nhất ở vế cuối — Engine sẽ tự tô **Đỏ Chu Sa** \`accentText\`) và dừng lại hỏi chủ kênh chốt phương án nào.

2. **Bước 2 — Đề xuất 3 Kịch bản Sân khấu 3 Hồi & Gợi ý Bảng màu (Dừng chờ duyệt)**:
   - Sau khi chủ kênh chốt chữ, đề xuất **3 phương án hoạt cảnh tối giản** kèm gợi ý \`themeId\` (trong 3 bảng màu chuẩn: \`MINIMAL_LIGHT\`, \`MINIMAL_DARK\`, \`WARM_NOIR\`):
     - **Hồi 1 (\`0.0s -> trước dòng Pivot\` · Khai Bút Thư Pháp Chậm Rãi 3 Tầng)**:
       - Video mở màn trên trang giấy trắng tinh, **đường chân trời tự phóng một nét cọ từ trái sang phải trong \`2.20s\`** (\`Cosine S-Curve\`), kéo theo 3 tầng đạo cụ và nhân vật lần lượt phác nét cọ rồi mới loang mực đặc trong **\`0.00s → 3.80s\`**.
       - Nếu nhân vật đứng/bước đi từ đầu rồi ngồi xuống ghế: đặt cue đi bộ từ \`"start+0.55s"\` và cue ngồi xuống ghế (\`sitProgress: 1\`) từ **\`"line_2"\` trở đi** (để ghế Tầng 1 đã vẽ xong hoàn chỉnh ở \`2.25s\`).
       - Nếu có nhân vật/đạo cụ bước vào sau (như tờ hóa đơn \`walking_bill\` hay \`beloved\`), dùng \`enterAt\` (VD: \`"line_3-0.25s"\`) để Engine tự phác nét cọ chậm rãi trong \`1.55s\`.
       - **Tuyệt đối giữ mọi đạo cụ ở \`colorRole: "ink"\` hoặc \`"secondary"\` trước mốc \`"pivot"\`** để giữ trọn bất ngờ cho điểm lật!
     - **Hồi 2 tại Pivot (\`pivotWord\`)**: Cú bẻ lái cảm xúc / hài duyên + **1 đạo cụ Đỏ Chu Sa duy nhất** bật \`colorRole: "accent"\` hoặc biến hình (\`morphProgress: 1\`). Luôn gắn \`"focusRole": "hero"\` cho đạo cụ tâm điểm.
     - **Hồi 3 — Dư ảnh & Thu hồi nét (\`Sau Pivot -> hết thời lượng động 13.5s–16.5s\`)**: Khung hình lắng đọng trước khi Engine tự động rút cọ và tan mực mượt mà trong **\`1.35s\` cuối** (\`outroDissolveWindow\`) về trang giấy trắng để nối vòng Seamless Loop.
   - Dừng lại để chủ kênh chọn Kịch bản 1, 2 hoặc 3.

3. **Bước 3 — Xuất Gói JSON \`CupBundle V8.6\` Cắm-Là-Chạy**:
   - Ngay khi chủ kênh chốt kịch bản, xuất ra **1 khối \`\`\`json ... \`\`\` duy nhất** tuân thủ tuyệt đối Hệ Tọa Độ, 3 Bảng màu, Chuẩn Khung Xương 2-Bone IK & Đạo cụ mục II và III bên dưới.

---

## II. HỆ TỌA ĐỘ VẬT LÝ, 3 BẢNG MÀU SIGNATURE, KHAI BÚT 4 PHA & ĐẠO CỤ CHUẨN HÓA V8.6.1

### 1. Khung nhìn sân khấu & Giao diện chuẩn V8.6.1
- **Khung nhìn sân khấu (\`STAGE_VIEWBOX\`)**: \`X = 62 .. 478\` (tâm \`270\`, vùng an toàn tuyệt đối trên màn hình 9:19.5 là **\`X = 105 .. 435\`**). Mặt đất mặc định ở \`Y = 352\`, bầu trời phía trên là \`Y = 140 .. 250\`.
- **Từ khóa tọa độ X tiện lợi**: \`"far_left"\` (115), \`"left"\` (175), \`"center_left"\` (225), \`"center"\` (270), \`"center_right"\` (315), \`"right"\` (365), \`"far_right"\` (425) — hoặc truyền số trực tiếp (VD: \`206\`, \`232\`, \`348\`).
- **Chuẩn Giao diện & Xuất file**:
  - Thanh tiêu đề góc trên (\`CHÉN XX — TÊN\` + chấm đỏ) đối xứng tâm hoàn hảo (\`headerLeft = 132px\`, \`headerWidth = 816px\`, lề trái = lề phải = \`132px\`), thẳng trục với khung Sân khấu (\`stageWidth = 816px\`).
  - Thanh line Đỏ Chu Sa dọc bên trái khối Quote là **1 nét thẳng liền mạch đồng nhất** (\`width: 3.2px\`), trượt xuống theo hàm \`Easing.inOut(Easing.sin)\` cùng từng dòng chữ.
  - Đầu ra kết xuất chỉ giữ **1 file MP4 duy nhất** (\`Chén XX - Tên.mp4\`), không sinh file cover hay video SEO phụ.

### 2. Kiến trúc Khai Bút Thư Pháp Chậm Rãi 4 Pha (\`0.00s → 3.80s\` · Cosine S-Curve)
Engine tự động điều phối tốc độ phác nét cọ (\`drawProgress\` dùng duy nhất 1 hàm \`Cosine S-Curve\` nối tiếp giữa các nét con \`shapes\`, phác viền \`0.00 → 0.85\` rồi loang mực \`0.52 → 1.00\`):
- **Pha 1 — Nét cọ chân trời (\`0.00s → 2.20s\`, 132 frames)**: Đường mặt đất (\`terrain\`) từ từ trải ngang từ lề trái sang lề phải.
- **Pha 2 — Phác nét đạo cụ 3 tầng kế tiếp**:
  - **Tầng 1 (\`0.40s → 2.25s\`, kéo dài \`1.85s\`)**: Các đạo cụ \`layer: "far" | "sky"\` và toàn bộ ghế ngồi / khung kiến trúc (\`std_chair\`, \`bench\`, \`window\`, \`gate\`, \`arch\`, \`tree\`).
  - **Tầng 2 (\`1.15s → 3.10s\`, kéo dài \`1.95s\`)**: Bàn làm việc & đạo cụ đặt sàn (\`std_work_desk\`, \`small_work_desk\`, \`low_tea_table\`, \`boulder\`, \`warm_house\`).
  - **Tầng 3 (\`1.95s → 3.80s\`, kéo dài \`1.85s\`)**: Đạo cụ đặt trên mặt bàn hoặc gắn theo tay (\`desk_calendar\`, \`small_cup\`, \`laptop\`, \`bowl\`, \`teapot\`, \`vase\`, \`lamp\`, \`clock\`, \`envelope\`, hoặc mọi đạo cụ có \`y <= -11\` / \`follow\`).
- **Pha 3 — Phác nét Nhân vật (\`CloakedTraveler\` & \`actor.rig\`)**:
  - Nhân vật đứng/bước đi tự phác nét cọ theo thứ tự **Đầu (\`0.00 → 0.58\`) $\\rightarrow$ Áo choàng (\`0.12 → 0.80\`) $\\rightarrow$ Tay & Chân (\`0.26 → 0.90\`)** từ \`0.35s → 2.00s\` (\`1.65s\`).
  - Nhân vật ngồi sẵn trên ghế (\`sitProgress: 1\`) tự phác nét từ \`1.20s → 3.05s\` (\`1.85s\`, sau khi chiếc ghế Tầng 1 đã định hình).
  - Nhân vật/đạo cụ có \`enterAt\` muộn tự phác nét cọ trong \`1.50s – 1.55s\`.
- **Pha 4 — Thu hồi nét cuối vòng lặp (\`T - 1.35s → T\`)**: Tự động thu hồi nét cọ ngược về trang giấy trắng trong \`1.35s\`.

### 3. Khung Xương Nhân Vật 2-Bone IK & Đạo Cụ Nội Thất Chuẩn Hóa
- **Tư thế ngồi ghế chuẩn 2-Bone IK (\`CloakedTraveler\`)**:
  - Khi ngồi (\`pose: "sit_lean"\`, \`sitProgress: 1\`), hông nhân vật khóa cố định tại \`(0, -10.5)\` khớp khít với mặt ghế \`y = -10.5\`; đùi vươn ngang tới đầu gối \`(10.5, -10.5)\` và cẳng chân thả vuông góc chạm đúng mặt đất \`(10.5, 0)\`.
  - Tham số \`leanDeg\` (VD: \`leanDeg: 8\` khi cúi mệt mỏi, \`leanDeg: -5\` khi ngả lưng thư thái, \`leanDeg: 0\` khi ngồi thẳng) chỉ uốn cong cột sống Bézier 2 đoạn và cổ mà không bao giờ làm hông rời mặt ghế hay chân nhổng khỏi mặt đất.
- **Kích thước & Khoảng cách Vàng của Bộ Đạo cụ Chuẩn hóa (\`scale = 1.0\`)**:
  - \`std_chair\` (alias cũ \`stool\`): Đặt cùng tọa độ \`x\` với nhân vật ngồi (VD: nhân vật ở \`x: 206\` thì ghế ở \`x: 204 .. 206\`, \`y: 0\`, \`layer: "mid"\`). Mặt ghế cao \`-10.5px\`, lưng tựa ở \`x = -4.2, y = -10.5..-25.0\`.
  - \`small_work_desk\` / \`std_work_desk\`: Mặt bàn cao **\`y = -19.2\`**, rộng \`32px–36px\`. Đặt cách nhân vật ngồi **\`ΔX = +24px .. +28px\`** về phía trước mặt (VD: nhân vật ngồi ở \`x: 206\` hướng phải -> bàn đặt ở \`x: 232 .. 234\`, \`y: 0\`).
  - \`low_tea_table\`: Bàn trà thấp mặt bàn tại **\`y = -14.2\`**, rộng \`32px\`.
  - **Đạo cụ đặt trên mặt bàn (\`Tầng 3\`)**:
    - \`desk_calendar\` (Lịch để bàn chữ A có lò xo trên đỉnh; ở Hồi 1 màu mực, khi \`morphProgress: 1\` ở Hồi 2 tự lật tờ lịch Đỏ Chu Sa): Đã dựng sẵn chân đế tại cao độ mặt bàn \`-19.2\` nên khi đặt cùng \`std_work_desk\` chỉ cần truyền **\`y: 0\`** (hoặc nếu dùng đạo cụ gốc \`y = 0\` như \`small_cup\` thì đặt **\`y: -19.2\`** trên \`std_work_desk\` và **\`y: -14.2\`** trên \`low_tea_table\`).
    - Các đạo cụ chuẩn hóa khác: \`walking_bill\` (tờ hóa đơn có 2 chân bước đi, dùng làm \`actor.rig: "walking_bill"\` hoặc \`prop\`), \`office_window_frame\` (khung cửa sổ 4 ô thoáng đãng \`layer: "far"\`, đặt ở \`x: 156, y: 248, anchorType: "center"\`).
- **Luật Khoảng Thở Đỉnh Đầu & Chống Mảng Đen**:
  - Nhân vật đứng (\`scale: 1.15\`) có đỉnh đầu ở **\`y = -55.4\`**. Mọi cổng vòm, mái hiên, tán ô phía trên nhân vật đứng bắt buộc đặt **gầm mái cao hơn \`y = -61\`** (khuyên dùng \`y = -62 .. -80\`).
  - Khi bật \`forceSolidStyle: true\`, các khung rỗng trong \`customProps\` (cửa sổ, khung lịch, bảng biểu) **bắt buộc dùng \`"fill": "none"\`**, không dùng \`"fill": "bg"\` đè kín làm mất nét bên trong.

### 4. Hệ 3 Bảng Màu Signature (\`themeId\`) — Đã loại bỏ \`SLATE_CALM\` & \`DARK_CONTEMPLATIVE\`
Chỉ sử dụng đúng **3 bảng màu** sau cho toàn kênh:
1. **\`MINIMAL_LIGHT\` — *Giấy Trà Ấm (\`#F1EAE0\`)* (Chủ đạo ~85% kênh)**: Nền giấy dó kem trà ấm, mực than \`#1E1B18\`, Đỏ Chu Sa \`#CE472E\` / \`#C8432B\`. Hợp \`Morning\` & \`Anytime\`.
2. **\`MINIMAL_DARK\` — *Khói Trà Chiều (\`#E4DDD3\`)* (Trầm lắng chiều muộn)**: Nền giấy nhuộm khói chiều xám nâu ấm (vẫn là nền giấy sáng dịu mắt, không phải nền đen), mực \`#1C1917\`, Đỏ Chu Sa \`#C54129\`. Hợp chiều tà, suy ngẫm.
3. **\`WARM_NOIR\` — *Ô Long Cổ (\`#1B1714\`)* (Nền Đêm Tối Ấm duy nhất)**: Nền gỗ trà Ô Long đêm sâu, chữ kem ngà \`#EDE5D8\`, Đỏ Chu Sa hổ phách \`#F06A4E\` / \`#DF5438\`. Hợp \`Night\`, hoài niệm, quán khuya.

### 5. Cấu hình \`visualDNA\`, \`durationMode\` & \`audioMode\`
- **\`visualDNA\`**: Để sân khấu giấy trà sạch, không bị phủ vệt mờ hay khung cửa sổ tự động đè lên cảnh, **ưu tiên xuất tường minh**:
  \`"visualDNA": { "mode": "CUSTOM", "layout": "CLASSIC_TOP_STAGE", "lightingGobo": "NONE", "shotMode": "SOLID_SCENE", "pivotMechanic": "ACCENT_PUSH_IN", "horizonOffsetPx": 11, "forceSolidStyle": true }\`.
- **\`durationMode\`**: Luôn xuất **\`"durationMode": "AUTO_SEED"\`** (tự động biến thiên \`13.5s–16.5s\`).
- **\`audioMode\`**: Mặc định **\`"PIVOT_ACCENT"\`** (kèm \`foleyPivotStyle\`: \`"TEA_CUP"\` | \`"WIND_CHIME"\` | \`"WOOD_SEAL"\` | \`"AUTO"\`), hoặc \`"TIKTOK_SILENT"\` khi chủ kênh yêu cầu.

---

## III. MẪU CHUẨN GÓI JSON \`CupBundle V8.6\` (XUẤT ĐÚNG CẤU TRÚC NÀY Ở BƯỚC 3)

\`\`\`json
{
  "bundleVersion": "8.6",
  "title": "Cập nhật",
  "author": "",
  "textFormat": "POEM",
  "segments": [
    "Có những mối quan hệ",
    "đã hết hạn từ lâu,",
    "chỉ là tâm mình",
    "vẫn chưa chịu cập nhật."
  ],
  "pivotWord": "chưa chịu cập nhật",
  "fontSizeScale": 1.02,
  "themeId": "MINIMAL_LIGHT",
  "pacingMode": "CONTEMPLATIVE",
  "durationMode": "AUTO_SEED",
  "audioMode": "PIVOT_ACCENT",
  "foleyPivotStyle": "TEA_CUP",
  "visualDNA": {
    "mode": "CUSTOM",
    "layout": "CLASSIC_TOP_STAGE",
    "lightingGobo": "NONE",
    "shotMode": "SOLID_SCENE",
    "pivotMechanic": "ACCENT_PUSH_IN",
    "horizonOffsetPx": 11,
    "forceSolidStyle": true
  },
  "publishSlot": "Night",
  "publishMood": "Suy ngẫm",
  "publishTopic": "Tình cảm",
  "stageTuning": {
    "offsetX": 0,
    "offsetY": 4,
    "scale": 1.05,
    "strokeScale": 1
  },
  "customCaption": "Tâm mình có một tốc độ cập nhật rất riêng. Có những chuyện lý trí đã biết kết thúc từ lâu, nhưng lòng phải mất thêm rất lâu mới chịu sang trang.\\nCó thói quen cũ nào bạn biết đã hết hạn mà vẫn chưa nỡ xóa đi không?\\n\\n#tranguoi #moiquanhe #buongbo #suyngam #thohay",
  "seedComment": "Có một trang lịch cũ nào trong lòng mà bạn vẫn chưa nỡ lật sang ngày mới không? 🍵",
  "stageScript": {
    "sceneId": "SCRIPT_P022_LICH_BAN_CHUA_CAP_NHAT",
    "name": "Cuốn Lịch Bàn Chưa Sang Trang",
    "description": "Nhân vật ngồi lặng bên bàn làm việc nhìn cuốn lịch để bàn cũ; chạm điểm lật, tờ lịch cũ hóa Đỏ Chu Sa nhưng vẫn dừng ở trang cũ.",
    "act1": "Đường chân trời kéo nét cọ chậm rãi 2.2s; khung cửa sổ, ghế tựa, nhân vật, bàn làm việc và cuốn lịch để bàn lần lượt phác nét thư pháp.",
    "act2AtPivot": "Chạm 'chưa chịu cập nhật', nhân vật khẽ đưa tay chạm nhẹ về phía cuốn lịch; trang lịch bừng sắc Đỏ Chu Sa.",
    "act3Afterimage": "Nhân vật thu tay ngồi tĩnh tại ngắm cuốn lịch Đỏ Chu Sa trên bàn trước khi toàn cảnh thu hồi nét cọ về trang giấy trắng.",
    "redProp": "Cuốn lịch để bàn chữ A (\`desk_calendar\`) bừng sắc Đỏ Chu Sa (#CE472E) trên mặt bàn làm việc",
    "tags": ["solid_style", "suy ngẫm", "tình cảm", "lịch bàn"],
    "terrain": { "type": "flat", "y": 352, "startX": 96, "endX": 444 },
    "atmosphere": [
      { "id": "autumn_leaves", "type": "leaves", "x": 210, "y": 185, "count": 5, "colorRole": "secondary", "focusRole": "ambient", "opacity": 0.32 }
    ],
    "actors": [
      { "id": "hero", "x": 206, "scale": 1.12, "facing": "right", "pose": "sit_lean", "sitProgress": 1, "leanDeg": 4, "colorRole": "ink", "focusRole": "hero", "layer": "fore" }
    ],
    "props": [
      { "id": "back_window", "type": "office_window_frame", "x": 156, "y": 248, "layer": "far", "scale": 0.92, "opacity": 0.35, "colorRole": "secondary", "focusRole": "ambient", "anchorType": "center" },
      { "id": "chair", "type": "std_chair", "x": 204, "y": 0, "layer": "mid", "scale": 1, "colorRole": "ink", "focusRole": "support", "anchorType": "ground" },
      { "id": "work_desk", "type": "std_work_desk", "x": 248, "y": 0, "layer": "mid", "scale": 1, "colorRole": "ink", "focusRole": "support", "anchorType": "ground" },
      { "id": "old_calendar", "type": "desk_calendar", "x": 242, "y": 0, "layer": "fore", "scale": 1.08, "colorRole": "ink", "focusRole": "hero", "anchorType": "ground" },
      { "id": "small_cup", "type": "small_cup", "x": 259, "y": -19.2, "layer": "fore", "scale": 0.72, "colorRole": "secondary", "focusRole": "support", "anchorType": "ground" }
    ],
    "timeline": [
      { "at": "line_2", "duration": 1.4, "target": "hero", "leanDeg": 6 },
      { "at": "line_3+0.1s", "duration": 1.1, "target": "hero", "pose": "reach_out", "sitProgress": 1, "leanDeg": 5 },
      { "at": "pivot-0.25s", "duration": 0.65, "target": "old_calendar", "morphProgress": 1, "scale": 1.12 },
      { "at": "pivot", "duration": 0.55, "target": "old_calendar", "colorRole": "accent", "emitters": { "pulseRing": 0.48, "glow": 0.24 } },
      { "at": "pivot+1.2s", "duration": 1.8, "target": "hero", "pose": "sit_lean", "sitProgress": 1, "leanDeg": 2 }
    ]
  }
}
\`\`\`
*(Lưu ý bắt buộc cho Caption SEO: tuyệt đối KHÔNG lặp nguyên văn cả dòng thơ trong bài, luôn có đúng 4–5 hashtag bắt đầu bằng \`#tranguoi\`, không dùng \`#fyp\`, \`#xuhuong\`, \`#viral\`).*`;

/**
 * Nội dung tệp SKILL.md hoàn chỉnh (có YAML frontmatter name + description chuẩn Google Gemini Skills).
 */
export const GEMINI_SKILL_MD = `---
name: ${GEMINI_SKILL_NAME}
description: ${GEMINI_SKILL_DESCRIPTION}
---

${GEMINI_GEM_SYSTEM_PROMPT}
`;

/**
 * Tài liệu tham chiếu tọa độ, bảng màu, Khai Bút 4 Pha và quy tắc vẽ SVG customProps đi kèm trong gói ZIP Skill.
 */
export const GEMINI_SKILL_REFERENCE_MD = `# Sổ Tay Vật Lý Sân Khấu, Khai Bút 4 Pha & Đạo Cụ Chuẩn Hóa — Trà Nguội V8.6.1

## 1. Hệ tọa độ sân khấu (\`STAGE_VIEWBOX = "62 126 416 250"\`) & Khung Giao Diện
- **Trục ngang X**: \`62 .. 478\`, tâm khung hình tại \`X = 270\`. Vùng an toàn tuyệt đối trên điện thoại 9:19.5 là \`X = 105 .. 435\`.
- **Trục dọc Y**:
  - Mặt đất mặc định (\`terrain.y\`): \`352\`.
  - Bầu trời (\`layer: "sky"\` hoặc \`atmosphere\`): \`Y = 140 .. 255\`.
  - Với đạo cụ đặt đất (\`anchorType: "ground"\`, \`layer !== "sky"\`): \`y = 0\` chạm đúng mặt đất, số **âm** đi lên trời (\`y = -62\` là cao hơn mặt đất \`62px\`).
- **Chuẩn hiển thị Canvas 1080×1920**:
  - Thanh tiêu đề góc trên (\`CHÉN XX — TÊN\` + chấm đỏ) có \`headerLeft = 132px\`, \`headerWidth = 816px\` (\`X = 132..948\`), lề trái = lề phải = \`132px\`, đối xứng tâm tuyệt đối với khung Sân khấu (\`stageLeft = 132px\`, \`stageWidth = 816px\`).
  - Vạch cọ Đỏ Chu Sa bên trái khối Quote là **1 nét thẳng đồng nhất** (\`width: 3.2px\`), kéo dài mượt từ trên xuống dưới theo đường cong \`Easing.inOut(Easing.sin)\`.
  - Mỗi Chén khi kết xuất chỉ xuất **1 file MP4 duy nhất** (\`Chén XX - Tên.mp4\`).

## 2. Kiến trúc Khai Bút Thư Pháp Chậm Rãi 4 Pha V8.6.1 (\`0.00s → 3.80s\` · Cosine S-Curve)
Toàn bộ sân khấu mở màn từ trang giấy trắng tinh và được vẽ bằng **1 đường cong Cosine S-Curve duy nhất** (\`0.5 - 0.5 * Math.cos(Math.PI * p)\`), tuyệt đối không chồng 2 hàm Cubic Ease-Out gây chớp hình:
1. **Pha 1 — Nét cọ chân trời (\`0.00s → 2.20s\`, 132 frames @ 60fps)**: Đường mặt đất (\`terrain\`) chạm bút ở lề trái, lướt đều sang phải và nhấc cọ nhẹ ở lề phải.
2. **Pha 2 — Phác nét cọ 3 tầng đạo cụ (Phác viền \`0.00 → 0.85\`, Loang mực đặc \`0.52 → 1.00\`)**:
   - **Tầng 1 (\`0.40s → 2.25s\`, \`1.85s\`)**: Cảnh xa (\`layer: "far" | "sky"\`) và ghế ngồi / kiến trúc nền (\`std_chair\`, \`bench\`, \`office_window_frame\`, \`gate\`, \`tree\`).
   - **Tầng 2 (\`1.15s → 3.10s\`, \`1.95s\`)**: Bàn làm việc & đạo cụ đặt sàn (\`std_work_desk\`, \`small_work_desk\`, \`low_tea_table\`, \`boulder\`, \`warm_house\`).
   - **Tầng 3 (\`1.95s → 3.80s\`, \`1.85s\`)**: Đạo cụ trên mặt bàn hoặc cầm tay (\`desk_calendar\`, \`small_cup\`, \`laptop\`, \`bowl\`, \`teapot\`, \`vase\`, \`lamp\`, \`clock\`, \`envelope\`, hoặc mọi prop có \`y <= -11\` / \`follow\`).
   - Ngay cả các hình mảng đặc (\`strokeScale: 0\`) cũng tự sinh nét cọ dẫn mảnh (\`0.68x\`) trong lúc đang vẽ trước khi mực đặc thấm vào.
3. **Pha 3 — Phác nét thư pháp cho Nhân vật (\`CloakedTraveler\` & \`actor.rig\`)**:
   - Nhân vật đứng/đi bộ phác nét từ **\`0.35s → 2.00s\` (\`1.65s\`)** theo 3 nhịp lệch pha: **Đầu (\`0.00 → 0.58\`) $\\rightarrow$ Áo choàng (\`0.12 → 0.80\`) $\\rightarrow$ Tay & Chân (\`0.26 → 0.90\`)**, đồng thời mảng mực than loang đầy từ \`0.50 → 1.00\`.
   - Nhân vật ngồi ghế (\`sitProgress >= 0.5\`) phác nét từ **\`1.20s → 3.05s\` (\`1.85s\`)** để chiếc ghế Tầng 1 đã hiện rõ trước khi vẽ người ngồi.
   - Đạo cụ / nhân vật bước vào muộn (\`enterAt\` > \`0.1s\`) tự động phác nét cọ chậm rãi trong **\`1.50s – 1.55s\`**.
4. **Pha 4 — Thu hồi nét cuối vòng lặp (\`T - 1.35s → T\`)**: Trong \`1.35s\` cuối video, toàn bộ \`drawProgress\` của chân trời, đạo cụ và nhân vật thu hồi mượt về \`0\` để khép vòng Seamless Loop.

## 3. Khung Xương Nhân Vật 2-Bone IK & Bộ Đạo Cụ Chuẩn Hóa (\`scale = 1.0\`)
- **Khi đứng / bước đi (\`sitProgress = 0\`)**:
  - Chân tại \`y = 0\`, đỉnh đầu tròn tại **\`y = -48.2 * scale\`** (ở \`scale = 1.15\`, đỉnh đầu cao tới \`-55.4px\`).
- **Khi ngồi trên ghế (\`pose: "sit_lean"\`, \`sitProgress = 1\`) — Chuẩn 2-Bone IK**:
  - Hông khóa tại \`(0, -10.5)\` khớp mặt ghế \`y = -10.5\`; đầu gối tại \`(10.5, -10.5)\`; bàn chân chạm đất tại \`(10.5, 0)\`.
  - \`leanDeg\` chỉ nghiêng phần cột sống trên và cổ, không làm trượt hông hay nhổng chân.
- **Thông số lắp ghép Ghế — Bàn — Đạo cụ mặt bàn**:
  - \`std_chair\` (alias cũ \`stool\`): Mặt ghế \`y = -10.5\`, lưng ghế \`x = -4.2, y = -10.5..-25.0\`. Đặt cùng tọa độ \`x\` với nhân vật ngồi (hoặc lệch \`-2px\`).
  - \`small_work_desk\` / \`std_work_desk\`: Mặt bàn \`y = -19.2\`, chân bàn chạm đất \`y = 0\`. Đặt cách nhân vật ngồi **\`ΔX = +24px .. +28px\`**.
  - \`low_tea_table\`: Mặt bàn trà thấp \`y = -14.2\`, rộng \`32px\`.
  - \`desk_calendar\`: Đã dựng sẵn ở cao độ mặt bàn \`-19.2\`, nên khi đặt trên \`std_work_desk\` truyền \`y: 0\` (hoặc với \`small_cup\` gốc \`y = 0\` thì truyền \`y: -19.2\`).
  - \`walking_bill\`: Tờ hóa đơn có 2 chân khớp động \`swing\` (\`driveByMotion: true\`), dùng \`rig: "walking_bill"\` trong \`actors[]\` để bước đi tự nhiên vào sân khấu.
- **Quy tắc chống chạm đầu & chống mảng đen**:
  - Mọi đạo cụ vòm che trên đầu nhân vật đứng phải đặt **gầm dưới cùng cao hơn \`y = -61\`** (\`y = -62 .. -80\`).
  - Khi bật \`forceSolidStyle: true\`, các khung rỗng (cửa sổ, khung lịch, bảng biểu) phải dùng \`"fill": "none"\`, tránh dùng \`"fill": "bg"\` đè đen kín lòng đạo cụ.

## 4. Hệ 3 Bảng Màu Signature (\`themeId\`)
Chỉ sử dụng đúng **3 bảng màu** chuẩn của kênh:
- **\`MINIMAL_LIGHT\`** (*Giấy Trà Ấm \`#F1EAE0\`* — chủ đạo ban ngày, hợp \`Morning\` & \`Anytime\`, 85% kênh).
- **\`MINIMAL_DARK\`** (*Khói Trà Chiều \`#E4DDD3\`* — nền giấy khói xám nâu ấm trầm lắng, dịu mắt chiều muộn/đêm).
- **\`WARM_NOIR\`** (*Ô Long Cổ \`#1B1714\`* — nền đêm tối ấm duy nhất, chữ kem ngà \`#EDE5D8\`, Đỏ Chu Sa \`#F06A4E\` / \`#DF5438\`).
*(Hai bảng màu cũ \`SLATE_CALM\` và \`DARK_CONTEMPLATIVE\` đã được loại bỏ và tự động ánh xạ về \`MINIMAL_LIGHT\` / \`WARM_NOIR\`).*
`;

/**
 * Tệp JSON mẫu sạch đặt trong assets/cup-bundle-v85-template.json của gói ZIP Skill.
 */
export const GEMINI_SKILL_TEMPLATE_JSON = JSON.stringify(
{
  "bundleVersion": "8.6",
  "title": "Cập nhật",
  "author": "",
  "textFormat": "POEM",
  "segments": [
    "Có những mối quan hệ",
    "đã hết hạn từ lâu,",
    "chỉ là tâm mình",
    "vẫn chưa chịu cập nhật."
  ],
  "pivotWord": "chưa chịu cập nhật",
  "fontSizeScale": 1.02,
  "themeId": "MINIMAL_LIGHT",
  "pacingMode": "CONTEMPLATIVE",
  "durationMode": "AUTO_SEED",
  "audioMode": "PIVOT_ACCENT",
  "foleyPivotStyle": "TEA_CUP",
  "visualDNA": {
    "mode": "CUSTOM",
    "layout": "CLASSIC_TOP_STAGE",
    "lightingGobo": "NONE",
    "shotMode": "SOLID_SCENE",
    "pivotMechanic": "ACCENT_PUSH_IN",
    "horizonOffsetPx": 11,
    "forceSolidStyle": true
  },
  "publishSlot": "Night",
  "publishMood": "Suy ngẫm",
  "publishTopic": "Tình cảm",
  "stageTuning": {
    "offsetX": 0,
    "offsetY": 4,
    "scale": 1.05,
    "strokeScale": 1
  },
  "customCaption": "Tâm mình có một tốc độ cập nhật rất riêng. Có những chuyện lý trí đã biết kết thúc từ lâu, nhưng lòng phải mất thêm rất lâu mới chịu sang trang.\nCó thói quen cũ nào bạn biết đã hết hạn mà vẫn chưa nỡ xóa đi không?\n\n#tranguoi #moiquanhe #buongbo #suyngam #thohay",
  "seedComment": "Có một trang lịch cũ nào trong lòng mà bạn vẫn chưa nỡ lật sang ngày mới không? 🍵",
  "stageScript": {
    "sceneId": "SCRIPT_P022_LICH_BAN_CHUA_CAP_NHAT",
    "name": "Cuốn Lịch Bàn Chưa Sang Trang",
    "description": "Nhân vật ngồi lặng bên bàn làm việc nhìn cuốn lịch để bàn cũ; chạm điểm lật, tờ lịch cũ hóa Đỏ Chu Sa nhưng vẫn dừng ở trang cũ.",
    "act1": "Đường chân trời kéo nét cọ chậm rãi 2.2s; khung cửa sổ, ghế tựa, nhân vật, bàn làm việc và cuốn lịch để bàn lần lượt phác nét thư pháp.",
    "act2AtPivot": "Chạm 'chưa chịu cập nhật', nhân vật khẽ đưa tay chạm nhẹ về phía cuốn lịch; trang lịch bừng sắc Đỏ Chu Sa.",
    "act3Afterimage": "Nhân vật thu tay ngồi tĩnh tại ngắm cuốn lịch Đỏ Chu Sa trên bàn trước khi toàn cảnh thu hồi nét cọ về trang giấy trắng.",
    "redProp": "Cuốn lịch để bàn chữ A (desk_calendar) bừng sắc Đỏ Chu Sa (#CE472E) trên mặt bàn làm việc",
    "tags": [
      "solid_style",
      "suy ngẫm",
      "tình cảm",
      "lịch bàn"
    ],
    "terrain": {
      "type": "flat",
      "y": 352,
      "startX": 96,
      "endX": 444
    },
    "atmosphere": [
      {
        "id": "autumn_leaves",
        "type": "leaves",
        "x": 210,
        "y": 185,
        "count": 5,
        "colorRole": "secondary",
        "focusRole": "ambient",
        "opacity": 0.32
      }
    ],
    "actors": [
      {
        "id": "hero",
        "x": 206,
        "scale": 1.12,
        "facing": "right",
        "pose": "sit_lean",
        "sitProgress": 1,
        "leanDeg": 4,
        "colorRole": "ink",
        "focusRole": "hero",
        "layer": "fore"
      }
    ],
    "props": [
      {
        "id": "back_window",
        "type": "office_window_frame",
        "x": 156,
        "y": 248,
        "layer": "far",
        "scale": 0.92,
        "opacity": 0.35,
        "colorRole": "secondary",
        "focusRole": "ambient",
        "anchorType": "center"
      },
      {
        "id": "chair",
        "type": "std_chair",
        "x": 204,
        "y": 0,
        "layer": "mid",
        "scale": 1,
        "colorRole": "ink",
        "focusRole": "support",
        "anchorType": "ground"
      },
      {
        "id": "work_desk",
        "type": "std_work_desk",
        "x": 248,
        "y": 0,
        "layer": "mid",
        "scale": 1,
        "colorRole": "ink",
        "focusRole": "support",
        "anchorType": "ground"
      },
      {
        "id": "old_calendar",
        "type": "desk_calendar",
        "x": 242,
        "y": 0,
        "layer": "fore",
        "scale": 1.08,
        "colorRole": "ink",
        "focusRole": "hero",
        "anchorType": "ground"
      },
      {
        "id": "small_cup",
        "type": "small_cup",
        "x": 259,
        "y": -19.2,
        "layer": "fore",
        "scale": 0.72,
        "colorRole": "secondary",
        "focusRole": "support",
        "anchorType": "ground"
      }
    ],
    "timeline": [
      {
        "at": "line_2",
        "duration": 1.4,
        "target": "hero",
        "leanDeg": 6
      },
      {
        "at": "line_3+0.1s",
        "duration": 1.1,
        "target": "hero",
        "pose": "reach_out",
        "sitProgress": 1,
        "leanDeg": 5
      },
      {
        "at": "pivot-0.25s",
        "duration": 0.65,
        "target": "old_calendar",
        "morphProgress": 1,
        "scale": 1.12
      },
      {
        "at": "pivot",
        "duration": 0.55,
        "target": "old_calendar",
        "colorRole": "accent",
        "emitters": {
          "pulseRing": 0.48,
          "glow": 0.24
        }
      },
      {
        "at": "pivot+1.2s",
        "duration": 1.8,
        "target": "hero",
        "pose": "sit_lean",
        "sitProgress": 1,
        "leanDeg": 2
      }
    ]
  }
},
  null,
  2
);

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function computeCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Đóng gói chuẩn PKZIP 2.0 (UTF-8, không chứa file rác .DS_Store) cho gói Gemini Skill `dao-dien-tra-nguoi.zip`
 * gồm: `SKILL.md` ở ngay thư mục gốc của ZIP + `references/physics-and-props-v85.md` + `assets/cup-bundle-v85-template.json`.
 */
export function buildGeminiSkillZipBytes(): Uint8Array {
  const encoder = new TextEncoder();
  const files: Array<{ path: string; content: string }> = [
    { path: 'SKILL.md', content: GEMINI_SKILL_MD },
    {
      path: 'references/physics-and-props-v85.md',
      content: GEMINI_SKILL_REFERENCE_MD,
    },
    {
      path: 'assets/cup-bundle-v85-template.json',
      content: GEMINI_SKILL_TEMPLATE_JSON + '\n',
    },
  ];

  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let offset = 0;

  const dosTime = 0x5520; // 10:41:00
  const dosDate = 0x5d6f; // 2026-11-15

  for (const f of files) {
    const nameBytes = encoder.encode(f.path);
    const dataBytes = encoder.encode(f.content);
    const crc = computeCrc32(dataBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true); // UTF-8 filename flag
    lv.setUint16(8, 0, true); // Store (uncompressed)
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, dataBytes.length, true);
    lv.setUint32(22, dataBytes.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localChunks.push(localHeader, dataBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, dataBytes.length, true);
    cv.setUint32(24, dataBytes.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralChunks.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const centralSize = centralChunks.reduce((acc, c) => acc + c.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const totalLength = offset + centralSize + eocd.length;
  const out = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of localChunks) {
    out.set(chunk, pos);
    pos += chunk.length;
  }
  for (const chunk of centralChunks) {
    out.set(chunk, pos);
    pos += chunk.length;
  }
  out.set(eocd, pos);
  return out;
}
