# Hướng Dẫn V8.5 — Quy Trình Zero-Code Với Gemini Skill (`/dao-dien-tra-nguoi`) & Trà Nguội Studio

Từ tháng 11/2026, Google đã thay thế *Gems* bằng chuẩn mở **Gemini Skills (`SKILL.md`)** ngay trong cuộc trò chuyện thường ngày trên `gemini.google.com`. Toàn bộ hệ thống **Trà Nguội Studio V8.5** đã đóng gói sẵn bộ Skill **`dao-dien-tra-nguoi`** để bạn tải lên 1 lần duy nhất và dùng mãi mãi.

---

## 1. Cài đặt 1 lần duy nhất trên Gemini Web (~30 giây)

1. Mở **Trà Nguội Studio** (`http://127.0.0.1:3688`) -> bấm nút màu Đỏ Chu Sa **`✨ Nạp Gói Gemini`** -> chuyển sang tab **`2. Cài Gemini Skill "/dao-dien-tra-nguoi"`**.
2. Bấm nút **`📦 Tải Gói Skill (.zip)`** để tải tệp `dao-dien-tra-nguoi.zip` về máy *(hoặc lấy trực tiếp tại `docs/dao-dien-tra-nguoi.zip`)*.
   - Bên trong gói `.zip` đã đóng gói chuẩn cấu trúc gốc không chứa file ẩn `.DS_Store`:
     - `SKILL.md` *(YAML frontmatter `name` + `description` + quy trình Đạo Diễn 3 bước)*
     - `references/physics-and-props-v85.md` *(sổ tay tọa độ vật lý, bảng màu 3 Sáng / 2 Tối, `visualDNA` V8.5, luật khoảng thở đỉnh đầu `y <= -61` và 26 đạo cụ có sẵn)*
     - `assets/cup-bundle-v85-template.json` *(mẫu JSON `CupBundle V8.5` chuẩn)*
3. Mở `gemini.google.com` -> vào **More (Thêm) -> Customize (Tùy chỉnh) -> Skills** -> bấm **Create -> Upload** và chọn tệp `dao-dien-tra-nguoi.zip` vừa tải.

---

## 2. Quy trình tạo mỗi Chén mới hằng ngày (~45 giây · Không cần chạm vào code)

### Bước 1 — Gọi `/dao-dien-tra-nguoi` ngay trong khung chat Gemini
Trong bất kỳ cuộc trò chuyện nào trên Gemini, gõ:
> `/dao-dien-tra-nguoi Lên giúp mình 1 bài buổi sáng tự trào công sở` *(hoặc thả thính / chiêm nghiệm đêm muộn)*

Skill sẽ tự động dẫn dắt đúng 3 nhịp:
1. **Duyệt câu chữ & `pivotWord` Đỏ Chu Sa** (3 phương án chuẩn 14–28 âm tiết).
2. **Duyệt hoạt cảnh 3 hồi** (Hồi 1 rõ chủ thể cho Ảnh bìa 3:4 -> Hồi 2 tại Pivot bật Đỏ Chu Sa -> Hồi 3 dư ảnh nối vòng + gợi ý bảng màu Sáng/Tối).
3. **Xuất 1 khối JSON `CupBundle V8.5` duy nhất** -> bạn bấm **Copy** khối mã trên Gemini.

### Bước 2 — Nạp 1 chạm vào Trà Nguội Studio -> Xem Live Preview 60fps ngay
1. Quay sang **Trà Nguội Studio** -> bấm **`✨ Nạp Gói Gemini`** (hoặc **`Dán Gói Gemini (Xem Ngay)`** ở cột trái).
2. Bấm **`⚡ Dán Thẳng Từ Clipboard & Mở Live Preview Ngay (1-Click)`**:
   - Toàn bộ câu chữ, đạo cụ SVG độc bản (`customProps`), kịch bản sân khấu (`stageScript`), âm thanh Foley, Caption SEO và Bình luận mồi sẽ hiện ngay trên màn hình `<Player>` 60fps trong `0.1s`!

### Bước 3 — Kéo thanh trượt 60fps nếu muốn tinh chỉnh mắt nhìn
- Tại **Ngăn 2 · Vi Chỉnh Từng Nhân Vật & Đạo Cụ (Kéo 60fps)**:
  - Chọn thẻ **`Nhân vật`** hoặc **`Đạo cụ`** để kéo trực tiếp **Vị trí Ngang X**, **Cao độ Y**, **Kích cỡ Scale**, **Độ nghiêng & Hướng nhìn**.
  - Nếu có mái vòm/tán ô đặt hơi sát đầu nhân vật, bấm **`✨ Tự nâng thoáng đầu nhân vật`** để nâng chuẩn khoảng thở ngay tức thì.
- Khi ưng ý, bấm **`Xuất Video MP4 Chuẩn Master`** ở cột phải là hoàn tất!
