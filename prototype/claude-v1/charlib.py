from base import *

def G(x0,x1): return f'<path d="M {x0} 0 C {x0/2} 0.5 {x1/2} -0.4 {x1} 0" stroke="{INK}" stroke-width="0.8" fill="none" opacity=".5" filter="url(#line)"/>'
def shape(d,fill=None,sw=None,op=1):
    L=MODE["light"]
    if fill is None: fill="url(#wp)" if L else "url(#w2)"
    if fill=="HEAD": fill="url(#wp2)" if L else "url(#wl)"
    if sw is None: sw=.75 if L else .5
    lo=".72" if L else ".42"
    under = f'<path d="{d}" fill="#F4EEE4"/>' if L else ""
    return under+f'<path d="{d}" fill="{fill}" opacity="{op}" filter="url(#wash)"/><path d="{d}" fill="none" stroke="{INK}" stroke-width="{sw}" opacity="{lo}" filter="url(#line)" stroke-linejoin="round"/>'
def cup(x,y,col=None,steam=True,w=2.7,tilt=0):
    col=col or "url(#wh)"
    s=f'<g transform="rotate({tilt} {x} {y})"><path d="M {x-w} {y} Q {x-w*.85} {y+w*1.2} {x-w*.5} {y+w*1.4} L {x+w*.5} {y+w*1.4} Q {x+w*.85} {y+w*1.2} {x+w} {y} Z" fill="{col}" stroke="{INK}" stroke-width=".6" filter="url(#line)"/></g>'
    if steam: s+=f'<path d="M {x} {y-1.2} Q {x-1.3} {y-3.6} {x+.3} {y-5.8} Q {x+1.4} {y-7.6} {x-.3} {y-9.3}" stroke="{MUTED}" stroke-width=".6" fill="none" stroke-linecap="round" opacity=".8"/>'
    return s
def mitten(x0,y0,x1,y1,w=2.6):
    # short padded arm from shoulder (x0,y0) to hand (x1,y1)
    import math
    dx,dy=x1-x0,y1-y0; L=math.hypot(dx,dy) or 1; nx,ny=-dy/L*w/2,dx/L*w/2
    d=f"M {x0+nx:.2f} {y0+ny:.2f} L {x1+nx:.2f} {y1+ny:.2f} A {w/2+.4} {w/2+.4} 0 0 0 {x1-nx:.2f} {y1-ny:.2f} L {x0-nx:.2f} {y0-ny:.2f} Z"
    return shape(d,sw=(.6 if MODE["light"] else .45))
def eyes(cx,cy,mode="dot",dx=3.7,look=0):
    if mode=="smile":
        return ''.join(f'<path d="M {cx+s*dx-1.4} {cy} Q {cx+s*dx} {cy+1.5} {cx+s*dx+1.4} {cy}" stroke="{INK}" stroke-width="1" fill="none" stroke-linecap="round"/>' for s in (-1,1))
    if mode=="tired":
        return ''.join(f'<path d="M {cx+s*dx-1.6} {cy+.4} L {cx+s*dx+1.6} {cy+.4}" stroke="{INK}" stroke-width="1" stroke-linecap="round"/><path d="M {cx+s*dx-1.3} {cy+.5} Q {cx+s*dx} {cy+2.2} {cx+s*dx+1.3} {cy+.5}" fill="{INK}"/>' for s in (-1,1))
    if mode=="calm":
        return ''.join(f'<path d="M {cx+s*dx-1.5} {cy+.6} Q {cx+s*dx} {cy+.1} {cx+s*dx+1.5} {cy+.6}" stroke="{INK}" stroke-width=".9" fill="none" stroke-linecap="round"/>' for s in (-1,1))
    if mode=="side":
        return ''.join(f'<ellipse cx="{cx+s*dx+look}" cy="{cy}" rx="1.3" ry="1.8" fill="{INK}"/>' for s in (-1,1))
    if mode=="wide":
        return ''.join(f'<circle cx="{cx+s*dx+look}" cy="{cy}" r="2.4" fill="{PAPER}" stroke="{INK}" stroke-width=".55"/><circle cx="{cx+s*dx+look+.3}" cy="{cy+.2}" r=".9" fill="{INK}"/>' for s in (-1,1))
    if mode=="down":
        return ''.join(f'<ellipse cx="{cx+s*dx+look}" cy="{cy+1}" rx="1.4" ry="1.3" fill="{INK}"/>' for s in (-1,1))
    return ''.join(f'<ellipse cx="{cx+s*dx+look}" cy="{cy}" rx="1.45" ry="2.05" fill="{INK}"/><circle cx="{cx+s*dx+look+.5}" cy="{cy-.8}" r=".55" fill="{PAPER}"/><circle cx="{cx+s*dx+look-.4}" cy="{cy+.7}" r=".22" fill="{PAPER}" opacity=".8"/>' for s in (-1,1))

def scarf_col(red): return RED if red else ("#26211C" if MODE["light"] else "#5A5047")

def char(p, red=False, blush=False, leaf="up", startle_lines=False, blush_amt=None, sx=0, sy=0, eyes_mode="dot", look=1.4, lean=0, legs="stand", tail="ground", arms=(), extra_front="", extra_back=""):
    """sy: vertical offset (sitting lowers). arms: list of (x0,y0,x1,y1) relative."""
    sc=scarf_col(red)
    g=[f'<g transform="translate({sx},{sy})">', extra_back]
    # scarf tail (behind)
    if tail=="ground":
        g.append(f'<path d="M -6 -23 C -11 -19 -13 -9 -14 {-2-sy} C -16 {.6-sy} -21 {-1.4-sy} -25 {-.8-sy}" stroke="{sc}" stroke-width="3" fill="none" stroke-linecap="round" filter="url(#wash)"/>')
        g += [f'<path d="M -24.8 {-1.8+i*.7-sy} L -27.6 {-2.1+i*.9-sy}" stroke="{sc}" stroke-width=".6" stroke-linecap="round"/>' for i in range(4)]
    elif tail=="fly":
        g.append(f'<path d="M -6 -23 C -11 -24 -14 -20 -18 -21.5 C -21.5 -22.8 -23 -19.6 -27 -20.6" stroke="{sc}" stroke-width="3" fill="none" stroke-linecap="round" filter="url(#wash)"/>')
        g += [f'<path d="M -26.8 {-21.4+i*.7} L -29.4 {-21.6+i*1}" stroke="{sc}" stroke-width=".6" stroke-linecap="round"/>' for i in range(4)]
    elif tail=="seat":
        g.append(f'<path d="M -6 -23 C -11 -19 -12.5 -11 -12 -6 C -11.6 -2 -15 0 -19 -.4" stroke="{sc}" stroke-width="3" fill="none" stroke-linecap="round" filter="url(#wash)"/>')
    # legs
    if legs=="stand":
        g.append(f'<path d="M -3.2 -5 L -3.4 -.4 M 3.2 -5 L 3.6 -.4" stroke="{INK}" stroke-width="2.4" stroke-linecap="round" filter="url(#line)"/>')
    elif legs=="walk":
        g.append(f'<path d="M -2.6 -5 L -5.6 -.4 M 3 -5 L 5.4 -.6" stroke="{INK}" stroke-width="2.4" stroke-linecap="round" filter="url(#line)"/>')
    elif legs=="hop":
        g.append(f'<path d="M -3.2 -5 L -4.6 -2.2 M 3.2 -5 L 4.8 -2.6" stroke="{INK}" stroke-width="2.4" stroke-linecap="round" filter="url(#line)"/>')
    g.append(f'<g transform="rotate({lean} 0 -4)">')
    # body coat
    g.append(shape("M -6.4 -24.2 C -9.2 -22.6 -10.6 -15.8 -12.6 -6.8 Q -13.1 -3.9 -10.4 -3.5 Q 0 -1.9 10.4 -3.5 Q 13.1 -3.9 12.6 -6.8 C 10.6 -15.8 9.2 -22.6 6.4 -24.2 Q 0 -25.8 -6.4 -24.2 Z"))
    SEAMC = INK if MODE['light'] else PAPER
    g.append(f'<path d="M 1.2 -21.5 C 1.8 -15 1.6 -9 1 -3.4" stroke="{SEAMC}" stroke-width=".4" fill="none" opacity=".25"/>')
    for a in arms: g.append(mitten(*a))
    # scarf wrap
    g.append(f'<path d="M -8.4 -24.6 Q 0 -20.8 8.4 -24.6" stroke="{sc}" stroke-width="3.8" fill="none" stroke-linecap="round" filter="url(#wash)"/>')
    # head (big, 1:2)
    hy=-35.5
    g.append(shape(f"M -10.6 {hy} A 10.6 10.2 0 1 0 10.6 {hy} A 10.6 10.2 0 1 0 -10.6 {hy} Z","HEAD"))
    # soft fringe swept across the forehead
    g.append(shape(f"M -10.2 {hy-2.4} C -10 {hy-9.6} -3 {hy-12.4} 3.6 {hy-11} C 7.4 {hy-10.2} 9.6 {hy-7.6} 10.3 {hy-4.6} C 7.6 {hy-7.4} 3.4 {hy-8.2} -0.6 {hy-6.6} C -3.6 {hy-5.4} -5.6 {hy-3.4} -6.6 {hy-1.2} C -7.6 {hy-3} -9 {hy-3.2} -10.2 {hy-2.4} Z","url(#wl)",sw=.4))
    # tea-leaf sprout on top of the head (signature); angle shows emotion
    ang=leaf if isinstance(leaf,(int,float)) else {"up":8,"tilt":38,"droop":118,"startle":-14,"shy":-58,"calm":24}[leaf]
    lx,ly=0.6,hy-10.0
    g.append(f'<g transform="rotate({ang} {lx} {ly})"><path d="M {lx} {ly} C {lx-.6} {ly-3} {lx+1} {ly-6} {lx+3.8} {ly-6.8} C {lx+4.1} {ly-3.8} {lx+2.6} {ly-1.2} {lx} {ly} Z" fill="#59624A" filter="url(#wash)"/><path d="M {lx+.2} {ly-.3} Q {lx+1.6} {ly-3.2} {lx+3.4} {ly-6.2}" stroke="#F1EAE0" stroke-width=".3" fill="none" opacity=".8"/></g>')
    if leaf=="startle" or startle_lines: g.append(''.join(f'<path d="M {lx+dx} {ly-7.5+dy} l {ex} {ey}" stroke="{INK}" stroke-width=".45" stroke-linecap="round"/>' for dx,dy,ex,ey in [(-1.6,0,-1,-.8),(4.6,.2,1,-.8)]))
    # cheeks
    ck = RED if (blush or (blush_amt or 0)>.4) else "#D9A08F"
    g.append(f'<ellipse cx="-6.4" cy="{hy+5.6}" rx="2.1" ry="1.2" fill="{ck}" opacity="{(blush_amt if blush_amt is not None else (.75 if blush else .32))}" filter="url(#glow)"/><ellipse cx="6.4" cy="{hy+5.6}" rx="2.1" ry="1.2" fill="{ck}" opacity="{(blush_amt if blush_amt is not None else (.75 if blush else .32))}" filter="url(#glow)"/>')
    g.append(eyes(0,hy+2.6,eyes_mode,look=look))
    g.append('</g>')
    g.append(extra_front)
    g.append('</g>')
    return ''.join(g)

# ---------- POSES ----------
def p_stand(red=False):
    return char(0,red,arms=[(8,-17,12.2,-14.6)],extra_front=cup(14.6,-17.4,RED if red else None))
def p_walk(red=False):
    return char(0,red,legs="walk",lean=5,tail="ground",look=1.8,arms=[(8,-17,12.6,-15.4)],extra_front=cup(15.2,-18.6,None,True))
def p_desk(red=False):
    desk=(f'<g filter="url(#line)"><path d="M 6 -14 L 28 -14" stroke="{INK}" stroke-width="1.3"/><path d="M 8 -14 L 8 0 M 26 -14 L 26 0" stroke="{INK}" stroke-width="1.1"/></g>'
          f'<path d="M 13 -14.4 L 22 -14.4 L 23.6 -22 L 14.6 -22 Z" fill="url(#wh)" stroke="{INK}" stroke-width=".7" filter="url(#line)"/>')
    stool=f'<g stroke="{MUTED}" stroke-width="1.2" filter="url(#line)"><path d="M -6 -6.5 L 6 -6.5"/><path d="M -5 -6.5 L -5 0 M 5 -6.5 L 5 0"/></g>'
    return stool+char(0,red,sy=-1.5,legs="none",tail="seat",look=2,arms=[(8,-16,13.6,-15.2)],extra_front=desk+cup(25,-17.2,RED if red else None))
def p_phone(red=False):
    ph=f'<rect x="8.8" y="-36" width="4.6" height="7.6" rx=".9" fill="{RED if red else "url(#wh)"}" stroke="{INK}" stroke-width=".6" filter="url(#line)"/>'
    return char(0,red,leaf="tilt",eyes_mode="down",look=2.2,arms=[(7,-19,10.6,-28.6),(-8,-17,-12.4,-14.8)],extra_front=ph+cup(-14.8,-17.4,None,False))
def p_umbrella(red=False):
    umb=(f'<path d="M 11.4 -21 L 11.4 -50" stroke="{INK}" stroke-width=".9"/>'
         f'<path d="M 11.4 -21 q 0 2.6 -2.2 2.6" stroke="{INK}" stroke-width=".9" fill="none"/>'
         f'<path d="M -12 -50 Q 11.4 -66 34.8 -50 Q 29 -52.6 23.1 -50 Q 17.3 -52.6 11.4 -50 Q 5.6 -52.6 -.3 -50 Q -6.1 -52.6 -12 -50 Z" fill="{RED if red else "url(#wh)"}" stroke="{INK}" stroke-width=".8" filter="url(#line)"/>'
         f'<path d="M 11.4 -50 L 11.4 -59.6" stroke="{INK}" stroke-width=".7"/>')
    rain=''.join(f'<path d="M {x} {y} l -1.2 4" stroke="{MUTED}" stroke-width=".55" opacity=".7"/>' for x,y in [(-25,-48),(-23,-36),(-27,-24),(28,-40),(26,-30),(29,-18),(-20,-14)])
    return char(0,red,look=2.4,arms=[(7.6,-18.6,11.2,-21.6)],extra_back=rain,extra_front=umb)
def p_startle(red=True):
    splash=(cup(15.4,-21.8,RED if red else None,False,tilt=-24)+
            ''.join(f'<path d="M {x} {y} q .6 -1.4 1.2 0 q -.6 1 -1.2 0 Z" fill="#9C8A70"/>' for x,y in [(17,-26.5),(19.4,-25),(15.6,-28.4)])+
            f'<path d="M 12.6 -45 q .9 1.6 0 2.6 q -.9 -1 0 -2.6 Z" fill="#A9B8C2" stroke="{INK}" stroke-width=".35"/>')
    lines=''.join(f'<path d="M {x} {y} l {dx} {dy}" stroke="{INK}" stroke-width=".6" stroke-linecap="round"/>' for x,y,dx,dy in [(-13,-46,-2,-2),(0,-50,0,-2.6),(13,-46,2,-2)])
    return char(0,red,leaf="startle",sy=-2,legs="hop",eyes_mode="wide",look=0,tail="fly",arms=[(8,-18,13,-19.6),(-8,-18,-12.6,-21)],extra_front=splash+lines)
def p_front(red=False,blush=False):
    return char(0,red,blush=blush,leaf="tilt",eyes_mode="smile",look=0,arms=[(6.6,-17,2.6,-15.2),(-6.6,-17,-2.6,-15.2)],extra_front=cup(0,-17.6,RED if red else None,True,3))

POSES=[("Đứng cầm chén",p_stand,False),("Đi bộ (khăn kéo lê)",p_walk,False),("Ngồi bàn làm việc",p_desk,False),
       ("Cắm mặt vào điện thoại",p_phone,False),("Che ô dưới mưa",p_umbrella,False),("Khựng lại — tại cú lật",p_startle,True),
       ("Nhìn người xem",p_front,False),("Cú lật kiểu thả thính (má ửng)",lambda r=True: p_front(True,True),True)]

def fig(fn,red):
    return f'<svg width="230" height="250" viewBox="-31 -72 62 74">{DEFS}{G(-28,28)}{fn(red)}</svg>'
def silh():
    s=p_walk().replace('url(#w2)',INK).replace('url(#wl)',INK).replace('url(#wh)',INK).replace(PAPER,INK).replace(MUTED,INK).replace("#5A5047",INK)
    return f'<svg width="90" height="100" viewBox="-31 -60 62 62">{DEFS}{G(-28,28)}{s}</svg>'
def personB(x):
    return (f'<g transform="translate({x},0)"><path d="M -5.6 -21 C -9 -18 -9.6 -9 -8.4 -4.2 Q 0 -2.6 8.4 -4.2 C 9.6 -9 9 -18 5.6 -21 Q 0 -22.4 -5.6 -21 Z" fill="{INK}" opacity=".35"/>'
            f'<circle cx="0" cy="-30" r="8.4" fill="{INK}" opacity=".35"/><path d="M 6 -34 C 10 -33 11 -28 9.6 -25" stroke="{INK}" stroke-width="2.4" opacity=".35" fill="none" stroke-linecap="round"/>'
            f'<path d="M -2.6 -4.6 L -2.8 -.4 M 2.6 -4.6 L 3 -.4" stroke="{INK}" stroke-width="2" opacity=".35"/></g>')
def scene():
    k=46/46.0*1.0; vbw=200/ (52/46); vbh=356/(52/46); x0=-vbw*.5; y0=-vbh*.38
    lines=''.join(f'<rect x="{x0+vbw*.14}" y="{y0+vbh*(.47+i*.034)}" width="{vbw*(.62-(.14 if i==3 else 0))}" height="{vbh*.011}" fill="{INK}" opacity=".5"/>' for i in range(4))
    bar=f'<rect x="{x0+vbw*.11}" y="{y0+vbh*.465}" width="{vbw*.008}" height="{vbh*.145}" fill="{RED}"/>'
    return (f'<svg width="200" height="356" viewBox="{x0} {y0} {vbw} {vbh}">{DEFS}<rect x="{x0}" y="{y0}" width="{vbw}" height="{vbh}" fill="{PAPER}"/>'
            f'<rect x="{x0}" y="{y0}" width="{vbw}" height="{vbh}" filter="url(#paper)"/>{G(x0+vbw*.06,x0+vbw*.94)}'
            f'<g transform="translate(-16,0)">{p_umbrella(True)}</g>{personB(20)}{lines}{bar}</svg>')


def sweat(x,y): return f'<path d="M {x} {y} q 1 1.8 0 2.9 q -1 -1.1 0 -2.9 Z" fill="#A9B8C2" stroke="{INK}" stroke-width=".35"/>'
EMO=[("Vui",lambda: char(0,False,blush=True,eyes_mode="smile",look=0,arms=[(6.6,-17,2.6,-15.2),(-6.6,-17,-2.6,-15.2)],extra_front=cup(0,-17.6,None,True,3))),
     ("Mệt",lambda: char(0,False,leaf="droop",eyes_mode="tired",look=0,lean=4,arms=[(8,-15,11.4,-10.8)],extra_front=cup(13.4,-12.6,None,False)+sweat(-12.5,-44))),
     ("Giật mình",lambda: p_startle(False)),
     ("Bối rối",lambda: char(0,False,leaf="shy",blush=True,eyes_mode="side",look=2.6,arms=[(-7,-19,-10.2,-28.5),(8,-17,12.2,-14.6)],extra_front=cup(14.6,-17.4)+sweat(12.6,-44))),
     ("Nhớ",lambda: char(0,False,leaf="tilt",eyes_mode="dot",look=-2.4,arms=[(8,-17,12.2,-14.6)],extra_front=cup(14.6,-17.4)+''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="none" stroke="{MUTED}" stroke-width=".5"/>' for x,y,r in [(-13,-46,.8),(-16,-50,1.2),(-20.5,-55,1.9)]))),
     ("Bình thản",lambda: char(0,False,leaf="calm",eyes_mode="calm",look=0,arms=[(6.6,-17,2.6,-15.2),(-6.6,-17,-2.6,-15.2)],extra_front=cup(0,-17.6,None,True,3)))]

def figf(f,w=200,h=215): return f'<svg width="{w}" height="{h}" viewBox="-31 -72 62 74">{DEFS}{G(-28,28)}{f()}</svg>'
def silh_small():
    MODE["light"]=False
    s=p_walk().replace('url(#w2)',INK).replace('url(#wl)',INK).replace('url(#wh)',INK).replace(PAPER,INK).replace(MUTED,INK).replace("#5A5047",INK)
    MODE["light"]=True
    return f'<svg width="90" height="100" viewBox="-31 -60 62 62">{DEFS}{G(-28,28)}{s}</svg>'
def phone(light, red):
    MODE["light"]=light
    vbw=200/(52/46); vbh=356/(52/46); x0=-vbw*.5; y0=-vbh*.38
    lines=''.join(f'<rect x="{x0+vbw*.14}" y="{y0+vbh*(.47+i*.034)}" width="{vbw*(.62-(.14 if i==3 else 0))}" height="{vbh*.011}" fill="{INK}" opacity=".5"/>' for i in range(4))
    bar=f'<rect x="{x0+vbw*.11}" y="{y0+vbh*.465}" width="{vbw*.008}" height="{vbh*.145}" fill="{RED}"/>'
    out=(f'<svg width="200" height="356" viewBox="{x0} {y0} {vbw} {vbh}">{DEFS}<rect x="{x0}" y="{y0}" width="{vbw}" height="{vbh}" fill="{PAPER}"/>'
         f'<rect x="{x0}" y="{y0}" width="{vbw}" height="{vbh}" filter="url(#paper)"/>{G(x0+vbw*.06,x0+vbw*.94)}'
         f'<g transform="translate(-16,0)">{p_umbrella(red)}</g>{personB(20)}{lines}{bar}</svg>')
    MODE["light"]=True
    return out

