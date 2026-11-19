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
  TYPO_LOOP_FADE_SECONDS,
  TimelineSyncResult,
  stripInlineMarkdown,
} from '../engine/timelineSync';
import { ThemePalette, LAYOUT_TOKENS } from '../theme/palettes';
import { VideoInputProps } from '../schemas/videoSchema';
import {
  LayoutGeometry,
  ResolvedVisualDNA,
  resolveLayoutGeometry,
} from '../engine/visualDnaResolver';
import { resolveStageScript } from '../stage/stageScriptRegistry';

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

  const avgCharWidth = quoteFontSize * 0.49;
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
  visualDNA?: ResolvedVisualDNA;
  layoutGeo?: LayoutGeometry;
}> = ({ props, sync, palette, visualDNA, layoutGeo }) => {
  const frame = useCurrentFrame();
  const { typography } = LAYOUT_TOKENS;
  const activeGeo =
    layoutGeo ??
    resolveLayoutGeometry(
      visualDNA?.layout ?? 'CLASSIC_TOP_STAGE',
      visualDNA?.brushOrientation
    );

  const safeDuration = Math.max(2, sync.durationInFrames);
  // Hướng 1 Seamless Loop: Từ 14.20s -> 15.00s (Frame 852 -> 899 @ 60fps), toàn bộ khối chữ tan êm về 0
  const typoLoopWindow = Math.min(
    Math.round(TYPO_LOOP_FADE_SECONDS * sync.fps),
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
  const activeSceneId = props.motion?.sceneId || props.motion?.archetype;
  const resolvedStageScript = resolveStageScript(
    activeSceneId,
    props.motion?.stageScript
  );
  const isSemanticStage = Boolean(
    resolvedStageScript?.tags?.includes('semantic_v1')
  );
  // T8-DNA-a #4: Với Gói Chén (`semantic_v1`), 0.8s cuối chỉ vùng hình mờ dần về giấy, khối chữ GIỮ NGUYÊN
  const typoLoopBlend = isSemanticStage
    ? 0
    : 0.5 - 0.5 * Math.cos(Math.PI * rawLoopU);

  const segmentTexts = sync.segmentTimings.map((s) => s.text);

  const rawAuthor = (props.author ?? '').trim();
  const hasAuthor = rawAuthor.length > 0;
  const formattedAuthor = hasAuthor
    ? /^[—–-]/.test(rawAuthor)
      ? rawAuthor.replace(/^[-–]\s*/, '— ')
      : `— ${rawAuthor}`
    : '';

  // Khóa cỡ chữ chuẩn cố định toàn kênh (42px ở 1.00x), biên tinh chỉnh nhất quán [38px..48px] (0.88x..1.15x)
  const effectiveScale = Math.max(
    0.88,
    Math.min(1.15, props.fontSizeScale ?? 1.0)
  );
  let quoteFontSize = Math.max(
    typography.minFontSize,
    Math.min(
      typography.maxFontSize,
      Math.round(typography.baseFontSize * effectiveScale)
    )
  );
  let lineHeight = 1.52;
  let rowGapPx = 16;
  let sealMarginTop = 34;
  let authorFontSize = Math.max(23, Math.round(quoteFontSize * 0.66));

  const maxAllowedHeight =
    activeGeo.typographyMaxBottom - activeGeo.typographyTop;

  // Tầng A: Nếu đoạn trích dẫn dài chạm trần đáy Safe Zone, ưu tiên co nhẹ khoảng thưa dọc TRƯỚC để giữ nguyên cỡ chữ chuẩn
  while (
    (rowGapPx > 10 || sealMarginTop > 22 || lineHeight > 1.42) &&
    estimateBottomBlockHeightPx({
      segmentTexts,
      quoteFontSize,
      lineHeight,
      rowGapPx,
      maxTextWidthPx: activeGeo.typographyMaxWidth,
      hasAuthor,
      authorFontSize,
      sealMarginTop,
    }) > maxAllowedHeight
  ) {
    if (rowGapPx > 10) {
      rowGapPx = Math.max(10, rowGapPx - 2);
    } else if (sealMarginTop > 22) {
      sealMarginTop = Math.max(22, sealMarginTop - 4);
    } else {
      lineHeight = Math.max(1.42, Number((lineHeight - 0.03).toFixed(2)));
    }
  }

  // Tầng B: Chỉ khi trích dẫn văn học siêu dài vẫn vượt trần mới giảm từng 1px và khóa cứng sàn tuyệt đối ở minFontSize (38px)
  while (
    quoteFontSize > typography.minFontSize &&
    estimateBottomBlockHeightPx({
      segmentTexts,
      quoteFontSize,
      lineHeight,
      rowGapPx,
      maxTextWidthPx: activeGeo.typographyMaxWidth,
      hasAuthor,
      authorFontSize,
      sealMarginTop,
    }) > maxAllowedHeight
  ) {
    quoteFontSize -= 1;
    authorFontSize = Math.max(22, Math.round(quoteFontSize * 0.66));
  }

  const maxCharsPerVisualLine = Math.max(
    18,
    Math.floor(activeGeo.typographyMaxWidth / (quoteFontSize * 0.49))
  );
  const lineWeights = sync.segmentTimings.map((seg) => {
    const cleanLen = stripInlineMarkdown(seg.text).trim().length;
    if (cleanLen === 0) return 0;
    return Math.max(1, Math.ceil(cleanLen / maxCharsPerVisualLine));
  });
  const totalVisualLines = Math.max(
    1,
    lineWeights.reduce((a, b) => a + b, 0)
  );

  // Hướng 1: Đồng nhất 100% hiệu ứng thấm mực mềm mại và thanh nét Đỏ Chu Sa kéo xuống chậm rãi theo đường cong Cosine S-Curve
  const revealProgresses = sync.segmentTimings.map((seg) =>
    interpolate(
      frame,
      [
        seg.startFrame,
        Math.max(seg.startFrame + 1, seg.endTypingFrame + Math.round(0.35 * sync.fps)),
      ],
      [0, 1],
      {
        easing: Easing.inOut(Easing.sin),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    )
  );

  const lineProgresses = revealProgresses.map(
    (revealP) => revealP * (1 - typoLoopBlend)
  );

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
  const authorTranslateY =
    interpolate(rawAuthorProgress, [0, 1], [6, 0]) - typoLoopBlend * 2;
  const authorBlurPx = Math.max(
    interpolate(rawAuthorProgress, [0, 1], [5, 0]),
    typoLoopBlend * 3
  );

  const sealStartFrame = hasAuthor
    ? authorStartFrame + Math.round(0.35 * sync.fps)
    : Math.max(
        sync.introBufferFrames,
        sync.allTextFinishedFrame - Math.round(0.2 * sync.fps)
      );
  const rawSealProgress = interpolate(
    frame,
    [sealStartFrame, sealStartFrame + Math.round(0.6 * sync.fps)],
    [0, 1],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  const sealProgress = rawSealProgress * (1 - typoLoopBlend);
  const sealTranslateY =
    interpolate(rawSealProgress, [0, 1], [8, 0]) - typoLoopBlend * 2;

  const serifStack = `${notoSerifFontFamily}, 'Noto Serif', Georgia, serif`;
  const railToTextOffsetPx = typography.railOffsetPx;

  return (
    <div
      style={{
        position: 'absolute',
        top: activeGeo.typographyTop,
        left: activeGeo.typographyLeft,
        width: activeGeo.quoteBlockWidth,
        height: maxAllowedHeight,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 4,
        paddingBottom: 4,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Đệm đàn hồi phía trên theo Archetype layout để giữ liên kết sân khấu */}
      <div
        style={{
          flexGrow: activeGeo.topSpacerFlexGrow,
          flexShrink: 1,
          flexBasis: 0,
          maxHeight: activeGeo.topSpacerMaxPx,
        }}
      />

      {/* Nguyên khối [Quote + Tác giả + • TRÀ NGUỘI] tự cân bằng trên–dưới mượt mà, cố định chiều cao từ 0.0s */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 'fit-content',
            maxWidth: activeGeo.quoteBlockWidth,
          }}
        >
        <div
          style={{
            position: 'relative',
            paddingLeft: railToTextOffsetPx,
            maxWidth: activeGeo.quoteBlockWidth,
            display: 'flex',
            flexDirection: 'column',
            rowGap: rowGapPx,
          }}
        >
          {/* Line Đỏ Chu Sa dọc 1 nét liền đều từ đầu đến cuối, chạy dài theo sự xuất hiện của từng dòng quote */}
          <div
            style={{
              position: 'absolute',
              left: 2,
              top: 6,
              width: 3.2,
              height: `calc((100% - 12px) * ${Math.max(0, Math.min(1, activeRailScaleY)).toFixed(4)})`,
              backgroundColor: palette.accentText || palette.accent,
              pointerEvents: 'none',
              opacity:
                activeRailScaleY > 0.004
                  ? Math.min(1, activeRailScaleY * 4) * (1 - typoLoopBlend)
                  : 0,
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

            const revealP = revealProgresses[idx];
            const lineProgress = lineProgresses[idx];
            const translateY =
              interpolate(revealP, [0, 1], [10, 0]) - typoLoopBlend * 2.5;
            const entranceBlurPx = interpolate(revealP, [0, 1], [5.2, 0]);
            const exitBlurPx = typoLoopBlend * 3.2;
            const blurPx = Math.max(entranceBlurPx, exitBlurPx);

            const useAccentColor =
              props.highlightStyle === 'ACCENT_COLOR' ||
              props.highlightStyle === 'BOTH';

            const pivotRevealP = interpolate(
              frame,
              [
                Math.max(0, sync.pivotFrame - 6),
                sync.pivotFrame + Math.round(0.28 * sync.fps),
              ],
              [0, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );

            const pivotColor = useAccentColor
              ? interpolateColors(
                  pivotRevealP,
                  [0.15, 0.85],
                  [palette.inkPrimary, palette.accentText || palette.accent]
                )
              : palette.inkPrimary;

            return (
              <div
                key={seg.index}
                style={{
                  maxWidth: activeGeo.typographyMaxWidth,
                  opacity: lineProgress,
                  transform: `translateY(${translateY.toFixed(2)}px)`,
                  filter:
                    blurPx > 0.05 ? `blur(${blurPx.toFixed(2)}px)` : 'none',
                  fontFamily: serifStack,
                  fontSize: quoteFontSize,
                  lineHeight,
                  color: palette.inkPrimary,
                  textAlign: 'left',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word',
                  wordBreak: 'normal',
                  textWrap: props.textFormat === 'POEM' ? 'wrap' : 'pretty',
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
              backgroundColor: palette.accentText || palette.accent,
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

      {/* Đệm đàn hồi phía dưới */}
      <div
        style={{
          flexGrow: activeGeo.bottomSpacerFlexGrow,
          flexShrink: 1,
          flexBasis: 0,
        }}
      />
    </div>
  );
};
