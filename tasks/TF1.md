Bạn là Gemini trong Antigravity, project Trà Nguội. Làm ĐÚNG task này rồi dừng. Model: Neon.
CÁCH LÀM VIỆC (bắt buộc): đọc AGENTS.md (nhất là MỤC ĐÍCH GỐC), docs/BAN-DO-HE-THONG.md. Chỉ đọc thêm file code nêu trong task. Hiểu cần sửa gì thì SỬA NGAY. Ngoài phạm vi: ghi 1 dòng, không làm. Không thêm hành vi ngầm, không thêm luật ngoài task. Cập nhật dòng tương ứng trong BAN-DO-HE-THONG.md. Báo xong kèm bằng chứng thật.
Đọc thêm: docs (Claude Doc tổng hợp đã chép tóm tắt dưới đây), src/stage/legacySceneIds.ts, src/stage/stageValidator.ts, src/stage/stageScriptSchema.ts, src/stage/DeclarativeStagePlayer.tsx (chỗ chặn script không hợp lệ), src/automation/geminiBundleBridge.ts + studio-ui/src/components/GeminiBundleImportModal.tsx (ô nhập), data/stage-scripts.json (SCRIPT_C19_NET_DAT_NAY_MAM là mẫu làn tự do đã chạy tốt).

TF1. LÀN TỰ DO chính thức
Bối cảnh: Chén 19 bản kịch bản tự do (SCRIPT_C19_NET_DAT_NAY_MAM: AI tự vẽ mầm bằng shapes, drawProgress mọc từ đất, bóng người qua đường, mây) là video tốt; nhưng nó chỉ chạy được nhờ mượn cờ legacy:true (bỏ qua mọi kiểm tra). Cần một làn chính thức.
1. Cờ mới trên StageScript: `"che_do": "tu_do"` (KHÔNG dùng legacy). Script tu_do được dùng toàn bộ schema StageScript cũ (shapes, altShapes, drawProgress, morphProgress, toạ độ, timeline, nhiều nhân vật, khí quyển...). Không chịu TEMPO, không đếm cử chỉ, không giới hạn đồ trong kho.
2. Kiểm tra cho tu_do = CHỈ VỠ HÌNH, đo bằng máy, quét mỗi 0.25s suốt video:
   - CHẶN cứng: không đúng 1 vật đỏ (đếm CẢ nguồn đỏ ngầm: chén cầm tay teaCupRed, atmosphere/props colorRole accent, khói đỏ…); hình tràn lên tiêu đề hoặc khối chữ.
   - CẢNH BÁO vàng (kèm thời điểm t): đè/xuyên giữa vật cùng lớp hoặc nhân vật với vật; vật/nhân vật lơ lửng > 3px không có mặt đỡ; tư thế ngồi không có mặt ngồi; cỡ Lữ khách lệch > 25% so với chuẩn LU_KHACH_HEIGHT_RATIO; vật đỏ < MIN_RED_AREA_PX2 ở khung cuối.
   Mỗi cảnh báo có thời điểm t để preview chụp đúng khung đó (TF2).
3. Ô nhập tool web nhận cả StageScript tu_do (bọc trong một Chén: segments, pivotWord… như CupBundle cũ), hiện cảnh báo vàng, chỉ khoá nút Nhập khi có lỗi chặn. Lưu nguyên văn script gốc như goiChenGoc.
4. Chuyển SCRIPT_C19_NET_DAT_NAY_MAM sang che_do tu_do (bỏ legacy:true) — phải qua (cảnh báo được, không lỗi chặn).
5. Gói Chén giữ nguyên như hiện tại (lối tắt cho cảnh đơn giản).
KIỂM TRA: typecheck 0 lỗi; check-goi các gói mẫu OK; một lệnh kiểm script tu_do (vd npx tsx scripts/check-goi.mjs <file> tự nhận dạng) in danh sách chặn/cảnh báo cho SCRIPT_C19_NET_DAT_NAY_MAM và cho 1 bản cố ý sai (2 vật đỏ, 1 vật lơ lửng 20px, hình đè tiêu đề).
Báo cáo tối đa 5 dòng vào tasks/REPORT-TF.md. Không commit git.
