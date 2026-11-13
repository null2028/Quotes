import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont as loadBeVietnamProFont } from '@remotion/google-fonts/BeVietnamPro';
import { loadFont as loadNotoSerifFont } from '@remotion/google-fonts/NotoSerif';
import { ThemePalette, LAYOUT_TOKENS } from '../theme/palettes';

const { fontFamily: beVietnamProFontFamily } = loadBeVietnamProFont('normal', {
  weights: ['500', '600'],
  subsets: ['vietnamese', 'latin'],
});

const { fontFamily: notoSerifFontFamily } = loadNotoSerifFont('normal', {
  weights: ['600'],
  subsets: ['vietnamese', 'latin'],
});

interface PaperMoteSpec {
  baseX: number;
  baseY: number;
  ampX: number;
  ampY: number;
  harmX: number;
  harmY: number;
  phase: number;
  r: number;
  alpha: number;
  isAccent?: boolean;
}

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

export const MinimalistBackground: React.FC<{
  palette: ThemePalette;
  brandText?: string;
  title?: string;
  jobId?: string;
}> = ({ palette, title, jobId = '01' }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { swissGrid } = LAYOUT_TOKENS;

  const safeTotalFrames = Math.max(1, durationInFrames);
  const loopProgress = (frame % safeTotalFrames) / safeTotalFrames;
  const tau = Math.PI * 2;

  const bgCenterX = 50 + Math.sin(loopProgress * tau) * 2.2;
  const bgCenterY = 44 + Math.cos(loopProgress * tau) * 1.8;

  const breathWave = 0.5 + 0.5 * Math.cos(loopProgress * tau * 8);
  const dotOpacity = 0.74 + breathWave * 0.26;
  const dotScale = 0.93 + breathWave * 0.13;

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
      <svg
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: palette.grainOpacity,
          pointerEvents: 'none',
        }}
      >
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
        {PAPER_MOTES.map((m, idx) => {
          const thetaX = loopProgress * tau * m.harmX + m.phase;
          const thetaY = loopProgress * tau * m.harmY + m.phase * 1.3;
          const cx = m.baseX + Math.sin(thetaX) * m.ampX;
          const cy = m.baseY + Math.cos(thetaY) * m.ampY;
          const shimmer = 0.72 + 0.28 * Math.cos(thetaX + thetaY);
          return (
            <circle
              key={idx}
              cx={cx.toFixed(2)}
              cy={cy.toFixed(2)}
              r={m.r}
              fill={m.isAccent ? palette.accent : palette.inkSecondary}
              opacity={(m.alpha * shimmer).toFixed(3)}
            />
          );
        })}
      </svg>

      <div
        style={{
          position: 'absolute',
          top: swissGrid.headerTop,
          left: swissGrid.marginLeft,
          width: swissGrid.contentWidth,
          height: swissGrid.headerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1.5px solid ${palette.surfaceSubtle}`,
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
            gap: 10,
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              border: `1.35px solid ${palette.accent}`,
              color: palette.accent,
              fontFamily: `${notoSerifFontFamily}, serif`,
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.78,
            }}
          >
            茶
          </span>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              backgroundColor: palette.accent,
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
