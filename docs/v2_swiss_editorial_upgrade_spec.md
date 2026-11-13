# V2 Micro-Cinema Specification: Kể Chuyện 3 Hồi 15 Giây, Bố Cục Swiss Editorial & DNA "Kẻ Lữ Hành + Đồ Vật Ẩn Dụ"

> **Mục đích tài liệu (`V2_MICRO_CINEMA_SPEC.md`):** Tài liệu này hướng dẫn AI Coding Agent (Antigravity) nâng cấp toàn diện hệ thống tại `/Volumes/Data/Quotes` từ mô hình "hình học trừu tượng 7.5 giây" (V1) lên **Mô hình Phim Ngắn Ngụ Ngôn 3 Hồi 15 Giây (15s 3-Act Micro-Cinema)** kết hợp **Bố cục Tạp chí Thụy Sĩ (Option 2: Swiss Editorial)** và **DNA Kể chuyện Kép (Kẻ Lữ Hành Tí Hon & Ẩn Dụ Đồ Vật Đời Thường)**.

## 1. Định Nghĩa "Animation DNA" & Cấu Trúc Phim Ngắn 15 Giây (900 Frames @ 60fps)

### 1.1. Ba Dấu Ấn Nhận Diện Kênh (Channel DNA)
1. **Bố cục Tạp chí Thụy Sĩ (Swiss Editorial Grid):** Khung dọc `1080 × 1920` được chia bằng 2 đường kẻ ngang mảnh (`y = 303px` và `y = 865px`) kèm thanh Header đánh số (`NO. 01 — NGHỈ`). Khối chữ bên dưới căn trái hoàn toàn (`left: 92px`, `right: 210px`), có thanh dọc dẫn hướng màu nhấn (`borderLeft: 3.5px`) và bật `textWrap: 'balance'` để né 100% cột nút bấm bên phải của TikTok.
2. **Hệ Nhân vật & Đồ vật Ngụ ngôn (Hybrid Human + Object Parable):**
   * **Nhánh Kẻ Lữ Hành (*The Minimalist Traveler*):** Bóng người nét đơn tối giản có khớp cử động (bước đi, gồng đẩy đá, che ô, ngồi tựa lưng uống trà) đặt trên đường chân trời/con dốc.
   * **Nhánh Đồ Vật Đời Thường (*Poetic Everyday Objects*):** Tương tác có hồn giữa các đồ vật quen thuộc (hai kim đồng hồ chỉ gặp nhau 1 khoảnh khắc, que diêm tự cháy để thắp sáng ngọn nến, chiếc chìa khóa cũ trước ổ khóa đã thay, nút thắt dây hóa cánh chim bay).
3. **Quy luật "Đạo cụ Đỏ (`#D94E34`)" & Máy Quay Ảo (`VirtualCamera`):** Trong mỗi cảnh phim đen-trắng tối giản, chỉ có **duy nhất 1 đạo cụ chứa linh hồn câu chuyện mang màu Đỏ Gạch (`palette.accent`)** (chiếc ô đỏ, tách trà bốc khói đỏ cam, ngọn lửa diêm, tia sáng nơi hai kim đồng hồ chạm nhau, cánh chim đỏ).

### 1.2. Phân Bổ Nhịp Điệu 15 Giây (900 Frames) Qua 3 Hồi Điện Ảnh

| Hồi Phim | Khung Thời Gian (Frames @ 60fps) | Nhịp Đọc Chữ (Typography) | Diễn Biến Câu Chuyện & Góc Máy (`VirtualCamera`) |
| :--- | :--- | :--- | :--- |
| **Hồi I: Hoàn Cảnh (Setup)** | `0.0s – 5.2s`<br>*(Frames `0 – 312`)* | Phác khung `0.8s` đầu; gõ chậm rãi các dòng mở đầu (Setup) kèm khoảng nghỉ `0.75s` giữa mỗi dòng để mắt người xem kịp nhìn lên hình. | **Camera cận/trung cảnh (`scale: 1.22`):** Nhân vật hoặc đồ vật đang ở trong trạng thái nỗ lực, giằng co hoặc đồng hành trong giông bão. |
| **Hồi II: Biến Cố (Turning Point)** | `5.2s – 9.8s`<br>*(Frames `312 – 588`)* | Gõ tới câu kết và chạm **`pivotWord` (khoảng giây `7.2s – 8.2s`, Frame `~430–490`)**; hoàn tất toàn bộ chữ ở giây `9.5s` (`Frame 570`). | **Camera dịch chuyển nhẹ (`scale: 1.10`):** Đúng tại `pivotFrame`, hành động đảo chiều diễn ra (buông tay ngồi tựa vào tảng đá; mưa tạnh và người kia rẽ sang nhánh đường khác; que diêm truyền lửa sang ngọn nến). |
| **Hồi III: Dư Âm (Poetic Afterimage)** | `9.8s – 15.0s`<br>*(Frames `588 – 900`)* | Toàn bộ câu quote giữ nguyên trên màn hình suốt **5.2 giây cuối** để người xem đọc thấm lại. | **Camera Slow Pull-back (`scale: 1.10 -> 0.88`):** Máy quay từ từ kéo lùi ra xa để lộ không gian mênh mông (cánh chim bay ngang bầu trời, khói trà bay lên, hoặc người cầm chiếc ô đỏ đứng lặng một mình dưới nắng). |

## 2. Cập Nhật Schema & Bộ Đồng Bộ Thời Lượng 15 Giây (`videoSchema.ts` & `timelineSync.ts`)

### 2.1. Cập nhật `ArchetypeEnum` & `targetDurationSeconds` trong `src/schemas/videoSchema.ts`

Hỗ trợ cả 6 mã kịch bản kể chuyện mới (và tương thích ngược với tên mã cũ):

```typescript
import { z } from 'zod';

export const StorySceneEnum = z.enum([
  // Nhánh 1: Kẻ Lữ Hành Tí Hon (Human-Centric Parables)
  'BOULDER_TO_BENCH',       // Đẩy tảng đá nặng lên dốc -> Buông tay ngồi tựa lưng vào đá uống trà ngắm trời
  'RAIN_UMBRELLA_PARTING',  // Che chung chiếc ô đỏ qua mưa bão -> Nắng lên người kia rẽ ngang, chiếc ô thành thừa thãi
  // Nhánh 2: Ẩn Dụ Đồ Vật Đời Thường (Poetic Object Parables)
  'PASSING_CLOCK_HANDS',    // Hai kim đồng hồ tiến lại chạm nhau lóe sáng đỏ -> Buộc phải xoay rời xa nhau
  'MATCH_LIGHTING_CANDLE',  // Que diêm tự đốt cháy mình để thắp sáng ngọn nến -> Nến sáng rực khi diêm tàn
  'KEY_CHANGED_LOCK',       // Chiếc chìa khóa đỏ tiến về ổ khóa -> Rãnh khóa đã thay đổi, cửa khép lại
  'KNOT_TO_BIRD',           // Sợi dây xoắn thắt nút rối bời -> Tự cởi nút và hóa thành cánh chim đỏ bay lên
]);
```

Trong `VideoInputSchema`, đặt mặc định:
* `targetDurationSeconds: z.number().min(8).max(30).default(15)` (Mặc định **15 giây**, sẵn sàng làm option trên UI sau này).
* `typingSpeedMsPerChar: z.number().min(25).max(100).default(55)`.

### 2.2. Cập nhật `computeTimelineSync()` trong `src/engine/timelineSync.ts` cho khung 15 Giây

Để chữ không gõ quá nhanh (kết thúc ở giây thứ 4 rồi chờ tới 11 giây), hàm `computeTimelineSync()` tự động phân bổ nhịp gõ chữ và khoảng nghỉ giữa các câu sao cho **quá trình gõ chữ trải đều từ giây `0.9s` đến khoảng giây `9.2s` – `9.8s`**, chừa đúng **5.2 – 5.8 giây cuối (`Act III`)** cho cú lùi máy quay điện ảnh:

```typescript
export function computeTimelineSync(
  props: VideoInputProps,
  fps: number = LAYOUT_TOKENS.fps
): TimelineSyncResult {
  const targetDurationSec = props.targetDurationSeconds ?? 15;
  const durationInFrames = Math.round(targetDurationSec * fps); // Mặc định 900 frames (15s)
  const introBufferFrames = Math.round(0.9 * fps);              // 0.9s mở đầu phác nét bối cảnh

  // Dành khoảng 60% thời lượng đầu (ví dụ ~8.6s trên tổng 15s) cho việc dẫn dắt chữ qua Hồi I & Hồi II
  // để 35-40% thời lượng cuối (~5.5s) là Hồi III (Poetic Afterimage & Camera Pull-back)
  const targetTextWindowSec = Math.max(5.5, targetDurationSec * 0.58);
  const totalChars = props.segments.reduce((acc, s) => acc + s.trim().length, 0);
  const interSegmentPauseSec = props.textFormat === 'POEM' ? 0.72 : 0.65;
  const totalPausesSec = Math.max(0, props.segments.length - 1) * interSegmentPauseSec;

  const effectiveTypingWindowSec = Math.max(3.2, targetTextWindowSec - totalPausesSec);
  const framesPerChar = Math.max(
    2.2,
    (effectiveTypingWindowSec * fps) / Math.max(1, totalChars)
  );
  const interSegmentPauseFrames = Math.round(interSegmentPauseSec * fps);

  let currentFrame = introBufferFrames;
  let detectedPivotFrame: number | null = null;
  const normalizedPivot = props.pivotWord.trim().toLowerCase();

  let targetSegmentIndex = -1;
  let targetCharIndex = -1;

  for (let i = props.segments.length - 1; i >= 0; i--) {
    const cleanSeg = props.segments[i].trim();
    const idx = cleanSeg.toLowerCase().lastIndexOf(normalizedPivot);
    if (idx !== -1) {
      targetSegmentIndex = i;
      targetCharIndex = idx;
      break;
    }
  }

  const segmentTimings: SegmentTiming[] = props.segments.map((rawText, index) => {
    const text = rawText.trim();
    const startFrame = currentFrame;
    const typingFrames = Math.max(24, Math.ceil(text.length * framesPerChar));
    const endTypingFrame = startFrame + typingFrames;

    const containsPivot = index === targetSegmentIndex && targetCharIndex !== -1;
    if (containsPivot) {
      detectedPivotFrame = Math.round(startFrame + targetCharIndex * framesPerChar);
    }

    currentFrame = endTypingFrame + interSegmentPauseFrames;

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
    segmentTimings[segmentTimings.length - 1]?.endTypingFrame ?? Math.round(9.2 * fps);

  const pivotFrame =
    detectedPivotFrame ??
    Math.round(introBufferFrames + (allTextFinishedFrame - introBufferFrames) * 0.75);

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

## 3. Động Cơ Máy Quay Điện Ảnh 3 Hồi (`src/engine/motionPhysics.ts`)

Cập nhật `evaluateMotionState()` để cung cấp thêm thông số **Camera Ảo (`cameraScale`, `cameraPanX`, `cameraPanY`)** và **Tiến độ Hồi III (`act3Progress`: `0 -> 1` từ `allTextFinishedFrame` đến frame `900`)**:

```typescript
import { interpolate, spring, Easing } from 'remotion';
import { VideoInputProps } from '../schemas/videoSchema';

export interface EvaluatedMotionState {
  frame: number;
  fps: number;
  drawProgress: number;       // 0 -> 1 (0.9s đầu)
  act1Progress: number;       // 0 -> 1 (Từ 0 đến pivotFrame: Tiến độ hành trình Hồi I)
  transitionProgress: number; // 0 -> 1 (Xung spring tại pivotFrame mở màn Hồi II)
  act3Progress: number;       // 0 -> 1 (Từ allTextFinishedFrame đến 15s: Dư âm điện ảnh Hồi III)
  accentReveal: number;       // 0 -> 1 (Độ bừng sáng của Đạo cụ Đỏ)
  continuousPhase: number;    // Pha thời gian liên tục (radian)
  cameraScale: number;        // Scale của VirtualCamera (1.20 -> 1.08 -> 0.88)
  cameraPanY: number;         // Dịch chuyển dọc của VirtualCamera
}

export function evaluateMotionState(
  frame: number,
  fps: number,
  pivotFrame: number,
  allTextFinishedFrame: number,
  durationInFrames: number
): EvaluatedMotionState {
  const drawProgress = interpolate(frame, [0, Math.round(0.9 * fps)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const act1Progress = interpolate(frame, [0, pivotFrame], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const transitionProgress = spring({
    frame: frame - pivotFrame,
    fps,
    config: { damping: 14, stiffness: 95, mass: 1.0 },
  });

  const accentReveal = spring({
    frame: frame - pivotFrame,
    fps,
    config: { damping: 16, stiffness: 140 },
  });

  const act3Progress = interpolate(
    frame,
    [allTextFinishedFrame, durationInFrames],
    [0, 1],
    {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const continuousPhase = (frame / fps) * Math.PI * 2;

  // Virtual Camera: Hồi I cận cảnh (1.18) -> Hồi II trung cảnh (1.06) -> Hồi III lùi xa toàn cảnh (0.88)
  const prePivotScale = interpolate(act1Progress, [0, 1], [1.18, 1.08]);
  const postPivotScale = interpolate(act3Progress, [0, 1], [1.08, 0.88]);
  const cameraScale = frame < allTextFinishedFrame ? prePivotScale : postPivotScale;

  const cameraPanY = interpolate(act3Progress, [0, 1], [12, -18]);

  return {
    frame,
    fps,
    drawProgress,
    act1Progress,
    transitionProgress,
    act3Progress,
    accentReveal,
    continuousPhase,
    cameraScale,
    cameraPanY,
  };
}
```

## 4. Đặc Tả Code 6 Phim Ngắn Ngụ Ngôn 3 Hồi (The 6 Micro-Cinema Parables)

Tất cả các cảnh đều được bọc trong `VirtualCamera` (`transform: scale(${state.cameraScale}) translateY(${state.cameraPanY}px)`) внутри `MotionStageRouter.tsx`. Dưới đây là thiết kế chi tiết cho 2 nhánh DNA:

### 4.1. Kịch bản 1 (`BOULDER_TO_BENCH` – Nhánh Kẻ Lữ Hành | Dùng cho `quote-001` "Nghỉ")
* **Hồi I (`0s -> pivotFrame`):** Một con dốc nghiêng từ trái sang phải (`M 60 390 L 480 230`). Nhân vật Kẻ Lữ Hành tí hon gồng mình đẩy một khối đá vuông lớn (`76×76 px`) nhích dần lên dốc, nhịp chân bước nặng nhọc theo `Math.sin(continuousPhase * 2)`.
* **Hồi II (`pivotFrame -> allTextFinishedFrame`):** Đúng khi chữ chạm **`"Mai tính"`**, nhân vật buông tay, bước ra phía trước khối đá và ngồi phệt xuống tựa lưng vào chính khối đá đó. Trên tay nhân vật xuất hiện **tách trà màu Đỏ Gạch (`palette.accent`)** bốc làn khói ấm uốn lượn bay lên.
* **Hồi III (`allTextFinishedFrame -> 15s`):** Camera từ từ lùi ra xa (`scale -> 0.88`), phía trên bầu trời xuất hiện vầng mặt trời/mặt trăng chiều màu đỏ gạch ấm áp và hai cánh chim nhỏ bay ngang qua.

```tsx
import React from 'react';
import { evolvePath } from '@remotion/paths';
import { ArchetypeComponentProps } from './types';

export const TensionReleaseArchetype: React.FC<ArchetypeComponentProps> = ({
  state,
  palette,
  strokeWidth,
}) => {
  const slopePath = 'M 40 380 L 500 220';
  const slopeEvo = evolvePath(state.drawProgress, slopePath);

  // Tiến độ leo dốc ở Hồi I (dừng lại tại pivotFrame)
  const climbT = state.act1Progress * 0.55;
  const struggleBob = (1 - state.transitionProgress) * Math.sin(state.continuousPhase * 2.2) * 4;

  // Tọa độ tâm đáy khối đá trên con dốc (góc dốc ~ -19.2 độ)
  const boulderX = 180 + climbT * 130;
  const boulderY = 331 - climbT * 45;

  // Khi sang Hồi II (transitionProgress -> 1), nhân vật di chuyển từ sau đá (bên trái) ra ngồi tựa trước đá (bên phải)
  const charX = boulderX - 42 + state.transitionProgress * 88;
  const charY = boulderY + 14 - state.transitionProgress * 26;

  // Làn khói trà ấm bay lên ở Hồi II & Hồi III
  const steamOffset = (state.frame % 90) / 90;
  const steamY = charY - 22 - steamOffset * 55;

  return (
    <svg viewBox="0 0 540 480" style={{ width: 600, height: 520, overflow: 'visible' }}>
      {/* Vầng trăng / Hoàng hôn đỏ gạch và cánh chim xuất hiện khi Camera lùi ra ở Hồi II-III */}
      <g opacity={state.accentReveal}>
        <circle
          cx={135}
          cy={125 - state.act3Progress * 18}
          r={24}
          fill={palette.accent}
          opacity={0.85}
        />
        {/* Hai cánh chim bay chậm ở Hồi III */}
        <path
          d={`M ${220 + state.act3Progress * 75} ${110 - state.act3Progress * 15} Q ${228 + state.act3Progress * 75} ${102 - state.act3Progress * 15} ${236 + state.act3Progress * 75} ${110 - state.act3Progress * 15} Q ${244 + state.act3Progress * 75} ${102 - state.act3Progress * 15} ${252 + state.act3Progress * 75} ${110 - state.act3Progress * 15}`}
          fill="none"
          stroke={palette.inkPrimary}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={state.act3Progress}
        />
      </g>

      {/* Đường dốc cuộc đời */}
      <path
        d={slopePath}
        fill="none"
        stroke={palette.inkPrimary}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={slopeEvo.strokeDasharray}
        strokeDashoffset={slopeEvo.strokeDashoffset}
      />

      {/* Khối đá gánh nặng (xoay theo độ nghiêng con dốc -19 độ) -> Hóa điểm tựa lưng */}
      <g
        style={{
          transform: `translate(${boulderX}px, ${boulderY}px) rotate(-19.2deg)`,
          opacity: state.drawProgress,
        }}
      >
        <rect
          x={-34}
          y={-68 + struggleBob * 0.4}
          width={68}
          height={68}
          rx={8}
          fill={palette.background}
          stroke={palette.inkPrimary}
          strokeWidth={strokeWidth}
        />
      </g>

      {/* Nhân vật Kẻ Lữ Hành: Hồi I cúi đẩy đá -> Hồi II & III ngồi thư thái tựa lưng vào đá */}
      <g opacity={state.drawProgress}>
        {/* Đầu nhân vật */}
        <circle
          cx={charX + struggleBob * 0.5}
          cy={charY - 38 + state.transitionProgress * 8}
          r={10}
          fill={palette.inkPrimary}
        />
        {/* Thân nhân vật */}
        <path
          d={
            state.transitionProgress < 0.5
              ? `M ${charX} ${charY - 26} Q ${charX + 10} ${charY - 10} ${charX - 6} ${charY + 12}`
              : `M ${charX - 4} ${charY - 20} L ${charX + 6} ${charY + 4} L ${charX + 26} ${charY - 2}`
          }
          fill="none"
          stroke={palette.inkPrimary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Tay cầm tách trà đỏ gạch & Làn khói thở ở Hồi II - III */}
        {state.accentReveal > 0.2 && (
          <g opacity={state.accentReveal}>
            <rect
              x={charX + 16}
              y={charY - 22}
              width={11}
              height={13}
              rx={2}
              fill={palette.accent}
            />
            <path
              d={`M ${charX + 21} ${steamY + 25} Q ${charX + 15} ${steamY + 12} ${charX + 23} ${steamY}`}
              fill="none"
              stroke={palette.accent}
              strokeWidth={2.2}
              strokeLinecap="round"
              opacity={1 - steamOffset}
            />
          </g>
        )}
      </g>
    </svg>
  );
};
```

### 4.2. Kịch bản 2 (`RAIN_UMBRELLA_PARTING` – Nhánh Kẻ Lữ Hành | Dùng cho `quote-002` "Ngược lối")
* **Hồi I (`0s -> pivotFrame`):** Mưa rơi chéo xối xả (`16` vệt mưa chuyển động liên tục). Hai bóng người tí hon bước đi sát bên nhau trên con đường; người bên trái cầm **chiếc ô màu Đỏ Gạch (`palette.accent`)** nghiêng che cho người bên phải.
* **Hồi II (`pivotFrame -> allTextFinishedFrame`):** Đúng khi chữ chạm **`"rẽ ngang"`**, mưa ngớt dần rồi tạnh hẳn, mặt trời hửng sáng ở góc cao bên phải. Con đường tách nhánh; người bên phải rời khỏi chiếc ô, bước sang nhánh đường bên phải và đi xa dần.
* **Hồi III (`allTextFinishedFrame -> 15s`):** Camera lùi ra xa (`scale -> 0.88`). Người bên trái đứng lặng một mình ở ngã rẽ giữa trời nắng đẹp, tay vẫn cầm **chiếc ô đỏ gạch** giờ đã hạ nghiêng xuống vì không còn mưa và cũng không còn người đi cùng.

```tsx
import React from 'react';
import { evolvePath } from '@remotion/paths';
import { ArchetypeComponentProps } from './types';

export const OrbitDistanceArchetype: React.FC<ArchetypeComponentProps> = ({
  state,
  palette,
  strokeWidth,
}) => {
  const mainRoad = 'M 60 350 L 310 350';
  const branchRight = 'M 250 350 Q 340 345 480 275';
  const roadEvo = evolvePath(state.drawProgress, mainRoad);
  const branchEvo = evolvePath(state.accentReveal, branchRight);

  // Tọa độ tiến bước trong Hồi I
  const walkX = 115 + state.act1Progress * 115;
  const stepBob = (1 - state.transitionProgress) * Math.abs(Math.sin(state.continuousPhase * 3)) * 5;

  // Tọa độ người rời đi ở Hồi II & III (bước dọc theo nhánh rẽ phải)
  const departProgress = Math.min(1, state.transitionProgress * 0.55 + state.act3Progress * 0.45);
  const p2X = walkX + 26 + departProgress * 195;
  const p2Y = 350 - departProgress * 62;
  const p2Scale = 1 - departProgress * 0.28;

  // Cường độ mưa: rơi mạnh ở Hồi I, tạnh hẳn khi sang Hồi II
  const rainOpacity = state.drawProgress * Math.max(0, 1 - state.transitionProgress * 1.4);

  return (
    <svg viewBox="0 0 540 480" style={{ width: 600, height: 520, overflow: 'visible' }}>
      {/* Lớp Mưa Giông ở Hồi I */}
      {rainOpacity > 0.02 && (
        <g opacity={rainOpacity * 0.55}>
          {Array.from({ length: 14 }).map((_, i) => {
            const cycle = ((state.frame * 9 + i * 37) % 260) / 260;
            const rx = 90 + (i * 31) % 360 - cycle * 45;
            const ry = 80 + cycle * 240;
            return (
              <line
                key={i}
                x1={rx}
                y1={ry}
                x2={rx - 10}
                y2={ry + 24}
                stroke={palette.inkSecondary}
                strokeWidth={1.8}
                strokeLinecap="round"
              />
            );
          })}
        </g>
      )}

      {/* Vầng Nắng Đẹp hiện ra ở Hồi II & Hồi III khi mưa tạnh */}
      {state.accentReveal > 0.05 && (
        <g opacity={state.accentReveal}>
          <circle cx={435} cy={120} r={28} fill="none" stroke={palette.accent} strokeWidth={2.5} />
          <circle cx={435} cy={120} r={14} fill={palette.accent} opacity={0.25} />
        </g>
      )}

      {/* Con đường chính & Nhánh rẽ ngang */}
      <path
        d={mainRoad}
        fill="none"
        stroke={palette.inkPrimary}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={roadEvo.strokeDasharray}
        strokeDashoffset={roadEvo.strokeDashoffset}
      />
      <path
        d={branchRight}
        fill="none"
        stroke={palette.inkSecondary}
        strokeWidth={strokeWidth - 0.5}
        strokeLinecap="round"
        strokeDasharray="6 8"
        style={{ opacity: Math.max(0.25, state.accentReveal) }}
      />

      {/* Nhân vật 1 (Người ở lại cầm chiếc ô Đỏ Gạch) */}
      <g opacity={state.drawProgress}>
        <circle cx={walkX} cy={296 - stepBob} r={9.5} fill={palette.inkPrimary} />
        <line
          x1={walkX}
          y1={308 - stepBob}
          x2={walkX}
          y2={348}
          stroke={palette.inkPrimary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Chiếc Ô Đỏ Gạch (#D94E34): Hồi I giương cao che sang phải -> Hồi II/III hạ nghiêng xuống lẻ loi */}
        <g
          style={{
            transform: `translate(${walkX + 12}px, ${278 - stepBob + state.transitionProgress * 18}px) rotate(${14 + state.transitionProgress * 28}deg)`,
          }}
        >
          <path
            d="M -34 0 A 34 30 0 0 1 34 0 Z"
            fill={palette.accent}
            stroke={palette.accent}
            strokeWidth={2}
          />
          <line x1={0} y1={0} x2={0} y2={34} stroke={palette.inkPrimary} strokeWidth={2.2} />
        </g>
      </g>

      {/* Nhân vật 2 (Người được che mưa rồi lặng lẽ rẽ ngang khi nắng lên) */}
      <g
        style={{
          transform: `translate(${p2X}px, ${p2Y}px) scale(${p2Scale})`,
          opacity: state.drawProgress * (1 - state.act3Progress * 0.35),
        }}
      >
        <circle cx={0} cy={-52 - stepBob * 0.8} r={9} fill={palette.inkPrimary} />
        <line
          x1={0}
          y1={-40 - stepBob * 0.8}
          x2={0}
          y2={-2}
          stroke={palette.inkPrimary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};
```

### 4.3. Nhánh Đồ Vật Ẩn Dụ Đời Thường (4 Kịch bản còn lại trong `src/components/archetypes/`)
1. **`ChaosToOrderArchetype.tsx` (`KNOT_TO_BIRD` – Sợi Chỉ Rối Hóa Cánh Chim Đỏ):**
   * Hồi I: Một sợi dây dài đang xoắn rối nhiều vòng ở giữa màn hình.
   * Hồi II (tại `pivotFrame`): Sợi dây duỗi phẳng thành đường chân trời êm dịu, và từ nút thắt ở tâm, một **cánh chim màu Đỏ Gạch (`palette.accent`)** mở cánh bay vút lên cao trong suốt Hồi III.
2. **`LineRuptureHealArchetype.tsx` (`KEY_CHANGED_LOCK` – Chiếc Chìa Khóa Cũ & Ổ Khóa Đã Thay):**
   * Hồi I: Chiếc chìa khóa nét mảnh từ từ tiến về phía ổ khóa quen thuộc ở giữa khung cửa.
   * Hồi II & III: Đúng tại `pivotFrame`, tâm ổ khóa xoay ngang đổi cấu trúc và chuyển sang màu Đỏ Gạch (`palette.accent`), chiếc chìa khóa khựng lại và lùi nhẹ ra ngoài khoảng không.
3. **`BalanceScaleArchetype.tsx` (`MATCH_LIGHTING_CANDLE` – Que Diêm Tự Cháy & Ngọn Nến):**
   * Hồi I: Que diêm nghiêng mình mang đốm lửa nhỏ tiến sát vào bấc của cây nến lớn đang tắt.
   * Hồi II & III: Tại `pivotFrame`, ngọn nến bừng sáng rực rỡ với hào quang màu Đỏ Gạch (`palette.accent`), trong khi thân que diêm bên dưới cong lại và hóa màu xám tro.
4. **`GaugeTransitionArchetype.tsx` (`PASSING_CLOCK_HANDS` – Hai Kim Đồng Hồ Lướt Qua Nhau):**
   * Hồi I: Mặt đồng hồ tối giản không số; kim ngắn và kim dài đang xoay tiến sát về phía nhau.
   * Hồi II & III: Đúng tại `pivotFrame`, hai kim trùng khít lên nhau tạo thành một vòng sóng sáng màu Đỏ Gạch (`palette.accent`), rồi trong 5 giây Hồi III, kim dài tiếp tục xoay tách ra xa để lại kim ngắn ở lại.

## 5. Cập Nhật `MotionStageRouter.tsx` Bọc `VirtualCamera`

Trong `src/components/MotionStageRouter.tsx`, bọc toàn bộ SVG của Archetype bên trong một thẻ `div` điều khiển góc máy `VirtualCamera`:

```tsx
<div
  style={{
    transform: `scale(${evaluatedState.cameraScale}) translateY(${evaluatedState.cameraPanY}px)`,
    transformOrigin: 'center center',
    willChange: 'transform',
  }}
>
  {renderArchetype()}
</div>
```