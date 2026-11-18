Bạn là Gemini trong Antigravity, project Trà Nguội. Làm ĐÚNG task này rồi dừng.
CÁCH LÀM VIỆC (bắt buộc):
- Chỉ đọc: src/stage/families/do_chua.tsx, src/stage/families/primitives.ts, src/stage/propCatalog.tsx (phần small_cup, wine_jar, preset do_chua), src/kit/CloakedTraveler.tsx (phần cam_chen_tra/showTeaCup).
- Hiểu cần sửa gì thì SỬA NGAY. Việc ngoài phạm vi: ghi 1 dòng vào báo cáo, không làm.

Sửa họ do_chua theo duyệt của chủ kênh:
1. Chuyển sang `duyet`: ly_ca_phe, ly_ruou, bat_com, hop_com.
2. am_tra: bỏ mảng tô đặc màu đen; chỉ nét viền mảnh + lớp wash nhạt như các preset khác (giữ dáng, kích thước, hộp bao).
3. mam_com: không đặt trơ trọi dưới đất. Loại neo cho phép: `tren` (trên mat_phang/bàn trà) hoặc `dat` nhưng trong tờ duyệt phải đặt trên bàn trà thấp, có 2 bat_com + 1 chen_tra đặt lên điểm neo của mâm.
4. small_cup và wine_jar: thêm bản đỏ cùng dáng (tô đỏ nhạt + viền đỏ) để làm được vật đỏ; giữ nguyên bản thường đã duyệt.
5. Lỗi cam_chen_tra: Lữ khách đứng cầm chén đang vẽ chén ở chân. Sửa để chén nằm ở tay, ngang ngực, như Lữ khách các Chén cũ.
Chạy typecheck, `npm run gen:skill`, `npm run ho:duyet -- do_chua`; thêm vào tờ duyệt 1 ô Lữ khách đứng cầm chén.
Báo cáo tối đa 4 dòng vào tasks/REPORT-HO-do_chua.md (thêm cuối file). Không commit git.
