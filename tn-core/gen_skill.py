"""Sinh tự động SKILL.md, references/thu-vien.md và đóng gói dao-dien-tra-nguoi.zip từ tn-core/tn.py."""
import os
import re
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import tn  # noqa: E402

SKILL_DIR = os.path.join(ROOT, ".agents", "skills", "dao-dien-tra-nguoi")
REF_DIR = os.path.join(SKILL_DIR, "references")
SKILL_MD_PATH = os.path.join(SKILL_DIR, "SKILL.md")
REF_MD_PATH = os.path.join(REF_DIR, "thu-vien.md")
ZIP_PATH = os.path.join(SKILL_DIR, "dao-dien-tra-nguoi.zip")

MOTIF_NOTES = {
    "vat_lat_nghia": "Đồ vật quen thuộc đổi trạng thái hoặc đảo nghĩa tại cú lật.",
    "khoang_cach": "Ranh giới, khoảng cách hoặc cánh cổng giữa hai người được mở ra hay khép lại.",
    "vat_o_lai": "Người rời đi hoặc lặng yên, chỉ còn đồ vật ở lại giữ dư âm.",
    "thoi_gian": "Dòng chảy thời gian hiện hình qua nhịp lật hoặc trạng thái đồ vật.",
    "noi_tam": "Trạng thái bên trong của Lữ khách phản chiếu qua một vật tĩnh tại.",
    "doi_chieu": "Hai trạng thái hoặc góc nhìn đặt cạnh nhau tạo độ chênh tại cú lật.",
    "con_duong": "Hành trình bước đi, dừng lại hoặc rẽ hướng của Lữ khách.",
    "doi_quy_mo": "Sự tương phản giữa cái nhỏ bé đời thường và điều rộng lớn.",
}

SETTING_NOTES = {
    "ngo_pho": "Ngõ phố đời thường",
    "van_phong": "Góc bàn làm việc / công sở",
    "hien_tra": "Hiên trà tĩnh lặng",
}


def build_reference_md() -> str:
    lines = [
        "# Thư Viện Tên Hợp Lệ — Trà Nguội (`tn-core`)",
        "",
        "> File này được sinh tự động từ `tn-core/tn.py` qua `python3 tn-core/gen_skill.py`. Chỉ dùng đúng các khoá và tên dưới đây khi viết kịch bản JSON.",
        "",
        "## 1. Khoá JSON hợp lệ (Validator chặn cứng mọi khoá lạ)",
        "- Khoá cấp gốc (`spec`): " + ", ".join(f"`{k}`" for k in sorted(tn.SPEC_KEYS)),
        "- Khoá trong `nhan_vat`: " + ", ".join(f"`{k}`" for k in sorted(tn.NHAN_VAT_KEYS)),
        "- Khoá trong mỗi phần tử `dao_cu`: " + ", ".join(f"`{k}`" for k in sorted(tn.DAO_CU_KEYS)),
        "- Khoá mốc thời gian trong `nhip`: " + ", ".join(f"`{k}`" for k in sorted(tn.BEAT_TIME_KEYS)),
        "- Khoá diễn xuất nhân vật trong `nhip`: " + ", ".join(f"`{k}`" for k in sorted(tn.BEAT_ACTOR_KEYS)) + " (cùng tên các đạo cụ đã khai báo trong `dao_cu`)",
        "",
        "## 2. Motif (`motif` — chọn đúng 1 trong 8)",
    ]
    for m in sorted(tn.MOTIFS):
        desc = MOTIF_NOTES.get(m, "Motif sân khấu chuẩn.")
        lines.append(f"- `{m}`: {desc}")

    lines.extend([
        "",
        "## 3. Bối cảnh (`boi_canh`)",
    ])
    for s in sorted(tn.SETTINGS):
        desc = SETTING_NOTES.get(s, "Bối cảnh sân khấu.")
        lines.append(f"- `{s}`: {desc}")

    lines.extend([
        "",
        "## 4. Khe vị trí ngang (`vi_tri` cho đạo cụ mặt đất và `nhan_vat`)",
        "- Danh sách khe hợp lệ: " + ", ".join(f"`{k}`" for k in tn.SLOTS.keys()),
        "",
        "## 5. Đạo cụ (`dao_cu`), Điểm neo (`dat_tren`) & Trạng thái (`nhip`)",
        "| Mã đạo cụ (`id`) | Được làm vật đỏ (`do: true`) | Điểm neo hợp lệ (`<ten>.<diem_neo>`) | Trạng thái điều khiển trong `nhip` |",
        "| :--- | :--- | :--- | :--- |",
    ])
    for pid, pinfo in tn.PROPS.items():
        can_red = "Có" if pinfo.get("red") else "Không"
        anchors = sorted(pinfo.get("anchors", {}).keys())
        anc_str = ", ".join(f"`{pid}.{a}`" for a in anchors) if anchors else "*(không có điểm neo)*"
        states = sorted(pinfo.get("states", set()))
        st_str = ", ".join(f"`{s}`" for s in states) if states else "*(tĩnh)*"
        lines.append(f"| `{pid}` | {can_red} | {anc_str} | {st_str} |")

    lines.extend([
        "",
        "## 6. Tư thế, Vị trí & Ánh nhìn bám vật của Lữ khách (`nhan_vat`, `lu_khach`, `nhin_theo`)",
        "- Các tư thế hợp lệ (`lu_khach`): " + ", ".join(f"`{p}`" for p in tn.POSES.keys()),
        "- Bám ánh nhìn & hướng người theo vật (`nhin_theo`): trong một nhịp của `nhip`, thêm `\"nhin_theo\": \"<ten_dao_cu>\"` (hoặc `\"nguoi_b\"`) để engine tự xoay hướng người, độ nghiêng thân và hướng mắt của Lữ khách bám theo vị trí thực của vật đó cho đến hết video (hoặc đến khi đổi sang `nhin_nguoi_xem` / đặt `\"nhin_theo\": null`).",
        "- Khi đứng: khai báo `\"lu_khach\": \"<khe>\"` trong `nhan_vat` (Lữ khách mặc định cầm chén trà trên tay, nên **không được đặt thêm `chen_tra` trên bàn**).",
        "- Khi ngồi ghế: khai báo đạo cụ `ghe` trước trong `dao_cu`, rồi gắn Lữ khách vào điểm neo ghế bằng `\"ngoi_tren\": \"ghe.mat_ghe\"` trong `nhan_vat` (nếu ngồi sát bàn, thêm `\"ban\"` vào `cho_phep_chong`).",
        "",
        "## 7. Hành động của Người B (`nguoi_b` trong `nhip`)",
        "- Các hành động hợp lệ: " + ", ".join(f"`{a}`" for a in sorted(tn.B_ACTIONS)),
        "",
    ])
    return "\n".join(lines)


SKILL_MD_CONTENT = """---
name: dao-dien-tra-nguoi
description: Đạo diễn câu chữ và kịch bản ngữ nghĩa 3 bước cho kênh Trà Nguội (@tranguoi.15s), đối chiếu thư viện chuẩn tại references/thu-vien.md và xuất kịch bản JSON đúng định dạng tn-core/specs.
---

# Đạo Diễn Trà Nguội (@tranguoi.15s)

Bạn là Đạo diễn của kênh **Trà Nguội**. Khi làm mỗi Chén mới, hãy đọc `references/thu-vien.md` và thực hiện tuần tự **đúng 3 bước**, kết thúc mỗi bước phải **dừng lại chờ chủ kênh chốt** mới sang bước tiếp theo.

## Bước 1 — Câu chữ (Dừng chờ chủ kênh chốt)
- Đưa ra **3 phương án** câu chữ, mỗi phương án dài **14–28 âm tiết**, cụm **chữ lật** (`cu_lat`) bắt buộc nằm ở **dòng cuối**.
- Nếu câu trích dẫn có **tên tác giả** thì **giữ nguyên văn 100%**, không tự ý sửa từ.
- Giữ chuẩn DNA ngôn từ **“Lắng — Kiệm lời — Đời thực — Có dư vị”**: ưu tiên hình ảnh đời thường hữu hình, tự trào duyên dáng hoặc chiêm nghiệm nhẹ nhàng.
- **Danh sách từ cấm**:
  - Từ bi lụy, kịch tính sáo rỗng: *tê tái lòng, đớn đau tột cùng, chôn chặt đáy đại dương, khóc cạn nước mắt, tan nát cõi lòng*.
  - Giọng dạy đời, răn đe, khẩu hiệu kỹ năng sống: *Hãy..., Đừng bao giờ..., Bạn phải..., Bí quyết là...*.
  - Văn dịch cứng hoặc sáo ngữ ngôn tình: *một loại... không kể xiết, vạn dặm nhân gian, năm tháng tĩnh lặng*.
  - Hashtag rác: `#fyp`, `#foryou`, `#xuhuong`, `#viral`.

## Bước 2 — Ý tưởng cú lật (Dừng chờ chủ kênh chốt)
Sau khi chủ kênh chốt câu chữ, đưa ra **3 phương án** dựng cảnh. Mỗi phương án ghi rõ đủ 4 mục:
1. **Motif**: chọn đúng **1 trong 8** motif có trong `references/thu-vien.md`.
2. **Vật đỏ**: lấy từ nghĩa của câu chữ, **mỗi Chén chỉ đúng 1 vật**, và chỉ chuyển đỏ từ cú lật.
3. **Phản ứng của Lữ khách ở từng dòng**: nêu rõ tư thế/biểu cảm của Lữ khách ứng với từng dòng và tại cú lật.
4. **Lý giải**: viết **một câu** giải thích vì sao hình ảnh này “nói” đúng câu chữ.

### Quy tắc bắt buộc khi thiếu đạo cụ hoặc tư thế
- Nếu ý tưởng cú lật tốt nhất cần đạo cụ hoặc tư thế chưa có trong `references/thu-vien.md` thì **dừng ở Bước 2**, nêu rõ cần thêm gì vào thư viện.
- **Không được tự bịa tên** và **không được đổi sang vật khác làm lệch nghĩa câu**.

## Bước 3 — Xuất kịch bản JSON chuẩn `tn-core/specs`
Sau khi chủ kênh chốt phương án có đủ đạo cụ và tư thế trong `references/thu-vien.md`, xuất khối JSON đúng cấu trúc `tn-core/specs`:
- Chỉ dùng đúng các khoá hợp lệ và tên đạo cụ, điểm neo, khe vị trí, tư thế, `nhin_theo` trong `references/thu-vien.md`.
- Khi Lữ khách đứng cầm chén trà trên tay (`lu_khach`), không đặt thêm `chen_tra` trên bàn; khi ngồi ghế, gắn vào điểm neo `"ngoi_tren": "ghe.mat_ghe"`.

### Mẫu định dạng JSON (`tn-core/specs`)
```json
{
  "tieu_de": "Chén 10 — Người nhà",
  "cau": [
    "Mẹ anh bảo người lạ,",
    "Sẽ cực kỳ xấu xa.",
    "Nhưng em xinh đẹp quá…",
    "Chắc chắn là người nhà."
  ],
  "cu_lat": "là người nhà",
  "motif": "khoang_cach",
  "boi_canh": "ngo_pho",
  "nhan_vat": {"lu_khach": "trai", "nguoi_b": "phai"},
  "dao_cu": [
    {"id": "cong_rao", "vi_tri": "giua"},
    {"id": "chen_tra", "ten": "chen_moi", "dat_tren": "cong_rao.tru_phai", "do": true, "xuat_hien": "cu_lat"}
  ],
  "cho_phep_chong": ["cong_rao"],
  "nhip": [
    {"dong": 1, "lu_khach": "dung_cam_chen"},
    {"dong": 2, "lu_khach": "canh_giac", "nguoi_b": "di_vao"},
    {"dong": 3, "lu_khach": "khung_lai"},
    {"dong": 3, "sau": 0.6, "lu_khach": "boi_roi"},
    {"cu_lat": true, "lu_khach": "cuoi", "cong_rao": {"mo": 1}, "nguoi_b": "nhun"},
    {"cu_lat": true, "sau": 3.6, "lu_khach": "nhin_nguoi_xem"}
  ]
}
```
"""


def verify_skill_md(text: str) -> None:
    lines = text.splitlines()
    if len(lines) > 100:
        raise ValueError(f"SKILL.md vượt quá 100 dòng ({len(lines)} dòng)")
    forbidden_patterns = [
        (r"#[0-9A-Fa-f]{3,6}\b", "mã màu hex"),
        (r"\bfps\b|\bframe\b|\bframes\b", "số frame / fps"),
        (r"\bbitrate\b|\bmbps\b|\bkbps\b|\blufs\b", "bitrate / âm lượng"),
        (r"\bv\d+(\.\d+)*\b", "số phiên bản"),
        (r"\bviewbox\b|\bpx\b|\blech\b", "toạ độ / đơn vị pixel"),
    ]
    for pat, label in forbidden_patterns:
        m = re.search(pat, text, flags=re.IGNORECASE)
        if m:
            raise ValueError(f"SKILL.md chứa thông số bị cấm ({label}): '{m.group(0)}'")


def main() -> None:
    os.makedirs(REF_DIR, exist_ok=True)
    verify_skill_md(SKILL_MD_CONTENT)
    ref_content = build_reference_md()

    with open(SKILL_MD_PATH, "w", encoding="utf-8") as f:
        f.write(SKILL_MD_CONTENT)
    with open(REF_MD_PATH, "w", encoding="utf-8") as f:
        f.write(ref_content)

    with zipfile.ZipFile(ZIP_PATH, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.write(SKILL_MD_PATH, arcname="SKILL.md")
        zf.write(REF_MD_PATH, arcname="references/thu-vien.md")

    line_count = len(SKILL_MD_CONTENT.splitlines())
    print(f"✅ Đã sinh SKILL.md ({line_count} dòng), references/thu-vien.md và {os.path.relpath(ZIP_PATH, ROOT)}")


if __name__ == "__main__":
    main()
