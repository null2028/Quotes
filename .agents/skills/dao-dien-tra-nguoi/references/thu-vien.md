# Thư Viện Kho Đạo Cụ 3 Tầng, Bối Cảnh & Động Từ — Trà Nguội

> Sinh tự động qua `npm run gen:skill` từ `propCatalog`, `semanticStage`, `HO-DAO-CU.md` và `BO-BOI-CANH.md`. Không tự vẽ đồ vật hay ghi toạ độ.

## 1. 9 Bộ Bối Cảnh Chuẩn (`boi_canh.bo` · `BO-BOI-CANH`)
> Chọn 1 trong 9 mã `boi_canh.bo` bên dưới để engine tự dựng lớp nền tối giản (`nen`, nét mảnh, độ đậm thấp, tự mở màn trước đạo cụ). Khí quyển mặc định TẮT — không tự thêm mặt trời/lá/gió trang trí; chỉ khai báo `boi_canh.khi_quyen` khi câu chữ có hình ảnh/ý nghĩa tương ứng và đã giải thích ở Bước 2.
- `pho_ngo` · **Phố, ngõ** · nền tự dựng: 2–3 bóng nhà phố xa (city_skyline, warm_house) + 1 cột đèn đường nét mảnh, đường đất · địa hình: phang/nga_re · đạo cụ gợi ý: nha_pho, den_duong, mai_hien, ghe_dai, bench, chiec_o, umbrella, xe_dap
- `thien_nhien` · **Thiên nhiên mở** · nền tự dựng: Đường đồi xa 1 nét mảnh + cây trơ cành (bare_tree) · địa hình: doi/doc/bo_nuoc/bac_thang/phang · đạo cụ gợi ý: cay_xanh, cay_tro_canh, bong_hoa, mam_cay, cum_co, den_long, cloud_wisp
- `phong_trong_nha` · **Phòng trong nhà** · nền tự dựng: Vạch tường + cửa sổ nhỏ (porch_window) và khung tranh treo tường · địa hình: phang · đạo cụ gợi ý: cua_so, porch_window, cua_phong, giuong_ngu, chiec_goi, ban_quan, ghe_tua, std_chair
- `khong_gian_ky_hieu` · **Không gian ký hiệu** · nền tự dựng: Không nền, chỉ đường đất mảnh trên nền giấy trống · địa hình: phang · đạo cụ gợi ý: trai_tim, tim_net_dut, duong_ke, soi_chi, bong_bong_nghi, chat_bubble, cuon_sach, trang_giay
- `hien_tra` · **Hiên trà** · nền tự dựng: Mép mái hiên phía trên + 1 cột hiên + nét sàn gỗ mảnh · địa hình: phang · đạo cụ gợi ý: ban_tra, low_tea_table, don_go, ghe_dai, low_wood_stool, bench, am_tra, chen_tra
- `van_phong` · **Văn phòng** · nền tự dựng: Vạch chân tường ngang thấp phía sau + 1 cửa sổ (porch_window) treo cao · địa hình: phang · đạo cụ gợi ý: ban_lam_viec, std_work_desk, ghe_tua, ghe_van_phong, std_chair, laptop, may_tinh_ban, desk_laptop
- `quan` · **Quán** · nền tự dựng: Vạch tường quán + cửa sổ (porch_window) + 1 đèn thả mảnh treo cao · địa hình: phang · đạo cụ gợi ý: ban_quan, ghe_tua, std_chair, ly_ca_phe, chen_tra, ly_ruou, dien_thoai, cuon_sach
- `nha_que` · **Nhà quê, mâm cơm** · nền tự dựng: Bóng ngôi nhà mái hiên (warm_house) + hàng rào gỗ thấp ven sân · địa hình: phang · đạo cụ gợi ý: mam_com, bat_com, am_tra, don_go, ghe_tua, cua_nha, nha_nho
- `ga_tau` · **Ga tàu** · nền tự dựng: Bóng toa tàu chạy ngang có hàng ô cửa + cột đồng hồ sân ga · địa hình: phang · đạo cụ gợi ý: toa_tau, vali, ghe_dai, bench, dong_ho_treo

## 2. Địa Hình, Kiểu Cú Lật, Khí Quyển, Nhân Vật & Toàn Bộ Động Từ
- Bộ bối cảnh (`boi_canh.bo`): `pho_ngo`, `khong_gian_ky_hieu`, `thien_nhien`, `van_phong`, `phong_trong_nha`, `hien_tra`, `quan`, `nha_que`, `ga_tau`.
- Địa hình (`boi_canh.dia_hinh`): `phang`, `doc`, `doi`, `nga_re`, `bo_nuoc`, `bac_thang`.
- Kiểu cú lật (`kieu_cu_lat` — mặc định `day_may`, điều khiển duy nhất camera quanh cú lật):
  - `day_may`: Vật đỏ đổi màu rồi đẩy máy chậm về vật đỏ (mặc định — hợp vật đỏ nhỏ/vừa cần nhấn cận).
  - `xuat_hien`: Vật đỏ chưa có từ đầu, tự vẽ nét + loang xuất hiện ở cú lật rồi đẩy máy nhẹ (hợp vật bất ngờ xuất hiện).
  - `keo_rong`: Mở màn ở cận cảnh, cú lật kéo máy lùi ra lộ bối cảnh lớn hơn làm đổi nghĩa (hợp cú lật mở rộng tầm nhìn).
  - `dung_lang`: Không chuyển động máy, chỉ vật đổi đỏ (hợp cảnh tĩnh tuyệt đối, chiêm nghiệm).
- Đoạn đường làm vật đỏ (`boi_canh.doan_duong[]`): `{ "id": "duong_lui", "vi_tri": "sau_lung" | "truoc_mat" | "tu_trai" | "giua" | "tu_phai", "nhan_vat": "<id>", "vat_do": true }` (hoặc dùng `tu`/`den` theo khe vị trí). Tự đổi nét đỏ đậm hơn ở cú lật.
- Khí quyển (`boi_canh.khi_quyen[].loai`, mặc định TẮT — chỉ dùng khi mang nghĩa rõ ở Bước 2): `rain`, `wind`, `leaves`, `steam`, `birds`, `sun`, `hollow_sun`, `crescent`, `ring_pulse` (kèm `vi_tri`, `huong`: `trai`/`phai`, `mat_do`).
- Lớp sâu (`lop`): `nen`, `giua`, `truoc` · Loại neo (`loai_neo`): `dat`, `tuong`, `troi`, `tren`, `cam` · Khe vị trí (`vi_tri`/`di_toi`): `xa_trai`, `trai`, `giua_trai`, `giua`, `giua_phai`, `phai`, `xa_phai`.
- Nhân vật (`nhan_vat[].vai`): `lu_khach`, `nguoi_b` (`lu_khach` bóng mực đậm mặc định; `nguoi_b` bóng mực nhạt hơn, tuỳ chọn `toc_duoi_ngua: true`, đủ `vi_tri`, `huong`, `tu_the`, va chạm như Lữ khách).
- Tư thế (`tu_the`): `dung`, `di_bo`, `day`, `ngoi_tua`, `nguoc_nhin`, `vuon_tay`, `gio_cao`, `trao` · Nghiêng (`nghieng`): `thang`, `nhe_truoc`, `guc`, `guc_sau`, `nga_lung` (`guc` = cúi đầu vai chùng — thờ ơ, mệt nhẹ, không gập xuống bàn; `guc_sau` = gục sâu xuống bàn — kiệt sức) · Hướng (`huong`): `trai`, `phai` · Điểm cầm (`cam_boi`): `tay`, `dau`, `lung`.
- Ngồi ghế bàn: bắt buộc `ngoi_tren: "<id_ghe>.mat_ghe"`, thêm `ngoi_vao: "<id_ban>"` để kê sát bàn. Chén trà cầm tay (`cam_chen_tra: true`) mặc định nét mực wash; chỉ đổi đỏ khi có `vat_do_tren_tay: "<id>.chen_tra"`.
- Mốc nhịp (`nhip[].moc`): `bat_dau`, `dong_1`, `dong_2`, `dong_3`, `dong_4`, `cu_lat` (kèm `sau` tính bằng giây; **không cần ghi `thoi_luong`** — engine tự tính chậm rãi theo Nhịp Trà Nguội; phản ứng lớn tại `cu_lat` phải có `sau` ≥ 0.45).
- Động từ nhân vật (`nhip[].nhan_vat.<id>`): `tu_the`, `di_toi`, `di_vao`, `di_ra`, `huong`, `nghieng`, `nhin_theo`, `nhin_nhau`, `khung_lai`, `lui_buoc`, `quay_dau`, `tha_roi`, `cam_chen_tra`, `dung_day` (`di_vao`/`di_ra`: từ/ra mép khung; `khung_lai`: giật nhẹ dừng; `lui_buoc`: lùi vẫn giữ hướng; `quay_dau`: ngoái sau rồi quay lại; `nhin_nhau`: hai nhân vật xoay mặt nhìn nhau; `tha_roi`: thả vật cầm rơi xuống đất).
- Động từ đạo cụ (`nhip[].dao_cu.<id>`): `trang_thai`, `cam_boi`, `dat_tren`, `di_toi`, `bay_len`, `tach_doi`, `khoi`, `tha_roi`.
- Động từ địa hình / đoạn đường (`nhip[].doan_duong.<id>`): `duong_mo`, `doi_do` (`doi_do`: đổi đỏ đậm; `duong_mo`: mờ dần ở hậu vị).
- Tỷ lệ thật: vật dưới 30 cm nhân `HE_SO_PHONG_DAI = 2`, từ 30 cm trở lên nhân `1` (`TY_LE_CANH = 0.32`).

## 3. TẦNG A — Dùng ngay (33 món đã duyệt `duyet`, gồm alias)
> Ưu tiên chọn trong tầng này để xuất Gói Chén dựng ngay không cảnh báo.
- `envelope` · Cánh thư giấy cổ phong · bối cảnh: phong_trong_nha, van_phong, hien_tra · neo: cam/tren/dat · vật đỏ: Có
- `wine_jar` · Vò rượu gốm Mai Bình · bối cảnh: hien_tra, quan_nho, nha_que · neo: tren/dat · vật đỏ: Có
- `small_cup` · Chén trà gốm nhỏ · bối cảnh: hien_tra, quan_nho, phong_trong_nha · neo: tren/cam/dat · vật đỏ: Có
- `box_stack` · Chồng hộp hồ sơ · bối cảnh: van_phong, phong_trong_nha · neo: dat/tren [điểm neo: dinh_hop] · vật đỏ: Không
- `umbrella` · Chiếc ô che mưa · trạng thái: gap · bối cảnh: pho_ngo, thien_nhien_mo · neo: cam · vật đỏ: Có
- `bench` · Ghế băng gỗ công viên · bối cảnh: pho_ngo, hien_tra, ga_tau · neo: dat [điểm neo: mat_ghe, mat_ghe_trai, mat_ghe_phai] · vật đỏ: Không
- `cloud_wisp` · Làn mây thuỷ mặc · bối cảnh: thien_nhien_mo, hien_tra, pho_ngo · neo: troi · vật đỏ: Không
- `std_chair` · Ghế tựa công sở · bối cảnh: van_phong, phong_trong_nha, quan_nho, nha_que · neo: dat [điểm neo: mat_ghe] · vật đỏ: Không
- `low_wood_stool` · Đôn gỗ thấp ngồi trà · bối cảnh: hien_tra, nha_que · neo: dat [điểm neo: mat_ghe] · vật đỏ: Không
- `std_work_desk` · Bàn làm việc công sở · bối cảnh: van_phong, phong_trong_nha · neo: dat [điểm neo: mat_ban_trai, mat_ban_giua, mat_ban_phai, mat_trai, mat_giua, mat_phai] · vật đỏ: Không
- `low_tea_table` · Bàn trà gỗ thấp · bối cảnh: hien_tra, nha_que · neo: dat [điểm neo: mat_ban_trai, mat_ban_giua, mat_ban_phai, mat_trai, mat_giua, mat_phai] · vật đỏ: Không
- `desk_calendar` · Lịch để bàn · bối cảnh: van_phong, phong_trong_nha · neo: tren/dat · vật đỏ: Có
- `desk_laptop` · Laptop công sở · bối cảnh: van_phong, quan_nho · neo: tren/dat · vật đỏ: Có
- `vi_tien` · Ví gập · trạng thái: khoa · bối cảnh: van_phong, pho_ngo, quan_nho · neo: tren/cam/dat · vật đỏ: Có
- `thiep` · Tấm thiệp gập đôi · bối cảnh: phong_trong_nha, hien_tra, khong_gian_ky_hieu · neo: tren/cam/dat · vật đỏ: Có
- `phong_bi` · Phong bì thư · bối cảnh: van_phong, phong_trong_nha, hien_tra · neo: tren/cam/dat · vật đỏ: Có
- `hoa_don` · Tờ hoá đơn răng cưa · trạng thái: cam/tua · bối cảnh: van_phong, quan_nho, phong_trong_nha · neo: cam/tren/dat · vật đỏ: Có
- `porch_window` · Khung cửa sổ tường · bối cảnh: phong_trong_nha, hien_tra, van_phong, quan_nho · neo: tuong [điểm neo: be_cua] · vật đỏ: Không
- `am_tra` · Ấm trà gốm nhỏ · bối cảnh: hien_tra, nha_que, quan_nho · neo: tren/dat · vật đỏ: Có
- `bat_com` · Bát cơm gốm · bối cảnh: nha_que, phong_trong_nha · neo: tren/cam/dat · vật đỏ: Có
- `ly_ca_phe` · Ly cà phê có quai · bối cảnh: quan_nho, van_phong · neo: tren/cam/dat · vật đỏ: Có
- `ly_ruou` · Ly rượu chân cao · bối cảnh: quan_nho, hien_tra · neo: tren/cam/dat · vật đỏ: Có
- `hop_com` · Hộp cơm trưa · bối cảnh: van_phong, nha_que · neo: tren/cam/dat · vật đỏ: Có
- `mam_com` · Mâm cơm tròn dẹt · bối cảnh: nha_que · neo: tren/dat [điểm neo: trai_mam, giua_mam, phai_mam] · vật đỏ: Không
- `ban_quan` · Bàn quán cỡ vừa · bối cảnh: quan_nho, phong_trong_nha, hien_tra · neo: dat [điểm neo: mat_trai, mat_giua, mat_phai, mat_ban_trai, mat_ban_giua, mat_ban_phai] · vật đỏ: Không
- `ban_hop` · Bàn dài văn phòng · bối cảnh: van_phong · neo: dat [điểm neo: mat_trai, mat_giua, mat_phai, mat_ban_trai, mat_ban_giua, mat_ban_phai] · vật đỏ: Không
- `giuong_ngu` · Giường ngủ khung thấp · bối cảnh: phong_trong_nha · neo: dat [điểm neo: dau_goi, mat_giuong, mat_trai, mat_giua, mat_phai] · vật đỏ: Không
- `chiec_goi` · Chiếc gối vải mềm · bối cảnh: phong_trong_nha · neo: tren/cam/dat · vật đỏ: Có
- `tu_kinh` · Tủ kính trưng bày · bối cảnh: phong_trong_nha, quan_nho, hien_tra · neo: dat [điểm neo: mat_trai, mat_giua, mat_phai, ngan_tren, ngan_duoi] · vật đỏ: Không
- `chen_tra` · Chén trà gốm nhỏ (alias `small_cup`) · bối cảnh: hien_tra, quan_nho, phong_trong_nha · neo: tren/cam/dat · vật đỏ: Có
- `vo_ruou` · Vò rượu gốm Mai Bình (alias `wine_jar`) · bối cảnh: hien_tra, quan_nho, nha_que · neo: tren/dat · vật đỏ: Có
- `ban_lam_viec` · Bàn làm việc công sở (alias `std_work_desk`) · bối cảnh: van_phong, phong_trong_nha · neo: dat [điểm neo: mat_ban_trai, mat_ban_giua, mat_ban_phai, mat_trai, mat_giua, mat_phai] · vật đỏ: Không
- `ban_tra` · Bàn trà gỗ thấp (alias `low_tea_table`) · bối cảnh: hien_tra, nha_que · neo: dat [điểm neo: mat_ban_trai, mat_ban_giua, mat_ban_phai, mat_trai, mat_giua, mat_phai] · vật đỏ: Không

## 4. TẦNG B — Có sẵn, chưa chuẩn hoá nét (19 món `nhap`)
> Đã có code trong kho, dùng được trong Gói Chén nếu đúng nghĩa; ô nhập tool web sẽ hiện cảnh báo vàng để chủ kênh biết chưa chuẩn hoá nét.
- `bridal_veil` · Khăn voan lụa · bối cảnh: phong_trong_nha, khong_gian_ky_hieu · neo: cam/dat · vật đỏ: Có
- `dashed_heart` · Tim nét đứt · bối cảnh: khong_gian_ky_hieu · neo: troi/cam/dat · vật đỏ: Có
- `solid_heart` · Tim chu sa · bối cảnh: khong_gian_ky_hieu · neo: troi/cam/dat · vật đỏ: Có
- `rice_bowl` · Bát cơm gốm · bối cảnh: nha_que, phong_trong_nha · neo: tren/cam/dat · vật đỏ: Có
- `tall_cup` · Cốc nước cao · bối cảnh: quan_nho, van_phong · neo: tren/cam/dat · vật đỏ: Có
- `boulder` · Tảng đá cuội · bối cảnh: thien_nhien_mo, khong_gian_ky_hieu · neo: dat · vật đỏ: Không
- `street_lamp` · Đèn đường cổ điển · bối cảnh: pho_ngo, ga_tau · neo: dat · vật đỏ: Có
- `warm_house` · Ngôi nhà mái hiên ấm · bối cảnh: nha_que, pho_ngo, thien_nhien_mo · neo: dat (nen) · vật đỏ: Có
- `city_skyline` · Bóng phố thị phía xa · bối cảnh: pho_ngo, van_phong · neo: dat (nen) · vật đỏ: Không
- `small_boat` · Thuyền gỗ nhỏ · bối cảnh: thien_nhien_mo · neo: dat · vật đỏ: Có
- `kite` · Cánh diều giấy · bối cảnh: thien_nhien_mo, khong_gian_ky_hieu · neo: troi/cam · vật đỏ: Có
- `paper_plane` · Máy bay giấy · bối cảnh: thien_nhien_mo, khong_gian_ky_hieu, pho_ngo · neo: troi/cam/dat · vật đỏ: Có
- `bare_tree` · Nhành cây mùa đông · bối cảnh: thien_nhien_mo, pho_ngo · neo: dat · vật đỏ: Không
- `sprout` · Mầm cây non · bối cảnh: thien_nhien_mo, khong_gian_ky_hieu · neo: dat/tren · vật đỏ: Có
- `campfire` · Đốm lửa trại · bối cảnh: hien_tra, thien_nhien_mo · neo: dat · vật đỏ: Có
- `lantern` · Đèn lồng lụa · bối cảnh: thien_nhien_mo, pho_ngo, hien_tra · neo: cam/tuong/troi/dat · vật đỏ: Có
- `seesaw` · Bập bênh gỗ · bối cảnh: khong_gian_ky_hieu, thien_nhien_mo · neo: dat · vật đỏ: Có
- `hourglass` · Đồng hồ cát · bối cảnh: khong_gian_ky_hieu, van_phong, phong_trong_nha · neo: tren/dat · vật đỏ: Có
- `chat_bubble` · Khung tin nhắn · bối cảnh: khong_gian_ky_hieu, phong_trong_nha · neo: troi · vật đỏ: Có

## 5. TẦNG C — Đang lên kế hoạch (49 preset theo 12 họ · CHỈ LÊN Ý TƯỞNG, KHÔNG XUẤT JSON)
> Các preset này chưa có code trong `propCatalog`. Nếu phương án Bước 2 cần món tầng C, ghi rõ `Cần bổ sung: <mã preset>` và kèm phương án thay thế dựng được ngay bằng tầng A/B. Tuyệt đối KHÔNG xuất mã tầng C trong JSON Bước 3.
### Họ 1 · `do_chua` (Đồ chứa ẩm thực & trà đạo) — đã có trong Tầng A/B
### Họ 2 · `mat_phang` (Bàn, giường, tủ kê đồ) — đã có trong Tầng A/B
### Họ 3 · `khung` (Khung kiến trúc, cửa, gương, bậc thang · 7 món chờ dựng)
- `cua_phong` · khung cửa đứng trong nhà, biến thể dong / he_mo · bối cảnh: phong_trong_nha, hien_tra, pho_ngo, nha_que · neo: tuong/dat · vật đỏ: Tuỳ vật (khung_tranh/guong_soi/cua)
- `cua_nha` · cửa gỗ hai cánh có bậc thềm · bối cảnh: phong_trong_nha, hien_tra, pho_ngo, nha_que · neo: tuong/dat · vật đỏ: Tuỳ vật (khung_tranh/guong_soi/cua)
- `cong_rao` · cổng song thưa đầu ngõ · bối cảnh: phong_trong_nha, hien_tra, pho_ngo, nha_que · neo: tuong/dat · vật đỏ: Tuỳ vật (khung_tranh/guong_soi/cua)
- `mai_hien` · mái ngói/bạt nghiêng che đầu ở lớp nen, cao trên tầm đầu Lữ khách · bối cảnh: phong_trong_nha, hien_tra, pho_ngo, nha_que · neo: tuong/dat · vật đỏ: Tuỳ vật (khung_tranh/guong_soi/cua)
- `guong_soi` · gương bầu dục/chữ nhật treo tường hoặc chân đứng · bối cảnh: phong_trong_nha, hien_tra, pho_ngo, nha_que · neo: tuong/dat · vật đỏ: Tuỳ vật (khung_tranh/guong_soi/cua)
- `khung_tranh` · khung viền đôi treo tường · bối cảnh: phong_trong_nha, hien_tra, pho_ngo, nha_que · neo: tuong/dat · vật đỏ: Tuỳ vật (khung_tranh/guong_soi/cua)
- `bac_thang_ngan` · cụm 3–4 bậc đá khi cần đặt như đạo cụ độc lập · bối cảnh: phong_trong_nha, hien_tra, pho_ngo, nha_que · neo: tuong/dat · vật đỏ: Tuỳ vật (khung_tranh/guong_soi/cua)
### Họ 4 · `giay` (Ấn phẩm giấy, sổ sách, thư từ · 4 món chờ dựng)
- `cuon_sach` · sách/sổ tay mở đôi hoặc gập, biến thể mo / gap · bối cảnh: van_phong, phong_trong_nha, khong_gian_ky_hieu · neo: tren/cam/dat · vật đỏ: Có
- `trang_giay` · tờ giấy nháp thơ hơi uốn góc · bối cảnh: van_phong, phong_trong_nha, khong_gian_ky_hieu · neo: tren/cam/dat · vật đỏ: Có
- `la_bai` · quân bài bo góc tỷ lệ 2:3 · bối cảnh: van_phong, phong_trong_nha, khong_gian_ky_hieu · neo: tren/cam/dat · vật đỏ: Có
- `ban_do` · tờ bản đồ gấp 3 nếp có nét đường đi mảnh · bối cảnh: van_phong, phong_trong_nha, khong_gian_ky_hieu · neo: tren/cam/dat · vật đỏ: Có
### Họ 5 · `cay_co` (Thực vật, hoa, cành lá · 4 món chờ dựng)
- `bong_hoa` · nhành hoa một bông thanh mảnh, biến thể co_gai / trong_binh · bối cảnh: thien_nhien_mo, pho_ngo, hien_tra · neo: dat/tren/cam · vật đỏ: Có (hoa/lá/mầm)
- `cay_xanh` · cây thân gỗ tán thuỷ mặc thoáng · bối cảnh: thien_nhien_mo, pho_ngo, hien_tra · neo: dat/tren/cam · vật đỏ: Có (hoa/lá/mầm)
- `cum_co` · khóm cỏ mềm ven đường · bối cảnh: thien_nhien_mo, pho_ngo, hien_tra · neo: dat/tren/cam · vật đỏ: Có (hoa/lá/mầm)
- `chiec_la` · chiếc lá đơn để cầm tay hoặc đặt bàn; mưa lá nhiều dùng Atmosphere: leaves · bối cảnh: thien_nhien_mo, pho_ngo, hien_tra · neo: dat/tren/cam · vật đỏ: Có (hoa/lá/mầm)
### Họ 6 · `do_mang` (Đồ cá nhân mang theo & phục trang treo · 7 món chờ dựng)
- `khan_choang` · khăn len / khăn tay mềm, biến thể gap / bay · bối cảnh: pho_ngo, phong_trong_nha, ga_tau, hien_tra · neo: cam/tren/dat/tuong · vật đỏ: Có
- `quat_tay` · quạt giấy/quạt nan xếp nửa vòng · bối cảnh: pho_ngo, phong_trong_nha, ga_tau, hien_tra · neo: cam/tren/dat/tuong · vật đỏ: Có
- `vali` · vali đứng có tay kéo gọn · bối cảnh: pho_ngo, phong_trong_nha, ga_tau, hien_tra · neo: cam/tren/dat/tuong · vật đỏ: Có
- `cap_kinh` · gọng kính tròn mảnh đặt bàn hoặc cầm tay · bối cảnh: pho_ngo, phong_trong_nha, ga_tau, hien_tra · neo: cam/tren/dat/tuong · vật đỏ: Có
- `don_ganh` · đòn tre uốn nhẹ kèm đôi quang gánh đeo vai lung · bối cảnh: pho_ngo, phong_trong_nha, ga_tau, hien_tra · neo: cam/tren/dat/tuong · vật đỏ: Có
- `ao_so_mi` · áo sơ mi treo móc phẳng phiu · bối cảnh: pho_ngo, phong_trong_nha, ga_tau, hien_tra · neo: cam/tren/dat/tuong · vật đỏ: Có
- `chiec_dam` · dáng váy chữ A treo móc thanh lịch · bối cảnh: pho_ngo, phong_trong_nha, ga_tau, hien_tra · neo: cam/tren/dat/tuong · vật đỏ: Có
### Họ 7 · `ghe` (Ghế ngồi các loại · 2 món chờ dựng)
- `ghe_van_phong` · ghế tựa lưng cao + trụ chân xoay 5 nhánh · bối cảnh: van_phong, pho_ngo, phong_trong_nha · neo: dat (mat_ghe) · vật đỏ: Không
- `ghe_khan_gia` · cụm 2–3 ghế xếp hàng ngang khán phòng · bối cảnh: van_phong, pho_ngo, phong_trong_nha · neo: dat (mat_ghe) · vật đỏ: Không
### Họ 8 · `vat_tron` (Đồng hồ, thiên thể, địa cầu, quả, bóng bay · 8 món chờ dựng)
- `dong_ho_treo` · mặt tròn + 2 kim tối giản · bối cảnh: van_phong, phong_trong_nha, thien_nhien_mo, khong_gian_ky_hieu · neo: tuong/tren/troi/cam · vật đỏ: Có
- `dong_ho_bao_thuc` · mặt tròn nhỏ + 2 chuông tai trên đỉnh + chân ngắn · bối cảnh: van_phong, phong_trong_nha, thien_nhien_mo, khong_gian_ky_hieu · neo: tuong/tren/troi/cam · vật đỏ: Có
- `mat_troi` · đĩa tròn + quầng mảnh ở lớp nen / troi, đồng bộ được với Atmosphere: sun · bối cảnh: van_phong, phong_trong_nha, thien_nhien_mo, khong_gian_ky_hieu · neo: tuong/tren/troi/cam · vật đỏ: Có
- `mat_trang` · trăng lưỡi liềm hoặc trăng tròn dịu · bối cảnh: van_phong, phong_trong_nha, thien_nhien_mo, khong_gian_ky_hieu · neo: tuong/tren/troi/cam · vật đỏ: Có
- `hanh_tinh` · khối cầu có vành đai nghiêng · bối cảnh: van_phong, phong_trong_nha, thien_nhien_mo, khong_gian_ky_hieu · neo: tuong/tren/troi/cam · vật đỏ: Có
- `qua_dia_cau` · cầu nghiêng trên giá đỡ chữ C · bối cảnh: van_phong, phong_trong_nha, thien_nhien_mo, khong_gian_ky_hieu · neo: tuong/tren/troi/cam · vật đỏ: Có
- `qua_cam` · quả tròn nhỏ có cuống và 1 lá · bối cảnh: van_phong, phong_trong_nha, thien_nhien_mo, khong_gian_ky_hieu · neo: tuong/tren/troi/cam · vật đỏ: Có
- `bong_bay` · bầu tròn hơi thuôn đáy + sợi dây mảnh · bối cảnh: van_phong, phong_trong_nha, thien_nhien_mo, khong_gian_ky_hieu · neo: tuong/tren/troi/cam · vật đỏ: Có
### Họ 9 · `man_hinh` (Thiết bị số & bảng hiển thị · 6 món chờ dựng)
- `dien_thoai` · khung dọc cầm tay hoặc đặt bàn, biến thể sang_tin_nhan · bối cảnh: van_phong, quan_nho, phong_trong_nha · neo: cam/tren/tuong · vật đỏ: Có
- `may_tinh_ban` · màn hình chữ nhật có chân đế trên bàn làm việc · bối cảnh: van_phong, quan_nho, phong_trong_nha · neo: cam/tren/tuong · vật đỏ: Có
- `bang_tinh` · khung biểu đồ cột / lưới số liệu gọn · bối cảnh: van_phong, quan_nho, phong_trong_nha · neo: cam/tren/tuong · vật đỏ: Có
- `dien_tam_do` · khung ngang với đường xung nhịp tim gấp khúc · bối cảnh: van_phong, quan_nho, phong_trong_nha · neo: cam/tren/tuong · vật đỏ: Có
- `bang_den` · bảng chữ nhật treo tường có nét phấn tối giản · bối cảnh: van_phong, quan_nho, phong_trong_nha · neo: cam/tren/tuong · vật đỏ: Có
- `bang_o_chu` · lưới vuông 3×3 / 4×4 có ô nhấn đỏ · bối cảnh: van_phong, quan_nho, phong_trong_nha · neo: cam/tren/tuong · vật đỏ: Có
### Họ 10 · `anh_sang` (Đèn & nguồn lửa ấm · 1 món chờ dựng)
- `den_ban` · đế tròn + thân cong mảnh + chụp đèn nghiêng ấm · bối cảnh: phong_trong_nha, quan_nho, pho_ngo · neo: tren/tuong/dat · vật đỏ: Có
### Họ 11 · `ky_hieu` (Biểu tượng thị giác Không gian ký hiệu · 6 món chờ dựng)
- `not_nhac` · nốt móc đơn / móc kép bay nhẹ · bối cảnh: khong_gian_ky_hieu · neo: troi/tuong/cam/dat · vật đỏ: Có
- `bang_dan` · miếng băng cá nhân bo tròn có ô gạc giữa · bối cảnh: khong_gian_ky_hieu · neo: troi/tuong/cam/dat · vật đỏ: Có
- `duong_ke` · vạch ranh giới dưới đất chia hai bên sân khấu · bối cảnh: khong_gian_ky_hieu · neo: troi/tuong/cam/dat · vật đỏ: Có
- `soi_chi` · sợi dây mảnh nối giữa hai vị trí, biến thể cang / chung · bối cảnh: khong_gian_ky_hieu · neo: troi/tuong/cam/dat · vật đỏ: Có
- `me_cung` · vòng xoắn vuông tối giản nhìn nghiêng/trên · bối cảnh: khong_gian_ky_hieu · neo: troi/tuong/cam/dat · vật đỏ: Có
- `pin_sac` · viên pin chữ nhật có cực đầu và vạch mức năng lượng · bối cảnh: khong_gian_ky_hieu · neo: troi/tuong/cam/dat · vật đỏ: Có
### Họ 12 · `nha_xe` (Bóng kiến trúc xa & phương tiện · 4 món chờ dựng)
- `nha_pho` · mặt tiền nhà 2 tầng có ban công / ô cửa sáng · bối cảnh: pho_ngo, ga_tau, nha_que · neo: dat (nen/giua) · vật đỏ: Tuỳ vật (ô cửa/giỏ xe)
- `xe_dap` · khung sườn mảnh + 2 bánh nan tối giản · bối cảnh: pho_ngo, ga_tau, nha_que · neo: dat (nen/giua) · vật đỏ: Tuỳ vật (ô cửa/giỏ xe)
- `xe_may` · dáng scooter / cub gọn gàng · bối cảnh: pho_ngo, ga_tau, nha_que · neo: dat (nen/giua) · vật đỏ: Tuỳ vật (ô cửa/giỏ xe)
- `toa_tau` · thân toa ngang có dãy ô cửa vuông ở sân ga · bối cảnh: pho_ngo, ga_tau, nha_que · neo: dat (nen/giua) · vật đỏ: Tuỳ vật (ô cửa/giỏ xe)
