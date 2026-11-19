Bạn là Gemini trong Antigravity, project Trà Nguội. Làm ĐÚNG task này rồi dừng. Model: Neon. Chạy SAU T7c.
CÁCH LÀM VIỆC (bắt buộc):
- Chỉ đọc: docs/motif/BO-BOI-CANH.md, src/stage/semanticStage.ts (phần boi_canh), src/stage/terrainSystem.ts, src/stage/DeclarativeStagePlayer.tsx (phần vẽ terrain/lớp nền), src/stage/propCatalog.tsx (các món tầng B: warm_house, city_skyline, street_lamp, porch_window, bare_tree…), scripts/gen-stage-skill.mjs.
- Hiểu cần sửa gì thì SỬA NGAY. Việc ngoài phạm vi: ghi 1 dòng vào báo cáo, không làm.

T8-BOI-CANH. Biến 9 bộ bối cảnh từ tài liệu thành code
Vấn đề (Chén 19 "Ngã rẽ"): skill viết "bộ pho_ngo, ngã rẽ" nhưng Gói Chén chỉ có boi_canh.dia_hinh/khi_quyen/doan_duong; 9 bộ bối cảnh mới nằm trong BO-BOI-CANH.md, engine không có → video chỉ còn một đường kẻ thẳng + một nhánh nét đứt rất mờ. Skill đang hứa thứ engine không vẽ được.

1. Thêm trường `boi_canh.bo` (9 giá trị: pho_ngo, khong_gian_ky_hieu, thien_nhien, van_phong, phong_trong_nha, hien_tra, quan, nha_que, ga_tau). Mỗi bộ = một LỚP NỀN tối giản, tự dựng từ đạo cụ/hàm có sẵn, ở lớp `nen`, nét mảnh, độ đậm thấp (≈ 35–45%), không bao giờ lấn nhân vật hay chữ:
   - pho_ngo: 2–3 bóng nhà phố xa (warm_house/city_skyline) + 1 cột đèn, đường đất.
   - hien_tra: mép mái hiên phía trên + 1 cột hiên, sàn gỗ.
   - van_phong: vạch tường + 1 cửa sổ (porch_window) treo cao.
   - phong_trong_nha: vạch tường + cửa sổ nhỏ hoặc khung tranh.
   - thien_nhien: đường đồi xa 1 nét + (tuỳ) cây trơ cành.
   - khong_gian_ky_hieu: không nền, chỉ đường đất mảnh (giữ như hiện tại).
   - quan / nha_que / ga_tau: phiên bản tối giản tương tự (tự chọn từ thư viện có sẵn, ghi vào BO-BOI-CANH.md).
   Vị trí lớp nền do code tự xếp quanh cụm nhân vật (không đè, chừa khoảng thở), vẽ ra trong nghi thức mở màn (T7c) trước đạo cụ.
2. Ngã rẽ (`dia_hinh: nga_re`) phải đọc ra được là ngã rẽ: nhánh rẽ nét liền mảnh (không nét đứt mờ), góc tách rõ hơn, dài đủ để thấy hai lối.
3. Skill: thu-vien.md liệt kê 9 giá trị `boi_canh.bo` kèm mô tả nền; SKILL Bước 2 thêm: "Chỉ mô tả những gì Gói Chén thể hiện được; bối cảnh phải ghi bằng `boi_canh.bo`." Chạy `npm run gen:skill`.
4. Validator: lớp nền không tính va chạm với nhân vật/đạo cụ lớp giữa; nhưng chặn lớp nền che vật đỏ.
KIỂM TRA: typecheck 0 lỗi; check-goi các gói mẫu OK. Xuất 1 tờ 3×3: mỗi ô 1 bộ bối cảnh + Lữ khách đứng giữa, cùng tỷ lệ video (qua luồng thật) → qa-artifacts-ci/BO-BOI-CANH.png; thêm 1 ô ngã rẽ.
Báo cáo tối đa 4 dòng vào tasks/REPORT-BOI-CANH.md. Không commit git.
