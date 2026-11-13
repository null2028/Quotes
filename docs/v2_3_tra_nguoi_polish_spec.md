# V2.3 Brand & Precision Polish Specification: Nhận Diện "TRÀ NGUỘI" (`CHÉN 01`), Lưới Dòng Đều Tuyệt Đối & Khớp Nhịp Tức Thì

> **Mục đích tài liệu (`V2_3_TRA_NGUOI_POLISH_SPEC.md`):** Tài liệu này hướng dẫn AI Coding Agent (Antigravity) hoàn thiện bản chuẩn **V2.3 (Production Master Candidate)** tại `/Volumes/Data/Quotes`, giải quyết dứt điểm 4 điểm tinh chỉnh từ kiểm duyệt thực tế và tích hợp bộ nhận diện thương hiệu chính thức **Trà Nguội (`@tranguoi.15s`)**:
> 1. **Áp dụng Thương hiệu chính thức `TRÀ NGUỘI` (`@tranguoi.15s`):** Đổi Header góc trái thành **`CHÉN 01 — NGHỈ`**, **`CHÉN 02 — NGƯỢC LỐI`** (lưu ý nạp font `Inter` có subset `'vietnamese'` để chữ `CHÉN` và dấu tiếng Việt sắc nét) và đổi toàn bộ chân trang sang **`• TRÀ NGUỘI`**.
> 2. **Khắc phục triệt để lỗi khoảng cách dòng không đều (`Baseline Grid Lock`):** Loại bỏ `marginBottom` giữa các mệnh đề cùng câu; áp dụng duy nhất một `lineHeight: 1.78` xuyên suốt để dù một `segment` tự xuống thành 2 dòng hay tách thành các `segment` riêng thì khoảng cách giữa mọi hàng chữ trên màn hình đều bằng nhau tuyệt đối 100%.
> 3. **Thanh Tiến Trình Đọc Thông Minh (`Progressive Reading Rail`):** Thay vì vạch Đỏ Gạch kéo dài thò xuống khoảng không trống ngay từ giây `00:00`, vẽ một đường rãnh mảnh mờ (`surfaceSubtle`) cố định và cho vạch Đỏ Gạch trượt êm xuống khớp chính xác với chiều cao của dòng chữ đang hiển thị.
> 4. **Xóa độ trễ ~1s tại `pivotFrame` & Tăng độ lớn chủ thể thêm 20% (`cameraScale: 1.34 -> 1.04`):** Ngay khoảnh khắc dòng chứa `pivotWord` bắt đầu hiện lên, nhân vật trên hình bắt đầu hành động chuyển đổi ngay lập tức (không trễ nhịp), đồng thời phóng to khung cảnh để nhân vật, chiếc ô đỏ, tảng đá và tách trà rõ nét trên màn hình điện thoại.

## 1. Cập Nhật Bộ Nhận Diện Thương Hiệu `TRÀ NGUỘI` (`MinimalistBackground.tsx`, Schema & CLI)

### 1.1. Định dạng `CHÉN 01 — TÊN BÀI` & Chân trang `TRÀ NGUỘI` trong `src/components/MinimalistBackground.tsx`
* Đảm bảo hàm `loadFont` của `@remotion/google-fonts/Inter` nạp đầy đủ `subsets: ['vietnamese', 'latin']` để chữ **`CHÉN`** và các tiêu đề tiếng Việt có dấu hiển thị hoàn hảo.
* Sửa công thức `headerLabel`:

```typescript
const numMatch = jobId.match(/\d+/);
const issueNumber = numMatch ? numMatch[0].slice(-2).padStart(2, '0') : '01';
const headerLabel = title
  ? `CHÉN ${issueNumber}  —  ${title.toUpperCase()}`
  : `CHÉN ${issueNumber}  —  TRÀ NGUỘI`;
```

### 1.2. Đổi mặc định `brandText` và Metadata Caption trên toàn dự án
* Trong `src/schemas/videoSchema.ts`, `src/cli/inputLoader.ts`, `src/automation/semanticMapper.ts`, `src/mocks/sampleInputs.ts` và `inputs/jobs.json`: Đổi toàn bộ giá trị mặc định `'MỘT CHÚT TÔI'` thành **`'TRÀ NGUỘI'`**.
* Trong `src/cli/batchRender.ts`, cập nhật `metadata.json` xuất ra chuẩn cấu trúc đăng kênh `@tranguoi.15s`:

```typescript
const numMatch = spec.id.match(/\d+/);
const cupNo = numMatch ? numMatch[0].slice(-2).padStart(2, '0') : '01';
const captionText = [
  `Chén ${cupNo}${spec.title ? ` — ${spec.title}` : ''}`,
  spec.segments.join('\n'),
  '———',
  'Trà Nguội (@tranguoi.15s)',
  'Chút thơ, chút đời, chút ngẫm — chát ở đầu môi nhưng ngọt ở câu cuối.',
  '#tranguoi #tranguoi15s #chiemnghiem #quotes',
].join('\n');
```

## 2. Sửa Khoảng Cách Dòng Đều 100% & Thanh Tiến Trình Đọc (`src/components/AdaptiveTypography.tsx`)

### Nguyên nhân & Giải pháp Toán học:
* Ở bản V2.2, `segment[0]` dài nên gãy thành 2 dòng (khoảng cách giữa dòng 1 & 2 là `lineHeight: 1.56`), còn giữa `segment[0]` và `segment[1]` lại cộng thêm `marginBottom: 24px`, khiến khoảng cách giữa dòng 2–3 và 3–4 rộng gấp đôi dòng 1–2.
* **Giải pháp:** Đặt **`marginBottom: 0`** cho tất cả các dòng thơ (`POEM`) và tất cả các mệnh đề nối tiếp trong cùng một câu văn xuôi (`PROSE`), chỉ dùng duy nhất **`lineHeight: 1.78`** thống nhất! (Trong văn xuôi, chỉ cộng nhẹ `marginBottom: 14px` khi kết thúc hẳn một câu bằng dấu `.` `!` `?` để sang câu hoàn toàn mới).
* **Thanh Đỏ Gạch trượt theo chiều cao dòng chữ thực tế:** Tính số hàng hiển thị ước lượng của từng `segment` (`estimatedLines = Math.max(1, Math.ceil(seg.text.length / 28))`), từ đó nội suy `railScaleY` khớp chính xác từ hàng chữ đầu tiên đến hàng chữ cuối cùng mà không bao giờ thò vạch đỏ xuống khoảng trắng bên dưới!

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

  // Ước lượng tỷ trọng chiều cao thực tế (số dòng hiển thị) của từng segment để thanh Đỏ trượt chuẩn xác
  const lineWeights = sync.segmentTimings.map((seg) =>
    isPoem ? 1 : Math.max(1, Math.ceil(seg.text.length / 27))
  );
  const totalVisualLines = lineWeights.reduce((a, b) => a + b, 0);

  // Xây dựng mảng mốc thời gian & tỷ lệ chiều cao tích lũy cho thanh tiến trình Đỏ Gạch
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

  const trackOpacity = interpolate(frame, [0, 25], [0, 0.85], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: swissGrid.typographyTop,
        left: swissGrid.marginLeft,
        right: swissGrid.marginRightBottom,
        paddingLeft: 36,
        paddingTop: 2,
        paddingBottom: 2,
      }}
    >
      {/* Đường rãnh nền mảnh mờ (Editorial Track) cố định chiều cao */}
      <div
        style={{
          position: 'absolute',
          left: 1,
          top: 10,
          bottom: 12,
          width: 1.5,
          backgroundColor: palette.surfaceSubtle,
          opacity: trackOpacity,
        }}
      />

      {/* Thanh Đỏ Gạch trượt êm xuống đúng tới đáy của dòng chữ đang hiện (Không bao giờ dư đuôi) */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 10,
          bottom: 12,
          width: 3.5,
          backgroundColor: palette.accent,
          transformOrigin: 'top center',
          transform: `scaleY(${activeRailScaleY.toFixed(4)})`,
          borderRadius: 2,
        }}
      />

      {/* Các dòng chữ khóa chung trên 1 Baseline Grid (lineHeight: 1.78, marginBottom: 0 cho cùng câu) */}
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

        // Chỉ tách khoảng cách nhẹ (14px) nếu là văn xuôi kết thúc hẳn 1 câu bằng dấu chấm (. ! ?) và chưa phải dòng cuối
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
              lineHeight: 1.78, // Khoảng cách dòng chuẩn in ấn, đều 100% ở mọi dòng tự xuống hàng lẫn dòng mới
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
  );
};
```

## 3. Xóa Độ Trễ Tại `pivotFrame` & Phóng To Khung Cảnh (`timelineSync.ts` & `motionPhysics.ts`)

### 3.1. Trong `src/engine/timelineSync.ts`
* Sửa dòng gán `detectedPivotFrame` từ `startFrame + Math.round(0.38 * fps)` thành **`detectedPivotFrame = startFrame;`** (Ngay khoảnh khắc dòng chứa `pivotWord` bắt đầu hiện lên là kích hoạt `pivotFrame` ngay, không trễ `0.38s`).

### 3.2. Trong `src/engine/motionPhysics.ts`
* **Xóa độ trễ `+ 0.5s` của `beat2SettleGlow` và giảm độ trễ của `beat3LingeringWalk` xuống `+ 0.25s`:**
  ```typescript
  // Nhịp 1: Dừng bước & Mưa bắt đầu ngớt ngay trước pivotFrame 0.3s, tan hẳn sau 1.6s
  const beat1StopClear = interpolate(
    frame,
    [pivotFrame - Math.round(0.3 * fps), pivotFrame + Math.round(1.6 * fps)],
    [0, 1],
    {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Nhịp 2: Ngồi tựa lưng / Hạ ô & Mặt trời đỏ hiện lên NGAY TẠI pivotFrame (0 độ trễ, kéo dài 2.4s)
  const beat2SettleGlow = interpolate(
    frame,
    [pivotFrame, pivotFrame + Math.round(2.4 * fps)],
    [0, 1],
    {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Nhịp 3: Bước tách sang nhánh rẽ / Khói trà & Cánh chim bắt đầu ngay sau pivotFrame 0.25s, kéo dài tới 14.7s
  const beat3Start = pivotFrame + Math.round(0.25 * fps);
  const beat3End = Math.max(beat3Start + 120, durationInFrames - Math.round(0.3 * fps));
  const beat3LingeringWalk = interpolate(
    frame,
    [beat3Start, beat3End],
    [0, 1],
    {
      easing: Easing.inOut(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  ```
* **Tăng độ lớn `cameraScale` thêm ~20% để chủ thể rõ nét trên màn hình dọc:**
  ```typescript
  const cameraScale = interpolate(
    frame,
    [0, pivotFrame, durationInFrames],
    [1.34, 1.22, 1.04],
    {
      easing: Easing.inOut(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  const cameraPanY = interpolate(
    frame,
    [0, pivotFrame, durationInFrames],
    [16, 6, -8],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  ```
