Bạn là Gemini trong Antigravity, project Trà Nguội. Đọc docs/KE-HOACH.md. Làm ĐÚNG task T8a rồi dừng. Task này KHÔNG sửa code engine.

T8a. Bản đồ "họ đạo cụ" và "bộ bối cảnh" từ toàn bộ kho quote

Bối cảnh: docs/motif/quote-motif-map.csv mới phân tích 225 quote; Airtable (data/airtable-cache.json) hiện có 262 quote (thiếu Q155–Q161, W073–W102). Thư viện hiện có ~38 loại đạo cụ (src/stage/propCatalog.tsx), trong đó 19 đã duyệt.

Hướng đã chốt: KHÔNG làm từng đạo cụ lẻ, mà gom thành khoảng 12 HỌ ĐẠO CỤ, mỗi họ là một hàm dựng có tham số + vài "mẫu dựng sẵn" (preset). Phác thảo ban đầu (được điều chỉnh theo số liệu):
 1 do_chua (chén, ấm, ly, bát, hộp cơm, mâm): tham số quai/vòi/nắp/độ cao/miệng
 2 giay (lịch, thư, hoá đơn, sách, hồ sơ, bản đồ, lá bài): tham số khổ, gập, răng cưa, dòng kẻ, chồng
 3 ghe (ghế trống, ghế dài, ghế văn phòng, đôn, ghế khán giả): tựa lưng, độ dài, bánh xe
 4 mat_phang (bàn, bàn làm việc, bàn họp, giường, tủ, quầy): cao, dài, chân, ngăn
 5 khung (cửa sổ, cửa, cổng, gương, khung tranh, mái hiên, bậc thang): chia ô, cánh mở, mái
 6 man_hinh (điện thoại, laptop, máy tính, bảng tính, điện tâm đồ): khổ, đế, nội dung đơn giản
 7 vat_tron (đồng hồ, mặt trời, mặt trăng, hành tinh, quả, bóng bay, địa cầu): kim, quầng, dây
 8 anh_sang (đèn lồng, đèn bàn, đèn đường, lửa/bếp): dáng chụp, cột, quầng sáng
 9 cay_co (hoa, cây, cỏ, mầm, lá rơi, cây trơ cành): cao, tán, số bông
10 do_mang (ví, ô, vali, túi, khăn, kính, gánh): dáng, quai
11 ky_hieu (tim, nốt nhạc, bong bóng nghĩ, dấu hỏi, đường kẻ, băng dán)
12 nha_xe (nhà phố, nhà nhỏ, dãy phố, xe đạp, xe máy, tàu, thuyền) — dáng bóng đơn giản
Địa hình/thời tiết (đường, ngã rẽ, sông, núi, mưa, mây, sao, sóng) KHÔNG là đạo cụ: thuộc hệ địa hình (terrainSystem) và khí quyển (Atmosphere).

Làm:
1. Bổ sung phân tích cho 37 quote còn thiếu vào docs/motif/quote-motif-map.csv (cùng cột: id, chu_de, nhom, motif, boi_canh, dao_cu, nhan_vat). Đọc nội dung quote trong airtable-cache.json.
2. Viết docs/motif/HO-DAO-CU.md:
   - Bảng: mỗi họ → các đạo cụ thô trong kho thuộc họ đó → số quote cần → % phủ cộng dồn khi làm lần lượt các họ.
   - Mỗi họ: tham số đề xuất, danh sách preset (đặt tên tiếng Việt không dấu, vd chen_tra, am_tra, ly_ca_phe), preset nào đã có sẵn trong propCatalog (ghi tên cũ để làm alias).
   - Đạo cụ nào KHÔNG vào được họ nào → liệt kê riêng (dự kiến rất ít, sẽ vẽ riêng có duyệt).
   - Thứ tự làm đề xuất (họ phủ nhiều quote nhất trước).
3. Viết docs/motif/BO-BOI-CANH.md: 6 bộ bối cảnh chính (phố ngõ, không gian ký hiệu, thiên nhiên mở, văn phòng, phòng trong nhà, hiên trà) + quán, nhà quê, ga tàu. Mỗi bộ: nền (địa hình/tường/vạch), 3–6 đạo cụ mặc định (preset), khí quyển phù hợp, % quote dùng.

Báo cáo tối đa 6 dòng vào tasks/REPORT-T8a.md: tổng quote đã phân tích, số họ, % phủ khi làm 3 họ đầu / 6 họ / toàn bộ, số đạo cụ ngoài họ. Không commit git.
