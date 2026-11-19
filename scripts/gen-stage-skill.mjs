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
  LU_KHACH_HEIGHT_RATIO,
  MIN_RED_AREA_PX2,
  NGUONG_VAT_NHO_CM,
  SEMANTIC_LAYERS,
  SEMANTIC_SLOTS,
  TY_LE_CANH,
  VALIDATION_SAMPLE_STEP_SEC,
} from '../src/stage/stageConstants.ts';
import {
  STAGE_VB_X0,
  STAGE_VB_X1,
  STAGE_VB_Y0,
  STAGE_VB_Y1,
} from '../src/stage/stageGeometry.ts';
import { DEFAULT_GROUND_Y, STAGE_VIEWBOX } from '../src/stage/terrainSystem.ts';
import {
  SEMANTIC_ACTOR_BEAT_VERBS,
  SEMANTIC_ACTOR_ROLES,
  SEMANTIC_BACKDROPS,
  SEMANTIC_BEAT_ANCHORS,
  SEMANTIC_LAYOUTS,
  SEMANTIC_LEANS,
  SEMANTIC_LIGHTINGS,
  SEMANTIC_PIVOT_STYLES,
  SEMANTIC_POSES,
  SEMANTIC_PROP_BEAT_VERBS,
  SEMANTIC_SOCKETS,
  SEMANTIC_TERRAIN_SEGMENT_VERBS,
  SEMANTIC_TERRAINS,
} from '../src/stage/semanticStage.ts';
import {
  ActorSpecSchema,
  AtmosphereItemSchema,
  AtmosphereTypeEnum,
  CameraSpecSchema,
  ColorRoleSchema,
  FocusRoleSchema,
  IdleModeEnum,
  InlineShapeSchema,
  LayerSchema,
  PropEmittersSchema,
  PropSpecSchema,
  ShapeAnimTypeEnum,
  StageScriptSchema,
  TerrainTypeEnum,
  TimelineCueSchema,
  TravelerPoseSchema,
  XKeywordEnum,
} from '../src/stage/stageScriptSchema.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const SKILL_DIR = path.join(ROOT, '.agents/skills/dao-dien-tra-nguoi');
const REF_DIR = path.join(SKILL_DIR, 'references');
const SKILL_MD_PATH = path.join(SKILL_DIR, 'SKILL.md');
const REF_THU_VIEN_PATH = path.join(REF_DIR, 'thu-vien.md');
const REF_GOI_CHEN_PATH = path.join(REF_DIR, 'goi-chen.md');
const REF_LAN_TU_DO_PATH = path.join(REF_DIR, 'lan-tu-do.md');
const EXAMPLE_Q001_PATH = path.join(REF_DIR, 'q001.json');
const EXAMPLE_C19_PATH = path.join(REF_DIR, 'c19.json');
const ZIP_PATH = path.join(SKILL_DIR, 'dao-dien-tra-nguoi.zip');

const SANG_TAC_SKILL_DIR = path.join(ROOT, '.agents/skills/sang-tac-tra-nguoi');
const SANG_TAC_ZIP_PATH = path.join(SANG_TAC_SKILL_DIR, 'sang-tac-tra-nguoi.zip');
const SANG_TAC_FILES = [
  'SKILL.md',
  'references/giong-tra-nguoi.md',
  'references/loi-mon.md',
  'references/motif.md',
  'scripts/kiem_cau.py',
];

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
    `- Bố cục khung video (\`bo_cuc\` — tuỳ chọn, mặc định \`co_dien\`, seed không tự đổi): ${fmtList(Object.keys(SEMANTIC_LAYOUTS))} (\`co_dien\`: sân khấu trên, chữ dưới; \`chan_may\`: chữ trên nền trời, sân khấu dưới; \`khung_cua\`: khung vòm Cửa sổ Á Đông — chỉ chọn khi có chủ đích).`,
    `- Ánh sáng bóng đổ (\`anh_sang\` — tuỳ chọn, **mặc định TẮT**, chỉ chọn khi mang nghĩa rõ và đã giải thích lý do ở Bước 2 như khí quyển): ${fmtList(Object.keys(SEMANTIC_LIGHTINGS))} (\`bong_la\`: bóng lá nắng sớm; \`nan_cua\`: nan cửa sổ; \`den_long\`: quầng đèn lồng ấm; \`suong_hien\`: sương mờ hiên nhà).`,
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

// ── Build references/lan-tu-do.md & references/c19.json từ code ──
function buildLanTuDoMd() {
  const fmt = (arr) => arr.map((x) => `\`${x}\``).join(', ');
  const stageW = STAGE_VB_X1 - STAGE_VB_X0;
  const stageH = STAGE_VB_Y1 - STAGE_VB_Y0;
  const stageCenterX = Math.round((STAGE_VB_X0 + STAGE_VB_X1) / 2);
  const rootKeys = Object.keys(StageScriptSchema.shape).filter(
    (k) => k !== 'legacy' && k !== 'strictValidation' && k !== 'customPropsResolved'
  );
  const actorKeys = Object.keys(ActorSpecSchema.shape);
  const propKeys = Object.keys(PropSpecSchema.shape);
  const shapeKeys = Object.keys(InlineShapeSchema.shape);
  const emitterKeys = Object.keys(PropEmittersSchema.shape);
  const atmoKeys = Object.keys(AtmosphereItemSchema.shape);
  const cameraKeys = Object.keys(CameraSpecSchema.shape);
  const cueKeys = Object.keys(TimelineCueSchema.shape);

  const lines = [
    '# Làn Tự Do (`"che_do": "tu_do"`) — Chuẩn StageScript Toàn Quyền',
    '',
    '> Sinh tự động từ `stageScriptSchema.ts`, `stageGeometry.ts`, `stageConstants.ts`, `terrainSystem.ts` và `validateFreeModeStageScript` qua `npm run gen:skill`. Xem mẫu hoàn chỉnh tại `references/c19.json`.',
    '',
    '## 1. Cấu trúc JSON bọc Chén (dán thẳng vào Studio)',
    '- Object gốc gồm câu chữ + kịch bản sân khấu:',
    '  - `title` (string, bắt buộc): tiêu đề Chén.',
    '  - `segments` (string[], bắt buộc): các dòng thơ/quote — độ dài theo 4 dải S 6–13 · M 14–28 · L 29–42 · XL 43–58 âm tiết (trần 48 tự sáng tác, 58 trích dẫn có tác giả); giới hạn thật là khung chữ, thời lượng video engine tự tính 8.5–24s (4 dải `BAND_S/M/L/XL`, theo `pacingMode` + `textFormat`). Hỗ trợ 2 ký hiệu nhịp hiện chữ (không bao giờ hiện lên video/ảnh bìa/caption/tên file): `" / "` giữa dòng = **tách nhịp** (vế sau hiện ở nhịp kế tiếp, vẫn cùng dòng hiển thị); `"+"` đầu dòng = **nối nhịp** (dòng này hiện cùng nhịp với dòng trên). Engine tự căn nhịp theo **trọng số âm tiết từng nhịp + khoảng nín thở trước cú lật**; mốc `line_N` = lúc dòng hiển thị N bắt đầu hiện (nhịp đầu của dòng), `pivot` tính trong nhịp chứa `pivotWord`.',
    '  - `pivotWord` (string, bắt buộc): cụm chữ đổi đỏ nằm trong dòng cuối của `segments`.',
    '  - `author` (string, tuỳ chọn), `textFormat` (`"POEM"` | `"PROSE"`), `themeId` (`"MINIMAL_LIGHT"` | `"MINIMAL_DARK"` | `"WARM_NOIR"`, mặc định `"MINIMAL_LIGHT"`), `durationMode` (`"AUTO_SEED"` mặc định).',
    '  - `stageScript` (object, bắt buộc): mang cờ **`"che_do": "tu_do"`** (tuyệt đối KHÔNG ghi `"legacy": true`).',
    '',
    '## 2. Khung toạ độ sân khấu & Vùng cấm vẽ',
    `- Khung sân khấu \`viewBox="${STAGE_VIEWBOX}"\`: ngang \`x ∈ [${STAGE_VB_X0}..${STAGE_VB_X1}]\` (rộng ${stageW}, tâm ngang \`x = ${stageCenterX}\`), dọc \`y ∈ [${STAGE_VB_Y0}..${STAGE_VB_Y1}]\` (cao ${stageH}).`,
    `- Đường đất mặc định: \`y = ${DEFAULT_GROUND_Y}\` (khai \`startX\`, \`endX\` trong \`[${STAGE_VB_X0}..${STAGE_VB_X1}]\`; engine tôn trọng đúng \`startX\`/\`endX\` ở mọi mức zoom).`,
    `- **Vùng CẤM vẽ (chặn cứng)**: phía trên \`y < ${STAGE_VB_Y0}\` là vùng **tiêu đề**; phía dưới \`y > ${STAGE_VB_Y1}\` là vùng **khối chữ**. Mọi nhân vật, đạo cụ, hình vẽ và khí quyển phải nằm gọn trong \`y ∈ [${STAGE_VB_Y0}..${STAGE_VB_Y1}]\`.`,
    `- **Cỡ Lữ khách chuẩn**: chiều cao đứng chuẩn = ${Math.round(LU_KHACH_HEIGHT_RATIO * 100)}% chiều cao khung (\`LU_KHACH_HEIGHT_RATIO = ${LU_KHACH_HEIGHT_RATIO}\`, tương ứng \`scale ≈ 1.3–1.44\`, cao ~63–70 đơn vị; lệch > 25% sẽ bị cảnh báo vàng).`,
    '',
    '## 3. Các trường `stageScript` và giá trị hợp lệ (từ `stageScriptSchema.ts`)',
    `- **Cấp gốc \`stageScript\`**: ${fmt(rootKeys)}. Bắt buộc có \`"che_do": "tu_do"\`.`,
    `- **\`terrain\`**: \`type\` trong ${fmt(TerrainTypeEnum.options)}; kèm \`y\` (mặc định ${DEFAULT_GROUND_Y}), \`startX\`, \`endX\`, \`angleDeg\`, \`hillCenterX\`, \`hillHeight\`, \`hillWidth\`, \`forkAtX\`, \`forkAngleDeg\`, \`shoreX\`, \`waterSide\` (\`left\`|\`right\`), \`gapCenterX\`, \`gapHalfWidth\`, \`bridgeProgress\`, \`stepCount\`, \`stepRise\`, \`points\` (\`[[x,y],...]\`), \`customSvgD\`, \`segments[]\` (\`{ id, startX, endX, colorRole, strokeWidth, opacity }\`).`,
    `- **\`actors[]\`**: ${fmt(actorKeys)}.`,
    `  - \`pose\`: ${fmt(TravelerPoseSchema.options)} · \`facing\`: \`left\`, \`right\` · \`layer\`: ${fmt(LayerSchema.options)} · \`role\`: \`lu_khach\`, \`nguoi_b\`.`,
    `  - \`x\`: số trong \`[${STAGE_VB_X0}..${STAGE_VB_X1}]\` hoặc từ khoá ${fmt(XKeywordEnum.options)}.`,
    `  - \`colorRole\`: ${fmt(ColorRoleSchema.options)} · \`focusRole\`: ${fmt(FocusRoleSchema.options)} · \`teaCupRed: true\` làm chén cầm tay đổi đỏ (tính là 1 nguồn đỏ!).`,
    `- **\`props[]\`**: ${fmt(propKeys)}.`,
    `  - Dùng \`type\` sẵn trong kho (\`references/thu-vien.md\`) HOẶC tự vẽ mới bằng \`shapes[]\` / \`altShapes[]\` (đặt \`type\` tự do, kèm \`anchorType\`: \`"ground"\` | \`"hand"\` | \`"center"\`).`,
    `  - Quy ước toạ độ \`y\` của prop: CHỈ \`layer: "sky"\` dùng \`y\` tuyệt đối trong \`[${STAGE_VB_Y0}..${STAGE_VB_Y1}]\` (VD \`y: 200\` cho mây); mọi layer khác (\`far\`/\`mid\`/\`fore\`) dùng \`y\` là **độ lệch so với mặt đất \`terrain.y\`** (\`y: 0\` chạm đất, \`y\` âm là cao hơn mặt đất, VD \`y: -28\` cho cửa sổ trên tường).`,
    `  - \`idle\`: ${fmt(IdleModeEnum.options)} hoặc \`{ type, speed, amplitude, spanX, spanY }\` · \`emitters\`: ${fmt(emitterKeys)}.`,
    `  - \`drawProgress\` (\`0→1\`) vẽ dần nét mọc ra; \`morphProgress\` (\`0→1\`) chuyển từ \`shapes\` sang \`altShapes\`; \`splitProgress\`, \`floatAwayProgress\` (\`0→1\`).`,
    `- **Cách vẽ \`shapes[]\` / \`altShapes[]\`**: ${fmt(shapeKeys)}.`,
    '  - Hình học: `d` (SVG path cục bộ; nếu `anchorType: "ground"`, gốc `(0,0)` nằm ngay mặt đất, vẽ hướng lên dùng `y` âm), `line: [x1,y1,x2,y2]`, `circle: [cx,cy,r]`, `rect: [x,y,w,h,rx?]`, `ellipse: [cx,cy,rx,ry]`.',
    `  - Tô/nét (tuyệt đối không ghi mã màu hex): \`fill\` (\`none\`, \`bg\`, \`ink\`, \`secondary\`, \`accent\`), \`fillOpacity\` (\`0..1\`), \`role\` (${fmt(ColorRoleSchema.options)}), \`strokeScale\`, \`dashed\`, \`opacity\`, \`show\` (\`always\`, \`before_pivot\`, \`after_pivot\`), \`anim.type\` (${fmt(ShapeAnimTypeEnum.options)}).`,
    `- **\`atmosphere[]\`**: ${fmt(atmoKeys)} · \`type\`: ${fmt(AtmosphereTypeEnum.options)}. Lưu ý \`colorRole: "accent"\` hoặc \`leaves\` sau cú lật đều được tính là nguồn đỏ.`,
    `- **\`camera\`**: ${fmt(cameraKeys)} (\`zoom\` trong \`0.6..2.0\`, \`panX\`, \`panY\`).`,
    '  - Máy **KHÔNG** tự đẩy/kéo/rung camera ở cú lật — muốn chuyển động camera thì tự ghi cue `target: "camera"`.',
    '  - Không cần khai `visualDNA` / `forceSolidStyle` / tag `solid_style`: Làn tự do mặc định đã nét đậm (`SOLID_SCENE`), bố cục chuẩn (`CLASSIC_TOP_STAGE`), không gobo.',
    '  - Nhịp xuất hiện: vật/nhân vật có cue `drawProgress` → vẽ nét đúng nhịp đó; có `enterAt` + `fadeDuration` → mờ dần vào đúng thời lượng đó; không ghi gì → chạy nghi thức mở màn mặc định.',
    `- **\`timeline[]\`**: ${fmt(cueKeys)}.`,
    '  - `at`: mốc `"start"`, `"line_1"`, `"line_2"`, `"line_3"`, `"line_4"`, `"pivot"`, `"end"`, hỗ trợ cộng/trừ giây (VD `"start+0.3s"`, `"pivot+0.15s"`, `"pivot+2.2s"`).',
    '  - `duration`: thời lượng chuyển (giây, `0.05..15`) · `target`: `id` của actor/prop hoặc `"camera"` / `"terrain"`.',
    '  - Mẹo neo mốc: neo động tác theo `"line_N"` / `"pivot"` (±s) thay vì `"start+Xs"` dài, vì thời lượng video co giãn theo câu (8.5–24s).',
    '  - Mẹo di chuyển: không cho 2 lệnh di chuyển (`toX`/`toY`) cùng một `target` chồng thời gian — gộp thành 1 lệnh liền (nếu chồng, engine sẽ tự cắt ngắn lệnh đầu).',
    '',
    `## 4. Máy kiểm tra Làn tự do (\`validateFreeModeStageScript\`, quét mỗi ${VALIDATION_SAMPLE_STEP_SEC}s)`,
    '> Không ép TEMPO, không đếm cử chỉ, không giới hạn đạo cụ trong kho — máy chỉ kiểm VỠ HÌNH:',
    '### CHẶN CỨNG (khoá nút Nhập & chặn render)',
    '- Không đúng 1 vật đỏ sau cú lật (0 nguồn đỏ hoặc ≥ 2 nguồn đỏ cùng lúc; đếm cả nguồn đỏ ngầm: `teaCupRed`, `props`/`actors`/`atmosphere` `colorRole: "accent"`, `leaves`, khói/emitter đỏ, đoạn đường đỏ).',
    `- Hình vẽ, nhân vật, đạo cụ hoặc khí quyển tràn lên vùng tiêu đề (\`y0 < ${STAGE_VB_Y0}\`) hoặc tràn xuống vùng khối chữ (\`y1 > ${STAGE_VB_Y1}\`).`,
    '### CẢNH BÁO VÀNG (vẫn cho nhập; preview chụp đúng khung tại thời điểm `t`)',
    '- Đè hoặc đi xuyên giữa hai vật cùng lớp sâu (`nen`/`giua`/`truoc`) hoặc giữa nhân vật với vật.',
    '- Vật hoặc nhân vật lơ lửng / lệch mặt đất > 3 đơn vị mà không có mặt đỡ bên dưới (trừ vật lớp `sky` / treo tường / cầm tay / `anchorType: "center"|"hand"`).',
    '- Nhân vật ở tư thế ngồi (`sit_lean` / `sitProgress >= 0.5`) nhưng không có mặt ngồi bên dưới.',
    `- Cỡ Lữ khách chính lệch > 25% so với chuẩn ${Math.round(LU_KHACH_HEIGHT_RATIO * 100)}% chiều cao khung (\`LU_KHACH_HEIGHT_RATIO\`).`,
    `- Diện tích vật đỏ ở khung cuối nhỏ hơn ngưỡng nhìn rõ (\`MIN_RED_AREA_PX2 = ${MIN_RED_AREA_PX2}\`).`,
    '',
  ];
  return lines.join('\n');
}

function buildC19ExampleJson() {
  const cup19 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/cups/quote-019.json'), 'utf8'));
  const scriptsMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/stage-scripts.json'), 'utf8'));
  const scriptC19 = scriptsMap['SCRIPT_C19_NET_DAT_NAY_MAM'];
  if (!scriptC19) {
    throw new Error('Không tìm thấy SCRIPT_C19_NET_DAT_NAY_MAM trong data/stage-scripts.json');
  }
  const bundle = {
    title: cup19.props.title,
    textFormat: cup19.props.textFormat || 'POEM',
    segments: cup19.props.segments,
    pivotWord: cup19.props.pivotWord,
    themeId: cup19.props.themeId || 'MINIMAL_LIGHT',
    durationMode: cup19.props.durationMode || 'AUTO_SEED',
    stageScript: scriptC19,
  };
  return JSON.stringify(bundle, null, 2) + '\n';
}

// ── Nội dung SKILL.md (≤ 80 dòng) ─────────────────────────────────
const SKILL_MD_CONTENT = `---
name: dao-dien-tra-nguoi
description: Đạo diễn câu chữ 3 bước và xuất kịch bản JSON (Làn tự do mặc định hoặc lối tắt Gói Chén) cho kênh Trà Nguội (@tranguoi.15s). Dùng khi tạo Chén mới, viết thơ/quote, hoặc thiết kế cảnh.
---

# Đạo Diễn Trà Nguội (@tranguoi.15s)

Bạn là Đạo diễn kênh **Trà Nguội**. Trước khi làm, hãy đọc \`references/lan-tu-do.md\` (chuẩn Làn tự do mặc định + mẫu \`references/c19.json\`). Chỉ khi chủ kênh gọi lối tắt **"gói chén"** mới cần bám \`references/goi-chen.md\`, \`references/thu-vien.md\` và \`references/q001.json\`. Làm tuần tự **3 bước**, kết thúc Bước 1 và Bước 2 đều **DỪNG chờ chủ kênh chốt**.

## Nhân vật: Lữ Khách Bóng Mực & Người Thứ Hai (\`nguoi_b\`)
- Giữ nguyên phong cách bóng mực thuỷ mặc tối giản (**không mắt, không lá trà**). Có thể thêm nhân vật thứ 2 (hoặc bóng người qua đường) khi câu có người đối diện hoặc cần tương phản bối cảnh.
- Nhân vật biểu cảm bằng tư thế, hướng đầu, độ nghiêng, bước đi, dừng lại, ngoái nhìn, vươn tay; ít mà đắt.

## Bước 1 — Câu chữ (DỪNG chờ chốt)
- Nếu câu đã chốt từ skill sáng tác \`sang-tac-tra-nguoi\` (hoặc chủ kênh **đưa sẵn câu**): giữ nguyên văn 100%, chỉ chia dòng + đề xuất ký hiệu nhịp + cụm chữ lật ở dòng cuối, **không chấm hay sửa lại câu**.
- Nếu chủ kênh **đưa ý tưởng**: đưa **3 phương án** câu chữ (độ dài theo 4 dải S 6–13 · M 14–28 · L 29–42 · XL 43–58 âm tiết; trần 48 tự sáng tác, 58 trích dẫn có tác giả; giới hạn thật là khung chữ, thời lượng video engine tự tính 8.5–24s; cụm chữ lật nằm ở **dòng cuối**).
- **Nhịp đọc & hiện chữ**: có thể đặt 2 ký hiệu nhịp ngay trong câu để kiểm soát lúc chữ hiện (ký hiệu tự ẩn khi xuất hình): \`" / "\` giữa dòng = **tách nhịp** (vế sau hiện ở nhịp kế tiếp, vẫn cùng dòng); \`"+"\` đầu dòng = **nối nhịp** (dòng này hiện cùng lúc với dòng trên). Đề xuất nhịp đặt dấu nếu câu cần dồn cặp mở đầu hoặc chừa khoảng lặng trước vế lật.
- Giữ chất **“Lắng — Kiệm lời — Đời thực — Có dư vị”**. Tránh từ sáo rỗng bi lụy, khẩu hiệu dạy đời, văn dịch cứng, hashtag rác (\`#fyp\`, \`#foryou\`, \`#xuhuong\`, \`#viral\`).

## Bước 2 — Cú lật (3 phương án ngắn, DỪNG chờ chốt)
NGUYÊN TẮC: hình không kể lại chữ, hình làm cú lật mạnh hơn. Chữ là chính. Sáng tạo tự do hình ảnh đắt nhất cho từng câu (chỉ bị giới hạn bởi kho đạo cụ tầng A/B/C và "chỉ mô tả những gì Gói Chén thể hiện được" khi chủ kênh chọn lối tắt **"gói chén"**).
Mỗi phương án (đưa 3, xếp mạnh → yếu) ghi đủ, mỗi mục 1 dòng:
1. Bản lề: "Người xem tưởng A → câu lật thành B." Không viết được thì hỏi lại chủ kênh.
2. Trước cú lật: hình dựng thế giới của A (bối cảnh quen, Lữ khách sống bình thường), KHÔNG lộ B.
3. Vật đỏ: Vật đỏ phải là hình ảnh nằm TRONG CỤM CHỮ LẬT hoặc DÒNG CUỐI (vd 'Tính đường lui… chẳng được' → vật đỏ gắn với 'đường lui'). Chỉ khi cụm đó không có hình ảnh cụ thể mới lấy từ dòng khác. Chữ lật trừu tượng (kỳ diệu, hạnh phúc, cô đơn, thời gian…) → CỤ THỂ HOÁ thành một vật/hiện tượng nhìn thấy được đang mang khái niệm đó (vd 'kỳ diệu' → nét đất bỗng nảy mầm đỏ; 'cô đơn' → chiếc ghế thứ hai trống). Gán nghĩa vòng vo là SAI.
4. Nhân vật: câu ngôi thứ nhất → Lữ khách là "ta"; câu có người thứ hai ("em", "anh", "người ấy") → PHẢI có nhân vật thứ hai trên sân khấu. Phản ứng nhỏ, thật, hơi vụng; ghi theo từng dòng.
5. Đồ trên sân khấu: mỗi đồ (kể cả khí quyển) phải được nhân vật dùng, nhìn, hoặc mang nghĩa trong câu; đồ chỉ để lấp chỗ trống hay trang trí là SAI.
6. Bối cảnh nhất quán: mọi chi tiết thuộc cùng một không gian sống thật (lối tắt Gói Chén bắt buộc chọn 1 trong 9 bộ \`boi_canh.bo\` trong \`references/thu-vien.md\` và chỉ mô tả những gì Gói Chén thể hiện được).
7. Dư vị: chi tiết nhỏ ở khung cuối khiến muốn xem lại. Đúng **1 vật đỏ duy nhất** và còn đỏ đến khung cuối.
8. Nhịp Trà Nguội: chậm rãi như người đang uống trà, có khoảng lặng trước và sau cú lật.
TỰ KIỂM trước khi đưa: Liệt kê 3 hình ảnh mạnh nhất trong câu (danh từ/động từ cụ thể). Phương án số 1 phải dùng ít nhất 2 trong 3, và hình ảnh của chữ lật phải là thứ thay đổi ở cú lật. Bỏ hình đi chữ vẫn đứng được; có hình thì cú lật mạnh hơn; hình không lộ đáp án trước chữ lật. Thử 3 giây: tắt tiếng, không đọc dòng cuối — chỉ nhìn hình quanh cú lật, người xem có thấy 'một chuyện vừa xảy ra' không? Không thấy → đổi.

## Bước 3 — Xuất JSON (2 lối)
Sau khi chủ kênh chốt phương án ở Bước 2, xuất **đúng 1 khối JSON** hoàn chỉnh:

### Lối 1 (MẶC ĐỊNH) — Làn tự do (\`"che_do": "tu_do"\`)
Đọc \`references/lan-tu-do.md\` và mẫu \`references/c19.json\`:
- Bọc Chén gồm \`title\`, \`segments[]\`, \`pivotWord\`, và \`stageScript\` mang cờ **\`"che_do": "tu_do"\`** (KHÔNG ghi \`legacy: true\`).
- Tự do sáng tạo địa hình, nhiều nhân vật, đạo cụ tự vẽ bằng nét SVG cục bộ trong \`shapes[]\`/\`altShapes[]\`, \`drawProgress\`, \`morphProgress\`, toạ độ, \`timeline[]\`, \`camera\`. Không ghi mã màu hex — dùng \`role\`/\`fill\` (\`ink\`, \`secondary\`, \`accent\`, \`bg\`, \`none\`).
- Tuân thủ 2 luật chặn cứng của máy: **đúng 1 vật đỏ** sau cú lật (tính cả \`teaCupRed\`, \`atmosphere\` accent/\`leaves\`, khói đỏ) và **mọi hình nằm gọn trong vùng hình** (không tràn lên tiêu đề hay xuống khối chữ). Giữ đồ tiếp đất chắc, không đè cùng lớp, cỡ Lữ khách gần chuẩn 28% khung.

### Lối 2 (Lối tắt — chỉ dùng khi chủ kênh nói "gói chén")
Đọc \`references/goi-chen.md\`, \`references/thu-vien.md\` và mẫu \`references/q001.json\`:
- Đủ trường gốc: \`phien_ban_goi: 1\`, \`tieu_de\`, \`cau\`, \`cu_lat\`, \`boi_canh\`, \`nhan_vat\`, \`dao_cu\`, \`nhip\`.
- Chỉ dùng mã đạo cụ Tầng A hoặc Tầng B trong \`references/thu-vien.md\` (không xuất Tầng C), không ghi toạ độ hay mảng hình vẽ tự do; ngồi ghế dùng \`ngoi_tren\`, đặt trên bàn dùng \`dat_tren\`, phản ứng lớn ở \`cu_lat\` có \`sau\` ≥ 0.45.

## Khi nhận thông báo lỗi từ tool
Khi chủ kênh dán lại đoạn mở đầu bằng **"Kịch bản làn tự do của bạn bị tool báo các lỗi sau…"** hoặc **"Gói Chén của bạn bị tool báo các lỗi sau…"**:
- Sửa **đúng** các lỗi được liệt kê, **không đổi phần đã đúng** và **giữ đúng lối** (làn tự do hoặc Gói Chén) của bản trước.
- Xuất lại **TOÀN BỘ** khối JSON hoàn chỉnh để chủ kênh dán lại ngay.
`;

// ── Kiểm tra ràng buộc ────────────────────────────────────────────
function verifySkillConstraints(mdText, label, opts = {}) {
  const lines = mdText.trimEnd().split('\n');
  if (label === 'SKILL.md' && lines.length > 80) {
    throw new Error(`SKILL.md vượt quá 80 dòng (${lines.length} dòng)`);
  }
  const forbidden = [
    { re: /#[0-9A-Fa-f]{3,6}\b/, name: 'mã màu hex' },
  ];
  if (!opts.allowFreeModeCoords) {
    forbidden.push(
      { re: /<path\b|\bd="M\s/i, name: 'đường SVG' },
      { re: /\bviewBox\b|\bfps\b|\bpx\b/i, name: 'thông số pixel / fps / viewBox' },
      { re: /"x"\s*:|"y"\s*:|"scale"\s*:|"shapes"\s*:/i, name: 'toạ độ / shapes' }
    );
  }
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
  const lanTuDoMd = buildLanTuDoMd();
  const c19Content = buildC19ExampleJson();
  const goiChenMd = fs.readFileSync(path.join(ROOT, 'docs/GOI-CHEN.md'), 'utf8');
  const q001Content = fs.readFileSync(path.join(ROOT, 'docs/goi-mau/q001.json'), 'utf8');

  verifySkillConstraints(SKILL_MD_CONTENT, 'SKILL.md');
  verifySkillConstraints(thuVienMd, 'references/thu-vien.md');
  verifySkillConstraints(lanTuDoMd, 'references/lan-tu-do.md', { allowFreeModeCoords: true });

  fs.writeFileSync(SKILL_MD_PATH, SKILL_MD_CONTENT, 'utf8');
  fs.writeFileSync(REF_THU_VIEN_PATH, thuVienMd, 'utf8');
  fs.writeFileSync(REF_GOI_CHEN_PATH, goiChenMd, 'utf8');
  fs.writeFileSync(REF_LAN_TU_DO_PATH, lanTuDoMd, 'utf8');
  fs.writeFileSync(EXAMPLE_Q001_PATH, q001Content, 'utf8');
  fs.writeFileSync(EXAMPLE_C19_PATH, c19Content, 'utf8');

  const pyZip = `
import zipfile
with zipfile.ZipFile(${JSON.stringify(ZIP_PATH)}, "w", compression=zipfile.ZIP_DEFLATED) as zf:
    zf.write(${JSON.stringify(SKILL_MD_PATH)}, arcname="SKILL.md")
    zf.write(${JSON.stringify(REF_LAN_TU_DO_PATH)}, arcname="references/lan-tu-do.md")
    zf.write(${JSON.stringify(EXAMPLE_C19_PATH)}, arcname="references/c19.json")
    zf.write(${JSON.stringify(REF_THU_VIEN_PATH)}, arcname="references/thu-vien.md")
    zf.write(${JSON.stringify(REF_GOI_CHEN_PATH)}, arcname="references/goi-chen.md")
    zf.write(${JSON.stringify(EXAMPLE_Q001_PATH)}, arcname="references/q001.json")
`;
  const r = spawnSync('/usr/bin/python3', ['-c', pyZip], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('python3 zip thất bại');

  // TS1: Đóng gói skill sáng tác câu chữ (chỉ đóng đúng 5 file nguồn, không sửa nội dung, không đưa __pycache__)
  const sangTacEntries = SANG_TAC_FILES.map((rel) => {
    const abs = path.join(SANG_TAC_SKILL_DIR, rel);
    if (!fs.existsSync(abs)) {
      throw new Error(`Thiếu file skill sáng tác: ${path.relative(ROOT, abs)}`);
    }
    return { abs, arc: rel };
  });
  const pyZipSangTac = `
import zipfile
entries = ${JSON.stringify(sangTacEntries)}
with zipfile.ZipFile(${JSON.stringify(SANG_TAC_ZIP_PATH)}, "w", compression=zipfile.ZIP_DEFLATED) as zf:
    for item in entries:
        zf.write(item["abs"], arcname=item["arc"])
`;
  const r2 = spawnSync('/usr/bin/python3', ['-c', pyZipSangTac], { stdio: 'inherit' });
  if (r2.status !== 0) throw new Error('python3 zip sang-tac-tra-nguoi thất bại');

  const skillLines = SKILL_MD_CONTENT.trimEnd().split('\n').length;
  const thuVienLines = thuVienMd.trimEnd().split('\n').length;
  const lanTuDoLines = lanTuDoMd.trimEnd().split('\n').length;
  const zipSize = fs.statSync(ZIP_PATH).size;
  const sangTacZipSize = fs.statSync(SANG_TAC_ZIP_PATH).size;
  console.log(
    `✅ Đã sinh SKILL.md (${skillLines} dòng), lan-tu-do.md (${lanTuDoLines} dòng), c19.json, thu-vien.md (${thuVienLines} dòng · Tầng A: ${counts.tierA}, Tầng B: ${counts.tierB}, Tầng C: ${counts.tierC}), references/, ${path.relative(ROOT, ZIP_PATH)} (${(zipSize / 1024).toFixed(1)} KB) và ${path.relative(ROOT, SANG_TAC_ZIP_PATH)} (${(sangTacZipSize / 1024).toFixed(1)} KB)`
  );
}

main();
