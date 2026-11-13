import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const { auditVietnameseSyllables } = await import('../src/engine/timelineSync.ts');
const { generateSeedCommentForCup, auditTikTokSeoCaption } = await import(
  '../src/automation/captionBuilder.ts'
);
const { formatCupSeoFileName } = await import('../src/automation/fileNaming.ts');

const CHEN_09_SEGMENTS = [
  'Tưởng rằng năm tháng đã xa,',
  'Chợt nghe câu hát chiều qua phố người.',
  'Chuyện xưa chẳng nói một lời,',
  'Mà bên ghế trống… vẫn ngồi đợi ta.',
];
const CHEN_09_PIVOT = 'vẫn ngồi đợi ta';
const CHEN_09_CAPTION =
  'Có những giai điệu chẳng hẹn trước, chỉ vô tình vang lên giữa phố chiều cũng đủ làm bước chân chậm lại.\nCó góc phố nào bạn đi ngang vẫn thấy ký ức lặng lẽ đợi mình ở đó chưa?\n\n#tranguoi #kyuc #hoainiem #lucbat #tamtrang';

// 1. Cập nhật data/cups.json: dọn sạch .mp3 ở tất cả các Chén & chốt Bản Thơ 3 cho Chén 09
const cupsPath = path.join(ROOT, 'data/cups.json');
const cups = JSON.parse(fs.readFileSync(cupsPath, 'utf8'));
let cleanedMp3Count = 0;

for (const cup of cups) {
  if (cup.props?.bgm) {
    if ('fileName' in cup.props.bgm || 'startFromSeconds' in cup.props.bgm || 'volume' in cup.props.bgm) {
      cleanedMp3Count += 1;
    }
    cup.props.bgm = {
      audioMode: 'FOLEY_MASTER',
      foleyPivotStyle: cup.props.bgm.foleyPivotStyle || 'AUTO',
    };
  }

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

fs.writeFileSync(cupsPath, JSON.stringify(cups, null, 2) + '\n', 'utf8');

// 2. Đồng bộ data/airtable-cache.json (Q042 & bản ghi Chén 09 trên Tủ Chén & Lịch Đăng)
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
  fs.writeFileSync(airtablePath, JSON.stringify(airtable, null, 2) + '\n', 'utf8');
}

// 3. Đồng bộ nhãn tooltip trần 40 âm tiết trong StoryDirectorDesk.tsx
const deskPath = path.join(ROOT, 'studio-ui/src/components/StoryDirectorDesk.tsx');
if (fs.existsSync(deskPath)) {
  const deskRaw = fs.readFileSync(deskPath, 'utf8');
  const deskUpdated = deskRaw
    .replace(/trần tối đa 36 âm tiết/g, 'trần tối đa 40 âm tiết')
    .replace(/vượt trần 36 âm tiết/g, 'vượt trần 40 âm tiết');
  if (deskUpdated !== deskRaw) {
    fs.writeFileSync(deskPath, deskUpdated, 'utf8');
  }
}

const sylAudit = auditVietnameseSyllables(CHEN_09_SEGMENTS);
const capAudit = auditTikTokSeoCaption(CHEN_09_CAPTION, CHEN_09_SEGMENTS);
console.log('✅ Đã đồng bộ hoàn tất dữ liệu Studio V8.3.1:');
console.log(`   • Đã dọn sạch khóa .mp3 tồn dư trên ${cleanedMp3Count} Chén (bao gồm Chén 08).`);
console.log(`   • Chén 09 (Bản Thơ 3): ${sylAudit.count} âm tiết — ${sylAudit.label} | pivotWord: "${CHEN_09_PIVOT}"`);
console.log(`   • Kiểm định SEO Chén 09: isClean=${capAudit.isClean} (${capAudit.hashtagCount} hashtags).`);
