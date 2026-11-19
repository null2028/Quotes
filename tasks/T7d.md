Bạn là Gemini trong Antigravity, project Trà Nguội. Làm ĐÚNG task này rồi dừng. Model: Neon.
CÁCH LÀM VIỆC (bắt buộc):
- Chỉ đọc: src/stage/stageConstants.ts, src/stage/DeclarativeStagePlayer.tsx (phần đẩy máy cú lật), src/stage/stageValidator.ts (phần diện tích đỏ), scripts/stage-preview.mjs.
- Hiểu cần sửa gì thì SỬA NGAY. Việc ngoài phạm vi: ghi 1 dòng vào báo cáo, không làm.

T7d. Vật đỏ nhỏ vẫn gần như không thấy (qa-artifacts-ci/T7c-c19.png: khung cú lật và khung cuối gần như cùng cỡ, chén đỏ vẫn chỉ vài pixel)
1. Kiểm tra đẩy máy có thực sự chạy trong video thật không (render 2 khung của Gói c19-t7b bằng đúng luồng render MP4, t = cú lật và t = 13s, cắt cùng vùng) hay chỉ preview không vẽ camera. Nếu preview bỏ qua camera → sửa stage-preview.mjs dùng đúng camera như video.
2. Ngưỡng MIN_RED_AREA_PX2 = 500 trên khung 1080×1920 là quá nhỏ (≈ 22×22 px). Nâng lên 2400 (≈ 49×49 px) — đo SAU đẩy máy ở khung cuối.
3. Đẩy máy: nâng giới hạn PIVOT_PUSH_MAX_ZOOM lên 2.2; tâm đẩy ưu tiên vật đỏ (vật đỏ ở khoảng giữa vùng hình, nhân vật được phép bị cắt một phần ở mép). Vẫn chậm 2.0s ease-in-out, giữ đến hết, lớp chữ đứng yên.
4. Preview 6 khung phải có cả khối chữ như video (hiện T7c-c19.png mất chữ).
KIỂM TRA: typecheck 0 lỗi; check-goi các gói mẫu OK (gói nào giờ không đạt ngưỡng đỏ mới → ghi vào báo cáo, không tự sửa gói); xuất lại qa-artifacts-ci/T7c-c19.png (có chữ) + 1 ảnh 2 khung cắt từ MP4 thật (cú lật | 13s) → qa-artifacts-ci/T7d-mp4.png.
Báo cáo tối đa 4 dòng vào tasks/REPORT-T7d.md. Không commit git.
