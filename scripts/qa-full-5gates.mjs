import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'qa-artifacts-ci');
const FRAMES_DIR = path.join(OUT_DIR, 'frames');
fs.mkdirSync(FRAMES_DIR, { recursive: true });

function resolveRemotionFfmpegBins() {
  const compositorDir = path.resolve(
    ROOT,
    `node_modules/@remotion/compositor-${process.platform}-${process.arch}`
  );
  const bundledFfmpeg = path.resolve(compositorDir, 'ffmpeg');
  const bundledFfprobe = path.resolve(compositorDir, 'ffprobe');
  const hasBundled = fs.existsSync(bundledFfmpeg) && fs.existsSync(bundledFfprobe);
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

function runCmd(cmd, args, timeout = 300_000) {
  const resolvedCmd =
    cmd === 'ffmpeg' ? BINS.ffmpegBin : cmd === 'ffprobe' ? BINS.ffprobeBin : cmd;
  const res = spawnSync(resolvedCmd, args, {
    cwd: ROOT,
    env: BINS.env,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    timeout,
  });
  return {
    status: res.status ?? -1,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
  };
}

console.log('=== [BƯỚC 1 & 2/5] Chạy Gate 1 & Gate 2 ===');
runCmd('npx', ['tsx', 'scripts/qa-gates-ci.mjs', '--gate=1']);
runCmd('npx', ['tsx', 'scripts/qa-gates-ci.mjs', '--gate=2']);
const g1 = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'gate1.json'), 'utf8'));
const g2 = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'gate2.json'), 'utf8'));

console.log('=== [BƯỚC 3/5] GATE 3: Tự động Render MP4 thực tế Chén 08 & Chén 09 (V8.5 · 60fps · bt709 · CRF · Cover PNG) ===');
const renderStartMs = Date.now();
const { enqueueCupsForRender, loadCups } = await import('../server/renderQueueService.ts');
enqueueCupsForRender(['quote-008', 'quote-009']);

const deadline = Date.now() + 900_000;
while (Date.now() < deadline) {
  const current = loadCups();
  const c8 = current.find((c) => c.id === 'quote-008');
  const c9 = current.find((c) => c.id === 'quote-009');
  const done8 = c8 && (c8.status === 'completed' || c8.status === 'failed');
  const done9 = c9 && (c9.status === 'completed' || c9.status === 'failed');
  process.stdout.write(
    `\r   ⏳ Tiến độ Render: Chén 08 [${c8?.status} ${c8?.progress ?? 0}%] | Chén 09 [${c9?.status} ${c9?.progress ?? 0}%]   `
  );
  if (done8 && done9) break;
  await new Promise((r) => setTimeout(r, 2500));
}
console.log('');

const finalCups = loadCups();
const cup08 = finalCups.find((c) => c.id === 'quote-008');
const cup09 = finalCups.find((c) => c.id === 'quote-009');

function verifyExportPair(cup) {
  const basePath = path.join(ROOT, 'videos', `Chén ${cup.cupNumber} - ${cup.props.title}.mp4`);
  const seoPath = path.join(ROOT, 'videos/seo-master', cup.seoFileName || '');
  const metaPath = path.join(ROOT, 'output', cup.id, 'metadata.json');
  const baseStat = fs.existsSync(basePath) ? fs.statSync(basePath) : null;
  const seoStat = cup.seoFileName && fs.existsSync(seoPath) ? fs.statSync(seoPath) : null;
  const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : null;
  const coverFileName = meta?.coverFile || null;
  const coverOutPath = coverFileName ? path.join(ROOT, 'output', cup.id, coverFileName) : null;
  const coverSeoPath = coverFileName ? path.join(ROOT, 'videos/seo-master', coverFileName) : null;
  const coverStat = coverOutPath && fs.existsSync(coverOutPath) ? fs.statSync(coverOutPath) : null;
  const coverSeoStat = coverSeoPath && fs.existsSync(coverSeoPath) ? fs.statSync(coverSeoPath) : null;
  return {
    id: cup.id,
    status: cup.status,
    errorMessage: cup.errorMessage || null,
    baseFile: path.relative(ROOT, basePath),
    baseExists: Boolean(baseStat),
    baseFresh: Boolean(baseStat && baseStat.mtimeMs >= renderStartMs - 2000),
    baseSizeMb: baseStat ? Number((baseStat.size / (1024 * 1024)).toFixed(2)) : 0,
    seoFile: cup.seoFileName ? `videos/seo-master/${cup.seoFileName}` : null,
    seoExists: Boolean(seoStat),
    seoFresh: Boolean(seoStat && seoStat.mtimeMs >= renderStartMs - 2000),
    seoSizeMb: seoStat ? Number((seoStat.size / (1024 * 1024)).toFixed(2)) : 0,
    coverFile: coverFileName,
    coverExists: Boolean(coverStat && coverStat.size > 5000),
    coverSeoExists: Boolean(coverSeoStat && coverSeoStat.size > 5000),
    coverThumbUrl: cup.thumbUrl || null,
    seoFullPath: seoStat ? seoPath : baseStat ? basePath : null,
    metadata: meta,
  };
}

const g3 = {
  chen08: verifyExportPair(cup08),
  chen09: verifyExportPair(cup09),
};
g3.pass =
  g3.chen08.status === 'completed' &&
  g3.chen08.baseExists &&
  g3.chen08.seoExists &&
  g3.chen08.coverExists &&
  g3.chen08.coverSeoExists &&
  Boolean(g3.chen08.coverThumbUrl) &&
  g3.chen09.status === 'completed' &&
  g3.chen09.baseExists &&
  g3.chen09.seoExists &&
  g3.chen09.coverExists &&
  g3.chen09.coverSeoExists &&
  Boolean(g3.chen09.coverThumbUrl);

console.log('=== [BƯỚC 4/5] GATE 4: Đo ffprobe (1080x1920, 60fps CFR, bt709, faststart, sạch metadata) & loudnorm ===');
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

function parseLoudnormNumber(val) {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  if (/^-?inf$/i.test(str)) return -120;
  const n = Number(str);
  return Number.isFinite(n) ? n : null;
}

function probeMp4(filePath, meta) {
  if (!filePath || !fs.existsSync(filePath)) return { pass: false, missing: true };
  const fileSizeMb = Number((fs.statSync(filePath).size / (1024 * 1024)).toFixed(2));
  const pr = runCmd('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', filePath]);
  const info = pr.status === 0 ? JSON.parse(pr.stdout) : {};
  const v = (info.streams || []).find((s) => s.codec_type === 'video') || {};
  const a = (info.streams || []).find((s) => s.codec_type === 'audio') || {};
  const fmt = info.format || {};
  const atom = checkFaststart(filePath);

  const ln = runCmd('ffmpeg', [
    '-hide_banner',
    '-i',
    filePath,
    '-vn',
    '-af',
    'loudnorm=print_format=json',
    '-c:a',
    'pcm_s16le',
    '-f',
    'null',
    '-',
  ]);
  const lnJsonMatch = (ln.stderr || '').match(/\{[\s\S]*"input_i"[\s\S]*?\}/);
  const lnData = lnJsonMatch ? JSON.parse(lnJsonMatch[0]) : {};

  const integratedLufs = parseLoudnormNumber(lnData.input_i);
  const truePeakDbtp = parseLoudnormNumber(lnData.input_tp);
  const isCfr60 = v.r_frame_rate === '60/1' && v.avg_frame_rate === '60/1';
  const isBt709 =
    v.color_primaries === 'bt709' && v.color_transfer === 'bt709' && v.color_space === 'bt709';
  const bitrateMbps = Number((Number(v.bit_rate || fmt.bit_rate || 0) / 1_000_000).toFixed(2));
  const expectedFrames = meta?.durationInFrames || 900;
  const nbFrames = Number(v.nb_frames || 0);
  const framesMatch = nbFrames === expectedFrames && expectedFrames % 30 === 0;
  const metadataClean =
    !fmt.tags?.encoder && !fmt.tags?.comment && Boolean(fmt.tags?.creation_time);
  const sizeOk = fileSizeMb >= 1.5 && fileSizeMb <= 6.0;

  const audioMode = meta?.encodingSpec?.audioMode || 'PIVOT_ACCENT';
  let audioOk = false;
  if (audioMode === 'FOLEY_MASTER') {
    audioOk =
      integratedLufs !== null &&
      Math.abs(integratedLufs - -14.0) <= 1.2 &&
      truePeakDbtp !== null &&
      truePeakDbtp <= -0.8;
  } else if (audioMode === 'PIVOT_ACCENT') {
    audioOk =
      truePeakDbtp !== null &&
      truePeakDbtp <= -0.8 &&
      integratedLufs !== null &&
      integratedLufs <= -20 &&
      integratedLufs > -65;
  } else {
    audioOk = truePeakDbtp !== null && truePeakDbtp <= -55;
  }

  const pass =
    v.width === 1080 &&
    v.height === 1920 &&
    isCfr60 &&
    framesMatch &&
    isBt709 &&
    atom.faststart &&
    metadataClean &&
    sizeOk &&
    Number(a.sample_rate) === 48000 &&
    a.channels === 2 &&
    audioOk;

  return {
    pass,
    file: path.relative(ROOT, filePath),
    fileSizeMb,
    sizeOk,
    resolution: `${v.width}x${v.height}`,
    fps: `${v.r_frame_rate} (avg ${v.avg_frame_rate})`,
    nbFrames,
    expectedFrames,
    codecProfile: `${v.codec_name} (${v.profile})`,
    colorSpace: `${v.color_primaries}/${v.color_transfer}/${v.color_space}`,
    bitrateMbps,
    faststart: atom.faststart,
    metadataClean,
    tags: fmt.tags || {},
    atoms: atom.atoms,
    audioMode,
    audioSpec: `${a.codec_name} ${a.sample_rate}Hz ${a.channels}ch`,
    integratedLufs,
    truePeakDbtp,
  };
}

const g4 = {
  chen08: probeMp4(g3.chen08.seoFullPath, g3.chen08.metadata),
  chen09: probeMp4(g3.chen09.seoFullPath, g3.chen09.metadata),
};
g4.pass = Boolean(g4.chen08.pass && g4.chen09.pass);

console.log('=== [BƯỚC 5/5] GATE 5: Kiểm định Hướng 1, Header Cover 3:4 (B.1), Chống tĩnh 2.0s & Seamless Loop động ===');
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

function computeRgbSsim(bufA, bufB, width = 1080, height = 1920) {
  if (!bufA?.length || !bufB?.length || bufA.length !== bufB.length) return null;
  const block = 12;
  const c1 = 6.5025;
  const c2 = 58.5225;
  let sumSsim = 0;
  let count = 0;
  for (let by = 0; by + block <= height; by += block) {
    for (let bx = 0; bx + block <= width; bx += block) {
      let sumA = 0, sumB = 0;
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
      let varA = 0, varB = 0, cov = 0;
      for (let dy = 0; dy < block; dy++) {
        const row = (by + dy) * width;
        for (let dx = 0; dx < block; dx++) {
          const i = (row + bx + dx) * 3;
          const la = (0.2126 * bufA[i] + 0.7152 * bufA[i + 1] + 0.0722 * bufA[i + 2]) - muA;
          const lb = (0.2126 * bufB[i] + 0.7152 * bufB[i + 1] + 0.0722 * bufB[i + 2]) - muB;
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
    const d = Math.abs(bufA[i] - bufB[i]) + Math.abs(bufA[i + 1] - bufB[i + 1]) + Math.abs(bufA[i + 2] - bufB[i + 2]);
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
  let rS = 0, gS = 0, bS = 0, cnt = 0;
  for (let y = 220; y < 380; y += 10) {
    for (let x = 20; x < 60; x += 5) {
      const idx = (y * w + x) * 3;
      rS += rgbBuf[idx]; gS += rgbBuf[idx + 1]; bS += rgbBuf[idx + 2]; cnt++;
    }
  }
  const bgR = rS / cnt, bgG = gS / cnt, bgB = bS / cnt;
  let minX = w, maxX = 0, minY = 1920, maxY = 0, inkPixels = 0;
  for (let y = yMinScan; y < yMaxScan; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const idx = (y * w + x) * 3;
      const dist = Math.abs(rgbBuf[idx] - bgR) + Math.abs(rgbBuf[idx + 1] - bgG) + Math.abs(rgbBuf[idx + 2] - bgB);
      if (dist > 135) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        inkPixels++;
      }
    }
  }
  return inkPixels === 0 ? { inkPixels: 0 } : { inkPixels, minX, maxX, minY, maxY };
}

function inspectVisuals(label, videoPath, meta) {
  if (!videoPath || !fs.existsSync(videoPath)) return { pass: false, missing: true };
  const subDir = path.join(FRAMES_DIR, label);
  fs.mkdirSync(subDir, { recursive: true });
  const totalFrames = meta?.durationInFrames || 900;
  const lastF = totalFrames - 1;
  const coverF = meta?.recommendedCoverFrame || 219;
  const pivotF = meta?.pivotFrame || 314;
  const holdEndF = Math.max(pivotF + 60, totalFrames - 48);
  const framesToSave = [
    { n: 0, name: 'frame_000_0.00s.png' },
    { n: 21, name: 'frame_021_0.35s_leadin.png' },
    { n: 84, name: 'frame_084_1.40s_line1_done.png' },
    { n: 120, name: 'frame_120_2.00s.png' },
    { n: coverF, name: `frame_${coverF}_cover.png` },
    { n: pivotF, name: `frame_${pivotF}_pivot.png` },
    { n: holdEndF, name: `frame_${holdEndF}_hold_end.png` },
    { n: lastF, name: `frame_${lastF}_end.png` },
  ];
  for (const f of framesToSave) {
    runCmd('ffmpeg', [
      '-y',
      '-v',
      'error',
      '-i',
      videoPath,
      '-vf',
      `trim=start_frame=${f.n}:end_frame=${f.n + 1}`,
      '-frames:v',
      '1',
      path.join(subDir, f.name),
    ]);
  }

  const rgb0 = extractRawRgb(videoPath, 0);
  const rgb60 = extractRawRgb(videoPath, 60);
  const rgb84 = extractRawRgb(videoPath, 84);
  const rgb120 = extractRawRgb(videoPath, 120);
  const rgbCover = extractRawRgb(videoPath, coverF);
  const rgbPivot = extractRawRgb(videoPath, pivotF);
  const rgbHoldEnd = extractRawRgb(videoPath, holdEndF);
  const rgbEnd = extractRawRgb(videoPath, lastF);

  // Hướng 1 & B.1: Kiểm tra vùng Typography động theo visualDNA (mặc định Y=862..1538), Header tại Y=264..324
  const [typoMinY, typoMaxY] =
    Array.isArray(meta?.visualDNA?.typographyZoneY) &&
    meta.visualDNA.typographyZoneY.length === 2
      ? meta.visualDNA.typographyZoneY
      : [862, 1538];
  const typoAt0s = measureInkBounds(rgb0, typoMinY, typoMaxY);
  const typoAt1_4s = measureInkBounds(rgb84, typoMinY, typoMaxY);
  const typoAtCover = measureInkBounds(rgbCover, typoMinY, typoMaxY);
  const typoAtHoldEnd = measureInkBounds(rgbHoldEnd, typoMinY, typoMaxY);
  const typoAtEnd = measureInkBounds(rgbEnd, typoMinY, typoMaxY);
  const headerAt0s = measureInkBounds(rgb0, 264, 324);
  const headerAtCover = measureInkBounds(rgbCover, 264, 324);
  const headerAtPivot = measureInkBounds(rgbPivot, 264, 324);
  const headerAtEnd = measureInkBounds(rgbEnd, 264, 324);
  const pivotBounds = measureInkBounds(rgbPivot, 240, 1540);
  const d0_1s = diffRgb(rgb0, rgb60);
  const d1_2s = diffRgb(rgb60, rgb120);
  const loopDiff = diffRgb(rgbEnd, rgb0);
  const loopSsim = computeRgbSsim(rgbEnd, rgb0);

  const option1LeadInPass =
    typoAt0s.inkPixels === 0 &&
    typoAt1_4s.inkPixels > 250 &&
    typoAtEnd.inkPixels === 0;
  const headerB1Pass =
    headerAt0s.inkPixels > 80 &&
    headerAtCover.inkPixels > 80 &&
    headerAtPivot.inkPixels === 0 &&
    headerAtEnd.inkPixels > 80;
  const coverNoSpoilerPass =
    typoAtCover.inkPixels > 100 &&
    typoAtHoldEnd.inkPixels > typoAtCover.inkPixels &&
    typoAtCover.inkPixels < typoAtHoldEnd.inkPixels * 0.9;
  const antiStaticPass = Boolean(d0_1s?.changedPixels > 0 && d1_2s?.changedPixels > 0);
  const clearsSafeZone =
    pivotBounds.inkPixels > 0 && pivotBounds.minX >= 132 && pivotBounds.maxX <= 948;
  const loopSmooth = loopSsim !== null && loopSsim >= 0.96;

  return {
    pass:
      option1LeadInPass &&
      headerB1Pass &&
      coverNoSpoilerPass &&
      antiStaticPass &&
      clearsSafeZone &&
      loopSmooth,
    framesDir: path.relative(ROOT, subDir),
    option1TypographyCheck: {
      typoAt0s,
      typoAt1_4s,
      typoAtEnd,
      pass: option1LeadInPass,
    },
    headerCoverB1Check: {
      headerAt0s,
      headerAtCover,
      headerAtPivot,
      headerAtEnd,
      pass: headerB1Pass,
    },
    coverNoSpoilerCheck: {
      typoAtCover,
      typoAtHoldEnd,
      pass: coverNoSpoilerPass,
    },
    antiStatic: { d0_1s, d1_2s, pass: antiStaticPass },
    boundsAtPivot: { ...pivotBounds, clearsSafeZone },
    seamlessLoop: { ...loopDiff, ssim: loopSsim, pass: loopSmooth },
  };
}

const g5 = {
  chen08: inspectVisuals('chen-08', g3.chen08.seoFullPath, g3.chen08.metadata),
  chen09: inspectVisuals('chen-09', g3.chen09.seoFullPath, g3.chen09.metadata),
};
g5.pass = Boolean(g5.chen08.pass && g5.chen09.pass);

const overallPass = Boolean(g1.pass && g2.pass && g3.pass && g4.pass && g5.pass);
const fullSummary = {
  timestamp: new Date().toISOString(),
  overallPass,
  gate1: g1,
  gate2: g2,
  gate3: g3,
  gate4: g4,
  gate5: g5,
};

const reportJsonPath = path.join(OUT_DIR, 'qa-5gates-full.json');
fs.writeFileSync(reportJsonPath, JSON.stringify(fullSummary, null, 2), 'utf8');

const md = [
  '# 🍵 QA Report Toàn Diện 5 Gate — Trà Nguội Studio V8.5',
  '',
  `- **Kết quả tổng thể**: ${overallPass ? '✅ **ĐẠT CHUẨN TOÀN BỘ 5 GATE (STUDIO V8.5)**' : '❌ **CÓ HẠNG MỤC CẦN KIỂM TRA**'}`,
  `- **Thời điểm nghiệm thu**: \`${fullSummary.timestamp}\``,
  '',
  '| Gate | Hạng mục kiểm định | Trạng thái | Chỉ số thực tế |',
  '| :--- | :--- | :--- | :--- |',
  `| **Gate 1** | Sạch \`.mp3\` & \`tsc --noEmit\` | ${g1.pass ? '✅ PASS' : '❌ FAIL'} | \`${g1.mp3FilesOnDisk.length}\` file nhạc trộn cứng, \`${g1.activeMp3Refs.length}\` tham chiếu tồn dư |`,
  `| **Gate 2** | Âm tiết, Visual DNA B.2/B.3, Anti-Repeat P2, SEO, TN-Score | ${g2.pass ? '✅ PASS' : '❌ FAIL'} | \`${g2.unitChecks.filter((u) => u.pass).length}/${g2.unitChecks.length}\` unit tests, \`${g2.hardViolations.length}\` lỗi cứng |`,
  `| **Gate 3** | Render MP4 thực tế & Ảnh Bìa Cover PNG (Chén 08 & 09) | ${g3.pass ? '✅ PASS' : '❌ FAIL'} | Chén 08: \`${g3.chen08.seoSizeMb} MB\` (Cover ✓), Chén 09: \`${g3.chen09.seoSizeMb} MB\` (Cover ✓) |`,
  `| **Gate 4** | \`ffprobe\` (60fps, bt709, faststart, sạch Lavf) & Audio Mode | ${g4.pass ? '✅ PASS' : '❌ FAIL'} | Chén 08: \`${g4.chen08.audioMode}\` \`${g4.chen08.truePeakDbtp} dBTP\`, Chén 09: \`${g4.chen09.audioMode}\` \`${g4.chen09.truePeakDbtp} dBTP\` |`,
  `| **Gate 5** | Hướng 1, Header Cover 3:4 B.1 (chưa lộ kết), Chống tĩnh & Loop | ${g5.pass ? '✅ PASS' : '❌ FAIL'} | Chén 08 SSIM \`${g5.chen08.seamlessLoop?.ssim}\`, Chén 09 SSIM \`${g5.chen09.seamlessLoop?.ssim}\` |`,
  '',
];

const reportMdPath = path.join(OUT_DIR, 'QA_REPORT_5GATES_V8.5.md');
fs.writeFileSync(reportMdPath, md.join('\n'), 'utf8');
console.log('\n' + md.join('\n'));
console.log(`📄 Báo cáo chi tiết đã lưu tại: ${reportMdPath}`);
process.exit(overallPass ? 0 : 1);
