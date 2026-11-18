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
  SEMANTIC_POSES,
  SEMANTIC_SOCKETS,
  SEMANTIC_TERRAINS,
} from '../src/stage/semanticStage.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const SKILL_DIR = path.join(ROOT, '.agents/skills/dao-dien-tra-nguoi');
const REF_DIR = path.join(SKILL_DIR, 'references');
const SKILL_MD_PATH = path.join(SKILL_DIR, 'SKILL.md');
const REF_MD_PATH = path.join(REF_DIR, 'thu-vien.md');
const ZIP_PATH = path.join(SKILL_DIR, 'dao-dien-tra-nguoi.zip');

function buildThuVienMd() {
  const lines = [
    '# Thư Viện Tên Hợp Lệ — Kịch Bản Ngữ Nghĩa Trà Nguội (`propCatalog`)',
    '',
    '> Tệp này được sinh tự động từ `src/stage/propCatalog.tsx` qua `scripts/gen-stage-skill.mjs`. Tuyệt đối chỉ dùng tên trong danh sách này; mỗi mã đạo cụ mang đúng một nghĩa, không tự viết toạ độ, tỷ lệ hay đường vẽ.',
    '',
    '## 1. Lớp sâu (`lop`), Loại neo (`loai_neo`) & Khe vị trí (`vi_tri`)',
    '- Ba lớp sâu hợp lệ (`lop`): ' + SEMANTIC_LAYERS.map((x) => `\`${x}\``).join(', ') + ' (`nen` dành cho cửa sổ, mái hiên, mây phía sau nhân vật; va chạm chỉ tính giữa các vật cùng lớp).',
    '- Năm loại neo hợp lệ (`loai_neo`): ' + ANCHOR_KINDS.map((x) => `\`${x}\``).join(', ') + ' (`dat`: mặt đất, `tuong`: treo tường không chạm đất, `troi`: bầu trời, `tren`: đặt trên điểm neo vật khác, `cam`: nhân vật cầm).',
    '- Khe vị trí ngang (`vi_tri` / `di_toi`): ' + Object.keys(SEMANTIC_SLOTS).map((x) => `\`${x}\``).join(', ') + '.',
    '- Địa hình (`boi_canh.dia_hinh`): ' + Object.keys(SEMANTIC_TERRAINS).map((x) => `\`${x}\``).join(', ') + '.',
    `- Luật kích thước thật: mỗi vật khai báo \`kich_thuoc_that\` (cm); vật nhỏ dưới ${NGUONG_VAT_NHO_CM} cm nhân hệ số phóng đại chung \`HE_SO_PHONG_DAI = ${HE_SO_PHONG_DAI}\`, vật từ ${NGUONG_VAT_NHO_CM} cm trở lên nhân hệ số \`1\` (tỷ lệ cảnh \`TY_LE_CANH = ${TY_LE_CANH}\`). Cùng một loại vật luôn có cùng kích thước dù đặt ở đâu.`,
    '',
    '## 2. Tư thế nhân vật (`tu_the`) & Quy tắc ngồi ghế (`ngoi_tren`)',
    '- Tư thế hợp lệ: ' + Object.keys(SEMANTIC_POSES).map((x) => `\`${x}\``).join(', ') + '.',
    '- Vị trí cầm đạo cụ (`cam_boi`): `<id_nhan_vat>.tay`, `<id_nhan_vat>.dau`, `<id_nhan_vat>.lung` (' + Object.keys(SEMANTIC_SOCKETS).map((x) => `\`${x}\``).join(', ') + ').',
    '- Muốn ngồi (`ngoi_tua`), nhân vật bắt buộc khai báo `ngoi_tren: "<id_ghe>.mat_ghe"`. Không có ghế thì không được ngồi.',
    '- Chén trà trên tay (`cam_chen_tra: true`) mặc định màu mực, chỉ tính là vật đỏ khi khai báo `vat_do_tren_tay: "<id_nhan_vat>.chen_tra"`.',
    '',
    '## 3. Kho đạo cụ chuẩn trong `propCatalog` (Đã có kích thước thật, hộp bao & điểm neo)',
    '| Mã đạo cụ (`type`) | Nghĩa / Tên gọi | Cỡ thật (cm) | Duyệt | Lớp mặc định | Loại neo | Vật đỏ | Trạng thái (`trang_thai`) | Điểm neo (`<id>.<diem_neo>`) |',
    '| :--- | :--- | :---: | :---: | :---: | :--- | :---: | :--- | :--- |',
  ];

  const readyEntries = [];
  const draftMissingBox = [];

  for (const [typeName, def] of Object.entries(BUILT_IN_PROP_CATALOG)) {
    if (def.box) {
      readyEntries.push([typeName, def]);
    } else {
      draftMissingBox.push([typeName, def]);
    }
  }

  for (const [typeName, def] of readyEntries) {
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
      `| \`${typeName}\` | ${def.labelVi || typeName} | ${def.kich_thuoc_that || '-'} | \`${def.status || 'nhap'}\` | \`${def.defaultLayer || 'giua'}\` | ${kinds} | ${def.canBeRed ? 'Có' : 'Không'} | ${varStr} | ${ancStr} |`
    );
  }

  lines.push('');
  lines.push('## 4. Các đạo cụ gốc đang ở trạng thái `nhap` (chưa khai báo hộp bao — cần bổ sung trước khi dùng)');
  lines.push(
    '- ' +
      draftMissingBox
        .map(([k, d]) => `\`${k}\` (${d.labelVi || k})`)
        .join(', ')
  );
  lines.push('');

  return lines.join('\n');
}

const SKILL_MD_CONTENT = `---
name: dao-dien-tra-nguoi
description: Đạo diễn câu chữ và kịch bản ngữ nghĩa 3 bước cho kênh Trà Nguội (@tranguoi.15s), đối chiếu kho đạo cụ tự sinh tại references/thu-vien.md và xuất kịch bản ngữ nghĩa chuẩn cho engine sản xuất.
---

# Đạo Diễn Trà Nguội (@tranguoi.15s)

Bạn là Đạo diễn của kênh **Trà Nguội**. Khi làm mỗi Chén mới, hãy đọc \`references/thu-vien.md\` và thực hiện tuần tự **đúng 3 bước**, kết thúc mỗi bước phải **dừng lại chờ chủ kênh chốt** mới sang bước tiếp theo.

## Bước 1 — Câu chữ (Dừng chờ chủ kênh chốt)
- Đưa ra **3 phương án** câu chữ, mỗi phương án dài **14–28 âm tiết**, cụm **chữ lật** nằm ở **dòng cuối**.
- Nếu câu trích dẫn có **tên tác giả** thì **giữ nguyên văn 100%**, không tự ý sửa từ.
- Giữ chuẩn DNA ngôn từ **“Lắng — Kiệm lời — Đời thực — Có dư vị”**.
- **Danh sách từ cấm**:
  - Sáo rỗng bi lụy: *tê tái lòng, đớn đau tột cùng, chôn chặt đáy đại dương, khóc cạn nước mắt, tan nát cõi lòng*.
  - Khẩu hiệu dạy đời: *Hãy..., Đừng bao giờ..., Bạn phải..., Bí quyết là...*.
  - Văn dịch cứng / ngôn tình sáo: *một loại... không kể xiết, vạn dặm nhân gian, năm tháng tĩnh lặng*.
  - Hashtag rác: \`#fyp\`, \`#foryou\`, \`#xuhuong\`, \`#viral\`.

## Bước 2 — Ý tưởng cú lật (Dừng chờ chủ kênh chốt)
Sau khi chủ kênh chốt câu chữ, đưa ra **3 phương án** dựng cảnh. Mỗi phương án ghi rõ:
1. **Motif**: chọn 1 trong 8 motif (*vật lật nghĩa, khoảng cách, vật ở lại, thời gian, nội tâm, đối chiếu, con đường, đổi quy mô*).
2. **Vật đỏ**: lấy từ nghĩa của câu, **mỗi vật một nghĩa**, **mỗi Chén chỉ đúng 1 vật đỏ** (bản đỏ giữ nguyên dáng bản thường, chỉ đổi màu; chén trà cầm tay mặc định màu mực, không tính là vật đỏ trừ khi chính nó là vật của cú lật).
3. **Phản ứng của Lữ khách ở từng dòng**: nêu rõ tư thế và nhịp chuyển của nhân vật theo từng dòng.
4. **Lý giải**: một câu giải thích vì sao hình ảnh này “nói” đúng câu chữ.

### Quy tắc bắt buộc khi thiếu đạo cụ hoặc tư thế
- Nếu ý tưởng cú lật tốt nhất cần đạo cụ hoặc điểm neo chưa có (hoặc chưa được duyệt) trong \`references/thu-vien.md\` thì **dừng ở Bước 2**, nêu rõ cần bổ sung gì vào thư viện.
- **Không được tự bịa tên** và **không được đổi sang vật khác làm lệch nghĩa câu**.

## Bước 3 — Xuất kịch bản ngữ nghĩa JSON
Sau khi chủ kênh chốt phương án đủ đạo cụ hợp lệ trong \`references/thu-vien.md\`, xuất khối JSON kịch bản ngữ nghĩa (tuyệt đối không ghi toạ độ, tỷ lệ hay hình vẽ thủ công):
- Khai báo rõ \`lop\` (\`nen\`, \`giua\`, \`truoc\`) và \`loai_neo\` (\`dat\`, \`tuong\`, \`troi\`, \`tren\`, \`cam\`).
- Nhân vật ngồi bắt buộc gắn \`ngoi_tren: "<ghe>.mat_ghe"\`; vật trên bàn/bậu cửa gắn \`dat_tren: "<vat_chu>.<diem_neo>"\`.

### Mẫu kịch bản ngữ nghĩa chuẩn
\`\`\`json
{
  "semanticVersion": 1,
  "sceneId": "SCRIPT_CAP_NHAT_MOI",
  "ten": "Chén 17 — Chưa chịu cập nhật",
  "boi_canh": {
    "dia_hinh": "phang",
    "khi_quyen": [{ "loai": "leaves", "huong": "phai", "mat_do": 4 }]
  },
  "nhan_vat": [
    { "id": "hero", "ngoi_tren": "ghe_lam_viec.mat_ghe", "huong": "phai", "lop": "giua" }
  ],
  "dao_cu": [
    { "id": "cua_so", "type": "porch_window", "loai_neo": "tuong", "vi_tri": "trai", "lop": "nen" },
    { "id": "ghe_lam_viec", "type": "std_chair", "loai_neo": "dat", "vi_tri": "giua_trai", "lop": "giua" },
    { "id": "ban_lam_viec", "type": "std_work_desk", "loai_neo": "dat", "vi_tri": "giua", "lop": "giua" },
    { "id": "lich_cu", "type": "desk_calendar", "loai_neo": "tren", "dat_tren": "ban_lam_viec.mat_ban_trai", "lop": "giua", "vat_do": true }
  ],
  "nhip": [
    { "moc": "dong_1", "nhan_vat": { "hero": { "tu_the": "ngoi_tua", "nghieng": "nhe_truoc" } } },
    { "moc": "cu_lat", "nhan_vat": { "hero": { "tu_the": "vuon_tay" } } },
    { "moc": "cu_lat", "sau": 1.2, "nhan_vat": { "hero": { "tu_the": "trao", "nghieng": "thang" } } }
  ]
}
\`\`\`
`;

function verifySkillConstraints(mdText, label) {
  const lines = mdText.split('\n');
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

function main() {
  fs.mkdirSync(REF_DIR, { recursive: true });
  const thuVienMd = buildThuVienMd();

  verifySkillConstraints(SKILL_MD_CONTENT, 'SKILL.md');
  verifySkillConstraints(thuVienMd, 'references/thu-vien.md');

  fs.writeFileSync(SKILL_MD_PATH, SKILL_MD_CONTENT, 'utf8');
  fs.writeFileSync(REF_MD_PATH, thuVienMd, 'utf8');

  const pyZip = `
import zipfile
with zipfile.ZipFile(${JSON.stringify(ZIP_PATH)}, "w", compression=zipfile.ZIP_DEFLATED) as zf:
    zf.write(${JSON.stringify(SKILL_MD_PATH)}, arcname="SKILL.md")
    zf.write(${JSON.stringify(REF_MD_PATH)}, arcname="references/thu-vien.md")
`;
  spawnSync('/usr/bin/python3', ['-c', pyZip], { stdio: 'inherit' });

  const lineCount = SKILL_MD_CONTENT.trimEnd().split('\n').length;
  console.log(
    `✅ Đã sinh SKILL.md (${lineCount} dòng), references/thu-vien.md và ${path.relative(ROOT, ZIP_PATH)} từ propCatalog.tsx`
  );
}

main();
