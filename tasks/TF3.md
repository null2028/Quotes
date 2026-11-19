Bạn là Gemini trong Antigravity, project Trà Nguội. Làm ĐÚNG task này rồi dừng. Model: Neon. Có thể chạy SAU TF2.
CÁCH LÀM VIỆC (bắt buộc): đọc AGENTS.md (nhất là MỤC ĐÍCH GỐC), docs/BAN-DO-HE-THONG.md. Chỉ đọc thêm file code nêu trong task. Hiểu cần sửa gì thì SỬA NGAY. Ngoài phạm vi: ghi 1 dòng, không làm. Không thêm hành vi ngầm, không thêm luật ngoài task. Cập nhật dòng tương ứng trong BAN-DO-HE-THONG.md. Báo xong kèm bằng chứng thật.
Đọc thêm: src/stage/semanticStage.ts (phần boi_canh thien_nhien), src/stage/DeclarativeStagePlayer.tsx (renderTerrain), src/stage/trackCompiler.ts (panY), server/studioDesktop.ts, studio-ui/src/components/GeminiBundleImportModal.tsx.

TF3. Sửa 3 lỗi đã có bằng chứng
1. E-b: đồi nền thien_nhien đặt cố định x=144/x=392, che vật đỏ (sprout che 97%/71%). Lớp nền phải né vật đỏ và nhân vật (dời/thu nhỏ/bỏ bớt đồi), như cách preferRight đang làm ở bộ khác.
2. E-c: đường đất kéo hết bề ngang dù kịch bản khai startX/endX (do luật "đất kéo dài mọi mức zoom" ở T7e). Đất phải tôn trọng startX/endX của kịch bản ở mọi mức zoom (có thể mờ hai đầu). Nếu đẩy máy làm lộ chỗ hở dưới chân vật → đó là cảnh báo lơ lửng của TF1, không phải lý do kéo dài đất.
3. Dấu phiên bản: ô nhập và preview hiện "mã commit · giờ khởi động server" để biết tool đang chạy bản nào. Log data/studio-desktop.log đang 920MB: giới hạn kích thước (xoay vòng, giữ ~10MB) và tắt log HMR lặp.
KIỂM TRA: typecheck 0 lỗi; preview (TF2) cho 1 gói thien_nhien có vật đỏ ở giua và giua_phai (không bị che), 1 script có startX=130,endX=410 (đất đúng độ dài) → qa-artifacts-ci/TF3.png.
Báo cáo tối đa 4 dòng vào tasks/REPORT-TF.md (thêm cuối). Không commit git.
