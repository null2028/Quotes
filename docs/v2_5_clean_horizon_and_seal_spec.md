# V2.5 Final Aesthetic Polish: Không Gian Không Vách Ngăn (Open Paper Horizon) & Hiệu Ứng Đóng Dấu Triện `• TRÀ NGUỘI`

> **Mục đích tài liệu (`V2_5_CLEAN_HORIZON_AND_SEAL_SPEC.md`):** Tài liệu này hướng dẫn AI Coding Agent (Antigravity) thực hiện lượt tinh chỉnh thẩm mỹ hoàn thiện **V2.5** tại `/Volumes/Data/Quotes`, kết hợp trọn vẹn các điểm chốt cuối cùng trên nền tảng chuẩn V2.4:
> 1. **Bỏ hẳn đường kẻ ngang ngăn cách giữa Animation và Quote (`MinimalistBackground.tsx`):** Để đường chân trời/con dốc của câu chuyện hòa làm một với mặt giấy Trà Ấm và không đâm vào vòng tròn Avatar bên phải trên giao diện TikTok thật.
> 2. **Bỏ vòng tròn tâm nét đứt & dấu cộng (`crosshair`) kỹ thuật; làm mảnh nhẹ đường gạch dưới Header `CHÉN 01` (`1px`, dịu mắt).**
> 3. **Tách riêng chiều cao Thanh Tiến Trình Đọc ôm khít các dòng chữ & Thêm hiệu ứng "Đóng Dấu Triện Cuối Bài" cho `• TRÀ NGUỘI` (`AdaptiveTypography.tsx`):** Đường rãnh xám mờ và thanh vạch Đỏ Gạch dừng chuẩn xác ở đáy dòng chữ cuối cùng (không kéo dư xuống vùng chữ ký), đồng thời dòng chữ ký `• TRÀ NGUỘI` chỉ hiện êm lên sau khi câu chữ cuối cùng đã xuất hiện xong (~giây `00:08.5`) thay vì nằm chờ giữa khoảng không trống từ giây `00:00`.

## 1. Cập Nhật `src/components/MinimalistBackground.tsx`

* Giữ nguyên nền `radial-gradient` Giấy Trà Ấm (`palette.background` $\rightarrow$ `palette.backgroundEdge`) và lớp hạt giấy SVG `feTurbulence`.
* Làm mảnh đường kẻ dưới thanh Header `CHÉN 01 — NGHỈ` thành `1px` nhẹ nhàng.
* **Xóa bỏ hoàn toàn:** (1) Vòng tròn nét đứt + dấu cộng `crosshair` ở giữa sân khấu, và (2) Đường kẻ ngang phân cách ở giữa màn hình (`stageTop + stageHeight`).

```tsx
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { ThemePalette, LAYOUT_TOKENS } from '../theme/palettes';

export const MinimalistBackground: React.FC<{
  palette: ThemePalette;
  brandText: string;
  title?: string;
  jobId?: string;
}> = ({ palette, title, jobId = '01' }) => {
  const frame = useCurrentFrame();
  const { swissGrid } = LAYOUT_TOKENS;

  const headerOpacity = interpolate(frame, [0, 24], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const numMatch = jobId.match(/\d+/);
  const issueNumber = numMatch ? numMatch[0].slice(-2).padStart(2, '0') : '01';
  const headerLabel = title
    ? `CHÉN ${issueNumber}  —  ${title.toUpperCase()}`
    : `CHÉN ${issueNumber}  —  TRÀ NGUỘI`;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 44%, ${palette.background} 0%, ${palette.backgroundEdge} 100%)`,
      }}
    >
      {/* 1. Lớp hạt giấy mịn SVG Noise */}
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

      {/* 2. Thanh Header CHÉN 01 với đường gạch dưới mảnh nhẹ 1px */}
      <div
        style={{
          position: 'absolute',
          top: swissGrid.headerTop,
          left: swissGrid.marginLeft,
          right: swissGrid.marginRightTop,
          height: swissGrid.headerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${palette.surfaceSubtle}`,
          opacity: headerOpacity,
        }}
      >
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 21,
            fontWeight: 500,
            letterSpacing: '0.18em',
            color: palette.inkSecondary,
            textTransform: 'uppercase',
          }}
        >
          {headerLabel}
        </span>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: palette.accent,
            display: 'inline-block',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
```

## 2. Cập Nhật `src/components/AdaptiveTypography.tsx` (Khóa Chiều Cao Rãnh Đọc & Hiệu Ứng Đóng Triện `• TRÀ NGUỘI`)

* Bọc riêng danh sách các dòng chữ (`sync.segmentTimings`) trong một thẻ `<div style={{ position: 'relative', paddingLeft: 36 }}>` để đường rãnh nền xám mờ (`Editorial Track`) và thanh tiến trình Đỏ Gạch (`activeRailScaleY`) ôm vừa khít từ đỉnh dòng 1 đến đúng chân dòng chữ cuối cùng (không bao giờ thò dư xuống chữ ký).
* Đặt khối chữ ký **`• TRÀ NGUỘI`** tách biệt ở ngay bên dưới (`marginTop: 30px`, `paddingLeft: 36px`), và chỉ cho phép nó hiện êm ra như một con dấu triện khép lại bài thơ ngay khi câu cuối cùng vừa hiện rõ (`[sync.allTextFinishedFrame - 12, sync.allTextFinishedFrame + 36]`).

```tsx
import React from 'react';
import {
  useCurrentFrame,
  interpolate,
  interpolateColors,
  Easing,
} from 'remotion';
import { TimelineSyncResult } from '../engine/timelineSync';
import { ThemePalette, LAYOUT_TOKENS } from '../theme/palettes';
import { VideoInputProps } from '../schemas/videoSchema';

export const AdaptiveTypography: React.FC<{
  props: VideoInputProps;
  sync: TimelineSyncResult;
  palette: ThemePalette;
}> = ({ props, sync, palette }) => {
  const frame = useCurrentFrame();
  const isPoem = props.textFormat === 'POEM';
  const { swissGrid } = LAYOUT_TOKENS;

  // Tính tỷ trọng số hàng thực tế của từng segment để thanh Đỏ trượt khớp từng dòng
  const lineWeights = sync.segmentTimings.map((seg) =>
    isPoem ? 1 : Math.max(1, Math.ceil(seg.text.length / 27))
  );
  const totalVisualLines = lineWeights.reduce((a, b) => a + b, 0);

  const railFrames: number[] = [0];
  const railRatios: number[] = [0];
  let cumulativeLines = 0;

  sync.segmentTimings.forEach((seg, idx) => {
    const prevRatio = cumulativeLines / totalVisualLines;
    cumulativeLines += lineWeights[idx];
    const nextRatio = cumulativeLines / totalVisualLines;

    if (seg.startFrame > railFrames[railFrames.length - 1]) {
      railFrames.push(seg.startFrame);
      railRatios.push(prevRatio);
    }
    railFrames.push(seg.endTypingFrame);
    railRatios.push(nextRatio);
  });

  const activeRailScaleY = interpolate(frame, railFrames, railRatios, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const trackOpacity = interpolate(frame, [0, 25], [0, 0.7], {
    extrapolateRight: 'clamp',
  });

  // Hiệu ứng "Đóng dấu triện cuối bài": • TRÀ NGUỘI chỉ hiện êm lên khi dòng chữ cuối vừa xuất hiện xong
  const sealProgress = interpolate(
    frame,
    [sync.allTextFinishedFrame - 12, sync.allTextFinishedFrame + 36],
    [0, 1],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  const sealTranslateY = interpolate(sealProgress, [0, 1], [8, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        top: swissGrid.typographyTop,
        left: swissGrid.marginLeft,
        right: swissGrid.marginRightBottom,
      }}
    >
      {/* KHỐI 1: Vùng chứa các dòng Quote + Thanh Tiến Trình Đọc (Chiều cao khớp 100% tới đáy dòng cuối) */}
      <div
        style={{
          position: 'relative',
          paddingLeft: 36,
          paddingTop: 2,
          paddingBottom: 2,
        }}
      >
        {/* Đường rãnh nền mảnh mờ dừng đúng tại chân dòng chữ cuối */}
        <div
          style={{
            position: 'absolute',
            left: 1,
            top: 10,
            bottom: 10,
            width: 1.5,
            backgroundColor: palette.surfaceSubtle,
            opacity: trackOpacity,
          }}
        />

        {/* Thanh Đỏ Gạch trượt từ đỉnh dòng 1 tới đúng chân dòng cuối */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 10,
            bottom: 10,
            width: 3.5,
            backgroundColor: palette.accent,
            transformOrigin: 'top center',
            transform: `scaleY(${activeRailScaleY.toFixed(4)})`,
            borderRadius: 2,
          }}
        />

        {sync.segmentTimings.map((seg, idx) => {
          const lineProgress = interpolate(
            frame,
            [seg.startFrame, seg.endTypingFrame],
            [0, 1],
            {
              easing: Easing.out(Easing.cubic),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          );

          const translateY = interpolate(lineProgress, [0, 1], [12, 0]);
          const blurPx = interpolate(lineProgress, [0, 1], [4.5, 0]);

          const isSentenceEnd =
            !isPoem &&
            idx < sync.segmentTimings.length - 1 &&
            /[.!?…]$/.test(seg.text.trim());

          const renderLineContent = () => {
            if (!seg.containsPivot || seg.pivotCharStartIndex === -1) {
              return <span>{seg.text}</span>;
            }

            const beforePivot = seg.text.slice(0, seg.pivotCharStartIndex);
            const pivotPart = seg.text.slice(
              seg.pivotCharStartIndex,
              seg.pivotCharEndIndex
            );
            const afterPivot = seg.text.slice(seg.pivotCharEndIndex);

            const pivotColor = interpolateColors(
              lineProgress,
              [0.15, 0.85],
              [palette.inkPrimary, palette.accent]
            );

            return (
              <>
                <span>{beforePivot}</span>
                <span style={{ color: pivotColor, fontWeight: 600 }}>
                  {pivotPart}
                </span>
                <span>{afterPivot}</span>
              </>
            );
          };

          return (
            <div
              key={seg.index}
              style={{
                opacity: lineProgress,
                transform: `translateY(${translateY.toFixed(2)}px)`,
                filter: blurPx > 0.05 ? `blur(${blurPx.toFixed(2)}px)` : 'none',
                fontFamily: "'Noto Serif', Georgia, serif",
                fontSize: isPoem ? 43 : 40,
                lineHeight: 1.78,
                color: palette.inkPrimary,
                marginBottom: isSentenceEnd ? 14 : 0,
                textAlign: 'left',
                textWrap: 'balance',
                willChange: 'opacity, transform, filter',
              }}
            >
              {renderLineContent()}
            </div>
          );
        })}
      </div>

      {/* KHỐI 2: Con dấu chữ ký • TRÀ NGUỘI hiện êm lên sau khi câu chữ cuối đã hoàn tất */}
      <div
        style={{
          marginTop: 30,
          paddingLeft: 36,
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
            fontFamily: "'Inter', sans-serif",
            fontSize: 19,
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
```
