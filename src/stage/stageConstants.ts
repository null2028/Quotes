/**
 * Các hằng số chuẩn hoá dùng chung cho Engine Remotion (`src/stage/`), Validator & CLI Audit.
 */

// MỘT hằng số diện tích vật đỏ tối thiểu duy nhất trên khung 1080×1920 (đồng bộ với tn-core)
export const MIN_RED_AREA_PX2 = 2400;

// 3 lớp sâu ngữ nghĩa: chỉ kiểm tra đè nhau giữa các vật CÙNG lớp
export const SEMANTIC_LAYERS = ['nen', 'giua', 'truoc'] as const;
export type SemanticLayer = (typeof SEMANTIC_LAYERS)[number];

// 5 loại neo chuẩn hoá cho mọi đạo cụ trong kịch bản ngữ nghĩa
export const ANCHOR_KINDS = ['dat', 'tuong', 'troi', 'tren', 'cam'] as const;
export type AnchorKind = (typeof ANCHOR_KINDS)[number];

// Trạng thái phê duyệt đạo cụ trong propCatalog
export const PROP_CATALOG_STATUSES = ['duyet', 'nhap'] as const;
export type PropCatalogStatus = (typeof PROP_CATALOG_STATUSES)[number];

// Các khe vị trí ngang ngữ nghĩa ánh xạ sang toạ độ sân khấu (STAGE_VIEWBOX: 62..478)
export const SEMANTIC_SLOTS = {
  xa_trai: 115,
  trai: 175,
  giua_trai: 225,
  giua: 270,
  giua_phai: 315,
  phai: 365,
  xa_phai: 425,
} as const;
export type SemanticSlot = keyof typeof SEMANTIC_SLOTS;

// Độ cao treo tường mặc định tính từ mặt đất (dành cho loại neo `tuong`, gốc giữa đáy bệ cửa cách mặt đất 26 đơn vị)
export const WALL_MOUNT_Y_OFFSET = -26;

// Khoảng hở tối thiểu từ đáy vật loại `tuong` tới mặt đất (đảm bảo vật treo tường không bao giờ chạm đất)
export const MIN_WALL_CLEARANCE_UNITS = 14;

// Toạ độ Y mặc định trên bầu trời (dành cho loại neo `troi`)
export const SKY_MOUNT_Y = 182;

// Bước lấy mẫu thời gian dọc toàn bộ video khi kiểm tra va chạm / lơ lửng / vùng an toàn (giây)
export const VALIDATION_SAMPLE_STEP_SEC = 0.25;

// Ngưỡng kiểm tự động: bản đỏ phải GIỐNG HỆT DÁNG bản thường (cùng hộp bao và cùng silhouette)
export const MAX_RED_BBOX_DELTA = 0.12;
export const MIN_RED_SILHOUETTE_IOU = 0.98;

// === LUẬT PHÓNG ĐẠI VẬT NHỎ & TỶ LỆ CẢNH THỐNG NHẤT ===
// Tỷ lệ cảnh cơ sở (đơn vị catalog / cm): Lữ khách cao ~152cm = 48.5 đơn vị; bàn làm việc dài 112cm = 36 đơn vị.
export const TY_LE_CANH = 0.32;

// Ngưỡng phân tách vật nhỏ (< 30 cm) và vật lớn (>= 30 cm)
export const NGUONG_VAT_NHO_CM = 30;

// MỘT hằng số phóng đại chung duy nhất cho mọi vật nhỏ dưới 30 cm (nằm chính giữa khoảng 1.8–2.2); vật >= 30 cm dùng hệ số 1.0
export const HE_SO_PHONG_DAI = 2.0;

// Sai số tối đa cho phép giữa kích thước hiển thị thực tế và công thức (15%)
export const MAX_REAL_SIZE_DEVIATION = 0.15;

// Hệ số scale đồng nhất trong cảnh giữa Lữ khách và toàn bộ đạo cụ (1:1 tuyệt đối giữa chén cầm tay và chén đặt trên bậu cửa/bàn)
export const DEFAULT_SCENE_SCALE = 1.18;

// Mức đẩy máy quay tự động tại cú lật (14% — nằm trong khoảng 10–15% chuẩn tn-core) khi vật đỏ là vật nhỏ
export const PIVOT_CAMERA_PUSH_IN_ZOOM = 1.14;

// Kích thước chuẩn của chén trà trên tay Lữ khách trong CloakedTraveler.tsx (rộng 7.0 + viền nét, cao 5.0 + viền nét)
export const TRAVELER_HAND_TEACUP_SPAN = 7.7;

export function computeExpectedCatalogSpanFromCm(kichThuocThatCm: number): number {
  const heSo = kichThuocThatCm < NGUONG_VAT_NHO_CM ? HE_SO_PHONG_DAI : 1.0;
  return Number((kichThuocThatCm * TY_LE_CANH * heSo).toFixed(2));
}

/**
 * Hằng số Cỡ Nhân Vật Cố Định & Tự căn khung (T7a):
 * - Lữ khách đứng luôn cao đúng LU_KHACH_HEIGHT_RATIO (28% chiều cao vùng hình STAGE_VB_H = 250 → scale chuẩn 1.40).
 * - Tự căn khung chỉ dịch ngang căn giữa cụm cảnh và THU NHỎ tối thiểu 0.75× cỡ chuẩn nếu cảnh rộng quá vùng hình (không bao giờ phóng to vượt cỡ chuẩn).
 */
export const LU_KHACH_HEIGHT_RATIO = 0.28;
export const LU_KHACH_STANDING_UNITS = 50;
export const AUTO_FRAME_MIN_SHRINK_RATIO = 0.75;
export const AUTO_FRAME_MIN_TOP_MARGIN_RATIO = 0.12;

/**
 * Bộ hằng số Nhịp Trà Nguội — một chỗ duy nhất điều chỉnh nhịp toàn kênh.
 */
export const TEMPO = {
  MIN_LEAN_SEC: 2.0,
  MIN_LOOK_TURN_SEC: 1.2,
  MIN_FLINCH_SEC: 0.6,
  FLINCH_LEAN_DEG: -3.5,
  WALK_SPEED_UNITS_PER_SEC: 32,
  MIN_WALK_SEC: 2.0,
  MIN_STEP_BACK_SEC: 1.2,
  WALK_STRIDE_MULT: 1.22,
  RED_TRANSITION_SEC: 0.85,
  EMITTER_TRANSITION_SEC: 1.6,
  DROP_GRAVITY_SEC: 0.95,
  POST_MOTION_HOLD_SEC: 1.0,
  MAX_ACTIVE_MOTION_RATIO: 0.4,
  MAX_MAJOR_MOTIONS_TOTAL: 4,
  MAX_MOTIONS_PER_LINE: 1,
  MAX_MOTIONS_AFTER_PIVOT: 2,
  RED_COLOR_DELAY_AFTER_PIVOT_SEC: 0.4,
  PIVOT_REACTION_MIN_DELAY_SEC: 0.4,
  PIVOT_WINDOW_BEFORE_SEC: 0.35,
  LEAN_DEG: {
    thang: 0,
    nhe_truoc: 8,
    guc: 13,      // cúi đầu vai chùng (wSitSlump ≈ 0.71, deepSlump = 0 — không gập xuống bàn)
    guc_sau: 22,  // gục sâu xuống bàn (deepSlump = 1 — kiệt sức)
    nga_lung: -3,
  },
  BREATH_CYCLE_SEC: 4.5,
  STILL_LEAN_BREATH_AMP_DEG: 0.55,

  // === Nghi thức Mở màn (T7c) ===
  MO_MAN_TERRAIN_DUR_SEC: 0.9,       // Thời lượng vẽ đường đất trái→phải
  MO_MAN_PROP_DUR_SEC: 0.4,          // Thời lượng vẽ nét+wash mỗi đạo cụ
  MO_MAN_PROP_STAGGER_SEC: 0.2,      // Khoảng cách giữa hai đạo cụ liên tiếp
  MO_MAN_ACTOR_DUR_SEC: 0.5,         // Thời lượng mực loang nhân vật
  MO_MAN_TOTAL_MAX_SEC: 2.5,         // Tổng mở màn tối đa (gói gọn trong dòng 1)
  MO_MAN_FORK_DELAY_SEC: 0.25,       // Delay vẽ nhánh ngã rẽ sau đường chính

  // === Đẩy máy cú lật (T7c) ===
  PIVOT_PUSH_DUR_SEC: 2.0,           // Thời lượng đẩy máy quay sau cú lật
  PIVOT_PUSH_MAX_ZOOM: 2.2,          // Mức zoom tối đa cho đẩy máy
  PIVOT_PUSH_MIN_ZOOM: 1.1,          // Mức zoom tối thiểu khi vật đỏ đã đủ to
  PIVOT_PUSH_RED_AREA_MULT: 2.0,     // Nhân hệ số MIN_RED_AREA_PX2 để tính mức đẩy
} as const;

// =====================================================================
// === HẰNG SỐ NÉT MỰC LỮ KHÁCH & ĐẠO CỤ (trích từ engine cũ 7c1fe76) ===
// =====================================================================

/** Độ dày nét cơ sở mặc định (strokeWidth truyền từ DSP, trước khi chia cho scale) */
export const INK_BASE_STROKE_WIDTH = 2.6;

/** Hệ số quy đổi effStroke = (INK_EFF_STROKE_FACTOR * strokeScaleFactor) / scale^0.78 */
export const INK_EFF_STROKE_FACTOR = 1.35;

/** Luỹ thừa scale khi tính effStroke: effStroke ∝ 1 / scale^INK_SCALE_POWER */
export const INK_SCALE_POWER = 0.78;

/** Hệ số nhân nét tay chân khi solidFill (tô đặc) */
export const INK_LIMB_MULT_SOLID = 0.84;

/** Hệ số nhân nét tay chân khi không solidFill (nét viền) */
export const INK_LIMB_MULT_OUTLINE = 0.92;

/** Độ trong suốt nét tay chân khi solidFill */
export const INK_LIMB_OPACITY_SOLID = 0.92;

/** Độ trong suốt nét tay chân khi không solidFill */
export const INK_LIMB_OPACITY_OUTLINE = 0.86;

/** Độ trong suốt chân sau (backLeg opacity khi solidFill / outline) */
export const INK_BACK_LEG_OPACITY_SOLID = 0.8;
export const INK_BACK_LEG_OPACITY_OUTLINE = 0.76;

/** Nét viền áo choàng khi tô đặc (solidFill) — dùng lúc drawing */
export const INK_CLOAK_STROKE_MULT_SOLID = 0.92;

/** Nét viền áo / đầu: strokeOpacity cố định */
export const INK_STROKE_OPACITY = 0.88;

/** fillOpacity áo choàng khi không solidFill (outline wash) */
export const INK_CLOAK_FILL_OPACITY_OUTLINE = 0.12;

/** fillOpacity đầu khi không solidFill */
export const INK_HEAD_FILL_OPACITY_OUTLINE = 0.13;

/** Nét sọc lưng áo choàng (fold line) — khi solidFill */
export const INK_FOLD_STROKE_MULT_SOLID = 0.44;
export const INK_FOLD_OPACITY_SOLID = 0.45;

/** Nét sọc lưng áo choàng — khi outline */
export const INK_FOLD_STROKE_MULT_OUTLINE = 0.58;
export const INK_FOLD_OPACITY_OUTLINE = 0.42;

/** Độ dài xương cánh tay trên & cẳng tay (bản cũ 7c1fe76) */
export const INK_UPPER_ARM_LEN = 7.4;
export const INK_FOREARM_LEN = 7.8;

/** Bán kính đầu solidFill / outline (bản cũ 7c1fe76) */
export const INK_HEAD_RADIUS_SOLID = 5.95;
export const INK_HEAD_RADIUS_OUTLINE = 6.2;

/** clampedLean tối đa (bản cũ 7c1fe76 = 24; bản mới mở rộng lên 26 cho dáng gục) */
export const INK_MAX_LEAN_DEG_STAND = 24;
export const INK_MAX_LEAN_DEG_SLUMP = 26;

/** wSitSlump divisor (bản cũ 7c1fe76 = 14) */
export const INK_SIT_SLUMP_DIVISOR = 14;


// =====================================================================
// === HẰNG SỐ NÉT ĐẠO CỤ (propCatalog) — chuẩn từ engine cũ 7c1fe76 ===
// =====================================================================

/** Nét cơ sở mịn cho đạo cụ (baseFineStroke = PROP_FINE_STROKE * (strokeWidth/2.6) * focusMult) */
export const PROP_FINE_STROKE = 1.35;

/** fillOpacity chuẩn cho wash đóng (fill="bg") — engine cũ dùng 0.11-0.14 */
export const PROP_WASH_FILL_OPACITY = 0.13;

/** Độ phủ tô đỏ cho riêng trạng thái đỏ của vật cú lật (bản thường giữ nguyên nhẹ) */
export const RED_PIVOT_FILL_OPACITY = 0.7;

/** strokeScale chuẩn cho nét thân chính đạo cụ */
export const PROP_BODY_STROKE_SCALE = 1.0;

/** strokeScale chuẩn cho nét chi tiết mảnh đạo cụ */
export const PROP_DETAIL_STROKE_SCALE = 0.65;

/** strokeScale tối đa cho nét thân (engine cũ hiếm khi vượt 1.15) */
export const PROP_MAX_BODY_STROKE_SCALE = 1.15;
