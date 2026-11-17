# PHẦN 4: DNA TRÀ NGUỘI, TRỤC BIẾN THỂ & CƠ CHẾ TRÁNH LẶP (DNA, VARIATION & DEDUPLICATION)

> **Dữ liệu nguồn đính kèm:**
> - Ma trận VisualDNA thực tế của toàn bộ 16 Chén (`quote-001` .. `quote-017`): [`dna_matrix_and_dedup_audit.json`](dna_matrix_and_dedup_audit.json)
> - Mã nguồn bộ giải mã DNA & chống lặp: [`../05_sources_and_code/src_snapshot/src/engine/visualDnaResolver.ts`](../05_sources_and_code/src_snapshot/src/engine/visualDnaResolver.ts) & [`../05_sources_and_code/src_snapshot/src/theme/palettes.ts`](../05_sources_and_code/src_snapshot/src/theme/palettes.ts)

---

## 4.1. Quy tắc Nhận diện Bắt buộc của Trà Nguội (`Mandatory Identity Locks`) — `[Đã xác minh trong code]`

Dù kịch bản thuộc bất kỳ motif nào trong 8 Concept kể chuyện, **6 hằng số nhận diện sau đây được khóa cứng trong Engine** để người xem lướt TikTok nhận ra ngay kênh **Trà Nguội (`@tranguoi.15s`)**:

| Hằng số Nhận diện (DNA Lock) | Giá trị khóa cứng trong Code | Nguồn xác minh |
| :--- | :--- | :--- |
| **1. Bộ 3 Bảng màu Thủ công (`Signature 3-Palette System`)** | Chỉ gồm 3 bảng màu: **`MINIMAL_LIGHT`** (Giấy Tuyên Thành `#F4F1EA` / Mực Tàu `#1A1917` / Chu Sa `#CE472E`), **`MINIMAL_DARK`** (Đêm `#121316` / Chữ `#ECE8DF` / Chu Sa `#D95338`), **`WARM_NOIR`** (Trà Đêm `#1A1614` / Chữ `#F2ECE1` / Chu Sa `#E05A3F`). | `src/theme/palettes.ts:28-87` & `src/schemas/videoSchema.ts:9` |
| **2. Nhân vật Lữ Khách Áo Choàng (`CloakedTraveler`)** | Đầu tròn đặc (`r = 6.6`), thân áo choàng hình chuông mềm (`fillOpacity = 0.88` khi `SOLID_SCENE`), cột sống Bézier 2 đoạn thở nhẹ và tay chân 2-Bone IK nét mảnh (`strokeWidth = 1.9`). Không vẽ mắt mũi miệng chi tiết. | `src/kit/CloakedTraveler.tsx:159-340` |
| **3. Điểm nhấn Đỏ Chu Sa tại Pivot (`Cinnabar Red Pivot Accent`)** | Toàn bộ sân khấu trước Pivot chỉ dùng nét `primary` (Mực Tàu) và `secondary` (Xám Khói). Đúng thời điểm `pivotFrame`, từ khóa `pivotWord` dưới phần chữ và đạo cụ trung tâm trên sân khấu cùng chuyển sang màu Đỏ Chu Sa (`accent`). | `src/stage/DeclarativeStagePlayer.tsx` & `src/components/TypographyBlock.tsx` |
| **4. Thanh Dọc Đỏ Chu Sa Bên Trái Khối Chữ (`Uniform Vertical Red Quote Rail`)** | Một đường kẻ dọc liền nét màu `palette.accent` bên trái toàn bộ các dòng thơ/quote, không đứt đoạn. | `src/components/TypographyBlock.tsx` |
| **5. Nhịp Khai Bút Thư Pháp Chậm Rãi (`Slow Calligraphic Opening 0.00s -> 3.80s`)** | Đường chân trời quét ngang trong `2.2s`, tiếp theo là 4 pha phác thảo nét rồi mới thấm mực (`Two-Phase Stroke-Then-Wash`), kết thúc bằng `1.35s` tan biến (`outroDissolve`) và `1.5s` nối vòng lặp (`loopBlend`). | `src/stage/trackCompiler.ts:940-1035` & `src/engine/motionPhysics.ts` |
| **6. Khoảng Trống Âm (`Ma` / Negative Space >= 65%)** | Khung sân khấu `STAGE_VIEWBOX = "62 126 416 250"` không bao giờ phủ kín nền; ánh sáng chỉ dùng các lớp hình học sắc nét (`zero-blur lighting`), tuyệt đối không dùng `feGaussianBlur` nặng. | `src/stage/DeclarativeStagePlayer.tsx` |

---

## 4.2. Những Yếu tố Có thể Thay đổi để Tạo Phiên bản Độc bản (`Variable Creative Axes`) — `[Đã xác minh trong code]`

Để mỗi video là một trải nghiệm riêng biệt (motif là quy luật kể chuyện, không phải mẫu cảnh cố định), hệ thống cung cấp **7 trục biến thiên độc lập**:

1. **Trục Bố cục Khung hình (`visualDNA.layout` — 4 lựa chọn)**:
   - `CLASSIC_TOP_STAGE` (Sân khấu mở phía trên, chữ phía dưới)
   - `SKY_QUOTE_BOTTOM_STAGE` (Chữ treo trên bầu trời, sân khấu ở nửa dưới)
   - `WINDOW_FRAME` (Sân khấu lồng trong vòm cửa sổ cong `WINDOW_ARCH`)
   - `ASYMMETRIC_THIRD` (Cửa sổ tròn lệch 1/3 trái `CIRCLE_MEDALLION`, tự động kiểm tra điều kiện `<= 28` âm tiết)
2. **Trục Chế độ Nét & Mảng (`visualDNA.shotMode` — 3 lựa chọn)**:
   - `SOLID_SCENE` (Nhân vật áo choàng đặc `fillOpacity = 0.88`, tương phản cao)
   - `BRUSH_DRAW` (Nhân vật và đạo cụ thiên về nét phác thủy mặc thanh mảnh)
   - `MACRO_PROP` (Cận cảnh đạo cụ trung tâm phóng lớn `cameraScale * 1.24`)
3. **Trục Ánh sáng Không gian (`visualDNA.lightingGobo` — 4 lựa chọn)**:
   - `NONE`, `WINDOW_SLATS` (Vệt nắng qua song cửa), `FOLIAGE_DAPPLE` (Bóng lá đổ), `WARM_LANTERN` (Quầng sáng đèn lồng ấm).
4. **Trục Cơ chế Máy quay tại Pivot (`visualDNA.pivotMechanic` — 4 lựa chọn)**:
   - `SPOTLIGHT_DIM` (Hạ tối xung quanh, gom sáng vào tâm điểm tại Pivot)
   - `ACCENT_PUSH_IN` (Máy quay dolly-in đẩy cận cảnh `+8%` vào đạo cụ/nhân vật tại Pivot)
   - `PULLBACK_REVEAL` (Đầu video zoom cận `+12%`, tới Pivot kéo lùi máy quay mở rộng toàn cảnh)
   - `PARALLAX_DRIFT` (Trượt máy ngang liên tục tạo cảm giác lữ hành/trôi chảy)
5. **Trục Địa hình Mặt đất (`stageScript.terrain.type` — 8 lựa chọn)**:
   - `flat`, `gentle_hill`, `LONELY_SLOPE` (`slope_up`), `slope_down`, `cliff_edge`, `river_bank`, `roof_ridge`, `split_bridge` + độ cao đường chân trời `horizonOffsetPx` (`-28..+28`).
6. **Trục Cơ chế Biến hình Đạo cụ & Diễn xuất 3 Hồi (`StageScript Choreography`)**:
   - Đạo cụ biến hình `morph: 0 -> 1` (`altShapes`), nứt đôi `split: 0 -> 1`, bay lên hóa mây `floatAway + dissolveToCloud`, hoặc đạo cụ phản chủ có chân (`walking_bill`).
7. **Trục Âm thanh Điểm nhấn (`bgm.audioMode` & `bgm.foleyPivotStyle`)**:
   - `audioMode`: `AMBIENT_ONLY`, `PIVOT_ACCENT`, `FULL_THEME`.
   - `foleyPivotStyle`: `AUTO`, `TEA_CUP`, `PAPER_RUSTLE`, `WOOD_CHIME`, `RAIN_DROP`, `HEART_PULSE`, `NONE`.

---

## 4.3. Cách Hệ thống Nhận biết Hai Video Gần đây Quá Giống Nhau — Đối chiếu Code vs Thực tế

### A. Cơ chế đang chạy trong Code (`detectVisualDnaSequenceWarnings`) — `[Đã xác minh trong code: src/engine/visualDnaResolver.ts:250-316]`
- Hàm `detectVisualDnaSequenceWarnings(items)` duyệt danh sách các Chén theo thứ tự `cupNumber` và kiểm tra **2 liền kề (`prev` vs `curr`)** hoặc **3 liền kề (`prev2`, `prev`, `curr`)** trên 4 thuộc tính của `VisualDNA`:
  1. **Trùng `layout` 3 Chén liên tiếp** (`prev2.layout === prev.layout && prev.layout === curr.layout`) -> phát cảnh báo.
  2. **Trùng `lightingGobo` (khác `NONE`) 2 Chén liên tiếp** (`prev.lightingGobo === curr.lightingGobo`) -> phát cảnh báo.
  3. **Trùng `pivotMechanic` 2 Chén liên tiếp** (`prev.pivotMechanic === curr.pivotMechanic`) -> phát cảnh báo.
  4. **Trùng tổ hợp `(layout + shotMode + pivotMechanic)` 2 Chén liên tiếp** -> phát cảnh báo mức cao.

### B. Kiểm toán thực tế trên 16 Chén hiện tại (`data/cups/quote-001..017.json`) — `[Đã xác minh trong code]`

| Chén | Tiêu đề | `themeId` | `layout` | `shotMode` | `lightingGobo` | `pivotMechanic` | `horizonOffsetPx` | `sceneId` |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| Chén 01 (`quote-001`) | Câu đơn | `MINIMAL_LIGHT` | `None` | `None` | `None` | `None` | `None` | `SCRIPT_CAU_DON_BONG_DAI` |
| Chén 02 (`quote-002`) | Ngược lối | `MINIMAL_LIGHT` | `None` | `None` | `None` | `None` | `None` | `RAIN_UMBRELLA_PARTING` |
| Chén 03 (`quote-003`) | Câu đơn | `MINIMAL_LIGHT` | `None` | `None` | `None` | `None` | `None` | `SCRIPT_CAU_DON_BONG_DAI` |
| Chén 04 (`quote-004`) | Lốp | `MINIMAL_LIGHT` | `None` | `None` | `None` | `None` | `None` | `SCRIPT_LOP_DU_PHONG` |
| Chén 05 (`quote-005`) | Trốn | `MINIMAL_LIGHT` | `None` | `None` | `None` | `None` | `None` | `SCRIPT_CAI_BONG_PHO_THI_VOM_DEM` |
| Chén 06 (`quote-006`) | Say | `MINIMAL_LIGHT` | `None` | `None` | `None` | `None` | `None` | `SCRIPT_DUYEN_DAU_TREN_MAY` |
| Chén 07 (`quote-007`) | Chấm công | `MINIMAL_LIGHT` | `None` | `None` | `None` | `None` | `None` | `SCRIPT_CHAM_CONG_NGONG_TRUA` |
| Chén 08 (`quote-008`) | Chiếc ô | `WARM_NOIR` | `WINDOW_FRAME` | `SOLID_SCENE` | `WARM_LANTERN` | `SPOTLIGHT_DIM` | `-10` | `SCRIPT_CHIEC_O_RONG_CHO_NHAU` |
| Chén 09 (`quote-009`) | Ký ức | `WARM_NOIR` | `SKY_QUOTE_BOTTOM_STAGE` | `BRUSH_DRAW` | `WINDOW_SLATS` | `PARALLAX_DRIFT` | `12` | `SCRIPT_NGUOI_LU_HANH_VA_KY_UC` |
| Chén 10 (`quote-010`) | Người nhà | `MINIMAL_LIGHT` | `CLASSIC_TOP_STAGE` | `SOLID_SCENE` | `FOLIAGE_DAPPLE` | `PULLBACK_REVEAL` | `-14` | `SCRIPT_CONG_RAO_HOA_MAI_HIEN_CHUNG` |
| Chén 11 (`quote-011`) | Gấp đôi | `MINIMAL_DARK` | `CLASSIC_TOP_STAGE` | `BRUSH_DRAW` | `WARM_LANTERN` | `PULLBACK_REVEAL` | `2` | `CUSTOM_TAN_LAI_GAP_DOI` |
| Chén 12 (`quote-012`) | Vitamin Em | `MINIMAL_LIGHT` | `CLASSIC_TOP_STAGE` | `SOLID_SCENE` | `WARM_LANTERN` | `ACCENT_PUSH_IN` | `-11` | `SCRIPT_DUNG_NGHI_NGUYEN_TO_A_C_D_HOA_EM` |
| Chén 14 (`quote-014`) | Thứ 2 | `MINIMAL_LIGHT` | `CLASSIC_TOP_STAGE` | `SOLID_SCENE` | `NONE` | `ACCENT_PUSH_IN` | `None` | `SCRIPT_BIEN_BAN_HOP_HOA_TO_BUN_NONG_V7` |
| Chén 15 (`quote-015`) | Khỏe tưng | `MINIMAL_DARK` | `CLASSIC_TOP_STAGE` | `SOLID_SCENE` | `NONE` | `ACCENT_PUSH_IN` | `11` | `SCRIPT_GANH_NANG_COM_AO_HOA_DON_DOPING` |
| Chén 16 (`quote-016`) | Để sang mai | `MINIMAL_LIGHT` | `CLASSIC_TOP_STAGE` | `SOLID_SCENE` | `NONE` | `ACCENT_PUSH_IN` | `11` | `SCRIPT_DE_SANG_MAI` |
| Chén 17 (`quote-017`) | Cập nhật | `MINIMAL_LIGHT` | `CLASSIC_TOP_STAGE` | `SOLID_SCENE` | `NONE` | `ACCENT_PUSH_IN` | `11` | `SCRIPT_P022_LICH_BAN_CHUA_CAP_NHAT` |

- **Phát hiện lỗ hổng chống lặp thực tế (`[Đã xác minh trong code]`)**:
  1. **Từ Chén 12 -> Chén 14 -> Chén 15 -> Chén 16 -> Chén 17 (5 Chén liên tiếp!)**: Đều dùng chung **`layout: "CLASSIC_TOP_STAGE"`**, **`shotMode: "SOLID_SCENE"`**, **`pivotMechanic: "ACCENT_PUSH_IN"`**, và 4 Chén liên tiếp (14, 15, 16, 17) đều dùng **`lightingGobo: "NONE"`**!
  2. **Nguyên nhân vì sao bị trùng 5 Chén liên tiếp**:
     - `GEMINI_GEM_SYSTEM_PROMPT` (`geminiBundleBridge.ts:956-964`) đặt cứng ví dụ mẫu là `"layoutVariant": "CLASSIC_TOP_STAGE", "shotMode": "SOLID_SCENE", "lightingMood": "NONE", "cameraMotion": "ACCENT_PUSH_IN"`, khiến AI khi sinh CupBundle luôn sao chép y nguyên bộ 4 giá trị này!
     - Hàm `sanitizeAndNormalizeCupBundle` (`geminiBundleBridge.ts`) khi nạp gói JSON mới **không tự động gọi `suggestDistinctVisualDNA(id, recentHistory)`** để xoay vòng `layoutVariant` và `pivotMechanic` so với 2 Chén liền trước.
  3. **Chưa có kiểm tra trùng lặp cấp Đạo cụ & Bối cảnh (`Prop/Setting Dedup`) — `[Có trong tài liệu nhưng chưa xác minh trong code]`**:
     - Hiện tại code chưa kiểm tra việc 2 Chén liên tiếp cùng dùng một bộ bối cảnh (ví dụ: Chén 14, 15, 16, 17 đều là 1 nhân vật ngồi ghế bên trái + bàn trà/bàn làm việc ở giữa + tờ giấy/cuốn lịch/ví trên bàn).

---

## 4.4. Nguyên tắc Tạo lại Cùng một Phiên bản Ổn định (`Deterministic Replay`) vs. Tạo Biến thể Mới (`Variation Generation`)

### A. Tạo lại Cùng một Phiên bản Ổn định (`Deterministic Replay`) — `[Đã xác minh trong code: src/engine/visualDnaResolver.ts:34-98]`
- Hàm `hashCupSeed(cupId)` băm chuỗi `id` (ví dụ `"quote-008"`) bằng thuật toán FNV-1a 32-bit (`seed = 2166136261`).
- Toàn bộ chuyển động vi mô trên sân khấu (nhịp thở nhân vật `breathPhase`, góc đung đưa của đạo cụ `InlineShape.anim`, vị trí hạt mưa/khói trà `emitters`, và `resolveVisualDNA` khi ở chế độ `AUTO`) đều là **hàm tất định toán học (pure function) của `(frame, hashCupSeed(id))`** — hoàn toàn không dùng `Math.random()` tại runtime!
- **Kết quả**: Cùng một tệp `cup_input.json` + `stage_script.json` khi render lại ở bất kỳ thời điểm nào cũng cho ra video MP4 giống hệt từng pixel ở mọi frame.

### B. Tạo Biến thể Mới Độc bản (`Controlled Variation`) — `[Đã xác minh trong code & Đề xuất mới]`
- **Đang có trong code (`suggestDistinctVisualDNA` tại `visualDnaResolver.ts:318-378`)**:
  - Truyền `seedKey` mới (ví dụ `"quote-016:v2"`) cùng mảng `recentDnaList` (2–3 Chén gần nhất), hàm sẽ tự động chọn tổ hợp `(layout, shotMode, lightingGobo, pivotMechanic, horizonOffsetPx)` không trùng với các Chén liền kề.
- **`[Đề xuất mới]` Thêm Khóa Chống Lặp Bối Cảnh (`Stage Archetype & Prop Fingerprint`)**:
  - Lưu dấu vân tay sân khấu `stageFingerprint = { settingType: "indoor_desk" | "outdoor_street" | "nature_hill" | "abstract_horizon", primaryPropIds: [...], actorPoses: [...] }` cho từng Chén.
  - Cấm 2 Chén liên tiếp có cùng `settingType === "indoor_desk"` hoặc dùng lại cùng một đạo cụ Tier 3 (`desk_calendar`, `wallet`, `walking_bill`).
