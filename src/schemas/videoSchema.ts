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
  'SLATE_CALM',
]);

export const AudioModeEnum = z.enum(['FOLEY_MASTER']);

export const FoleyPivotStyleEnum = z.enum([
  'AUTO',
  'TEA_CUP',
  'WIND_CHIME',
  'WOOD_SEAL',
]);

export type AudioMode = z.infer<typeof AudioModeEnum>;
export type FoleyPivotStyle = z.infer<typeof FoleyPivotStyleEnum>;

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
  targetDurationSeconds: z.number().min(8).max(30).default(15),
  typingSpeedMsPerChar: z.number().min(25).max(100).default(55),
  holdAfterFinishSeconds: z.number().min(1.5).max(8).default(5.5),
  themeId: ThemeIdEnum.default('MINIMAL_LIGHT'),
  stageTuning: StageTuningSchema.optional(),
  motion: MotionParamsSchema,
  bgm: z
    .object({
      audioMode: z
        .literal('FOLEY_MASTER')
        .catch('FOLEY_MASTER')
        .default('FOLEY_MASTER'),
      foleyPivotStyle: FoleyPivotStyleEnum.catch('AUTO').default('AUTO'),
    })
    .default({
      audioMode: 'FOLEY_MASTER',
      foleyPivotStyle: 'AUTO',
    }),
  brandText: z.string().default('TRÀ NGUỘI'),
});

export type VideoInputProps = z.infer<typeof VideoInputSchema>;
