import { LAYOUT_TOKENS, THEME_PALETTES } from '../theme/palettes';
import { BUILT_IN_PROP_CATALOG } from './propCatalog';
import { STAGE_VIEWBOX } from './terrainSystem';
import type {
  CustomPropDefinition,
  InlineShape,
} from './stageScriptSchema';
import type {
  EvaluatedActorState,
  EvaluatedPropState,
} from './trackCompiler';
import type { SemanticLayer } from './stageConstants';

const [vbX0Str, vbY0Str, vbWStr, vbHStr] = STAGE_VIEWBOX.split(/\s+/);
export const STAGE_VB_X0 = Number(vbX0Str) || 62;
export const STAGE_VB_Y0 = Number(vbY0Str) || 126;
export const STAGE_VB_W = Number(vbWStr) || 416;
export const STAGE_VB_H = Number(vbHStr) || 250;
export const STAGE_VB_X1 = STAGE_VB_X0 + STAGE_VB_W; // 478
export const STAGE_VB_Y1 = STAGE_VB_Y0 + STAGE_VB_H; // 376

export const PX_PER_STAGE_UNIT_X = LAYOUT_TOKENS.swissGrid.stageWidth / STAGE_VB_W;
export const PX_PER_STAGE_UNIT_Y = LAYOUT_TOKENS.swissGrid.stageHeight / STAGE_VB_H;
export const PX2_PER_STAGE_UNIT2 = PX_PER_STAGE_UNIT_X * PX_PER_STAGE_UNIT_Y; // ~3.845 px²

export interface WorldBBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface ParsedSubpath {
  closed: boolean;
  pts: Array<[number, number]>;
}

/**
 * Khoảng cách Levenshtein + điểm tương đồng từ khoá để gợi ý tên gần đúng nhất.
 * Ví dụ: "stool" -> gợi ý "low_wood_stool".
 */
export function levenshtein(a: string, b: string): number {
  const s = a.toLowerCase();
  const t = b.toLowerCase();
  const m = s.length;
  const n = t.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

export function suggestClosestName(
  input: string,
  candidates: readonly string[]
): string | null {
  if (!input || candidates.length === 0) return null;
  const q = input.toLowerCase().trim();
  let best: string | null = null;
  let bestScore = Infinity;

  for (const cand of candidates) {
    const c = cand.toLowerCase();
    const tokens = c.split(/[_\-.]+/);
    let score = levenshtein(q, c);
    if (tokens.includes(q)) {
      score = Math.min(score, 0.5 + Math.abs(c.length - q.length) * 0.08);
    } else if (c.includes(q) || q.includes(c)) {
      score = Math.min(score, 1.5 + Math.abs(c.length - q.length) * 0.12);
    } else {
      for (const tk of tokens) {
        const d = levenshtein(q, tk);
        if (d <= 2) {
          score = Math.min(score, d + 1.0);
        }
      }
    }
    if (score < bestScore) {
      bestScore = score;
      best = cand;
    }
  }

  return bestScore <= Math.max(4, q.length * 0.8) ? best : null;
}

/**
 * Phân rã SVG path `d` thành danh sách subpath (mở hoặc đóng `Z`) lấy mẫu mịn phục vụ cả BBox lẫn Silhouette 2D.
 */
export function parseSvgPathSubpaths(d: string, curveSteps = 8): ParsedSubpath[] {
  const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g);
  if (!tokens) return [];

  const subpaths: ParsedSubpath[] = [];
  let curSub: ParsedSubpath | null = null;
  let i = 0;
  let cmd = '';
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;

  const nextNum = () => Number(tokens[i++]);
  const hasNum = () => i < tokens.length && !/^[a-zA-Z]$/.test(tokens[i]);

  const ensureSub = (x: number, y: number) => {
    if (!curSub) {
      curSub = { closed: false, pts: [[x, y]] };
      subpaths.push(curSub);
    } else {
      curSub.pts.push([x, y]);
    }
  };

  while (i < tokens.length) {
    if (/^[a-zA-Z]$/.test(tokens[i])) {
      cmd = tokens[i++];
    }
    switch (cmd) {
      case 'M': {
        let first = true;
        while (hasNum()) {
          cx = nextNum();
          cy = nextNum();
          if (first) {
            curSub = { closed: false, pts: [[cx, cy]] };
            subpaths.push(curSub);
            sx = cx;
            sy = cy;
            first = false;
            cmd = 'L';
          } else {
            ensureSub(cx, cy);
          }
        }
        break;
      }
      case 'm': {
        let first = true;
        while (hasNum()) {
          cx += nextNum();
          cy += nextNum();
          if (first) {
            curSub = { closed: false, pts: [[cx, cy]] };
            subpaths.push(curSub);
            sx = cx;
            sy = cy;
            first = false;
            cmd = 'l';
          } else {
            ensureSub(cx, cy);
          }
        }
        break;
      }
      case 'L':
      case 'T':
        while (hasNum()) {
          cx = nextNum();
          cy = nextNum();
          ensureSub(cx, cy);
        }
        break;
      case 'l':
      case 't':
        while (hasNum()) {
          cx += nextNum();
          cy += nextNum();
          ensureSub(cx, cy);
        }
        break;
      case 'H':
        while (hasNum()) {
          cx = nextNum();
          ensureSub(cx, cy);
        }
        break;
      case 'h':
        while (hasNum()) {
          cx += nextNum();
          ensureSub(cx, cy);
        }
        break;
      case 'V':
        while (hasNum()) {
          cy = nextNum();
          ensureSub(cx, cy);
        }
        break;
      case 'v':
        while (hasNum()) {
          cy += nextNum();
          ensureSub(cx, cy);
        }
        break;
      case 'C':
        while (hasNum()) {
          const x1 = nextNum();
          const y1 = nextNum();
          const x2 = nextNum();
          const y2 = nextNum();
          const x = nextNum();
          const y = nextNum();
          for (let s = 1; s <= curveSteps; s++) {
            const t = s / curveSteps;
            const mt = 1 - t;
            ensureSub(
              mt * mt * mt * cx +
                3 * mt * mt * t * x1 +
                3 * mt * t * t * x2 +
                t * t * t * x,
              mt * mt * mt * cy +
                3 * mt * mt * t * y1 +
                3 * mt * t * t * y2 +
                t * t * t * y
            );
          }
          cx = x;
          cy = y;
        }
        break;
      case 'c':
        while (hasNum()) {
          const x1 = cx + nextNum();
          const y1 = cy + nextNum();
          const x2 = cx + nextNum();
          const y2 = cy + nextNum();
          const x = cx + nextNum();
          const y = cy + nextNum();
          for (let s = 1; s <= curveSteps; s++) {
            const t = s / curveSteps;
            const mt = 1 - t;
            ensureSub(
              mt * mt * mt * cx +
                3 * mt * mt * t * x1 +
                3 * mt * t * t * x2 +
                t * t * t * x,
              mt * mt * mt * cy +
                3 * mt * mt * t * y1 +
                3 * mt * t * t * y2 +
                t * t * t * y
            );
          }
          cx = x;
          cy = y;
        }
        break;
      case 'S':
      case 'Q':
        while (hasNum()) {
          const x1 = nextNum();
          const y1 = nextNum();
          const x = nextNum();
          const y = nextNum();
          for (let s = 1; s <= curveSteps; s++) {
            const t = s / curveSteps;
            const mt = 1 - t;
            ensureSub(
              mt * mt * cx + 2 * mt * t * x1 + t * t * x,
              mt * mt * cy + 2 * mt * t * y1 + t * t * y
            );
          }
          cx = x;
          cy = y;
        }
        break;
      case 's':
      case 'q':
        while (hasNum()) {
          const x1 = cx + nextNum();
          const y1 = cy + nextNum();
          const x = cx + nextNum();
          const y = cy + nextNum();
          for (let s = 1; s <= curveSteps; s++) {
            const t = s / curveSteps;
            const mt = 1 - t;
            ensureSub(
              mt * mt * cx + 2 * mt * t * x1 + t * t * x,
              mt * mt * cy + 2 * mt * t * y1 + t * t * y
            );
          }
          cx = x;
          cy = y;
        }
        break;
      case 'A':
      case 'a': {
        const isRel = cmd === 'a';
        while (hasNum()) {
          const rx = Math.abs(nextNum());
          const ry = Math.abs(nextNum());
          nextNum();
          nextNum();
          const sweep = nextNum();
          const x = isRel ? cx + nextNum() : nextNum();
          const y = isRel ? cy + nextNum() : nextNum();
          const midX = (cx + x) * 0.5;
          const midY = (cy + y) * 0.5 + (sweep ? -1 : 1) * ry * 0.65;
          for (let s = 1; s <= curveSteps; s++) {
            const t = s / curveSteps;
            const mt = 1 - t;
            ensureSub(
              mt * mt * cx + 2 * mt * t * midX + t * t * x,
              mt * mt * cy + 2 * mt * t * midY + t * t * y
            );
          }
          if (rx > 0 && ry > 0) {
            // Đã lấy mẫu cung xấp xỉ mượt
          }
          cx = x;
          cy = y;
        }
        break;
      }
      case 'Z':
      case 'z':
        if (curSub) {
          curSub.closed = true;
          if (
            curSub.pts.length > 0 &&
            (Math.abs(cx - sx) > 1e-4 || Math.abs(cy - sy) > 1e-4)
          ) {
            curSub.pts.push([sx, sy]);
          }
        }
        cx = sx;
        cy = sy;
        break;
      default:
        i++;
        break;
    }
  }

  return subpaths;
}

export function parseSvgPathBounds(
  d: string,
  onPt: (x: number, y: number) => void
): void {
  const subs = parseSvgPathSubpaths(d, 6);
  for (const sp of subs) {
    for (const [x, y] of sp.pts) {
      onPt(x, y);
    }
  }
}

export function computeShapesLocalBBox(
  shapes: InlineShape[] = [],
  isAfterPivot = false
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const pushPt = (x: number, y: number, pad = 0) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (x - pad < minX) minX = x - pad;
    if (x + pad > maxX) maxX = x + pad;
    if (y - pad < minY) minY = y - pad;
    if (y + pad > maxY) maxY = y + pad;
  };

  for (const s of shapes) {
    if (!s) continue;
    if (s.show === 'before_pivot' && isAfterPivot) continue;
    if (s.show === 'after_pivot' && !isAfterPivot) continue;
    if (s.opacity !== undefined && s.opacity <= 0.02) continue;

    const strokePad = s.strokeScale === 0 ? 0 : 0.65 * (s.strokeScale ?? 1);
    if (Array.isArray(s.rect)) {
      const [rx, ry, rw, rh] = s.rect;
      pushPt(rx, ry, strokePad);
      pushPt(rx + rw, ry + rh, strokePad);
    }
    if (Array.isArray(s.circle)) {
      const [cx, cy, r] = s.circle;
      pushPt(cx - r, cy - r, strokePad);
      pushPt(cx + r, cy + r, strokePad);
    }
    if (Array.isArray(s.ellipse)) {
      const [cx, cy, rx, ry] = s.ellipse;
      pushPt(cx - rx, cy - ry, strokePad);
      pushPt(cx + rx, cy + ry, strokePad);
    }
    if (Array.isArray(s.line)) {
      const [x1, y1, x2, y2] = s.line;
      pushPt(x1, y1, strokePad);
      pushPt(x2, y2, strokePad);
    }
    if (typeof s.d === 'string' && s.d.trim()) {
      parseSvgPathBounds(s.d, (x, y) => pushPt(x, y, strokePad));
    }
  }

  if (!Number.isFinite(minX)) return null;
  return { minX, minY, maxX, maxY };
}

function pointInPolygon(
  px: number,
  py: number,
  pts: Array<[number, number]>
): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distToSegmentSq(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq <= 1e-9) {
    return (px - ax) * (px - ax) + (py - ay) * (py - ay);
  }
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  const qx = ax + t * dx;
  const qy = ay + t * dy;
  return (px - qx) * (px - qx) + (py - qy) * (py - qy);
}

/**
 * Kết xuất lưới nhị phân Silhouette (64×64) của một danh sách hình học để đối chiếu tự động
 * bóng dáng giữa trạng thái thường và trạng thái đỏ.
 */
export function rasterizeShapesSilhouette(
  shapes: InlineShape[],
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  isAfterPivot: boolean,
  gridSize = 64
): Uint8Array {
  const mask = new Uint8Array(gridSize * gridSize);
  const w = Math.max(1e-3, bounds.maxX - bounds.minX);
  const h = Math.max(1e-3, bounds.maxY - bounds.minY);

  const prepared = shapes
    .filter((s) => {
      if (!s) return false;
      if (s.show === 'before_pivot' && isAfterPivot) return false;
      if (s.show === 'after_pivot' && !isAfterPivot) return false;
      if (s.opacity !== undefined && s.opacity <= 0.02) return false;
      return true;
    })
    .map((s) => {
      const isNegativeCarve =
        s.fill === 'bg' &&
        s.fillOpacity === 0 &&
        (s.strokeScale === undefined || s.strokeScale > 0);
      const hasFill = Boolean(s.fill) && s.fill !== 'none' && !isNegativeCarve;
      const halfStroke =
        s.strokeScale === 0 ? 0 : 0.68 * (s.strokeScale ?? 1);
      const subpaths = s.d ? parseSvgPathSubpaths(s.d, 8) : [];
      return { s, hasFill, halfStroke, subpaths, isNegativeCarve };
    });

  for (let gy = 0; gy < gridSize; gy++) {
    const py = bounds.minY + ((gy + 0.5) / gridSize) * h;
    for (let gx = 0; gx < gridSize; gx++) {
      const px = bounds.minX + ((gx + 0.5) / gridSize) * w;
      let hit = false;

      for (const item of prepared) {
        const { s, hasFill, halfStroke, subpaths } = item;
        const hsSq = halfStroke * halfStroke;

        if (s.rect) {
          const [rx, ry, rw, rh] = s.rect;
          if (hasFill && px >= rx && px <= rx + rw && py >= ry && py <= ry + rh) {
            hit = true;
            break;
          }
          if (halfStroke > 0) {
            const dTop = distToSegmentSq(px, py, rx, ry, rx + rw, ry);
            const dBot = distToSegmentSq(px, py, rx, ry + rh, rx + rw, ry + rh);
            const dLeft = distToSegmentSq(px, py, rx, ry, rx, ry + rh);
            const dRight = distToSegmentSq(px, py, rx + rw, ry, rx + rw, ry + rh);
            if (Math.min(dTop, dBot, dLeft, dRight) <= hsSq) {
              hit = true;
              break;
            }
          }
        }

        if (s.circle) {
          const [cx, cy, r] = s.circle;
          const dist = Math.hypot(px - cx, py - cy);
          if ((hasFill && dist <= r + halfStroke) || (halfStroke > 0 && Math.abs(dist - r) <= halfStroke)) {
            hit = true;
            break;
          }
        }

        if (s.ellipse) {
          const [cx, cy, rx, ry] = s.ellipse;
          const norm =
            ((px - cx) * (px - cx)) / Math.max(1e-4, (rx + halfStroke) ** 2) +
            ((py - cy) * (py - cy)) / Math.max(1e-4, (ry + halfStroke) ** 2);
          if (hasFill && norm <= 1) {
            hit = true;
            break;
          }
          if (halfStroke > 0) {
            const innerNorm =
              ((px - cx) * (px - cx)) / Math.max(1e-4, Math.max(0.1, rx - halfStroke) ** 2) +
              ((py - cy) * (py - cy)) / Math.max(1e-4, Math.max(0.1, ry - halfStroke) ** 2);
            if (norm <= 1 && innerNorm >= 1) {
              hit = true;
              break;
            }
          }
        }

        if (s.line && halfStroke > 0) {
          const [x1, y1, x2, y2] = s.line;
          if (distToSegmentSq(px, py, x1, y1, x2, y2) <= hsSq) {
            hit = true;
            break;
          }
        }

        if (subpaths.length > 0) {
          for (const sp of subpaths) {
            if (hasFill && sp.closed && sp.pts.length >= 3) {
              if (pointInPolygon(px, py, sp.pts)) {
                hit = true;
                break;
              }
            }
            if (halfStroke > 0 && sp.pts.length >= 2) {
              for (let k = 0; k < sp.pts.length - 1; k++) {
                if (
                  distToSegmentSq(
                    px,
                    py,
                    sp.pts[k][0],
                    sp.pts[k][1],
                    sp.pts[k + 1][0],
                    sp.pts[k + 1][1]
                  ) <= hsSq
                ) {
                  hit = true;
                  break;
                }
              }
              if (hit) break;
            }
          }
          if (hit) break;
        }
      }

      if (hit) {
        mask[gy * gridSize + gx] = 1;
      }
    }
  }

  return mask;
}

export interface RedSilhouetteComparison {
  maxBBoxDelta: number;
  silhouetteIoU: number;
  mismatchRatio: number;
  normalBox: { minX: number; minY: number; maxX: number; maxY: number } | null;
  redBox: { minX: number; minY: number; maxX: number; maxY: number } | null;
}

/**
 * So sánh hộp bao và bóng dáng (silhouette) giữa bản thường và bản đỏ của cùng một đạo cụ.
 * Nếu đạo cụ không khai báo `altShapes` (bản đỏ dùng trực tiếp `shapes`), độ trùng khớp là tuyệt đối (IoU = 1, Δ = 0).
 */
export function compareNormalAndRedSilhouette(
  normalShapes: InlineShape[],
  redShapes?: InlineShape[]
): RedSilhouetteComparison {
  const normalBox = computeShapesLocalBBox(normalShapes, false);
  const effectiveRed =
    redShapes && redShapes.length > 0 ? redShapes : normalShapes;
  const redBox = computeShapesLocalBBox(effectiveRed, true);

  if (!normalBox || !redBox) {
    return {
      maxBBoxDelta: normalBox === redBox ? 0 : Infinity,
      silhouetteIoU: normalBox === redBox ? 1 : 0,
      mismatchRatio: normalBox === redBox ? 0 : 1,
      normalBox,
      redBox,
    };
  }

  const maxBBoxDelta = Math.max(
    Math.abs(normalBox.minX - redBox.minX),
    Math.abs(normalBox.minY - redBox.minY),
    Math.abs(normalBox.maxX - redBox.maxX),
    Math.abs(normalBox.maxY - redBox.maxY)
  );

  const unionBounds = {
    minX: Math.min(normalBox.minX, redBox.minX) - 1,
    minY: Math.min(normalBox.minY, redBox.minY) - 1,
    maxX: Math.max(normalBox.maxX, redBox.maxX) + 1,
    maxY: Math.max(normalBox.maxY, redBox.maxY) + 1,
  };

  const maskN = rasterizeShapesSilhouette(normalShapes, unionBounds, false, 64);
  const maskR = rasterizeShapesSilhouette(effectiveRed, unionBounds, true, 64);

  let inter = 0;
  let uni = 0;
  let diff = 0;
  for (let i = 0; i < maskN.length; i++) {
    const a = maskN[i];
    const b = maskR[i];
    if (a && b) inter++;
    if (a || b) uni++;
    if (a !== b) diff++;
  }

  const silhouetteIoU = uni === 0 ? 1 : inter / uni;
  const mismatchRatio = uni === 0 ? 0 : diff / uni;

  return {
    maxBBoxDelta,
    silhouetteIoU,
    mismatchRatio,
    normalBox,
    redBox,
  };
}

export function getPropWorldBBox(
  propState: EvaluatedPropState,
  customPropsMap?: Record<string, CustomPropDefinition>,
  isAfterPivot = false
): WorldBBox | null {
  const def =
    customPropsMap?.[propState.type] ?? BUILT_IN_PROP_CATALOG[propState.type];
  const varName = propState.variant ?? propState.spec?.variant;
  const activeVar = varName && def?.variants ? def.variants[varName] : undefined;
  const explicitBox = activeVar?.box ?? def?.box;

  let local: { minX: number; minY: number; maxX: number; maxY: number } | null =
    null;

  if (!customPropsMap && !propState.spec?.shapes && explicitBox) {
    local = {
      minX: explicitBox[0],
      minY: explicitBox[1],
      maxX: explicitBox[2],
      maxY: explicitBox[3],
    };
  } else {
    const primaryShapes =
      propState.spec?.shapes ?? activeVar?.shapes ?? def?.shapes ?? [];
    const altShapes =
      propState.spec?.altShapes ?? activeVar?.altShapes ?? def?.altShapes;
    const activeShapes =
      altShapes && altShapes.length > 0 && propState.morphProgress >= 0.5
        ? altShapes
        : primaryShapes;
    local = computeShapesLocalBBox(activeShapes, isAfterPivot);
  }

  if (!local) return null;

  const [px, py] = propState.spec?.tiltPivot ?? def?.tiltPivot ?? [0, 0];
  const flipX =
    propState.type === 'bridal_veil' &&
    propState.attachedActorFacing === 'left'
      ? -1
      : 1;
  const sx = propState.scale * flipX;
  const sy = propState.scale;
  const rad = (propState.rotate * Math.PI) / 180;
  const cosR = Math.cos(rad);
  const sinR = Math.sin(rad);
  const pwx = px * sx;
  const pwy = py * sy;

  const corners = [
    [local.minX, local.minY],
    [local.maxX, local.minY],
    [local.maxX, local.maxY],
    [local.minX, local.maxY],
  ].map(([lx, ly]) => {
    const ux = lx * sx;
    const uy = ly * sy;
    const rx = pwx + (ux - pwx) * cosR - (uy - pwy) * sinR;
    const ry = pwy + (ux - pwx) * sinR + (uy - pwy) * cosR;
    return [propState.x + rx, propState.y + ry];
  });

  return {
    x0: Math.min(...corners.map((c) => c[0])),
    y0: Math.min(...corners.map((c) => c[1])),
    x1: Math.max(...corners.map((c) => c[0])),
    y1: Math.max(...corners.map((c) => c[1])),
  };
}

export function getActorWorldBBox(
  actor: EvaluatedActorState,
  customPropsMap?: Record<string, CustomPropDefinition>,
  isAfterPivot = false
): WorldBBox | null {
  const rigName = actor.rig?.trim();
  const isCustomRig =
    Boolean(rigName) &&
    rigName !== 'traveler' &&
    rigName !== 'cloaked_traveler' &&
    rigName !== 'human' &&
    Boolean(customPropsMap?.[rigName!] ?? BUILT_IN_PROP_CATALOG[rigName!]);

  if (isCustomRig && rigName) {
    return getPropWorldBBox(
      {
        id: actor.id,
        type: rigName,
        layer: actor.layer,
        x: actor.x,
        y: actor.y,
        scale: actor.scale,
        rotate: actor.leanDeg,
        opacity: actor.opacity,
        color: actor.color,
        isAccentActive: false,
        loopProgress: 0,
        motionActivity: 0,
        travelDist: 0,
        drawProgress: 1,
        morphProgress: isAfterPivot ? actor.sitProgress : 0,
        splitProgress: 0,
        floatAwayProgress: 0,
        emitters: {
          steam: 0,
          pulseRing: 0,
          spill: 0,
          glow: 0,
          color: '#000',
          steamColor: '#000',
        },
        spec: { id: actor.id, type: rigName },
      },
      customPropsMap,
      isAfterPivot
    );
  }

  const s = actor.scale;
  const dir = actor.facing === 'right' ? 1 : -1;
  const sit = actor.sitProgress >= 0.5 ? 1 : 0;
  const frontExtent = (sit ? 9.6 : 8.4) * s;
  const backExtent = 9.4 * s;
  return {
    x0: dir === 1 ? actor.x - backExtent : actor.x - frontExtent,
    y0: actor.y - 48.5 * s,
    x1: dir === 1 ? actor.x + frontExtent : actor.x + backExtent,
    y1: actor.y,
  };
}

export function computePropRedStageArea(
  propState: EvaluatedPropState,
  customPropsMap?: Record<string, CustomPropDefinition>
): number {
  if (!propState.isAccentActive) return 0;
  const def =
    customPropsMap?.[propState.type] ?? BUILT_IN_PROP_CATALOG[propState.type];
  const varName = propState.variant ?? propState.spec?.variant;
  const activeVar = varName && def?.variants ? def.variants[varName] : undefined;

  const primaryShapes =
    propState.spec?.shapes ?? activeVar?.shapes ?? def?.shapes ?? [];
  const altShapes =
    propState.spec?.altShapes ?? activeVar?.altShapes ?? def?.altShapes;
  const activeShapes =
    altShapes && altShapes.length > 0 && propState.morphProgress >= 0.5
      ? altShapes
      : primaryShapes;

  const accentHex =
    THEME_PALETTES.MINIMAL_LIGHT.accentProp ||
    THEME_PALETTES.MINIMAL_LIGHT.accent;
  const wholePropIsAccent =
    propState.isAccentActive && propState.color === accentHex;

  let redStageUnits2 = 0;
  const s2 = propState.scale * propState.scale;

  for (const s of activeShapes) {
    if (!s || s.show === 'before_pivot') continue;
    if (s.opacity !== undefined && s.opacity <= 0.02) continue;
    const isNegativeCarve = s.fill === 'bg' && s.fillOpacity === 0;
    if (isNegativeCarve) continue;

    const strokeIsRed =
      (s.strokeScale ?? 1) > 0 &&
      (s.role === 'accent' || (!s.role && wholePropIsAccent));
    const fillIsRed =
      Boolean(s.fill) &&
      s.fill !== 'none' &&
      (s.fill === 'accent' ||
        ((s.fill === 'bg' || !s.role) &&
          wholePropIsAccent &&
          s.role !== 'ink' &&
          s.role !== 'secondary'));

    if (!strokeIsRed && !fillIsRed) continue;

    const sb = computeShapesLocalBBox([s], true);
    if (!sb) continue;
    const w = Math.max(0.8, sb.maxX - sb.minX);
    const h = Math.max(0.8, sb.maxY - sb.minY);

    const strokeW = strokeIsRed ? 1.35 * (s.strokeScale ?? 1) : 0;
    if (fillIsRed) {
      const fillFactor = s.circle || s.ellipse ? Math.PI * 0.25 : 0.88;
      redStageUnits2 += (w + strokeW) * (h + strokeW) * fillFactor * s2;
    } else if (strokeIsRed) {
      const perim = Math.max(w, h) * 1.6 + Math.min(w, h) * 0.8;
      redStageUnits2 += perim * strokeW * propState.scale;
    }
  }

  if (propState.emitters?.spill > 0.1 && propState.isAccentActive) {
    const rx = 9.8 * propState.emitters.spill * propState.scale;
    const ry = 1.25 * propState.emitters.spill * propState.scale;
    redStageUnits2 += Math.PI * rx * ry;
  }

  return redStageUnits2;
}

const BACKDROP_ID_TYPE_RE =
  /window|gate|roof|arch|wall_clock|office_wall_clock|skyline|sanctuary_dome|cloud|sun|moon|star/i;

/**
 * Suy luận lớp sâu ngữ nghĩa (`nen` | `giua` | `truoc`) cho cả kịch bản mới và kịch bản cũ khi chạy audit.
 */
export function resolveEffectiveSemanticLayer(
  explicitSemanticLayer: SemanticLayer | undefined,
  stageLayer: string | undefined,
  idAndType: string
): SemanticLayer {
  if (explicitSemanticLayer) return explicitSemanticLayer;
  if (stageLayer === 'sky' || stageLayer === 'far') return 'nen';
  if (BACKDROP_ID_TYPE_RE.test(idAndType)) return 'nen';
  return 'giua';
}
