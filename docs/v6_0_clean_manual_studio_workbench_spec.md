# V6.0 Specification: Trà Nguội Workbench — Bàn Tinh Chỉnh & Xuất Phim Thuần Khiết (Zero-AI, Direct Bundle Import & Live Sliders)

> **Mục đích tài liệu (`V6_0_CLEAN_MANUAL_WORKBENCH_SPEC.md`):** Tài liệu này hướng dẫn AI Coding Agent (Antigravity) tái cấu trúc gọn ghẽ `/Volumes/Data/Quotes` thành một **Công Cụ Nhận Input, Tinh Chỉnh Thời Gian Thực & Xuất MP4 Thuần Khiết (100% Zero-AI)**:
> 1. **Gỡ bỏ toàn bộ 100% các module AI sáng tạo, API Keys, Prompt Lab và các cảnh thử nghiệm lỗi.**
> 2. **Tối giản hóa giao diện Web (`http://localhost:3300`)** thành một bàn dựng phim thủ công sạch tinh tươm, tốc độ tức thì, không bao giờ lỗi.
> 3. **Mở cổng "📥 Nạp Gói Đạo Diễn (`Cup Bundle JSON`)" & "Ô Dán/Sửa Code Cảnh `.tsx`"**, kết hợp **4 Thanh Trượt Tinh Chỉnh Tức Thì (`Offset X`, `Offset Y`, `Scale`, `Độ đậm Khí quyển`)** để người dùng vi chỉnh bố cục trực tiếp bằng chuột ở 60fps trước khi bấm Render MP4.

## 1. Danh Mục Cắt Bỏ (`DROP`) vs. Giữ Lại (`KEEP`)

### 1.1. Xóa Bỏ Hoàn Toàn (100% Zero-AI & Dọn Rác)
* **Xóa toàn bộ các file AI trên Backend:**
  * `server/aiProviders.ts`, `server/quoteWriterService.ts`, `server/vaultMatcherService.ts`, `server/sceneGeneratorService.ts`, `server/visualCriticService.ts`, `server/directorLabService.ts`, thư mục `server/pipeline/`.
  * Xóa `data/ai-settings.json`, `data/prompts.json`, `data/prop-vault.json`.
  * Gỡ các route `/api/ai/*`, `/api/director/*`, `/api/prompts/*` khỏi `server/index.ts`.
* **Xóa toàn bộ thành phần AI trên Frontend (`studio-ui/`):**
  * Xóa nút/modal Cấu hình AI Keys, Prompt Lab, ngăn AI Pha Trà, các nút AI Gợi ý / AI Đạo diễn / Live Tweak bằng AI.
* **Dọn sạch các cảnh nháp thử nghiệm lỗi:**
  * Xóa các file cảnh thử nghiệm lỗi trước đó của Chén 04–07 trong `src/scenes/custom/` và `src/kit/props/generated/`, cập nhật lại `src/scenes/vaultIndex.ts` và `data/vault-meta.json` chỉ giữ lại bộ 12 cảnh chuẩn gốc sạch đẹp (như `BOULDER_TO_BENCH` của *Chén 01*, `RAIN_UMBRELLA_PARTING` của *Chén 02*, `AUTUMN_LEAF_ACCEPTANCE` của *Chén 03*...).

### 1.2. Giữ Lại Nguyên Vẹn & Cố Định Làm Hợp Đồng Chuẩn (`KEEP & LOCK`)
* **Động cơ Đồ họa, Chữ & Âm thanh V2.5:**
  * Bố cục chuẩn TikTok `1080×1920 @ 60fps` (cột nội dung `816px`, Safe Zone phải `192px`, đáy `380px`).
  * `AdaptiveTypography.tsx` (hiệu ứng chữ sương mù `Editorial Mist Reveal`, vạch đọc Đỏ Gạch trượt mượt, tự co cỡ chữ giữ trọn dòng thơ, con dấu `• TRÀ NGUỘI`).
  * 4 Bảng màu chuẩn trong `src/styles/palettes.ts` (`MINIMAL_LIGHT`, `MINIMAL_DARK`, `WARM_SEPIA`, `COOL_NIGHT`).
  * `timelineSync.ts` & `motionPhysics.ts` (nhịp chậm khoan thai 3 Hồi đồng bộ chính xác với `pivotWord`).
  * `audioService.ts` & `renderQueueService.ts` (quản lý kho nhạc `.mp3`, upload nhạc, cắt `startFromSec`, fade-in `1.2s` / fade-out `2.2s`, xuất `.mp4` H.264 CRF 18 + ảnh bìa `-thumb.png`).
* **Khóa Cố Định "Hợp Đồng Import Cho Mọi Cảnh `.tsx` Mới" (`Fixed Scene Kit Contract`):**
  Đảm bảo các module sau giữ nguyên đường dẫn và chữ ký hàm để mọi đoạn code `.tsx` được viết từ bên ngoài dán vào đều biên dịch thành công 100%:
  * `src/archetypes/types.ts` $\rightarrow$ `ArchetypeComponentProps`
  * `src/kit/CloakedTraveler.tsx` $\rightarrow$ `CloakedTraveler` (hỗ trợ `x`, `y`, `scale`, `facing`, `pose`, `walkPhase`, `leanDeg`, `sitProgress`, `color`, `accentColor`, `opacity`, `showTeaCup`)
  * `src/kit/Atmosphere.tsx` $\rightarrow$ `SlowRain`, `WindBreeze`, `FallingLeaves`, `RisingSteam`, `DistantBirds`, `CelestialBody`, `NotificationRings`
  * `src/kit/SlowMotionVerbs.ts` $\rightarrow$ `computeCoupledWalk`, `levitateWeightless`, `slowEmergence`, `recedeToMemory`, `gentleSwayDeg`, `slowScrollOffset`

## 2. Ba Nâng Cấp Mới Cho Luồng Nhập Liệu, Tinh Chỉnh & Render

### 2.1. Bổ Sung 4 Tham Số Tinh Chỉnh Sân Khấu Tức Thì (`stageTuning` trong `videoSchema.ts` & `MotionStageRouter.tsx`)
Thêm object tùy chọn `stageTuning` vào `VideoInputSchema` (`src/schemas/videoSchema.ts`) để người dùng kéo thanh trượt trên UI là hình trên `<Player>` dịch chuyển/phóng to ngay lập tức ở 60fps mà không cần sửa code `.tsx` (và khi xuất MP4 cũng áp dụng y hệt 100%):

```typescript
export const StageTuningSchema = z.object({
  offsetX: z.number().min(-120).max(120).default(0),      // Dịch ngang toàn cụm diễn xuất (px)
  offsetY: z.number().min(-80).max(80).default(0),        // Dịch dọc toàn cụm diễn xuất (px)
  scale: z.number().min(0.65).max(1.5).default(1.0),      // Thu phóng tỷ lệ cảnh (0.65x -> 1.50x)
  strokeScale: z.number().min(0.7).max(1.4).default(1.0), // Độ đậm mảnh nét vẽ tùy chỉnh nhẹ
});
```
Trong `src/components/MotionStageRouter.tsx`, bọc cảnh bên trong một thẻ `<g>` nhận `stageTuning`:
```tsx
const tuning = props.stageTuning ?? { offsetX: 0, offsetY: 0, scale: 1, strokeScale: 1 };
// Tâm thu phóng đặt tại chính giữa vùng diễn xuất (270, 300)
<g
  style={{
    transform: `translate(${tuning.offsetX}px, ${tuning.offsetY}px) translate(270px, 300px) scale(${tuning.scale}) translate(-270px, -300px)`,
  }}
>
  <SelectedSceneComponent {...sceneProps} />
</g>
```

### 2.2. Chuẩn Hóa Định Dạng "Gói Đạo Diễn (`CupBundleImport`)" & API Nạp Nhanh (`server/sceneManagerService.ts`)
Tạo `server/sceneManagerService.ts` (không dùng bất kỳ AI nào) cung cấp 3 API quản lý cảnh và gói dữ liệu:

1. **`POST /api/bundles/import` — Nạp Trọn Bộ 1 Chén Từ JSON Duy Nhất:**
   Nhận payload chuẩn sau (để người dùng copy từ khung chat bên ngoài dán 1 phát vào Web UI):
   ```json
   {
     "cupId": "quote-007",
     "title": "Về",
     "textFormat": "POEM",
     "segments": [
       "Ta về với mẹ ta thôi",
       "Xa nơi phố thị chơi vơi bộn bề",
       "Về nghe gió thổi đồng quê",
       "Mùi rơm mới ủ đêm hè ngát hương"
     ],
     "pivotWord": "Mùi rơm",
     "themeVariant": "MINIMAL_DARK",
     "targetDurationSeconds": 15,
     "stageTuning": { "offsetX": 0, "offsetY": 0, "scale": 1.0, "strokeScale": 1.0 },
     "scene": {
       "sceneId": "CUSTOM_VE_NHA_ME_DEM_HE",
       "name": "Về Nhà Mẹ Đêm Hè",
       "description": "Rời đường chân trời phố thị xa mờ bên trái về bên mái nhà quê sáng ô cửa Đỏ Gạch dưới trăng hè.",
       "tsxCode": "import React from 'react'; ... export const CustomVeNhaMeDemHeScene: React.FC<ArchetypeComponentProps> = ..."
     }
   }
   ```
   **Xử lý tự động trong 1 giây:**
   * Nếu có `scene.tsxCode`: Tự động trích xuất tên component `export const <ComponentName>`, lưu vào `src/scenes/custom/<ComponentName>.tsx`, đăng ký vào `src/scenes/vaultIndex.ts` + `data/vault-meta.json`, chạy kiểm tra nhanh `npx tsc --noEmit` (nếu có lỗi cú pháp, trả thông báo lỗi dòng cụ thể về UI và rollback an toàn để không làm sập Vite!).
   * Tạo mới (hoặc cập nhật nếu trùng `cupId`) bản ghi trong `data/cups.json` và trả về Chén vừa tạo để UI chọn mở ngay trên `<Player>`.

2. **`POST /api/scenes/upsert` — Dán / Cập Nhật Riêng Code `.tsx` Cho Cảnh:**
   * Nhận `{ sceneId, name, description, tsxCode, cupId? }`.
   * Cho phép người dùng dán code cảnh mới hoặc sửa trực tiếp code `.tsx` của cảnh đang chọn ngay trên UI $\rightarrow$ kiểm tra `tsc --noEmit` $\rightarrow$ Vite HMR tự động làm mới `<Player>` trong 0.5 giây!

3. **`GET /api/scenes/:sceneId/code` & `DELETE /api/scenes/:sceneId`:**
   * Đọc nội dung code `.tsx` hiện tại của một custom scene lên ô Code Editor trên UI để người dùng xem/chỉnh thông số nếu muốn.
   * Xóa sạch một custom scene không dùng khỏi `src/scenes/custom/`, `vaultIndex.ts` và `vault-meta.json` (chỉ cho xóa cảnh `CUSTOM_*`, bảo vệ 12 cảnh gốc).

## 3. Thiết Kế Lại Giao Diện Web Tinh Gọn 3 Cột (`studio-ui/`)

Giao diện `http://localhost:3300` giữ thẩm mỹ Giấy Trà Ấm thanh lịch, loại bỏ hoàn toàn các nút rối mắt và bố trí 3 cột trực quan:

1. **Thanh Topbar Gọn Sạch:**
   * Logo **`TRÀ NGUỘI WORKBENCH`** · Trạng thái Kho Cảnh (`N cảnh chuẩn`).
   * Nút chính nổi bật bên phải: **`📥 Nạp Gói Đạo Diễn (Paste JSON)`** (mở modal có ô Textarea lớn để dán nguyên gói JSON + nút *"Kiểm tra & Nạp ngay"*).

2. **Cột Trái (`270px` — Danh Sách Chén Trà):**
   * Nút **`+ Tạo Chén Trống`**, bộ lọc `Tất cả / Nháp / Đã xuất`.
   * Danh sách các Chén (hiển thị Mã Chén, Tiêu đề, câu đầu, chấm trạng thái MP4 và nút Nhân bản / Xóa Chén).

3. **Cột Giữa (Bàn Tinh Chỉnh Thủ Công 3 Ngăn Rõ Ràng):**
   * **Ngăn 1 — Biên Tập Câu Chữ & Từ Khóa `pivotWord`:**
     - Ô sửa Tiêu đề Chén, công tắc `Thơ (POEM)` / `Văn xuôi (PROSE)`.
     - Các dòng câu chữ (thêm/xóa/kéo sắp xếp dòng).
     - Dãy nút bấm chọn nhanh từ khóa **`pivotWord`** ở câu kết (hiển thị rõ mốc giây `pivotTimeSec` được tính tự động, ví dụ: *"Kích hoạt Hồi II tại giây 7.6s"*).
   * **Ngăn 2 — Chọn Cảnh, Tinh Chỉnh Bố Cục & Code `.tsx`:**
     - Dropdown chọn Cảnh từ **Kho Cảnh Chuẩn** (kèm mô tả ngắn và nút 🗑️ Xóa nếu là cảnh `CUSTOM_*`).
     - ** Cụm 4 Thanh Trượt Vi Chỉnh Trực Tiếp (`Live Stage Tuning`):**
       * `Dịch Ngang (X)`: `-120px` $\leftrightarrow$ `+120px` (có nút `0` reset).
       * `Dịch Dọc (Y)`: `-80px` $\leftrightarrow$ `+80px`.
       * `Thu Phóng Cảnh (Scale)`: `0.65x` $\leftrightarrow$ `1.50x`.
       * `Độ Đậm Nét`: `0.70x` $\leftrightarrow$ `1.40x`.
     - Nút mở rộng **`</> Dán / Sửa Code Cảnh (.tsx)`**: Mở khung Code Editor gọn gàng hiển thị code `.tsx` của cảnh hiện tại (hoặc tạo cảnh mới) + nút **"Lưu & Biên dịch Cảnh"** (hiện thông báo xanh nếu `tsc` sạch hoặc báo rõ dòng lỗi nếu dán thiếu ngoặc).
   * **Ngăn 3 — Bảng Màu, Thời Lượng & Nhạc Nền:**
     - 4 ô chọn Bảng màu trực quan (`Giấy Trà Ấm`, `Than Trà Tối`, `Ô Long Cổ`, ` men Lam Đêm`).
     - Thanh chọn Thời lượng đích (`12s – 22s`, mặc định `15s`).
     - Chọn bài nhạc nền từ `assets/audio/` (kèm nút `+ Tải file .mp3 lên`), thanh kéo chọn giây bắt đầu `startFromSec` (nghe thử trực tiếp) và thanh `Âm lượng`.

4. **Cột Phải (`380px` — Live `<Player>` 60fps & Xuất Phim):**
   * Khung `<Player>` tỷ lệ 9:16 chạy mượt 60fps phản hồi tức thì mọi thao tác sửa chữ, kéo thanh trượt `X/Y/Scale`, đổi màu, đổi nhạc.
   * Công tắc bật/tắt **`📱 Lớp phủ TikTok Safe-Zone`**.
   * Nút lớn **`🎬 Xuất Video MP4 (1080×1920 · 60fps)`** kèm thanh tiến trình % thực tế và nút **Mở file / Tải về MP4 & Thumbnail** ngay khi hoàn tất!

## 4. Kiểm Tra Nghiệm Thu Cuối Cùng Trước Khi Bàn Giao

1. Đảm bảo `npm run typecheck` trên cả thư mục gốc và `studio-ui` đạt **0 lỗi**, không còn bất kỳ import nào trỏ tới các file AI đã xóa.
2. Kiểm thử API `POST /api/bundles/import` bằng một gói JSON mẫu để chắc chắn luồng *Paste JSON -> Ghi file `.tsx` -> Cập nhật `vaultIndex.ts` -> Live Reload `<Player>`* hoạt động mượt trong `< 1.5 giây`.
3. Khởi động sẵn `npm run app` tại `http://localhost:3300`.
