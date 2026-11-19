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

function loadAllCupsForAudit() {
  const cupsDir = path.join(ROOT, 'data/cups');
  if (fs.existsSync(cupsDir)) {
    const files = fs
      .readdirSync(cupsDir)
      .filter((f) => f.endsWith('.json') && !f.startsWith('.'))
      .sort();
    if (files.length > 0) {
      const items = files.map((f) => {
        const rel = `data/cups/${f}`;
        const raw = fs.readFileSync(path.join(cupsDir, f), 'utf8');
        const parsed = JSON.parse(raw);
        return {
          cup: parsed,
          sourceFile: rel,
          lineCount: raw.split(/\r?\n/).length,
          hasInlineBloat: Boolean(parsed?.props?.motion?.stageScript),
        };
      });
      items.sort(
        (a, b) =>
          (Number(a.cup.cupNumber) || 0) - (Number(b.cup.cupNumber) || 0)
      );
      return { mode: 'per-cup-dir', items };
    }
  }

  const legacyPath = path.join(ROOT, 'data/cups.json');
  if (fs.existsSync(legacyPath)) {
    const parsed = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
    return {
      mode: 'legacy-monolith',
      items: parsed.map((cup) => ({
        cup,
        sourceFile: 'data/cups.json',
        lineCount: 0,
        hasInlineBloat: Boolean(cup?.props?.motion?.stageScript),
      })),
    };
  }
  return { mode: 'empty', items: [] };
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
    'scripts/sync-v831-cups.mjs',
    'scripts/qa-full-5gates.mjs',
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
  console.log('=== [GATE 2] Kiểm toán Âm tiết (trần 40), SEO, Bình luận mồi, TN-Score, 60fps / Safe Đa Kênh 3:4 & Cấu trúc Hướng 2 ===');

  const {
    STAGE_LEAD_IN_SECONDS,
    TYPO_LOOP_FADE_SECONDS,
    auditVietnameseSyllables,
    computeTimelineSync,
  } = await import('../src/engine/timelineSync.ts');
  const { LAYOUT_TOKENS, THEME_PALETTES, isDarkThemePalette } = await import(
    '../src/theme/palettes.ts'
  );
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
  const {
    ASYMMETRIC_THIRD_MAX_SYLLABLES,
    isLegacyPublishedCupId,
    canUseAsymmetricThird,
    resolveVisualDNA,
    resolveLayoutGeometry,
    suggestDistinctVisualDNA,
  } = await import('../src/engine/visualDnaResolver.ts');
  const { resolveStageScript } = await import('../src/stage/stageScriptRegistry.ts');
  const { detectVisualDnaSequenceWarnings } = await import('../studio-ui/src/airtableCupTracker.ts');
  const {
    GEMINI_SKILL_MD,
    GEMINI_SKILL_TEMPLATE_JSON,
    buildGeminiSkillZipBytes,
    sanitizeAndNormalizeCupBundle,
  } = await import('../src/automation/geminiBundleBridge.ts');

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
    'swissGrid đạt chuẩn Safe Đa Kênh X=[132..833], Y=[180..1540] & Lưới 3:4 (headerTop >= 240, stageLeft = 132)',
    LAYOUT_TOKENS.swissGrid.marginLeft >= 132 &&
      LAYOUT_TOKENS.swissGrid.marginLeft + LAYOUT_TOKENS.swissGrid.quoteBlockWidth <= 833 &&
      LAYOUT_TOKENS.swissGrid.headerTop >= 240 &&
      LAYOUT_TOKENS.swissGrid.typographyMaxBottom <= 1540 &&
      LAYOUT_TOKENS.swissGrid.stageLeft === 132,
    JSON.stringify(LAYOUT_TOKENS.swissGrid)
  );

  // 1. Unit tests cho thuật toán đếm âm tiết (14–28 chuẩn vàng, trần 40)
  const sEmpty = auditVietnameseSyllables(['', '   ']);
  assertCheck(unitChecks, 'Syllable empty = 0', sEmpty.count === 0 && sEmpty.band === 'empty', JSON.stringify(sEmpty));

  const sConcise = auditVietnameseSyllables(['Chén trà ấm sáng nay']);
  assertCheck(unitChecks, 'Syllable concise (<14)', sConcise.count === 5 && sConcise.band === 'concise', JSON.stringify(sConcise));

  const sOptimal = auditVietnameseSyllables([
    'Tưởng rằng năm tháng đã xa,',
    'Chợt nghe câu hát chiều qua phố người.',
    'Chuyện xưa chẳng nói một lời,',
    'Mà bên ghế trống… vẫn ngồi đợi ta.',
  ]);
  assertCheck(unitChecks, 'Syllable optimal (Chén 09 Bản Thơ 3 = 28 âm)', sOptimal.count === 28 && sOptimal.band === 'optimal', JSON.stringify(sOptimal));

  const sCeiling = auditVietnameseSyllables([Array(SYLLABLE_CEILING).fill('trà').join(' ')]);
  assertCheck(unitChecks, 'Syllable ceiling = 40 (long)', sCeiling.count === 40 && sCeiling.band === 'long', JSON.stringify(sCeiling));

  const sOverflow = auditVietnameseSyllables([Array(SYLLABLE_CEILING + 1).fill('trà').join(' ')]);
  assertCheck(unitChecks, 'Syllable >40 = overflow', sOverflow.count === 41 && sOverflow.band === 'overflow', JSON.stringify(sOverflow));

  // 2. Unit tests cho thuật toán SEO Filename & Caption
  const sampleSeoSlug = formatCupSeoFileName('09', {
    title: 'Ký ức',
    mood: 'Hoài niệm',
    pivotWord: 'vẫn ngồi đợi ta',
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

  // 3. Unit tests cho Động cơ Bình luận mồi & Hướng 1 (Nhịp mở chữ 0.35s + Seamless Loop 14.2s->15.0s)
  const sampleSync = computeTimelineSync({
    id: 'test-cup',
    textFormat: 'POEM',
    segments: [
      'Tưởng rằng năm tháng đã xa,',
      'Chợt nghe câu hát chiều qua phố người.',
      'Chuyện xưa chẳng nói một lời,',
      'Mà bên ghế trống… vẫn ngồi đợi ta.',
    ],
    pivotWord: 'vẫn ngồi đợi ta',
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
  const expectedLeadInFrames = Math.round(STAGE_LEAD_IN_SECONDS * LAYOUT_TOKENS.fps);
  const expectedFadeDuration = sampleSync.fadeDurationFrames;
  const expectedLoopFadeStart =
    sampleSync.durationInFrames - Math.round(TYPO_LOOP_FADE_SECONDS * LAYOUT_TOKENS.fps);
  assertCheck(
    unitChecks,
    'computeTimelineSync chuẩn PA-B (FIXED 15s): mở chữ Dòng 1 tại 0.35s (frame 21), thấm mực Ease-Out Cubic & Seamless Loop (frame 852 -> 899)',
    sampleSync.durationInFrames === 900 &&
      sampleSync.introBufferFrames === expectedLeadInFrames &&
      sampleSync.segmentTimings?.[0]?.startFrame === 21 &&
      sampleSync.segmentTimings?.[0]?.endTypingFrame === 21 + expectedFadeDuration &&
      expectedLoopFadeStart === 852,
    JSON.stringify({
      durationInFrames: sampleSync.durationInFrames,
      firstLineStart: sampleSync.segmentTimings?.[0]?.startFrame,
      firstLineEnd: sampleSync.segmentTimings?.[0]?.endTypingFrame,
      fourthLineStart: sampleSync.segmentTimings?.[3]?.startFrame,
      pivotFrame: sampleSync.pivotFrame,
      typoLoopStartFrame: expectedLoopFadeStart,
    })
  );

  const sampleDynamicSync = computeTimelineSync({
    id: 'quote-008',
    textFormat: 'POEM',
    segments: [
      'Người ta xem dự báo để tránh ngày mưa.',
      'Còn tôi xem… chỉ để biết ',
      'hôm nào cần mang chiếc ô rộng hơn ngày thường.',
    ],
    pivotWord: 'chiếc ô rộng',
    highlightStyle: 'BOTH',
    targetDurationSeconds: 15,
    durationMode: 'AUTO_SEED',
    typingSpeedMsPerChar: 55,
    holdAfterFinishSeconds: 5.5,
    themeId: 'WARM_NOIR',
    motion: {
      archetype: 'SCRIPT_CHIEC_O_RONG_CHO_NHAU',
      pacingMode: 'CONTEMPLATIVE',
      stateA: { intensity: 0.8, spread: 0.2, tiltDeg: -16 },
      stateB: { intensity: 0.1, spread: 0.75, tiltDeg: 0 },
    },
    bgm: { audioMode: 'PIVOT_ACCENT', foleyPivotStyle: 'AUTO' },
    brandText: 'TRÀ NGUỘI',
  });
  assertCheck(
    unitChecks,
    'computeTimelineSync (AUTO_SEED) chuẩn PA-B đàn hồi: thời lượng động !== 900f (bội 30f trong 510..1440 = 8.5–24.0s) & Ràng buộc B.1 Header dissolve sau Cover trước Pivot',
    sampleDynamicSync.durationInFrames !== 900 &&
      sampleDynamicSync.durationInFrames >= 510 &&
      sampleDynamicSync.durationInFrames <= 1440 &&
      sampleDynamicSync.durationInFrames % 30 === 0 &&
      sampleDynamicSync.recommendedCoverFrame + 18 <= sampleDynamicSync.headerDissolveStartFrame &&
      sampleDynamicSync.headerDissolveEndFrame < sampleDynamicSync.pivotFrame,
    JSON.stringify({
      durationInFrames: sampleDynamicSync.durationInFrames,
      coverFrame: sampleDynamicSync.recommendedCoverFrame,
      headerDissolveStart: sampleDynamicSync.headerDissolveStartFrame,
      headerDissolveEnd: sampleDynamicSync.headerDissolveEndFrame,
      pivotFrame: sampleDynamicSync.pivotFrame,
      loopRestoreStart: sampleDynamicSync.loopRestoreStartFrame,
    })
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

  // 4b. Unit Tests Studio V8.5 P1 (visualDNA Legacy Lock A.2, Asymmetric Guard B.3, Safe Zone Archetypes, Gobo Zero-Blur B.2)
  const vdnaLegacy = resolveVisualDNA({
    id: 'quote-003',
    pivotWord: 'câu đơn',
    themeId: 'MINIMAL_LIGHT',
  });
  const vdnaNew = resolveVisualDNA({
    id: 'quote-099',
    pivotWord: 'an nhiên',
    themeId: 'WARM_NOIR',
  });
  assertCheck(
    unitChecks,
    'P1 A.2 Legacy Lock giữ nguyên Chén 01–07 & bật forceSolidStyle cho Chén mới',
    isLegacyPublishedCupId('quote-003') &&
      vdnaLegacy.isLegacyLocked === true &&
      vdnaLegacy.layout === 'CLASSIC_TOP_STAGE' &&
      vdnaLegacy.lightingGobo === 'NONE' &&
      vdnaLegacy.forceSolidStyle === false &&
      vdnaNew.isLegacyLocked === false &&
      vdnaNew.forceSolidStyle === true,
    JSON.stringify({ vdnaLegacyLayout: vdnaLegacy.layout, vdnaNewSolid: vdnaNew.forceSolidStyle })
  );

  const spreadScript = {
    actors: [
      { id: 'a1', x: 140 },
      { id: 'a2', x: 340 },
    ],
    props: [{ id: 'p1', type: 'lotus', focusRole: 'hero' }],
  };
  const b3Reject = canUseAsymmetricThird(spreadScript, 'SOLID_SCENE');
  const b3MacroAllow = canUseAsymmetricThird(spreadScript, 'MACRO_PROP');
  const b3SylAllow = canUseAsymmetricThird(spreadScript, 'MACRO_PROP', 28);
  const b3SylReject = canUseAsymmetricThird(spreadScript, 'MACRO_PROP', 29);
  const longSegments29 = [Array(29).fill('trà').join(' ')];
  const vdnaDowngraded = resolveVisualDNA(
    {
      id: 'quote-009',
      pivotWord: 'ký ức',
      themeId: 'WARM_NOIR',
      visualDNA: {
        mode: 'CUSTOM',
        layout: 'ASYMMETRIC_THIRD',
        shotMode: 'SOLID_SCENE',
      },
    },
    spreadScript
  );
  const vdnaSylDowngraded = resolveVisualDNA(
    {
      id: 'quote-011',
      pivotWord: 'trà',
      themeId: 'MINIMAL_LIGHT',
      segments: longSegments29,
      visualDNA: {
        mode: 'CUSTOM',
        layout: 'ASYMMETRIC_THIRD',
        shotMode: 'MACRO_PROP',
      },
    },
    spreadScript
  );
  const suggestedLong29 = suggestDistinctVisualDNA(
    {
      id: 'quote-011',
      pivotWord: 'trà',
      themeId: 'MINIMAL_LIGHT',
      segments: longSegments29,
      visualDNA: {
        mode: 'CUSTOM',
        layout: 'CLASSIC_TOP_STAGE',
        shotMode: 'MACRO_PROP',
      },
    },
    spreadScript,
    ['CLASSIC_TOP_STAGE', 'SKY_QUOTE_BOTTOM_STAGE'],
    [],
    1
  );
  assertCheck(
    unitChecks,
    'P1 B.3 Chống thu nhỏ >=2 nhân vật cách xa vào ASYMMETRIC_THIRD & khóa trần <= 28 âm tiết',
    ASYMMETRIC_THIRD_MAX_SYLLABLES === 28 &&
      b3Reject.allowed === false &&
      b3MacroAllow.allowed === true &&
      b3SylAllow.allowed === true &&
      b3SylReject.allowed === false &&
      b3SylReject.blockedBySyllables === true &&
      vdnaDowngraded.downgradedAsymmetricThird === true &&
      vdnaDowngraded.layout === 'WINDOW_FRAME' &&
      vdnaSylDowngraded.downgradedAsymmetricThird === true &&
      vdnaSylDowngraded.layout === 'WINDOW_FRAME' &&
      suggestedLong29.layout !== 'ASYMMETRIC_THIRD',
    JSON.stringify({
      b3Reject,
      b3MacroAllow,
      b3SylReject,
      downgraded: vdnaDowngraded.layout,
      downgradedSyl29: vdnaSylDowngraded.layout,
      suggestedLong29Layout: suggestedLong29.layout,
    })
  );

  const allLayoutsSafe = [
    'CLASSIC_TOP_STAGE',
    'SKY_QUOTE_BOTTOM_STAGE',
    'WINDOW_FRAME',
    'ASYMMETRIC_THIRD',
  ].every((layoutName) => {
    const dna = resolveVisualDNA({
      id: 'quote-099',
      pivotWord: 'tĩnh lặng',
      themeId: 'WARM_NOIR',
      visualDNA: {
        mode: 'CUSTOM',
        layout: layoutName,
        shotMode: layoutName === 'ASYMMETRIC_THIRD' ? 'MACRO_PROP' : 'SOLID_SCENE',
      },
    });
    const geo = resolveLayoutGeometry(layoutName, dna.brushOrientation);
    const stageBottom = geo.stageTop + geo.stageHeight;
    const noVerticalOverlap =
      stageBottom <= geo.typographyTop || geo.typographyMaxBottom <= geo.stageTop;
    return (
      dna.brushOrientation === 'VERTICAL_BRUSH' &&
      geo.brushOrientation === 'VERTICAL_BRUSH' &&
      geo.typographyTop >= 342 &&
      geo.typographyMaxBottom <= 1538 &&
      geo.typographyLeft >= 132 &&
      geo.typographyLeft + geo.quoteBlockWidth <= 832 &&
      geo.stageTop >= 342 &&
      stageBottom <= 1538 &&
      noVerticalOverlap
    );
  });
  assertCheck(
    unitChecks,
    'P1 4 Archetype bố cục khớp 100% Safe Zone, không chồng chéo & luôn giữ Line đỏ dọc theo chữ',
    allLayoutsSafe,
    'Kiểm tra lại resolveLayoutGeometry'
  );

  const hexToLum = (hex) => {
    const clean = hex.replace('#', '');
    const chan = [0, 2, 4].map((i) => {
      const c = parseInt(clean.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2];
  };
  const contrastRatio = (a, b) => {
    const la = hexToLum(a);
    const lb = hexToLum(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };
  const palettesSplitAccentOk = Object.values(THEME_PALETTES).every(
    (pal) => Boolean(pal.accentText && pal.accentProp && pal.accentText !== pal.accentProp)
  );
  const darkPal = THEME_PALETTES.WARM_NOIR;
  const warmNoirPal = THEME_PALETTES.WARM_NOIR;
  const darkWcagMetrics = {
    inkPrimary: Number(contrastRatio(darkPal.background, darkPal.inkPrimary).toFixed(2)),
    inkSecondary: Number(contrastRatio(darkPal.background, darkPal.inkSecondary).toFixed(2)),
    accentText: Number(contrastRatio(darkPal.background, darkPal.accentText).toFixed(2)),
    accentProp: Number(contrastRatio(darkPal.background, darkPal.accentProp).toFixed(2)),
  };
  const warmNoirWcagMetrics = {
    inkPrimary: Number(contrastRatio(warmNoirPal.background, warmNoirPal.inkPrimary).toFixed(2)),
    inkSecondary: Number(contrastRatio(warmNoirPal.background, warmNoirPal.inkSecondary).toFixed(2)),
    accentText: Number(contrastRatio(warmNoirPal.background, warmNoirPal.accentText).toFixed(2)),
    accentProp: Number(contrastRatio(warmNoirPal.background, warmNoirPal.accentProp).toFixed(2)),
  };
  const darkClassifierOk =
    Object.keys(THEME_PALETTES).length === 3 &&
    isDarkThemePalette('WARM_NOIR') &&
    !isDarkThemePalette('MINIMAL_LIGHT') &&
    !isDarkThemePalette('MINIMAL_DARK');
  assertCheck(
    unitChecks,
    'Optical Patch V8.6.1: 3 bảng màu tách accentText/accentProp, phân loại 2 sáng / 1 tối (WARM_NOIR) đạt WCAG',
    palettesSplitAccentOk &&
      darkClassifierOk &&
      darkWcagMetrics.inkPrimary >= 12 &&
      darkWcagMetrics.inkSecondary >= 7.5 &&
      darkWcagMetrics.accentText >= 4.5 &&
      darkWcagMetrics.accentProp >= 4.0 &&
      warmNoirWcagMetrics.inkPrimary >= 12 &&
      warmNoirWcagMetrics.inkSecondary >= 7.5 &&
      warmNoirWcagMetrics.accentText >= 4.5 &&
      warmNoirWcagMetrics.accentProp >= 4.0,
    JSON.stringify({ darkClassifierOk, darkWcagMetrics, warmNoirWcagMetrics })
  );

  const glowClassic = resolveVisualDNA({
    id: 'quote-099',
    pivotWord: 'tĩnh lặng',
    themeId: 'WARM_NOIR',
    visualDNA: { mode: 'CUSTOM', layout: 'CLASSIC_TOP_STAGE' },
  });
  const glowBottom = resolveVisualDNA({
    id: 'quote-099',
    pivotWord: 'tĩnh lặng',
    themeId: 'WARM_NOIR',
    visualDNA: { mode: 'CUSTOM', layout: 'SKY_QUOTE_BOTTOM_STAGE' },
  });
  const glowAsym = resolveVisualDNA({
    id: 'quote-099',
    pivotWord: 'tĩnh lặng',
    themeId: 'WARM_NOIR',
    visualDNA: { mode: 'CUSTOM', layout: 'ASYMMETRIC_THIRD', shotMode: 'MACRO_PROP' },
  });
  assertCheck(
    unitChecks,
    'Optical Patch: Neo động Radial Glow (cx, cy) theo từng Layout & khóa Legacy Chén 01-07 tại (50, 44)',
    glowClassic.vignetteCenter.yPct < 36 &&
      glowBottom.vignetteCenter.yPct > 60 &&
      glowAsym.vignetteCenter.xPct < 38 &&
      vdnaLegacy.vignetteCenter.xPct === 50 &&
      vdnaLegacy.vignetteCenter.yPct === 44,
    JSON.stringify({
      classic: glowClassic.vignetteCenter,
      bottom: glowBottom.vignetteCenter,
      asym: glowAsym.vignetteCenter,
      legacy: vdnaLegacy.vignetteCenter,
    })
  );

  const bgSource = fs.readFileSync(
    path.join(ROOT, 'src/components/MinimalistBackground.tsx'),
    'utf8'
  );
  const hasIllegalBlur = /feGaussianBlur|filter\s*:\s*['"`]?[^;]*blur\(/i.test(
    bgSource
  );
  assertCheck(
    unitChecks,
    'P1 B.2 MinimalistBackground không dùng feGaussianBlur / CSS filter:blur',
    !hasIllegalBlur,
    'MinimalistBackground.tsx chứa blur filter gây nghẽn Chromium 60fps'
  );

  // 4c. Unit Tests Studio V8.5 P2 (suggestDistinctVisualDNA & Anti-Repeat Sequence Detector)
  const sampleP2Props = {
    id: 'quote-099',
    pivotWord: 'tĩnh lặng',
    themeId: 'WARM_NOIR',
    visualDNA: {
      mode: 'CUSTOM',
      layout: 'WINDOW_FRAME',
      lightingGobo: 'WARM_LANTERN',
      shotMode: 'SOLID_SCENE',
      pivotMechanic: 'SPOTLIGHT_DIM',
      horizonOffsetPx: 0,
      forceSolidStyle: true,
    },
  };
  const suggestedP2 = suggestDistinctVisualDNA(
    sampleP2Props,
    spreadScript,
    ['WINDOW_FRAME'],
    ['WARM_LANTERN'],
    1
  );
  const resolvedSuggestedP2 = resolveVisualDNA(
    { ...sampleP2Props, visualDNA: suggestedP2 },
    spreadScript
  );
  assertCheck(
    unitChecks,
    'P2 suggestDistinctVisualDNA sinh biến thể CUSTOM mới khác avoidLayouts & tuân thủ B.3',
    suggestedP2.mode === 'CUSTOM' &&
      suggestedP2.layout !== 'WINDOW_FRAME' &&
      suggestedP2.lightingGobo !== 'WARM_LANTERN' &&
      resolvedSuggestedP2.downgradedAsymmetricThird === false,
    JSON.stringify(suggestedP2)
  );

  const syntheticDupWarnings = detectVisualDnaSequenceWarnings([
    {
      id: 'quote-007',
      cupNumber: '07',
      status: 'completed',
      progress: 100,
      captionText: '',
      props: {
        id: 'quote-007',
        themeId: 'MINIMAL_LIGHT',
        segments: ['a'],
        pivotWord: 'a',
        motion: { archetype: 'BOULDER_TO_BENCH' },
      },
    },
    {
      id: 'quote-008',
      cupNumber: '08',
      status: 'draft',
      progress: 0,
      captionText: '',
      props: {
        id: 'quote-008',
        themeId: 'MINIMAL_LIGHT',
        segments: ['b'],
        pivotWord: 'b',
        motion: { archetype: 'BOULDER_TO_BENCH' },
        visualDNA: { mode: 'CUSTOM', layout: 'CLASSIC_TOP_STAGE' },
      },
    },
    {
      id: 'quote-009',
      cupNumber: '09',
      status: 'draft',
      progress: 0,
      captionText: '',
      props: {
        id: 'quote-009',
        themeId: 'MINIMAL_LIGHT',
        segments: ['c'],
        pivotWord: 'c',
        motion: { archetype: 'BOULDER_TO_BENCH' },
        visualDNA: { mode: 'CUSTOM', layout: 'CLASSIC_TOP_STAGE' },
      },
    },
  ]);
  const hasDupLayoutWarn = syntheticDupWarnings.some(
    (w) => w.code === 'CONSECUTIVE_LAYOUT'
  );
  const hasLightStreakWarn = syntheticDupWarnings.some(
    (w) => w.code === 'MONOTONE_LIGHT_STREAK'
  );
  const warmNoirBreakWarnings = detectVisualDnaSequenceWarnings([
    {
      id: 'quote-008',
      cupNumber: '08',
      status: 'draft',
      progress: 0,
      captionText: '',
      props: {
        id: 'quote-008',
        themeId: 'MINIMAL_LIGHT',
        segments: ['a'],
        pivotWord: 'a',
        motion: { archetype: 'BOULDER_TO_BENCH' },
        visualDNA: { mode: 'CUSTOM', layout: 'CLASSIC_TOP_STAGE' },
      },
    },
    {
      id: 'quote-009',
      cupNumber: '09',
      status: 'draft',
      progress: 0,
      captionText: '',
      props: {
        id: 'quote-009',
        themeId: 'WARM_NOIR',
        segments: ['b'],
        pivotWord: 'b',
        motion: { archetype: 'BOULDER_TO_BENCH' },
        visualDNA: { mode: 'CUSTOM', layout: 'SKY_QUOTE_BOTTOM_STAGE' },
      },
    },
    {
      id: 'quote-010',
      cupNumber: '10',
      status: 'draft',
      progress: 0,
      captionText: '',
      props: {
        id: 'quote-010',
        themeId: 'MINIMAL_LIGHT',
        segments: ['c'],
        pivotWord: 'c',
        motion: { archetype: 'BOULDER_TO_BENCH' },
        visualDNA: { mode: 'CUSTOM', layout: 'WINDOW_FRAME' },
      },
    },
  ]);
  const warmNoirBreaksLightStreak = !warmNoirBreakWarnings.some(
    (w) => w.code === 'MONOTONE_LIGHT_STREAK'
  );

  // 5. Kiểm toán thực tế trên thư mục data/cups/*.json (Hướng 2) & data/airtable-cache.json
  const storeInfo = loadAllCupsForAudit();
  const realDnaWarnings = detectVisualDnaSequenceWarnings(
    storeInfo.items.map((item) => item.cup)
  );
  assertCheck(
    unitChecks,
    'P2 Anti-Repeat Detector bắt đúng trùng layout & chuỗi nền sáng (WARM_NOIR ngắt chuỗi sáng & kho Chén sạch)',
    hasDupLayoutWarn &&
      hasLightStreakWarn &&
      warmNoirBreaksLightStreak &&
      realDnaWarnings.length === 0,
    JSON.stringify({
      hasDupLayoutWarn,
      hasLightStreakWarn,
      warmNoirBreaksLightStreak,
      realWarnings: realDnaWarnings.map((w) => w.message),
    })
  );

  // 4d. Unit Tests Gemini Skill V8.5 (Template Schema, normalizeThemeId, PKZIP & Sync với .agents/docs)
  const parsedGeminiTemplate = sanitizeAndNormalizeCupBundle(GEMINI_SKILL_TEMPLATE_JSON);
  assertCheck(
    unitChecks,
    'Gemini Skill V8.6 Template JSON hợp lệ (v8.6, AUTO_SEED, PIVOT_ACCENT, visualDNA CUSTOM tường minh V8.6.1, không cảnh báo headroom)',
    parsedGeminiTemplate.bundleVersion === '8.6' &&
      parsedGeminiTemplate.durationMode === 'AUTO_SEED' &&
      parsedGeminiTemplate.audioMode === 'PIVOT_ACCENT' &&
      parsedGeminiTemplate.visualDNA?.mode === 'CUSTOM' &&
      parsedGeminiTemplate.visualDNA?.forceSolidStyle === true &&
      parsedGeminiTemplate.layoutWarnings.length === 0,
    JSON.stringify({
      bundleVersion: parsedGeminiTemplate.bundleVersion,
      durationMode: parsedGeminiTemplate.durationMode,
      audioMode: parsedGeminiTemplate.audioMode,
      visualDNA: parsedGeminiTemplate.visualDNA,
      layoutWarnings: parsedGeminiTemplate.layoutWarnings,
    })
  );

  const probeTheme = (themeInput) =>
    sanitizeAndNormalizeCupBundle({
      segments: ['Dòng một thử nghiệm', 'Dòng hai điểm lật'],
      pivotWord: 'điểm lật',
      themeId: themeInput,
    }).themeId;
  assertCheck(
    unitChecks,
    'Gemini normalizeThemeId V8.6.1 ánh xạ mã cũ về 3 bảng màu (DARK_CONTEMPLATIVE / WARM_DARK / DARK_NIGHT -> WARM_NOIR)',
    probeTheme('DARK_CONTEMPLATIVE') === 'WARM_NOIR' &&
      probeTheme('WARM_NOIR') === 'WARM_NOIR' &&
      probeTheme('WARM_DARK') === 'WARM_NOIR' &&
      probeTheme('DARK_NIGHT') === 'WARM_NOIR' &&
      probeTheme('MINIMAL_DARK') === 'MINIMAL_DARK',
    JSON.stringify({
      DARK_CONTEMPLATIVE: probeTheme('DARK_CONTEMPLATIVE'),
      WARM_NOIR: probeTheme('WARM_NOIR'),
      WARM_DARK: probeTheme('WARM_DARK'),
      DARK_NIGHT: probeTheme('DARK_NIGHT'),
      MINIMAL_DARK: probeTheme('MINIMAL_DARK'),
    })
  );

  const skillZipBytes = buildGeminiSkillZipBytes();
  const skillZipText = new TextDecoder('utf-8').decode(skillZipBytes);
  const syncedSkillMdPath = path.join(ROOT, '.agents/skills/dao-dien-tra-nguoi/SKILL.md');
  const syncedZipPath = path.join(ROOT, 'docs/dao-dien-tra-nguoi.zip');
  const syncedSkillMatches =
    fs.existsSync(syncedSkillMdPath) &&
    fs.readFileSync(syncedSkillMdPath, 'utf8') === GEMINI_SKILL_MD &&
    fs.existsSync(syncedZipPath) &&
    Buffer.from(skillZipBytes).equals(fs.readFileSync(syncedZipPath));
  assertCheck(
    unitChecks,
    'Gemini Skill V8.6.1 PKZIP & đồng bộ .agents/docs chứa đủ tham chiếu V8.6',
    skillZipBytes[0] === 0x50 &&
      skillZipBytes[1] === 0x4b &&
      skillZipBytes[2] === 0x03 &&
      skillZipBytes[3] === 0x04 &&
      skillZipText.includes('SKILL.md') &&
      skillZipText.includes('references/physics-and-props-v85.md') &&
      skillZipText.includes('assets/cup-bundle-v85-template.json') &&
      GEMINI_SKILL_MD.includes('WARM_NOIR') &&
      GEMINI_SKILL_MD.includes('AUTO_SEED') &&
      GEMINI_SKILL_MD.includes('PIVOT_ACCENT') &&
      GEMINI_SKILL_MD.includes('CupBundle V8.6') &&
      syncedSkillMatches,
    JSON.stringify({
      zipMagic: Array.from(skillZipBytes.slice(0, 4)),
      zipLength: skillZipBytes.length,
      syncedSkillMatches,
    })
  );
  const airtablePath = path.join(ROOT, 'data/airtable-cache.json');
  const airtable = fs.existsSync(airtablePath) ? JSON.parse(fs.readFileSync(airtablePath, 'utf8')) : null;

  const trackerTable = (airtable?.tables || []).find((t) => t.name === 'Tủ Chén & Lịch Đăng');
  const trackerRecords = trackerTable?.records || [];

  const findTrackerRecord = (cupNo) =>
    trackerRecords.find((r) =>
      new RegExp(`^Chén\\s*0?${Number(cupNo)}\\b`, 'i').test(String(r.fields?.['Mã Chén'] || ''))
    );

  const hardViolations = [];
  const warnings = [];

  if (storeInfo.mode === 'legacy-monolith') {
    const msg = 'Cấu trúc lưu trữ: Vẫn còn tệp đơn data/cups.json cũ chưa tách sang thư mục data/cups/quote-XXX.json (chạy npm run sync:v831 để di trú)';
    warnings.push(msg);
    ghAnnotate('warning', `Gate 2: ${msg}`, 'data/cups.json', 1);
  }

  const pillarCounts = {
    office_wordplay: 0,
    contemplative_healing: 0,
    subtle_romance: 0,
    author_literature: 0,
  };

  const cupAudits = storeInfo.items.map((entry, idx) => {
    const { cup, sourceFile, hasInlineBloat } = entry;
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

    if (storeInfo.mode === 'per-cup-dir' && hasInlineBloat) {
      const msg = `Chén ${cupNo} (${sourceFile}): Còn nhúng trùng stageScript trực tiếp trong tệp Chén`;
      hardViolations.push(msg);
      ghAnnotate('error', `Gate 2: ${msg}`, sourceFile, 1);
    }

    if ((syl.count > SYLLABLE_CEILING && !hasAuthor) || syl.count === 0) {
      const msg = `Chén ${cupNo} (${p.title}): ${syl.count} âm tiết — vượt trần ${SYLLABLE_CEILING} âm tiết của khung 15s`;
      hardViolations.push(msg);
      ghAnnotate('error', `Gate 2: ${msg}`, sourceFile, 1);
    } else if (syl.band !== 'optimal') {
      const msg = `Chén ${cupNo} (${p.title}): ${syl.count} âm tiết (${syl.label})`;
      warnings.push(msg);
      ghAnnotate('warning', `Gate 2: ${msg}`, sourceFile, 1);
    }

    if (!seoAudit.isClean) {
      const msg = `Chén ${cupNo} (${p.title}): Caption SEO không đạt chuẩn (${JSON.stringify(seoAudit)})`;
      hardViolations.push(msg);
      ghAnnotate('error', `Gate 2: ${msg}`, sourceFile, 1);
    }

    if (!seoSlugValid) {
      const msg = `Chén ${cupNo} (${p.title}): Tên file SEO không khớp chuẩn (${computedSeoFile})`;
      hardViolations.push(msg);
      ghAnnotate('error', `Gate 2: ${msg}`, sourceFile, 1);
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
      sourceFile,
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
  for (const { cup, sourceFile } of storeInfo.items) {
    const norm = (cup.props?.segments || []).join(' ').replace(/\s+/g, ' ').trim().toLowerCase();
    if (!norm) continue;
    if (seenQuotes.has(norm)) {
      const msg = `Trùng lặp nội dung nguyên văn giữa Chén ${seenQuotes.get(norm)} và Chén ${cup.cupNumber}`;
      warnings.push(msg);
      ghAnnotate('warning', `Gate 2: ${msg}`, sourceFile, 1);
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
    ghAnnotate('warning', `Gate 2: ${msg}`);
  }

  // Kiểm chứng đa dạng hóa visualDNA trên nhóm Chén chưa xuất (08–13)
  const unpublished08Plus = storeInfo.items
    .filter(({ cup }) => !isLegacyPublishedCupId(cup.id))
    .map(({ cup }) => {
      const p = cup.props || {};
      const sc = resolveStageScript(
        p.motion?.sceneId || p.motion?.archetype,
        p.motion?.stageScript
      );
      return {
        cupNumber: cup.cupNumber,
        vdna: resolveVisualDNA(p, sc),
      };
    });
  const distinctLayouts = new Set(unpublished08Plus.map((x) => x.vdna.layout));
  const distinctGobos = new Set(unpublished08Plus.map((x) => x.vdna.lightingGobo));
  assertCheck(
    unitChecks,
    'P1 Đa dạng hóa visualDNA trên Chén 08–13 (>=3 layout & >=3 gobo)',
    unpublished08Plus.length === 0 ||
      (distinctLayouts.size >= 3 && distinctGobos.size >= 3),
    JSON.stringify({
      layouts: Array.from(distinctLayouts),
      gobos: Array.from(distinctGobos),
    })
  );

  const allUnitsPass = unitChecks.every((u) => u.pass);
  const pass = allUnitsPass && hardViolations.length === 0;

  const gate2Result = {
    pass,
    storageMode: storeInfo.mode,
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
  lines.push(`- **Cấu trúc lưu trữ Chén**: \`${g2?.storageMode || 'unknown'}\``);
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

  lines.push('## 2. Gate 2 — Thuật toán Âm tiết (trần 40), Hướng 1 (0.35s & Loop), SEO, Bình luận mồi, `TN-Score` & `40-30-20-10`');
  if (!g2) {
    lines.push('_Không tìm thấy dữ liệu Gate 2._');
  } else {
    const passedUnits = g2.unitChecks.filter((u) => u.pass).length;
    lines.push(`- **Trạng thái Gate 2**: ${g2.pass ? '✅ PASS' : '❌ FAIL'}`);
    lines.push(`- **Unit Tests thuật toán cốt lõi**: \`${passedUnits}/${g2.unitChecks.length}\` PASS (Chuẩn \`60 fps\`, Safe Đa Kênh \`158..832px\` & 3:4 \`Y>=268\`, Hướng 1 \`0.35s / Loop\` + \`AUTO_SEED\` B.1, Trần \`40 âm tiết\`, Mốc \`TN-Score = ${g2.tnScoreBenchmarks.baseline100}đ\`)`);
    lines.push('');
    lines.push('### Bảng kiểm toán từng Chén');
    lines.push('');
    lines.push('| Chén | Tệp nguồn | Tiêu đề | Pivot | Âm tiết | Phân hạng | File SEO | Caption SEO |');
    lines.push('| :--- | :--- | :--- | :--- | ---: | :--- | :--- | :--- |');
    for (const c of g2.cupAudits) {
      const bandBadge = c.syllables > SYLLABLE_CEILING ? `❌ ${c.syllableLabel}` : c.syllableBand === 'optimal' ? `✅ ${c.syllableLabel}` : `⚠️ ${c.syllableLabel}`;
      const seoBadge = c.seoClean && c.seoSlugValid ? `✅ (${c.hashtagCount} tags)` : '❌ Lỗi SEO';
      lines.push(
        `| **Chén ${c.cupNo}** | \`${c.sourceFile}\` | ${c.title} | \`${c.pivotWord}\` | \`${c.syllables}\` | ${bandBadge} | \`${c.seoFile}\` | ${seoBadge} |`
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
