# 01. Mục Đích, Tầm Nhìn & Phạm Vi Hệ Thống — Trà Nguội Studio (`@tranguoi.15s`)

> **Phạm vi tài liệu**: Tài liệu này mô tả bài toán thực tế mà **Trà Nguội Studio** giải quyết, mục tiêu của kênh TikTok `@tranguoi.15s`, tiêu chí hoàn thành ("xong") ở từng cấp độ và những giới hạn mà công cụ chủ động **không làm**.
> **Nguyên tắc ghi nhận**: Chỉ ghi thông tin xác thực từ mã nguồn `/Volumes/Data/Quotes/`, dữ liệu Airtable cục bộ `/Volumes/Data/Quotes/data/airtable-cache.json` và lịch sử vận hành thực tế. Những thông số chưa có quyết định cố định được ghi rõ là **`Chưa rõ`**.

---

## 1. Công cụ sinh ra để giải quyết vấn đề gì?

### 1.1. Bài toán thực tế trước khi có công cụ (`[Đã làm / Đã xác minh]`)
Khi xây dựng kênh video ngắn dạng chữ & thơ minh họa tối giản (`9:16`, 15 giây) trên TikTok, quy trình dựng thủ công hoặc dùng AI sinh video thông thường gặp **5 điểm nghẽn lớn**:

1. **Mất đồng bộ giữa nhịp đọc câu chữ và điểm lật hình ảnh (`Pivot Sync`)**:
   - Thơ 4 câu hoặc trích dẫn ngắn của kênh luôn có một từ khóa bẻ lái cảm xúc hoặc hài ngầm ở vế cuối (`pivotWord`). Nếu dựng bằng phần mềm cắt ghép thông thường (CapCut/Premiere), việc căn chỉnh từng dòng chữ thấm mực, thanh dẫn hướng dọc, tiếng động Foley và thời điểm đạo cụ trên sân khấu đổi màu/biến hình đúng đến từng khung hình (`1/60 giây`) tốn rất nhiều thao tác lặp lại.
   - **Giải pháp trong code**: Bộ đồng bộ thời gian `/Volumes/Data/Quotes/src/engine/timelineSync.ts` (`computeTimelineSync`) tự động tính toán `startFrame`, `endTypingFrame` cho từng dòng và khóa chính xác `pivotFrame = startFrame + 0.38s` (`+23 frames @ 60fps`), điều khiển đồng thời chữ (`AdaptiveTypography.tsx`), sân khấu (`DeclarativeStagePlayer.tsx`) và âm thanh (`foleyEngine.ts`).

2. **Rào cản viết code khi đạo diễn hoạt cảnh mới**:
   - Nếu mỗi bài thơ mới đều phải viết một React/Remotion component `.tsx` thủ công, chủ kênh bị phụ thuộc vào việc lập trình và dễ gặp lỗi cú pháp TypeScript hoặc lệch tọa độ.
   - **Giải pháp trong code**: Xây dựng kiến trúc kịch bản sân khấu khai báo bằng JSON (`StageScript` trong `/Volumes/Data/Quotes/src/stage/stageScriptSchema.ts` và `/Volumes/Data/Quotes/src/stage/trackCompiler.ts`) kết hợp cầu nối `CupBundle` (`/Volumes/Data/Quotes/src/automation/geminiBundleBridge.ts`). Trợ lý AI bên ngoài (thông qua skill `dao-dien-tra-nguoi`) chỉ cần xuất **1 khối JSON duy nhất** để chủ kênh dán 1 chạm vào giao diện Web Studio (`/Volumes/Data/Quotes/studio-ui/src/components/GeminiBundleImportModal.tsx`) xem trước ở `60fps` ngay lập tức.

3. **Lỗi cắt xén giao diện điện thoại & che khuất bởi UI TikTok (`Safe Zone Collision`)**:
   - Màn hình iPhone tỷ lệ `9:19.5` cắt mất lề trái/phải của video `9:16` (`1080×1920`), trong khi cột nút bấm bên phải (Avatar, Tim, Bình luận, Lưu) và vùng Caption bên dưới của TikTok che khuất nội dung.
   - **Giải pháp trong code**: Khóa cứng lưới `swissGrid` trong `/Volumes/Data/Quotes/src/theme/palettes.ts` (`stageLeft = 132px`, `stageWidth = 816px`, `quoteBlockWidth = 700px` nằm gọn trong `X = [132..832]`, `Y = [268..1538]`) kèm lớp phủ thước ngắm trực quan 4 chế độ trên `/Volumes/Data/Quotes/studio-ui/src/components/LivePhonePreview.tsx`.

4. **Nguy cơ bị thuật toán TikTok đánh dấu nội dung trùng lặp / sản xuất hàng loạt (`Template Fingerprint`)**:
   - Nếu mọi video đều có thời lượng cố định đúng `15.00s` (`900 frames`), cùng một bố cục tĩnh và cùng siêu dữ liệu FFmpeg (`Lavf`), kênh dễ bị giảm phân phối tự nhiên.
   - **Giải pháp trong code**:
     - Thời lượng động `AUTO_SEED` (`810..990 frames` / `13.5s–16.5s @ 60fps`, loại trừ mốc cứng `900f`) trong `/Volumes/Data/Quotes/src/engine/timelineSync.ts`.
     - Hệ trục biến thiên `VisualDNA` (`/Volumes/Data/Quotes/src/engine/visualDnaResolver.ts`) và bộ cảnh báo lặp bố cục/bảng màu trên `/Volumes/Data/Quotes/studio-ui/src/airtableCupTracker.ts`.
     - Quy trình hậu xử lý Remux xóa sạch dấu vết `Lavf` và gắn `creation_time` thực tế trong `/Volumes/Data/Quotes/server/renderQueueService.ts`.

5. **Rủi ro bản quyền âm thanh**:
   - Việc ghép cứng nhạc nền `.mp3` bên ngoài vào file `.mp4` dễ dẫn tới tắt tiếng hoặc đánh gậy bản quyền khi đăng tải.
   - **Giải pháp trong code**: Cấm tuyệt đối tệp `.mp3` trong kho mã nguồn (kiểm tra tự động bởi Gate 1 tại `/Volumes/Data/Quotes/scripts/qa-gates-ci.mjs`); toàn bộ âm thanh trong MP4 xuất ra là âm thanh tổng hợp toán học bằng DSP (`/Volumes/Data/Quotes/src/engine/foleyEngine.ts`) ở chuẩn `48 kHz` (`PIVOT_ACCENT`, `FOLEY_MASTER`, hoặc `TIKTOK_SILENT`).

---

## 2. Mục tiêu kênh `@tranguoi.15s`

| Hạng mục | Thông tin xác thực | Nguồn tham chiếu |
| :--- | :--- | :--- |
| **Tên kênh & ID** | **Trà Nguội** (`@tranguoi.15s`) | `/Volumes/Data/Quotes/AGENTS.md`, `/Volumes/Data/Quotes/CONTEXT.md` |
| **Tagline** | *"Chút thơ, chút đời, chút ngẫm"* | `/Volumes/Data/Quotes/AGENTS.md` |
| **Nền tảng chính** | **TikTok** (video ngắn dọc `9:16`, `1080×1920 @ 60fps`). Lưới hiển thị tương thích cả **Reels / YouTube Shorts** nhờ vùng an toàn đa kênh (`Safe Đa Kênh` trên `LivePhonePreview.tsx`). | `/Volumes/Data/Quotes/src/theme/palettes.ts`, `/Volumes/Data/Quotes/studio-ui/src/components/LivePhonePreview.tsx` |
| **Định dạng nội dung** | Thơ ngắn (chủ đạo là thơ 4 câu / lục bát biến thể) và trích dẫn văn xuôi ngắn (`14–28` âm tiết là khoảng vàng, trần tối đa `40` âm tiết; trích dẫn văn học có tên tác giả được giữ nguyên văn 100%). | `/Volumes/Data/Quotes/src/engine/timelineSync.ts`, `/Volumes/Data/Quotes/docs/SKILL.md` |
| **Bản sắc thị giác** | Phong cách tối giản trên nền giấy trà ấm (`MINIMAL_LIGHT`), giấy khói chiều (`MINIMAL_DARK`) hoặc nền đêm tối ấm (`WARM_NOIR`). Nhân vật **Lữ Khách Áo Choàng** (`CloakedTraveler.tsx`) và đạo cụ phác nét cọ thư pháp chậm rãi (`0.00s → 3.80s`), chỉ bừng **1 điểm nhấn Đỏ Chu Sa (`#CE472E`)** tại đúng từ khóa điểm lật (`pivotWord`). | `/Volumes/Data/Quotes/src/theme/palettes.ts`, `/Volumes/Data/Quotes/src/kit/CloakedTraveler.tsx`, `/Volumes/Data/Quotes/src/stage/trackCompiler.ts` |
| **Khung giờ đăng chuẩn** | Chia thành **3 khung giờ** trong `/Volumes/Data/Quotes/studio-ui/src/airtableCupTracker.ts`:<br>- **🌅 Sáng (`Morning`)**: `06:30–08:30`<br>- **🌤️ Trưa–Chiều (`Anytime`)**: khung giờ ban ngày/chiều<br>- **🌙 Tối muộn (`Night`)**: `21:30–23:00` | `/Volumes/Data/Quotes/studio-ui/src/airtableCupTracker.ts` (dòng 56–74) |
| **Tần suất đăng bài mục tiêu** | **Chưa rõ** con số cố định theo ngày (ví dụ 1 bài/ngày hay 2–3 bài/ngày chưa được khóa cứng trong tài liệu). Tuy nhiên hệ thống lịch đăng hỗ trợ đủ 3 khung giờ/ngày và bộ lưu trữ tách tệp trong `/Volumes/Data/Quotes/AGENTS.md` được thiết kế cho quy mô `quote-001.json` .. `quote-360.json` (tương đương ~360 Chén/năm). | `/Volumes/Data/Quotes/AGENTS.md` (mục 2), `/Volumes/Data/Quotes/studio-ui/src/airtableCupTracker.ts` |
| **Mục tiêu dài hạn & Cơ chế đo lường** | - Xây dựng thư viện nội dung có chiều sâu, tự động đo lường độ cộng hưởng sau 7 ngày đăng qua chỉ số **`TN-Score`** (`/Volumes/Data/Quotes/src/automation/captionBuilder.ts`, mốc chuẩn `100.00đ`, trần `138.75đ` dựa trên `Completion Rate`, `Watch Ratio`, `Share Rate`, `Save Rate`, `Comment Rate`).<br>- Các bài thử nghiệm chơi chữ từ bảng `Wordplay & Trend Lab` (`W001+`) đạt **`TN-Score >= 110đ`** được mở khóa thăng hạng chính thức vào kho thành phẩm `Poetry & Quote Library` (`Q001+`).<br>- Con số mục tiêu doanh thu / số lượng người theo dõi cụ thể: **Chưa rõ**. | `/Volumes/Data/Quotes/src/automation/captionBuilder.ts`, `/Volumes/Data/Quotes/studio-ui/src/airtableCupTracker.ts` |

---

## 3. Tiêu chí “Xong” (Definition of Done)

### 3.1. Khi nào một “Chén” (1 video đơn lẻ) được coi là “Xong”? (`[Đã xác minh trong code]`)
Một Chén (`quote-XXX`) được tính là hoàn chỉnh để sẵn sàng đăng TikTok khi thỏa mãn đủ 6 tiêu chí:
1. **Dữ liệu câu chữ & biên tập hợp lệ**:
   - Đã chốt `segments` (nằm trong trần `<= 40` âm tiết, hoặc giữ nguyên 100% nếu có `author`) và `pivotWord` xuất hiện chính xác trong nội dung câu chữ (`ensureValidPivotSubstring` tại `/Volumes/Data/Quotes/src/automation/validator.ts`).
   - Có tệp cấu hình gọn nhẹ tại `/Volumes/Data/Quotes/data/cups/quote-XXX.json` (`status: "completed"`, `progress: 100`).
2. **Kịch bản sân khấu 3 hồi đạt chuẩn thẩm mỹ V8.6.1**:
   - Kịch bản lưu trong `/Volumes/Data/Quotes/data/stage-scripts.json` và đạo cụ lưu trong `/Volumes/Data/Quotes/data/custom-props.json`.
   - Hồi 1 (`0.00s → 3.80s`) chạy mượt 4 pha khai bút thư pháp chậm rãi theo đường cong `Cosine S-Curve`; nhân vật ngồi khớp ghế (2-Bone IK), đạo cụ mặt bàn đặt đúng cao độ, không đè chữ hay cắt ngang đầu nhân vật (`layoutWarnings.length === 0`).
   - Hồi 2 tại `pivotFrame` bật đúng **1 điểm nhấn Đỏ Chu Sa** tương ứng với `pivotWord`.
   - Hồi 3 giữ dư ảnh tĩnh tại và thu hồi nét mượt mà trong `1.35s` cuối (`outroDissolveWindow`) về trang giấy trắng để nối vòng lặp (`Seamless Loop`).
3. **Kết xuất thành công 1 tệp MP4 duy nhất chuẩn kỹ thuật**:
   - Có mặt tệp `/Volumes/Data/Quotes/output/quote-XXX/Chén XX - Tên.mp4` và bản sao tại `/Volumes/Data/Quotes/videos/Chén XX - Tên.mp4` kèm `/Volumes/Data/Quotes/output/quote-XXX/metadata.json`.
   - Thông số MP4: `1080×1920`, `60 fps` CFR, `H.264 High@L4.2`, `bt709`, `CRF 19` (sáng) / `CRF 20` (tối), `maxrate 5M`, đã xóa sạch cờ `Lavf`, có `faststart: true`.
4. **Đầy đủ bộ siêu dữ liệu tương tác TikTok**:
   - Có `captionText` không lặp nguyên văn câu thơ trong video, kèm đúng `4–5` hashtag bắt đầu bằng `#tranguoi` (không chứa `#fyp`, `#xuhuong`, `#viral`) và có `seedComment` (bình luận mồi ghim đầu bài).
5. **Đồng bộ lên bảng theo dõi Airtable**:
   - Bản ghi của Chén được cập nhật lên bảng `Tủ Chén & Lịch Đăng` (`tblUvm81GfyOYZ4jH`) với trạng thái `🎬 Đã xuất MP4` / `⏳ Chờ đăng` / `✅ Đã đăng TikTok`.

### 3.2. Khi nào một bản cập nhật Code / Engine được coi là “Xong”? (`[Đã xác minh trong code]`)
1. **Qua cổng Gate 1 (`npm run qa:gate1` trong `/Volumes/Data/Quotes/scripts/qa-gates-ci.mjs`)**:
   - `0` tệp `.mp3` vật lý trong repo, `0` chuỗi tham chiếu `.mp3` hoạt động trong mã nguồn/JSON.
   - `npx tsc -p tsconfig.json --noEmit` và `studio-ui` đạt `0` lỗi kiểu TypeScript.
2. **Qua cổng Gate 2 (`npm run qa:gate2` trong `/Volumes/Data/Quotes/scripts/qa-gates-ci.mjs`)**:
   - Toàn bộ Unit Tests thuật toán cốt lõi và kiểm toán các tệp `data/cups/quote-*.json` đạt `0` lỗi cứng (`hardViolations.length === 0`).
3. **Qua nghiệm thu thị giác thực tế (Gate 3–5 / Live Preview & Render)**:
   - Kiểm tra trực tiếp trên giao diện `<Player>` `60fps` tại `http://localhost:3688` hoặc trích xuất frame từ file `.mp4` đã render để xác nhận không có lỗi hình học (nhân vật ngồi lơ lửng, đi xuyên bàn, đạo cụ đè lên người, hoặc nổ nhiều mảng đỏ cùng lúc).

---

## 4. Những việc Tool KHÔNG nên làm (Non-Goals & Anti-Patterns)

Dựa trên lịch sử tiến hóa từ V2 đến V8.6.1 và các quy tắc cứng trong `/Volumes/Data/Quotes/AGENTS.md`, `/Volumes/Data/Quotes/docs/v6_0_clean_manual_studio_workbench_spec.md`, công cụ **Trà Nguội Studio** chủ động **KHÔNG làm** 7 việc sau:

1. **Không gọi LLM/AI API trực tiếp bên trong Backend của Studio để tự vẽ cảnh hay tự chấm điểm VLM**:
   - Ở các bản V3–V5, việc nhúng API key và pipeline 5 lớp VLM vào `server/` gây chậm (`30–90s`), tốn chi phí token ngầm và sinh ra các icon clipart rườm rà. Từ V6.0 trở đi, Studio là **bàn dựng và kết xuất thuần khiết (100% Zero-AI trong backend)**; toàn bộ phần suy luận ý tưởng và viết kịch bản JSON được tách ra cho trợ lý AI bên ngoài thực hiện thông qua `CupBundle`.
2. **Không tự ý sửa câu chữ nguyên tác hoặc viết lại thơ khi không có lý do chính đáng**:
   - Theo quy tắc biên tập (`workflows/tra_nguoi_editorial`), cột `Nội dung nguyên văn` trên Airtable là bất khả xâm phạm. Với trích dẫn văn học có tên tác giả (`author`), tuyệt đối giữ nguyên 100% từng từ và dấu câu.
3. **Không dùng cũng như không trộn nhạc nền `.mp3` vào file video kết xuất**:
   - Không lưu trữ và không ghép nhạc thương mại `.mp3` vào MP4. Việc chọn nhạc xu hướng (nếu có) được chủ kênh thực hiện trực tiếp trên ứng dụng TikTok khi đăng bài.
4. **Không vẽ minh họa tả thực chi tiết kiểu quảng cáo/clipart, không chèn chữ/số vào đạo cụ SVG**:
   - Không vẽ mắt mũi miệng chi tiết cho nhân vật, không vẽ bàn phím laptop chi tiết, cột sóng điện thoại hay con số tiền bạc (`+15.000.000đ`) trên sân khấu. Giữ tối thiểu `>= 65%` khoảng trống âm (`Ma`) trên mặt giấy.
5. **Không sinh thêm tệp ảnh bìa `-cover.png` hay tệp video nhân bản `videos/seo-master/chen-xx-...mp4` khi kết xuất (từ V8.6.1)**:
   - Theo yêu cầu tinh gọn mới nhất của chủ kênh (đã áp dụng trong `/Volumes/Data/Quotes/server/renderQueueService.ts` dòng 259–277), mỗi lần render chỉ xuất **đúng 1 tệp MP4 duy nhất** (`Chén XX - Tên.mp4`) và tự động dọn sạch các file `-cover.png` / SEO MP4 dư thừa trong thư mục `output/quote-XXX/`.
6. **Không tự động đăng bài trực tiếp lên TikTok qua API không chính thức**:
   - Công cụ chỉ chuẩn bị sẵn file MP4 sạch metadata, Caption SEO, Hashtag và Bình luận mồi (đồng bộ sang Airtable để chủ kênh mở trên điện thoại copy/paste), không dùng bot tự động đăng lên tài khoản TikTok.
7. **Không dùng Google Drive làm nơi lưu trữ mã nguồn hay đồng bộ code**:
   - Chỉ làm việc duy nhất với kho Git tại `/Volumes/Data/Quotes` (đồng bộ GitHub `null2028/Quotes` qua GitHub Desktop / MCP Git), tuyệt đối không dùng bản sao trên Google Drive để tránh xung đột tệp `.tmp.driveupload`.
