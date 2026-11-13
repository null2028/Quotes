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

## 2. Cấu trúc Kho Dữ Liệu Tách Tệp (`data/cups/*.json`) & Airtable 3 Bảng

- **Kiến trúc Lưu trữ Tách Tệp Hướng 2 (`server/cupStore.ts`)**:
  - Mỗi Chén được lưu thành 1 tệp độc lập gọn nhẹ (`~38 dòng` / `1.2 KB`) tại `data/cups/quote-XXX.json` (`quote-001.json` .. `quote-360.json`), chỉ giữ dữ liệu biên tập câu chữ, `stageTuning`, SEO và mã tham chiếu `sceneId` (không nhúng trùng `stageScript` hay `customPropsResolved` xuống đĩa).
  - Kịch bản sân khấu lưu tại `data/stage-scripts.json` (gọt sạch `customPropsResolved`), hình học đạo cụ SVG lưu tại `data/custom-props.json`, và danh mục Kho Cảnh lưu tại `data/vault-meta.json`. Khi chạy Studio hoặc xuất MP4, `cupStore.ts` tự ghép trên RAM giúp `<Player>` phản hồi `0.01s`.
- **Thông tin Base & 3 Bảng Trung tâm Airtable**:
  - **Base**: `Trà Nguội` (`app9rk1rYkbXuIi3e`)
  - **Bảng 1 — Kho thành phẩm chính**: `Poetry & Quote Library` (`tblNySzay61Opo3SL`, mã `Q001`–`Q042`+).
  - **Bảng 2 — Xưởng Chơi Chữ & Bắt Trend**: `Wordplay & Trend Lab` (`tblG0SqIZOVn5D2NJ`, mã `W001`–`W072`+).
  - **Bảng 3 — Trạm Xuất bản & Đo lường Cộng hưởng**: `Tủ Chén & Lịch Đăng` (`airtableCupTracker.ts` đồng bộ 2 chiều 10 cột chuẩn).
  - **Bản sao cục bộ để đọc tức thì**: `/Volumes/Data/Quotes/data/airtable-cache.json` (mã `pat...` bảo mật riêng trong `localStorage` `tra_nguoi_airtable_pat` tại `http://localhost:3688`).

## 3. Kiến trúc Kỹ thuật Studio V8.3.1 & Chuẩn Thuật toán Video 15s

- **Ứng dụng macOS chạy ngầm**: `/Volumes/Data/Quotes/Trà Nguội.app` (`LSUIElement = true`, biểu tượng **🍵** trên Menu Bar, chạy Express API + Vite HMR tại **`http://localhost:3688`**).
- **Chuẩn Kết xuất Video & Đặt tên SEO (`server/renderQueueService.ts`, `src/automation/fileNaming.ts`)**:
  - Khung gốc **9:16 (`1080×1920`)**, **`60 fps` CFR (`900 frames`)**, `H.264 High Profile (L4.2)`, không gian màu **`bt709`** (`color_primaries=bt709:color_trc=bt709:colorspace=bt709`), bitrate **`10 Mbps`** (`maxrate 12M`, `bufsize 20M`), âm thanh **`AAC 192 kbps @ 48 kHz`**, cờ `faststart`.
  - Tự động xuất song song 2 bản sạch 100% bản quyền (không trộn cứng nhạc `.mp3` vào MP4): `/Volumes/Data/Quotes/videos/Chén XX - Tên.mp4` và bản Master đặt tên chuẩn SEO `/Volumes/Data/Quotes/videos/seo-master/chen-XX-tu-khoa-tra-nguoi.mp4`.
- **Lưới Bố cục `swissGrid` (`palettes.ts`) & Thước ngắm Vùng An Toàn 3 Chế độ (`LivePhonePreview.tsx`)**:
  - Lưới `swissGrid` chuẩn giữ lề trái `marginLeft = 132px` (`contentWidth = 816px`, `quoteBlockWidth = 732px`, né trọn dải xén biên `97px` của màn `9:19.5` và cụm nút tương tác bên phải `safeRight = 216px`).
  - Thước ngắm trực quan trên `LivePhonePreview.tsx`: `1:1 Sạch`, `Safe Đa Kênh` (`X=[157, 833]`, `Y=[180, 1540]`) và `Shop/Ads` (`X=[217, 803]`, `Y=[240, 1260]`).
- **Nhịp Sinh học Chống Tĩnh 2s, Camera Push-in, Seamless Loop & Foley `-14.0 LUFS`**:
  - **0.0s OCR Hook**: Dòng đầu hiện rõ ngay `frame 0` (`opacity 0.92 → 1.0`, `blur = 0`).
  - **Vi chuyển động 68 BPM, Push-in `+4.8%` tại Pivot & Seamless Loop**: Nối mượt `frame 899 → frame 0`.
  - **Âm thanh Foley Gốc `-14.0 LUFS` (`src/engine/foleyEngine.ts`)**: WAV Stereo `48 kHz` chuẩn ITU-R BS.1770-4 `-14.0 LUFS` (`-1.5 dBTP`).
- **Động cơ Cộng hưởng `TN-Score` & Kiểm thử Tự động GitHub Actions**:
  - Thang điểm `100.00đ` chuẩn / `138.75đ` trần; từ `110đ` mở khóa `Thăng hạng W → Kho Q`.
  - Mọi nhánh `push` và `pull_request` tự động chạy `scripts/qa-gates-ci.mjs` kiểm định Gate 1 & Gate 2; chạy `npm run qa:5gates` để nghiệm thu trọn gói cả render MP4 thực tế (Gate 3–5).

## 4. Quy trình 3 bước bắt buộc khi làm hoặc biên tập lại Chén

1. **Bước 1 — Tinh chỉnh câu chữ từ bản gốc & Chờ duyệt (Gated Step)**: Đề xuất 3 phương án tinh chỉnh (tối ưu `14–28` âm tiết, trần tối đa `40` âm tiết; riêng trích dẫn văn học có `author` giữ nguyên 100%) kèm `pivotWord` và **dừng chờ chốt chữ**.
2. **Bước 2 — Phân tích ẩn dụ & Đề xuất 3 kịch bản sân khấu**: Đề xuất 3 phương án `Act 1 → Act 2 tại Pivot → Act 3 Dư ảnh nối vòng` + đạo cụ **Đỏ Chu Sa** để chốt phương án.
3. **Bước 3 — Ghi tệp `data/cups/quote-XXX.json` trên GitHub & Đồng bộ Studio**: Commit tệp gọn nhẹ lên nhánh GitHub, kiểm tra tích xanh GitHub Actions rồi bấm **Pull origin** trên **GitHub Desktop** về `/Volumes/Data/Quotes`.
