import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont as loadBeVietnamProFont } from '@remotion/google-fonts/BeVietnamPro';
import {
  ThemePalette,
  LAYOUT_TOKENS,
  isDarkThemePalette,
} from '../theme/palettes';
import { TimelineSyncResult } from '../engine/timelineSync';
import {
  LightingGobo,
  PaperMoteSpec,
  ResolvedVisualDNA,
} from '../engine/visualDnaResolver';

const { fontFamily: beVietnamProFontFamily } = loadBeVietnamProFont('normal', {
  weights: ['500', '600'],
  subsets: ['vietnamese', 'latin'],
});

const PAPER_MOTES: PaperMoteSpec[] = [
  { baseX: 198, baseY: 390, ampX: 26, ampY: 18, harmX: 1, harmY: 2, phase: 0.2, r: 1.9, alpha: 0.16 },
  { baseX: 342, baseY: 465, ampX: 32, ampY: 22, harmX: 2, harmY: 1, phase: 1.1, r: 1.5, alpha: 0.13 },
  { baseX: 518, baseY: 382, ampX: 28, ampY: 19, harmX: 1, harmY: 2, phase: 2.3, r: 2.1, alpha: 0.15 },
  { baseX: 716, baseY: 448, ampX: 30, ampY: 24, harmX: 2, harmY: 1, phase: 3.4, r: 1.7, alpha: 0.14 },
  { baseX: 828, baseY: 560, ampX: 22, ampY: 20, harmX: 1, harmY: 3, phase: 4.2, r: 1.6, alpha: 0.12 },
  { baseX: 236, baseY: 675, ampX: 29, ampY: 17, harmX: 2, harmY: 2, phase: 0.8, r: 2.2, alpha: 0.15 },
  { baseX: 462, baseY: 618, ampX: 24, ampY: 26, harmX: 1, harmY: 2, phase: 2.9, r: 1.6, alpha: 0.13, isAccent: true },
  { baseX: 668, baseY: 712, ampX: 31, ampY: 18, harmX: 2, harmY: 1, phase: 5.1, r: 1.8, alpha: 0.14 },
  { baseX: 188, baseY: 960, ampX: 25, ampY: 21, harmX: 1, harmY: 2, phase: 1.7, r: 1.7, alpha: 0.12 },
  { baseX: 408, baseY: 1085, ampX: 28, ampY: 19, harmX: 2, harmY: 1, phase: 3.9, r: 1.5, alpha: 0.11 },
  { baseX: 642, baseY: 995, ampX: 24, ampY: 23, harmX: 1, harmY: 2, phase: 4.8, r: 2.0, alpha: 0.13 },
  { baseX: 785, baseY: 1180, ampX: 22, ampY: 18, harmX: 2, harmY: 2, phase: 0.5, r: 1.6, alpha: 0.12, isAccent: true },
  { baseX: 274, baseY: 1310, ampX: 27, ampY: 16, harmX: 1, harmY: 2, phase: 2.6, r: 1.8, alpha: 0.13 },
  { baseX: 564, baseY: 1368, ampX: 30, ampY: 20, harmX: 2, harmY: 1, phase: 5.6, r: 1.5, alpha: 0.12 },
];

const LightingGoboLayer: React.FC<{
  gobo: LightingGobo;
  palette: ThemePalette;
  loopProgress: number;
  durationSec: number;
}> = ({ gobo, palette, loopProgress, durationSec }) => {
  if (gobo === 'NONE') return null;
  const tau = Math.PI * 2;
  const isDark = isDarkThemePalette(palette.id);
  // Bội số nguyên sinh học theo TNS-RES-STAGE-LIGHT-PROPS-V1.0 (8.5s–24.0s):
  // giữ vận tốc ánh sáng tự nhiên & bảo toàn tuyệt đối điểm nối vòng lặp frame[0] === frame[end]
  const kGobo1 = Math.max(1, Math.round(durationSec / 12.0));
  const kGobo2 = Math.max(2, Math.round(durationSec / 6.0));
  const amp1Scale = kGobo1 >= 2 ? 0.75 : 1.0;
  const w1 = (1 - Math.cos(loopProgress * tau * kGobo1)) * amp1Scale;
  const w2 = 1 - Math.cos(loopProgress * tau * kGobo2);

  if (gobo === 'FOLIAGE_DAPPLE') {
    const spot1X = 24 + w1 * 3.5;
    const spot1Y = 20 + w2 * 2.2;
    const spot2X = 76 - w1 * 3.0;
    const spot2Y = 58 + w1 * 2.5;
    const warmHighlight = isDark
      ? 'rgba(218, 224, 236, 0.085)'
      : 'rgba(255, 251, 240, 0.42)';
    const leafShade = isDark
      ? 'rgba(6, 8, 12, 0.24)'
      : 'rgba(32, 26, 20, 0.055)';
    return (
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <AbsoluteFill
          style={{
            background: [
              `radial-gradient(circle 420px at ${spot1X.toFixed(2)}% ${spot1Y.toFixed(2)}%, ${warmHighlight} 0%, transparent 72%)`,
              `radial-gradient(circle 360px at ${spot2X.toFixed(2)}% ${spot2Y.toFixed(2)}%, ${leafShade} 0%, transparent 74%)`,
              `linear-gradient(128deg, ${leafShade} 0%, transparent 38%, ${leafShade} 68%, transparent 100%)`,
            ].join(', '),
          }}
        />
      </AbsoluteFill>
    );
  }

  if (gobo === 'WINDOW_SLATS') {
    const shift = w1 * 2.4;
    const beam = isDark
      ? 'rgba(232, 220, 198, 0.085)'
      : 'rgba(255, 250, 236, 0.36)';
    const slat = isDark
      ? 'rgba(8, 10, 15, 0.22)'
      : 'rgba(34, 28, 22, 0.06)';
    return (
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <AbsoluteFill
          style={{
            background: `linear-gradient(118deg, ${slat} 0%, ${slat} ${(14 + shift).toFixed(2)}%, ${beam} ${(22 + shift).toFixed(2)}%, ${beam} ${(31 + shift).toFixed(2)}%, ${slat} ${(39 + shift).toFixed(2)}%, ${slat} ${(48 + shift).toFixed(2)}%, ${beam} ${(56 + shift).toFixed(2)}%, ${beam} ${(64 + shift).toFixed(2)}%, ${slat} ${(74 + shift).toFixed(2)}%, transparent 100%)`,
          }}
        />
      </AbsoluteFill>
    );
  }

  if (gobo === 'WARM_LANTERN') {
    const cx = 50 + w1 * 2.1;
    const cy = 34 + w2 * 1.6;
    const coreGlow = isDark
      ? 'rgba(236, 196, 146, 0.13)'
      : 'rgba(255, 244, 222, 0.44)';
    const midGlow = isDark
      ? 'rgba(218, 168, 114, 0.045)'
      : 'rgba(246, 230, 200, 0.16)';
    const outerShade = isDark
      ? 'rgba(8, 9, 13, 0.26)'
      : 'rgba(42, 34, 26, 0.05)';
    return (
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 68% 48% at ${cx.toFixed(2)}% ${cy.toFixed(2)}%, ${coreGlow} 0%, ${midGlow} 38%, transparent 68%, ${outerShade} 100%)`,
          }}
        />
      </AbsoluteFill>
    );
  }

  // PORCH_MIST
  const mistX = 48 + w1 * 4.0;
  const mistY = 44 + w2 * 2.0;
  const mistTone = isDark
    ? 'rgba(202, 212, 226, 0.075)'
    : 'rgba(252, 250, 245, 0.42)';
  const mistSoft = isDark
    ? 'rgba(176, 188, 206, 0.035)'
    : 'rgba(236, 232, 224, 0.22)';
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill
        style={{
          background: [
            `radial-gradient(ellipse 92% 38% at ${mistX.toFixed(2)}% ${mistY.toFixed(2)}%, ${mistTone} 0%, ${mistSoft} 45%, transparent 78%)`,
            `linear-gradient(180deg, transparent 16%, ${mistSoft} 50%, transparent 86%)`,
          ].join(', '),
        }}
      />
    </AbsoluteFill>
  );
};

export const MinimalistBackground: React.FC<{
  palette: ThemePalette;
  brandText?: string;
  title?: string;
  jobId?: string;
  sync?: TimelineSyncResult;
  visualDNA?: ResolvedVisualDNA;
}> = ({ palette, title, jobId = '01', sync, visualDNA }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const { swissGrid } = LAYOUT_TOKENS;

  const safeTotalFrames = Math.max(2, durationInFrames);
  const durationSec = safeTotalFrames / Math.max(1, fps || LAYOUT_TOKENS.fps);
  const loopProgress = (frame % safeTotalFrames) / safeTotalFrames;
  const tau = Math.PI * 2;

  // Lượng tử hóa bội số nguyên chu kỳ sinh học (8.5s–24.0s): bảo toàn Seamless Loop ở mọi dải thời lượng
  const kBreath = Math.max(2, Math.round(durationSec / 3.9));
  const moteHarmScale = Math.max(1, Math.round(durationSec / 14.0));

  const vc = visualDNA?.vignetteCenter ?? {
    xPct: 50,
    yPct: 44,
    ampXPct: 1.4,
    ampYPct: 1.1,
  };
  const bgCenterX = vc.xPct + (1 - Math.cos(loopProgress * tau)) * vc.ampXPct;
  const bgCenterY =
    vc.yPct + (1 - Math.cos(loopProgress * tau * 2)) * vc.ampYPct;
  const isDark = isDarkThemePalette(palette.id);

  const grainShiftX = (1 - Math.cos(loopProgress * tau * 2)) * 18;
  const grainShiftY = (1 - Math.cos(loopProgress * tau * 3)) * 16;

  const breathWave = 0.5 + 0.5 * Math.cos(loopProgress * tau * kBreath);
  const dotOpacity = 0.74 + breathWave * 0.26;
  const dotScale = 0.93 + breathWave * 0.13;

  // Ràng buộc B.1: Header CHÉN XX giữ sắc nét qua mốc Ảnh Bìa 3:4 (recommendedCoverFrame + 18f),
  // tan mực hoàn toàn trước pivotFrame, và thu hồi khớp frame[0] === frame[end].
  let headerOpacity = 1;
  let headerLiftY = 0;
  if (sync) {
    if (frame <= sync.headerDissolveStartFrame) {
      headerOpacity = 1;
      headerLiftY = 0;
    } else if (frame < sync.headerDissolveEndFrame) {
      const span = Math.max(
        1,
        sync.headerDissolveEndFrame - sync.headerDissolveStartFrame
      );
      const u = Math.max(
        0,
        Math.min(1, (frame - sync.headerDissolveStartFrame) / span)
      );
      const ease = 0.5 - 0.5 * Math.cos(Math.PI * u);
      headerOpacity = 1 - ease;
      headerLiftY = -3.2 * ease;
    } else if (frame < sync.loopRestoreStartFrame) {
      headerOpacity = 0;
      headerLiftY = -3.2;
    } else {
      const span = Math.max(1, safeTotalFrames - 1 - sync.loopRestoreStartFrame);
      const u = Math.max(
        0,
        Math.min(1, (frame - sync.loopRestoreStartFrame) / span)
      );
      const ease = 0.5 - 0.5 * Math.cos(Math.PI * u);
      headerOpacity = ease;
      headerLiftY = 2.4 * (1 - ease);
    }
  }

  const numMatch = jobId.match(/\d+/);
  const issueNumber = numMatch ? numMatch[0].slice(-2).padStart(2, '0') : '01';
  const headerLabel = title
    ? `CHÉN ${issueNumber}  —  ${title.toUpperCase()}`
    : `CHÉN ${issueNumber}  —  TRÀ NGUỘI`;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at ${bgCenterX.toFixed(2)}% ${bgCenterY.toFixed(2)}%, ${palette.background} 0%, ${palette.backgroundEdge} 100%)`,
      }}
    >
      {isDark && (
        <AbsoluteFill
          style={{
            pointerEvents: 'none',
            background: `radial-gradient(circle 460px at ${bgCenterX.toFixed(2)}% ${bgCenterY.toFixed(2)}%, rgba(234, 230, 223, 0.048) 0%, rgba(223, 84, 56, 0.018) 38%, transparent 74%)`,
          }}
        />
      )}
      <LightingGoboLayer
        gobo={visualDNA?.lightingGobo ?? 'NONE'}
        palette={palette}
        loopProgress={loopProgress}
        durationSec={durationSec}
      />
      <div
        style={{
          position: 'absolute',
          left: -48,
          top: -48,
          width: LAYOUT_TOKENS.width + 96,
          height: LAYOUT_TOKENS.height + 96,
          transform: `translate3d(${grainShiftX.toFixed(2)}px, ${grainShiftY.toFixed(2)}px, 0)`,
          opacity: palette.grainOpacity,
          pointerEvents: 'none',
          willChange: 'transform',
        }}
      >
        <svg width="100%" height="100%">
          <filter id="minimal-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves={3}
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#minimal-grain)" />
        </svg>
      </div>

      <svg
        width={LAYOUT_TOKENS.width}
        height={LAYOUT_TOKENS.height}
        viewBox={`0 0 ${LAYOUT_TOKENS.width} ${LAYOUT_TOKENS.height}`}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      >
        {(visualDNA?.motes ?? PAPER_MOTES).map((m, idx) => {
          const thetaX = loopProgress * tau * (m.harmX * moteHarmScale) + m.phase;
          const thetaY =
            loopProgress * tau * (m.harmY * moteHarmScale) + m.phase * 1.3;
          const cx = m.baseX + Math.sin(thetaX) * m.ampX;
          const cy = m.baseY + Math.cos(thetaY) * m.ampY;
          const shimmer = 0.72 + 0.28 * Math.cos(thetaX + thetaY);
          return (
            <circle
              key={idx}
              cx={cx.toFixed(2)}
              cy={cy.toFixed(2)}
              r={m.r}
              fill={
                m.isAccent
                  ? palette.accentProp || palette.accent
                  : palette.inkSecondary
              }
              opacity={(m.alpha * shimmer).toFixed(3)}
            />
          );
        })}
      </svg>

      <div
        style={{
          position: 'absolute',
          top: swissGrid.headerTop,
          left: swissGrid.headerLeft,
          width: swissGrid.headerWidth,
          height: swissGrid.headerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1.5px solid ${palette.surfaceSubtle}`,
          opacity: headerOpacity,
          transform: `translateY(${headerLiftY.toFixed(2)}px)`,
          willChange: 'opacity, transform',
        }}
      >
        <span
          style={{
            fontFamily: `${beVietnamProFontFamily}, 'Be Vietnam Pro', sans-serif`,
            fontSize: 21,
            fontWeight: 500,
            letterSpacing: '0.20em',
            color: palette.inkSecondary,
            textTransform: 'uppercase',
          }}
        >
          {headerLabel}
        </span>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              backgroundColor: palette.accentText || palette.accent,
              display: 'inline-block',
              opacity: dotOpacity,
              transform: `scale(${dotScale.toFixed(3)})`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
