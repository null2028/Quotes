/**
 * check-goi — Kiểm tra một file JSON Gói Chén.
 * Cách dùng: npx tsx scripts/check-goi.mjs <file.json>
 *
 * In ra OK hoặc danh sách lỗi (mỗi lỗi 1 dòng tiếng Việt).
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseGoiChen } from '../src/stage/goiChenParser.ts';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Cách dùng: npx tsx scripts/check-goi.mjs <file.json>');
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

const result = parseGoiChen(raw);

if (result.ok) {
  console.log('✅ OK');
} else {
  console.log(`❌ ${result.errors.length} lỗi:`);
  for (const err of result.errors) {
    console.log(`  • ${err}`);
  }
  process.exit(1);
}
