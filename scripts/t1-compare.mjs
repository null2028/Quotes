/**
 * T1c Comparison: 4 cột phóng to
 *   Col 1: CloakedTraveler BASELINE (7c1fe76) — default stand
 *   Col 2: CloakedTraveler MỚI (sau T1c) — default stand
 *   Col 3: 2 khung Q001 xếp dọc (dòng 3 gục | cú lật nghiêng đầu về hoá đơn), cắt sát
 *   Col 4: Chén 16 SCRIPT_DE_SANG_MAI — khung giữa video (legacy style)
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { CloakedTravelerBaseline } from '../src/kit/CloakedTraveler.baseline.tsx';
import { CloakedTraveler } from '../src/kit/CloakedTraveler.tsx';
import { DeclarativeStagePlayer } from '../src/stage/DeclarativeStagePlayer.tsx';
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

/* ─── Python SVG→PNG rasterizer (macOS CoreSVG) ─── */
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
cg.CGContextSetInterpolationQuality.argtypes = [c_void_p, c_uint32]
cg.CGContextDrawImage.argtypes = [c_void_p, CGRect, c_void_p]
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
mode = payload["mode"]
out_png = payload["out"]
if mode == "single":
    svg = clean_svg(payload["svg"])
    w, h = int(payload["w"]), int(payload["h"])
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
    input: JSON.stringify(payload),
    encoding: 'utf8',
    maxBuffer: 96 * 1024 * 1024,
  });
  if (res.status !== 0) throw new Error(`Lỗi kết xuất PNG: ${res.stderr || res.stdout}`);
}

function escXml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

const palette = THEME_PALETTES.MINIMAL_LIGHT;
const bg = palette.background;
const ink = palette.inkPrimary;

/* ═══════ Helpers ═══════ */
function renderTravelerSoloCropped(Component, title, subtitle) {
  const markup = renderToStaticMarkup(
    React.createElement(Component, {
      x: 0, y: 0, scale: 1.18, facing: 'right', pose: 'stand',
      leanDeg: 0, sitProgress: 0, walkPhase: 0, walkActivity: 0,
      breathPhase: 0, color: ink, accentColor: palette.accentProp,
      bgColor: bg, showTeaCup: false, solidFill: true,
      strokeWidth: 2.6, opacity: 1, drawProgress: 1,
    })
  );
  const vbX = -22, vbY = -78, vbW = 44, vbH = 88;
  return { markup, vbX, vbY, vbW, vbH, title, subtitle };
}

function buildQ001TimelineAndScript() {
  const q001Path = path.join(ROOT, 'qa-artifacts-ci/q001-semantic.json');
  const rawJson = JSON.parse(fs.readFileSync(q001Path, 'utf8'));
  const lines = [
    'Tháng năm tất tả chưa từng dừng,',
    'Tiền chưa đầy túi đã đau lưng.',
    'Lắm hôm mệt quá toan buông xuống,',
    'Nhìn tờ hóa đơn… lại khỏe tưng!',
  ];
  const motion = {
    archetype: 'BOULDER_TO_BENCH',
    pacingMode: 'CONTEMPLATIVE',
    stateA: { intensity: 0.78, spread: 0.22, tiltDeg: -12 },
    stateB: { intensity: 0.08, spread: 0.72, tiltDeg: 0 },
  };
  const timeline = computeTimelineSync({
    id: 'q001-t1c', textFormat: 'POEM', segments: lines,
    pivotWord: 'lại khỏe tưng', highlightStyle: 'BOTH',
    targetDurationSeconds: 15, durationMode: 'FIXED',
    typingSpeedMsPerChar: 55, holdAfterFinishSeconds: 5.5,
    themeId: 'MINIMAL_LIGHT', motion,
    bgm: { audioMode: 'PIVOT_ACCENT', foleyPivotStyle: 'AUTO' },
    brandText: 'TRÀ NGUỘI',
  });
  const valRes = validateAndCompileStageInput(rawJson, timeline);
  return { script: valRes.compiledScript, timeline, motion };
}

function renderQ001Frame(script, timeline, motion, f) {
  const fps = timeline.fps;
  const mState = evaluateMotionState(
    f, fps, timeline.pivotFrame, timeline.allTextFinishedFrame,
    timeline.durationInFrames, motion
  );
  return renderToStaticMarkup(
    React.createElement(DeclarativeStagePlayer, {
      script, state: mState, palette,
      strokeWidth: LAYOUT_TOKENS.strokeWidth,
      frame: f, fps,
      durationInFrames: timeline.durationInFrames,
      timeline,
      stageBox: { width: 540, height: 630 },
      showDebugBBoxes: false,
    })
  );
}

function buildChen16Frame() {
  const cupPath = path.join(ROOT, 'data/cups/quote-016.json');
  const rawJson = JSON.parse(fs.readFileSync(cupPath, 'utf8'));
  const cupProps = rawJson.props;
  const sid = cupProps.motion?.sceneId || cupProps.motion?.archetype;
  const scriptInput = resolveStageScript(sid, cupProps.motion?.stageScript);
  const timeline = computeTimelineSync({
    id: 'chen16-t1c', textFormat: cupProps.textFormat || 'POEM',
    segments: cupProps.segments,
    pivotWord: (cupProps.pivotWord || '').replace(/[!?.…]+$/u, ''),
    highlightStyle: 'BOTH', targetDurationSeconds: 15,
    durationMode: 'FIXED', typingSpeedMsPerChar: 55,
    holdAfterFinishSeconds: 5.5, themeId: cupProps.themeId || 'MINIMAL_LIGHT',
    motion: cupProps.motion, bgm: cupProps.bgm, brandText: 'TRÀ NGUỘI',
  });
  const valRes = validateAndCompileStageInput(scriptInput, timeline);
  const script = valRes.compiledScript;
  const vdna = resolveVisualDNA(cupProps, script);
  const fps = timeline.fps;
  const segs = timeline.segmentTimings || [];
  const f = segs[1]
    ? Math.min(timeline.pivotFrame - 12, segs[1].endTypingFrame + 6)
    : Math.round(4.0 * fps);
  const mState = evaluateMotionState(
    f, fps, timeline.pivotFrame, timeline.allTextFinishedFrame,
    timeline.durationInFrames, cupProps.motion
  );
  return renderToStaticMarkup(
    React.createElement(DeclarativeStagePlayer, {
      script, state: mState, palette,
      strokeWidth: LAYOUT_TOKENS.strokeWidth,
      frame: f, fps,
      durationInFrames: timeline.durationInFrames,
      timeline, visualDNA: vdna,
      stageBox: { width: 540, height: 630 },
      showDebugBBoxes: false,
    })
  );
}

/* ═══════ Main: Composite 4 cột vào 1 SVG lớn ═══════ */
const W = 2200, H = 740;
const colW = 520, gap = 20, startX = 30, topY = 80;
const colH = 620;

// --- Cột 1: Baseline ---
console.log('Cột 1: Baseline (7c1fe76)...');
const c1 = renderTravelerSoloCropped(CloakedTravelerBaseline, '1. Baseline (7c1fe76)', 'Bóng mực đen đặc gốc');

// --- Cột 2: Mới ---
console.log('Cột 2: Mới (sau T1c)...');
const c2 = renderTravelerSoloCropped(CloakedTraveler, '2. Sau T1c', 'Phải trông y hệt cột 1');

// --- Cột 3: Q001 2 khung xếp dọc ---
console.log('Cột 3: Q001 (dòng 3 gục + cú lật)...');
const { script: q001Script, timeline: q001TL, motion: q001Motion } = buildQ001TimelineAndScript();
const fps = q001TL.fps;
const segs = q001TL.segmentTimings || [];
const fDong3 = segs[2]
  ? Math.min(q001TL.pivotFrame - 8, segs[2].endTypingFrame + 6)
  : Math.round(5.4 * fps);
const fCuLat = Math.min(
  q001TL.durationInFrames - 90,
  q001TL.pivotFrame + Math.round(0.55 * fps)
);
const q001Dong3 = renderQ001Frame(q001Script, q001TL, q001Motion, fDong3);
const q001CuLat = renderQ001Frame(q001Script, q001TL, q001Motion, fCuLat);

// --- Cột 4: Chén 16 ---
console.log('Cột 4: Chén 16 SCRIPT_DE_SANG_MAI...');
const chen16Markup = buildChen16Frame();

// viewBox for scene crops (nhân vật + đạo cụ, khu vực trung tâm)
const svbX = 160, svbY = 258, svbW = 220, svbH = 164;

// Build composite SVG
const col1X = startX;
const col2X = startX + colW + gap;
const col3X = startX + 2 * (colW + gap);
const col4X = startX + 3 * (colW + gap);

const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#EAE1D3"/>
  <text x="30" y="44" font-family="Georgia" font-size="28" font-weight="bold" fill="${ink}">T1c — SO SÁNH LỮ KHÁCH: BASELINE vs MỚI vs Q001 (SIT+SLUMP+GAZE) vs CHÉN 16</text>
  <text x="30" y="68" font-family="Georgia" font-size="16" fill="${palette.inkSecondary}">Cột 1-2: default stand phóng to — cột 3: Q001 dòng 3 (gục) + cú lật (nghiêng đầu) — cột 4: Chén 16 (legacy) — Tất cả phải cùng phong cách bóng mực đen đặc</text>

  <!-- Cột 1: Baseline -->
  <rect x="${col1X}" y="${topY}" width="${colW}" height="${colH}" rx="10" fill="${bg}" stroke="#C8BBAE" stroke-width="1.5"/>
  <text x="${col1X+12}" y="${topY+24}" font-family="Georgia" font-size="17" font-weight="bold" fill="${ink}">1. Baseline (7c1fe76)</text>
  <text x="${col1X+12}" y="${topY+44}" font-family="Georgia" font-size="13" fill="${palette.inkSecondary}">Bóng mực đen đặc gốc</text>
  <svg x="${col1X+10}" y="${topY+56}" width="${colW-20}" height="${colH-70}" viewBox="${c1.vbX} ${c1.vbY} ${c1.vbW} ${c1.vbH}">
    <rect x="${c1.vbX}" y="${c1.vbY}" width="${c1.vbW}" height="${c1.vbH}" fill="${bg}"/>
    <line x1="${c1.vbX}" y1="0" x2="${c1.vbX+c1.vbW}" y2="0" stroke="${palette.inkSecondary}" stroke-width="0.3" opacity="0.4"/>
    ${c1.markup}
  </svg>

  <!-- Cột 2: Mới -->
  <rect x="${col2X}" y="${topY}" width="${colW}" height="${colH}" rx="10" fill="${bg}" stroke="#C8BBAE" stroke-width="1.5"/>
  <text x="${col2X+12}" y="${topY+24}" font-family="Georgia" font-size="17" font-weight="bold" fill="${ink}">2. Sau T1c (mới)</text>
  <text x="${col2X+12}" y="${topY+44}" font-family="Georgia" font-size="13" fill="${palette.inkSecondary}">Phải trông y hệt cột 1</text>
  <svg x="${col2X+10}" y="${topY+56}" width="${colW-20}" height="${colH-70}" viewBox="${c2.vbX} ${c2.vbY} ${c2.vbW} ${c2.vbH}">
    <rect x="${c2.vbX}" y="${c2.vbY}" width="${c2.vbW}" height="${c2.vbH}" fill="${bg}"/>
    <line x1="${c2.vbX}" y1="0" x2="${c2.vbX+c2.vbW}" y2="0" stroke="${palette.inkSecondary}" stroke-width="0.3" opacity="0.4"/>
    ${c2.markup}
  </svg>

  <!-- Cột 3: Q001 2 khung -->
  <rect x="${col3X}" y="${topY}" width="${colW}" height="${colH}" rx="10" fill="${bg}" stroke="#C8BBAE" stroke-width="1.5"/>
  <text x="${col3X+12}" y="${topY+24}" font-family="Georgia" font-size="17" font-weight="bold" fill="${ink}">3a. Q001 — Dòng 3 (gục)</text>
  <text x="${col3X+12}" y="${topY+44}" font-family="Georgia" font-size="13" fill="${palette.inkSecondary}">t=${(fDong3/fps).toFixed(2)}s — gục đầu xuống bàn</text>
  <svg x="${col3X+5}" y="${topY+52}" width="${colW-10}" height="${(colH-74)/2}" viewBox="${svbX} ${svbY} ${svbW} ${svbH}">
    <rect x="${svbX}" y="${svbY}" width="${svbW}" height="${svbH}" fill="${bg}"/>
    ${q001Dong3}
  </svg>
  <text x="${col3X+12}" y="${topY+52+(colH-74)/2+18}" font-family="Georgia" font-size="17" font-weight="bold" fill="${ink}">3b. Q001 — Cú lật +0.4s</text>
  <text x="${col3X+12}" y="${topY+52+(colH-74)/2+36}" font-family="Georgia" font-size="13" fill="${palette.inkSecondary}">t=${(fCuLat/fps).toFixed(2)}s — đầu nghiêng về hoá đơn</text>
  <svg x="${col3X+5}" y="${topY+52+(colH-74)/2+42}" width="${colW-10}" height="${(colH-74)/2-42}" viewBox="${svbX} ${svbY} ${svbW} ${svbH}">
    <rect x="${svbX}" y="${svbY}" width="${svbW}" height="${svbH}" fill="${bg}"/>
    ${q001CuLat}
  </svg>

  <!-- Cột 4: Chén 16 -->
  <rect x="${col4X}" y="${topY}" width="${colW}" height="${colH}" rx="10" fill="${bg}" stroke="#C8BBAE" stroke-width="1.5"/>
  <text x="${col4X+12}" y="${topY+24}" font-family="Georgia" font-size="17" font-weight="bold" fill="${ink}">4. Chén 16 — Legacy</text>
  <text x="${col4X+12}" y="${topY+44}" font-family="Georgia" font-size="13" fill="${palette.inkSecondary}">SCRIPT_DE_SANG_MAI — so nét với cột 1-2</text>
  <svg x="${col4X+5}" y="${topY+52}" width="${colW-10}" height="${colH-66}" viewBox="${svbX} ${svbY} ${svbW} ${svbH}">
    <rect x="${svbX}" y="${svbY}" width="${svbW}" height="${svbH}" fill="${bg}"/>
    ${chen16Markup}
  </svg>
</svg>`;

const outFile = path.join(OUT_DIR, 'T1-so-sanh.png');
rasterize({ mode: 'single', svg: fullSvg, w: W, h: H, out: outFile });
console.log(`✅ Đã xuất ảnh so sánh T1c: ${path.relative(ROOT, outFile)}`);

// Cleanup baseline file
try { fs.unlinkSync(path.join(ROOT, 'src/kit/CloakedTraveler.baseline.tsx')); } catch {}
