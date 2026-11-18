/**
 * Các hằng số chuẩn hoá dùng chung cho Engine Remotion (`src/stage/`), Validator & CLI Audit.
 */

// MỘT hằng số diện tích vật đỏ tối thiểu duy nhất trên khung 1080×1920 (đồng bộ với tn-core)
export const MIN_RED_AREA_PX2 = 500;

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
 * Hằng số Tự căn khung chung cho mọi Chén:
 * - Khung bao chung của mọi nhân vật và đạo cụ chiếm 58% chiều ngang vùng hình.
 * - Chừa lề trên tối thiểu 12% chiều cao vùng hình.
 */
export const AUTO_FRAME_TARGET_WIDTH_RATIO = 0.58;
export const AUTO_FRAME_MIN_TOP_MARGIN_RATIO = 0.12;

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
