# 001 — Tiếp quản quy trình mới

**Mục tiêu:** Gemini nắm quy trình mới, tài liệu chuẩn không còn lệch nhau.
**Phạm vi được sửa:** `AGENTS.md`, `CONTEXT.md`, `.agents/skills/`, `docs/`  **Không được sửa:** `src/`, `server/`, `studio-ui/`, `tn-core/`
**Việc cần làm:**
1. Đọc `docs/QUY-TRINH-LAM-VIEC.md`, `tn-core/README.md`, `docs/character/tra-nguoi-lu-khach-vong-7.png`.
2. Viết lại `AGENTS.md` ngắn gọn (≤ 60 dòng): trỏ về QUY-TRINH làm nguồn chuẩn; ghi engine cũ đóng băng; bỏ các thông số sai (10 Mbps, 192 kbps, 900 frame cố định). Xoá `CONTEXT.md` trùng lặp (hoặc để 1 dòng trỏ về AGENTS.md).
3. Chạy `python3 tn-core/build.py tn-core/specs/vi-du-loi-kieu-cu.json` và xác nhận bị chặn 4 lỗi; chạy 2 spec còn lại ở chế độ preview.
4. Liệt kê trong báo cáo các file tài liệu trùng/lỗi thời (spec v2–v8, `(1).md`, SKILL cũ) và đề xuất giữ/xoá — **chưa xoá**.
**Tiêu chí ĐẠT:**
- [ ] AGENTS.md mới ≤ 60 dòng, không còn thông số sai
- [ ] Spec lỗi bị chặn đúng 4 lỗi; 2 spec chuẩn ra ảnh xem trước
- [ ] Báo cáo có danh sách tài liệu đề xuất dọn
**Báo cáo:** `tasks/001-tiep-quan-quy-trinh.bao-cao.md`
