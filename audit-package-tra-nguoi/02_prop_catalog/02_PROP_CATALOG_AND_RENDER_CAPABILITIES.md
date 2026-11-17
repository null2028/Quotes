# PHẦN 2: DANH MỤC ĐẠO CỤ & NĂNG LỰC RENDER (PROP CATALOG & RENDER CAPABILITIES)

> **Dữ liệu nguồn đính kèm trực tiếp trong thư mục `02_prop_catalog/`:**
> - File dữ liệu máy đọc đầy đủ (toàn bộ `shapes`, `altShapes`, bounding box, tier): [`prop_catalog_full.json`](prop_catalog_full.json)
> - Thư mục 122 ảnh vector SVG xem trước từng đạo cụ (có lưới gốc tọa độ `(0,0)` màu đỏ Chu Sa): [`svg_previews/`](svg_previews/)
> - Mã nguồn trình render đạo cụ: [`../05_sources_and_code/src_snapshot/src/stage/propCatalog.tsx`](../05_sources_and_code/src_snapshot/src/stage/propCatalog.tsx) & [`../05_sources_and_code/src_snapshot/data/custom-props.json`](../05_sources_and_code/src_snapshot/data/custom-props.json)

---

## 2.1. Tổng quan Năng lực Render Đạo cụ của Engine — `[Đã xác minh trong code]`

### A. 6 Hình cơ sở SVG (`InlineShape`) — `[Đã xác minh trong code: src/stage/stageScriptSchema.ts:62-97]`
1. `path`: `{ type: "path", d: string, stroke, fill, strokeWidth, opacity, fillOpacity, dashed, anim }`
2. `line`: `{ type: "line", x1, y1, x2, y2, ... }`
3. `circle`: `{ type: "circle", cx, cy, r, ... }`
4. `ellipse`: `{ type: "ellipse", cx, cy, rx, ry, ... }`
5. `rect`: `{ type: "rect", x, y, width, height, rx, ... }`
6. `polygon`: `{ type: "polygon", points: "x1,y1 x2,y2 ...", ... }`

### B. Cơ chế Phác thảo 2 Pha (`Two-Phase Stroke-Then-Wash`) — `[Đã xác minh trong code: src/stage/propCatalog.tsx:879-1003]`
- Khi `drawProgress` chạy từ `0 -> 1` trong Pha Khai Bút (`0.00s -> 3.80s`):
  - **Pha Nét (`Stroke Phase`, `0% -> 72%` progress)**: Từng nét `InlineShape` được vẽ dần qua `pathLength={100}` và `strokeDasharray / strokeDashoffset`, trượt nhẹ theo phương thẳng đứng `(1 - strokeP) * 2.2px`.
  - **Pha Mực (`Wash Fill Phase`, `54% -> 100%` progress)**: Sau khi nét vẽ đạt 54%, mảng màu `fill` mới thấm dần lên (`fillOpacity = baseFillOpacity * washP`).

### C. 5 Trạng thái Biến hình & Chuyển động Đạo cụ (`Prop Motion & Morph States`) — `[Đã xác minh trong code]`
1. **Biến hình A -> B (`morph: 0 -> 1` / `morphProgress`)** — `[Đã xác minh trong code: propCatalog.tsx:1076-1122]`:
   - Khi `morphProgress > 0.01` và đạo cụ có `altShapes`:
     - Bộ `shapes` gốc (State A) mờ dần `opacity = 1 - morphProgress`, thu nhẹ `scale(1 - morphProgress * 0.15)` quanh tâm hình học `primaryCenter`.
     - Bộ `altShapes` (State B) hiện dần `opacity = morphProgress`, phóng từ `scale(0.82 + morphProgress * 0.18)` quanh `altCenter`.
     - Tại `0.05 < morphProgress < 0.95`, một vòng hào quang tròn màu `accent` (`r = 12 + morphProgress * 18`) tự động bung ra quanh tâm đạo cụ.
   - **Cảnh báo quan trọng (`[Đã xác minh trong code]`)**: Nếu kịch bản gọi cue `"morph": 1` trên một đạo cụ **KHÔNG có `altShapes`**, nhánh `hasAlt` trong `propCatalog.tsx:1040` bằng `false`, dẫn tới lệnh `"morph": 1` **không có bất kỳ tác dụng thị giác nào**!
2. **Nứt đôi (`split: 0 -> 1` / `splitProgress`)** — `[Đã xác minh trong code: propCatalog.tsx:1058-1075]`:
   - Chia mảng `primaryShapes` thành nửa đầu (dịch sang trái `-splitOffset`, xoay `-splitProgress * 12°`) và nửa sau (dịch sang phải `+splitOffset`, xoay `+splitProgress * 12°`). Phù hợp cho `dashed_heart`, `boulder`, `envelope`.
3. **Bay lên & Hóa mây (`floatAway: true` + `dissolveToCloud: true`)** — `[Đã xác minh trong code: trackCompiler.ts:873-880 & propCatalog.tsx:1025-1038]`:
   - Đạo cụ bay bổng lên cao (`floatOffsetY = -floatAwayProgress * 82px`), lắc nhẹ hình sin `sin(p * π * 3) * 8px`.
   - Nếu `dissolveToCloud: true`, từ `floatAwayProgress > 0.25`, hình gốc mờ dần và biến thành cụm mây `cloud_wisp` ở độ cao `localCenterY`.
4. **Chuyển động nội tại cấp từng nét (`InlineShape.anim`)** — `[Đã xác minh trong code: propCatalog.tsx:853-877]`:
   - `rotate`: Xoay liên tục quanh `pivot` với tốc độ `speed * 60` độ/giây (ví dụ: bánh xe, kim đồng hồ).
   - `sway`: Đung đưa góc `sin(t * speed * 2.5 + phase) * amp` độ quanh `pivot` (ví dụ: cành cây, lồng đèn, đuôi mèo).
   - `bob`: Nhấp nhô trục Y `sin(t * speed * 2.5 + phase) * amp` px (ví dụ: phao, nắp nồi, lồng ngực thở).
   - `pulse`: Phóng thu nhẹ `scale = 1 + sin(t * speed * 3 + phase) * (amp * 0.05)` (ví dụ: tim đập, sóng âm).
   - `flutter`: Rung nhanh góc `sin(t * speed * 7 + phase) * amp` độ.
5. **Hạt phát xạ gắn theo Đạo cụ (`PropSpec.emitters`)** — `[Đã xác minh trong code: DeclarativeStagePlayer.tsx:266-360]`:
   - Hỗ trợ 5 loại hạt: `steam` (khói trà/bún nóng bay lên), `sparks` (đốm sáng/lửa bay lên), `petals` (cánh hoa rơi chéo), `bubbles` (bong bóng), `tears` (giọt mưa/nước mắt rơi xuống).
   - Tọa độ phát xạ lấy theo `emitterOffset: [dx, dy]` của đạo cụ (mặc định `[0, -height * 0.65]`).

---

## 2.2. Bảng 1: 26 Đạo cụ Built-In (`src/stage/propCatalog.tsx`) — Dùng được ngay (`[Đã xác minh trong code]`)

| ID (`type`) | Tên hiển thị | Nhóm | Điểm neo (`anchorType`) | Tầng Khai Bút | Bounding Box Gốc `[minX..maxX, minY..maxY]` (`Rộng×Cao`) | Bounding Box Morph (`altShapes`) | `emitterOffset` | `anim` nội tại | Số cảnh đang dùng | SVG Preview |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| `envelope` | envelope | `` | `hand` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không (`null`) | `[0, -0.8]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/builtin_envelope.svg) |
| `bridal_veil` | bridal_veil | `` | `hand` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không (`null`) | `[0, -2]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/builtin_bridal_veil.svg) |
| `dashed_heart` | dashed_heart | `` | `center` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không (`null`) | `[0, -2]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/builtin_dashed_heart.svg) |
| `solid_heart` | solid_heart | `` | `center` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không (`null`) | `[0, -2]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/builtin_solid_heart.svg) |
| `wine_jar` | wine_jar | `` | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không (`null`) | `[0, -19]` | `Tĩnh` | 4 cảnh | [SVG](svg_previews/builtin_wine_jar.svg) |
| `small_cup` | small_cup | `` | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không (`null`) | `[0, -6.5]` | `Tĩnh` | 4 cảnh | [SVG](svg_previews/builtin_small_cup.svg) |
| `rice_bowl` | rice_bowl | `` | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không (`null`) | `[0, -9.2]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/builtin_rice_bowl.svg) |
| `tall_cup` | tall_cup | `` | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không (`null`) | `[0, -14.2]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/builtin_tall_cup.svg) |
| `boulder` | boulder | `` | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | Không (`null`) | `[0, -28]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/builtin_boulder.svg) |
| `box_stack` | box_stack | `` | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | Không (`null`) | `[0, -25]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/builtin_box_stack.svg) |
| `umbrella` | umbrella | `` | `hand` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -30]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/builtin_umbrella.svg) |
| `bench` | bench | `` | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | Không (`null`) | `[0, -22.5]` | `Tĩnh` | 6 cảnh | [SVG](svg_previews/builtin_bench.svg) |
| `street_lamp` | street_lamp | `` | `ground` | `Tier 1` | `[-10..10, -20..0]` (**`20×20`**) | Không (`null`) | `[20, -66]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/builtin_street_lamp.svg) |
| `warm_house` | warm_house | `` | `ground` | `Tier 1` | `[-10..10, -20..0]` (**`20×20`**) | Không (`null`) | `[15, -43]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/builtin_warm_house.svg) |
| `city_skyline` | city_skyline | `` | `ground` | `Tier 1` | `[-10..10, -20..0]` (**`20×20`**) | Không (`null`) | `[-5, -68]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/builtin_city_skyline.svg) |
| `small_boat` | small_boat | `` | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | Không (`null`) | `[0, -10]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/builtin_small_boat.svg) |
| `kite` | kite | `` | `center` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không (`null`) | `[0, -16]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/builtin_kite.svg) |
| `paper_plane` | paper_plane | `` | `center` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không (`null`) | `[-8, 3]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/builtin_paper_plane.svg) |
| `bare_tree` | bare_tree | `` | `ground` | `Tier 1` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -68]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/builtin_bare_tree.svg) |
| `sprout` | sprout | `` | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không (`null`) | `[0, -25]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/builtin_sprout.svg) |
| `campfire` | campfire | `` | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | Không (`null`) | `[0, -27]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/builtin_campfire.svg) |
| `lantern` | lantern | `` | `hand` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không (`null`) | `[0, 7.5]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/builtin_lantern.svg) |
| `seesaw` | seesaw | `` | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | Không (`null`) | `[0, -15]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/builtin_seesaw.svg) |
| `hourglass` | hourglass | `` | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không (`null`) | `[0, -32]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/builtin_hourglass.svg) |
| `chat_bubble` | chat_bubble | `` | `center` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không (`null`) | `[0, -12]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/builtin_chat_bubble.svg) |
| `cloud_wisp` | cloud_wisp | `` | `center` | `Tier 1` | `[-10..10, -20..0]` (**`20×20`**) | Không (`null`) | `[0, 0]` | `Tĩnh` | 14 cảnh | [SVG](svg_previews/builtin_cloud_wisp.svg) |

---

## 2.3. Bảng 2: 96 Đạo cụ Custom (`data/custom-props.json`) — Dùng được ngay (`[Đã xác minh trong code]`)

| ID (`type`) | Tên hiển thị | Điểm neo (`anchorType`) | Tầng Khai Bút | Bounding Box Gốc `[minX..maxX, minY..maxY]` (`Rộng×Cao`) | Bounding Box Morph (`altShapes`) | `emitterOffset` | `anim` nội tại | Số cảnh đang dùng | SVG Preview |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| `goblet_cup` | goblet_cup | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 0 cảnh | [SVG](svg_previews/custom_goblet_cup.svg) |
| `water_moon_reflection` | water_moon_reflection | `ground` | `Tier 1` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_water_moon_reflection.svg) |
| `poetic_leaf` | poetic_leaf | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 0 cảnh | [SVG](svg_previews/custom_poetic_leaf.svg) |
| `poetic_leaf_v2` | poetic_leaf_v2 | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 0 cảnh | [SVG](svg_previews/custom_poetic_leaf_v2.svg) |
| `swallow_kite` | swallow_kite | `center` | `Tier 1` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 2 cảnh | [SVG](svg_previews/custom_swallow_kite.svg) |
| `horizon_long_shadow` | horizon_long_shadow | `ground` | `Tier 1` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_horizon_long_shadow.svg) |
| `ink_coupe` | ink_coupe | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_ink_coupe.svg) |
| `spare_wheel` | spare_wheel | `center` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_spare_wheel.svg) |
| `harsh_day_sun` | harsh_day_sun | `center` | `Tier 1` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_harsh_day_sun.svg) |
| `reality_monolith` | reality_monolith | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_reality_monolith.svg) |
| `reality_monster_shadow` | reality_monster_shadow | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_reality_monster_shadow.svg) |
| `night_sanctuary_dome` | night_sanctuary_dome | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_night_sanctuary_dome.svg) |
| `ink_wine_jar` | ink_wine_jar | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_ink_wine_jar.svg) |
| `floating_wine_cup` | floating_wine_cup | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_floating_wine_cup.svg) |
| `dream_cloud_house` | dream_cloud_house | `center` | `Tier 1` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 2 cảnh | [SVG](svg_previews/custom_dream_cloud_house.svg) |
| `fallen_dream_blossom` | fallen_dream_blossom | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 2 cảnh | [SVG](svg_previews/custom_fallen_dream_blossom.svg) |
| `tiny_split_heart` | tiny_split_heart | `center` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_tiny_split_heart.svg) |
| `office_wall_clock` | office_wall_clock | `ground` | `Tier 1` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_office_wall_clock.svg) |
| `office_card_scanner` | office_card_scanner | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | `[0, -53]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_office_card_scanner.svg) |
| `staff_id_card` | staff_id_card | `hand` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_staff_id_card.svg) |
| `minimal_office_desk` | minimal_office_desk | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_minimal_office_desk.svg) |
| `morphing_laptop` | morphing_laptop | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_morphing_laptop.svg) |
| `morning_hype_sparks` | morning_hype_sparks | `center` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_morning_hype_sparks.svg) |
| `lunch_thought_cloud` | lunch_thought_cloud | `center` | `Tier 1` | `[-10..10, -20..0]` (**`20×20`**) | Không | `[0, -5]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_lunch_thought_cloud.svg) |
| `rain_puddle_ripple` | rain_puddle_ripple | `ground` | `Tier 1` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_rain_puddle_ripple.svg) |
| `wide_shared_umbrella` | wide_shared_umbrella | `hand` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_wide_shared_umbrella.svg) |
| `memory_street_window` | memory_street_window | `ground` | `Tier 1` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_memory_street_window.svg) |
| `melody_silk_stream` | melody_silk_stream | `center` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_melody_silk_stream.svg) |
| `park_wooden_bench` | park_wooden_bench | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_park_wooden_bench.svg) |
| `cinnabar_memory_note` | cinnabar_memory_note | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[1.8, -10.5]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_cinnabar_memory_note.svg) |
| `porch_stepping_stones` | porch_stepping_stones | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_porch_stepping_stones.svg) |
| `gate_to_shared_roof` | gate_to_shared_roof | `ground` | `Tier 1` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -52]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_gate_to_shared_roof.svg) |
| `envelope_to_double_hearts` | envelope_to_double_hearts | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -75]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_envelope_to_double_hearts.svg) |
| `sprout_to_double_canopy` | sprout_to_double_canopy | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -74]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_sprout_to_double_canopy.svg) |
| `single_cup_to_double_tea_tray` | single_cup_to_double_tea_tray | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -42]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_single_cup_to_double_tea_tray.svg) |
| `bridge_arch_lantern` | bridge_arch_lantern | `ground` | `Tier 1` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -80]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_bridge_arch_lantern.svg) |
| `wine_jar_to_sparkling_heart` | wine_jar_to_sparkling_heart | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -78]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_wine_jar_to_sparkling_heart.svg) |
| `wine_jar_to_red_veil` | wine_jar_to_red_veil | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[18, -74]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_wine_jar_to_red_veil.svg) |
| `wine_jar_to_flowing_veil` | wine_jar_to_flowing_veil | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[18, -70]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_wine_jar_to_flowing_veil.svg) |
| `branch_wind_chime_red` | branch_wind_chime_red | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -80]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_branch_wind_chime_red.svg) |
| `bud_to_red_rose` | bud_to_red_rose | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -48]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_bud_to_red_rose.svg) |
| `single_outline_to_double_red_hearts` | single_outline_to_double_red_hearts | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -75]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/custom_single_outline_to_double_red_hearts.svg) |
| `hidden_bud_to_double_bouquet` | hidden_bud_to_double_bouquet | `hand` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[6, -18]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_hidden_bud_to_double_bouquet.svg) |
| `vintage_bicycle_rig` | vintage_bicycle_rig | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `spin` | 0 cảnh | [SVG](svg_previews/custom_vintage_bicycle_rig.svg) |
| `basket_bloom_double` | basket_bloom_double | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[15, -74]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_basket_bloom_double.svg) |
| `courting_bicycle_prop` | courting_bicycle_prop | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[15, -72]` | `spin` | 0 cảnh | [SVG](svg_previews/custom_courting_bicycle_prop.svg) |
| `ecg_to_heart_pulse` | ecg_to_heart_pulse | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -76]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_ecg_to_heart_pulse.svg) |
| `capsule_bloom_heart` | capsule_bloom_heart | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -51]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_capsule_bloom_heart.svg) |
| `eye_chart_to_beloved_window` | eye_chart_to_beloved_window | `ground` | `Tier 1` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -75]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_eye_chart_to_beloved_window.svg) |
| `battery_heart_charge` | battery_heart_charge | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[-1, -79]` | `pulse` | 2 cảnh | [SVG](svg_previews/custom_battery_heart_charge.svg) |
| `periodic_table_board` | periodic_table_board | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[28.75, -81.5]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_periodic_table_board.svg) |
| `element_em_card` | element_em_card | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -84]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_element_em_card.svg) |
| `teacher_pointer_wand` | teacher_pointer_wand | `hand` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 2 cảnh | [SVG](svg_previews/custom_teacher_pointer_wand.svg) |
| `mosaic_cell` | mosaic_cell | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, 0]` | `Tĩnh` | 12 cảnh | [SVG](svg_previews/custom_mosaic_cell.svg) |
| `mosaic_cell_a` | mosaic_cell_a | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, 0]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_mosaic_cell_a.svg) |
| `mosaic_cell_c` | mosaic_cell_c | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, 0]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_mosaic_cell_c.svg) |
| `mosaic_cell_d` | mosaic_cell_d | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, 0]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_mosaic_cell_d.svg) |
| `mosaic_cell_core` | mosaic_cell_core | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, 0]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_mosaic_cell_core.svg) |
| `thought_bubble_dots` | thought_bubble_dots | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 2 cảnh | [SVG](svg_previews/custom_thought_bubble_dots.svg) |
| `elem_tile_a` | elem_tile_a | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 2 cảnh | [SVG](svg_previews/custom_elem_tile_a.svg) |
| `elem_tile_c` | elem_tile_c | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 2 cảnh | [SVG](svg_previews/custom_elem_tile_c.svg) |
| `elem_tile_d` | elem_tile_d | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 2 cảnh | [SVG](svg_previews/custom_elem_tile_d.svg) |
| `elem_tile_em` | elem_tile_em | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, 0]` | `Tĩnh` | 2 cảnh | [SVG](svg_previews/custom_elem_tile_em.svg) |
| `meeting_desk_set` | meeting_desk_set | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 0 cảnh | [SVG](svg_previews/custom_meeting_desk_set.svg) |
| `kpi_chart_to_hot_bowl` | kpi_chart_to_hot_bowl | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -52]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_kpi_chart_to_hot_bowl.svg) |
| `note_table_set` | note_table_set | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 0 cảnh | [SVG](svg_previews/custom_note_table_set.svg) |
| `seated_chair_clean` | seated_chair_clean | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 0 cảnh | [SVG](svg_previews/custom_seated_chair_clean.svg) |
| `office_table_with_pad` | office_table_with_pad | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_office_table_with_pad.svg) |
| `office_window_frame` | office_window_frame | `center` | `Tier 1` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_office_window_frame.svg) |
| `fitted_office_chair` | fitted_office_chair | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_fitted_office_chair.svg) |
| `conference_table_set` | conference_table_set | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 6 cảnh | [SVG](svg_previews/custom_conference_table_set.svg) |
| `tabletop_chart_to_bowl` | tabletop_chart_to_bowl | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -35]` | `Tĩnh` | 6 cảnh | [SVG](svg_previews/custom_tabletop_chart_to_bowl.svg) |
| `seated_office_worker` | seated_office_worker | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | Không | `swing` | 5 cảnh | [SVG](svg_previews/custom_seated_office_worker.svg) |
| `ground_brush_line` | ground_brush_line | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 5 cảnh | [SVG](svg_previews/custom_ground_brush_line.svg) |
| `stem_to_double_flower_cart` | stem_to_double_flower_cart | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0.5, -33]` | `swing` | 1 cảnh | [SVG](svg_previews/custom_stem_to_double_flower_cart.svg) |
| `single_stem_to_bouquet` | single_stem_to_bouquet | `hand` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[11.5, -12.5]` | `swing` | 1 cảnh | [SVG](svg_previews/custom_single_stem_to_bouquet.svg) |
| `rising_ink_heart` | rising_ink_heart | `center` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_rising_ink_heart.svg) |
| `office_stool` | office_stool | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 4 cảnh | [SVG](svg_previews/custom_office_stool.svg) |
| `walking_bill` | walking_bill | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -34]` | `swing` | 0 cảnh | [SVG](svg_previews/custom_walking_bill.svg) |
| `small_work_desk` | small_work_desk | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_small_work_desk.svg) |
| `std_chair` | std_chair | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_std_chair.svg) |
| `std_work_desk` | std_work_desk | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_std_work_desk.svg) |
| `std_tea_table` | std_tea_table | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -21]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/custom_std_tea_table.svg) |
| `porch_window` | porch_window | `ground` | `Tier 1` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -45]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_porch_window.svg) |
| `desk_laptop` | desk_laptop | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -26]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/custom_desk_laptop.svg) |
| `phone_notif` | phone_notif | `hand` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -8]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/custom_phone_notif.svg) |
| `desk_calendar` | desk_calendar | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -26]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_desk_calendar.svg) |
| `open_book_leaf` | open_book_leaf | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -23]` | `Tĩnh` | 0 cảnh | [SVG](svg_previews/custom_open_book_leaf.svg) |
| `wall_clock` | wall_clock | `ground` | `Tier 1` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -68]` | `spin` | 0 cảnh | [SVG](svg_previews/custom_wall_clock.svg) |
| `office_briefcase` | office_briefcase | `hand` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 0 cảnh | [SVG](svg_previews/custom_office_briefcase.svg) |
| `walking_wallet` | walking_wallet | `ground` | `Tier 1` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -18]` | `swing` | 0 cảnh | [SVG](svg_previews/custom_walking_wallet.svg) |
| `bill_letter_seal` | bill_letter_seal | `ground` | `Tier 3` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | `[0, -18]` | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_bill_letter_seal.svg) |
| `locked_wallet_to_dinner_invite` | locked_wallet_to_dinner_invite | `ground` | `Tier 1` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | Không | `Tĩnh` | 0 cảnh | [SVG](svg_previews/custom_locked_wallet_to_dinner_invite.svg) |
| `low_wood_stool` | low_wood_stool | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_low_wood_stool.svg) |
| `low_tea_table` | low_tea_table | `ground` | `Tier 2` | `[-10..10, -20..0]` (**`20×20`**) | Không | Không | `Tĩnh` | 2 cảnh | [SVG](svg_previews/custom_low_tea_table.svg) |
| `locked_wallet_note` | locked_wallet_note | `ground` | `Tier 1` | `[-10..10, -20..0]` (**`20×20`**) | `[-10..10, -20..0]` (`20×20`) | Không | `Tĩnh` | 1 cảnh | [SVG](svg_previews/custom_locked_wallet_note.svg) |

---

## 2.4. Bộ Đạo cụ Nội thất Chuẩn Hóa (`Standard Furniture Set`) & Quy tắc Khớp Tọa độ — `[Đã xác minh trong code: data/custom-props.json]`

Để tránh lỗi ghế/bàn lệch tỷ lệ nhân vật `CloakedTraveler` (cao `60px` khi đứng, hông ngồi tại `y = -19.5`, đầu gối tại `x = ±11.8, y = -13.5`), hệ thống hiện đã có 5 đạo cụ nội thất chuẩn trong `data/custom-props.json`:

| ID Đạo cụ (`type` trong `custom-props.json`) | Bounding Box `[minX..maxX, minY..maxY]` | Chiều rộng × Chiều cao | Chiều cao Mặt bàn / Mặt ghế (`topY`) | Quy tắc đặt Nhân vật & Vật trên bàn chuẩn xác |
| :--- | :--- | :---: | :---: | :--- |
| **`std_chair`** (Ghế tựa chuẩn) | `[-12..10, -34..0]` | `22 × 34` | Mặt ghế `y = -16`, lưng tựa `x = -10, y = -34` | Đặt ở `layer: "mid"`, cùng `x` với nhân vật ngồi `facing: "right"` (lưng tựa nằm bên trái `x - 10`). Nếu nhân vật `facing: "left"`, cần `flipX: true`. |
| **`office_stool`** (Ghế đôn văn phòng) | `[-9..9, -15..0]` | `18 × 15` | Mặt ghế `y = -15` | Đối xứng hai bên, dùng cho cả `facing: "right"` và `"left"`. Đặt cùng `x` với nhân vật ngồi tại `layer: "mid"`. |
| **`std_tea_table`** (Bàn trà chuẩn) | `[-24..24, -26..0]` | `48 × 26` | Mặt bàn **`y = -26`** | Đặt cách nhân vật ngồi **`36px..42px`** theo hướng nhìn. Mọi đạo cụ đặt trên mặt bàn (`small_cup`, `desk_calendar`, ...) phải đặt tại **`y: -26`**! |
| **`small_work_desk`** (Bàn làm việc nhỏ) | `[-22..22, -26..0]` | `44 × 26` | Mặt bàn **`y = -26`** | Đặt cách nhân vật ngồi **`34px..40px`**. Đạo cụ trên mặt bàn đặt tại **`y: -26`**. |
| **`std_work_desk`** (Bàn làm việc lớn) | `[-38..38, -32..0]` | `76 × 32` | Mặt bàn **`y = -32`** | Rộng `76px` (`-38..+38`). Đặt tâm bàn cách nhân vật ngồi **`46px..52px`**. Đạo cụ trên mặt bàn đặt tại **`y: -32`**. |

---

## 2.5. Danh sách Đạo cụ Lỗi / Chưa Đăng ký / Mâu thuẫn giữa Prompt và Catalog — `[Đã xác minh trong code]`

Qua quét tự động toàn bộ `GEMINI_GEM_SYSTEM_PROMPT` (`src/automation/geminiBundleBridge.ts`) và 34 kịch bản trong `data/stage-scripts.json`, phát hiện **3 nhóm bất cập nghiêm trọng**:

1. **ID đạo cụ có trong Prompt hướng dẫn nhưng KHÔNG TỒN TẠI trong Catalog (`[Đã xác minh trong code]`)**:
   - **`"stool"`**: Được `GEMINI_GEM_SYSTEM_PROMPT` (`geminiBundleBridge.ts` dòng 881, 899, 974) hướng dẫn làm ví dụ mẫu (`{ "id": "chair", "type": "stool", "x": 185, "y": 0 }`) và được sử dụng trong `SCRIPT_P032_QUYET_TAM_3_GIAY`. Tuy nhiên, trong `BUILT_IN_PROP_CATALOG` và `data/custom-props.json` **không hề có key `"stool"`** (tên thật trong `custom-props.json` là `"office_stool"` hoặc `"std_chair"`). Khi dùng `"type": "stool"` không kèm `shapes`, đạo cụ bị **tàng hình 100%**!
   - **`"low_tea_table"`**: Được `GEMINI_GEM_SYSTEM_PROMPT` (`geminiBundleBridge.ts` dòng 881, 899, 974) hướng dẫn làm ví dụ mẫu (`{ "id": "tea_table", "type": "low_tea_table", "x": 216, "y": 0 }`). Key này **không tồn tại** trong `BUILT_IN_PROP_CATALOG` lẫn `data/custom-props.json` (tên thật là `"std_tea_table"`). Trong `SCRIPT_P032_QUYET_TAM_3_GIAY` và `SCRIPT_P022_LICH_BAN_CHUA_CAP_NHAT`, tác giả phải nhúng `shapes` thủ công nên mới hiện hình.
2. **Đạo cụ thiếu trường `type` bắt buộc trong `data/stage-scripts.json` (`[Đã xác minh trong code]`)**:
   - Trong `SCRIPT_P032_QUYET_TAM_3_GIAY`: 2 đạo cụ `propId: "wallet"` và `propId: "vault_lid"` có `"type": null` (thiếu trường `type`), vi phạm `PropSpecSchema` (`type: z.string()`).
3. **Đạo cụ dùng mảng đặc `fill: "bg", fillOpacity: 1` làm hộp đen che khuất (`[Đã xác minh trong code]`)**:
   - Trong `SCRIPT_P032_QUYET_TAM_3_GIAY`: đạo cụ `vault_lid` ở `layer: "fore"` dùng `rect` với `fill: "bg", fillOpacity: 1, stroke: "primary"` phủ lên ví. Trên nền tối hoặc khi giao cắt với nhân vật/mặt bàn, nó tạo thành một khối hộp chữ nhật đặc cứng nhắc, phá vỡ phong cách nét mảnh thủy mặc (`line-art + soft wash fillOpacity <= 0.22`).
