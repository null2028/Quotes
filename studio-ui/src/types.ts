import {
  FoleyPivotStyle,
  VideoInputProps,
  StageTuning,
} from '../../src/schemas/videoSchema';
import { StageScript } from '../../src/stage/stageScriptSchema';

export type RenderJobStatus =
  | 'draft'
  | 'queued'
  | 'bundling'
  | 'rendering'
  | 'completed'
  | 'failed';

export type PublishSlot = 'Morning' | 'Anytime' | 'Night';

export type CupPublishStatus =
  | 'draft'
  | 'rendered'
  | 'scheduled'
  | 'published';

export interface TnMetrics {
  completionRate?: number;
  watchRatio?: number;
  shareRate?: number;
  saveRate?: number;
  commentRate?: number;
}

export interface CupAirtableTrackMeta {
  airtableRecordId?: string;
  publishStatus: CupPublishStatus;
  slot: PublishSlot;
  mood: string;
  publishedDate?: string;
  seedComment?: string;
  tnMetrics?: TnMetrics;
  tnScore?: number;
  promotedToQ?: boolean;
  promotedQCode?: string;
  syncedAt?: string;
}

export interface CupRecord {
  id: string;
  cupNumber: string;
  status: RenderJobStatus;
  progress: number;
  videoUrl?: string;
  seoVideoUrl?: string;
  seoFileName?: string;
  thumbUrl?: string;
  captionText: string;
  errorMessage?: string;
  publishTrack?: CupAirtableTrackMeta;
  props: VideoInputProps;
}

export interface VaultSceneMeta {
  sceneId: string;
  name: string;
  category: 'TRAVELER' | 'OBJECT';
  origin: 'built-in' | 'custom' | 'script';
  act1: string;
  act2AtPivot: string;
  act3Afterimage: string;
  redProp: string;
  tags: string[];
  usageCount: number;
}

export interface StageScriptResponse {
  sceneId: string;
  name: string;
  isScript: boolean;
  script: StageScript;
}

export interface SceneCodeResponse {
  sceneId: string;
  componentName: string;
  isCustom: boolean;
  tsxCode: string;
}

export interface CupBundleImport {
  cupId?: string;
  title?: string;
  author?: string;
  fontSizeScale?: number;
  textFormat?: 'POEM' | 'PROSE';
  segments: string[];
  pivotWord?: string;
  themeVariant?: string;
  themeId?: string;
  targetDurationSeconds?: number;
  stageTuning?: StageTuning;
  bgm?: {
    foleyPivotStyle?: FoleyPivotStyle;
  };
  sceneId?: string;
  scene?: {
    sceneId: string;
    name?: string;
    description?: string;
    act1?: string;
    act2AtPivot?: string;
    act3Afterimage?: string;
    redProp?: string;
    tsxCode?: string;
  };
}

export interface AirtableBaseSummary {
  id: string;
  name: string;
  permissionLevel: string;
}

export interface AirtableFieldMeta {
  id: string;
  name: string;
  type: string;
}

export interface AirtableRecordItem {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
}

export interface AirtableTableCache {
  id: string;
  name: string;
  primaryFieldId?: string;
  fields: AirtableFieldMeta[];
  records: AirtableRecordItem[];
  recordCount: number;
}

export interface AirtableWorkspaceCache {
  syncedAt: string;
  selectedBaseId: string;
  selectedBaseName: string;
  selectedTableId: string;
  bases: AirtableBaseSummary[];
  tables: AirtableTableCache[];
}
