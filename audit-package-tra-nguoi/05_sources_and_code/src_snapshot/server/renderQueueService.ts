import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { bundle } from '@remotion/bundler';
import { selectComposition, renderMedia } from '@remotion/renderer';
import { VideoInputProps, VideoInputSchema } from '../src/schemas/videoSchema';
import { isDarkThemePalette } from '../src/theme/palettes';
import {
  auditVietnameseSyllables,
  computeTimelineSync,
} from '../src/engine/timelineSync';
import {
  getAudioMasterFileName,
  synthesizeCupAudioByMode,
} from '../src/engine/foleyEngine';
import { validateAndNormalizeVideoProps } from '../src/automation/validator';
import { resolveCupCaption } from '../src/automation/captionBuilder';
import { formatCupBaseFileName } from '../src/automation/fileNaming';
import {
  CustomPropDefinition,
  StageScript,
  StageScriptSchema,
} from '../src/stage/stageScriptSchema';
import { incrementSceneUsage } from './sceneManagerService';
import {
  resolveLayoutGeometry,
  resolveVisualDNA,
} from '../src/engine/visualDnaResolver';
import { resolveStageScript } from '../src/stage/stageScriptRegistry';
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

let cachedBundleLocation: string | null = null;
let isWorkerRunning = false;
const pendingCupQueue: string[] = [];
let cachedSupportsNoiseFilter: boolean | null = null;

interface FfmpegBinaryResolution {
  ffmpegBin: string;
  ffprobeBin: string;
  env: NodeJS.ProcessEnv;
}

function resolveRemotionFfmpegBinaries(): FfmpegBinaryResolution {
  const compositorDir = path.resolve(
    PROJECT_ROOT,
    `node_modules/@remotion/compositor-${process.platform}-${process.arch}`
  );
  const bundledFfmpeg = path.resolve(compositorDir, 'ffmpeg');
  const bundledFfprobe = path.resolve(compositorDir, 'ffprobe');
  const hasBundled = fs.existsSync(bundledFfmpeg) && fs.existsSync(bundledFfprobe);
  const env: NodeJS.ProcessEnv = { ...process.env };
  if (hasBundled) {
    env.DYLD_LIBRARY_PATH = env.DYLD_LIBRARY_PATH
      ? `${compositorDir}:${env.DYLD_LIBRARY_PATH}`
      : compositorDir;
    env.LD_LIBRARY_PATH = env.LD_LIBRARY_PATH
      ? `${compositorDir}:${env.LD_LIBRARY_PATH}`
      : compositorDir;
  }
  return {
    ffmpegBin: hasBundled ? bundledFfmpeg : 'ffmpeg',
    ffprobeBin: hasBundled ? bundledFfprobe : 'ffprobe',
    env,
  };
}

function checkFfmpegSupportsNoiseFilter(): boolean {
  if (cachedSupportsNoiseFilter !== null) {
    return cachedSupportsNoiseFilter;
  }
  const { ffmpegBin, env } = resolveRemotionFfmpegBinaries();
  const res = spawnSync(ffmpegBin, ['-hide_banner', '-h', 'filter=noise'], {
    env,
    encoding: 'utf-8',
  });
  const combined = `${res.stdout || ''}\n${res.stderr || ''}`;
  cachedSupportsNoiseFilter =
    res.status === 0 && !/Unknown filter/i.test(combined);
  return cachedSupportsNoiseFilter;
}

/**
 * Ràng buộc B.4: Nối filter mới vào tham số -vf/-filter:v sẵn có (nếu Remotion đã đặt)
 * thay vì truyền 2 cờ -vf xung đột lẫn nhau.
 */
function appendVideoFilterSafe(args: string[], filterExpr: string): void {
  const vfIdx = args.findIndex((a) => a === '-vf' || a === '-filter:v');
  if (vfIdx !== -1 && vfIdx + 1 < args.length) {
    args[vfIdx + 1] = `${args[vfIdx + 1]},${filterExpr}`;
  } else {
    const encIdx = args.indexOf('libx264');
    if (encIdx !== -1) {
      args.splice(encIdx + 1, 0, '-vf', filterExpr);
    }
  }
}

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

        // Tổng hợp Audio theo 1 trong 3 chế độ (mặc định Mode 2 PIVOT_ACCENT với dither -55 dBFS siêu nhẹ)
        const audioResult = synthesizeCupAudioByMode(normalizedProps, syncInfo);
        const audioFileName = getAudioMasterFileName(
          normalizedProps.id,
          audioResult.audioMode
        );
        const resolvedFoleyPivotStyle = audioResult.pivotStyle;
        const wavBuf = Buffer.from(audioResult.wavBytes);

        fs.mkdirSync(PUBLIC_AUDIO_DIR, { recursive: true });
        fs.writeFileSync(path.resolve(PUBLIC_AUDIO_DIR, audioFileName), wavBuf);

        const bundleAudioDir = path.resolve(
          cachedBundleLocation,
          'public/audio'
        );
        fs.mkdirSync(bundleAudioDir, { recursive: true });
        fs.writeFileSync(path.resolve(bundleAudioDir, audioFileName), wavBuf);

        updateCupInStore(nextCupId, (c) => ({
          ...c,
          status: 'rendering',
          progress: 10,
          props: normalizedProps,
        }));

        const jobOutDir = path.resolve(OUTPUT_ROOT, normalizedProps.id);
        fs.mkdirSync(jobOutDir, { recursive: true });
        fs.mkdirSync(VIDEOS_EXPORT_DIR, { recursive: true });

        const composition = await selectComposition({
          serveUrl: cachedBundleLocation,
          id: 'MinimalQuoteVideo',
          inputProps: normalizedProps,
        });

        const cupBaseName = formatCupBaseFileName(
          target.cupNumber || normalizedProps.id,
          normalizedProps.title
        );

        const videoFileName = `${cupBaseName}.mp4`;

        const videoOutPath = path.resolve(jobOutDir, videoFileName);
        const rawRenderTmpPath = path.resolve(jobOutDir, '.raw-render.mp4');
        const metaOutPath = path.resolve(jobOutDir, 'metadata.json');

        const h264Level = composition.fps > 30 ? '4.2' : '4.1';
        const isDarkTheme = isDarkThemePalette(normalizedProps.themeId);
        // -aq-mode 3 thiên vị bit cho vùng tối, nên nền tối dùng CRF 20 để dung lượng ổn định 2.5-4.2 MB
        const targetCrf = isDarkTheme ? 20 : 19;
        const maxRateStr = '5M';
        const bufSizeStr = '10M';
        const supportsNoiseFilter = checkFfmpegSupportsNoiseFilter();

        if (fs.existsSync(rawRenderTmpPath)) {
          fs.unlinkSync(rawRenderTmpPath);
        }

        await renderMedia({
          composition,
          serveUrl: cachedBundleLocation,
          codec: 'h264',
          imageFormat: 'png',
          pixelFormat: 'yuv420p',
          crf: targetCrf,
          encodingMaxRate: maxRateStr,
          encodingBufferSize: bufSizeStr,
          x264Preset: 'medium',
          gopSize: composition.fps,
          colorSpace: 'bt709',
          audioCodec: 'aac',
          audioBitrate: audioResult.audioMode === 'TIKTOK_SILENT' ? '96k' : '128k',
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
            if (!next.includes('-aq-mode')) {
              extraFlags.push('-aq-mode', '3', '-aq-strength', '1.08');
            }
            if (extraFlags.length > 0) {
              next.splice(encoderIdx + 1, 0, ...extraFlags);
            }
            if (supportsNoiseFilter) {
              appendVideoFilterSafe(
                next,
                isDarkTheme ? 'noise=c0s=3:c0f=t+u' : 'noise=c0s=1.5:c0f=t+u'
              );
            }
            return next;
          },
          outputLocation: rawRenderTmpPath,
          inputProps: normalizedProps,
          onProgress: ({ progress }) => {
            const pct = Math.min(95, Math.max(10, Math.round(10 + progress * 85)));
            updateCupInStore(nextCupId, (c) => ({
              ...c,
              status: 'rendering',
              progress: pct,
            }));
          },
        });

        // Hậu xử lý Remux siêu tốc (<80ms): Xóa sạch dấu vết Lavf / Remotion và đóng creation_time thực tế
        const { ffmpegBin, env: ffEnv } = resolveRemotionFfmpegBinaries();
        const creationIso = new Date()
          .toISOString()
          .replace(/\.\d{3}Z$/, 'Z');
        const remuxRes = spawnSync(
          ffmpegBin,
          [
            '-y',
            '-v',
            'error',
            '-i',
            rawRenderTmpPath,
            '-map',
            '0',
            '-c',
            'copy',
            '-map_metadata',
            '-1',
            '-fflags',
            '+bitexact',
            '-flags:v',
            '+bitexact',
            '-flags:a',
            '+bitexact',
            '-movflags',
            '+faststart',
            '-metadata',
            `creation_time=${creationIso}`,
            videoOutPath,
          ],
          { env: ffEnv, encoding: 'utf-8' }
        );
        if (remuxRes.status === 0 && fs.existsSync(videoOutPath)) {
          if (fs.existsSync(rawRenderTmpPath)) {
            fs.unlinkSync(rawRenderTmpPath);
          }
        } else {
          // Dự phòng an toàn nếu remux gặp lỗi bất ngờ
          fs.renameSync(rawRenderTmpPath, videoOutPath);
        }

        // Dọn các file cover PNG hoặc SEO MP4 dư trong thư mục jobOutDir (nếu có từ các lần render cũ)
        for (const existingFile of fs.readdirSync(jobOutDir)) {
          if (
            existingFile !== videoFileName &&
            existingFile !== 'metadata.json' &&
            (existingFile.endsWith('-cover.png') || existingFile.endsWith('.mp4'))
          ) {
            try {
              fs.unlinkSync(path.resolve(jobOutDir, existingFile));
            } catch {
              // ignore cleanup error
            }
          }
        }

        fs.copyFileSync(
          videoOutPath,
          path.resolve(VIDEOS_EXPORT_DIR, videoFileName)
        );

        const captionText = buildTraNguoiCaption(
          normalizedProps.id,
          normalizedProps
        );
        const activeSceneId =
          normalizedProps.motion.sceneId || normalizedProps.motion.archetype;
        const resolvedScript = resolveStageScript(
          activeSceneId,
          normalizedProps.motion.stageScript
        );
        const resolvedVisualDNA = resolveVisualDNA(normalizedProps, resolvedScript);
        const resolvedLayoutGeo = resolveLayoutGeometry(
          resolvedVisualDNA.layout,
          resolvedVisualDNA.brushOrientation
        );

        const metadata = {
          id: normalizedProps.id,
          cupBaseName,
          title: normalizedProps.title,
          textFormat: normalizedProps.textFormat,
          syllableCount: syllableInfo.count,
          syllableBand: syllableInfo.band,
          captionText,
          pivotWord: normalizedProps.pivotWord,
          pivotFrame: syncInfo.pivotFrame,
          recommendedCoverFrame: syncInfo.recommendedCoverFrame,
          recommendedCoverSeconds: Number(
            (syncInfo.recommendedCoverFrame / syncInfo.fps).toFixed(2)
          ),
          durationMode: normalizedProps.durationMode ?? 'FIXED',
          durationInFrames: syncInfo.durationInFrames,
          durationSeconds: Number(
            (syncInfo.durationInFrames / syncInfo.fps).toFixed(2)
          ),
          encodingSpec: {
            resolution: `${composition.width}x${composition.height}`,
            fps: composition.fps,
            codec: `h264-high-L${h264Level}`,
            colorSpace: 'bt709',
            videoBitrate: `CRF ${targetCrf} (max ${maxRateStr})`,
            audio: `aac-${audioResult.audioMode === 'TIKTOK_SILENT' ? '96k' : '128k'}-48khz`,
            loudnessTarget:
              audioResult.audioMode === 'FOLEY_MASTER'
                ? '-14.0 LUFS (-1.5 dBTP)'
                : audioResult.audioMode === 'PIVOT_ACCENT'
                  ? '-55 dBFS dither + Pivot Hit'
                  : 'Silent AAC 48kHz Stereo',
            audioMode: audioResult.audioMode,
            foleyPivotStyle: resolvedFoleyPivotStyle,
            foleyMasterWav: audioFileName,
            noiseFilterApplied: supportsNoiseFilter,
            metadataSanitized: remuxRes.status === 0,
            faststart: true,
            seamlessLoop: true,
          },
          sceneId: activeSceneId,
          themeId: normalizedProps.themeId,
          visualDNA: {
            isLegacyLocked: resolvedVisualDNA.isLegacyLocked,
            layout: resolvedVisualDNA.layout,
            lightingGobo: resolvedVisualDNA.lightingGobo,
            shotMode: resolvedVisualDNA.shotMode,
            pivotMechanic: resolvedVisualDNA.pivotMechanic,
            horizonOffsetPx: resolvedVisualDNA.horizonOffsetPx,
            forceSolidStyle: resolvedVisualDNA.forceSolidStyle,
            downgradedAsymmetricThird:
              resolvedVisualDNA.downgradedAsymmetricThird,
            typographyZoneY: [
              resolvedLayoutGeo.typographyTop,
              resolvedLayoutGeo.typographyMaxBottom,
            ],
            stageZoneY: [
              resolvedLayoutGeo.stageTop,
              resolvedLayoutGeo.stageTop + resolvedLayoutGeo.stageHeight,
            ],
          },
          videoFile: videoFileName,
        };
        fs.writeFileSync(metaOutPath, JSON.stringify(metadata, null, 2), 'utf-8');

        incrementSceneUsage(activeSceneId);

        const ts = Date.now();
        updateCupInStore(nextCupId, (c) => {
          const {
            seoFileName: _omitSeoName,
            seoVideoUrl: _omitSeoUrl,
            thumbUrl: _omitThumb,
            ...restCup
          } = c;
          return {
            ...restCup,
            status: 'completed',
            progress: 100,
            captionText,
            videoUrl: `/output/${normalizedProps.id}/${encodeURIComponent(videoFileName)}?v=${ts}`,
          };
        });
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
