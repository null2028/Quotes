import React from 'react';
import { evolvePath } from '@remotion/paths';
import { ThemePalette } from '../theme/palettes';
import { RisingSteam, NotificationRings } from '../kit/Atmosphere';
import {
  CustomPropDefinition,
  InlineShape,
} from './stageScriptSchema';
import { EvaluatedPropState, resolveRoleColor } from './trackCompiler';

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
] as const;

export type BuiltInPropName = (typeof BUILT_IN_PROP_NAMES)[number];

/**
 * Kho 25 (+1) Đạo Cụ Tối Giản Dựng Sẵn chuẩn DNA Trà Nguội.
 * - Đạo cụ mặt đất: (0, 0) là đáy tiếp đất, vẽ âm lên trên (y < 0).
 * - Đạo cụ cầm tay / gắn đầu / bay: (0, 0) là tâm gắn kết.
 */
export const BUILT_IN_PROP_CATALOG: Record<string, CustomPropDefinition> = {
  // 1. Cánh thư giấy uốn cong mềm mại trong gió + nếp gấp thanh mảnh & dấu triện tròn nhỏ
  envelope: {
    anchorType: 'hand',
    emitterOffset: [0, -0.8],
    shapes: [
      {
        d: 'M -10.5 -6.2 Q 0 -7.6 10.5 -5.4 Q 9.8 0 10.8 5.8 Q 0 4.6 -10.4 6.2 Q -11.2 0 -10.5 -6.2 Z',
        fill: 'bg',
        fillOpacity: 0.12,
      },
      {
        d: 'M -10.1 -5.8 Q 0 2.2 10.1 -5.1',
        fill: 'none',
        strokeScale: 0.78,
      },
      {
        d: 'M -6.8 3.5 Q -1.5 1.2 4.2 3.0',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.55,
        opacity: 0.55,
      },
      {
        circle: [0, -0.8, 1.55],
        fill: 'accent',
        fillOpacity: 0.28,
        role: 'accent',
        strokeScale: 0.65,
      },
    ],
  },

  // 2. Khăn voan cô dâu: 3 nét cong lụa hở mảnh mai bay mềm xuôi về phía sau lưng + trâm cài nhỏ
  bridal_veil: {
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

  // 3. Tim nét đứt hỗ trợ splitProgress (tách đôi trái/phải, theo màu colorRole)
  dashed_heart: {
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

  // 4. Tim nét liền / mực loang dịu
  solid_heart: {
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

  // 5. Vò rượu gốm cổ Mai Bình / Thiên Cầu thanh tao (cổ thon, vai tròn đầy, dây lụa buộc cổ có 2 dải tua rủ mềm, bóng mực 0.08)
  wine_jar: {
    anchorType: 'ground',
    emitterOffset: [0, -28],
    tiltPivot: [-1.6, -0.5],
    shapes: [
      {
        d: 'M -4.8 -28 L 4.8 -28 L 3.8 -22.5 C 8.8 -19.0 9.0 -8.5 5.2 0 L -5.2 0 C -9.0 -8.5 -8.8 -19.0 -3.8 -22.5 Z',
        fill: 'bg',
        fillOpacity: 0.12,
        role: 'ink',
      },
      {
        d: 'M -3.4 -21.8 C -7.4 -18.0 -7.6 -8.2 -4.2 -1.0 C -5.6 -8.0 -5.4 -16.0 -2.2 -21.0 Z',
        fill: 'ink',
        fillOpacity: 0.08,
        role: 'ink',
        strokeScale: 0,
      },
      {
        d: 'M 3.6 -19.5 C 6.2 -16.5 6.4 -10.2 4.2 -4.5',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.62,
        opacity: 0.52,
      },
      {
        d: 'M -5.6 -28 Q 0 -27.2 5.6 -28',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.95,
      },
      {
        d: 'M -4.1 -22.5 Q 0 -21.6 4.1 -22.5',
        fill: 'none',
        role: 'accent',
        strokeScale: 0.85,
      },
      {
        d: 'M 1.8 -22.2 C 3.6 -19.5 5.0 -16.5 4.2 -13.5',
        fill: 'none',
        role: 'accent',
        strokeScale: 0.62,
      },
      {
        d: 'M 2.6 -22.2 C 5.0 -20.2 6.6 -17.8 6.2 -14.8',
        fill: 'none',
        role: 'accent',
        strokeScale: 0.58,
      },
    ],
  },

  // 6. Chén trà / chén rượu gốm thanh nhã (đáy tại 0,0)
  small_cup: {
    anchorType: 'ground',
    emitterOffset: [0, -6.8],
    tiltPivot: [-1.2, -0.5],
    shapes: [
      {
        d: 'M -5.2 -6.5 Q -4.5 -1.4 -2.8 0 L 2.8 0 Q 4.5 -1.4 5.2 -6.5 Q 0 -5.6 -5.2 -6.5 Z',
        fill: 'bg',
        fillOpacity: 0.13,
        role: 'ink',
      },
      {
        d: 'M -3.8 -5.2 Q -3.2 -1.8 -1.8 -0.6',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.55,
        opacity: 0.5,
      },
      {
        d: 'M -5.2 -6.5 Q 0 -7.3 5.2 -6.5',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.72,
        opacity: 0.65,
      },
    ],
  },

  // 7. Bát cơm gốm thủ công + đôi đũa tre vuốt thon (đáy tại 0,0)
  rice_bowl: {
    anchorType: 'ground',
    emitterOffset: [0, -14.5],
    tiltPivot: [-2.0, -0.8],
    shapes: [
      {
        d: 'M -14.2 -13.5 C -13.8 -5.0 -8.6 -1.2 -5.0 0 Q 0 0.8 5.0 0 C 8.6 -1.2 13.8 -5.0 14.2 -13.5 Q 0 -12.0 -14.2 -13.5 Z',
        fill: 'bg',
        fillOpacity: 0.13,
        role: 'ink',
      },
      {
        d: 'M -11.5 -11.8 C -10.8 -5.5 -6.8 -2.0 -3.8 -0.8 C -6.0 -3.2 -8.2 -6.8 -9.2 -11.5 Z',
        fill: 'ink',
        fillOpacity: 0.08,
        role: 'ink',
        strokeScale: 0,
      },
      {
        d: 'M -14.2 -13.5 Q 0 -15.0 14.2 -13.5',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.65,
        opacity: 0.58,
      },
      {
        d: 'M 9.8 -10.5 C 9.2 -6.2 6.4 -3.2 3.5 -1.8',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.55,
        opacity: 0.5,
      },
      {
        d: 'M -10.5 -15.8 C -1.5 -18.2 7.5 -20.6 16.2 -22.8',
        fill: 'none',
        role: 'accent',
        strokeScale: 0.82,
      },
      {
        d: 'M -10.2 -13.8 C -1.2 -15.4 7.8 -17.0 16.5 -18.4',
        fill: 'none',
        role: 'accent',
        strokeScale: 0.78,
      },
    ],
  },

  // 8. Chiếc cốc thủy tinh/gốm cao + ống hút cong & 3 hạt trân châu mực loang (đáy tại 0,0)
  tall_cup: {
    anchorType: 'ground',
    emitterOffset: [0, -26.5],
    tiltPivot: [-1.8, -0.8],
    shapes: [
      {
        d: 'M -9.2 -25.8 C -8.4 -16.5 -7.3 -7.2 -6.4 0 Q 0 1.0 6.4 0 C 7.3 -7.2 8.4 -16.5 9.2 -25.8 Q 0 -24.4 -9.2 -25.8 Z',
        fill: 'bg',
        fillOpacity: 0.12,
        role: 'ink',
      },
      {
        d: 'M -7.4 -23.5 C -6.8 -15.2 -6.0 -7.0 -5.0 -1.2 C -5.8 -7.5 -6.2 -15.5 -6.2 -23.2 Z',
        fill: 'ink',
        fillOpacity: 0.07,
        role: 'ink',
        strokeScale: 0,
      },
      {
        d: 'M -9.2 -25.8 Q 0 -27.2 9.2 -25.8',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.68,
        opacity: 0.62,
      },
      {
        d: 'M -7.8 -17.5 Q -1.5 -16.2 7.8 -17.8',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.55,
        opacity: 0.5,
      },
      {
        d: 'M 1.6 -14.5 C 3.4 -23.5 5.0 -31.5 6.4 -35.8 Q 8.2 -37.2 11.2 -36.4',
        fill: 'none',
        role: 'accent',
        strokeScale: 0.85,
      },
      {
        circle: [-2.8, -4.8, 1.65],
        fill: 'accent',
        fillOpacity: 0.25,
        role: 'accent',
        strokeScale: 0.65,
      },
      {
        circle: [1.6, -4.2, 1.65],
        fill: 'accent',
        fillOpacity: 0.25,
        role: 'accent',
        strokeScale: 0.65,
      },
      {
        circle: [3.6, -8.2, 1.55],
        fill: 'accent',
        fillOpacity: 0.22,
        role: 'accent',
        strokeScale: 0.62,
      },
    ],
  },

  // 9. Tảng đá cuội / Thái Hồ thạch bất đối xứng kiểu thủy mặc (đáy tại 0,0)
  boulder: {
    anchorType: 'ground',
    emitterOffset: [0, -35],
    shapes: [
      {
        d: 'M -21.5 -3.5 C -25.5 -19.5 -15.5 -36.5 1.5 -37.5 C 16.5 -38.2 25.2 -21.5 21.5 -3.5 C 18.5 0.5 -18.5 0.5 -21.5 -3.5 Z',
        fill: 'bg',
        fillOpacity: 0.14,
        role: 'ink',
      },
      {
        d: 'M -19.2 -4.2 C -22.0 -17.5 -14.0 -31.5 -1.5 -34.5 C -10.5 -28.5 -15.5 -16.5 -14.2 -3.8 Z',
        fill: 'ink',
        fillOpacity: 0.08,
        role: 'ink',
        strokeScale: 0,
      },
      {
        d: 'M -10.5 -25.5 C -5.5 -20.5 -2.2 -17.8 6.5 -21.5',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.62,
        opacity: 0.54,
      },
      {
        d: 'M 4.5 -13.5 C 9.5 -11.5 14.2 -13.8 16.5 -17.5',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.55,
        opacity: 0.48,
      },
    ],
  },

  // 10. Chồng sách cổ / hộp giấy thủ công buộc dây lụa (đáy tại 0,0)
  box_stack: {
    anchorType: 'ground',
    emitterOffset: [0, -38],
    shapes: [
      {
        d: 'M -15.8 -13.5 Q 0 -14.2 15.8 -13.5 Q 16.4 -6.8 15.8 0 Q 0 0.5 -15.8 0 Q -16.4 -6.8 -15.8 -13.5 Z',
        fill: 'bg',
        fillOpacity: 0.13,
        role: 'ink',
      },
      {
        d: 'M -13.6 -26.2 Q 0 -26.8 13.6 -26.2 Q 14.2 -19.8 13.6 -13.5 Q 0 -13.0 -13.6 -13.5 Q -14.2 -19.8 -13.6 -26.2 Z',
        fill: 'bg',
        fillOpacity: 0.12,
        role: 'ink',
      },
      {
        d: 'M -10.8 -37.2 Q 0 -37.8 10.8 -37.2 Q 11.4 -31.8 10.8 -26.2 Q 0 -25.8 -10.8 -26.2 Q -11.4 -31.8 -10.8 -37.2 Z',
        fill: 'bg',
        fillOpacity: 0.11,
        role: 'ink',
      },
      {
        d: 'M -11.5 -6.8 Q 0 -6.2 11.5 -6.8',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.55,
        opacity: 0.48,
      },
      {
        d: 'M -9.5 -19.8 Q 0 -19.2 9.5 -19.8',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.55,
        opacity: 0.48,
      },
      {
        d: 'M 2.5 -26.2 C 3.8 -22.5 5.2 -19.5 4.2 -16.2',
        fill: 'none',
        role: 'accent',
        strokeScale: 0.68,
      },
    ],
  },

  // 11. Chiếc ô giấy dầu phương Đông (hỗ trợ morphProgress từ cụp sang xòe)
  umbrella: {
    anchorType: 'hand',
    emitterOffset: [0, -28],
    shapes: [
      // Trạng thái cụp
      {
        d: 'M 0 -28 C 0.2 -15 0.2 -2 0 10 Q -3.8 14.8 -6.8 10.8',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.9,
      },
      {
        d: 'M 0 -28 C -2.8 -19 -4.8 -11 -5.2 -5.5 Q 0 -4.2 5.2 -5.5 C 4.8 -11 2.8 -19 0 -28 Z',
        fill: 'bg',
        fillOpacity: 0.13,
        role: 'ink',
      },
      {
        d: 'M -0.4 -24 C -1.6 -16 -2.2 -10 -2.0 -5.5',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.55,
        opacity: 0.52,
      },
    ],
    altShapes: [
      // Trạng thái xòe rộng màu Đỏ Gạch mực loang
      {
        d: 'M 0 -24 C 0.2 -12 0.2 0 0 12 Q -3.8 16.2 -6.8 12.0',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.9,
      },
      {
        d: 'M -24 -9.5 C -16 -26 -6 -32 0 -32 C 6 -32 16 -26 24 -9.5 Q 16 -13.2 8 -10.0 Q 0 -13.5 -8 -10.0 Q -16 -13.2 -24 -9.5 Z',
        fill: 'accent',
        fillOpacity: 0.2,
        role: 'accent',
      },
      {
        d: 'M 0 -31.5 C -4 -23 -7 -16 -8 -10.0',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.55,
        opacity: 0.52,
      },
      {
        d: 'M 0 -31.5 C 4 -23 7 -16 8 -10.0',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.55,
        opacity: 0.52,
      },
    ],
  },

  // 12. Ghế gỗ công viên nét vẽ tay mềm mại (đáy tại 0,0)
  bench: {
    anchorType: 'ground',
    emitterOffset: [0, -23],
    shapes: [
      {
        d: 'M -23.5 -23.2 Q 0 -24.2 23.5 -23.2 Q 24.2 -18.5 23.5 -15.5 Q 0 -16.2 -23.5 -15.5 Q -24.2 -18.5 -23.5 -23.2 Z',
        fill: 'bg',
        fillOpacity: 0.11,
        role: 'ink',
      },
      {
        d: 'M -26.0 -12.0 Q 0 -12.8 26.0 -12.0 Q 25.0 -9.5 23.5 -9.5 Q 0 -10.2 -23.5 -9.5 Q -25.0 -9.5 -26.0 -12.0 Z',
        fill: 'bg',
        fillOpacity: 0.13,
        role: 'ink',
      },
      {
        d: 'M -18.5 -19.5 Q 0 -20.2 18.5 -19.5',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.55,
        opacity: 0.5,
      },
      {
        d: 'M -19.2 -23.0 C -18.8 -14.0 -19.0 -6.0 -19.8 0',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.92,
      },
      {
        d: 'M 19.2 -23.0 C 18.8 -14.0 19.0 -6.0 19.8 0',
        fill: 'none',
        role: 'ink',
        strokeScale: 0.92,
      },
      {
        d: 'M -23.5 -17.5 Q -25.8 -14.5 -23.5 -11.5',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.62,
        opacity: 0.55,
      },
      {
        d: 'M 23.5 -17.5 Q 25.8 -14.5 23.5 -11.5',
        fill: 'none',
        role: 'secondary',
        strokeScale: 0.62,
        opacity: 0.55,
      },
    ],
  },

  // 13. Đèn đường cổ điển ấm áp (đáy tại 0,0)
  street_lamp: {
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

  // 14. Mái nhà quê hiên cong có ống khói & ô cửa sổ sáng (đáy tại 0,0)
  warm_house: {
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

  // 15. Bóng phố thị sương mờ phía xa (đáy tại 0,0)
  city_skyline: {
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

  // 16. Thuyền gỗ nhỏ mũi cong đỗ bến sông (đáy tại 0,0)
  small_boat: {
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

  // 17. Cánh diều giấy no gió có đuôi lụa (tâm 0,0)
  kite: {
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

  // 18. Máy bay giấy gấp tay mềm mại (tâm 0,0)
  paper_plane: {
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

  // 19. Nhành cây mùa đông vươn nghiêng bất đối xứng kiểu thủy mặc (morph nhú búp hoa/lá nhỏ Đỏ Gạch)
  bare_tree: {
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
    altShapes: [
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
      {
        circle: [-34.0, -51.0, 2.0],
        fill: 'accent',
        fillOpacity: 0.35,
        role: 'accent',
        strokeScale: 0.72,
      },
      {
        circle: [17.5, -82.0, 2.1],
        fill: 'accent',
        fillOpacity: 0.35,
        role: 'accent',
        strokeScale: 0.72,
      },
      {
        circle: [28.0, -72.5, 1.8],
        fill: 'accent',
        fillOpacity: 0.32,
        role: 'accent',
        strokeScale: 0.68,
      },
    ],
  },

  // 20. Mầm cây non uốn cong mềm mại (đáy tại 0,0)
  sprout: {
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

  // 21. Đốm lửa trại củi khô & ngọn lửa 2 tầng (đáy tại 0,0)
  campfire: {
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

  // 22. Đèn lồng lụa phương Đông có nan tre & tua rua (tâm treo 0,0)
  lantern: {
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

  // 23. Thanh bập bênh gỗ trên trụ đá bo tròn (đáy tại 0,0)
  seesaw: {
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

  // 24. Đồng hồ cát thủy tinh thổi thủ công & khung gỗ (đáy tại 0,0)
  hourglass: {
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

  // 25. Khung suy tưởng / tin nhắn vẽ tay + 3 chấm mực loang (tâm 0,0)
  chat_bubble: {
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

  // Bonus: Làn mây thủy mặc phương Đông 2 nét lượn sóng hở đáy thanh mảnh (tâm 0,0)
  cloud_wisp: {
    anchorType: 'center',
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
};

function renderShapeList(
  shapes: InlineShape[],
  propState: EvaluatedPropState,
  palette: ThemePalette,
  baseStrokeWidth: number,
  isAfterPivot: boolean
): React.ReactNode {
  const allowAccent = isAfterPivot && propState.isAccentActive;

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
            ? palette.accent
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
              ? palette.accent
              : strokeColor
            : s.fill === 'secondary'
              ? palette.inkSecondary
              : palette.inkPrimary;

    const resolvedFillOpacity =
      !s.fill || s.fill === 'none' || isNegativeCarve
        ? 0
        : s.fillOpacity !== undefined
          ? s.fillOpacity
          : isWashClosed
            ? 0.12
            : s.fill === 'accent' && allowAccent
              ? 0.24
              : 0.14;

    const sw =
      s.strokeScale === 0 ? 0 : baseStrokeWidth * (s.strokeScale ?? 1);
    const dash = s.dashed ? '4.0 4.0' : undefined;
    const shapeOpacity = s.opacity ?? 1;

    // Xử lý splitProgress (tách 2 nửa trái/phải bay tản và mờ dần)
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

    const commonProps = {
      fill: rawFillColor,
      fillOpacity: resolvedFillOpacity,
      stroke: sw > 0 ? strokeColor : 'none',
      strokeWidth: sw,
      strokeOpacity: 0.88,
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
      strokeDasharray: dash,
      opacity: shapeOpacity * splitOpacityMult,
      transform: splitTransform,
    };

    const needsOpaqueBacking = isWashClosed || resolvedFillOpacity >= 0.85;

    if (s.d) {
      if (propState.drawProgress < 0.999 && !s.dashed) {
        const evo = evolvePath(
          Math.max(0.001, propState.drawProgress),
          s.d
        );
        return (
          <g key={idx}>
            {needsOpaqueBacking && (
              <path
                d={s.d}
                fill={palette.background}
                stroke="none"
                transform={splitTransform}
              />
            )}
            <path
              {...commonProps}
              d={s.d}
              strokeDasharray={evo.strokeDasharray}
              strokeDashoffset={evo.strokeDashoffset}
            />
          </g>
        );
      }
      return (
        <g key={idx}>
          {needsOpaqueBacking && (
            <path
              d={s.d}
              fill={palette.background}
              stroke="none"
              transform={splitTransform}
            />
          )}
          <path {...commonProps} d={s.d} />
        </g>
      );
    }

    if (s.line) {
      const [x1, y1, x2, y2] = s.line;
      return <line key={idx} {...commonProps} x1={x1} y1={y1} x2={x2} y2={y2} />;
    }

    if (s.circle) {
      const [cx, cy, r] = s.circle;
      return (
        <g key={idx}>
          {s.fill && s.fill !== 'none' && (
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={palette.background}
              stroke="none"
              transform={splitTransform}
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
          {needsOpaqueBacking && (
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              rx={rx ?? 0}
              fill={palette.background}
              stroke="none"
              transform={splitTransform}
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
          {needsOpaqueBacking && (
            <ellipse
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              fill={palette.background}
              stroke="none"
              transform={splitTransform}
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
  isAfterPivot: boolean;
  customPropsMap?: Record<string, CustomPropDefinition>;
}> = ({
  propState,
  palette,
  strokeWidth,
  frame,
  isAfterPivot,
  customPropsMap,
}) => {
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

  // Bù độ dày nét khi phóng lớn chủ thể (Hero Scale 2.2x-3.0x vẫn giữ nét mảnh 1.35px tinh xảo)
  const baseFineStroke = 1.35 * (strokeWidth / 2.6) * focusStrokeMult;
  const effectiveStrokeWidth =
    baseFineStroke / Math.pow(Math.max(0.5, propState.scale), 0.78);

  const layerOpacity =
    propState.focusRole === 'ambient'
      ? Math.min(0.48, propState.opacity)
      : propState.focusRole === 'support' || isFar
        ? Math.min(0.52, propState.opacity)
        : Math.min(1, propState.opacity);

  // Tìm định nghĩa shapes & altShapes: ưu tiên inline trên prop -> customPropsMap -> BUILT_IN_PROP_CATALOG
  const catalogDef =
    customPropsMap?.[propState.type] ?? BUILT_IN_PROP_CATALOG[propState.type];
  const primaryShapes = propState.spec.shapes ?? catalogDef?.shapes ?? [];
  const altShapes = propState.spec.altShapes ?? catalogDef?.altShapes;

  const hasMorph = Boolean(altShapes && altShapes.length > 0);
  const morphP = hasMorph
    ? Math.max(0, Math.min(1, propState.morphProgress))
    : 0;

  const { emitters } = propState;

  // Khăn voan cô dâu tự động bay xuôi về phía sau lưng đối diện hướng facing của nhân vật
  const veilScaleX =
    propState.type === 'bridal_veil' &&
    propState.attachedActorFacing === 'left'
      ? -1
      : 1;

  // Cơ chế ổ cắm tổng quát cho MỌI Prop: tính vị trí Thế Giới (rx, ry) của emitterOffset sau khi nhân scale và xoay góc propState.rotate quanh tiltPivot
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

  // Vệt tràn (spill) luôn nằm ngang song song mặt đất ngay dưới miệng đạo cụ (rx, ry)
  const spillDir = propState.rotate < -1 ? -1 : 1;
  const spillCx = rx + spillDir * (2.0 + emitters.spill * 5.8) * propState.scale;
  const spillCy = ry + 5.4 * propState.scale;
  const spillRx = 9.8 * emitters.spill * propState.scale;
  const spillRy = 1.25 * emitters.spill * propState.scale;

  // Làn khói/hương (steam) luôn bay thẳng đứng hướng lên trời từ đúng miệng đạo cụ (hoặc từ vệt rượu loang sát miệng khi nghiêng đổ)
  const steamScale = Math.min(2.2, Math.max(0.9, propState.scale * 0.78));
  const steamPhase = (frame / 60) * 0.35 * Math.PI * 1.35;
  const sDrift1 = Math.sin(steamPhase) * 1.8 * steamScale;
  const sDrift2 = Math.cos(steamPhase * 0.9) * 1.6 * steamScale;
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
      {/* 1. Emitter: Glow (quầng sáng ấm phía sau tâm/miệng đạo cụ) */}
      {emitters.glow > 0.01 && (
        <circle
          cx={rx * 0.65}
          cy={ry * 0.65}
          r={18 * propState.scale}
          fill={emitters.color}
          opacity={emitters.glow * 0.16}
        />
      )}

      {/* 2. Emitter: Spill (vệt mực nước dẹt nằm ngang song song mặt đất ngay dưới miệng đạo cụ, tách ngoài <g rotate>) */}
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

      {/* 3. Hình dáng chính của Prop (xoay quanh tiltPivot và nhân scale) */}
      <g
        transform={`rotate(${propState.rotate.toFixed(2)}, ${pivotWorldX.toFixed(2)}, ${pivotWorldY.toFixed(2)}) scale(${(propState.scale * veilScaleX).toFixed(3)}, ${propState.scale.toFixed(3)})`}
      >
        {morphP < 0.999 && (
          <g opacity={1 - morphP}>
            {renderShapeList(
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
            {renderShapeList(
              altShapes,
              propState,
              palette,
              effectiveStrokeWidth,
              isAfterPivot
            )}
          </g>
        )}
      </g>

      {/* 4. Emitter: Steam (2 đường cong chữ S mảnh luôn bay thẳng đứng hướng lên trời từ đúng miệng đạo cụ, tách ngoài <g rotate>) */}
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

      {/* 5. Emitter: PulseRing (vòng sóng tròn mảnh lan tỏa từ đúng ổ cắm emitterOffset) */}
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
