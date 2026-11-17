# 04. Hiện Trạng Kho Mã Nguồn, Bảng Số Chén Chuẩn & Việc Đang Dở

> **Phạm vi tài liệu**: Phản ánh trung thực 100% trạng thái Git trên nhánh `ci/qa-gates-1-2` tại `/Volumes/Data/Quotes` tính đến ngày `2026-11-17`, danh sách các lỗi đã xác minh trong code và dữ liệu, thứ tự công việc ưu tiên tiếp theo, cùng bảng đối chiếu toàn bộ các Chén (`01 → 17`) và lời giải thích chi tiết cho các số bị trùng (`01/03`, `13`, `14`, `16`) cũng như việc khuyết tệp `quote-013.json`.

---

## 1. Hiện Trạng Nhánh Git `ci/qa-gates-1-2` (Chưa Commit)

- **Nhánh hiện tại**: `ci/qa-gates-1-2` (commit gần nhất đã đẩy: `fdaa241` — *feat(typography-loop): implement Option 1 0.35s line-1 ink reveal and 14.2s-15.0s seamless loop*).
- **Tổng số thay đổi chưa commit trên working tree**: **41 tệp đã sửa (`M`)** và **18 tệp/thư mục mới chưa theo dõi (`??`)**. Toàn bộ đợt nâng cấp từ **V8.4 $\rightarrow$ V8.5 $\rightarrow$ V8.6 $\rightarrow$ V8.6.1** và các Chén từ `quote-010` đến `quote-017` hiện đang nằm trên working tree của nhánh này và **chưa được commit**.

### 1.1. Phân loại trạng thái hoàn thành của các thay đổi chưa commit

| Nhóm tệp | Các tệp tiêu biểu trên nhánh `ci/qa-gates-1-2` | Trạng thái | Ghi chú chi tiết |
| :--- | :--- | :---: | :--- |
| **1. Lõi Engine Khai Bút 4 Pha V8.6.1, Khung xương 2-Bone IK, 3 Bảng màu & Lưới Header đối xứng** | - `M src/engine/motionPhysics.ts`<br>- `M src/stage/trackCompiler.ts`<br>- `M src/stage/propCatalog.tsx`<br>- `M src/kit/CloakedTraveler.tsx`<br>- `M src/components/AdaptiveTypography.tsx`<br>- `M src/theme/palettes.ts`<br>- `M src/schemas/videoSchema.ts`<br>- `?? src/engine/visualDnaResolver.ts` | **Đã xong Code (`tsc` 0 lỗi)** | Đã triển khai đầy đủ: Khai bút 4 pha `0.00s → 3.80s` dùng 1 hàm `Cosine S-Curve`, nhân vật 2-Bone IK ngồi khớp ghế `-10.5px`, rút gọn 3 bảng màu (`MINIMAL_LIGHT`, `MINIMAL_DARK`, `WARM_NOIR`), line đỏ dọc thẳng đều `3.2px`, và đối xứng lề phải Header `headerWidth = 816, marginRightTop = 132`. *(Lưu ý: chỉnh sửa lề phải Header ở `palettes.ts` được làm theo yêu cầu "Chỉ điều chỉnh code, không cần render video" nên các video xuất trước đó chưa mang lề Header mới).* |
| **2. Máy chủ Render 1 File MP4, Hộp thư Auto-Render & Cầu nối Gemini Bundle V8.6.1** | - `M server/renderQueueService.ts`<br>- `M server/index.ts`<br>- `M server/cupStore.ts`<br>- `M server/sceneManagerService.ts`<br>- `?? src/automation/geminiBundleBridge.ts`<br>- `?? studio-ui/src/components/GeminiBundleImportModal.tsx` | **Đã xong & Đang chạy** | Đã bỏ xuất `-cover.png` và bỏ xuất SEO MP4 phụ khi render mới; đã tích hợp hộp thư `/Volumes/Data/Quotes/data/auto-render-trigger.json` và cập nhật `GEMINI_GEM_SYSTEM_PROMPT` / `GEMINI_SKILL_MD` lên chuẩn V8.6.1. |
| **3. Tài liệu & Gói Skill `dao-dien-tra-nguoi`** | - `?? docs/SKILL.md` *(Đã ở bản V8.6.1)*<br>- `?? docs/dao-dien-tra-nguoi.zip` *(Đã ở bản V8.6.1)*<br>- `?? .agents/skills/dao-dien-tra-nguoi/SKILL.md` *(Vẫn ở bản V8.5 cũ)* | **Đang dở 1 tệp** | `docs/SKILL.md` và `docs/dao-dien-tra-nguoi.zip` đã lên V8.6.1, nhưng `.agents/skills/dao-dien-tra-nguoi/SKILL.md` vẫn giữ nội dung V8.5 (5 bảng màu). Cần đồng bộ tệp này trước khi commit. |
| **4. Bộ kiểm thử tự động CI (`qa-gates-ci.mjs`, `qa-full-5gates.mjs`, `qa-matrix-v85.mjs`)** | - `M scripts/qa-gates-ci.mjs`<br>- `M scripts/qa-full-5gates.mjs`<br>- `?? scripts/qa-matrix-v85.mjs` | **Đang dở (Chưa cập nhật theo V8.6.1)** | Các script QA này được viết cho V8.5 (vẫn assert 5 bảng màu gồm `DARK_CONTEMPLATIVE` & `SLATE_CALM`, assert `headerWidth = 674`, và assert `bundleVersion === '8.5'`). Khi vừa rút xuống 3 bảng màu và nâng `headerWidth = 816` ở V8.6.1, cần cập nhật lại các câu lệnh `assertCheck` trong `scripts/qa-gates-ci.mjs`. |
| **5. Dữ liệu Chén (`data/cups/`), Kịch bản (`data/stage-scripts.json`), Đạo cụ (`data/custom-props.json`) & Cache Airtable** | - `M data/airtable-cache.json`<br>- `M data/custom-props.json`<br>- `M data/stage-scripts.json`<br>- `M data/vault-meta.json`<br>- `M data/cups/quote-001..004, 008..009.json`<br>- `?? data/cups/quote-010..012, 014..017.json` | **Đang dở ở `quote-016` & trùng số** | `quote-017.json` đã hoàn tất V8.6.1; riêng `quote-016.json` đang ở `"status": "draft"` với kịch bản lỗi `SCRIPT_DE_SANG_MAI`, và có hiện tượng trùng số Chén / lệch tên video (xem chi tiết tại Mục 3 và Mục 4 bên dưới). |
| **6. Gói Hồ sơ Kiểm toán & Bàn giao (`audit-package-tra-nguoi/`)** | - `?? audit-package-tra-nguoi/00_handoff/`<br>- `?? audit-package-tra-nguoi/01_stage_rules_and_schema/`<br>- `?? audit-package-tra-nguoi/02_prop_catalog/`<br>- `?? audit-package-tra-nguoi/03_examples/`<br>- `?? audit-package-tra-nguoi/04_dna_and_variation/`<br>- `?? audit-package-tra-nguoi/05_sources_and_code/` | **Đã xong** | Bộ tài liệu kiểm toán toàn diện kèm 4 tệp bàn giao trong `00_handoff/`. |

---

## 2. Danh Sách Các Lỗi Đã Biết (Known Bugs & Issues)

Toàn bộ các lỗi dưới đây đã được xác minh trực tiếp trong mã nguồn và khung hình video thực tế:

### 2.1. Lỗi cấp Engine & Schema (`src/`)
1. **Đảo ngược thứ tự vẽ lớp `fore` khiến Đạo cụ đè lên người Nhân vật (`/Volumes/Data/Quotes/src/stage/DeclarativeStagePlayer.tsx`, dòng 644–649)**:
   - Ở lớp `far` và `mid`, Đạo cụ (`renderPropsByLayer`) được vẽ trước (nằm sau lưng) Nhân vật (`renderActorsByLayer`). Nhưng ở lớp `fore`, code lại gọi `renderActorsByLayer('fore')` trước rồi mới gọi `renderPropsByLayer('fore')`. Hậu quả: khi nhân vật ở lớp `fore` đi ngang qua bàn có đặt đạo cụ ở lớp `fore` (như chiếc ví trong Chén 16 `SCRIPT_DE_SANG_MAI`), đạo cụ vẽ đè thẳng lên giữa ngực áo choàng đen của nhân vật.
2. **Mặt trăng / Mặt trời (`atmosphere`) tự động mặc định màu Đỏ Chu Sa (`accent`) từ giây `0.00s` (`/Volumes/Data/Quotes/src/stage/DeclarativeStagePlayer.tsx`, dòng 372)**:
   - Dòng code `const defaultRole = (item.type === 'sun' || item.type === 'hollow_sun' || item.type === 'crescent' || item.type === 'ring_pulse') ? 'accent' : 'secondary'` khiến mọi mặt trăng/mặt trời không khai báo rõ `"colorRole": "secondary"` đều bị tô đỏ rực ngay từ đầu video, phá vỡ quy tắc "duy nhất 1 điểm nhấn Đỏ Chu Sa tại Pivot".
3. **Bẫy ghi đè ngầm `duration = 3.8s` cho mọi cue sau Pivot (`/Volumes/Data/Quotes/src/stage/trackCompiler.ts`, dòng 35–46)**:
   - Hàm `resolveCinemagraphDurationFrames` ép mọi cue có `isPostPivot = true` và `0.6 <= duration < 3.4` thành `3.8s`.
4. **Prompt/Skill hướng dẫn dùng `"type": "stool"` và `"type": "low_tea_table"` nhưng Catalog không có tên này (`/Volumes/Data/Quotes/src/automation/geminiBundleBridge.ts`, dòng 881, 899, 974)**:
   - Trong `BUILT_IN_PROP_CATALOG` (`src/stage/propCatalog.tsx`) và `data/custom-props.json`, chỉ có `"office_stool"`, `"std_chair"`, `"std_tea_table"`, `"std_work_desk"`, `"small_work_desk"`. Nếu kịch bản khai báo `"type": "stool"` hoặc `"type": "low_tea_table"` mà không truyền mảng `shapes` đi kèm, `StagePropRenderer` trả về `null` khiến ghế/bàn bị **tàng hình** (như đã xảy ra ở `SCRIPT_P032_QUYET_TAM_3_GIAY` và cả trong mẫu template JSON của `geminiBundleBridge.ts` dòng 1105).
5. **Thiếu bộ kiểm tra va chạm đường đi bộ xuyên bàn (`Furniture Walk-Through`) và trùng lặp đạo cụ trong `auditStageVisualLayout` (`/Volumes/Data/Quotes/src/automation/geminiBundleBridge.ts`, dòng 529–646)**:
   - Hiện `auditStageVisualLayout` mới chỉ cảnh báo `EDGE_SAFETY` (`X < 92` hoặc `X > 448`) và `HEADROOM_OVERLAP` (vòm mái có `width >= 48` thấp hơn đỉnh đầu nhân vật). Mã lỗi `'POST_COLLISION'` đã khai báo trong kiểu dữ liệu nhưng chưa có logic kiểm tra thực thi.
6. **Các trường `toScale`, `headTilt`, `handTarget`, `reachProgress`, `easing` trong `TimelineCue` bị Zod strip bỏ (`/Volumes/Data/Quotes/src/stage/stageScriptSchema.ts`, dòng 153–179)**:
   - Nếu AI sinh kịch bản dùng `toScale` thay vì `scale`, Zod sẽ lặng lẽ xóa trường đó khi parse.

### 2.2. Lỗi cấp Kiểm thử CI & Chống lặp (`scripts/` & `data/cups/`)
1. **`scripts/qa-gates-ci.mjs` chưa được cập nhật theo các thay đổi V8.6.1**:
   - Dòng 367–415 trong `scripts/qa-gates-ci.mjs` vẫn truy cập `THEME_PALETTES.DARK_CONTEMPLATIVE.background` (sẽ gây lỗi `TypeError: Cannot read properties of undefined` vì `DARK_CONTEMPLATIVE` đã bị xóa khỏi `palettes.ts`).
   - Dòng 514–531 vẫn kiểm tra `parsedGeminiTemplate.bundleVersion === '8.5'` (nay là `'8.6'`) và kiểm tra `.agents/skills/dao-dien-tra-nguoi/SKILL.md` chứa chữ `'DARK_CONTEMPLATIVE'`.
2. **Lặp cấu hình `VisualDNA` 5 Chén liên tiếp (`quote-012` → `quote-014` → `quote-015` → `quote-016` → `quote-017`)**:
   - Cả 5 Chén gần nhất đều dùng chung `layout: "CLASSIC_TOP_STAGE"`, `shotMode: "SOLID_SCENE"`, `pivotMechanic: "ACCENT_PUSH_IN"`, và 4 Chén (`14, 15, 16, 17`) cùng dùng `lightingGobo: "NONE"` do mẫu JSON trong prompt đặt cứng bộ giá trị này.
3. **Kịch bản lỗi trong `quote-016.json` (`SCRIPT_DE_SANG_MAI`) và `SCRIPT_P032_QUYET_TAM_3_GIAY`**:
   - Bản `SCRIPT_DE_SANG_MAI` hiện gắn trong `quote-016.json` (`status: "draft"`) bị 5 lỗi chồng chéo: vừa có 2 chiếc ví (`locked_wallet_note` + `pet_wallet`), vừa có 4 vật thể đỏ cùng lúc, nhân vật đi xuyên qua bàn `work_desk`, ví đè lên ngực nhân vật ở lớp `fore`, và `pet_wallet` lùi đè lên chân `beloved`.

---

## 3. Bảng Số Chén Chuẩn (`01 → 17`) & Hiện Trạng Tệp Thực Tế

Dưới đây là bảng đối chiếu chính xác giữa **16 tệp JSON** trong `/Volumes/Data/Quotes/data/cups/`, các thư mục trong `/Volumes/Data/Quotes/output/` và **20 tệp MP4** đang nằm trong `/Volumes/Data/Quotes/videos/`:

| Số Chén (`cupNumber`) | Tệp JSON trong `data/cups/` | Tên bài (`props.title`) & Mã nguồn | Kịch bản sân khấu (`sceneId`) | Trạng thái JSON | Tệp Video MP4 cuối cùng trong `/Volumes/Data/Quotes/videos/` | Ghi chú / Bất thường |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| **01** | `quote-001.json` | **Câu đơn** *(Trước đây từng là bài "Nghỉ", sau đó là "Thiệp")* | `SCRIPT_CAU_DON_BONG_DAI` | `completed` | `Chén 01 - Nghỉ.mp4` *(2.60 MB, ngày 10/11)*<br>*(Trong `output/quote-001/quote-001.mp4` là bản ngày 11/11)* | **Bị trùng nội dung 100% với `quote-003.json`** và lệch tên với `Chén 01 - Nghỉ.mp4` trong `videos/` (xem giải thích Mục 4.1). |
| **02** | `quote-002.json` | **Ngược lối** | `RAIN_UMBRELLA_PARTING` | `completed` | `Chén 02 - Ngược lối.mp4` *(2.60 MB, ngày 10/11)* | Chuẩn, ổn định (Legacy Locked). |
| **03** | `quote-003.json` | **Câu đơn** | `SCRIPT_CAU_DON_BONG_DAI` | `completed` | `Chén 03 - Câu đơn.mp4` *(2.53 MB, ngày 11/11)* | Trùng nội dung câu chữ và kịch bản với `quote-001.json` (xem Mục 4.1). |
| **04** | `quote-004.json` | **Lốp** (`35` âm tiết) | `SCRIPT_LOP_DU_PHONG` | `completed` | `Chén 04 - Lốp.mp4` *(2.92 MB, ngày 11/11)* | Chuẩn, ổn định (Legacy Locked). |
| **05** | `quote-005.json` | **Trốn** (`28` âm tiết) | `SCRIPT_CAI_BONG_PHO_THI_VOM_DEM` | `completed` | `Chén 05 - Trốn.mp4` *(2.98 MB, ngày 11/11)* | Chuẩn, ổn định (Legacy Locked). |
| **06** | `quote-006.json` | **Say** (*"Ta gom mây làm rượu..."*, `20` âm tiết) | `SCRIPT_DUYEN_DAU_TREN_MAY` | `completed` | `Chén 06 - Say.mp4` *(2.75 MB, ngày 11/11)* | Chuẩn, ổn định (Legacy Locked). |
| **07** | `quote-007.json` | **Chấm công** (`28` âm tiết) | `SCRIPT_CHAM_CONG_NGONG_TRUA` | `completed` | `Chén 07 - Chấm công.mp4` *(2.84 MB, ngày 12/11)* | Chuẩn, ổn định (Legacy Locked). |
| **08** | `quote-008.json` | **Chiếc ô** (`25` âm tiết) | `SCRIPT_CHIEC_O_RONG_CHO_NHAU` | `completed` | `Chén 08 - Chiếc ô.mp4` *(3.43 MB, ngày 14/11)* | Chuẩn mẫu tốt (`WARM_NOIR`, `WINDOW_FRAME`). |
| **09** | `quote-009.json` | **Ký ức** (`28` âm tiết) | `SCRIPT_NGUOI_LU_HANH_VA_KY_UC` | `completed` | `Chén 09 - Ký ức.mp4` *(3.94 MB, ngày 14/11)* | Chuẩn mẫu tốt (`WARM_NOIR`, `SKY_QUOTE_BOTTOM_STAGE`). |
| **10** | `quote-010.json` | **Người nhà** (`Q008`, `20` âm tiết) | `SCRIPT_CONG_RAO_HOA_MAI_HIEN_CHUNG` | `completed` | `Chén 10 - Người nhà.mp4` *(18.50 MB, ngày 14/11)* | Chuẩn mẫu tốt (xuất lúc còn dùng bitrate `10 Mbps` trước bản vá CRF 19). |
| **11** | `quote-011.json` | **Gấp đôi** (`29` âm tiết) | `CUSTOM_TAN_LAI_GAP_DOI` | `completed` | `Chén 11 - Gấp đôi.mp4` *(3.04 MB, ngày 16/11)* | Đã hoàn thành. |
| **12** | `quote-012.json` | **Vitamin Em** (`Q101`, `24` âm tiết) | `SCRIPT_DUNG_NGHI_NGUYEN_TO_A_C_D_HOA_EM` | `completed` | `Chén 12 - Vitamin Em.mp4` *(3.08 MB, ngày 15/11)* | Bài *Vitamin Em* trước đó từng mang số `14`, sau được dời về `quote-012.json` (xem Mục 4.2 & 4.3). |
| **13** | *(Không có `quote-013.json`)* | **Người anh yêu / Say** (*"Em như một chén rượu đầy / Chưa nhấp mà đã làm say cả đời..."*) | `SCRIPT_BAC_THEM_DOA_HONG_DO_TINH_TAI` | **Đã bị xóa tệp JSON** | Có **2 tệp MP4 trùng số 13** trong `videos/`:<br>1. `Chén 13 - Người anh yêu.mp4` *(18.35 MB, ngày 14/11)*<br>2. `Chén 13 - Say.mp4` *(3.12 MB, ngày 14/11)* | Thiếu `data/cups/quote-013.json`, nhưng vẫn còn nguyên `output/quote-013/metadata.json` và 2 video trong `videos/` (xem Mục 4.2). |
| **14** | `quote-014.json` | **Thứ 2** (*"Thứ Hai ngồi họp đầu giờ..."*, `28` âm tiết) | `SCRIPT_BIEN_BAN_HOP_HOA_TO_BUN_NONG_V7` | `completed` | Có **2 tệp MP4 trùng số 14** trong `videos/`:<br>1. **`Chén 14 - Thứ 2.mp4`** *(2.72 MB, ngày 16/11 — bản chuẩn hiện tại)*<br>2. `Chén 14 - Vitamin Em.mp4` *(3.18 MB, ngày 15/11 — bản cũ còn sót)* | Tệp `Chén 14 - Vitamin Em.mp4` là bản xuất cũ trước khi bài *Vitamin Em* chuyển sang Chén 12 (xem Mục 4.3). |
| **15** | `quote-015.json` | **Khỏe tưng** (`P019`, *"Tháng năm tất tả chưa từng dừng..."*, `28` âm tiết) | `SCRIPT_GANH_NANG_COM_AO_HOA_DON_DOPING` | `completed` | `Chén 15 - Khỏe tưng.mp4` *(2.53 MB, ngày 17/11)* | Trùng bài thơ *Khỏe tưng (`P019`)* với video `Chén 16 - Khỏe tưng.mp4` (xem Mục 4.4). |
| **16** | `quote-016.json` | **Để sang mai** (*"Cuối tháng tiền vơi, khẽ thở dài..."*, `28` âm tiết) | `SCRIPT_DE_SANG_MAI` *(trong JSON hiện tại)* / `SCRIPT_P019_TO_HOA_DON_PHAN_CHU_V4` *(khi render Chén 16 - Khỏe tưng)* | **`draft` (`0%`)** | Có **2 tệp MP4 trùng số 16** trong `videos/`:<br>1. **`Chén 16 - Khỏe tưng.mp4`** *(2.12 MB, ngày 17/11 — bản render V8.6.1)*<br>2. `Chén 16 - Để sang mai.mp4` *(2.54 MB, ngày 17/11 — bản lỗi đạo cụ)* | Xem giải thích chi tiết tại Mục 4.4 bên dưới. |
| **17** | `quote-017.json` | **Cập nhật** (`P022`, *"Có những mối quan hệ đã hết hạn từ lâu..."*, `19` âm tiết) | `SCRIPT_P022_LICH_BAN_CHUA_CAP_NHAT` | `completed` | **`Chén 17 - Cập nhật.mp4`** *(1.95 MB, ngày 17/11 — bản render V8.6.1)* | Đã hoàn thiện chuẩn Khai Bút 4 Pha V8.6.1 với `desk_calendar` và `std_work_desk`. |

---

## 4. Giải Thích Chi Tiết Các Số Đang Trùng (`01/03`, `13`, `14`, `16`) & Việc Thiếu `quote-013.json`

### 4.1. Vì sao Chén `01` và Chén `03` bị trùng nội dung `"Câu đơn"` (và `videos/` lại có `Chén 01 - Nghỉ.mp4`)?
- **Lịch sử thực tế** (xác minh qua `/Volumes/Data/Quotes/videos/Chén 01 - Nghỉ.mp4`, `/Volumes/Data/Quotes/output/quote-001/metadata.json` và `/Volumes/Data/Quotes/data/cups/quote-001.json`):
  1. Ở giai đoạn V2.0–V3.0 (ngày `10/11/2026`), `quote-001` là bài **`"Nghỉ"`** (kịch bản `BOULDER_TO_BENCH` — đẩy đá lên dốc rồi ngồi uống trà) và đã xuất thành tệp `/Volumes/Data/Quotes/videos/Chén 01 - Nghỉ.mp4`.
  2. Sang ngày `11/11/2026`, chủ kênh thử nghiệm ghi đè `quote-001` bằng bài `"Thiệp"` (`SCRIPT_THIEP_HONG_NGUOI_XUA`, hiện vẫn còn lưu dấu trong `/Volumes/Data/Quotes/output/quote-001/metadata.json`), rồi sau đó lại dán đè bài **`"Câu đơn"`** (`SCRIPT_CAU_DON_BONG_DAI` — vốn là nội dung của `quote-003.json`) vào `quote-001.json` khi test trên Studio UI.
  3. Hệ quả: hiện tại cả `/Volumes/Data/Quotes/data/cups/quote-001.json` và `/Volumes/Data/Quotes/data/cups/quote-003.json` đều chứa cùng bài thơ *"Em thương anh là câu đơn / Anh không thương em là cơn đau..."* (đang bị Gate 2 cảnh báo: `Trùng lặp nội dung nguyên văn giữa Chén 01 và Chén 03`).

### 4.2. Vì sao thiếu tệp `data/cups/quote-013.json` và có 2 video `Chén 13 - Người anh yêu.mp4` & `Chén 13 - Say.mp4`?
- **Lịch sử thực tế** (xác minh qua `/Volumes/Data/Quotes/output/quote-013/metadata.json`, `/Volumes/Data/Quotes/qa-artifacts-ci/QA_GATES_1_2_REPORT.md` và bộ nhớ dự án):
  1. Ngày `14/11/2026`, `quote-013.json` được tạo cho bài thơ 4 câu (*"Em như một chén rượu đầy / Chưa nhấp mà đã làm say cả đời..."*, `pivotWord: "anh yêu"`, kịch bản `SCRIPT_BAC_THEM_DOA_HONG_DO_TINH_TAI`).
  2. Lần xuất đầu tiên đặt tiêu đề là `"Người anh yêu"` (lúc còn dùng bitrate `10 Mbps`), sinh ra tệp `/Volumes/Data/Quotes/videos/Chén 13 - Người anh yêu.mp4` (`18.35 MB`).
  3. Cùng ngày `14/11/2026` (khi nâng cấp V8.5 `CRF 20`), bài này được đổi tiêu đề ngắn gọn thành `"Say"` và kết xuất lại thành `/Volumes/Data/Quotes/videos/Chén 13 - Say.mp4` (`3.12 MB`). Vì tên file thay đổi (`Người anh yêu` $\rightarrow$ `Say`), file cũ không bị ghi đè nên cả 2 file cùng tồn tại trong `videos/`.
  4. Đến ngày `15–16/11/2026`, do chủ kênh không ưng ý kịch bản bậc thềm/tỷ lệ của Chén 13 (và tên `"Say"` cũng bị trùng với `Chén 06 - Say`), chủ kênh đã **xóa Chén 13 trên giao diện Studio UI** (`DELETE /api/cups/quote-013`), làm xóa tệp `/Volumes/Data/Quotes/data/cups/quote-013.json`, nhưng các tệp đã xuất trong `/Volumes/Data/Quotes/output/quote-013/` và `/Volumes/Data/Quotes/videos/` không bị xóa theo.

### 4.3. Vì sao có 2 video mang số `Chén 14` (`Chén 14 - Vitamin Em.mp4` và `Chén 14 - Thứ 2.mp4`)?
- **Lịch sử thực tế** (xác minh qua `/Volumes/Data/Quotes/qa-artifacts-ci/QA_GATES_1_2_REPORT.md` và `/Volumes/Data/Quotes/output/quote-014/`):
  1. Ngày `15/11/2026` (khi `quote-013.json` còn tồn tại), bài **`"Vitamin Em"`** (`Q101`) được tạo ở vị trí **`quote-014.json`** (`Chén 14`) và kết xuất ra `/Volumes/Data/Quotes/videos/Chén 14 - Vitamin Em.mp4`.
  2. Sau đó, bài `"Vitamin Em"` được chuyển về lấp vào vị trí **`quote-012.json`** (`Chén 12`) và kết xuất thành `/Volumes/Data/Quotes/videos/Chén 12 - Vitamin Em.mp4`.
  3. Ngày `16/11/2026`, vị trí **`quote-014.json`** (`Chén 14`) được dùng cho bài công sở sáng thứ Hai: ban đầu lấy tiêu đề `"Biên bản sáng thứ Hai"` (hiện còn lưu tại `/Volumes/Data/Quotes/output/quote-014/Chén 14 - Biên bản sáng thứ Hai.mp4`), sau rút gọn tiêu đề thành **`"Thứ 2"`** (`SCRIPT_BIEN_BAN_HOP_HOA_TO_BUN_NONG_V7`) và xuất ra `/Volumes/Data/Quotes/videos/Chén 14 - Thứ 2.mp4`. File cũ `Chén 14 - Vitamin Em.mp4` trong `videos/` chưa được xóa dọn nên còn nằm song song.

### 4.4. Vì sao có cả `Chén 15 - Khỏe tưng.mp4`, `Chén 16 - Khỏe tưng.mp4` và `Chén 16 - Để sang mai.mp4`?
- **Lịch sử thực tế** (xác minh qua `/Volumes/Data/Quotes/data/cups/quote-015.json`, `quote-016.json`, `/Volumes/Data/Quotes/output/quote-016/` và lịch sử phiên làm việc ngày `17/11/2026`):
  1. Bài thơ `P019` (*"Tháng năm tất tả chưa từng dừng / Tiền chưa đầy túi đã đau lưng / Lắm hôm mệt quá toan buông xuống / Nhìn tờ hóa đơn… lại khỏe tưng!"*) được dựng đầu tiên ở **`quote-015.json`** (`Chén 15 - Khỏe tưng.mp4`, kịch bản `SCRIPT_GANH_NANG_COM_AO_HOA_DON_DOPING`).
  2. Tiếp đó, bài *"Cuối tháng tiền vơi, khẽ thở dài... Chuyện giữ hầu bao… để sang mai!"* được tạo ở **`quote-016.json`** và xuất ra `/Volumes/Data/Quotes/videos/Chén 16 - Để sang mai.mp4` (`SCRIPT_DE_SANG_MAI`). Tuy nhiên bản kịch bản này gặp nhiều lỗi chồng lấn đạo cụ (2 chiếc ví, đi xuyên bàn, 4 vật đỏ).
  3. Trong phiên làm việc ngày `17/11/2026`, khi thử nghiệm kịch bản mới `SCRIPT_P019_TO_HOA_DON_PHAN_CHU_V4` (tờ hóa đơn có chân `walking_bill`) và kiểm tra kiến trúc **Khai Bút 4 Pha V8.6 / V8.6.1**, lệnh render thử nghiệm cho bài *"Khỏe tưng"* đã được chạy trên slot **`quote-016`** (kèm bài *"Cập nhật"* `P022` trên slot **`quote-017`**), tạo ra tệp `/Volumes/Data/Quotes/videos/Chén 16 - Khỏe tưng.mp4` (`2.12 MB`).
  4. Sau đó (hoặc do một tác vụ kiểm toán chạy song song), tệp `/Volumes/Data/Quotes/data/cups/quote-016.json` và `/Volumes/Data/Quotes/output/quote-016/metadata.json` lại bị ghi về cấu hình nháp (`status: "draft"`) của bài `"Để sang mai"` (`SCRIPT_DE_SANG_MAI`). Vì vậy hiện tại trong `/Volumes/Data/Quotes/videos/` có cả 3 file: `Chén 15 - Khỏe tưng.mp4`, `Chén 16 - Khỏe tưng.mp4` và `Chén 16 - Để sang mai.mp4`.

---

## 5. Danh Sách Việc Sắp Làm Theo Thứ Tự Ưu Tiên (`Next Actions`)

### Ưu tiên P0 — Đồng bộ & Làm sạch các điểm lệch trước khi Commit nhánh `ci/qa-gates-1-2` (`[Đang làm / Cần xử lý ngay]`)
1. **Đồng bộ tệp Skill nội bộ `.agents/skills/dao-dien-tra-nguoi/SKILL.md` lên V8.6.1**:
   - Sao chép nội dung chuẩn V8.6.1 từ `/Volumes/Data/Quotes/docs/SKILL.md` sang `/Volumes/Data/Quotes/.agents/skills/dao-dien-tra-nguoi/SKILL.md`.
2. **Sửa tên ID đạo cụ trong `GEMINI_GEM_SYSTEM_PROMPT` & `GEMINI_SKILL_TEMPLATE_JSON` (`/Volumes/Data/Quotes/src/automation/geminiBundleBridge.ts`)**:
   - Đổi `"type": "stool"` thành `"type": "std_chair"` (hoặc `"office_stool"`) và `"type": "low_tea_table"` thành `"type": "std_tea_table"` (hoặc thêm alias `"stool"` / `"low_tea_table"` vào `/Volumes/Data/Quotes/src/stage/propCatalog.tsx` và `/Volumes/Data/Quotes/data/custom-props.json`) để triệt tiêu hoàn toàn lỗi ghế/bàn tàng hình khi AI sinh JSON theo mẫu.
3. **Cập nhật `/Volumes/Data/Quotes/scripts/qa-gates-ci.mjs` khớp với chuẩn V8.6.1**:
   - Cập nhật unit test bảng màu từ 5 bảng màu xuống **3 bảng màu** (`MINIMAL_LIGHT`, `MINIMAL_DARK`, `WARM_NOIR`), cập nhật `headerWidth = 816`, và cập nhật kiểm tra `bundleVersion === '8.6'` để `npm run qa:ci` đạt **PASS 100%**.
4. **Chốt phương án dọn các tệp Chén/Video bị trùng số với Chủ kênh**:
   - Hỏi ý kiến chủ kênh trước khi xóa các file video dư trong `/Volumes/Data/Quotes/videos/` (`Chén 13 - Người anh yêu.mp4`, `Chén 14 - Vitamin Em.mp4`, `Chén 16 - Để sang mai.mp4`) và xóa thư mục `/Volumes/Data/Quotes/videos/seo-master/`.
   - Xác nhận với chủ kênh xem `quote-016.json` sẽ giữ bài **"Khỏe tưng"** (bản `SCRIPT_P019_TO_HOA_DON_PHAN_CHU_V4`) hay dựng lại kịch bản sạch chuẩn V8.6.1 cho bài **"Để sang mai"** (`P032`).

### Ưu tiên P1 — Lên kịch bản đạo diễn V8.6.1 cho các bài tiếp theo trong kho `Production Library` (`[Yêu cầu mới nhất của Chủ kênh trước khi bàn giao]`)
- Ngay ở lượt yêu cầu thứ 10 (*"Hãy lấy các bài quote tiếp theo trong kho để lên kịch bản đạo diễn theo chuẩn V8.6.1 mới"*), chủ kênh đã yêu cầu lấy các bản ghi tiếp theo trong bảng **`Production Library`** (`tblh6mY4AwQbryx1J` trong `/Volumes/Data/Quotes/data/airtable-cache.json`, sau `P019` và `P022` — ví dụ `P020`, `P021`, `P023`, `P024`...) để đề xuất kịch bản sân khấu 3 hồi chuẩn **V8.6.1** cho các Chén tiếp theo (`Chén 18`, `Chén 19`...).
- **Lưu ý khi đạo diễn các Chén mới (`Chén 18+`)**: Chủ động đổi `visualDNA.layout` sang `WINDOW_FRAME` hoặc `SKY_QUOTE_BOTTOM_STAGE` và đổi `pivotMechanic` / `lightingGobo` để ngắt chuỗi 5 Chén liên tiếp đang trùng `CLASSIC_TOP_STAGE` + `ACCENT_PUSH_IN`.

### Ưu tiên P2 — Vá 3 lỗi Engine đã phát hiện trong đợt Audit (`[Dự định]`)
1. **Đảo lại thứ tự vẽ lớp `fore` trong `/Volumes/Data/Quotes/src/stage/DeclarativeStagePlayer.tsx` (dòng 644–649)**:
   - Cho `renderPropsByLayer('fore')` vẽ trước `renderActorsByLayer('fore')` để đạo cụ đặt trên bàn không đè lên ngực nhân vật khi nhân vật đi ngang qua.
2. **Đổi `defaultRole` của `sun / hollow_sun / crescent` trong `/Volumes/Data/Quotes/src/stage/DeclarativeStagePlayer.tsx` (dòng 372)**:
   - Đổi mặc định từ `'accent'` sang `'secondary'` để mặt trăng/mặt trời không tự biến thành màu đỏ khi người viết kịch bản không chỉ định.
3. **Bổ sung 4 cổng kiểm tra va chạm vào `auditStageVisualLayout` (`/Volumes/Data/Quotes/src/automation/geminiBundleBridge.ts`)**:
   - Kiểm tra `CATALOG_EXISTENCE` (báo lỗi nếu `prop.type` không tồn tại trong catalog và không có `shapes`), `FURNITURE_WALK_COLLISION` (chặn nhân vật đi bộ xuyên qua bàn/ghế), `PROP_ACTOR_FOOT_OVERLAP`, và `SINGLE_CINNABAR_PIVOT_AUDIT` (cảnh báo nếu có `> 1` đạo cụ/atmosphere mang màu `accent`).
