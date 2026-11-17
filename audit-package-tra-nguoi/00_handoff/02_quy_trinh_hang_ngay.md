# 02. Quy Trình Vận Hành Hằng Ngày & Vai Trò Các Công Cụ Ngoại Vi

> **Phạm vi tài liệu**: Mô tả chi tiết quy trình sản xuất một video ("Chén") từ lúc chọn ý tưởng đến khi đăng lên kênh `@tranguoi.15s` và tương tác sau đăng; phân định rõ vai trò của **Chủ kênh**, **Trợ lý AI (Gemini)** và **Trà Nguội Studio**; thời gian thực tế của từng bước; các điểm hay vướng và vai trò thật sự của **Airtable**, **Google Drive**, **Apps Script**.

---

## 1. Bảng Tổng Quan Quy Trình 7 Bước Từ Ý Tưởng Đến Sau Khi Đăng

| Bước | Tên bước | Ai thực hiện chính? | Công cụ / Tệp sử dụng | Thời gian ước tính | Trạng thái quy trình |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **1** | **Chọn hạt nhân ý tưởng & Biên tập câu chữ (L0–L3)** | **Chủ kênh + Gemini** | Airtable (`tblNySzay61Opo3SL`, `tblh6mY4AwQbryx1J`), `/Volumes/Data/Quotes/data/airtable-cache.json`, `/Volumes/Data/Quotes/studio-ui/src/airtableBatchJob.ts` | `1 – 3 phút` / bài (hoặc duyệt theo lô 5–10 bài) | `[Đã làm / Đang vận hành]` |
| **2** | **Đạo diễn Kịch bản 3 Hồi & Xuất gói `CupBundle V8.6`** | **Gemini** (dưới sự duyệt chọn của Chủ kênh) | Skill `dao-dien-tra-nguoi` (`/Volumes/Data/Quotes/docs/SKILL.md`), kho đạo cụ `/Volumes/Data/Quotes/data/custom-props.json` | `1 – 2 phút` (qua 3 nhịp hỏi–đáp) | `[Đã làm / Đang vận hành]` |
| **3** | **Nạp gói JSON vào Studio & Xem Live Preview `60fps`** | **Chủ kênh** (hoặc **Gemini** qua cơ chế Auto-Trigger) | Giao diện `http://localhost:3688` (`GeminiBundleImportModal.tsx`) hoặc `/Volumes/Data/Quotes/data/auto-render-trigger.json` | `5 – 15 giây` | `[Đã làm / Đang vận hành]` |
| **4** | **Vi chỉnh bố cục sân khấu 60fps (nếu cần)** | **Chủ kênh** (hoặc **Gemini** chỉnh JSON) | `StoryDirectorDesk.tsx`, `LivePhonePreview.tsx` (`stageTuning`, kéo X/Y/Scale từng nhân vật & đạo cụ, nút *"Tự nâng thoáng đầu"*) | `30 giây – 2 phút` (nếu có lỗi đè nét) | `[Đã làm / Đang vận hành]` |
| **5** | **Kết xuất Video MP4 chuẩn Master** | **Trà Nguội Studio** (chạy ngầm trên máy Mac) | `/Volumes/Data/Quotes/server/renderQueueService.ts` -> xuất ra `/Volumes/Data/Quotes/videos/Chén XX - Tên.mp4` | `35 – 65 giây` / video (tùy đã cache bundle Remotion hay chưa) | `[Đã làm / Đang vận hành]` |
| **6** | **Đồng bộ Tủ Chén lên Airtable & Đăng bài TikTok** | **Studio** (đồng bộ) + **Chủ kênh** (đăng trên điện thoại) | `airtableCupTracker.ts` -> Bảng `Tủ Chén & Lịch Đăng` (`tblUvm81GfyOYZ4jH`) -> Ứng dụng TikTok trên iPhone | `1 – 2 phút` | `[Đã làm / Đang vận hành]` |
| **7** | **Ghim Comment mồi, Trả lời bình luận bằng thơ 2 dòng & Chấm `TN-Score`** | **Chủ kênh + Gemini** | Skill `tranguoi-social-engagement`, bảng `Tủ Chén & Lịch Đăng` (sau 7 ngày) | `1 – 2 phút` / đợt tương tác | `[Đã làm / Đang vận hành]` |

---

## 2. Chi Tiết Từng Bước & Phân Vai Cụ Thể

### Bước 1: Chọn hạt nhân câu chữ & Duyệt biên tập (`Chủ kênh` + `Gemini`)
- **Nguồn đầu vào**:
  - Chủ kênh lấy bài từ bảng nháp **`Poetry & Quote Library`** (`tblNySzay61Opo3SL`, hiện có `139` bản ghi `Q001+`), bảng **`Wordplay & Trend Lab`** (`tblG0SqIZOVn5D2NJ`, `72` bản ghi `W001+`), hoặc bảng đã duyệt **`Production Library`** (`tblh6mY4AwQbryx1J`, hiện có `35` bản ghi `P001`..`P035` trong `/Volumes/Data/Quotes/data/airtable-cache.json`).
  - Hoặc chủ kênh đưa trực tiếp một câu thơ/ý tưởng mới vào khung chat với Gemini.
- **Vai trò của Gemini**:
  - Nếu câu chữ lấy từ kho nháp cần đánh giá biên tập: áp dụng quy trình 6 tiêu chí (`Idea`, `Naturalness`, `Conciseness`, `Personality`, `Punchline`, `Visual Potential`) và 4 mức can thiệp (`L0 KEEP` giữ nguyên văn, `L1 POLISH` chỉnh nhẹ dấu câu/ngắt dòng, `L2 REFINE` gọt chữ thừa giữ nguyên giọng, `L3 REJECT` loại bỏ).
  - Nếu đạo diễn trực tiếp qua skill `dao-dien-tra-nguoi`: đề xuất 3 phương án câu chữ (`14–28` âm tiết chuẩn vàng, trần `40` âm tiết) kèm cụm từ khóa điểm lật **`pivotWord`** ở dòng cuối và **dừng chờ chủ kênh chốt chữ**.

### Bước 2: Đạo diễn Kịch bản Sân khấu 3 Hồi & Xuất `CupBundle V8.6` (`Gemini` đề xuất $\rightarrow$ `Chủ kênh` chọn)
- **Nhịp 2a (Duyệt kịch bản 3 hồi)**:
  - Sau khi chủ kênh chốt chữ, Gemini đề xuất **3 phương án hoạt cảnh tối giản** kèm gợi ý `themeId` (`MINIMAL_LIGHT`, `MINIMAL_DARK`, hoặc `WARM_NOIR`):
    - **Hồi 1 (`0.00s → 3.80s`)**: Khai bút thư pháp chậm rãi 4 pha trên giấy trắng (chân trời `2.20s` $\rightarrow$ đạo cụ Tầng 1 `0.40s–2.25s` $\rightarrow$ đạo cụ Tầng 2 `1.15s–3.10s` & nhân vật $\rightarrow$ đạo cụ Tầng 3 mặt bàn `1.95s–3.80s`). Mọi đạo cụ giữ màu mực (`ink`/`secondary`).
    - **Hồi 2 (Tại `pivotWord`)**: Cú bẻ lái cảm xúc/hài duyên + **duy nhất 1 đạo cụ tâm điểm** (`focusRole: "hero"`) chuyển sắc **Đỏ Chu Sa** (`colorRole: "accent"`) hoặc biến hình (`morphProgress: 1` sang `altShapes`).
    - **Hồi 3 (Dư ảnh & Thu hồi nét)**: Chuyển động Cinemagraph chậm rãi đến cuối video rồi thu hồi nét cọ trong `1.35s` cuối (`outroDissolveWindow`) về trang giấy trắng để nối vòng lặp.
- **Nhịp 2b (Xuất JSON)**:
  - Chủ kênh chọn 1 trong 3 kịch bản $\rightarrow$ Gemini xuất **1 khối JSON `CupBundle V8.6` duy nhất** (chứa `segments`, `pivotWord`, `themeId`, `visualDNA`, `customCaption`, `seedComment`, `customProps` và `stageScript`).

### Bước 3 & Bước 4: Nạp vào Studio, Xem Live Preview `60fps` & Vi chỉnh (`Chủ kênh` hoặc `Gemini` trên Mac)
Có **2 đường nạp** thực tế đang hoạt động song song:
1. **Đường nạp thủ công trên giao diện Web (dành cho Chủ kênh)**:
   - Mở `Trà Nguội.app` (hoặc truy cập `http://localhost:3688`), bấm nút **`✨ Nạp Gói Gemini`** (`GeminiBundleImportModal.tsx`), dán khối JSON vừa copy $\rightarrow$ hàm `sanitizeAndNormalizeCupBundle` (`/Volumes/Data/Quotes/src/automation/geminiBundleBridge.ts`) tự động chuẩn hóa schema, kiểm tra va chạm đỉnh đầu (`auditStageVisualLayout`), lưu `data/cups/quote-XXX.json`, `data/stage-scripts.json`, `data/custom-props.json` và hiển thị ngay lên `<Player>` `60fps` trong `~0.1s`.
   - Chủ kênh có thể bật thước ngắm `Safe Đa Kênh` / `3:4 Profile` trên `LivePhonePreview.tsx` và kéo thanh trượt vị trí `X`, `Y`, `Scale` từng đạo cụ trên `StoryDirectorDesk.tsx`.
2. **Đường nạp & render tự động qua Hộp thư DropBox (dành cho Trợ lý AI chạy trên máy Mac)**:
   - Trợ lý AI ghi trực tiếp tệp `/Volumes/Data/Quotes/data/auto-render-trigger.json` (với `upsertScript`, `createCupProps` hoặc `updateCup`, và `cupIds`).
   - Tiến trình máy chủ Express (`/Volumes/Data/Quotes/server/index.ts`, dòng 337–419) quét tệp này mỗi `1.5 giây`, tự động cập nhật kịch bản, xóa cache bundle Remotion (`invalidateRemotionBundleCache`), cập nhật tệp Chén và đưa thẳng vào hàng đợi render mà không bị lỗi sandbox Chromium.

### Bước 5: Kết xuất Video MP4 (`Trà Nguội Studio`)
- Dịch vụ `/Volumes/Data/Quotes/server/renderQueueService.ts` thực thi tuần tự:
  1. Đóng gói Remotion bundle (hoặc dùng lại `cachedBundleLocation` nếu code `.ts/.tsx` và `stage-scripts.json` không đổi).
  2. Tổng hợp tệp âm thanh WAV `48 kHz` theo `audioMode` (mặc định `PIVOT_ACCENT`) vào `/Volumes/Data/Quotes/public/audio/`.
  3. Gọi `@remotion/renderer` (`renderMedia`) kết xuất `1080×1920 @ 60fps` (`H.264 High@L4.2`, `CRF 19/20`, `maxrate 5M`, `bt709`).
  4. Chạy `ffmpeg` remux siêu tốc (`< 80ms`) để xóa cờ `Lavf`, gắn `+faststart` và `creation_time` thực tế.
  5. Xuất ra **1 tệp MP4 duy nhất**: `/Volumes/Data/Quotes/output/quote-XXX/Chén XX - Tên.mp4` và sao chép sang `/Volumes/Data/Quotes/videos/Chén XX - Tên.mp4` kèm `/Volumes/Data/Quotes/output/quote-XXX/metadata.json`.

### Bước 6 & Bước 7: Đồng bộ Airtable, Đăng bài & Tương tác sau đăng (`Studio` + `Chủ kênh` + `Gemini`)
- Trên Web Studio (`http://localhost:3688`), bấm nút đồng bộ Airtable (`AirtableSyncModal.tsx` / `airtableCupTracker.ts`) để đẩy tên Chén, trạng thái `🎬 Đã xuất MP4`, khung giờ hợp, `Caption & Hashtag` và `Bình luận mồi` lên bảng **`Tủ Chén & Lịch Đăng`** (`tblUvm81GfyOYZ4jH`).
- Khi đến giờ đăng (`Sáng 06:30–08:30`, `Trưa–Chiều`, hoặc `Tối muộn 21:30–23:00`), chủ kênh lấy video `Chén XX - Tên.mp4`, mở bảng Airtable trên điện thoại để copy nhanh `Caption & Hashtag`, đăng lên TikTok và dán ngay `Bình luận mồi` ghim lên đầu.
- Khi có bình luận của người xem, chủ kênh chụp màn hình hoặc gửi nội dung bình luận cho Gemini (kích hoạt skill `tranguoi-social-engagement`) để nhận 4 phương án trả lời bằng **thơ 2 dòng** (lục bát 6–8 hoặc song thất 7–7) bắt đúng từ khóa của người xem.

---

## 3. Những Chỗ Hay Vướng Trong Thực Tế (Common Bottlenecks & Gotchas)

1. **Vướng 1 — Lỗi đặt tọa độ Đạo cụ & Nhân vật khi AI sinh kịch bản mới**:
   - **Hiện tượng**:
     - Ghế hoặc bàn bị "tàng hình" vì AI gọi `"type": "stool"` hoặc `"type": "low_tea_table"` mà không truyền `shapes` (trong khi tên thật trong `/Volumes/Data/Quotes/data/custom-props.json` là `"std_chair"`, `"office_stool"`, `"std_tea_table"`, `"std_work_desk"`).
     - Đạo cụ đặt trên mặt bàn bị bay lơ lửng hoặc chìm vào bàn do nhẩm sai cao độ `y` (ví dụ `std_work_desk` cao `-19.2px` nhưng `desk_calendar` trong `custom-props.json` đã được vẽ sẵn ở cao độ `-19.2` nên chỉ cần truyền `y: 0`, trong khi `small_cup` gốc ở `0` nên phải truyền `y: -19.2`).
     - Nhân vật đứng dậy đi bộ xuyên thẳng qua bàn làm việc (như ở bản lỗi Chén 16 `SCRIPT_DE_SANG_MAI`), hoặc đạo cụ ở `layer: "fore"` vẽ đè lên ngực nhân vật (`DeclarativeStagePlayer.tsx` dòng 644–649 vẽ `fore` actors trước `fore` props).
     - Mặt trăng `"crescent"` hoặc mặt trời `"sun"` trong `atmosphere` nếu quên ghi `"colorRole": "secondary"` sẽ bị `DeclarativeStagePlayer.tsx` (dòng 372) tự gán mặc định `"accent"` (Đỏ Chu Sa) ngay từ giây `0.00s`, làm hỏng quy tắc "duy nhất 1 điểm đỏ tại Pivot".
2. **Vướng 2 — Bẫy ghi đè thời lượng `TimelineCue` sau Pivot trong `trackCompiler.ts`**:
   - Trong `/Volumes/Data/Quotes/src/stage/trackCompiler.ts` (dòng 35–46), hàm `resolveCinemagraphDurationFrames` tự động ghi đè mọi `duration` nằm trong khoảng `[0.6s, 3.4s)` của các cue bắt đầu từ `pivot - 0.1s` trở đi thành **`3.8s`**. Nếu người viết kịch bản muốn một cử chỉ sau Pivot diễn ra trong `1.2s` hoặc `1.8s`, nó sẽ bị kéo dài thành `3.8s` (trừ khi đặt `< 0.6s` hoặc `>= 3.4s`).
3. **Vướng 3 — Xung đột độ dài Caption giữa chuẩn SEO cũ (`captionBuilder.ts`) và chuẩn Q099+ mới (`tranguoi-social-engagement`)**:
   - Skill tương tác mới (`user:tranguoi-social-engagement`) quy định Caption siêu gọn Q099+ **dưới 50 ký tự (6–10 chữ)** để không che vùng chữ thơ trên màn hình.
   - Tuy nhiên hàm kiểm toán `auditTikTokSeoCaption` trong `/Volumes/Data/Quotes/src/automation/captionBuilder.ts` (và Gate 2 trong `scripts/qa-gates-ci.mjs`) vẫn kiểm tra caption có dấu hỏi `?` và cấu trúc 2 dòng dài kiểu cũ. Khi dùng caption ngắn 1 câu không có dấu `?` (như ở `quote-016.json`), Gate 2 có thể báo lỗi `seoClean: false`.
4. **Vướng 4 — Lỗi MachPort khi gọi Chromium Headless trực tiếp từ Shell Sandbox của AI**:
   - Khi trợ lý AI chạy lệnh `npx tsx scripts/render-batch.ts` trực tiếp qua công cụ dòng lệnh (`client:run_command`), macOS sandbox chặn quyền khởi tạo MachPort của Headless Chromium làm tiến trình render bị treo hoặc sập.
   - **Cách xử lý chuẩn**: Luôn kích hoạt render thông qua tệp `/Volumes/Data/Quotes/data/auto-render-trigger.json` để tiến trình daemon của Studio đang chạy sẵn bên ngoài sandbox đảm nhiệm việc gọi Remotion/Chromium.
5. **Vướng 5 — Quên xóa cache Remotion Bundle khi chỉ sửa file `.ts`/`.tsx` hoặc `custom-props.json`**:
   - `server/renderQueueService.ts` lưu biến `cachedBundleLocation` trong RAM để tăng tốc render. Nếu sửa code trong `src/` mà chỉ gọi `/api/render/enqueue` (không truyền `upsertScript` trong `auto-render-trigger.json` hoặc không gọi `invalidateRemotionBundleCache()`), video xuất ra vẫn chạy code cũ trong bundle tạm.

---

## 4. Vai Trò Thật Của Airtable, Google Drive và Google Apps Script

### 4.1. Airtable — **ĐANG DÙNG THẬT 100% (Cơ sở dữ liệu Trung tâm & Cầu nối 2 chiều)**
- **Base đang hoạt động**: `Trà Nguội` (`app9rk1rYkbXuIi3e`), được sao lưu và đồng bộ tức thì về tệp cục bộ `/Volumes/Data/Quotes/data/airtable-cache.json` (lần đồng bộ gần nhất ghi nhận trong tệp: `2026-11-17T02:27:49.555Z`).
- **Danh sách 5 bảng thực tế đang có trong Base `app9rk1rYkbXuIi3e`** (xác minh trực tiếp từ `/Volumes/Data/Quotes/data/airtable-cache.json`):
  1. **`Poetry & Quote Library` (`tblNySzay61Opo3SL` — 139 bản ghi `Q001+`)**: Kho lưu trữ nguyên tác (`Nội dung nguyên văn`), bản biên tập (`Quote tinh chỉnh`), phân loại chủ đề, tone, caption và trạng thái của các câu thơ/quote.
  2. **`Wordplay & Trend Lab` (`tblG0SqIZOVn5D2NJ` — 72 bản ghi `W001+`)**: Xưởng thử nghiệm các câu chơi chữ, nói lái, tự trào công sở. Khi một bài từ bảng `W` được dựng thành Chén và đạt `TN-Score >= 110đ` sau 7 ngày, hàm `promoteWordplayCupToQuoteLibrary` (`/Volumes/Data/Quotes/studio-ui/src/airtableCupTracker.ts`) tự động thăng hạng bài đó sang bảng `Poetry & Quote Library` (`Q`).
  3. **`Tủ Chén & Lịch Đăng` (`tblUvm81GfyOYZ4jH` — 14 bản ghi)**: Bảng quản lý tiến độ sản xuất và lịch đăng của từng Chén (`Mã Chén`, `Trạng thái`, `Khung giờ hợp`, `Mood`, `Caption & Hashtag`, `Bình luận mồi`, `Lời dẫn trong video`, `Tên file MP4`, `Ngày đăng`, `TN-Score (7 ngày)`).
  4. **`Production Library` (`tblh6mY4AwQbryx1J` — 35 bản ghi `P001`..`P035`)**: Kho chứa các bài đã vượt qua vòng thẩm định biên tập (`L0 KEEP` / `L1 POLISH` / `L2 REFINE`), ở trạng thái `Sẵn sàng sản xuất` hoặc `Chờ duyệt` để đưa vào dựng kịch bản sân khấu (ví dụ: `P019` đã dựng thành Chén 15/16, `P022` đã dựng thành Chén 17).
  5. **`Table 1` (`tbl5fc1bf5W7dcM37` — 0 bản ghi)**: Bảng trống mặc định lúc tạo Base, không sử dụng.
- **Cơ chế kết nối kỹ thuật**:
  - Mã khóa cá nhân (`Airtable PAT`) được lưu trong `localStorage` của trình duyệt Studio (`tra_nguoi_airtable_pat`).
  - Máy chủ Vite (`/Volumes/Data/Quotes/studio-ui/vite.config.ts`) mở proxy `/airtable-api` trỏ tới `https://api.airtable.com/v0`.
  - Khi trợ lý AI cần đọc/ghi hàng loạt lên Airtable mà không cần bật hộp thoại xin quyền mạng, AI chỉ cần cập nhật đối tượng `CURRENT_AIRTABLE_BATCH_JOB` (với `batchId` mới) trong `/Volumes/Data/Quotes/studio-ui/src/airtableBatchJob.ts`; giao diện Studio đang mở sẽ tự động nhận diện qua Vite HMR, thực thi lệnh gọi API Airtable theo lô 10 bản ghi và cập nhật lại `/Volumes/Data/Quotes/data/airtable-cache.json`.

### 4.2. Google Drive — **KHÔNG DÙNG CHO KHO MÃ NGUỒN (Đã cấm đồng bộ repo; chỉ dùng lưu tài liệu nghiên cứu rời khi được yêu cầu)**
- **Trong kho mã nguồn `/Volumes/Data/Quotes`**:
  - Trước đây thư mục dự án từng bị quét bởi trình đồng bộ Google Drive Desktop, sinh ra các thư mục ẩn `.tmp.driveupload` và `.tmp.drivedownload` gây xung đột Git.
  - Từ phiên bản V8.3.1 (`/Volumes/Data/Quotes/AGENTS.md` dòng 3 và `/Volumes/Data/Quotes/scripts/qa-gates-ci.mjs` dòng 14–15), dự án áp dụng quy tắc **`GitHub-Only`**: tuyệt đối không dùng bản sao trên Google Drive làm kho code, đồng thời liệt kê `.tmp.driveupload` và `.tmp.drivedownload` vào danh sách bỏ qua (`IGNORE_DIRS` và `.gitignore`).
- **Ngoài kho mã nguồn**:
  - Google Drive / Google Docs chỉ được dùng khi chủ kênh yêu cầu xuất các báo cáo nghiên cứu độc lập sang Google Docs để đọc hoặc nạp vào NotebookLM (ví dụ: tài liệu *Quy Chuẩn Đạo Diễn Nhịp Khai Bút & Dàn Dựng Sân Khấu Hồi 1 — Trà Nguội V8.6*). Không có bất kỳ đoạn code nào trong `/Volumes/Data/Quotes/src/` hay `server/` gọi Google Drive API.

### 4.3. Google Apps Script — **KHÔNG SỬ DỤNG (`0` tệp, `0` tham chiếu trong toàn bộ dự án)**
- Kết quả quét toàn bộ kho mã nguồn `/Volumes/Data/Quotes` (`src/`, `server/`, `studio-ui/`, `scripts/`, `docs/`): **không có bất kỳ tệp `.gs`, webhook hay đoạn mã nào sử dụng Google Apps Script**.
- Toàn bộ việc tự động hóa bảng dữ liệu, kiểm tra trùng lặp, sinh bình luận mồi, tính điểm `TN-Score` và đồng bộ trạng thái đều được viết trực tiếp bằng TypeScript trong `/Volumes/Data/Quotes/studio-ui/src/airtableCupTracker.ts`, `/Volumes/Data/Quotes/studio-ui/src/airtableBatchJob.ts` và `/Volumes/Data/Quotes/src/automation/captionBuilder.ts`.
- Nếu trước đây chủ kênh từng cân nhắc dùng Apps Script trên Google Sheets trước khi chuyển hẳn sang Airtable (`app9rk1rYkbXuIi3e`), thì hiện tại luồng đó đã hoàn toàn không còn tồn tại trong hệ thống (chi tiết lịch sử trước khi lập repo Git: **`Chưa rõ`**).
