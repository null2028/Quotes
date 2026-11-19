/**
 * check-goi — Kiểm tra một file JSON Gói Chén hoặc kịch bản Làn tự do (`che_do: "tu_do"`).
 * Cách dùng:
 *   npx tsx scripts/check-goi.mjs <file.json> [sceneId]
 *
 * Tự nhận dạng:
 * - Gói Chén (`phien_ban_goi: 1`): kiểm tra đầy đủ theo `parseGoiChen`.
 * - Làn tự do (`che_do: "tu_do"` — file StageScript trực tiếp, CupBundle/CupRecord bọc `stageScript`,
 *   hoặc key `<sceneId>` trong `data/stage-scripts.json`): kiểm tra vỡ hình mỗi 0.25s,
 *   in rõ lỗi chặn cứng (exit 1) và cảnh báo vàng kèm thời điểm `t` (không chặn, exit 0).
 */
import fs from 'node:fs';
import path from 'node:path';
import { computeTimelineSync } from '../src/engine/timelineSync.ts';
import { resolveVisualDNA } from '../src/engine/visualDnaResolver.ts';
import { isGoiChen, parseGoiChen } from '../src/stage/goiChenParser.ts';
import { StageScriptSchema } from '../src/stage/stageScriptSchema.ts';
import { validateStageScriptHard } from '../src/stage/stageValidator.ts';

const filePath = process.argv[2];
const sceneIdArg = process.argv[3];
if (!filePath) {
  console.error('Cách dùng: npx tsx scripts/check-goi.mjs <file.json> [sceneId]');
  process.exit(1);
}

const absPath = path.resolve(filePath);
if (!fs.existsSync(absPath)) {
  console.error(`Không tìm thấy file: ${absPath}`);
  process.exit(1);
}

let raw;
try {
  raw = JSON.parse(fs.readFileSync(absPath, 'utf8'));
} catch (e) {
  console.error(`JSON không hợp lệ: ${e.message}`);
  process.exit(1);
}

// Hỗ trợ chỉ định key sceneId khi đọc file map như data/stage-scripts.json
let target = raw;
if (sceneIdArg && raw && typeof raw === 'object' && !Array.isArray(raw)) {
  if (!(sceneIdArg in raw)) {
    console.error(`Không tìm thấy "${sceneIdArg}" trong ${filePath}`);
    process.exit(1);
  }
  target = raw[sceneIdArg];
}

function extractFreeModeInput(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
  if (obj.che_do === 'tu_do') {
    return { scriptRaw: obj, cupMeta: null };
  }
  if (obj.stageScript && typeof obj.stageScript === 'object' && obj.stageScript.che_do === 'tu_do') {
    return { scriptRaw: obj.stageScript, cupMeta: obj };
  }
  if (
    obj.motion &&
    typeof obj.motion === 'object' &&
    obj.motion.stageScript &&
    typeof obj.motion.stageScript === 'object' &&
    obj.motion.stageScript.che_do === 'tu_do'
  ) {
    return { scriptRaw: obj.motion.stageScript, cupMeta: obj };
  }
  if (
    obj.props &&
    typeof obj.props === 'object' &&
    obj.props.motion &&
    typeof obj.props.motion === 'object' &&
    obj.props.motion.stageScript &&
    typeof obj.props.motion.stageScript === 'object' &&
    obj.props.motion.stageScript.che_do === 'tu_do'
  ) {
    return { scriptRaw: obj.props.motion.stageScript, cupMeta: obj.props };
  }
  return null;
}

if (isGoiChen(target)) {
  const result = parseGoiChen(target);
  const durNote =
    result.durationSeconds !== undefined
      ? ` (thời lượng: ${result.durationSeconds.toFixed(1)}s · ${result.durationInFrames}f · AUTO_SEED)`
      : '';

  if (result.ok) {
    console.log(`✅ OK${durNote}`);
    if (result.warnings && result.warnings.length > 0) {
      for (const w of result.warnings) {
        console.log(`  ⚠️ ${w}`);
      }
    }
  } else {
    console.log(`❌ ${result.errors.length} lỗi${durNote}:`);
    for (const err of result.errors) {
      console.log(`  • ${err}`);
    }
    process.exit(1);
  }
  process.exit(0);
}

const freeExtracted = extractFreeModeInput(target);
if (freeExtracted) {
  const parsedScript = StageScriptSchema.safeParse(freeExtracted.scriptRaw);
  if (!parsedScript.success) {
    console.log('❌ Lỗi cấu trúc StageScript làn tự do:');
    for (const iss of parsedScript.error.issues) {
      console.log(`  • [${iss.path.join('.') || 'root'}] ${iss.message}`);
    }
    process.exit(1);
  }

  const script = parsedScript.data;
  const cupMeta = freeExtracted.cupMeta;
  const segments =
    Array.isArray(cupMeta?.segments) && cupMeta.segments.length > 0
      ? cupMeta.segments.map(String)
      : [
          'Chỉ có hai cách để sống một cuộc đời:',
          'Một là chẳng có gì là kỳ diệu.',
          'Hai là xem mọi thứ đều là điều kỳ diệu.',
        ];
  const pivotWord = String(cupMeta?.pivotWord || 'điều kỳ diệu').replace(/[!?.…]+$/u, '');
  const durationMode = cupMeta?.durationMode || 'AUTO_SEED';
  const tlProps = {
    id: cupMeta?.id || script.sceneId || path.basename(absPath, '.json'),
    textFormat: cupMeta?.textFormat === 'PROSE' ? 'PROSE' : 'POEM',
    segments,
    pivotWord,
    highlightStyle: 'BOTH',
    targetDurationSeconds: Number(cupMeta?.targetDurationSeconds) || 15,
    durationMode,
    typingSpeedMsPerChar: 55,
    holdAfterFinishSeconds: 5.5,
    themeId: cupMeta?.themeId || 'MINIMAL_LIGHT',
    motion: {
      archetype: 'BOULDER_TO_BENCH',
      pacingMode: 'CONTEMPLATIVE',
      stateA: { intensity: 0.8, spread: 0.2, tiltDeg: -16 },
      stateB: { intensity: 0.1, spread: 0.75, tiltDeg: 0 },
    },
    bgm: { audioMode: 'NONE', foleyPivotStyle: 'AUTO' },
    brandText: 'TRÀ NGUỘI',
  };
  const timeline = computeTimelineSync(tlProps);
  const vdna = resolveVisualDNA(tlProps, script);
  const res = validateStageScriptHard(script, timeline, vdna);

  const durSec = (timeline.durationInFrames / timeline.fps).toFixed(1);
  const label = script.sceneId || path.basename(absPath, '.json');
  const warnings = res.warnings ?? [];

  if (res.valid) {
    console.log(
      `✅ QUA [Làn tự do · ${label}] (0 lỗi chặn cứng, ${warnings.length} cảnh báo vàng · thời lượng: ${durSec}s · ${timeline.durationInFrames}f · ${durationMode})`
    );
  } else {
    console.log(
      `❌ CHẶN [Làn tự do · ${label}] (${res.issues.length} lỗi chặn cứng, ${warnings.length} cảnh báo vàng · thời lượng: ${durSec}s · ${timeline.durationInFrames}f · ${durationMode})`
    );
    for (const err of res.issues) {
      console.log(`  🛑 [${err.code}] ${err.message}`);
    }
  }
  if (warnings.length > 0) {
    for (const w of warnings) {
      console.log(`  ⚠️ [${w.code}] ${w.message}`);
    }
  }
  process.exit(res.valid ? 0 : 1);
}

// Fallback: vẫn thử parseGoiChen để báo lỗi định dạng chuẩn cho file Gói Chén bị thiếu trường
const fallbackRes = parseGoiChen(target);
console.log(`❌ ${fallbackRes.errors.length} lỗi:`);
for (const err of fallbackRes.errors) {
  console.log(`  • ${err}`);
}
process.exit(1);
