"""Trà Nguội — lõi dựng Chén v1: kịch bản ngữ nghĩa -> biên dịch -> kiểm tra -> khung hình."""
import math, json, re, ctypes
from ctypes import c_void_p, c_size_t, c_uint32, c_char_p
from charlib import *

W, H, FPS, DUR = 1080, 1920, 30, 15.0
# Thu nhỏ nhân vật và đạo cụ 30% trong vùng hình (7.0 * 0.70 = 4.9), giữ nguyên vị trí vùng hình
K, GX, GY = 4.9, 560, 1010
STAGE_Y0, STAGE_Y1 = 300, 1080
DARK_LUM_CUTOFF = 215       # Nền giấy #F1EAE0 có độ sáng ~235; điểm ảnh < 215 là nét mực / màu tối
MAX_INK_DENSITY = 1.80      # Ngưỡng chặn cứng tỷ lệ điểm ảnh tối (%) trong vùng hình (1080x780)
RED_MIN_PX2 = 500           # Hằng số diện tích vật đỏ tối thiểu thống nhất toàn dự án (500 px² trên 1080x1920)
LINE_REVEAL_DUR = 0.70      # Thời gian hiện một dòng chữ (chỉ cử động nhỏ: chớp mắt, lá trà, khói)
RED_DELAY = 0.40            # Vật đỏ xuất hiện / đổi đỏ sau khi chữ lật đổi đỏ khoảng 0,4 giây

SLOTS = {"trai": -31, "giua": 0, "phai": 24, "xa_trai": -50, "xa_phai": 44}
def cl(x, a=0, b=1): return max(a, min(b, x))
def ease(u): u = cl(u); return 0.5 - 0.5 * math.cos(math.pi * u)
def ramp(t, a, b): return ease((t - a) / (b - a)) if b > a else float(t >= b)

def _picket(x, h):
    return (f'<path d="M {x-.95:.2f} 0 L {x-.95:.2f} {-h+1.3:.2f} L {x:.2f} {-h:.2f} '
            f'L {x+.95:.2f} {-h+1.3:.2f} L {x+.95:.2f} 0 Z" '
            f'fill="{PAPER}" stroke="{INK}" stroke-width=".48" stroke-linejoin="round"/>')

# ======================= THƯ VIỆN ĐẠO CỤ (nét viền mảnh, có điểm neo) =======================
def d_cong_rao(st):
    o = st.get("mo", 0)
    # Cổng rào nét thanh mảnh: hai trụ mảnh và thanh cổng thưa thoáng
    g = [f'<path d="M -13.0 -9.6 L -5.0 -9.6 M -13.0 -4.4 L -5.0 -4.4 M 10.0 -9.6 L 18.0 -9.6 M 10.0 -4.4 L 18.0 -4.4" stroke="{INK}" stroke-width=".46" opacity=".62" stroke-linecap="round"/>',
         f'<path d="M -10.8 0 L -10.8 -12.6 M 15.6 0 L 15.6 -12.6" stroke="{INK}" stroke-width=".48" opacity=".68" stroke-linecap="round"/>']
    panel = (f'<path d="M -3.8 -9.4 L 8.8 -9.4 M -3.8 -4.2 L 8.8 -4.2" stroke="{INK}" stroke-width=".46" opacity=".68" stroke-linecap="round"/>'
             f'<path d="M -0.8 0 L -0.8 -11.6 M 2.6 0 L 2.6 -11.6 M 6.0 0 L 6.0 -11.6" stroke="{INK}" stroke-width=".46" opacity=".68" stroke-linecap="round"/>')
    g.append(f'<g transform="translate(-4.5,0) scale({1-.82*o:.3f},1) translate(4.5,0)">{panel}</g>')
    for x in (-4.5, 9.5):
        g.append(f'<rect x="{x-1.0}" y="-17.2" width="2.0" height="17.2" fill="{PAPER}" stroke="{INK}" stroke-width=".50"/>'
                 f'<path d="M {x-1.4} -17.6 L {x+1.4} -17.6" stroke="{INK}" stroke-width=".58" stroke-linecap="round"/>')
    return ''.join(g)

def d_ban(st):
    return (f'<g stroke="{INK}" stroke-linecap="round">'
            f'<path d="M -18.5 -14 L 18.5 -14" stroke-width=".82"/>'
            f'<path d="M -15.8 -14 L -15.8 0 M 15.8 -14 L 15.8 0" stroke-width=".66"/></g>')

def d_ghe(st):
    return (f'<g stroke="{INK}" stroke-linecap="round" stroke-linejoin="round" fill="none">'
            f'<path d="M -7.4 -8.6 L 7.4 -8.6" stroke-width=".80"/>'
            f'<path d="M -6.2 -8.6 L -6.8 0 M 6.2 -8.6 L 6.8 0" stroke-width=".66"/>'
            f'<path d="M -6.3 -4.2 L 6.3 -4.2" stroke="{MUTED}" stroke-width=".48" opacity=".65"/>'
            f'<path d="M -7.0 -8.6 L -8.3 -21.2 M -8.5 -19.6 L -4.8 -19.6" stroke-width=".64"/>'
            f'</g>')

def d_laptop(st):
    p = st.get("thanh", 0)
    red = st.get("do", False)
    base = (f'<path d="M -8.0 0 L 8.0 0" stroke="{INK}" stroke-width=".82" stroke-linecap="round"/>'
            f'<path d="M -6.5 -.3 L 6.5 -.3 L 8.2 -12.4 L -4.8 -12.4 Z" fill="{PAPER}" stroke="{INK}" stroke-width=".62" stroke-linejoin="round"/>')
    if red:
        pw = 7.4 * (p if p > 0 else 0.82)
        panel = (f'<path d="M -4.6 -9.8 L 6.0 -9.8 L 5.2 -4.2 L -5.4 -4.2 Z" fill="{RED}"/>'
                 f'<path d="M -3.6 -6.8 L {-3.6+pw:.2f} -6.8" stroke="{PAPER}" stroke-width=".85" stroke-linecap="round"/>')
        return base + panel
    bar = ''
    if p > 0:
        bar = (f'<path d="M -2.6 -6.8 L 5.4 -6.8" stroke="{MUTED}" stroke-width=".55" opacity=".4" stroke-linecap="round"/>'
               f'<path d="M -2.6 -6.8 L {-2.6+8.0*p:.2f} -6.8" stroke="{INK}" stroke-width=".68" opacity=".75" stroke-linecap="round"/>')
    return base + bar

def d_lich(st):
    flip = st.get("lat", 0)
    red = st.get("do", False)
    fill_col = RED if red else PAPER
    line_col = PAPER if red else INK
    line_op = ".88" if red else ".48"
    body = (f'<path d="M -3.4 0 L -2.3 -8.0 L 2.3 -8.0 L 3.4 0 Z" fill="{fill_col}" stroke="{INK}" stroke-width=".58" stroke-linejoin="round"/>'
            f'<path d="M -1.5 -5.8 L 1.5 -5.8 M -1.7 -4.1 L 1.7 -4.1 M -1.9 -2.4 L .9 -2.4" stroke="{line_col}" stroke-width=".40" opacity="{line_op}" stroke-linecap="round"/>'
            f'<path d="M -2.4 -8.0 L 2.4 -8.0" stroke="{INK}" stroke-width=".72" stroke-linecap="round"/>')
    flap = (f'<path d="M -2.3 -8.0 L 2.3 -8.0 L {2.3-4.6*flip:.2f} {-8.0+3.2*math.sin(math.pi*flip):.2f} Z" fill="{fill_col}" stroke="{INK}" stroke-width=".42"/>'
            if 0 < flip < 1 else '')
    return body + flap

def d_hoa_don(st):
    red = st.get("do", False)
    sc = st.get("hien", 1)
    if sc <= 0:
        return ''
    fill_col = RED if red else PAPER
    line_col = PAPER if red else INK
    line_op = ".90" if red else ".50"
    seal = (f'<circle cx="2.1" cy="-2.8" r=".95" fill="none" stroke="{PAPER}" stroke-width=".48" opacity=".9"/>'
            if red else f'<circle cx="2.1" cy="-2.8" r=".95" fill="none" stroke="{MUTED}" stroke-width=".42" opacity=".65"/>')
    return (f'<g transform="scale({sc:.3f})">'
            f'<path d="M -4.8 0 L -3.7 -15.2 L 4.9 -15.2 L 3.8 0 L 2.3 -.8 L .8 0 L -.7 -.8 L -2.2 0 L -3.6 -.8 Z" '
            f'fill="{fill_col}" stroke="{INK}" stroke-width=".62" stroke-linejoin="round"/>'
            f'<path d="M -2.2 -12.4 L 3.2 -12.4 M -2.5 -9.8 L 2.9 -9.8 M -2.8 -7.2 L 2.6 -7.2 M -3.0 -4.6 L 1.0 -4.6" '
            f'stroke="{line_col}" stroke-width=".46" opacity="{line_op}" stroke-linecap="round"/>'
            f'{seal}</g>')

def d_qua_cam(st):
    red = st.get("do", False)
    sc = st.get("hien", 1)
    lan = st.get("lan", 0)
    if sc <= 0:
        return ''
    # Đủ rõ để nhận ra ngay trên điện thoại từ lúc xuất hiện ở xa, lớn dần nhẹ khi lăn rất chậm về phía Lữ khách
    dist_scale = (0.70 + 0.30 * cl(lan / 0.65)) if ("lan" in st or sc < 0.99) else 1.0
    s = sc * dist_scale
    dx = -34.0 * lan
    rot = -280.0 * lan
    fill_col = RED if red else PAPER
    hl = f'<path d="M -2.2 -6.8 A 2.6 2.6 0 0 1 -.4 -7.7" stroke="{PAPER}" stroke-width=".55" fill="none" stroke-linecap="round" opacity=".8"/>' if red else ''
    return (f'<g transform="translate({dx:.2f},0) scale({s:.3f})">'
            f'<g transform="translate(0,-5.2) rotate({rot:.1f})">'
            f'<circle cx="0" cy="0" r="5.2" fill="{fill_col}" stroke="{INK}" stroke-width=".60"/>'
            f'<path d="M 0 -5.2 L .3 -6.7" stroke="{INK}" stroke-width=".52" stroke-linecap="round"/>'
            f'<path d="M .2 -5.9 C 1.9 -7.4 3.8 -6.7 4.0 -5.2 C 2.6 -4.6 1.1 -4.9 .2 -5.9 Z" fill="{PAPER}" stroke="#4E5840" stroke-width=".48"/>'
            f'</g>{hl}</g>')

def d_chen(st):
    red = st.get("do", False)
    sc = st.get("hien", 1)
    if sc <= 0:
        return ''
    return f'<g transform="scale({sc:.3f})">{cup(0, -4.5, RED if red else None, st.get("khoi", True), 3.2, steam_phase=st.get("_steam_phase", 0.0))}</g>'

def prop_motion_dx(pid, st):
    if pid == "qua_cam":
        return -34.0 * st.get("lan", 0.0)
    return 0.0

PROPS = {  # id: draw, hộp va chạm (x0,x1,y0,y1) tương đối, điểm neo, có thể đỏ, trạng thái
 "cong_rao": dict(draw=d_cong_rao, box=(-13.5, 18.5, -17.8, 0), anchors={"tru_phai": (9.5, -17.8), "tru_trai": (-4.5, -17.8)}, red=False, states={"mo"}),
 "ban":      dict(draw=d_ban, box=(-18.5, 18.5, -14, 0), anchors={"mat_ban_trai": (-9.6, -14), "mat_ban_giua": (2.8, -14), "mat_ban_phai": (12.2, -14)}, red=False, states=set()),
 "ghe":      dict(draw=d_ghe, box=(-8.6, 7.4, -21.2, 0), anchors={"mat_ghe": (0, -8.6)}, red=False, states=set()),
 "laptop":   dict(draw=d_laptop, box=(-8.0, 8.2, -12.4, .3), anchors={}, red=True, red_area=10.6 * 5.6, states={"thanh", "do", "ket"}),
 "lich_ban": dict(draw=d_lich, box=(-3.4, 3.4, -8.0, 0), anchors={}, red=True, red_area=5.7 * 8.0, states={"lat", "do"}),
 "hoa_don":  dict(draw=d_hoa_don, box=(-4.8, 4.9, -15.2, 0), anchors={}, red=True, red_area=8.6 * 15.0, states={"hien", "do"}),
 "qua_cam":  dict(draw=d_qua_cam, box=(-5.2, 5.2, -11.5, 0), anchors={}, red=True, red_area=math.pi * (5.2 * 0.70) ** 2, states={"hien", "do", "lan"}),
 "chen_tra": dict(draw=d_chen, box=(-3.2, 3.2, -8.4, 0), anchors={}, red=True, red_area=5.6 * 4.5, states={"hien", "do", "khoi"}),
}

# Các tư thế tiết chế: phản ứng nhỏ, không nhảy tư thế lớn (không bật khỏi ghế, không vung hai tay)
POSES = {
 "dung_cam_chen":  dict(eyes="dot",   look=1.5,  leaf=8,   lean=0.0),
 "canh_giac":      dict(eyes="side",  look=2.0,  leaf=2,   lean=-1.4),
 "khung_lai":      dict(eyes="wide",  look=1.2,  leaf=-4,  lean=-0.6),
 "khoe_tung":      dict(eyes="smile", look=1.4,  leaf=8,   lean=-1.6, blush=.35),
 "boi_roi":        dict(eyes="dot",   look=1.8,  leaf=-34, lean=0.8,  blush=.38),
 "cuoi":           dict(eyes="smile", look=1.2,  leaf=26,  lean=0.6,  blush=.38),
 "nhin_nguoi_xem": dict(eyes="smile", look=0.0,  leaf=24,  lean=0.0,  blush=.30),
 "lam_viec":       dict(eyes="down",  look=1.8,  leaf=8,   lean=1.0),
 "met":            dict(eyes="tired", look=0.0,  leaf=86,  lean=2.2),
 "binh_than":      dict(eyes="calm",  look=0.0,  leaf=20,  lean=0.0),
 "nhin_lich":      dict(eyes="dot",   look=2.0,  leaf=18,  lean=1.2),
 "gian_ngo":       dict(eyes="side",  look=-1.8, leaf=72,  lean=0.6),
 "doi_theo":       dict(eyes="dot",   look=2.2,  leaf=16,  lean=1.2),
}
B_ACTIONS = {"di_vao", "dung", "nhun"}
SETTINGS = {"ngo_pho", "van_phong", "hien_tra"}
MOTIFS = {"vat_lat_nghia", "khoang_cach", "vat_o_lai", "thoi_gian", "noi_tam", "doi_chieu", "con_duong", "doi_quy_mo"}

SPEC_KEYS = {"tieu_de", "cau", "cu_lat", "motif", "boi_canh", "nhan_vat", "dao_cu", "cho_phep_chong", "nhip"}
NHAN_VAT_KEYS = {"lu_khach", "ngoi_tren", "nguoi_b", "lech"}
DAO_CU_KEYS = {"id", "ten", "vi_tri", "dat_tren", "lech", "do", "do_tu", "xuat_hien", "lop"}
BEAT_TIME_KEYS = {"dong", "sau", "cu_lat", "giay"}
BEAT_ACTOR_KEYS = {"lu_khach", "nhin_theo", "nguoi_b"}
XUAT_HIEN_VALUES = {"dau", "cu_lat"}
LOP_VALUES = {"sau", "truoc"}

def _unknown_keys_msg(scope, d, allowed):
    bad = [k for k in d.keys() if k not in allowed]
    if not bad:
        return []
    valid_str = ", ".join(sorted(allowed))
    return [f"{scope} có khoá lạ '{k}' (khoá hợp lệ: {valid_str})" for k in bad]

def is_sitting(nv):
    return nv.get("ngoi_tren") is not None

def lu_khach_holds_cup(spec):
    return not is_sitting(spec.get("nhan_vat", {}))

# ======================= ĐO MẬT ĐỘ MỰC VÙNG HÌNH (TỰ ĐỘNG, CHẶN CỨNG) =======================
_SVG_CG = None
_RE_PAPER_RECT = re.compile(r'<rect[^>]*filter="url\(#paper\)"[^>]*/>')
_RE_FILTER_ATTR = re.compile(r'\s*filter="url\(#[^"]+\)"')
_RE_FILTER_DEF = re.compile(r'<filter\b[^>]*>.*?</filter>', re.DOTALL)
_RE_RADIAL_DEF = re.compile(r'<radialGradient\b[^>]*>.*?</radialGradient>', re.DOTALL)
_RE_RGB_FN = re.compile(r'rgb\((\d+),(\d+),(\d+)\)')
_RE_TEXT_ALL = re.compile(r'<text\b[^>]*>.*?</text>', re.DOTALL)

def _init_cg():
    global _SVG_CG
    if _SVG_CG is not None:
        return _SVG_CG
    cg = ctypes.CDLL("/System/Library/Frameworks/CoreGraphics.framework/CoreGraphics")
    cf = ctypes.CDLL("/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation")
    coresvg = ctypes.CDLL("/System/Library/PrivateFrameworks/CoreSVG.framework/CoreSVG")
    cf.CFDataCreate.restype = c_void_p
    cf.CFDataCreate.argtypes = [c_void_p, c_char_p, c_size_t]
    cf.CFRelease.argtypes = [c_void_p]
    coresvg.CGSVGDocumentCreateFromData.restype = c_void_p
    coresvg.CGSVGDocumentCreateFromData.argtypes = [c_void_p, c_void_p]
    coresvg.CGSVGDocumentRelease.argtypes = [c_void_p]
    coresvg.CGContextDrawSVGDocument.argtypes = [c_void_p, c_void_p]
    cg.CGColorSpaceCreateDeviceRGB.restype = c_void_p
    cg.CGBitmapContextCreate.restype = c_void_p
    cg.CGBitmapContextCreate.argtypes = [c_void_p, c_size_t, c_size_t, c_size_t, c_size_t, c_void_p, c_uint32]
    cg.CGContextRelease.argtypes = [c_void_p]
    _SVG_CG = (cg, cf, coresvg, cg.CGColorSpaceCreateDeviceRGB())
    return _SVG_CG

def _render_stage_dark_pct(svg_str):
    cg, cf, coresvg, cs_rgb = _init_cg()
    svg = _RE_PAPER_RECT.sub("", svg_str)
    svg = _RE_FILTER_DEF.sub("", svg)
    svg = _RE_RADIAL_DEF.sub("", svg)
    svg = _RE_FILTER_ATTR.sub("", svg)
    svg = _RE_TEXT_ALL.sub("", svg)
    svg = _RE_RGB_FN.sub(lambda m: f"#{int(m.group(1)):02X}{int(m.group(2)):02X}{int(m.group(3)):02X}", svg)
    data = svg.encode("utf-8")
    cfdata = cf.CFDataCreate(None, data, len(data))
    doc = coresvg.CGSVGDocumentCreateFromData(cfdata, None)
    buf = (ctypes.c_ubyte * (W * H * 4))()
    ctx = cg.CGBitmapContextCreate(buf, W, H, 8, W * 4, cs_rgb, 1)
    coresvg.CGContextDrawSVGDocument(ctx, doc)
    cg.CGContextRelease(ctx)
    coresvg.CGSVGDocumentRelease(doc)
    cf.CFRelease(cfdata)
    raw = bytes(buf)[STAGE_Y0 * W * 4 : STAGE_Y1 * W * 4]
    total = (STAGE_Y1 - STAGE_Y0) * W
    dark = 0
    for i in range(0, len(raw), 4):
        if 299 * raw[i] + 587 * raw[i + 1] + 114 * raw[i + 2] < DARK_LUM_CUTOFF * 1000:
            dark += 1
    return 100.0 * dark / total

def measure_ink_density(spec):
    """Render 1 khung trước cú lật và 1 khung sau cú lật, trả về (pct_truoc, pct_sau)."""
    _T, pivot = timing(spec)
    t_before = pivot - 0.12
    t_after = pivot + RED_DELAY + 0.65
    return _render_stage_dark_pct(frame(spec, t_before)), _render_stage_dark_pct(frame(spec, t_after))

# ======================= BỘ KIỂM TRA (chặn cứng) =======================
def validate(spec, check_ink=True):
    E = []
    if not isinstance(spec, dict):
        return ["spec phải là một object JSON"]

    # 1. Chặn khoá lạ ở cấp gốc
    E += _unknown_keys_msg("spec", spec, SPEC_KEYS)
    for req in ("tieu_de", "cau", "cu_lat", "motif", "boi_canh", "nhan_vat", "nhip"):
        if req not in spec:
            E.append(f"spec thiếu khoá bắt buộc '{req}' (khoá hợp lệ: {', '.join(sorted(SPEC_KEYS))})")
    if any("thiếu khoá bắt buộc" in e for e in E):
        return E

    if spec.get("motif") not in MOTIFS:
        E.append(f"motif '{spec.get('motif')}' không có trong 8 motif (có: {', '.join(sorted(MOTIFS))})")
    if spec.get("boi_canh") not in SETTINGS:
        E.append(f"bối cảnh '{spec.get('boi_canh')}' chưa có trong thư viện (có: {', '.join(sorted(SETTINGS))})")
    if not isinstance(spec["cau"], list) or len(spec["cau"]) == 0:
        E.append("'cau' phải là danh sách các dòng chữ không rỗng")
        return E
    if spec["cu_lat"] not in spec["cau"][-1]:
        E.append(f"chữ lật '{spec['cu_lat']}' không nằm ở dòng cuối")

    # 2. Kiểm tra đạo cụ và khoá lạ trong từng đạo cụ
    names = {}
    for idx, p in enumerate(spec.get("dao_cu", [])):
        if not isinstance(p, dict):
            E.append(f"dao_cu[{idx}] phải là object"); continue
        E += _unknown_keys_msg(f"dao_cu[{idx}]", p, DAO_CU_KEYS)
        if "id" not in p:
            E.append(f"dao_cu[{idx}] thiếu khoá 'id' (khoá hợp lệ: {', '.join(sorted(DAO_CU_KEYS))})"); continue
        if p["id"] not in PROPS:
            E.append(f"đạo cụ '{p['id']}' không có trong thư viện (có: {', '.join(PROPS)})"); continue
        nm = p.get("ten", p["id"])
        if nm in names:
            E.append(f"tên đạo cụ '{nm}' bị trùng lặp; hãy đặt 'ten' riêng")
        names[nm] = p
        if "dat_tren" in p and "vi_tri" in p:
            E.append(f"đạo cụ '{nm}' không được khai báo cả 'dat_tren' lẫn 'vi_tri'")
        elif "dat_tren" in p:
            host, _, anc = p["dat_tren"].partition(".")
            if host not in names:
                E.append(f"'{nm}' đặt trên '{host}' nhưng '{host}' chưa được khai báo trước")
            elif anc not in PROPS[names[host]["id"]]["anchors"]:
                E.append(f"'{host}' không có điểm neo '{anc}' (có: {', '.join(PROPS[names[host]['id']]['anchors'])})")
        elif p.get("vi_tri") not in SLOTS:
            E.append(f"vị trí '{p.get('vi_tri')}' của '{nm}' không hợp lệ (có: {', '.join(SLOTS)})")
        if "xuat_hien" in p and p["xuat_hien"] not in XUAT_HIEN_VALUES:
            E.append(f"xuat_hien '{p['xuat_hien']}' không hợp lệ (có: {', '.join(sorted(XUAT_HIEN_VALUES))})")
        if "lop" in p and p["lop"] not in LOP_VALUES:
            E.append(f"lop '{p['lop']}' không hợp lệ (có: {', '.join(sorted(LOP_VALUES))})")

    # 3. Kiểm tra nhân vật, khoá lạ trong nhan_vat & điểm neo ngồi ghế thật
    nv = spec["nhan_vat"]
    if not isinstance(nv, dict):
        E.append("'nhan_vat' phải là object")
        return E
    E += _unknown_keys_msg("nhan_vat", nv, NHAN_VAT_KEYS)
    if "ngoi_tren" in nv and "lu_khach" in nv:
        E.append("nhan_vat không được dùng đồng thời 'lu_khach' (khe đứng) và 'ngoi_tren' (điểm neo ngồi)")
    elif "ngoi_tren" in nv:
        host, sep, anc = str(nv["ngoi_tren"]).partition(".")
        if not sep or not anc:
            E.append(f"ngoi_tren '{nv['ngoi_tren']}' phải có dạng '<ten_ghe>.mat_ghe'")
        elif host not in names:
            E.append(f"Lữ khách ngồi trên '{host}' nhưng '{host}' chưa có trong dao_cu")
        elif names[host]["id"] != "ghe" or anc != "mat_ghe" or anc not in PROPS[names[host]["id"]]["anchors"]:
            E.append(f"ngoi_tren '{nv['ngoi_tren']}' không hợp lệ: chỉ được gắn vào điểm neo '<ten_ghe>.mat_ghe'")
    elif "lu_khach" not in nv:
        E.append("nhan_vat phải khai báo 'lu_khach' (khe đứng) hoặc 'ngoi_tren' ('ghe.mat_ghe')")
    elif nv.get("lu_khach") not in SLOTS:
        E.append(f"vị trí lu_khach '{nv.get('lu_khach')}' không hợp lệ (có: {', '.join(SLOTS)})")

    if "nguoi_b" in nv and nv["nguoi_b"] not in SLOTS:
        E.append(f"vị trí nguoi_b '{nv['nguoi_b']}' không hợp lệ (có: {', '.join(SLOTS)})")

    # 4. Luật cấm trùng chén trà
    if lu_khach_holds_cup(spec):
        for nm, p in names.items():
            if p["id"] == "chen_tra" and p.get("dat_tren", "").split(".")[0] in names and names[p["dat_tren"].split(".")[0]]["id"] == "ban":
                E.append(f"Lữ khách đang đứng cầm chén trà trên tay thì trên bàn không được đặt thêm 'chen_tra' ('{nm}')")
            elif p["id"] == "chen_tra" and p.get("xuat_hien") != "cu_lat":
                E.append(f"Lữ khách đang đứng cầm chén trà trên tay thì không đặt sẵn thêm 'chen_tra' ('{nm}') trong cảnh")

    # 5. Luật đúng 1 vật đỏ & diện tích đỏ theo tỷ lệ mới
    reds = [p for p in spec.get("dao_cu", []) if p.get("do")]
    if len(reds) != 1:
        E.append(f"phải có đúng 1 vật đỏ, đang có {len(reds)}")
    for p in reds:
        if p["id"] in PROPS and not PROPS[p["id"]]["red"]:
            E.append(f"'{p['id']}' không được phép làm vật đỏ")
        ra = PROPS.get(p["id"], {}).get("red_area", 0)
        if p["id"] in PROPS and ra * K * K < RED_MIN_PX2:
            E.append(f"vật đỏ '{p['id']}' quá nhỏ trên màn hình ({ra*K*K:.0f} px², cần ≥ {RED_MIN_PX2} px²)")
        if p.get("do_tu", "cu_lat") != "cu_lat":
            E.append("vật đỏ chỉ được đỏ từ cú lật trở đi")

    # 6. Kiểm tra cho_phep_chong
    for c in spec.get("cho_phep_chong", []):
        if c not in names:
            E.append(f"cho_phep_chong chứa tên lạ '{c}' chưa khai báo trong dao_cu (có: {', '.join(names)})")

    # 7. Kiểm tra nhịp diễn, nhin_theo và khoá lạ trong từng nhịp
    valid_beat_keys = BEAT_TIME_KEYS | BEAT_ACTOR_KEYS | set(names.keys())
    valid_gaze_targets = set(names.keys()) | ({"nguoi_b"} if "nguoi_b" in nv else set())
    for idx, b in enumerate(spec["nhip"]):
        if not isinstance(b, dict):
            E.append(f"nhip[{idx}] phải là object"); continue
        E += _unknown_keys_msg(f"nhip[{idx}]", b, valid_beat_keys)
        if not ({"dong", "cu_lat", "giay"} & set(b.keys())):
            E.append(f"nhip[{idx}] phải có mốc thời gian ('dong', 'cu_lat' hoặc 'giay')")
        if "dong" in b and (not isinstance(b["dong"], int) or not (1 <= b["dong"] <= len(spec["cau"]))):
            E.append(f"nhip[{idx}] có 'dong'={b['dong']} vượt ngoài số dòng câu chữ (1..{len(spec['cau'])})")
        for who, act in b.items():
            if who in BEAT_TIME_KEYS:
                continue
            if who == "lu_khach" and act not in POSES:
                E.append(f"tư thế '{act}' chưa có (có: {', '.join(POSES)})")
            if who == "nhin_theo":
                if act is not None and act not in valid_gaze_targets:
                    E.append(f"nhin_theo '{act}' trong nhip[{idx}] không tồn tại trong cảnh (mục tiêu hợp lệ: {', '.join(sorted(valid_gaze_targets))})")
            if who == "nguoi_b":
                if "nguoi_b" not in nv:
                    E.append(f"nhip[{idx}] điều khiển 'nguoi_b' nhưng chưa khai báo 'nguoi_b' trong nhan_vat")
                elif act not in B_ACTIONS:
                    E.append(f"hành động Người B '{act}' chưa có (có: {', '.join(sorted(B_ACTIONS))})")
            if who in names:
                if not isinstance(act, dict):
                    E.append(f"trạng thái của đạo cụ '{who}' trong nhip[{idx}] phải là object")
                else:
                    allowed_st = PROPS[names[who]["id"]]["states"]
                    for k in act:
                        if k not in allowed_st:
                            E.append(f"'{who}' không có trạng thái '{k}' (trạng thái hợp lệ: {', '.join(sorted(allowed_st)) or 'không có'})")

    if not E:
        E += collisions(spec)
    if not E and check_ink:
        d_pre, d_post = measure_ink_density(spec)
        if d_pre > MAX_INK_DENSITY:
            E.append(f"mật độ mực vùng hình trước cú lật vượt ngưỡng ({d_pre:.2f}% > {MAX_INK_DENSITY:.2f}%)")
        if d_post > MAX_INK_DENSITY:
            E.append(f"mật độ mực vùng hình sau cú lật vượt ngưỡng ({d_post:.2f}% > {MAX_INK_DENSITY:.2f}%)")
    return E

def layout(spec):
    pos = {}; pos_id = {}; out = []
    for p in spec.get("dao_cu", []):
        name = p.get("ten", p["id"])
        if "dat_tren" in p:
            host, _, anc = p["dat_tren"].partition(".")
            hx, hy = pos[host]; ax, ay = PROPS[pos_id[host]]["anchors"][anc]
            x, y = hx + ax, hy + ay
        else:
            x, y = SLOTS[p["vi_tri"]] + p.get("lech", 0), 0
        pos[name] = (x, y); pos_id[name] = p["id"]; out.append((name, p, x, y))
    return out, pos, pos_id

def lu_khach_pos(spec, pos, pos_id):
    nv = spec["nhan_vat"]
    if is_sitting(nv):
        host, _, anc = nv["ngoi_tren"].partition(".")
        hx, hy = pos[host]
        ax, ay = PROPS[pos_id[host]]["anchors"][anc]
        return hx + ax + nv.get("lech", 0), hy + ay, host
    return SLOTS[nv["lu_khach"]] + nv.get("lech", 0), 0.0, ""

def char_box(x, sitting):
    return (x - 12.2, x + 12.2 + 5.0, -46, 0) if not sitting else (x - 11.6, x + 13.4, -45.5, 0)

def collisions(spec):
    E = []; L, pos, pos_id = layout(spec); boxes = []
    for name, p, x, y in L:
        b = PROPS[p["id"]]["box"]; boxes.append((name, (x + b[0], x + b[1], y + b[2], y + b[3]), p.get("dat_tren", "").split(".")[0]))
    nv = spec["nhan_vat"]; sitting = is_sitting(nv)
    lx, _ly, seat_host = lu_khach_pos(spec, pos, pos_id)
    lk = ("Lữ khách", char_box(lx, sitting), seat_host)
    allb = boxes + [lk]
    if "nguoi_b" in nv:
        allb.append(("Người B", (SLOTS[nv["nguoi_b"]] - 11, SLOTS[nv["nguoi_b"]] + 11, -42, 0), ""))
    ov = lambda a, b: a[0] < b[1] - .3 and b[0] < a[1] - .3 and a[2] < b[3] - .3 and b[2] < a[3] - .3
    for i in range(len(allb)):
        for j in range(i + 1, len(allb)):
            (n1, b1, h1), (n2, b2, h2) = allb[i], allb[j]
            if h1 == n2 or h2 == n1:
                continue
            allow = set(spec.get("cho_phep_chong", [])); allow |= {n for n, _, h in allb if h in allow}
            if {n1, n2} & allow and (n1 in ("Lữ khách", "Người B") or n2 in ("Lữ khách", "Người B")):
                continue
            if ov(b1, b2):
                E.append(f"va chạm: '{n1}' đè lên '{n2}'")
    for n, b, _ in allb:
        if b[0] < -72 or b[1] > 72:
            E.append(f"'{n}' ra ngoài vùng an toàn")
    return E

# ======================= BIÊN DỊCH THỜI GIAN & NHỊP CHUYỂN ĐỘNG =======================
def timing(spec):
    t = 0.35; T = []
    for ln in spec["cau"]:
        T.append(t)
        syl = len(ln.split())
        t += 1.1 + 0.2 * syl
    # Cú lật bắt đầu ngay sau khi dòng cuối hiện xong (T[-1] + 0.75)
    pivot = T[-1] + 0.75
    return T, pivot

def _beat_timestamp(b, T, pivot):
    """
    Quy tắc chuyển động:
    - Trong lúc đang hiện một dòng chữ [T[i], T[i] + LINE_REVEAL_DUR], chỉ cho phép cử động nhỏ (chớp mắt, lá trà, khói).
    - Do đó: nhịp gắn với dòng 1 đặt trạng thái khởi đầu từ t=0; nhịp gắn với dòng k>=2 lùi sang sau khi dòng chữ vừa hiện xong.
    - Ở cú lật: chữ lật đổi đỏ tại `pivot`, còn vật đỏ và phản ứng cú lật diễn ra sau đó `RED_DELAY` (~0,4s).
    """
    if "dong" in b:
        idx = b["dong"] - 1
        sau = b.get("sau", 0.0)
        if idx == 0 and sau == 0.0:
            return 0.0, 0
        raw = T[idx] + max(sau, LINE_REVEAL_DUR + 0.04)
        # Nếu rơi trúng lúc dòng kế tiếp đang hiện thì lùi nhẹ ra sau dòng kế tiếp
        if idx + 1 < len(T) and T[idx + 1] <= raw < T[idx + 1] + LINE_REVEAL_DUR:
            raw = T[idx + 1] + LINE_REVEAL_DUR + 0.04
        return raw, idx
    if b.get("cu_lat"):
        return pivot + RED_DELAY + b.get("sau", 0.0), len(T) - 1
    return float(b.get("giay", 0.0)), -1

def state_at(spec, t, T, pivot):
    marks = []
    for b in spec["nhip"]:
        tm, line_idx = _beat_timestamp(b, T, pivot)
        marks.append((tm, line_idx, b))
    marks.sort(key=lambda m: m[0])
    default_pose = "lam_viec" if is_sitting(spec["nhan_vat"]) else "dung_cam_chen"
    lk = (marks[0][2].get("lu_khach", default_pose), 0.0)
    gaze = (None, 0.0)
    b_act = None; b_t = None; b_dur = 1.2; props = {}
    for tm, line_idx, b in marks:
        if t >= tm:
            if "lu_khach" in b:
                lk = (b["lu_khach"], tm)
                if b["lu_khach"] == "nhin_nguoi_xem" and "nhin_theo" not in b:
                    gaze = (None, tm)
            if "nhin_theo" in b:
                gaze = (b["nhin_theo"], tm)
            if "nguoi_b" in b:
                b_act, b_t = b["nguoi_b"], tm
                if b["nguoi_b"] == "di_vao" and 0 <= line_idx + 1 < len(T):
                    b_dur = max(0.85, T[line_idx + 1] - tm - 0.06)
                else:
                    b_dur = 1.2
            for k, v in b.items():
                if isinstance(v, dict):
                    prev_dict = props[k][0].copy() if k in props else {}
                    prev_times = props[k][1].copy() if k in props else {}
                    for sk, sv in v.items():
                        prev_dict[sk] = sv
                        prev_times[sk] = (tm, line_idx)
                    props[k] = (prev_dict, prev_times)
    return lk, gaze, (b_act, b_t, b_dur), props

def _blink_amount(t, T, pivot):
    """Nhịp chớp mắt tự nhiên (~0.14s), ưu tiên rơi vào lúc đang hiện dòng chữ và khoảng lặng cuối."""
    centers = [ts + 0.34 for ts in T] + [min(13.4, pivot + 2.8)]
    for c in centers:
        dt = abs(t - c)
        if dt < 0.08:
            return math.cos(dt / 0.08 * math.pi * 0.5)
    return 0.0

def draw_sitting_legs():
    return (f'<path d="M 3.0 -8.4 L 8.8 -8.4 L 9.2 -.4" stroke="{INK}" stroke-width=".95" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<path d="M -.8 -8.4 L 5.2 -8.4 L 5.6 -.4" stroke="{INK}" stroke-width=".90" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".78"/>')

def draw_setting_backdrop(setting):
    """Bối cảnh chỉ gồm vài nét gợi ý mảnh, đặt thoáng không chạm đầu nhân vật."""
    if setting == "hien_tra":
        return (f'<g opacity=".28" stroke="{INK}" fill="none" stroke-linecap="round" stroke-linejoin="round">'
                f'<path d="M -56 -58 L -6 -58 L -1 -53" stroke-width=".50"/>'
                f'<path d="M -10 -58 L -10 -51.5" stroke-width=".42"/>'
                f'<circle cx="-10" cy="-49.5" r="1.7" stroke-width=".44"/>'
                f'</g>')
    if setting == "van_phong":
        return (f'<g opacity=".25" stroke="{INK}" fill="none" stroke-linecap="round" stroke-linejoin="round">'
                f'<path d="M -56 -60 L -56 -45 L -43 -45" stroke-width=".46"/>'
                f'<path d="M -52 -56 L -49 -52" stroke-width=".38"/>'
                f'</g>')
    if setting == "ngo_pho":
        return (f'<g opacity=".25" stroke="{INK}" fill="none" stroke-linecap="round">'
                f'<path d="M 34 -57 Q 46 -55 56 -58" stroke-width=".44"/>'
                f'<path d="M 46 -60 L 46 -47" stroke-width=".44"/>'
                f'</g>')
    return ''

# ======================= DỰNG KHUNG =======================
def frame(spec, t):
    T, pivot = timing(spec)
    red_t = pivot + RED_DELAY
    loop = ramp(t, 14.1, 14.95)
    (pose, pt), (gaze_target, gt), (bact, bt, bdur), pstates = state_at(spec, t, T, pivot)
    P = POSES[pose]
    nv = spec["nhan_vat"]; sitting = is_sitting(nv)
    L, pos, pos_id = layout(spec)
    lx, ly, _ = lu_khach_pos(spec, pos, pos_id)
    steam_phase = t * 2.4

    # ---- Đạo cụ & vị trí thực thời gian thực
    g = [G(-62, 62), draw_setting_backdrop(spec.get("boi_canh"))]
    front = []
    live_pos = {}
    for name, p, x, y in L:
        st = {"_steam_phase": steam_phase}
        if p.get("xuat_hien") == "cu_lat" and t < red_t:
            st["hien"] = 0.0
        if name in pstates:
            vdict, tdict = pstates[name]
            for k, val in vdict.items():
                tm, lidx = tdict[k]
                if isinstance(val, (int, float)) and not isinstance(val, bool):
                    if tm <= 0.0:
                        st[k] = val * (1 - loop)
                    else:
                        dur = 7.6 if k == "lan" else min(0.55, max(0.35, (T[lidx + 1] - tm - 0.06) if 0 <= lidx + 1 < len(T) else 0.50))
                        st[k] = val * ramp(t, tm, tm + dur) * (1 - loop)
                else:
                    st[k] = val
        if p.get("do"):
            st["do"] = (t >= red_t) and (loop < 1)
            if p.get("xuat_hien") == "cu_lat":
                st["hien"] = ramp(t, red_t, red_t + 0.35) * (1 - loop)
                st["khoi"] = t > red_t + 0.55
        live_pos[name] = (x + prop_motion_dx(p["id"], st), y)
        svg = f'<g transform="translate({x},{y})">{PROPS[p["id"]]["draw"](st)}</g>'
        (front if p.get("lop") == "truoc" else g).append(svg)

    # ---- Người B (nếu có)
    bx_live = None
    if "nguoi_b" in nv and bact:
        from_x = SLOTS["xa_phai"] + 26; to_x = SLOTS[nv["nguoi_b"]]
        if bact == "di_vao":
            u = cl((t - bt) / bdur)
            bx_live = from_x + (to_x - from_x) * ease(u)
            walk = (t - bt) if u < 1 else None
        else:
            bx_live = to_x; walk = None
        live_pos["nguoi_b"] = (bx_live, 0.0)

    # ---- Lữ khách (phản ứng nhỏ, không nhảy tư thế lớn; chỉ chớp mắt + lá trà + khói lúc hiện dòng)
    lean = P.get("lean", 0.0) * (1.0 if pt <= 0.0 else ramp(t, pt, pt + 0.35))
    eyes_m, look, leaf, blush = P["eyes"], P["look"], P["leaf"], P.get("blush")
    facing_dir = 1

    if gaze_target and gaze_target in live_pos:
        tx_obj, _ty_obj = live_pos[gaze_target]
        dx = tx_obj - lx
        gaze_blend = ramp(t, gt, gt + 0.35)
        facing_dir = -1 if dx < -1.0 else 1
        dist_fwd = abs(dx)
        target_look = cl(1.25 + dist_fwd / 34.0, 1.25, 2.35)
        look = look * (1.0 - gaze_blend) + target_look * gaze_blend
        target_lean = cl(0.8 + dist_fwd / 44.0, 0.8, 1.9)
        lean = lean * (1.0 - gaze_blend) + target_lean * gaze_blend
        if eyes_m in ("calm", "tired") and gaze_blend > 0.5:
            eyes_m = "side"
    else:
        if t >= 14.1:
            eyes_m, look, leaf, blush = "dot", 1.5, 8, None

    blink = _blink_amount(t, T, pivot)
    leaf_sway = 1.6 * math.sin(t * 2.1)

    if sitting:
        arms = [(8, -16, 13.4, -15.2)]
        lkg = draw_sitting_legs() + char(
            0, False, leaf=leaf, blush_amt=blush,
            eyes_mode=eyes_m, look=look, lean=lean, sy=ly + 3.2,
            legs="none", tail="seat", arms=arms, blink=blink, leaf_sway=leaf_sway
        )
    else:
        arms = [(8, -17, 12.2, -14.6)]
        lkg = char(
            0, False, leaf=leaf, blush_amt=blush,
            eyes_mode=eyes_m, look=look, lean=lean, sy=0.0,
            arms=arms, blink=blink, leaf_sway=leaf_sway,
            extra_front=cup(14.6, -17.4, None, True, steam_phase=steam_phase)
        )
    scale_x = f" scale({facing_dir},1)" if facing_dir == -1 else ""
    g.append(f'<g transform="translate({lx},0){scale_x}">{lkg}</g>')

    # ---- Vẽ Người B (nét mảnh thanh thoát)
    if "nguoi_b" in nv and bact and bx_live is not None:
        bounce = 0.45 * math.sin(math.pi * cl((t - bt) / 0.38)) if bact == "nhun" and t < bt + .38 else 0
        g.append(personB(bx_live, walk, 1 - loop, bounce, head_tilt=-2.8 if bact == "nhun" else 0))
    g += front
    stage = ''.join(g)

    # ---- Vùng chữ & tiêu đề: giữ nguyên 100% bố cục, vị trí và cỡ chữ
    tx, ty0, lh, fs = 150, 1150, 80, 52
    txt = []; barh = 0
    for i, (ln, ts) in enumerate(zip(spec["cau"], T)):
        a = ramp(t, ts, ts + LINE_REVEAL_DUR) * (1 - ramp(t, 14.1, 14.9))
        barh += lh * ramp(t, ts, ts + LINE_REVEAL_DUR)
        if a <= 0:
            continue
        y = ty0 + i * lh + 10 * (1 - ramp(t, ts, ts + LINE_REVEAL_DUR))
        if i == len(T) - 1 and spec["cu_lat"] in ln:
            pre, _, post = ln.partition(spec["cu_lat"])
            r = ramp(t, pivot, pivot + 0.25)
            col = f'rgb({int(30+176*r)},{int(27+44*r)},{int(24+22*r)})'
            txt.append(f'<text x="{tx}" y="{y:.1f}" font-family="Lora" font-size="{fs}" fill="{INK}" opacity="{a:.3f}">{pre}<tspan fill="{col}" font-weight="600">{spec["cu_lat"]}</tspan>{post}</text>')
        else:
            txt.append(f'<text x="{tx}" y="{y:.1f}" font-family="Lora" font-size="{fs}" fill="{INK}" opacity="{a:.3f}">{ln}</text>')
    barh *= (1 - ramp(t, 14.1, 14.9))
    bar = f'<rect x="118" y="{ty0-52}" width="4.5" height="{max(0,barh-14):.1f}" fill="{RED}"/>' if barh > 1 else ''
    hdr = f'<text x="150" y="250" font-family="Lora" font-size="24" letter-spacing="5" fill="{INK}" opacity=".55">{spec["tieu_de"].upper()}</text><rect x="150" y="268" width="780" height="1.2" fill="{INK}" opacity=".2"/>'
    brand = f'<text x="150" y="{ty0+len(T)*lh+30}" font-family="Lora" font-size="22" letter-spacing="4" fill="{INK}" opacity="{.5*ramp(t,red_t+.35,red_t+1.1)*(1-ramp(t,14.1,14.9)):.3f}">• TRÀ NGUỘI</text>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{DEFS}'
            f'<rect width="{W}" height="{H}" fill="{PAPER}"/><rect width="{W}" height="{H}" filter="url(#paper)"/>{hdr}'
            f'<g transform="translate({GX},{GY}) scale({K:.3f})">{stage}</g>{bar}{"".join(txt)}{brand}</svg>')

def personB(x, t_walk=None, alpha=1, bounce=0, head_tilt=0):
    walk = t_walk is not None
    ph = (t_walk or 0) * 2 * math.pi * 1.5
    yb = -(abs(math.sin(ph)) * 0.45 if walk else 0) - bounce
    legs = (f'<path d="M -2.3 -4 L {-2.3+1.5*math.sin(ph):.2f} -.4 M 2.3 -4 L {2.3-1.5*math.sin(ph):.2f} -.4" stroke="{INK}" stroke-width=".92" stroke-linecap="round"/>'
            if walk else f'<path d="M -2.3 -4 L -2.5 -.4 M 2.3 -4 L 2.6 -.4" stroke="{INK}" stroke-width=".92" stroke-linecap="round"/>')
    body = shape("M -5.4 -22 C -8.0 -20.4 -9.2 -14 -10.5 -6.2 Q -10.9 -3.6 -8.6 -3.2 Q 0 -1.9 8.6 -3.2 Q 10.9 -3.6 10.5 -6.2 C 9.2 -14 8.0 -20.4 5.4 -22 Q 0 -23.3 -5.4 -22 Z", sw=0.66)
    hy = -32
    head = shape(f"M -9.4 {hy} A 9.4 9.1 0 1 0 9.4 {hy} A 9.4 9.1 0 1 0 -9.4 {hy} Z", sw=0.66)
    hair = f'<path d="M -7.2 {hy-4.4} C -3.2 {hy-7.2} 2.8 {hy-7.4} 7.2 {hy-4.6}" stroke="{INK}" stroke-width=".48" fill="none" opacity=".62" stroke-linecap="round"/>'
    ponytail = f'<path d="M 8.8 {hy-3.8} C 12.2 {hy-3.8} 13.0 {hy+.8} 11.8 {hy+4.2}" stroke="{INK}" stroke-width=".58" fill="none" opacity=".72" stroke-linecap="round"/>'
    arm = shape("M -6.0 -17 L -9.0 -12.8 A 1.3 1.3 0 0 0 -6.8 -11.6 L -4.4 -15.6 Z", sw=0.56)
    eye_b = f'<circle cx="-3.2" cy="{hy+2.2}" r=".82" fill="{INK}" opacity=".85"/>'
    return f'<g transform="translate({x},{yb:.2f})" opacity="{alpha:.3f}">{legs}{body}{arm}<g transform="rotate({head_tilt:.2f} 0 -24)">{ponytail}{head}{hair}{eye_b}</g></g>'

def keyframes(spec):
    T, p = timing(spec)
    return [0.2, T[1] + 0.9, T[2] + 0.9, p - 0.12, p + RED_DELAY + 0.75, 13.0]
