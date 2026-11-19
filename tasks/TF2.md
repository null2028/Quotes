Bạn là Gemini trong Antigravity, project Trà Nguội. Làm ĐÚNG task này rồi dừng. Model: Neon. Chạy SAU TF1.
CÁCH LÀM VIỆC (bắt buộc): đọc AGENTS.md (nhất là MỤC ĐÍCH GỐC), docs/BAN-DO-HE-THONG.md. Chỉ đọc thêm file code nêu trong task. Hiểu cần sửa gì thì SỬA NGAY. Ngoài phạm vi: ghi 1 dòng, không làm. Không thêm hành vi ngầm, không thêm luật ngoài task. Cập nhật dòng tương ứng trong BAN-DO-HE-THONG.md. Báo xong kèm bằng chứng thật.
Đọc thêm: scripts/stage-preview.mjs, scripts/check-goi.mjs, src/engine/timelineSync.ts, src/engine/visualDnaResolver.ts.

TF2. PREVIEW cho đạo diễn tự xem — chạy được cả macOS lẫn Linux, cùng luồng với video thật
1. Thay rasterizeWithCoreSVG (chỉ macOS) bằng bộ raster chạy được cả hai (ưu tiên @resvg/resvg-js có bản dựng sẵn darwin-arm64 và linux-arm64; nếu không được thì giải pháp tương đương). Lệnh preview chạy được trên Linux arm64 mà không cần sửa tay (esbuild linux: hướng dẫn 1 dòng hoặc tự xử lý).
2. Preview dùng ĐÚNG như render Studio: cùng seed, cùng thời lượng AUTO_SEED, cùng visualDNA, cùng camera. In ra đầu ảnh: mã commit + thời lượng + seed.
3. Khung chụp: 6 khung tổng quan + 8 khung dày quanh cú lật (pivot −0.5s đến +3s) + mỗi thời điểm t mà TF1 cảnh báo. Ghép 1 ảnh, kèm khối chữ như video.
4. Một lệnh duy nhất cho cả Gói Chén và script tu_do: npm run preview -- <file.json> [--out=...].
KIỂM TRA: chạy lệnh trên macOS cho SCRIPT_C19_NET_DAT_NAY_MAM và q001; ghi rõ lệnh chạy trên Linux. So 1 khung preview với khung cùng thời điểm cắt từ MP4 render thật (c19 tu_do): phải giống nhau → qa-artifacts-ci/TF2-preview-vs-mp4.png.
Báo cáo tối đa 4 dòng vào tasks/REPORT-TF.md (thêm cuối). Không commit git.
