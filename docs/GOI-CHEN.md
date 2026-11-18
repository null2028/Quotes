# Gói Chén — Định dạng JSON cho kênh Trà Nguội

> Phiên bản: `1`  
> Luồng: Gemini web skill → xuất JSON → dán vào ô nhập tool web → biên dịch + validator → xem trước → render

## Tổng quan

Gói Chén gộp **câu chữ** và **cảnh ngữ nghĩa** vào MỘT file JSON duy nhất.  
Tuyệt đối **không có** toạ độ (`x`, `y`, `scale`), `shapes`, `altShapes`, hay mã màu.  
Mọi vị trí dùng khe ngữ nghĩa (`trai`, `giua`, `phai`…); kích thước và bố cục do engine tự tính.

---

## Các trường

### Cấp gốc

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `phien_ban_goi` | `1` | ✅ | Phiên bản định dạng Gói Chén (hiện tại luôn là `1`). |
| `tieu_de` | string | ✅ | Tiêu đề Chén, hiển thị trên video. VD: `"Khỏe tưng"`. |
| `cau` | string[] | ✅ | Mảng các dòng thơ/văn, mỗi phần tử là 1 dòng. Tối thiểu 2, tối đa 4 dòng. |
| `cu_lat` | string | ✅ | Cụm chữ đổi đỏ ở cú lật. **Phải nằm trong dòng cuối** của `cau`. |
| `tac_gia` | string | | Tên tác giả (tuỳ chọn, bỏ qua nếu tự sáng tác). |
| `ma_quote` | string | | Mã định danh, VD: `"Q001"`. Dùng để quản lý nội bộ. |
| `boi_canh` | object | | Bối cảnh sân khấu. Nếu bỏ trống → mặc định địa hình phẳng. |
| `nhan_vat` | object[] | ✅ | Mảng nhân vật (thường chỉ 1 Lữ khách). |
| `dao_cu` | object[] | ✅ | Mảng đạo cụ trên sân khấu. |
| `nhip` | object[] | ✅ | Mảng nhịp diễn biến theo dòng thơ. |

### `boi_canh`

| Trường | Kiểu | Mô tả |
|---|---|---|
| `dia_hinh` | string | Địa hình: `phang`, `doc`, `doi`, `nga_re`, `bo_nuoc`, `bac_thang`. Mặc định `phang`. |
| `khi_quyen` | object[] | Khí quyển (lá bay, mưa…): `{ loai, vi_tri?, huong?, mat_do? }`. |

### `nhan_vat[]` — mỗi nhân vật

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | string | ✅ | Định danh, thường `"hero"`. |
| `vi_tri` | string | | Khe vị trí: `xa_trai`, `trai`, `giua_trai`, `giua`, `giua_phai`, `phai`, `xa_phai`. |
| `ngoi_tren` | string | | Ghế mà nhân vật ngồi, dạng `"<id_ghế>.mat_ghe"`. VD: `"ghe.mat_ghe"`. |
| `ngoi_vao` | string | | Bàn mà nhân vật hướng vào. Engine tự kê ghế sát bàn. VD: `"ban"`. |
| `huong` | string | | `"trai"` hoặc `"phai"`. Mặc định `"phai"`. |
| `tu_the` | string | | Tư thế: `dung`, `di_bo`, `day`, `ngoi_tua`, `nguoc_nhin`, `vuon_tay`, `gio_cao`, `trao`. |
| `nghieng` | string | | Độ nghiêng: `thang`, `nhe_truoc`, `guc`, `nga_lung`. |
| `nhin_theo` | string | | id đạo cụ hoặc nhân vật mà mắt nhìn theo. VD: `"laptop"`. |
| `lop` | string | | Lớp sâu: `nen`, `giua`, `truoc`. Mặc định `giua`. |
| `cam_chen_tra` | boolean | | `true` nếu Lữ khách cầm chén trà. |

### `dao_cu[]` — mỗi đạo cụ

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | string | ✅ | Định danh riêng. VD: `"ban"`, `"laptop"`, `"hoa_don"`. |
| `type` | string | ✅ | Tên đạo cụ trong thư viện. Xem **Danh sách đạo cụ** bên dưới. |
| `trang_thai` | string | | Trạng thái biến thể. VD: `"tua"` cho hoa_don, `"khoa"` cho vi_tien. |
| `loai_neo` | string | | Cách neo: `dat` (mặt đất), `tuong` (treo tường), `troi` (trên trời), `tren` (đặt trên vật khác), `cam` (cầm trên tay). |
| `vi_tri` | string | | Khe vị trí (khi `loai_neo` là `dat` hoặc `tuong`). |
| `dat_tren` | string | | Đặt lên điểm neo của vật chủ. VD: `"ban.mat_ban_trai"`. Bắt buộc khi `loai_neo` = `tren`. |
| `cam_boi` | string | | Nhân vật cầm vật. VD: `"hero"` hoặc `"hero.tay"`. |
| `lop` | string | | Lớp sâu: `nen`, `giua`, `truoc`. |
| `vat_do` | boolean | | `true` nếu đây là vật đổi đỏ ở cú lật. **Tối đa 1 vật đỏ** trong cả Gói Chén. |

### `nhip[]` — mỗi nhịp diễn biến

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `moc` | string | ✅ | Mốc thời gian: `bat_dau`, `dong_1`, `dong_2`, `dong_3`, `dong_4`, `cu_lat`. |
| `sau` | number | | Trễ so với mốc (giây). VD: `0.4` = sau mốc 0.4s. |
| `thoi_luong` | number | | Thời lượng chuyển động (giây). |
| `nhan_vat` | object | | `{ "<id>": { tu_the?, di_toi?, huong?, nghieng?, nhin_theo?, cam_chen_tra?, dung_day? } }` |
| `dao_cu` | object | | `{ "<id>": { trang_thai?, cam_boi?, dat_tren?, di_toi?, bay_len?, tach_doi?, khoi? } }` |

---

## Danh sách đạo cụ có sẵn

**Nội thất**: `std_chair`, `low_wood_stool`, `std_work_desk`, `low_tea_table`, `bench`, `seesaw`  
**Trên bàn**: `desk_calendar`, `desk_laptop`, `vi_tien`, `thiep`, `phong_bi`, `hoa_don`, `small_cup`, `tall_cup`, `rice_bowl`, `hourglass`  
**Kiến trúc**: `porch_window`, `warm_house`, `city_skyline`, `street_lamp`  
**Thiên nhiên**: `bare_tree`, `sprout`, `campfire`, `boulder`, `cloud_wisp`  
**Đồ vật khác**: `umbrella`, `lantern`, `kite`, `paper_plane`, `envelope`, `bridal_veil`, `dashed_heart`, `solid_heart`, `wine_jar`, `small_boat`, `box_stack`, `chat_bubble`

---

## Ví dụ hoàn chỉnh — Q001

```json
{
  "phien_ban_goi": 1,
  "tieu_de": "Khỏe tưng",
  "cau": [
    "Tháng năm tất tả chưa từng dừng,",
    "Tiền chưa đầy túi đã đau lưng.",
    "Lắm hôm mệt quá toan buông xuống,",
    "Nhìn tờ hóa đơn… lại khỏe tưng!"
  ],
  "cu_lat": "lại khỏe tưng",
  "ma_quote": "Q001",
  "boi_canh": {
    "dia_hinh": "phang"
  },
  "nhan_vat": [
    {
      "id": "hero",
      "ngoi_tren": "ghe.mat_ghe",
      "ngoi_vao": "ban",
      "huong": "phai",
      "tu_the": "ngoi_tua",
      "nghieng": "thang",
      "nhin_theo": "laptop"
    }
  ],
  "dao_cu": [
    { "id": "ban", "type": "std_work_desk", "loai_neo": "dat", "vi_tri": "giua", "lop": "giua" },
    { "id": "ghe", "type": "std_chair", "loai_neo": "dat", "vi_tri": "trai", "lop": "giua" },
    { "id": "laptop", "type": "desk_laptop", "loai_neo": "tren", "dat_tren": "ban.mat_ban_trai", "lop": "giua" },
    { "id": "lich", "type": "desk_calendar", "loai_neo": "tren", "dat_tren": "ban.mat_ban_phai", "lop": "giua" },
    { "id": "hoa_don", "type": "hoa_don", "trang_thai": "tua", "loai_neo": "tren", "dat_tren": "ban.mat_ban_giua", "lop": "giua", "vat_do": true }
  ],
  "nhip": [
    {
      "moc": "bat_dau", "thoi_luong": 0.4,
      "nhan_vat": { "hero": { "tu_the": "ngoi_tua", "nghieng": "thang", "nhin_theo": "laptop" } }
    },
    {
      "moc": "dong_2", "thoi_luong": 0.8,
      "nhan_vat": { "hero": { "nghieng": "nhe_truoc", "nhin_theo": "laptop" } }
    },
    {
      "moc": "dong_3", "thoi_luong": 0.9,
      "nhan_vat": { "hero": { "nghieng": "guc", "nhin_theo": null } }
    },
    {
      "moc": "cu_lat", "sau": 0.4, "thoi_luong": 0.2,
      "nhan_vat": { "hero": { "nghieng": "guc", "nhin_theo": "hoa_don" } }
    },
    {
      "moc": "cu_lat", "sau": 0.7, "thoi_luong": 0.45,
      "nhan_vat": { "hero": { "nghieng": "thang", "nhin_theo": "hoa_don" } }
    },
    {
      "moc": "cu_lat", "sau": 1.4, "thoi_luong": 0.5,
      "nhan_vat": { "hero": { "nghieng": "thang", "nhin_theo": "laptop" } }
    }
  ]
}
```

---

## Lỗi validator hay gặp và cách sửa

| # | Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|---|
| 1 | `"xyz" không có trong propCatalog, ý bạn là "…"?` | Tên đạo cụ viết sai hoặc chưa có trong thư viện. | Sửa `type` theo gợi ý. Xem danh sách đạo cụ ở trên. |
| 2 | `không được ghi trực tiếp "x" / "scale" / "shapes"` | Gói Chén cấm toạ độ và hình vẽ tự do. | Xoá trường `x`, `y`, `scale`, `shapes`, `altShapes`. Dùng `vi_tri` và `dat_tren`. |
| 3 | `Hai vật đè nhau cùng lớp` | Hai đạo cụ ở cùng lớp sâu chiếm cùng vùng pixel. | Đổi `vi_tri` cho một trong hai, hoặc đặt một vật ở lớp `nen` / `truoc`. |
| 4 | `Vật "…" lơ lửng trên không` | Vật neo `dat` nhưng nằm trên mặt đất (thiếu chân đế hoặc sai loại neo). | Kiểm tra `loai_neo`: nếu đặt trên bàn thì dùng `"tren"` + `dat_tren`, nếu treo tường dùng `"tuong"`. |
| 5 | `Nhiều hơn 1 vật đỏ` | Hai đạo cụ cùng có `"vat_do": true`. | Chỉ giữ 1 vật `vat_do: true`, xoá ở các vật còn lại. |
