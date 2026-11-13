import { z } from 'zod';

export const XKeywordEnum = z.enum([
  'far_left',
  'left',
  'center_left',
  'center',
  'center_right',
  'right',
  'far_right',
]);

export type XKeyword = z.infer<typeof XKeywordEnum>;

export const XCoordSchema = z.union([z.number(), XKeywordEnum]);
export type XCoord = z.infer<typeof XCoordSchema>;

export const TimeExprSchema = z.union([z.number(), z.string()]);
export type TimeExpr = z.infer<typeof TimeExprSchema>;

export const ColorRoleSchema = z.enum(['ink', 'secondary', 'accent']);
export type ColorRole = z.infer<typeof ColorRoleSchema>;

export const FocusRoleSchema = z.enum(['hero', 'support', 'ambient']);
export type FocusRole = z.infer<typeof FocusRoleSchema>;

export const LayerSchema = z.enum(['sky', 'far', 'mid', 'fore']);
export type StageLayer = z.infer<typeof LayerSchema>;

export const TravelerPoseSchema = z.enum([
  'walk',
  'stand',
  'push',
  'sit_lean',
  'look_up',
  'reach_out',
  'hold_up',
  'give',
]);
export type StageTravelerPose = z.infer<typeof TravelerPoseSchema>;

export const InlineShapeSchema = z.object({
  d: z.string().optional(),
  line: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  circle: z.tuple([z.number(), z.number(), z.number()]).optional(),
  rect: z
    .union([
      z.tuple([z.number(), z.number(), z.number(), z.number()]),
      z.tuple([z.number(), z.number(), z.number(), z.number(), z.number()]),
    ])
    .optional(),
  ellipse: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  fill: z.enum(['none', 'bg', 'ink', 'secondary', 'accent']).optional(),
  fillOpacity: z.number().min(0).max(1).optional(),
  role: ColorRoleSchema.optional(),
  strokeScale: z.number().optional(),
  dashed: z.boolean().optional(),
  show: z.enum(['always', 'before_pivot', 'after_pivot']).optional(),
  splitSide: z.enum(['left', 'right']).optional(),
  opacity: z.number().min(0).max(1).optional(),
});

export type InlineShape = z.infer<typeof InlineShapeSchema>;

export const CustomPropDefinitionSchema = z.object({
  anchorType: z.enum(['ground', 'hand', 'center']).optional(),
  emitterOffset: z.tuple([z.number(), z.number()]).optional(),
  tiltPivot: z.tuple([z.number(), z.number()]).optional(),
  shapes: z.array(InlineShapeSchema),
  altShapes: z.array(InlineShapeSchema).optional(),
});

export type CustomPropDefinition = z.infer<typeof CustomPropDefinitionSchema>;

export const TerrainTypeEnum = z.enum([
  'flat',
  'slope',
  'hill',
  'fork',
  'water_shore',
  'cliff_gap',
]);

export type TerrainType = z.infer<typeof TerrainTypeEnum>;

export const TerrainConfigSchema = z.union([
  TerrainTypeEnum,
  z.object({
    type: TerrainTypeEnum.optional(),
    y: z.number().optional(),
    startX: z.number().optional(),
    endX: z.number().optional(),
    angleDeg: z.number().optional(),
    hillCenterX: XCoordSchema.optional(),
    hillHeight: z.number().optional(),
    hillWidth: z.number().optional(),
    forkAtX: XCoordSchema.optional(),
    forkAngleDeg: z.number().optional(),
    shoreX: XCoordSchema.optional(),
    waterSide: z.enum(['left', 'right']).optional(),
    waveAmplitude: z.number().optional(),
    gapCenterX: XCoordSchema.optional(),
    gapHalfWidth: z.number().optional(),
    bridgeProgress: z.number().min(0).max(1).optional(),
    bridgeAt: TimeExprSchema.optional(),
    bridgeDuration: z.number().optional(),
  }),
]);

export type TerrainConfigInput = z.infer<typeof TerrainConfigSchema>;

export const AtmosphereTypeEnum = z.enum([
  'rain',
  'wind',
  'leaves',
  'steam',
  'birds',
  'sun',
  'hollow_sun',
  'crescent',
  'ring_pulse',
]);

export type AtmosphereType = z.infer<typeof AtmosphereTypeEnum>;

export const AtmosphereItemSchema = z.object({
  id: z.string().optional(),
  type: AtmosphereTypeEnum,
  x: XCoordSchema.optional(),
  y: z.number().optional(),
  radius: z.number().optional(),
  count: z.number().optional(),
  direction: z.enum(['left', 'right']).optional(),
  colorRole: ColorRoleSchema.optional(),
  focusRole: FocusRoleSchema.optional(),
  opacity: z.number().min(0).max(1).optional(),
  enterAt: TimeExprSchema.optional(),
  leaveAt: TimeExprSchema.optional(),
  fadeDuration: z.number().min(0.1).max(10).optional(),
});

export type AtmosphereItem = z.infer<typeof AtmosphereItemSchema>;

export const ActorSpecSchema = z.object({
  id: z.string().min(1, 'Actor cần có id (VD: "hero", "ex")'),
  x: XCoordSchema.optional(),
  yOffset: z.number().optional(),
  scale: z.number().min(0.2).max(3.5).optional(),
  facing: z.enum(['left', 'right']).optional(),
  pose: TravelerPoseSchema.optional(),
  leanDeg: z.number().optional(),
  sitProgress: z.number().min(0).max(1).optional(),
  opacity: z.number().min(0).max(1).optional(),
  colorRole: ColorRoleSchema.optional(),
  focusRole: FocusRoleSchema.optional(),
  showTeaCup: z.union([z.boolean(), z.number()]).optional(),
  dissolveToCloud: z.number().min(0).max(1).optional(),
  layer: LayerSchema.optional(),
  enterAt: TimeExprSchema.optional(),
  leaveAt: TimeExprSchema.optional(),
  fadeDuration: z.number().min(0.1).max(10).optional(),
});

export type ActorSpec = z.infer<typeof ActorSpecSchema>;

export const IdleModeEnum = z.enum([
  'none',
  'float',
  'bob',
  'sway',
  'pulse',
  'drift',
]);

export const PropIdleSchema = z.union([
  IdleModeEnum,
  z.object({
    type: IdleModeEnum,
    speed: z.number().optional(),
    amplitude: z.number().optional(),
    spanX: z.number().optional(),
    spanY: z.number().optional(),
  }),
]);

export type PropIdle = z.infer<typeof PropIdleSchema>;

export const PropEmittersSchema = z.object({
  steam: z.union([z.boolean(), z.number()]).optional(),
  pulseRing: z.union([z.boolean(), z.number()]).optional(),
  spill: z.union([z.boolean(), z.number()]).optional(),
  glow: z.union([z.boolean(), z.number()]).optional(),
  colorRole: ColorRoleSchema.optional(),
});

export type PropEmitters = z.infer<typeof PropEmittersSchema>;

export const PropSpecSchema = z.object({
  id: z.string().min(1, 'Prop cần có id (VD: "card", "jar")'),
  type: z.string().optional(),
  x: XCoordSchema.optional(),
  y: z.number().optional(),
  follow: z.string().nullable().optional(),
  layer: LayerSchema.optional(),
  scale: z.number().min(0.1).max(4).optional(),
  rotate: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
  colorRole: ColorRoleSchema.optional(),
  focusRole: FocusRoleSchema.optional(),
  drawProgress: z.number().min(0).max(1).optional(),
  morphProgress: z.number().min(0).max(1).optional(),
  splitProgress: z.number().min(0).max(1).optional(),
  floatAwayProgress: z.number().min(0).max(1).optional(),
  idle: PropIdleSchema.optional(),
  emitters: PropEmittersSchema.optional(),
  anchorType: z.enum(['ground', 'hand', 'center']).optional(),
  emitterOffset: z.tuple([z.number(), z.number()]).optional(),
  tiltPivot: z.tuple([z.number(), z.number()]).optional(),
  shapes: z.array(InlineShapeSchema).optional(),
  altShapes: z.array(InlineShapeSchema).optional(),
  saveAs: z.string().optional(),
  enterAt: TimeExprSchema.optional(),
  leaveAt: TimeExprSchema.optional(),
  fadeDuration: z.number().min(0.1).max(10).optional(),
});

export type PropSpec = z.infer<typeof PropSpecSchema>;

export const TimelineCueSchema = z.object({
  at: TimeExprSchema.optional(),
  when: TimeExprSchema.optional(),
  duration: z.number().min(0.05).max(15).optional(),
  target: z.string().min(1, 'Cue trong timeline[] cần chỉ rõ target (id của actor/prop hoặc "camera"/"terrain")'),
  // Vị trí & Điểm neo
  x: XCoordSchema.optional(),
  toX: XCoordSchema.optional(),
  y: z.number().optional(),
  toY: z.number().optional(),
  yOffset: z.number().optional(),
  arcY: z.number().optional(),
  follow: z.string().nullable().optional(),
  // Thuộc tính Actor & Prop chung
  scale: z.number().optional(),
  rotate: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
  colorRole: ColorRoleSchema.optional(),
  // Thuộc tính riêng của Actor
  facing: z.enum(['left', 'right']).optional(),
  pose: TravelerPoseSchema.optional(),
  leanDeg: z.number().optional(),
  sitProgress: z.number().min(0).max(1).optional(),
  showTeaCup: z.union([z.boolean(), z.number()]).optional(),
  dissolveToCloud: z.number().min(0).max(1).optional(),
  // Thuộc tính biến hình & hiệu ứng của Prop
  drawProgress: z.number().min(0).max(1).optional(),
  morphProgress: z.number().min(0).max(1).optional(),
  splitProgress: z.number().min(0).max(1).optional(),
  floatAwayProgress: z.number().min(0).max(1).optional(),
  emitters: PropEmittersSchema.optional(),
  // Thuộc tính của Terrain (cliff_gap) & Camera
  bridgeProgress: z.number().min(0).max(1).optional(),
  zoom: z.number().min(0.6).max(2.0).optional(),
  panX: z.number().optional(),
  panY: z.number().optional(),
});

export type TimelineCue = z.infer<typeof TimelineCueSchema>;

export const CameraSpecSchema = z.object({
  zoom: z.number().min(0.6).max(2.0).optional(),
  panX: z.number().optional(),
  panY: z.number().optional(),
});

export const StageScriptSchema = z.object({
  sceneId: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  act1: z.string().optional(),
  act2AtPivot: z.string().optional(),
  act3Afterimage: z.string().optional(),
  redProp: z.string().optional(),
  tags: z.array(z.string()).optional(),
  terrain: TerrainConfigSchema.optional(),
  atmosphere: z.array(AtmosphereItemSchema).optional(),
  actors: z.array(ActorSpecSchema).optional(),
  props: z.array(PropSpecSchema).optional(),
  camera: CameraSpecSchema.optional(),
  timeline: z.array(TimelineCueSchema).optional(),
  customPropsResolved: z
    .record(z.string(), CustomPropDefinitionSchema)
    .optional(),
});

export type StageScript = z.infer<typeof StageScriptSchema>;

/**
 * Định dạng thông báo lỗi Zod tiếng Việt rõ ràng để hiển thị trực tiếp trên UI Ngăn 2
 */
export function formatStageScriptZodError(err: unknown): string {
  if (err instanceof z.ZodError) {
    return err.issues
      .map((issue) => {
        const pathStr = issue.path.length > 0 ? issue.path.join('.') : 'root';
        return `• [${pathStr}]: ${issue.message}`;
      })
      .join('\n');
  }
  return err instanceof Error ? err.message : String(err);
}
