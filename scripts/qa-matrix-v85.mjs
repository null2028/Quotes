import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { selectComposition, renderMedia } from '@remotion/renderer';
import { VideoInputSchema } from '../src/schemas/videoSchema.ts';
import { isDarkThemePalette, LAYOUT_TOKENS } from '../src/theme/palettes.ts';
import {
  auditVietnameseSyllables,
  computeTimelineSync,
} from '../src/engine/timelineSync.ts';
import {
  getAudioMasterFileName,
  synthesizeCupAudioByMode,
} from '../src/engine/foleyEngine.ts';
import { validateAndNormalizeVideoProps } from '../src/automation/validator.ts';
import { StageScriptSchema } from '../src/stage/stageScriptSchema.ts';
import {
  resolveLayoutGeometry,
  resolveVisualDNA,
} from '../src/engine/visualDnaResolver.ts';
import { resolveStageScript } from '../src/stage/stageScriptRegistry.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'qa-artifacts-ci/matrix');
const STAGE_SCRIPTS_PATH = path.resolve(ROOT, 'data/stage-scripts.json');
const CUSTOM_PROPS_PATH = path.resolve(ROOT, 'data/custom-props.json');
const PUBLIC_AUDIO_DIR = path.resolve(ROOT, 'public/audio');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_AUDIO_DIR, { recursive: true });

function resolveRemotionFfmpegBins() {
  const compositorDir = path.resolve(
    ROOT,
    `node_modules/@remotion/compositor-${process.platform}-${process.arch}`
  );
  const bundledFfmpeg = path.resolve(compositorDir, 'ffmpeg');
  const bundledFfprobe = path.resolve(compositorDir, 'ffprobe');
  const hasBundled =
    fs.existsSync(bundledFfmpeg) && fs.existsSync(bundledFfprobe);
  const env = { ...process.env };
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

const BINS = resolveRemotionFfmpegBins();

function checkFfmpegNoiseSupport() {
  const res = spawnSync(BINS.ffmpegBin, ['-hide_banner', '-h', 'filter=noise'], {
    env: BINS.env,
    encoding: 'utf8',
  });
  const combined = `${res.stdout || ''}\n${res.stderr || ''}`;
  return res.status === 0 && !/Unknown filter/i.test(combined);
}

function appendVideoFilterSafe(args, filterExpr) {
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

function checkFaststart(filePath) {
  const fd = fs.openSync(filePath, 'r');
  const stat = fs.fstatSync(fd);
  const buf = Buffer.alloc(16);
  const atoms = [];
  let offset = 0;
  try {
    while (offset + 8 <= stat.size) {
      fs.readSync(fd, buf, 0, 16, offset);
      let size = buf.readUInt32BE(0);
      const type = buf.toString('ascii', 4, 8);
      if (size === 1) size = Number(buf.readBigUInt64BE(8));
      else if (size === 0) size = stat.size - offset;
      atoms.push({ type, offset });
      if (size < 8) break;
      offset += size;
    }
  } finally {
    fs.closeSync(fd);
  }
  const moov = atoms.find((a) => a.type === 'moov');
  const mdat = atoms.find((a) => a.type === 'mdat');
  return {
    atoms: atoms.map((a) => `${a.type}@${a.offset}`),
    faststart: Boolean(moov && mdat && moov.offset < mdat.offset),
  };
}

function extractRawRgb(videoPath, frameIdx) {
  const res = spawnSync(
    BINS.ffmpegBin,
    [
      '-v',
      'error',
      '-i',
      videoPath,
      '-vf',
      `trim=start_frame=${frameIdx}:end_frame=${frameIdx + 1}`,
      '-frames:v',
      '1',
      '-c:v',
      'rawvideo',
      '-pix_fmt',
      'rgb24',
      '-f',
      'image2pipe',
      'pipe:1',
    ],
    { env: BINS.env, maxBuffer: 16 * 1024 * 1024 }
  );
  return res.stdout;
}

function extractDecodedPcmS16(videoPath) {
  const res = spawnSync(
    BINS.ffmpegBin,
    [
      '-v',
      'error',
      '-i',
      videoPath,
      '-vn',
      '-ac',
      '2',
      '-ar',
      '48000',
      '-c:a',
      'pcm_s16le',
      '-f',
      'wav',
      'pipe:1',
    ],
    { env: BINS.env, maxBuffer: 64 * 1024 * 1024 }
  );
  const buf = res.stdout || Buffer.alloc(0);
  if (buf.length <= 44) return Buffer.alloc(0);
  const dataIdx = buf.indexOf('data');
  return dataIdx !== -1 ? buf.subarray(dataIdx + 8) : buf.subarray(44);
}

function lumaAt(buf, width, x, y) {
  const cx = Math.max(0, Math.min(width - 1, x));
  const cy = Math.max(0, Math.min(1919, y));
  const i = (cy * width + cx) * 3;
  return 0.2126 * buf[i] + 0.7152 * buf[i + 1] + 0.0722 * buf[i + 2];
}

function computeRgbSsim(bufA, bufB, width = 1080, height = 1920) {
  if (!bufA?.length || !bufB?.length || bufA.length !== bufB.length) return null;
  const block = 12;
  const c1 = 6.5025;
  const c2 = 58.5225;
  let sumSsim = 0;
  let count = 0;
  for (let by = 0; by + block <= height; by += block) {
    for (let bx = 0; bx + block <= width; bx += block) {
      let sumA = 0;
      let sumB = 0;
      const n = block * block;
      for (let dy = 0; dy < block; dy++) {
        const row = (by + dy) * width;
        for (let dx = 0; dx < block; dx++) {
          const i = (row + bx + dx) * 3;
          sumA += 0.2126 * bufA[i] + 0.7152 * bufA[i + 1] + 0.0722 * bufA[i + 2];
          sumB += 0.2126 * bufB[i] + 0.7152 * bufB[i + 1] + 0.0722 * bufB[i + 2];
        }
      }
      const muA = sumA / n;
      const muB = sumB / n;
      let varA = 0;
      let varB = 0;
      let cov = 0;
      for (let dy = 0; dy < block; dy++) {
        const row = (by + dy) * width;
        for (let dx = 0; dx < block; dx++) {
          const i = (row + bx + dx) * 3;
          const la =
            0.2126 * bufA[i] + 0.7152 * bufA[i + 1] + 0.0722 * bufA[i + 2] - muA;
          const lb =
            0.2126 * bufB[i] + 0.7152 * bufB[i + 1] + 0.0722 * bufB[i + 2] - muB;
          varA += la * la;
          varB += lb * lb;
          cov += la * lb;
        }
      }
      varA /= n - 1;
      varB /= n - 1;
      cov /= n - 1;
      const num = (2 * muA * muB + c1) * (2 * cov + c2);
      const den = (muA * muA + muB * muB + c1) * (varA + varB + c2);
      sumSsim += num / den;
      count++;
    }
  }
  return count > 0 ? Number((sumSsim / count).toFixed(4)) : null;
}

function diffRgb(bufA, bufB) {
  if (!bufA?.length || !bufB?.length || bufA.length !== bufB.length) return null;
  let sumAbs = 0;
  let changed = 0;
  for (let i = 0; i < bufA.length; i += 3) {
    const d =
      Math.abs(bufA[i] - bufB[i]) +
      Math.abs(bufA[i + 1] - bufB[i + 1]) +
      Math.abs(bufA[i + 2] - bufB[i + 2]);
    sumAbs += d;
    if (d > 6) changed++;
  }
  return {
    mae: Number((sumAbs / bufA.length).toFixed(4)),
    changedPixels: changed,
  };
}

function measureInkBounds(rgbBuf, yMinScan = 0, yMaxScan = 1920) {
  const w = 1080;
  let minX = w;
  let maxX = 0;
  let minY = 1920;
  let maxY = 0;
  let inkPixels = 0;
  for (let y = yMinScan; y < yMaxScan; y += 2) {
    // Lấy tham chiếu nền cục bộ theo đúng hàng y ở mép ngoài x = 36 nhằm triệt tiêu vignette/gobo
    const refIdx = (y * w + 36) * 3;
    const bgR = rgbBuf[refIdx];
    const bgG = rgbBuf[refIdx + 1];
    const bgB = rgbBuf[refIdx + 2];
    for (let x = 0; x < w; x += 2) {
      const idx = (y * w + x) * 3;
      const dist =
        Math.abs(rgbBuf[idx] - bgR) +
        Math.abs(rgbBuf[idx + 1] - bgG) +
        Math.abs(rgbBuf[idx + 2] - bgB);
      if (dist > 125) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        inkPixels++;
      }
    }
  }
  return inkPixels === 0
    ? { inkPixels: 0 }
    : { inkPixels, minX, maxX, minY, maxY };
}

function bandLumaAt(rgbBuf, width, x, y, tx, ty) {
  let sum = 0;
  for (let u = -8; u <= 8; u++) {
    sum += lumaAt(rgbBuf, width, x + u * tx, y + u * ty);
  }
  return sum / 17;
}

function measureStageBoundarySeam(rgbBuf, geo) {
  const w = 1080;
  const xL = geo.stageLeft;
  const xR = geo.stageLeft + geo.stageWidth;
  const yT = geo.stageTop;
  const yB = geo.stageTop + geo.stageHeight;
  const rawDiffs = [];
  const bandNetDiffs = [];
  const signedSteps = [];

  const pushSample = (x, y, nx, ny, tx, ty) => {
    rawDiffs.push(
      Math.abs(lumaAt(rgbBuf, w, x - 3 * nx, y - 3 * ny) - lumaAt(rgbBuf, w, x + 3 * nx, y + 3 * ny))
    );
    const lM6 = bandLumaAt(rgbBuf, w, x - 6 * nx, y - 6 * ny, tx, ty);
    const lM2 = bandLumaAt(rgbBuf, w, x - 2 * nx, y - 2 * ny, tx, ty);
    const lP2 = bandLumaAt(rgbBuf, w, x + 2 * nx, y + 2 * ny, tx, ty);
    const lP6 = bandLumaAt(rgbBuf, w, x + 6 * nx, y + 6 * ny, tx, ty);
    const sOuter = lM2 - lM6;
    const sInner = lP6 - lP2;
    if (Math.max(Math.abs(sOuter), Math.abs(sInner)) > 3.5) {
      return;
    }
    const step = (lP2 - lM2) - 0.5 * (sOuter + sInner);
    bandNetDiffs.push(Math.abs(step));
    signedSteps.push(step);
  };

  for (let x = xL + 12; x <= xR - 12; x += 4) {
    pushSample(x, yT, 0, 1, 1, 0);
    pushSample(x, yB, 0, -1, 1, 0);
  }
  for (let y = yT + 12; y <= yB - 12; y += 4) {
    pushSample(xL, y, 1, 0, 0, 1);
    pushSample(xR, y, -1, 0, 0, 1);
  }

  rawDiffs.sort((a, b) => a - b);
  bandNetDiffs.sort((a, b) => a - b);
  const medianRaw = rawDiffs[Math.floor(rawDiffs.length * 0.5)] ?? 0;
  const p95Raw = rawDiffs[Math.floor(rawDiffs.length * 0.95)] ?? 0;
  const meanRaw = rawDiffs.reduce((a, b) => a + b, 0) / Math.max(1, rawDiffs.length);
  const medianBandNet = bandNetDiffs[Math.floor(bandNetDiffs.length * 0.5)] ?? 0;
  const p95BandNet = bandNetDiffs[Math.floor(bandNetDiffs.length * 0.95)] ?? 0;
  const meanBandNet =
    bandNetDiffs.reduce((a, b) => a + b, 0) / Math.max(1, bandNetDiffs.length);
  const coherentStep = Math.abs(
    signedSteps.reduce((a, b) => a + b, 0) / Math.max(1, signedSteps.length)
  );
  return {
    sampleCount: rawDiffs.length,
    bgSampleCount: bandNetDiffs.length,
    medianAbsDeltaLuma: Number(medianRaw.toFixed(3)),
    meanAbsDeltaLuma: Number(meanRaw.toFixed(3)),
    p95AbsDeltaLuma: Number(p95Raw.toFixed(3)),
    medianNetSeamLuma: Number(medianBandNet.toFixed(3)),
    meanNetSeamLuma: Number(meanBandNet.toFixed(3)),
    p95NetSeamLuma: Number(p95BandNet.toFixed(3)),
    coherentBoxStepLuma: Number(coherentStep.toFixed(3)),
    seamPass: meanBandNet < 1.0 && p95BandNet < 2.0 && coherentStep < 0.5,
  };
}

function analyzePcmTelemetry(pcmBuf, pivotFrame, fps = 60, isSilent = false) {
  const totalSamples = Math.floor(pcmBuf.length / 4);
  const sr = 48000;
  const preStart = Math.min(totalSamples, Math.round(0.2 * sr));
  const preEnd = Math.min(
    totalSamples,
    Math.max(preStart + 100, Math.round(((pivotFrame - 6) / fps) * sr))
  );

  let preSumSq = 0;
  let preCnt = 0;
  for (let i = preStart; i < preEnd; i++) {
    const l = pcmBuf.readInt16LE(i * 4) / 32768;
    const r = pcmBuf.readInt16LE(i * 4 + 2) / 32768;
    preSumSq += (l * l + r * r) * 0.5;
    preCnt++;
  }
  const preRms = preCnt > 0 ? Math.sqrt(preSumSq / preCnt) : 0;
  const preFloorDbfs =
    preRms > 1e-7 ? Number((20 * Math.log10(preRms)).toFixed(2)) : -140;

  let maxAbs = 0;
  let maxSampleIdx = 0;
  for (let i = 0; i < totalSamples; i++) {
    const l = Math.abs(pcmBuf.readInt16LE(i * 4) / 32768);
    const r = Math.abs(pcmBuf.readInt16LE(i * 4 + 2) / 32768);
    const v = Math.max(l, r);
    if (v > maxAbs) {
      maxAbs = v;
      maxSampleIdx = i;
    }
  }

  let onsetDeltaMs = null;
  if (!isSilent && maxAbs > 0.02) {
    const expectedPivotSample = Math.round((pivotFrame / fps) * sr);
    const searchStart = Math.max(0, expectedPivotSample - Math.round(0.2 * sr));
    const searchEnd = Math.min(
      totalSamples,
      expectedPivotSample + Math.round(0.5 * sr)
    );
    const thresh = Math.max(0.015, preRms * 5);
    for (let i = searchStart; i < searchEnd; i++) {
      const l = Math.abs(pcmBuf.readInt16LE(i * 4) / 32768);
      const r = Math.abs(pcmBuf.readInt16LE(i * 4 + 2) / 32768);
      if (Math.max(l, r) >= thresh) {
        onsetDeltaMs = Number((((i - expectedPivotSample) / sr) * 1000).toFixed(2));
        break;
      }
    }
  }

  const maxPeakDeltaMs = !isSilent
    ? Number(
        (
          ((maxSampleIdx - Math.round((pivotFrame / fps) * sr)) / sr) *
          1000
        ).toFixed(2)
      )
    : null;

  return {
    prePivotFloorDbfs: preFloorDbfs,
    pcmPeakLinear: Number(maxAbs.toFixed(4)),
    pivotOnsetDeltaMs: onsetDeltaMs,
    maxPeakOffsetMs: maxPeakDeltaMs,
  };
}

const MATRIX_CASES = [
  {
    caseKey: 'CASE_A',
    label: 'MINIMAL_LIGHT + CLASSIC_TOP_STAGE + SOLID_SCENE',
    props: {
      id: 'synth-a-11',
      cupNumber: '91',
      textFormat: 'POEM',
      title: 'Ngóng trưa',
      author: '',
      fontSizeScale: 1.0,
      segments: [
        'Sáng quẹt chiếc thẻ lên lầu,',
        'Bật máy một lát đã mong…',
        'trưa về.',
      ],
      pivotWord: 'trưa về',
      highlightStyle: 'BOTH',
      durationMode: 'AUTO_SEED',
      targetDurationSeconds: 15,
      typingSpeedMsPerChar: 55,
      holdAfterFinishSeconds: 5.5,
      themeId: 'MINIMAL_LIGHT',
      visualDNA: {
        mode: 'CUSTOM',
        layout: 'CLASSIC_TOP_STAGE',
        lightingGobo: 'FOLIAGE_DAPPLE',
        shotMode: 'SOLID_SCENE',
        pivotMechanic: 'ACCENT_PUSH_IN',
        horizonOffsetPx: -6,
        forceSolidStyle: true,
      },
      motion: {
        sceneId: 'SCRIPT_CHAM_CONG_NGONG_TRUA',
        archetype: 'SCRIPT_CHAM_CONG_NGONG_TRUA',
        pacingMode: 'WRY_BATHOS',
        stateA: { intensity: 0.78, spread: 0.25, tiltDeg: -10 },
        stateB: { intensity: 0.15, spread: 0.75, tiltDeg: 0 },
      },
      bgm: { audioMode: 'PIVOT_ACCENT', foleyPivotStyle: 'WOOD_SEAL' },
      brandText: 'TRÀ NGUỘI',
    },
  },
  {
    caseKey: 'CASE_B',
    label: 'WARM_NOIR + SKY_QUOTE_BOTTOM_STAGE + 2 Actors',
    props: {
      id: 'synth-b-04',
      cupNumber: '92',
      textFormat: 'POEM',
      title: 'Ký ức',
      author: '',
      fontSizeScale: 1.0,
      segments: [
        'Tưởng rằng năm tháng đã xa,',
        'Chợt nghe câu hát chiều qua phố người.',
        'Chuyện xưa chẳng nói một lời,',
        'Mà bên ghế trống… vẫn ngồi đợi ta.',
      ],
      pivotWord: 'vẫn ngồi đợi ta',
      highlightStyle: 'BOTH',
      durationMode: 'AUTO_SEED',
      targetDurationSeconds: 15,
      typingSpeedMsPerChar: 55,
      holdAfterFinishSeconds: 5.5,
      themeId: 'WARM_NOIR',
      visualDNA: {
        mode: 'CUSTOM',
        layout: 'SKY_QUOTE_BOTTOM_STAGE',
        lightingGobo: 'WINDOW_SLATS',
        shotMode: 'SOLID_SCENE',
        pivotMechanic: 'PARALLAX_DRIFT',
        horizonOffsetPx: 10,
        forceSolidStyle: true,
      },
      motion: {
        sceneId: 'SCRIPT_NGUOI_LU_HANH_VA_KY_UC',
        archetype: 'SCRIPT_NGUOI_LU_HANH_VA_KY_UC',
        pacingMode: 'CONTEMPLATIVE',
        stateA: { intensity: 0.8, spread: 0.2, tiltDeg: -14 },
        stateB: { intensity: 0.1, spread: 0.78, tiltDeg: 0 },
      },
      bgm: { audioMode: 'PIVOT_ACCENT', foleyPivotStyle: 'TEA_CUP' },
      brandText: 'TRÀ NGUỘI',
    },
  },
  {
    caseKey: 'CASE_C',
    label: 'DARK_CONTEMPLATIVE + ASYMMETRIC_THIRD + MACRO_PROP',
    props: {
      id: 'synth-c-01',
      cupNumber: '93',
      textFormat: 'POEM',
      title: 'Chén trà đôi',
      author: '',
      fontSizeScale: 1.0,
      segments: [
        'Đêm khuya pha một ấm trà thơm dịu,',
        'Ghế đá hai chén bỗng ấm…',
        'hương người thương.',
      ],
      pivotWord: 'hương người thương',
      highlightStyle: 'BOTH',
      durationMode: 'AUTO_SEED',
      targetDurationSeconds: 15,
      typingSpeedMsPerChar: 55,
      holdAfterFinishSeconds: 5.5,
      themeId: 'DARK_CONTEMPLATIVE',
      visualDNA: {
        mode: 'CUSTOM',
        layout: 'ASYMMETRIC_THIRD',
        lightingGobo: 'WARM_LANTERN',
        shotMode: 'MACRO_PROP',
        pivotMechanic: 'SPOTLIGHT_DIM',
        horizonOffsetPx: 0,
        forceSolidStyle: true,
      },
      motion: {
        sceneId: 'SCRIPT_GHE_DA_DOI_CHEN_TRA_DO',
        archetype: 'SCRIPT_GHE_DA_DOI_CHEN_TRA_DO',
        pacingMode: 'CONTEMPLATIVE',
        stateA: { intensity: 0.75, spread: 0.25, tiltDeg: -10 },
        stateB: { intensity: 0.12, spread: 0.75, tiltDeg: 0 },
      },
      bgm: { audioMode: 'PIVOT_ACCENT', foleyPivotStyle: 'TEA_CUP' },
      brandText: 'TRÀ NGUỘI',
    },
  },
  {
    caseKey: 'CASE_D',
    label: 'SLATE_CALM + WINDOW_FRAME + BRUSH_DRAW',
    props: {
      id: 'synth-d-08',
      cupNumber: '94',
      textFormat: 'POEM',
      title: 'Bên nước',
      author: '',
      fontSizeScale: 1.0,
      segments: [
        'Người đi về phía bến sông chiều vắng lặng,',
        'Để lại trên sóng ánh trăng soi mờ tỏ,',
        'Chén rượu chưa cạn đã trôi xa bờ bến…',
        'tiếc hoài một câu chờ.',
      ],
      pivotWord: 'một câu chờ',
      highlightStyle: 'BOTH',
      durationMode: 'AUTO_SEED',
      targetDurationSeconds: 15,
      typingSpeedMsPerChar: 55,
      holdAfterFinishSeconds: 5.5,
      themeId: 'SLATE_CALM',
      visualDNA: {
        mode: 'CUSTOM',
        layout: 'WINDOW_FRAME',
        lightingGobo: 'PORCH_MIST',
        shotMode: 'BRUSH_DRAW',
        pivotMechanic: 'PULLBACK_REVEAL',
        horizonOffsetPx: 8,
        forceSolidStyle: true,
      },
      motion: {
        sceneId: 'SCRIPT_BEN_NUOC_CHEN_SAY_TROI_XA',
        archetype: 'SCRIPT_BEN_NUOC_CHEN_SAY_TROI_XA',
        pacingMode: 'CONTEMPLATIVE',
        stateA: { intensity: 0.8, spread: 0.2, tiltDeg: -14 },
        stateB: { intensity: 0.12, spread: 0.75, tiltDeg: 0 },
      },
      bgm: { audioMode: 'FOLEY_MASTER', foleyPivotStyle: 'WIND_CHIME' },
      brandText: 'TRÀ NGUỘI',
    },
  },
];

const ANALYZE_ONLY = process.argv.includes('--analyze-only');

async function runMatrix() {
  const prevReportPath = path.join(ROOT, 'qa-artifacts-ci/qa-matrix-v85.json');
  const prevReport =
    ANALYZE_ONLY && fs.existsSync(prevReportPath)
      ? JSON.parse(fs.readFileSync(prevReportPath, 'utf8'))
      : null;
  const prevRenderSecByCase = new Map(
    (prevReport?.cases || []).map((c) => [c.caseKey, c.renderSec])
  );

  const scriptsMap = JSON.parse(fs.readFileSync(STAGE_SCRIPTS_PATH, 'utf8'));
  const customPropsMap = JSON.parse(fs.readFileSync(CUSTOM_PROPS_PATH, 'utf8'));
  const supportsNoiseFilter = checkFfmpegNoiseSupport();

  const allOutputsExist = MATRIX_CASES.every((item) =>
    fs.existsSync(path.join(OUT_DIR, `${item.caseKey.toLowerCase()}.mp4`))
  );
  const skipAllRender = ANALYZE_ONLY && allOutputsExist;

  let serveUrl = null;
  let bundleSec = prevReport?.bundleSec ?? 0;
  if (!skipAllRender) {
    console.log('=== [MAT-V85] Đang bundle Remotion Composition dùng chung cho 4 Case ===');
    const bundleStart = Date.now();
    serveUrl = await bundle({
      entryPoint: path.resolve(ROOT, 'src/index.ts'),
    });
    bundleSec = Number(((Date.now() - bundleStart) / 1000).toFixed(2));
  } else {
    console.log('=== [MAT-V85] Chế độ --analyze-only: đo lại Telemetry trên 4 MP4 đã kết xuất ===');
  }
  const createdTempAudioFiles = [];
  const results = [];

  try {
    for (const item of MATRIX_CASES) {
      const { caseKey, label, props: rawInput } = item;
      const outPath = path.join(OUT_DIR, `${caseKey.toLowerCase()}.mp4`);
      const needRenderCase = !ANALYZE_ONLY || !fs.existsSync(outPath);
      console.log(
        `\n▶ Đang ${needRenderCase ? 'render & đo Telemetry' : 'đo lại Telemetry'} ${caseKey}: ${label}`
      );
      const parsed = VideoInputSchema.parse(rawInput);
      const sceneId = parsed.motion.sceneId || parsed.motion.archetype;
      const diskScript = scriptsMap[sceneId];
      const hydrated = diskScript
        ? {
            ...parsed,
            motion: {
              ...parsed.motion,
              stageScript: {
                ...StageScriptSchema.parse(diskScript),
                sceneId,
                customPropsResolved: { ...customPropsMap },
              },
            },
          }
        : parsed;

      const normalized = validateAndNormalizeVideoProps(hydrated);
      const sync = computeTimelineSync(normalized, 60);
      const syllables = auditVietnameseSyllables(normalized.segments);
      const resolvedScript = resolveStageScript(
        sceneId,
        normalized.motion.stageScript
      );
      const dna = resolveVisualDNA(normalized, resolvedScript);
      const geo = resolveLayoutGeometry(dna.layout, dna.brushOrientation);

      const audioResult = synthesizeCupAudioByMode(normalized, sync);
      const isDarkTheme = isDarkThemePalette(normalized.themeId);
      const targetCrf = isDarkTheme ? 20 : 19;
      let renderSec = Number(prevRenderSecByCase.get(caseKey) ?? 0);

      if (needRenderCase) {
        if (!serveUrl) {
          const bundleStart = Date.now();
          serveUrl = await bundle({
            entryPoint: path.resolve(ROOT, 'src/index.ts'),
          });
          bundleSec = Number(((Date.now() - bundleStart) / 1000).toFixed(2));
        }
        const audioFileName = getAudioMasterFileName(
          normalized.id,
          audioResult.audioMode
        );
        const wavBuf = Buffer.from(audioResult.wavBytes);
        const pubAudioPath = path.resolve(PUBLIC_AUDIO_DIR, audioFileName);
        const bunAudioDir = path.resolve(serveUrl, 'public/audio');
        fs.mkdirSync(bunAudioDir, { recursive: true });
        fs.writeFileSync(pubAudioPath, wavBuf);
        fs.writeFileSync(path.resolve(bunAudioDir, audioFileName), wavBuf);
        createdTempAudioFiles.push(pubAudioPath);

        const rawPath = path.join(OUT_DIR, `.${caseKey.toLowerCase()}-raw.mp4`);
        if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

        const composition = await selectComposition({
          serveUrl,
          id: 'MinimalQuoteVideo',
          inputProps: normalized,
        });

        const t0 = Date.now();
        await renderMedia({
          composition,
          serveUrl,
          codec: 'h264',
          imageFormat: 'png',
          pixelFormat: 'yuv420p',
          crf: targetCrf,
          encodingMaxRate: '5M',
          encodingBufferSize: '10M',
          x264Preset: 'medium',
          gopSize: composition.fps,
          colorSpace: 'bt709',
          audioCodec: 'aac',
          audioBitrate: audioResult.audioMode === 'TIKTOK_SILENT' ? '96k' : '128k',
          sampleRate: 48000,
          enforceAudioTrack: true,
          ffmpegOverride: ({ args }) => {
            const encIdx = args.indexOf('libx264');
            if (encIdx === -1) return args;
            const next = [...args];
            const extra = [];
            if (!next.includes('-profile:v')) extra.push('-profile:v', 'high');
            if (!next.includes('-level:v') && !next.includes('-level')) {
              extra.push('-level:v', '4.2');
            }
            if (!next.includes('-aq-mode')) {
              extra.push('-aq-mode', '3', '-aq-strength', '1.08');
            }
            if (extra.length > 0) next.splice(encIdx + 1, 0, ...extra);
            if (supportsNoiseFilter) {
              appendVideoFilterSafe(
                next,
                isDarkTheme ? 'noise=c0s=3:c0f=t+u' : 'noise=c0s=1.5:c0f=t+u'
              );
            }
            return next;
          },
          outputLocation: rawPath,
          inputProps: normalized,
        });

        const remuxRes = spawnSync(
          BINS.ffmpegBin,
          [
            '-y',
            '-v',
            'error',
            '-i',
            rawPath,
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
            `creation_time=${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}`,
            outPath,
          ],
          { env: BINS.env, encoding: 'utf8' }
        );
        if (remuxRes.status === 0 && fs.existsSync(outPath)) {
          fs.unlinkSync(rawPath);
        } else {
          fs.renameSync(rawPath, outPath);
        }
        renderSec = Number(((Date.now() - t0) / 1000).toFixed(2));
      }

      // Trích Ảnh bìa Cover 3:4 & Frame Pivot để lưu bằng chứng kiểm chứng
      const coverPngPath = path.join(OUT_DIR, `${caseKey.toLowerCase()}-cover.png`);
      const pivotPngPath = path.join(OUT_DIR, `${caseKey.toLowerCase()}-pivot.png`);
      spawnSync(
        BINS.ffmpegBin,
        [
          '-y',
          '-v',
          'error',
          '-i',
          outPath,
          '-vf',
          `trim=start_frame=${sync.recommendedCoverFrame}:end_frame=${sync.recommendedCoverFrame + 1}`,
          '-frames:v',
          '1',
          coverPngPath,
        ],
        { env: BINS.env }
      );
      spawnSync(
        BINS.ffmpegBin,
        [
          '-y',
          '-v',
          'error',
          '-i',
          outPath,
          '-vf',
          `trim=start_frame=${sync.pivotFrame}:end_frame=${sync.pivotFrame + 1}`,
          '-frames:v',
          '1',
          pivotPngPath,
        ],
        { env: BINS.env }
      );

      // Đo ffprobe & tìm chuỗi Lavf
      const pr = spawnSync(
        BINS.ffprobeBin,
        ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', outPath],
        { env: BINS.env, encoding: 'utf8' }
      );
      const rawFfprobeJson = pr.stdout || '{}';
      const lavfMatches = rawFfprobeJson.match(/lavf/gi) || [];
      const info = JSON.parse(rawFfprobeJson);
      const v = (info.streams || []).find((s) => s.codec_type === 'video') || {};
      const fmt = info.format || {};
      const faststartInfo = checkFaststart(outPath);
      const fileSizeMb = Number(
        (fs.statSync(outPath).size / (1024 * 1024)).toFixed(2)
      );
      const avgBitrateMbps = Number(
        (Number(v.bit_rate || fmt.bit_rate || 0) / 1_000_000).toFixed(2)
      );

      // Đo Pixel Frame 0, Cover, Pivot, HoldEnd, LastFrame
      const totalF = Number(v.nb_frames || sync.durationInFrames);
      const lastF = totalF - 1;
      const holdEndF = Math.max(sync.pivotFrame + 60, totalF - 48);
      const rgb0 = extractRawRgb(outPath, 0);
      const rgb84 = extractRawRgb(outPath, 84);
      const rgbCover = extractRawRgb(outPath, sync.recommendedCoverFrame);
      const rgbPivot = extractRawRgb(outPath, sync.pivotFrame);
      const rgbHoldEnd = extractRawRgb(outPath, holdEndF);
      const rgbEnd = extractRawRgb(outPath, lastF);

      const loopDiff = diffRgb(rgbEnd, rgb0);
      const loopSsim = computeRgbSsim(rgbEnd, rgb0);
      const typoAt0 = measureInkBounds(rgb0, geo.typographyTop, geo.typographyMaxBottom);
      const typoAt84 = measureInkBounds(rgb84, geo.typographyTop, geo.typographyMaxBottom);
      const typoAtCover = measureInkBounds(
        rgbCover,
        geo.typographyTop,
        geo.typographyMaxBottom
      );
      const typoAtHoldEnd = measureInkBounds(
        rgbHoldEnd,
        geo.typographyTop,
        geo.typographyMaxBottom
      );
      const headerAt0 = measureInkBounds(rgb0, 260, 325);
      const headerAtCover = measureInkBounds(rgbCover, 260, 325);
      const headerAtPivot = measureInkBounds(rgbPivot, 260, 325);
      const fullBoundsAtHold = measureInkBounds(rgbHoldEnd, 240, 1680);
      const seamAtPivot = measureStageBoundarySeam(rgbPivot, geo);
      const seamAt0 = measureStageBoundarySeam(rgb0, geo);

      // Đo Audio: loudnorm + PCM pre-pivot floor & pivot timing
      const ln = spawnSync(
        BINS.ffmpegBin,
        [
          '-hide_banner',
          '-i',
          outPath,
          '-vn',
          '-af',
          'loudnorm=print_format=json',
          '-c:a',
          'pcm_s16le',
          '-f',
          'null',
          '-',
        ],
        { env: BINS.env, encoding: 'utf8' }
      );
      const lnMatch = (ln.stderr || '').match(/\{[\s\S]*"input_i"[\s\S]*?\}/);
      const lnData = lnMatch ? JSON.parse(lnMatch[0]) : {};
      const pcmBuf = extractDecodedPcmS16(outPath);
      const pcmMetrics = analyzePcmTelemetry(
        pcmBuf,
        sync.pivotFrame,
        60,
        audioResult.audioMode === 'TIKTOK_SILENT'
      );

      results.push({
        caseKey,
        label,
        renderSec,
        config: {
          themeId: normalized.themeId,
          layout: dna.layout,
          lightingGobo: dna.lightingGobo,
          shotMode: dna.shotMode,
          pivotMechanic: dna.pivotMechanic,
          sceneId,
          actorCount: dna.actorCount,
          actorSpanX: dna.actorSpanX,
          syllables: syllables.count,
          audioMode: audioResult.audioMode,
          crf: targetCrf,
          vignetteCenter: dna.vignetteCenter,
        },
        ffprobe: {
          nbFrames: Number(v.nb_frames || 0),
          expectedFrames: sync.durationInFrames,
          durationSec: Number(Number(fmt.duration || 0).toFixed(3)),
          resolution: `${v.width}x${v.height}`,
          fps: v.r_frame_rate,
          colorFlags: `${v.color_primaries}/${v.color_transfer}/${v.color_space}`,
          fileSizeMb,
          avgBitrateMbps,
          faststart: faststartInfo.faststart,
          lavfMatches: lavfMatches.length,
          formatTags: fmt.tags || {},
        },
        frame0AndLoop: {
          headerInkAt0: headerAt0.inkPixels,
          typoInkAt0: typoAt0.inkPixels,
          typoInkAt84: typoAt84.inkPixels,
          typoInkAtEnd: measureInkBounds(rgbEnd, geo.typographyTop, geo.typographyMaxBottom)
            .inkPixels,
          loopMae: loopDiff?.mae ?? null,
          loopChangedPx: loopDiff?.changedPixels ?? null,
          loopSsim,
        },
        boundsAndCover: {
          recommendedCoverFrame: sync.recommendedCoverFrame,
          pivotFrame: sync.pivotFrame,
          headerInkAtCover: headerAtCover.inkPixels,
          headerInkAtPivot: headerAtPivot.inkPixels,
          typoInkAtCover: typoAtCover.inkPixels,
          typoInkAtHoldEnd: typoAtHoldEnd.inkPixels,
          quoteBoundsAtHold: typoAtHoldEnd,
          fullBoundsAtHold,
          safeZonePass:
            typoAtHoldEnd.minX >= 132 &&
            typoAtHoldEnd.maxX <= 833 &&
            typoAtHoldEnd.minY >= 180 &&
            typoAtHoldEnd.maxY <= 1540 &&
            fullBoundsAtHold.minX >= 132 &&
            fullBoundsAtHold.maxX <= 948 &&
            fullBoundsAtHold.minY >= 240 &&
            fullBoundsAtHold.maxY <= 1680,
        },
        stageSeam: {
          atPivot: seamAtPivot,
          atFrame0: seamAt0,
        },
        audio: {
          integratedLufs: Number(Number(lnData.input_i || -120).toFixed(2)),
          truePeakDbtp: Number(Number(lnData.input_tp || -120).toFixed(2)),
          ...pcmMetrics,
        },
      });
    }
  } finally {
    for (const f of createdTempAudioFiles) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  }

  // Benchmark DSP trực tiếp trên 3 chế độ Audio cho cùng Case C
  const samplePropsC = validateAndNormalizeVideoProps(
    VideoInputSchema.parse(MATRIX_CASES[2].props)
  );
  const sampleSyncC = computeTimelineSync(samplePropsC, 60);
  const audioModeBenchmarks = [];
  for (const mode of ['TIKTOK_SILENT', 'PIVOT_ACCENT', 'FOLEY_MASTER']) {
    const tStart = performance.now();
    const res = synthesizeCupAudioByMode(
      { ...samplePropsC, bgm: { audioMode: mode, foleyPivotStyle: 'WIND_CHIME' } },
      sampleSyncC
    );
    const synthMs = Number((performance.now() - tStart).toFixed(2));
    const wavPath = path.join(OUT_DIR, `bench-${mode.toLowerCase()}.wav`);
    fs.writeFileSync(wavPath, Buffer.from(res.wavBytes));
    const ln = spawnSync(
      BINS.ffmpegBin,
      [
        '-hide_banner',
        '-i',
        wavPath,
        '-af',
        'loudnorm=print_format=json',
        '-c:a',
        'pcm_s16le',
        '-f',
        'null',
        '-',
      ],
      { env: BINS.env, encoding: 'utf8' }
    );
    const lnMatch = (ln.stderr || '').match(/\{[\s\S]*"input_i"[\s\S]*?\}/);
    const lnData = lnMatch ? JSON.parse(lnMatch[0]) : {};
    const pcmData = Buffer.from(res.wavBytes.buffer, 44, res.wavBytes.byteLength - 44);
    const pcmStat = analyzePcmTelemetry(
      pcmData,
      sampleSyncC.pivotFrame,
      60,
      mode === 'TIKTOK_SILENT'
    );
    audioModeBenchmarks.push({
      mode,
      synthMs,
      wavKb: Number((res.wavBytes.byteLength / 1024).toFixed(1)),
      integratedLufs: lnData.input_i === '-inf' ? '-Inf' : Number(Number(lnData.input_i).toFixed(2)),
      truePeakDbtp: lnData.input_tp === '-inf' ? '-Inf' : Number(Number(lnData.input_tp).toFixed(2)),
      ...pcmStat,
    });
  }

  const outJsonPath = path.join(ROOT, 'qa-artifacts-ci/qa-matrix-v85.json');
  const payload = {
    timestamp: new Date().toISOString(),
    bundleSec,
    supportsNoiseFilter,
    cases: results,
    audioModeBenchmarks,
  };
  fs.writeFileSync(outJsonPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log('\n✅ Hoàn tất Ma trận 4 tổ hợp V8.5 ->', outJsonPath);
}

runMatrix().catch((err) => {
  console.error('❌ Matrix QA failed:', err);
  process.exit(1);
});
