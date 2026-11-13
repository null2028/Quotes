import fs from 'fs';
import path from 'path';
import { bundle } from '@remotion/bundler';
import { selectComposition, renderMedia } from '@remotion/renderer';
import { loadAndVerifyJobs } from './inputLoader';
import { createLLMCallerFromEnv } from './llmProvider';
import { mapQuoteToVideoProps } from '../automation/semanticMapper';
import { resolveCupCaption } from '../automation/captionBuilder';
import { formatCupBaseFileName } from '../automation/fileNaming';
import { computeTimelineSync } from '../engine/timelineSync';
import {
  getFoleyMasterFileName,
  synthesizeCupFoleyAudio,
} from '../engine/foleyEngine';
import { VideoInputProps } from '../schemas/videoSchema';

async function runBatchPipeline() {
  const args = process.argv.slice(2);
  const mapOnly = args.includes('--map-only');
  const inputArg = args.find((a) => a.startsWith('--input='))?.split('=')[1];

  const projectRoot = path.resolve(__dirname, '../..');
  const inputPath = path.resolve(projectRoot, inputArg || 'inputs/jobs.json');
  const outputRoot = path.resolve(projectRoot, 'output');
  const videosExportDir = path.resolve(projectRoot, 'videos');
  const publicAudioDir = path.resolve(projectRoot, 'public/audio');
  fs.mkdirSync(outputRoot, { recursive: true });
  fs.mkdirSync(videosExportDir, { recursive: true });

  const rawJobs = loadAndVerifyJobs(inputPath);
  const llmCaller = createLLMCallerFromEnv();

  const mappedSpecs: VideoInputProps[] = [];
  for (const job of rawJobs) {
    console.log(`[1/3] Đang phân tích ngữ nghĩa cho Job: ${job.id}...`);
    const spec = await mapQuoteToVideoProps(job, llmCaller);
    mappedSpecs.push(spec);
  }

  const mappedSpecsPath = path.resolve(outputRoot, 'mapped-specs.json');
  fs.writeFileSync(mappedSpecsPath, JSON.stringify(mappedSpecs, null, 2), 'utf-8');
  console.log(`Đã lưu cấu hình ánh xạ tại: ${mappedSpecsPath}`);

  if (mapOnly) {
    console.log('Hoàn tất chế độ --map-only. Dừng trước khi render video.');
    return;
  }

  console.log('[2/3] Đang đóng gói Remotion Bundle...');
  const bundleLocation = await bundle({
    entryPoint: path.resolve(projectRoot, 'src/index.ts'),
  });

  for (const spec of mappedSpecs) {
    const jobOutDir = path.resolve(outputRoot, spec.id);
    fs.mkdirSync(jobOutDir, { recursive: true });

    const syncInfo = computeTimelineSync(spec);
    const foley = synthesizeCupFoleyAudio(spec, syncInfo);
    const foleyFileName = getFoleyMasterFileName(spec.id);
    const wavBuf = Buffer.from(foley.wavBytes);

    fs.mkdirSync(publicAudioDir, { recursive: true });
    fs.writeFileSync(path.resolve(publicAudioDir, foleyFileName), wavBuf);
    const bundleAudioDir = path.resolve(bundleLocation, 'public/audio');
    fs.mkdirSync(bundleAudioDir, { recursive: true });
    fs.writeFileSync(path.resolve(bundleAudioDir, foleyFileName), wavBuf);

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'MinimalQuoteVideo',
      inputProps: spec,
    });

    const cupBaseName = formatCupBaseFileName(spec.id, spec.title);
    const videoFileName = `${cupBaseName}.mp4`;

    const videoOutPath = path.resolve(jobOutDir, videoFileName);
    const metaOutPath = path.resolve(jobOutDir, 'metadata.json');

    console.log(
      `[3/3] Đang render [${cupBaseName}] | Pivot: "${spec.pivotWord}" (Frame ${syncInfo.pivotFrame}/${syncInfo.durationInFrames})...`
    );

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      imageFormat: 'png',
      pixelFormat: 'yuv420p',
      videoBitrate: '10M',
      encodingMaxRate: '12M',
      encodingBufferSize: '20M',
      colorSpace: 'bt709',
      audioCodec: 'aac',
      audioBitrate: '192k',
      sampleRate: 48000,
      enforceAudioTrack: true,
      outputLocation: videoOutPath,
      inputProps: spec,
    });

    fs.copyFileSync(videoOutPath, path.resolve(videosExportDir, videoFileName));

    const captionText = resolveCupCaption(spec.id, spec);

    const metadata = {
      id: spec.id,
      cupBaseName,
      title: spec.title,
      textFormat: spec.textFormat,
      captionText,
      pivotWord: spec.pivotWord,
      pivotFrame: syncInfo.pivotFrame,
      durationSeconds: Number((syncInfo.durationInFrames / syncInfo.fps).toFixed(2)),
      archetype: spec.motion.archetype,
      themeId: spec.themeId,
      foleyMasterWav: foleyFileName,
      videoFile: videoFileName,
    };
    fs.writeFileSync(metaOutPath, JSON.stringify(metadata, null, 2), 'utf-8');
    console.log(`✔ Hoàn tất: ${videoOutPath}`);
  }
}

runBatchPipeline().catch((err) => {
  console.error('Lỗi trong quá trình chạy Batch Render:', err);
  process.exit(1);
});
