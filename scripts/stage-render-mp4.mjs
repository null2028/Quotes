import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { interpolate, interpolateColors, Easing } from 'remotion';

import { DeclarativeStagePlayer } from '../src/stage/DeclarativeStagePlayer.tsx';
import { validateAndCompileStageInput } from '../src/stage/stageValidator.ts';
import {
  computeTimelineSync,
  TYPO_LOOP_FADE_SECONDS,
} from '../src/engine/timelineSync.ts';
import { evaluateMotionState } from '../src/engine/motionPhysics.ts';
import { synthesizeCupFoleyAudio } from '../src/engine/foleyEngine.ts';
import { LAYOUT_TOKENS, THEME_PALETTES } from '../src/theme/palettes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

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

const PY_VIDEO_ENCODER = `
import ctypes, json, os, re, shutil, subprocess, sys
from ctypes import c_void_p, c_size_t, c_uint32, c_char_p, c_bool

cg = ctypes.CDLL("/System/Library/Frameworks/CoreGraphics.framework/CoreGraphics")
cf = ctypes.CDLL("/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation")
imageio = ctypes.CDLL("/System/Library/Frameworks/ImageIO.framework/ImageIO")
coresvg = ctypes.CDLL("/System/Library/PrivateFrameworks/CoreSVG.framework/CoreSVG")

cf.CFDataCreate.restype = c_void_p
cf.CFDataCreate.argtypes = [c_void_p, c_char_p, c_size_t]
cf.CFStringCreateWithCString.restype = c_void_p
cf.CFStringCreateWithCString.argtypes = [c_void_p, c_char_p, c_uint32]
cf.CFURLCreateFromFileSystemRepresentation.restype = c_void_p
cf.CFURLCreateFromFileSystemRepresentation.argtypes = [c_void_p, c_char_p, c_size_t, c_bool]
cf.CFRelease.argtypes = [c_void_p]

coresvg.CGSVGDocumentCreateFromData.restype = c_void_p
coresvg.CGSVGDocumentCreateFromData.argtypes = [c_void_p, c_void_p]
coresvg.CGSVGDocumentRelease.argtypes = [c_void_p]
coresvg.CGContextDrawSVGDocument.argtypes = [c_void_p, c_void_p]

cg.CGColorSpaceCreateDeviceRGB.restype = c_void_p
cg.CGBitmapContextCreate.restype = c_void_p
cg.CGBitmapContextCreate.argtypes = [c_void_p, c_size_t, c_size_t, c_size_t, c_size_t, c_void_p, c_uint32]
cg.CGContextRelease.argtypes = [c_void_p]
cg.CGBitmapContextCreateImage.restype = c_void_p
cg.CGBitmapContextCreateImage.argtypes = [c_void_p]
cg.CGImageRelease.argtypes = [c_void_p]

imageio.CGImageDestinationCreateWithURL.restype = c_void_p
imageio.CGImageDestinationCreateWithURL.argtypes = [c_void_p, c_void_p, c_size_t, c_void_p]
imageio.CGImageDestinationAddImage.argtypes = [c_void_p, c_void_p, c_void_p]
imageio.CGImageDestinationFinalize.restype = c_bool
imageio.CGImageDestinationFinalize.argtypes = [c_void_p]

cs_rgb = cg.CGColorSpaceCreateDeviceRGB()
uti_png = cf.CFStringCreateWithCString(None, b"public.png", 0x08000100)

RE_RGB = re.compile(r"rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)")
RE_RGBA_HEX = re.compile(r"#([0-9a-fA-F]{6})([0-9a-fA-F]{2})\\b")

def clean_svg(svg):
    svg = RE_RGB.sub(lambda m: f"#{int(m.group(1)):02X}{int(m.group(2)):02X}{int(m.group(3)):02X}", svg)
    svg = RE_RGBA_HEX.sub(lambda m: f"#{m.group(1)}", svg)
    svg = svg.replace('style="overflow:visible;background:transparent"', '')
    return svg

meta = json.loads(sys.stdin.readline())
w = int(meta["w"])
h = int(meta["h"])
fps = int(meta["fps"])
wav_path = meta["wav"]
out_mp4 = meta["out"]

tmp_dir = "/tmp/q001_frames_mp4"
shutil.rmtree(tmp_dir, ignore_errors=True)
os.makedirs(tmp_dir, exist_ok=True)

ctx = cg.CGBitmapContextCreate(None, w, h, 8, w * 4, cs_rgb, 1)

idx = 0
for line in sys.stdin:
    if not line.strip():
        continue
    svg_str = clean_svg(json.loads(line))
    data = svg_str.encode("utf-8")
    cfdata = cf.CFDataCreate(None, data, len(data))
    doc = coresvg.CGSVGDocumentCreateFromData(cfdata, None)
    coresvg.CGContextDrawSVGDocument(ctx, doc)
    im = cg.CGBitmapContextCreateImage(ctx)
    pbytes = os.path.join(tmp_dir, f"f{idx:04d}.png").encode("utf-8")
    url = cf.CFURLCreateFromFileSystemRepresentation(None, pbytes, len(pbytes), False)
    dest = imageio.CGImageDestinationCreateWithURL(url, uti_png, 1, None)
    imageio.CGImageDestinationAddImage(dest, im, None)
    imageio.CGImageDestinationFinalize(dest)
    cf.CFRelease(dest)
    cf.CFRelease(url)
    cg.CGImageRelease(im)
    coresvg.CGSVGDocumentRelease(doc)
    cf.CFRelease(cfdata)
    idx += 1

cg.CGContextRelease(ctx)

remotion_bin = "/Volumes/Data/Quotes/node_modules/@remotion/compositor-darwin-arm64"
ffmpeg_bin = os.path.join(remotion_bin, "ffmpeg")
env = os.environ.copy()
env["DYLD_LIBRARY_PATH"] = remotion_bin + ":" + env.get("DYLD_LIBRARY_PATH", "")

cmd = [
    ffmpeg_bin, "-v", "error", "-y",
    "-framerate", str(fps),
    "-i", os.path.join(tmp_dir, "f%04d.png"),
    "-i", wav_path,
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "17",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    "-movflags", "+faststart",
    out_mp4
]
r = subprocess.run(cmd, env=env, cwd=remotion_bin, capture_output=True, text=True)
if r.returncode != 0:
    # Fallback without audio if stripped ffmpeg lacks aac encoder
    cmd_no_audio = [
        ffmpeg_bin, "-v", "error", "-y",
        "-framerate", str(fps),
        "-i", os.path.join(tmp_dir, "f%04d.png"),
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "17",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        out_mp4
    ]
    subprocess.run(cmd_no_audio, check=True, env=env, cwd=remotion_bin)

shutil.rmtree(tmp_dir, ignore_errors=True)
print("OK")
`;

function buildFullFrameSvg(f, script, timeline, palette, spec) {
  const { fps, durationInFrames } = timeline;
  const safeDuration = Math.max(2, durationInFrames);
  const loopProgress = (f % safeDuration) / safeDuration;
  const tau = Math.PI * 2;

  const mState = evaluateMotionState(
    f,
    fps,
    timeline.pivotFrame,
    timeline.allTextFinishedFrame,
    durationInFrames,
    spec.motion
  );

  const stageMarkup = renderToStaticMarkup(
    React.createElement(DeclarativeStagePlayer, {
      script,
      state: mState,
      palette,
      strokeWidth: LAYOUT_TOKENS.strokeWidth,
      frame: f,
      fps,
      durationInFrames,
      timeline,
      stageBox: {
        width: LAYOUT_TOKENS.swissGrid.stageWidth,
        height: LAYOUT_TOKENS.swissGrid.stageHeight,
      },
      showDebugBBoxes: false,
    })
  );

  // Header CHÉN 15 — KHỎE TƯNG
  let headerOpacity = 1;
  let headerLiftY = 0;
  if (f <= timeline.headerDissolveStartFrame) {
    headerOpacity = 1;
  } else if (f < timeline.headerDissolveEndFrame) {
    const span = Math.max(1, timeline.headerDissolveEndFrame - timeline.headerDissolveStartFrame);
    const u = Math.max(0, Math.min(1, (f - timeline.headerDissolveStartFrame) / span));
    const ease = 0.5 - 0.5 * Math.cos(Math.PI * u);
    headerOpacity = 1 - ease;
    headerLiftY = -3.2 * ease;
  } else if (f < timeline.loopRestoreStartFrame) {
    headerOpacity = 0;
    headerLiftY = -3.2;
  } else {
    const span = Math.max(1, safeDuration - 1 - timeline.loopRestoreStartFrame);
    const u = Math.max(0, Math.min(1, (f - timeline.loopRestoreStartFrame) / span));
    const ease = 0.5 - 0.5 * Math.cos(Math.PI * u);
    headerOpacity = ease;
    headerLiftY = 2.4 * (1 - ease);
  }
  const breathWave = 0.5 + 0.5 * Math.cos(loopProgress * tau * 8);
  const dotOpacity = (0.74 + breathWave * 0.26) * headerOpacity;

  // Typography reveal & loop fade
  const typoLoopWindow = Math.min(
    Math.round(TYPO_LOOP_FADE_SECONDS * fps),
    Math.floor(safeDuration * 0.18)
  );
  const typoLoopStart = Math.max(1, safeDuration - typoLoopWindow);
  const rawLoopU =
    f >= typoLoopStart
      ? Math.max(0, Math.min(1, (f - typoLoopStart) / Math.max(1, safeDuration - 1 - typoLoopStart)))
      : 0;
  const typoLoopBlend = 0.5 - 0.5 * Math.cos(Math.PI * rawLoopU);

  const segs = timeline.segmentTimings;
  const revealProgresses = segs.map((seg) =>
    interpolate(
      f,
      [seg.startFrame, Math.max(seg.startFrame + 1, seg.endTypingFrame + Math.round(0.35 * fps))],
      [0, 1],
      {
        easing: Easing.inOut(Easing.sin),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    )
  );
  const lineProgresses = revealProgresses.map((rp) => rp * (1 - typoLoopBlend));
  const activeRailScaleY =
    lineProgresses.reduce((sum, p) => sum + p, 0) / Math.max(1, segs.length);
  const railHeight = Math.max(0, 276 * activeRailScaleY);
  const railOpacity =
    activeRailScaleY > 0.004
      ? Math.min(1, activeRailScaleY * 4) * (1 - typoLoopBlend)
      : 0;

  const pivotRevealP = interpolate(
    f,
    [Math.max(0, timeline.pivotFrame - 6), timeline.pivotFrame + Math.round(0.28 * fps)],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const pivotColor = interpolateColors(
    pivotRevealP,
    [0.15, 0.85],
    [palette.inkPrimary, palette.accentText || palette.accent]
  );

  const fontSize = 40;
  const baseX = 160;
  const baseY = 1042;
  const rowStep = 74;

  const linesSvg = segs
    .map((seg, idx) => {
      const lp = lineProgresses[idx];
      if (lp <= 0.004) return '';
      const rp = revealProgresses[idx];
      const ty = interpolate(rp, [0, 1], [10, 0]) - typoLoopBlend * 2.5;
      const yPos = baseY + idx * rowStep + ty;
      const ln = seg.text;

      if (
        seg.containsPivot &&
        seg.pivotCharStartIndex >= 0 &&
        seg.pivotCharEndIndex > seg.pivotCharStartIndex
      ) {
        const pre = ln.slice(0, seg.pivotCharStartIndex);
        const piv = ln.slice(seg.pivotCharStartIndex, seg.pivotCharEndIndex);
        const post = ln.slice(seg.pivotCharEndIndex);
        const preW = estimateGeorgiaTextWidth(pre, fontSize);
        const pivW = estimateGeorgiaTextWidth(piv, fontSize) * 1.03;
        return [
          `<text x="${baseX}" y="${yPos.toFixed(1)}" font-family="Georgia" font-size="${fontSize}" fill="${palette.inkPrimary}" opacity="${lp.toFixed(3)}">${escXml(pre)}</text>`,
          `<text x="${(baseX + preW).toFixed(1)}" y="${yPos.toFixed(1)}" font-family="Georgia" font-size="${fontSize}" font-weight="bold" fill="${pivotColor}" opacity="${lp.toFixed(3)}">${escXml(piv)}</text>`,
          post
            ? `<text x="${(baseX + preW + pivW).toFixed(1)}" y="${yPos.toFixed(1)}" font-family="Georgia" font-size="${fontSize}" fill="${palette.inkPrimary}" opacity="${lp.toFixed(3)}">${escXml(post)}</text>`
            : '',
        ]
          .filter(Boolean)
          .join('\n');
      }

      return `<text x="${baseX}" y="${yPos.toFixed(1)}" font-family="Georgia" font-size="${fontSize}" fill="${palette.inkPrimary}" opacity="${lp.toFixed(3)}">${escXml(ln)}</text>`;
    })
    .filter(Boolean)
    .join('\n');

  const sealStartFrame = Math.max(
    timeline.introBufferFrames,
    timeline.allTextFinishedFrame - Math.round(0.2 * fps)
  );
  const rawSealProgress = interpolate(
    f,
    [sealStartFrame, sealStartFrame + Math.round(0.6 * fps)],
    [0, 1],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  const sealOpacity = rawSealProgress * (1 - typoLoopBlend) * 0.88;
  const sealY = baseY + 4 * rowStep + 22 + interpolate(rawSealProgress, [0, 1], [8, 0]);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
    <rect width="1080" height="1920" fill="${palette.background}"/>
    <g opacity="${headerOpacity.toFixed(3)}" transform="translate(0, ${headerLiftY.toFixed(2)})">
      <text x="132" y="294" font-family="Georgia" font-size="22" letter-spacing="4" fill="${palette.inkSecondary}">CHÉN 15  —  KHỎE TƯNG</text>
      <circle cx="942" cy="286" r="4.5" fill="${palette.accentText}" opacity="${dotOpacity.toFixed(3)}"/>
      <line x1="132" y1="316" x2="948" y2="316" stroke="${palette.surfaceSubtle}" stroke-width="1.5"/>
    </g>
    <g transform="translate(${LAYOUT_TOKENS.swissGrid.stageLeft}, ${LAYOUT_TOKENS.swissGrid.stageTop})">
      ${stageMarkup}
    </g>
    <rect x="134" y="${baseY - 34}" width="3.4" height="${railHeight.toFixed(1)}" fill="${palette.accentText}" opacity="${railOpacity.toFixed(3)}"/>
    ${linesSvg}
    <g opacity="${sealOpacity.toFixed(3)}">
      <circle cx="164" cy="${(sealY - 7).toFixed(1)}" r="3.8" fill="${palette.accentText}"/>
      <text x="180" y="${sealY.toFixed(1)}" font-family="Georgia" font-size="20" letter-spacing="4.5" fill="${palette.inkSecondary}">TRÀ NGUỘI</text>
    </g>
  </svg>`;
}

function renderSemanticMp4(specPath, outMp4Path) {
  const rawSem = JSON.parse(fs.readFileSync(path.resolve(ROOT, specPath), 'utf8'));
  const lines = [
    'Tháng năm tất tả chưa từng dừng,',
    'Tiền chưa đầy túi đã đau lưng.',
    'Lắm hôm mệt quá toan buông xuống,',
    'Nhìn tờ hóa đơn… lại khỏe tưng!',
  ];
  const videoSpec = {
    id: 'quote-015',
    title: 'Khỏe tưng',
    textFormat: 'POEM',
    segments: lines,
    pivotWord: 'lại khỏe tưng',
    highlightStyle: 'BOTH',
    durationMode: 'FIXED',
    targetDurationSeconds: 15,
    typingSpeedMsPerChar: 55,
    holdAfterFinishSeconds: 5.5,
    themeId: 'MINIMAL_LIGHT',
    motion: {
      sceneId: rawSem.sceneId,
      archetype: 'BOULDER_TO_BENCH',
      pacingMode: 'WRY_BATHOS',
      stateA: { intensity: 0.78, spread: 0.22, tiltDeg: -12 },
      stateB: { intensity: 0.08, spread: 0.72, tiltDeg: 0 },
    },
    bgm: {
      audioMode: 'PIVOT_ACCENT',
      foleyPivotStyle: 'WOOD_SEAL',
    },
    brandText: 'TRÀ NGUỘI',
  };

  // Render ở 30fps × 15s = 450 khung (chuẩn tốc độ cao 1080x1920 mượt mà, đúng 15.00 giây)
  const renderFps = 30;
  const timeline = computeTimelineSync(videoSpec, renderFps);
  const valRes = validateAndCompileStageInput(rawSem, timeline);
  if (!valRes.valid) {
    console.error(`❌ CHẶN RENDER MP4 — ${valRes.issues.length} lỗi:`);
    for (const iss of valRes.issues) {
      console.error(`   - [${iss.code}] ${iss.message}`);
    }
    process.exit(1);
  }

  const script = valRes.compiledScript;
  const palette = THEME_PALETTES.MINIMAL_LIGHT;

  // Sinh âm thanh Foley 15s chuẩn của Chén
  const timeline60 = computeTimelineSync(videoSpec, 60);
  const foley = synthesizeCupFoleyAudio(videoSpec, timeline60);
  const tmpWavPath = path.join(ROOT, 'qa-artifacts-ci', 'q001-foley.wav');
  fs.writeFileSync(tmpWavPath, Buffer.from(foley.wavBytes));

  const outFull = path.resolve(ROOT, outMp4Path);
  fs.mkdirSync(path.dirname(outFull), { recursive: true });

  const linesPayload = [
    JSON.stringify({
      w: 1080,
      h: 1920,
      fps: renderFps,
      wav: tmpWavPath,
      out: outFull,
    }),
  ];

  for (let f = 0; f < timeline.durationInFrames; f++) {
    linesPayload.push(
      JSON.stringify(buildFullFrameSvg(f, script, timeline, palette, videoSpec))
    );
  }

  const res = spawnSync('/usr/bin/python3', ['-c', PY_VIDEO_ENCODER], {
    input: linesPayload.join('\n') + '\n',
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });

  if (res.status !== 0) {
    throw new Error(`Lỗi xuất MP4: ${res.stderr || res.stdout}`);
  }

  console.log(`✅ Đã xuất bản MP4 15 giây (1080x1920): ${path.relative(ROOT, outFull)}`);
}

const args = process.argv.slice(2);
const specArg = args[0] || 'qa-artifacts-ci/q001-semantic.json';
const outArg = args[1] || 'output/quote-015/chen-15-khoe-tung-semantic-v1.mp4';
renderSemanticMp4(specArg, outArg);
