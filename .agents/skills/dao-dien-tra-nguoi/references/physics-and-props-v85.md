# Sổ Tay Vật Lý Sân Khấu, Visual DNA & Đạo Cụ SVG — Trà Nguội V8.5

## 1. Hệ tọa độ sân khấu (`STAGE_VIEWBOX = "62 126 416 250"`)
- **Trục ngang X**: `62 .. 478`, tâm khung hình tại `X = 270`. Vùng an toàn tuyệt đối trên điện thoại 9:19.5 là `X = 105 .. 435`.
- **Trục dọc Y**:
  - Mặt đất mặc định (`terrain.y`): `352`.
  - Bầu trời (`layer: "sky"` hoặc `atmosphere`): `Y = 140 .. 255`.
  - Với đạo cụ đặt đất (`anchorType: "ground"`, `layer !== "sky"`): `y = 0` chạm đúng mặt đất, số **âm** đi lên trời (`y = -62` là cao hơn mặt đất `62px`).

## 2. Kích thước thật của nhân vật `CloakedTraveler`
- Khi **đứng / bước đi** (`sitProgress = 0`):
  - Chân tại `y = 0`, đỉnh đầu tròn tại **`y = -48.2 * scale`** (ở `scale = 1.15`, đỉnh đầu cao tới `-55.4px`).
  - Bề ngang áo choàng: `±9 * scale` (`~ ±10.5px`).
- Khi **ngồi xuống ghế** (`sitProgress = 1`):
  - Đỉnh đầu hạ xuống khoảng **`y = -34.4 * scale`**.
- **Quy tắc chống chạm đầu**:
  - Mọi đạo cụ dạng mái hiên, cổng vòm, tán ô rộng hoặc bong bóng suy nghĩ treo trên đầu nhân vật đứng phải đặt **gầm dưới cùng cao hơn `y = -61`** (khuyên dùng `y = -62 .. -80`).
  - Các cột dọc của cổng/hiên phải cách tọa độ `x` đứng dừng của nhân vật ít nhất `16px`.
  - Với đạo cụ dạng biểu tượng hoặc đường sóng treo cao (`y <= -50`) nhưng neo `anchorType: "ground"`, hãy đặt `"idle": "none"` trên prop để giữ đường nét tĩnh tại, tránh xoay lắc quanh gốc mặt đất `[0, 0]`.

## 3. Cú pháp vẽ `customProps` (SVG tối giản không cần viết code)
Mỗi phần tử trong mảng `shapes` (Hồi 1) hoặc `altShapes` (Hồi 2 khi `morphProgress: 1`) hỗ trợ 1 trong 4 hình cơ bản:
- `{ "d": "M -20 -40 Q 0 -55 20 -40", "fill": "none", "role": "ink", "strokeScale": 0.9 }`
- `{ "rect": [x, y, width, height, rx?], "fill": "accent", "fillOpacity": 0.95, "role": "accent", "strokeScale": 0 }`
- `{ "circle": [cx, cy, r], "fill": "bg", "role": "ink", "strokeScale": 0.85 }`
- `{ "line": [x1, y1, x2, y2], "role": "secondary", "dashed": true }`

Bảng mã màu `role` / `fill` (tự thích nghi cả 5 bảng màu Sáng & Tối):
- `"ink"`: Mực chính (`palette.inkPrimary` — mực than trên nền sáng hoặc kem ngà/sương ngà trên nền đêm).
- `"secondary"`: Mực phụ làm nền / chi tiết phụ (`palette.inkSecondary`).
- `"accent"`: Đỏ Chu Sa đạo cụ (`palette.accentProp`: `#D44D33`–`#CE472E` nền sáng; `#DF5438` sơn mài sáng trên nền đêm) — **chỉ bật trên đúng 1 vật thể tâm điểm ở Hồi 2 (`pivot`)** để giữ nguyên vẹn yếu tố bất ngờ trên Ảnh bìa 3:4.
- `"bg"`: Màu nền của bảng màu đang chọn (`palette.background` — giấy trà sáng trên theme sáng hoặc `#1B1714` / `#16181D` trên 2 theme tối, dùng che nét phía sau rất sạch).
- `"none"`: Không tô nền.

## 4. Khớp động `anim`, Nhân vật `actor.rig` & Địa hình tự do `custom_path` (V8.5)
- **Khớp động `anim` trên từng nét vẽ (`InlineShape`)**:
  - Bánh xe lăn có nan hoa:
    `{ "d": "M -14 -15 L -14 -1 M -21 -8 L -7 -8", "role": "ink", "anim": { "type": "spin", "pivot": [-14, -8], "amplitude": 7, "driveByMotion": true } }`
  - Chân thú cưng bước đi nhịp đôi:
    `{ "line": [-5, -8, -5, 0], "role": "ink", "anim": { "type": "swing", "pivot": [-5, -8], "amplitude": 20, "phase": 0, "driveByMotion": true } }`
    `{ "line": [5, -8, 5, 0], "role": "ink", "anim": { "type": "swing", "pivot": [5, -8], "amplitude": 20, "phase": 0.5, "driveByMotion": true } }`
- **Địa hình bậc thang & cầu vòm tự vẽ**:
  - `"terrain": { "type": "stairs", "y": 356, "stairsStartX": 195, "stairsEndX": 345, "stepCount": 4, "stepRise": -7.5 }`
  - `"terrain": { "type": "custom_path", "points": [[90, 354], [190, 354], [270, 326], [350, 354], [450, 354]], "smooth": true }`

## 5. Chuẩn gói `scene.tsxCode` (Chỉ dùng cho 0.5% cảnh vật lý/hạt đặc biệt)
Khi nhúng `"scene": { "sceneId": "CUSTOM_TEN_CANH", "name": "...", "tsxCode": "..." }` trong `CupBundle`:
- Chỉ import từ `'react'`, `'remotion'` (`interpolate`, `Easing`), `'../../components/archetypes/types'`, `'../../kit/CloakedTraveler'`, `'../../kit/Atmosphere'`, `'../../kit/WorldStage'`.
- Luôn xuất `export const CustomTenCanhScene: React.FC<ArchetypeComponentProps> = ({ state, palette, strokeWidth, frame, fps, timeline }) => ( <svg width={552} height={498} viewBox="62 126 416 250" style={{ overflow: 'visible' }}>...</svg> );`.
- **Nền `<svg>` bắt buộc trong suốt 100%** (tuyệt đối không vẽ `<rect>` nền đặc để không tạo khung viền lệch trên nền đêm Dark Mode).
- Dùng đúng bảng màu động `palette.inkPrimary`, `palette.inkSecondary`, `palette.background` và chỉ bật `palette.accentProp ?? palette.accent` từ mốc `timeline.pivotFrame` trở đi.

## 6. Hệ 5 Bảng Màu (`themeId`) — 3 Sáng · 2 Tối & Khung giờ (`publishSlot`)
- **Nhóm Nền Sáng (3 theme — tránh xếp `>= 3` bài liên tiếp để không dính cảnh báo `MONOTONE_LIGHT_STREAK`)**:
  - `MINIMAL_LIGHT` (*Giấy Trà Ấm `#F1EAE0`* — chủ đạo ban ngày, hợp `Morning` & `Anytime`).
  - `SLATE_CALM` (*Men Lam Sương `#E7ECE8`* — dịu mát, buông bỏ, hợp `Morning` & `Anytime`).
  - `MINIMAL_DARK` (*Khói Trà Chiều `#E4DDD3`* — **nền giấy khói SÁNG ấm trầm**, dịu mắt chiều muộn; **không** phải Dark Mode).
- **Nhóm Nền Tối Dark Mode (2 theme — hợp `Night` & đan xen phá chuỗi sáng)**:
  - `WARM_NOIR` (*Ô Long Cổ `#1B1714`* — **Tối ấm**: đèn lồng, hoài niệm, trích dẫn văn học, quán khuya ấm).
  - `DARK_CONTEMPLATIVE` (*Mực Đêm Trầm `#16181D`* — **Tối lạnh**: chiêm nghiệm sâu, mưa đêm, độc thoại tĩnh lặng).

## 7. Chuẩn `visualDNA`, `durationMode`, `audioMode` & 3 Luật Khóa B.3 (V8.5)
- **`durationMode`**: Luôn xuất `"AUTO_SEED"` (Engine tự chọn thời lượng động `13.5s–16.5s`, né `15.0s / 900f`). Không truyền `targetDurationSeconds` trừ khi cần khóa cứng `"FIXED"`.
- **`audioMode`**: Mặc định `"PIVOT_ACCENT"` (nền `-55 dBFS` + 1 tiếng điểm nhấn đúng `pivotWord`). Tùy chọn khác: `"TIKTOK_SILENT"`, `"FOLEY_MASTER"`.
- **`visualDNA` (4 trục Anti-Template)**:
  - Mặc định `{ "mode": "AUTO", "forceSolidStyle": true }`.
  - Khi cần chủ động chọn (`"mode": "CUSTOM"`):
    - `layout`: `"CLASSIC_TOP_STAGE"` | `"SKY_QUOTE_BOTTOM_STAGE"` | `"WINDOW_FRAME"` | `"ASYMMETRIC_THIRD"`
    - `lightingGobo`: `"NONE"` | `"FOLIAGE_DAPPLE"` | `"WINDOW_SLATS"` | `"WARM_LANTERN"` | `"PORCH_MIST"`
    - `shotMode`: `"SOLID_SCENE"` | `"MACRO_PROP"` | `"BRUSH_DRAW"`
    - `pivotMechanic`: `"PARALLAX_DRIFT"` | `"PULLBACK_REVEAL"` | `"ACCENT_PUSH_IN"` | `"SPOTLIGHT_DIM"`
- **3 Luật Khóa B.3**:
  1. `ASYMMETRIC_THIRD` yêu cầu tổng âm tiết `<= 28` VÀ không có `>= 2` nhân vật cách xa `> 56px` (trừ khi `shotMode === "MACRO_PROP"`).
  2. Theme tối (`WARM_NOIR`, `DARK_CONTEMPLATIVE`) không dùng `FOLIAGE_DAPPLE` (ưu tiên `WARM_LANTERN`, `PORCH_MIST`, `WINDOW_SLATS`).
  3. Luôn giữ `"forceSolidStyle": true` và tag `"solid_style"` + Ảnh bìa 3:4 trích cuối Hồi 1 (nên Hồi 1 phải có sẵn chủ thể rõ nét & chưa tô Đỏ Chu Sa).
