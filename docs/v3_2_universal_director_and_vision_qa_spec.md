# V3.2 Universal 4-Stage AI Director, Relative Human-Scale Anchoring & 3-Frame Vision QA Loop

> **Mục đích tài liệu (`V3_2_UNIVERSAL_DIRECTOR_AND_VISION_QA_SPEC.md`):** Tài liệu này hướng dẫn AI Coding Agent (Antigravity) nâng cấp tận gốc kiến trúc Đạo diễn AI tại `/Volumes/Data/Quotes` để hệ thống có thể **nhận bất kỳ câu thơ, câu văn nào thuộc mọi chủ đề** và tự động tạo ra cảnh phim ngắn 15 giây đúng màu **Trà Nguội (`@tranguoi.15s`)** mà không cần vá thủ công từng trường hợp.

## 1. Kiến Trúc 4 Tầng Tư Duy Đạo Diễn Tổng Quát (Universal Pipeline)

Thay vì nhảy thẳng từ `Câu chữ -> Đoán tọa độ SVG thô`, mọi cảnh mới do AI tạo ra bắt buộc đi qua **4 Tầng Chuyển Hóa**:

```text
[Input Quote Bất Kỳ]
   │
   ▼
[TẦNG 1: SUBTEXT & TONE EXTRACTOR]
   │  Trích xuất "Cái Chát" (Hồi I) <-> "Cái Ngọt / Cú Twist" (Hồi II) + Nhiệt độ giọng điệu (Trầm lắng vs. Hóm hỉnh tự trào)
   ▼
[TẦNG 2: TRA NGUOI WORLD TRANSLATOR (Phép Dịch Vũ Trụ)]
   │  Quy đổi mọi danh từ phức tạp đời thực (kho hàng, văn phòng, danh bạ, phố xá...)
   │  về Ngôn ngữ Ngụ ngôn Mở: [1 Đường Chân Trời + Hậu cảnh mờ (tùy chọn) + Kẻ Lữ Hành + 1 Đạo Cụ Đỏ]
   ▼
[TẦNG 3: RELATIVE HUMAN-SCALE ANCHORING (src/kit/RelativeStage.tsx)]
   │  Dựng code .tsx bằng đơn vị tương đối U = 46px (1 chiều cao người) và các khớp gắn trực tiếp
   │  (handSlot, backSlot, groundSlot, skySlot) -> Không bao giờ lệch tỷ lệ hay bay lơ lửng!
   ▼
[TẦNG 4: 3-FRAME MULTIMODAL VISION CRITIC (server/visualCriticService.ts)]
      Chụp nhanh 3 ảnh PNG tại Giây 2 (Hồi I), Giây 8 (Pivot) & Giây 13 (Hồi III) bằng renderStill()
      -> Gửi cho AI Vision chấm điểm bố cục/tỷ lệ/biến đổi -> Tự sửa code .tsx nếu điểm < 8/10!
```

## 2. Tầng 3: Hệ Quy Chiếu Tương Đối Theo Con Người (`src/kit/RelativeStage.tsx`)

Tạo mới file `src/kit/RelativeStage.tsx` cung cấp hằng số đơn vị **`U = 46` (`1 Human Unit = 46px`)** và Component `<AnchoredTraveler />` có sẵn khớp gắn đạo cụ trên lưng (`backSlot`) và trên tay (`handSlot`) tự động di chuyển, nghiêng người theo nhân vật:

```tsx
import React from 'react';
import { evolvePath } from '@remotion/paths';

/** 1 Đơn vị chiều cao chuẩn của Kẻ Lữ Hành (46px). Mọi vật thể đều nhân theo U! */
export const U = 46;

/**
 * Mặt đất mở không khung hộp (Open Horizon Ground).
 * Mọi phần tử con đặt bên trong đều lấy y = 0 làm mặt đất chuẩn!
 */
export const OpenGroundStage: React.FC<{
  groundY?: number;
  slopeDeg?: number;
  drawProgress: number;
  lineColor: string;
  strokeWidth?: number;
  children: React.ReactNode;
}> = ({
  groundY = 345,
  slopeDeg = 0,
  drawProgress,
  lineColor,
  strokeWidth = 3.0,
  children,
}) => {
  const groundLine = 'M -215 0 L 215 0';
  const evo = evolvePath(drawProgress, groundLine);

  return (
    <g
      style={{
        transform: `translate(270px, ${groundY}px) rotate(${slopeDeg}deg)`,
        transformOrigin: '0px 0px',
      }}
    >
      <path
        d={groundLine}
        fill="none"
        stroke={lineColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={evo.strokeDasharray}
        strokeDashoffset={evo.strokeDashoffset}
      />
      {children}
    </g>
  );
};

/**
 * Lớp Hậu cảnh mờ xa (Dùng khi câu chữ so sánh "Thiên hạ / Đám đông" với "Mình")
 */
export const DistantBackdropGroup: React.FC<{
  x?: number;
  offsetY?: number;
  opacity?: number;
  children: React.ReactNode;
}> = ({ x = -95, offsetY = -6, opacity = 0.28, children }) => (
  <g
    style={{
      transform: `translate(${x}px, ${offsetY}px) scale(0.68)`,
      opacity,
    }}
  >
    {children}
  </g>
);

/**
 * Nhân vật Kẻ Lữ Hành có sẵn khớp gắn Đạo cụ trên lưng (backSlot) và trên tay (handSlot).
 * Chân luôn chạm khít y = 0!
 */
export const AnchoredTraveler: React.FC<{
  x: number;
  facing?: 'left' | 'right';
  leanDeg?: number;        // Góc cúi gồng (+14) hoặc ngả người thư thái (-10)
  walkPhase?: number;
  strideAmount?: number;   // 0 = đứng yên, 1 = bước đi bình thường
  sitProgress?: number;    // 0 = đứng/đi, 1 = ngồi bệt thư thái trên mặt đất
  color: string;
  opacity?: number;
  backSlot?: React.ReactNode; // Gốc (0,0) nằm ngay giữa lưng nhân vật
  handSlot?: React.ReactNode; // Gốc (0,0) nằm ngay đầu bàn tay phía trước ngực
}> = ({
  x,
  facing = 'right',
  leanDeg = 0,
  walkPhase = 0,
  strideAmount = 0,
  sitProgress = 0,
  color,
  opacity = 1,
  backSlot,
  handSlot,
}) => {
  const dir = facing === 'right' ? 1 : -1;
  const stride = Math.sin(walkPhase) * 4.5 * strideAmount * (1 - sitProgress);
  const sitDrop = sitProgress * 13; // Hạ thấp thân người khi ngồi xuống

  return (
    <g
      style={{
        transform: `translate(${x}px, 0px) scaleX(${dir})`,
        opacity,
      }}
    >
      {/* Phần thân trên (Đầu + Áo choàng + Khớp Lưng + Khớp Tay) nghiêng theo leanDeg */}
      <g
        style={{
          transform: `translate(0px, ${sitDrop}px) rotate(${leanDeg}deg)`,
          transformOrigin: '0px -8px',
        }}
      >
        {/* Đầu nhân vật */}
        <circle cx={0} cy={-38} r={7.2} fill={color} />
        {/* Thân áo choàng */}
        <path
          d="M -3 -29 C -8 -20 -10 -11 -8 -7 L 8 -7 C 9 -11 7 -20 3 -29 Z"
          fill={color}
        />

        {/* Khớp gắn Gánh nặng / Ba lô trên lưng (backSlot) */}
        {backSlot && (
          <g style={{ transform: 'translate(-9px, -22px)' }}>{backSlot}</g>
        )}

        {/* Cánh tay đưa ra phía trước + Khớp gắn Đạo cụ trên tay (handSlot) */}
        {handSlot && (
          <g>
            <line
              x1={4}
              y1={-22}
              x2={14}
              y2={-20}
              stroke={color}
              strokeWidth={2.4}
              strokeLinecap="round"
            />
            <g style={{ transform: 'translate(16px, -21px)' }}>{handSlot}</g>
          </g>
        )}
      </g>

      {/* Hai chân: bước đi khi đứng hoặc duỗi ra phía trước khi ngồi */}
      {sitProgress < 0.5 ? (
        <>
          <line
            x1={-2.5}
            y1={-7 + sitDrop}
            x2={-2.5 + stride}
            y2={0}
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <line
            x1={2.5}
            y1={-7 + sitDrop}
            x2={2.5 - stride}
            y2={0}
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </>
      ) : (
        <line
          x1={4}
          y1={-2}
          x2={18}
          y2={-1}
          stroke={color}
          strokeWidth={2.7}
          strokeLinecap="round"
        />
      )}
    </g>
  );
};
```
*(Đồng thời giữ bổ sung `<WindBreeze />` và `<NotificationRings />` trong `src/kit/Atmosphere.tsx` từ bản V3.1).*

## 3. Tầng 1 & Tầng 2: Schema Tư Duy "Phép Dịch Vũ Trụ" (`server/sceneGeneratorService.ts`)

Cập nhật bước `ideate` để bắt buộc LLM xuất cấu trúc **Phân tích Nghịch lý + Phép Dịch Ngụ Ngôn** trước khi mô tả 3 Hồi:

```typescript
export const DirectorIdeationSchema = z.object({
  // Tầng 1: Trích xuất cấu trúc nghịch lý & giọng điệu
  subtext: z.object({
    bitterSetup: z.string().describe('Áp lực, ngộ nhận hoặc nỗi niềm ở nửa đầu bài'),
    sweetTwist: z.string().describe('Sự giải tỏa, cú lật nhận thức hoặc niềm vui bất ngờ tại pivotWord'),
    tone: z.enum(['WRY_LIGHTHEARTED', 'QUIET_POETIC', 'BITTERSWEET_IRONY']),
    timeAndWeatherCue: z.enum(['MORNING_BREEZE', 'RAIN_SHOWER', 'WARM_DUSK', 'STARRY_NIGHT', 'CLEAR_CALM']),
  }),
  // Tầng 2: Phép dịch sang Vũ trụ tối giản Trà Nguội (CẤM tả thực phòng ốc nội thất rườm rà)
  worldMetaphor: z.object({
    slopeDeg: z.number().min(-18).max(18).default(0),
    distantBackdropIdea: z.string().optional().describe('Chi tiết nhỏ mờ xa (scale 0.68, opacity 0.28) nếu bài có sự đối lập giữa Thiên hạ và Mình'),
    redAccentProp: z.string().describe('Duy nhất 1 đạo cụ màu Đỏ Gạch (#CE472E) đại diện cho linh hồn của cú twist (neo vào handSlot, backSlot hoặc bầu trời)'),
    act1Visual: z.string().describe('Hành động cụ thể của Kẻ Lữ Hành ở Hồi I (0s -> pivotFrame)'),
    act2AtPivotVisual: z.string().describe('Sự biến đổi tư thế & Đạo cụ Đỏ ngay tại pivotWord'),
    act3AfterimageVisual: z.string().describe('Dư âm chuyển động chậm trong 5.5s cuối khi camera lùi xa'),
  }),
  suggestedSceneId: z.string(),
});
```

**Quy tắc vàng trong Prompt `ideate` & `build-tsx`:**
1. **Phép Dịch Vũ Trụ (`Metaphor Reduction Law`):** Tuyệt đối KHÔNG vẽ phòng ốc nội thất, tường nhà, cửa sổ chia ô, bàn ghế tủ kệ cồng kềnh. Mọi khái niệm đời sống hiện đại đều phải dịch sang hành trình của `<AnchoredTraveler />` trên `<OpenGroundStage />`:
   * *Ví dụ "việc ngập kho / áp lực deadline"* $\rightarrow$ Gắn chồng 3 kiện hàng nhỏ (`width: 0.42 * U, height: 0.26 * U`) nghiêng ngả trên `backSlot` của nhân vật đang cúi lưng (`leanDeg: +16`) đi ngược làn gió `<WindBreeze />`.
   * *Ví dụ "lương về ting ting"* $\rightarrow$ Tại `pivotFrame`, chiếc điện thoại nhỏ màu `palette.accent` (`width: 0.16 * U, height: 0.24 * U`) trên `handSlot` phát ra `<NotificationRings />` (*"ting ting!"*), chồng kiện hàng trên lưng nhẹ bẫng bay bổng lên trời và tan biến (`translateY(-2.5 * U)` + giảm `opacity`), nhân vật ngẩng thẳng đầu (`leanDeg: -4`) bước đi thong dong ấm áp!
2. **Mọi kích thước hình vẽ bổ sung phải viết theo đơn vị `U` (`U = 46px`):** Ví dụ vật nhỏ trên tay `0.18 * U` đến `0.3 * U`; vật trung bình trên đất `0.5 * U` đến `0.9 * U`; cột đèn/cây cối `2.2 * U` đến `2.8 * U`.

## 4. Tầng 4: Vòng Lặp "Đạo Diễn Tự Duyệt Ảnh Nháp" (`server/visualCriticService.ts`)

Tạo mới `server/visualCriticService.ts` để AI **nhìn tận mắt bức tranh mình vừa code** trước khi trả kết quả về giao diện:

```typescript
import path from 'path';
import fs from 'fs';
import { bundle } from '@remotion/bundler';
import { selectComposition, renderStill } from '@remotion/renderer';
import { VideoInputProps } from '../src/schemas/videoSchema';
import { computeTimelineSync } from '../src/engine/timelineSync';

export interface VisualCritiqueResult {
  passed: boolean;
  score: number; // 1 -> 10
  issues: string[];
  fixInstruction: string;
}

export const VISUAL_CRITIC_SYSTEM_PROMPT = `
Bạn là Giám đốc Nghệ thuật Thị giác (Art Director) của kênh hoạt hình tối giản "Trà Nguội".
Bạn sẽ nhận được câu Quote gốc cùng 3 bức ảnh chụp thực tế từ video vừa render:
- Ảnh 1 (Giây 2.0 - Hồi I: Mở đầu)
- Ảnh 2 (Ngay sau điểm bẻ lái Pivot - Hồi II: Biến cố & Đạo cụ Đỏ)
- Ảnh 3 (Giây 13.5 - Hồi III: Dư âm cuối bài)

Hãy chấm điểm khắt khe trên thang 1-10 theo 4 tiêu chí sống còn:
1. TỶ LỆ & ĐỘ SẠCH TỐI GIẢN: Nhân vật và đạo cụ có đúng tỷ lệ tự nhiên không? Có bị vẽ khung hộp chữ nhật rối mắt, nét đè chồng chéo xấu xí, hay vật thể bay lơ lửng vô lý không?
2. SỰ BIẾN ĐỔI KỂ CHUYỆN RÕ RỆT: So sánh Ảnh 1 với Ảnh 2 & 3, tư thế của nhân vật và trạng thái đạo cụ có sự thay đổi rõ ràng để kể được cú bẻ lái không? (Nếu nhân vật đứng y hệt nhau ở cả 3 ảnh -> Chấm dưới 6 điểm!).
3. ĐÚNG SẮC THÁI & THỜI GIAN: Thời tiết/bầu trời có khớp câu chữ không (bài buổi sáng không được có trăng sao)? Đạo cụ màu Đỏ Gạch có nổi bật và đúng tinh thần (hóm hỉnh vs. trầm lắng) của câu chốt không?

Trả về JSON: { "passed": boolean (true nếu score >= 8), "score": number, "issues": string[], "fixInstruction": "Chỉ dẫn cụ thể về tọa độ/tỷ lệ/chuyển động để sửa file .tsx nếu score < 8" }
`.trim();
```

### Quy trình khép kín trong `sceneGeneratorService.ts` khi tạo Cảnh Độc Bản Mới:
1. Chạy `ideate` (Tầng 1 + Tầng 2) sinh kịch bản JSON theo `DirectorIdeationSchema`.
2. Chạy `build-tsx` (Tầng 3) dùng `OpenGroundStage`, `AnchoredTraveler`, `DistantBackdropGroup`, `U = 46` để sinh file `src/scenes/custom/<sceneId>.tsx` + kiểm tra `npx tsc --noEmit`.
3. Chạy `visualCriticService` (Tầng 4):
   * Chụp nhanh 3 ảnh PNG nháp (`scale: 0.5` tức `540×960` để chụp cực nhanh trong ~1.5–2 giây) tại `frame = 120`, `frame = pivotFrame + 55`, và `frame = durationInFrames - 75`.
   * Gửi 3 ảnh base64 cho Multimodal LLM (`gemini-2.5-flash` / `gpt-4o` / `claude-3-7-sonnet`) đánh giá.
   * Nếu `score < 8`, truyền `fixInstruction` ngược lại cho `build-tsx` tự động tinh chỉnh code `.tsx` 1 vòng và chụp kiểm tra lại!

## 5. Kịch Bản Kiểm Thử Thực Chiến Ngay Lập Tức

Sau khi cài đặt hoàn chỉnh 4 Tầng trên:
1. Xóa cảnh lỗi cũ của `CHÉN 04 — ẤM` và cho hệ thống **chạy tự động hoàn toàn từ đầu qua cả 4 Tầng** với đúng bài thơ:
   > *Sáng nay gió bấc đầu mùa / Thiên hạ tíu tít đón đưa hẹn hò. / Phần mình việc ngập cả kho, / Ấm lòng nhất lúc lương về ting ting.*
2. Thử thêm **1 câu mới hoàn toàn thuộc chủ đề khác (`CHÉN 05`)** để kiểm chứng tính tổng quát (ví dụ câu về mạng xã hội/cô đơn hoặc gia đình), xuất cả 2 video `.mp4` và ghi log lại điểm số mà `visualCriticService` đã chấm!
