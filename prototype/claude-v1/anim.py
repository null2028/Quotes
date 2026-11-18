import math
from charlib import *
W,H=1080,1920; FPS=30; DUR=15.0
K=7.0; GX,GY=560,1010          # stage scale & ground position (px)
LINES=["Mẹ anh bảo người lạ,","Sẽ cực kỳ xấu xa.","Nhưng em xinh đẹp quá…",("Chắc chắn ","là người nhà",".")]
LT=[0.35,2.4,4.7,7.0]; PIVOT=7.55
def cl(x,a=0,b=1): return max(a,min(b,x))
def ease(u): u=cl(u); return 0.5-0.5*math.cos(math.pi*u)
def ramp(t,a,b): return ease((t-a)/(b-a)) if b>a else (1.0 if t>=b else 0.0)
def back(u):  # overshoot
    u=cl(u); s=1.6; return 1+(s+1)*(u-1)**3+s*(u-1)**2

def fence(open_amt):
    g=[]
    pk=lambda x,h: f'<path d="M {x-1.1} 0 L {x-1.1} {-h+1.4} L {x} {-h} L {x+1.1} {-h+1.4} L {x+1.1} 0 Z" fill="url(#wp)" stroke="{INK}" stroke-width=".45" stroke-linejoin="round" filter="url(#line)"/>'
    for x in (-12,-8.5): g.append(pk(x,14))
    for x in (13.5,17): g.append(pk(x,14))
    g.append(f'<path d="M -13.5 -10 L -4.5 -10 M -13.5 -4.5 L -4.5 -4.5 M 9.5 -10 L 18.5 -10 M 9.5 -4.5 L 18.5 -4.5" stroke="{INK}" stroke-width=".55" opacity=".8"/>')
    # gate panel between posts (-4.5 .. 9.5), hinge at -4.5, swings inward (scaleX)
    sx=1-0.82*open_amt
    panel=''.join(pk(x,12.5) for x in (-1.5,2.5,6.5))+f'<path d="M -3.6 -9.4 L 8.6 -9.4 M -3.6 -4.2 L 8.6 -4.2" stroke="{INK}" stroke-width=".55" opacity=".8"/>'
    g.append(f'<g transform="translate(-4.5,0) scale({sx:.3f},1) translate(4.5,0)">{panel}</g>')
    # posts
    for x in (-4.5,9.5):
        g.append(f'<rect x="{x-1.4}" y="-17" width="2.8" height="17" fill="url(#wp)" stroke="{INK}" stroke-width=".5" filter="url(#line)"/><rect x="{x-1.9}" y="-17.8" width="3.8" height="1.2" fill="{INK}" opacity=".75"/>')
    return ''.join(g)

def personB(x,t_walk=None,alpha=1,bounce=0,head_tilt=0):
    # faceless, paper body, soft ponytail; faces left
    walk = t_walk is not None
    ph = (t_walk or 0)*2*math.pi*1.6
    bob = abs(math.sin(ph))*0.8 if walk else 0
    yb = -bob - bounce
    legs = (f'<path d="M -2.4 -4 L {-2.4+1.8*math.sin(ph):.2f} -.4 M 2.4 -4 L {2.4-1.8*math.sin(ph):.2f} -.4" stroke="{INK}" stroke-width="2.1" stroke-linecap="round"/>' if walk
            else f'<path d="M -2.4 -4 L -2.6 -.4 M 2.4 -4 L 2.8 -.4" stroke="{INK}" stroke-width="2.1" stroke-linecap="round"/>')
    body = shape("M -5.6 -22 C -8.4 -20.4 -9.6 -14 -11 -6.2 Q -11.4 -3.6 -9 -3.2 Q 0 -1.8 9 -3.2 Q 11.4 -3.6 11 -6.2 C 9.6 -14 8.4 -20.4 5.6 -22 Q 0 -23.4 -5.6 -22 Z")
    hy=-32
    head = shape(f"M -9.6 {hy} A 9.6 9.3 0 1 0 9.6 {hy} A 9.6 9.3 0 1 0 -9.6 {hy} Z","HEAD")
    hair = shape(f"M -9.8 {hy+1} C -10.6 {hy-8} -3 {hy-11.6} 3 {hy-10.4} C 8 {hy-9.4} 10.6 {hy-5} 9.8 {hy+1.4} C 7.6 {hy-3.4} 3 {hy-6} -1.6 {hy-5.2} C -5 {hy-4.6} -8 {hy-2} -9.8 {hy+1} Z","url(#wl)",sw=.4)
    tail = shape(f"M 8.4 {hy-4.6} C 13.6 {hy-5} 15 {hy+1} 13.4 {hy+6} C 12.6 {hy+3} 11 {hy-1} 8.6 {hy-1.4} Z","url(#wl)",sw=.4)
    tie = f'<circle cx="8.9" cy="{hy-3.2}" r="1" fill="{INK}" opacity=".7"/>'
    arm = shape("M -6.2 -17 L -9.6 -12.6 A 1.6 1.6 0 0 0 -7 -11.2 L -4.4 -15.6 Z",sw=.45)
    inner = f'<g transform="rotate({head_tilt} 0 -24)">{tail}{head}{hair}{tie}</g>'
    return f'<g transform="translate({x},{yb:.2f})" opacity="{alpha:.3f}">{legs}{body}{arm}{inner}</g>'

def frame(t):
    # ---- timeline values
    loop_out = ramp(t,14.1,14.95)              # everything returns to frame-0 state
    gate = ramp(t,PIVOT,PIVOT+0.65)*(1-loop_out)
    # Person B
    if t<2.55: bx=None
    elif t<4.6: bx=72-48*ease((t-2.55)/2.05)
    else: bx=24
    b_alpha=(1-loop_out) if bx is not None else 0
    b_bounce = 1.2*math.sin(math.pi*cl((t-PIVOT-0.15)/0.45)) if PIVOT+0.15<t<PIVOT+0.6 else 0
    # Lu khach states
    eyes,look,leaf,lean,blush_amt,startle=("dot",1.8,8,0,None,False)
    cup_tilt=0
    if 2.4<=t<4.85: eyes,look,leaf,lean="side",2.4,0,-4*ramp(t,2.4,2.9)
    if 4.85<=t<5.45: eyes,look,leaf,startle="wide",1.0,-14,True; cup_tilt=-18*math.sin(math.pi*cl((t-4.85)/0.6))
    if 5.45<=t<PIVOT: eyes,look,leaf="dot",2.2,8-66*ramp(t,5.45,5.9); blush_amt=.32+.45*ramp(t,5.45,6.0)
    if PIVOT<=t<11.2: eyes,look,leaf="smile",1.2,-58+96*ramp(t,PIVOT,PIVOT+0.5); blush_amt=.77
    if 11.2<=t<14.1: eyes,look,leaf="smile",0,38; blush_amt=.6
    if t>=14.1: eyes,look,leaf,blush_amt="dot",1.8,38-30*loop_out,None
    breathe = 0.25*math.sin(t*2*math.pi/3.2)
    cupx=14.6; cupy=-17.4
    lk = char(0,False,leaf=leaf,startle_lines=startle,blush_amt=blush_amt,eyes_mode=eyes,look=look,lean=lean,
              arms=[(8,-17,12.2,-14.6)],extra_front=cup(cupx,cupy,None,True,tilt=cup_tilt))
    lk = f'<g transform="translate(-31,{breathe:.2f})">{lk}</g>'
    # red cup on the post (pivot object)
    rc=''
    pop = ramp(t,PIVOT+0.25,PIVOT+0.7); 
    if pop>0 and loop_out<1:
        sc=back(pop)*(1-loop_out)
        steam_op = cl((t-PIVOT-0.7)/0.6)*(1-loop_out)
        rc=(f'<g transform="translate(9.5,-18) scale({sc:.3f}) translate(-9.5,18)">{cup(9.5,-21.8,RED,False,2.5)}</g>'
            f'<path d="M 9.5 -23.2 Q 8.2 -25.6 9.8 -27.8 Q 11 -29.6 9.2 -31.4" stroke="{MUTED}" stroke-width=".6" fill="none" opacity="{.8*steam_op:.2f}"/>')
    stage = (G(-62,62) + fence(gate) + lk + (personB(bx, (t-2.55) if t<4.6 else None, b_alpha, b_bounce, head_tilt=(-6*ramp(t,PIVOT+0.2,PIVOT+0.7) if bx==24 else 0)) if bx is not None else '') + rc)
    # ---- text
    tx=150; ty0=1150; lh=80; fs=52
    txt=[]; vis=0
    for i,(ln,ts) in enumerate(zip(LINES,LT)):
        a=ramp(t,ts,ts+0.7)*(1-ramp(t,14.1,14.9))
        if a<=0: continue
        vis=i+1
        dy=10*(1-ramp(t,ts,ts+0.7))
        y=ty0+i*lh+dy
        if isinstance(ln,tuple):
            red=ramp(t,PIVOT,PIVOT+0.35)
            rcol=f'rgb({int(30+(206-30)*red)},{int(27+(71-27)*red)},{int(24+(46-24)*red)})'
            txt.append(f'<text x="{tx}" y="{y:.1f}" font-family="Lora" font-size="{fs}" fill="{INK}" opacity="{a:.3f}">{ln[0]}<tspan fill="{rcol}" font-weight="600">{ln[1]}</tspan>{ln[2]}</text>')
        else:
            txt.append(f'<text x="{tx}" y="{y:.1f}" font-family="Lora" font-size="{fs}" fill="{INK}" opacity="{a:.3f}">{ln}</text>')
    # red guide bar grows with lines
    bar_h = 0
    for i,ts in enumerate(LT):
        bar_h += lh*ramp(t,ts,ts+0.7)
    bar_h*= (1-ramp(t,14.1,14.9))
    bar=f'<rect x="118" y="{ty0-52}" width="4.5" height="{max(0,bar_h-14):.1f}" fill="{RED}"/>' if bar_h>1 else ''
    brand=f'<text x="150" y="{ty0+4*lh+30}" font-family="Lora" font-size="22" letter-spacing="4" fill="{INK}" opacity="{.5*ramp(t,8.2,9.0)*(1-ramp(t,14.1,14.9)):.3f}">• TRÀ NGUỘI</text>'
    header=f'<text x="150" y="250" font-family="Lora" font-size="24" letter-spacing="5" fill="{INK}" opacity=".55">CHÉN 10 — NGƯỜI NHÀ</text><rect x="150" y="268" width="780" height="1.2" fill="{INK}" opacity=".2"/>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{DEFS}'
            f'<rect width="{W}" height="{H}" fill="{PAPER}"/><rect width="{W}" height="{H}" filter="url(#paper)"/>'
            f'{header}<g transform="translate({GX},{GY}) scale({K})">{stage}</g>{bar}{"".join(txt)}{brand}</svg>')

if __name__=="__main__":
    import sys,os
    os.makedirs('svg',exist_ok=True)
    times = [float(x) for x in sys.argv[1:]] if len(sys.argv)>1 else [i/FPS for i in range(int(DUR*FPS))]
    for i,t in enumerate(times):
        open(f'svg/f{i:04d}.svg','w').write(frame(t))
    print(len(times))

# ---- collision audit: bounding boxes in world units at sampled times
def audit():
    issues=[]
    for i in range(0,int(DUR*FPS),3):
        t=i/FPS
        lk_body=(-31-12.6,-31+12.6); lk_cup=(-31+14.6-2.7,-31+14.6+2.7)
        fence_l=(-13.5,-4.5+1.4); fence_r=(9.5-1.4,18.5)
        bx = None if t<2.55 else (72-48*ease((t-2.55)/2.05) if t<4.6 else 24)
        ov=lambda a,b: a[0]<b[1] and b[0]<a[1]
        if ov(lk_cup,fence_l): issues.append((t,'cup x fence'))
        if ov(lk_body,fence_l): issues.append((t,'body x fence'))
        if bx is not None and t>=4.6:
            b_body=(bx-11,bx+11)
            if ov(b_body,fence_r) and bx<20: issues.append((t,'B x fence'))
            if ov(b_body,lk_body): issues.append((t,'B x LK'))
    return issues
