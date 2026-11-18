# Thư Viện Đạo Cụ & Động Từ Hợp Lệ — Trà Nguội (`propCatalog`)

> Tệp sinh tự động từ mã nguồn qua `npm run gen:skill`. Chỉ dùng các tên đã duyệt dưới đây; tuyệt đối không tự vẽ đồ vật hay ghi toạ độ.

## 1. Bối cảnh (`boi_canh`), Lớp sâu (`lop`), Loại neo (`loai_neo`) & Khe vị trí (`vi_tri`)
- Địa hình (`boi_canh.dia_hinh`): `phang`, `doc`, `doi`, `nga_re`, `bo_nuoc`, `bac_thang`.
- Khí quyển (`boi_canh.khi_quyen[].loai`): `rain`, `wind`, `leaves`, `steam`, `birds`, `sun`, `hollow_sun`, `crescent`, `ring_pulse` (kèm `vi_tri`, `huong`: `trai`/`phai`, `mat_do`).
- Lớp sâu (`lop`): `nen`, `giua`, `truoc` (`nen` cho cửa sổ, mây phía sau; va chạm tính giữa các vật cùng lớp).
- Loại neo (`loai_neo`): `dat`, `tuong`, `troi`, `tren`, `cam` (`dat`: mặt đất, `tuong`: treo tường, `troi`: bầu trời, `tren`: đặt trên điểm neo vật khác, `cam`: nhân vật cầm).
- Khe vị trí ngang (`vi_tri` / `di_toi`): `xa_trai`, `trai`, `giua_trai`, `giua`, `giua_phai`, `phai`, `xa_phai`.
- Quy tắc kích thước thật: vật dưới 30 cm nhân `HE_SO_PHONG_DAI = 2`, từ 30 cm trở lên nhân `1` (`TY_LE_CANH = 0.32`).

## 2. Tư thế nhân vật (`tu_the`), Nghiêng (`nghieng`) & Cầm/Ngồi
- Tư thế hợp lệ (`tu_the`): `dung`, `di_bo`, `day`, `ngoi_tua`, `nguoc_nhin`, `vuon_tay`, `gio_cao`, `trao`.
- Độ nghiêng (`nghieng`): `thang`, `nhe_truoc`, `guc`, `nga_lung`.
- Hướng mặt (`huong`): `trai`, `phai`. Hướng nhìn (`nhin_theo`): `"<id_vat_hoac_nhan_vat>"` hoặc `null`.
- Vị trí cầm đạo cụ (`cam_boi`): `<id_nhan_vat>.tay`, `<id_nhan_vat>.dau`, `<id_nhan_vat>.lung` (`tay`, `dau`, `lung`).
- Ngồi ghế bàn: bắt buộc `ngoi_tren: "<id_ghe>.mat_ghe"`; thêm `ngoi_vao: "<id_ban>"` để tự kê ghế sát bàn nhìn ngang.
- Chén trà cầm tay (`cam_chen_tra: true`) mặc định màu mực.

## 3. Nhịp & Bộ động từ hiện có (`nhip[]`)
- Mốc thời gian (`moc`): `bat_dau`, `dong_1`, `dong_2`, `dong_3`, `dong_4`, `cu_lat` (kèm `sau` và `thoi_luong` tính bằng giây).
- Động từ nhân vật (`nhip[].nhan_vat.<id>`): `tu_the`, `di_toi`, `huong`, `nghieng`, `nhin_theo`, `cam_chen_tra`, `dung_day`.
- Động từ đạo cụ (`nhip[].dao_cu.<id>`): `trang_thai`, `cam_boi`, `dat_tren`, `di_toi`, `bay_len`, `tach_doi`, `khoi`.

## 4. Đạo cụ đã duyệt trong `propCatalog` (`duyet` — skill được phép dùng)
| Mã đạo cụ (`type`) | Nghĩa / Tên gọi | Lớp mặc định | Loại neo | Vật đỏ (`vat_do`) | Trạng thái (`trang_thai`) | Điểm neo (`<id>.<diem_neo>`) |
| :--- | :--- | :---: | :--- | :---: | :--- | :--- |
| `envelope` | Cánh thư giấy cổ phong | `giua` | `cam`, `tren`, `dat` | Có | `mac_dinh` | *(không có)* |
| `wine_jar` | Vò rượu gốm Mai Bình | `giua` | `tren`, `dat` | Có | `mac_dinh` | *(không có)* |
| `small_cup` | Chén trà gốm nhỏ | `giua` | `tren`, `cam`, `dat` | Có | `mac_dinh` | *(không có)* |
| `box_stack` | Chồng hộp hồ sơ | `giua` | `dat`, `tren` | Không | `mac_dinh` | `dinh_hop` |
| `umbrella` | Chiếc ô che mưa | `giua` | `cam` | Có | `mac_dinh`, `gap` | *(không có)* |
| `bench` | Ghế băng gỗ công viên | `giua` | `dat` | Không | `mac_dinh` | `mat_ghe`, `mat_ghe_trai`, `mat_ghe_phai` |
| `cloud_wisp` | Làn mây thuỷ mặc | `nen` | `troi` | Không | `mac_dinh` | *(không có)* |
| `std_chair` | Ghế tựa công sở | `giua` | `dat` | Không | `mac_dinh` | `mat_ghe` |
| `low_wood_stool` | Đôn gỗ thấp ngồi trà | `giua` | `dat` | Không | `mac_dinh` | `mat_ghe` |
| `std_work_desk` | Bàn làm việc công sở | `giua` | `dat` | Không | `mac_dinh` | `mat_ban_trai`, `mat_ban_giua`, `mat_ban_phai` |
| `low_tea_table` | Bàn trà gỗ thấp | `giua` | `dat` | Không | `mac_dinh` | `mat_ban_trai`, `mat_ban_giua`, `mat_ban_phai` |
| `desk_calendar` | Lịch để bàn | `giua` | `tren`, `dat` | Có | `mac_dinh` | *(không có)* |
| `desk_laptop` | Laptop công sở | `giua` | `tren`, `dat` | Có | `mac_dinh` | *(không có)* |
| `vi_tien` | Ví gập | `giua` | `tren`, `cam`, `dat` | Có | `mac_dinh`, `khoa` | *(không có)* |
| `thiep` | Tấm thiệp gập đôi | `giua` | `tren`, `cam`, `dat` | Có | `mac_dinh` | *(không có)* |
| `phong_bi` | Phong bì thư | `giua` | `tren`, `cam`, `dat` | Có | `mac_dinh` | *(không có)* |
| `hoa_don` | Tờ hoá đơn răng cưa | `giua` | `cam`, `tren`, `dat` | Có | `mac_dinh`, `cam`, `tua` | *(không có)* |
| `porch_window` | Khung cửa sổ tường | `nen` | `tuong` | Không | `mac_dinh` | `be_cua` |
| `chen_tra` | Chén trà gốm nhỏ *(alias của `small_cup`)* | `giua` | `tren`, `cam`, `dat` | Có | `mac_dinh` | *(không có)* |
| `vo_ruou` | Vò rượu gốm Mai Bình *(alias của `wine_jar`)* | `giua` | `tren`, `dat` | Có | `mac_dinh` | *(không có)* |

## 5. Preset mới đang chờ duyệt (`nhap` — CHƯA DUYỆT, skill TUYỆT ĐỐI CHƯA ĐƯỢC DÙNG)
> Các preset dưới đây mới dựng ở trạng thái `nhap`, đang chờ chủ kênh nghiệm thu tờ duyệt. Skill không được xuất các mã này trong Gói Chén cho tới khi chuyển sang `duyet`.

| Mã preset (`nhap`) | Nghĩa / Tên gọi | Trạng thái duyệt | Lớp mặc định | Loại neo | Vật đỏ (`vat_do`) | Điểm neo (`<id>.<diem_neo>`) |
| :--- | :--- | :---: | :---: | :--- | :---: | :--- |
| `am_tra` | Ấm trà gốm nhỏ | `nhap` *(chưa duyệt — cấm dùng)* | `giua` | `tren`, `dat` | Có | *(không có)* |
| `bat_com` | Bát cơm gốm | `nhap` *(chưa duyệt — cấm dùng)* | `giua` | `tren`, `cam`, `dat` | Có | *(không có)* |
| `ly_ca_phe` | Ly cà phê có quai | `nhap` *(chưa duyệt — cấm dùng)* | `giua` | `tren`, `cam`, `dat` | Có | *(không có)* |
| `ly_ruou` | Ly rượu chân cao | `nhap` *(chưa duyệt — cấm dùng)* | `giua` | `tren`, `cam`, `dat` | Có | *(không có)* |
| `hop_com` | Hộp cơm trưa | `nhap` *(chưa duyệt — cấm dùng)* | `giua` | `tren`, `cam`, `dat` | Có | *(không có)* |
| `mam_com` | Mâm cơm tròn dẹt | `nhap` *(chưa duyệt — cấm dùng)* | `giua` | `dat`, `tren` | Không | `trai_mam`, `giua_mam`, `phai_mam` |
