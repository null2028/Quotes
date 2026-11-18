/**
 * T2b — So sánh cảnh A (Chén 16, luồng video thật) và cảnh B (12 đạo cụ tối giản bày
 * trên cùng sàn với Lữ khách ở cùng tỷ lệ 1:1 trong khung 1080×1920).
 *
 * Cắt CÙNG vùng pixel (vùng cảnh phía trên chữ), đặt cạnh nhau, thêm phóng 2x.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { CloakedTraveler } from '../src/kit/CloakedTraveler.tsx';
import { DeclarativeStagePlayer } from '../src/stage/DeclarativeStagePlayer.tsx';
import {
  BUILT_IN_PROP_CATALOG,
  renderShapeListStatic,
} from '../src/stage/propCatalog.tsx';
import { resolveStageScript } from '../src/stage/stageScriptRegistry.ts';
import {
  validateAndCompileStageInput,
} from '../src/stage/stageValidator.ts';
import { computeTimelineSync } from '../src/engine/timelineSync.ts';
import { evaluateMotionState } from '../src/engine/motionPhysics.ts';
import { LAYOUT_TOKENS, THEME_PALETTES } from '../src/theme/palettes.ts';
import { resolveVisualDNA } from '../src/engine/visualDnaResolver.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'qa-artifacts-ci');
fs.mkdirSync(OUT_DIR, { recursive: true });

/* ─── Python SVG→PNG rasterizer ─── */
const PY_RASTERIZER = `
import ctypes, json, re, sys
from ctypes import c_void_p, c_size_t, c_double, c_uint32, c_char_p, c_bool, Structure
class CGPoint(Structure): _fields_ = [("x", c_double), ("y", c_double)]
class CGSize(Structure): _fields_ = [("width", c_double), ("height", c_double)]
class CGRect(Structure): _fields_ = [("origin", CGPoint), ("size", CGSize)]
cg = ctypes.CDLL("/System/Library/Frameworks/CoreGraphics.framework/CoreGraphics")
cf = ctypes.CDLL("/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation")
imageio = ctypes.CDLL("/System/Library/Frameworks/ImageIO.framework/ImageIO")
coresvg = ctypes.CDLL("/System/Library/PrivateFrameworks/CoreSVG.framework/CoreSVG")
cf.CFDataCreate.restype = c_void_p; cf.CFDataCreate.argtypes = [c_void_p, c_char_p, c_size_t]
cf.CFStringCreateWithCString.restype = c_void_p; cf.CFStringCreateWithCString.argtypes = [c_void_p, c_char_p, c_uint32]
cf.CFURLCreateFromFileSystemRepresentation.restype = c_void_p; cf.CFURLCreateFromFileSystemRepresentation.argtypes = [c_void_p, c_char_p, c_size_t, c_bool]
cf.CFRelease.argtypes = [c_void_p]
coresvg.CGSVGDocumentCreateFromData.restype = c_void_p; coresvg.CGSVGDocumentCreateFromData.argtypes = [c_void_p, c_void_p]
coresvg.CGSVGDocumentRelease.argtypes = [c_void_p]
coresvg.CGContextDrawSVGDocument.argtypes = [c_void_p, c_void_p]
cg.CGColorSpaceCreateDeviceRGB.restype = c_void_p
cg.CGBitmapContextCreate.restype = c_void_p; cg.CGBitmapContextCreate.argtypes = [c_void_p, c_size_t, c_size_t, c_size_t, c_size_t, c_void_p, c_uint32]
cg.CGContextRelease.argtypes = [c_void_p]
cg.CGBitmapContextCreateImage.restype = c_void_p; cg.CGBitmapContextCreateImage.argtypes = [c_void_p]
cg.CGImageRelease.argtypes = [c_void_p]
imageio.CGImageDestinationCreateWithURL.restype = c_void_p; imageio.CGImageDestinationCreateWithURL.argtypes = [c_void_p, c_void_p, c_size_t, c_void_p]
imageio.CGImageDestinationAddImage.argtypes = [c_void_p, c_void_p, c_void_p]
imageio.CGImageDestinationFinalize.restype = c_bool; imageio.CGImageDestinationFinalize.argtypes = [c_void_p]
cs_rgb = cg.CGColorSpaceCreateDeviceRGB()
uti_png = cf.CFStringCreateWithCString(None, b"public.png", 0x08000100)
RE_RGB = re.compile(r"rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)")
RE_RGBA_HEX = re.compile(r"#([0-9a-fA-F]{6})([0-9a-fA-F]{2})\\b")
def clean_svg(svg):
    svg = RE_RGB.sub(lambda m: f"#{int(m.group(1)):02X}{int(m.group(2)):02X}{int(m.group(3)):02X}", svg)
    svg = RE_RGBA_HEX.sub(lambda m: f"#{m.group(1)}", svg)
    svg = svg.replace('style="overflow:visible;background:transparent"', '')
    return svg
payload = json.loads(sys.stdin.read())
svg = clean_svg(payload["svg"])
w, h = int(payload["w"]), int(payload["h"])
out_png = payload["out"]
data = svg.encode("utf-8")
cfdata = cf.CFDataCreate(None, data, len(data))
doc = coresvg.CGSVGDocumentCreateFromData(cfdata, None)
ctx = cg.CGBitmapContextCreate(None, w, h, 8, w * 4, cs_rgb, 1)
coresvg.CGContextDrawSVGDocument(ctx, doc)
im = cg.CGBitmapContextCreateImage(ctx)
pbytes = out_png.encode("utf-8")
url = cf.CFURLCreateFromFileSystemRepresentation(None, pbytes, len(pbytes), False)
dest = imageio.CGImageDestinationCreateWithURL(url, uti_png, 1, None)
imageio.CGImageDestinationAddImage(dest, im, None)
imageio.CGImageDestinationFinalize(dest)
cf.CFRelease(dest); cf.CFRelease(url); cg.CGImageRelease(im); cg.CGContextRelease(ctx); coresvg.CGSVGDocumentRelease(doc); cf.CFRelease(cfdata)
print("OK")
`;

function rasterize(payload) {
  const res = spawnSync('/usr/bin/python3', ['-c', PY_RASTERIZER], {
    input: JSON.stringify(payload), encoding: 'utf8', maxBuffer: 96 * 1024 * 1024,
  });
  if (res.status !== 0) throw new Error(`PNG error: ${res.stderr || res.stdout}`);
}

const palette = THEME_PALETTES.MINIMAL_LIGHT;
const bg = palette.background;
const ink = palette.inkPrimary;
const FW = 1080, FH = 1920;

// DSP internal viewBox coordinates: "62 126 416 250"
const SVB = { x: 62, y: 126, w: 416, h: 250 };

/* ═══════ Cảnh A: Chén 16 — đúng luồng video ═══════ */
console.log('Rendering Cảnh A (Chén 16 — 1080×1920)...');
function buildChen16SvgContent() {
  const cupPath = path.join(ROOT, 'data/cups/quote-016.json');
  const rawJson = JSON.parse(fs.readFileSync(cupPath, 'utf8'));
  const cupProps = rawJson.props;
  const sid = cupProps.motion?.sceneId;
  const scriptInput = resolveStageScript(sid, cupProps.motion?.stageScript);
  const timeline = computeTimelineSync({
    id: 'chen16-t2b', textFormat: 'POEM', segments: cupProps.segments,
    pivotWord: (cupProps.pivotWord || '').replace(/[!?.…]+$/u, ''),
    highlightStyle: 'BOTH', targetDurationSeconds: 15, durationMode: 'FIXED',
    typingSpeedMsPerChar: 55, holdAfterFinishSeconds: 5.5,
    themeId: cupProps.themeId || 'MINIMAL_LIGHT', motion: cupProps.motion,
    bgm: cupProps.bgm, brandText: 'TRÀ NGUỘI',
  });
  const valRes = validateAndCompileStageInput(scriptInput, timeline);
  const script = valRes.compiledScript;
  const vdna = resolveVisualDNA(cupProps, script);
  const fps = timeline.fps;
  const segs = timeline.segmentTimings || [];
  const f = segs[1] ? Math.min(timeline.pivotFrame - 12, segs[1].endTypingFrame + 6) : Math.round(4.0 * fps);
  const mState = evaluateMotionState(f, fps, timeline.pivotFrame, timeline.allTextFinishedFrame, timeline.durationInFrames, cupProps.motion);
  const fullSvg = renderToStaticMarkup(
    React.createElement(DeclarativeStagePlayer, {
      script, state: mState, palette, strokeWidth: LAYOUT_TOKENS.strokeWidth,
      frame: f, fps, durationInFrames: timeline.durationInFrames, timeline, visualDNA: vdna,
      stageBox: { width: FW, height: FH }, showDebugBBoxes: false,
    })
  );
  // Strip outer <svg ...> and </svg> to get inner content only
  // The DSP SVG content draws in viewBox "62 126 416 250" coordinate space
  return fullSvg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
}
const chen16Content = buildChen16SvgContent();

/* ═══════ Cảnh B: 12 đạo cụ tối giản + Lữ khách — SVG trực tiếp ═══════ */
console.log('Building Cảnh B (đạo cụ + Lữ khách cùng sàn)...');

function makeDummyState(typeName, variant) {
  return {
    id: typeName, type: typeName, variant, layer: 'mid', x: 0, y: 0,
    scale: 1, rotate: 0, opacity: 1,
    color: palette.inkPrimary,
    isAccentActive: false, loopProgress: 0, motionActivity: 0,
    travelDist: 0, drawProgress: 1, morphProgress: 0,
    splitProgress: 0, floatAwayProgress: 0,
    emitters: { steam: 0, pulseRing: 0, spill: 0, glow: 0, color: palette.accentProp, steamColor: palette.inkSecondary },
    spec: { id: typeName, type: typeName, variant },
  };
}

function renderPropAt(typeName, x, y, scale, variant) {
  const def = BUILT_IN_PROP_CATALOG[typeName];
  if (!def) { console.warn(`⚠ Prop not found: ${typeName}`); return ''; }
  const shapes = variant && def.variants?.[variant]?.shapes || def.shapes;
  const st = makeDummyState(typeName, variant);
  const inner = renderToStaticMarkup(
    React.createElement('svg', null, renderShapeListStatic(shapes, st, palette, 1.35, false))
  ).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  return `<g transform="translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${scale.toFixed(3)})">${inner}</g>`;
}

// Layout: ground line at y=355 in viewBox space
const GY = 355;
const SC = 1.0;

const propPlacements = [
  // Ground-level furniture
  { type: 'std_chair', x: 170, y: GY, s: SC },
  { type: 'std_work_desk', x: 270, y: GY, s: SC },
  { type: 'low_tea_table', x: 410, y: GY, s: SC },
  { type: 'low_wood_stool', x: 440, y: GY, s: SC * 0.95 },
  // On desk (desk top at GY - 19.2)
  { type: 'desk_laptop', x: 243, y: GY - 19.2, s: SC },
  { type: 'desk_calendar', x: 290, y: GY - 19.2, s: SC },
  { type: 'small_cup', x: 265, y: GY - 19.2, s: SC },
  // Small items on table (table top at GY - 14.2)
  { type: 'vi_tien', x: 400, y: GY - 14.2, s: SC },
  { type: 'thiep', x: 420, y: GY - 14.2, s: SC },
  { type: 'phong_bi', x: 445, y: GY - 14.2, s: SC },
  // hoa_don (tua variant)
  { type: 'hoa_don', x: 310, y: GY - 19.2, s: SC, variant: 'tua' },
  // Window on wall
  { type: 'porch_window', x: 290, y: GY - 60, s: SC },
];

const propsInner = propPlacements.map(p => renderPropAt(p.type, p.x, p.y, p.s, p.variant)).join('\n');

// Lữ khách sitting
const travelerFull = renderToStaticMarkup(
  React.createElement(CloakedTraveler, {
    x: 172, y: GY, scale: 1.0, facing: 'right', pose: 'sit', leanDeg: 0,
    sitProgress: 1, walkPhase: 0, walkActivity: 0, breathPhase: 0.3,
    color: ink, accentColor: palette.accentProp, bgColor: bg,
    showTeaCup: false, solidFill: true, strokeWidth: 2.6, opacity: 1, drawProgress: 1,
  })
);
// CloakedTraveler renders as <svg>...</svg> — strip wrapper
const travelerContent = travelerFull.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

const sceneBContent = `
  <!-- Ground line -->
  <line x1="${SVB.x + 10}" y1="${GY}" x2="${SVB.x + SVB.w - 10}" y2="${GY}" stroke="${ink}" stroke-width="0.8" opacity="0.35"/>
  ${propsInner}
  ${travelerContent}
`;

/* ═══════ Compose final image ═══════ */
console.log('Composing final comparison...');

// Crop region in viewBox coord space — show most of the stage
const CROP_Y1 = SVB.y + 10;  // y=136
const CROP_Y2 = SVB.y + SVB.h; // y=376
const cropH = CROP_Y2 - CROP_Y1; // 240
const cropW = SVB.w; // 416

// Final image dimensions (in sheet units, rendered at 3x)
const SCALE = 3;
const labelH = 50;
const gapX = 30;
const zoom2H = cropH * 2;
const row2LabelGap = 16;
const sheetW = cropW * 2 + gapX + 30; // 30 margins
const sheetH = labelH + cropH + row2LabelGap + zoom2H + 30;

const finalSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW * SCALE}" height="${sheetH * SCALE}" viewBox="0 0 ${sheetW} ${sheetH}">
  <rect width="${sheetW}" height="${sheetH}" fill="#EAE1D3"/>
  <text x="20" y="28" font-family="Georgia" font-size="14" font-weight="bold" fill="${ink}">T2b — SO SÁNH CÙNG TỶ LỆ: Chén 16 (trái) vs 12 đạo cụ tối giản (phải)</text>
  <text x="20" y="42" font-family="Georgia" font-size="8" fill="${palette.inkSecondary}">Hàng trên: cắt cùng vùng pixel 1:1 — Hàng dưới: phóng 2× cùng vùng</text>

  <!-- Row 1: 1x crops side by side -->
  <!-- Cảnh A -->
  <rect x="15" y="${labelH}" width="${cropW}" height="${cropH}" rx="4" fill="${bg}" stroke="#C8BBAE" stroke-width="0.6"/>
  <svg x="15" y="${labelH}" width="${cropW}" height="${cropH}" viewBox="${SVB.x} ${CROP_Y1} ${cropW} ${cropH}">
    <rect x="${SVB.x}" y="${CROP_Y1}" width="${cropW}" height="${cropH}" fill="${bg}"/>
    ${chen16Content}
  </svg>
  <text x="20" y="${labelH + cropH + 10}" font-family="Georgia" font-size="7" fill="${palette.inkSecondary}">Cảnh A — Chén 16 bản đã đăng</text>

  <!-- Cảnh B -->
  <rect x="${cropW + gapX + 15}" y="${labelH}" width="${cropW}" height="${cropH}" rx="4" fill="${bg}" stroke="#C8BBAE" stroke-width="0.6"/>
  <svg x="${cropW + gapX + 15}" y="${labelH}" width="${cropW}" height="${cropH}" viewBox="${SVB.x} ${CROP_Y1} ${cropW} ${cropH}">
    <rect x="${SVB.x}" y="${CROP_Y1}" width="${cropW}" height="${cropH}" fill="${bg}"/>
    ${sceneBContent}
  </svg>
  <text x="${cropW + gapX + 20}" y="${labelH + cropH + 10}" font-family="Georgia" font-size="7" fill="${palette.inkSecondary}">Cảnh B — 12 đạo cụ tối giản + Lữ khách cùng sàn</text>

  <!-- Row 2: 2x zoom of center portion -->
  <text x="20" y="${labelH + cropH + row2LabelGap + 8}" font-family="Georgia" font-size="7" fill="${palette.inkSecondary}">Phóng 2× — trái: Chén 16, phải: đạo cụ tối giản</text>
  ${(() => {
    const zoomY = labelH + cropH + row2LabelGap + 14;
    // Zoom: show middle 50% of crop at 2× = cropW×0.5 viewBox mapped to cropW display
    const zVBx = SVB.x + cropW * 0.1;
    const zVBy = CROP_Y1 + cropH * 0.15;
    const zVBw = cropW * 0.5;
    const zVBh = cropH * 0.5;
    return `
  <rect x="15" y="${zoomY}" width="${cropW}" height="${zoom2H}" rx="4" fill="${bg}" stroke="#C8BBAE" stroke-width="0.6"/>
  <svg x="15" y="${zoomY}" width="${cropW}" height="${zoom2H}" viewBox="${zVBx} ${zVBy} ${zVBw} ${zVBh}">
    <rect x="${SVB.x}" y="${CROP_Y1}" width="${cropW}" height="${cropH}" fill="${bg}"/>
    ${chen16Content}
  </svg>
  <rect x="${cropW + gapX + 15}" y="${zoomY}" width="${cropW}" height="${zoom2H}" rx="4" fill="${bg}" stroke="#C8BBAE" stroke-width="0.6"/>
  <svg x="${cropW + gapX + 15}" y="${zoomY}" width="${cropW}" height="${zoom2H}" viewBox="${zVBx} ${zVBy} ${zVBw} ${zVBh}">
    <rect x="${SVB.x}" y="${CROP_Y1}" width="${cropW}" height="${cropH}" fill="${bg}"/>
    ${sceneBContent}
  </svg>`;
  })()}
</svg>`;

const outFile = path.join(OUT_DIR, 'T2-so-sanh.png');
rasterize({ svg: finalSvg, w: sheetW * SCALE, h: sheetH * SCALE, out: outFile });
console.log(`✅ Đã xuất ảnh so sánh: ${path.relative(ROOT, outFile)}`);
