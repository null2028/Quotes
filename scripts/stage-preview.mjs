import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Resvg } from '@resvg/resvg-js';

import {
  APPROVAL_BATCH_PROP_NAMES,
  BUILT_IN_PROP_CATALOG,
  renderShapeListStatic,
} from '../src/stage/propCatalog.tsx';
import { DeclarativeStagePlayer } from '../src/stage/DeclarativeStagePlayer.tsx';
import { isGoiChen, parseGoiChen } from '../src/stage/goiChenParser.ts';
import { resolveStageScript } from '../src/stage/stageScriptRegistry.ts';
import {
  isSemanticStageScript,
} from '../src/stage/semanticStage.ts';
import {
  validateAndCompileStageInput,
  validateCatalogPropsHard,
} from '../src/stage/stageValidator.ts';
import {
  computeExpectedCatalogSpanFromCm,
  DEFAULT_SCENE_SCALE,
  HE_SO_PHONG_DAI,
  NGUONG_VAT_NHO_CM,
  TY_LE_CANH,
  WALL_MOUNT_Y_OFFSET,
} from '../src/stage/stageConstants.ts';
import { compareNormalAndRedSilhouette } from '../src/stage/stageGeometry.ts';
import { computeTimelineSync, stripInlineMarkdown } from '../src/engine/timelineSync.ts';
import { evaluateMotionState } from '../src/engine/motionPhysics.ts';
import { LAYOUT_TOKENS, THEME_PALETTES } from '../src/theme/palettes.ts';
import {
  resolveLayoutGeometry,
  resolveVisualDNA,
} from '../src/engine/visualDnaResolver.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'qa-artifacts-ci');
fs.mkdirSync(OUT_DIR, { recursive: true });

const CROSS_PLATFORM_SERIF_FONT =
  "Georgia, 'Noto Serif', 'DejaVu Serif', 'Liberation Serif', serif";
const CROSS_PLATFORM_SANS_FONT =
  "'Be Vietnam Pro', 'DejaVu Sans', 'Liberation Sans', 'Helvetica Neue', sans-serif";

function getGitShortCommit() {
  try {
    return execSync('git rev-parse --short HEAD', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Chuẩn hoá SVG trước khi raster bằng @resvg/resvg-js (chạy đồng nhất trên macOS & Linux arm64/x64):
 * - Chuẩn hoá mã màu hex 8 ký tự / rgb() nếu có.
 * - Namespace toàn bộ id/url(#...) khi nhúng nhiều khung vào cùng 1 ảnh ghép.
 */
function sanitizeSvgForResvg(svg, idPrefix = '') {
  let out = String(svg || '');
  out = out.replace(/#([0-9a-fA-F]{6})([0-9a-fA-F]{2})\b/g, '#$1');
  if (idPrefix) {
    out = out
      .replace(/\bid="([^"]+)"/g, `id="${idPrefix}$1"`)
      .replace(/url\(#([^)]+)\)/g, `url(#${idPrefix}$1)`)
      .replace(/clip-path="url\(#([^)]+)\)"/g, `clip-path="url(#${idPrefix}$1)"`);
  }
  return out;
}

function renderSvgStringToPngFile(svgString, widthPx, outPath) {
  const resvg = new Resvg(svgString, {
    fitTo: { mode: 'width', value: Math.round(widthPx) },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'Georgia',
    },
  });
  const pngBuffer = resvg.render().asPng();
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, pngBuffer);
}

/**
 * Bộ raster đa nền tảng thay thế CoreSVG (chạy được cả macOS darwin-arm64 lẫn Linux linux-arm64/x64).
 */
function rasterizeWithResvg(payload) {
  const { mode, out } = payload;
  if (mode === 'single') {
    const clean = sanitizeSvgForResvg(payload.svg);
    renderSvgStringToPngFile(clean, Number(payload.w) || 1080, out);
    return;
  }

  if (mode === 'strip6') {
    const svgs = payload.svgs || [];
    const tw = 360;
    const th = 640;
    const W = tw * Math.max(1, svgs.length);
    const H = th;
    const embedded = svgs
      .map((raw, idx) => {
        const inner = sanitizeSvgForResvg(raw, `s${idx}_`)
          .replace(/^<\?xml[^>]*>\s*/i, '')
          .replace(/<svg\b[^>]*>/i, '')
          .replace(/<\/svg>\s*$/i, '');
        return `<svg x="${idx * tw}" y="0" width="${tw}" height="${th}" viewBox="0 0 1080 1920">${inner}</svg>`;
      })
      .join('\n');
    const master = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${embedded}</svg>`;
    renderSvgStringToPngFile(master, W, out);
    return;
  }

  if (mode === 'sheet') {
    const { bannerTitle, bannerMeta, bannerStatus, sections } = payload;
    const padX = 28;
    const padTop = 24;
    const bannerH = bannerStatus ? 106 : 82;
    const cardW = 270;
    const cardH = 480;
    const labelH = 38;
    const gapX = 16;
    const gapY = 20;
    const secHeaderH = 36;
    const secGap = 24;

    const maxCols = Math.max(
      6,
      ...sections.map((sec) => Math.min(sec.cols || 8, Math.max(1, sec.cards.length)))
    );
    const W = padX * 2 + maxCols * cardW + (maxCols - 1) * gapX;

    let curY = padTop + bannerH + 18;
    const bodyParts = [];
    let cardGlobalIdx = 0;

    for (const sec of sections) {
      if (!sec.cards || sec.cards.length === 0) continue;
      const cols = sec.cols || maxCols;
      bodyParts.push(
        `<text x="${padX}" y="${curY + 22}" font-family="${CROSS_PLATFORM_SANS_FONT}" font-size="16" font-weight="bold" fill="${sec.isWarningSection ? '#92400E' : '#2D2721'}">${escXml(sec.title)}</text>`
      );
      bodyParts.push(
        `<line x1="${padX}" y1="${curY + 30}" x2="${W - padX}" y2="${curY + 30}" stroke="${sec.isWarningSection ? '#D97706' : '#C8BEB0'}" stroke-width="1.2" opacity="0.7"/>`
      );
      curY += secHeaderH + 8;

      const rows = Math.ceil(sec.cards.length / cols);
      for (let r = 0; r < rows; r++) {
        const rowCards = sec.cards.slice(r * cols, (r + 1) * cols);
        for (let c = 0; c < rowCards.length; c++) {
          const card = rowCards[c];
          const x = padX + c * (cardW + gapX);
          const y = curY;
          const borderCol = card.isWarning ? '#D97706' : '#C8BEB0';
          const borderW = card.isWarning ? 2.5 : 1.2;
          const pillFill = card.isWarning ? '#FEF3C7' : '#F4EFE6';
          const titleFill = card.isWarning ? '#92400E' : '#2D2721';

          const inner = sanitizeSvgForResvg(card.svg, `c${cardGlobalIdx++}_`)
            .replace(/^<\?xml[^>]*>\s*/i, '')
            .replace(/<svg\b[^>]*>/i, '')
            .replace(/<\/svg>\s*$/i, '');

          bodyParts.push(`
            <g>
              <rect x="${x}" y="${y}" width="${cardW}" height="${labelH}" rx="4" fill="${pillFill}" stroke="${borderCol}" stroke-width="${borderW}"/>
              <text x="${x + 8}" y="${y + 16}" font-family="${CROSS_PLATFORM_SANS_FONT}" font-size="11.5" font-weight="bold" fill="${titleFill}">${escXml(card.badge)}</text>
              <text x="${x + 8}" y="${y + 31}" font-family="${CROSS_PLATFORM_SANS_FONT}" font-size="10" fill="#5C534A">${escXml(card.subBadge || '')}</text>
              <rect x="${x}" y="${y + labelH + 2}" width="${cardW}" height="${cardH}" fill="#EAE4D9" stroke="${borderCol}" stroke-width="${borderW}"/>
              <svg x="${x}" y="${y + labelH + 2}" width="${cardW}" height="${cardH}" viewBox="0 0 1080 1920">${inner}</svg>
            </g>
          `);
        }
        curY += labelH + 2 + cardH + gapY;
      }
      curY += secGap - gapY;
    }

    const H = curY + 12;
    const master = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <rect width="${W}" height="${H}" fill="#E6DED2"/>
      <rect x="${padX}" y="${padTop}" width="${W - padX * 2}" height="${bannerH}" rx="8" fill="#FAF6EF" stroke="#C8BEB0" stroke-width="1.4"/>
      <text x="${padX + 18}" y="${padTop + 30}" font-family="${CROSS_PLATFORM_SERIF_FONT}" font-size="22" font-weight="bold" fill="#1E1B18">${escXml(bannerTitle)}</text>
      <text x="${padX + 18}" y="${padTop + 56}" font-family="${CROSS_PLATFORM_SANS_FONT}" font-size="13.5" fill="#4A423A">${escXml(bannerMeta)}</text>
      ${bannerStatus ? `<text x="${padX + 18}" y="${padTop + 82}" font-family="${CROSS_PLATFORM_SANS_FONT}" font-size="12.5" font-weight="bold" fill="${bannerStatus.startsWith('[WARN]') ? '#B45309' : '#166534'}">${escXml(bannerStatus)}</text>` : ''}
      ${bodyParts.join('\n')}
    </svg>`;
    renderSvgStringToPngFile(master, W, out);
    return;
  }

  throw new Error(`Chế độ raster không hỗ trợ: ${mode}`);
}

// Giữ tên hàm cũ để tương thích mọi nhánh phụ trong file (--prop-sheet, --zoom-stage, --compare-pivot)
const rasterizeWithCoreSVG = rasterizeWithResvg;

function escXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


function estimateGeorgiaTextWidth(str, fontSize) {
  let w = 0;
  for (const ch of String(str)) {
    if (ch === ' ') w += fontSize * 0.28;
    else if ('iIlj.,;:!|'.includes(ch)) w += fontSize * 0.28;
    else if ('mMwW'.includes(ch)) w += fontSize * 0.82;
    else if (ch === '…') w += fontSize * 0.76;
    else if (ch === ch.toUpperCase() && ch !== ch.toLowerCase()) w += fontSize * 0.68;
    else w += fontSize * 0.505;
  }
  return w;
}

function renderSvgQuoteLineWithPivot(ln, seg, yPos, isPivotRedActive, palette, baseX = 154, fontSize = 40) {
  if (
    isPivotRedActive &&
    seg &&
    seg.containsPivot &&
    seg.pivotCharStartIndex >= 0 &&
    seg.pivotCharEndIndex > seg.pivotCharStartIndex
  ) {
    const pre = ln.slice(0, seg.pivotCharStartIndex);
    const piv = ln.slice(seg.pivotCharStartIndex, seg.pivotCharEndIndex);
    const post = ln.slice(seg.pivotCharEndIndex);
    return `<text x="${baseX}" y="${yPos}" font-family="${CROSS_PLATFORM_SERIF_FONT}" font-size="${fontSize}" fill="${palette.inkPrimary}">${escXml(pre)}<tspan font-weight="bold" fill="${palette.accentText}">${escXml(piv)}</tspan>${escXml(post)}</text>`;
  }
  return `<text x="${baseX}" y="${yPos}" font-family="${CROSS_PLATFORM_SERIF_FONT}" font-size="${fontSize}" fill="${palette.inkPrimary}">${escXml(ln)}</text>`;
}

function wrapViText(str, maxChars = 132) {
  const words = String(str || '').trim().split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (!cur) {
      cur = w;
    } else if (cur.length + 1 + w.length <= maxChars) {
      cur += ' ' + w;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function makeDummyPropState(typeName, isRed, variant) {
  const palette = THEME_PALETTES.MINIMAL_LIGHT;
  return {
    id: typeName,
    type: typeName,
    variant,
    layer: 'mid',
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    opacity: 1,
    color: isRed ? palette.accentProp : palette.inkPrimary,
    isAccentActive: isRed,
    loopProgress: 0,
    motionActivity: 0,
    travelDist: 0,
    drawProgress: 1,
    morphProgress: isRed ? 1 : 0,
    splitProgress: 0,
    floatAwayProgress: 0,
    emitters: {
      steam: 0,
      pulseRing: 0,
      spill: 0,
      glow: 0,
      color: palette.accentProp,
      steamColor: palette.inkSecondary,
    },
    spec: { id: typeName, type: typeName, variant },
  };
}

function renderSolidSilhouetteSvg(shapes, strokeWidth = 1.35) {
  const ink = '#1E1B18';
  return shapes
    .map((s) => {
      if (!s || s.show === 'after_pivot') return '';
      const isNegativeCarve =
        s.fill === 'bg' &&
        s.fillOpacity === 0 &&
        (s.strokeScale === undefined || s.strokeScale > 0);
      if (isNegativeCarve) return '';
      const hasFill = Boolean(s.fill) && s.fill !== 'none';
      const sw = s.strokeScale === 0 ? 0 : strokeWidth * (s.strokeScale ?? 1);
      const fillAttr = hasFill ? ink : 'none';
      const strokeAttr = sw > 0.01 ? ink : 'none';
      if (s.d) {
        return `<path d="${escXml(s.d)}" fill="${fillAttr}" stroke="${strokeAttr}" stroke-width="${sw.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
      if (s.rect) {
        const [rx, ry, rw, rh, rrad] = s.rect;
        return `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" rx="${rrad || 0}" fill="${fillAttr}" stroke="${strokeAttr}" stroke-width="${sw.toFixed(2)}"/>`;
      }
      if (s.circle) {
        const [cx, cy, r] = s.circle;
        return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fillAttr}" stroke="${strokeAttr}" stroke-width="${sw.toFixed(2)}"/>`;
      }
      if (s.ellipse) {
        const [cx, cy, rx, ry] = s.ellipse;
        return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fillAttr}" stroke="${strokeAttr}" stroke-width="${sw.toFixed(2)}"/>`;
      }
      if (s.line) {
        const [x1, y1, x2, y2] = s.line;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ink}" stroke-width="${Math.max(0.6, sw).toFixed(2)}" stroke-linecap="round"/>`;
      }
      return '';
    })
    .join('');
}

function buildStandardTimeline(id) {
  return computeTimelineSync({
    id,
    textFormat: 'POEM',
    segments: [
      'Dòng một mở cảnh nhẹ nhàng,',
      'Dòng hai nhịp bước sang ngang,',
      'Dòng ba lặng giữa chiều tàn,',
      'Dòng bốn chạm điểm lật vàng chu sa.',
    ],
    pivotWord: 'chu sa',
    highlightStyle: 'BOTH',
    targetDurationSeconds: 15,
    durationMode: 'FIXED',
    typingSpeedMsPerChar: 55,
    holdAfterFinishSeconds: 5.5,
    themeId: 'MINIMAL_LIGHT',
    motion: {
      archetype: 'BOULDER_TO_BENCH',
      pacingMode: 'CONTEMPLATIVE',
      stateA: { intensity: 0.5, spread: 0.3, tiltDeg: 0 },
      stateB: { intensity: 0.1, spread: 0.7, tiltDeg: 0 },
    },
    bgm: { audioMode: 'PIVOT_ACCENT', foleyPivotStyle: 'AUTO' },
    brandText: 'TRÀ NGUỘI',
  });
}

/**
 * Dựng cảnh thực tế cạnh Lữ khách đúng tỷ lệ 1:1 trong video (qua chính compileSemanticStageScript + DeclarativeStagePlayer)
 */
function buildTravelerScaleSceneSvg(typeName, targetX, targetY, viewW, viewH) {
  let sem;
  let caption = '';
  const isNonRedFurniture = !BUILT_IN_PROP_CATALOG[typeName]?.canBeRed;

  switch (typeName) {
    case 'hoa_don':
    default:
      caption = 'Mặc định: cam (tay cầm rủ xuống) + Trạng thái tua (dựng nghiêng tựa lịch bàn)';
      sem = {
        semanticVersion: 1,
        sceneId: 'PREVIEW_BILL',
        ten: 'Preview Bill',
        nhan_vat: [
          { id: 'hero', vi_tri: 'trai', huong: 'phai', tu_the: 'trao', lop: 'giua' },
        ],
        dao_cu: [
          { id: 'ban', type: 'std_work_desk', loai_neo: 'dat', vi_tri: 'giua_trai', lop: 'giua' },
          { id: 'lich', type: 'desk_calendar', loai_neo: 'tren', dat_tren: 'ban.mat_ban_phai', lop: 'giua' },
          { id: 'hd_tua', type: 'hoa_don', trang_thai: 'tua', loai_neo: 'tren', dat_tren: 'ban.mat_ban_giua', lop: 'giua' },
          { id: 'hd_tay', type: 'hoa_don', loai_neo: 'cam', cam_boi: 'hero.tay', lop: 'giua', vat_do: true },
        ],
        nhip: [{ moc: 'bat_dau', nhan_vat: { hero: { tu_the: 'trao' } } }],
      };
      break;
  }

  const timeline = buildStandardTimeline(`scene-${typeName}`);
  const val = validateAndCompileStageInput(sem, timeline);
  const relevantIssues = isNonRedFurniture
    ? val.issues.filter((x) => x.code !== 'RED_OBJECT_RULE')
    : val.issues;
  if (relevantIssues.length > 0) {
    throw new Error(
      `Cảnh mẫu cạnh Lữ khách của "${typeName}" không qua Validator:\n` +
        relevantIssues.map((x) => `  - ${x.message}`).join('\n')
    );
  }

  const renderScriptBase = isNonRedFurniture
    ? { ...val.compiledScript, legacy: true, strictValidation: false }
    : val.compiledScript;

  const sampleFrame = Math.min(timeline.pivotFrame - 30, 270);
  const mState = evaluateMotionState(
    sampleFrame,
    timeline.fps,
    timeline.pivotFrame,
    timeline.allTextFinishedFrame,
    timeline.durationInFrames,
    {
      archetype: 'BOULDER_TO_BENCH',
      pacingMode: 'CONTEMPLATIVE',
      stateA: { intensity: 0.5, spread: 0.3, tiltDeg: 0 },
      stateB: { intensity: 0.1, spread: 0.7, tiltDeg: 0 },
    }
  );

  const cleanScript = {
    ...renderScriptBase,
    tags: ['semantic_v1'],
    camera: { zoom: 1, panX: 0, panY: 0 },
  };

  const rawStageSvg = renderToStaticMarkup(
    React.createElement(DeclarativeStagePlayer, {
      script: cleanScript,
      state: mState,
      palette: THEME_PALETTES.MINIMAL_LIGHT,
      strokeWidth: LAYOUT_TOKENS.strokeWidth,
      frame: sampleFrame,
      fps: timeline.fps,
      durationInFrames: timeline.durationInFrames,
      timeline,
      stageBox: { width: viewW, height: viewH },
      showDebugBBoxes: false,
    })
  );

  const croppedSvg = rawStageSvg
    .replace(/width="[^"]*"/, `x="${targetX}" y="${targetY}" width="${viewW}"`)
    .replace(/height="[^"]*"/, `height="${viewH}"`)
    .replace(/viewBox="[^"]*"/, 'viewBox="142 268 142 96"');

  return { croppedSvg, caption };
}

/**
 * Dựng Ô so sánh: Lữ khách cầm chén trà trên tay (kiểm luật "chén trên bậu bằng chén trên tay") + hoa_don ở trạng thái `tua` dựng nghiêng tựa vật khác trên bàn
 */
function buildComparisonCardSvg(sx, sy, cardW, cardH) {
  const timeline = buildStandardTimeline('comparison-cup-and-bill');
  // Lấy mẫu sau pivot (timeline.pivotFrame + 60) để chén trà trên tay Lữ khách hiển thị 100% (trackCompiler ẩn chén trước pivot)
  const sampleFrame = timeline.pivotFrame + 60;
  const mState = evaluateMotionState(
    sampleFrame,
    timeline.fps,
    timeline.pivotFrame,
    timeline.allTextFinishedFrame,
    timeline.durationInFrames,
    {
      archetype: 'BOULDER_TO_BENCH',
      pacingMode: 'CONTEMPLATIVE',
      stateA: { intensity: 0.5, spread: 0.3, tiltDeg: 0 },
      stateB: { intensity: 0.1, spread: 0.7, tiltDeg: 0 },
    }
  );

  const s = DEFAULT_SCENE_SCALE; // 1.18 đồng nhất toàn cảnh
  const deskY = Number((-19.2 * s).toFixed(2)); // Mặt bàn y = -22.66
  const winY = WALL_MOUNT_Y_OFFSET; // -26
  const beCuaY = Number((winY - 2.2 * s).toFixed(2)); // -28.60

  const comparisonScript = {
    sceneId: 'COMPARISON_CUP_AND_BILL',
    name: 'Kiểm tra chén trên tay = chén trên bậu & hoa_don tựa nghiêng trên bàn',
    legacy: true,
    strictValidation: false,
    tags: ['semantic_v1'],
    terrain: { type: 'flat', y: 352, startX: 96, endX: 444 },
    camera: { zoom: 1, panX: 0, panY: 0 },
    actors: [
      {
        id: 'hero',
        rig: 'human',
        x: 156,
        yOffset: 0,
        scale: s,
        facing: 'right',
        pose: 'give',
        leanDeg: 0,
        sitProgress: 0,
        colorRole: 'ink',
        focusRole: 'hero',
        showTeaCup: 0,
        layer: 'mid',
      },
    ],
    props: [
      {
        id: 'chen_tay',
        type: 'small_cup',
        x: Number((156 + 17.5 * s).toFixed(2)),
        y: Number((-22.8 * s).toFixed(2)),
        scale: s,
        layer: 'mid',
        colorRole: 'ink',
        focusRole: 'hero',
        idle: 'none',
      },
      {
        id: 'cua_so',
        type: 'porch_window',
        x: 196,
        y: winY,
        scale: s,
        layer: 'far',
        colorRole: 'secondary',
        focusRole: 'ambient',
        idle: 'none',
      },
      {
        id: 'chen_be_cua',
        type: 'small_cup',
        x: 196,
        y: beCuaY,
        scale: s,
        layer: 'mid',
        colorRole: 'ink',
        focusRole: 'support',
        idle: 'none',
      },
      {
        id: 'ban_1',
        type: 'std_work_desk',
        x: 238,
        y: 0,
        scale: s,
        layer: 'mid',
        colorRole: 'ink',
        focusRole: 'support',
        idle: 'none',
      },
      {
        id: 'ban_2',
        type: 'std_work_desk',
        x: 282,
        y: 0,
        scale: s,
        layer: 'mid',
        colorRole: 'ink',
        focusRole: 'support',
        idle: 'none',
      },
      {
        id: 'vi',
        type: 'vi_tien',
        variant: 'khoa',
        x: 222,
        y: deskY,
        scale: s,
        layer: 'mid',
        colorRole: 'ink',
        focusRole: 'support',
        idle: 'none',
      },
      {
        id: 'thiep_moi',
        type: 'thiep',
        x: 243,
        y: deskY,
        scale: s,
        layer: 'mid',
        colorRole: 'ink',
        focusRole: 'support',
        idle: 'none',
      },
      {
        id: 'hd_tua',
        type: 'hoa_don',
        variant: 'tua',
        x: 272,
        y: deskY,
        scale: s,
        layer: 'mid',
        colorRole: 'accent',
        focusRole: 'hero',
        idle: 'none',
      },
      {
        id: 'lich',
        type: 'desk_calendar',
        x: 277,
        y: deskY,
        scale: s,
        layer: 'mid',
        colorRole: 'ink',
        focusRole: 'support',
        idle: 'none',
      },
      {
        id: 'thu',
        type: 'phong_bi',
        x: 296,
        y: deskY,
        scale: s,
        layer: 'mid',
        colorRole: 'ink',
        focusRole: 'support',
        idle: 'none',
      },
    ],
    timeline: [],
  };

  const viewX = sx + 22;
  const viewY = sy + 56;
  const viewW = cardW - 44;
  const viewH = 290;

  const rawStageSvg = renderToStaticMarkup(
    React.createElement(DeclarativeStagePlayer, {
      script: comparisonScript,
      state: mState,
      palette: THEME_PALETTES.MINIMAL_LIGHT,
      strokeWidth: LAYOUT_TOKENS.strokeWidth,
      frame: sampleFrame,
      fps: timeline.fps,
      durationInFrames: timeline.durationInFrames,
      timeline,
      stageBox: { width: viewW, height: viewH },
      showDebugBBoxes: false,
    })
  );

  const stageLabels = `
    <g font-family="Georgia" font-size="3.9" font-weight="bold" fill="#B45309" text-anchor="middle">
      <text x="152" y="286">Lữ khách cầm chén</text>
      <text x="176" y="315" fill="#166534">chén trên tay (7.0×5.0)</text>
      <text x="198" y="305" fill="#166534">chén trên bậu (7.0×5.0)</text>
      <text x="222" y="321">vi_tien</text>
      <text x="243" y="306">thiep</text>
      <text x="264" y="305" fill="#CE472E">hoa_don (tua vào lịch)</text>
      <text x="296" y="315">phong_bi</text>
    </g>
  `;

  const croppedSvg = rawStageSvg
    .replace(/width="[^"]*"/, `x="${viewX}" y="${viewY}" width="${viewW}"`)
    .replace(/height="[^"]*"/, `height="${viewH}"`)
    .replace(/viewBox="[^"]*"/, 'viewBox="134 268 184 96"')
    .replace(/<\/svg>$/, `${stageLabels}</svg>`);

  return `
    <g>
      <rect x="${sx}" y="${sy}" width="${cardW}" height="${cardH}" rx="14" fill="#FAF6EF" stroke="#B8AA96" stroke-width="2.2"/>
      <text x="${sx + 22}" y="${sy + 31}" font-family="Georgia" font-size="21" font-weight="bold" fill="#1E1B18">2. Ô SO SÁNH: LỮ KHÁCH CẦM CHÉN TRÀ TRÊN TAY &amp; HOÁ ĐƠN TỰA NGHIÊNG TRÊN BÀN</text>
      <text x="${sx + 22}" y="${sy + 48}" font-family="Georgia" font-size="13" fill="#5C534A">Kiểm luật: Chén trên bậu cửa (small_cup) = Chén trên tay Lữ khách (7.0 × 5.0, cùng scale ${DEFAULT_SCENE_SCALE})  •  hoa_don trạng thái "tua" dựng nghiêng tựa vào lịch bàn</text>
      <rect x="${viewX}" y="${viewY}" width="${viewW}" height="${viewH}" rx="10" fill="#F1EAE0" stroke="#D4C8B8" stroke-width="1.3"/>
      ${croppedSvg}
      <text x="${sx + 28}" y="${sy + 382}" font-family="Georgia" font-size="14" font-weight="bold" fill="#166534">✓ Chén trên tay Lữ khách (pose drink, sau điểm lật) và chén trên bậu cửa dùng chung thông số thân 7.0 × 5.0 + vành miệng elip.</text>
      <text x="${sx + 28}" y="${sy + 408}" font-family="Georgia" font-size="14" font-weight="bold" fill="#1E1B18">✓ hoa_don bỏ hoàn toàn bản nằm phẳng; mặc định là "cam" (tay cầm rủ xuống), khi đặt lên bàn dùng trạng thái "tua" (dựng nghiêng tựa vật khác).</text>
    </g>
  `;
}

function buildCleanAnchorCallouts(anchors, originX, originY, scaleViz) {
  const entries = Object.entries(anchors || {});
  if (entries.length === 0) return '';

  const sorted = [...entries].sort((a, b) => a[1][0] - b[1][0]);
  const n = sorted.length;

  return sorted
    .map(([aName, [ax, ay]], idx) => {
      const px = originX + ax * scaleViz;
      const py = originY + ay * scaleViz;

      let labelX = px;
      let labelY = py - 22;
      let anchorAlign = 'middle';

      if (n >= 3) {
        if (idx === 0) {
          labelX = px - 26;
          labelY = py - 18;
          anchorAlign = 'end';
        } else if (idx === n - 1) {
          labelX = px + 26;
          labelY = py - 18;
          anchorAlign = 'start';
        } else {
          labelX = px;
          labelY = py - 34;
          anchorAlign = 'middle';
        }
      } else if (n === 2) {
        labelX = idx === 0 ? px - 20 : px + 20;
        labelY = py - 20;
        anchorAlign = idx === 0 ? 'end' : 'start';
      }

      const lineEndY = labelY + 4;
      const lineEndX =
        anchorAlign === 'end'
          ? labelX + 4
          : anchorAlign === 'start'
            ? labelX - 4
            : labelX;

      return `
        <line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${lineEndX.toFixed(1)}" y2="${lineEndY.toFixed(1)}" stroke="#EA580C" stroke-width="1.2"/>
        <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4.8" fill="#EA580C" stroke="#FFFFFF" stroke-width="1.4"/>
        <text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="${anchorAlign}" font-family="Georgia" font-size="12.5" font-weight="bold" fill="#C2410C">${escXml(aName)}</text>
      `;
    })
    .join('');
}

/**
 * Xuất Tờ duyệt: CHỈ dựng lại các món vừa sửa trong APPROVAL_BATCH_PROP_NAMES + Ô so sánh
 */
function generateApprovalSheet(outPath) {
  const catalogIssues = validateCatalogPropsHard();
  if (catalogIssues.length > 0) {
    console.error(`❌ PHÁT HIỆN ${catalogIssues.length} LỖI TRONG PROPCATALOG:`);
    for (const iss of catalogIssues) {
      console.error(`   - [${iss.code}] ${iss.message}`);
    }
    process.exit(1);
  }

  const palette = THEME_PALETTES.MINIMAL_LIGHT;
  const totalCards = APPROVAL_BATCH_PROP_NAMES.length + 1;
  const cols = 2;
  const rowsCount = Math.ceil(totalCards / cols);
  const W = 2640;
  const cardW = 1230;
  const cardH = 446;
  const startX = 60;
  const startY = 142;
  const gapX = 60;
  const gapY = 28;
  const H = startY + rowsCount * cardH + (rowsCount - 1) * gapY + 52;

  const cardsSvg = APPROVAL_BATCH_PROP_NAMES.map((typeName, idx) => {
    const def = BUILT_IN_PROP_CATALOG[typeName];
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = startX + col * (cardW + gapX);
    const cy = startY + row * (cardH + gapY);

    const box = def.box || [-8, -8, 8, 0];
    const anchors = def.anchors || {};
    const canRed = Boolean(def.canBeRed);
    const isHandDefault = def.anchorKind === 'cam';
    const isWallProp = def.anchorKind === 'tuong';
    const realCm = def.kich_thuoc_that || 15;
    const expectedSpan = computeExpectedCatalogSpanFromCm(realCm);
    const actualSpan = Math.max(box[2] - box[0], box[3] - box[1]);
    const devPct = (((actualSpan - expectedSpan) / expectedSpan) * 100).toFixed(1);

    const redCmp = compareNormalAndRedSilhouette(def.shapes, def.altShapes);

    const normalState = makeDummyPropState(typeName, false);
    const normalInner = renderToStaticMarkup(
      React.createElement(
        'svg',
        null,
        renderShapeListStatic(def.shapes, normalState, palette, 1.35, false)
      )
    )
      .replace(/^<svg[^>]*>/, '')
      .replace(/<\/svg>$/, '');

    let redInner = '';
    if (canRed) {
      const redState = makeDummyPropState(typeName, true);
      const activeRedShapes =
        def.altShapes && def.altShapes.length > 0 ? def.altShapes : def.shapes;
      redInner = renderToStaticMarkup(
        React.createElement(
          'svg',
          null,
          renderShapeListStatic(activeRedShapes, redState, palette, 1.35, true)
        )
      )
        .replace(/^<svg[^>]*>/, '')
        .replace(/<\/svg>$/, '');
    }

    const spanMax = Math.max(12, box[3] - box[1], box[2] - box[0]);
    const scaleViz = Math.min(6.2, Math.max(2.9, 110 / spanMax));

    // Ô 1: Kỹ thuật gốc (0,0) + Hộp bao + Điểm neo
    const p1X = cx + 18;
    const p1Y = cy + 54;
    const p1W = 378;
    const p1H = 290;
    const originX = p1X + p1W * 0.5;
    const groundRefY = p1Y + 236;
    const originY = isHandDefault ? p1Y + 86 : isWallProp ? p1Y + 190 : groundRefY;

    const anchorCalloutsSvg = buildCleanAnchorCallouts(
      anchors,
      originX,
      originY,
      scaleViz
    );

    // Ô 2: Bản đỏ Chu Sa + Biến thể (`tua`) + Bóng dáng (Silhouette)
    const p2X = cx + 408;
    const p2Y = cy + 54;
    const p2W = 376;
    const p2H = 290;
    const silSvg = renderSolidSilhouetteSvg(def.shapes, 1.35);

    let p2ContentSvg = '';
    if (typeName === 'hoa_don' && def.variants?.tua) {
      const tDef = def.variants.tua;
      const tBox = tDef.box || [-5.1, -12.4, 5.3, 0];
      const tNorm = renderToStaticMarkup(
        React.createElement(
          'svg',
          null,
          renderShapeListStatic(
            tDef.shapes,
            makeDummyPropState(typeName, false, 'tua'),
            palette,
            1.35,
            false
          )
        )
      )
        .replace(/^<svg[^>]*>/, '')
        .replace(/<\/svg>$/, '');
      const tRed = renderToStaticMarkup(
        React.createElement(
          'svg',
          null,
          renderShapeListStatic(
            tDef.altShapes || tDef.shapes,
            makeDummyPropState(typeName, true, 'tua'),
            palette,
            1.35,
            true
          )
        )
      )
        .replace(/^<svg[^>]*>/, '')
        .replace(/<\/svg>$/, '');
      p2ContentSvg = `
        <g transform="translate(${p2X + 66}, ${p2Y + 86}) scale(5.4)">${redInner}</g>
        <text x="${p2X + 66}" y="${p2Y + 232}" text-anchor="middle" font-family="Georgia" font-size="12" font-weight="bold" fill="#CE472E">cam (mặc định đỏ)</text>
        <line x1="${p2X + 128}" y1="${p2Y + 204}" x2="${p2X + 292}" y2="${p2Y + 204}" stroke="#9A9087" stroke-width="1.2" stroke-dasharray="4 3"/>
        <g transform="translate(${p2X + 168}, ${p2Y + 204}) scale(5.4)">
          ${tNorm}
          <rect x="${tBox[0]}" y="${tBox[1]}" width="${tBox[2] - tBox[0]}" height="${tBox[3] - tBox[1]}" fill="none" stroke="#2563EB" stroke-opacity="0.45" stroke-width="0.22" stroke-dasharray="0.6 0.5"/>
        </g>
        <text x="${p2X + 168}" y="${p2Y + 232}" text-anchor="middle" font-family="Georgia" font-size="12" fill="#1E1B18">tua (dựng nghiêng)</text>
        <g transform="translate(${p2X + 252}, ${p2Y + 204}) scale(5.4)">${tRed}</g>
        <text x="${p2X + 252}" y="${p2Y + 232}" text-anchor="middle" font-family="Georgia" font-size="12" font-weight="bold" fill="#CE472E">tua (bản đỏ)</text>
        <g transform="translate(${p2X + 330}, ${p2Y + 86}) scale(5.0)">${silSvg}</g>
        <text x="${p2X + 330}" y="${p2Y + 232}" text-anchor="middle" font-family="Georgia" font-size="12" fill="#1E1B18">Bóng đen</text>
      `;
    }

    // Ô 3: Cảnh đứng cạnh Lữ khách đúng tỷ lệ thật trong video
    const p3X = cx + 796;
    const p3Y = cy + 54;
    const p3W = 416;
    const p3H = 290;
    const sceneViz = buildTravelerScaleSceneSvg(
      typeName,
      p3X + 4,
      p3Y + 24,
      p3W - 8,
      p3H - 52
    );

    const allowedNeo = (def.allowedAnchorKinds || [def.anchorKind || 'dat']).join('/');
    const iouBadge = canRed
      ? `IoU=${(redCmp.silhouetteIoU * 100).toFixed(0)}%`
      : 'Không làm vật đỏ';

    return `
      <g>
        <rect x="${cx}" y="${cy}" width="${cardW}" height="${cardH}" rx="14" fill="#FAF6EF" stroke="#D4C8B8" stroke-width="2"/>
        <text x="${cx + 20}" y="${cy + 31}" font-family="Georgia" font-size="21" font-weight="bold" fill="#1E1B18">${idx + 1}. ${escXml(typeName)} — ${escXml(def.labelVi || '')}</text>
        <text x="${cx + 20}" y="${cy + 47}" font-family="Georgia" font-size="12.5" fill="#6B6259">cỡ thật: ${realCm}cm  •  tính: ${expectedSpan.toFixed(1)}  •  thực: ${actualSpan.toFixed(1)} (${devPct >= 0 ? '+' : ''}${devPct}%)  •  lớp: ${escXml(def.defaultLayer)}  •  neo: ${escXml(allowedNeo)}  •  ${escXml(iouBadge)}</text>
        <rect x="${cx + cardW - 92}" y="${cy + 13}" width="72" height="26" rx="13" fill="#FEF3C7" stroke="#D97706" stroke-width="1.2"/>
        <text x="${cx + cardW - 56}" y="${cy + 31}" text-anchor="middle" font-family="Georgia" font-size="13.5" font-weight="bold" fill="#B45309">${escXml(def.status || 'nhap')}</text>

        <!-- Ô 1: Kỹ thuật gốc (0,0) + box + điểm neo -->
        <rect x="${p1X}" y="${p1Y}" width="${p1W}" height="${p1H}" rx="9" fill="#F4EFE6" stroke="#E2D8C8" stroke-width="1"/>
        <text x="${p1X + 12}" y="${p1Y + 18}" font-family="Georgia" font-size="12" font-weight="bold" fill="#5C534A">Mặc định: cam (tay cầm) • Gốc (0,0) • Box [${box.map((n) => Number(n.toFixed(1))).join(', ')}]</text>
        <g transform="translate(${originX.toFixed(1)}, ${originY.toFixed(1)}) scale(${scaleViz.toFixed(3)})">
          ${normalInner}
          <rect x="${box[0]}" y="${box[1]}" width="${box[2] - box[0]}" height="${box[3] - box[1]}" fill="none" stroke="#2563EB" stroke-width="${(1.4 / scaleViz).toFixed(2)}" stroke-dasharray="${(3.8 / scaleViz).toFixed(2)} ${(2.8 / scaleViz).toFixed(2)}"/>
        </g>
        <line x1="${originX - 8}" y1="${originY}" x2="${originX + 8}" y2="${originY}" stroke="#16A34A" stroke-width="2"/>
        <line x1="${originX}" y1="${originY - 8}" x2="${originX}" y2="${originY + 8}" stroke="#16A34A" stroke-width="2"/>
        <circle cx="${originX}" cy="${originY}" r="3.4" fill="#16A34A"/>
        ${anchorCalloutsSvg}
        <text x="${originX}" y="${p1Y + p1H - 12}" text-anchor="middle" font-family="Georgia" font-size="11" fill="#4A433C">Gốc (0, 0) tại điểm tay cầm • Giấy rủ cong xuống dưới</text>

        <!-- Ô 2: Bản đỏ Chu Sa + Biến thể tua + Bóng đen (Silhouette) -->
        <rect x="${p2X}" y="${p2Y}" width="${p2W}" height="${p2H}" rx="9" fill="#F4EFE6" stroke="#E2D8C8" stroke-width="1"/>
        <text x="${p2X + 12}" y="${p2Y + 18}" font-family="Georgia" font-size="12" font-weight="bold" fill="#5C534A">Bản Đỏ Chu Sa • Trạng thái "tua" (dựng nghiêng) • Bóng dáng</text>
        ${p2ContentSvg}

        <!-- Ô 3: Hình đứng cạnh Lữ khách đúng tỷ lệ thật trong video -->
        <rect x="${p3X}" y="${p3Y}" width="${p3W}" height="${p3H}" rx="9" fill="#F1EAE0" stroke="#D4C8B8" stroke-width="1.2"/>
        <text x="${p3X + 12}" y="${p3Y + 18}" font-family="Georgia" font-size="12" font-weight="bold" fill="#1E1B18">Đứng cạnh Lữ khách (tỷ lệ thật 1:1)</text>
        ${sceneViz.croppedSvg}
        <text x="${p3X + p3W * 0.5}" y="${p3Y + p3H - 12}" text-anchor="middle" font-family="Georgia" font-size="11.2" fill="#5C534A">${escXml(sceneViz.caption)}</text>

        <!-- Tóm tắt sửa đổi ngắn gọn (Quy tắc 3: sửa vật cũ không cần mô tả 5 câu) -->
        <text x="${cx + 22}" y="${cy + 378}" font-family="Georgia" font-size="14" font-weight="bold" fill="#1E1B18">✓ Đã đổi mặc định sang "cam" (tay cầm rủ xuống, box [-3.5, -1.8, 3.5, 11.4]) và bỏ hoàn toàn trạng thái nằm phẳng.</text>
        <text x="${cx + 22}" y="${cy + 404}" font-family="Georgia" font-size="14" font-weight="bold" fill="#1E1B18">✓ Đã thêm trạng thái "tua" (box [-5.1, -12.4, 5.3, 0]): dựng nghiêng tựa vào vật khác khi đặt trên bàn.</text>
      </g>
    `;
  });

  // Ô bên cạnh: Ô so sánh Lữ khách cầm chén trà trên tay + hoa_don tựa nghiêng trên bàn
  const compIdx = APPROVAL_BATCH_PROP_NAMES.length;
  const compCol = compIdx % cols;
  const compRow = Math.floor(compIdx / cols);
  const compX = startX + compCol * (cardW + gapX);
  const compY = startY + compRow * (cardH + gapY);
  const comparisonCardSvg = buildComparisonCardSvg(compX, compY, cardW, cardH);

  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#EAE1D3"/>
    <text x="60" y="64" font-family="Georgia" font-size="33" font-weight="bold" fill="#1E1B18">TỜ DUYỆT BỔ SUNG — SỬA HOA_DON (CAM &amp; TUA) + Ô SO SÁNH CHÉN TRÊN TAY</text>
    <text x="60" y="104" font-family="Georgia" font-size="18" fill="#5C534A">Đã chuyển sang "duyet": vi_tien, thiep, phong_bi, porch_window, small_cup (cùng 6 món đợt trước)  •  Chỉ dựng lại món vừa sửa: hoa_don</text>
    ${cardsSvg.join('\n')}
    ${comparisonCardSvg}
  </svg>`;

  rasterizeWithCoreSVG({ mode: 'single', svg: fullSvg, w: W, h: H, out: outPath });
  console.log(`✅ Đã xuất Tờ duyệt (chỉ dựng lại hoa_don + Ô so sánh): ${path.relative(ROOT, outPath)}`);
}

/**
 * Chia dòng văn bản tiếng Việt theo độ rộng tối đa (px) và vẫn giữ vị trí cụm pivotWord để tô đỏ bằng <tspan>.
 */
function wrapQuoteSegmentForSvg(rawText, seg, maxWidthPx, fontSize) {
  const clean = stripInlineMarkdown(String(rawText || ''));
  const words = clean.split(/(\s+)/).filter((t) => t.length > 0);
  const wrapped = [];
  let curText = '';
  let curStart = 0;
  let cursor = 0;

  for (const tok of words) {
    const isSpace = /^\s+$/.test(tok);
    if (!curText && isSpace) {
      cursor += tok.length;
      curStart = cursor;
      continue;
    }
    const candidate = curText + tok;
    if (curText && !isSpace && estimateGeorgiaTextWidth(candidate, fontSize) > maxWidthPx) {
      wrapped.push({ text: curText.trimEnd(), startIdx: curStart });
      curText = tok;
      curStart = cursor;
    } else {
      curText = candidate;
    }
    cursor += tok.length;
  }
  if (curText.trim().length > 0) {
    wrapped.push({ text: curText.trimEnd(), startIdx: curStart });
  }
  if (wrapped.length === 0) {
    wrapped.push({ text: clean, startIdx: 0 });
  }

  return wrapped.map((wLine) => {
    const endIdx = wLine.startIdx + wLine.text.length;
    const hasPiv =
      Boolean(seg?.containsPivot) &&
      seg.pivotCharStartIndex >= 0 &&
      seg.pivotCharEndIndex > seg.pivotCharStartIndex;
    if (!hasPiv) {
      return { text: wLine.text, pivStart: -1, pivEnd: -1 };
    }
    const ovStart = Math.max(wLine.startIdx, seg.pivotCharStartIndex);
    const ovEnd = Math.min(endIdx, seg.pivotCharEndIndex);
    if (ovEnd > ovStart) {
      return {
        text: wLine.text,
        pivStart: ovStart - wLine.startIdx,
        pivEnd: ovEnd - wLine.startIdx,
      };
    }
    return { text: wLine.text, pivStart: -1, pivEnd: -1 };
  });
}

function renderWrappedQuoteLineSvg(wLine, x, y, fontSize, isPivotRedActive, palette, opacity) {
  const opStr = opacity.toFixed(3);
  if (isPivotRedActive && wLine.pivStart >= 0 && wLine.pivEnd > wLine.pivStart) {
    const pre = wLine.text.slice(0, wLine.pivStart);
    const piv = wLine.text.slice(wLine.pivStart, wLine.pivEnd);
    const post = wLine.text.slice(wLine.pivEnd);
    return `<text x="${x}" y="${y}" font-family="${CROSS_PLATFORM_SERIF_FONT}" font-size="${fontSize}" fill="${palette.inkPrimary}" opacity="${opStr}">${escXml(pre)}<tspan font-weight="600" fill="${palette.accentText}">${escXml(piv)}</tspan>${escXml(post)}</text>`;
  }
  return `<text x="${x}" y="${y}" font-family="${CROSS_PLATFORM_SERIF_FONT}" font-size="${fontSize}" fill="${palette.inkPrimary}" opacity="${opStr}">${escXml(wLine.text)}</text>`;
}

/**
 * Dựng 1 khung hình 1080×1920 khớp luồng Remotion Studio thật
 * (cùng timelineSync, visualDNA, layoutGeometry, stageTuning, DeclarativeStagePlayer, khối chữ & header).
 */
function renderStudioMatchedFrameSvg({
  script,
  resolvedCupProps,
  cupNumberLabel,
  timeline,
  palette,
  vdna,
  geo,
  frame,
  showBBox,
}) {
  const fps = timeline.fps;
  const safeTotalFrames = Math.max(2, timeline.durationInFrames);
  const segs = timeline.segmentTimings || [];
  const lines = resolvedCupProps.segments || [];

  const mState = evaluateMotionState(
    frame,
    fps,
    timeline.pivotFrame,
    timeline.allTextFinishedFrame,
    timeline.durationInFrames,
    resolvedCupProps.motion
  );

  const tuning = resolvedCupProps.stageTuning || {
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    strokeScale: 1,
  };
  const isSemanticScript = Boolean(script.tags?.includes('semantic_v1'));
  const effOffsetX = isSemanticScript ? 0 : tuning.offsetX || 0;
  const effOffsetY = isSemanticScript ? 0 : tuning.offsetY || 0;
  const effScale = isSemanticScript ? 1 : tuning.scale || 1;
  const tunedStrokeWidth = Number(
    (LAYOUT_TOKENS.strokeWidth * (tuning.strokeScale ?? 1)).toFixed(2)
  );

  const stageMarkup = renderToStaticMarkup(
    React.createElement(DeclarativeStagePlayer, {
      script,
      state: mState,
      palette,
      strokeWidth: tunedStrokeWidth,
      frame,
      fps,
      durationInFrames: timeline.durationInFrames,
      timeline,
      visualDNA: vdna,
      stageBox: {
        width: geo.stageWidth,
        height: geo.stageHeight,
      },
      frameMode: geo.stageFrameMode,
      showDebugBBoxes: showBBox,
    })
  );

  // Header fade khớp 100% MinimalistBackground.tsx
  let headerOpacity = 1;
  if (frame <= timeline.headerDissolveStartFrame) {
    headerOpacity = 1;
  } else if (frame < timeline.headerDissolveEndFrame) {
    const span = Math.max(1, timeline.headerDissolveEndFrame - timeline.headerDissolveStartFrame);
    const u = Math.max(0, Math.min(1, (frame - timeline.headerDissolveStartFrame) / span));
    headerOpacity = 1 - (0.5 - 0.5 * Math.cos(Math.PI * u));
  } else if (frame < timeline.loopRestoreStartFrame) {
    headerOpacity = 0;
  } else {
    const span = Math.max(1, safeTotalFrames - 1 - timeline.loopRestoreStartFrame);
    const u = Math.max(0, Math.min(1, (frame - timeline.loopRestoreStartFrame) / span));
    headerOpacity = 0.5 - 0.5 * Math.cos(Math.PI * u);
  }

  const rawTitle = String(resolvedCupProps.title || script.name || '').trim().toUpperCase();
  const headerText = cupNumberLabel
    ? `CHÉN ${cupNumberLabel}${rawTitle ? ` — ${rawTitle}` : ''}`
    : rawTitle;

  // Khối chữ khớp AdaptiveTypography.tsx (railOffsetPx=28, sàn minFontSize=38, topSpacerMaxPx)
  const fontSizeScale = resolvedCupProps.fontSizeScale ?? 1.0;
  const quoteFontSize = Math.max(
    LAYOUT_TOKENS.typography.minFontSize,
    Math.round(46 * fontSizeScale)
  );
  const lineHeightPx = Math.round(quoteFontSize * 1.48);
  const rowGapPx = 18;
  const textX = geo.typographyLeft + LAYOUT_TOKENS.typography.railOffsetPx;
  const maxTextW = geo.typographyMaxWidth || 788;

  const isPivotActive = frame >= timeline.pivotFrame;
  const fadeFrames = Math.max(1, Math.round(1.05 * fps));
  const blockTopY = geo.typographyTop + Math.round(geo.topSpacerMaxPx || 145);
  let curY = blockTopY;
  const textEls = [];
  let visibleBlockBottom = blockTopY;
  let anyVisibleLine = false;

  for (let lIdx = 0; lIdx < lines.length; lIdx++) {
    const st = segs[lIdx]?.startFrame ?? lIdx * 90;
    const wrappedLines = wrapQuoteSegmentForSvg(lines[lIdx], segs[lIdx], maxTextW, quoteFontSize);
    const lineOp =
      frame < st ? 0 : Math.min(1, (frame - st) / fadeFrames);

    for (let wi = 0; wi < wrappedLines.length; wi++) {
      const baselineY = curY + quoteFontSize;
      if (lineOp > 0.01) {
        anyVisibleLine = true;
        textEls.push(
          renderWrappedQuoteLineSvg(
            wrappedLines[wi],
            textX,
            baselineY,
            quoteFontSize,
            isPivotActive,
            palette,
            lineOp
          )
        );
        visibleBlockBottom = baselineY + 12;
      }
      curY += lineHeightPx;
    }
    curY += rowGapPx;
  }

  const barHeight = anyVisibleLine
    ? Math.max(48, visibleBlockBottom - blockTopY)
    : 0;
  const sealOp =
    frame >= timeline.allTextFinishedFrame
      ? Math.min(1, (frame - timeline.allTextFinishedFrame) / Math.round(0.6 * fps))
      : 0;
  const sealText = `• ${String(resolvedCupProps.brandText || 'TRÀ NGUỘI').toUpperCase()}`;

  // Stage container transform (khớp MotionStageRouter: translate(effOffset) scale(effScale) quanh 50% 62.5%)
  const ox = geo.stageWidth * 0.5;
  const oy = geo.stageHeight * 0.625;
  const stageTransform =
    effOffsetX !== 0 || effOffsetY !== 0 || Math.abs(effScale - 1) > 0.0001
      ? `translate(${geo.stageLeft + effOffsetX + ox}, ${geo.stageTop + effOffsetY + oy}) scale(${effScale}) translate(${-ox}, ${-oy})`
      : `translate(${geo.stageLeft}, ${geo.stageTop})`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
    <defs>
      <clipPath id="stage-box-clip">
        <rect x="${geo.stageLeft}" y="${geo.stageTop}" width="${geo.stageWidth}" height="${geo.stageHeight}"/>
      </clipPath>
    </defs>
    <rect width="1080" height="1920" fill="${palette.background}"/>
    ${
      headerOpacity > 0.01 && headerText
        ? `<g opacity="${headerOpacity.toFixed(3)}">
            <text x="132" y="298" font-family="${CROSS_PLATFORM_SANS_FONT}" font-size="22" letter-spacing="4" fill="${palette.inkSecondary}">${escXml(headerText)}</text>
            <circle cx="944" cy="291" r="4" fill="${palette.accentText}"/>
            <line x1="132" y1="316" x2="948" y2="316" stroke="${palette.inkSecondary}" stroke-width="1.2" opacity="0.3"/>
          </g>`
        : ''
    }
    <g clip-path="url(#stage-box-clip)">
      <g transform="${stageTransform}">
        ${stageMarkup}
      </g>
    </g>
    ${
      barHeight > 0
        ? `<rect x="${geo.typographyLeft}" y="${blockTopY + 4}" width="4.5" height="${barHeight}" rx="2" fill="${palette.accentText}" opacity="0.88"/>`
        : ''
    }
    ${textEls.join('\n')}
    ${
      sealOp > 0.01
        ? `<text x="${textX}" y="${visibleBlockBottom + 44}" font-family="${CROSS_PLATFORM_SANS_FONT}" font-size="18" letter-spacing="4" fill="${palette.inkSecondary}" opacity="${(sealOp * 0.78).toFixed(3)}">${escXml(sealText)}</text>`
        : ''
    }
  </svg>`;
}

/**
 * Xuất ảnh Director Preview thống nhất cho cả Gói Chén lẫn Làn tự do (`che_do: "tu_do"`):
 * - Cùng seed, thời lượng AUTO_SEED, visualDNA, layoutGeometry và camera như Studio thật.
 * - Gồm: 6 khung tổng quan + 8 khung dày quanh cú lật (pivot -0.5s → +3.0s) + mỗi thời điểm t mà TF1 cảnh báo.
 * - Đầu ảnh in: mã commit + thời lượng + seed.
 */
function renderSixFramePreview(
  targetArg,
  showBBox,
  outOverride,
  allowInvalid,
  sceneIdArg,
  singleFrameArg
) {
  const fullPath = path.resolve(ROOT, targetArg);
  const rawFileJson = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

  let rawJson = rawFileJson;
  if (sceneIdArg && rawFileJson && typeof rawFileJson === 'object' && !Array.isArray(rawFileJson)) {
    if (!(sceneIdArg in rawFileJson)) {
      throw new Error(`Không tìm thấy "${sceneIdArg}" trong ${targetArg}`);
    }
    rawJson = rawFileJson[sceneIdArg];
  }

  let cupProps = null;
  let scriptInput = null;
  let cupNumberLabel = '';
  let baseName = sceneIdArg || path.basename(targetArg, '.json');
  let modeLabel = 'StageScript';

  if (isGoiChen(rawJson)) {
    modeLabel = 'Gói Chén';
    const parsed = parseGoiChen(rawJson);
    if (!parsed.ok && !allowInvalid) {
      console.error(`❌ CHẶN RENDER GÓI CHÉN [${baseName}] — ${parsed.errors.length} lỗi:`);
      for (const err of parsed.errors) {
        console.error(`   - ${err}`);
      }
      process.exit(1);
    }
    scriptInput = parsed.compiled;
    cupProps = {
      id: parsed.compiled?.sceneId || baseName,
      title: parsed.tieuDe || baseName,
      segments: parsed.cau || [],
      pivotWord: parsed.cuLat || '',
      themeId: 'MINIMAL_LIGHT',
      targetDurationSeconds: 15,
      durationMode: 'AUTO_SEED',
      textFormat: 'POEM',
    };
  } else if (rawJson.props && rawJson.cupNumber) {
    cupProps = rawJson.props;
    cupNumberLabel = String(rawJson.cupNumber).padStart(2, '0');
    const sid = cupProps.motion?.sceneId || cupProps.motion?.archetype;
    scriptInput = resolveStageScript(sid, cupProps.motion?.stageScript);
    baseName = `chen-${cupNumberLabel}`;
    modeLabel =
      scriptInput?.che_do === 'tu_do'
        ? 'Làn tự do (che_do: tu_do)'
        : scriptInput?.tags?.includes('semantic_v1')
          ? 'Gói Chén'
          : 'CupRecord';
  } else if (
    rawJson.stageScript &&
    typeof rawJson.stageScript === 'object' &&
    Array.isArray(rawJson.segments)
  ) {
    // CupBundle bọc stageScript (vd Làn tự do `che_do: "tu_do"`)
    scriptInput = resolveStageScript(rawJson.stageScript.sceneId, rawJson.stageScript);
    cupProps = {
      id: rawJson.cupId || rawJson.id || scriptInput?.sceneId || baseName,
      title: rawJson.title || scriptInput?.name || baseName,
      segments: rawJson.segments,
      pivotWord: rawJson.pivotWord || '',
      themeId: rawJson.themeId || 'MINIMAL_LIGHT',
      fontSizeScale: rawJson.fontSizeScale,
      stageTuning: rawJson.stageTuning,
      visualDNA: rawJson.visualDNA,
      targetDurationSeconds: rawJson.targetDurationSeconds || 15,
      durationMode: rawJson.durationMode || 'AUTO_SEED',
      textFormat: rawJson.textFormat || 'POEM',
    };
    modeLabel =
      scriptInput?.che_do === 'tu_do' ? 'Làn tự do (che_do: tu_do)' : 'CupBundle';
  } else if (isSemanticStageScript(rawJson)) {
    scriptInput = rawJson;
    modeLabel = 'SemanticStageScript';
  } else {
    scriptInput = resolveStageScript(rawJson.sceneId, rawJson);
    if (scriptInput?.che_do === 'tu_do') {
      modeLabel = 'Làn tự do (che_do: tu_do)';
    }
  }

  if (!scriptInput) {
    throw new Error(`Không tìm thấy kịch bản sân khấu cho: ${targetArg}`);
  }

  const effectiveDurationMode = cupProps?.durationMode || 'AUTO_SEED';
  const defaultFallbackSegments =
    scriptInput.sceneId === 'SCRIPT_C19_NET_DAT_NAY_MAM'
      ? [
          'Chỉ có hai cách để sống một cuộc đời:',
          'Một là chẳng có gì là kỳ diệu.',
          'Hai là xem mọi thứ đều là điều kỳ diệu.',
        ]
      : [
          'Tháng năm tất tả chưa từng dừng,',
          'Tiền chưa đầy túi đã đau lưng.',
          'Lắm hôm mệt quá toan buông xuống,',
          'Nhìn tờ hóa đơn… lại khỏe tưng!',
        ];
  const defaultFallbackPivot =
    scriptInput.sceneId === 'SCRIPT_C19_NET_DAT_NAY_MAM'
      ? 'điều kỳ diệu'
      : 'lại khỏe tưng';

  const resolvedCupProps = {
    id: cupProps?.id || scriptInput.sceneId || baseName,
    title: cupProps?.title || scriptInput.name || baseName,
    textFormat: cupProps?.textFormat || 'POEM',
    fontSizeScale: cupProps?.fontSizeScale ?? 1.0,
    segments: cupProps?.segments || defaultFallbackSegments,
    pivotWord: (cupProps?.pivotWord || defaultFallbackPivot).replace(/[!?.…]+$/u, ''),
    highlightStyle: 'BOTH',
    targetDurationSeconds: cupProps?.targetDurationSeconds || 15,
    durationMode: effectiveDurationMode,
    typingSpeedMsPerChar: cupProps?.typingSpeedMsPerChar || 55,
    holdAfterFinishSeconds: cupProps?.holdAfterFinishSeconds || 5.5,
    themeId: cupProps?.themeId || 'MINIMAL_LIGHT',
    stageTuning: cupProps?.stageTuning,
    visualDNA: cupProps?.visualDNA,
    motion: cupProps?.motion || {
      archetype: 'BOULDER_TO_BENCH',
      pacingMode: 'CONTEMPLATIVE',
      stateA: { intensity: 0.8, spread: 0.2, tiltDeg: -16 },
      stateB: { intensity: 0.1, spread: 0.75, tiltDeg: 0 },
    },
    bgm: { audioMode: 'NONE', foleyPivotStyle: 'AUTO' },
    brandText: cupProps?.brandText || 'TRÀ NGUỘI',
  };

  const timeline = computeTimelineSync(resolvedCupProps);
  const preVdna = resolveVisualDNA(resolvedCupProps, scriptInput);

  const valRes = validateAndCompileStageInput(scriptInput, timeline, preVdna);
  if (!valRes.valid && !allowInvalid) {
    console.error(`❌ CHẶN RENDER PREVIEW [${baseName}] — ${valRes.issues.length} lỗi:`);
    for (const iss of valRes.issues) {
      console.error(`   - [${iss.code}] ${iss.message}`);
    }
    process.exit(1);
  }

  const script = valRes.compiledScript;
  const themeId = resolvedCupProps.themeId || 'MINIMAL_LIGHT';
  const palette = THEME_PALETTES[themeId] || THEME_PALETTES.MINIMAL_LIGHT;
  const vdna = resolveVisualDNA(resolvedCupProps, script);
  const geo = resolveLayoutGeometry(vdna.layout, vdna.brushOrientation);
  const fps = timeline.fps;
  const clampF = (f) => Math.max(0, Math.min(timeline.durationInFrames - 1, Math.round(f)));

  // Tuỳ chọn xuất 1 khung 1080×1920 duy nhất (--frame=N) để đối chiếu 1:1 với MP4 render thật
  if (singleFrameArg !== undefined && Number.isFinite(singleFrameArg)) {
    const fTarget = clampF(singleFrameArg);
    const singleSvg = renderStudioMatchedFrameSvg({
      script,
      resolvedCupProps,
      cupNumberLabel,
      timeline,
      palette,
      vdna,
      geo,
      frame: fTarget,
      showBBox,
    });
    const outFile =
      outOverride || path.join(OUT_DIR, `${baseName}-frame-${fTarget}.png`);
    rasterizeWithResvg({ mode: 'single', svg: singleSvg, w: 1080, h: 1920, out: outFile });
    console.log(
      `✅ Đã xuất khung đơn f=${fTarget} (t=${(fTarget / fps).toFixed(2)}s): ${path.relative(ROOT, outFile)}`
    );
    return;
  }

  const segs = timeline.segmentTimings || [];
  // 1. 6 khung tổng quan
  const overviewSpec = [
    { label: '1. Đầu video', frame: clampF(0.45 * fps) },
    {
      label: '2. Dòng 1',
      frame: clampF(segs[0] ? Math.min(timeline.pivotFrame - 12, segs[0].endTypingFrame + 6) : 2.0 * fps),
    },
    {
      label: '3. Dòng 2',
      frame: clampF(segs[1] ? Math.min(timeline.pivotFrame - 10, segs[1].endTypingFrame + 6) : 4.0 * fps),
    },
    {
      label: segs[2] ? '4. Dòng 3' : '4. Trước lật',
      frame: clampF(
        segs[2]
          ? Math.min(timeline.pivotFrame - 8, segs[2].endTypingFrame + 6)
          : Math.max(0.8 * fps, timeline.pivotFrame - 0.6 * fps)
      ),
    },
    {
      label: '5. Cú lật',
      frame: clampF(Math.min(timeline.durationInFrames - 90, timeline.pivotFrame + 0.55 * fps)),
    },
    {
      label: '6. Cuối video',
      frame: clampF(Math.max(timeline.pivotFrame + 60, timeline.durationInFrames - 1.5 * fps)),
    },
  ];

  // 2. 8 khung dày quanh cú lật (pivot -0.5s đến +3.0s, bước 0.5s)
  const pivotOffsets = [-0.5, 0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
  const pivotDenseSpec = pivotOffsets.map((off, idx) => ({
    label: `P${idx + 1}. pivot${off >= 0 ? `+${off.toFixed(1)}` : off.toFixed(1)}s`,
    frame: clampF(timeline.pivotFrame + off * fps),
  }));

  // 3. Mỗi thời điểm t mà TF1 cảnh báo (warnings có timeSec)
  const tf1Warnings = (valRes.warnings || []).filter((w) => typeof w.timeSec === 'number');
  const warnByTime = new Map();
  for (const w of tf1Warnings) {
    const key = w.timeSec.toFixed(2);
    if (!warnByTime.has(key)) {
      warnByTime.set(key, { timeSec: w.timeSec, codes: [], msgs: [] });
    }
    const bucket = warnByTime.get(key);
    bucket.codes.push(w.code);
    bucket.msgs.push(w.message);
  }
  const warningSpec = Array.from(warnByTime.values())
    .sort((a, b) => a.timeSec - b.timeSec)
    .map((b, idx) => ({
      label: `[WARN] W${idx + 1}`,
      subLabel: b.codes.join(', '),
      frame: clampF(b.timeSec * fps),
      isWarning: true,
    }));

  const buildCards = (specs) =>
    specs.map((sp) => ({
      badge: `${sp.label} · t=${(sp.frame / fps).toFixed(2)}s`,
      subBadge: sp.subLabel || `frame ${sp.frame}/${timeline.durationInFrames}`,
      isWarning: Boolean(sp.isWarning),
      svg: renderStudioMatchedFrameSvg({
        script,
        resolvedCupProps,
        cupNumberLabel,
        timeline,
        palette,
        vdna,
        geo,
        frame: sp.frame,
        showBBox,
      }),
    }));

  const commitHash = getGitShortCommit();
  const durSec = (timeline.durationInFrames / fps).toFixed(1);
  const pivotSec = (timeline.pivotFrame / fps).toFixed(2);
  const horizonStr = vdna.horizonOffsetPx >= 0 ? `+${vdna.horizonOffsetPx}px` : `${vdna.horizonOffsetPx}px`;

  const bannerTitle = `DIRECTOR PREVIEW — ${resolvedCupProps.title} (${script.sceneId || baseName}) · ${modeLabel}`;
  const bannerMeta = `commit: ${commitHash}  |  thời lượng: ${durSec}s (${timeline.durationInFrames}f · ${effectiveDurationMode})  |  seed: ${vdna.seed} (id: ${resolvedCupProps.id})  |  layout: ${vdna.layout} · horizon: ${horizonStr} · pivot: t=${pivotSec}s`;
  const bannerStatus =
    tf1Warnings.length > 0
      ? `[WARN] TF1 cảnh báo vàng (${tf1Warnings.length}): ${tf1Warnings.map((w) => `[${w.code}@${w.timeSec.toFixed(2)}s]`).join(' · ')}`
      : `[OK] 0 lỗi chặn cứng · 0 cảnh báo vàng`;

  const sections = [
    {
      title: 'I. 6 KHUNG TỔNG QUAN',
      cols: 6,
      cards: buildCards(overviewSpec),
    },
    {
      title: `II. 8 KHUNG DÀY QUANH CÚ LẬT (pivot t=${pivotSec}s: −0.5s → +3.0s)`,
      cols: 8,
      cards: buildCards(pivotDenseSpec),
    },
  ];
  if (warningSpec.length > 0) {
    sections.push({
      title: `III. KHUNG CẢNH BÁO TF1 (${warningSpec.length} thời điểm)`,
      cols: 6,
      isWarningSection: true,
      cards: buildCards(warningSpec),
    });
  }

  const outFile =
    outOverride ||
    path.join(OUT_DIR, `${baseName}${showBBox ? '-bbox' : ''}-preview.png`);

  rasterizeWithResvg({
    mode: 'sheet',
    bannerTitle,
    bannerMeta,
    bannerStatus,
    sections,
    out: outFile,
  });

  const totalFrames = overviewSpec.length + pivotDenseSpec.length + warningSpec.length;
  console.log(
    `✅ Đã xuất Director Preview (${totalFrames} khung: 6 tổng quan + 8 cú lật + ${warningSpec.length} cảnh báo): ${path.relative(ROOT, outFile)}`
  );
  console.log(
    `   commit: ${commitHash} | thời lượng: ${durSec}s · ${timeline.durationInFrames}f · ${effectiveDurationMode} | seed: ${vdna.seed} (id: ${resolvedCupProps.id})`
  );
}


function renderSingleFrameCardSvg(script, timeline, palette, vdna, f, cardTitle, subtitle, lines) {
  const fps = timeline.fps;
  const segs = timeline.segmentTimings || [];
  const mState = evaluateMotionState(
    f,
    fps,
    timeline.pivotFrame,
    timeline.allTextFinishedFrame,
    timeline.durationInFrames,
    {
      archetype: 'BOULDER_TO_BENCH',
      pacingMode: 'CONTEMPLATIVE',
      stateA: { intensity: 0.78, spread: 0.22, tiltDeg: -12 },
      stateB: { intensity: 0.08, spread: 0.72, tiltDeg: 0 },
    }
  );
  const stageMarkup = renderToStaticMarkup(
    React.createElement(DeclarativeStagePlayer, {
      script,
      state: mState,
      palette,
      strokeWidth: LAYOUT_TOKENS.strokeWidth,
      frame: f,
      fps,
      durationInFrames: timeline.durationInFrames,
      timeline,
      visualDNA: vdna,
      stageBox: {
        width: LAYOUT_TOKENS.swissGrid.stageWidth,
        height: LAYOUT_TOKENS.swissGrid.stageHeight,
      },
      showDebugBBoxes: false,
    })
  );
  const visibleLines = lines
    .map((ln, lIdx) => {
      const st = segs[lIdx]?.startFrame ?? lIdx * 90;
      if (f < st) return '';
      const isPivotActive = f >= timeline.pivotFrame;
      return renderSvgQuoteLineWithPivot(
        ln,
        segs[lIdx],
        930 + lIdx * 72,
        isPivotActive,
        palette
      );
    })
    .filter(Boolean)
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
    <rect width="1080" height="1920" fill="${palette.background}"/>
    <text x="132" y="210" font-family="Georgia" font-size="27" font-weight="bold" fill="${palette.inkPrimary}">${escXml(cardTitle)}</text>
    <text x="132" y="250" font-family="Georgia" font-size="22" fill="${palette.inkSecondary}">${escXml(subtitle)} (t=${(f / fps).toFixed(2)}s)</text>
    <text x="132" y="302" font-family="Georgia" font-size="24" letter-spacing="4" fill="${palette.inkSecondary}">KHỎE TƯNG</text>
    <line x1="132" y1="316" x2="948" y2="316" stroke="${palette.inkSecondary}" stroke-width="1.2" opacity="0.35"/>
    <g transform="translate(${LAYOUT_TOKENS.swissGrid.stageLeft}, ${LAYOUT_TOKENS.swissGrid.stageTop})">
      ${stageMarkup}
    </g>
    <rect x="132" y="888" width="4.5" height="${Math.max(40, lines.length * 72)}" fill="${palette.accentText}"/>
    ${visibleLines}
  </svg>`;
}

function renderPivotComparison(newSpecPath, oldCupPath, outFile) {
  const newRaw = JSON.parse(fs.readFileSync(path.resolve(ROOT, newSpecPath), 'utf8'));
  const oldRaw = JSON.parse(fs.readFileSync(path.resolve(ROOT, oldCupPath), 'utf8'));
  const oldCupProps = oldRaw.props;
  const oldSid = oldCupProps.motion?.sceneId || oldCupProps.motion?.archetype;
  const oldScript = resolveStageScript(oldSid, oldCupProps.motion?.stageScript);

  const lines = [
    'Tháng năm tất tả chưa từng dừng,',
    'Tiền chưa đầy túi đã đau lưng.',
    'Lắm hôm mệt quá toan buông xuống,',
    'Nhìn tờ hóa đơn… lại khỏe tưng!',
  ];

  const timeline = computeTimelineSync({
    id: 'q001-compare',
    textFormat: 'POEM',
    segments: lines,
    pivotWord: 'lại khỏe tưng',
    highlightStyle: 'BOTH',
    targetDurationSeconds: 15,
    durationMode: 'FIXED',
    typingSpeedMsPerChar: 55,
    holdAfterFinishSeconds: 5.5,
    themeId: 'MINIMAL_LIGHT',
    motion: oldCupProps.motion,
    bgm: oldCupProps.bgm,
    brandText: 'TRÀ NGUỘI',
  });

  const valRes = validateAndCompileStageInput(newRaw, timeline);
  if (!valRes.valid) {
    console.error(`❌ CHẶN RENDER SO SÁNH — ${valRes.issues.length} lỗi:`);
    for (const iss of valRes.issues) console.error(`   - [${iss.code}] ${iss.message}`);
    process.exit(1);
  }
  const newScript = valRes.compiledScript;
  const fps = timeline.fps;

  // Khung 1: Bản cũ Chén 15 tại cú lật (dùng đúng theme MINIMAL_DARK & visualDNA gốc của Chén 15)
  const oldPalette = THEME_PALETTES[oldCupProps.themeId] || THEME_PALETTES.MINIMAL_DARK;
  const oldVdna = resolveVisualDNA(oldCupProps, oldScript);
  const fOld = timeline.pivotFrame + Math.round(0.8 * fps);
  const svgOld = renderSingleFrameCardSvg(
    oldScript,
    timeline,
    oldPalette,
    oldVdna,
    fOld,
    '1. CHÉN 15 BẢN CŨ (LEGACY)',
    'Đạo cụ tự vẽ đè nhau, bóng đặc, thiếu ánh nhìn',
    lines
  );

  // Khung 2: Bản mới Q001 tại cú lật +0.55s (hoa_don đỏ, mắt liếc sang hoa_don khi người vẫn gục)
  const newPalette = THEME_PALETTES.MINIMAL_LIGHT;
  const fNewGlance = timeline.pivotFrame + Math.round(0.55 * fps);
  const svgNewGlance = renderSingleFrameCardSvg(
    newScript,
    timeline,
    newPalette,
    undefined,
    fNewGlance,
    '2. Q001 MỚI — CÚ LẬT +0.4s',
    'hoa_don đỏ, LIẾC MẮT sang hoa_don (người vẫn gục)',
    lines
  );

  // Khung 3: Bản mới Q001 tại cú lật +0.95s (sau +0.3s bật thẳng lưng, lá trà dựng đứng)
  const fNewStraight = timeline.pivotFrame + Math.round(0.95 * fps);
  const svgNewStraight = renderSingleFrameCardSvg(
    newScript,
    timeline,
    newPalette,
    undefined,
    fNewStraight,
    '3. Q001 MỚI — SAU +0.3s BẬT THẲNG',
    'Ngồi thẳng lưng, lá trà dựng đứng',
    lines
  );

  rasterizeWithCoreSVG({ mode: 'strip6', svgs: [svgOld, svgNewGlance, svgNewStraight], out: outFile });
  console.log(`✅ Đã xuất ảnh so sánh khung cú lật (Chén 15 cũ vs Q001 mới): ${path.relative(ROOT, outFile)}`);
}

const args = process.argv.slice(2);

function renderZoomedStageDong3CuLat(specPath, outFile) {
  const rawJson = JSON.parse(fs.readFileSync(path.resolve(ROOT, specPath), 'utf8'));
  const lines = [
    'Tháng năm tất tả chưa từng dừng,',
    'Tiền chưa đầy túi đã đau lưng.',
    'Lắm hôm mệt quá toan buông xuống,',
    'Nhìn tờ hóa đơn… lại khỏe tưng!',
  ];
  const timeline = computeTimelineSync({
    id: 'q001-zoom',
    textFormat: 'POEM',
    segments: lines,
    pivotWord: 'lại khỏe tưng',
    highlightStyle: 'BOTH',
    targetDurationSeconds: 15,
    durationMode: 'FIXED',
    typingSpeedMsPerChar: 55,
    holdAfterFinishSeconds: 5.5,
    themeId: 'MINIMAL_LIGHT',
    motion: {
      archetype: 'BOULDER_TO_BENCH',
      pacingMode: 'CONTEMPLATIVE',
      stateA: { intensity: 0.78, spread: 0.22, tiltDeg: -12 },
      stateB: { intensity: 0.08, spread: 0.72, tiltDeg: 0 },
    },
    bgm: { audioMode: 'PIVOT_ACCENT', foleyPivotStyle: 'AUTO' },
    brandText: 'TRÀ NGUỘI',
  });

  const valRes = validateAndCompileStageInput(rawJson, timeline);
  if (!valRes.valid) {
    console.error(`❌ CHẶN RENDER ZOOM — ${valRes.issues.length} lỗi:`);
    for (const iss of valRes.issues) console.error(`   - [${iss.code}] ${iss.message}`);
    process.exit(1);
  }
  const script = valRes.compiledScript;
  const palette = THEME_PALETTES.MINIMAL_LIGHT;
  const fps = timeline.fps;
  const segs = timeline.segmentTimings || [];

  const fDong3 = segs[2]
    ? Math.min(timeline.pivotFrame - 8, segs[2].endTypingFrame + 6)
    : Math.round(5.4 * fps);
  const fCuLat = Math.min(
    timeline.durationInFrames - 90,
    timeline.pivotFrame + Math.round(0.55 * fps)
  );

  const panels = [
    {
      f: fDong3,
      title: `1. KHUNG DÒNG 3 (t=${(fDong3 / fps).toFixed(2)}s) — GỤC ĐẦU XUỐNG MẶT BÀN (NHÌN NGANG)`,
      sub: 'Lữ khách ngồi std_chair sát std_work_desk (ngoi_vao: ban), gục đầu nhìn ngang lên mặt bàn, laptop quay về phía Lữ khách',
      quoteLine: '“Lắm hôm mệt quá toan buông xuống,”',
      isPivot: false,
    },
    {
      f: fCuLat,
      title: `2. KHUNG CÚ LẬT +0.4s (t=${(fCuLat / fps).toFixed(2)}s) — LIẾC MẮT SANG HOÁ ĐƠN ĐỎ TRƯỚC KHI BẬT DẬY`,
      sub: 'hoa_don (trạng thái tua tựa desk_calendar) đổi đỏ • Mắt Lữ khách mở liếc sang hoa_don khi người vẫn gục • Chỉ cụm "lại khỏe tưng" đổi đỏ',
      quoteLine: '“Nhìn tờ hóa đơn… lại khỏe tưng!”',
      isPivot: true,
    },
  ];

  const W = 2240;
  const H = 820;
  const cardW = 1040;
  const cardH = 680;

  const cardsSvg = panels
    .map((p, idx) => {
      const cx = 60 + idx * (cardW + 40);
      const cy = 104;
      const mState = evaluateMotionState(
        p.f,
        fps,
        timeline.pivotFrame,
        timeline.allTextFinishedFrame,
        timeline.durationInFrames,
        {
          archetype: 'BOULDER_TO_BENCH',
          pacingMode: 'CONTEMPLATIVE',
          stateA: { intensity: 0.78, spread: 0.22, tiltDeg: -12 },
          stateB: { intensity: 0.08, spread: 0.72, tiltDeg: 0 },
        }
      );

      const rawStageSvg = renderToStaticMarkup(
        React.createElement(DeclarativeStagePlayer, {
          script,
          state: mState,
          palette,
          strokeWidth: LAYOUT_TOKENS.strokeWidth,
          frame: p.f,
          fps,
          durationInFrames: timeline.durationInFrames,
          timeline,
          stageBox: { width: cardW - 48, height: 520 },
          showDebugBBoxes: false,
        })
      );

      const embeddedStage = rawStageSvg
        .replace(/width="[^"]*"/, `x="${cx + 24}" y="${cy + 78}" width="${cardW - 48}"`)
        .replace(/height="[^"]*"/, `height="520"`);

      const quoteRich = p.isPivot
        ? renderSvgQuoteLineWithPivot(
            'Nhìn tờ hóa đơn… lại khỏe tưng!',
            segs[3],
            cy + 638,
            true,
            palette,
            cx + 318,
            27
          )
        : `<text x="${cx + cardW / 2}" y="${cy + 638}" text-anchor="middle" font-family="Georgia" font-size="27" fill="${palette.inkPrimary}">Lắm hôm mệt quá toan buông xuống,</text>`;

      return `
        <g>
          <rect x="${cx}" y="${cy}" width="${cardW}" height="${cardH}" rx="14" fill="#FAF6EF" stroke="#C8BBAE" stroke-width="2"/>
          <text x="${cx + 24}" y="${cy + 34}" font-family="Georgia" font-size="18.5" font-weight="bold" fill="#1E1B18">${escXml(p.title)}</text>
          <text x="${cx + 24}" y="${cy + 58}" font-family="Georgia" font-size="13.5" fill="#5C534A">${escXml(p.sub)}</text>
          <rect x="${cx + 24}" y="${cy + 74}" width="${cardW - 48}" height="528" rx="10" fill="${palette.background}" stroke="#DFD5C7" stroke-width="1.2"/>
          ${embeddedStage}
          ${quoteRich}
        </g>
      `;
    })
    .join('\n');

  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#EAE1D3"/>
    <text x="60" y="54" font-family="Georgia" font-size="28" font-weight="bold" fill="#1E1B18">PHÓNG TO RIÊNG VÙNG HÌNH Q001 — KHUNG DÒNG 3 (GỤC ĐẦU LÊN BÀN) &amp; KHUNG CÚ LẬT (+0.4s LIẾC MẮT)</text>
    <text x="60" y="82" font-family="Georgia" font-size="16" fill="#5C534A">Tự căn khung ~70% chiều ngang vùng hình (căn giữa x=270, đáy đặt trên đường đất y=352) • Lữ khách ngồi sát bàn (ngoi_vao: ban) nhìn ngang • Bỏ porch_window</text>
    ${cardsSvg}
  </svg>`;

  rasterizeWithCoreSVG({ mode: 'single', svg: fullSvg, w: W, h: H, out: outFile });
  console.log(`✅ Đã xuất ảnh phóng to vùng hình (Dòng 3 & Cú lật): ${path.relative(ROOT, outFile)}`);
}

const zoomStageArg = args.includes('--zoom-stage');
const compareArg = args.find((a) => a.startsWith('--compare-pivot='));
if (zoomStageArg) {
  const target = args.find((a) => !a.startsWith('--'));
  const outArg = args.find((a) => a.startsWith('--out='));
  const outFile = outArg
    ? path.resolve(ROOT, outArg.split('=')[1])
    : path.join(OUT_DIR, 'q001-zoom-dong3-culat.png');
  renderZoomedStageDong3CuLat(target, outFile);
} else if (compareArg) {
  const oldCupPath = compareArg.split('=')[1];
  const target = args.find((a) => !a.startsWith('--'));
  const outArg = args.find((a) => a.startsWith('--out='));
  const outFile = outArg
    ? path.resolve(ROOT, outArg.split('=')[1])
    : path.join(OUT_DIR, 'q001-vs-chen15-pivot.png');
  renderPivotComparison(target, oldCupPath, outFile);
} else if (args.includes('--prop-sheet')) {
  const outArg = args.find((a) => a.startsWith('--out='))?.split('=')[1];
  generateApprovalSheet(
    outArg
      ? path.resolve(ROOT, outArg)
      : path.join(OUT_DIR, 'prop-approval-sheet.png')
  );
} else {
  const positional = args.filter((a) => !a.startsWith('--'));
  const target = positional[0];
  const sceneIdArg = positional[1];
  if (!target) {
    console.error(
      'Cách dùng:\n  npm run preview -- <file.json> [sceneId] [--out=path.png] [--frame=N] [--bbox]\n  npm run preview -- --prop-sheet'
    );
    process.exit(1);
  }
  const showBBox = args.includes('--bbox');
  const allowInvalid = args.includes('--allow-invalid');
  const outArg = args.find((a) => a.startsWith('--out='))?.slice('--out='.length);
  const frameArgRaw = args.find((a) => a.startsWith('--frame='))?.slice('--frame='.length);
  const singleFrameArg = frameArgRaw !== undefined ? Number(frameArgRaw) : undefined;
  renderSixFramePreview(
    target,
    showBBox,
    outArg ? path.resolve(ROOT, outArg) : undefined,
    allowInvalid,
    sceneIdArg,
    singleFrameArg
  );
}
