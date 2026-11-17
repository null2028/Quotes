import { z } from 'zod';
import { StageScriptSchema } from '../stage/stageScriptSchema';

export const ArchetypeEnum = z.enum([
  'TENSION_RELEASE',
  'ORBIT_DISTANCE',
  'CHAOS_TO_ORDER',
  'LINE_RUPTURE_HEAL',
  'BALANCE_SCALE',
  'GAUGE_TRANSITION',
]);

export const StageMotifEnum = z.enum([
  'STEINBERG_OBJECT_SPOTLIGHT',
  'YES_BUT_DIPTYCH',
  'MISDIRECTION_PULLBACK',
  'FORCEVILLE_METAMORPHOSIS',
  'MCCLOUD_STILL_VIGNETTE',
  'DE_WIT_HORIZON_PARABLE',
]);

export const PacingModeEnum = z.enum(['CONTEMPLATIVE', 'WRY_BATHOS']);

export const ThemeIdEnum = z.enum([
  'MINIMAL_LIGHT',
  'MINIMAL_DARK',
  'WARM_NOIR',
]);

export const AudioModeEnum = z.enum([
  'TIKTOK_SILENT',
  'PIVOT_ACCENT',
  'FOLEY_MASTER',
]);

export const DurationModeEnum = z.enum(['FIXED', 'AUTO_SEED']);

export const FoleyPivotStyleEnum = z.enum([
  'AUTO',
  'TEA_CUP',
  'WIND_CHIME',
  'WOOD_SEAL',
]);

export const LayoutVariantEnum = z.enum([
  'CLASSIC_TOP_STAGE',
  'SKY_QUOTE_BOTTOM_STAGE',
  'WINDOW_FRAME',
  'ASYMMETRIC_THIRD',
]);

export const LightingGoboEnum = z.enum([
  'NONE',
  'FOLIAGE_DAPPLE',
  'WINDOW_SLATS',
  'WARM_LANTERN',
  'PORCH_MIST',
]);

export const ShotModeEnum = z.enum([
  'SOLID_SCENE',
  'MACRO_PROP',
  'BRUSH_DRAW',
]);

export const PivotMechanicEnum = z.enum([
  'PARALLAX_DRIFT',
  'PULLBACK_REVEAL',
  'ACCENT_PUSH_IN',
  'SPOTLIGHT_DIM',
]);

export const VisualDNAModeEnum = z.enum(['AUTO', 'CUSTOM', 'LEGACY_LOCK']);

export const VisualDNASchema = z.object({
  mode: VisualDNAModeEnum.default('AUTO'),
  layout: LayoutVariantEnum.optional(),
  lightingGobo: LightingGoboEnum.optional(),
  shotMode: ShotModeEnum.optional(),
  pivotMechanic: PivotMechanicEnum.optional(),
  horizonOffsetPx: z.number().min(-48).max(48).optional(),
  forceSolidStyle: z.boolean().optional(),
});

export type AudioMode = z.infer<typeof AudioModeEnum>;
export type DurationMode = z.infer<typeof DurationModeEnum>;
export type FoleyPivotStyle = z.infer<typeof FoleyPivotStyleEnum>;
export type LayoutVariant = z.infer<typeof LayoutVariantEnum>;
export type LightingGobo = z.infer<typeof LightingGoboEnum>;
export type ShotMode = z.infer<typeof ShotModeEnum>;
export type PivotMechanic = z.infer<typeof PivotMechanicEnum>;
export type VisualDNAMode = z.infer<typeof VisualDNAModeEnum>;
export type VisualDNASpec = z.infer<typeof VisualDNASchema>;

export const StageTuningSchema = z.object({
  offsetX: z.number().min(-120).max(120).default(0),
  offsetY: z.number().min(-80).max(80).default(0),
  scale: z.number().min(0.65).max(1.5).default(1.0),
  strokeScale: z.number().min(0.7).max(1.4).default(1.0),
});

export type StageTuning = z.infer<typeof StageTuningSchema>;

export const MotionParamsSchema = z.object({
  sceneId: z.string().optional(),
  archetype: z.string().default('BOULDER_TO_BENCH'),
  stageMotif: StageMotifEnum.optional(),
  pacingMode: PacingModeEnum.default('CONTEMPLATIVE'),
  stageScript: StageScriptSchema.optional(),
  stateA: z
    .object({
      intensity: z.number().min(0).max(1).default(0.8),
      spread: z.number().min(0).max(1).default(0.2),
      tiltDeg: z.number().min(-45).max(45).default(-18),
    })
    .default({ intensity: 0.8, spread: 0.2, tiltDeg: -18 }),
  stateB: z
    .object({
      intensity: z.number().min(0).max(1).default(0.1),
      spread: z.number().min(0).max(1).default(0.75),
      tiltDeg: z.number().min(-45).max(45).default(0),
    })
    .default({ intensity: 0.1, spread: 0.75, tiltDeg: 0 }),
});

export const VideoInputSchema = z.object({
  id: z.string().default('cup-01'),
  textFormat: z.enum(['PROSE', 'POEM']).default('POEM'),
  title: z.string().optional(),
  author: z.string().optional(),
  customCaption: z.string().optional(),
  publishSlot: z.enum(['Morning', 'Anytime', 'Night']).optional(),
  publishMood: z.string().optional(),
  publishTopic: z.string().optional(),
  sourceRecordId: z.string().optional(),
  fontSizeScale: z.number().min(0.8).max(1.3).optional(),
  segments: z.array(z.string()).min(1).max(12),
  pivotWord: z.string(),
  highlightStyle: z
    .enum(['ACCENT_COLOR', 'UNDERLINE_DOT', 'BOTH'])
    .default('BOTH'),
  durationMode: DurationModeEnum.optional(),
  targetDurationSeconds: z.number().min(8).max(30).default(15),
  typingSpeedMsPerChar: z.number().min(25).max(100).default(55),
  holdAfterFinishSeconds: z.number().min(1.5).max(8).default(5.5),
  themeId: ThemeIdEnum.default('MINIMAL_LIGHT'),
  stageTuning: StageTuningSchema.optional(),
  visualDNA: VisualDNASchema.optional(),
  motion: MotionParamsSchema,
  bgm: z
    .object({
      audioMode: AudioModeEnum.catch('PIVOT_ACCENT').default('PIVOT_ACCENT'),
      foleyPivotStyle: FoleyPivotStyleEnum.catch('AUTO').default('AUTO'),
    })
    .default({
      audioMode: 'PIVOT_ACCENT',
      foleyPivotStyle: 'AUTO',
    }),
  brandText: z.string().default('TRÀ NGUỘI'),
});

export type VideoInputProps = z.infer<typeof VideoInputSchema>;
