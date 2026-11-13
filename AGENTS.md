# Sổ Tay Ngữ Cảnh Dự Án — TRÀ NGUỘI (`@tranguoi.15s`) · Studio V8.3.1

> **Quy trình làm việc chuẩn (GitHub-Only)**: Chỉ làm việc trực tiếp với kho GitHub `null2028/Quotes` thông qua **GitHub MCP Server** (tạo nhánh riêng, commit, mở Pull Request, đọc kết quả GitHub Actions) và đồng bộ về `/Volumes/Data/Quotes` qua **GitHub Desktop**. Tuyệt đối không sử dụng bản sao tạm trên Google Drive.

## 1. Bản sắc kênh & Tiêu chuẩn biên tập câu chữ

- **Định vị kênh**: **TRÀ NGUỘI** (`@tranguoi.15s`) — *"Chút thơ, chút đời, chút ngẫm"*. Video dọc chuẩn **9:16 (`1080×1920`, 15 giây, 60 fps CFR — `900 frames`)** phong cách tối giản trên nền giấy trà ấm (`MINIMAL_LIGHT` / `SLATE_CALM`) hoặc nền đêm tĩnh (`MINIMAL_DARK` / `WARM_NOIR`), nét vẽ mực tàu kết hợp điểm nhấn **Đỏ Chu Sa (Cinnabar Red)** ở từ khóa điểm lật (`pivotWord`), triện `茶` góc an toàn và đạo cụ chủ đạo.
- **DNA ngôn từ ("Lắng — Kiệm lời — Đời thực — Có dư vị")**:
  - Ưu tiên chi tiết vật lý, đời thường dễ dựng thành hoạt cảnh sân khấu (ấm trà sáng, hiên nắng, chiếc ô ngày mưa, ánh đèn sau khung cửa, thẻ chấm công, thang máy văn phòng, cuốn sổ nhỏ đóng mở ký ức).
  - Nhịp đọc tối ưu **14 – 28 âm tiết tiếng Việt** cho khung 15s (trần tối đa **40 âm tiết**), luôn có **nhịp lật cảm xúc hoặc hóm ngầm** ở vế cuối phục vụ hiệu ứng tô đỏ `pivotWord` và chuyển cảnh `Act 1 → Act 2` trên sân khấu.
  - **Tuyệt đối tránh**: Từ ngữ bi lụy kịch tính (*"tê tái lòng"*, *"chôn chặt đáy Đại Dương"*), giọng răn đe/khẩu hiệu sách kỹ năng sống cũ (*"Hãy..."*, *"Đừng..."*), câu dịch cứng (*"một loại... không kể xiết"*), hoặc thơ thả thính sáo rỗng đại trà.
  - **Tôn trọng nguyên tác**: Với trích dẫn văn học có tên tác giả rõ ràng (như Lưu Quang Vũ, Nguyễn Ngọc Tư), giữ nguyên câu chữ 100%, không tự ý sửa từ.
- **Tỷ trọng Danh mục Nội dung Chiến lược (`40–30–20–10`)**:
  - **40%** Công sở · Tự trào · Chơi chữ (nói lái sạch – sang, đảo vế `A–B → B–A`, đồng âm đa nghĩa, bẻ lái châm ngôn tỉnh rụi).
  - **30%** Chiêm nghiệm · Sống chậm · Chữa lành nhẹ lòng.
  - **20%** Thả thính tinh tế · Duyên tình người trưởng thành.
  - **10%** Văn học nguyên tác có tên tác giả (`author`).
  - **Quy tắc Khung Đêm (`Night`)**: Không xếp 2 Chén khung `Night` mang sắc thái nặng/buồn (`Trầm buồn`, `Hoài niệm`, `Chua chát`) liền kề nhau mà không có 1 Chén ấm dịu (`Ấm áp`, `Nhẹ nhàng`, `Thi vị`) xen giữa (được kiểm tra trực tiếp trên `CupQueueSidebar.tsx`).

## 2. Cấu trúc Kho Airtable (Mô hình 3 Bảng Đồng bộ 2 Chiều)

- **Thông tin Base & 3 Bảng Trung tâm**:
  - **Base**: `Trà Nguội` (`app9rk1rYkbXuIi3e`)
  - **Bảng 1 — Kho thành phẩm chính**: `Poetry & Quote Library` (`tblNySzay61Opo3SL`, mã `Q001`–`Q042`+).
  - **Bảng 2 — Xưởng Chơi Chữ & Bắt Trend**: `Wordplay & Trend Lab` (`tblG0SqIZOVn5D2NJ`, mã `W001`–`W072`+), gồm 11 cột chuẩn (`ID`, `Kiểu chơi chữ`, `Cặp khóa / Mô-típ`, `Hạt nhân gốc`, `Nội dung Trà Nguội`, `Pivot Word (Đỏ Chu Sa)`, `Đạo cụ sân khấu`, `Thời điểm phù hợp`, `Chủ đề`, `TikTok Caption`, `Trạng thái dùng`).
  - **Bảng 3 — Trạm Xuất bản & Đo lường Cộng hưởng**: `Tủ Chén & Lịch Đăng` (`airtableCupTracker.ts` tự động tạo/bổ sung cột và đồng bộ 2 chiều với điện thoại, thay thế hoàn toàn luồng Google Drive & Google Tasks cũ đã gỡ bỏ). Gồm 10 cột:
    1. `Mã Chén` (`Chén 09 — Ký ức`)
    2. `Trạng thái` (`📝 Bản nháp` | `🎬 Đã xuất MP4` | `⏳ Chờ đăng` | `✅ Đã đăng TikTok`)
    3. `Khung giờ hợp` (`🌅 Sáng (06:30–08:30)` | `🌤️ Trưa–Chiều` | `🌙 Tối muộn (21:30–23:00)`)
    4. `Mood` (`Nhẹ nhàng`, `Thả thính`, `Tự trào`, `Hoài niệm`, `Suy tư`, `Ấm áp`, `Trầm buồn`, `Hài hước`, `Thi vị`)
    5. `Caption & Hashtag` (2 câu dẫn chuẩn SEO + 3–5 hashtag phân tầng có `#tranguoi`, không `#fyp`, không lặp nguyên văn quote)
    6. `Bình luận mồi` (câu mồi *Quán Trà Dưới Phần Bình Luận* thả ngay giây đầu sau khi đăng để kéo `Watch Ratio > 1.10x`)
    7. `Lời dẫn trong video` (toàn bộ câu thơ/quote + `[Nhấn đỏ: pivotWord]`)
    8. `Tên file MP4` (tên file chuẩn SEO `chen-XX-...-tra-nguoi.mp4` kèm chuẩn `🍵 Foley -14 LUFS`)
    9. `TN-Score (7 ngày)` (điểm cộng hưởng thang chuẩn `100đ` / trần `138.75đ` kèm trạng thái thăng hạng `W → Q`)
    10. `Ngày đăng` (`YYYY-MM-DD`)
  - **Bản sao cục bộ để đọc tức thì**: `/Volumes/Data/Quotes/data/airtable-cache.json`.
  - **Bảo mật Token**: Mã `pat...` được lưu riêng tư trong `localStorage` (`tra_nguoi_airtable_pat`) tại `http://localhost:3688` (tuyệt đối không yêu cầu người dùng dán token vào khung chat).

## 3. Kiến trúc Kỹ thuật Studio V8.3.1 & Chuẩn Thuật toán Video 15s

- **Ứng dụng macOS chạy ngầm**: `/Volumes/Data/Quotes/Trà Nguội.app` (`LSUIElement = true`, biểu tượng **🍵** trên Menu Bar, chạy Express API + Vite HMR tại **`http://localhost:3688`**).
- **Chuẩn Kết xuất Video & Đặt tên SEO (`server/renderQueueService.ts`, `src/automation/fileNaming.ts`)**:
  - Khung gốc **9:16 (`1080×1920`)**, **`60 fps` CFR (`900 frames`)**, `H.264 High Profile (L4.2)`, không gian màu **`bt709`** (`color_primaries=bt709:color_trc=bt709:colorspace=bt709`), bitrate **`10 Mbps`** (`maxrate 12M`, `bufsize 20M`), âm thanh **`AAC 192 kbps @ 48 kHz`**, cờ `faststart`.
  - Tự động xuất song song 2 bản sạch 100% bản quyền (không trộn cứng nhạc `.mp3` vào MP4): `/Volumes/Data/Quotes/videos/Chén XX - Tên.mp4` và bản Master đặt tên chuẩn SEO `/Volumes/Data/Quotes/videos/seo-master/chen-XX-tu-khoa-tra-nguoi.mp4`.
- **Lưới Bố cục `swissGrid` (`palettes.ts`) & Thước ngắm Vùng An Toàn 3 Chế độ (`LivePhonePreview.tsx`)**:
  - Lưới `swissGrid` chuẩn giữ lề trái `marginLeft = 132px` (`contentWidth = 816px`, `quoteBlockWidth = 732px`, né trọn dải xén biên `97px` của màn `9:19.5` và cụm nút tương tác bên phải `safeRight = 216px`).
  - Thước ngắm trực quan trên `LivePhonePreview.tsx`:
    - `1:1 Sạch`: Xem trọn bức tranh `1080×1920`.
    - `Safe Đa Kênh`: `X=[157, 833]`, `Y=[180, 1540]`, hiển thị rõ 2 dải biên `97px` bị màn hình dài `9:19.5` cắt khuất khi phóng tràn chiều dọc.
    - `Shop/Ads`: `X=[217, 803]`, `Y=[240, 1260]` dự phòng gắn giỏ hàng TikTok Shop / Spark Ads.
- **Nhịp Sinh học Chống Tĩnh 2s, Camera Push-in & Seamless Loop (`Đợt 2`)**:
  - **0.0s OCR Hook (`timelineSync.ts`, `AdaptiveTypography.tsx`)**: Dòng mở đầu hiển thị sắc nét ngay frame `0` (`opacity 0.92 → 1.0`, `blur = 0`) để AI OCR TikTok đọc tức thì và giữ chân người xem giây đầu.
  - **Vi chuyển động 68 BPM & Hạt bụi giấy tuần hoàn (`MinimalistBackground.tsx`, `CloakedTraveler.tsx`, `Atmosphere.tsx`)**: Nhịp thở `68 BPM`, tà áo lay nhẹ, khói trà, mưa/gió/lá rơi chạy theo chu kỳ ước số nguyên của tổng số frames đảm bảo nối vòng không giật hình.
  - **Virtual Camera Push-in `+4.8%` tại Pivot & Hòa nhịp Seamless Loop `13.5s–15.0s` (`DeclarativeStagePlayer.tsx`)**: Máy quay đẩy nhẹ `+4.8%` vào khoảnh khắc lật `Act 1 → Act 2`, sau đó trả êm về `1.0` ở `13.5s–15.0s` kết hợp `loopBlend` hòa về trạng thái `frame 0` để điểm cuối `15.0s` nối khít `0.0s`.
  - **Âm thanh Foley Gốc Thuần Khiết chuẩn `-14.0 LUFS` (`src/engine/foleyEngine.ts`, `BgmController.tsx`)**: Tổng hợp WAV Stereo `48 kHz` gồm lớp nền phòng trà ấm, tiếng sột soạt giấy dó theo từng dòng chữ, âm điểm nhấn tại `Pivot` (`Chén sứ khay gỗ` / `Chuông đồng trầm` / `Đóng triện gỗ`) và dư âm kết vòng, chuẩn hóa độ lớn **ITU-R BS.1770-4 `-14.0 LUFS` (`-1.5 dBTP`)** giúp giữ nhãn **Original Audio 100%** đa kênh trước khi lót nhạc xu hướng `3%–8%` trực tiếp trên TikTok lúc đăng.
- **Động cơ Cộng hưởng `TN-Score` & Thăng hạng 1 chạm `W → Q` (`Đợt 3`)**:
  - Đo sau **7 ngày đăng** ngay trên `LivePhonePreview.tsx`:
    - `Completion%` (mốc `80%` = `30đ`, trần `37.5đ`) + `WatchRatio` (mốc `1.10x` = `25đ`, trần `33.75đ`) + `Share%` (mốc `1.20%` = `20đ`, trần `30đ`) + `Save%` (mốc `2.50%` = `15đ`, trần `22.5đ`) + `Comment%` (mốc `0.50%` = `10đ`, trần `15đ`).
  - Khi **`TN-Score ≥ 110đ` (Nhóm Bứt phá)**: Bấm **`Thăng hạng W → Kho Q`** để tự động đổi trạng thái bản ghi bên bảng `W` sang `Đã chuyển sang Kho Q` và tạo mã `Q0XX` mới bên bảng `Q`.
- **Kiểm thử Tự động CI trên GitHub Actions (`Đợt 4`)**:
  - Mọi nhánh `push` và `pull_request` vào `main` tự động chạy `scripts/qa-gates-ci.mjs` để kiểm định Gate 1 (sạch `.mp3`, sạch `tsc`) và Gate 2 (âm tiết trần `40`, SEO, Bình luận mồi, `TN-Score`, `60 fps` & `marginLeft = 132px`, tỷ trọng `40–30–20–10`).

## 4. Quy trình 3 bước bắt buộc khi làm hoặc biên tập lại Chén

1. **Bước 1 — Tinh chỉnh câu chữ từ bản gốc & Chờ duyệt (Gated Step)**:
   - Ngay sau khi chọn được content làm Chén (trừ trích dẫn văn học có tên tác giả rõ ràng thì giữ nguyên 100%), luôn đề xuất các phương án **tinh chỉnh từ nội dung gốc** để **làm mạnh điểm rơi**, **làm dịu/tiết chế hơn**, hoặc **chuyển sang nhịp thơ tự nhiên** (khẩu ngữ mượt như hơi thở, tối ưu 14–28 âm tiết, trần tối đa 40 âm tiết, không ép vần, không chêm từ nối mòn), đặt cạnh bản gốc kèm `pivotWord` gợi ý.
   - **Bắt buộc dừng lại chờ người dùng duyệt chốt câu chữ ở bước này rồi mới làm tiếp theo quy trình.**
2. **Bước 2 — Phân tích ẩn dụ & Đề xuất 3 kịch bản sân khấu**:
   - Khi câu chữ đã được duyệt, phân tích tầng ý nghĩa ẩn dụ (tránh minh họa nghĩa đen ngô nghê) và **đề xuất 3 phương án kịch bản sân khấu** (`Act 1` → `Act 2 tại Pivot` → `Act 3 Dư ảnh nối vòng 15s→0s` + đạo cụ **Đỏ Chu Sa**) để người dùng chốt phương án.
3. **Bước 3 — Đẩy lên Nhánh GitHub & Đồng bộ Studio**:
   - Ghi cập nhật vào nhánh GitHub (`data/cups.json`, `data/stage-scripts.json`, `data/custom-props.json`, `data/vault-meta.json`), kiểm tra xanh các Gate trên GitHub Actions rồi kéo về `/Volumes/Data/Quotes` qua **GitHub Desktop** để tinh chỉnh hoặc xuất MP4 chuẩn `1080×1920` (`60 fps`, `bt709`, `10M`, Foley `-14.0 LUFS`) trên `http://localhost:3688`.
