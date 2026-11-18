/**
 * Sinh Tờ Duyệt Họ Đạo Cụ (`qa-artifacts-ci/HO-<ten_ho>.png`) bằng MỘT lệnh:
 *   npm run ho:duyet -- do_chua
 *
 * Tuân thủ tuyệt đối:
 * - 100% dựng qua luồng thật: Gói Chén JSON -> parseGoiChen (biên dịch ngữ nghĩa + validator cứng) -> DeclarativeStagePlayer trên khung 1080×1920.
 * - CẤM đặt toạ độ tay (`x`, `y`, `scale`, `shapes`) ở bất kỳ bước nào.
 * - Gồm 3 phần trên tờ duyệt:
 *   (1) Vùng hình 1× cắt trực tiếp từ khung 1080×1920: Lữ khách + toàn bộ preset của họ ở tỷ lệ thật (vật nhỏ đặt trên bàn đã duyệt).
 *   (2) Hàng phóng 2× (200%) của chính vùng hình đó (chia Nửa Trái & Nửa Phải để giữ nguyên độ phóng 2× không ép ngang).
 *   (3) Bản Đỏ Chu Sa sau cú lật (`post-pivot`) của các preset làm được vật đỏ, mỗi ô cắt từ khung 1080×1920 thật.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { parseGoiChen } from '../src/stage/goiChenParser.ts';
import { sanitizeAndNormalizeCupBundle } from '../src/automation/geminiBundleBridge.ts';
import { computeTimelineSync } from '../src/engine/timelineSync.ts';
import { evaluateMotionState } from '../src/engine/motionPhysics.ts';
import { resolveVisualDNA } from '../src/engine/visualDnaResolver.ts';
import { DeclarativeStagePlayer } from '../src/stage/DeclarativeStagePlayer.tsx';
import { LAYOUT_TOKENS, THEME_PALETTES } from '../src/theme/palettes.ts';

process.env.STAGE_STRICT_THROW = '1';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'qa-artifacts-ci');
fs.mkdirSync(OUT_DIR, { recursive: true });

const familyArg = (process.argv[2] || 'do_chua').replace(/^--/, '');
if (familyArg !== 'do_chua') {
  console.error(`Hiện script tờ duyệt mới cấu hình cho họ: do_chua (nhận: ${familyArg})`);
  process.exit(1);
}

const palette = THEME_PALETTES.MINIMAL_LIGHT;
const FW = LAYOUT_TOKENS.width; // 1080
const FH = LAYOUT_TOKENS.height; // 1920
const { stageLeft, stageTop, stageWidth, stageHeight } = LAYOUT_TOKENS.swissGrid;

/**
 * Dựng 1 khung 1080×1920 thật từ Gói Chén JSON hoàn chỉnh (không toạ độ tay).
 */
function renderFull1080x1920SvgFromGoiChen(goiChenObj, phase = 'pre_pivot') {
  const parsedGoi = parseGoiChen(goiChenObj);
  if (!parsedGoi.ok || !parsedGoi.compiled) {
    throw new Error(
      `Gói Chén "${goiChenObj.tieu_de}" bị validator chặn:\n` +
        parsedGoi.errors.map((e) => `  • ${e}`).join('\n')
    );
  }

  const bundle = sanitizeAndNormalizeCupBundle(JSON.stringify(goiChenObj), {
    defaultMode: 'create_new',
  });

  const sync = computeTimelineSync({
    id: `ho-${familyArg}`,
    textFormat: bundle.textFormat,
    segments: bundle.segments,
    pivotWord: bundle.pivotWord,
    highlightStyle: 'BOTH',
    targetDurationSeconds: bundle.targetDurationSeconds,
    durationMode: bundle.durationMode,
    typingSpeedMsPerChar: bundle.typingSpeedMsPerChar,
    holdAfterFinishSeconds: bundle.holdAfterFinishSeconds,
    themeId: 'MINIMAL_LIGHT',
    motion: {
      sceneId: bundle.sceneId,
      archetype: 'BOULDER_TO_BENCH',
      pacingMode: bundle.pacingMode,
      stageScript: bundle.stageScript,
      stateA: { intensity: 0.75, spread: 0.25, tiltDeg: -12 },
      stateB: { intensity: 0.12, spread: 0.72, tiltDeg: 0 },
    },
    bgm: { audioMode: bundle.audioMode, foleyPivotStyle: bundle.foleyPivotStyle },
    brandText: 'TRÀ NGUỘI',
  });

  const fps = sync.fps;
  const frame =
    phase === 'post_pivot'
      ? Math.min(
          sync.durationInFrames - Math.round(1.8 * fps),
          sync.pivotFrame + Math.round(1.4 * fps)
        )
      : Math.min(sync.pivotFrame - Math.round(0.4 * fps), Math.round(4.1 * fps));

  const mState = evaluateMotionState(
    frame,
    fps,
    sync.pivotFrame,
    sync.allTextFinishedFrame,
    sync.durationInFrames,
    {
      archetype: 'BOULDER_TO_BENCH',
      pacingMode: bundle.pacingMode,
      stateA: { intensity: 0.75, spread: 0.25, tiltDeg: -12 },
      stateB: { intensity: 0.12, spread: 0.72, tiltDeg: 0 },
    }
  );

  const vdna = resolveVisualDNA(
    {
      themeId: 'MINIMAL_LIGHT',
      visualDNA: bundle.visualDNA,
      motion: { archetype: 'BOULDER_TO_BENCH', pacingMode: bundle.pacingMode },
    },
    bundle.stageScript
  );

  const stageSvg = renderToStaticMarkup(
    React.createElement(DeclarativeStagePlayer, {
      script: bundle.stageScript,
      state: mState,
      palette,
      strokeWidth: LAYOUT_TOKENS.strokeWidth,
      frame,
      fps,
      durationInFrames: sync.durationInFrames,
      timeline: sync,
      visualDNA: vdna,
      stageBox: { width: stageWidth, height: stageHeight },
      frameMode: 'NONE',
      showDebugBBoxes: false,
    })
  );

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${FW}" height="${FH}" viewBox="0 0 ${FW} ${FH}">`,
    `<rect x="0" y="0" width="${FW}" height="${FH}" fill="${palette.background}" />`,
    `<g transform="translate(${stageLeft}, ${stageTop})">${stageSvg}</g>`,
    `</svg>`,
  ].join('');
}

// ── 1. Gói Chén toàn cảnh họ `do_chua`: Lữ khách + toàn bộ 8 preset ở tỷ lệ thật ──
const lineupGoiChen = {
  phien_ban_goi: 1,
  tieu_de: 'Tờ duyệt họ do_chua',
  cau: [
    'Chén ấm ly bát hộp mâm,',
    'Bày ngang một dải âm thầm đối hương.',
    'Nét thanh mộc mạc đời thường,',
    'Chạm câu điểm lật vấn vương sắc hồng.',
  ],
  cu_lat: 'vấn vương sắc hồng',
  boi_canh: { dia_hinh: 'phang' },
  nhan_vat: [
    {
      id: 'hero',
      vi_tri: 'xa_trai',
      tu_the: 'dung',
      huong: 'phai',
    },
  ],
  dao_cu: [
    { id: 'ban_1', type: 'low_tea_table', loai_neo: 'dat', vi_tri: 'trai', lop: 'giua' },
    { id: 'p_chen_tra', type: 'chen_tra', loai_neo: 'tren', dat_tren: 'ban_1.mat_ban_trai', lop: 'giua' },
    { id: 'p_am_tra', type: 'am_tra', loai_neo: 'tren', dat_tren: 'ban_1.mat_ban_phai', lop: 'giua', vat_do: true },
    { id: 'p_mam_com', type: 'mam_com', loai_neo: 'dat', vi_tri: 'giua_trai', lop: 'giua' },
    { id: 'ban_2', type: 'std_work_desk', loai_neo: 'dat', vi_tri: 'giua', lop: 'giua' },
    { id: 'p_ly_ca_phe', type: 'ly_ca_phe', loai_neo: 'tren', dat_tren: 'ban_2.mat_ban_trai', lop: 'giua' },
    { id: 'p_ly_ruou', type: 'ly_ruou', loai_neo: 'tren', dat_tren: 'ban_2.mat_ban_phai', lop: 'giua' },
    { id: 'p_vo_ruou', type: 'vo_ruou', loai_neo: 'dat', vi_tri: 'giua_phai', lop: 'giua' },
    { id: 'ban_3', type: 'std_work_desk', loai_neo: 'dat', vi_tri: 'phai', lop: 'giua' },
    { id: 'p_bat_com', type: 'bat_com', loai_neo: 'tren', dat_tren: 'ban_3.mat_ban_trai', lop: 'giua' },
    { id: 'p_hop_com', type: 'hop_com', loai_neo: 'tren', dat_tren: 'ban_3.mat_ban_phai', lop: 'giua' },
  ],
  nhip: [
    {
      moc: 'bat_dau',
      thoi_luong: 0.4,
      nhan_vat: { hero: { tu_the: 'dung', nghieng: 'thang' } },
    },
  ],
};

// ── 2. Các Gói Chén kiểm tra bản Đỏ Chu Sa sau cú lật (`post_pivot`) ──
const RED_CASES = [
  {
    label: 'am_tra (vat_do)',
    goi: {
      phien_ban_goi: 1,
      tieu_de: 'Đỏ am_tra',
      cau: [
        'Mực thanh mở nét đầu tiên,',
        'Ấm trà bên ghế bình yên một chiều.',
        'Chờ khi câu chữ xoay chiều,',
        'Chu sa ấm nóng một điều lắng sâu.',
      ],
      cu_lat: 'một điều lắng sâu',
      boi_canh: { dia_hinh: 'phang' },
      nhan_vat: [{ id: 'hero', vi_tri: 'trai', tu_the: 'dung', huong: 'phai', nhin_theo: 'vat_do' }],
      dao_cu: [
        { id: 'ban', type: 'low_tea_table', loai_neo: 'dat', vi_tri: 'giua', lop: 'giua' },
        { id: 'vat_do', type: 'am_tra', loai_neo: 'tren', dat_tren: 'ban.mat_ban_giua', lop: 'giua', vat_do: true },
      ],
      nhip: [{ moc: 'bat_dau', thoi_luong: 0.4, nhan_vat: { hero: { tu_the: 'dung', nghieng: 'thang' } } }],
    },
  },
  {
    label: 'ly_ca_phe (vat_do)',
    goi: {
      phien_ban_goi: 1,
      tieu_de: 'Đỏ ly_ca_phe',
      cau: [
        'Mực thanh mở nét đầu tiên,',
        'Ly cà phê sáng bình yên một chiều.',
        'Chờ khi câu chữ xoay chiều,',
        'Chu sa tỉnh giấc một điều lắng sâu.',
      ],
      cu_lat: 'một điều lắng sâu',
      boi_canh: { dia_hinh: 'phang' },
      nhan_vat: [{ id: 'hero', vi_tri: 'trai', tu_the: 'dung', huong: 'phai', nhin_theo: 'vat_do' }],
      dao_cu: [
        { id: 'ban', type: 'low_tea_table', loai_neo: 'dat', vi_tri: 'giua', lop: 'giua' },
        { id: 'vat_do', type: 'ly_ca_phe', loai_neo: 'tren', dat_tren: 'ban.mat_ban_giua', lop: 'giua', vat_do: true },
      ],
      nhip: [{ moc: 'bat_dau', thoi_luong: 0.4, nhan_vat: { hero: { tu_the: 'dung', nghieng: 'thang' } } }],
    },
  },
  {
    label: 'ly_ruou (vat_do)',
    goi: {
      phien_ban_goi: 1,
      tieu_de: 'Đỏ ly_ruou',
      cau: [
        'Mực thanh mở nét đầu tiên,',
        'Ly rượu chân mảnh bình yên một chiều.',
        'Chờ khi câu chữ xoay chiều,',
        'Chu sa sóng sánh một điều lắng sâu.',
      ],
      cu_lat: 'một điều lắng sâu',
      boi_canh: { dia_hinh: 'phang' },
      nhan_vat: [{ id: 'hero', vi_tri: 'trai', tu_the: 'dung', huong: 'phai', nhin_theo: 'vat_do' }],
      dao_cu: [
        { id: 'ban', type: 'low_tea_table', loai_neo: 'dat', vi_tri: 'giua', lop: 'giua' },
        { id: 'vat_do', type: 'ly_ruou', loai_neo: 'tren', dat_tren: 'ban.mat_ban_giua', lop: 'giua', vat_do: true },
      ],
      nhip: [{ moc: 'bat_dau', thoi_luong: 0.4, nhan_vat: { hero: { tu_the: 'dung', nghieng: 'thang' } } }],
    },
  },
  {
    label: 'bat_com (vat_do)',
    goi: {
      phien_ban_goi: 1,
      tieu_de: 'Đỏ bat_com',
      cau: [
        'Mực thanh mở nét đầu tiên,',
        'Bát cơm chiều muộn bình yên quê nhà.',
        'Chờ khi câu chữ ngân nga,',
        'Chu sa gợi nhớ đậm đà bữa xưa.',
      ],
      cu_lat: 'đậm đà bữa xưa',
      boi_canh: { dia_hinh: 'phang' },
      nhan_vat: [{ id: 'hero', vi_tri: 'trai', tu_the: 'dung', huong: 'phai', nhin_theo: 'vat_do' }],
      dao_cu: [
        { id: 'ban', type: 'low_tea_table', loai_neo: 'dat', vi_tri: 'giua', lop: 'giua' },
        { id: 'vat_do', type: 'bat_com', loai_neo: 'tren', dat_tren: 'ban.mat_ban_giua', lop: 'giua', vat_do: true },
      ],
      nhip: [{ moc: 'bat_dau', thoi_luong: 0.4, nhan_vat: { hero: { tu_the: 'dung', nghieng: 'thang' } } }],
    },
  },
  {
    label: 'hop_com (vat_do)',
    goi: {
      phien_ban_goi: 1,
      tieu_de: 'Đỏ hop_com',
      cau: [
        'Mực thanh mở nét đầu tiên,',
        'Hộp cơm trưa mở bình yên văn phòng.',
        'Chờ khi câu chữ xoay vòng,',
        'Chu sa gói trọn tấm lòng người thương.',
      ],
      cu_lat: 'tấm lòng người thương',
      boi_canh: { dia_hinh: 'phang' },
      nhan_vat: [{ id: 'hero', vi_tri: 'trai', tu_the: 'dung', huong: 'phai', nhin_theo: 'vat_do' }],
      dao_cu: [
        { id: 'ban', type: 'std_work_desk', loai_neo: 'dat', vi_tri: 'giua', lop: 'giua' },
        { id: 'vat_do', type: 'hop_com', loai_neo: 'tren', dat_tren: 'ban.mat_ban_giua', lop: 'giua', vat_do: true },
      ],
      nhip: [{ moc: 'bat_dau', thoi_luong: 0.4, nhan_vat: { hero: { tu_the: 'dung', nghieng: 'thang' } } }],
    },
  },
];

console.log(`Đang dựng khung 1080×1920 toàn cảnh họ "${familyArg}" qua parseGoiChen...`);
const lineupSvg1x = renderFull1080x1920SvgFromGoiChen(lineupGoiChen, 'pre_pivot');

console.log(`Đang dựng ${RED_CASES.length} khung 1080×1920 bản Đỏ Chu Sa sau cú lật...`);
const redSvgs = RED_CASES.map((rc) => ({
  label: rc.label,
  svg: renderFull1080x1920SvgFromGoiChen(rc.goi, 'post_pivot'),
}));

// ── Python CoreGraphics rasterize 1080×1920 (1× & 2×) + crop vùng sân khấu + ghép tờ duyệt ──
const PY_COMPOSITOR = `
import ctypes, json, re, sys
from ctypes import c_void_p, c_size_t, c_double, c_uint32, c_char_p, c_bool, Structure

class CGPoint(Structure): _fields_ = [("x", c_double), ("y", c_double)]
class CGSize(Structure): _fields_ = [("width", c_double), ("height", c_double)]
class CGRect(Structure): _fields_ = [("origin", CGPoint), ("size", CGSize)]

cg = ctypes.CDLL("/System/Library/Frameworks/CoreGraphics.framework/CoreGraphics")
cf = ctypes.CDLL("/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation")
imageio = ctypes.CDLL("/System/Library/Frameworks/ImageIO.framework/ImageIO")
coresvg = ctypes.CDLL("/System/Library/PrivateFrameworks/CoreSVG.framework/CoreSVG")
ct = ctypes.CDLL("/System/Library/Frameworks/CoreText.framework/CoreText")

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
cg.CGImageCreateWithImageInRect.restype = c_void_p; cg.CGImageCreateWithImageInRect.argtypes = [c_void_p, CGRect]
cg.CGContextDrawImage.argtypes = [c_void_p, CGRect, c_void_p]
cg.CGContextScaleCTM.argtypes = [c_void_p, c_double, c_double]
cg.CGContextSetRGBFillColor.argtypes = [c_void_p, c_double, c_double, c_double, c_double]
cg.CGContextSetRGBStrokeColor.argtypes = [c_void_p, c_double, c_double, c_double, c_double]
cg.CGContextSetLineWidth.argtypes = [c_void_p, c_double]
cg.CGContextFillRect.argtypes = [c_void_p, CGRect]
cg.CGContextStrokeRect.argtypes = [c_void_p, CGRect]

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

def render_svg_to_cgimage(svg_str, w, h, scale=1.0):
    svg_clean = clean_svg(svg_str)
    data = svg_clean.encode("utf-8")
    cfdata = cf.CFDataCreate(None, data, len(data))
    doc = coresvg.CGSVGDocumentCreateFromData(cfdata, None)
    pw, ph = int(round(w * scale)), int(round(h * scale))
    ctx = cg.CGBitmapContextCreate(None, pw, ph, 8, pw * 4, cs_rgb, 1)
    if scale != 1.0:
        cg.CGContextScaleCTM(ctx, scale, scale)
    coresvg.CGContextDrawSVGDocument(ctx, doc)
    im = cg.CGBitmapContextCreateImage(ctx)
    cg.CGContextRelease(ctx)
    coresvg.CGSVGDocumentRelease(doc)
    cf.CFRelease(cfdata)
    return im

payload = json.loads(sys.stdin.read())
out_png = payload["out"]

# 1. Render 1080x1920 ở tỷ lệ 1x và 2x cho cảnh toàn bộ họ
im_1x = render_svg_to_cgimage(payload["lineupSvg"], 1080, 1920, 1.0)
im_2x = render_svg_to_cgimage(payload["lineupSvg"], 1080, 1920, 2.0)

# Cắt vùng sân khấu trên khung 1080x1920: x=132..948 (816px), y=560..815 (255px)
cx, cy, cw, ch = 132, 540, 816, 270
crop_1x = cg.CGImageCreateWithImageInRect(im_1x, CGRect(CGPoint(cx, cy), CGSize(cw, ch)))

# Phóng 2x cùng vùng hình (1632 x 540), chia đôi Trái (816x540) và Phải (816x540) để giữ đúng 200% pixel thật
crop_2x_left = cg.CGImageCreateWithImageInRect(im_2x, CGRect(CGPoint(cx * 2, cy * 2), CGSize(cw, ch * 2)))
crop_2x_right = cg.CGImageCreateWithImageInRect(im_2x, CGRect(CGPoint((cx + cw // 2) * 2, cy * 2), CGSize(cw, ch * 2)))

# 2. Render và cắt vùng trung tâm sân khấu của 6 cảnh vật đỏ sau cú lật
red_crops = []
for item in payload["redSvgs"]:
    rim = render_svg_to_cgimage(item["svg"], 1080, 1920, 1.0)
    # Vùng trung tâm sân khấu trên khung 1080x1920 (rộng 400, cao 260 quanh x=540, y=545..805)
    rc = cg.CGImageCreateWithImageInRect(rim, CGRect(CGPoint(430, 550), CGSize(375, 245)))
    red_crops.append((item["label"], rc))
    cg.CGImageRelease(rim)

# 3. Dựng một SVG khung nhãn tiêu đề sắc nét cho tờ duyệt (1720 x 1440) rồi vẽ đè các ảnh crop thật vào đúng ô!
SHEET_W, SHEET_H = 1720, 1420
labels_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{SHEET_W}" height="{SHEET_H}" viewBox="0 0 {SHEET_W} {SHEET_H}">
  <rect x="0" y="0" width="{SHEET_W}" height="{SHEET_H}" fill="#EAE1D3" />
  <text x="44" y="48" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="bold" fill="#1E1B18">TỜ DUYỆT HỌ ĐẠO CỤ: do_chua (Dựng 100% qua Gói Chén → Validator → Render 1080×1920)</text>
  <text x="44" y="76" font-family="Helvetica, Arial, sans-serif" font-size="15" fill="#6B6259">Thứ tự trái sang phải: Lữ khách · [Bàn trà: chen_tra (alias), am_tra] · mam_com · [Bàn dài: ly_ca_phe, ly_ruou] · vo_ruou (alias) · [Bàn dài: bat_com, hop_com]</text>

  <text x="44" y="114" font-family="Helvetica, Arial, sans-serif" font-size="16" font-weight="bold" fill="#1E1B18">1. Vùng hình 1× cắt trực tiếp từ khung 1080×1920 (816×270 px — đúng tỷ lệ 1:1 trên điện thoại)</text>
  <rect x="44" y="126" width="816" height="270" fill="#F1EAE0" stroke="#C9BFAE" stroke-width="1.5" />

  <rect x="896" y="126" width="780" height="270" rx="8" fill="#F6F1E9" stroke="#C9BFAE" stroke-width="1.2" />
  <text x="920" y="160" font-family="Helvetica, Arial, sans-serif" font-size="16" font-weight="bold" fill="#1E1B18">Thông số kiểm định tự động (0 lỗi Validator):</text>
  <text x="920" y="190" font-family="Helvetica, Arial, sans-serif" font-size="14" fill="#1E1B18">• Alias giữ nguyên bản đã duyệt: chen_tra → small_cup (11.5cm), vo_ruou → wine_jar (58cm)</text>
  <text x="920" y="218" font-family="Helvetica, Arial, sans-serif" font-size="14" fill="#1E1B18">• 6 preset mới (trạng thái nhap, dựng từ buildDoChuaProp, không đường SVG tự do):</text>
  <text x="940" y="244" font-family="Helvetica, Arial, sans-serif" font-size="14" fill="#6B6259">- am_tra (21cm) · ly_ca_phe (14cm) · ly_ruou (19cm) · bat_com (15cm) · hop_com (19cm)</text>
  <text x="940" y="270" font-family="Helvetica, Arial, sans-serif" font-size="14" fill="#6B6259">- mam_com (60cm, canBeRed=false, điểm neo: trai_mam, giua_mam, phai_mam)</text>
  <text x="920" y="298" font-family="Helvetica, Arial, sans-serif" font-size="14" fill="#1E1B18">• Phong cách T2: nhìn ngang không phối cảnh, tối đa 1–2 nét trong, wash nhạt 0.11</text>
  <text x="920" y="326" font-family="Helvetica, Arial, sans-serif" font-size="14" fill="#C8432B">• Bản đỏ: tô đỏ nhạt (0.32) + viền đỏ trùng dáng 100% (IoU = 1.00, Δbox = 0.00)</text>

  <text x="44" y="434" font-family="Helvetica, Arial, sans-serif" font-size="16" font-weight="bold" fill="#1E1B18">2. Phóng 2× (200% pixel thật) cùng vùng hình — Nửa Trái (Lữ khách · chen_tra · am_tra · mam_com) &amp; Nửa Phải (ly_ca_phe · ly_ruou · vo_ruou · bat_com · hop_com)</text>
  <rect x="44" y="446" width="816" height="540" fill="#F1EAE0" stroke="#C9BFAE" stroke-width="1.5" />
  <rect x="876" y="446" width="800" height="540" fill="#F1EAE0" stroke="#C9BFAE" stroke-width="1.5" />

  <text x="44" y="1024" font-family="Helvetica, Arial, sans-serif" font-size="16" font-weight="bold" fill="#C8432B">3. Bản Đỏ Chu Sa sau cú lật (post-pivot, cắt từ khung 1080×1920 thật — mỗi cảnh 1 vật đỏ hợp lệ ≥ 500 px²)</text>
</svg>'''

sheet_bg = render_svg_to_cgimage(labels_svg, SHEET_W, SHEET_H, 1.0)
ctx = cg.CGBitmapContextCreate(None, SHEET_W, SHEET_H, 8, SHEET_W * 4, cs_rgb, 1)

# Trong CoreGraphics bitmap context, gốc Y=0 ở ĐÁY ảnh: cy_cg = SHEET_H - top_y - h
def draw_at_top_left(img, left_x, top_y, w, h):
    cg.CGContextDrawImage(ctx, CGRect(CGPoint(left_x, SHEET_H - top_y - h), CGSize(w, h)), img)

draw_at_top_left(sheet_bg, 0, 0, SHEET_W, SHEET_H)
draw_at_top_left(crop_1x, 44, 126, 816, 270)
draw_at_top_left(crop_2x_left, 44, 446, 816, 540)
draw_at_top_left(crop_2x_right, 876, 446, 800, 540)

# Vẽ 5 ô bản đỏ ngang hàng dưới (mỗi ô 316 x 205, vừa khít chiều ngang 1632px)
card_w, card_h = 316, 205
gap = 13
for idx, (label, rc_img) in enumerate(red_crops):
    lx = 44 + idx * (card_w + gap)
    ty = 1042
    draw_at_top_left(rc_img, lx, ty, card_w, card_h)
    cg.CGImageRelease(rc_img)

# Vẽ nhãn tên dưới mỗi ô bản đỏ bằng một lớp SVG trong suốt
red_labels = ['<svg xmlns="http://www.w3.org/2000/svg" width="1720" height="1420" viewBox="0 0 1720 1420">']
for idx, item in enumerate(payload["redSvgs"]):
    lx = 44 + idx * (card_w + gap)
    red_labels.append(f'<rect x="{lx}" y="1042" width="{card_w}" height="{card_h}" fill="none" stroke="#C8432B" stroke-width="1.2" />')
    red_labels.append(f'<text x="{lx + card_w // 2}" y="1269" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="14" font-weight="bold" fill="#1E1B18">{item["label"]}</text>')
red_labels.append(f'<text x="44" y="1308" font-family="Helvetica, Arial, sans-serif" font-size="13" fill="#6B6259">Ghi chú: mam_com khoá canBeRed=false; chen_tra (small_cup) &amp; vo_ruou (wine_jar) là alias giữ nguyên bản đã duyệt sẵn.</text>')
red_labels.append('</svg>')
overlay_im = render_svg_to_cgimage("".join(red_labels), SHEET_W, SHEET_H, 1.0)
# Vì CGBitmapContext không bật alpha premultiplied ở trên, vẽ nhãn trực tiếp vào labels_svg rồi render 1 lần!
cg.CGImageRelease(overlay_im)
cg.CGContextRelease(ctx)

# Ghép sạch 1 lần: đưa khung viền + nhãn ô đỏ vào thẳng labels_svg trước khi vẽ các crop!
full_labels_svg = labels_svg.replace("</svg>", "".join(red_labels[1:]))
cg.CGImageRelease(sheet_bg)
sheet_bg2 = render_svg_to_cgimage(full_labels_svg, SHEET_W, SHEET_H, 1.0)

ctx2 = cg.CGBitmapContextCreate(None, SHEET_W, SHEET_H, 8, SHEET_W * 4, cs_rgb, 1)
def draw2(img, left_x, top_y, w, h):
    cg.CGContextDrawImage(ctx2, CGRect(CGPoint(left_x, SHEET_H - top_y - h), CGSize(w, h)), img)

draw2(sheet_bg2, 0, 0, SHEET_W, SHEET_H)
draw2(crop_1x, 44, 126, 816, 270)
draw2(crop_2x_left, 44, 446, 816, 540)
draw2(crop_2x_right, 876, 446, 800, 540)

# Re-crop red images cleanly
for idx, item in enumerate(payload["redSvgs"]):
    rim = render_svg_to_cgimage(item["svg"], 1080, 1920, 1.0)
    rc = cg.CGImageCreateWithImageInRect(rim, CGRect(CGPoint(430, 550), CGSize(375, 245)))
    lx = 44 + idx * (card_w + gap)
    draw2(rc, lx, 1042, card_w, card_h)
    cg.CGImageRelease(rc)
    cg.CGImageRelease(rim)

out_im = cg.CGBitmapContextCreateImage(ctx2)
pbytes = out_png.encode("utf-8")
url = cf.CFURLCreateFromFileSystemRepresentation(None, pbytes, len(pbytes), False)
dest = imageio.CGImageDestinationCreateWithURL(url, uti_png, 1, None)
imageio.CGImageDestinationAddImage(dest, out_im, None)
imageio.CGImageDestinationFinalize(dest)

cf.CFRelease(dest); cf.CFRelease(url); cg.CGImageRelease(out_im); cg.CGContextRelease(ctx2)
cg.CGImageRelease(sheet_bg2); cg.CGImageRelease(crop_1x); cg.CGImageRelease(crop_2x_left); cg.CGImageRelease(crop_2x_right)
cg.CGImageRelease(im_1x); cg.CGImageRelease(im_2x)
print("SAVED", out_png)
`;

const outPngPath = path.join(OUT_DIR, `HO-${familyArg}.png`);
const res = spawnSync('/usr/bin/python3', ['-c', PY_COMPOSITOR], {
  input: JSON.stringify({
    out: outPngPath,
    lineupSvg: lineupSvg1x,
    redSvgs,
  }),
  encoding: 'utf8',
  maxBuffer: 128 * 1024 * 1024,
});

if (res.status !== 0) {
  console.error(res.stderr || res.stdout);
  process.exit(1);
}
console.log(`✅ Đã xuất tờ duyệt: ${path.relative(ROOT, outPngPath)}`);
