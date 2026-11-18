# Trà Nguội — lõi dựng Chén v1 (tn-core)

**Nguyên tắc:** Quote là nội dung chính. Hình chỉ là nét phụ hoạ, thanh thoát, không dùng khối lớn.

AI chỉ viết **kịch bản ngữ nghĩa** (`specs/*.json`): câu thơ, chữ lật, motif, bối cảnh, đạo cụ theo **tên**, vị trí theo **khe** (`trai/giua/phai`) hoặc **điểm neo** (`ban.mat_ban_trai`, `ghe.mat_ghe`), và các nhịp diễn. Không có toạ độ.

Code lo phần còn lại:
- `charlib.py` — nét vẽ thanh thoát cho nhân vật (thân áo viền mảnh, khăn dải mảnh, không mảng tô đặc lớn).
- `tn.py` — thư viện đạo cụ nét mảnh + điểm neo + hộp va chạm, bối cảnh vài nét gợi ý, bộ biên dịch nhịp chuyển động tiết chế, bộ kiểm tra chặn cứng (bao gồm kiểm tra mật độ mực tự động), dựng khung.
- `build.py specs/x.json preview` — kiểm tra → ảnh 6 khung chính. `full` — xuất MP4 15s.

## Luật đang chặn cứng
1. Khoá JSON, motif, bối cảnh, đạo cụ, điểm neo, tư thế, trạng thái, mục tiêu `nhin_theo` phải nằm trong thư viện hợp lệ (báo kèm danh sách tên hợp lệ).
2. Chữ lật phải nằm ở dòng cuối.
3. Đúng 1 vật đỏ, chỉ xuất hiện / đổi đỏ sau khi chữ lật đổi đỏ khoảng 0,4 giây, và phải được phép làm vật đỏ.
4. Vật đỏ phải đủ to để nhận ra trên điện thoại (≥ 500 px² thống nhất toàn hệ thống).
5. Không va chạm giữa đạo cụ / nhân vật (trừ vật đặt trên vật chủ, Lữ khách ngồi `ghe.mat_ghe`, hoặc khai báo `cho_phep_chong`); Lữ khách đứng cầm chén thì không đặt thêm `chen_tra` trên bàn.
6. Mọi thứ nằm trong vùng an toàn.
7. Mật độ mực vùng hình (`y = 300..1080`): tự động render 1 khung trước cú lật và 1 khung sau cú lật, đo tỷ lệ điểm ảnh tối; vượt ngưỡng chặn cứng (`≤ 1.80%`) thì báo lỗi, không dựng.
8. Chuyển động tiết chế: trong lúc đang hiện một dòng chữ chỉ có cử động nhỏ (chớp mắt, lá trà, khói); ở cú lật phản ứng của Lữ khách nhỏ, không nhảy tư thế lớn.

Mỗi lỗi mới phát hiện khi xem trước → thêm thành một luật.
