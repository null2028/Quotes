# Thư Viện Tên Hợp Lệ — Kịch Bản Ngữ Nghĩa Trà Nguội (`propCatalog`)

> Tệp này được sinh tự động từ `src/stage/propCatalog.tsx` qua `scripts/gen-stage-skill.mjs`. Tuyệt đối chỉ dùng tên trong danh sách này; mỗi mã đạo cụ mang đúng một nghĩa, không tự viết toạ độ, tỷ lệ hay đường vẽ.

## 1. Lớp sâu (`lop`), Loại neo (`loai_neo`) & Khe vị trí (`vi_tri`)
- Ba lớp sâu hợp lệ (`lop`): `nen`, `giua`, `truoc` (`nen` dành cho cửa sổ, mái hiên, mây phía sau nhân vật; va chạm chỉ tính giữa các vật cùng lớp).
- Năm loại neo hợp lệ (`loai_neo`): `dat`, `tuong`, `troi`, `tren`, `cam` (`dat`: mặt đất, `tuong`: treo tường không chạm đất, `troi`: bầu trời, `tren`: đặt trên điểm neo vật khác, `cam`: nhân vật cầm).
- Khe vị trí ngang (`vi_tri` / `di_toi`): `xa_trai`, `trai`, `giua_trai`, `giua`, `giua_phai`, `phai`, `xa_phai`.
- Địa hình (`boi_canh.dia_hinh`): `phang`, `doc`, `doi`, `nga_re`, `bo_nuoc`, `bac_thang`.
- Luật kích thước thật: mỗi vật khai báo `kich_thuoc_that` (cm); vật nhỏ dưới 30 cm nhân hệ số phóng đại chung `HE_SO_PHONG_DAI = 2`, vật từ 30 cm trở lên nhân hệ số `1` (tỷ lệ cảnh `TY_LE_CANH = 0.32`). Cùng một loại vật luôn có cùng kích thước dù đặt ở đâu.

## 2. Tư thế nhân vật (`tu_the`) & Quy tắc ngồi ghế (`ngoi_tren`)
- Tư thế hợp lệ: `dung`, `di_bo`, `day`, `ngoi_tua`, `nguoc_nhin`, `vuon_tay`, `gio_cao`, `trao`.
- Vị trí cầm đạo cụ (`cam_boi`): `<id_nhan_vat>.tay`, `<id_nhan_vat>.dau`, `<id_nhan_vat>.lung` (`tay`, `dau`, `lung`).
- Muốn ngồi (`ngoi_tua`), nhân vật bắt buộc khai báo `ngoi_tren: "<id_ghe>.mat_ghe"`. Không có ghế thì không được ngồi.
- Chén trà trên tay (`cam_chen_tra: true`) mặc định màu mực, chỉ tính là vật đỏ khi khai báo `vat_do_tren_tay: "<id_nhan_vat>.chen_tra"`.

## 3. Kho đạo cụ chuẩn trong `propCatalog` (Đã có kích thước thật, hộp bao & điểm neo)
| Mã đạo cụ (`type`) | Nghĩa / Tên gọi | Cỡ thật (cm) | Duyệt | Lớp mặc định | Loại neo | Vật đỏ | Trạng thái (`trang_thai`) | Điểm neo (`<id>.<diem_neo>`) |
| :--- | :--- | :---: | :---: | :---: | :--- | :---: | :--- | :--- |
| `envelope` | Cánh thư giấy cổ phong | 18 | `duyet` | `giua` | `cam`, `tren`, `dat` | Có | `mac_dinh` | *(không có)* |
| `wine_jar` | Vò rượu gốm Mai Bình | 58 | `duyet` | `giua` | `tren`, `dat` | Có | `mac_dinh` | *(không có)* |
| `small_cup` | Chén trà gốm nhỏ | 11.5 | `duyet` | `giua` | `tren`, `cam`, `dat` | Có | `mac_dinh` | *(không có)* |
| `box_stack` | Chồng hộp hồ sơ | 76 | `duyet` | `giua` | `dat`, `tren` | Không | `mac_dinh` | `dinh_hop` |
| `umbrella` | Chiếc ô che mưa | 170 | `duyet` | `giua` | `cam` | Có | `mac_dinh`, `gap` | *(không có)* |
| `bench` | Ghế băng gỗ công viên | 162 | `duyet` | `giua` | `dat` | Không | `mac_dinh` | `mat_ghe`, `mat_ghe_trai`, `mat_ghe_phai` |
| `cloud_wisp` | Làn mây thuỷ mặc | 118 | `duyet` | `nen` | `troi` | Không | `mac_dinh` | *(không có)* |
| `std_chair` | Ghế tựa công sở | 75 | `duyet` | `giua` | `dat` | Không | `mac_dinh` | `mat_ghe` |
| `low_wood_stool` | Đôn gỗ thấp ngồi trà | 60 | `duyet` | `giua` | `dat` | Không | `mac_dinh` | `mat_ghe` |
| `std_work_desk` | Bàn làm việc công sở | 112 | `duyet` | `giua` | `dat` | Không | `mac_dinh` | `mat_ban_trai`, `mat_ban_giua`, `mat_ban_phai` |
| `low_tea_table` | Bàn trà gỗ thấp | 98 | `duyet` | `giua` | `dat` | Không | `mac_dinh` | `mat_ban_trai`, `mat_ban_giua`, `mat_ban_phai` |
| `desk_calendar` | Lịch để bàn | 26 | `duyet` | `giua` | `tren`, `dat` | Có | `mac_dinh` | *(không có)* |
| `desk_laptop` | Laptop công sở | 29 | `duyet` | `giua` | `tren`, `dat` | Có | `mac_dinh` | *(không có)* |
| `vi_tien` | Ví gập | 15 | `duyet` | `giua` | `tren`, `cam`, `dat` | Có | `mac_dinh`, `khoa` | *(không có)* |
| `thiep` | Tấm thiệp gập đôi | 15 | `duyet` | `giua` | `tren`, `cam`, `dat` | Có | `mac_dinh` | *(không có)* |
| `phong_bi` | Phong bì thư | 18 | `duyet` | `giua` | `tren`, `cam`, `dat` | Có | `mac_dinh` | *(không có)* |
| `hoa_don` | Tờ hoá đơn răng cưa | 20 | `duyet` | `giua` | `cam`, `tren`, `dat` | Có | `mac_dinh`, `cam`, `tua` | *(không có)* |
| `porch_window` | Khung cửa sổ tường | 132 | `duyet` | `nen` | `tuong` | Không | `mac_dinh` | `be_cua` |

## 4. Các đạo cụ gốc đang ở trạng thái `nhap` (chưa khai báo hộp bao — cần bổ sung trước khi dùng)
- `bridal_veil` (Khăn voan lụa), `dashed_heart` (Tim nét đứt), `solid_heart` (Tim chu sa), `rice_bowl` (Bát cơm gốm), `tall_cup` (Cốc nước cao), `boulder` (Tảng đá cuội), `street_lamp` (Đèn đường cổ điển), `warm_house` (Ngôi nhà mái hiên ấm), `city_skyline` (Bóng phố thị phía xa), `small_boat` (Thuyền gỗ nhỏ), `kite` (Cánh diều giấy), `paper_plane` (Máy bay giấy), `bare_tree` (Nhành cây mùa đông), `sprout` (Mầm cây non), `campfire` (Đốm lửa trại), `lantern` (Đèn lồng lụa), `seesaw` (Bập bênh gỗ), `hourglass` (Đồng hồ cát), `chat_bubble` (Khung tin nhắn)
