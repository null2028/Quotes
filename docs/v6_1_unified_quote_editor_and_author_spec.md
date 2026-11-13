# V6.1 Specification: Ô Soạn Thảo Quote Hợp Nhất (`WYSIWYG`) & Hiển Thị Tác Giả Liền Lạc Kèm Triện Trà Nguội

> **Mục đích tài liệu (`V6_1_UNIFIED_QUOTE_AND_AUTHOR_SPEC.md`):** Nâng cấp phần nhập liệu Ngăn 1 và Typography trên video của `Trà Nguội Workbench` tại `/Volumes/Data/Quotes` theo triết lý **"Nhập sao lên hình đúng vậy (1 Ô Duy Nhất)"** và bổ sung trường **`author` (Tác giả — Tùy chọn)** hiển thị liền lạc ngay dưới đuôi Quote trước khi đóng triện `• TRÀ NGUỘI`.

## 1. Bỏ Tách `POEM / PROSE` — Hợp Nhất Thành 1 Ô Soạn Thảo Duy Nhất (`WYSIWYG`)

1. **Cập nhật Dữ liệu (`src/schemas/videoSchema.ts` & `studio-ui/src/types.ts`):**
   * Bổ sung trường tùy chọn `author?: string` (mặc định `""`) và `fontSizeScale?: number` (`0.8 -> 1.3`, mặc định `1.0` để người dùng có thể chủ động tăng/giảm cỡ chữ nhẹ nếu muốn).
   * Giữ tương thích ngược cho `cups.json` nhưng trên UI **bỏ hoàn toàn nút chuyển đổi `Thơ (POEM) / Văn xuôi (PROSE)`** và **bỏ hoàn toàn danh sách các ô input dòng lẻ `1, 2, 3, 4` kèm nút `↑ ↓ 🗑` và nút phụ `Dán Nhanh`**.

2. **Giao Diện Ngăn 1 Mới Trên `StoryDirectorDesk.tsx` (Gọn, Liền Mạch & Trực Quan):**
   * **Hàng 1 (2 ô ngang hàng):**
     - `Tiêu đề Chén` (ví dụ: `Thiệp hồng`, `Rượu mây`).
     - `Tác giả (Tùy chọn)` (placeholder: *VD: Nguyễn Bính, Lưu Quang Vũ... — Để trống nếu không có*).
   * **Hàng 2 — Thanh Công Cụ Format Nhỏ Ngay Mép Trên Ô Quote:**
     - Nút **`[I Nghiêng]`**: Bôi đen chữ rồi bấm sẽ bọc `*...*` (render `font-style: italic` trên video).
     - Nút **`[B Đậm]`**: Bôi đen chữ rồi bấm sẽ bọc `**...**` (render `font-weight: 600` trên video).
     - Nút **`[🎯 Đặt vùng bôi đen làm pivotWord]`**: Bôi đen bất kỳ từ/cụm từ nào ngay trong ô Quote rồi bấm 1 chạm để gán làm `pivotWord` (hiển thị rõ mốc giây kích hoạt Hồi II ngay bên cạnh, kèm hàng chip gợi ý nhanh dưới chân ô nếu muốn chọn bằng 1 click).
     - Thanh/nút nhỏ **`Cỡ chữ: 1.0x`** (`0.85x` – `1.20x`).
   * **Ô Soạn Thảo Quote Duy Nhất (`<textarea>` dùng chính font chữ Serif của kênh):**
     - Hiển thị nguyên vẹn đoạn văn bản nhiều dòng đúng như cấu trúc người dùng gõ hoặc Paste vào.
     - **Quy tắc ánh xạ "Nhập sao hiển thị vậy":**
       * Người dùng xuống dòng (`\n`) ở đâu $\rightarrow$ trên video tách dòng đúng tại đó và hiện tuần tự từng dòng có chữ theo hiệu ứng sương mù `Editorial Mist Reveal`.
       * Nếu người dùng nhấn `Enter` 2 lần tạo **dòng trống** giữa hai đoạn/khổ (`""`) $\rightarrow$ trên video giữ đúng một khoảng nghỉ tách khổ (`stanzaGap = 20px`) mà không tốn thời gian đếm chữ rỗng!
       * Nếu một dòng dài hơn bề rộng cột an toàn (`maxWidth` của cột chữ) $\rightarrow$ tự động ngắt dòng mềm mại theo từ (`word-wrap`, `text-wrap: pretty`) giữ nguyên vẻ tự nhiên của đoạn văn.

## 2. Thiết Kế Hiển Thị `Tác Giả` Liền Lạc Với Quote & Triện `• TRÀ NGUỘI` Trên Video (`AdaptiveTypography.tsx`)

Khi render khối văn bản trên màn hình `1080×1920`:

```text
│ Ta gom mây làm rượu
│ Để ủ mối duyên đầu
│ Ai ngờ men quá gắt
│ Say tỉnh... chẳng còn nhau.
              — Lưu Quang Vũ      <-- (Optional) Chỉ hiện khi có `author`: cùng font Serif nghiêng,
                                      ôm sát ngay dưới đuôi khối chữ (`alignSelf: 'flex-end'`)!

• TRÀ NGUỘI                       <-- Con dấu triện kênh luôn giữ ở góc trái phía dưới như chuẩn gốc!
```

### Quy Chuẩn Typography & Nhịp Thời Gian Chính Xác:
1. **Khối Bọc Nội Dung Quote (`width: 'fit-content'`, `maxWidth: '100%'`):**
   * Đặt các dòng Quote và dòng `author` (nếu `author.trim().length > 0`) nằm chung trong một container có `width: 'fit-content'` (tối đa bằng bề rộng cột chữ an toàn) để cạnh phải của container **ôm vừa khít theo câu dài nhất thực tế của bài thơ hoặc đoạn văn đó**!
2. **Dòng `Tác giả` (`author` — khi có nhập):**
   * **Vị trí:** Nằm liền ngay dưới dòng cuối cùng của Quote (`marginTop: 14px`), căn phải theo mép phải của chính khối Quote (`alignSelf: 'flex-end'`, `paddingRight: 4px`) để dù thơ 5 chữ ngắn hay văn xuôi dài, tên tác giả luôn bám liền lạc ngay dưới đuôi câu kết!
   * **Kiểu chữ:** Dùng **cùng họ phông Serif của Quote (`Noto Serif` / `Newsreader`), in nghiêng (`fontStyle: 'italic'`), `fontWeight: 400`**, cỡ chữ bằng **`0.68 × baseFontSize`** (khoảng `24px–27px`), màu `palette.inkSecondary` (`opacity: 0.82`). Tự động thêm dấu gạch ngang thanh lịch `— ` phía trước nếu người dùng chưa gõ sẵn dấu gạch.
   * **Nhịp xuất hiện:** Hiện mờ sương mù êm ái (`blur(6px) -> blur(0px)`, `translateY(6px -> 0)`) ngay sau khi dòng chữ cuối cùng hiện xong **`0.25 giây`** (`15 frames`) trong vòng `0.6 giây`.
3. **Con Dấu Triện `• TRÀ NGUỘI`:**
   * **Vị trí:** Giữ nguyên ở góc trái phía dưới toàn bộ khối trích dẫn (`marginTop: author ? 26px : 30px`), dùng phông Sans-serif in hoa thưa (`letterSpacing: '0.24em'`) kèm chấm tròn Đỏ Gạch `palette.accent` như bản gốc.
   * **Nhịp xuất hiện:** Hiện êm sau dòng cuối `0.45 giây` (nếu không có `author`) hoặc sau khi dòng `author` bắt đầu hiện `0.35 giây` (nếu có `author`), tạo nhịp kết 2 nốt cực kỳ thư thái: *Câu kết $\rightarrow$ Tên tác giả $\rightarrow$ Đóng triện Trà Nguội*.

## 3. Hỗ Trợ Parse Inline Format Nhẹ (`*nghiêng*` và `**đậm**`) Trong `AdaptiveTypography.tsx`
* Viết hàm helper nhỏ tách các đoạn `*...*` thành `<em>` (`fontStyle: 'italic'`) và `**...**` thành `<strong>` (`fontWeight: 600`) trong khi vẫn bảo toàn chính xác logic tô màu Đỏ Gạch `palette.accent` cho từ khóa `pivotWord`!
* Lưu ý trong `timelineSync.ts`: Khi tính thời lượng đọc và dò tìm `pivotWord`, loại bỏ ký tự đánh dấu `*` và bỏ qua các dòng trống tách khổ (`""`) để `pivotFrame` vẫn khớp chính xác tuyệt đối tới từng mili-giây.
