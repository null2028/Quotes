/**
 * Họ Đạo Cụ 2 — `mat_phang` (Bàn, giường, gối, tủ kính)
 *
 * Quy tắc:
 * - Một hàm dựng có tham số duy nhất `buildMatPhangProp` lắp ghép từ `primitives.ts` và hàm đường cong có tham số (cấm SVG tự do).
 * - Nhìn ngang chính diện, không phối cảnh 3D.
 * - Nét mảnh chuẩn T2, mỗi vật tối đa 1–2 nét chi tiết bên trong, lớp wash nền giấy nhạt (`fill: 'bg'`), bản đỏ đồng dạng 100%.
 * - Preset đã `duyet` sẵn (`std_work_desk`, `low_tea_table`) KHÔNG vẽ lại, chỉ gắn bằng alias (`ban_lam_viec`, `ban_tra`).
 */
import type { AnchorKind, PropCatalogStatus, SemanticLayer } from '../stageConstants';
import type {
  CustomPropDefinition,
  InlineShape,
  PropDescription5,
} from '../stageScriptSchema';
import {
  buildRedCloneShapes,
  computeTightCatalogBox,
  FAMILY_BODY_STROKE_SCALE,
  FAMILY_DETAIL_STROKE_SCALE,
  FAMILY_LARGE_BODY_STROKE_SCALE,
  FAMILY_WASH_OPACITY,
  lineShape,
  washRectShape,
} from './primitives';

const f2 = (n: number): string => Number(n.toFixed(2)).toString();

/**
 * Hàm đường cong có tham số cho gối vải bo mềm đặt phẳng trên mặt giường/đất (`y = 0`).
 */
function parametricPillowBody(
  width: number,
  height: number,
  pinchRatio: number,
  strokeScale: number,
  fillOpacity: number
): InlineShape {
  const hw = width / 2;
  const endY = -height * Math.max(0.28, Math.min(0.62, 0.45 - pinchRatio * 0.25));
  const topY = -height;
  const ctrlX = hw * 0.62;
  const sideCtrlX = hw * (1.03 - pinchRatio * 0.12);
  const d = [
    `M ${f2(-hw)} ${f2(endY)}`,
    `C ${f2(-sideCtrlX)} ${f2(topY * 0.92)} ${f2(-ctrlX)} ${f2(topY)} 0 ${f2(topY)}`,
    `C ${f2(ctrlX)} ${f2(topY)} ${f2(sideCtrlX)} ${f2(topY * 0.92)} ${f2(hw)} ${f2(endY)}`,
    `C ${f2(sideCtrlX)} ${f2(-height * 0.08)} ${f2(ctrlX)} 0 0 0`,
    `C ${f2(-ctrlX)} 0 ${f2(-sideCtrlX)} ${f2(-height * 0.08)} ${f2(-hw)} ${f2(endY)}`,
    'Z',
  ].join(' ');
  return {
    d,
    fill: 'bg',
    fillOpacity,
    role: 'ink',
    strokeScale,
  };
}

/**
 * Nét gấp mềm bên trong thân gối vải (tối đa 1 nét mảnh phụ).
 */
function parametricPillowCrease(width: number, height: number): InlineShape {
  const x0 = -width * 0.28;
  const x1 = width * 0.26;
  const y0 = -height * 0.56;
  const yMid = -height * 0.44;
  return {
    d: `M ${f2(x0)} ${f2(y0)} Q 0 ${f2(yMid)} ${f2(x1)} ${f2(y0 + 0.15)}`,
    fill: 'none',
    role: 'secondary',
    strokeScale: FAMILY_DETAIL_STROKE_SCALE,
    opacity: 0.68,
  };
}

export interface MatPhangParams {
  status?: PropCatalogStatus;
  labelVi: string;
  kichThuocThatCm: number;
  description5: PropDescription5;
  defaultLayer?: SemanticLayer;
  anchorKind?: AnchorKind;
  allowedAnchorKinds?: AnchorKind[];
  anchors?: Record<string, [number, number]>;
  canBeRed: boolean;
  bodyStrokeScale?: number;
  fillOpacity?: number;

  // Tham số hình học đặc trưng họ `mat_phang` (theo HO-DAO-CU.md)
  rong: number;
  cao: number;
  dayMat?: number;
  kieu_chan: 'chan_thang' | 'chan_choai' | 'chan_quy' | 'khoi_hop' | 'khong';
  thanh_dau: 'khong' | 'dau_giuong' | 'vach_kinh';
  so_ngan: 0 | 1 | 2;
  phu_kien_mat: 'khong' | 'nem_goi' | 'goi_roi';
  caoDauGiuong?: number;
  caoChanGiuong?: number;
  doThutChan?: number;
}

/**
 * Hàm dựng có tham số duy nhất cho toàn bộ preset mới của họ `mat_phang`.
 */
export function buildMatPhangProp(params: MatPhangParams): CustomPropDefinition {
  const shapes: InlineShape[] = [];
  const bodyStroke = params.bodyStrokeScale ?? FAMILY_LARGE_BODY_STROKE_SCALE;
  const washOpacity = params.fillOpacity ?? FAMILY_WASH_OPACITY;
  const w = params.rong;
  const hw = w / 2;
  const h = params.cao;

  if (params.phu_kien_mat === 'goi_roi') {
    shapes.push(
      parametricPillowBody(
        w,
        h,
        0.22,
        params.bodyStrokeScale ?? FAMILY_BODY_STROKE_SCALE,
        washOpacity
      ),
      parametricPillowCrease(w, h)
    );
  } else if (params.thanh_dau === 'dau_giuong') {
    // Khung giường thấp + vách đầu giường trái + thành chân phải + lớp nệm phẳng
    const headW = 2.6;
    const footW = 2.1;
    const headH = params.caoDauGiuong ?? h + 10.6;
    const footH = params.caoChanGiuong ?? h + 2.2;
    const underClearance = 4.8;
    const railH = 3.4;
    const mattressTopY = -h;
    const railTopY = -(underClearance + railH);
    const mattressH = Math.max(3.6, Math.abs(mattressTopY - railTopY));
    const innerLeft = -hw + headW;
    const innerRight = hw - footW;
    const innerW = innerRight - innerLeft;

    // 1. Nệm phẳng bo góc phía trên khung giường
    if (params.phu_kien_mat === 'nem_goi') {
      shapes.push(
        washRectShape(innerLeft + 0.2, mattressTopY, innerW - 0.4, mattressH, 1.4, {
          strokeScale: bodyStroke * 0.94,
          fillOpacity: washOpacity,
        })
      );
      // 1 nét chỉ nệm ngang mảnh
      shapes.push(
        lineShape(
          innerLeft + 2.2,
          mattressTopY + mattressH * 0.5,
          innerRight - 2.2,
          mattressTopY + mattressH * 0.5,
          {
            role: 'secondary',
            strokeScale: FAMILY_DETAIL_STROKE_SCALE,
            opacity: 0.52,
          }
        )
      );
    }

    // 2. Thanh khung gỗ ngang chịu lực (thoáng gầm dưới)
    shapes.push(
      washRectShape(innerLeft, railTopY, innerW, railH, 0.5, {
        strokeScale: bodyStroke,
        fillOpacity: washOpacity * 1.05,
      })
    );

    // 3. Đầu giường bên trái & chân giường thấp bên phải
    shapes.push(
      washRectShape(-hw, -headH, headW, headH, 0.7, {
        strokeScale: bodyStroke,
        fillOpacity: washOpacity * 1.05,
      }),
      washRectShape(hw - footW, -footH, footW, footH, 0.6, {
        strokeScale: bodyStroke,
        fillOpacity: washOpacity * 1.05,
      })
    );
  } else if (params.thanh_dau === 'vach_kinh') {
    // Khối tủ kính đứng + chân bệ thấp + đợt ngăn ngang + 2 nét phản sáng kính mảnh
    const legH = 2.8;
    const legW = 2.2;
    const cabinetH = h - legH;
    const cabinetTopY = -h;
    const cabinetBottomY = -legH;

    // Chân bệ hộp hai bên
    if (params.kieu_chan === 'khoi_hop') {
      const inset = params.doThutChan ?? 2.0;
      shapes.push(
        washRectShape(-hw + inset, -legH, legW, legH, 0.4, {
          strokeScale: bodyStroke,
          fillOpacity: washOpacity,
        }),
        washRectShape(hw - inset - legW, -legH, legW, legH, 0.4, {
          strokeScale: bodyStroke,
          fillOpacity: washOpacity,
        })
      );
    }

    // Khung tủ kính chính
    shapes.push(
      washRectShape(-hw, cabinetTopY, w, cabinetH, 0.9, {
        strokeScale: bodyStroke,
        fillOpacity: washOpacity * 0.85,
      })
    );

    // Các đợt ngăn ngang bên trong
    if (params.so_ngan > 0) {
      const bayCount = params.so_ngan + 1;
      for (let i = 1; i <= params.so_ngan; i++) {
        const shelfY = cabinetTopY + (cabinetH * i) / bayCount;
        shapes.push(
          lineShape(-hw + 1.0, shelfY, hw - 1.0, shelfY, {
            role: 'ink',
            strokeScale: bodyStroke * 0.78,
            opacity: 0.85,
          })
        );
      }
    }

    // 2 nét chéo mảnh gợi mặt kính ở ngăn trên cùng
    const glassTop = cabinetTopY + 3.0;
    const glassBot = cabinetTopY + 10.2;
    shapes.push(
      lineShape(-hw + 4.4, glassBot, -hw + 9.2, glassTop, {
        role: 'secondary',
        strokeScale: FAMILY_DETAIL_STROKE_SCALE * 0.88,
        opacity: 0.42,
      }),
      lineShape(-hw + 7.2, glassBot, -hw + 11.2, glassTop + 1.2, {
        role: 'secondary',
        strokeScale: FAMILY_DETAIL_STROKE_SCALE * 0.82,
        opacity: 0.34,
      })
    );

    // Nét đáy tủ nhẹ (nếu không phải khối hộp)
    if (params.kieu_chan !== 'khoi_hop') {
      shapes.push(
        lineShape(-hw, cabinetBottomY, hw, cabinetBottomY, {
          role: 'ink',
          strokeScale: bodyStroke,
        })
      );
    }
  } else {
    // Các kiểu bàn: mặt bàn phẳng + kiểu chân + thanh giằng / ngăn hở
    const topThick = params.dayMat ?? 2.1;
    const topY = -h;
    const underTopY = topY + topThick;
    const legInset = params.doThutChan ?? Math.min(4.4, w * 0.15);
    const legTopX = hw - legInset;

    // 1. Mặt bàn phẳng bo góc nhẹ
    shapes.push(
      washRectShape(-hw, topY, w, topThick, 0.75, {
        strokeScale: bodyStroke,
        fillOpacity: washOpacity,
      })
    );

    // 2. Chân bàn theo tham số `kieu_chan`
    if (params.kieu_chan === 'chan_choai') {
      const splay = 1.4;
      shapes.push(
        lineShape(-legTopX, underTopY, -(legTopX + splay), 0, {
          role: 'ink',
          strokeScale: bodyStroke,
        }),
        lineShape(legTopX, underTopY, legTopX + splay, 0, {
          role: 'ink',
          strokeScale: bodyStroke,
        })
      );
      if (params.so_ngan >= 1) {
        const railY = underTopY + 3.4;
        const t = (railY - underTopY) / Math.max(1, -underTopY);
        const railX = legTopX + splay * t;
        shapes.push(
          lineShape(-railX, railY, railX, railY, {
            role: 'secondary',
            strokeScale: FAMILY_DETAIL_STROKE_SCALE,
            opacity: 0.72,
          })
        );
      }
    } else if (params.kieu_chan === 'chan_quy') {
      const kneeY = underTopY * 0.45;
      shapes.push(
        lineShape(-legTopX, underTopY, -legTopX - 1.2, kneeY, {
          role: 'ink',
          strokeScale: bodyStroke,
        }),
        lineShape(-legTopX - 1.2, kneeY, -legTopX + 0.4, 0, {
          role: 'ink',
          strokeScale: bodyStroke,
        }),
        lineShape(legTopX, underTopY, legTopX + 1.2, kneeY, {
          role: 'ink',
          strokeScale: bodyStroke,
        }),
        lineShape(legTopX + 1.2, kneeY, legTopX - 0.4, 0, {
          role: 'ink',
          strokeScale: bodyStroke,
        })
      );
    } else if (params.kieu_chan === 'chan_thang') {
      shapes.push(
        lineShape(-legTopX, underTopY, -legTopX, 0, {
          role: 'ink',
          strokeScale: bodyStroke * 1.04,
        }),
        lineShape(legTopX, underTopY, legTopX, 0, {
          role: 'ink',
          strokeScale: bodyStroke * 1.04,
        })
      );
      // Ngăn hở mảnh dưới mặt bàn dài (nhận diện bàn họp / bàn lớn)
      if (params.so_ngan >= 1) {
        const railY = underTopY + 2.6;
        shapes.push(
          lineShape(-legTopX, railY, legTopX, railY, {
            role: 'secondary',
            strokeScale: FAMILY_DETAIL_STROKE_SCALE,
            opacity: 0.75,
          })
        );
      }
      if (params.so_ngan >= 2) {
        const shelfY = -5.2;
        shapes.push(
          lineShape(-legTopX, shelfY, legTopX, shelfY, {
            role: 'secondary',
            strokeScale: FAMILY_DETAIL_STROKE_SCALE,
            opacity: 0.68,
          })
        );
      }
    }
  }

  const box = computeTightCatalogBox(shapes, 0);
  const totalHeight = Math.abs(box[1]);

  return {
    status: params.status ?? 'nhap',
    labelVi: params.labelVi,
    kich_thuoc_that: params.kichThuocThatCm,
    description5: params.description5,
    anchorType: 'ground',
    defaultLayer: params.defaultLayer ?? 'giua',
    anchorKind: params.anchorKind ?? 'dat',
    allowedAnchorKinds: params.allowedAnchorKinds ?? ['dat'],
    box,
    anchors: params.anchors ?? {},
    canBeRed: params.canBeRed,
    emitterOffset: [0, Number((-totalHeight - 0.4).toFixed(1))],
    tiltPivot: [0, -0.4],
    shapes,
    altShapes: params.canBeRed ? buildRedCloneShapes(shapes) : undefined,
  };
}

/**
 * 2 preset đã được chủ kênh duyệt sẵn (`duyet`) — KHÔNG vẽ lại, chỉ khai báo bảng ánh xạ alias.
 */
export const MAT_PHANG_APPROVED_ALIASES: Record<string, string> = {
  ban_lam_viec: 'std_work_desk',
  ban_tra: 'low_tea_table',
};

/**
 * 5 preset mới của họ `mat_phang` (trạng thái `nhap`, chờ chủ kênh duyệt trên tờ `HO-mat_phang.png`).
 */
export const MAT_PHANG_NEW_PRESETS: Record<string, CustomPropDefinition> = {
  ban_quan: buildMatPhangProp({
    status: 'duyet',
    labelVi: 'Bàn quán cỡ vừa',
    kichThuocThatCm: 82,
    description5: {
      nghia: 'Chiếc bàn gỗ cỡ vừa cho quán trà hoặc cà phê nhỏ, đủ chỗ cho hai ly nước đối diện.',
      cau_truc: 'Gồm 3 đặc điểm nhận diện là mặt bàn ngang gọn cỡ vừa, đôi chân choãi nhẹ thanh thoát và thanh giằng mảnh ngay dưới gầm mặt bàn.',
      bong_dang: 'Dáng bàn vuông vức gọn ngang hơn bàn làm việc nhưng cao bằng tầm ngồi quán, gầm thoáng lộ rõ dáng chân.',
      the_gioi: 'Dựng bằng nét mực mảnh đồng điệu bàn trà và bàn công sở, mặt bàn wash nhạt không phối cảnh và không làm vật đỏ.',
      nguoi_la: 'Đặt cạnh Lữ khách và bàn làm việc, người lạ phân biệt ngay đây là chiếc bàn quán nhỏ gọn.',
    },
    anchorKind: 'dat',
    allowedAnchorKinds: ['dat'],
    anchors: {
      mat_trai: [-7.5, -19.6],
      mat_giua: [0, -19.6],
      mat_phai: [7.5, -19.6],
      mat_ban_trai: [-7.5, -19.6],
      mat_ban_giua: [0, -19.6],
      mat_ban_phai: [7.5, -19.6],
    },
    canBeRed: false,
    rong: 26.0,
    cao: 19.6,
    dayMat: 2.0,
    kieu_chan: 'chan_choai',
    thanh_dau: 'khong',
    so_ngan: 1,
    phu_kien_mat: 'khong',
    doThutChan: 3.6,
  }),

  ban_hop: buildMatPhangProp({
    status: 'duyet',
    labelVi: 'Bàn dài văn phòng',
    kichThuocThatCm: 168,
    description5: {
      nghia: 'Chiếc bàn dài phòng họp gợi những cuộc trao đổi kéo dài, khoảng cách giữa các chỗ ngồi hoặc ghế trống cuối giờ.',
      cau_truc: 'Gồm 3 đặc điểm nhận diện là mặt bàn trải dài rộng gần gấp rưỡi bàn làm việc đơn, hai chân thẳng đặt sát hai đầu và thanh giằng dài chạy suốt dưới mặt bàn.',
      bong_dang: 'Khung chữ Π trải rộng thanh mảnh, cùng chiều cao mặt bàn công sở để kê vừa ghế tựa mà vẫn thoáng gầm.',
      the_gioi: 'Viền mực mảnh cùng lớp wash mặt bàn nhạt chuẩn T2, bỏ chi tiết rườm rà và không dùng làm vật đỏ.',
      nguoi_la: 'Nhìn chiều dài nổi bật đặt cạnh Lữ khách và bàn đơn, người lạ nhận ra ngay chiếc bàn họp dài.',
    },
    anchorKind: 'dat',
    allowedAnchorKinds: ['dat'],
    anchors: {
      mat_trai: [-17.5, -19.6],
      mat_giua: [0, -19.6],
      mat_phai: [17.5, -19.6],
      mat_ban_trai: [-17.5, -19.6],
      mat_ban_giua: [0, -19.6],
      mat_ban_phai: [17.5, -19.6],
    },
    canBeRed: false,
    rong: 53.6,
    cao: 19.6,
    dayMat: 2.2,
    kieu_chan: 'chan_thang',
    thanh_dau: 'khong',
    so_ngan: 1,
    phu_kien_mat: 'khong',
    doThutChan: 4.4,
  }),

  giuong_ngu: buildMatPhangProp({
    status: 'duyet',
    labelVi: 'Giường ngủ khung thấp',
    kichThuocThatCm: 185,
    description5: {
      nghia: 'Chiếc giường phẳng lặng trong phòng riêng, gợi những đêm trằn trọc muộn hoặc giấc nghỉ sâu sau ngày dài.',
      cau_truc: 'Gồm 3 đặc điểm nhận diện là vách đầu giường dựng cao bên trái, thành chân thấp bên phải cùng khung gỗ thoáng gầm đỡ lớp nệm bo mềm phía trên.',
      bong_dang: 'Khối ngang dài thấp ngang đầu gối Lữ khách đứng, tạo nhịp nghỉ êm mà không nặng nề hay che khuất nhân vật.',
      the_gioi: 'Chỉ dùng đường khung mảnh và wash giấy nhạt chuẩn T2, tách rời phần gối để đặt chiec_goi lên điểm neo dau_goi.',
      nguoi_la: 'Thấy khung nằm dài với vách đầu giường cao một bên và lớp nệm phẳng trên khung là người lạ nhận ra ngay giường ngủ.',
    },
    anchorKind: 'dat',
    allowedAnchorKinds: ['dat'],
    anchors: {
      dau_goi: [-18.2, -13.6],
      mat_giuong: [5.0, -13.6],
      mat_trai: [-18.2, -13.6],
      mat_giua: [0, -13.6],
      mat_phai: [17.5, -13.6],
    },
    canBeRed: false,
    rong: 58.8,
    cao: 13.6,
    kieu_chan: 'chan_thang',
    thanh_dau: 'dau_giuong',
    so_ngan: 0,
    phu_kien_mat: 'nem_goi',
    caoDauGiuong: 24.4,
    caoChanGiuong: 15.8,
  }),

  chiec_goi: buildMatPhangProp({
    status: 'nhap',
    labelVi: 'Chiếc gối vải mềm',
    kichThuocThatCm: 46,
    description5: {
      nghia: 'Chiếc gối êm nằm đầu giường gợi giấc ngủ, nỗi nhớ một bên giường trống hoặc sự nâng đỡ thầm lặng.',
      cau_truc: 'Gồm 3 đặc điểm nhận diện là thân gối bầu ngang đặt phẳng đáy, hai góc mép bo túm mềm mại và đúng 1 đường nếp vải cong nhẹ ở giữa.',
      bong_dang: 'Khối bầu ngang thấp gọn, kích thước vừa bằng một phần tư chiều dài giường khi đặt tại điểm neo dau_goi.',
      the_gioi: 'Nét viền mảnh kết hợp wash nhạt, bản đỏ cú lật giữ nguyên 100% dáng gối và đường nếp giữa.',
      nguoi_la: 'Đặt trên đầu giường ngủ hoặc cầm trên tay, người lạ nhìn dáng bầu ngang bo góc là nhận ra ngay chiếc gối.',
    },
    anchorKind: 'tren',
    allowedAnchorKinds: ['tren', 'cam', 'dat'],
    anchors: {},
    canBeRed: true,
    bodyStrokeScale: FAMILY_BODY_STROKE_SCALE,
    rong: 14.6,
    cao: 5.4,
    kieu_chan: 'khong',
    thanh_dau: 'khong',
    so_ngan: 0,
    phu_kien_mat: 'goi_roi',
  }),

  tu_kinh: buildMatPhangProp({
    status: 'duyet',
    labelVi: 'Tủ kính trưng bày',
    kichThuocThatCm: 138,
    description5: {
      nghia: 'Chiếc tủ kính ngăn nắp gợi ký ức được cất giữ, những món đồ kỷ niệm nhìn thấy mà không chạm tới.',
      cau_truc: 'Gồm 3 đặc điểm nhận diện là khung tủ đứng chữ nhật đặt trên chân bệ thấp, hai đợt ngăn ngang chia 3 tầng và hai vệt chéo mảnh gợi mặt kính.',
      bong_dang: 'Khối đứng cao gần bằng vai Lữ khách, khung rỗng nhẹ thoáng giúp không gian phòng không bị đặc đen.',
      the_gioi: 'Viền khung mảnh chuẩn T2 kèm wash nền siêu nhẹ (0.09) để thấy rõ đợt ngăn bên trong, không dùng làm vật đỏ.',
      nguoi_la: 'Nhìn khung đứng chia đợt ngang kèm vệt kính chéo đặt cạnh Lữ khách, người lạ nhận ngay đây là tủ kính.',
    },
    anchorKind: 'dat',
    allowedAnchorKinds: ['dat'],
    anchors: {
      mat_trai: [-6.5, -44.0],
      mat_giua: [0, -44.0],
      mat_phai: [6.5, -44.0],
      ngan_tren: [0, -30.3],
      ngan_duoi: [0, -16.5],
    },
    canBeRed: false,
    rong: 24.4,
    cao: 44.0,
    kieu_chan: 'khoi_hop',
    thanh_dau: 'vach_kinh',
    so_ngan: 2,
    phu_kien_mat: 'khong',
    doThutChan: 2.0,
  }),
};

export const MAT_PHANG_ALL_PRESET_NAMES = [
  ...Object.keys(MAT_PHANG_NEW_PRESETS),
  ...Object.keys(MAT_PHANG_APPROVED_ALIASES),
] as const;
