# Sổ Tay Vật Lý Sân Khấu, Tọa Độ & Mẫu Code Lớp 1 / Lớp 2 — Trà Nguội V8.5

Tài liệu tra cứu đính kèm trong **Knowledge / Project Files** của ChatGPT để xuất gói JSON `CupBundle V8.5` chính xác 100% cho **Trà Nguội Web Studio**.

---

## 1. Hệ tọa độ sân khấu (`STAGE_VIEWBOX = "62 126 416 250"`)
- **Trục ngang X**: `62 .. 478`, tâm khung hình tại `X = 270`. Vùng an toàn tuyệt đối trên màn hình dọc `9:19.5` là `X = 105 .. 435`.
- **Từ khóa X (trong `stageScript`)**: `"far_left"` (115), `"left"` (175), `"center_left"` (225), `"center"` (270), `"center_right"` (315), `"right"` (365), `"far_right"` (425) — hoặc truyền số trực tiếp.
- **Trục dọc Y**:
  - Mặt đất chuẩn: `Y = 348 .. 352`.
  - Bầu trời phía trên: `Y = 140 .. 260`.
  - Trong `stageScript` (`anchorType: "ground"`): `y = 0` chạm đúng mặt đất, số **âm** hướng lên trời (`y = -62` cao hơn mặt đất `62px`).

---

## 2. Hình học Nhân vật `CloakedTraveler` & Công thức Bàn tay Chính xác
- **Kích thước cơ bản** (`scale = 1.0`):
  - Chân chạm đất tại `y = 0`, đỉnh đầu tròn tại `y = -48.2 * scale` (khi ngồi `sitProgress = 1` đỉnh đầu hạ xuống `y = -34.4 * scale`), bề ngang thân áo `±9 * scale`.
  - Trong `scene.tsxCode`, nên đặt `scale = 1.22 .. 1.32` (`solidFill={true}`) để nhân vật nổi bật, cân đối trên điện thoại.
- **Chữ ký Props chuẩn của `CloakedTraveler`** (`../../kit/CloakedTraveler`):
  ```tsx
  <CloakedTraveler
    x={heroX}
    y={groundY}
    scale={1.28}
    facing='right' // 'left' | 'right'
    pose='give' // 'walk' | 'stand' | 'push' | 'sit_lean' | 'look_up' | 'reach_out' | 'hold_up' | 'give'
    poseWeights={{ lookUp: 0, reachOut: 0, give: 1, holdUp: 0, push: 0 }}
    leanDeg={heroLean}
    sitProgress={0}
    walkPhase={t * 4.4}
    walkActivity={heroWalkAct} // 0..1 (chỉ > 0 khi thực sự di chuyển X để chân bước khớp quãng đường)
    breathPhase={t * 1.9}
    color={palette.inkPrimary}
    accentColor={cinnabar}
    bgColor={palette.background}
    solidFill={true}
    strokeWidth={strokeWidth}
    opacity={heroFade}
  />
  ```
- **Công thức lượng giác khóa cứng đạo cụ vào đúng lòng bàn tay `give`** (khi `facing='right'`):
  ```tsx
  const heroRad = (heroLean * Math.PI) / 180;
  const localHandX = 17.5 * Math.cos(heroRad) + 12.8 * Math.sin(heroRad);
  const localHandY = -11 + 17.5 * Math.sin(heroRad) - 12.8 * Math.cos(heroRad);
  const handX = heroX + localHandX * heroScale;
  const handY = groundY + localHandY * heroScale;
  ```
  *(Nếu `facing='left'`, đổi dấu thành `heroX - localHandX * heroScale`).*

---

## 3. Hợp đồng Kiểu dữ liệu Lớp 2 (`scene.tsxCode`) — Biên dịch sạch `tsc --noEmit`

Khi nhúng `"scene": { "sceneId": "CUSTOM_TEN_CANH", "name": "...", "act1": "...", "act2AtPivot": "...", "act3Afterimage": "...", "redProp": "...", "tsxCode": "..." }` trong JSON `CupBundle V8.5`:

- **Chỉ sử dụng các import có sẵn trong dự án**:
  - `import React from 'react';`
  - `import { interpolate, Easing } from 'remotion';`
  - `import { evolvePath } from '@remotion/paths';`
  - `import type { ArchetypeComponentProps } from '../../components/archetypes/types';`
  - `import { CloakedTraveler } from '../../kit/CloakedTraveler';`
  - `import { RisingSteam, WindBreeze, SlowRain, FallingLeaves, CelestialBody } from '../../kit/Atmosphere';`
- **Thuộc tính có sẵn trong `ArchetypeComponentProps`**:
  - `state`: `{ frame, fps, drawProgress, act1Progress, beat1StopClear, beat2SettleGlow, beat3LingeringWalk, seamlessLoopBlend, continuousPhase }`
  - `palette`: `{ id, background, inkPrimary, inkSecondary, accent, accentProp, surfaceSubtle }` -> luôn lấy Đỏ Chu Sa bằng `const cinnabar = palette.accentProp || palette.accent;`
  - `strokeWidth`: `number`
  - `frame`: `number`, `fps`: `number`, `durationInFrames`: `number`
  - `timeline`: `{ pivotFrame, allTextFinishedFrame, durationInFrames, recommendedCoverFrame, segmentTimings }` (trong đó `timeline.segmentTimings[i]?.startFrame` cho biết chính xác frame bắt đầu dòng thơ thứ `i + 1`).
- **Quy tắc Bắt buộc trong `tsxCode`**:
  1. Khai báo đúng dạng `export const CustomTenCanhScene: React.FC<ArchetypeComponentProps> = ({ state, palette, strokeWidth, frame, fps, timeline }) => { ... };`.
  2. `<svg width={552} height={498} viewBox='62 126 416 250' style={{ overflow: 'visible', background: 'transparent' }}>` — tuyệt đối **không vẽ `<rect>` nền đặc** để tương thích cả nền sáng lẫn nền tối Dark Mode.
  3. Nhân mọi độ mờ (`opacity`) và tiến độ nét cọ mặt đất với `const loopFade = 1 - state.seamlessLoopBlend;` để cuối video tự thu hồi mượt về trang giấy trắng khi lặp vòng.
  4. Dùng dấu nháy đơn `'...'` xuyên suốt trong `tsxCode` để chuỗi JSON bên ngoài không bị lỗi dấu ngoặc kép `"`.

---

## 4. Cú pháp Lớp 1 (`stageScript` + `customProps`) cho cảnh đơn giản

- **26 đạo cụ dựng sẵn (`prop.type`)**:
  `envelope`, `bridal_veil`, `dashed_heart`, `solid_heart`, `wine_jar`, `small_cup`, `rice_bowl`, `tall_cup`, `boulder`, `box_stack`, `umbrella`, `bench`, `street_lamp`, `warm_house`, `city_skyline`, `small_boat`, `kite`, `paper_plane`, `bare_tree`, `sprout`, `campfire`, `lantern`, `seesaw`, `hourglass`, `chat_bubble`, `cloud_wisp`.
- **Vẽ SVG tối giản trong `customProps`** (`shapes` ở Hồi 1 -> `altShapes` khi `morphProgress: 1` ở Hồi 2):
  - 5 hình cơ bản: `d`, `rect: [x, y, w, h, rx?]`, `circle: [cx, cy, r]`, `ellipse: [cx, cy, rx, ry]`, `line: [x1, y1, x2, y2]`.
  - Token màu tự thích nghi Sáng/Tối: `"ink"`, `"secondary"`, `"accent"`, `"bg"`, `"none"`.
  - Khắc nét âm bản tách khối trên mảng đặc (`isNegativeCarve`): `{ "d": "...", "fill": "bg", "fillOpacity": 0, "strokeScale": 0.55 }`.
  - Khớp động con `anim`: `{ "type": "spin" | "swing" | "flutter" | "bob" | "pulse", "pivot": [cx, cy], "speed": 1, "amplitude": 6, "phase": 0, "driveByMotion": true }`.
- **Biểu thức thời gian (`at`, `enterAt`, `leaveAt`)**: `"start"`, `"0.95s"`, `"line_1"`, `"line_2"`, `"line_3-0.15s"`, `"last_line"`, `"pivot"`, `"pivot+0.15s"`, `"text_done"`.
