import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { BUILT_IN_PROP_CATALOG } from '../src/stage/propCatalog.tsx';
import {
  ANCHOR_KINDS,
  HE_SO_PHONG_DAI,
  NGUONG_VAT_NHO_CM,
  SEMANTIC_LAYERS,
  SEMANTIC_SLOTS,
  TY_LE_CANH,
} from '../src/stage/stageConstants.ts';
import {
  SEMANTIC_ACTOR_BEAT_VERBS,
  SEMANTIC_BEAT_ANCHORS,
  SEMANTIC_LEANS,
  SEMANTIC_POSES,
  SEMANTIC_PROP_BEAT_VERBS,
  SEMANTIC_SOCKETS,
  SEMANTIC_TERRAINS,
} from '../src/stage/semanticStage.ts';
import { AtmosphereTypeEnum } from '../src/stage/stageScriptSchema.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const SKILL_DIR = path.join(ROOT, '.agents/skills/dao-dien-tra-nguoi');
const REF_DIR = path.join(SKILL_DIR, 'references');
const SKILL_MD_PATH = path.join(SKILL_DIR, 'SKILL.md');
const REF_THU_VIEN_PATH = path.join(REF_DIR, 'thu-vien.md');
const REF_GOI_CHEN_PATH = path.join(REF_DIR, 'goi-chen.md');
const EXAMPLE_Q001_PATH = path.join(REF_DIR, 'q001.json');
const ZIP_PATH = path.join(SKILL_DIR, 'dao-dien-tra-nguoi.zip');

// ── Build thu-vien.md từ code ─────────────────────────────────────
function buildThuVienMd() {
  const fmtList = (arr) => arr.map((x) => `\`${x}\``).join(', ');
  const atmosphereTypes = AtmosphereTypeEnum.options;

  const lines = [
    '# Thư Viện Đạo Cụ & Động Từ Hợp Lệ — Trà Nguội (`propCatalog`)',
    '',
    '> Tệp sinh tự động từ mã nguồn qua `npm run gen:skill`. Chỉ dùng các tên đã duyệt dưới đây; tuyệt đối không tự vẽ đồ vật hay ghi toạ độ.',
    '',
    '## 1. Bối cảnh (`boi_canh`), Lớp sâu (`lop`), Loại neo (`loai_neo`) & Khe vị trí (`vi_tri`)',
    `- Địa hình (\`boi_canh.dia_hinh\`): ${fmtList(Object.keys(SEMANTIC_TERRAINS))}.`,
    `- Khí quyển (\`boi_canh.khi_quyen[].loai\`): ${fmtList(atmosphereTypes)} (kèm \`vi_tri\`, \`huong\`: \`trai\`/\`phai\`, \`mat_do\`).`,
    `- Lớp sâu (\`lop\`): ${fmtList(SEMANTIC_LAYERS)} (\`nen\` cho cửa sổ, mây phía sau; va chạm tính giữa các vật cùng lớp).`,
    `- Loại neo (\`loai_neo\`): ${fmtList(ANCHOR_KINDS)} (\`dat\`: mặt đất, \`tuong\`: treo tường, \`troi\`: bầu trời, \`tren\`: đặt trên điểm neo vật khác, \`cam\`: nhân vật cầm).`,
    `- Khe vị trí ngang (\`vi_tri\` / \`di_toi\`): ${fmtList(Object.keys(SEMANTIC_SLOTS))}.`,
    `- Quy tắc kích thước thật: vật dưới ${NGUONG_VAT_NHO_CM} cm nhân \`HE_SO_PHONG_DAI = ${HE_SO_PHONG_DAI}\`, từ ${NGUONG_VAT_NHO_CM} cm trở lên nhân \`1\` (\`TY_LE_CANH = ${TY_LE_CANH}\`).`,
    '',
    '## 2. Tư thế nhân vật (`tu_the`), Nghiêng (`nghieng`) & Cầm/Ngồi',
    `- Tư thế hợp lệ (\`tu_the\`): ${fmtList(Object.keys(SEMANTIC_POSES))}.`,
    `- Độ nghiêng (\`nghieng\`): ${fmtList(SEMANTIC_LEANS)}.`,
    `- Hướng mặt (\`huong\`): \`trai\`, \`phai\`. Hướng nhìn (\`nhin_theo\`): \`"<id_vat_hoac_nhan_vat>"\` hoặc \`null\`.`,
    `- Vị trí cầm đạo cụ (\`cam_boi\`): \`<id_nhan_vat>.tay\`, \`<id_nhan_vat>.dau\`, \`<id_nhan_vat>.lung\` (${fmtList(Object.keys(SEMANTIC_SOCKETS))}).`,
    '- Ngồi ghế bàn: bắt buộc `ngoi_tren: "<id_ghe>.mat_ghe"`; thêm `ngoi_vao: "<id_ban>"` để tự kê ghế sát bàn nhìn ngang.',
    '- Chén trà cầm tay (`cam_chen_tra: true`) mặc định màu mực.',
    '',
    '## 3. Nhịp & Bộ động từ hiện có (`nhip[]`)',
    `- Mốc thời gian (\`moc\`): ${fmtList(SEMANTIC_BEAT_ANCHORS)} (kèm \`sau\` và \`thoi_luong\` tính bằng giây).`,
    `- Động từ nhân vật (\`nhip[].nhan_vat.<id>\`): ${fmtList(SEMANTIC_ACTOR_BEAT_VERBS)}.`,
    `- Động từ đạo cụ (\`nhip[].dao_cu.<id>\`): ${fmtList(SEMANTIC_PROP_BEAT_VERBS)}.`,
    '',
    '## 4. Đạo cụ đã duyệt trong `propCatalog` (`duyet`)',
    '| Mã đạo cụ (`type`) | Nghĩa / Tên gọi | Lớp mặc định | Loại neo | Vật đỏ (`vat_do`) | Trạng thái (`trang_thai`) | Điểm neo (`<id>.<diem_neo>`) |',
    '| :--- | :--- | :---: | :--- | :---: | :--- | :--- |',
  ];

  for (const [typeName, def] of Object.entries(BUILT_IN_PROP_CATALOG)) {
    if (def.status !== 'duyet' || !def.box) continue;
    const anchors = Object.keys(def.anchors || {});
    const ancStr =
      anchors.length > 0
        ? anchors.map((a) => `\`${a}\``).join(', ')
        : '*(không có)*';
    const variants = ['mac_dinh', ...Object.keys(def.variants || {})];
    const varStr = variants.map((v) => `\`${v}\``).join(', ');
    const kinds = (def.allowedAnchorKinds || [def.anchorKind || 'dat'])
      .map((k) => `\`${k}\``)
      .join(', ');
    lines.push(
      `| \`${typeName}\` | ${def.labelVi || typeName} | \`${def.defaultLayer || 'giua'}\` | ${kinds} | ${def.canBeRed ? 'Có' : 'Không'} | ${varStr} | ${ancStr} |`
    );
  }

  lines.push('');
  return lines.join('\n');
}

// ── Nội dung SKILL.md (≤100 dòng) ─────────────────────────────────
const SKILL_MD_CONTENT = `---
name: dao-dien-tra-nguoi
description: Đạo diễn câu chữ 3 bước và xuất Gói Chén JSON cho kênh Trà Nguội (@tranguoi.15s). Dùng khi tạo Chén mới, viết thơ/quote, hoặc thiết kế cảnh.
---

# Đạo Diễn Trà Nguội (@tranguoi.15s)

Bạn là Đạo diễn kênh **Trà Nguội**. Trước khi làm, hãy đọc \`references/thu-vien.md\` (đạo cụ đã duyệt, tư thế, động từ/nhịp, khe vị trí, bối cảnh) và \`references/goi-chen.md\` (chuẩn Gói Chén, kèm mẫu \`references/q001.json\`). Làm tuần tự **3 bước**, kết thúc Bước 1 và Bước 2 đều **DỪNG chờ chủ kênh chốt**.

## Nhân vật duy nhất: Lữ Khách Bóng Mực
- Giữ nguyên nhân vật Lữ khách bóng mực thuỷ mặc (**không mắt, không lá trà**).
- Nhân vật chỉ phản ứng bằng tư thế (\`tu_the\`), hướng đầu (\`nhin_theo\`), nghiêng người (\`nghieng\`), và hướng đứng/ngồi (\`huong\`).

## Bước 1 — Câu chữ (DỪNG chờ chốt)
- Nếu chủ kênh **đưa sẵn câu**: giữ nguyên văn 100%, chia dòng hợp lý (2–4 dòng) và đề xuất \`cu_lat\` ở dòng cuối.
- Nếu chủ kênh **đưa ý tưởng**: đưa **3 phương án** câu chữ (2–4 dòng, **14–28 âm tiết**, \`cu_lat\` nằm ở **dòng cuối**).
- Giữ chất **“Lắng — Kiệm lời — Đời thực — Có dư vị”**. Tránh từ sáo rỗng bi lụy, khẩu hiệu dạy đời, văn dịch cứng, hashtag rác (\`#fyp\`, \`#foryou\`, \`#xuhuong\`, \`#viral\`).

## Bước 2 — Cú lật (3 phương án ngắn, DỪNG chờ chốt)
Sau khi chốt câu chữ, đưa **3 phương án ngắn** dựng cú lật. Mỗi phương án gồm:
1. **Motif** & **Vật đỏ** (\`vat_do: true\`, tối đa 1 vật đỏ lấy từ nghĩa câu).
2. **Đạo cụ & Bối cảnh**: chỉ chọn mã \`type\` có trong \`references/thu-vien.md\`.
3. **Diễn biến Lữ khách**: tư thế, hướng đầu, nghiêng người theo từng dòng thơ và nhịp lật.
- **Không bao giờ tự vẽ đồ vật, không toạ độ, không shapes.** Nếu thiếu đồ vật cần thiết trong \`references/thu-vien.md\`, ghi rõ **"Đề xuất bổ sung thư viện: <tên đồ vật>"** rồi chọn cách diễn khác bằng đồ đã có.

## Bước 3 — Xuất Gói Chén JSON
Sau khi chủ kênh chốt phương án ở Bước 2, xuất **đúng 1 khối JSON Gói Chén** theo \`references/goi-chen.md\`:
- Đủ trường gốc: \`phien_ban_goi: 1\`, \`tieu_de\`, \`cau\`, \`cu_lat\`, \`boi_canh\`, \`nhan_vat\`, \`dao_cu\`, \`nhip\`.
- Chỉ dùng tên đạo cụ, điểm neo, trạng thái, tư thế, động từ và khe vị trí trong \`references/thu-vien.md\`.
- Nhân vật ngồi ghế bắt buộc có \`ngoi_tren: "<id_ghe>.mat_ghe"\` (thêm \`ngoi_vao: "<id_ban>"\` khi ngồi vào bàn); đạo cụ trên bàn dùng \`loai_neo: "tren"\` + \`dat_tren: "<id_ban>.<diem_neo>"\`.
- Tuyệt đối không có \`x\`, \`y\`, \`scale\`, \`shapes\`, \`altShapes\`.

## Khi nhận thông báo lỗi từ tool
Khi chủ kênh dán lại đoạn mở đầu bằng **"Gói Chén của bạn bị tool báo các lỗi sau…"**:
- Sửa **đúng** các lỗi được liệt kê, **không đổi phần đã đúng**.
- Xuất lại **TOÀN BỘ** Gói Chén JSON hoàn chỉnh.
`;

// ── Kiểm tra ràng buộc ────────────────────────────────────────────
function verifySkillConstraints(mdText, label) {
  const lines = mdText.trimEnd().split('\n');
  if (label === 'SKILL.md' && lines.length > 100) {
    throw new Error(`SKILL.md vượt quá 100 dòng (${lines.length} dòng)`);
  }
  const forbidden = [
    { re: /#[0-9A-Fa-f]{3,6}\b/, name: 'mã màu hex' },
    { re: /<path\b|\bd="M\s/i, name: 'đường SVG' },
    { re: /\bviewBox\b|\bfps\b|\bpx\b/i, name: 'thông số pixel / fps / viewBox' },
    { re: /"x"\s*:|"y"\s*:|"scale"\s*:|"shapes"\s*:/i, name: 'toạ độ / shapes' },
  ];
  for (const f of forbidden) {
    const m = mdText.match(f.re);
    if (m) {
      throw new Error(`${label} chứa nội dung bị cấm (${f.name}): "${m[0]}"`);
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────
function main() {
  fs.mkdirSync(REF_DIR, { recursive: true });

  const thuVienMd = buildThuVienMd();
  const goiChenMd = fs.readFileSync(path.join(ROOT, 'docs/GOI-CHEN.md'), 'utf8');
  const q001Content = fs.readFileSync(path.join(ROOT, 'docs/goi-mau/q001.json'), 'utf8');

  verifySkillConstraints(SKILL_MD_CONTENT, 'SKILL.md');
  verifySkillConstraints(thuVienMd, 'references/thu-vien.md');

  fs.writeFileSync(SKILL_MD_PATH, SKILL_MD_CONTENT, 'utf8');
  fs.writeFileSync(REF_THU_VIEN_PATH, thuVienMd, 'utf8');
  fs.writeFileSync(REF_GOI_CHEN_PATH, goiChenMd, 'utf8');
  fs.writeFileSync(EXAMPLE_Q001_PATH, q001Content, 'utf8');

  const pyZip = `
import zipfile
with zipfile.ZipFile(${JSON.stringify(ZIP_PATH)}, "w", compression=zipfile.ZIP_DEFLATED) as zf:
    zf.write(${JSON.stringify(SKILL_MD_PATH)}, arcname="SKILL.md")
    zf.write(${JSON.stringify(REF_THU_VIEN_PATH)}, arcname="references/thu-vien.md")
    zf.write(${JSON.stringify(REF_GOI_CHEN_PATH)}, arcname="references/goi-chen.md")
    zf.write(${JSON.stringify(EXAMPLE_Q001_PATH)}, arcname="references/q001.json")
`;
  const r = spawnSync('/usr/bin/python3', ['-c', pyZip], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('python3 zip thất bại');

  const lineCount = SKILL_MD_CONTENT.trimEnd().split('\n').length;
  const zipSize = fs.statSync(ZIP_PATH).size;
  console.log(
    `✅ Đã sinh SKILL.md (${lineCount} dòng), references/ (thu-vien.md + goi-chen.md + q001.json) và ${path.relative(ROOT, ZIP_PATH)} (${(zipSize / 1024).toFixed(1)} KB)`
  );
}

main();
