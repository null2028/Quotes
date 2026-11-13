# V4.0 General System Architecture: Động Cơ Hoạt Hình Tự Hành 5 Lớp Prompt (`Autonomous 5-Layer Vector & Slow-Motion Engine`)

> **Mục đích tài liệu (`V4_0_GENERAL_5LAYER_ENGINE_SPEC.md`):** Tài liệu này hướng dẫn AI Coding Agent (Antigravity) nâng cấp kiến trúc cốt lõi tại `/Volumes/Data/Quotes` từ cách xử lý cục bộ từng bài (case-by-case) sang **Hệ Thống Tổng Quát Tự Hành 100% (Zero Handwritten Case Props)** — dựa trên đúc kết từ các nghiên cứu đồ họa máy tính hiện đại (*Chat2SVG*, *LogoMotion*, *Keyframer*, *Vector Prism*, *VAnim* và *Co-DSL*).
>
> **Nguyên tắc Tối thượng khi Triển khai V4.0:**
> **TUYỆT ĐỐI KHÔNG viết sẵn tay (hardcode) bất kỳ Đạo cụ hay Cảnh quay riêng lẻ nào cho câu thơ cụ thể!** Toàn bộ đạo cụ và cảnh phim của `Chén 04`, `Chén 05`, `Chén 06`... bắt buộc phải do **Pipeline 5 Lớp Prompt** tự động suy luận, tự vẽ tĩnh `100×100`, tự kiểm định mù bằng Vision LLM và tự dàn cảnh bằng các hàm động cơ chung.

## 1. Ba Ràng Buộc Kỹ Thuật Cấp Động Cơ (Khóa Bằng Toán Học Trong `src/kit/`)

Trước khi gọi bất kỳ Prompt nào, Engine phải khóa cứng 3 quy luật vật lý và không gian bằng code để LLM không thể vi phạm:

### 1.1. Thư viện Động Từ Chuyển Động Nhịp Chậm (`src/kit/SlowMotionVerbs.ts`)
Xóa bỏ hoàn toàn các hàm `spring` giật nhanh (`stiffness > 50`). Mọi chuyển động trên kênh **Trà Nguội** — kể cả các câu **lật kèo / bẻ lái tếu táo (`WRY_BATHOS`)** — đều diễn ra **khoan thai, tỉnh bơ, êm như mặt nước (`2.6s – 5.0s`)**. Cung cấp sẵn các hàm chuẩn trong `src/kit/SlowMotionVerbs.ts` để Lớp 4 gọi:

```typescript
import { interpolate, Easing } from 'remotion';
import { EvaluatedMotionState } from '../engine/motionPhysics';

/**
 * 1. Hóa không trọng lực bay bồng bềnh chậm rãi lên cao rồi tan mờ (4.5s)
 * Dùng cho mọi gánh nặng/áp lực được giải tỏa nhẹ tênh theo kiểu "Phi lý êm ái"
 */
export function levitateWeightless(progress: number, indexOffset: number = 0) {
  const delayed = Math.max(0, Math.min(1, (progress - indexOffset * 0.08) / (1 - indexOffset * 0.08)));
  const eased = Easing.inOut(Easing.sin)(delayed);
  return {
    translateY: -eased * (95 + indexOffset * 22),
    translateX: Math.sin(delayed * Math.PI * 1.5 + indexOffset * 1.7) * (14 + indexOffset * 4),
    rotateDeg: Math.sin(delayed * Math.PI + indexOffset) * 9,
    opacity: interpolate(delayed, [0, 0.65, 1], [1, 0.75, 0], { extrapolateRight: 'clamp' }),
  };
}

/**
 * 2. Hiện êm và nở nhẹ từ tốn (2.8s) cho Đạo cụ Trung tâm ở Hồi II
 */
export function slowEmergence(progress: number) {
  const eased = Easing.out(Easing.cubic)(Math.max(0, Math.min(1, progress)));
  return {
    opacity: eased,
    translateY: (1 - eased) * 14,
    scale: 0.92 + eased * 0.08,
  };
}

/**
 * 3. Lùi êm về góc ký ức (dùng khi vật ở Hồi I/II nhường tiêu điểm chính cho vật ở Hồi III)
 */
export function recedeToMemory(progress: number) {
  const eased = Easing.inOut(Easing.cubic)(Math.max(0, Math.min(1, progress)));
  return {
    opacity: 1 - eased * 0.65,
    scale: 1 - eased * 0.35,
    translateY: -eased * 24,
  };
}

/**
 * 4. Nhịp thở / đung đưa vi mô chu kỳ chậm (~4.5s) CHỈ dành cho nhóm detail-motion (khăn, lá, khói, cành)
 */
export function gentleSwayDeg(continuousPhase: number, maxDeg: number = 3.0, phaseOffset: number = 0): number {
  return Math.sin(continuousPhase * 0.65 + phaseOffset) * maxDeg;
}

/**
 * 5. Cuộn dọc tuần hoàn chậm rãi (0.32px/frame) cho danh sách, dòng chảy, tờ lịch
 */
export function slowScrollOffset(frame: number, totalSpanPx: number, speedPxPerFrame: number = 0.32): number {
  return (frame * speedPxPerFrame) % totalSpanPx;
}

/**
 * 6. ĐỊNH LUẬT KHÓA ĐỘNG HỌC BƯỚC CHÂN (Velocity-Coupled Locomotion):
 * Khi |toX - fromX| < 12px (nhân vật đứng yên 1 cụm), legStride BẮT BUỘC = 0 tuyệt đối!
 * Vĩnh viễn triệt tiêu lỗi "chân giật đi bộ tại chỗ" trên toàn hệ thống.
 */
export function computeCoupledWalk(
  fromX: number,
  toX: number,
  moveProgress: number,
  continuousPhase: number
) {
  const clamped = Math.max(0, Math.min(1, moveProgress));
  const eased = Easing.inOut(Easing.quad)(clamped);
  const currentX = fromX + (toX - fromX) * eased;
  const distance = Math.abs(toX - fromX);

  // Vận tốc tức thời bằng 0 ở đầu, cuối và khi quãng đường < 12px
  const velocityEnvelope = distance < 12 ? 0 : Math.sin(clamped * Math.PI) * Math.min(1, distance / 60);
  const legStride = velocityEnvelope * Math.sin(continuousPhase * 1.1) * 4.0;

  return { currentX, legStride, isMoving: velocityEnvelope > 0.05 };
}
```
*(Đồng thời trong `src/engine/motionPhysics.ts`: Xóa mọi `spring` nhanh của `WRY_BATHOS`; thay bằng `interpolate` dùng `Easing.inOut(Easing.cubic)` kéo dài `2.6s` cho `beat2SettleGlow` và `4.6s` cho cú lùi máy quay `MISDIRECTION_PULLBACK`).*

### 1.2. Sáu Khung Khe Bố Cục Tất Định Chống Chồng Lấn (`src/kit/StageContainers.tsx`)
Cung cấp 6 Container React tương ứng 6 Motif để AI chỉ đặt Đạo cụ vào đúng khe (không tự đoán tọa độ gây đè hình):
1. **`<SpotlightStage>` (`STEINBERG_OBJECT_SPOTLIGHT`):**
   * `ambientLayer`: Nền phụ toàn cảnh mờ nhẹ.
   * `act1CenterSlot`: Tâm `(270, 245)`, kích thước chuẩn `210px` (tự động mờ dần hoặc thu nhỏ theo `act1ExitProgress`).
   * `act2HeroSlot`: Tâm `(270, 255)`, kích thước chuẩn `235px` (nổi lên ở Hồi II & III).
   * `upperLeftMemorySlot`: Tâm `(132, 162)`, kích thước `110px` (khoảng cách tâm `> 165px` so với `act2HeroSlot`, đảm bảo toán học 0% đè nét!).
2. **`<YesButStage>` (`YES_BUT_DIPTYCH`):**
   * `leftContrastSlot`: Tâm `(140, 260)`, kích thước tối đa `165px` (mờ dịu từ `0.68 -> 0.34` ở Hồi III).
   * `rightStorySlot`: Tâm `(392, 260)`, kích thước tối đa `185px` (cách vế trái `252px` — không bao giờ chạm nhau!).
3. **`<PullbackRevealStage>` (`MISDIRECTION_PULLBACK`):**
   * Nhận `closeUpFocusX`, `closeUpFocusY`: Hồi I tự động zoom cận `scale = 1.68` vào vùng đánh lừa; từ `pivotFrame` tự động kéo lùi máy quay thật êm suốt `4.5 giây` về `scale = 0.88` lộ toàn cảnh `fullWorldSlot`.
4. **`<MetamorphosisStage>` (`FORCEVILLE_METAMORPHOSIS`):** Khung biến hình đồng tâm `(270, 250, size = 225px)` chuyển tiếp mượt trong `3.0s`.
5. **`<StillVignetteStage>` (`MCCLOUD_STILL_VIGNETTE`):** Khung tĩnh vật/góc phố `(270, 260, size = 210px)` + khe thời tiết/lá rơi.
6. **`<HorizonParableStage>` (`DE_WIT_HORIZON_PARABLE`):** Mặt dốc/ngã rẽ + nhân vật dùng `computeCoupledWalk` + khe vật cản lớn `>= 80px`.

## 2. Kiến Trúc Pipeline 5 Lớp Prompt Tự Hành (`server/pipeline/`)

Tạo thư mục `server/pipeline/` chia quá trình đạo diễn bất kỳ câu Quote mới nào thành **5 bước tách biệt, tự kiểm chứng**:

```text
server/pipeline/
├── layer1SignifierPlanner.ts      # Giải mã Cú lật + Chọn Motif + Liệt kê 3-4 Dấu hiệu Nhận diện cho từng Đạo cụ
├── layer2PropSynthesizer.ts       # Rèn Đạo cụ Tĩnh độc lập trong lưới 100×100 (chia 3 nhóm: body-static, detail-motion, accent-soul)
├── layer3PropVisionGate.ts        # Chụp ảnh 300×300 của riêng Đạo cụ -> Hỏi Mù VLM "Đây là cái gì?" -> Đạt mới lưu vào Prop Vault
├── layer4ChoreographyComposer.ts  # Lắp các Đạo cụ đã duyệt vào StageContainers + Gắn hàm từ SlowMotionVerbs.ts
├── layer5BlindSceneQA.ts          # Đoán Mù 2 Lượt Độc Lập trên 3 ảnh Hồi I - II - III đã cắt chữ -> Đối chiếu nghĩa với bài thơ
└── runAutonomousDirector.ts       # Orchestrator điều phối khép kín từ Lớp 1 -> Lớp 5
```

### Chi Tiết Thiết Kế Từng Lớp Prompt Hệ Thống:

#### Lớp 1: `layer1SignifierPlanner.ts` (Chống Trừu Tượng Mù Mờ)
* **Nhiệm vụ:** Đọc câu Quote $\rightarrow$ Phân tích cặp đối lập *"Cái Chát (Hồi I)"* $\leftrightarrow$ *"Cái Ngọt / Cú Lật Tỉnh Bơ (Hồi II)"* $\rightarrow$ Chọn 1 trong 6 `stageMotif` $\rightarrow$ Xác định danh sách 1–3 `PropSpec` cần dùng.
* **Ràng buộc Schema bắt buộc trên mỗi `PropSpec`:**
  * `propId`: Mã định danh tái sử dụng (ví dụ: `prop_mobile_contact_list`, `prop_park_bench_couple`, `prop_tearing_calendar`...).
  * `expectedBlindLabel`: Tên đồ vật cụ thể mà một người lạ nhìn hình không đọc chữ **phải gọi tên được** (ví dụ: *"điện thoại hiển thị danh sách liên hệ"*, *"hai người ngồi cạnh nhau trên ghế dài"*).
  * `iconicSignifiers`: Mảng **3–4 thành phần hình học đặc trưng bắt buộc phải vẽ** để tạo Affordance nhận diện tức thì (cấm dùng chấm tròn/ô vuông chung chung!).
  * `unhurriedTwistRole`: Vai trò của đạo cụ trong cú chuyển biến chậm rãi (ví dụ: *cuộn chậm vô hồn rồi mờ đi*, *trôi bồng bềnh không trọng lực lên cao*, *tỏa khói ấm chữ S*...).

#### Lớp 2: `layer2PropSynthesizer.ts` (Xưởng Rèn Đạo Cụ Tĩnh Phân Tầng `100 × 100`)
* Kiểm tra `data/prop-vault.json`: Nếu `propId` đã tồn tại và đã đạt chuẩn Gate ở lần trước $\rightarrow$ Tái sử dụng ngay!
* Nếu chưa có $\rightarrow$ Gọi LLM với **Structured Local-Grid SVG Prompt**:
  * **Chỉ làm 1 việc duy nhất:** Viết 1 file React Component độc lập `src/kit/props/generated/<PropComponentName>.tsx` trong khung `viewBox="0 0 100 100"`.
  * **Bắt buộc xuất khối comment Quy hoạch Tọa độ Bộ phận** ở đầu hàm trước khi viết JSX (ví dụ: `// Part 1 [body-static]: Outer rounded frame x=22..78, y=8..92; // Part 2 [detail-motion]: 4 horizontal rows...; // Part 3 [accent-soul]: ...`).
  * **Bắt buộc phân tầng ngữ nghĩa (*Vector Prism Stratification*):** Chia các nét vẽ vào đúng 3 thẻ `<g>`:
    1. `<g data-part="body-static">`: Khung thân chính tĩnh vững chãi (ví dụ: ghế băng, thân bát, viền khung điện thoại, thân người ngồi yên — **tuyệt đối không gắn hàm lắc hay vung chân tại chỗ!**).
    2. `<g data-part="detail-motion">`: Chi tiết động vi mô nhận `motionPhase` hoặc `scrollOffset` (ví dụ: các hàng danh bạ cuộn chậm bên trong `clipPath`, đuôi khăn rủ mềm đung đưa `±3°`, tập giấy trên cùng).
    3. `<g data-part="accent-soul">`: Linh hồn điểm nhấn nhận `accentProgress` (`0 -> 1`) và tô màu `palette.accent` (hoặc chấm online xanh dịu `#4E9F76` khi biểu diễn trạng thái online).
  * Chạy kiểm tra biên dịch `npx tsc --noEmit`.

#### Lớp 3: `layer3PropVisionGate.ts` (Cổng Kiểm Định Nhận Diện Đạo Cụ Độc Lập)
* Dùng `renderStill()` (hoặc composition phụ `PropPreviewComposition` kích thước `320 × 320`) chụp **1 bức ảnh PNG tĩnh duy nhất của riêng Đạo cụ vừa rèn**!
* **Gọi VLM Đoán Mù 100% (Không truyền `expectedBlindLabel`, không truyền bài thơ!):**
  > *"Nhìn bức hình vẽ nét đơn tối giản này, bạn nhận ra đây là đồ vật hoặc hình ảnh gì? Có nét vẽ nào bị méo, lộn xộn, đè chồng xấu xí hay khó nhận ra không? Trả về JSON: `{ guessedObject: string, visualClarityScore: number, defectNotes: string }`."*
* Đem `guessedObject` so khớp ngữ nghĩa với `expectedBlindLabel`:
  * Nếu VLM nhìn ra đúng đồ vật và `visualClarityScore >= 8.0` $\rightarrow$ Đóng dấu `verified: true` lưu vĩnh viễn vào `data/prop-vault.json`!
  * Nếu VLM đoán sai (ví dụ vẽ danh bạ mà VLM lại bảo *"các ngôi sao trên trời"*, hoặc vẽ khăn quàng mà VLM lại bảo *"cánh tay chĩa ngang"*) $\rightarrow$ Gửi ảnh + `defectNotes` quay lại Lớp 2 sửa ngay đạo cụ `100 × 100` đó (tối đa 2 vòng)!

#### Lớp 4: `layer4ChoreographyComposer.ts` (Dàn Cảnh Khe Tất Định & Nhịp Chậm)
* Nhận danh sách các `PropComponent` đã vượt qua Cổng Kiểm Định Lớp 3 + `stageMotif` từ Lớp 1.
* Sinh file cảnh `src/scenes/custom/<SceneName>.tsx` đặt các Đạo cụ vào đúng các Slot của `src/kit/StageContainers.tsx` và **chỉ điều khiển chuyển động thông qua các hàm chuẩn của `src/kit/SlowMotionVerbs.ts`** (`levitateWeightless`, `slowEmergence`, `recedeToMemory`, `gentleSwayDeg`, `slowScrollOffset`, `computeCoupledWalk`).
* Kiểm tra tĩnh (`staticChoreographyGuard`): Từ chối ngay nếu phát hiện gọi `spring(` trực tiếp hoặc nhân hệ số tốc độ cao `frame * [5..9]`.

#### Lớp 5: `layer5BlindSceneQA.ts` (Nghiệm Thu Cốt Truyện Đoán Mù 2 Lượt Tách Biệt)
* Chụp 3 ảnh sân khấu đã crop sạch chữ (`act1-mute.png`, `act2-mute.png`, `act3-mute.png`).
* **API Call 1 – Người Xem Mù Chữ 100% (`BLIND_SCENE_VIEWER`):**
  * **Input:** CHỈ gửi 3 ảnh PNG. **Tuyệt đối không gửi bài thơ, tiêu đề hay bất kỳ gợi ý văn bản nào!**
  * **Output:** `{ frame1Seen: string, frame2Seen: string, frame3Seen: string, storyGuessedByViewer: string }`.
* **API Call 2 – Giám Đốc Nghệ Thuật Đối Chiếu (`SCENE_ALIGNMENT_JUDGE`):**
  * **Input:** Kết quả `storyGuessedByViewer` của Call 1 + Bài thơ gốc + 3 ảnh PNG.
  * **Tiêu chí duyệt (`passed = true` khi `score >= 8.0`):** Người xem mù ở Call 1 phải nhận diện đúng các hình ảnh biểu tượng chủ đạo của Hồi I và sự chuyển hóa sang Hồi II–III khớp với tinh thần bài thơ, bố cục thoáng sạch không chồng lấn! Nếu chưa đạt, trả `fixInstruction` chính xác là lỗi ở Đạo cụ (quay về Lớp 2) hay lỗi ở Dàn cảnh (quay về Lớp 4).

## 3. Tích Hợp Vào Web UI & Bài Thi Sát Hạch Tự Hành 100% (Generalization Benchmark)

1. **Nối `runAutonomousDirector.ts` trực tiếp vào nút "✨ AI Đạo Diễn Cảnh Độc Bản Mới" trên `Trà Nguội Studio` (`server/index.ts` & `studio-ui/`):** Để từ nay trên Web UI, mỗi khi người dùng thêm bất kỳ câu thơ/văn mới nào và bấm nút tạo cảnh, cả 5 Lớp tự động chạy ngầm và báo trạng thái từng lớp lên màn hình (`Lớp 1: Giải mã dấu hiệu -> Lớp 2 & 3: Rèn & Kiểm định đạo cụ -> Lớp 4: Dàn cảnh nhịp chậm -> Lớp 5: Nghiệm thu đoán mù`).
2. **Xóa sạch các đạo cụ hardcode cũ của riêng Chén 04 & 05**, sau đó chạy **Bài Thi Sát Hạch Tự Hành 100% (Không can thiệp sửa tay file cảnh!)** trên **3 bài thuộc 3 kiểu hoàn toàn khác nhau**:
   * **Bài Test 1 (`CHÉN 04 — ẤM`):** Thơ công sở tự trào (*Gió bấc – Thiên hạ hẹn hò – Việc ngập kho – Lương về ting ting*).
   * **Bài Test 2 (`CHÉN 05 — ĐỦ ẤM`):** Thơ đêm khuya (*Danh bạ nghìn người xanh chấm sáng – Đêm sâu – Dòng tin xóm nhỏ: Ăn cơm chưa đó, ngủ đi con*).
   * **Bài Test 3 (`CHÉN 06` – Đề Mới Hoàn Toàn Chưa Từng Xuất Hiện):** Dùng `quoteWriterService` tự sáng tác 1 bài thơ/quote mới có cú **lật kèo tếu nhẹ mà sâu sắc** (ví dụ chủ đề *cuối tuần / tờ lịch / gồng làm người lớn / hoặc chuyện ăn uống giảm cân*) rồi cho chạy thẳng qua Pipeline 5 Lớp từ đầu đến cuối không chạm tay!
3. Kết xuất cả 3 video `quote-004.mp4`, `quote-005.mp4`, `quote-006.mp4` và in kèm nguyên văn log **Người Xem Mù Chữ (`Call 1`)** đã nhìn thấy gì trên từng video để chứng minh tính tổng quát thực sự của công cụ!
