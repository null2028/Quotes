import React from 'react';
import { useVideoConfig } from 'remotion';
import { ThemePalette, isDarkThemePalette } from '../theme/palettes';
import { NotificationRings } from '../kit/Atmosphere';
import {
  CustomPropDefinition,
  InlineShape,
} from './stageScriptSchema';
import { EvaluatedPropState, resolveRoleColor } from './trackCompiler';
import {
  PROP_FINE_STROKE,
  INK_BASE_STROKE_WIDTH,
  INK_SCALE_POWER,
  RED_PIVOT_FILL_OPACITY,
} from './stageConstants';
import {
  DO_CHUA_ALL_PRESET_NAMES,
  DO_CHUA_APPROVED_ALIASES,
  DO_CHUA_NEW_PRESETS,
} from './families/do_chua';

export const BUILT_IN_PROP_NAMES = [
  'envelope',
  'bridal_veil',
  'dashed_heart',
  'solid_heart',
  'wine_jar',
  'small_cup',
  'rice_bowl',
  'tall_cup',
  'boulder',
  'box_stack',
  'umbrella',
  'bench',
  'street_lamp',
  'warm_house',
  'city_skyline',
  'small_boat',
  'kite',
  'paper_plane',
  'bare_tree',
  'sprout',
  'campfire',
  'lantern',
  'seesaw',
  'hourglass',
  'chat_bubble',
  'cloud_wisp',
  // 6 đạo cụ nhóm công sở & bàn trà đã được chủ kênh duyệt (`duyet`)
  'std_chair',
  'low_wood_stool',
  'std_work_desk',
  'low_tea_table',
  'desk_calendar',
  'desk_laptop',
  // 5 đạo cụ đã duyệt ở Tờ duyệt lần 3 (`duyet`)
  'vi_tien',
  'thiep',
  'phong_bi',
  'hoa_don',
  'porch_window',
  // Họ 1 — `do_chua` (2 alias `duyet` + 6 preset `nhap`)
  ...DO_CHUA_ALL_PRESET_NAMES,
] as const;

export type BuiltInPropName = (typeof BUILT_IN_PROP_NAMES)[number];

/**
 * Bảng ánh xạ alias chính thức của các Họ Đạo Cụ (tên mới tiếng Việt không dấu -> mã đã `duyet` sẵn trong propCatalog).
 * Cả tên mới lẫn mã cũ đều dùng được 100% như nhau.
 */
export const PROP_FAMILY_ALIASES: Record<string, string> = {
  ...DO_CHUA_APPROVED_ALIASES,
};

/**
 * Danh sách 5 đạo cụ chưa đạt đang trình duyệt lại ở Tờ duyệt lần 3 (giữ ở trạng thái `nhap`).
 */
export const APPROVAL_BATCH_PROP_NAMES = [] as const;

/**
 * Chỉ giữ alias này cho các kịch bản `legacy` (khi customPropsMap được nạp).
 * Với kịch bản mới, Validator chặn cứng tên lạ và gợi ý tên đúng (ví dụ "stool" -> "low_wood_stool").
 */
export const PROP_TYPE_ALIASES: Record<string, string> = {
  stool: 'std_chair',
};

export const BUILT_IN_PROP_CATALOG: Record<string, CustomPropDefinition> = {
  // === NHÓM ĐẠO CỤ GỐC ĐÃ DÙNG Ở CÁC CHÉN GẦN ĐÂY (trạng thái `duyet`, đủ kich_thuoc_that, box & anchors) ===

  // 1. Cánh thư giấy uốn cong mềm mại + dấu triện (kich_thuoc_that: 18 cm -> 18 * 0.32 * 2.0 = 11.52)
  envelope: {
    status: 'duyet',
    labelVi: 'Cánh thư giấy cổ phong',
    kich_thuoc_that: 18,
    description5: {
      nghia: 'Lá thư tay mềm mại gợi nỗi nhớ hoặc lời nhắn gửi phương xa.',
      cau_truc: 'Gồm 3 nét nhận diện là mép giấy uốn lượn nhẹ, đường nắp thư cong mềm và chấm triện tròn giữa thân.',
      bong_dang: 'Phiến chữ nhật uốn cong nhẹ hai cạnh ngang như tờ giấy gió cầm trên tay.',
      the_gioi: 'Vẽ bằng nét bút lông mảnh nhẹ màu giấy, đồng điệu với các cảnh cổ phong ngoài trời.',
      nguoi_la: 'Nhìn đường nắp thư chữ V uốn mềm và chấm triện giữa tờ giấy là người lạ nhận ra bức thư.',
    },
    anchorType: 'hand',
    defaultLayer: 'giua',
    anchorKind: 'cam',
    allowedAnchorKinds: ['cam', 'tren', 'dat'],
    box: [-6.1, -4.3, 6.1, 3.6],
    anchors: {},
    canBeRed: true,
    emitterOffset: [0, -0.5],
    shapes: [
      {
        d: 'M -5.5 -3.4 Q 0 -4.1 5.5 -3.0 Q 5.1 0 5.6 3.1 Q 0 2.5 -5.4 3.4 Q -5.8 0 -5.5 -3.4 Z',
        fill: 'bg',
        fillOpacity: 0.12,
      },
      {
        d: 'M -5.3 -3.2 Q 0 1.2 5.3 -2.8',
        fill: 'none',
        strokeScale: 0.78,
      },
      {
        d: 'M -3.6 1.9 Q -0.8 0.7 2.2 1.6',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.55,
        opacity: 0.55,
      },
      {
        circle: [0, -0.4, 0.9],
        fill: 'accent',
        fillOpacity: 0.28,
        role: 'accent',
        strokeScale: 0.65,
      },
    ],
  },

  // 2. Khăn voan cô dâu (`nhap`)
  bridal_veil: {
    status: 'nhap',
    labelVi: 'Khăn voan lụa',
    anchorType: 'hand',
    emitterOffset: [0, -2],
    shapes: [
      {
        d: 'M -2 -2 C -10 -1 -18 5 -25 14',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.6,
      },
      {
        d: 'M -1 1 C -8 4 -14 10 -19 19',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.52,
        opacity: 0.78,
      },
      {
        d: 'M -3 -0.5 C -11 2 -16 8 -21 16',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.42,
        opacity: 0.48,
      },
      {
        circle: [-1.8, -1.8, 1.1],
        fill: 'accent',
        fillOpacity: 0.25,
        role: 'accent',
        strokeScale: 0.55,
      },
    ],
  },

  // 3. Tim nét đứt (`nhap`)
  dashed_heart: {
    status: 'nhap',
    labelVi: 'Tim nét đứt',
    anchorType: 'center',
    emitterOffset: [0, -2],
    shapes: [
      {
        d: 'M 0 -4 C -3.2 -9.5 -11 -8 -11 -1.5 C -11 4 -4 8 0 12',
        fill: 'none',
        dashed: true,
        splitSide: 'left',
        strokeScale: 0.88,
      },
      {
        d: 'M 0 -4 C 3.2 -9.5 11 -8 11 -1.5 C 11 4 4 8 0 12',
        fill: 'none',
        dashed: true,
        splitSide: 'right',
        strokeScale: 0.88,
      },
      {
        d: 'M -2.5 -5.2 C -6.8 -5.8 -8.2 -2.2 -6.5 2.2',
        fill: 'none',
        role: 'secondary',
        splitSide: 'left',
        strokeScale: 0.52,
        opacity: 0.48,
      },
    ],
  },

  // 4. Tim nét liền (`nhap`)
  solid_heart: {
    status: 'nhap',
    labelVi: 'Tim chu sa',
    anchorType: 'center',
    emitterOffset: [0, -2],
    shapes: [
      {
        d: 'M 0 10.5 C -4.2 6.2 -10.4 3.0 -10.4 -2.5 C -10.4 -8.2 -3.0 -9.6 0 -4.0 C 3.0 -9.6 10.4 -8.2 10.4 -2.5 C 10.4 3.0 4.2 6.2 0 10.5 Z',
        fill: 'accent',
        fillOpacity: 0.2,
        role: 'accent',
      },
      {
        d: 'M -6.8 -4.2 C -8.2 -1.5 -6.5 2.5 -2.2 6.2',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.55,
        opacity: 0.5,
      },
    ],
  },

  // 5. Vò rượu gốm cổ Mai Bình (`duyet`, kich_thuoc_that: 58 cm >= 30 -> 58 * 0.32 * 1.0 = 18.56)
  wine_jar: {
    status: 'duyet',
    labelVi: 'Vò rượu gốm Mai Bình',
    kich_thuoc_that: 58,
    description5: {
      nghia: 'Bình rượu tri kỷ gợi cuộc đối ẩm lặng lẽ và nỗi niềm cất giữ lâu năm.',
      cau_truc: 'Gồm 3 nét nhận diện là miệng bình loe nhỏ, cổ thắt buộc dây tua và bầu gốm phình cao thuôn dần xuống đáy.',
      bong_dang: 'Dáng bình gốm cổ cao thon có eo thắt rõ ở cổ, tách biệt hoàn toàn với chén trà thấp.',
      the_gioi: 'Vẽ bằng nét viền mảnh và bóng mực nhạt một bên sườn gốm đúng tinh thần thuỷ mặc.',
      nguoi_la: 'Thấy dáng bầu cao thắt cổ buộc dây là người lạ nhận ra ngay vò rượu gốm truyền thống.',
    },
    anchorType: 'ground',
    defaultLayer: 'giua',
    anchorKind: 'tren',
    allowedAnchorKinds: ['tren', 'dat'],
    box: [-6.4, -19.6, 6.4, 0],
    anchors: {},
    canBeRed: true,
    emitterOffset: [0, -19],
    tiltPivot: [-1.2, -0.5],
    shapes: [
      {
        d: 'M -3.4 -19 L 3.4 -19 L 2.7 -15.2 C 6.2 -12.8 6.4 -5.8 3.6 0 L -3.6 0 C -6.4 -5.8 -6.2 -12.8 -2.7 -15.2 Z',
        fill: 'bg',
        fillOpacity: 0.12,
        role: 'ink',
      },
      {
        d: 'M -2.4 -14.8 C -5.2 -12.2 -5.4 -5.5 -3.0 -0.8 C -4.0 -5.4 -3.8 -10.8 -1.6 -14.2 Z',
        fill: 'ink',
        fillOpacity: 0.08,
        role: 'ink',
        strokeScale: 0,
      },
      {
        d: 'M 2.5 -13.2 C 4.4 -11.2 4.5 -6.8 3.0 -3.0',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.62,
        opacity: 0.52,
      },
      {
        d: 'M -3.9 -19 Q 0 -18.4 3.9 -19',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.95,
      },
      {
        d: 'M -2.9 -15.2 Q 0 -14.6 2.9 -15.2',
        fill: 'none',
        role: 'accent',
        strokeScale: 0.85,
      },
      {
        d: 'M 1.3 -15.0 C 2.5 -13.2 3.5 -11.2 3.0 -9.2',
        fill: 'none',
        role: 'accent',
        strokeScale: 0.62,
      },
      {
        d: 'M 1.8 -15.0 C 3.5 -13.6 4.6 -12.0 4.4 -10.0',
        fill: 'none',
        role: 'accent',
        strokeScale: 0.58,
      },
    ],
    altShapes: [
      {
        d: 'M -3.4 -19 L 3.4 -19 L 2.7 -15.2 C 6.2 -12.8 6.4 -5.8 3.6 0 L -3.6 0 C -6.4 -5.8 -6.2 -12.8 -2.7 -15.2 Z',
        fill: 'accent',
        fillOpacity: 0.32,
        role: 'accent',
      },
      {
        d: 'M -2.4 -14.8 C -5.2 -12.2 -5.4 -5.5 -3.0 -0.8 C -4.0 -5.4 -3.8 -10.8 -1.6 -14.2 Z',
        fill: 'accent',
        fillOpacity: 0.14,
        role: 'accent',
        strokeScale: 0,
      },
      {
        d: 'M 2.5 -13.2 C 4.4 -11.2 4.5 -6.8 3.0 -3.0',
        fill: 'none',
        role: 'accent',
        strokeScale: 0.62,
        opacity: 0.52,
      },
      {
        d: 'M -3.9 -19 Q 0 -18.4 3.9 -19',
        fill: 'none',
        role: 'accent',
        strokeScale: 0.95,
      },
      {
        d: 'M -2.9 -15.2 Q 0 -14.6 2.9 -15.2',
        fill: 'none',
        role: 'accent',
        strokeScale: 0.85,
      },
      {
        d: 'M 1.3 -15.0 C 2.5 -13.2 3.5 -11.2 3.0 -9.2',
        fill: 'none',
        role: 'accent',
        strokeScale: 0.62,
      },
      {
        d: 'M 1.8 -15.0 C 3.5 -13.6 4.6 -12.0 4.4 -10.0',
        fill: 'none',
        role: 'accent',
        strokeScale: 0.58,
      },
    ],
  },

  // 6. Chén trà gốm nhỏ (`duyet`, kich_thuoc_that: 11.5 cm -> 11.5 * 0.32 * 2.0 = 7.36; thân 7.0x5.0 bằng khít 100% chén trên tay Lữ khách!)
  small_cup: {
    status: 'duyet',
    labelVi: 'Chén trà gốm nhỏ',
    kich_thuoc_that: 11.5,
    description5: {
      nghia: 'Chén trà nguội đặt trên bàn hoặc bậu cửa, biểu tượng lắng đọng của kênh.',
      cau_truc: 'Gồm 3 nét nhận diện là miệng chén tròn hơi mở rộng 7 đơn vị, thành chén khum bầu cao 5 đơn vị và chân đế thu gọn.',
      bong_dang: 'Khối bán nguyệt ngửa nhỏ gọn không quai cầm, cùng kích thước 1:1 với chén trên tay Lữ khách.',
      the_gioi: 'Chỉ dùng ba nét cọ mảnh và lớp nền giấy nhạt để giữ vẻ mộc mạc thanh tịnh.',
      nguoi_la: 'Đặt trên mặt bàn trà hay bậu cửa sổ, người lạ nhìn vào biết ngay là chén uống trà.',
    },
    anchorType: 'ground',
    defaultLayer: 'giua',
    anchorKind: 'tren',
    allowedAnchorKinds: ['tren', 'cam', 'dat'],
    box: [-3.85, -5.55, 3.85, 0],
    anchors: {},
    canBeRed: true,
    emitterOffset: [0, -5.2],
    tiltPivot: [-1.0, -0.4],
    shapes: [
      {
        d: 'M -3.5 -5.0 Q -2.9 -0.8 -2.0 0 L 2.0 0 Q 2.9 -0.8 3.5 -5.0 Q 0 -4.4 -3.5 -5.0 Z',
        fill: 'bg',
        fillOpacity: 0.1,
        role: 'ink',
        strokeScale: 0.65,
      },
      {
        d: 'M -3.5 -5.0 Q 0 -5.6 3.5 -5.0',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.5,
        opacity: 0.6,
      },
    ],
    altShapes: [
      {
        d: 'M -3.5 -5.0 Q -2.9 -0.8 -2.0 0 L 2.0 0 Q 2.9 -0.8 3.5 -5.0 Q 0 -4.4 -3.5 -5.0 Z',
        fill: 'accent',
        fillOpacity: 0.34,
        role: 'accent',
        strokeScale: 0.65,
      },
      {
        d: 'M -3.5 -5.0 Q 0 -5.6 3.5 -5.0',
        fill: 'none',
        role: 'accent',
        strokeScale: 0.5,
        opacity: 0.6,
      },
    ],
  },

  // 7. Bát cơm gốm (`nhap`)
  rice_bowl: {
    status: 'nhap',
    labelVi: 'Bát cơm gốm',
    anchorType: 'ground',
    emitterOffset: [0, -9.2],
    tiltPivot: [-1.4, -0.6],
    shapes: [
      {
        d: 'M -8.4 -8.2 C -8.1 -3.0 -5.2 -0.8 -3.0 0 Q 0 0.5 3.0 0 C 5.2 -0.8 8.1 -3.0 8.4 -8.2 Q 0 -7.3 -8.4 -8.2 Z',
        fill: 'bg',
        fillOpacity: 0.13,
        role: 'ink',
      },
      {
        d: 'M -6.8 -7.2 C -6.4 -3.4 -4.0 -1.2 -2.2 -0.5 C -3.6 -2.0 -4.8 -4.2 -5.4 -7.0 Z',
        fill: 'ink',
        fillOpacity: 0.08,
        role: 'ink',
        strokeScale: 0,
      },
      {
        d: 'M -8.4 -8.2 Q 0 -9.2 8.4 -8.2',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.65,
        opacity: 0.58,
      },
      {
        d: 'M 5.8 -6.4 C 5.4 -3.8 3.8 -2.0 2.1 -1.1',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.55,
        opacity: 0.5,
      },
      {
        d: 'M -6.2 -9.6 C -0.9 -11.0 4.5 -12.5 9.8 -13.8',
        fill: 'none',
        role: 'accent',
        strokeScale: 0.82,
      },
      {
        d: 'M -6.0 -8.4 C -0.7 -9.4 4.6 -10.4 10.0 -11.2',
        fill: 'none',
        role: 'accent',
        strokeScale: 0.78,
      },
    ],
  },

  // 8. Cốc cao (`nhap`)
  tall_cup: {
    status: 'nhap',
    labelVi: 'Cốc nước cao',
    anchorType: 'ground',
    emitterOffset: [0, -14.2],
    tiltPivot: [-1.2, -0.5],
    shapes: [
      {
        d: 'M -5.2 -13.5 C -4.7 -8.6 -4.1 -3.8 -3.6 0 Q 0 0.6 3.6 0 C 4.1 -3.8 4.7 -8.6 5.2 -13.5 Q 0 -12.7 -5.2 -13.5 Z',
        fill: 'bg',
        fillOpacity: 0.12,
        role: 'ink',
      },
      {
        d: 'M -4.2 -12.2 C -3.8 -7.9 -3.4 -3.6 -2.8 -0.6 C -3.3 -3.9 -3.5 -8.1 -3.5 -12.0 Z',
        fill: 'ink',
        fillOpacity: 0.07,
        role: 'ink',
        strokeScale: 0,
      },
      {
        d: 'M -5.2 -13.5 Q 0 -14.3 5.2 -13.5',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.68,
        opacity: 0.62,
      },
      {
        d: 'M -4.4 -9.2 Q -0.8 -8.5 4.4 -9.4',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.55,
        opacity: 0.5,
      },
      {
        d: 'M 0.9 -7.6 C 1.9 -12.2 2.8 -16.4 3.6 -18.6 Q 4.6 -19.4 6.3 -18.9',
        fill: 'none',
        role: 'accent',
        strokeScale: 0.85,
      },
      {
        circle: [-1.6, -2.5, 0.95],
        fill: 'accent',
        fillOpacity: 0.25,
        role: 'accent',
        strokeScale: 0.62,
      },
      {
        circle: [0.9, -2.2, 0.95],
        fill: 'accent',
        fillOpacity: 0.25,
        role: 'accent',
        strokeScale: 0.62,
      },
      {
        circle: [2.0, -4.3, 0.9],
        fill: 'accent',
        fillOpacity: 0.22,
        role: 'accent',
        strokeScale: 0.6,
      },
    ],
  },

  // 9. Tảng đá cuội (`nhap`)
  boulder: {
    status: 'nhap',
    labelVi: 'Tảng đá cuội',
    anchorType: 'ground',
    emitterOffset: [0, -28],
    shapes: [
      {
        d: 'M -18.5 -3.0 C -22.0 -16.5 -13.5 -30.5 1.2 -31.5 C 14.0 -32.0 21.5 -18.0 18.5 -3.0 C 15.8 0.4 -15.8 0.4 -18.5 -3.0 Z',
        fill: 'bg',
        fillOpacity: 0.14,
        role: 'ink',
      },
      {
        d: 'M -16.5 -3.6 C -18.8 -14.8 -12.0 -26.5 -1.2 -29.0 C -8.8 -24.0 -13.2 -14.0 -12.0 -3.2 Z',
        fill: 'ink',
        fillOpacity: 0.08,
        role: 'ink',
        strokeScale: 0,
      },
      {
        d: 'M -8.8 -21.5 C -4.6 -17.2 -1.8 -15.0 5.5 -18.0',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.62,
        opacity: 0.54,
      },
      {
        d: 'M 3.8 -11.5 C 8.0 -9.8 12.0 -11.6 14.0 -14.8',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.55,
        opacity: 0.48,
      },
    ],
  },

  // 10. Chồng hộp hồ sơ (`duyet`, kich_thuoc_that: 76 cm >= 30 -> 76 * 0.32 * 1.0 = 24.32)
  box_stack: {
    status: 'duyet',
    labelVi: 'Chồng hộp hồ sơ',
    kich_thuoc_that: 76,
    description5: {
      nghia: 'Khối việc tồn đọng và trách nhiệm chồng chất theo tháng năm.',
      cau_truc: 'Gồm 3 nét nhận diện là ba thùng hộp xếp tháp nhỏ dần lên trên, đường nắp hộp ngang và sợi dây buộc thò nhẹ.',
      bong_dang: 'Hình tháp ba tầng bậc thang cân đối đặt vững trên mặt đất.',
      the_gioi: 'Dùng viền mảnh và nền giấy sáng để chồng hộp không tạo mảng tối nặng nề.',
      nguoi_la: 'Nhìn ba khối chữ nhật chồng tầng lên nhau là người lạ nhận ra chồng thùng hồ sơ.',
    },
    anchorType: 'ground',
    defaultLayer: 'giua',
    anchorKind: 'dat',
    allowedAnchorKinds: ['dat', 'tren'],
    box: [-12.4, -25.0, 12.4, 0],
    anchors: {
      dinh_hop: [0, -24.2],
    },
    canBeRed: false,
    emitterOffset: [0, -25],
    shapes: [
      {
        d: 'M -11.5 -8.8 Q 0 -9.2 11.5 -8.8 Q 12.0 -4.4 11.5 0 Q 0 0.4 -11.5 0 Q -12.0 -4.4 -11.5 -8.8 Z',
        fill: 'bg',
        fillOpacity: 0.13,
        role: 'ink',
      },
      {
        d: 'M -9.8 -17.0 Q 0 -17.4 9.8 -17.0 Q 10.2 -12.8 9.8 -8.8 Q 0 -8.4 -9.8 -8.8 Q -10.2 -12.8 -9.8 -17.0 Z',
        fill: 'bg',
        fillOpacity: 0.12,
        role: 'ink',
      },
      {
        d: 'M -7.8 -24.2 Q 0 -24.6 7.8 -24.2 Q 8.2 -20.6 7.8 -17.0 Q 0 -16.6 -7.8 -17.0 Q -8.2 -20.6 -7.8 -24.2 Z',
        fill: 'bg',
        fillOpacity: 0.11,
        role: 'ink',
      },
      {
        d: 'M -8.4 -4.4 Q 0 -4.0 8.4 -4.4',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.55,
        opacity: 0.48,
      },
      {
        d: 'M -6.8 -12.8 Q 0 -12.4 6.8 -12.8',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.55,
        opacity: 0.48,
      },
      {
        d: 'M 1.8 -17.0 C 2.8 -14.6 3.8 -12.6 3.0 -10.5',
        fill: 'none',
        role: 'accent',
        strokeScale: 0.68,
      },
    ],
  },

  // 11. Chiếc ô giấy dầu (`duyet`, kich_thuoc_that: 170 cm -> 170 * 0.32 * 1.0 = 54.4)
  umbrella: {
    status: 'duyet',
    labelVi: 'Chiếc ô che mưa',
    kich_thuoc_that: 170,
    description5: {
      nghia: 'Sự chở che lặng lẽ giữa cơn mưa đời hoặc khoảng nghiêng nhường cho người bên cạnh.',
      cau_truc: 'Gồm 3 nét nhận diện là tán ô vòm rộng lượn múi, trục cán thẳng dài và tay cầm móc cong chữ J.',
      bong_dang: 'Tán vòm cung rộng trên trục mảnh thẳng đứng có móc cong ở cuối cán.',
      the_gioi: 'Tách rõ trạng thái mở mặc định và trạng thái `gap`; ở mỗi trạng thái bản đỏ giữ nguyên dáng 100%.',
      nguoi_la: 'Thấy vòm ô và cán móc chữ J là người lạ nhận ra ngay chiếc ô đi mưa.',
    },
    anchorType: 'hand',
    defaultLayer: 'giua',
    anchorKind: 'cam',
    box: [-28.6, -36.6, 28.6, 10.9],
    anchors: {},
    canBeRed: true,
    emitterOffset: [0, -30],
    shapes: [
      {
        d: 'M 0 -29 C 0.2 -15 0.2 -2 0 8 Q -3.4 12.2 -6.0 8.8',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.9,
      },
      {
        d: 'M -28 -18.5 C -19 -32 -7 -36 0 -36 C 7 -36 19 -32 28 -18.5 Q 18.5 -21.8 9.2 -19.0 Q 0 -22.0 -9.2 -19.0 Q -18.5 -21.8 -28 -18.5 Z',
        fill: 'bg',
        fillOpacity: 0.14,
        role: 'ink',
      },
      {
        d: 'M 0 -35.5 C -4.5 -28 -8 -23 -9.2 -19.0 M 0 -35.5 C 4.5 -28 8 -23 9.2 -19.0',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.55,
        opacity: 0.52,
      },
    ],
    altShapes: [
      {
        d: 'M 0 -29 C 0.2 -15 0.2 -2 0 8 Q -3.4 12.2 -6.0 8.8',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.9,
      },
      {
        d: 'M -28 -18.5 C -19 -32 -7 -36 0 -36 C 7 -36 19 -32 28 -18.5 Q 18.5 -21.8 9.2 -19.0 Q 0 -22.0 -9.2 -19.0 Q -18.5 -21.8 -28 -18.5 Z',
        fill: 'accent',
        fillOpacity: 0.88,
        role: 'accent',
      },
      {
        d: 'M 0 -35.5 C -4.5 -28 -8 -23 -9.2 -19.0 M 0 -35.5 C 4.5 -28 8 -23 9.2 -19.0',
        fill: 'bg',
        fillOpacity: 0,
        strokeScale: 0.55,
      },
    ],
    variants: {
      gap: {
        labelVi: 'Ô gập gọn',
        box: [-6.6, -26.6, 5.4, 10.9],
        shapes: [
          {
            d: 'M 0 -26 C 0.2 -14 0.2 -2 0 8 Q -3.4 12.2 -6.0 8.8',
            fill: 'none',
            role: 'ink',
            strokeScale: 0.9,
          },
          {
            d: 'M 0 -26 C -2.6 -18 -4.4 -10 -4.8 -5.0 Q 0 -3.8 4.8 -5.0 C 4.4 -10 2.6 -18 0 -26 Z',
            fill: 'bg',
            fillOpacity: 0.13,
            role: 'ink',
          },
          {
            d: 'M -0.4 -22 C -1.4 -15 -2.0 -9 -1.8 -5.0',
            fill: 'none',
            role: 'secondary',
            strokeScale: 0.55,
            opacity: 0.52,
          },
        ],
        altShapes: [
          {
            d: 'M 0 -26 C 0.2 -14 0.2 -2 0 8 Q -3.4 12.2 -6.0 8.8',
            fill: 'none',
            role: 'ink',
            strokeScale: 0.9,
          },
          {
            d: 'M 0 -26 C -2.6 -18 -4.4 -10 -4.8 -5.0 Q 0 -3.8 4.8 -5.0 C 4.4 -10 2.6 -18 0 -26 Z',
            fill: 'accent',
            fillOpacity: 0.9,
            role: 'accent',
          },
          {
            d: 'M -0.4 -22 C -1.4 -15 -2.0 -9 -1.8 -5.0',
            fill: 'bg',
            fillOpacity: 0,
            strokeScale: 0.55,
          },
        ],
      },
    },
  },

  // 12. Ghế gỗ công viên (`duyet`, kich_thuoc_that: 162 cm -> 162 * 0.32 * 1.0 = 51.84)
  bench: {
    status: 'duyet',
    labelVi: 'Ghế băng gỗ công viên',
    kich_thuoc_that: 162,
    description5: {
      nghia: 'Chỗ dừng chân ven đường hoặc góc công viên nơi hai người ngồi lặng bên nhau.',
      cau_truc: 'Gồm 3 nét nhận diện là nan tựa lưng ngang dài, mặt ghế băng rộng cho hai người và tay vịn cong hai đầu.',
      bong_dang: 'Khung ghế băng ngang dài có bốn chân và nan lưng thoáng giữa.',
      the_gioi: 'Chỉ giữ viền gỗ mảnh, không làm vật đỏ để nhường điểm nhấn cho câu chuyện của nhân vật.',
      nguoi_la: 'Nhìn dáng ghế dài có nan tựa và hai tay vịn là người lạ biết ngay ghế băng công viên.',
    },
    anchorType: 'ground',
    defaultLayer: 'giua',
    anchorKind: 'dat',
    box: [-26.6, -24.0, 26.6, 0],
    anchors: {
      mat_ghe: [0, -10.8],
      mat_ghe_trai: [-11.0, -10.8],
      mat_ghe_phai: [11.0, -10.8],
    },
    canBeRed: false,
    emitterOffset: [0, -22.5],
    shapes: [
      {
        d: 'M -23.5 -22.5 Q 0 -23.4 23.5 -22.5 Q 24.2 -18.0 23.5 -15.0 Q 0 -15.6 -23.5 -15.0 Q -24.2 -18.0 -23.5 -22.5 Z',
        fill: 'bg',
        fillOpacity: 0.11,
        role: 'ink',
      },
      {
        d: 'M -26.0 -10.8 Q 0 -11.5 26.0 -10.8 Q 25.0 -8.6 23.5 -8.6 Q 0 -9.2 -23.5 -8.6 Q -25.0 -8.6 -26.0 -10.8 Z',
        fill: 'bg',
        fillOpacity: 0.14,
        role: 'ink',
      },
      {
        d: 'M -18.5 -18.8 Q 0 -19.4 18.5 -18.8',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.55,
        opacity: 0.5,
      },
      {
        d: 'M -19.2 -22.3 C -18.8 -13.5 -19.0 -5.8 -19.8 0',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.92,
      },
      {
        d: 'M 19.2 -22.3 C 18.8 -13.5 19.0 -5.8 19.8 0',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.92,
      },
      {
        d: 'M -23.5 -16.5 Q -25.8 -13.5 -23.5 -10.5',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.62,
        opacity: 0.55,
      },
      {
        d: 'M 23.5 -16.5 Q 25.8 -13.5 23.5 -10.5',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.62,
        opacity: 0.55,
      },
    ],
  },

  // 13. Đèn đường (`nhap`)
  street_lamp: {
    status: 'nhap',
    labelVi: 'Đèn đường cổ điển',
    anchorType: 'ground',
    emitterOffset: [20, -66],
    shapes: [
      {
        d: 'M -2.6 0 C -2.2 -5.5 -1.2 -9.5 -0.8 -14.0 L 0.8 -14.0 C 1.2 -9.5 2.2 -5.5 2.6 0 Z',
        fill: 'bg',
        fillOpacity: 0.14,
        role: 'ink',
      },
      {
        d: 'M 0 -14.0 C -0.2 -38.0 -0.2 -58.0 0 -75.0 C 1.5 -82.5 14.5 -83.5 20.0 -72.5',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.95,
      },
      {
        d: 'M 0.4 -68.5 C 4.5 -74.5 11.5 -75.5 15.5 -72.0',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.55,
        opacity: 0.52,
      },
      {
        d: 'M 14.2 -72.5 Q 20.0 -73.8 25.8 -72.5 L 23.2 -65.2 Q 20.0 -64.2 16.8 -65.2 Z',
        fill: 'accent',
        fillOpacity: 0.22,
        role: 'accent',
      },
      {
        circle: [20, -67.5, 5.2],
        fill: 'accent',
        fillOpacity: 0.15,
        role: 'accent',
        strokeScale: 0.5,
        opacity: 0.55,
      },
    ],
  },

  // 14. Mái nhà quê (`nhap`)
  warm_house: {
    status: 'nhap',
    labelVi: 'Ngôi nhà mái hiên ấm',
    anchorType: 'ground',
    emitterOffset: [15, -43],
    shapes: [
      {
        d: 'M -26.5 -24.5 L -26.0 0 L 26.0 0 L 26.5 -24.5 Q 0 -25.5 -26.5 -24.5 Z',
        fill: 'bg',
        fillOpacity: 0.12,
        role: 'ink',
      },
      {
        d: 'M 12.0 -35.5 L 12.0 -42.5 L 17.5 -42.5 L 17.5 -31.2',
        fill: 'bg',
        fillOpacity: 0.13,
        role: 'ink',
        strokeScale: 0.82,
      },
      {
        d: 'M -35.5 -22.5 C -21.0 -29.5 -8.5 -39.5 0 -47.5 C 8.5 -39.5 21.0 -29.5 35.5 -22.5 Q 0 -24.8 -35.5 -22.5 Z',
        fill: 'bg',
        fillOpacity: 0.14,
        role: 'ink',
        strokeScale: 1.02,
      },
      {
        d: 'M -24.5 -26.8 C -14.0 -32.2 -5.5 -38.8 0 -43.5',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.55,
        opacity: 0.5,
      },
      {
        d: 'M -7.5 -18.5 Q 0 -19.2 7.5 -18.5 Q 8.0 -12.0 7.5 -5.8 Q 0 -5.2 -7.5 -5.8 Q -8.0 -12.0 -7.5 -18.5 Z',
        fill: 'accent',
        fillOpacity: 0.24,
        role: 'accent',
      },
      {
        d: 'M 0 -18.5 L 0 -5.8 M -7.5 -12.2 L 7.5 -12.2',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.52,
        opacity: 0.55,
      },
    ],
  },

  // 15. Bóng phố thị (`nhap`)
  city_skyline: {
    status: 'nhap',
    labelVi: 'Bóng phố thị phía xa',
    anchorType: 'ground',
    emitterOffset: [-5, -68],
    shapes: [
      {
        d: 'M -54 0 L -54 -46 Q -44 -46.8 -34 -46 L -34 -28 L -18 -28 L -18 -67 Q -5 -68 8 -67 L 8 -36 L 26 -36 L 26 -55 Q 37 -55.8 48 -55 L 48 0 Z',
        fill: 'bg',
        fillOpacity: 0.1,
        role: 'secondary',
        strokeScale: 0.82,
      },
      {
        d: 'M -12 -58 L -12 -32 M -5 -58 L -5 -32 M 34 -48 L 34 -20',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.52,
        opacity: 0.45,
      },
      {
        circle: [-5, -52, 1.4],
        fill: 'accent',
        fillOpacity: 0.28,
        role: 'accent',
        strokeScale: 0.55,
      },
      {
        circle: [37, -42, 1.3],
        fill: 'accent',
        fillOpacity: 0.25,
        role: 'accent',
        strokeScale: 0.55,
      },
    ],
  },

  // 16. Thuyền gỗ nhỏ (`nhap`)
  small_boat: {
    status: 'nhap',
    labelVi: 'Thuyền gỗ nhỏ',
    anchorType: 'ground',
    emitterOffset: [0, -10],
    shapes: [
      {
        d: 'M -27.5 -9.2 C -14.0 -4.2 14.0 -4.2 27.5 -10.0 C 22.0 -1.8 14.5 1.8 0 2.2 C -14.5 1.8 -22.0 -1.8 -27.5 -9.2 Z',
        fill: 'bg',
        fillOpacity: 0.13,
        role: 'ink',
      },
      {
        d: 'M -21.5 -5.8 C -10.0 -2.8 10.0 -2.8 21.5 -6.2 C 16.5 -0.8 10.0 1.2 0 1.4 C -10.0 1.2 -16.5 -0.8 -21.5 -5.8 Z',
        fill: 'ink',
        fillOpacity: 0.08,
        role: 'ink',
        strokeScale: 0,
      },
      {
        d: 'M -11.5 -6.2 C -6.5 -14.5 6.5 -14.5 11.5 -6.2',
        fill: 'bg',
        fillOpacity: 0.11,
        role: 'secondary',
        strokeScale: 0.65,
        opacity: 0.65,
      },
      {
        d: 'M -4.5 -5.2 C 4.5 -3.5 13.5 -1.2 21.5 2.5',
        fill: 'none',
        role: 'accent',
        strokeScale: 0.78,
      },
    ],
  },

  // 17. Cánh diều (`nhap`)
  kite: {
    status: 'nhap',
    labelVi: 'Cánh diều giấy',
    anchorType: 'center',
    emitterOffset: [0, -16],
    shapes: [
      {
        d: 'M 0 -16.5 C 5.8 -10.2 11.2 -4.5 12.4 -1.5 C 7.8 5.8 3.2 11.2 0 14.5 C -3.2 11.2 -7.8 5.8 -12.4 -1.5 C -11.2 -4.5 -5.8 -10.2 0 -16.5 Z',
        fill: 'accent',
        fillOpacity: 0.18,
        role: 'accent',
      },
      {
        d: 'M 0 -16.2 C 0.4 -4.0 0.4 4.0 0 14.2',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.65,
      },
      {
        d: 'M -12.0 -1.5 Q 0 -5.2 12.0 -1.5',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.65,
      },
      {
        d: 'M 0 14.5 C -6.2 23.5 2.5 31.5 5.5 39.5 C 7.2 44.0 -1.5 48.0 -4.2 51.0',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.72,
      },
      {
        d: 'M -3.2 24.0 L 2.2 26.2 M 0.8 35.0 L 6.2 33.2',
        fill: 'none',
        role: 'accent',
        strokeScale: 0.58,
      },
    ],
  },

  // 18. Máy bay giấy (`nhap`)
  paper_plane: {
    status: 'nhap',
    labelVi: 'Máy bay giấy',
    anchorType: 'center',
    emitterOffset: [-8, 3],
    shapes: [
      {
        d: 'M -16.5 -3.8 C -4.0 -6.2 7.5 -8.2 18.2 -10.2 C 10.5 -3.2 2.5 3.8 -4.2 10.2 C -5.0 6.8 -5.6 3.8 -6.2 1.2 C -9.8 -0.4 -13.2 -2.0 -16.5 -3.8 Z',
        fill: 'bg',
        fillOpacity: 0.13,
        role: 'accent',
      },
      {
        d: 'M 18.2 -10.2 C 8.5 -5.8 -0.5 -1.8 -6.2 1.2 L -8.2 6.2 C -2.2 1.5 8.0 -4.5 18.2 -10.2 Z',
        fill: 'ink',
        fillOpacity: 0.08,
        role: 'secondary',
        strokeScale: 0.62,
      },
      {
        d: 'M -12.5 4.8 Q -18.5 7.5 -24.5 6.8',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.52,
        opacity: 0.48,
      },
    ],
  },

  // 19. Nhành cây mùa đông (`nhap`)
  bare_tree: {
    status: 'nhap',
    labelVi: 'Nhành cây mùa đông',
    anchorType: 'ground',
    emitterOffset: [0, -68],
    shapes: [
      {
        d: 'M 0 0 C -2.5 -16 -7.5 -34 -2.0 -52 C 2.0 -64 9.5 -74 17.5 -82',
        fill: 'none',
        role: 'ink',
        strokeScale: 1.15,
      },
      {
        d: 'M -1.0 -6 C -3.5 -19 -5.8 -32 -3.0 -44',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.58,
        opacity: 0.52,
      },
      {
        d: 'M -4.2 -36 C -13.5 -41.5 -24.5 -44.5 -34.0 -51.0',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.82,
      },
      {
        d: 'M -17.0 -42.5 C -21.0 -49.0 -26.5 -54.5 -31.0 -59.0',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.58,
      },
      {
        d: 'M 0.8 -58 C 11.0 -62.0 20.5 -66.0 28.0 -72.5',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.75,
      },
      {
        d: 'M 5.5 -67 C 3.8 -74.5 7.5 -82.0 12.0 -86.5',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.55,
      },
    ],
  },

  // 20. Mầm cây non (`nhap`)
  sprout: {
    status: 'nhap',
    labelVi: 'Mầm cây non',
    anchorType: 'ground',
    emitterOffset: [0, -25],
    shapes: [
      {
        d: 'M 0 0 C -1.4 -7.5 1.2 -14.5 0 -21.5',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.9,
      },
      {
        d: 'M -0.2 -13.5 C -9.5 -16.5 -11.5 -23.5 -9.8 -25.2 C -4.2 -24.5 -0.8 -19.5 -0.2 -13.5 Z',
        fill: 'accent',
        fillOpacity: 0.22,
        role: 'accent',
      },
      {
        d: 'M 0.2 -16.8 C 9.5 -19.8 11.5 -26.8 9.8 -28.5 C 4.2 -27.8 0.8 -22.8 0.2 -16.8 Z',
        fill: 'accent',
        fillOpacity: 0.22,
        role: 'accent',
      },
      {
        d: 'M -1.2 -15.2 Q -5.2 -19.2 -7.8 -22.8 M 1.2 -18.5 Q 5.2 -22.5 7.8 -26.0',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.52,
        opacity: 0.52,
      },
    ],
  },

  // 21. Đốm lửa trại (`nhap`)
  campfire: {
    status: 'nhap',
    labelVi: 'Đốm lửa trại',
    anchorType: 'ground',
    emitterOffset: [0, -27],
    shapes: [
      {
        d: 'M -12.5 -1.8 C -4.0 -3.8 4.0 -5.8 12.5 -7.5 C 13.2 -5.8 12.8 -4.2 11.8 -3.8 C 3.5 -2.2 -4.5 -0.8 -12.0 0 C -13.0 -0.4 -13.2 -1.2 -12.5 -1.8 Z',
        fill: 'bg',
        fillOpacity: 0.14,
        role: 'ink',
        strokeScale: 0.85,
      },
      {
        d: 'M -11.8 -7.2 C -3.5 -5.2 4.5 -3.2 12.2 -1.5 C 12.8 -0.8 12.4 0 11.2 0 C 3.5 -1.8 -4.5 -3.8 -12.4 -5.5 C -13.0 -6.2 -12.6 -7.0 -11.8 -7.2 Z',
        fill: 'bg',
        fillOpacity: 0.14,
        role: 'ink',
        strokeScale: 0.85,
      },
      {
        d: 'M 0 -26.8 C 6.8 -19.0 9.2 -9.5 0 -4.2 C -9.2 -9.5 -6.8 -19.0 0 -26.8 Z',
        fill: 'accent',
        fillOpacity: 0.2,
        role: 'accent',
      },
      {
        d: 'M 0.4 -19.5 C 3.8 -14.8 4.5 -9.2 0 -5.5 C -3.8 -9.2 -3.2 -14.8 0.4 -19.5 Z',
        fill: 'accent',
        fillOpacity: 0.28,
        role: 'accent',
        strokeScale: 0.62,
      },
      {
        circle: [2.8, -29.2, 1.1],
        fill: 'accent',
        fillOpacity: 0.3,
        role: 'accent',
        strokeScale: 0.5,
      },
    ],
  },

  // 22. Đèn lồng (`nhap`)
  lantern: {
    status: 'nhap',
    labelVi: 'Đèn lồng lụa',
    anchorType: 'hand',
    emitterOffset: [0, 7.5],
    shapes: [
      {
        d: 'M 0 0 Q 0.4 4.0 0 8.0',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.78,
      },
      {
        d: 'M -3.8 8.0 C -9.2 10.5 -9.2 23.5 -3.8 26.2 L 3.8 26.2 C 9.2 23.5 9.2 10.5 3.8 8.0 Z',
        fill: 'accent',
        fillOpacity: 0.2,
        role: 'accent',
      },
      {
        d: 'M -1.8 8.2 C -4.6 11.5 -4.6 22.8 -1.8 26.0 M 1.8 8.2 C 4.6 11.5 4.6 22.8 1.8 26.0',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.52,
        opacity: 0.52,
      },
      {
        d: 'M -4.2 8.0 Q 0 7.4 4.2 8.0 M -4.0 26.2 Q 0 26.8 4.0 26.2',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.88,
      },
      {
        d: 'M -0.4 26.5 C -1.2 29.5 -1.8 32.0 -1.2 34.2 M 0.6 26.5 C 1.4 29.2 2.2 31.8 1.8 33.8',
        fill: 'none',
        role: 'accent',
        strokeScale: 0.65,
      },
    ],
  },

  // 23. Bập bênh (`nhap`)
  seesaw: {
    status: 'nhap',
    labelVi: 'Bập bênh gỗ',
    anchorType: 'ground',
    emitterOffset: [0, -15],
    shapes: [
      {
        d: 'M -9.2 0 C -8.2 -7.2 -3.6 -13.8 0 -13.8 C 3.6 -13.8 8.2 -7.2 9.2 0 Q 0 0.5 -9.2 0 Z',
        fill: 'bg',
        fillOpacity: 0.13,
        role: 'ink',
      },
      {
        d: 'M -5.8 -1.2 C -5.0 -6.5 -2.2 -11.2 0 -12.0 C -1.8 -8.5 -3.2 -4.8 -3.6 -1.0 Z',
        fill: 'ink',
        fillOpacity: 0.08,
        role: 'ink',
        strokeScale: 0,
      },
      {
        d: 'M -38.0 -14.2 Q 0 -15.4 38.0 -14.2 Q 38.0 -12.4 36.5 -12.4 Q 0 -13.5 -36.5 -12.4 Q -38.0 -12.4 -38.0 -14.2 Z',
        fill: 'bg',
        fillOpacity: 0.12,
        role: 'ink',
      },
      {
        d: 'M -29.0 -14.5 Q -29.0 -18.2 -25.5 -17.5 M 29.0 -14.5 Q 29.0 -18.2 25.5 -17.5',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.65,
        opacity: 0.58,
      },
    ],
  },

  // 24. Đồng hồ cát (`nhap`)
  hourglass: {
    status: 'nhap',
    labelVi: 'Đồng hồ cát',
    anchorType: 'ground',
    emitterOffset: [0, -32],
    tiltPivot: [-1.8, -0.8],
    shapes: [
      {
        d: 'M -11.2 -32.0 Q 0 -32.8 11.2 -32.0 M -11.2 0 Q 0 0.8 11.2 0',
        fill: 'none',
        role: 'ink',
        strokeScale: 1.0,
      },
      {
        d: 'M -9.6 -31.8 C -9.2 -24.0 -8.8 -8.0 -9.6 -0.2 M 9.6 -31.8 C 9.2 -24.0 8.8 -8.0 9.6 -0.2',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.55,
        opacity: 0.5,
      },
      {
        d: 'M -8.4 -31.8 C -8.6 -22.5 -1.4 -18.5 -0.8 -16.0 C -1.4 -13.5 -8.6 -9.5 -8.4 -0.2 L 8.4 -0.2 C 8.6 -9.5 1.4 -13.5 0.8 -16.0 C 1.4 -18.5 8.6 -22.5 8.4 -31.8 Z',
        fill: 'bg',
        fillOpacity: 0.11,
        role: 'ink',
      },
      {
        d: 'M -5.8 -29.2 C -5.8 -23.5 -2.2 -19.8 -1.2 -17.5',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.52,
        opacity: 0.48,
      },
      {
        d: 'M -6.2 -1.2 C -4.2 -5.5 -1.5 -8.8 0 -9.2 C 1.5 -8.8 4.2 -5.5 6.2 -1.2 Q 0 -0.6 -6.2 -1.2 Z',
        fill: 'accent',
        fillOpacity: 0.25,
        role: 'accent',
        strokeScale: 0.72,
      },
    ],
  },

  // 25. Bong bóng suy nghĩ (`nhap`)
  chat_bubble: {
    status: 'nhap',
    labelVi: 'Khung tin nhắn',
    anchorType: 'center',
    emitterOffset: [0, -12],
    shapes: [
      {
        d: 'M -15.5 -11.8 Q 0 -13.0 15.5 -11.8 C 19.5 -11.5 21.2 -8.8 21.2 -1.0 C 21.2 6.8 19.2 9.5 15.2 9.8 Q 5.5 10.4 -3.8 10.0 C -6.8 13.2 -10.2 15.5 -12.4 16.2 C -11.2 13.8 -10.4 11.8 -10.0 9.8 L -15.2 9.8 C -19.2 9.5 -21.2 6.8 -21.2 -1.0 C -21.2 -8.8 -19.5 -11.5 -15.5 -11.8 Z',
        fill: 'bg',
        fillOpacity: 0.12,
        role: 'ink',
      },
      {
        d: 'M -14.2 -9.2 Q 0 -10.2 14.2 -9.2',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.52,
        opacity: 0.48,
      },
      {
        circle: [-6.8, -1.0, 1.65],
        fill: 'accent',
        fillOpacity: 0.26,
        role: 'accent',
        strokeScale: 0.65,
      },
      {
        circle: [0, -1.0, 1.65],
        fill: 'accent',
        fillOpacity: 0.26,
        role: 'accent',
        strokeScale: 0.65,
      },
      {
        circle: [6.8, -1.0, 1.65],
        fill: 'accent',
        fillOpacity: 0.26,
        role: 'accent',
        strokeScale: 0.65,
      },
    ],
  },

  // 26. Làn mây thủy mặc (`duyet`, kich_thuoc_that: 118 cm >= 30 -> 118 * 0.32 * 1.0 = 37.76)
  cloud_wisp: {
    status: 'duyet',
    labelVi: 'Làn mây thuỷ mặc',
    kich_thuoc_that: 118,
    description5: {
      nghia: 'Khoảng trời thoáng đãng gợi sự trôi chảy nhẹ tênh của thời gian.',
      cau_truc: 'Gồm 3 nét nhận diện là hai nhịp cong lượn tầng trên, nét gợn mảnh đỡ phía dưới và khoảng hở thoáng hai đầu.',
      bong_dang: 'Dải sóng mây ngang mềm mại treo lơ lửng trên cao.',
      the_gioi: 'Thuộc lớp `nen` loại neo `troi`, chỉ dùng nét xám nhạt để điểm xuyết bầu trời.',
      nguoi_la: 'Thấy hai nét lượn bồng bềnh trên đỉnh khung hình là người lạ đọc ra ngay đám mây.',
    },
    anchorType: 'center',
    defaultLayer: 'nen',
    anchorKind: 'troi',
    box: [-18.6, -5.8, 19.6, 6.6],
    anchors: {},
    canBeRed: false,
    emitterOffset: [0, 0],
    shapes: [
      {
        d: 'M -18 2 C -13 -5 -5 -5 0 -1 C 5 -6 14 -5 19 1',
        fill: 'secondary',
        fillOpacity: 0.08,
        role: 'secondary',
        strokeScale: 0.85,
        opacity: 0.96,
      },
      {
        d: 'M -11 6 C -5 2 4 2 12 5',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.72,
        opacity: 0.86,
      },
    ],
  },

  // === 6 ĐẠO CỤ NHÓM CÔNG SỞ & BÀN TRÀ ĐÃ ĐẠT (`status: 'duyet'`) ===

  // 27. Ghế tựa công sở (`duyet`, kich_thuoc_that: 75 cm >= 30 -> 75 * 0.32 * 1.0 = 24.00)
  std_chair: {
    status: 'duyet',
    labelVi: 'Ghế tựa công sở',
    kich_thuoc_that: 75,
    description5: {
      nghia: 'Chỗ ngồi làm việc quen thuộc mỗi ngày nơi công sở hoặc góc bàn riêng.',
      cau_truc: 'Gồm 3 đặc điểm nhận diện là lưng tựa thẳng hơi ngả nhẹ phía sau, mặt ghế ngang vừa tầm gối và hai chân giằng thanh ngang dưới gầm.',
      bong_dang: 'Nhìn ngang thấy rõ dáng chữ h thanh mảnh với lưng cao một bên và khoảng gầm ghế thoáng sáng.',
      the_gioi: 'Vẽ bằng nét mực mảnh mộc mạc, lược bỏ bánh xe xoay rườm rà để giữ chất tĩnh lặng của Trà Nguội.',
      nguoi_la: 'Người lạ lướt qua một giây nhận ra ngay chiếc ghế tựa ngồi bàn làm việc khi thấy Lữ khách ngồi tựa lưng vừa vặn.',
    },
    anchorType: 'ground',
    defaultLayer: 'giua',
    anchorKind: 'dat',
    box: [-10.5, -24.0, 9.5, 0],
    anchors: {
      mat_ghe: [0, -10.8],
    },
    canBeRed: false,
    emitterOffset: [0, -12],
    shapes: [
      {
        d: 'M -9.5 -24.0 L -8.5 -10.8',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.78,
      },
      {
        rect: [-10.0, -11.4, 19.5, 2.2, 0.9],
        fill: 'bg',
        fillOpacity: 0.12,
        role: 'ink',
        strokeScale: 0.72,
      },
      {
        d: 'M -8.4 -9.2 L -9.8 0 M 7.6 -9.2 L 9.0 0',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.75,
      },
    ],
  },

  // 28. Đôn gỗ thấp ngồi trà (`duyet`, kich_thuoc_that: 60 cm >= 30 -> 60 * 0.32 * 1.0 = 19.20)
  low_wood_stool: {
    status: 'duyet',
    labelVi: 'Đôn gỗ thấp ngồi trà',
    kich_thuoc_that: 60,
    description5: {
      nghia: 'Chỗ ngồi thấp bình dị bên bàn trà chiều, gợi nhịp nghỉ ngơi chậm rãi ngoài giờ làm.',
      cau_truc: 'Gồm 3 đặc điểm nhận diện là mặt đôn gỗ bo tròn hơi cong nhẹ, đôi chân choãi vững xuống đất và thanh giằng ngang thấp.',
      bong_dang: 'Khối thang cân đối thấp ngang gối Lữ khách, hoàn toàn không có lưng tựa nên tách biệt hẳn với ghế làm việc.',
      the_gioi: 'Nét cọ mảnh điểm lớp giấy nhạt ở mặt gỗ, đồng điệu tự nhiên với bàn trà thấp và chén gốm.',
      nguoi_la: 'Ai nhìn thoáng qua cảnh Lữ khách ngồi đôn cầm chén cũng nhận ra ngay chiếc đôn gỗ uống nước quen thuộc.',
    },
    anchorType: 'ground',
    defaultLayer: 'giua',
    anchorKind: 'dat',
    box: [-9.8, -11.4, 9.8, 0],
    anchors: {
      mat_ghe: [0, -10.8],
    },
    canBeRed: false,
    emitterOffset: [0, -11],
    shapes: [
      {
        d: 'M -9.5 -10.8 Q 0 -11.4 9.5 -10.8 Q 9.8 -9.0 9.0 -8.8 Q 0 -9.2 -9.0 -8.8 Q -9.8 -9.0 -9.5 -10.8 Z',
        fill: 'bg',
        fillOpacity: 0.11,
        role: 'ink',
        strokeScale: 0.75,
      },
      {
        d: 'M -7.2 -8.8 L -8.6 0 M 7.2 -8.8 L 8.6 0',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.72,
      },
    ],
  },

  // 29. Bàn làm việc công sở (`duyet`, kich_thuoc_that: 112 cm >= 30 -> 112 * 0.32 * 1.0 = 35.84)
  std_work_desk: {
    status: 'duyet',
    labelVi: 'Bàn làm việc công sở',
    kich_thuoc_that: 112,
    description5: {
      nghia: 'Mặt phẳng gánh vác công việc, deadline và những buổi ngồi lặng trước giờ tan tầm.',
      cau_truc: 'Gồm 3 đặc điểm nhận diện là mặt bàn ngang phẳng rộng ba khe đặt đồ, hai chân thẳng đứng vững chãi và thanh giằng sát dưới mặt bàn.',
      bong_dang: 'Khung chữ Π ngang thoáng gầm, cao ngang thắt lưng Lữ khách đứng để lộ rõ đôi chân khi ngồi ghế.',
      the_gioi: 'Bỏ hết hộc tủ đặc nặng nề, chỉ giữ nét khung thanh thoát để không tạo mảng tối lấn chữ thơ bên dưới.',
      nguoi_la: 'Đặt cạnh Lữ khách, người lạ thấy mặt bàn cao gấp rưỡi mặt ghế là hiểu ngay đây là bàn làm việc tiêu chuẩn.',
    },
    anchorType: 'ground',
    defaultLayer: 'giua',
    anchorKind: 'dat',
    box: [-19.0, -19.2, 19.0, 0],
    anchors: {
      mat_ban_trai: [-5.2, -19.2],
      mat_ban_giua: [4.8, -19.2],
      mat_ban_phai: [12.8, -19.2],
    },
    canBeRed: false,
    emitterOffset: [0, -19.2],
    shapes: [
      {
        rect: [-19.0, -19.2, 38.0, 2.2, 0.8],
        fill: 'bg',
        fillOpacity: 0.12,
        role: 'ink',
        strokeScale: 0.72,
      },
      {
        d: 'M -15.6 -17.0 L -15.6 0 M 15.6 -17.0 L 15.6 0',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.75,
      },
    ],
  },

  // 30. Bàn trà gỗ thấp (`duyet`, kich_thuoc_that: 98 cm >= 30 -> 98 * 0.32 * 1.0 = 31.36)
  low_tea_table: {
    status: 'duyet',
    labelVi: 'Bàn trà gỗ thấp',
    kich_thuoc_that: 98,
    description5: {
      nghia: 'Khoảng dừng ấm áp để đặt ấm chén, tấm thiệp hay ngồi đối ẩm chậm rãi.',
      cau_truc: 'Gồm 3 đặc điểm nhận diện là mặt gỗ hơi uốn mềm hai đầu, đôi chân ngắn choãi nhẹ và thanh ngang giữ khung ở lưng chừng chân.',
      bong_dang: 'Dáng bàn lùn ngang đầu gối Lữ khách đứng, rộng ngang mà thấp thoáng nên không che khuất thân người.',
      the_gioi: 'Viền mực mảnh kết hợp lớp giấy sáng nhẹ ở mặt bàn, ăn khớp với đôn gỗ thấp và không bao giờ làm vật đỏ.',
      nguoi_la: 'So tỷ lệ thấp ngang gối cạnh Lữ khách, người chưa xem kênh bao giờ vẫn phân biệt được ngay bàn trà với bàn làm việc.',
    },
    anchorType: 'ground',
    defaultLayer: 'giua',
    anchorKind: 'dat',
    box: [-15.8, -14.8, 15.8, 0],
    anchors: {
      mat_ban_trai: [-8.5, -14.2],
      mat_ban_giua: [0, -14.2],
      mat_ban_phai: [8.5, -14.2],
    },
    canBeRed: false,
    emitterOffset: [0, -14.2],
    shapes: [
      {
        d: 'M -15.5 -14.2 Q 0 -14.8 15.5 -14.2 Q 15.8 -12.0 14.8 -11.8 Q 0 -12.3 -14.8 -11.8 Q -15.8 -12.0 -15.5 -14.2 Z',
        fill: 'bg',
        fillOpacity: 0.11,
        role: 'ink',
        strokeScale: 0.75,
      },
      {
        d: 'M -12.2 -11.8 L -13.2 0 M 12.2 -11.8 L 13.2 0',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.72,
      },
    ],
  },

  // 31. Lịch để bàn (`duyet`, kich_thuoc_that: 26 cm < 30 -> 26 * 0.32 * 2.0 = 16.64)
  desk_calendar: {
    status: 'duyet',
    labelVi: 'Lịch để bàn',
    kich_thuoc_that: 26,
    description5: {
      nghia: 'Dấu mốc ngày tháng trôi qua, nhắc kỳ cuối tháng hoặc một chuyện cũ trong lòng chưa chịu sang trang.',
      cau_truc: 'Gồm 3 đặc điểm nhận diện là thân lịch dựng chữ A vững trên bàn, ba vòng lò xo đóng gáy trên đỉnh và ba vạch dòng ngày tháng.',
      bong_dang: 'Hình thang cân thu nhỏ dần lên đỉnh kèm ba mấu lò xo nhô đều trên sống gáy.',
      the_gioi: 'Tối giản các con số li ti thành ba nét gạch ngang thanh mảnh; bản đỏ giữ y hệt dáng bản thường, chỉ đổi sắc Chu Sa.',
      nguoi_la: 'Chỉ cần thấy khối dựng tam giác có hàng lò xo trên mặt bàn làm việc là người lạ đọc ra ngay cuốn lịch để bàn.',
    },
    anchorType: 'ground',
    defaultLayer: 'giua',
    anchorKind: 'tren',
    allowedAnchorKinds: ['tren', 'dat'],
    box: [-7.45, -12.8, 7.45, 0],
    anchors: {},
    canBeRed: true,
    emitterOffset: [0, -7],
    shapes: [
      {
        d: 'M -6.8 0 L -5.0 -11.0 L 5.0 -11.0 L 6.8 0 Z',
        fill: 'bg',
        fillOpacity: 0.1,
        role: 'ink',
        strokeScale: 0.68,
      },
      {
        d: 'M -3.2 -12.2 L -3.2 -9.8 M 3.2 -12.2 L 3.2 -9.8',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.6,
      },
      {
        d: 'M -3.6 -6.0 L 3.6 -6.0 M -3.8 -3.4 L 2.0 -3.4',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.48,
      },
    ],
    altShapes: [
      {
        d: 'M -6.8 0 L -5.0 -11.0 L 5.0 -11.0 L 6.8 0 Z',
        fill: 'accent',
        fillOpacity: 0.35,
        role: 'accent',
        strokeScale: 0.68,
      },
      {
        d: 'M -3.2 -12.2 L -3.2 -9.8 M 3.2 -12.2 L 3.2 -9.8',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.6,
      },
      {
        d: 'M -3.6 -6.0 L 3.6 -6.0 M -3.8 -3.4 L 2.0 -3.4',
        fill: 'bg',
        fillOpacity: 0,
        strokeScale: 0.48,
      },
    ],
  },

  // 32. Laptop công sở nhìn ngang quay về phía Lữ khách (`duyet`, kich_thuoc_that: 29 cm < 30 -> 29 * 0.32 * 2.0 = 18.56)
  desk_laptop: {
    status: 'duyet',
    labelVi: 'Laptop công sở',
    kich_thuoc_that: 29,
    description5: {
      nghia: 'Công việc văn phòng, tin nhắn công chuyện và ánh màn hình giữ chân người trẻ ngồi lại bên bàn.',
      cau_truc: 'Gồm 3 đặc điểm nhận diện khi nhìn ngang là đế bàn phím nằm phẳng hướng về Lữ khách bên trái, khớp bản lề giữa và màn hình dựng nghiêng quay mặt sáng về phía người ngồi.',
      bong_dang: 'Dáng chữ L mở góc tù nhìn ngang sắc gọn: đế ngang mỏng bên trái và tấm màn hình nghiêng bên phải quay mặt về phía Lữ khách.',
      the_gioi: 'Giữ viền mực mảnh màu giấy cho thân vỏ và bàn phím; ở bản đỏ chỉ phần màn hình đổi đỏ Chu Sa trên đúng dáng cũ.',
      nguoi_la: 'Nhìn hai phần đế bàn phím phẳng và màn hình mở nghiêng quay về phía Lữ khách ngồi bàn, người lạ nhận ra ngay chiếc laptop.',
    },
    anchorType: 'ground',
    defaultLayer: 'giua',
    anchorKind: 'tren',
    allowedAnchorKinds: ['tren', 'dat'],
    box: [-6.85, -16.05, 6.25, 0],
    anchors: {},
    canBeRed: true,
    emitterOffset: [2.0, -8],
    shapes: [
      {
        d: 'M -6.2 0 L 1.6 0 L 1.6 -1.8 L -5.6 -1.8 Q -6.2 -1.8 -6.2 -1.1 Z',
        fill: 'bg',
        fillOpacity: 0.1,
        role: 'ink',
        strokeScale: 0.68,
      },
      {
        d: 'M 0.8 -1.8 L 4.4 -15.4 L 5.6 -15.0 L 2.1 -1.8 Z',
        fill: 'bg',
        fillOpacity: 0.1,
        role: 'ink',
        strokeScale: 0.68,
      },
    ],
    altShapes: [
      {
        d: 'M -6.2 0 L 1.6 0 L 1.6 -1.8 L -5.6 -1.8 Q -6.2 -1.8 -6.2 -1.1 Z',
        fill: 'bg',
        fillOpacity: 0.1,
        role: 'ink',
        strokeScale: 0.68,
      },
      {
        d: 'M 0.8 -1.8 L 4.4 -15.4 L 5.6 -15.0 L 2.1 -1.8 Z',
        fill: 'accent',
        fillOpacity: 0.35,
        role: 'accent',
        strokeScale: 0.68,
      },
    ],
  },

  // === 5 ĐẠO CỤ CHƯA ĐẠT ĐANG TRÌNH DUYỆT LẠI Ở LẦN 3 (`status: 'nhap'`) ===

  // 33. Ví tiền gập đôi (`nhap`, kich_thuoc_that: 15 cm < 30 -> 15 * 0.32 * 2.0 = 9.60; nằm/dựng thấp gọn trên mặt bàn, có trạng thái `khoa`)
  vi_tien: {
    status: 'duyet',
    labelVi: 'Ví gập',
    kich_thuoc_that: 15,
    description5: {
      nghia: 'Hầu bao cá nhân, chuyện tiền nong vơi đầy cuối tháng và quyết tâm giữ chặt chi tiêu.',
      cau_truc: 'Gồm 3 đặc điểm nhận diện là thân ví chữ nhật bo góc nằm thấp gọn trên bàn có nấc gập hai ngăn, quai cài bấm khuy bên hông và trạng thái `khoa` gắn ổ khoá móc nhỏ.',
      bong_dang: 'Khối chữ nhật nằm ngang thấp gọn rộng khoảng một phần tư mặt bàn, có nấc gáy gấp đôi ở đỉnh và tách bạch hẳn với phong bì hay thiệp.',
      the_gioi: 'Tuân thủ đúng hệ số phóng đại `HE_SO_PHONG_DAI = 2.0` cho vật thật 15 cm; ở cả trạng thái thường lẫn `khoa`, bản đỏ giữ nguyên dáng 100%.',
      nguoi_la: 'Nhờ mép gập hai ngăn trên miệng ví, quai khuy bấm ngang thân và ổ khoá nhỏ khi khoá ví, người lạ nhận ra ngay chiếc ví tiền.',
    },
    anchorType: 'ground',
    defaultLayer: 'giua',
    anchorKind: 'tren',
    allowedAnchorKinds: ['tren', 'cam', 'dat'],
    box: [-5.3, -6.9, 5.3, 0],
    anchors: {},
    canBeRed: true,
    emitterOffset: [0, -3.5],
    shapes: [
      {
        d: 'M -4.3 -5.4 L -3.6 -6.25 L 3.7 -6.25 L 4.3 -5.4 Z',
        fill: 'bg',
        fillOpacity: 0.09,
        role: 'ink',
        strokeScale: 0.6,
      },
      {
        d: 'M -4.2 -5.5 L 4.2 -5.5 Q 4.7 -5.5 4.7 -5.0 L 4.7 -0.5 Q 4.7 0 4.2 0 L -4.2 0 Q -4.7 0 -4.7 -0.5 L -4.7 -5.0 Q -4.7 -5.5 -4.2 -5.5 Z',
        fill: 'bg',
        fillOpacity: 0.11,
        role: 'ink',
        strokeScale: 0.65,
      },
      {
        d: 'M -3.7 -4.5 L 3.7 -4.5',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.48,
      },
    ],
    altShapes: [
      {
        d: 'M -4.3 -5.4 L -3.6 -6.25 L 3.7 -6.25 L 4.3 -5.4 Z',
        fill: 'accent',
        fillOpacity: 0.3,
        role: 'accent',
        strokeScale: 0.6,
      },
      {
        d: 'M -4.2 -5.5 L 4.2 -5.5 Q 4.7 -5.5 4.7 -5.0 L 4.7 -0.5 Q 4.7 0 4.2 0 L -4.2 0 Q -4.7 0 -4.7 -0.5 L -4.7 -5.0 Q -4.7 -5.5 -4.2 -5.5 Z',
        fill: 'accent',
        fillOpacity: 0.35,
        role: 'accent',
        strokeScale: 0.65,
      },
      {
        d: 'M -3.7 -4.5 L 3.7 -4.5',
        fill: 'bg',
        fillOpacity: 0,
        strokeScale: 0.48,
      },
    ],
    variants: {
      khoa: {
        labelVi: 'Ví đang khoá ổ khoá nhỏ',
        box: [-5.3, -6.9, 5.3, 0],
        shapes: [
          {
            d: 'M -4.3 -5.4 L -3.6 -6.25 L 3.7 -6.25 L 4.3 -5.4 Z',
            fill: 'bg',
            fillOpacity: 0.09,
            role: 'ink',
            strokeScale: 0.6,
          },
          {
            d: 'M -4.2 -5.5 L 4.2 -5.5 Q 4.7 -5.5 4.7 -5.0 L 4.7 -0.5 Q 4.7 0 4.2 0 L -4.2 0 Q -4.7 0 -4.7 -0.5 L -4.7 -5.0 Q -4.7 -5.5 -4.2 -5.5 Z',
            fill: 'bg',
            fillOpacity: 0.11,
            role: 'ink',
            strokeScale: 0.65,
          },
          {
            d: 'M -3.7 -4.5 L 3.7 -4.5',
            fill: 'none',
            role: 'secondary',
            strokeScale: 0.48,
          },
          {
            d: 'M 1.6 -2.1 L 1.6 -2.9 A 0.65 0.65 0 0 1 2.9 -2.9 L 2.9 -2.1',
            fill: 'none',
            role: 'ink',
            strokeScale: 0.55,
          },
          {
            rect: [1.1, -2.1, 2.3, 1.9, 0.35],
            fill: 'bg',
            fillOpacity: 0.14,
            role: 'ink',
            strokeScale: 0.58,
          },
        ],
        altShapes: [
          {
            d: 'M -4.3 -5.4 L -3.6 -6.25 L 3.7 -6.25 L 4.3 -5.4 Z',
            fill: 'accent',
            fillOpacity: 0.3,
            role: 'accent',
            strokeScale: 0.6,
          },
          {
            d: 'M -4.2 -5.5 L 4.2 -5.5 Q 4.7 -5.5 4.7 -5.0 L 4.7 -0.5 Q 4.7 0 4.2 0 L -4.2 0 Q -4.7 0 -4.7 -0.5 L -4.7 -5.0 Q -4.7 -5.5 -4.2 -5.5 Z',
            fill: 'accent',
            fillOpacity: 0.35,
            role: 'accent',
            strokeScale: 0.65,
          },
          {
            d: 'M -3.7 -4.5 L 3.7 -4.5',
            fill: 'bg',
            fillOpacity: 0,
            strokeScale: 0.48,
          },
          {
            d: 'M 1.6 -2.1 L 1.6 -2.9 A 0.65 0.65 0 0 1 2.9 -2.9 L 2.9 -2.1',
            fill: 'none',
            role: 'ink',
            strokeScale: 0.55,
          },
          {
            rect: [1.1, -2.1, 2.3, 1.9, 0.35],
            fill: 'accent',
            fillOpacity: 0.35,
            role: 'ink',
            strokeScale: 0.58,
          },
        ],
      },
    },
  },

  // 34. Tấm thiệp gập đôi (`nhap`, kich_thuoc_that: 15 cm < 30 -> 15 * 0.32 * 2.0 = 9.60; giữ nguyên dáng, giảm theo công thức phóng đại)
  thiep: {
    status: 'duyet',
    labelVi: 'Tấm thiệp gập đôi',
    kich_thuoc_that: 15,
    description5: {
      nghia: 'Lời hẹn ăn tối, tấm lòng gửi trao hoặc lời mời dịu dàng làm mềm đi những toan tính thường ngày.',
      cau_truc: 'Gồm 3 đặc điểm nhận diện là hai cánh giấy cứng gập đôi tự đứng trên bàn, đường sống gập dọc bên trái và hai nét chữ tay ngắn kèm chấm triện nhỏ.',
      bong_dang: 'Hai cánh giấy đứng lệch góc tạo khe mở chữ V rõ rệt ở chân đáy, thu gọn theo đúng tỷ lệ thật 15 cm với hệ số phóng đại 2.0.',
      the_gioi: 'Vẽ thanh mảnh trên nền giấy sáng; khi làm vật đỏ giữ nguyên hai cánh thiệp y hệt bản thường, không thêm bớt chi tiết.',
      nguoi_la: 'Thấy tờ giấy cứng gập đôi dựng hé hai cánh vừa vặn trên bàn trà là người lạ nhận ra ngay tấm thiệp mời.',
    },
    anchorType: 'ground',
    defaultLayer: 'giua',
    anchorKind: 'tren',
    allowedAnchorKinds: ['tren', 'cam', 'dat'],
    box: [-4.6, -10.1, 4.6, 0],
    anchors: {},
    canBeRed: true,
    emitterOffset: [0, -5],
    shapes: [
      {
        d: 'M -4.0 -0.9 L -4.0 -9.1 L 4.0 -8.2 L 4.0 -0.4 Z',
        fill: 'bg',
        fillOpacity: 0.09,
        role: 'ink',
        strokeScale: 0.6,
      },
      {
        d: 'M -4.0 -0.9 L -4.0 -9.1 L 1.7 -9.5 L 1.7 0 Z',
        fill: 'bg',
        fillOpacity: 0.11,
        role: 'ink',
        strokeScale: 0.68,
      },
    ],
    altShapes: [
      {
        d: 'M -4.0 -0.9 L -4.0 -9.1 L 4.0 -8.2 L 4.0 -0.4 Z',
        fill: 'accent',
        fillOpacity: 0.3,
        role: 'accent',
        strokeScale: 0.6,
      },
      {
        d: 'M -4.0 -0.9 L -4.0 -9.1 L 1.7 -9.5 L 1.7 0 Z',
        fill: 'accent',
        fillOpacity: 0.35,
        role: 'accent',
        strokeScale: 0.68,
      },
    ],
  },

  // 35. Phong bì thư (`nhap`, kich_thuoc_that: 18 cm < 30 -> 18 * 0.32 * 2.0 = 11.52; nằm/dựng thấp gọn trên mặt bàn)
  phong_bi: {
    status: 'duyet',
    labelVi: 'Phong bì thư',
    kich_thuoc_that: 18,
    description5: {
      nghia: 'Bức thư niêm kín, giấy báo chính thức hoặc tin tức gửi trao tận tay.',
      cau_truc: 'Gồm 3 đặc điểm nhận diện là khung giấy chữ nhật nằm thấp gọn trên bàn, nắp tam giác cân gập từ hai góc trên và dấu sáp tròn ở mũi nắp.',
      bong_dang: 'Khối chữ nhật ngang nhỏ gọn `[-6.1, -7.8, 6.1, 0]` chỉ bằng một phần ba mặt bàn làm việc, nhận diện ngay nhờ đường chéo nắp thư.',
      the_gioi: 'Tuân thủ đúng kích thước thật 18 cm với hệ số phóng đại 2.0; bản đỏ giữ nguyên khung và nắp phong bì, chỉ đổi màu Chu Sa.',
      nguoi_la: 'Bất kỳ ai nhìn hình chữ nhật nhỏ gọn có nắp tam giác đóng dấu tròn ở tâm cũng đọc ra ngay chiếc phong bì thư.',
    },
    anchorType: 'ground',
    defaultLayer: 'giua',
    anchorKind: 'tren',
    allowedAnchorKinds: ['tren', 'cam', 'dat'],
    box: [-6.1, -7.8, 6.1, 0],
    anchors: {},
    canBeRed: true,
    emitterOffset: [0, -3.8],
    shapes: [
      {
        d: 'M -5.5 -7.2 L 5.5 -7.2 L 5.5 0 L -5.5 0 Z',
        fill: 'bg',
        fillOpacity: 0.11,
        role: 'ink',
        strokeScale: 0.65,
      },
      {
        d: 'M -5.4 -7.1 L 0 -2.9 L 5.4 -7.1',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.6,
      },
    ],
    altShapes: [
      {
        d: 'M -5.5 -7.2 L 5.5 -7.2 L 5.5 0 L -5.5 0 Z',
        fill: 'accent',
        fillOpacity: 0.35,
        role: 'accent',
        strokeScale: 0.65,
      },
      {
        d: 'M -5.4 -7.1 L 0 -2.9 L 5.4 -7.1',
        fill: 'bg',
        fillOpacity: 0,
        strokeScale: 0.6,
      },
    ],
  },

  // 36. Tờ hoá đơn răng cưa (`nhap`, kich_thuoc_that: 20 cm -> 12.80; mặc định `cam` tay cầm rủ xuống, thêm `tua` dựng nghiêng tựa vật khác trên bàn)
  hoa_don: {
    status: 'duyet',
    labelVi: 'Tờ hoá đơn răng cưa',
    kich_thuoc_that: 20,
    description5: {
      nghia: 'Các khoản phí sinh hoạt, tiền nhà điện nước và gánh nặng cơm áo đời thường dồn về.',
      cau_truc: 'Gồm 3 đặc điểm nhận diện là dải giấy dài hai đầu cắt răng cưa máy in, ba dòng kẻ ngang khoản mục và ô đóng khung tổng tiền cuối tờ.',
      bong_dang: 'Mặc định cầm trên tay rủ cong mềm xuống dưới (`[-3.5, -1.8, 3.5, 11.4]`), hoặc ở trạng thái `tua` dựng nghiêng tựa vào vật khác trên bàn.',
      the_gioi: 'Bỏ hoàn toàn kiểu nằm phẳng như hộp; ở cả trạng thái mặc định cầm tay lẫn trạng thái `tua`, bản đỏ giữ nguyên dáng răng cưa 100%.',
      nguoi_la: 'Thấy dải giấy dài cắt mép răng cưa rủ từ tay Lữ khách hoặc dựng nghiêng tựa trên bàn là người lạ nhận ra ngay tờ hoá đơn.',
    },
    anchorType: 'hand',
    defaultLayer: 'giua',
    anchorKind: 'cam',
    allowedAnchorKinds: ['cam', 'tren', 'dat'],
    box: [-3.5, -1.8, 3.5, 11.4],
    anchors: {},
    canBeRed: true,
    emitterOffset: [0, 5],
    shapes: [
      {
        d: 'M -2.8 -1.2 L -1.4 -0.4 L 0 -1.2 L 1.4 -0.4 L 2.8 -1.2 Q 3.1 4.8 2.4 10.8 L 1.0 10.0 L -0.2 10.8 L -1.5 10.0 L -2.9 10.8 Q -2.2 4.8 -2.8 -1.2 Z',
        fill: 'bg',
        fillOpacity: 0.11,
        role: 'ink',
        strokeScale: 0.65,
      },
      {
        d: 'M -1.7 2.5 L 1.8 2.5 M -1.8 5.0 L 1.0 5.0',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.48,
      },
    ],
    altShapes: [
      {
        d: 'M -2.8 -1.2 L -1.4 -0.4 L 0 -1.2 L 1.4 -0.4 L 2.8 -1.2 Q 3.1 4.8 2.4 10.8 L 1.0 10.0 L -0.2 10.8 L -1.5 10.0 L -2.9 10.8 Q -2.2 4.8 -2.8 -1.2 Z',
        fill: 'accent',
        fillOpacity: 0.35,
        role: 'accent',
        strokeScale: 0.65,
      },
      {
        d: 'M -1.7 2.5 L 1.8 2.5 M -1.8 5.0 L 1.0 5.0',
        fill: 'bg',
        fillOpacity: 0,
        strokeScale: 0.48,
      },
    ],
    variants: {
      cam: {
        labelVi: 'Hoá đơn cầm trên tay (rủ nhẹ xuống)',
        box: [-3.5, -1.8, 3.5, 11.4],
        shapes: [
          {
            d: 'M -2.8 -1.2 L -1.4 -0.4 L 0 -1.2 L 1.4 -0.4 L 2.8 -1.2 Q 3.1 4.8 2.4 10.8 L 1.0 10.0 L -0.2 10.8 L -1.5 10.0 L -2.9 10.8 Q -2.2 4.8 -2.8 -1.2 Z',
            fill: 'bg',
            fillOpacity: 0.11,
            role: 'ink',
            strokeScale: 0.65,
          },
          {
            d: 'M -1.7 2.5 L 1.8 2.5 M -1.8 5.0 L 1.0 5.0',
            fill: 'none',
            role: 'secondary',
            strokeScale: 0.48,
          },
        ],
        altShapes: [
          {
            d: 'M -2.8 -1.2 L -1.4 -0.4 L 0 -1.2 L 1.4 -0.4 L 2.8 -1.2 Q 3.1 4.8 2.4 10.8 L 1.0 10.0 L -0.2 10.8 L -1.5 10.0 L -2.9 10.8 Q -2.2 4.8 -2.8 -1.2 Z',
            fill: 'accent',
            fillOpacity: 0.35,
            role: 'accent',
            strokeScale: 0.65,
          },
          {
            d: 'M -1.7 2.5 L 1.8 2.5 M -1.8 5.0 L 1.0 5.0',
            fill: 'bg',
            fillOpacity: 0,
            strokeScale: 0.48,
          },
        ],
      },
      tua: {
        labelVi: 'Hoá đơn dựng nghiêng tựa vào vật khác trên bàn',
        box: [-3.8, -12.4, 4.2, 0],
        shapes: [
          {
            d: 'M -3.2 0 L -2.0 -0.7 L -0.8 0 L 0.4 -0.7 L 1.6 0 L 3.6 -11.4 L 2.4 -10.7 L 1.2 -11.6 L 0.0 -10.9 L -1.2 -11.8 Z',
            fill: 'bg',
            fillOpacity: 0.11,
            role: 'ink',
            strokeScale: 0.65,
          },
          {
            d: 'M -0.3 -8.2 L 2.3 -7.7 M -0.8 -5.5 L 1.5 -5.0',
            fill: 'none',
            role: 'secondary',
            strokeScale: 0.48,
          },
        ],
        altShapes: [
          {
            d: 'M -3.2 0 L -2.0 -0.7 L -0.8 0 L 0.4 -0.7 L 1.6 0 L 3.6 -11.4 L 2.4 -10.7 L 1.2 -11.6 L 0.0 -10.9 L -1.2 -11.8 Z',
            fill: 'accent',
            fillOpacity: 0.35,
            role: 'accent',
            strokeScale: 0.65,
          },
          {
            d: 'M -0.3 -8.2 L 2.3 -7.7 M -0.8 -5.5 L 1.5 -5.0',
            fill: 'bg',
            fillOpacity: 0,
            strokeScale: 0.48,
          },
        ],
      },
    },
  },

  // 37. Khung cửa sổ tường (`nhap`, kich_thuoc_that: 132 cm >= 30 -> 132 * 0.32 * 1.0 = 42.24; chén trà đặt trên `be_cua` cùng kích thước 100% với chén trên tay Lữ khách)
  porch_window: {
    status: 'duyet',
    labelVi: 'Khung cửa sổ tường',
    kich_thuoc_that: 132,
    description5: {
      nghia: 'Khoảng mở trên tường nhìn ra mưa nắng bên ngoài, nối căn phòng tĩnh lặng với nhịp thở đất trời.',
      cau_truc: 'Gồm 3 đặc điểm nhận diện là khung chữ nhật chỉ vẽ nét mảnh không tô xám, thanh đố chữ thập chia bốn ô thoáng và gờ bậu cửa nhô ngang có điểm neo `be_cua`.',
      bong_dang: 'Khung bốn ô thoáng rỗng có gờ bậu treo lửng trên tường ngang ngực và đầu Lữ khách, hoàn toàn tách khỏi mặt đất.',
      the_gioi: 'Thuộc lớp `nen` loại neo `tuong` và khoá `canBeRed: false` để không tạo mảng đỏ lớn lấn chữ; chén trà đặt trên `be_cua` có cùng kích thước 1:1 với chén trên tay Lữ khách.',
      nguoi_la: 'Nhìn khung bốn ô có bệ cửa đỡ chén trà treo cao phía sau vai Lữ khách, người lạ nhận ra ngay ô cửa sổ trên tường.',
    },
    anchorType: 'ground',
    defaultLayer: 'nen',
    anchorKind: 'tuong',
    box: [-21.12, -32.62, 21.12, 0],
    anchors: {
      be_cua: [0, -2.2],
    },
    canBeRed: false,
    emitterOffset: [0, -17],
    shapes: [
      {
        rect: [-18.0, -32.0, 36.0, 29.8, 1.2],
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.68,
      },
      {
        rect: [-20.5, -2.2, 41.0, 2.2, 0.5],
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.68,
      },
      {
        d: 'M 0 -32.0 L 0 -2.2 M -18.0 -17.1 L 18.0 -17.1',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.55,
      },
    ],
  },

  // === HỌ 1: `do_chua` (6 preset mới trạng thái `nhap`) ===
  ...DO_CHUA_NEW_PRESETS,
};

// Gắn các alias đã duyệt (`chen_tra` -> `small_cup`, `vo_ruou` -> `wine_jar`) trực tiếp vào propCatalog
for (const [aliasName, targetName] of Object.entries(PROP_FAMILY_ALIASES)) {
  if (BUILT_IN_PROP_CATALOG[targetName]) {
    BUILT_IN_PROP_CATALOG[aliasName] = BUILT_IN_PROP_CATALOG[targetName];
  }
}

function inferDefaultShapePivot(s: InlineShape): [number, number] {
  if (s.circle) return [s.circle[0], s.circle[1]];
  if (s.ellipse) return [s.ellipse[0], s.ellipse[1]];
  if (s.rect) return [s.rect[0] + s.rect[2] / 2, s.rect[1] + s.rect[3] / 2];
  if (s.line) return [s.line[0], s.line[1]];
  if (s.d) {
    const m = s.d.match(/^\s*M\s*(-?\d+(?:\.\d+)?)[\s,]+(-?\d+(?:\.\d+)?)/i);
    if (m) return [Number(m[1]), Number(m[2])];
  }
  return [0, 0];
}

function computeShapeAnimTransform(
  s: InlineShape,
  propState: EvaluatedPropState
): string | undefined {
  const anim = s.anim;
  if (!anim) return undefined;

  const [px, py] = anim.pivot ?? inferDefaultShapePivot(s);
  const cycles = Math.max(1, Math.round((anim.speed ?? 1) * 6));
  const phaseRad = (anim.phase ?? 0) * Math.PI * 2;
  const theta = propState.loopProgress * Math.PI * 2 * cycles + phaseRad;
  const actMult = anim.driveByMotion ? propState.motionActivity : 1;

  switch (anim.type) {
    case 'spin': {
      const dir = anim.direction ?? 1;
      if (anim.driveByMotion) {
        const radius = s.circle
          ? Math.max(3, s.circle[2])
          : Math.max(4, anim.amplitude ?? 9);
        const deg = (propState.travelDist / radius) * (180 / Math.PI) * dir;
        if (Math.abs(deg) < 0.02) return undefined;
        return `rotate(${deg.toFixed(2)}, ${px.toFixed(2)}, ${py.toFixed(2)})`;
      }
      const spinCycles = Math.max(1, Math.round((anim.speed ?? 1) * 3));
      const deg =
        (propState.loopProgress * 360 * spinCycles +
          (anim.phase ?? 0) * 360) *
        dir;
      return `rotate(${deg.toFixed(2)}, ${px.toFixed(2)}, ${py.toFixed(2)})`;
    }

    case 'swing': {
      const amp = (anim.amplitude ?? 16) * actMult;
      const deg = Math.sin(theta) * amp;
      if (Math.abs(deg) < 0.02) return undefined;
      return `rotate(${deg.toFixed(2)}, ${px.toFixed(2)}, ${py.toFixed(2)})`;
    }

    case 'flutter': {
      const flutterMult = anim.driveByMotion
        ? 0.35 + 0.65 * propState.motionActivity
        : 1;
      const amp = (anim.amplitude ?? 10) * flutterMult;
      const deg =
        (Math.sin(theta) * 0.68 + Math.sin(theta * 2 + 0.9) * 0.32) * amp;
      if (Math.abs(deg) < 0.02) return undefined;
      return `rotate(${deg.toFixed(2)}, ${px.toFixed(2)}, ${py.toFixed(2)})`;
    }

    case 'bob': {
      const amp = (anim.amplitude ?? 2.6) * actMult;
      const dy = Math.sin(theta) * amp;
      if (Math.abs(dy) < 0.02) return undefined;
      return `translate(0, ${dy.toFixed(2)})`;
    }

    case 'pulse': {
      const amp = (anim.amplitude ?? 0.1) * actMult;
      const sc = Math.max(0.2, 1 + Math.sin(theta) * amp);
      if (Math.abs(sc - 1) < 0.002) return undefined;
      return `translate(${px.toFixed(2)}, ${py.toFixed(2)}) scale(${sc.toFixed(3)}) translate(${(-px).toFixed(2)}, ${(-py).toFixed(2)})`;
    }

    default:
      return undefined;
  }
}

export function renderShapeListStatic(
  shapes: InlineShape[],
  propState: EvaluatedPropState,
  palette: ThemePalette,
  baseStrokeWidth: number,
  isAfterPivot: boolean
): React.ReactNode {
  const allowAccent = isAfterPivot && propState.isAccentActive;
  const isDark = isDarkThemePalette(palette.id);
  const accentPropColor = palette.accentProp || palette.accent;

  return shapes.map((s, idx) => {
    if (s.show === 'before_pivot' && isAfterPivot) return null;
    if (s.show === 'after_pivot' && !isAfterPivot) return null;

    const isNegativeCarve =
      s.fill === 'bg' &&
      s.fillOpacity === 0 &&
      (s.strokeScale === undefined || s.strokeScale > 0);
    const strokeColor = isNegativeCarve
      ? palette.background
      : s.role
        ? s.role === 'accent'
          ? allowAccent
            ? accentPropColor
            : propState.color
          : resolveRoleColor(s.role, palette, !isAfterPivot)
        : propState.color;

    const isWashClosed = s.fill === 'bg' && !isNegativeCarve;
    const rawFillColor =
      !s.fill || s.fill === 'none' || isNegativeCarve
        ? 'none'
        : s.fill === 'bg'
          ? strokeColor
          : s.fill === 'accent'
            ? allowAccent
              ? accentPropColor
              : strokeColor
            : s.fill === 'secondary'
              ? palette.inkSecondary
              : palette.inkPrimary;

    const isAccentPropFill =
      allowAccent &&
      !isNegativeCarve &&
      (s.fill === 'accent' || (isWashClosed && strokeColor === accentPropColor));
    const baseFillOpacity =
      !s.fill || s.fill === 'none' || isNegativeCarve
        ? 0
        : isAccentPropFill
          ? Math.max(s.fillOpacity ?? 0, RED_PIVOT_FILL_OPACITY)
          : s.fillOpacity !== undefined
            ? s.fillOpacity
            : isWashClosed
              ? 0.12
              : 0.14;
    const resolvedFillOpacity =
      isDark && isAccentPropFill
        ? Math.min(0.85, Math.max(RED_PIVOT_FILL_OPACITY, baseFillOpacity))
        : baseFillOpacity;

    const sw =
      s.strokeScale === 0 ? 0 : baseStrokeWidth * (s.strokeScale ?? 1);
    const dash = s.dashed ? '4.0 4.0' : undefined;
    const rawShapeOpacity = s.opacity ?? 1;
    const shapeOpacity =
      isDark && s.role === 'secondary'
        ? Math.max(0.62, rawShapeOpacity)
        : rawShapeOpacity;

    let splitTransform: string | undefined;
    let splitOpacityMult = 1;
    if (propState.splitProgress > 0.001 && s.splitSide) {
      const dir = s.splitSide === 'left' ? -1 : 1;
      const dx = dir * propState.splitProgress * 18;
      const dy = propState.splitProgress * 8;
      const rot = dir * propState.splitProgress * 16;
      splitTransform = `translate(${dx.toFixed(1)}, ${dy.toFixed(1)}) rotate(${rot.toFixed(1)})`;
      splitOpacityMult = Math.max(0, 1 - propState.splitProgress * 0.85);
    }

    const animTransform = computeShapeAnimTransform(s, propState);
    const combinedTransform =
      [splitTransform, animTransform].filter(Boolean).join(' ') || undefined;

    const isDrawing = propState.drawProgress < 0.999;
    const totalShapes = Math.max(1, shapes.length);
    const staggerSpan =
      totalShapes > 1 ? Math.min(0.48, (totalShapes - 1) * 0.14) : 0;
    const shapeWindowStart =
      totalShapes > 1 ? (idx / (totalShapes - 1)) * staggerSpan : 0;
    const shapeWindowDuration = Math.max(0.35, 1 - staggerSpan);
    const localDraw = isDrawing
      ? Math.max(
          0,
          Math.min(
            1,
            (propState.drawProgress - shapeWindowStart) / shapeWindowDuration
          )
        )
      : 1;
    const rawStrokeP = isDrawing
      ? Math.max(0, Math.min(1, localDraw / 0.85))
      : 1;
    const strokeP = isDrawing
      ? 0.5 - 0.5 * Math.cos(Math.PI * rawStrokeP)
      : 1;
    const rawWashP = isDrawing
      ? Math.max(0, Math.min(1, (localDraw - 0.52) / 0.48))
      : 1;
    const drawFillMult = isDrawing
      ? 0.5 - 0.5 * Math.cos(Math.PI * rawWashP)
      : 1;
    const rawInkGate = isDrawing ? Math.max(0, Math.min(1, strokeP / 0.22)) : 1;
    const strokeInkGate = isDrawing
      ? 0.5 - 0.5 * Math.cos(Math.PI * rawInkGate)
      : 1;

    const guideStrokeWidth =
      isDrawing && sw === 0 && !isNegativeCarve
        ? baseStrokeWidth * 0.68 * (1 - drawFillMult * 0.88)
        : 0;
    const activeStrokeWidth = sw > 0 ? sw : guideStrokeWidth;
    const activeStrokeColor =
      sw > 0
        ? strokeColor
        : rawFillColor !== 'none'
          ? rawFillColor
          : strokeColor;

    const strokeSelfDrawProps =
      isDrawing && !s.dashed && activeStrokeWidth > 0.01
        ? {
            pathLength: 1000,
            strokeDasharray: '1000',
            strokeDashoffset: (1000 * (1 - strokeP)).toFixed(1),
          }
        : {
            strokeDasharray: dash,
          };

    const commonProps = {
      fill: rawFillColor,
      fillOpacity: resolvedFillOpacity * drawFillMult,
      stroke: activeStrokeWidth > 0.01 ? activeStrokeColor : 'none',
      strokeWidth: activeStrokeWidth,
      strokeOpacity: (sw > 0 ? 0.88 : 0.72) * strokeInkGate,
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
      opacity: shapeOpacity * splitOpacityMult,
      transform: combinedTransform,
      ...strokeSelfDrawProps,
    };

    const needsOpaqueBacking =
      isWashClosed || isAccentPropFill || resolvedFillOpacity >= 0.85;

    if (s.d) {
      return (
        <g key={idx}>
          {needsOpaqueBacking && drawFillMult > 0.005 && (
            <path
              d={s.d}
              fill={palette.background}
              stroke="none"
              opacity={drawFillMult}
              transform={combinedTransform}
            />
          )}
          <path {...commonProps} d={s.d} />
        </g>
      );
    }

    if (s.line) {
      const [x1, y1, x2, y2] = s.line;
      const curX2 = isDrawing ? x1 + (x2 - x1) * strokeP : x2;
      const curY2 = isDrawing ? y1 + (y2 - y1) * strokeP : y2;
      return (
        <line
          key={idx}
          {...commonProps}
          strokeDasharray={dash}
          strokeDashoffset={undefined}
          x1={x1}
          y1={y1}
          x2={curX2}
          y2={curY2}
        />
      );
    }

    if (s.circle) {
      const [cx, cy, r] = s.circle;
      return (
        <g key={idx}>
          {s.fill && s.fill !== 'none' && drawFillMult > 0.005 && (
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={palette.background}
              stroke="none"
              opacity={drawFillMult}
              transform={combinedTransform}
            />
          )}
          <circle {...commonProps} cx={cx} cy={cy} r={r} />
        </g>
      );
    }

    if (s.rect) {
      const [x, y, width, height, rx] = s.rect;
      return (
        <g key={idx}>
          {needsOpaqueBacking && drawFillMult > 0.005 && (
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              rx={rx ?? 0}
              fill={palette.background}
              stroke="none"
              opacity={drawFillMult}
              transform={combinedTransform}
            />
          )}
          <rect
            {...commonProps}
            x={x}
            y={y}
            width={width}
            height={height}
            rx={rx ?? 0}
          />
        </g>
      );
    }

    if (s.ellipse) {
      const [cx, cy, rx, ry] = s.ellipse;
      return (
        <g key={idx}>
          {needsOpaqueBacking && drawFillMult > 0.005 && (
            <ellipse
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              fill={palette.background}
              stroke="none"
              opacity={drawFillMult}
              transform={combinedTransform}
            />
          )}
          <ellipse {...commonProps} cx={cx} cy={cy} rx={rx} ry={ry} />
        </g>
      );
    }

    return null;
  });
}

export const StagePropRenderer: React.FC<{
  propState: EvaluatedPropState;
  palette: ThemePalette;
  strokeWidth: number;
  frame: number;
  durationInFramesOverride?: number;
  isAfterPivot: boolean;
  customPropsMap?: Record<string, CustomPropDefinition>;
  flipX?: boolean;
}> = ({
  propState,
  palette,
  strokeWidth,
  frame,
  durationInFramesOverride,
  isAfterPivot,
  customPropsMap,
  flipX = false,
}) => {
  let durationInFrames = durationInFramesOverride ?? 900;
  if (durationInFramesOverride === undefined) {
    try {
      const cfg = useVideoConfig();
      durationInFrames = cfg.durationInFrames;
    } catch {
      durationInFrames = 900;
    }
  }
  if (propState.opacity <= 0.01) return null;

  const isFar = propState.layer === 'far';
  const focusStrokeMult =
    propState.focusRole === 'hero'
      ? 1.1
      : propState.focusRole === 'support'
        ? 0.82
        : propState.focusRole === 'ambient'
          ? 0.78
          : isFar
            ? 0.75
            : 1.0;

  const baseFineStroke = PROP_FINE_STROKE * (strokeWidth / INK_BASE_STROKE_WIDTH) * focusStrokeMult;
  const effectiveStrokeWidth =
    baseFineStroke / Math.pow(Math.max(0.5, propState.scale), INK_SCALE_POWER);

  const isDarkPropTheme = isDarkThemePalette(palette.id);
  const layerOpacity =
    propState.focusRole === 'ambient'
      ? Math.min(isDarkPropTheme ? 0.56 : 0.48, propState.opacity)
      : propState.focusRole === 'support' || isFar
        ? Math.min(isDarkPropTheme ? 0.64 : 0.52, propState.opacity)
        : Math.min(1, propState.opacity);

  const catalogDef =
    customPropsMap?.[propState.type] ??
    BUILT_IN_PROP_CATALOG[propState.type] ??
    (customPropsMap && PROP_TYPE_ALIASES[propState.type]
      ? customPropsMap[PROP_TYPE_ALIASES[propState.type]] ??
        BUILT_IN_PROP_CATALOG[PROP_TYPE_ALIASES[propState.type]]
      : undefined);

  const activeVariantName = propState.variant ?? propState.spec.variant;
  const activeVariant =
    activeVariantName && catalogDef?.variants
      ? catalogDef.variants[activeVariantName]
      : undefined;

  const primaryShapes =
    propState.spec.shapes ?? activeVariant?.shapes ?? catalogDef?.shapes ?? [];
  const altShapes =
    propState.spec.altShapes ?? activeVariant?.altShapes ?? catalogDef?.altShapes;

  const hasMorph = Boolean(altShapes && altShapes.length > 0);
  const morphP = hasMorph
    ? Math.max(0, Math.min(1, propState.morphProgress))
    : 0;

  const { emitters } = propState;

  const veilScaleX =
    flipX ||
    (propState.type === 'bridal_veil' &&
      propState.attachedActorFacing === 'left')
      ? -1
      : 1;

  const [ox, oy] =
    propState.spec.emitterOffset ?? catalogDef?.emitterOffset ?? [0, -18];
  const [px, py] =
    propState.spec.tiltPivot ?? catalogDef?.tiltPivot ?? [0, 0];

  const rad = (propState.rotate * Math.PI) / 180;
  const cosR = Math.cos(rad);
  const sinR = Math.sin(rad);

  const localOx = px + (ox - px) * cosR - (oy - py) * sinR;
  const localOy = py + (ox - px) * sinR + (oy - py) * cosR;
  const rx = localOx * propState.scale * veilScaleX;
  const ry = localOy * propState.scale;

  const spillDir = propState.rotate < -1 ? -1 : 1;
  const spillCx = rx + spillDir * (2.0 + emitters.spill * 5.8) * propState.scale;
  const spillCy = ry + 5.4 * propState.scale;
  const spillRx = 9.8 * emitters.spill * propState.scale;
  const spillRy = 1.25 * emitters.spill * propState.scale;

  const steamScale = Math.min(2.2, Math.max(0.9, propState.scale * 0.78));
  const safeDur = Math.max(30, durationInFrames || 900);
  const steamCycles = Math.max(2, Math.round((safeDur / 60) * 0.25));
  const steamPhase =
    ((frame % safeDur) / safeDur) * Math.PI * 2 * steamCycles;
  const sDrift1 = Math.sin(steamPhase) * 1.8 * steamScale;
  const sDrift2 = Math.cos(steamPhase + 1.05) * 1.6 * steamScale;
  const steamBaseX = rx + (spillCx - rx) * 0.42 * emitters.spill;
  const steamBaseY =
    ry +
    (spillCy - ry) * 0.55 * emitters.spill -
    3.6 * (1 - emitters.spill * 0.65) * propState.scale;

  const pivotWorldX = px * propState.scale * veilScaleX;
  const pivotWorldY = py * propState.scale;

  return (
    <g
      transform={`translate(${propState.x.toFixed(2)}, ${propState.y.toFixed(2)})`}
      opacity={layerOpacity}
    >
      {emitters.glow > 0.01 && (
        <circle
          cx={rx * 0.65}
          cy={ry * 0.65}
          r={18 * propState.scale}
          fill={emitters.color}
          opacity={emitters.glow * 0.16}
        />
      )}

      {emitters.spill > 0.01 && (
        <g opacity={emitters.spill}>
          <ellipse
            cx={spillCx}
            cy={spillCy}
            rx={spillRx}
            ry={spillRy}
            fill={emitters.color}
            fillOpacity={0.26}
            stroke={emitters.color}
            strokeWidth={baseFineStroke * 0.58}
            strokeOpacity={0.58}
          />
        </g>
      )}

      <g
        transform={`rotate(${propState.rotate.toFixed(2)}, ${pivotWorldX.toFixed(2)}, ${pivotWorldY.toFixed(2)}) scale(${(propState.scale * veilScaleX).toFixed(3)}, ${propState.scale.toFixed(3)})`}
      >
        {morphP < 0.999 && (
          <g opacity={1 - morphP}>
            {renderShapeListStatic(
              primaryShapes,
              propState,
              palette,
              effectiveStrokeWidth,
              isAfterPivot
            )}
          </g>
        )}
        {hasMorph && morphP > 0.001 && altShapes && (
          <g opacity={morphP}>
            {renderShapeListStatic(
              altShapes,
              propState,
              palette,
              effectiveStrokeWidth,
              isAfterPivot
            )}
          </g>
        )}
      </g>

      {emitters.steam > 0.01 && (
        <g opacity={emitters.steam * 0.78}>
          <path
            d={`M ${(steamBaseX - 1.6 * steamScale).toFixed(1)} ${steamBaseY.toFixed(1)} C ${(steamBaseX - 4.2 * steamScale + sDrift1).toFixed(1)} ${(steamBaseY - 5.2 * steamScale).toFixed(1)} ${(steamBaseX + 2.0 * steamScale - sDrift1).toFixed(1)} ${(steamBaseY - 10.4 * steamScale).toFixed(1)} ${(steamBaseX - 0.8 * steamScale + sDrift1 * 0.5).toFixed(1)} ${(steamBaseY - 15.6 * steamScale).toFixed(1)}`}
            fill="none"
            stroke={emitters.steamColor}
            strokeWidth={baseFineStroke * 0.55}
            strokeLinecap="round"
          />
          <path
            d={`M ${(steamBaseX + 1.8 * steamScale).toFixed(1)} ${(steamBaseY - 2.0 * steamScale).toFixed(1)} C ${(steamBaseX + 4.4 * steamScale + sDrift2).toFixed(1)} ${(steamBaseY - 7.0 * steamScale).toFixed(1)} ${(steamBaseX - 1.5 * steamScale - sDrift2).toFixed(1)} ${(steamBaseY - 12.0 * steamScale).toFixed(1)} ${(steamBaseX + 1.4 * steamScale + sDrift2 * 0.5).toFixed(1)} ${(steamBaseY - 17.0 * steamScale).toFixed(1)}`}
            fill="none"
            stroke={emitters.steamColor}
            strokeWidth={baseFineStroke * 0.48}
            strokeLinecap="round"
            opacity={0.68}
          />
        </g>
      )}

      {emitters.pulseRing > 0.01 && (
        <NotificationRings
          x={rx}
          y={ry}
          frame={frame}
          color={emitters.color}
          opacity={emitters.pulseRing * 0.75}
          maxRadius={18 * Math.min(1.6, Math.max(1, propState.scale * 0.75))}
        />
      )}
    </g>
  );
};
