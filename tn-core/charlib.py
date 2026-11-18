import math
from base import *

def G(x0, x1):
    return (f'<path d="M {x0} 0 C {x0/2} 0.35 {x1/2} -0.3 {x1} 0" '
            f'stroke="{INK}" stroke-width="0.50" fill="none" opacity=".26" stroke-linecap="round"/>')

def shape(d, fill=None, sw=None, op=1):
    """Vẽ hình viền mảnh thanh thoát: nền giấy che nét khuất phía sau, không dùng mảng tô đặc lớn."""
    if fill is None or fill == "HEAD" or (isinstance(fill, str) and fill.startswith("url(#")):
        fill_col = PAPER
    else:
        fill_col = fill
    if sw is None:
        sw = 0.64 if MODE["light"] else 0.50
    lo = ".80" if MODE["light"] else ".52"
    bg = f'<path d="{d}" fill="{fill_col}" opacity="{op}"/>' if fill_col != "none" else ""
    return bg + f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{sw}" opacity="{lo}" stroke-linecap="round" stroke-linejoin="round"/>'

def cup(x, y, col=None, steam=True, w=2.7, tilt=0, steam_phase=0.0):
    fill_col = col if col else PAPER
    rim = (f'<path d="M {x-w*.76:.2f} {y+.55:.2f} L {x+w*.76:.2f} {y+.55:.2f}" '
           f'stroke="{PAPER}" stroke-width=".42" opacity=".80" stroke-linecap="round"/>') if col == RED else ""
    s = (f'<g transform="rotate({tilt:.2f} {x} {y})">'
         f'<path d="M {x-w:.2f} {y:.2f} Q {x-w*.85:.2f} {y+w*1.22:.2f} {x-w*.5:.2f} {y+w*1.42:.2f} '
         f'L {x+w*.5:.2f} {y+w*1.42:.2f} Q {x+w*.85:.2f} {y+w*1.22:.2f} {x+w:.2f} {y:.2f} Z" '
         f'fill="{fill_col}" stroke="{INK}" stroke-width=".60" stroke-linejoin="round"/>{rim}</g>')
    if steam:
        sway = 0.48 * math.sin(steam_phase)
        sway2 = -0.42 * math.cos(steam_phase * 0.9)
        s += (f'<path d="M {x:.2f} {y-1.1:.2f} Q {x-1.0+sway:.2f} {y-3.4:.2f} {x+.2+sway2:.2f} {y-5.6:.2f} '
              f'Q {x+1.0+sway:.2f} {y-7.4:.2f} {x-.2+sway2:.2f} {y-9.0:.2f}" '
              f'stroke="{MUTED}" stroke-width=".44" fill="none" stroke-linecap="round" opacity=".52"/>')
    return s

def mitten(x0, y0, x1, y1, w=2.1):
    dx, dy = x1 - x0, y1 - y0
    L = math.hypot(dx, dy) or 1
    nx, ny = -dy / L * w / 2, dx / L * w / 2
    d = (f"M {x0+nx:.2f} {y0+ny:.2f} L {x1+nx:.2f} {y1+ny:.2f} "
         f"A {w/2+.32:.2f} {w/2+.32:.2f} 0 0 0 {x1-nx:.2f} {y1-ny:.2f} "
         f"L {x0-nx:.2f} {y0-ny:.2f} Z")
    return shape(d, sw=0.58)

def eyes(cx, cy, mode="dot", dx=3.6, look=0, blink=0.0):
    if blink > 0.55:
        return ''.join(
            f'<path d="M {cx+s*dx-1.3+look*.35:.2f} {cy+.3:.2f} Q {cx+s*dx+look*.35:.2f} {cy+.85:.2f} {cx+s*dx+1.3+look*.35:.2f} {cy+.3:.2f}" '
            f'stroke="{INK}" stroke-width=".70" fill="none" stroke-linecap="round"/>'
            for s in (-1, 1)
        )
    if mode == "smile":
        return ''.join(
            f'<path d="M {cx+s*dx-1.35:.2f} {cy+.25:.2f} Q {cx+s*dx:.2f} {cy-1.10:.2f} {cx+s*dx+1.35:.2f} {cy+.25:.2f}" '
            f'stroke="{INK}" stroke-width=".74" fill="none" stroke-linecap="round"/>'
            for s in (-1, 1)
        )
    if mode == "tired":
        return ''.join(
            f'<path d="M {cx+s*dx-1.40:.2f} {cy+.35:.2f} L {cx+s*dx+1.40:.2f} {cy+.35:.2f}" '
            f'stroke="{INK}" stroke-width=".72" stroke-linecap="round"/>'
            f'<circle cx="{cx+s*dx:.2f}" cy="{cy+.92:.2f}" r=".54" fill="{INK}" opacity=".82"/>'
            for s in (-1, 1)
        )
    if mode == "calm":
        return ''.join(
            f'<path d="M {cx+s*dx-1.35:.2f} {cy+.45:.2f} Q {cx+s*dx:.2f} {cy+.05:.2f} {cx+s*dx+1.35:.2f} {cy+.45:.2f}" '
            f'stroke="{INK}" stroke-width=".72" fill="none" stroke-linecap="round"/>'
            for s in (-1, 1)
        )
    if mode == "side":
        return ''.join(
            f'<ellipse cx="{cx+s*dx+look:.2f}" cy="{cy:.2f}" rx=".90" ry="1.25" fill="{INK}" opacity=".86"/>'
            for s in (-1, 1)
        )
    if mode == "wide":
        # Ngạc nhiên nhẹ, tinh tế: mắt mở tròn vừa phải kèm nét mày khẽ nhướn
        return ''.join(
            f'<path d="M {cx+s*dx+look*.5-1.15:.2f} {cy-2.35:.2f} Q {cx+s*dx+look*.5:.2f} {cy-2.95:.2f} {cx+s*dx+look*.5+1.15:.2f} {cy-2.35:.2f}" '
            f'stroke="{INK}" stroke-width=".48" fill="none" opacity=".72" stroke-linecap="round"/>'
            f'<ellipse cx="{cx+s*dx+look:.2f}" cy="{cy:.2f}" rx="1.12" ry="1.52" fill="{INK}" opacity=".88"/>'
            f'<circle cx="{cx+s*dx+look+.34:.2f}" cy="{cy-.48:.2f}" r=".38" fill="{PAPER}"/>'
            for s in (-1, 1)
        )
    if mode == "down":
        return ''.join(
            f'<ellipse cx="{cx+s*dx+look:.2f}" cy="{cy+.85:.2f}" rx=".92" ry=".85" fill="{INK}" opacity=".85"/>'
            for s in (-1, 1)
        )
    return ''.join(
        f'<ellipse cx="{cx+s*dx+look:.2f}" cy="{cy:.2f}" rx=".95" ry="1.35" fill="{INK}" opacity=".88"/>'
        f'<circle cx="{cx+s*dx+look+.32:.2f}" cy="{cy-.45:.2f}" r=".35" fill="{PAPER}"/>'
        for s in (-1, 1)
    )

def scarf_col(red):
    return RED if red else INK

def _scarf_tail_ribbon(tail, sy, sc):
    """Dải khăn mảnh bay nhẹ tách khỏi vai áo, không tô mảng đen đặc."""
    fill_c = RED if sc == RED else PAPER
    if tail == "ground":
        d = "M -6.8 -23.6 C -11.4 -21.2 -14.2 -16.8 -16.2 -11.8 C -15.0 -11.2 -12.4 -16.0 -6.0 -22.5 Z"
        tip = f'<path d="M -16.2 -11.8 L -17.1 -10.5 M -15.2 -11.4 L -15.9 -10.1" stroke="{sc}" stroke-width=".42" stroke-linecap="round" opacity=".72"/>'
        return f'<path d="{d}" fill="{fill_c}" stroke="{sc}" stroke-width=".58" stroke-linejoin="round"/>' + tip
    if tail == "fly":
        d = "M -6.8 -23.6 C -11.2 -24.2 -15.0 -21.8 -18.4 -22.2 C -17.8 -21.0 -14.4 -20.6 -6.0 -22.5 Z"
        return f'<path d="{d}" fill="{fill_c}" stroke="{sc}" stroke-width=".58" stroke-linejoin="round"/>'
    if tail == "seat":
        d = "M -6.8 -23.6 C -11.0 -21.2 -13.4 -16.8 -14.8 -12.0 C -13.6 -11.6 -11.6 -16.0 -6.0 -22.5 Z"
        return f'<path d="{d}" fill="{fill_c}" stroke="{sc}" stroke-width=".58" stroke-linejoin="round"/>'
    return ""

def _scarf_wrap_ribbon(sc):
    fill_c = RED if sc == RED else PAPER
    d = "M -7.5 -24.6 Q 0 -22.8 7.5 -24.6 Q 7.2 -23.4 0 -21.6 Q -7.2 -23.4 -7.5 -24.6 Z"
    return f'<path d="{d}" fill="{fill_c}" stroke="{sc}" stroke-width=".62" stroke-linejoin="round"/>'

def char(p, red=False, blush=False, leaf="up", startle_lines=False, blush_amt=None,
         sx=0, sy=0, eyes_mode="dot", look=1.4, lean=0, legs="stand", tail="ground",
         arms=(), extra_front="", extra_back="", blink=0.0, leaf_sway=0.0):
    """Nhân vật nét viền mảnh: thân áo viền mảnh, khăn dải mảnh, tóc vài nét gợi."""
    sc = scarf_col(red)
    g = [f'<g transform="translate({sx},{sy})">', extra_back]
    g.append(_scarf_tail_ribbon(tail, sy, sc))
    if legs == "stand":
        g.append(f'<path d="M -3.1 -4.6 L -3.3 -.4 M 3.1 -4.6 L 3.4 -.4" stroke="{INK}" stroke-width=".90" stroke-linecap="round"/>')
    elif legs == "walk":
        g.append(f'<path d="M -2.6 -4.6 L -5.0 -.4 M 2.9 -4.6 L 4.8 -.5" stroke="{INK}" stroke-width=".90" stroke-linecap="round"/>')
    elif legs == "hop":
        g.append(f'<path d="M -3.1 -4.6 L -4.1 -1.8 M 3.1 -4.6 L 4.2 -2.0" stroke="{INK}" stroke-width=".90" stroke-linecap="round"/>')

    g.append(f'<g transform="rotate({lean:.2f} 0 -4)">')
    # Thân áo: chỉ có viền mảnh (nền giấy che nét ghế/bàn phía sau)
    g.append(shape("M -6.2 -24.2 C -8.9 -22.6 -10.2 -15.8 -12.0 -6.8 Q -12.4 -4.0 -9.9 -3.6 Q 0 -2.1 9.9 -3.6 Q 12.4 -4.0 12.0 -6.8 C 10.2 -15.8 8.9 -22.6 6.2 -24.2 Q 0 -25.6 -6.2 -24.2 Z", sw=0.64))
    g.append(f'<path d="M 1.0 -21.2 C 1.5 -15 1.4 -9.2 .9 -3.6" stroke="{INK}" stroke-width=".36" fill="none" opacity=".25" stroke-linecap="round"/>')
    for a in arms:
        g.append(mitten(*a))
    # Dải khăn mảnh quanh cổ
    g.append(_scarf_wrap_ribbon(sc))
    # Đầu viền mảnh + 2 nét tóc mái lệch tự nhiên (bỏ mảng tô xám)
    hy = -35.5
    g.append(shape(f"M -10.4 {hy} A 10.4 10.0 0 1 0 10.4 {hy} A 10.4 10.0 0 1 0 -10.4 {hy} Z", sw=0.64))
    g.append(f'<path d="M -8.6 {hy-3.0} Q -3.8 {hy-6.2} 2.0 {hy-7.0}" stroke="{INK}" stroke-width=".48" fill="none" opacity=".58" stroke-linecap="round"/>')
    g.append(f'<path d="M 1.8 {hy-7.4} Q 5.4 {hy-6.8} 8.2 {hy-4.2}" stroke="{INK}" stroke-width=".42" fill="none" opacity=".45" stroke-linecap="round"/>')
    # Lá trà nhỏ trên đỉnh đầu (nét mảnh + gân lá, đung đưa nhẹ)
    base_ang = leaf if isinstance(leaf, (int, float)) else {"up": 8, "tilt": 34, "droop": 96, "startle": -6, "shy": -44, "calm": 22}[leaf]
    ang = base_ang + leaf_sway
    lx, ly = 0.5, hy - 10.0
    g.append(
        f'<g transform="rotate({ang:.2f} {lx} {ly})">'
        f'<path d="M {lx} {ly} C {lx-.5} {ly-2.8} {lx+.9} {ly-5.5} {lx+3.5} {ly-6.3} '
        f'C {lx+3.8} {ly-3.5} {lx+2.4} {ly-1.1} {lx} {ly} Z" fill="{PAPER}" stroke="#4E5840" stroke-width=".56" stroke-linejoin="round"/>'
        f'<path d="M {lx+.2} {ly-.3} Q {lx+1.5} {ly-3.0} {lx+3.1} {ly-5.7}" stroke="#4E5840" stroke-width=".35" fill="none" opacity=".72" stroke-linecap="round"/>'
        f'</g>'
    )
    if blush or (blush_amt or 0) > 0.25:
        b_op = min(0.45, blush_amt if blush_amt is not None else 0.38)
        g.append(
            f'<path d="M -6.8 {hy+5.4} L -5.4 {hy+4.8} M -5.6 {hy+5.7} L -4.4 {hy+5.1} '
            f'M 4.4 {hy+5.1} L 5.6 {hy+5.7} M 5.4 {hy+4.8} L 6.8 {hy+5.4}" '
            f'stroke="{RED}" stroke-width=".46" opacity="{b_op:.2f}" stroke-linecap="round"/>'
        )
    g.append(eyes(0, hy + 2.6, eyes_mode, look=look, blink=blink))
    g.append('</g>')
    g.append(extra_front)
    g.append('</g>')
    return ''.join(g)

# ---------- Các hàm mẫu tham chiếu trong charlib ----------
def p_stand(red=False):
    return char(0, red, arms=[(8, -17, 12.2, -14.6)], extra_front=cup(14.6, -17.4, RED if red else None))
def p_walk(red=False):
    return char(0, red, legs="walk", lean=3, tail="ground", look=1.6, arms=[(8, -17, 12.6, -15.4)], extra_front=cup(15.2, -18.6, None, True))
def p_desk(red=False):
    desk = f'<path d="M 6 -14 L 28 -14" stroke="{INK}" stroke-width=".8"/><path d="M 8 -14 L 8 0 M 26 -14 L 26 0" stroke="{INK}" stroke-width=".66"/>'
    stool = f'<path d="M -6 -6.5 L 6 -6.5 M -5 -6.5 L -5 0 M 5 -6.5 L 5 0" stroke="{MUTED}" stroke-width=".66"/>'
    return stool + char(0, red, sy=-1.5, legs="none", tail="seat", look=1.8, arms=[(8, -16, 13.6, -15.2)], extra_front=desk + cup(25, -17.2, RED if red else None))
def p_phone(red=False):
    ph = f'<rect x="8.8" y="-36" width="4.6" height="7.6" rx=".9" fill="{RED if red else PAPER}" stroke="{INK}" stroke-width=".58"/>'
    return char(0, red, leaf="tilt", eyes_mode="down", look=1.8, arms=[(7, -19, 10.6, -28.6), (-8, -17, -12.4, -14.8)], extra_front=ph + cup(-14.8, -17.4, None, False))
def p_umbrella(red=False):
    umb = (f'<path d="M 11.4 -21 L 11.4 -50" stroke="{INK}" stroke-width=".66"/>'
           f'<path d="M 11.4 -21 q 0 2.4 -2.0 2.4" stroke="{INK}" stroke-width=".66" fill="none"/>'
           f'<path d="M -10 -50 Q 11.4 -64 32.8 -50 Z" fill="{RED if red else PAPER}" stroke="{INK}" stroke-width=".66"/>')
    return char(0, red, look=2.0, arms=[(7.6, -18.6, 11.2, -21.6)], extra_front=umb)
def p_startle(red=True):
    return char(0, red, leaf="startle", eyes_mode="wide", look=0.8, arms=[(8, -17, 12.4, -15.6)], extra_front=cup(14.8, -18.2, RED if red else None, False))
def p_front(red=False, blush=False):
    return char(0, red, blush=blush, leaf="tilt", eyes_mode="smile", look=0, arms=[(6.6, -17, 2.6, -15.2), (-6.6, -17, -2.6, -15.2)], extra_front=cup(0, -17.6, RED if red else None, True, 3))

POSES = [
    ("Đứng cầm chén", p_stand, False),
    ("Đi bộ", p_walk, False),
    ("Ngồi bàn làm việc", p_desk, False),
    ("Cầm điện thoại", p_phone, False),
    ("Che ô", p_umbrella, False),
    ("Khựng nhẹ", p_startle, True),
    ("Nhìn người xem", p_front, False),
    ("Thả thính", lambda r=True: p_front(True, True), True),
]
