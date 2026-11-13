# V2.1 Slow-Cinema & Character Rigging Specification: Sửa Hệ Tọa Độ Mặt Dốc, Tạo Hình "Kẻ Lữ Hành Áo Choàng" & Nhịp Phim Chậm 3 Pha

> **Mục đích tài liệu (`V2_1_SLOW_CINEMA_FIX.md`):** Tài liệu này hướng dẫn AI Coding Agent (Antigravity) tinh chỉnh trực tiếp code trong `/Volumes/Data/Quotes` để khắc phục triệt để **3 vấn đề thị giác & nhịp điệu** phát hiện trên 2 video 15 giây vừa xuất:
> 1. **Sửa nhịp Animation quá nhanh & dồn cục tại `pivotFrame`:** Thay thế `spring()` nhanh (`0.4s`) bằng **Chuỗi 3 Nhịp Chậm Nối Tiếp (Staggered Slow-Cinema Beats)** kéo dài mượt mà từ giây `6.6s` đến tận giây `14.8s`, đồng thời giảm tốc độ mưa rơi, bước chân và khói trà xuống **3.5 – 4 lần**.
> 2. **Sửa lỗi tọa độ nhân vật đè vào cạnh khối đá và đầu lơ lửng ở `quote-001` (`TensionReleaseArchetype.tsx`):** Đưa toàn bộ Mặt dốc, Khối đá và Nhân vật vào chung một hệ tọa độ nghiêng `<g transform="translate(270, 305) rotate(-16)">` nơi mặt đất là `y = 0`, đảm bảo chân nhân vật và đáy khối đá luôn chạm khít mặt dốc 100%.
> 3. **Nâng cấp tạo hình nhân vật từ "que diêm (`o + |`)" sang "Kẻ Lữ Hành Áo Choàng (`CloakedTraveler`)" có 2 chân bước đi mềm mại** trong cả `quote-001` và `quote-002`.

## 1. Động Cơ Nhịp Phim Chậm 3 Nhịp Nối Tiếp (`src/engine/motionPhysics.ts`)

Thay thế toàn bộ `src/engine/motionPhysics.ts` bằng công thức **Staggered Slow-Cinema** dưới đây để không còn bất kỳ chuyển động nào bị giật nhanh tại `pivotFrame`:

```typescript
import { interpolate, Easing } from 'remotion';
import { VideoInputProps } from '../schemas/videoSchema';

export interface EvaluatedMotionState {
  frame: number;
  fps: number;
  drawProgress: number;       // 0 -> 1: Phác nét chậm rãi trong 1.4s đầu
  act1Progress: number;       // 0 -> 1: Hành trình Hồi I (từ 0 đến pivotFrame)
  // 3 Nhịp chậm nối tiếp nhau từ pivotFrame đến hết 15s (thay cho spring giật nhanh):
  beat1StopClear: number;     // 0 -> 1: Dừng bước & Mưa ngớt dần (kéo dài 2.0s sau pivotFrame)
  beat2SettleGlow: number;    // 0 -> 1: Hạ ô / Ngồi tựa lưng & Nắng/Trăng đỏ hiện dần (bắt đầu trễ 0.6s, kéo dài 2.8s)
  beat3LingeringWalk: number; // 0 -> 1: Người kia bước xa dần / Chim bay & Khói trà (kéo dài suốt 6.5s cuối tới 14.8s)
  transitionProgress: number; // Tương thích ngược (= beat2SettleGlow)
  act3Progress: number;       // 0 -> 1: Từ lúc chữ gõ xong tới 15s
  accentReveal: number;       // 0 -> 1: Độ hiện màu Đỏ Gạch êm dịu (= beat2SettleGlow)
  continuousPhase: number;    // Pha bước chân chậm rãi (~1 bước chân mỗi 1.6 giây)
  microWave: number;          // Dao động thở chậm
  currentIntensity: number;
  currentSpread: number;
  currentTiltDeg: number;
  cameraScale: number;        // 1.15 -> 1.06 -> 0.90 (Lùi máy quay cực êm)
  cameraPanY: number;
}

export function evaluateMotionState(
  frame: number,
  fps: number,
  pivotFrame: number,
  motion: VideoInputProps['motion'],
  allTextFinishedFrame: number = Math.round(9.2 * fps),
  durationInFrames: number = Math.round(15 * fps)
): EvaluatedMotionState {
  // 1. Phác nét ban đầu chậm rãi trong 1.4 giây (84 frames)
  const drawProgress = interpolate(frame, [0, Math.round(1.4 * fps)], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 2. Tiến độ Hồi I (0 -> pivotFrame) với Easing êm ở cuối để nhân vật giảm tốc tự nhiên trước khi dừng
  const act1Progress = interpolate(frame, [0, pivotFrame], [0, 1], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 3. CHUỖI 3 NHỊP CHẬM NỐI TIẾP (STAGGERED SLOW-CINEMA BEATS):
  // Nhịp 1: Dừng lại & Mưa tan dần trong 2.0 giây (120 frames)
  const beat1StopClear = interpolate(
    frame,
    [pivotFrame - 15, pivotFrame + Math.round(2.0 * fps)],
    [0, 1],
    {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Nhịp 2: Ngồi xuống tựa lưng / Hạ chiếc ô & Mặt trời đỏ hiện lên (trễ 0.5s, kéo dài 2.8s)
  const beat2Start = pivotFrame + Math.round(0.5 * fps);
  const beat2SettleGlow = interpolate(
    frame,
    [beat2Start, beat2Start + Math.round(2.8 * fps)],
    [0, 1],
    {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Nhịp 3: Bước đi xa dần trên nhánh rẽ / Khói trà & Cánh chim (kéo dài suốt 6.5s cuối đến sát giây 15)
  const beat3Start = pivotFrame + Math.round(1.0 * fps);
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

  // 4. Tần số bước chân & hơi thở chậm chuẩn Slow Cinema (chỉ 0.65 chu kỳ/giây)
  const continuousPhase = (frame / fps) * Math.PI * 1.3;
  const microWave = Math.sin(continuousPhase) * (1 - beat1StopClear * 0.65);

  const transitionProgress = beat2SettleGlow;
  const accentReveal = beat2SettleGlow;

  const currentIntensity = interpolate(
    transitionProgress,
    [0, 1],
    [motion.stateA.intensity, motion.stateB.intensity]
  );
  const currentSpread = interpolate(
    beat3LingeringWalk,
    [0, 1],
    [motion.stateA.spread, motion.stateB.spread]
  );
  const currentTiltDeg = interpolate(
    transitionProgress,
    [0, 1],
    [motion.stateA.tiltDeg, motion.stateB.tiltDeg]
  );

  // 5. VirtualCamera lùi chậm và mượt suốt 15 giây (không giật khúc)
  const cameraScale = interpolate(
    frame,
    [0, pivotFrame, durationInFrames],
    [1.14, 1.05, 0.90],
    {
      easing: Easing.inOut(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  const cameraPanY = interpolate(
    frame,
    [0, pivotFrame, durationInFrames],
    [10, 0, -14],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return {
    frame,
    fps,
    drawProgress,
    act1Progress,
    beat1StopClear,
    beat2SettleGlow,
    beat3LingeringWalk,
    transitionProgress,
    act3Progress,
    accentReveal,
    continuousPhase,
    microWave,
    currentIntensity,
    currentSpread,
    currentTiltDeg,
    cameraScale,
    cameraPanY,
  };
}
```

## 2. Sửa Triệt Để Hệ Tọa Độ Mặt Dốc & Tạo Hình Ở `TensionReleaseArchetype.tsx` (`quote-001` "Nghỉ")

**Cách giải quyết triệt để lỗi nhân vật đè vào cạnh đá và đầu bị rơi rời khỏi thân:**
* Đặt **Mặt đường dốc (`y = 0`) + Khối đá + Nhân vật** vào chung một hệ tọa độ nghiêng `<g transform="translate(270, 300) rotate(-15.5)">`.
* Trong hệ tọa độ này, mặt đất luôn là đường phẳng **`y = 0`**:
  * **Khối đá (`Boulder`):** Rộng `64px`, cao `64px`, đáy nằm khít tại `y = 0` (`y` từ `-64` đến `0`), tâm ngang tại `boulderX`.
  * **Nhân vật Áo Choàng (`Cloaked Traveler`):**
    * Khi ở Hồi I (`beat2SettleGlow` = 0): Đứng ở bên trái khối đá (`x = boulderX - 54`), bàn chân chạm khít `y = 0`, thân áo choàng nghiêng về phía trước đẩy vào đúng vách trái của khối đá (`x = boulderX - 32`).
    * Khi chuyển sang Hồi II (`beat2SettleGlow` tăng từ `0 -> 1` trong `2.8 giây`): Nhân vật hạ dần trọng tâm ngồi xuống ngay sát vách đá, lưng tựa vào đá, đùi và chân duỗi trên mặt đất `y = 0`, đầu (`y = -34`) gắn liền trực tiếp với thân áo choàng (`y = -25..0`), tay nâng **tách trà Đỏ Gạch** liền khối!
* **Bầu trời (Mặt trời hoàng hôn Đỏ Gạch + Đôi chim bay chậm + Làn khói trà chu kỳ 4 giây)** đặt ngoài `<g>` xoay để luôn giữ phương thẳng đứng tự nhiên.

```tsx
import React from 'react';
import { evolvePath } from '@remotion/paths';
import { ArchetypeComponentProps } from './types';

export const TensionReleaseArchetype: React.FC<ArchetypeComponentProps> = ({
  state,
  palette,
  strokeWidth,
}) => {
  // Tiến độ đẩy đá chậm rãi ở Hồi I (từ x = -50 lên x = +15 dọc theo mặt dốc)
  const boulderX = -50 + state.act1Progress * 65;
  const sitT = state.beat2SettleGlow; // 0 = đang đứng đẩy, 1 = đã ngồi tựa lưng thư thái
  const walkCycle = Math.sin(state.continuousPhase) * (1 - state.beat1StopClear);

  // Tọa độ chân nhân vật dọc theo mặt dốc (y = 0 là mặt đất)
  // Luôn nằm bên trái khối đá (cách tâm đá 54px khi đẩy, thu gần lại 44px khi ngồi tựa lưng vào đá)
  const charBaseX = boulderX - 54 + sitT * 10;

  // Chu kỳ khói trà thật chậm: 240 frames (4.0 giây mới bay hết 1 làn khói)
  const steamCycle = ((state.frame - 360 + 2400) % 240) / 240;
  const birdDrift = state.beat3LingeringWalk * 95;

  const slopeLine = 'M -225 0 L 225 0';
  const slopeEvo = evolvePath(state.drawProgress, slopeLine);

  return (
    <svg viewBox="0 0 540 480" style={{ width: 600, height: 520, overflow: 'visible' }}>
      {/* LỚP 1: BẦU TRỜI KHÔNG XOAY (Mặt trời Đỏ Gạch & Đôi chim bay chậm ở Hồi II - III) */}
      <g opacity={state.beat2SettleGlow}>
        <circle
          cx={145}
          cy={135 - state.beat3LingeringWalk * 16}
          r={25}
          fill={palette.accent}
          opacity={0.88}
        />
        {/* Đôi chim bay lững lờ qua bầu trời trong 6.5 giây cuối */}
        <g
          style={{
            transform: `translate(${210 + birdDrift}px, ${118 - state.beat3LingeringWalk * 14}px)`,
            opacity: state.beat3LingeringWalk,
          }}
        >
          <path
            d="M 0 0 Q 7 -7 14 0 Q 21 -7 28 0"
            fill="none"
            stroke={palette.inkPrimary}
            strokeWidth={2.0}
            strokeLinecap="round"
          />
          <path
            d="M 22 -12 Q 27 -17 32 -12 Q 37 -17 42 -12"
            fill="none"
            stroke={palette.inkSecondary}
            strokeWidth={1.7}
            strokeLinecap="round"
          />
        </g>
      </g>

      {/* LỚP 2: HỆ TỌA ĐỘ MẶT DỐC (-15.5 độ) — Mặt đất là y = 0, KHÔNG BAO GIỜ LỆCH TỌA ĐỘ */}
      <g
        style={{
          transform: 'translate(275px, 295px) rotate(-15.5deg)',
          transformOrigin: '0px 0px',
        }}
      >
        {/* Mặt đường dốc (y = 0) */}
        <path
          d={slopeLine}
          fill="none"
          stroke={palette.inkPrimary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={slopeEvo.strokeDasharray}
          strokeDashoffset={slopeEvo.strokeDashoffset}
        />

        {/* Khối đá vuông (Đáy chạm khít y = 0, cạnh trái tại boulderX - 32, cạnh phải tại boulderX + 32) */}
        <rect
          x={boulderX - 32}
          y={-64}
          width={64}
          height={64}
          rx={7}
          fill={palette.background}
          stroke={palette.inkPrimary}
          strokeWidth={strokeWidth}
          opacity={state.drawProgress}
        />

        {/* Nhân vật Kẻ Lữ Hành Áo Choàng (Chân luôn chạm khít y = 0) */}
        <g
          style={{
            transform: `translate(${charBaseX}px, 0px)`,
            opacity: state.drawProgress,
          }}
        >
          {/* Đầu nhân vật: Khi đẩy (sitT=0) ở (8, -44); Khi ngồi tựa đá (sitT=1) hạ xuống ở (4, -30) */}
          <circle
            cx={8 - sitT * 4}
            cy={-44 + sitT * 14}
            r={7.5}
            fill={palette.inkPrimary}
          />

          {/* Thân Áo Choàng (Cloak Body) nối liền với đầu và chạm gần mặt đất */}
          <path
            d={
              sitT < 0.5
                ? 'M 4 -34 C -5 -24 -8 -14 -5 -8 L 11 -8 C 12 -16 10 -26 6 -34 Z'
                : 'M 2 -21 C -6 -15 -10 -7 -8 -1 L 10 -1 C 12 -6 9 -15 4 -21 Z'
            }
            fill={palette.inkPrimary}
          />

          {/* Hai chân bước chậm ở Hồi I -> Duỗi nghỉ trên mặt dốc (y = -1) ở Hồi II & III */}
          {sitT < 0.5 ? (
            <>
              <line
                x1={-1}
                y1={-8}
                x2={-5 + walkCycle * 4}
                y2={0}
                stroke={palette.inkPrimary}
                strokeWidth={2.6}
                strokeLinecap="round"
              />
              <line
                x1={5}
                y1={-8}
                x2={8 - walkCycle * 4}
                y2={0}
                stroke={palette.inkPrimary}
                strokeWidth={2.6}
                strokeLinecap="round"
              />
              {/* Cánh tay vươn ra chạm đúng cạnh trái của khối đá (x = 22) */}
              <line
                x1={8}
                y1={-26}
                x2={22}
                y2={-30}
                stroke={palette.inkPrimary}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            </>
          ) : (
            /* Khi ngồi: hai chân duỗi thư thái về bên trái trên mặt đất, tay nâng tách trà Đỏ Gạch */
            <>
              <line
                x1={-6}
                y1={-2}
                x2={-22}
                y2={-1}
                stroke={palette.inkPrimary}
                strokeWidth={2.8}
                strokeLinecap="round"
              />
              {/* Tách trà Đỏ Gạch cầm ngay trước ngực nhân vật */}
              <rect
                x={-16}
                y={-17}
                width={9}
                height={11}
                rx={2}
                fill={palette.accent}
                opacity={state.beat2SettleGlow}
              />
              {/* Làn khói trà ấm bay lên chậm rãi (chu kỳ 4 giây) */}
              <path
                d={`M -11 ${-20 - steamCycle * 34} Q ${-17} ${-28 - steamCycle * 34} -10 ${-38 - steamCycle * 34}`}
                fill="none"
                stroke={palette.accent}
                strokeWidth={2.0}
                strokeLinecap="round"
                opacity={state.beat2SettleGlow * (1 - steamCycle)}
              />
            </>
          )}
        </g>
      </g>
    </svg>
  );
};
```

## 3. Nâng Cấp Tạo Hình "Kẻ Lữ Hành Áo Choàng" & Nhịp Mưa Chậm Ở `OrbitDistanceArchetype.tsx` (`quote-002` "Ngược lối")

* Thay thế hoàn toàn hình vẽ "que diêm (`o + |`)" bằng nhân vật **Kẻ Lữ Hành Áo Choàng (`CloakedTraveler`)** có thân áo khoác hình thang mềm mại và **2 chân bước đi chậm rãi (`~1 bước/1.6s`)** chạm khít mặt đường `y = 350`.
* Giảm tốc độ mưa rơi từ `frame * 9` xuống **`frame * 2.3`** để hạt mưa rơi êm và có chiều sâu.
* Khi chạm `"rẽ ngang"`, người thứ hai không nhảy vọt lên dốc mà **bước từng bước chậm rãi dọc theo nhánh rẽ suốt 6.5 giây cuối (`beat3LingeringWalk`)**.

```tsx
import React from 'react';
import { evolvePath } from '@remotion/paths';
import { ArchetypeComponentProps } from './types';

// Component con vẽ Kẻ Lữ Hành Áo Choàng (Cloaked Traveler) có khớp bước chân
const CloakedTraveler: React.FC<{
  x: number;
  y: number;
  scale?: number;
  walkPhase: number;
  isWalking: boolean;
  color: string;
  opacity?: number;
}> = ({ x, y, scale = 1, walkPhase, isWalking, color, opacity = 1 }) => {
  const stride = isWalking ? Math.sin(walkPhase) * 4.5 : 0;
  return (
    <g
      style={{
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
        opacity,
      }}
    >
      {/* Đầu nhân vật */}
      <circle cx={0} cy={-38} r={7.2} fill={color} />
      {/* Thân áo choàng/áo mưa hình thang bo cong mềm mại */}
      <path
        d="M -3 -29 C -8 -20 -10 -11 -8 -7 L 8 -7 C 9 -11 7 -20 3 -29 Z"
        fill={color}
      />
      {/* Hai chân bước đi ngược pha chạm khít mặt đất y = 0 */}
      <line
        x1={-2.5}
        y1={-7}
        x2={-2.5 + stride}
        y2={0}
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <line
        x1={2.5}
        y1={-7}
        x2={2.5 - stride}
        y2={0}
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </g>
  );
};

export const OrbitDistanceArchetype: React.FC<ArchetypeComponentProps> = ({
  state,
  palette,
  strokeWidth,
}) => {
  const mainRoad = 'M 55 350 L 315 350';
  const branchRight = 'M 235 350 Q 335 346 485 270';
  const roadEvo = evolvePath(state.drawProgress, mainRoad);

  // Hồi I: Hai người bước chậm từ x = 105 đến ngã rẽ x = 215
  const walkX = 105 + state.act1Progress * 110;
  const isAct1Walking = state.beat1StopClear < 0.4;

  // Hồi II & III: Người thứ 2 bước chậm rãi dọc theo đường cong Bezier suốt 6.5 giây cuối (beat3LingeringWalk)
  const t = state.beat3LingeringWalk;
  // Nội suy Quadratic Bezier dọc theo nhánh rẽ từ (walkX + 26, 350) -> (345, 342) -> (475, 274)
  const startP2X = walkX + 26;
  const p2X = (1 - t) * (1 - t) * startP2X + 2 * (1 - t) * t * 345 + t * t * 475;
  const p2Y = (1 - t) * (1 - t) * 350 + 2 * (1 - t) * t * 342 + t * t * 274;
  const p2Scale = 1 - t * 0.25;

  // Mưa rơi chậm (frame * 2.3) và tan dần êm dịu trong 2.0 giây (beat1StopClear)
  const rainOpacity = state.drawProgress * Math.max(0, 1 - state.beat1StopClear);

  return (
    <svg viewBox="0 0 540 480" style={{ width: 600, height: 520, overflow: 'visible' }}>
      {/* 1. Lớp Mưa Rơi Chậm Ở Hồi I */}
      {rainOpacity > 0.02 && (
        <g opacity={rainOpacity * 0.5}>
          {Array.from({ length: 14 }).map((_, i) => {
            const cycle = ((state.frame * 2.3 + i * 37) % 240) / 240;
            const rx = 85 + ((i * 33) % 360) - cycle * 38;
            const ry = 75 + cycle * 245;
            return (
              <line
                key={i}
                x1={rx}
                y1={ry}
                x2={rx - 9}
                y2={ry + 22}
                stroke={palette.inkSecondary}
                strokeWidth={1.6}
                strokeLinecap="round"
              />
            );
          })}
        </g>
      )}

      {/* 2. Vầng Nắng Đẹp từ từ hiện lên trong 2.8 giây (beat2SettleGlow) */}
      {state.beat2SettleGlow > 0.02 && (
        <g opacity={state.beat2SettleGlow}>
          <circle
            cx={430}
            cy={125 - state.beat3LingeringWalk * 12}
            r={26}
            fill="none"
            stroke={palette.accent}
            strokeWidth={2.4}
          />
          <circle
            cx={430}
            cy={125 - state.beat3LingeringWalk * 12}
            r={13}
            fill={palette.accent}
            opacity={0.3}
          />
        </g>
      )}

      {/* 3. Con đường chính & Nhánh rẽ ngang */}
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
        strokeWidth={strokeWidth - 0.6}
        strokeLinecap="round"
        strokeDasharray="6 8"
        style={{ opacity: 0.3 + state.beat2SettleGlow * 0.6 }}
      />

      {/* 4. Nhân vật 1 (Người ở lại cầm chiếc ô Đỏ Gạch) */}
      <CloakedTraveler
        x={walkX}
        y={350}
        walkPhase={state.continuousPhase}
        isWalking={isAct1Walking}
        color={palette.inkPrimary}
        opacity={state.drawProgress}
      />

      {/* Chiếc Ô Đỏ Gạch (#D94E34): Hồi I giương cao che sang phải -> Hồi II từ từ hạ nghiêng xuống trong 2.8 giây */}
      <g
        style={{
          transform: `translate(${walkX + 11 - state.beat2SettleGlow * 5}px, ${292 + state.beat2SettleGlow * 22}px) rotate(${12 + state.beat2SettleGlow * 32}deg)`,
          opacity: state.drawProgress,
        }}
      >
        <path
          d="M -32 0 A 32 28 0 0 1 32 0 Z"
          fill={palette.accent}
          stroke={palette.accent}
          strokeWidth={1.8}
        />
        <line
          x1={0}
          y1={0}
          x2={0}
          y2={30}
          stroke={palette.inkPrimary}
          strokeWidth={2.0}
          strokeLinecap="round"
        />
      </g>

      {/* 5. Nhân vật 2 (Người đồng hành bước chậm rãi xa dần trên nhánh rẽ suốt 6.5 giây cuối) */}
      <CloakedTraveler
        x={p2X}
        y={p2Y}
        scale={p2Scale}
        walkPhase={state.continuousPhase + 1.2}
        isWalking={state.beat3LingeringWalk < 0.96}
        color={palette.inkPrimary}
        opacity={state.drawProgress * (1 - state.beat3LingeringWalk * 0.25)}
      />
    </svg>
  );
};
```

## 4. Áp Dụng Nhịp Chậm (`beat1StopClear`, `beat2SettleGlow`, `beat3LingeringWalk`) Cho 4 Archetypes Còn Lại

Trong 4 file `ChaosToOrderArchetype.tsx`, `LineRuptureHealArchetype.tsx`, `BalanceScaleArchetype.tsx`, và `GaugeTransitionArchetype.tsx`, cập nhật toàn bộ các biến chuyển động để sử dụng `state.beat2SettleGlow` (kéo dài `2.8s`) và `state.beat3LingeringWalk` (kéo dài `6.5s`) thay vì `spring()` nhanh, đảm bảo cả 6 kịch bản đều mang chung nhịp thở **Slow Cinema 15 giây**.