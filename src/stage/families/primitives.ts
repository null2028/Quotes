/**
 * Hình cơ bản & hàm đường cong có tham số dùng chung cho 12 Họ Đạo Cụ (`src/stage/families/`).
 *
 * Ràng buộc thiết kế:
 * - Cấm viết đường SVG tự do bằng tay ở từng đạo cụ; mọi đường cong phải sinh từ hàm toán học có tham số.
 * - Nhìn ngang chính diện (orthographic side-view), không phối cảnh 3D.
 * - Tuân thủ phong cách T2: nét mảnh, wash nền giấy nhạt (`fill: 'bg'`), bản đỏ đồng dạng 100% (`IoU = 1.0`).
 */
import {
  PROP_WASH_FILL_OPACITY,
  RED_PIVOT_FILL_OPACITY,
} from '../stageConstants';
import type { InlineShape } from '../stageScriptSchema';

export const FAMILY_BODY_STROKE_SCALE = 0.65;
export const FAMILY_LARGE_BODY_STROKE_SCALE = 0.72;
export const FAMILY_DETAIL_STROKE_SCALE = 0.48;
export const FAMILY_WASH_OPACITY = 0.11;
export const FAMILY_RED_FILL_OPACITY = RED_PIVOT_FILL_OPACITY;

const f2 = (n: number): string => Number(n.toFixed(2)).toString();

export interface WashStyleOpts {
  strokeScale?: number;
  fillOpacity?: number;
}

export interface StrokeStyleOpts {
  strokeScale?: number;
  role?: 'ink' | 'secondary' | 'accent';
  opacity?: number;
  dashed?: boolean;
}

/** Khung chữ nhật cơ bản có wash nhạt */
export function washRectShape(
  x: number,
  y: number,
  w: number,
  h: number,
  rx = 0,
  opts: WashStyleOpts = {}
): InlineShape {
  return {
    rect: [
      Number(x.toFixed(2)),
      Number(y.toFixed(2)),
      Number(w.toFixed(2)),
      Number(h.toFixed(2)),
      Number(rx.toFixed(2)),
    ],
    fill: 'bg',
    fillOpacity: opts.fillOpacity ?? FAMILY_WASH_OPACITY,
    role: 'ink',
    strokeScale: opts.strokeScale ?? FAMILY_BODY_STROKE_SCALE,
  };
}

/** Khung chữ nhật chỉ viền mảnh (chi tiết đai/khớp) */
export function strokeRectShape(
  x: number,
  y: number,
  w: number,
  h: number,
  rx = 0,
  opts: StrokeStyleOpts = {}
): InlineShape {
  return {
    rect: [
      Number(x.toFixed(2)),
      Number(y.toFixed(2)),
      Number(w.toFixed(2)),
      Number(h.toFixed(2)),
      Number(rx.toFixed(2)),
    ],
    fill: 'none',
    role: opts.role ?? 'secondary',
    strokeScale: opts.strokeScale ?? FAMILY_DETAIL_STROKE_SCALE,
    opacity: opts.opacity,
    dashed: opts.dashed,
  };
}

/** Đoạn thẳng cơ bản */
export function lineShape(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  opts: StrokeStyleOpts = {}
): InlineShape {
  return {
    line: [
      Number(x1.toFixed(2)),
      Number(y1.toFixed(2)),
      Number(x2.toFixed(2)),
      Number(y2.toFixed(2)),
    ],
    fill: 'none',
    role: opts.role ?? 'secondary',
    strokeScale: opts.strokeScale ?? FAMILY_DETAIL_STROKE_SCALE,
    opacity: opts.opacity,
    dashed: opts.dashed,
  };
}

/** Hình tròn cơ bản (núm nắp, chốt nhỏ) */
export function washCircleShape(
  cx: number,
  cy: number,
  r: number,
  opts: WashStyleOpts = {}
): InlineShape {
  return {
    circle: [Number(cx.toFixed(2)), Number(cy.toFixed(2)), Number(r.toFixed(2))],
    fill: 'bg',
    fillOpacity: opts.fillOpacity ?? FAMILY_WASH_OPACITY,
    role: 'ink',
    strokeScale: opts.strokeScale ?? FAMILY_BODY_STROKE_SCALE,
  };
}

/**
 * Hàm sinh biên dạng thân xoay đối xứng nhìn ngang (không phối cảnh):
 * - Miệng trên thẳng ngang ở `baseY - height` rộng `topW`
 * - Đáy dưới thẳng ngang ở `baseY` rộng `botW`
 * - Hai bên sườn uốn mượt qua độ phình `bellyW` ở cao độ tỷ lệ `bellyRatio` (0..1 tính từ miệng xuống đáy)
 */
export function parametricSymmetricVesselBody(params: {
  baseY: number;
  height: number;
  topW: number;
  bellyW: number;
  botW: number;
  bellyRatio?: number;
  strokeScale?: number;
  fillOpacity?: number;
}): InlineShape {
  const {
    baseY,
    height,
    topW,
    bellyW,
    botW,
    bellyRatio = 0.55,
    strokeScale = FAMILY_BODY_STROKE_SCALE,
    fillOpacity = FAMILY_WASH_OPACITY,
  } = params;

  const topY = baseY - height;
  const rTop = topW / 2;
  const rBelly = bellyW / 2;
  const rBot = botW / 2;

  const c1Y = topY + height * Math.max(0.15, bellyRatio * 0.65);
  const c2Y = topY + height * Math.min(0.92, bellyRatio + (1 - bellyRatio) * 0.55);

  const d = [
    `M ${f2(-rTop)} ${f2(topY)}`,
    `L ${f2(rTop)} ${f2(topY)}`,
    `C ${f2(rBelly)} ${f2(c1Y)} ${f2(rBelly)} ${f2(c2Y)} ${f2(rBot)} ${f2(baseY)}`,
    `L ${f2(-rBot)} ${f2(baseY)}`,
    `C ${f2(-rBelly)} ${f2(c2Y)} ${f2(-rBelly)} ${f2(c1Y)} ${f2(-rTop)} ${f2(topY)}`,
    'Z',
  ].join(' ');

  return {
    d,
    fill: 'bg',
    fillOpacity: fillOpacity ?? PROP_WASH_FILL_OPACITY,
    role: 'ink',
    strokeScale,
  };
}

/**
 * Hàm sinh nắp vòm thấp nhìn ngang (đáy phẳng `baseY`, đỉnh khum cao `archH`).
 * `openBottom = true`: bỏ đoạn đóng nét đáy (`Z`) để không chập 2 nét đen lên cạnh miệng thân bình/ấm.
 */
export function parametricArchLid(params: {
  width: number;
  baseY: number;
  archH: number;
  openBottom?: boolean;
  strokeScale?: number;
  fillOpacity?: number;
}): InlineShape {
  const r = params.width / 2;
  const peakCtrlY = params.baseY - params.archH * 1.65;
  const d = `M ${f2(-r)} ${f2(params.baseY)} Q 0 ${f2(peakCtrlY)} ${f2(r)} ${f2(params.baseY)}${params.openBottom ? '' : ' Z'}`;
  return {
    d,
    fill: 'bg',
    fillOpacity: params.fillOpacity ?? FAMILY_WASH_OPACITY,
    role: 'ink',
    strokeScale: params.strokeScale ?? FAMILY_BODY_STROKE_SCALE,
  };
}

/**
 * Hàm sinh quai cầm chữ C nhìn ngang gắn vào sườn trái hoặc phải.
 */
export function parametricEarHandle(params: {
  side: 'trai' | 'phai';
  attachTopX: number;
  attachTopY: number;
  attachBotX: number;
  attachBotY: number;
  protrude: number;
  strokeScale?: number;
}): InlineShape {
  const dir = params.side === 'phai' ? 1 : -1;
  const outTopX = params.attachTopX + dir * params.protrude;
  const outBotX = params.attachBotX + dir * params.protrude * 0.92;
  const spanY = params.attachBotY - params.attachTopY;
  const c1Y = params.attachTopY - spanY * 0.06;
  const c2Y = params.attachBotY + spanY * 0.06;

  const d = `M ${f2(params.attachTopX)} ${f2(params.attachTopY)} C ${f2(outTopX)} ${f2(c1Y)} ${f2(outBotX)} ${f2(c2Y)} ${f2(params.attachBotX)} ${f2(params.attachBotY)}`;
  return {
    d,
    fill: 'none',
    role: 'ink',
    strokeScale: params.strokeScale ?? FAMILY_BODY_STROKE_SCALE,
  };
}

/**
 * Hàm sinh vòi ấm cong thuôn nhìn ngang (khép kín có lớp wash nhạt để không xuyên nét thân).
 */
export function parametricSpout(params: {
  side: 'trai' | 'phai';
  baseX: number;
  baseTopY: number;
  baseBotY: number;
  reachX: number;
  tipY: number;
  tipThickness?: number;
  strokeScale?: number;
  fillOpacity?: number;
}): InlineShape {
  const dir = params.side === 'phai' ? 1 : -1;
  const tipX = params.baseX + dir * params.reachX;
  const tipHalf = (params.tipThickness ?? 0.9) / 2;
  const ctrlUpperX = params.baseX + dir * params.reachX * 0.55;
  const ctrlUpperY = params.baseTopY - (params.baseTopY - params.tipY) * 0.15;
  const ctrlLowerX = params.baseX + dir * params.reachX * 0.68;
  const ctrlLowerY = params.baseBotY - (params.baseBotY - params.tipY) * 0.12;

  const d = [
    `M ${f2(params.baseX)} ${f2(params.baseTopY)}`,
    `Q ${f2(ctrlUpperX)} ${f2(ctrlUpperY)} ${f2(tipX - dir * tipHalf * 0.6)} ${f2(params.tipY - tipHalf)}`,
    `L ${f2(tipX + dir * tipHalf * 0.6)} ${f2(params.tipY + tipHalf)}`,
    `Q ${f2(ctrlLowerX)} ${f2(ctrlLowerY)} ${f2(params.baseX)} ${f2(params.baseBotY)}`,
    'Z',
  ].join(' ');

  return {
    d,
    fill: 'bg',
    fillOpacity: params.fillOpacity ?? FAMILY_WASH_OPACITY,
    role: 'ink',
    strokeScale: params.strokeScale ?? FAMILY_BODY_STROKE_SCALE,
  };
}

/**
 * Sinh tự động bản đỏ (`altShapes`) giữ nguyên 100% hình học & độ dày nét (`IoU = 1.000`, `BBox delta = 0`):
 * - Mảng wash `fill: 'bg'` -> tô đỏ nhạt (`fill: 'accent'`, `fillOpacity: 0.32`) + viền đỏ (`role: 'accent'`).
 * - Nét hở `fill: 'none'` -> viền đỏ (`role: 'accent'`).
 */
export function buildRedCloneShapes(shapes: InlineShape[]): InlineShape[] {
  return shapes.map((s) => {
    const isClosedWash = s.fill === 'bg';
    if (isClosedWash) {
      return {
        ...s,
        fill: 'accent',
        fillOpacity: FAMILY_RED_FILL_OPACITY,
        role: 'accent',
      };
    }
    return {
      ...s,
      fill: 'none',
      role: 'accent',
    };
  });
}

/**
 * Lấy mẫu nhanh biên Bezier/đoạn thẳng trong `d` (chỉ gồm M/L/Q/C/Z do chính primitives sinh ra)
 * để tính hộp bao khớp khít mà không tạo vòng phụ thuộc import với `stageGeometry.ts`.
 */
function scanGeneratedPathBounds(
  d: string,
  pushPt: (x: number, y: number) => void
): void {
  const tokens = d.match(/[MLQCZ]|[-+]?(?:\d+\.?\d*|\.\d+)/g);
  if (!tokens) return;
  let i = 0;
  let cmd = '';
  let cx = 0;
  let cy = 0;
  const num = () => Number(tokens[i++]);

  while (i < tokens.length) {
    const tk = tokens[i];
    if (/^[MLQCZ]$/.test(tk)) {
      cmd = tokens[i++];
      if (cmd === 'Z') continue;
    }
    if (cmd === 'M' || cmd === 'L') {
      cx = num();
      cy = num();
      pushPt(cx, cy);
    } else if (cmd === 'Q') {
      const x1 = num(),
        y1 = num(),
        x2 = num(),
        y2 = num();
      for (let s = 1; s <= 8; s++) {
        const t = s / 8,
          mt = 1 - t;
        pushPt(
          mt * mt * cx + 2 * mt * t * x1 + t * t * x2,
          mt * mt * cy + 2 * mt * t * y1 + t * t * y2
        );
      }
      cx = x2;
      cy = y2;
    } else if (cmd === 'C') {
      const x1 = num(),
        y1 = num(),
        x2 = num(),
        y2 = num(),
        x3 = num(),
        y3 = num();
      for (let s = 1; s <= 8; s++) {
        const t = s / 8,
          mt = 1 - t;
        pushPt(
          mt * mt * mt * cx +
            3 * mt * mt * t * x1 +
            3 * mt * t * t * x2 +
            t * t * t * x3,
          mt * mt * mt * cy +
            3 * mt * mt * t * y1 +
            3 * mt * t * t * y2 +
            t * t * t * y3
        );
      }
      cx = x3;
      cy = y3;
    } else {
      i++;
    }
  }
}

/**
 * Tính hộp bao khớp khít từ danh sách `shapes` (đồng bộ công thức `strokePad = 0.65 * strokeScale` của `stageGeometry.ts`).
 */
export function computeTightCatalogBox(
  shapes: InlineShape[],
  extraPad = 0
): [number, number, number, number] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const push = (x: number, y: number, pad: number) => {
    if (x - pad < minX) minX = x - pad;
    if (x + pad > maxX) maxX = x + pad;
    if (y - pad < minY) minY = y - pad;
    if (y + pad > maxY) maxY = y + pad;
  };

  for (const s of shapes) {
    const pad =
      (s.strokeScale === 0 ? 0 : 0.65 * (s.strokeScale ?? 1)) + extraPad;
    if (s.rect) {
      const [rx, ry, rw, rh] = s.rect;
      push(rx, ry, pad);
      push(rx + rw, ry + rh, pad);
    }
    if (s.circle) {
      const [cx, cy, r] = s.circle;
      push(cx - r, cy - r, pad);
      push(cx + r, cy + r, pad);
    }
    if (s.line) {
      const [x1, y1, x2, y2] = s.line;
      push(x1, y1, pad);
      push(x2, y2, pad);
    }
    if (s.d) {
      scanGeneratedPathBounds(s.d, (x, y) => push(x, y, pad));
    }
  }

  if (!Number.isFinite(minX)) return [-4, -8, 4, 0];
  return [
    Number(minX.toFixed(2)),
    Number(minY.toFixed(2)),
    Number(maxX.toFixed(2)),
    Number(Math.min(0, maxY).toFixed(2)),
  ];
}
