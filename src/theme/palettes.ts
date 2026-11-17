export interface ThemePalette {
  id: string;
  name: string;
  background: string;       // Màu nền chính (tâm giấy sáng ấm)
  backgroundEdge: string;   // Màu chuyển êm ra 4 viền (tạo chiều sâu giấy dó & nổi bật UI trắng của TikTok)
  surfaceSubtle: string;    // Đường kẻ lưới Swiss Grid mảnh thanh lịch trên mặt giấy
  inkPrimary: string;       // Mực Tàu chính
  inkSecondary: string;     // Mực phụ cho Header CHÉN, chữ ký • TRÀ NGUỘI & chi tiết sân khấu phụ
  accent: string;           // Ấn Đỏ Chu Sa đồng họ (tương thích ngược cảnh cũ)
  accentText: string;       // Đỏ Chu Sa tối ưu độ đọc cho Text pivotWord, line cọ dọc & chấm ấn chữ
  accentProp: string;       // Đỏ Chu Sa sơn mài tối ưu sắc độ cho Đạo cụ sân khấu sau Pivot
  grainOpacity: number;
}

export type ColorPalette = ThemePalette;

/**
 * Hệ 3 Bảng Màu Signature Studio V8.5 của kênh Trà Nguội (@tranguoi.15s):
 * - 2 nền giấy dó sáng/dịu: MINIMAL_LIGHT (Giấy Trà Ấm - chủ đạo), MINIMAL_DARK (Khói Trà Chiều).
 * - 1 nền đêm tương phản cao: WARM_NOIR (Ô Long Cổ - Tối ấm).
 * - Cả 3 bảng màu đều tách riêng kênh accentText / accentProp cùng họ Đỏ Triện Chu Sa để giữ đồng nhất nhận diện trên tường kênh.
 */
export const THEME_PALETTES: Record<string, ThemePalette> = {
  MINIMAL_LIGHT: {
    id: 'MINIMAL_LIGHT',
    name: 'Giấy Trà Ấm (Signature)',
    background: '#F1EAE0',      // Tâm giấy dó kem trà ấm chuẩn nhận diện kênh
    backgroundEdge: '#DFD5C5',  // Viền trầm ấm giúp nổi rõ cột icon trắng TikTok & hòa mượt bóng đổ đáy
    surfaceSubtle: '#C9BFAEE6', // Đường rãnh kẻ mảnh thanh lịch
    inkPrimary: '#1E1B18',      // Mực đen nâu than sâu (tương phản ~14.3:1)
    inkSecondary: '#6B6259',    // Nâu xám ấm cho CHÉN & • TRÀ NGUỘI
    accent: '#CE472E',          // Đỏ Chu Sa Signature của Trà Nguội
    accentText: '#C8432B',      // Chu Sa đậm nét cho Text pivotWord & line dọc trên giấy kem
    accentProp: '#D44D33',      // Chu Sa tươi sơn mài cho Đạo cụ sân khấu
    grainOpacity: 0.055,
  },
  MINIMAL_DARK: {
    id: 'MINIMAL_DARK',
    name: 'Khói Trà Chiều (Trầm lắng)',
    background: '#E4DDD3',      // Giấy nhuộm khói chiều xám nâu ấm — trầm tĩnh ban đêm nhưng không đen kịt
    backgroundEdge: '#CFC5B6',  // Viền khói trà sâu tạo chiều sâu tĩnh mịch
    surfaceSubtle: '#B8AEA0E6', // Đường rãnh tiệp nền giấy khói
    inkPrimary: '#1C1917',      // Mực than trà đậm sắc nét
    inkSecondary: '#615951',    // Xám khói ấm
    accent: '#C54129',          // Đỏ triện chu sa trầm tiệp giấy khói chiều
    accentText: '#BF3E26',      // Chu Sa đậm tăng tương phản chữ trên giấy khói
    accentProp: '#CC4830',      // Chu Sa ấm cho Đạo cụ sân khấu
    grainOpacity: 0.058,
  },
  WARM_NOIR: {
    id: 'WARM_NOIR',
    name: 'Ô Long Cổ (Tối ấm)',
    background: '#1B1714',      // Nền nâu gỗ trà Ô Long đêm ấm
    backgroundEdge: '#120F0D',  // Viền hổ phách đêm sâu tăng chiều sâu tĩnh mịch
    surfaceSubtle: '#362E28E6', // Đường rãnh & vòm cửa sổ nâu trầm tinh tế trên nền tối ấm
    inkPrimary: '#EDE5D8',      // Mực kem ngà ấm dịu mắt ban đêm (14.25:1)
    inkSecondary: '#B5A898',    // Xám trà ấm sáng (7.65:1) rõ nét cho CHÉN & • TRÀ NGUỘI
    accent: '#DC5035',          // Đỏ Chu Sa ấm gốc trên nền đêm
    accentText: '#F06A4E',      // Chu Sa hổ phách sáng (5.83:1 WCAG AA) cho Text pivotWord & vạch cọ dọc
    accentProp: '#DF5438',      // Chu Sa sơn mài (4.63:1) nổi khối đạo cụ sân khấu ban đêm
    grainOpacity: 0.064,
  },
};

/**
 * Xác định bảng màu thuộc hệ nền tối (độ sáng tương đối < 0.25) để bật hạt nhiễu Luma/AQ chống bệt dải màu.
 */
export function isDarkThemePalette(themeId?: string): boolean {
  const pal = THEME_PALETTES[themeId ?? ''];
  if (!pal) return false;
  const hex = pal.background.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum < 0.25;
}

export const LAYOUT_TOKENS = {
  width: 1080,
  height: 1920,
  fps: 60,
  strokeWidth: 3.1,
  // Hệ Tọa Độ Chuẩn Thực Chiến Studio V8.5 (Khóa kép: Safe Đa Kênh X=[132,832], Y=[180,1540] VÀ Lưới Profile 3:4 Y=[240,1680]):
  // - Header (x = 132..948, y = 268..320): Đối xứng lề trái = lề phải = 132px (rộng 816px), thẳng trục hoàn toàn với Sân khấu.
  // - Stage giữ tâm chuẩn khung 9:16 (x = 132..948, rộng 816px × cao 490px, y = 342..832).
  // - Khối Quote + • TRÀ NGUỘI: gọn trong X=[132..832] (700px, né sạch cột icon TikTok X>=833), Y=[862..1538], chữ rộng 678px.
  swissGrid: {
    iphoneCropX: 54,
    safeTop: 268,
    safeBottom: 382,
    safeLeft: 132,
    safeRight: 248,
    contentWidth: 700,          // Khối chữ khóa chuẩn trong Safe Đa Kênh [132..832]
    quoteBlockWidth: 700,       // 132 + 700 = 832 (<= 833, không chạm cột nút phải TikTok)
    marginLeft: 132,            // Thẳng hàng stageLeft=132, cách mép xén iPhone 9:19.5 (97px) 35px
    marginRightTop: 132,        // Cân bằng lề phải Header = lề trái = 132px
    marginRightBottom: 248,
    headerLeft: 132,            // Header đối xứng tâm X=[132..948] (132 + 816 + 132 = 1080)
    headerWidth: 816,
    headerTop: 268,             // (>= 240 của lưới 3:4 + 28px lề an toàn)
    headerHeight: 52,
    stageLeft: 132,             // Stage 816px giữ đối xứng tâm X=540 (132 + 816 + 132 = 1080)
    stageTop: 342,              // Y = 342..832 (490px)
    stageWidth: 816,
    stageHeight: 490,
    typographyTop: 862,         // Neo 3 (Khối Quote + Tác giả + • TRÀ NGUỘI): 862..1538 (676px)
    typographyMaxBottom: 1538,  // Trần đáy khóa chặt trong Safe Zone Y <= 1540px
    typographyMaxWidth: 678,    // 700px trừ 22px rãnh cọ đọc dọc -> 678px
  },
  typography: {
    baseFontSize: 42,           // Cỡ chữ chuẩn mới rõ nét toàn kênh (42px ở 1.00x)
    minFontSize: 38,            // Sàn khóa cứng tối thiểu khi trích dẫn văn học cực dài chạm đáy y = 1538px
    maxFontSize: 48,            // Trần khóa cứng tối đa khi tinh chỉnh thủ công (tới 1.15x)
    railOffsetPx: 22,           // Khoảng cách từ nét cọ Đỏ Chu Sa tới mép chữ
  },
} as const;
