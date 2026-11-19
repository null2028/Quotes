import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  BUILT_IN_PROP_CATALOG,
  PROP_FAMILY_ALIASES,
} from '../src/stage/propCatalog.tsx';
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
  SEMANTIC_ACTOR_ROLES,
  SEMANTIC_BACKDROPS,
  SEMANTIC_BEAT_ANCHORS,
  SEMANTIC_LEANS,
  SEMANTIC_PIVOT_STYLES,
  SEMANTIC_POSES,
  SEMANTIC_PROP_BEAT_VERBS,
  SEMANTIC_SOCKETS,
  SEMANTIC_TERRAIN_SEGMENT_VERBS,
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

const HO_DAO_CU_PATH = path.join(ROOT, 'docs/motif/HO-DAO-CU.md');
const BO_BOI_CANH_PATH = path.join(ROOT, 'docs/motif/BO-BOI-CANH.md');

// Bối cảnh hợp theo từng mã đạo cụ Tầng A & Tầng B (khớp BO-BOI-CANH.md)
const PROP_CONTEXTS = {
  // Tầng A
  envelope: 'phong_trong_nha, van_phong, hien_tra',
  wine_jar: 'hien_tra, quan_nho, nha_que',
  vo_ruou: 'hien_tra, quan_nho, nha_que',
  small_cup: 'hien_tra, quan_nho, phong_trong_nha',
  chen_tra: 'hien_tra, quan_nho, phong_trong_nha',
  box_stack: 'van_phong, phong_trong_nha',
  umbrella: 'pho_ngo, thien_nhien_mo',
  bench: 'pho_ngo, hien_tra, ga_tau',
  cloud_wisp: 'thien_nhien_mo, hien_tra, pho_ngo',
  std_chair: 'van_phong, phong_trong_nha, quan_nho, nha_que',
  low_wood_stool: 'hien_tra, nha_que',
  std_work_desk: 'van_phong, phong_trong_nha',
  ban_lam_viec: 'van_phong, phong_trong_nha',
  low_tea_table: 'hien_tra, nha_que',
  ban_tra: 'hien_tra, nha_que',
  ban_quan: 'quan_nho, phong_trong_nha, hien_tra',
  ban_hop: 'van_phong',
  giuong_ngu: 'phong_trong_nha',
  chiec_goi: 'phong_trong_nha',
  tu_kinh: 'phong_trong_nha, quan_nho, hien_tra',
  desk_calendar: 'van_phong, phong_trong_nha',
  desk_laptop: 'van_phong, quan_nho',
  vi_tien: 'van_phong, pho_ngo, quan_nho',
  thiep: 'phong_trong_nha, hien_tra, khong_gian_ky_hieu',
  phong_bi: 'van_phong, phong_trong_nha, hien_tra',
  hoa_don: 'van_phong, quan_nho, phong_trong_nha',
  porch_window: 'phong_trong_nha, hien_tra, van_phong, quan_nho',
  am_tra: 'hien_tra, nha_que, quan_nho',
  bat_com: 'nha_que, phong_trong_nha',
  ly_ca_phe: 'quan_nho, van_phong',
  ly_ruou: 'quan_nho, hien_tra',
  hop_com: 'van_phong, nha_que',
  mam_com: 'nha_que',
  // Tầng B (nhap)
  bridal_veil: 'phong_trong_nha, khong_gian_ky_hieu',
  dashed_heart: 'khong_gian_ky_hieu',
  solid_heart: 'khong_gian_ky_hieu',
  rice_bowl: 'nha_que, phong_trong_nha',
  tall_cup: 'quan_nho, van_phong',
  boulder: 'thien_nhien_mo, khong_gian_ky_hieu',
  street_lamp: 'pho_ngo, ga_tau',
  warm_house: 'nha_que, pho_ngo, thien_nhien_mo',
  city_skyline: 'pho_ngo, van_phong',
  small_boat: 'thien_nhien_mo',
  kite: 'thien_nhien_mo, khong_gian_ky_hieu',
  paper_plane: 'thien_nhien_mo, khong_gian_ky_hieu, pho_ngo',
  bare_tree: 'thien_nhien_mo, pho_ngo',
  sprout: 'thien_nhien_mo, khong_gian_ky_hieu',
  campfire: 'hien_tra, thien_nhien_mo',
  lantern: 'thien_nhien_mo, pho_ngo, hien_tra',
  seesaw: 'khong_gian_ky_hieu, thien_nhien_mo',
  hourglass: 'khong_gian_ky_hieu, van_phong, phong_trong_nha',
  chat_bubble: 'khong_gian_ky_hieu, phong_trong_nha',
};

const FAMILY_META = {
  do_chua: { ctx: 'hien_tra, quan_nho, nha_que', anchor: 'tren/cam', red: 'Có' },
  mat_phang: { ctx: 'van_phong, phong_trong_nha, quan_nho', anchor: 'dat (mat_trai/giua/phai)', red: 'Không (trừ chiec_goi)' },
  khung: { ctx: 'phong_trong_nha, hien_tra, pho_ngo, nha_que', anchor: 'tuong/dat', red: 'Tuỳ vật (khung_tranh/guong_soi/cua)' },
  giay: { ctx: 'van_phong, phong_trong_nha, khong_gian_ky_hieu', anchor: 'tren/cam/dat', red: 'Có' },
  cay_co: { ctx: 'thien_nhien_mo, pho_ngo, hien_tra', anchor: 'dat/tren/cam', red: 'Có (hoa/lá/mầm)' },
  do_mang: { ctx: 'pho_ngo, phong_trong_nha, ga_tau, hien_tra', anchor: 'cam/tren/dat/tuong', red: 'Có' },
  ghe: { ctx: 'van_phong, pho_ngo, phong_trong_nha', anchor: 'dat (mat_ghe)', red: 'Không' },
  vat_tron: { ctx: 'van_phong, phong_trong_nha, thien_nhien_mo, khong_gian_ky_hieu', anchor: 'tuong/tren/troi/cam', red: 'Có' },
  man_hinh: { ctx: 'van_phong, quan_nho, phong_trong_nha', anchor: 'cam/tren/tuong', red: 'Có' },
  anh_sang: { ctx: 'phong_trong_nha, quan_nho, pho_ngo', anchor: 'tren/tuong/dat', red: 'Có' },
  ky_hieu: { ctx: 'khong_gian_ky_hieu', anchor: 'troi/tuong/cam/dat', red: 'Có' },
  nha_xe: { ctx: 'pho_ngo, ga_tau, nha_que', anchor: 'dat (nen/giua)', red: 'Tuỳ vật (ô cửa/giỏ xe)' },
};

const TIER_B_NON_RED = new Set(['city_skyline', 'bare_tree', 'boulder']);
const TIER_B_ANCHORS = {
  bridal_veil: 'cam/dat',
  dashed_heart: 'troi/cam/dat',
  solid_heart: 'troi/cam/dat',
  rice_bowl: 'tren/cam/dat',
  tall_cup: 'tren/cam/dat',
  boulder: 'dat',
  street_lamp: 'dat',
  warm_house: 'dat (nen)',
  city_skyline: 'dat (nen)',
  small_boat: 'dat',
  kite: 'troi/cam',
  paper_plane: 'troi/cam/dat',
  bare_tree: 'dat',
  sprout: 'dat/tren',
  campfire: 'dat',
  lantern: 'cam/tuong/troi/dat',
  seesaw: 'dat',
  hourglass: 'tren/dat',
  chat_bubble: 'troi',
};

function parseBoiCanhFromDoc() {
  const md = fs.readFileSync(BO_BOI_CANH_PATH, 'utf8');
  const results = [];
  const sections = md.split(/\n### \d+\.\s+/).slice(1);
  for (const sec of sections) {
    const headerLine = sec.split('\n')[0] || '';
    const m = headerLine.match(/^([^(]+)\(`([^`]+)`\)/);
    if (!m) continue;
    const name = m[1].trim();
    const code = m[2].trim();

    const terrainMatch = sec.match(/Địa hình[^:\n]*:\s*([^\n]+)/);
    const terrainRaw = terrainMatch ? terrainMatch[1] : 'dia_hinh: "phang"';
    const terrains = Array.from(
      new Set(
        (terrainRaw.match(/\b(phang|doc|doi|nga_re|bo_nuoc|bac_thang)\b/g) || ['phang'])
      )
    );

    const propsBlockMatch = sec.match(/- \*\*Đạo cụ mặc định[^\n]*\n([\s\S]*?)(?=\n- \*\*Khí quyển|$)/);
    const propCodes = [];
    if (propsBlockMatch) {
      const codeMatches = propsBlockMatch[1].matchAll(/`([a-z0-9_]+)`/g);
      for (const cm of codeMatches) {
        const token = cm[1];
        if (['nen', 'giua', 'truoc', 'dat', 'tuong', 'troi', 'tren', 'cam', 'dong', 'he_mo', 'be_cua', 'mat_ban_trai', 'mat_ban_giua', 'mat_ban_phai'].includes(token)) {
          continue;
        }
        if (!propCodes.includes(token)) propCodes.push(token);
      }
    }

    const atmoMatch = sec.match(/`Atmosphere`:\s*([^\n]+)/);
    const atmoTokens = atmoMatch
      ? Array.from(new Set(Array.from(atmoMatch[1].matchAll(/`(rain|wind|leaves|steam|birds|sun|hollow_sun|crescent|ring_pulse)`/g), (x) => x[1])))
      : [];

    results.push({
      code,
      name,
      terrains,
      props: propCodes.slice(0, 8),
      atmo: atmoTokens,
    });
  }
  return results;
}

function parseTierCFromHoDaoCu() {
  const md = fs.readFileSync(HO_DAO_CU_PATH, 'utf8');
  const families = [];
  const familyRegex = /### Họ (\d+) — `([^`]+)` \(([^·)]+)[^)]*\)\n([\s\S]*?)(?=\n### Họ |\n---\n\n## 4\.)/g;
  let fm;
  while ((fm = familyRegex.exec(md)) !== null) {
    const order = Number(fm[1]);
    const familyCode = fm[2].trim();
    const familyLabel = fm[3].trim();
    const body = fm[4];
    const items = [];
    const itemRegex = /^\s*-\s+`([a-z0-9_]+)`\s+\*\(mới — ([^)]+)\)\*/gm;
    let im;
    while ((im = itemRegex.exec(body)) !== null) {
      const presetCode = im[1].trim();
      const rawDesc = im[2].trim();
      // Nếu mã đã có trong propCatalog (Tầng A hoặc B) thì không đưa vào Tầng C
      if (presetCode in BUILT_IN_PROP_CATALOG) continue;
      // Làm sạch mô tả ngắn, bỏ từ bị cấm nếu có
      const shortDesc = rawDesc
        .replace(/`/g, '')
        .replace(/\b(px|fps|viewBox)\b/gi, '')
        .replace(/#[0-9A-Fa-f]{3,6}\b/g, '')
        .trim();
      items.push({ code: presetCode, desc: shortDesc });
    }
    families.push({ order, code: familyCode, label: familyLabel, items });
  }
  return families;
}

function formatPropOneLine(typeName, def, isTierB = false) {
  const aliasTarget = PROP_FAMILY_ALIASES[typeName];
  const baseLabel = def.labelVi || typeName;
  const label = aliasTarget ? `${baseLabel} (alias \`${aliasTarget}\`)` : baseLabel;
  const ctx = PROP_CONTEXTS[typeName] || 'khong_gian_ky_hieu';
  const kinds =
    isTierB && TIER_B_ANCHORS[typeName]
      ? TIER_B_ANCHORS[typeName]
      : (def.allowedAnchorKinds || [def.anchorKind || 'dat']).join('/');
  const anchorKeys = Object.keys(def.anchors || {});
  const anchorStr = anchorKeys.length > 0
    ? `${kinds} [điểm neo: ${anchorKeys.join(', ')}]`
    : kinds;
  const variants = Object.keys(def.variants || {});
  const varNote = variants.length > 0 ? ` · trạng thái: ${variants.join('/')}` : '';
  const canRed = isTierB
    ? !TIER_B_NON_RED.has(typeName) && def.canBeRed !== false
    : Boolean(def.canBeRed);
  return `- \`${typeName}\` · ${label}${varNote} · bối cảnh: ${ctx} · neo: ${anchorStr} · vật đỏ: ${canRed ? 'Có' : 'Không'}`;
}

// ── Build thu-vien.md từ code + docs/motif ────────────────────────
function buildThuVienMd() {
  const fmtList = (arr) => arr.map((x) => `\`${x}\``).join(', ');
  const atmosphereTypes = AtmosphereTypeEnum.options;
  const boiCanhList = parseBoiCanhFromDoc();
  const tierCFamilies = parseTierCFromHoDaoCu();

  const tierA = [];
  const tierB = [];
  for (const [typeName, def] of Object.entries(BUILT_IN_PROP_CATALOG)) {
    if (def.status === 'duyet') {
      tierA.push([typeName, def]);
    } else {
      tierB.push([typeName, def]);
    }
  }
  const tierCCount = tierCFamilies.reduce((sum, f) => sum + f.items.length, 0);

  const lines = [
    '# Thư Viện Kho Đạo Cụ 3 Tầng, Bối Cảnh & Động Từ — Trà Nguội',
    '',
    '> Sinh tự động qua `npm run gen:skill` từ `propCatalog`, `semanticStage`, `HO-DAO-CU.md` và `BO-BOI-CANH.md`. Không tự vẽ đồ vật hay ghi toạ độ.',
    '',
    '## 1. 9 Bộ Bối Cảnh Chuẩn (`boi_canh.bo` · `BO-BOI-CANH`)',
    '> Chọn 1 trong 9 mã `boi_canh.bo` bên dưới để engine tự dựng lớp nền tối giản (`nen`, nét mảnh, độ đậm thấp, tự mở màn trước đạo cụ). Khí quyển mặc định TẮT — không tự thêm mặt trời/lá/gió trang trí; chỉ khai báo `boi_canh.khi_quyen` khi câu chữ có hình ảnh/ý nghĩa tương ứng và đã giải thích ở Bước 2.',
  ];

  for (const bc of boiCanhList) {
    const bgInfo = SEMANTIC_BACKDROPS[bc.code];
    const bgDesc = bgInfo ? ` · nền tự dựng: ${bgInfo.mo_ta}` : '';
    lines.push(
      `- \`${bc.code}\` · **${bc.name}**${bgDesc} · địa hình: ${bc.terrains.join('/')} · đạo cụ gợi ý: ${bc.props.join(', ')}`
    );
  }

  lines.push(
    '',
    '## 2. Địa Hình, Kiểu Cú Lật, Khí Quyển, Nhân Vật & Toàn Bộ Động Từ',
    `- Bộ bối cảnh (\`boi_canh.bo\`): ${fmtList(Object.keys(SEMANTIC_BACKDROPS))}.`,
    `- Địa hình (\`boi_canh.dia_hinh\`): ${fmtList(Object.keys(SEMANTIC_TERRAINS))}.`,
    '- Kiểu cú lật (`kieu_cu_lat` — mặc định `day_may`, điều khiển duy nhất camera quanh cú lật):',
    ...Object.entries(SEMANTIC_PIVOT_STYLES).map(([k, desc]) => `  - \`${k}\`: ${desc}.`),
    '- Đoạn đường làm vật đỏ (`boi_canh.doan_duong[]`): `{ "id": "duong_lui", "vi_tri": "sau_lung" | "truoc_mat" | "tu_trai" | "giua" | "tu_phai", "nhan_vat": "<id>", "vat_do": true }` (hoặc dùng `tu`/`den` theo khe vị trí). Tự đổi nét đỏ đậm hơn ở cú lật.',
    `- Khí quyển (\`boi_canh.khi_quyen[].loai\`, mặc định TẮT — chỉ dùng khi mang nghĩa rõ ở Bước 2): ${fmtList(atmosphereTypes)} (kèm \`vi_tri\`, \`huong\`: \`trai\`/\`phai\`, \`mat_do\`).`,
    `- Lớp sâu (\`lop\`): ${fmtList(SEMANTIC_LAYERS)} · Loại neo (\`loai_neo\`): ${fmtList(ANCHOR_KINDS)} · Khe vị trí (\`vi_tri\`/\`di_toi\`): ${fmtList(Object.keys(SEMANTIC_SLOTS))}.`,
    `- Nhân vật (\`nhan_vat[].vai\`): ${fmtList(SEMANTIC_ACTOR_ROLES)} (\`lu_khach\` bóng mực đậm mặc định; \`nguoi_b\` bóng mực nhạt hơn, tuỳ chọn \`toc_duoi_ngua: true\`, đủ \`vi_tri\`, \`huong\`, \`tu_the\`, va chạm như Lữ khách).`,
    `- Tư thế (\`tu_the\`): ${fmtList(Object.keys(SEMANTIC_POSES))} · Nghiêng (\`nghieng\`): ${fmtList(SEMANTIC_LEANS)} (\`guc\` = cúi đầu vai chùng — thờ ơ, mệt nhẹ, không gập xuống bàn; \`guc_sau\` = gục sâu xuống bàn — kiệt sức) · Hướng (\`huong\`): \`trai\`, \`phai\` · Điểm cầm (\`cam_boi\`): ${fmtList(Object.keys(SEMANTIC_SOCKETS))}.`,
    '- Ngồi ghế bàn: bắt buộc `ngoi_tren: "<id_ghe>.mat_ghe"`, thêm `ngoi_vao: "<id_ban>"` để kê sát bàn. Chén trà cầm tay (`cam_chen_tra: true`) mặc định nét mực wash; chỉ đổi đỏ khi có `vat_do_tren_tay: "<id>.chen_tra"`.',
    `- Mốc nhịp (\`nhip[].moc\`): ${fmtList(SEMANTIC_BEAT_ANCHORS)} (kèm \`sau\` tính bằng giây; **không cần ghi \`thoi_luong\`** — engine tự tính chậm rãi theo Nhịp Trà Nguội; phản ứng lớn tại \`cu_lat\` phải có \`sau\` ≥ 0.45).`,
    `- Động từ nhân vật (\`nhip[].nhan_vat.<id>\`): ${fmtList(SEMANTIC_ACTOR_BEAT_VERBS)} (\`di_vao\`/\`di_ra\`: từ/ra mép khung; \`khung_lai\`: giật nhẹ dừng; \`lui_buoc\`: lùi vẫn giữ hướng; \`quay_dau\`: ngoái sau rồi quay lại; \`nhin_nhau\`: hai nhân vật xoay mặt nhìn nhau; \`tha_roi\`: thả vật cầm rơi xuống đất).`,
    `- Động từ đạo cụ (\`nhip[].dao_cu.<id>\`): ${fmtList(SEMANTIC_PROP_BEAT_VERBS)}.`,
    `- Động từ địa hình / đoạn đường (\`nhip[].doan_duong.<id>\`): ${fmtList(SEMANTIC_TERRAIN_SEGMENT_VERBS)} (\`doi_do\`: đổi đỏ đậm; \`duong_mo\`: mờ dần ở hậu vị).`,
    `- Tỷ lệ thật: vật dưới ${NGUONG_VAT_NHO_CM} cm nhân \`HE_SO_PHONG_DAI = ${HE_SO_PHONG_DAI}\`, từ ${NGUONG_VAT_NHO_CM} cm trở lên nhân \`1\` (\`TY_LE_CANH = ${TY_LE_CANH}\`).`,
    '',
    `## 3. TẦNG A — Dùng ngay (${tierA.length} món đã duyệt \`duyet\`, gồm alias)`,
    '> Ưu tiên chọn trong tầng này để xuất Gói Chén dựng ngay không cảnh báo.',
    ...tierA.map(([k, d]) => formatPropOneLine(k, d, false)),
    '',
    `## 4. TẦNG B — Có sẵn, chưa chuẩn hoá nét (${tierB.length} món \`nhap\`)`,
    '> Đã có code trong kho, dùng được trong Gói Chén nếu đúng nghĩa; ô nhập tool web sẽ hiện cảnh báo vàng để chủ kênh biết chưa chuẩn hoá nét.',
    ...tierB.map(([k, d]) => formatPropOneLine(k, d, true)),
    '',
    `## 5. TẦNG C — Đang lên kế hoạch (${tierCCount} preset theo 12 họ · CHỈ LÊN Ý TƯỞNG, KHÔNG XUẤT JSON)`,
    '> Các preset này chưa có code trong `propCatalog`. Nếu phương án Bước 2 cần món tầng C, ghi rõ `Cần bổ sung: <mã preset>` và kèm phương án thay thế dựng được ngay bằng tầng A/B. Tuyệt đối KHÔNG xuất mã tầng C trong JSON Bước 3.',
  );

  for (const fam of tierCFamilies) {
    const fmeta = FAMILY_META[fam.code] || { ctx: 'khong_gian_ky_hieu', anchor: 'dat', red: 'Có' };
    if (fam.items.length === 0) {
      lines.push(`### Họ ${fam.order} · \`${fam.code}\` (${fam.label}) — đã có trong Tầng A/B`);
      continue;
    }
    lines.push(`### Họ ${fam.order} · \`${fam.code}\` (${fam.label} · ${fam.items.length} món chờ dựng)`);
    for (const it of fam.items) {
      const canRed =
        fam.code === 'mat_phang'
          ? it.code === 'chiec_goi'
            ? 'Có'
            : 'Không'
          : fmeta.red;
      lines.push(
        `- \`${it.code}\` · ${it.desc} · bối cảnh: ${fmeta.ctx} · neo: ${fmeta.anchor} · vật đỏ: ${canRed}`
      );
    }
  }

  lines.push('');
  return {
    md: lines.join('\n'),
    counts: { tierA: tierA.length, tierB: tierB.length, tierC: tierCCount },
  };
}

// ── Nội dung SKILL.md (≤ 80 dòng) ─────────────────────────────────
const SKILL_MD_CONTENT = `---
name: dao-dien-tra-nguoi
description: Đạo diễn câu chữ 3 bước và xuất Gói Chén JSON cho kênh Trà Nguội (@tranguoi.15s). Dùng khi tạo Chén mới, viết thơ/quote, hoặc thiết kế cảnh.
---

# Đạo Diễn Trà Nguội (@tranguoi.15s)

Bạn là Đạo diễn kênh **Trà Nguội**. Trước khi làm, hãy đọc \`references/thu-vien.md\` (kho đạo cụ 3 tầng, 9 bộ bối cảnh, địa hình, khí quyển, nhân vật, động từ) và \`references/goi-chen.md\` (chuẩn Gói Chén, kèm mẫu \`references/q001.json\`). Làm tuần tự **3 bước**, kết thúc Bước 1 và Bước 2 đều **DỪNG chờ chủ kênh chốt**.

## Nhân vật: Lữ Khách Bóng Mực & Người Thứ Hai (\`nguoi_b\`)
- Giữ nguyên phong cách bóng mực thuỷ mặc (**không mắt, không lá trà**). Có thể dùng thêm nhân vật thứ 2 (\`vai: "nguoi_b"\`, nhạt hơn Lữ khách, tuỳ chọn \`toc_duoi_ngua: true\`) khi câu có người đối diện.
- Nhân vật chỉ phản ứng bằng tư thế (\`tu_the\`), hướng đầu (\`nhin_theo\`/\`nhin_nhau\`), nghiêng người (\`nghieng\`), bước chân (\`di_toi\`/\`di_vao\`/\`di_ra\`/\`lui_buoc\`), \`khung_lai\`, \`quay_dau\`, \`tha_roi\`, và hướng đứng/ngồi (\`huong\`).

## Bước 1 — Câu chữ (DỪNG chờ chốt)
- Nếu chủ kênh **đưa sẵn câu**: giữ nguyên văn 100%, chia dòng hợp lý (2–4 dòng) và đề xuất \`cu_lat\` ở dòng cuối.
- Nếu chủ kênh **đưa ý tưởng**: đưa **3 phương án** câu chữ (2–4 dòng, **14–28 âm tiết**, \`cu_lat\` nằm ở **dòng cuối**).
- Giữ chất **“Lắng — Kiệm lời — Đời thực — Có dư vị”**. Tránh từ sáo rỗng bi lụy, khẩu hiệu dạy đời, văn dịch cứng, hashtag rác (\`#fyp\`, \`#foryou\`, \`#xuhuong\`, \`#viral\`).

## Bước 2 — Cú lật (3 phương án ngắn, DỪNG chờ chốt)
NGUYÊN TẮC: hình không kể lại chữ, hình làm cú lật mạnh hơn. Chữ là chính.
Lên ý tưởng trên cả 3 tầng. Ưu tiên tầng A; tầng B được dùng nếu đúng nghĩa; tầng C chỉ được đưa vào phương án kèm 'Cần bổ sung' và phải có phương án thay thế dựng được ngay.
Mỗi phương án (đưa 3, xếp mạnh → yếu) ghi đủ, mỗi mục 1 dòng:
1. Bản lề: "Người xem tưởng A → câu lật thành B." Không viết được thì hỏi lại chủ kênh.
2. Trước cú lật: hình dựng thế giới của A (bối cảnh quen, Lữ khách sống bình thường), KHÔNG lộ B.
3. Vật đỏ: Vật đỏ phải là hình ảnh nằm TRONG CỤM CHỮ LẬT hoặc DÒNG CUỐI (vd câu Chén 18 'Tính đường lui… chẳng được' → vật đỏ gắn với 'đường lui'). Chỉ khi cụm đó không có hình ảnh cụ thể mới lấy từ dòng khác. Chữ lật trừu tượng (kỳ diệu, hạnh phúc, cô đơn, thời gian…) → CỤ THỂ HOÁ thành một vật đời thường nhìn thấy được đang mang khái niệm đó (vd 'kỳ diệu' → chén trà bỗng bốc khói ấm; 'cô đơn' → chiếc ghế thứ hai trống). Chỉ dùng địa hình khi chính chữ lật nói về đường/lối. Gán nghĩa vòng vo (laptop vì 'tính nhanh') là SAI.
4. Nhân vật: câu ngôi thứ nhất → Lữ khách là "ta"; câu có người thứ hai ("em", "anh", "người ấy") → PHẢI có nhân vật thứ hai trên sân khấu. Phản ứng nhỏ, thật, hơi vụng; ghi theo từng dòng.
5. Đồ trên sân khấu: mỗi đồ (kể cả khí quyển như nắng, lá, mưa, gió) phải được nhân vật dùng, nhìn, hoặc mang nghĩa trong câu; ghế/đồ chỉ để lấp chỗ trống hay trang trí là SAI (tối đa 3 đạo cụ; khí quyển mặc định TẮT).
6. Bối cảnh nhất quán: mọi đồ vật phải thuộc cùng một bộ bối cảnh (xem 9 bộ trong \`references/thu-vien.md\`). Chỉ mô tả những gì Gói Chén thể hiện được; bối cảnh phải ghi bằng \`boi_canh.bo\`. Không đặt bàn làm việc giữa ngã rẽ, không đặt lịch bàn lên ghế đá.
7. Dư vị: chi tiết nhỏ ở khung cuối khiến muốn xem lại. Vật đỏ phải còn đỏ đến khung cuối; không cho vật đỏ mờ/biến mất.
8. Nhịp Trà Nguội: Lữ khách làm mọi thứ chậm rãi như người đang uống trà; ít cử chỉ, mỗi dòng tối đa 1 cử chỉ nhỏ, phần lớn thời gian là lặng.
9. Kiểu cú lật (\`kieu_cu_lat\`): chọn 1 trong 4 — \`day_may\` (mặc định: đẩy chậm vào vật đỏ nhỏ/vừa); \`xuat_hien\` (vật đỏ mới vẽ nét xuất hiện ở cú lật rồi đẩy nhẹ); \`keo_rong\` (mở màn cận cảnh, cú lật lùi rộng lộ bối cảnh đổi nghĩa); \`dung_lang\` (máy đứng yên tuyệt đối, chỉ vật đổi đỏ).
TỰ KIỂM trước khi đưa: Liệt kê 3 hình ảnh mạnh nhất trong câu (danh từ/động từ cụ thể). Phương án số 1 phải dùng ít nhất 2 trong 3, và hình ảnh của chữ lật phải là thứ thay đổi ở cú lật. Bỏ hình đi chữ vẫn đứng được; có hình thì cú lật mạnh hơn; hình không lộ đáp án trước chữ lật; đọc lại câu, từng hình ảnh then chốt trong câu (người, vật, hành động) có mặt trên sân khấu chưa. Thử 3 giây: tắt tiếng, không đọc dòng cuối — chỉ nhìn hình quanh cú lật, người xem có thấy 'một chuyện vừa xảy ra' không? Không thấy → phương án yếu, đổi.

## Bước 3 — Xuất Gói Chén JSON
Sau khi chủ kênh chốt phương án ở Bước 2, xuất **đúng 1 khối JSON Gói Chén** theo \`references/goi-chen.md\`:
- Đủ trường gốc: \`phien_ban_goi: 1\`, \`tieu_de\`, \`cau\`, \`cu_lat\`, \`boi_canh\`, \`nhan_vat\`, \`dao_cu\`, \`nhip\`.
- Chỉ dùng mã đạo cụ Tầng A hoặc Tầng B trong \`references/thu-vien.md\` (tuyệt đối KHÔNG xuất mã Tầng C vào JSON), cùng điểm neo, trạng thái, tư thế, động từ và khe vị trí hợp lệ.
- Nhân vật ngồi ghế bắt buộc có \`ngoi_tren: "<id_ghe>.mat_ghe"\` (thêm \`ngoi_vao: "<id_ban>"\` khi ngồi vào bàn); đạo cụ trên bàn dùng \`loai_neo: "tren"\` + \`dat_tren: "<id_ban>.<diem_neo>"\`.
- Không cần ghi \`thoi_luong\` (engine tự tính chậm rãi theo Nhịp Trà Nguội); phản ứng lớn ở \`cu_lat\` phải có \`sau\` ≥ 0.45 (chữ dẫn, hình theo); \`boi_canh.khi_quyen\` để trống trừ khi Bước 2 đã giải thích nghĩa.
- Tuyệt đối không có \`x\`, \`y\`, \`scale\`, \`shapes\`, \`altShapes\`.

## Khi nhận thông báo lỗi từ tool
Khi chủ kênh dán lại đoạn mở đầu bằng **"Gói Chén của bạn bị tool báo các lỗi sau…"**:
- Sửa **đúng** các lỗi được liệt kê, **không đổi phần đã đúng**.
- Xuất lại **TOÀN BỘ** Gói Chén JSON hoàn chỉnh.
`;

// ── Kiểm tra ràng buộc ────────────────────────────────────────────
function verifySkillConstraints(mdText, label) {
  const lines = mdText.trimEnd().split('\n');
  if (label === 'SKILL.md' && lines.length > 80) {
    throw new Error(`SKILL.md vượt quá 80 dòng (${lines.length} dòng)`);
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

  const { md: thuVienMd, counts } = buildThuVienMd();
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

  const skillLines = SKILL_MD_CONTENT.trimEnd().split('\n').length;
  const thuVienLines = thuVienMd.trimEnd().split('\n').length;
  const zipSize = fs.statSync(ZIP_PATH).size;
  console.log(
    `✅ Đã sinh SKILL.md (${skillLines} dòng), thu-vien.md (${thuVienLines} dòng · Tầng A: ${counts.tierA}, Tầng B: ${counts.tierB}, Tầng C: ${counts.tierC}), references/ và ${path.relative(ROOT, ZIP_PATH)} (${(zipSize / 1024).toFixed(1)} KB)`
  );
}

main();
