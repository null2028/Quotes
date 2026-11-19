import {
  LayoutVariant,
  LightingGobo,
  PivotMechanic,
  ShotMode,
  VideoInputProps,
} from '../schemas/videoSchema';
import { StageScript } from '../stage/stageScriptSchema';
import { resolveXCoord } from '../stage/terrainSystem';
import { LAYOUT_TOKENS, isDarkThemePalette } from '../theme/palettes';
import { auditVietnameseSyllables, hashCupSeed } from './timelineSync';

export type {
  LayoutVariant,
  LightingGobo,
  PivotMechanic,
  ShotMode,
} from '../schemas/videoSchema';

export interface PaperMoteSpec {
  baseX: number;
  baseY: number;
  ampX: number;
  ampY: number;
  harmX: number;
  harmY: number;
  phase: number;
  r: number;
  alpha: number;
  isAccent?: boolean;
}

export interface ResolvedVisualDNA {
  seed: number;
  isLegacyLocked: boolean;
  layout: LayoutVariant;
  lightingGobo: LightingGobo;
  shotMode: ShotMode;
  pivotMechanic: PivotMechanic;
  horizonOffsetPx: number;
  forceSolidStyle: boolean;
  vignetteCenter: {
    xPct: number;
    yPct: number;
    ampXPct: number;
    ampYPct: number;
  };
  brushOrientation: 'VERTICAL_BRUSH';
  motes: PaperMoteSpec[];
  downgradedAsymmetricThird: boolean;
  actorCount: number;
  actorSpanX: number;
  syllableCount: number;
}

export interface LayoutGeometry {
  layout: LayoutVariant;
  brushOrientation: 'VERTICAL_BRUSH';
  stageTop: number;
  stageLeft: number;
  stageWidth: number;
  stageHeight: number;
  stageFrameMode: 'NONE' | 'WINDOW_ARCH' | 'ASYMMETRIC_CARD';
  typographyTop: number;
  typographyLeft: number;
  typographyMaxBottom: number;
  quoteBlockWidth: number;
  typographyMaxWidth: number;
  topSpacerMaxPx: number;
  topSpacerFlexGrow: number;
  bottomSpacerFlexGrow: number;
}

// Danh sách hạt bụi giấy mặc định cho Chén 01–07 (Legacy Lock A.2)
const LEGACY_PAPER_MOTES: PaperMoteSpec[] = [
  { baseX: 198, baseY: 390, ampX: 26, ampY: 18, harmX: 1, harmY: 2, phase: 0.2, r: 1.9, alpha: 0.16 },
  { baseX: 342, baseY: 465, ampX: 32, ampY: 22, harmX: 2, harmY: 1, phase: 1.1, r: 1.5, alpha: 0.13 },
  { baseX: 518, baseY: 382, ampX: 28, ampY: 19, harmX: 1, harmY: 2, phase: 2.3, r: 2.1, alpha: 0.15 },
  { baseX: 716, baseY: 448, ampX: 30, ampY: 24, harmX: 2, harmY: 1, phase: 3.4, r: 1.7, alpha: 0.14 },
  { baseX: 828, baseY: 560, ampX: 22, ampY: 20, harmX: 1, harmY: 3, phase: 4.2, r: 1.6, alpha: 0.12 },
  { baseX: 236, baseY: 675, ampX: 29, ampY: 17, harmX: 2, harmY: 2, phase: 0.8, r: 2.2, alpha: 0.15 },
  { baseX: 462, baseY: 618, ampX: 24, ampY: 26, harmX: 1, harmY: 2, phase: 2.9, r: 1.6, alpha: 0.13, isAccent: true },
  { baseX: 668, baseY: 712, ampX: 31, ampY: 18, harmX: 2, harmY: 1, phase: 5.1, r: 1.8, alpha: 0.14 },
  { baseX: 188, baseY: 960, ampX: 25, ampY: 21, harmX: 1, harmY: 2, phase: 1.7, r: 1.7, alpha: 0.12 },
  { baseX: 408, baseY: 1085, ampX: 28, ampY: 19, harmX: 2, harmY: 1, phase: 3.9, r: 1.5, alpha: 0.11 },
  { baseX: 642, baseY: 995, ampX: 24, ampY: 23, harmX: 1, harmY: 2, phase: 4.8, r: 2.0, alpha: 0.13 },
  { baseX: 785, baseY: 1180, ampX: 22, ampY: 18, harmX: 2, harmY: 2, phase: 0.5, r: 1.6, alpha: 0.12, isAccent: true },
  { baseX: 274, baseY: 1310, ampX: 27, ampY: 16, harmX: 1, harmY: 2, phase: 2.6, r: 1.8, alpha: 0.13 },
  { baseX: 564, baseY: 1368, ampX: 30, ampY: 20, harmX: 2, harmY: 1, phase: 5.6, r: 1.5, alpha: 0.12 },
];

function createPrng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Kiểm tra xem cupId có thuộc 7 Chén đã phát hành (quote-001..quote-007) cần khóa nguyên bản hay không.
 */
export function isLegacyPublishedCupId(id?: string): boolean {
  if (!id) return false;
  const match = id.trim().match(/^quote-0*([1-9]\d*)$/i);
  if (!match) return false;
  const num = Number(match[1]);
  return num >= 1 && num <= 7;
}

/**
 * Phân tích độ trải ngang của các nhân vật trên sân khấu (tọa độ viewBox X).
 */
export function analyzeScriptSubjectSpread(script?: StageScript | null): {
  actorCount: number;
  actorSpanX: number;
} {
  const actors = script?.actors ?? [];
  if (actors.length === 0) {
    return { actorCount: 0, actorSpanX: 0 };
  }
  const xs = actors.map((actor) => resolveXCoord(actor.x ?? 'center'));
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  return {
    actorCount: actors.length,
    actorSpanX: Number((maxX - minX).toFixed(2)),
  };
}

export const ASYMMETRIC_THIRD_MAX_SYLLABLES = 28;

/**
 * Ràng buộc B.3: Chỉ cho phép layout ASYMMETRIC_THIRD khi câu đạt <= 28 âm tiết
 * VÀ (shotMode === 'MACRO_PROP' hoặc cảnh chỉ có tối đa 1 nhân vật / cụm nhân vật đứng gọn actorSpanX <= 56).
 */
export function canUseAsymmetricThird(
  script: StageScript | null | undefined,
  shotMode: ShotMode,
  syllableCount = 0
): {
  allowed: boolean;
  actorCount: number;
  actorSpanX: number;
  syllableCount: number;
  blockedBySyllables: boolean;
  blockedByActorSpread: boolean;
} {
  const { actorCount, actorSpanX } = analyzeScriptSubjectSpread(script);
  const blockedBySyllables = syllableCount > ASYMMETRIC_THIRD_MAX_SYLLABLES;
  const blockedByActorSpread =
    shotMode !== 'MACRO_PROP' && actorCount > 1 && actorSpanX > 56;
  return {
    allowed: !blockedBySyllables && !blockedByActorSpread,
    actorCount,
    actorSpanX,
    syllableCount,
    blockedBySyllables,
    blockedByActorSpread,
  };
}

function buildSeededMotes(seed: number): PaperMoteSpec[] {
  const rnd = createPrng(seed ^ 0x9e3779b9);
  return Array.from({ length: 14 }, (_, idx) => ({
    baseX: Number((150 + rnd() * 740).toFixed(1)),
    baseY: Number((350 + rnd() * 1120).toFixed(1)),
    ampX: Number((18 + rnd() * 16).toFixed(1)),
    ampY: Number((14 + rnd() * 14).toFixed(1)),
    harmX: idx % 2 === 0 ? 1 : 2,
    harmY: idx % 3 === 0 ? 2 : 1,
    phase: Number((rnd() * Math.PI * 2).toFixed(3)),
    r: Number((1.4 + rnd() * 0.9).toFixed(2)),
    alpha: Number((0.11 + rnd() * 0.06).toFixed(3)),
    isAccent: idx === 5 || idx === 11,
  }));
}

function hasPropFocusTarget(script?: StageScript | null): boolean {
  const props = script?.props ?? [];
  return props.some(
    (p) => p.focusRole === 'hero' || p.colorRole === 'accent'
  );
}

/**
 * Bộ giải mã tất định visualDNA 4 trục từ thông số Chén + StageScript.
 */
export function resolveVisualDNA(
  props: Pick<VideoInputProps, 'id' | 'pivotWord' | 'themeId' | 'visualDNA'> & {
    segments?: string[];
  },
  script?: StageScript | null
): ResolvedVisualDNA {
  const seedKey = `${props.id || 'cup-01'}::${props.pivotWord || ''}::${props.themeId || ''}`;
  const seed = hashCupSeed(seedKey);
  const spread = analyzeScriptSubjectSpread(script);
  const syllableCount = props.segments
    ? auditVietnameseSyllables(props.segments).count
    : 0;
  const spec = props.visualDNA;

  const isLegacyLocked =
    spec?.mode === 'LEGACY_LOCK' ||
    (isLegacyPublishedCupId(props.id) &&
      spec?.mode !== 'CUSTOM' &&
      spec?.mode !== 'AUTO');

  if (isLegacyLocked) {
    return {
      seed,
      isLegacyLocked: true,
      layout: 'CLASSIC_TOP_STAGE',
      lightingGobo: 'NONE',
      shotMode: 'SOLID_SCENE',
      pivotMechanic: 'ACCENT_PUSH_IN',
      horizonOffsetPx: 0,
      forceSolidStyle: false,
      vignetteCenter: {
        xPct: 50,
        yPct: 44,
        ampXPct: 1.4,
        ampYPct: 1.1,
      },
      brushOrientation: 'VERTICAL_BRUSH',
      motes: LEGACY_PAPER_MOTES,
      downgradedAsymmetricThird: false,
      actorCount: spread.actorCount,
      actorSpanX: spread.actorSpanX,
      syllableCount,
    };
  }

  const rnd = createPrng(seed);
  const pick = <T>(arr: readonly T[]): T =>
    arr[Math.floor(rnd() * arr.length) % arr.length];

  const shotCandidates: ShotMode[] = hasPropFocusTarget(script)
    ? ['SOLID_SCENE', 'BRUSH_DRAW', 'MACRO_PROP', 'SOLID_SCENE']
    : ['SOLID_SCENE', 'BRUSH_DRAW'];
  const shotMode: ShotMode = spec?.shotMode ?? pick(shotCandidates);

  const asymmetricCheck = canUseAsymmetricThird(script, shotMode, syllableCount);
  const layoutCandidates: LayoutVariant[] = asymmetricCheck.allowed
    ? [
        'CLASSIC_TOP_STAGE',
        'SKY_QUOTE_BOTTOM_STAGE',
        'WINDOW_FRAME',
        'ASYMMETRIC_THIRD',
      ]
    : ['CLASSIC_TOP_STAGE', 'SKY_QUOTE_BOTTOM_STAGE', 'WINDOW_FRAME'];

  let layout: LayoutVariant = spec?.layout ?? pick(layoutCandidates);
  let downgradedAsymmetricThird = false;
  if (layout === 'ASYMMETRIC_THIRD' && !asymmetricCheck.allowed) {
    layout = 'WINDOW_FRAME';
    downgradedAsymmetricThird = true;
  }

  const goboCandidates: LightingGobo[] = isDarkThemePalette(props.themeId)
    ? ['WARM_LANTERN', 'PORCH_MIST', 'WINDOW_SLATS']
    : ['FOLIAGE_DAPPLE', 'WINDOW_SLATS', 'PORCH_MIST', 'WARM_LANTERN'];
  const hasBoiCanhBo = Boolean(
    script?.tags?.some((t) => t.startsWith('boi_canh_bo:'))
  );
  const lightingGobo: LightingGobo =
    spec?.lightingGobo ?? (hasBoiCanhBo ? 'NONE' : pick(goboCandidates));

  const pivotCandidates: PivotMechanic[] = [
    'PARALLAX_DRIFT',
    'PULLBACK_REVEAL',
    'ACCENT_PUSH_IN',
    'SPOTLIGHT_DIM',
  ];
  const pivotMechanic: PivotMechanic =
    spec?.pivotMechanic ?? pick(pivotCandidates);

  const autoHorizon = Math.round((rnd() * 2 - 1) * 18);
  const horizonOffsetPx = spec?.horizonOffsetPx ?? autoHorizon;

  // Neo động tâm Stage Radial Glow (cx, cy) theo đúng tâm hình học của LayoutVariant trên 1080×1920
  const geo = resolveLayoutGeometry(layout);
  const baseCxPct =
    ((geo.stageLeft + geo.stageWidth * 0.5) / LAYOUT_TOKENS.width) * 100;
  const baseCyPct =
    ((geo.stageTop + geo.stageHeight * 0.5) / LAYOUT_TOKENS.height) * 100;
  const clampPct = (v: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, v));

  const vignetteCenter = {
    xPct: Number(clampPct(baseCxPct + (rnd() * 2 - 1) * 1.8, 18, 82).toFixed(2)),
    yPct: Number(clampPct(baseCyPct + (rnd() * 2 - 1) * 1.5, 18, 82).toFixed(2)),
    ampXPct: Number((1.1 + rnd() * 0.9).toFixed(2)),
    ampYPct: Number((0.9 + rnd() * 0.8).toFixed(2)),
  };

  const brushOrientation = 'VERTICAL_BRUSH' as const;

  return {
    seed,
    isLegacyLocked: false,
    layout,
    lightingGobo,
    shotMode,
    pivotMechanic,
    horizonOffsetPx,
    forceSolidStyle: spec?.forceSolidStyle ?? true,
    vignetteCenter,
    brushOrientation,
    motes: buildSeededMotes(seed),
    downgradedAsymmetricThird,
    actorCount: spread.actorCount,
    actorSpanX: spread.actorSpanX,
    syllableCount,
  };
}

/**
 * Quy đổi archetype LayoutVariant thành tọa độ khung Stage & Typography an toàn đa nền tảng.
 */
export function resolveLayoutGeometry(
  layout: LayoutVariant,
  _brushOrientation?: 'VERTICAL_BRUSH'
): LayoutGeometry {
  const sg = LAYOUT_TOKENS.swissGrid;
  const resolvedBrush = 'VERTICAL_BRUSH' as const;

  switch (layout) {
    case 'SKY_QUOTE_BOTTOM_STAGE':
      return {
        layout,
        brushOrientation: resolvedBrush,
        stageTop: 1032,
        stageLeft: sg.stageLeft,
        stageWidth: sg.stageWidth,
        stageHeight: 496,
        stageFrameMode: 'NONE',
        typographyTop: 348,
        typographyLeft: sg.marginLeft,
        typographyMaxBottom: 1008,
        quoteBlockWidth: sg.quoteBlockWidth,
        typographyMaxWidth: sg.typographyMaxWidth,
        topSpacerMaxPx: 112,
        topSpacerFlexGrow: 0.52,
        bottomSpacerFlexGrow: 0.48,
      };
    case 'WINDOW_FRAME':
      return {
        layout,
        brushOrientation: resolvedBrush,
        stageTop: 356,
        stageLeft: 186,
        stageWidth: 620,
        stageHeight: 454,
        stageFrameMode: 'WINDOW_ARCH',
        typographyTop: 846,
        typographyLeft: sg.marginLeft,
        typographyMaxBottom: sg.typographyMaxBottom,
        quoteBlockWidth: sg.quoteBlockWidth,
        typographyMaxWidth: sg.typographyMaxWidth,
        topSpacerMaxPx: 135,
        topSpacerFlexGrow: 0.46,
        bottomSpacerFlexGrow: 0.54,
      };
    case 'ASYMMETRIC_THIRD':
      return {
        layout,
        brushOrientation: resolvedBrush,
        stageTop: 358,
        stageLeft: sg.marginLeft,
        stageWidth: 388,
        stageHeight: 332,
        stageFrameMode: 'NONE',
        typographyTop: 718,
        typographyLeft: sg.marginLeft + 36,
        typographyMaxBottom: sg.typographyMaxBottom,
        quoteBlockWidth: sg.quoteBlockWidth - 36,
        typographyMaxWidth:
          sg.quoteBlockWidth - 36 - LAYOUT_TOKENS.typography.railOffsetPx,
        topSpacerMaxPx: 120,
        topSpacerFlexGrow: 0.42,
        bottomSpacerFlexGrow: 0.58,
      };
    case 'CLASSIC_TOP_STAGE':
    default:
      return {
        layout: 'CLASSIC_TOP_STAGE',
        brushOrientation: resolvedBrush,
        stageTop: sg.stageTop,
        stageLeft: sg.stageLeft,
        stageWidth: sg.stageWidth,
        stageHeight: sg.stageHeight,
        stageFrameMode: 'NONE',
        typographyTop: sg.typographyTop,
        typographyLeft: sg.marginLeft,
        typographyMaxBottom: sg.typographyMaxBottom,
        quoteBlockWidth: sg.quoteBlockWidth,
        typographyMaxWidth: sg.typographyMaxWidth,
        topSpacerMaxPx: 145,
        topSpacerFlexGrow: 0.44,
        bottomSpacerFlexGrow: 0.56,
      };
  }
}

export const LAYOUT_VARIANT_SHORT_LABELS: Record<LayoutVariant, string> = {
  CLASSIC_TOP_STAGE: 'Cổ điển',
  SKY_QUOTE_BOTTOM_STAGE: 'Chân mây',
  WINDOW_FRAME: 'Cửa sổ',
  ASYMMETRIC_THIRD: '1/3 Macro',
};

/**
 * Gợi ý nhanh 1 tổ hợp Visual DNA CUSTOM khác biệt với các Chén trước đó mà vẫn tôn trọng B.3.
 */
export function suggestDistinctVisualDNA(
  currentProps: Pick<
    VideoInputProps,
    'id' | 'pivotWord' | 'themeId' | 'visualDNA'
  > & { segments?: string[] },
  script?: StageScript | null,
  avoidLayouts: LayoutVariant[] = [],
  avoidGobos: LightingGobo[] = [],
  salt = 1
): NonNullable<VideoInputProps['visualDNA']> {
  const baseSeed = hashCupSeed(
    `${currentProps.id || 'cup'}::${currentProps.pivotWord || ''}::${currentProps.themeId || ''}::flip`
  );
  const saltedSeed = (baseSeed ^ Math.imul(Math.max(1, salt), 0x9e3779b9)) >>> 0;
  const rnd = createPrng(saltedSeed || 1);
  const pick = <T>(arr: readonly T[]): T =>
    arr[Math.floor(rnd() * arr.length) % arr.length];

  const cur = resolveVisualDNA(currentProps, script);
  const syllableCount = currentProps.segments
    ? auditVietnameseSyllables(currentProps.segments).count
    : 0;
  const shotOptions: ShotMode[] = hasPropFocusTarget(script)
    ? ['SOLID_SCENE', 'BRUSH_DRAW', 'MACRO_PROP']
    : ['SOLID_SCENE', 'BRUSH_DRAW'];
  const nonCurrentShots = shotOptions.filter((s) => s !== cur.shotMode);
  const shotMode = pick(nonCurrentShots.length > 0 ? nonCurrentShots : shotOptions);

  const asymmetricCheck = canUseAsymmetricThird(script, shotMode, syllableCount);
  const allowedLayouts: LayoutVariant[] = asymmetricCheck.allowed
    ? [
        'CLASSIC_TOP_STAGE',
        'SKY_QUOTE_BOTTOM_STAGE',
        'WINDOW_FRAME',
        'ASYMMETRIC_THIRD',
      ]
    : ['CLASSIC_TOP_STAGE', 'SKY_QUOTE_BOTTOM_STAGE', 'WINDOW_FRAME'];
  const distinctLayouts = allowedLayouts.filter(
    (l) => l !== cur.layout && !avoidLayouts.includes(l)
  );
  const fallbackLayouts = allowedLayouts.filter((l) => l !== cur.layout);
  const layout = pick(
    distinctLayouts.length > 0
      ? distinctLayouts
      : fallbackLayouts.length > 0
        ? fallbackLayouts
        : allowedLayouts
  );

  const goboPool: LightingGobo[] = isDarkThemePalette(currentProps.themeId)
    ? ['WARM_LANTERN', 'PORCH_MIST', 'WINDOW_SLATS']
    : ['FOLIAGE_DAPPLE', 'WINDOW_SLATS', 'PORCH_MIST', 'WARM_LANTERN'];
  const distinctGobos = goboPool.filter(
    (g) => g !== cur.lightingGobo && !avoidGobos.includes(g)
  );
  const fallbackGobos = goboPool.filter((g) => g !== cur.lightingGobo);
  const lightingGobo = pick(
    distinctGobos.length > 0
      ? distinctGobos
      : fallbackGobos.length > 0
        ? fallbackGobos
        : goboPool
  );

  const pivotPool: PivotMechanic[] = [
    'PARALLAX_DRIFT',
    'PULLBACK_REVEAL',
    'ACCENT_PUSH_IN',
    'SPOTLIGHT_DIM',
  ];
  const distinctPivots = pivotPool.filter((p) => p !== cur.pivotMechanic);
  const pivotMechanic = pick(distinctPivots.length > 0 ? distinctPivots : pivotPool);

  const horizonOffsetPx = Math.round((rnd() * 2 - 1) * 18);

  return {
    mode: 'CUSTOM',
    layout,
    lightingGobo,
    shotMode,
    pivotMechanic,
    horizonOffsetPx,
    forceSolidStyle: true,
  };
}
