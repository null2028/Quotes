# PHẦN 5: NGUỒN, PHIÊN BẢN & ĐỐI CHIẾU TÀI LIỆU MÂU THUẪN / LỖI THỜI (SOURCES, VERSIONS & CONFLICTS)

> **Toàn bộ 20 tệp mã nguồn core, schema, dữ liệu đạo cụ, kịch bản và tài liệu đã được kiểm tra bảo mật (0 API key, 0 token, 0 mật khẩu) và đóng gói nguyên bản trong thư mục [`src_snapshot/`](src_snapshot/) kèm danh mục [`file_inventory_and_conflicts.json`](file_inventory_and_conflicts.json).**

---

## 5.1. Danh mục Tệp Mã nguồn & Tài liệu Đang Chạy Hiện Nay — `[Đã xác minh trong code]`

| Đường dẫn Tệp (Bấm để mở bản chụp trong `src_snapshot/`) | Ngày cập nhật cuối | Quy mô | Vai trò thực tế đang chạy trong Hệ thống (V8.6.1) | Số khóa nhạy cảm phát hiện/ẩn |
| :--- | :---: | :---: | :--- | :---: |
| [`src/stage/stageScriptSchema.ts`](src_snapshot/src/stage/stageScriptSchema.ts) | `2026-11-14 10:41:15` | `344 dòng` (`11367 B`) | Zod Schema cho StageScript, ActorSpec, PropSpec, InlineShape, TimelineCue, Terrain, Atmosphere | `0` |
| [`src/stage/terrainSystem.ts`](src_snapshot/src/stage/terrainSystem.ts) | `2026-11-17 12:02:53` | `694 dòng` (`22267 B`) | Hệ tọa độ STAGE_VIEWBOX (62 126 416 250), DEFAULT_GROUND_Y (352), X_KEYWORD_MAP, 8 địa hình Terrain | `0` |
| [`src/stage/timeResolver.ts`](src_snapshot/src/stage/timeResolver.ts) | `2026-11-11 09:51:50` | `164 dòng` (`4988 B`) | Bộ giải mã thời điểm cue (line_N, pivot, actN:%, offsets) & evaluateEnterLeaveMultiplier | `0` |
| [`src/stage/trackCompiler.ts`](src_snapshot/src/stage/trackCompiler.ts) | `2026-11-17 12:10:44` | `1799 dòng` (`51614 B`) | Bộ biên dịch đường chạy nhân vật/đạo cụ, 4 Pha Khai Bút V8.6.1, Socket neo & resolveCinemagraphDurationFrames | `0` |
| [`src/stage/DeclarativeStagePlayer.tsx`](src_snapshot/src/stage/DeclarativeStagePlayer.tsx) | `2026-11-17 12:09:23` | `823 dòng` (`26509 B`) | Trình render SVG sân khấu, thứ tự Z-order các lớp sky/far/mid/fore, màu mặc định Atmosphere & Loop Blend | `0` |
| [`src/stage/propCatalog.tsx`](src_snapshot/src/stage/propCatalog.tsx) | `2026-11-17 12:02:57` | `1689 dòng` (`50010 B`) | Danh mục 26 đạo cụ Built-In, thuật toán measurePropBounds, Two-Phase Stroke-Then-Wash & Shape Anim | `0` |
| [`src/kit/CloakedTraveler.tsx`](src_snapshot/src/kit/CloakedTraveler.tsx) | `2026-11-17 12:07:23` | `532 dòng` (`18207 B`) | Bộ xương 2-Bone IK nhân vật Lữ Khách Áo Choàng, cột sống Bézier 2 đoạn & tọa độ ngồi/đứng | `0` |
| [`src/theme/palettes.ts`](src_snapshot/src/theme/palettes.ts) | `2026-11-17 14:11:55` | `118 dòng` (`6948 B`) | 3 bảng màu chuẩn (MINIMAL_LIGHT, MINIMAL_DARK, WARM_NOIR) & lưới Swiss Grid 1080x1920 | `0` |
| [`src/schemas/videoSchema.ts`](src_snapshot/src/schemas/videoSchema.ts) | `2026-11-17 10:29:54` | `162 dòng` (`4936 B`) | Zod Schema tổng thể cho VideoInputProps, VisualDNA, MotionConfig, BGM | `0` |
| [`src/engine/visualDnaResolver.ts`](src_snapshot/src/engine/visualDnaResolver.ts) | `2026-11-14 15:33:52` | `499 dòng` (`16544 B`) | Bộ giải mã 4 Layout Geometry, quy tắc hạ cấp ASYMMETRIC_THIRD & kiểm tra trùng lặp VisualDNA | `0` |
| [`src/engine/timelineSync.ts`](src_snapshot/src/engine/timelineSync.ts) | `2026-11-14 12:59:25` | `356 dòng` (`10243 B`) | Thuật toán tính thời lượng động theo âm tiết tiếng Việt, thời điểm xuất hiện từng dòng thơ & Pivot | `0` |
| [`src/engine/motionPhysics.ts`](src_snapshot/src/engine/motionPhysics.ts) | `2026-11-17 12:01:28` | `261 dòng` (`7750 B`) | Vật lý chuyển động đường chân trời (2.2s), tan biến kết thúc (1.35s) & nối vòng lặp (1.5s) | `0` |
| [`src/automation/validator.ts`](src_snapshot/src/automation/validator.ts) | `2026-11-11 08:57:55` | `96 dòng` (`3097 B`) | Kiểm tra điều kiện pivotWord (Gate 1) & độ tương phản chuyển động stateA/stateB (Gate 2) | `0` |
| [`src/automation/geminiBundleBridge.ts`](src_snapshot/src/automation/geminiBundleBridge.ts) | `2026-11-17 14:19:54` | `2070 dòng` (`82927 B`) | Bộ chuẩn hóa CupBundle V8.6, auditStageVisualLayout & GEMINI_GEM_SYSTEM_PROMPT V8.6.1 | `0` |
| [`server/renderQueueService.ts`](src_snapshot/server/renderQueueService.ts) | `2026-11-17 10:37:10` | `505 dòng` (`17572 B`) | Dịch vụ hàng đợi render Remotion MP4 1 tệp duy nhất & đồng bộ trạng thái Chén | `0` |
| [`data/custom-props.json`](src_snapshot/data/custom-props.json) | `2026-11-17 16:08:24` | `6486 dòng` (`142126 B`) | Kho 96 đạo cụ Custom SVG do người dùng/AI định nghĩa | `0` |
| [`data/stage-scripts.json`](src_snapshot/data/stage-scripts.json) | `2026-11-17 16:08:24` | `10845 dòng` (`281464 B`) | Kho kịch bản sân khấu StageScript hiện có (34 kịch bản) | `0` |
| [`CONTEXT.md`](src_snapshot/CONTEXT.md) | `2026-11-13 14:51:31` | `53 dòng` (`8386 B`) | Tài liệu kiến trúc cũ (V8.3.1 - dùng để đối chiếu mâu thuẫn tài liệu) | `0` |
| [`qa-artifacts-ci/ENGINE_ACCEPTANCE_REPORT_V8.5.md`](src_snapshot/qa-artifacts-ci/ENGINE_ACCEPTANCE_REPORT_V8.5.md) | `2026-11-14 15:37:57` | `147 dòng` (`20787 B`) | Báo cáo nghiệm thu V8.5 (dùng để đối chiếu các thông số đã thay đổi ở V8.6.1) | `0` |
| [`qa-artifacts-ci/QA_GATES_1_2_REPORT.md`](src_snapshot/qa-artifacts-ci/QA_GATES_1_2_REPORT.md) | `2026-11-15 12:00:40` | `50 dòng` (`4694 B`) | Báo cáo kiểm thử tự động Gate 1 & Gate 2 | `0` |

---

## 5.2. Bảng Đối chiếu Các Tài liệu / Prompt Mâu thuẫn hoặc Đã Lỗi Thời — `[Đã xác minh trong code]`

Qua đối chiếu trực tiếp giữa mã nguồn đang chạy (`src/`, cập nhật `2026-11-17`) và các tệp tài liệu/prompt trong kho lưu trữ, dưới đây là **7 điểm mâu thuẫn / lỗi thời cần lưu ý khi Audit**:

| STT | Nội dung / Thông số | Tài liệu cũ / Prompt ghi gì? | Thực tế Code đang chạy (`[Đã xác minh trong code]`) | Tác động nếu tin theo tài liệu cũ |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Hệ bảng màu (`Theme Palettes`)** | `CONTEXT.md` (dòng 35, cập nhật `2026-11-13`) ghi mặc định là `SLATE_CALM`. `ENGINE_ACCEPTANCE_REPORT_V8.5.md` (cập nhật `2026-11-14`) ghi hệ thống có **5 bảng màu** (`MINIMAL_LIGHT`, `MINIMAL_DARK`, `WARM_NOIR`, `SLATE_CALM`, `DARK_CONTEMPLATIVE`). | Trong `src/theme/palettes.ts` (dòng 16–87) và `src/schemas/videoSchema.ts` (dòng 9, cập nhật `2026-11-17`), `SLATE_CALM` và `DARK_CONTEMPLATIVE` **đã bị xóa bỏ**. Hiện chỉ còn đúng **3 bảng màu**: `MINIMAL_LIGHT`, `MINIMAL_DARK`, `WARM_NOIR`. | Nếu truyền `"palette": "SLATE_CALM"` hoặc `"DARK_CONTEMPLATIVE"` vào `VideoInputSchema.parse()`, Zod sẽ báo lỗi từ chối render. |
| **2** | **Tọa độ Lưới Swiss Grid (`headerLeft`, `headerWidth`, `typographyMaxWidth`)** | `ENGINE_ACCEPTANCE_REPORT_V8.5.md` (dòng 38) ghi `headerLeft = 158`, `headerWidth = 674`, `typographyMaxWidth = 636`. | Trong `src/theme/palettes.ts` (dòng 94–104) và `src/engine/visualDnaResolver.ts` (dòng 160–245), lưới thực tế là **`headerLeft = 132`, `headerWidth = 816`, `quoteBlockWidth = 700`, `typographyMaxWidth = 678`** (riêng `ASYMMETRIC_THIRD` là `642`). | Tính sai vùng căn lề trái/phải giữa sân khấu và khối chữ. |
| **3** | **Thời lượng Video (`Duration`)** | `CONTEXT.md` (dòng 34) ghi thời lượng khóa cứng `900 frames` (`15.0s` @ `60fps`). | Trong `src/engine/timelineSync.ts` (`computeDynamicDurationFrames`, dòng 104–142), khi `durationMode: "AUTO_SEED"`, thời lượng tính động theo số âm tiết từ **`13.0s` (`780f`) đến `16.0s` (`960f`)**. | Các cue đặt theo giây tuyệt đối ở cuối video (ví dụ `14.5s`) có thể vượt quá độ dài thực của các bài thơ ngắn (`13.2s`). |
| **4** | **Đầu ra file MP4 khi Render (`Dual MP4 vs Single MP4`)** | `CONTEXT.md` (dòng 48) ghi xuất song song 2 file MP4 vào `videos/` và `videos/seo-master/`. | Trong `server/renderQueueService.ts` (dòng 198–260), hệ thống hiện chỉ render **1 file MP4 duy nhất** tại `output/quote-XXX/Chén XX - Tiêu đề.mp4`. | Tìm file trong `videos/seo-master/` sẽ không thấy. |
| **5** | **Tên ID đạo cụ nội thất trong `GEMINI_GEM_SYSTEM_PROMPT`** | `GEMINI_GEM_SYSTEM_PROMPT` (`src/automation/geminiBundleBridge.ts` dòng 881, 899, 974) hướng dẫn dùng `"type": "stool"` và `"type": "low_tea_table"`. | Cả `"stool"` lẫn `"low_tea_table"` **đều không tồn tại** trong `BUILT_IN_PROP_CATALOG` và `data/custom-props.json` (tên thật là `"office_stool"`, `"std_chair"`, `"std_tea_table"`). | Kịch bản sinh theo prompt mẫu bị **tàng hình ghế/bàn** (như đã xảy ra ở `SCRIPT_P032_QUYET_TAM_3_GIAY`). |
| **6** | **Các trường điều khiển `TimelineCue` trong Prompt/Tài liệu** | Prompt/tài liệu cũ đề cập tới `toScale`, `headTilt`, `handTarget`, `reachProgress`, `easing` trong `TimelineCue`. | `TimelineCueSchema` (`src/stage/stageScriptSchema.ts` dòng 153–179) **chỉ chấp nhận** `scale`, `toX`, `x`, `toY`, `y`, `yOffset`, `action`, `propAction`, `colorRole`, `morph`, `split`, `floatAway`, `dissolveToCloud`, `opacity`. Các trường lạ bị Zod strip bỏ. | Viết `"toScale": 1.25` hoặc `"handTarget": [210, 320]` trong `timeline` sẽ bị bỏ qua hoàn toàn. |
| **7** | **Schema `v2-sandbox` (`quote.lines`) vs `CupBundle V8.6` (`quote.segments`)** | Một số bản nháp skill cũ dùng cấu trúc `v2-sandbox` với `quote.lines`. | `sanitizeAndNormalizeCupBundle` (`src/automation/geminiBundleBridge.ts` dòng 261–340) bắt buộc mảng **`quote.segments: ["Dòng 1", "Dòng 2", ...]`**. Nếu truyền `quote.lines` mà thiếu `segments`, Studio báo lỗi `"Thiếu nội dung câu chữ (segments)"`. | Không nạp được JSON vào Trà Nguội Web Studio. |
