import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'qa-artifacts-ci');
fs.mkdirSync(OUT_DIR, { recursive: true });

const SYLLABLE_CEILING = 40;

const IGNORE_DIRS = new Set([
  '.git',
  '.github',
  'node_modules',
  '.tmp.driveupload',
  '.tmp.drivedownload',
  'dist',
  'dist-studio',
  'build',
  'output',
  'videos',
  'qa-artifacts',
  'qa-artifacts-ci',
  'Trà Nguội.app',
]);

const SELF_REL = path.relative(ROOT, __filename).replace(/\\/g, '/');

function walkFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(ent.name) || ent.isSymbolicLink()) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      results.push(...walkFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function ghAnnotate(level, message, file, line) {
  const loc = file ? (line ? ` file=${file},line=${line}` : ` file=${file}`) : '';
  console.log(`::${level}${loc}::${message.replace(/\r?\n/g, ' ')}`);
}

function assertCheck(checks, name, condition, detail) {
  checks.push({ name, pass: Boolean(condition), detail });
  if (!condition) {
    ghAnnotate('error', `[Unit Check FAIL] ${name}: ${detail}`);
  }
}

async function runGate1() {
  console.log('=== [GATE 1] Quét tĩnh sạch .mp3 & Kiểm tra kiểu TypeScript (tsc) ===');
  const allFiles = walkFiles(ROOT);

  const mp3FilesOnDisk = allFiles
    .filter((f) => f.toLowerCase().endsWith('.mp3'))
    .map((f) => path.relative(ROOT, f).replace(/\\/g, '/'));

  for (const f of mp3FilesOnDisk) {
    ghAnnotate('error', `Phát hiện file .mp3 vật lý trong kho mã nguồn: ${f}`, f, 1);
  }

  const scanExts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.html']);
  const skipRelFiles = new Set([
    'package-lock.json',
    'pnpm-lock.yaml',
    SELF_REL,
  ]);

  const activeMp3Refs = [];
  const guardOrCommentRefs = [];

  for (const file of allFiles) {
    const ext = path.extname(file).toLowerCase();
    if (!scanExts.has(ext)) continue;
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    if (skipRelFiles.has(rel) || rel.startsWith('qa-artifacts')) continue;

    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (!/\.mp3\b/i.test(line)) return;
      const trimmed = line.trim();
      const isCommentOrGuard =
        trimmed.startsWith('//') ||
        trimmed.startsWith('*') ||
        trimmed.startsWith('/*') ||
        /không.*\.mp3|ban|forbid|exclude|clean|regex/i.test(trimmed);

      const item = {
        file: rel,
        line: idx + 1,
        snippet: trimmed.slice(0, 140),
      };

      if (isCommentOrGuard) {
        guardOrCommentRefs.push(item);
      } else {
        activeMp3Refs.push(item);
        ghAnnotate(
          'error',
          `Gate 1: Phát hiện tham chiếu .mp3 còn sót tại ${rel}:${idx + 1} -> ${item.snippet}`,
          rel,
          idx + 1
        );
      }
    });
  }

  const tsconfigs = ['tsconfig.json', 'server/tsconfig.json', 'studio-ui/tsconfig.json'].filter(
    (rel) => fs.existsSync(path.join(ROOT, rel))
  );

  const tscRuns = tsconfigs.map((cfg) => {
    const res = spawnSync('npx', ['tsc', '-p', cfg, '--noEmit'], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    });
    const output = ((res.stdout || '') + '\n' + (res.stderr || '')).trim();
    if (res.status !== 0) {
      ghAnnotate('error', `Gate 1: npx tsc -p ${cfg} --noEmit thất bại (exit ${res.status})`, cfg, 1);
      console.error(output);
    }
    return {
      config: cfg,
      exitCode: res.status ?? -1,
      output: output.slice(0, 4000),
    };
  });

  const pass =
    mp3FilesOnDisk.length === 0 &&
    activeMp3Refs.length === 0 &&
    tscRuns.every((r) => r.exitCode === 0);

  const gate1Result = {
    pass,
    mp3FilesOnDisk,
    activeMp3Refs,
    guardOrCommentRefs,
    tscRuns,
  };

  fs.writeFileSync(path.join(OUT_DIR, 'gate1.json'), JSON.stringify(gate1Result, null, 2));
  console.log(`Gate 1 status: ${pass ? 'PASS' : 'FAIL'}`);
  process.exit(pass ? 0 : 1);
}

function classifyCupPillar(cup, airtableCupRecord) {
  const author = String(cup.props?.author || '').trim();
  if (author.length > 0 && !/^sưu tầm$/i.test(author)) {
    return 'author_literature'; // 10% Văn học nguyên tác có tên tác giả
  }
  const mood = String(airtableCupRecord?.fields?.['Mood'] || cup.props?.publishMood || '').toLowerCase();
  const corpus = [
    cup.props?.title || '',
    cup.props?.pivotWord || '',
    ...(cup.props?.segments || []),
    cup.captionText || '',
  ]
    .join(' ')
    .toLowerCase();

  if (
    cup.props?.motion?.pacingMode === 'WRY_BATHOS' ||
    /tự trào|hài hước/i.test(mood) ||
    /chấm công|quẹt chiếc thẻ|quẹt thẻ|văn phòng|lương|sếp|deadline|mở máy|câu đơn|cơn đau/i.test(corpus)
  ) {
    return 'office_wordplay'; // 40% Công sở · Tự trào · Chơi chữ
  }

  if (
    /thả thính/i.test(mood) ||
    /#thathinh\b|chiếc ô rộng|mối duyên đầu|gom mây làm rượu/i.test(corpus)
  ) {
    return 'subtle_romance'; // 20% Thả thính tinh tế · Duyên tình
  }

  return 'contemplative_healing'; // 30% Chiêm nghiệm · Sống chậm · Chữa lành
}

async function runGate2() {
  console.log('=== [GATE 2] Kiểm toán Âm tiết (trần 40), SEO, Bình luận mồi, TN-Score, 60fps/132px & 40-30-20-10 ===');

  const { auditVietnameseSyllables, computeTimelineSync } = await import('../src/engine/timelineSync.ts');
  const { LAYOUT_TOKENS } = await import('../src/theme/palettes.ts');
  const { toAsciiKebabSlug, formatCupBaseFileName, formatCupSeoFileName } = await import(
    '../src/automation/fileNaming.ts'
  );
  const {
    auditTikTokSeoCaption,
    generateSeedCommentForCup,
    computeTnScore,
    resolveCupCaption,
    stripBannedHashtags,
  } = await import('../src/automation/captionBuilder.ts');

  const unitChecks = [];

  // 0. Unit tests cho chuẩn 60fps CFR (900 frames @ 15s) & lưới swissGrid marginLeft = 132px
  assertCheck(
    unitChecks,
    'LAYOUT_TOKENS chuẩn 1080x1920 @ 60fps CFR (900 frames / 15s)',
    LAYOUT_TOKENS.width === 1080 &&
      LAYOUT_TOKENS.height === 1920 &&
      LAYOUT_TOKENS.fps === 60 &&
      Math.round(15 * LAYOUT_TOKENS.fps) === 900,
    JSON.stringify({ width: LAYOUT_TOKENS.width, height: LAYOUT_TOKENS.height, fps: LAYOUT_TOKENS.fps })
  );

  assertCheck(
    unitChecks,
    'swissGrid giữ chuẩn marginLeft = 132px (> biên cắt 97px của 9:19.5)',
    LAYOUT_TOKENS.swissGrid.marginLeft === 132 &&
      LAYOUT_TOKENS.swissGrid.marginLeft > 97 &&
      LAYOUT_TOKENS.swissGrid.marginLeft + LAYOUT_TOKENS.swissGrid.quoteBlockWidth < 983,
    JSON.stringify(LAYOUT_TOKENS.swissGrid)
  );

  // 1. Unit tests cho thuật toán đếm âm tiết (14–28 chuẩn vàng, trần 40)
  const sEmpty = auditVietnameseSyllables(['', '   ']);
  assertCheck(unitChecks, 'Syllable empty = 0', sEmpty.count === 0 && sEmpty.band === 'empty', JSON.stringify(sEmpty));

  const sConcise = auditVietnameseSyllables(['Chén trà ấm sáng nay']);
  assertCheck(unitChecks, 'Syllable concise (<14)', sConcise.count === 5 && sConcise.band === 'concise', JSON.stringify(sConcise));

  const sOptimal = auditVietnameseSyllables([
    'Ta gom mây làm rượu,',
    'Để ủ mối duyên đầu.',
    'Ai ngờ men quá gắt,',
    'Say tỉnh… chẳng còn nhau.',
  ]);
  assertCheck(unitChecks, 'Syllable optimal (14–28)', sOptimal.count === 20 && sOptimal.band === 'optimal', JSON.stringify(sOptimal));

  const sCeiling = auditVietnameseSyllables([Array(SYLLABLE_CEILING).fill('trà').join(' ')]);
  assertCheck(unitChecks, 'Syllable ceiling = 40 (long)', sCeiling.count === 40 && sCeiling.band === 'long', JSON.stringify(sCeiling));

  const sOverflow = auditVietnameseSyllables([Array(SYLLABLE_CEILING + 1).fill('trà').join(' ')]);
  assertCheck(unitChecks, 'Syllable >40 = overflow', sOverflow.count === 41 && sOverflow.band === 'overflow', JSON.stringify(sOverflow));

  // 2. Unit tests cho thuật toán SEO Filename & Caption
  const sampleSeoSlug = formatCupSeoFileName('09', {
    title: 'Ký ức',
    mood: 'Hoài niệm',
    pivotWord: 'đứng đợi',
  });
  assertCheck(
    unitChecks,
    'SEO Filename chuẩn chen-09-...-tra-nguoi',
    sampleSeoSlug.startsWith('chen-09-') && sampleSeoSlug.endsWith('-tra-nguoi') && toAsciiKebabSlug('Đỏ Chu Sa') === 'do-chu-sa',
    sampleSeoSlug
  );
  assertCheck(
    unitChecks,
    'Base Filename chuẩn Chén 09 - Ký ức',
    formatCupBaseFileName('quote-009', 'Ký ức') === 'Chén 09 - Ký ức',
    formatCupBaseFileName('quote-009', 'Ký ức')
  );

  const dirtyCaptionCleaned = stripBannedHashtags('Chiều mưa uống trà #fyp #xuhuong #viral #ngaymua');
  assertCheck(
    unitChecks,
    'stripBannedHashtags gỡ #fyp/#xuhuong/#viral & tự gắn #tranguoi',
    !/#fyp|#xuhuong|#viral/i.test(dirtyCaptionCleaned) && /#tranguoi\b/i.test(dirtyCaptionCleaned),
    dirtyCaptionCleaned
  );

  const dupAudit = auditTikTokSeoCaption(
    'Ta gom mây làm rượu để ủ mối duyên đầu\nCâu hỏi mở?\n#tranguoi #thohay #tamtrang',
    ['Ta gom mây làm rượu', 'Để ủ mối duyên đầu']
  );
  assertCheck(
    unitChecks,
    'auditTikTokSeoCaption bắt lỗi lặp nguyên văn quote',
    dupAudit.duplicatesQuoteVerbatim === true && dupAudit.isClean === false,
    JSON.stringify(dupAudit)
  );

  // 3. Unit tests cho Động cơ Bình luận mồi (3 nhánh ngữ cảnh) & 0.0s OCR Hook
  const sampleSync = computeTimelineSync({
    id: 'test-cup',
    textFormat: 'POEM',
    segments: ['Ta gom mây làm rượu', 'Say tỉnh chẳng còn nhau'],
    pivotWord: 'chẳng còn nhau',
    highlightStyle: 'BOTH',
    targetDurationSeconds: 15,
    typingSpeedMsPerChar: 55,
    holdAfterFinishSeconds: 5.5,
    themeId: 'MINIMAL_LIGHT',
    motion: {
      archetype: 'BOULDER_TO_BENCH',
      pacingMode: 'CONTEMPLATIVE',
      stateA: { intensity: 0.8, spread: 0.2, tiltDeg: -18 },
      stateB: { intensity: 0.1, spread: 0.75, tiltDeg: 0 },
    },
    bgm: { audioMode: 'FOLEY_MASTER', foleyPivotStyle: 'AUTO' },
    brandText: 'TRÀ NGUỘI',
  });
  assertCheck(
    unitChecks,
    'computeTimelineSync mở chữ ngay frame 0 (0.0s OCR Hook) & chuẩn 900 frames',
    sampleSync.durationInFrames === 900 && sampleSync.segmentTimings?.[0]?.startFrame === 0,
    JSON.stringify({ durationInFrames: sampleSync.durationInFrames, firstLineStart: sampleSync.segmentTimings?.[0]?.startFrame })
  );

  const seedOffice = generateSeedCommentForCup({
    segments: ['Vừa quẹt chiếc thẻ vào phòng chấm công'],
    title: 'Chấm công',
    pivotWord: 'trưa về',
    themeId: 'MINIMAL_LIGHT',
    motion: { archetype: 'BOULDER_TO_BENCH', pacingMode: 'WRY_BATHOS', stateA: { intensity: 0.8, spread: 0.2, tiltDeg: -18 }, stateB: { intensity: 0.1, spread: 0.75, tiltDeg: 0 } },
  });
  const seedNightAuthor = generateSeedCommentForCup(
    {
      segments: ['Dù đục dù trong con sông vẫn chảy'],
      title: 'Tự sự',
      pivotWord: 'tự trong tâm',
      author: 'Lưu Quang Vũ',
      themeId: 'MINIMAL_DARK',
      motion: { archetype: 'BOULDER_TO_BENCH', pacingMode: 'CONTEMPLATIVE', stateA: { intensity: 0.8, spread: 0.2, tiltDeg: -18 }, stateB: { intensity: 0.1, spread: 0.75, tiltDeg: 0 } },
    },
    'Night'
  );
  assertCheck(
    unitChecks,
    'Bình luận mồi phân nhánh đúng Công sở & Đêm Văn học',
    seedOffice.includes('Góc đối chữ Quán Trà') && seedNightAuthor.includes('Lưu Quang Vũ'),
    `${seedOffice.slice(0, 45)} | ${seedNightAuthor.slice(0, 45)}`
  );

  // 4. Unit tests cho công thức TN-Score (Chuẩn 100đ | Trần 138.75đ | Thăng hạng >=110đ)
  const tnBase = computeTnScore({
    completionRate: 80,
    watchRatio: 1.1,
    shareRate: 1.2,
    saveRate: 2.5,
    commentRate: 0.5,
  });
  const tnCeil = computeTnScore({
    completionRate: 100,
    watchRatio: 2.0,
    shareRate: 5.0,
    saveRate: 10.0,
    commentRate: 5.0,
  });
  const tnPromote = computeTnScore({
    completionRate: 88,
    watchRatio: 1.21,
    shareRate: 1.38,
    saveRate: 2.75,
    commentRate: 0.55,
  });
  const tnWarn = computeTnScore({
    completionRate: 45,
    watchRatio: 0.75,
    shareRate: 0.2,
    saveRate: 0.5,
    commentRate: 0.1,
  });

  assertCheck(
    unitChecks,
    'TN-Score mốc chuẩn = 100.00đ (steady)',
    tnBase.totalScore === 100 && tnBase.band === 'steady',
    JSON.stringify(tnBase)
  );
  assertCheck(
    unitChecks,
    'TN-Score trần tuyệt đối = 138.75đ (breakout)',
    tnCeil.totalScore === 138.75 && tnCeil.band === 'breakout',
    JSON.stringify(tnCeil)
  );
  assertCheck(
    unitChecks,
    'TN-Score >= 110đ kích hoạt thăng hạng W -> Kho Q',
    tnPromote.totalScore >= 110 && tnPromote.band === 'breakout' && tnPromote.diagnostic.includes('W → Kho Q'),
    JSON.stringify(tnPromote)
  );
  assertCheck(
    unitChecks,
    'TN-Score < 50đ kích hoạt cảnh báo Retention',
    tnWarn.totalScore < 50 && tnWarn.band === 'warning',
    JSON.stringify(tnWarn)
  );

  // 5. Kiểm toán thực tế trên data/cups.json & data/airtable-cache.json
  const cupsPath = path.join(ROOT, 'data/cups.json');
  const airtablePath = path.join(ROOT, 'data/airtable-cache.json');
  const cups = fs.existsSync(cupsPath) ? JSON.parse(fs.readFileSync(cupsPath, 'utf8')) : [];
  const airtable = fs.existsSync(airtablePath) ? JSON.parse(fs.readFileSync(airtablePath, 'utf8')) : null;

  const trackerTable = (airtable?.tables || []).find((t) => t.name === 'Tủ Chén & Lịch Đăng');
  const trackerRecords = trackerTable?.records || [];

  const findTrackerRecord = (cupNo) =>
    trackerRecords.find((r) =>
      new RegExp(`^Chén\\s*0?${Number(cupNo)}\\b`, 'i').test(String(r.fields?.['Mã Chén'] || ''))
    );

  const hardViolations = [];
  const warnings = [];
  const pillarCounts = {
    office_wordplay: 0,
    contemplative_healing: 0,
    subtle_romance: 0,
    author_literature: 0,
  };

  const cupAudits = cups.map((cup, idx) => {
    const cupNo = cup.cupNumber || String(idx + 1).padStart(2, '0');
    const p = cup.props || {};
    const hasAuthor = Boolean(String(p.author || '').trim() && !/^sưu tầm$/i.test(String(p.author || '').trim()));
    const syl = auditVietnameseSyllables(p.segments || []);
    const caption = cup.captionText || resolveCupCaption(cup.id, p);
    const seoAudit = auditTikTokSeoCaption(caption, p.segments || []);
    const trackerRec = findTrackerRecord(cupNo);
    const airtableMood = trackerRec?.fields?.['Mood'] || p.publishMood || '';
    const airtableSlot = trackerRec?.fields?.['Khung giờ hợp'] || p.publishSlot || '';
    const airtableSeed = String(trackerRec?.fields?.['Bình luận mồi'] || '').trim();
    const generatedSeed = generateSeedCommentForCup(p);
    const computedSeoFile =
      cup.seoFileName ||
      `${formatCupSeoFileName(cupNo, {
        title: p.title,
        pivotWord: p.pivotWord,
        mood: airtableMood,
        topic: p.publishTopic,
      })}.mp4`;

    const seoSlugValid = /^chen-\d{2}-[a-z0-9-]+-tra-nguoi\.mp4$/.test(computedSeoFile);
    const hasSeedComment = airtableSeed.length > 0 || generatedSeed.length > 0;

    const pillar = classifyCupPillar(cup, trackerRec);
    pillarCounts[pillar] += 1;

    if ((syl.count > SYLLABLE_CEILING && !hasAuthor) || syl.count === 0) {
      const msg = `Chén ${cupNo} (${p.title}): ${syl.count} âm tiết — vượt trần ${SYLLABLE_CEILING} âm tiết của khung 15s`;
      hardViolations.push(msg);
      ghAnnotate('error', `Gate 2: ${msg}`, 'data/cups.json', 1);
    } else if (syl.band !== 'optimal') {
      const msg = `Chén ${cupNo} (${p.title}): ${syl.count} âm tiết (${syl.label})`;
      warnings.push(msg);
      ghAnnotate('warning', `Gate 2: ${msg}`, 'data/cups.json', 1);
    }

    if (!seoAudit.isClean) {
      const msg = `Chén ${cupNo} (${p.title}): Caption SEO không đạt chuẩn (${JSON.stringify(seoAudit)})`;
      hardViolations.push(msg);
      ghAnnotate('error', `Gate 2: ${msg}`, 'data/cups.json', 1);
    }

    if (!seoSlugValid) {
      const msg = `Chén ${cupNo} (${p.title}): Tên file SEO không khớp chuẩn (${computedSeoFile})`;
      hardViolations.push(msg);
      ghAnnotate('error', `Gate 2: ${msg}`, 'data/cups.json', 1);
    }

    if (trackerRec && airtableSeed.length === 0) {
      const msg = `Chén ${cupNo} (${p.title}): Thiếu Bình luận mồi trên bảng Tủ Chén & Lịch Đăng`;
      hardViolations.push(msg);
      ghAnnotate('error', `Gate 2: ${msg}`, 'data/airtable-cache.json', 1);
    } else if (
      trackerRec &&
      p.pivotWord &&
      airtableSeed.includes('«') &&
      !airtableSeed.toLowerCase().includes(String(p.pivotWord).toLowerCase())
    ) {
      const msg = `Chén ${cupNo} (${p.title}): Bình luận mồi trên Airtable chưa đồng bộ theo pivotWord mới "${p.pivotWord}"`;
      warnings.push(msg);
      ghAnnotate('warning', `Gate 2: ${msg}`, 'data/airtable-cache.json', 1);
    }

    return {
      id: cup.id,
      cupNo,
      title: p.title || '',
      pivotWord: p.pivotWord || '',
      syllables: syl.count,
      syllableBand: syl.band,
      syllableLabel: syl.label,
      seoFile: computedSeoFile,
      seoSlugValid,
      hashtagCount: seoAudit.hashtagCount,
      seoClean: seoAudit.isClean,
      hasSeedComment,
      slot: airtableSlot,
      mood: airtableMood,
      pillar,
    };
  });

  // Kiểm tra trùng nội dung giữa các Chén
  const seenQuotes = new Map();
  for (const cup of cups) {
    const norm = (cup.props?.segments || []).join(' ').replace(/\s+/g, ' ').trim().toLowerCase();
    if (!norm) continue;
    if (seenQuotes.has(norm)) {
      const msg = `Trùng lặp nội dung nguyên văn giữa Chén ${seenQuotes.get(norm)} và Chén ${cup.cupNumber}`;
      warnings.push(msg);
      ghAnnotate('warning', `Gate 2: ${msg}`, 'data/cups.json', 1);
    } else {
      seenQuotes.set(norm, cup.cupNumber);
    }
  }

  // Kiểm tra Quy tắc Khung Đêm (Night Adjacency Rule) theo thứ tự Chén
  const heavyMoods = new Set(['Trầm buồn', 'Hoài niệm', 'Chua chát']);
  const warmMoods = new Set(['Ấm áp', 'Nhẹ nhàng', 'Thi vị']);
  const sortedAudits = [...cupAudits].sort((a, b) => Number(a.cupNo) - Number(b.cupNo));
  const nightCups = sortedAudits.filter((c) => /night|tối|đêm|21:30/i.test(String(c.slot)));
  const nightViolations = [];
  let prevHeavy = null;
  for (const nc of nightCups) {
    if (heavyMoods.has(nc.mood)) {
      if (prevHeavy) {
        nightViolations.push(`Chén ${prevHeavy.cupNo} (${prevHeavy.mood}) -> Chén ${nc.cupNo} (${nc.mood})`);
      }
      prevHeavy = nc;
    } else if (warmMoods.has(nc.mood)) {
      prevHeavy = null;
    }
  }

  if (nightViolations.length > 0) {
    const msg = `Quy tắc Khung Đêm: Đang xếp liền kề các Chén Đêm sắc thái nặng chưa có bài ấm dịu xen giữa (${nightViolations.join('; ')})`;
    warnings.push(msg);
    ghAnnotate('warning', `Gate 2: ${msg}`, 'data/airtable-cache.json', 1);
  }

  const totalCups = Math.max(1, cupAudits.length);
  const ratioSummary = {
    totalCups: cupAudits.length,
    pillars: {
      office_wordplay: {
        label: 'Công sở · Tự trào · Chơi chữ',
        targetPct: 40,
        count: pillarCounts.office_wordplay,
        actualPct: Number(((pillarCounts.office_wordplay / totalCups) * 100).toFixed(1)),
      },
      contemplative_healing: {
        label: 'Chiêm nghiệm · Sống chậm · Chữa lành',
        targetPct: 30,
        count: pillarCounts.contemplative_healing,
        actualPct: Number(((pillarCounts.contemplative_healing / totalCups) * 100).toFixed(1)),
      },
      subtle_romance: {
        label: 'Thả thính tinh tế · Duyên tình',
        targetPct: 20,
        count: pillarCounts.subtle_romance,
        actualPct: Number(((pillarCounts.subtle_romance / totalCups) * 100).toFixed(1)),
      },
      author_literature: {
        label: 'Văn học nguyên tác có tên tác giả',
        targetPct: 10,
        count: pillarCounts.author_literature,
        actualPct: Number(((pillarCounts.author_literature / totalCups) * 100).toFixed(1)),
      },
    },
  };

  if (pillarCounts.author_literature === 0) {
    const msg = 'Tỷ trọng 40-30-20-10: Hiện đang thiếu nhóm Văn học nguyên tác có tên tác giả (0% so với mục tiêu 10%)';
    warnings.push(msg);
    ghAnnotate('warning', `Gate 2: ${msg}`, 'data/cups.json', 1);
  }

  const allUnitsPass = unitChecks.every((u) => u.pass);
  const pass = allUnitsPass && hardViolations.length === 0;

  const gate2Result = {
    pass,
    unitChecks,
    cupAudits,
    tnScoreBenchmarks: {
      baseline100: tnBase.totalScore,
      ceiling138_75: tnCeil.totalScore,
      promotionSample: tnPromote.totalScore,
      warningSample: tnWarn.totalScore,
    },
    ratioSummary,
    nightRule: {
      nightCupCount: nightCups.length,
      adjacentHeavyPairs: nightViolations,
    },
    hardViolations,
    warnings,
  };

  fs.writeFileSync(path.join(OUT_DIR, 'gate2.json'), JSON.stringify(gate2Result, null, 2));
  console.log(`Gate 2 status: ${pass ? 'PASS' : 'FAIL'} (${hardViolations.length} lỗi cứng, ${warnings.length} cảnh báo)`);
  process.exit(pass ? 0 : 1);
}

function runSummarize() {
  const g1Path = path.join(OUT_DIR, 'gate1.json');
  const g2Path = path.join(OUT_DIR, 'gate2.json');
  const g1 = fs.existsSync(g1Path) ? JSON.parse(fs.readFileSync(g1Path, 'utf8')) : null;
  const g2 = fs.existsSync(g2Path) ? JSON.parse(fs.readFileSync(g2Path, 'utf8')) : null;

  const overallPass = Boolean(g1?.pass && g2?.pass);
  const lines = [];

  lines.push(`# 🍵 Báo Cáo Kiểm Thử Tự Động CI — Trà Nguội Studio (Gate 1 & Gate 2)`);
  lines.push('');
  lines.push(`- **Kết quả tổng thể**: ${overallPass ? '✅ **PASS**' : '❌ **CẦN XỬ LÝ LỖI CỨNG**'}`);
  lines.push(`- **Thời gian chạy**: \`${new Date().toISOString()}\``);
  lines.push('');

  lines.push('## 1. Gate 1 — Quét tĩnh `.mp3` & Kiểm tra kiểu TypeScript (`tsc`)');
  if (!g1) {
    lines.push('_Không tìm thấy dữ liệu Gate 1._');
  } else {
    lines.push(`- **Trạng thái Gate 1**: ${g1.pass ? '✅ PASS' : '❌ FAIL'}`);
    lines.push(`- **File \`.mp3\` vật lý trong repo**: \`${g1.mp3FilesOnDisk.length}\``);
    lines.push(`- **Tham chiếu \`.mp3\` còn hoạt động trong code/JSON**: \`${g1.activeMp3Refs.length}\``);
    for (const ref of g1.activeMp3Refs) {
      lines.push(`  - \`${ref.file}:${ref.line}\` → \`${ref.snippet}\``);
    }
    for (const run of g1.tscRuns) {
      lines.push(`- **TypeScript (\`npx tsc -p ${run.config} --noEmit\`)**: ${run.exitCode === 0 ? '✅ Sạch 0 lỗi kiểu' : `❌ Lỗi (exit ${run.exitCode})`}`);
    }
  }
  lines.push('');

  lines.push('## 2. Gate 2 — Thuật toán Âm tiết (trần 40), SEO, Bình luận mồi, `TN-Score`, `60fps/132px` & `40-30-20-10`');
  if (!g2) {
    lines.push('_Không tìm thấy dữ liệu Gate 2._');
  } else {
    const passedUnits = g2.unitChecks.filter((u) => u.pass).length;
    lines.push(`- **Trạng thái Gate 2**: ${g2.pass ? '✅ PASS' : '❌ FAIL'}`);
    lines.push(`- **Unit Tests thuật toán cốt lõi**: \`${passedUnits}/${g2.unitChecks.length}\` PASS (Chuẩn \`60 fps\`, Lề \`132px\`, Trần \`40 âm tiết\`, Mốc \`TN-Score = ${g2.tnScoreBenchmarks.baseline100}đ\`)`);
    lines.push('');
    lines.push('### Bảng kiểm toán từng Chén trong `data/cups.json`');
    lines.push('');
    lines.push('| Chén | Tiêu đề | Pivot | Âm tiết | Phân hạng | File SEO | Caption SEO | Mồi & Khung giờ |');
    lines.push('| :--- | :--- | :--- | ---: | :--- | :--- | :--- | :--- |');
    for (const c of g2.cupAudits) {
      const bandBadge = c.syllables > SYLLABLE_CEILING ? `❌ ${c.syllableLabel}` : c.syllableBand === 'optimal' ? `✅ ${c.syllableLabel}` : `⚠️ ${c.syllableLabel}`;
      const seoBadge = c.seoClean && c.seoSlugValid ? `✅ (${c.hashtagCount} tags)` : '❌ Lỗi SEO';
      lines.push(
        `| **Chén ${c.cupNo}** | ${c.title} | \`${c.pivotWord}\` | \`${c.syllables}\` | ${bandBadge} | \`${c.seoFile}\` | ${seoBadge} | ${c.hasSeedComment ? '✅' : '❌'} ${c.slot || '—'} (${c.mood || '—'}) |`
      );
    }
    lines.push('');
    lines.push('### Đối chiếu tỷ trọng danh mục `40–30–20–10`');
    lines.push('');
    lines.push('| Trụ cột nội dung | Mục tiêu | Số Chén | Tỷ lệ hiện tại |');
    lines.push('| :--- | ---: | ---: | ---: |');
    for (const p of Object.values(g2.ratioSummary.pillars)) {
      lines.push(`| ${p.label} | \`${p.targetPct}%\` | \`${p.count}\` | \`${p.actualPct}%\` |`);
    }

    if (g2.hardViolations.length > 0) {
      lines.push('');
      lines.push('### ❌ Các vi phạm cứng cần sửa để qua cổng CI');
      for (const v of g2.hardViolations) lines.push(`- ${v}`);
    }
    if (g2.warnings.length > 0) {
      lines.push('');
      lines.push('### ⚠️ Lưu ý tối ưu biên tập & lịch đăng');
      for (const w of g2.warnings) lines.push(`- ${w}`);
    }
  }

  const mdContent = lines.join('\n') + '\n';
  fs.writeFileSync(path.join(OUT_DIR, 'QA_GATES_1_2_REPORT.md'), mdContent, 'utf8');
  fs.writeFileSync(
    path.join(OUT_DIR, 'qa-gates-1-2.json'),
    JSON.stringify({ overallPass, gate1: g1, gate2: g2 }, null, 2),
    'utf8'
  );

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, mdContent, 'utf8');
  }

  console.log(mdContent);
  process.exit(overallPass ? 0 : 1);
}

const arg = process.argv.slice(2);
if (arg.includes('--gate=1')) {
  await runGate1();
} else if (arg.includes('--gate=2')) {
  await runGate2();
} else {
  runSummarize();
}
