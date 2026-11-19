# Sổ Tay Ngữ Cảnh Dự Án — TRÀ NGUỘI (`@tranguoi.15s`)

> **Mọi agent đọc file này đầu tiên**, sau đó đọc ngay [docs/BAN-DO-HE-THONG.md](docs/BAN-DO-HE-THONG.md), [docs/NHAT-KY-QUYET-DINH.md](docs/NHAT-KY-QUYET-DINH.md) và [docs/QUY-TRINH-LAM-VIEC.md](docs/QUY-TRINH-LAM-VIEC.md) trước khi sửa bất kỳ dòng code nào.

> **MỤC ĐÍCH GỐC (không bao giờ quên):** sáng tạo tự do cho từng câu quote, trong khuôn khổ KHÔNG lỗi toạ độ, KHÔNG lỗi đồ vật, KHÔNG vỡ hình.
> **Nguyên tắc từ 19/11:** AI tự do về hình (ý tưởng, dáng, vị trí, chuyển động) · Máy chỉ chặn VỠ HÌNH (đè, xuyên, lơ lửng, ngoài khung, đè chữ, sai số vật đỏ) · Mắt (preview, rồi chủ kênh) quyết video có nghĩa không. Gu và nhịp là ghi chú, không phải luật chặn. Chỉ thêm luật khi thấy cùng một lỗi trên video thật 2 lần.

## 1. Dự án là gì & Kiến trúc hiện hành

- **Trà Nguội Studio** là hệ thống dựng video thơ/quote ngắn bằng **Remotion + React/Vite/Express** (`/Volumes/Data/Quotes`, chạy cục bộ tại `http://localhost:3688` qua `npm run app` hoặc `Trà Nguội.app`).
- **Luồng chính hiện hành (Gói Chén ngữ nghĩa)**:
  0. Sáng tác câu chữ trên Gemini Web bằng skill `sang-tac-tra-nguoi` (`sang-tac-tra-nguoi.zip`): Gemini sinh 12 bản thô → lọc bằng `kiem_cau.py` + một lượt biên tập riêng → chủ kênh chốt → câu chốt giữ nguyên văn sang skill đạo diễn.
  1. Đạo diễn trên Gemini Web dùng Skill sinh từ code (`npm run gen:skill` → `.agents/skills/dao-dien-tra-nguoi/dao-dien-tra-nguoi.zip`, kho đạo cụ 3 tầng A/B/C & 9 bộ bối cảnh `boi_canh.bo`) xuất **1 khối JSON Gói Chén** (`phien_ban_goi: 1`, không toạ độ/không `shapes`).
  2. Dán vào Studio UI (`GeminiBundleImportModal`) hoặc chạy CLI (`npx tsx scripts/check-goi.mjs <file.json>`) → `parseGoiChen` → `compileSemanticStageScript` → `stageValidator` chặn cứng → `DeclarativeStagePlayer` → render MP4.
  3. **51 kịch bản cũ** (`LEGACY_SCENE_IDS` + `data/custom-props.json`) và 12 cảnh gốc được đóng băng riêng; mọi kịch bản mới bắt buộc theo chuẩn Gói Chén + Validator chặn cứng.

## 2. Bản sắc kênh, Dữ liệu Airtable & Chuẩn xuất video

- **Bản sắc kênh**: `@tranguoi.15s` — *"Chút thơ, chút đời, chút ngẫm"*. Lữ khách bóng mực thuỷ mặc tối giản (**không mắt, không lá trà**, cỡ đứng cố định `28%` vùng hình), nền giấy trà ấm (`MINIMAL_LIGHT`) hoặc đêm tĩnh (`MINIMAL_DARK` / `WARM_NOIR`), đúng **1 điểm nhấn Đỏ Chu Sa** gắn với từ khóa cú lật (`cu_lat`).
- **DNA ngôn từ ("Lắng — Kiệm lời — Đời thực — Có dư vị")**: độ dài theo 4 dải S 6–13 · M 14–28 · L 29–42 · XL 43–58 âm tiết; trần 48 cho tự sáng tác, 58 cho trích dẫn có tác giả; thả thính/hài mặc định dải M; thời lượng video do engine tự tính, tỷ trọng `40%` công sở/tự trào · `30%` chiêm nghiệm · `20%` duyên tình · `10%` văn học nguyên tác (giữ nguyên văn 100%). Tránh sáo rỗng, khẩu hiệu giáo điều, hashtag rác.
- **Kho tách tệp & Airtable 3 bảng**:
  - Mỗi Chén lưu gọn tại `data/cups/quote-XXX.json` (lưu kèm `goiChenGoc` khi nhập Gói Chén); sân khấu tại `data/stage-scripts.json`; bản sao Airtable cục bộ tại `data/airtable-cache.json`.
  - Base `Trà Nguội` (`app9rk1rYkbXuIi3e`): `Poetry & Quote Library` (`tblNySzay61Opo3SL`, `Q*`), `Wordplay & Trend Lab` (`tblG0SqIZOVn5D2NJ`, `W*`), `Tủ Chén & Lịch Đăng` (`airtableCupTracker.ts`).
- **Chuẩn xuất video**: **9:16 (`1080×1920`)**, **60 fps CFR**, `H.264 High Profile (L4.2)`, màu **`bt709`**, `10 Mbps`, âm thanh **Foley gốc `AAC 192 kbps @ 48 kHz` chuẩn `-14.0 LUFS`**, lưới `swissGrid` (`marginLeft=132px`, né safe zone đa kênh); xuất song song `/Volumes/Data/Quotes/videos/` và `videos/seo-master/`.

## 3. Bốn luật làm việc bắt buộc cho mọi agent

1. **Tra bản đồ trước khi thêm cơ chế mới**: kiểm tra `docs/BAN-DO-HE-THONG.md` xem đã có cơ chế cùng việc chưa; nếu có thì mở rộng hoặc sửa cái cũ, **không dựng cơ chế thứ hai chồng lên**.
2. **Không thêm HÀNH VI NGẦM ngoài yêu cầu task**: không tự sửa/tự ép/tự chọn ngẫu nhiên ngoài phạm vi được giao. Nếu thấy cần → ghi mục **`ĐỀ XUẤT`** trong báo cáo, mặc định **TẮT**.
3. **Đồng bộ bản đồ & báo cáo thay đổi hành vi**: mỗi task làm thay đổi hành vi hệ thống bắt buộc cập nhật đúng dòng trong `docs/BAN-DO-HE-THONG.md` + thêm 1 dòng vào báo cáo dưới mục **"Thay đổi hành vi"**.
4. **Báo xong phải kèm BẰNG CHỨNG thật**: luôn đính kèm output lệnh thật (`npm run typecheck`, `check-goi`...) và ảnh xuất từ **luồng render thật** (Remotion / `stage-preview.mjs`), tuyệt đối không mô tả suông.
