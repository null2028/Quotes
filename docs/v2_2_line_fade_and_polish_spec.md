# V2.2 Editorial Typography & Final Polish Specification: Hiện Chữ Êm Theo Từng Dòng/Cụm Câu (Line-by-Line Fade Reveal) & Xóa Bóng Phân Thân

> **Mục đích tài liệu (`V2_2_LINE_FADE_AND_POLISH_SPEC.md`):** Tài liệu này hướng dẫn AI Coding Agent (Antigravity) thực hiện bản tinh chỉnh hoàn thiện **V2.2** trên `/Volumes/Data/Quotes`, tập trung giải quyết triệt để **trải nghiệm hiển thị chữ (Typography)** và **2 chi tiết nhỏ còn lại của Animation**:
> 1. **Chuyển hoàn toàn từ gõ từng ký tự sang "Hiện êm theo từng dòng/cụm câu hoàn chỉnh" (`Line-by-Line Editorial Fade Reveal`):**
>    * Dựng sẵn toàn bộ các dòng trong DOM ngay từ `frame = 0` (**Zero Layout Shift**): Không bao giờ còn lỗi nhảy rớt chữ giữa chừng (`ta qua cả` rớt từ dòng 1 xuống dòng 2), không còn lỗi cắt cụt chữ tiếng Việt (`nhữn`, `đẹ`, `đờ`), và thanh vạch dọc màu Đỏ Gạch bên trái giữ cố định chiều cao trọn vẹn ngay từ đầu (vẽ mượt từ trên xuống bằng `scaleY` trong `0.8s`).
>    * Mỗi dòng thơ / mệnh đề văn xuôi hiện lên nguyên vẹn bằng chuyển động **Editorial Mist Reveal** kéo dài `1.1 giây` (`opacity: 0 -> 1`, `translateY: 12px -> 0px`, `filter: blur(5px -> 0px)`).
>    * Bỏ hoàn toàn đường gạch chân cứng (`borderBottom`) cắt ngang dấu nặng và chân chữ `g`; thay bằng hiệu ứng chuyển mượt sang màu **Đỏ Gạch (`palette.accent`)** tinh tế trên từ khóa `pivotWord`.
> 2. **Đồng bộ lại `pivotFrame` trong `timelineSync.ts` cho chế độ Line-by-Line:** Vì cả dòng chứa `pivotWord` hiện lên cùng lúc (không còn gõ từng ký tự), `pivotFrame` được đặt chính xác tại thời điểm dòng chứa `pivotWord` bắt đầu hiện rõ (`startFrame + 0.35s`) để chuyển động trên hình khớp hoàn hảo với khoảnh khắc mắt người đọc nhìn thấy câu bẻ lái.
> 3. **Xóa lỗi phân thân (cross-fade 2 bóng người) ở giây `00:09` của `quote-001` & Nhấc nhẹ tán ô `6px` ở `quote-002`.**

## 1. Cập Nhật `computeTimelineSync()` Cho Nhịp Line-by-Line (`src/engine/timelineSync.ts`)

Với chế độ hiện từng dòng nguyên vẹn trên khung 15 giây (`900 frames`), mỗi dòng có `1.1s` để hiện êm (`fadeDurationFrames = 66`) và khoảng nghỉ đọc thấm (`readingHold`) giữa các dòng khoảng `1.1s – 1.4s`, sao cho dòng cuối hiện xong vào khoảng giây `8.5s – 9.2s`:

```typescript
import { VideoInputProps } from '../schemas/videoSchema';
import { LAYOUT_TOKENS } from '../theme/palettes';

export interface SegmentTiming {
  index: number;
  text: string;
  startFrame: number;
  endTypingFrame: number; // Thời điểm dòng chữ đã hiện rõ 100% (kết thúc fade-in 1.1s)
  containsPivot: boolean;
  pivotCharStartIndex: number;
  pivotCharEndIndex: number;
}

export interface TimelineSyncResult {
  fps: number;
  introBufferFrames: number;
  segmentTimings: SegmentTiming[];
  pivotFrame: number;
  allTextFinishedFrame: number;
  durationInFrames: number;
}

export function computeTimelineSync(
  props: VideoInputProps,
  fps: number = LAYOUT_TOKENS.fps
): TimelineSyncResult {
  const targetDurationSec = props.targetDurationSeconds ?? 15;
  const durationInFrames = Math.round(targetDurationSec * fps);
  const introBufferFrames = Math.round(1.0 * fps); // 1.0s đầu mở khung lưới và bối cảnh

  const segCount = Math.max(1, props.segments.length);
  const fadeDurationFrames = Math.round(1.1 * fps); // Mỗi dòng hiện êm trong 1.1 giây

  // Phân bổ các dòng xuất hiện đều đặn trong khoảng 1.0s -> 8.8s (chừa ~6.2s cuối cho Hồi III)
  const totalRevealSpanSec = Math.min(8.2, Math.max(4.8, targetDurationSec * 0.54));
  const stepBetweenLinesFrames =
    segCount > 1
      ? Math.round(((totalRevealSpanSec - 1.1) * fps) / (segCount - 1))
      : 0;

  const normalizedPivot = props.pivotWord.trim().toLowerCase();
  let targetSegmentIndex = -1;
  let targetCharIndex = -1;

  for (let i = segCount - 1; i >= 0; i--) {
    const cleanSeg = props.segments[i].trim();
    const idx = cleanSeg.toLowerCase().lastIndexOf(normalizedPivot);
    if (idx !== -1) {
      targetSegmentIndex = i;
      targetCharIndex = idx;
      break;
    }
  }

  let detectedPivotFrame: number | null = null;

  const segmentTimings: SegmentTiming[] = props.segments.map((rawText, index) => {
    const text = rawText.trim();
    const startFrame = introBufferFrames + index * stepBetweenLinesFrames;
    const endTypingFrame = startFrame + fadeDurationFrames;

    const containsPivot = index === targetSegmentIndex && targetCharIndex !== -1;
    if (containsPivot) {
      // Kích hoạt chuyển cảnh hình ảnh ngay khi dòng chứa pivotWord vừa hiện lên được ~35% (0.38s)
      detectedPivotFrame = startFrame + Math.round(0.38 * fps);
    }

    return {
      index,
      text,
      startFrame,
      endTypingFrame,
      containsPivot,
      pivotCharStartIndex: containsPivot ? targetCharIndex : -1,
      pivotCharEndIndex: containsPivot ? targetCharIndex + props.pivotWord.trim().length : -1,
    };
  });

  const allTextFinishedFrame =
    segmentTimings[segmentTimings.length - 1]?.endTypingFrame ?? Math.round(8.8 * fps);

  const pivotFrame =
    detectedPivotFrame ??
    segmentTimings[segmentTimings.length - 1]?.startFrame ??
    Math.round(6.5 * fps);

  return {
    fps,
    introBufferFrames,
    segmentTimings,
    pivotFrame,
    allTextFinishedFrame,
    durationInFrames,
  };
}
```

## 2. Thiết Kế Lại `AdaptiveTypography.tsx`: Pre-Layout Cố Định & Line-by-Line Fade Reveal

* **Không bao giờ dùng `if (frame < seg.startFrame) return null`** và **không bao giờ cắt chuỗi `.slice()`**.
* Toàn bộ các dòng chữ luôn hiện diện trong DOM ngay từ `frame = 0` (dòng chưa tới giờ hiện thì có `opacity: 0`), nhờ vậy chiều cao khung chứa cố định 100%, thanh dọc bên trái vẽ một mạch mượt mà bằng `transform: scaleY(...)`, và `textWrap: 'balance'` không bao giờ nhảy chữ giữa chừng.
* Từ khóa `pivotWord` chuyển màu mượt từ `palette.inkPrimary` sang `palette.accent` bằng `interpolateColors()` của [Remotion](https://www.remotion.dev/docs/interpolate), không dùng gạch chân `borderBottom` để giữ sạch tuyệt đối dấu tiếng Việt.

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

  // Thanh vạch dọc bên trái vẽ mượt từ trên xuống dưới trong 0.9s đầu trên khung chiều cao cố định
  const railScaleY = interpolate(frame, [8, 62], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
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
        paddingTop: 4,
        paddingBottom: 4,
      }}
    >
      {/* Thanh dọc dẫn hướng màu Đỏ Gạch (Chiều cao cố định 100% theo tổng các dòng, không bao giờ giật cục) */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 6,
          bottom: 14,
          width: 3.5,
          backgroundColor: palette.accent,
          transformOrigin: 'top center',
          transform: `scaleY(${railScaleY})`,
          borderRadius: 2,
        }}
      />

      {/* Danh sách toàn bộ các dòng chữ đã cố định bố cục ngay từ Frame 0 */}
      {sync.segmentTimings.map((seg) => {
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

        const translateY = interpolate(lineProgress, [0, 1], [14, 0]);
        const blurPx = interpolate(lineProgress, [0, 1], [5, 0]);

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

          // Chuyển màu êm ái từ màu mực sang màu Đỏ Gạch khi dòng chữ hiện rõ
          const pivotColor = interpolateColors(
            lineProgress,
            [0.25, 0.95],
            [palette.inkPrimary, palette.accent]
          );

          return (
            <>
              <span>{beforePivot}</span>
              <span
                style={{
                  color: pivotColor,
                  fontWeight: 600,
                }}
              >
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
              fontSize: isPoem ? 44 : 41,
              lineHeight: isPoem ? 1.64 : 1.56,
              color: palette.inkPrimary,
              marginBottom: isPoem ? 18 : 24,
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

## 3. Sửa Hạt Sạn Phân Thân Ở `quote-001` & Nhấc Nhẹ Tán Ô Ở `quote-002`

### 3.1. Xóa lỗi Cross-Fade 2 bóng người ở giây `00:09` trong `TensionReleaseArchetype.tsx`
* **Nguyên nhân lỗi ở V2.1:** Đang vẽ 2 nhân vật ở 2 bên trái – phải của khối đá rồi dùng `opacity` đổi chỗ nên tại giây `00:09` xuất hiện cùng lúc 2 bóng mờ.
* **Cách sửa chuẩn:** Giữ **duy nhất 1 nhân vật ở bên trái khối đá** (`x = boulderX - 46`). Khi chuyển từ đứng đẩy sang ngồi nghỉ (`sitT = state.beat2SettleGlow` chạy mượt từ `0 -> 1` trong `2.8s`), nội suy trực tiếp tọa độ của **cùng 1 đầu, 1 thân áo choàng, 1 đôi chân** hạ thấp dần xuống mặt dốc `y = 0`, lưng tựa sát vào vách trái của khối đá, mặt hướng về bên trái ngắm mặt trời hoàng hôn Đỏ Gạch, tay nâng tách trà Đỏ Gạch đặt phía trước (`x = -18`). Không dùng bất kỳ lệnh `opacity` cross-fade 2 nhân vật nào!

```tsx
// Bên trong <g transform="translate(275px, 295px) rotate(-15.5deg)"> của TensionReleaseArchetype.tsx:
const sitT = state.beat2SettleGlow; // 0 -> 1 liên tục trong 2.8s
const charBaseX = boulderX - 52 + sitT * 10; // Trượt nhẹ 10px áp sát lưng vào vách trái khối đá (boulderX - 32)

// Nội suy liên tục tọa độ Đầu (1 hình tròn duy nhất):
const headCx = 6 * (1 - sitT) + 2 * sitT;
const headCy = -44 * (1 - sitT) + -29 * sitT;

// Nội suy liên tục tọa độ Đỉnh & Đáy Thân Áo Choàng (1 path duy nhất):
const topY = -34 * (1 - sitT) + -20 * sitT;
const botY = -8 * (1 - sitT) + -1 * sitT;
const cloakPath = `M ${headCx - 3} ${topY} C ${-6} ${topY + 8} ${-9} ${botY - 5} ${-7} ${botY} L ${9} ${botY} C ${11} ${botY - 5} ${9} ${topY + 8} ${headCx + 3} ${topY} Z`;
```
*(Nhờ nội suy trực tiếp tọa độ của 1 thực thể duy nhất, nhân vật từ từ hạ gối ngồi xuống tựa lưng vào khối đá mượt như hoạt hình vẽ tay, tuyệt đối không có bóng ma phân thân).*

### 3.2. Nhấc tán ô cao thêm `7px` khi hạ nghiêng ở `OrbitDistanceArchetype.tsx`
* Trong `OrbitDistanceArchetype.tsx`, sửa dòng `translateY` của chiếc ô đỏ từ `292 + state.beat2SettleGlow * 22` thành **`290 + state.beat2SettleGlow * 14`** và góc xoay từ `12 + state.beat2SettleGlow * 32` thành **`12 + state.beat2SettleGlow * 24`** để khi chiếc ô hạ nghiêng ở Hồi III vẫn nằm thoáng phía trên đầu nhân vật, thấy rõ trọn vẹn dáng đầu và cổ áo choàng.
