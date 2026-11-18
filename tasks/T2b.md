Bạn là Gemini trong Antigravity, project Trà Nguội. Làm trọn rồi dừng. KHÔNG sửa propCatalog trừ khi bước 3 yêu cầu.

T2b. Làm lại ảnh so sánh T2 để so được thật.

Vấn đề ảnh hiện tại: mỗi ô đạo cụ tự phóng to theo kích thước vật, nên ví/phong bì/hoá đơn bị phóng to gấp nhiều lần và trông nét rất dày; không có Lữ khách đứng cạnh; còn Chén 16 thì quá nhỏ. Hai hàng không cùng tỷ lệ nên không so được.

Làm:
1. Dựng 2 cảnh bằng ĐÚNG luồng render video (khung 1080×1920, cùng camera, cùng tự căn khung như video thật):
   - Cảnh A: một khung giữa video Chén 16 bản đã đăng.
   - Cảnh B: một Gói Chén thử gồm Lữ khách ngồi std_chair vào std_work_desk; trên bàn: desk_laptop, desk_calendar, hoa_don (tua), vi_tien, phong_bi, thiep, small_cup; porch_window trên tường phía sau; bên cạnh đặt thêm low_tea_table và low_wood_stool. Không có vật đỏ (hoặc chỉ 1).
2. Cắt CÙNG một vùng pixel (vùng hình phía trên khối chữ) ở cả hai cảnh, đặt cạnh nhau, giữ nguyên tỷ lệ 1:1 (không phóng riêng từng vật). Thêm một hàng phóng to 2x của chính 2 vùng đó.
3. Nhìn ảnh: nếu ở Cảnh B vật nhỏ trông nét đậm/dày hơn rõ rệt so với vật cùng cỡ ở Chén 16 (ví dụ chiếc ví trên ghế đôn Chén 16) thì chỉnh tiếp nét/kiểu tô cho khớp, chỉ đổi nét và tô.

Xuất qa-artifacts-ci/T2-so-sanh.png. Ghi thêm 3 dòng vào cuối tasks/REPORT-T2.md: có lệch tông không, đã chỉnh gì thêm, đường dẫn ảnh. Không commit git.

BỔ SUNG THEO NHẬN XÉT CỦA CHỦ KÊNH: "Nét một số đạo cụ hơi dày và nhiều chi tiết, tối giản thì sẽ mềm mại hơn."
Trước khi dựng ảnh, tối giản 13 đạo cụ theo luật sau (được phép bỏ chi tiết bên trong, nhưng GIỮ bóng dáng ngoài, kích thước, hộp bao, điểm neo; bản đỏ vẫn cùng dáng):
- Nét viền mảnh hơn hiện tại (giảm khoảng 25–30%), nét chi tiết bên trong mảnh hơn nữa và nhạt hơn nét viền.
- Mỗi vật tối đa 1–2 nét chi tiết bên trong, chỉ giữ chi tiết cần để nhận ra vật:
  desk_calendar: 2 khoen + 1–2 dòng kẻ; desk_laptop: màn hình chỉ viền, không tô đậm; vi_tien: 1 đường nắp gập (ổ khoá chỉ ở trạng thái khoa);
  thiep: chỉ đường gập giữa; phong_bi: chỉ chữ V nắp, bỏ dấu sáp; hoa_don: mép răng cưa + 2 dòng kẻ, bỏ ô vuông; small_cup: chỉ viền, không tô đặc.
- Không mảng tô đặc trên đạo cụ (chỉ lớp wash nhạt); vật đỏ tô đỏ nhạt + viền đỏ.
- Bàn ghế: nét mảnh, bỏ thanh giằng thừa nếu không cần để nhận ra.
Ảnh so sánh ở bước 1–2 dùng bản đã tối giản.
