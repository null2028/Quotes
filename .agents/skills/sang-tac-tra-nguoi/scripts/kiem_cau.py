#!/usr/bin/env python3
"""
kiem_cau.py — Người lọc cơ học cho câu chữ Trà Nguội (không thay gu biên tập, chỉ bắt lỗi đếm được).

Cách dùng:
  python3 kiem_cau.py ung_vien.json          # file chứa 1 object hoặc 1 mảng object
  python3 kiem_cau.py --cau "dòng 1/dòng 2/dòng 3" --lat "cụm lật" [--goc "câu gốc"]

Định dạng mỗi ứng viên:
  { "id": "b1", "cau": ["dòng 1", "dòng 2"], "cu_lat": "cụm lật",
    "giong": "thả thính | hài | suy ngẫm | trầm ... (tuỳ chọn)",
    "tac_gia": "tên tác giả nếu là trích dẫn nguyên tác (tuỳ chọn, nâng trần lên 58 âm tiết)",
    "goc": "câu gốc (chế độ A, tuỳ chọn)" }

ĐỎ = loại; VÀNG = được nhưng phải có lý do; kèm danh sách vật đời thường nhận ra trong câu (gợi ý, không giới hạn — bước đạo diễn tự vẽ vật).
Exit code 1 nếu có ít nhất 1 ứng viên dính ĐỎ.
"""
import json, re, sys, unicodedata, argparse

_TONE = {'oà':'òa','oá':'óa','oả':'ỏa','oã':'õa','oạ':'ọa','oè':'òe','oé':'óe','oẻ':'ỏe','oẽ':'õe','oẹ':'ọe',
         'uỳ':'ùy','uý':'úy','uỷ':'ủy','uỹ':'ũy','uỵ':'ụy'}
def norm(s):
    s = unicodedata.normalize('NFC', s or '').lower()
    for a, b in _TONE.items():
        s = s.replace(a, b)
    return s

def am_tiet(s):
    return len(re.findall(r"[^\s/.,;:!?…\"“”'‘’()\-–—\[\]]+", s or ''))

def has(w, L):
    return re.search(r'(?<!\w)' + re.escape(norm(w)) + r'(?!\w)', L) is not None

# Khuôn ĐỎ (references/loi-mon.md)
DO = [
    ('Đ1', 'Mở câu bằng "Có những…"', lambda c, L: re.match(r'^\s*có những\b', norm(c[0])) is not None),
    ('Đ2', '"không phải/chẳng phải… mà là…"', lambda c, L: re.search(r'(không|chẳng) phải.{0,60}mà là', L) is not None),
    ('Đ3', '"mới hiểu/mới nhận ra/mới biết/hóa ra/thì ra"', lambda c, L: re.search(r'mới (hiểu|nhận ra|biết)|(?<!\w)hóa ra(?!\w)|(?<!\w)thì ra(?!\w)', L) is not None),
    ('Đ4', '"sau tất cả / cuộc đời là / điều quan trọng nhất là"', lambda c, L: re.search(r'sau tất cả|cuộc (đời|sống) (là|vốn)|điều quan trọng( nhất)? là', L) is not None),
    ('Đ5', 'Dòng cuối là lời khuyên (Đừng/Hãy/Bạn xứng đáng/Bạn không cần)', lambda c, L: re.match(r'^\s*(đừng|hãy|bạn xứng đáng|bạn không cần)\b', norm(c[-1])) is not None),
    ('Đ6', 'Kết bằng an ủi', lambda c, L: re.search(r'(cũng không sao|rồi sẽ ổn|đều ổn|cũng đủ rồi|vậy là đủ)\W*$', norm(c[-1])) is not None),
]
TRANG_TU_RU = ['lặng lẽ','âm thầm','khẽ','chợt','thoáng','vội','nhẹ nhàng']
TINH_TU_EM = ['bình yên','an yên','nhẹ lòng','nhẹ tênh','dịu dàng','mênh mang','thanh xuân','năm tháng','tháng năm']
TRUU_TUONG = ['kỳ diệu','hạnh phúc','cô đơn','thời gian','trưởng thành','bình yên','yêu thương','tự do','ký ức','bản lĩnh','thanh xuân','cuộc đời']

# Từ khoá vật đời thường hay gặp — chỉ để nhận ra câu có vật cụ thể và bắt lỗi Đ8 (xoá vật của gốc).
# KHÔNG phải giới hạn: vật ngoài danh sách vẫn hợp lệ. Cột thứ 3: 'nho' = vật nhỏ trên màn hình, làm vật đỏ dễ yếu.
VAT = [
    ('hóa đơn','hoa_don',''),('ví','vi_tien',''),('hầu bao','vi_tien',''),('thiệp','thiep',''),
    ('phong bì','phong_bi',''),('lá thư','envelope',''),('thư','envelope',''),('lịch','desk_calendar',''),
    ('laptop','desk_laptop',''),('máy tính','desk_laptop',''),('chấm công','desk_laptop',''),
    ('ấm trà','am_tra','nho'),('chén','chen_tra','nho'),('tách trà','chen_tra','nho'),
    ('vò rượu','vo_ruou',''),('ly rượu','ly_ruou',''),('rượu','vo_ruou',''),('cà phê','ly_ca_phe',''),
    ('bát cơm','bat_com',''),('hộp cơm','hop_com',''),('mâm','mam_com',''),('ghế','std_chair',''),
    ('ghế đá','bench',''),('ghế băng','bench',''),('bàn','ban_quan',''),('giường','giuong_ngu',''),
    ('gối','chiec_goi',''),('chiếc ô','umbrella',''),('ô','umbrella',''),('dù','umbrella',''),
    ('cửa sổ','porch_window',''),('hồ sơ','box_stack',''),('tủ','tu_kinh',''),('mây','cloud_wisp',''),
    ('tim','solid_heart',''),('tin nhắn','chat_bubble',''),('đèn đường','street_lamp',''),('đèn lồng','lantern',''),
    ('diều','kite',''),('máy bay giấy','paper_plane',''),('mầm','sprout',''),('thuyền','small_boat',''),
    ('lửa','campfire',''),('đồng hồ cát','hourglass',''),('bập bênh','seesaw',''),('voan','bridal_veil',''),
    ('tảng đá','boulder',''),('cốc','tall_cup',''),('nhà','warm_house',''),
    ('điện thoại','dien_thoai',''),('đồng hồ','dong_ho_treo',''),('sách','cuon_sach',''),('hoa','bong_hoa',''),
    ('vali','vali',''),('gương','guong_soi',''),('trăng','mat_trang',''),('mặt trời','mat_troi',''),
    ('xe đạp','xe_dap',''),('tàu','toa_tau',''),('khăn','khan_choang',''),('quạt','quat_tay',''),
]
def tim_vat(text):
    t = ' ' + norm(text) + ' '
    found, used = [], set()
    for kw, ma, tang in sorted(VAT, key=lambda x: -len(x[0])):
        pat = r'(?<!\w)' + re.escape(norm(kw)) + r'(?!\w)'
        if re.search(pat, t):
            if ma not in used:
                found.append((kw, ma, tang)); used.add(ma)
            t = re.sub(pat, ' ', t)
    return found

def kiem(u):
    cau = [l for l in u.get('cau', []) if l.strip()]
    lat = u.get('cu_lat', '')
    L = norm(' / '.join(cau))
    do, vang, info = [], [], []
    if not 2 <= len(cau) <= 4:
        do.append(f'Số dòng {len(cau)} (cần 2–4)')
    n = am_tiet(' '.join(cau))
    tac_gia = bool(u.get('tac_gia'))
    giong = norm(u.get('giong', ''))
    dai = 'S' if n <= 13 else 'M' if n <= 28 else 'L' if n <= 42 else 'XL'
    dong_ht = sum(max(1, -(-am_tiet(l) // 8)) for l in cau)  # ~8 âm tiết / dòng hiển thị ở 42px
    info.append(f'{n} âm tiết · dải {dai} · ~{dong_ht} dòng hiển thị')
    tran, tran_dong = (58, 8) if tac_gia else (48, 7)
    if n > tran: do.append(f'Vượt trần khung chữ: {n} > {tran} âm tiết' + ('' if tac_gia else ' (tự sáng tác; trích dẫn có tác giả được 58 — thêm "tac_gia")'))
    elif dong_ht > tran_dong: do.append(f'Ước ~{dong_ht} dòng hiển thị > {tran_dong} — khối chữ dính đáy khung; gộp/nén dòng')
    if dai == 'XL' and not tac_gia: vang.append(f'Dải XL ({n} âm tiết) dành cho trích dẫn văn học có tác giả — câu tự sáng tác nên ≤ 42')
    if dai in ('L', 'XL') and re.search(r'thả thính|hài|chơi chữ|công sở|tự trào', giong):
        vang.append(f'V8 Giọng "{u.get("giong")}" mà dài {n} âm tiết (dải {dai}) — kho vàng thả thính/hài đều ở dải M')
    if n < 6: vang.append(f'Ngắn {n} âm tiết (< 6)')
    if not lat:
        do.append('Thiếu cu_lat')
    elif cau and norm(lat) not in norm(cau[-1]):
        do.append(f'Cụm lật "{lat}" không nằm trong dòng cuối')
    else:
        if am_tiet(lat) > 5: vang.append(f'Cụm lật dài {am_tiet(lat)} âm tiết (nên ≤ 5)')
        tail = norm(cau[-1]).split(norm(lat), 1)[-1]
        nt = am_tiet(tail)
        if re.search(r'(?<!\w)(vì|bởi|nên|để|tức là)(?!\w)', tail) or nt > 6:
            do.append(f'Đ7 Giải thích sau cụm lật: "{tail.strip()}"')
        elif nt > 1:
            vang.append(f'Có đuôi {nt} âm tiết sau cụm lật ("{tail.strip()}") — chỉ ổn nếu đuôi làm cú lật sắc hơn (như "Vitamin Em… gây nhớ, gây thương")')
        if '…' not in cau[-1] and '...' not in cau[-1]:
            info.append('không có "…" trước cụm lật')
        for w in TRUU_TUONG:
            if norm(w) in norm(lat):
                vang.append(f'V6 Cụm lật trừu tượng "{w}" — ghi sẵn vật đời thường gánh nó, kiểm vật đủ lớn')
    for ma, ten, f in DO:
        if cau and f(cau, L): do.append(f'{ma} {ten}')
    for i, l in enumerate(cau):
        m = re.match(r'^\s*(nhưng|chỉ là|đôi khi)(?!\w)', norm(l))
        if m: vang.append(f'V1 Dòng {i+1} mở bằng "{m.group(1)}"')
    if has('có lẽ', L): vang.append('V2 "có lẽ"')
    if len(re.findall(r'(?<!\w)vẫn(?!\w)', L)) >= 2: vang.append('V2 "vẫn" lặp ≥ 2')
    for w in TRANG_TU_RU:
        if has(w, L): vang.append(f'V3 trạng từ ru "{w}"')
    for w in TINH_TU_EM:
        if has(w, L): vang.append(f'V4 "{w}"')
    if len(re.findall(r'(?<!\w)(tim|lòng|thương|nhớ)(?!\w)', L)) >= 2: vang.append('V5 tim/lòng/thương/nhớ ≥ 2 lần')
    if re.search(r'một [^,/]{1,20},\s*(/\s*)?một [^,/]{1,20},\s*(/\s*)?(và )?một ', L): vang.append('V7 bộ ba "một X, một Y, một Z"')
    if has('bạn', L): vang.append('V9 ngôi "bạn"')
    vat = tim_vat(' '.join(cau))
    vat_lat = tim_vat(lat) if lat else []
    if not vat: info.append('không nhận ra vật quen trong câu — biên tập kiểm tiêu chí Cụ thể')
    for kw, ma, tang in vat:
        if tang == 'nho' and lat and norm(kw) in norm(lat):
            vang.append(f'Cụm lật gắn với "{kw}" — vật nhỏ trên màn hình, làm vật đỏ dễ yếu')
    goc = u.get('goc')
    if goc:
        ng = am_tiet(goc)
        info.append(f'gốc {ng} âm tiết')
        if n > ng: do.append(f'Tinh chỉnh dài hơn gốc ({n} > {ng})')
        co = {m for _, m, _ in vat}
        mat = [kw for kw, ma, t in tim_vat(goc) if ma not in co]
        if mat: do.append(f'Đ8 Xoá vật cụ thể có trong gốc: {", ".join(mat)}')
    return dict(id=u.get('id', '?'), do=do, vang=vang, info=info,
                vat=[kw for kw, ma, t in vat],
                vat_lat=[kw for kw, ma, t in vat_lat])

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('file', nargs='?')
    ap.add_argument('--cau'); ap.add_argument('--lat'); ap.add_argument('--goc')
    a = ap.parse_args()
    if a.file:
        data = json.load(open(a.file, encoding='utf-8'))
        items = data if isinstance(data, list) else [data]
    elif a.cau:
        items = [{'id': 'cli', 'cau': a.cau.split('/'), 'cu_lat': a.lat or '', 'goc': a.goc}]
    else:
        ap.print_help(); sys.exit(2)
    bad = False
    for u in items:
        r = kiem(u)
        trang = '❌ LOẠI' if r['do'] else ('⚠️  ĐƯỢC (có vàng)' if r['vang'] else '✅ SẠCH')
        print(f"[{r['id']}] {trang} · {' · '.join(r['info'])}")
        for x in r['do']: print(f'   ĐỎ   {x}')
        for x in r['vang']: print(f'   VÀNG {x}')
        print(f"   Vật trong câu: {', '.join(r['vat']) or '—'} | ở cụm lật: {', '.join(r['vat_lat']) or '—'}")
        bad = bad or bool(r['do'])
    sys.exit(1 if bad else 0)

if __name__ == '__main__':
    main()
