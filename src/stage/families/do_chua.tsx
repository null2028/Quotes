/**
 * Họ Đạo Cụ 1 — `do_chua` (Chén, ấm, ly, bát, hộp cơm, mâm, vò rượu)
 *
 * Quy tắc:
 * - Một hàm dựng có tham số duy nhất `buildDoChuaProp` lắp ghép từ `primitives.ts` (cấm đường SVG tự do).
 * - Nhìn ngang chính diện, không phối cảnh elip 3D.
 * - Nét mảnh chuẩn T2, tối đa 1–2 nét chi tiết bên trong, wash nền giấy nhạt (`fill: 'bg'`), bản đỏ đồng dạng 100%.
 * - Preset đã `duyet` sẵn (`small_cup`, `wine_jar`) KHÔNG vẽ lại, chỉ gắn bằng alias (`chen_tra`, `vo_ruou`).
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
  parametricArchLid,
  parametricEarHandle,
  parametricSpout,
  parametricSymmetricVesselBody,
  strokeRectShape,
  washCircleShape,
  washRectShape,
} from './primitives';

export interface DoChuaParams {
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

  // Tham số hình học đặc trưng họ `do_chua`: thân / miệng / độ cao / chân đế / nắp / quai / vòi
  kieuThan: 'than_xoay' | 'hop_chu_nhat';
  rongMieng: number;
  rongBung?: number;
  rongDay?: number;
  caoThan: number;
  tyLeBung?: number;
  boGoc?: number;

  chanDe?:
    | { loai: 'de_vanh'; rong: number; cao: number }
    | { loai: 'chan_cao'; rongDe: number; caoTru: number };

  napDay?:
    | {
        loai: 'vom_num';
        rong: number;
        caoVom: number;
        banKinhNum: number;
        openBottom?: boolean;
      }
    | { loai: 'khe_dai_gai'; leTren: number; rongDai: number };

  quaiCam?: {
    ben: 'trai' | 'phai';
    tyLeTren: number; // 0..1 tính từ miệng xuống đáy thân
    tyLeDuoi: number;
    doNho: number;
  };

  voiRot?: {
    ben: 'trai' | 'phai';
    tyLeGocTren: number;
    tyLeGocDuoi: number;
    vuonNgang: number;
    nhoCaoSoVoiMieng: number;
    doDayDauVoi?: number;
  };

  netChiTiet?: {
    loai: 'vanh_ngang' | 'muc_nuoc';
    tyLeTuMieng: number;
    thutLeNgang?: number;
  };
}

/**
 * Hàm ước lượng bán kính thân tại tỷ lệ dọc `t` (0 = miệng, 1 = đáy thân) để gắn quai/vòi/vạch nước khít cạnh thân.
 */
function sampleVesselHalfWidthAt(
  topW: number,
  bellyW: number,
  botW: number,
  t: number
): number {
  const u = Math.max(0, Math.min(1, t));
  const rTop = topW / 2;
  const rBelly = bellyW / 2;
  const rBot = botW / 2;
  // Nội suy Bernstein bậc 2 mượt từ rTop -> rBelly -> rBot
  return (1 - u) * (1 - u) * rTop + 2 * (1 - u) * u * rBelly + u * u * rBot;
}

/**
 * Hàm dựng tham số duy nhất cho toàn bộ preset mới của họ `do_chua`.
 */
export function buildDoChuaProp(params: DoChuaParams): CustomPropDefinition {
  const isLarge = params.kichThuocThatCm >= 30;
  const bodyStroke =
    params.bodyStrokeScale ??
    (isLarge ? FAMILY_LARGE_BODY_STROKE_SCALE : FAMILY_BODY_STROKE_SCALE);
  const washOpacity = params.fillOpacity ?? FAMILY_WASH_OPACITY;

  const shapes: InlineShape[] = [];

  // 1. Chân đế (nếu có) — đặt chạm chuẩn mặt tựa `y = 0`
  let bodyBaseY = 0;
  if (params.chanDe?.loai === 'de_vanh') {
    const { rong, cao } = params.chanDe;
    shapes.push(
      washRectShape(-rong / 2, -cao, rong, cao, 0.2, {
        strokeScale: bodyStroke * 0.92,
        fillOpacity: washOpacity * 0.9,
      })
    );
    bodyBaseY = -cao;
  } else if (params.chanDe?.loai === 'chan_cao') {
    const { rongDe, caoTru } = params.chanDe;
    // Đế ngang mảnh sát mặt bàn + trụ thẳng đứng ở tâm
    shapes.push(
      lineShape(-rongDe / 2, 0, rongDe / 2, 0, {
        role: 'ink',
        strokeScale: bodyStroke,
      })
    );
    shapes.push(
      lineShape(0, 0, 0, -caoTru, {
        role: 'ink',
        strokeScale: bodyStroke * 0.95,
      })
    );
    bodyBaseY = -caoTru;
  }

  const topW = params.rongMieng;
  const bellyW = params.rongBung ?? topW;
  const botW = params.rongDay ?? topW;
  const bodyTopY = bodyBaseY - params.caoThan;

  // 2. Vòi rót & Quai cầm (vẽ trước hoặc cùng lớp để tiếp xúc gọn vào sườn thân)
  if (params.voiRot) {
    const v = params.voiRot;
    const dir = v.ben === 'phai' ? 1 : -1;
    const baseTopY = bodyTopY + params.caoThan * v.tyLeGocTren;
    const baseBotY = bodyTopY + params.caoThan * v.tyLeGocDuoi;
    const midAttachR = sampleVesselHalfWidthAt(
      topW,
      bellyW,
      botW,
      (v.tyLeGocTren + v.tyLeGocDuoi) * 0.5
    );
    shapes.push(
      parametricSpout({
        side: v.ben,
        baseX: dir * (midAttachR - 0.35),
        baseTopY,
        baseBotY,
        reachX: v.vuonNgang,
        tipY: bodyTopY - v.nhoCaoSoVoiMieng,
        tipThickness: v.doDayDauVoi,
        strokeScale: bodyStroke * 0.92,
        fillOpacity: washOpacity,
      })
    );
  }

  if (params.quaiCam) {
    const q = params.quaiCam;
    const dir = q.ben === 'phai' ? 1 : -1;
    const attachTopY = bodyTopY + params.caoThan * q.tyLeTren;
    const attachBotY = bodyTopY + params.caoThan * q.tyLeDuoi;
    const rTopAttach = sampleVesselHalfWidthAt(topW, bellyW, botW, q.tyLeTren);
    const rBotAttach = sampleVesselHalfWidthAt(topW, bellyW, botW, q.tyLeDuoi);
    shapes.push(
      parametricEarHandle({
        side: q.ben,
        attachTopX: dir * rTopAttach,
        attachTopY,
        attachBotX: dir * rBotAttach,
        attachBotY,
        protrude: q.doNho,
        strokeScale: bodyStroke * 0.92,
      })
    );
  }

  // 3. Thân chính nhìn ngang
  if (params.kieuThan === 'hop_chu_nhat') {
    shapes.push(
      washRectShape(
        -topW / 2,
        bodyTopY,
        topW,
        params.caoThan,
        params.boGoc ?? 0.8,
        { strokeScale: bodyStroke, fillOpacity: washOpacity }
      )
    );
  } else {
    shapes.push(
      parametricSymmetricVesselBody({
        baseY: bodyBaseY,
        height: params.caoThan,
        topW,
        bellyW,
        botW,
        bellyRatio: params.tyLeBung ?? 0.55,
        strokeScale: bodyStroke,
        fillOpacity: washOpacity,
      })
    );
  }

  // 4. Nắp đậy (vòm có núm cho ấm trà, hoặc khe nắp + đai gài cho hộp cơm — tối đa 2 nét)
  if (params.napDay?.loai === 'vom_num') {
    const { rong, caoVom, banKinhNum, openBottom } = params.napDay;
    shapes.push(
      parametricArchLid({
        width: rong,
        baseY: bodyTopY,
        archH: caoVom,
        openBottom,
        strokeScale: bodyStroke * 0.88,
        fillOpacity: washOpacity,
      })
    );
    shapes.push(
      washCircleShape(0, bodyTopY - caoVom - banKinhNum * 0.9, banKinhNum, {
        strokeScale: bodyStroke * 0.82,
        fillOpacity: washOpacity,
      })
    );
  } else if (params.napDay?.loai === 'khe_dai_gai') {
    const { leTren, rongDai } = params.napDay;
    const seamY = bodyTopY + leTren;
    shapes.push(
      lineShape(-topW / 2 + 0.3, seamY, topW / 2 - 0.3, seamY, {
        role: 'secondary',
        strokeScale: FAMILY_DETAIL_STROKE_SCALE,
      })
    );
    shapes.push(
      strokeRectShape(
        -rongDai / 2,
        bodyTopY + 0.25,
        rongDai,
        params.caoThan - 0.5,
        0.25,
        {
          role: 'secondary',
          strokeScale: FAMILY_DETAIL_STROKE_SCALE,
        }
      )
    );
  }

  // 5. Nét chi tiết bên trong (đúng 1 nét ngang mảnh)
  if (params.netChiTiet) {
    const t = params.netChiTiet.tyLeTuMieng;
    const detailY = bodyTopY + params.caoThan * t;
    const halfAtY =
      params.kieuThan === 'hop_chu_nhat'
        ? topW / 2
        : sampleVesselHalfWidthAt(topW, bellyW, botW, t);
    const inset = params.netChiTiet.thutLeNgang ?? 0.85;
    const halfSpan = Math.max(0.8, halfAtY - inset);
    shapes.push(
      lineShape(-halfSpan, detailY, halfSpan, detailY, {
        role: 'secondary',
        strokeScale: FAMILY_DETAIL_STROKE_SCALE,
        opacity: 0.72,
      })
    );
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
    anchorKind: params.anchorKind ?? 'tren',
    allowedAnchorKinds: params.allowedAnchorKinds ?? ['tren', 'cam', 'dat'],
    box,
    anchors: params.anchors ?? {},
    canBeRed: params.canBeRed,
    emitterOffset: [0, Number((-totalHeight - 0.4).toFixed(1))],
    tiltPivot: [-1.0, -0.4],
    shapes,
    altShapes: params.canBeRed ? buildRedCloneShapes(shapes) : undefined,
  };
}

/**
 * 2 preset đã được chủ kênh duyệt sẵn (`duyet`) — KHÔNG vẽ lại, chỉ khai báo bảng ánh xạ alias.
 * (Ngoài ra ánh xạ ngược `rice_bowl` -> `bat_com` và `tall_cup` -> `ly_ca_phe` cho 2 mã nháp cũ).
 */
export const DO_CHUA_APPROVED_ALIASES: Record<string, string> = {
  chen_tra: 'small_cup',
  vo_ruou: 'wine_jar',
};

export const DO_CHUA_LEGACY_DRAFT_ALIASES: Record<string, string> = {
  rice_bowl: 'bat_com',
  tall_cup: 'ly_ca_phe',
};

/**
 * 6 preset mới của họ `do_chua` (trạng thái `nhap`, chờ chủ kênh duyệt trên tờ `HO-do_chua.png`).
 */
export const DO_CHUA_NEW_PRESETS: Record<string, CustomPropDefinition> = {
  am_tra: buildDoChuaProp({
    status: 'duyet',
    labelVi: 'Ấm trà gốm nhỏ',
    kichThuocThatCm: 21,
    description5: {
      nghia: 'Ấm trà nóng gợi buổi ngồi lại chậm rãi, sự sẻ chia ấm áp hoặc khoảng lặng pha trà một mình.',
      cau_truc: 'Gồm 3 đặc điểm nhận diện là bầu ấm tròn thấp, vòi rót cong vươn bên phải và quai cầm chữ C bên trái kèm nắp vòm có núm tròn.',
      bong_dang: 'Khối bầu tròn thấp có vòi và quai vươn cân đối hai bên nhìn ngang, cao hơn chén trà khoảng rưỡi.',
      the_gioi: 'Dựng từ đường viền mảnh và lớp wash nền giấy nhạt không phối cảnh; bản đỏ giữ nguyên dáng ấm, vòi và nắp.',
      nguoi_la: 'Thấy bầu tròn thấp có vòi cong một bên và quai chữ C bên đối diện đặt cạnh chén nhỏ là người lạ nhận ra ngay ấm trà.',
    },
    anchorKind: 'tren',
    allowedAnchorKinds: ['tren', 'dat'],
    canBeRed: true,
    bodyStrokeScale: 0.56,
    fillOpacity: 0.09,
    kieuThan: 'than_xoay',
    rongMieng: 5.2,
    rongBung: 9.0,
    rongDay: 4.8,
    caoThan: 6.2,
    tyLeBung: 0.56,
    napDay: {
      loai: 'vom_num',
      rong: 4.4,
      caoVom: 0.95,
      banKinhNum: 0.44,
      openBottom: true,
    },
    quaiCam: { ben: 'trai', tyLeTren: 0.18, tyLeDuoi: 0.78, doNho: 2.35 },
    voiRot: {
      ben: 'phai',
      tyLeGocTren: 0.28,
      tyLeGocDuoi: 0.78,
      vuonNgang: 3.0,
      nhoCaoSoVoiMieng: 0.35,
      doDayDauVoi: 1.35,
    },
  }),

  bat_com: buildDoChuaProp({
    status: 'duyet',
    labelVi: 'Bát cơm gốm',
    kichThuocThatCm: 15,
    description5: {
      nghia: 'Bát cơm nhà hoặc tô phở sáng gợi hơi ấm bữa ăn đời thường và nỗi nhớ người thân.',
      cau_truc: 'Gồm 3 đặc điểm nhận diện là vành miệng ngang mở rộng, bụng bát khum bán cầu đầy đặn và chân đế trôn thấp dưới đáy.',
      bong_dang: 'Nửa cầu ngửa nhìn ngang có đế trôn rõ rệt, rộng gấp rưỡi chén trà nên phân biệt tức thì khi đặt trên bàn hoặc mâm.',
      the_gioi: 'Vẽ phẳng nhìn ngang không elip phối cảnh, chỉ điểm đúng 1 nét viền mảnh dưới vành miệng trên nền wash nhạt.',
      nguoi_la: 'Nhìn dáng khum bán cầu rộng miệng có trôn đế dưới đáy là người lạ nhận ra ngay chiếc bát ăn cơm.',
    },
    anchorKind: 'tren',
    allowedAnchorKinds: ['tren', 'cam', 'dat'],
    canBeRed: true,
    kieuThan: 'than_xoay',
    rongMieng: 9.0,
    rongBung: 8.5,
    rongDay: 4.2,
    caoThan: 5.1,
    tyLeBung: 0.66,
    chanDe: { loai: 'de_vanh', rong: 4.0, cao: 0.75 },
    netChiTiet: { loai: 'vanh_ngang', tyLeTuMieng: 0.2, thutLeNgang: 0.7 },
  }),

  ly_ca_phe: buildDoChuaProp({
    status: 'duyet',
    labelVi: 'Ly cà phê có quai',
    kichThuocThatCm: 14,
    description5: {
      nghia: 'Ly cà phê tỉnh táo buổi sáng hoặc cuộc hẹn quán nhỏ ngồi đối diện nhau.',
      cau_truc: 'Gồm 3 đặc điểm nhận diện là thân cốc hình thang đứng cao gọn, quai cầm chữ C bên hông phải và một vạch ngấn cà phê ngang.',
      bong_dang: 'Khối trụ đứng hơi thuôn nhẹ về đáy kèm tai quai bên phải, cao gần gấp đôi chén trà gốm.',
      the_gioi: 'Giữ nét mảnh không mảng đặc, không vẽ miệng elip 3D; bản đỏ phủ wash đỏ nhạt và viền đỏ trùng khít 100%.',
      nguoi_la: 'Thấy chiếc cốc đứng cao có tai cầm một bên và ngấn nước bên trong là người lạ nhận ra ngay ly cà phê.',
    },
    anchorKind: 'tren',
    allowedAnchorKinds: ['tren', 'cam', 'dat'],
    canBeRed: true,
    kieuThan: 'than_xoay',
    rongMieng: 5.6,
    rongBung: 5.3,
    rongDay: 4.6,
    caoThan: 8.5,
    tyLeBung: 0.5,
    quaiCam: { ben: 'phai', tyLeTren: 0.22, tyLeDuoi: 0.74, doNho: 1.9 },
    netChiTiet: { loai: 'muc_nuoc', tyLeTuMieng: 0.34, thutLeNgang: 0.75 },
  }),

  ly_ruou: buildDoChuaProp({
    status: 'duyet',
    labelVi: 'Ly rượu chân cao',
    kichThuocThatCm: 19,
    description5: {
      nghia: 'Ly rượu đêm khuya gợi chút men say nhẹ hoặc khoảnh khắc đối ẩm lắng sâu.',
      cau_truc: 'Gồm 3 đặc điểm nhận diện là bầu ly khum dáng tulip phía trên, chân trụ thẳng mảnh ở giữa và chân đế ngang mỏng sát bàn.',
      bong_dang: 'Dáng ly cao thanh thoát thắt thành một trục mảnh ở nửa dưới, tách biệt hoàn toàn với mọi loại cốc và chén thấp.',
      the_gioi: 'Vẽ tối giản nhìn ngang với bầu wash giấy mỏng và đúng một ngấn rượu ngang trong lòng bầu ly.',
      nguoi_la: 'Nhìn bầu ly khum đặt trên chân trụ mảnh và đế ngang là người lạ nhận ra ngay chiếc ly rượu vang.',
    },
    anchorKind: 'tren',
    allowedAnchorKinds: ['tren', 'cam', 'dat'],
    canBeRed: true,
    kieuThan: 'than_xoay',
    rongMieng: 4.8,
    rongBung: 6.2,
    rongDay: 1.4,
    caoThan: 6.4,
    tyLeBung: 0.58,
    chanDe: { loai: 'chan_cao', rongDe: 4.8, caoTru: 5.2 },
    netChiTiet: { loai: 'muc_nuoc', tyLeTuMieng: 0.44, thutLeNgang: 0.8 },
  }),

  hop_com: buildDoChuaProp({
    status: 'duyet',
    labelVi: 'Hộp cơm trưa',
    kichThuocThatCm: 19,
    description5: {
      nghia: 'Phần cơm nhà mang theo lên văn phòng, gợi nhịp mưu sinh giản dị và sự chăm chút thầm lặng.',
      cau_truc: 'Gồm 3 đặc điểm nhận diện là thân hộp chữ nhật ngang bo góc mềm, đường khớp nắp chạy ngang gần đỉnh và đai gài dọc ở chính giữa.',
      bong_dang: 'Khối chữ nhật nằm ngang thấp gọn có dải đai khóa dọc chia đôi thân hộp khi nhìn ngang.',
      the_gioi: 'Chỉ dùng lớp wash giấy mỏng cùng hai nét chi tiết mảnh của khe nắp và đai gài; bản đỏ giữ nguyên toàn bộ khung hộp.',
      nguoi_la: 'Thấy chiếc hộp chữ nhật bo góc có nắp đậy và đai gài giữa đặt trên bàn làm việc là người lạ nhận ra ngay hộp cơm trưa.',
    },
    anchorKind: 'tren',
    allowedAnchorKinds: ['tren', 'cam', 'dat'],
    canBeRed: true,
    kieuThan: 'hop_chu_nhat',
    rongMieng: 11.4,
    caoThan: 5.4,
    boGoc: 0.9,
    napDay: { loai: 'khe_dai_gai', leTren: 1.5, rongDai: 1.8 },
  }),

  mam_com: buildDoChuaProp({
    status: 'duyet',
    labelVi: 'Mâm cơm tròn dẹt',
    kichThuocThatCm: 86,
    description5: {
      nghia: 'Mâm cơm gia đình quây quần hoặc khoảng trống đợi người chưa kịp về nhà.',
      cau_truc: 'Gồm 3 đặc điểm nhận diện là mặt khay ngang rộng phẳng thấp, thành vành loe nhẹ hai đầu và chân đế vành lót mỏng bên dưới.',
      bong_dang: 'Dải khay ngang rộng vừa khít mặt bàn trà, có 3 điểm neo trai_mam, giua_mam, phai_mam đặt được trọn 2 bát cơm và 1 chén trà không chạm nhau.',
      the_gioi: 'Vẽ nhìn ngang thuần khiết không bẻ elip phối cảnh, khoá không làm vật đỏ để làm nền tôn bát cơm hoặc chén trà bên trên.',
      nguoi_la: 'Đặt trên bàn trà hay chiếu quê với bát cơm và chén trà phía trên, người lạ nhìn dáng khay dẹt loe vành là nhận ra chiếc mâm cơm.',
    },
    anchorKind: 'tren',
    allowedAnchorKinds: ['tren', 'dat'],
    anchors: {
      trai_mam: [-8.8, -2.65],
      giua_mam: [0, -2.65],
      phai_mam: [8.8, -2.65],
    },
    canBeRed: false,
    kieuThan: 'than_xoay',
    rongMieng: 27.6,
    rongBung: 26.4,
    rongDay: 24.0,
    caoThan: 2.0,
    tyLeBung: 0.5,
    chanDe: { loai: 'de_vanh', rong: 20.0, cao: 0.65 },
  }),
};

export const DO_CHUA_ALL_PRESET_NAMES = [
  'chen_tra',
  'am_tra',
  'ly_ca_phe',
  'ly_ruou',
  'bat_com',
  'hop_com',
  'mam_com',
  'vo_ruou',
] as const;
