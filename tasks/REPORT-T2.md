# REPORT-T2: Đạo cụ về phong cách cũ

Quy luật nét engine cũ (7c1fe76): body strokeScale 1.0, detail 0.55–0.78, wash fill bg 0.11–0.14, baseFineStroke=1.35.
Đã sửa: std_chair strokeScale giảm (1.25→1.1, 1.15→1.05); fillOpacity wash các đạo cụ nhỏ (desk_laptop, vi_tien, thiep, phong_bi, hoa_don) từ 0.15–0.16 → 0.14; thêm 5 hằng số PROP_* vào stageConstants.ts, StagePropRenderer dùng named constants.
Typecheck: `npx tsc --noEmit` — 0 lỗi.
Ảnh so sánh: `qa-artifacts-ci/T2-so-sanh.png` (hàng trên Chén 16, hàng dưới 12 đạo cụ + bản đỏ).

T2b: tối giản 13 đạo cụ (giảm nét 25-30%, tối đa 1-2 chi tiết nội, bỏ mảng tô đặc). Không lệch tông.
Đã chỉnh: strokeScale giảm đều ~0.65-0.75, bỏ thanh giằng bàn/ghế, bỏ dấu sáp/triện/nút bấm, bản đỏ tô nhạt 0.3-0.35.
Ảnh so sánh: qa-artifacts-ci/T2-so-sanh.png (cùng vùng pixel 1:1 + phóng 2×).
