# PHẦN 1: QUY LUẬT SÂN KHẤU ĐANG CHẠY (STAGE RULES & ENGINE CONSTRAINTS)

> **Quy ước gắn nhãn bằng chứng trong tài liệu này:**
> - **`[Đã xác minh trong code]`**: Quy tắc đang thực sự chạy trong mã nguồn TypeScript/Remotion kèm tên tệp và số dòng.
> - **`[Có trong tài liệu nhưng chưa xác minh trong code]`**: Quy tắc được viết trong `GEMINI_GEM_SYSTEM_PROMPT`, `SKILL.md`, hoặc `CONTEXT.md` nhưng **không có code thực thi/kiểm tra** (hoặc bị Zod strip bỏ).
> - **`[Đề xuất mới]`**: Đề xuất kiến trúc JSON gọn và bộ ràng buộc tự động mới để chống lỗi vị trí, chồng lấn, điểm neo và timing.

---

## 1.1. Hệ tọa độ, Canvas & `STAGE_VIEWBOX`

### A. Khung Canvas Video Dọc (`1080×1920` @ `60fps`) — `[Đã xác minh trong code]`
- **Nguồn**: `src/theme/palettes.ts` (dòng 89–105) & `src/engine/visualDnaResolver.ts` (dòng 146–248).
- **Lưới Swiss Grid cố định**:
  - `width = 1080`, `height = 1920`, `fps = 60`.
  - **Header (`CHÉN XX · TIÊU ĐỀ` — `TRÀ NGUỘI`)**: `headerLeft = 132`, `headerTop = 268`, `headerWidth = 816` (`X = 132..948`), `headerHeight = 52`.
  - **Quote Rail (Thanh dọc đỏ Chu Sa bên trái chữ)**: Vẽ từ dòng đầu đến dòng cuối, cách lề trái chữ `22px`, độ dày `3px`, màu `palette.accent` (`#CE472E` / `#D95338` / `#E05A3F`).

### B. Hệ tọa độ SVG Sân khấu (`STAGE_VIEWBOX`) — `[Đã xác minh trong code]`
- **Nguồn**: `src/stage/terrainSystem.ts` (dòng 12–26).
- **Hằng số thực tế đang chạy**:
  ```ts
  export const STAGE_VIEWBOX = '62 126 416 250';
  export const DEFAULT_GROUND_Y = 352;
  ```
- **Giải nghĩa toán học**:
  - Trục ngang `X`: từ **`62`** đến **`478`** (bề rộng `416px`), tâm sân khấu tại **`X = 270`**.
  - Trục dọc `Y`: từ **`126`** (đỉnh bầu trời) đến **`376`** (đáy khung), chiều cao `250px`.
  - Mặt đất mặc định (`DEFAULT_GROUND_Y`): **`Y = 352`** (cách đáy viewBox `24px`, chừa khoảng không phía trên mặt đất `352 - 126 = 226px`).
  - Khi `visualDNA.horizonOffsetPx` khác `0` (phạm vi schema cho phép `-28..+28`), mặt đất dịch chuyển thành `groundY = 352 + horizonOffsetPx` (`src/stage/DeclarativeStagePlayer.tsx` dòng 521).
- **Bảng từ khóa vị trí ngang `X_KEYWORD_MAP`** (`src/stage/terrainSystem.ts` dòng 15–23) — `[Đã xác minh trong code]`:

| Từ khóa (`XPosition`) | Tọa độ `X` (px) | Khoảng cách tới tâm (`270`) | Khoảng cách tới mép `STAGE_VIEWBOX` |
| :--- | :---: | :---: | :---: |
| `"far_left"` | **`115`** | `-155px` | Cách mép trái (`62`) `53px` |
| `"left"` | **`175`** | `-95px` | Cách mép trái (`62`) `113px` |
| `"center_left"` | **`225`** | `-45px` | `-45px` |
| `"center"` | **`270`** | `0px` | Chính giữa sân khấu |
| `"center_right"` | **`315`** | `+45px` | `+45px` |
| `"right"` | **`365`** | `+95px` | Cách mép phải (`478`) `113px` |
| `"far_right"` | **`425`** | `+155px` | Cách mép phải (`478`) `53px` |

---

## 1.2. Vùng an toàn & 4 Biến thể Bố cục (`LayoutVariant`)

### A. Kích thước khung Stage trên Canvas `1080×1920` — `[Đã xác minh trong code]`
- **Nguồn**: `src/engine/visualDnaResolver.ts` (`resolveLayoutGeometry`, dòng 146–248).

| `layoutVariant` | Tọa độ Stage `(Left, Top, Width × Height)` | Khung Chữ `(Left, Top..Bottom, MaxW)` | `frameMode` & Vùng cắt thực tế |
| :--- | :--- | :--- | :--- |
| **`CLASSIC_TOP_STAGE`** | `(132, 342, 816 × 490)` | `(132, 862..1538, 678px)` | `OPEN` — Hiển thị toàn bộ `X = 62..478`. |
| **`SKY_QUOTE_BOTTOM_STAGE`** | `(132, 1032, 816 × 496)` | `(132, 348..1008, 678px)` | `OPEN` — Chữ ở trên, sân khấu ở dưới. |
| **`WINDOW_FRAME`** | `(186, 356, 620 × 454)` | `(132, 846..1538, 678px)` | `WINDOW_ARCH` — Vòm cửa sổ vẽ tại `X = 122..418`, đỉnh vòm `Y = 132`, chân vòm `Y = 362` (`DeclarativeStagePlayer.tsx:582`). **Cảnh báo**: Mọi vật thể đặt ngoài `X = 130..410` sẽ lọt ra ngoài vòm cửa! |
| **`ASYMMETRIC_THIRD`** | `(132, 358, 388 × 332)` | `(168, 718..1538, 642px)` | `CIRCLE_MEDALLION` — Cửa sổ tròn `cx = 270, cy = 268, r = 114` (`X = 156..384, Y = 154..382`). |

### B. Luật tự động hạ cấp `ASYMMETRIC_THIRD` (`canUseAsymmetricThird`) — `[Đã xác minh trong code]`
- **Nguồn**: `src/engine/visualDnaResolver.ts` (dòng 106–144).
- Engine chỉ cho phép giữ `ASYMMETRIC_THIRD` khi đồng thời thỏa mãn:
  1. Tổng số âm tiết câu quote `syllableCount <= 28`.
  2. `shotMode === 'MACRO_PROP'` **HOẶC** `actorCount <= 1` **HOẶC** khoảng cách ngang giữa các nhân vật `actorSpanX <= 56px`.
- Nếu vi phạm, engine tự động chuyển `layout` về **`WINDOW_FRAME`**.

### C. Vùng an toàn ngang (`Safe X Zone`) — Đối chiếu Code vs Tài liệu
- **`[Đã xác minh trong code]`**: Hàm `auditStageVisualLayout` (`src/automation/geminiBundleBridge.ts` dòng 556–564) chỉ phát cảnh báo `EDGE_SAFETY` khi nhân vật chính có `minX < 92` hoặc `maxX > 448`.
- **`[Có trong tài liệu nhưng chưa xác minh trong code]`**: `GEMINI_GEM_SYSTEM_PROMPT` (`geminiBundleBridge.ts` dòng 839) khuyên đặt nhân vật/đạo cụ trong `X = 110..430` (hoặc `165..375` cho cảnh nội thất), nhưng engine không hề chặn hay clamp nếu JSON truyền `x: 95` hoặc `x: 445`.

---

## 1.3. Quy tắc đặt Nhân vật, Đạo cụ, Điểm neo (`Anchor`), Mặt đất (`Terrain`) & Thứ tự Lớp (`Z-Order`)

### A. 8 Địa hình Mặt đất (`TerrainType`) — `[Đã xác minh trong code]`
- **Nguồn**: `src/stage/terrainSystem.ts` (`getTerrainPoint`, dòng 28–124).
- Mọi nhân vật và đạo cụ thuộc lớp `far`, `mid`, `fore` (khi không gắn `follow`) đều lấy tọa độ `Y` mặt đất từ `getTerrainPoint(x, terrain, groundY)`:
  - `flat`: Mặt phẳng ngang cố định tại `y = groundY` (`352`).
  - `gentle_hill`: Đồi thoải nâng lên ở giữa (`y = groundY - sin(t * π) * 18`).
  - `LONELY_SLOPE` (`slope_up`): Dốc đi lên từ trái sang phải (`y = groundY + 18 - t * 38`).
  - `slope_down`: Dốc đi xuống từ trái sang phải (`y = groundY - 18 + t * 38`).
  - `cliff_edge`: Vách đá phẳng từ trái đến `x = 340` (`y = groundY - 15`), sau `x = 340` sụt sâu xuống `+60px`.
  - `river_bank`: Bờ đất từ trái đến `x = 260`, sau đó thoải xuống lòng sông ở `x > 260`.
  - `roof_ridge`: Mái nhà chữ A đỉnh nhọn tại `x = 270` (`y = groundY - 28`).
  - `split_bridge`: Hai nhịp cầu đứt nhịp ở giữa (`x = 240..300` sụt xuống `+35px`).

### B. Quy tắc quy đổi tọa độ `Y` của Đạo cụ theo `layer` & `follow` — `[Đã xác minh trong code]`
- **Nguồn**: `src/stage/trackCompiler.ts` (dòng 688–738 & 1060–1085).
- **Trường hợp 1 — Đạo cụ thuộc `layer: "sky"` (không có `follow`)**:
  - `worldPos = { x: pose.x, y: pose.y }`.
  - **Lưu ý cực kỳ quan trọng**: Ở lớp `"sky"`, `pose.y` là **tọa độ Y tuyệt đối trên SVG** (`126..352`), **KHÔNG cộng với `terrain.y`**. Nếu đặt `y: -26` trên lớp `"sky"`, đạo cụ sẽ bay vọt lên `Y = -26` (nằm ngoài đỉnh `STAGE_VIEWBOX` `126` tới `152px` và biến mất hoàn toàn!).
- **Trường hợp 2 — Đạo cụ thuộc `layer: "far" | "mid" | "fore"` (không có `follow`)**:
  - `worldPos = { x: pose.x, y: terrainPt.y + pose.y }`.
  - Do đó: **`y: 0`** là chạm đúng mặt đất tại hoành độ `pose.x`; **`y < 0`** là nhấc lên cao khỏi mặt đất (ví dụ mặt bàn cao `26px` thì đạo cụ đặt trên mặt bàn phải có **`y: -26`**).
- **Trường hợp 3 — Đạo cụ gắn vào Nhân vật qua `follow: "<actorId>:<socket>"`**:
  - Tọa độ `worldPos` được tính bằng vị trí Socket của nhân vật cộng với `(pose.x, pose.y)`:

| Socket (`follow`) | Công thức `socket.x` (`trackCompiler.ts:700-725`) | Công thức `socket.y` (`s = actor.scale`, `sitDrop = sitting ? 14*s : 0`) | Ứng dụng chuẩn |
| :--- | :--- | :--- | :--- |
| **`hand`** | `actor.x + dir * reachExtra * s + leanShiftX * 0.65` (`reachExtra` = `18` khi `give/reach_out`, `14` khi `hold_up`, `19` khi `push`, mặc định `12`) | `actor.y + handBaseY * s + sitDrop * 0.8` (`handBaseY` = `-41` khi `hold_up`, `-25` khi `give`, mặc định `-28`) | Cầm ô, cầm thư, nâng chén trà, đưa hoa |
| **`head`** | `actor.x + leanShiftX * 0.85` | `actor.y - 49 * s + sitDrop` | Khăn voan cô dâu (`bridal_veil`), bong bóng suy nghĩ |
| **`back`** | `actor.x - dir * 9.5 * s + leanShiftX * 0.4` | `actor.y - 26 * s + sitDrop * 0.7` | Đeo đàn, gùi, hành lý sau lưng |
| **`ground_front`** | `actor.x + dir * 24 * s` | `getTerrainPoint(gx).y` | Đặt vật xuống đất ngay trước mũi chân nhân vật |

### C. Kích thước Nhân trắc học của Nhân vật `CloakedTraveler` — `[Đã xác minh trong code]`
- **Nguồn**: `src/kit/CloakedTraveler.tsx` (dòng 159–325).
- Ở `scale = 1.0`, gốc `(0, 0)` tại điểm tiếp đất giữa hai bàn chân:
  - **Đứng (`standing`)**: Chiều cao toàn thân **`60px`** (`y = 0` đến đỉnh đầu `y = -54.6`, tâm đầu tại `y = -48`, bán kính đầu `r = 6.6`, vai tại `y = -40.5`, hông tại `y = -25.5`, gấu áo choàng tại `y = -11.5`, chiều rộng tà áo khoảng `24px` từ `x = -12..+12`).
  - **Ngồi (`sit` / `sitting: true`)**: Hông hạ xuống **`y = -19.5`**, đầu gối gập vuông góc vươn ra phía trước tại **`x = dir * 11.8, y = -13.5`**, bàn chân chạm đất tại **`x = dir * 13.5, y = 0`**, tâm đầu hạ xuống sekitar **`y = -42`**.
  - **Hệ quả bắt buộc khi đặt Ghế & Bàn**:
    - Mặt ghế (`std_chair`, `office_stool`) phải cao khoảng **`y = -14` đến `-18`**, đặt trùng hoành độ `x` của nhân vật ngồi (hoặc lệch sau lưng `2..4px`), ở lớp `mid` (để vẽ **sau lưng** nhân vật).
    - Mặt bàn trà (`std_tea_table`, cao `26px`, rộng `48px` từ `-24..+24`) hoặc bàn làm việc (`std_work_desk` cao `32px`, rộng `76px` từ `-38..+38`; `small_work_desk` cao `26px`, rộng `44px` từ `-22..+22`) phải đặt cách nhân vật ngồi tối thiểu **`32px..38px`** theo hướng mặt nhân vật để đầu gối (`+11.8px`) và bàn chân (`+13.5px`) không đâm xuyên chân bàn, nhưng tay nhân vật (`+12..18px`) vẫn vươn tới mép bàn!

### D. Thứ tự Lớp (`Layer Z-Order`) & Phát hiện Lỗi Đảo Lớp ở `fore` — `[Đã xác minh trong code]`
- **Nguồn**: `src/stage/DeclarativeStagePlayer.tsx` (dòng 601–654).
- Thứ tự vẽ SVG từ dưới lên trên (vẽ sau sẽ đè lên vẽ trước):
  1. `renderPropsByLayer('sky')` (`parallax = 0.25`)
  2. `atmosphere.map(...)` (`parallax = 0.25`)
  3. `renderPropsByLayer('far')` -> **`renderActorsByLayer('far')`** (`parallax = 0.55`)
  4. `spotlight` circle (nếu `SPOTLIGHT_DIM`)
  5. `TerrainRenderer` (mặt đất, `parallax = 1.0`)
  6. `renderPropsByLayer('mid')` -> **`renderActorsByLayer('mid')`** (`parallax = 1.0`)
  7. **`renderActorsByLayer('fore')` -> `renderPropsByLayer('fore')`** (`parallax = 1.25`)
- **Phát hiện quan trọng từ code (`DeclarativeStagePlayer.tsx` dòng 634–649)**:
  - Ở lớp **`far`** và **`mid`**: Đạo cụ (`Props`) được vẽ **TRƯỚC** (nằm sau lưng) Nhân vật (`Actors`).
  - Ở lớp **`fore`**: Nhân vật (`Actors`) được vẽ **TRƯỚC**, còn Đạo cụ (`Props`) được vẽ **SAU CÙNG** (đè trực tiếp lên người nhân vật!).
  - **Hệ quả thực tế**: Trong Chén 16 (`SCRIPT_DE_SANG_MAI`), nhân vật `hero` được đặt ở `layer: "fore"` hoặc `mid`, còn chiếc ví `locked_wallet_note` trên mặt bàn đặt ở `layer: "fore"`. Khi `hero` bước ngang qua bàn (`x: 158 -> 276`), chiếc ví ở `layer: "fore"` vẽ đè thẳng lên giữa ngực áo choàng đen của `hero`!

---

## 1.4. Cách khai báo Thời điểm (`CueTime`) theo Line, Pivot & Giây

### A. Công thức tính Thời điểm Xuất hiện từng Dòng chữ & Pivot — `[Đã xác minh trong code]`
- **Nguồn**: `src/engine/timelineSync.ts` (dòng 104–215).
- **Thời lượng video động (`computeDynamicDurationFrames`)**:
  - Đếm tổng số âm tiết tiếng Việt (`auditVietnameseSyllables`).
  - `readingWindowSec = max(3.6, syllableCount / 3.0)` (tốc độ đọc chuẩn 3 âm tiết/giây).
  - Cộng `introLeadIn (0.45s)` + `pivotBreath (0.9s)` + `holdAfterFinishSeconds (mặc định 5.5s)` + `outroDissolve (1.35s)`, kẹp trong khoảng **`13.0s .. 16.0s`** (`780 .. 960 frames` @ 60fps).
- **Thời điểm xuất hiện từng dòng (`lineTimings`)**:
  - `STAGE_LEAD_IN_SECONDS = 0.35s` (`frame 21`).
  - Khoảng trải dòng `effectiveRevealWindowSec = min(max(3.6, min(5.85, durationSec * 0.39)), (activeLineCount - 1) * 2.25)`.
  - Dòng thứ `i` (`0-indexed`, ứng với `"line_1"`, `"line_2"`, ...) bắt đầu tại:
    $$	ext{startSec}(i) = 0.35 + i 	imes rac{	ext{effectiveRevealWindowSec}}{\max(1, N - 1)}$$
  - Mỗi dòng fade-in trong `1.05s` (`63 frames`).
- **Thời điểm `pivotFrame` (`"pivot"`)**:
  - Nếu `pivotWord` nằm ở dòng 1 (`index = 0`): `pivotFrame = round(durationInFrames * 0.44)` (khoảng `6.6s` trên video `15s`).
  - Nếu `pivotWord` nằm ở dòng `k >= 1` (thường là dòng cuối): **`pivotSec = startSec(k) + 0.38s`** (`+23 frames` sau khi dòng chứa từ khóa bắt đầu hiện).

### B. Ngữ pháp Thời điểm `resolveCueFrame` hỗ trợ — `[Đã xác minh trong code]`
- **Nguồn**: `src/stage/timeResolver.ts` (dòng 23–118).
- Hỗ trợ 4 nhóm biểu thức:
  1. **Số giây trực tiếp**: `1.5` hoặc `"2.4s"` -> `round(sec * fps)`.
  2. **Mốc sự kiện chữ**: `"start"` (`0s`), `"line_1"`..`"line_N"`, `"last_line"`, `"pivot"`, `"text_done"`, `"end"`.
  3. **Mốc sự kiện kèm độ lệch (`± offset`)**: `"line_2+0.6s"`, `"pivot-0.3s"`, `"pivot+1.2s"`, `"text_done+0.5s"`.
  4. **Phần trăm theo 3 Hồi (`act1`, `act2`, `act3`)**:
     - `"act1:0%"` .. `"act1:100%"`: Nội suy từ `0` đến `line_2` (hoặc `pivot * 0.5`).
     - `"act2:0%"` .. `"act2:100%"`: Nội suy từ cuối Act 1 đến `pivotFrame`.
     - `"act3:0%"` .. `"act3:100%"`: Nội suy từ `pivotFrame` đến `durationInFrames`.

### C. Bẫy Timing Ẩn trong Compiler (`resolveCinemagraphDurationFrames`) — `[Đã xác minh trong code]`
- **Nguồn**: `src/stage/trackCompiler.ts` (dòng 35–46).
  ```ts
  function resolveCinemagraphDurationFrames(cueDuration, fps, isPostPivot): number {
    let sec = cueDuration ?? (isPostPivot ? 4.2 : 2.8);
    if (isPostPivot && sec >= 0.6 && sec < 3.4) {
      sec = 3.8; // <-- GHI ĐÈ NGẦM!
    }
    return Math.max(1, Math.round(sec * fps));
  }
  ```
- **Hệ quả thực tế**: Mọi `cue` bắt đầu từ `pivot - 0.1s` trở đi (`isPostPivot = true`), nếu người viết kịch bản đặt `"duration": 1.2` hay `"duration": 2.0`, bộ biên dịch sẽ **tự động ghi đè thành `3.8s`**! Chỉ khi đặt `duration < 0.6` (ví dụ `0.45s`) hoặc `duration >= 3.4` thì giá trị mới được giữ nguyên.

### D. 4 Pha Khai Bút Thư Pháp Chậm Rãi V8.6.1 (`0.00s -> 3.80s`) — `[Đã xác minh trong code]`
- **Nguồn**: `src/stage/trackCompiler.ts` (dòng 940–1035) & `src/stage/propCatalog.tsx` (`renderShapeList`, dòng 879–1003).
- Mọi đạo cụ và nhân vật (trừ khi có `enterAt` riêng sau `3.0s`) đều tự động đi qua 4 pha Khai Bút đầu video mà không cần viết cue thủ công:
  1. **Pha 1 (`0.00s -> 1.15s` — Thiên & Địa)**: Đường chân trời quét từ trái sang phải (`2.2s` trong `motionPhysics.ts`), các vật thể `atmosphere` và đạo cụ **Tier 1** (khớp regex `/sun|moon|crescent|cloud|horizon|arch|gate|bridge|skyline|mountain|tree|lamp|house|window|door|wall|rain|mist|star|smoke/i`) vẽ nét mảnh trước (`0..72%` progress) rồi mới thấm mảng màu (`54..100%` progress).
  2. **Pha 2 (`0.75s -> 2.15s` — Tĩnh Vật & Bối Cảnh)**: Các đạo cụ **Tier 2** (khớp regex `/desk|table|chair|bench|stool|boulder|rock|boat|bed|shelf|counter|box_stack|campfire|seesaw|umbrella/i`) hiện nét theo chỉ số thứ tự.
  3. **Pha 3 (`1.45s -> 3.05s` — Nhân Vật Nhập Cảnh)**: Nhân vật chính (`i = 0`) hiện nét từ `1.45s -> 2.65s`; nhân vật thứ hai (`i = 1`) hiện nét từ `1.85s -> 3.05s`.
  4. **Pha 4 (`2.25s -> 3.60s` — Điểm Nhấn / Đạo Cụ Trung Tâm)**: Các đạo cụ **Tier 3** (mọi đạo cụ không khớp regex Tier 1 và Tier 2, như `wallet`, `desk_calendar`, `wine_jar`, `envelope`, ...) hiện nét sau cùng.

---

## 1.5. Đối chiếu Quy tắc Chống Va chạm / Chồng lấn: Code Thực Thi vs. Chỉ Nằm Trong Tài Liệu/Prompt

| Quy tắc / Ràng buộc | Trạng thái xác minh | Chi tiết thực thi trong Code (`src/`) | Lỗ hổng thực tế đã xảy ra |
| :--- | :--- | :--- | :--- |
| **1. Biên an toàn ngang của nhân vật (`EDGE_SAFETY`)** | **`[Đã xác minh trong code]`** (Chỉ cảnh báo UI, không chặn render) | `auditStageVisualLayout` (`geminiBundleBridge.ts:556-564`) kiểm tra `actor.minX < 92` hoặc `actor.maxX > 448`. | Chỉ báo warning, không tự động dịch chuyển nhân vật vào vùng an toàn. |
| **2. Chạm tán cây / vật treo vào đầu nhân vật (`HEADROOM_OVERLAP`)** | **`[Đã xác minh trong code]`** (Chỉ cảnh báo UI) | `auditStageVisualLayout` (`geminiBundleBridge.ts:588-615`) chỉ kiểm tra đạo cụ có `width >= 48` và `y` trong `[-95, -30]` nếu đáy đạo cụ thấp hơn đỉnh đầu nhân vật (`-54px`). | Bỏ qua hoàn toàn mọi đạo cụ có `width < 48` hoặc đặt dưới mặt đất (`y > -30`). |
| **3. Va chạm giữa 2 nhân vật hoặc nhân vật đè lên cột/đèn (`POST_COLLISION`)** | **`[Có trong tài liệu nhưng chưa xác minh trong code]`** | Mã lỗi `'POST_COLLISION'` được khai báo trong kiểu `StageLayoutWarning['code']` (`geminiBundleBridge.ts:31`), nhưng **không có bất kỳ dòng code nào tạo ra warning này**! | Hai nhân vật hoặc nhân vật và đạo cụ đứng trùng tọa độ `X` không hề bị phát hiện. |
| **4. Cấm nhân vật đi bộ xuyên qua bàn/ghế (`Furniture Walk-Through`)** | **`[Có trong tài liệu nhưng chưa xác minh trong code]`** | Chỉ được nhắc bằng lời trong prompt. Không có code kiểm tra quỹ đạo `[actor.x0 .. actor.toX]` cắt qua bounding box của `desk / table / bench / chair`. | Ở Chén 16 (`SCRIPT_DE_SANG_MAI` và `SCRIPT_P032`), `hero` đi bộ từ `x: 158 -> 276` xuyên thẳng qua bàn (`x: 205..216`). |
| **5. Cấm trùng lặp đạo cụ cùng ngữ nghĩa & giới hạn số lượng đạo cụ** | **`[Có trong tài liệu nhưng chưa xác minh trong code]`** | Chỉ có trong prompt. Schema `StageScriptSchema` cho phép mảng `props` không giới hạn số lượng. | Ở Chén 16 (`SCRIPT_DE_SANG_MAI`), kịch bản sinh ra 2 chiếc ví (`locked_wallet_note` + `pet_wallet`) và 5 đạo cụ chen chúc trong `160px`. |
| **6. Kỷ luật "Độc Nhất Đỏ Chu Sa (`Single Cinnabar Accent`) tại Pivot"** | **`[Có trong tài liệu nhưng chưa xác minh trong code]`** (Thậm chí code còn tự tô đỏ thêm!) | Không những không kiểm tra số lượng vật thể `accent`, mà `DeclarativeStagePlayer.tsx:372` còn có dòng: `const defaultRole = (item.type === 'sun' \|\| item.type === 'hollow_sun' \|\| item.type === 'crescent' \|\| item.type === 'ring_pulse') ? 'accent' : 'secondary'`. | Nếu kịch bản có mặt trăng `"crescent"` hoặc `"sun"` mà quên ghi `"colorRole": "secondary"`, mặt trăng sẽ mặc định đỏ rực (`accent`) từ giây `0.00s`, tạo ra 2–4 vật thể đỏ cùng lúc! |
| **7. Các trường điều khiển IK/Easing trong `TimelineCue` (`toScale`, `headTilt`, `handTarget`, `reachProgress`, `easing`)** | **`[Có trong tài liệu nhưng chưa xác minh trong code]`** | Trong `src/stage/stageScriptSchema.ts` (dòng 153–179), `TimelineCueSchema` **KHÔNG khai báo** `toScale`, `headTilt`, `handTarget`, `reachProgress`, `easing` (chỉ có `scale`, `toX`, `x`, `toY`, `y`, `yOffset`). Khi đi qua `StageScriptSchema.parse()`, Zod **strip bỏ sạch** các trường này! | Mọi cue dùng `toScale` thay vì `scale`, hoặc dùng `handTarget` để vươn tay IK đều bị mất tác dụng hoàn toàn. |
| **8. Kiểm tra `prop.type` phải tồn tại trong Catalog khi không có inline `shapes`** | **`[Có trong tài liệu nhưng chưa xác minh trong code]`** | `PropSpecSchema` chỉ kiểm tra `type: z.string()`. Nếu truyền `"type": "stool"` hoặc `"type": "low_tea_table"` (không có trong catalog) mà không kèm `shapes`, `StagePropRenderer` trả về `null` (tàng hình). | Ở `SCRIPT_P032_QUYET_TAM_3_GIAY`, ghế `"stool"` tàng hình khiến nhân vật ngồi lơ lửng trên không trung. |

---

## 1.6. `[Đề xuất mới]` Kiến trúc Ràng buộc Tự động & Cấu trúc JSON Gọn (Stage Layout Solver V9)

1. **`[Đề xuất mới]` Chuẩn hóa `mount` / `slot` thay vì cộng nhẩm tọa độ `y` thủ công**:
   - Thêm thuộc tính tùy chọn `"mount": "ground" | { "onProp": "<tableId>", "align": "center" | "left" | "right", "offsetX": 0 }` cho `PropSpec` và `"seat": "<chairId>"` cho `ActorSpec`.
   - Khi `"mount": { "onProp": "tea_table" }`, compiler tự động lấy `table.topY = -tableBounds.height * table.scale` (ví dụ `-26px`) gán cho đạo cụ trên bàn — triệt tiêu 100% lỗi đạo cụ bay lơ lửng (`y: -29` hay `y: -14.2`) hoặc chìm vào mặt bàn.
2. **`[Đề xuất mới]` Sửa thứ tự vẽ lớp `fore` trong `DeclarativeStagePlayer.tsx` (dòng 644–649)**:
   - Đổi thứ tự trong group `fore` thành `renderPropsByLayer('fore')` trước, `renderActorsByLayer('fore')` sau (đồng nhất với `far` và `mid`), hoặc tách riêng `fore_bg_props` và `fore_overlay_props`.
3. **`[Đề xuất mới]` Đổi mặc định `colorRole` của `sun / hollow_sun / crescent` trong `DeclarativeStagePlayer.tsx` (dòng 372)**:
   - Sửa `defaultRole` thành `'secondary'` cho mọi `atmosphere` item (trừ `ring_pulse`), chỉ đỏ khi kịch bản chủ động truyền `"colorRole": "accent"`.
4. **`[Đề xuất mới]` Bổ sung 4 bộ kiểm tra cứng (Hard Gates) vào `auditStageVisualLayout`**:
   - **Gate A (`CATALOG_EXISTENCE`)**: Báo lỗi đỏ nếu `prop.type` không nằm trong `BUILT_IN_PROP_CATALOG ∪ customProps` và không có `prop.shapes` hợp lệ.
   - **Gate B (`FURNITURE_WALK_COLLISION`)**: Kiểm tra đoạn thẳng dịch chuyển `[actor.x_start, actor.x_end]` không được cắt qua `[furniture.x - width/2 + 6, furniture.x + width/2 - 6]` của bất kỳ đạo cụ `desk | table | bench | boulder` nào cùng mặt phẳng.
   - **Gate C (`PROP_ACTOR_FOOT_OVERLAP`)**: Kiểm tra khoảng cách ngang giữa các đạo cụ đặt dưới đất (`y in [-6, 4]`) và chân nhân vật tối thiểu `>= (prop.width/2 + 12)px`.
   - **Gate D (`SINGLE_CINNABAR_PIVOT_AUDIT`)**: Đếm tổng số đạo cụ + atmosphere có `colorRole === 'accent'` (hoặc `shapes` dùng `stroke/fill: 'accent'`) tại thời điểm `pivotFrame + 45f`; cảnh báo nếu `count > 1`.
