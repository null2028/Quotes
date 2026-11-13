import fs from 'fs';
import path from 'path';
import { bundle } from '@remotion/bundler';
import { selectComposition, renderMedia } from '@remotion/renderer';
import { VideoInputProps, VideoInputSchema } from '../src/schemas/videoSchema';
import {
  auditVietnameseSyllables,
  computeTimelineSync,
} from '../src/engine/timelineSync';
import {
  getFoleyMasterFileName,
  synthesizeCupFoleyAudio,
} from '../src/engine/foleyEngine';
import { validateAndNormalizeVideoProps } from '../src/automation/validator';
import { resolveCupCaption } from '../src/automation/captionBuilder';
import {
  formatCupBaseFileName,
  formatCupSeoFileName,
} from '../src/automation/fileNaming';
import {
  CustomPropDefinition,
  StageScript,
  StageScriptSchema,
} from '../src/stage/stageScriptSchema';
import { incrementSceneUsage } from './sceneManagerService';
import {
  CupRecord,
  loadCups,
  saveCups,
  updateCupInStore,
} from './cupStore';

export type { CupRecord, RenderJobStatus } from './cupStore';
export { loadCups, saveCups, updateCupInStore } from './cupStore';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const STAGE_SCRIPTS_PATH = path.resolve(PROJECT_ROOT, 'data/stage-scripts.json');
const CUSTOM_PROPS_PATH = path.resolve(PROJECT_ROOT, 'data/custom-props.json');
const PUBLIC_AUDIO_DIR = path.resolve(PROJECT_ROOT, 'public/audio');
const OUTPUT_ROOT = path.resolve(PROJECT_ROOT, 'output');
const VIDEOS_EXPORT_DIR = path.resolve(PROJECT_ROOT, 'videos');
const VIDEOS_SEO_MASTER_DIR = path.resolve(VIDEOS_EXPORT_DIR, 'seo-master');

let cachedBundleLocation: string | null = null;
let isWorkerRunning = false;
const pendingCupQueue: string[] = [];

export function buildTraNguoiCaption(id: string, props: VideoInputProps): string {
  return resolveCupCaption(id, props);
}

function hydrateFreshStageScriptForRender(props: VideoInputProps): VideoInputProps {
  const activeSceneId = props.motion.sceneId || props.motion.archetype;
  if (!activeSceneId || !activeSceneId.startsWith('SCRIPT_')) {
    return props;
  }

  try {
    const scriptsMap: Record<string, StageScript> = fs.existsSync(STAGE_SCRIPTS_PATH)
      ? (JSON.parse(fs.readFileSync(STAGE_SCRIPTS_PATH, 'utf-8')) as Record<
          string,
          StageScript
        >)
      : {};
    const customPropsMap: Record<string, CustomPropDefinition> = fs.existsSync(
      CUSTOM_PROPS_PATH
    )
      ? (JSON.parse(fs.readFileSync(CUSTOM_PROPS_PATH, 'utf-8')) as Record<
          string,
          CustomPropDefinition
        >)
      : {};

    const diskScript = scriptsMap[activeSceneId] ?? props.motion.stageScript;
    if (!diskScript) return props;

    const parsed = StageScriptSchema.safeParse(diskScript);
    if (!parsed.success) return props;

    return {
      ...props,
      motion: {
        ...props.motion,
        stageScript: {
          ...parsed.data,
          sceneId: activeSceneId,
          customPropsResolved: {
            ...customPropsMap,
            ...(parsed.data.customPropsResolved ?? {}),
          },
        },
      },
    };
  } catch {
    return props;
  }
}

export function invalidateRemotionBundleCache(): void {
  cachedBundleLocation = null;
}

export function enqueueCupsForRender(cupIds: string[]): CupRecord[] {
  const cups = loadCups();
  const enqueued: CupRecord[] = [];

  for (const id of cupIds) {
    const cup = cups.find((c) => c.id === id);
    if (!cup) continue;
    cup.status = 'queued';
    cup.progress = 0;
    cup.errorMessage = undefined;
    enqueued.push(cup);
    if (!pendingCupQueue.includes(id)) {
      pendingCupQueue.push(id);
    }
  }

  saveCups(cups);
  void processRenderQueue();
  return enqueued;
}

async function processRenderQueue(): Promise<void> {
  if (isWorkerRunning) return;
  isWorkerRunning = true;

  try {
    while (pendingCupQueue.length > 0) {
      const nextCupId = pendingCupQueue.shift()!;
      const cups = loadCups();
      const target = cups.find((c) => c.id === nextCupId);
      if (!target) continue;

      try {
        if (!cachedBundleLocation) {
          updateCupInStore(nextCupId, (c) => ({
            ...c,
            status: 'bundling',
            progress: 5,
          }));
          cachedBundleLocation = await bundle({
            entryPoint: path.resolve(PROJECT_ROOT, 'src/index.ts'),
          });
        }

        const hydratedProps = hydrateFreshStageScriptForRender(
          VideoInputSchema.parse(target.props)
        );
        const normalizedProps = validateAndNormalizeVideoProps(hydratedProps);
        const syncInfo = computeTimelineSync(normalizedProps);
        const syllableInfo = auditVietnameseSyllables(normalizedProps.segments);

        // Luôn tổng hợp file WAV Foley Stereo 48 kHz chuẩn hóa -14.0 LUFS (Original Audio 100%)
        const foley = synthesizeCupFoleyAudio(normalizedProps, syncInfo);
        const foleyFileName = getFoleyMasterFileName(normalizedProps.id);
        const resolvedFoleyPivotStyle = foley.pivotStyle;
        const wavBuf = Buffer.from(foley.wavBytes);

        fs.mkdirSync(PUBLIC_AUDIO_DIR, { recursive: true });
        fs.writeFileSync(path.resolve(PUBLIC_AUDIO_DIR, foleyFileName), wavBuf);

        const bundleAudioDir = path.resolve(
          cachedBundleLocation,
          'public/audio'
        );
        fs.mkdirSync(bundleAudioDir, { recursive: true });
        fs.writeFileSync(path.resolve(bundleAudioDir, foleyFileName), wavBuf);

        updateCupInStore(nextCupId, (c) => ({
          ...c,
          status: 'rendering',
          progress: 10,
          props: normalizedProps,
        }));

        const jobOutDir = path.resolve(OUTPUT_ROOT, normalizedProps.id);
        fs.mkdirSync(jobOutDir, { recursive: true });
        fs.mkdirSync(VIDEOS_EXPORT_DIR, { recursive: true });
        fs.mkdirSync(VIDEOS_SEO_MASTER_DIR, { recursive: true });

        const composition = await selectComposition({
          serveUrl: cachedBundleLocation,
          id: 'MinimalQuoteVideo',
          inputProps: normalizedProps,
        });

        const cupBaseName = formatCupBaseFileName(
          target.cupNumber || normalizedProps.id,
          normalizedProps.title
        );
        const seoBaseName = formatCupSeoFileName(
          target.cupNumber || normalizedProps.id,
          {
            title: normalizedProps.title,
            pivotWord: normalizedProps.pivotWord,
            mood: normalizedProps.publishMood,
            topic: normalizedProps.publishTopic,
          }
        );

        const videoFileName = `${cupBaseName}.mp4`;
        const seoVideoFileName = `${seoBaseName}.mp4`;

        const videoOutPath = path.resolve(jobOutDir, videoFileName);
        const seoOutPath = path.resolve(jobOutDir, seoVideoFileName);
        const metaOutPath = path.resolve(jobOutDir, 'metadata.json');

        const h264Level = composition.fps > 30 ? '4.2' : '4.1';

        await renderMedia({
          composition,
          serveUrl: cachedBundleLocation,
          codec: 'h264',
          imageFormat: 'png',
          pixelFormat: 'yuv420p',
          videoBitrate: '10M',
          encodingMaxRate: '12M',
          encodingBufferSize: '20M',
          x264Preset: 'medium',
          gopSize: composition.fps,
          colorSpace: 'bt709',
          audioCodec: 'aac',
          audioBitrate: '192k',
          sampleRate: 48000,
          enforceAudioTrack: true,
          ffmpegOverride: ({ args }) => {
            const encoderIdx = args.indexOf('libx264');
            if (encoderIdx === -1) return args;
            const next = [...args];
            const extraFlags: string[] = [];
            if (!next.includes('-profile:v')) {
              extraFlags.push('-profile:v', 'high');
            }
            if (!next.includes('-level:v') && !next.includes('-level')) {
              extraFlags.push('-level:v', h264Level);
            }
            if (extraFlags.length > 0) {
              next.splice(encoderIdx + 1, 0, ...extraFlags);
            }
            return next;
          },
          outputLocation: videoOutPath,
          inputProps: normalizedProps,
          onProgress: ({ progress }) => {
            const pct = Math.min(98, Math.max(10, Math.round(10 + progress * 88)));
            updateCupInStore(nextCupId, (c) => ({
              ...c,
              status: 'rendering',
              progress: pct,
            }));
          },
        });

        fs.copyFileSync(
          videoOutPath,
          path.resolve(VIDEOS_EXPORT_DIR, videoFileName)
        );
        if (seoOutPath !== videoOutPath) {
          fs.copyFileSync(videoOutPath, seoOutPath);
        }
        fs.copyFileSync(
          videoOutPath,
          path.resolve(VIDEOS_SEO_MASTER_DIR, seoVideoFileName)
        );

        const captionText = buildTraNguoiCaption(
          normalizedProps.id,
          normalizedProps
        );
        const activeSceneId =
          normalizedProps.motion.sceneId || normalizedProps.motion.archetype;

        const metadata = {
          id: normalizedProps.id,
          cupBaseName,
          seoBaseName,
          title: normalizedProps.title,
          textFormat: normalizedProps.textFormat,
          syllableCount: syllableInfo.count,
          syllableBand: syllableInfo.band,
          captionText,
          pivotWord: normalizedProps.pivotWord,
          pivotFrame: syncInfo.pivotFrame,
          durationSeconds: Number(
            (syncInfo.durationInFrames / syncInfo.fps).toFixed(2)
          ),
          encodingSpec: {
            resolution: `${composition.width}x${composition.height}`,
            fps: composition.fps,
            codec: `h264-high-L${h264Level}`,
            colorSpace: 'bt709',
            videoBitrate: '10M (max 12M)',
            audio: 'aac-192k-48khz',
            loudnessTarget: '-14.0 LUFS (-1.5 dBTP)',
            audioMode: 'FOLEY_MASTER',
            foleyPivotStyle: resolvedFoleyPivotStyle,
            foleyMasterWav: foleyFileName,
            faststart: true,
            seamlessLoop: true,
          },
          sceneId: activeSceneId,
          themeId: normalizedProps.themeId,
          videoFile: videoFileName,
          seoVideoFile: seoVideoFileName,
        };
        fs.writeFileSync(metaOutPath, JSON.stringify(metadata, null, 2), 'utf-8');

        incrementSceneUsage(activeSceneId);

        const ts = Date.now();
        updateCupInStore(nextCupId, (c) => ({
          ...c,
          status: 'completed',
          progress: 100,
          captionText,
          seoFileName: seoVideoFileName,
          videoUrl: `/output/${normalizedProps.id}/${encodeURIComponent(videoFileName)}?v=${ts}`,
          seoVideoUrl: `/output/${normalizedProps.id}/${encodeURIComponent(seoVideoFileName)}?v=${ts}`,
          thumbUrl: undefined,
        }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[RenderQueue] Lỗi khi xuất ${nextCupId}:`, msg);
        updateCupInStore(nextCupId, (c) => ({
          ...c,
          status: 'failed',
          errorMessage: msg,
        }));
      }
    }
  } finally {
    isWorkerRunning = false;
  }
}
