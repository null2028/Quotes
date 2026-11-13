import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const {
  ensureCupsDirectoryMigrated,
  loadThinCupsFromDisk,
  saveCups,
  CUPS_DIR_PATH,
} = await import('../server/cupStore.ts');
const { loadStageScriptsMap, saveStageScriptsMap } = await import(
  '../server/sceneManagerService.ts'
);
const { auditVietnameseSyllables } = await import(
  '../src/engine/timelineSync.ts'
);
const { generateSeedCommentForCup, auditTikTokSeoCaption } = await import(
  '../src/automation/captionBuilder.ts'
);
const { formatCupSeoFileName } = await import(
  '../src/automation/fileNaming.ts'
);

const CHEN_09_SEGMENTS = [
  'Tưởng rằng năm tháng đã xa,',
  'Chợt nghe câu hát chiều qua phố người.',
  'Chuyện xưa chẳng nói một lời,',
  'Mà bên ghế trống… vẫn ngồi đợi ta.',
];
const CHEN_09_PIVOT = 'vẫn ngồi đợi ta';
const CHEN_09_CAPTION =
  'Có những giai điệu chẳng hẹn trước, chỉ vô tình vang lên giữa phố chiều cũng đủ làm bước chân chậm lại.\nCó góc phố nào bạn đi ngang vẫn thấy ký ức lặng lẽ đợi mình ở đó chưa?\n\n#tranguoi #kyuc #hoainiem #lucbat #tamtrang';

// 1. Tự động di trú data/cups.json -> data/cups/quote-XXX.json (Hướng 2) & làm gọn stage-scripts.json
ensureCupsDirectoryMigrated();
const scriptsMap = loadStageScriptsMap();
if (Object.keys(scriptsMap).length > 0) {
  saveStageScriptsMap(scriptsMap);
}

// 2. Dọn sạch khóa .mp3 tồn dư (Chén 08) & chốt Bản Thơ 3 (28 âm tiết) cho Chén 09
const cups = loadThinCupsFromDisk();
for (const cup of cups) {
  cup.props.bgm = {
    audioMode: 'FOLEY_MASTER',
    foleyPivotStyle: cup.props.bgm?.foleyPivotStyle || 'AUTO',
  };

  if (cup.id === 'quote-009' || cup.cupNumber === '09') {
    cup.props.textFormat = 'POEM';
    cup.props.fontSizeScale = 1;
    cup.props.segments = CHEN_09_SEGMENTS;
    cup.props.pivotWord = CHEN_09_PIVOT;
    cup.props.customCaption = CHEN_09_CAPTION;
    cup.captionText = CHEN_09_CAPTION;
    const seoSlug = formatCupSeoFileName('09', {
      title: cup.props.title || 'Ký ức',
      pivotWord: CHEN_09_PIVOT,
      mood: cup.props.publishMood || 'Hoài niệm',
      topic: cup.props.publishTopic,
    });
    cup.seoFileName = `${seoSlug}.mp4`;
  }
}
saveCups(cups);

// 3. Đồng bộ data/airtable-cache.json (Q042 & bản ghi Chén 09 trên Tủ Chén & Lịch Đăng)
const airtablePath = path.join(ROOT, 'data/airtable-cache.json');
if (fs.existsSync(airtablePath)) {
  const airtable = JSON.parse(fs.readFileSync(airtablePath, 'utf8'));
  const cup09 = cups.find((c) => c.id === 'quote-009' || c.cupNumber === '09');
  const freshSeed = cup09 ? generateSeedCommentForCup(cup09.props) : '';

  for (const table of airtable.tables || []) {
    if (table.name === 'Poetry & Quote Library') {
      for (const rec of table.records || []) {
        if (rec.fields?.['ID'] === 'Q042') {
          rec.fields['Quote tinh chỉnh'] = CHEN_09_SEGMENTS.join('\n');
          rec.fields['Loại'] = 'Thơ';
        }
      }
    }
    if (table.name === 'Tủ Chén & Lịch Đăng') {
      for (const rec of table.records || []) {
        if (/^Chén\s*0?9\b/i.test(String(rec.fields?.['Mã Chén'] || ''))) {
          rec.fields['Lời dẫn trong video'] = `${CHEN_09_SEGMENTS.join('\n')} [Nhấn đỏ: ${CHEN_09_PIVOT}]`;
          rec.fields['Caption & Hashtag'] = CHEN_09_CAPTION;
          if (freshSeed) {
            rec.fields['Bình luận mồi'] = freshSeed;
          }
        }
      }
    }
  }
  fs.writeFileSync(
    airtablePath,
    JSON.stringify(airtable, null, 2) + '\n',
    'utf8'
  );
}

// 4. Đồng bộ nhãn tooltip trần 40 âm tiết trong StoryDirectorDesk.tsx
const deskPath = path.join(
  ROOT,
  'studio-ui/src/components/StoryDirectorDesk.tsx'
);
if (fs.existsSync(deskPath)) {
  const deskRaw = fs.readFileSync(deskPath, 'utf8');
  const deskUpdated = deskRaw
    .replace(/trần tối đa 36 âm tiết/g, 'trần tối đa 40 âm tiết')
    .replace(/vượt trần 36 âm tiết/g, 'vượt trần 40 âm tiết');
  if (deskUpdated !== deskRaw) {
    fs.writeFileSync(deskPath, deskUpdated, 'utf8');
  }
}

const cupFiles = fs
  .readdirSync(CUPS_DIR_PATH)
  .filter((f) => f.endsWith('.json'))
  .sort();
const totalCupBytes = cupFiles.reduce(
  (acc, f) => acc + fs.statSync(path.join(CUPS_DIR_PATH, f)).size,
  0
);
const sylAudit = auditVietnameseSyllables(CHEN_09_SEGMENTS);
const capAudit = auditTikTokSeoCaption(CHEN_09_CAPTION, CHEN_09_SEGMENTS);

console.log('✅ Đã tái cấu trúc xong Hướng 2 (data/cups/*.json) & đồng bộ V8.3.1:');
console.log(
  `   • Đã tách thành ${cupFiles.length} tệp trong data/cups/ — tổng dung lượng chỉ ${(totalCupBytes / 1024).toFixed(1)} KB (~${Math.round(totalCupBytes / Math.max(1, cupFiles.length))} B/Chén, xóa bỏ data/cups.json 325 KB cũ).`
);
console.log(
  `   • Chén 09 (Bản Thơ 3): ${sylAudit.count} âm tiết — ${sylAudit.label} | pivotWord: "${CHEN_09_PIVOT}"`
);
console.log(
  `   • Kiểm định SEO Chén 09: isClean=${capAudit.isClean} (${capAudit.hashtagCount} hashtags).`
);
