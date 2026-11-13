import React from 'react';
import {
  useCurrentFrame,
  interpolate,
  interpolateColors,
  Easing,
} from 'remotion';
import { loadFont as loadNotoSerifFont } from '@remotion/google-fonts/NotoSerif';
import { loadFont as loadBeVietnamProFont } from '@remotion/google-fonts/BeVietnamPro';
import {
  TimelineSyncResult,
  stripInlineMarkdown,
} from '../engine/timelineSync';
import { ThemePalette, LAYOUT_TOKENS } from '../theme/palettes';
import { VideoInputProps } from '../schemas/videoSchema';

const { fontFamily: notoSerifFontFamily } = loadNotoSerifFont('normal', {
  weights: ['400', '500', '600'],
  subsets: ['vietnamese', 'latin'],
});

loadNotoSerifFont('italic', {
  weights: ['400', '500', '600'],
  subsets: ['vietnamese', 'latin'],
});

const { fontFamily: beVietnamProFontFamily } = loadBeVietnamProFont('normal', {
  weights: ['500', '600'],
  subsets: ['vietnamese', 'latin'],
});

interface StyledChar {
  ch: string;
  bold: boolean;
  italic: boolean;
}

function parseMarkdownChars(raw: string): StyledChar[] {
  const result: StyledChar[] = [];
  const tokenRegex = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      const plain = raw.slice(lastIndex, match.index);
      for (const ch of plain) {
        result.push({ ch, bold: false, italic: false });
      }
    }

    if (match[2] !== undefined) {
      for (const ch of match[2]) {
        result.push({ ch, bold: true, italic: false });
      }
    } else if (match[3] !== undefined) {
      for (const ch of match[3]) {
        result.push({ ch, bold: false, italic: true });
      }
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < raw.length) {
    const tail = raw.slice(lastIndex).replace(/\*+/g, '');
    for (const ch of tail) {
      result.push({ ch, bold: false, italic: false });
    }
  }

  return result;
}

function renderFormattedLineContent(
  rawText: string,
  containsPivot: boolean,
  pivotStart: number,
  pivotEnd: number,
  pivotColor: string
): React.ReactNode {
  const chars = parseMarkdownChars(rawText);
  if (chars.length === 0) return null;

  interface SpanRun {
    text: string;
    bold: boolean;
    italic: boolean;
    isPivot: boolean;
  }

  const runs: SpanRun[] = [];
  for (let i = 0; i < chars.length; i++) {
    const { ch, bold, italic } = chars[i];
    const isPivot =
      containsPivot && pivotStart !== -1 && i >= pivotStart && i < pivotEnd;
    const prev = runs[runs.length - 1];
    if (
      prev &&
      prev.bold === bold &&
      prev.italic === italic &&
      prev.isPivot === isPivot
    ) {
      prev.text += ch;
    } else {
      runs.push({ text: ch, bold, italic, isPivot });
    }
  }

  return runs.map((run, idx) => {
    const style: React.CSSProperties = {};
    if (run.italic) style.fontStyle = 'italic';
    if (run.bold || run.isPivot) style.fontWeight = 600;
    if (run.isPivot) style.color = pivotColor;

    return (
      <span key={idx} style={style}>
        {run.text}
      </span>
    );
  });
}

function estimateBottomBlockHeightPx(params: {
  segmentTexts: string[];
  quoteFontSize: number;
  lineHeight: number;
  rowGapPx: number;
  maxTextWidthPx: number;
  hasAuthor: boolean;
  authorFontSize: number;
  sealMarginTop: number;
}): number {
  const {
    segmentTexts,
    quoteFontSize,
    lineHeight,
    rowGapPx,
    maxTextWidthPx,
    hasAuthor,
    authorFontSize,
    sealMarginTop,
  } = params;

  const avgCharWidth = quoteFontSize * 0.53;
  const maxCharsPerLine = Math.max(16, Math.floor(maxTextWidthPx / avgCharWidth));

  let quoteBlockHeight = 0;
  for (let i = 0; i < segmentTexts.length; i++) {
    const clean = stripInlineMarkdown(segmentTexts[i]).trim();
    if (clean.length === 0) {
      quoteBlockHeight += Math.max(10, 22 - rowGapPx);
    } else {
      const wrappedCount = Math.max(1, Math.ceil(clean.length / maxCharsPerLine));
      quoteBlockHeight += wrappedCount * quoteFontSize * lineHeight;
    }
    if (i < segmentTexts.length - 1) {
      quoteBlockHeight += rowGapPx;
    }
  }

  const authorBlockHeight = hasAuthor ? 16 + authorFontSize * 1.4 : 0;
  const sealBlockHeight = sealMarginTop + 28;
  const topPadding = 8;

  return topPadding + quoteBlockHeight + authorBlockHeight + sealBlockHeight;
}

export const AdaptiveTypography: React.FC<{
  props: VideoInputProps;
  sync: TimelineSyncResult;
  palette: ThemePalette;
}> = ({ props, sync, palette }) => {
  const frame = useCurrentFrame();
  const { swissGrid } = LAYOUT_TOKENS;

  const safeDuration = Math.max(2, sync.durationInFrames);
  const typoLoopWindow = Math.min(
    Math.round(1.2 * sync.fps),
    Math.floor(safeDuration * 0.18)
  );
  const typoLoopStart = Math.max(1, safeDuration - typoLoopWindow);
  const rawLoopU =
    frame >= typoLoopStart
      ? Math.max(
          0,
          Math.min(
            1,
            (frame - typoLoopStart) /
              Math.max(1, safeDuration - 1 - typoLoopStart)
          )
        )
      : 0;
  const typoLoopBlend = 0.5 - 0.5 * Math.cos(Math.PI * rawLoopU);

  const segmentTexts = sync.segmentTimings.map((s) => s.text);
  const cleanLines = segmentTexts
    .map((s) => stripInlineMarkdown(s).trim())
    .filter((s) => s.length > 0);
  const activeLineCount = cleanLines.length;
  const maxCleanLineLen = Math.max(...cleanLines.map((s) => s.length), 0);
  const totalCleanChars = cleanLines.reduce((acc, s) => acc + s.length, 0);

  let autoBaseFontSize: number;
  let lineHeight: number;
  let rowGapPx: number;

  if (
    activeLineCount <= 4 &&
    maxCleanLineLen <= 28 &&
    totalCleanChars <= 175
  ) {
    autoBaseFontSize = 50;
    lineHeight = 1.48;
    rowGapPx = 12;
  } else if (
    activeLineCount <= 5 &&
    maxCleanLineLen <= 42 &&
    totalCleanChars <= 175
  ) {
    autoBaseFontSize = 44;
    lineHeight = 1.48;
    rowGapPx = 10;
  } else {
    autoBaseFontSize =
      maxCleanLineLen > 52 || totalCleanChars > 220 ? 38 : 40;
    lineHeight = 1.48;
    rowGapPx = 8;
  }

  const rawAuthor = (props.author ?? '').trim();
  const hasAuthor = rawAuthor.length > 0;
  const formattedAuthor = hasAuthor
    ? /^[—–-]/.test(rawAuthor)
      ? rawAuthor.replace(/^[-–]\s*/, '— ')
      : `— ${rawAuthor}`
    : '';

  const fontSizeScale = props.fontSizeScale ?? 1.0;
  let quoteFontSize = Math.max(
    30,
    Math.round(autoBaseFontSize * fontSizeScale)
  );
  let authorFontSize = Math.max(24, Math.round(quoteFontSize * 0.66));
  let sealMarginTop = 28;

  const maxAllowedHeight =
    swissGrid.typographyMaxBottom - swissGrid.typographyTop;

  while (
    quoteFontSize > 28 &&
    estimateBottomBlockHeightPx({
      segmentTexts,
      quoteFontSize,
      lineHeight,
      rowGapPx,
      maxTextWidthPx: swissGrid.typographyMaxWidth,
      hasAuthor,
      authorFontSize,
      sealMarginTop,
    }) > maxAllowedHeight
  ) {
    quoteFontSize -= 2;
    authorFontSize = Math.max(22, Math.round(quoteFontSize * 0.66));
    if (quoteFontSize <= 38) {
      rowGapPx = Math.max(6, rowGapPx - 1);
      lineHeight = 1.42;
      sealMarginTop = 22;
    }
  }

  const lineWeights = sync.segmentTimings.map((seg) => {
    const cleanLen = stripInlineMarkdown(seg.text).trim().length;
    if (cleanLen === 0) return 0;
    return Math.max(1, Math.ceil(cleanLen / 30));
  });
  const totalVisualLines = Math.max(
    1,
    lineWeights.reduce((a, b) => a + b, 0)
  );

  const lineProgresses = sync.segmentTimings.map((seg) => {
    if (seg.isFirstActiveLine) {
      const openP = interpolate(
        frame,
        [0, Math.max(1, seg.endTypingFrame)],
        [0.92, 1],
        {
          easing: Easing.out(Easing.cubic),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }
      );
      return openP * (1 - typoLoopBlend) + 0.92 * typoLoopBlend;
    }

    const revealP = interpolate(
      frame,
      [seg.startFrame, Math.max(seg.startFrame + 1, seg.endTypingFrame)],
      [0, 1],
      {
        easing: Easing.out(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    );
    return revealP * (1 - typoLoopBlend);
  });

  const activeRailScaleY = lineProgresses.reduce(
    (sum, prog, idx) => sum + prog * (lineWeights[idx] / totalVisualLines),
    0
  );

  const authorStartFrame =
    sync.allTextFinishedFrame + Math.round(0.25 * sync.fps);
  const rawAuthorProgress = hasAuthor
    ? interpolate(
        frame,
        [authorStartFrame, authorStartFrame + Math.round(0.6 * sync.fps)],
        [0, 1],
        {
          easing: Easing.out(Easing.cubic),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }
      )
    : 0;
  const authorProgress = rawAuthorProgress * (1 - typoLoopBlend);
  const authorTranslateY = interpolate(authorProgress, [0, 1], [6, 0]);
  const authorBlurPx = interpolate(authorProgress, [0, 1], [5, 0]);

  const sealStartFrame = hasAuthor
    ? authorStartFrame + Math.round(0.35 * sync.fps)
    : sync.allTextFinishedFrame - 12;
  const rawSealProgress = interpolate(
    frame,
    [sealStartFrame, sealStartFrame + 36],
    [0, 1],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  const sealProgress = rawSealProgress * (1 - typoLoopBlend);
  const sealTranslateY = interpolate(sealProgress, [0, 1], [8, 0]);

  const serifStack = `${notoSerifFontFamily}, 'Noto Serif', Georgia, serif`;
  const railToTextOffsetPx = 32;

  return (
    <div
      style={{
        position: 'absolute',
        top: swissGrid.typographyTop,
        left: swissGrid.marginLeft,
        width: swissGrid.quoteBlockWidth,
        maxHeight: maxAllowedHeight,
        paddingTop: 8,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: 'fit-content',
          maxWidth: swissGrid.quoteBlockWidth,
        }}
      >
        <div
          style={{
            position: 'relative',
            paddingLeft: railToTextOffsetPx,
            maxWidth: swissGrid.quoteBlockWidth,
            display: 'flex',
            flexDirection: 'column',
            rowGap: rowGapPx,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 1,
              top: 8,
              bottom: 8,
              width: 1.5,
              backgroundColor: palette.surfaceSubtle,
              opacity: 0.7,
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 8,
              bottom: 8,
              width: 3.5,
              backgroundColor: palette.accent,
              transformOrigin: 'top center',
              transform: `scaleY(${activeRailScaleY.toFixed(4)})`,
              borderRadius: 2,
            }}
          />

          {sync.segmentTimings.map((seg, idx) => {
            const cleanText = stripInlineMarkdown(seg.text).trim();
            if (cleanText.length === 0) {
              return (
                <div
                  key={seg.index}
                  style={{ height: Math.max(10, 22 - rowGapPx) }}
                />
              );
            }

            const lineProgress = lineProgresses[idx];
            const translateY = seg.isFirstActiveLine
              ? 0
              : interpolate(lineProgress, [0, 1], [10, 0]);
            const blurPx = seg.isFirstActiveLine
              ? 0
              : interpolate(lineProgress, [0, 1], [3.8, 0]);

            const useAccentColor =
              props.highlightStyle === 'ACCENT_COLOR' ||
              props.highlightStyle === 'BOTH';

            const pivotRevealP = seg.isFirstActiveLine
              ? interpolate(
                  frame,
                  [
                    Math.max(0, sync.pivotFrame - 8),
                    sync.pivotFrame + Math.round(0.45 * sync.fps),
                  ],
                  [0, 1],
                  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                ) *
                (1 - typoLoopBlend)
              : lineProgress;

            const pivotColor = useAccentColor
              ? interpolateColors(
                  pivotRevealP,
                  [0.15, 0.85],
                  [palette.inkPrimary, palette.accent]
                )
              : palette.inkPrimary;

            return (
              <div
                key={seg.index}
                style={{
                  maxWidth: swissGrid.typographyMaxWidth,
                  opacity: lineProgress,
                  transform: `translateY(${translateY.toFixed(2)}px)`,
                  filter:
                    blurPx > 0.05 ? `blur(${blurPx.toFixed(2)}px)` : 'none',
                  fontFamily: serifStack,
                  fontSize: quoteFontSize,
                  lineHeight,
                  color: palette.inkPrimary,
                  textAlign: 'left',
                  overflowWrap: 'break-word',
                  wordBreak: 'normal',
                  textWrap: 'pretty',
                  willChange: 'opacity, transform, filter',
                }}
              >
                {renderFormattedLineContent(
                  seg.text,
                  seg.containsPivot,
                  seg.pivotCharStartIndex,
                  seg.pivotCharEndIndex,
                  pivotColor
                )}
              </div>
            );
          })}
        </div>

        {hasAuthor && (
          <div
            style={{
              alignSelf: 'flex-end',
              marginTop: 16,
              paddingLeft: railToTextOffsetPx,
              paddingRight: 4,
              fontFamily: serifStack,
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: authorFontSize,
              lineHeight: 1.4,
              color: palette.inkSecondary,
              opacity: authorProgress * 0.85,
              transform: `translateY(${authorTranslateY.toFixed(2)}px)`,
              filter:
                authorBlurPx > 0.05
                  ? `blur(${authorBlurPx.toFixed(2)}px)`
                  : 'none',
              willChange: 'opacity, transform, filter',
            }}
          >
            {formattedAuthor}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: sealMarginTop,
          paddingLeft: railToTextOffsetPx,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          opacity: sealProgress * 0.88,
          transform: `translateY(${sealTranslateY.toFixed(2)}px)`,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: palette.accent,
            display: 'inline-block',
          }}
        />
        <span
          style={{
            fontFamily: `${beVietnamProFontFamily}, 'Be Vietnam Pro', sans-serif`,
            fontSize: 20,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: palette.inkSecondary,
            fontWeight: 500,
          }}
        >
          {props.brandText}
        </span>
      </div>
    </div>
  );
};
