export interface ThemePalette {
  id: string;
  name: string;
  background: string;       // Màu nền chính (tâm giấy sáng ấm)
  backgroundEdge: string;   // Màu chuyển êm ra 4 viền (tạo chiều sâu giấy dó & nổi bật UI trắng của TikTok)
  surfaceSubtle: string;    // Đường kẻ lưới Swiss Grid mảnh thanh lịch trên mặt giấy
  inkPrimary: string;       // Mực Tàu chính (luôn là tông mực tối trên nền giấy, không dùng nền đen âm bản)
  inkSecondary: string;     // Mực phụ cho Header CHÉN & chữ ký • TRÀ NGUỘI
  accent: string;           // Ấn Đỏ Chu Sa đồng họ xuyên suốt nhận diện kênh
  grainOpacity: number;
}

export type ColorPalette = ThemePalette;

/**
 * Hệ Màu Signature "Một Chất Giấy Dó — Bốn Sắc Nước Trà" của kênh Trà Nguội (@tranguoi.15s):
 * - Khóa cứng Ô 1 (MINIMAL_LIGHT — Giấy Trà Ấm) làm Signature chủ đạo cho 80–85% video toàn kênh.
 * - Loại bỏ nền đen âm bản: cả 4 bảng màu đều là Mực Than trên nền giấy sáng/trầm dịu (80%–91%)
 *   và giữ chung một họ Đỏ Triện Chu Sa (#CE472E – #C54129) để đồng nhất tuyệt đối trên tường kênh TikTok.
 */
export const THEME_PALETTES: Record<string, ThemePalette> = {
  MINIMAL_LIGHT: {
    id: 'MINIMAL_LIGHT',
    name: 'Giấy Trà Ấm (Signature)',
    background: '#F1EAE0',      // Tâm giấy dó kem trà ấm chuẩn nhận diện kênh
    backgroundEdge: '#DFD5C5',  // Viền trầm ấm giúp nổi rõ cột icon trắng TikTok & hòa mượt bóng đổ đáy
    surfaceSubtle: '#C9BFAEE6', // Đường rãnh kẻ mảnh thanh lịch
    inkPrimary: '#1E1B18',      // Mực đen nâu than sâu (tương phản ~14:1)
    inkSecondary: '#6B6259',    // Nâu xám ấm cho CHÉN & • TRÀ NGUỘI
    accent: '#CE472E',          // Đỏ Chu Sa Signature của Trà Nguội
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
    grainOpacity: 0.058,
  },
  WARM_NOIR: {
    id: 'WARM_NOIR',
    name: 'Ô Long Cổ (Hoài niệm)',
    background: '#EDE1CE',      // Giấy sách xưa ủ màu nước trà Ô Long lâu năm
    backgroundEdge: '#D8C7AE',  // Viền hổ phách trầm hoài cổ
    surfaceSubtle: '#C1AF95E6',
    inkPrimary: '#241D17',      // Mực nâu trầm cổ điển
    inkSecondary: '#6E6053',
    accent: '#C6462C',          // Đỏ chu sa trầm ấm
    grainOpacity: 0.06,
  },
  SLATE_CALM: {
    id: 'SLATE_CALM',
    name: 'Men Lam Sương (An nhiên)',
    background: '#E7ECE8',      // Men gốm bạch trà trong sương sớm thanh tịnh
    backgroundEdge: '#D2DDD7',  // Viền ngọc xám dịu mát
    surfaceSubtle: '#BAC7C0E6',
    inkPrimary: '#1A221F',      // Mực than tùng sâu
    inkSecondary: '#5C6A64',
    accent: '#C8442E',          // Đỏ chu sa nổi thanh thoát trên nền men lạnh
    grainOpacity: 0.048,
  },
};

export const LAYOUT_TOKENS = {
  width: 1080,
  height: 1920,
  fps: 60,
  strokeWidth: 3.1,
  // Hệ Tọa Độ Chuẩn Thực Chiến Trên iPhone TikTok (9:19.5 crop ~54px mỗi mép trái/phải của khung 1080×1920):
  // - Header (y = 295..351, rộng đối xứng 816px): nằm thoáng dưới nút < và thanh "Tìm nội dung liên quan".
  // - Stage mở rộng (y = 354..844, rộng 816px × cao 490px, tâm đúng x = 540px): bầu trời cao 443px (+35%),
  //   đường chân trời đặt sát đáy hộp (y_screen ≈ 797px) để khoảng nối xuống Quote (y = 856px) gọn khít ~59px.
  // - Khối Quote + • TRÀ NGUỘI: lề phải 216px (quoteBlockWidth = 732px) né Avatar kênh, khóa cứng trần đáy y <= 1460px.
  swissGrid: {
    iphoneCropX: 54,
    safeTop: 295,
    safeBottom: 460,
    safeLeft: 132,
    safeRight: 216,
    contentWidth: 816,          // Rộng đối xứng cho Header & Stage (132 + 816 + 132 = 1080, tâm đúng 540px)
    quoteBlockWidth: 732,       // 1080 - 132 - 216 = 732px (né trọn Avatar & nút Tim bên phải)
    marginLeft: 132,
    marginRightTop: 132,
    marginRightBottom: 216,
    headerTop: 295,             // Neo 1 (Header): y = 295px -> 351px (cao 56px)
    headerHeight: 56,
    stageTop: 354,              // Neo 2 (Sân khấu mở rộng): y = 354px -> 844px (816 × 490px)
    stageWidth: 816,
    stageHeight: 490,
    typographyTop: 856,         // Neo 3 (Khối Quote + Tác giả + • TRÀ NGUỘI): sát dưới chân trời ~59px
    typographyMaxBottom: 1460,  // Trần đáy khóa cứng tại y = 1460px
    typographyMaxWidth: 700,    // 732px trừ 32px rãnh đọc dọc -> chữ rộng tối đa 700px
  },
} as const;
