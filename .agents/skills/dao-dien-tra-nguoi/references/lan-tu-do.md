# Làn Tự Do (`"che_do": "tu_do"`) — Chuẩn StageScript Toàn Quyền

> Sinh tự động từ `stageScriptSchema.ts`, `stageGeometry.ts`, `stageConstants.ts`, `terrainSystem.ts` và `validateFreeModeStageScript` qua `npm run gen:skill`. Xem mẫu hoàn chỉnh tại `references/c19.json`.

## 1. Cấu trúc JSON bọc Chén (dán thẳng vào Studio)
- Object gốc gồm câu chữ + kịch bản sân khấu:
  - `title` (string, bắt buộc): tiêu đề Chén.
  - `segments` (string[], bắt buộc, 2–4 dòng): các dòng thơ/quote.
  - `pivotWord` (string, bắt buộc): cụm chữ đổi đỏ nằm trong dòng cuối của `segments`.
  - `author` (string, tuỳ chọn), `textFormat` (`"POEM"` | `"PROSE"`), `themeId` (`"MINIMAL_LIGHT"` | `"MINIMAL_DARK"` | `"WARM_NOIR"`, mặc định `"MINIMAL_LIGHT"`), `durationMode` (`"AUTO_SEED"` mặc định).
  - `stageScript` (object, bắt buộc): mang cờ **`"che_do": "tu_do"`** (tuyệt đối KHÔNG ghi `"legacy": true`).

## 2. Khung toạ độ sân khấu & Vùng cấm vẽ
- Khung sân khấu `viewBox="62 126 416 250"`: ngang `x ∈ [62..478]` (rộng 416, tâm ngang `x = 270`), dọc `y ∈ [126..376]` (cao 250).
- Đường đất mặc định: `y = 352` (khai `startX`, `endX` trong `[62..478]`; engine tôn trọng đúng `startX`/`endX` ở mọi mức zoom).
- **Vùng CẤM vẽ (chặn cứng)**: phía trên `y < 126` là vùng **tiêu đề**; phía dưới `y > 376` là vùng **khối chữ**. Mọi nhân vật, đạo cụ, hình vẽ và khí quyển phải nằm gọn trong `y ∈ [126..376]`.
- **Cỡ Lữ khách chuẩn**: chiều cao đứng chuẩn = 28% chiều cao khung (`LU_KHACH_HEIGHT_RATIO = 0.28`, tương ứng `scale ≈ 1.3–1.44`, cao ~63–70 đơn vị; lệch > 25% sẽ bị cảnh báo vàng).

## 3. Các trường `stageScript` và giá trị hợp lệ (từ `stageScriptSchema.ts`)
- **Cấp gốc `stageScript`**: `sceneId`, `name`, `description`, `act1`, `act2AtPivot`, `act3Afterimage`, `redProp`, `tags`, `che_do`, `terrain`, `atmosphere`, `actors`, `props`, `camera`, `timeline`. Bắt buộc có `"che_do": "tu_do"`.
- **`terrain`**: `type` trong `flat`, `slope`, `hill`, `fork`, `water_shore`, `cliff_gap`, `stairs`, `custom_path`; kèm `y` (mặc định 352), `startX`, `endX`, `angleDeg`, `hillCenterX`, `hillHeight`, `hillWidth`, `forkAtX`, `forkAngleDeg`, `shoreX`, `waterSide` (`left`|`right`), `gapCenterX`, `gapHalfWidth`, `bridgeProgress`, `stepCount`, `stepRise`, `points` (`[[x,y],...]`), `customSvgD`, `segments[]` (`{ id, startX, endX, colorRole, strokeWidth, opacity }`).
- **`actors[]`**: `id`, `rig`, `x`, `yOffset`, `scale`, `facing`, `pose`, `leanDeg`, `sitProgress`, `opacity`, `colorRole`, `focusRole`, `showTeaCup`, `teaCupRed`, `seatedOn`, `seatedAtDesk`, `lookAtTarget`, `semanticLayer`, `role`, `ponytail`, `dissolveToCloud`, `layer`, `enterAt`, `leaveAt`, `fadeDuration`.
  - `pose`: `walk`, `stand`, `push`, `sit_lean`, `look_up`, `reach_out`, `hold_up`, `give` · `facing`: `left`, `right` · `layer`: `sky`, `far`, `mid`, `fore` · `role`: `lu_khach`, `nguoi_b`.
  - `x`: số trong `[62..478]` hoặc từ khoá `far_left`, `left`, `center_left`, `center`, `center_right`, `right`, `far_right`.
  - `colorRole`: `ink`, `secondary`, `accent` · `focusRole`: `hero`, `support`, `ambient` · `teaCupRed: true` làm chén cầm tay đổi đỏ (tính là 1 nguồn đỏ!).
- **`props[]`**: `id`, `type`, `variant`, `x`, `y`, `follow`, `layer`, `semanticLayer`, `anchorKind`, `placedOn`, `scale`, `rotate`, `opacity`, `colorRole`, `focusRole`, `drawProgress`, `morphProgress`, `splitProgress`, `floatAwayProgress`, `idle`, `emitters`, `anchorType`, `emitterOffset`, `tiltPivot`, `shapes`, `altShapes`, `saveAs`, `enterAt`, `leaveAt`, `fadeDuration`.
  - Dùng `type` sẵn trong kho (`references/thu-vien.md`) HOẶC tự vẽ mới bằng `shapes[]` / `altShapes[]` (đặt `type` tự do, kèm `anchorType`: `"ground"` | `"hand"` | `"center"`).
  - Quy ước toạ độ `y` của prop: CHỈ `layer: "sky"` dùng `y` tuyệt đối trong `[126..376]` (VD `y: 200` cho mây); mọi layer khác (`far`/`mid`/`fore`) dùng `y` là **độ lệch so với mặt đất `terrain.y`** (`y: 0` chạm đất, `y` âm là cao hơn mặt đất, VD `y: -28` cho cửa sổ trên tường).
  - `idle`: `none`, `float`, `bob`, `sway`, `pulse`, `drift` hoặc `{ type, speed, amplitude, spanX, spanY }` · `emitters`: `steam`, `pulseRing`, `spill`, `glow`, `colorRole`.
  - `drawProgress` (`0→1`) vẽ dần nét mọc ra; `morphProgress` (`0→1`) chuyển từ `shapes` sang `altShapes`; `splitProgress`, `floatAwayProgress` (`0→1`).
- **Cách vẽ `shapes[]` / `altShapes[]`**: `d`, `line`, `circle`, `rect`, `ellipse`, `fill`, `fillOpacity`, `role`, `strokeScale`, `dashed`, `show`, `splitSide`, `opacity`, `anim`.
  - Hình học: `d` (SVG path cục bộ; nếu `anchorType: "ground"`, gốc `(0,0)` nằm ngay mặt đất, vẽ hướng lên dùng `y` âm), `line: [x1,y1,x2,y2]`, `circle: [cx,cy,r]`, `rect: [x,y,w,h,rx?]`, `ellipse: [cx,cy,rx,ry]`.
  - Tô/nét (tuyệt đối không ghi mã màu hex): `fill` (`none`, `bg`, `ink`, `secondary`, `accent`), `fillOpacity` (`0..1`), `role` (`ink`, `secondary`, `accent`), `strokeScale`, `dashed`, `opacity`, `show` (`always`, `before_pivot`, `after_pivot`), `anim.type` (`spin`, `swing`, `bob`, `pulse`, `flutter`).
- **`atmosphere[]`**: `id`, `type`, `x`, `y`, `radius`, `count`, `direction`, `colorRole`, `focusRole`, `opacity`, `enterAt`, `leaveAt`, `fadeDuration` · `type`: `rain`, `wind`, `leaves`, `steam`, `birds`, `sun`, `hollow_sun`, `crescent`, `ring_pulse`. Lưu ý `colorRole: "accent"` hoặc `leaves` sau cú lật đều được tính là nguồn đỏ.
- **`camera`**: `zoom`, `panX`, `panY` (`zoom` trong `0.6..2.0`, `panX`, `panY`).
- **`timeline[]`**: `at`, `when`, `duration`, `exactDuration`, `target`, `x`, `toX`, `y`, `toY`, `yOffset`, `arcY`, `follow`, `scale`, `rotate`, `opacity`, `colorRole`, `variant`, `facing`, `pose`, `leanDeg`, `sitProgress`, `lookAtTarget`, `showTeaCup`, `dissolveToCloud`, `drawProgress`, `morphProgress`, `splitProgress`, `floatAwayProgress`, `emitters`, `bridgeProgress`, `strokeWidth`, `dropGravity`, `zoom`, `panX`, `panY`.
  - `at`: mốc `"start"`, `"line_1"`, `"line_2"`, `"line_3"`, `"line_4"`, `"pivot"`, `"end"`, hỗ trợ cộng/trừ giây (VD `"start+0.3s"`, `"pivot+0.15s"`, `"pivot+2.2s"`).
  - `duration`: thời lượng chuyển (giây, `0.05..15`) · `target`: `id` của actor/prop hoặc `"camera"` / `"terrain"`.

## 4. Máy kiểm tra Làn tự do (`validateFreeModeStageScript`, quét mỗi 0.25s)
> Không ép TEMPO, không đếm cử chỉ, không giới hạn đạo cụ trong kho — máy chỉ kiểm VỠ HÌNH:
### CHẶN CỨNG (khoá nút Nhập & chặn render)
- Không đúng 1 vật đỏ sau cú lật (0 nguồn đỏ hoặc ≥ 2 nguồn đỏ cùng lúc; đếm cả nguồn đỏ ngầm: `teaCupRed`, `props`/`actors`/`atmosphere` `colorRole: "accent"`, `leaves`, khói/emitter đỏ, đoạn đường đỏ).
- Hình vẽ, nhân vật, đạo cụ hoặc khí quyển tràn lên vùng tiêu đề (`y0 < 126`) hoặc tràn xuống vùng khối chữ (`y1 > 376`).
### CẢNH BÁO VÀNG (vẫn cho nhập; preview chụp đúng khung tại thời điểm `t`)
- Đè hoặc đi xuyên giữa hai vật cùng lớp sâu (`nen`/`giua`/`truoc`) hoặc giữa nhân vật với vật.
- Vật hoặc nhân vật lơ lửng / lệch mặt đất > 3 đơn vị mà không có mặt đỡ bên dưới (trừ vật lớp `sky` / treo tường / cầm tay / `anchorType: "center"|"hand"`).
- Nhân vật ở tư thế ngồi (`sit_lean` / `sitProgress >= 0.5`) nhưng không có mặt ngồi bên dưới.
- Cỡ Lữ khách chính lệch > 25% so với chuẩn 28% chiều cao khung (`LU_KHACH_HEIGHT_RATIO`).
- Diện tích vật đỏ ở khung cuối nhỏ hơn ngưỡng nhìn rõ (`MIN_RED_AREA_PX2 = 2000`).
