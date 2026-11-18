/**
 * T2 Comparison:
 *   Hàng trên: Chén 16 (SCRIPT_DE_SANG_MAI) cắt sát vùng cảnh
 *   Hàng dưới: 12 đạo cụ đặt cạnh Lữ khách (bóng mực đen) + bản đỏ nếu có
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
import {
  validateAndCompileStageInput,
} from '../src/stage/stageValidator.ts';
import { resolveStageScript } from '../src/stage/stageScriptRegistry.ts';
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

function escXml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

const palette = THEME_PALETTES.MINIMAL_LIGHT;
const bg = palette.background;
const ink = palette.inkPrimary;

/* ═══════ Hàng trên: Chén 16 ═══════ */
function buildChen16SceneSvg(viewW, viewH) {
  const cupPath = path.join(ROOT, 'data/cups/quote-016.json');
  const rawJson = JSON.parse(fs.readFileSync(cupPath, 'utf8'));
  const cupProps = rawJson.props;
  const sid = cupProps.motion?.sceneId;
  const scriptInput = resolveStageScript(sid, cupProps.motion?.stageScript);
  const timeline = computeTimelineSync({
    id: 'chen16-t2', textFormat: 'POEM', segments: cupProps.segments,
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
  return renderToStaticMarkup(
    React.createElement(DeclarativeStagePlayer, {
      script, state: mState, palette, strokeWidth: LAYOUT_TOKENS.strokeWidth,
      frame: f, fps, durationInFrames: timeline.durationInFrames, timeline, visualDNA: vdna,
      stageBox: { width: viewW, height: viewH }, showDebugBBoxes: false,
    })
  );
}

/* ═══════ Hàng dưới: 12 đạo cụ ═══════ */
const TARGET_PROPS = [
  'std_chair', 'low_wood_stool', 'std_work_desk', 'low_tea_table',
  'desk_calendar', 'desk_laptop', 'vi_tien', 'thiep',
  'phong_bi', 'hoa_don', 'porch_window', 'small_cup',
];

function makeDummyState(typeName, isRed, variant) {
  return {
    id: typeName, type: typeName, variant, layer: 'mid', x: 0, y: 0,
    scale: 1, rotate: 0, opacity: 1,
    color: isRed ? palette.accentProp : palette.inkPrimary,
    isAccentActive: isRed, loopProgress: 0, motionActivity: 0,
    travelDist: 0, drawProgress: 1, morphProgress: isRed ? 1 : 0,
    splitProgress: 0, floatAwayProgress: 0,
    emitters: { steam: 0, pulseRing: 0, spill: 0, glow: 0, color: palette.accentProp, steamColor: palette.inkSecondary },
    spec: { id: typeName, type: typeName, variant },
  };
}

function renderPropCard(typeName, cx, cy, cellW, cellH) {
  const def = BUILT_IN_PROP_CATALOG[typeName];
  if (!def) return '';
  const normalState = makeDummyState(typeName, false);
  const normalInner = renderToStaticMarkup(
    React.createElement('svg', null, renderShapeListStatic(def.shapes, normalState, palette, 1.35, false))
  ).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

  let redInner = '';
  if (def.canBeRed && def.altShapes && def.altShapes.length > 0) {
    const redState = makeDummyState(typeName, true);
    redInner = renderToStaticMarkup(
      React.createElement('svg', null, renderShapeListStatic(def.altShapes, redState, palette, 1.35, true))
    ).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  }

  const box = def.box || [-8, -8, 8, 0];
  const spanMax = Math.max(12, box[3] - box[1], box[2] - box[0]);
  const scaleViz = Math.min(5.5, Math.max(2.5, 80 / spanMax));
  const isHand = def.anchorKind === 'cam';
  const isWall = def.anchorKind === 'tuong';
  const originX = cx + cellW * 0.33;
  const groundY = cy + cellH - 22;
  const originY = isHand ? cy + 36 : isWall ? cy + cellH - 50 : groundY;

  let redSection = '';
  if (redInner) {
    const redOriginX = cx + cellW * 0.72;
    redSection = `
      <g transform="translate(${redOriginX.toFixed(1)}, ${originY.toFixed(1)}) scale(${scaleViz.toFixed(2)})">${redInner}</g>
      <text x="${redOriginX.toFixed(1)}" y="${(cy + cellH - 5).toFixed(1)}" text-anchor="middle" font-family="Georgia" font-size="7.5" font-weight="bold" fill="#CE472E">đỏ</text>
    `;
  }

  return `
    <g>
      <rect x="${cx}" y="${cy}" width="${cellW}" height="${cellH}" rx="6" fill="${bg}" stroke="#D4C8B8" stroke-width="1"/>
      <text x="${cx + 5}" y="${cy + 13}" font-family="Georgia" font-size="9" font-weight="bold" fill="${ink}">${escXml(typeName)}</text>
      <text x="${cx + 5}" y="${cy + 23}" font-family="Georgia" font-size="7" fill="${palette.inkSecondary}">${escXml(def.labelVi || '')}</text>
      <g transform="translate(${originX.toFixed(1)}, ${originY.toFixed(1)}) scale(${scaleViz.toFixed(2)})">${normalInner}</g>
      ${redSection}
    </g>
  `;
}

/* ═══════ Main ═══════ */
console.log('Rendering Chén 16...');
const sceneW = 1600, sceneViewH = 400;
const chen16Markup = buildChen16SceneSvg(sceneW, sceneViewH);

console.log('Rendering 12 đạo cụ...');
const cols = 6, rows = 2;
const cellW = 250, cellH = 180, gap = 12;
const gridStartX = 30, gridStartY = 500;
const totalW = gridStartX * 2 + cols * cellW + (cols - 1) * gap;
const totalH = gridStartY + rows * cellH + (rows - 1) * gap + 30;

const propCards = TARGET_PROPS.map((name, idx) => {
  const col = idx % cols;
  const row = Math.floor(idx / cols);
  const cx = gridStartX + col * (cellW + gap);
  const cy = gridStartY + row * (cellH + gap);
  return renderPropCard(name, cx, cy, cellW, cellH);
}).join('\n');

// Lữ khách nhỏ ở góc hàng dưới để so tỷ lệ
const travelerMarkup = renderToStaticMarkup(
  React.createElement(CloakedTraveler, {
    x: 0, y: 0, scale: 1.18, facing: 'right', pose: 'stand', leanDeg: 0,
    sitProgress: 0, walkPhase: 0, walkActivity: 0, breathPhase: 0,
    color: ink, accentColor: palette.accentProp, bgColor: bg,
    showTeaCup: false, solidFill: true, strokeWidth: 2.6, opacity: 1, drawProgress: 1,
  })
);

const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
  <rect width="${totalW}" height="${totalH}" fill="#EAE1D3"/>
  <text x="30" y="38" font-family="Georgia" font-size="24" font-weight="bold" fill="${ink}">T2 — ĐẠO CỤ VỀ PHONG CÁCH CŨ: SO SÁNH VỚI CHÉN 16 ĐÃ ĐĂNG</text>
  <text x="30" y="62" font-family="Georgia" font-size="14" fill="${palette.inkSecondary}">Hàng trên: Chén 16 SCRIPT_DE_SANG_MAI (cắt sát vùng cảnh) — Hàng dưới: 12 đạo cụ cạnh Lữ khách, có bản đỏ nếu làm được vật đỏ</text>

  <!-- Hàng trên: Chén 16 cắt sát -->
  <rect x="30" y="80" width="${sceneW}" height="${sceneViewH}" rx="10" fill="${bg}" stroke="#C8BBAE" stroke-width="1.5"/>
  <text x="40" y="98" font-family="Georgia" font-size="13" font-weight="bold" fill="${ink}">Chén 16 — SCRIPT_DE_SANG_MAI (khung giữa video, legacy)</text>
  <svg x="30" y="104" width="${sceneW}" height="${sceneViewH - 24}" viewBox="0 0 ${sceneW} ${sceneViewH}">
    <rect width="${sceneW}" height="${sceneViewH}" fill="${bg}"/>
    ${chen16Markup}
  </svg>

  <!-- Hàng dưới: 12 đạo cụ -->
  ${propCards}
</svg>`;

const outFile = path.join(OUT_DIR, 'T2-so-sanh.png');
rasterize({ svg: fullSvg, w: totalW, h: totalH, out: outFile });
console.log(`✅ Đã xuất ảnh so sánh T2: ${path.relative(ROOT, outFile)}`);
