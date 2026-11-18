import json,sys,os,subprocess,shutil
HERE=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.dirname(HERE)
sys.path.insert(0,HERE)
import tn

spec_path=sys.argv[1]; mode=sys.argv[2] if len(sys.argv)>2 else "preview"
spec=json.load(open(spec_path)); name=os.path.splitext(os.path.basename(spec_path))[0]
errs=tn.validate(spec)
if errs:
    print(f"❌ {name}: CHẶN — {len(errs)} lỗi, không dựng:"); [print("   -",e) for e in errs]; sys.exit(1)
d_pre, d_post = tn.measure_ink_density(spec)
print(f"✅ {name}: qua kiểm tra (mật độ mực vùng hình: trước cú lật {d_pre:.2f}%, sau cú lật {d_post:.2f}% / ngưỡng ≤ {tn.MAX_INK_DENSITY:.2f}%)")
out=os.path.join(HERE,"out",name); shutil.rmtree(out,ignore_errors=True); os.makedirs(out+"/svg")
times = tn.keyframes(spec) if mode=="preview" else [i/tn.FPS for i in range(int(tn.DUR*tn.FPS))]
for i,t in enumerate(times): open(f"{out}/svg/f{i:04d}.svg","w").write(tn.frame(spec,t))

env=os.environ.copy()
remotion_bin=os.path.join(ROOT,"node_modules","@remotion","compositor-darwin-arm64")
env["PATH"]=f"/opt/homebrew/bin:/usr/local/bin:{remotion_bin}:"+env.get("PATH","")
env["DYLD_LIBRARY_PATH"]=f"{remotion_bin}:"+env.get("DYLD_LIBRARY_PATH","")
node_paths=[
    os.path.join(HERE,"node_modules"),
    os.path.join(ROOT,"node_modules"),
    "/opt/homebrew/lib/node_modules",
    "/usr/local/lib/node_modules",
]
env["NODE_PATH"]=":".join(node_paths+([env["NODE_PATH"]] if env.get("NODE_PATH") else []))

def tile_6x1_cg(png_dir, n_frames, dest_png):
    import ctypes
    from ctypes import c_void_p, c_size_t, c_double, c_uint32, c_char_p, c_bool, Structure
    class CGPoint(Structure): _fields_ = [("x", c_double), ("y", c_double)]
    class CGSize(Structure): _fields_ = [("width", c_double), ("height", c_double)]
    class CGRect(Structure): _fields_ = [("origin", CGPoint), ("size", CGSize)]
    cg = ctypes.CDLL("/System/Library/Frameworks/CoreGraphics.framework/CoreGraphics")
    cf = ctypes.CDLL("/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation")
    imageio = ctypes.CDLL("/System/Library/Frameworks/ImageIO.framework/ImageIO")
    cf.CFURLCreateFromFileSystemRepresentation.restype = c_void_p
    cf.CFURLCreateFromFileSystemRepresentation.argtypes = [c_void_p, c_char_p, c_size_t, c_bool]
    cf.CFStringCreateWithCString.restype = c_void_p
    cf.CFStringCreateWithCString.argtypes = [c_void_p, c_char_p, c_uint32]
    imageio.CGImageSourceCreateWithURL.restype = c_void_p
    imageio.CGImageSourceCreateWithURL.argtypes = [c_void_p, c_void_p]
    imageio.CGImageSourceCreateImageAtIndex.restype = c_void_p
    imageio.CGImageSourceCreateImageAtIndex.argtypes = [c_void_p, c_size_t, c_void_p]
    imageio.CGImageDestinationCreateWithURL.restype = c_void_p
    imageio.CGImageDestinationCreateWithURL.argtypes = [c_void_p, c_void_p, c_size_t, c_void_p]
    imageio.CGImageDestinationAddImage.argtypes = [c_void_p, c_void_p, c_void_p]
    imageio.CGImageDestinationFinalize.restype = c_bool
    imageio.CGImageDestinationFinalize.argtypes = [c_void_p]
    cg.CGColorSpaceCreateDeviceRGB.restype = c_void_p
    cg.CGBitmapContextCreate.restype = c_void_p
    cg.CGBitmapContextCreate.argtypes = [c_void_p, c_size_t, c_size_t, c_size_t, c_size_t, c_void_p, c_uint32]
    cg.CGContextSetInterpolationQuality.argtypes = [c_void_p, c_uint32]
    cg.CGContextDrawImage.argtypes = [c_void_p, CGRect, c_void_p]
    cg.CGBitmapContextCreateImage.restype = c_void_p
    cg.CGBitmapContextCreateImage.argtypes = [c_void_p]
    tw, th = 360, 640
    W_tot, H_tot = tw * n_frames, th
    cs = cg.CGColorSpaceCreateDeviceRGB()
    ctx = cg.CGBitmapContextCreate(None, W_tot, H_tot, 8, W_tot * 4, cs, 1)
    cg.CGContextSetInterpolationQuality(ctx, 3)
    for i in range(n_frames):
        p = os.path.join(png_dir, f"f{i:04d}.png").encode("utf-8")
        u = cf.CFURLCreateFromFileSystemRepresentation(None, p, len(p), False)
        src = imageio.CGImageSourceCreateWithURL(u, None)
        im = imageio.CGImageSourceCreateImageAtIndex(src, 0, None)
        cg.CGContextDrawImage(ctx, CGRect(CGPoint(i * tw, 0), CGSize(tw, th)), im)
    out_im = cg.CGBitmapContextCreateImage(ctx)
    dp = dest_png.encode("utf-8")
    du = cf.CFURLCreateFromFileSystemRepresentation(None, dp, len(dp), False)
    uti = cf.CFStringCreateWithCString(None, b"public.png", 0x08000100)
    dest = imageio.CGImageDestinationCreateWithURL(du, uti, 1, None)
    imageio.CGImageDestinationAddImage(dest, out_im, None)
    imageio.CGImageDestinationFinalize(dest)

subprocess.run(["node",os.path.join(HERE,"render.js"),str(len(times)),out],check=True,env=env)
ffmpeg_bin=os.path.join(remotion_bin,"ffmpeg") if os.path.exists(os.path.join(remotion_bin,"ffmpeg")) else "ffmpeg"
ffmpeg_cwd=remotion_bin if os.path.isdir(remotion_bin) else None
if mode=="preview":
    r=subprocess.run([ffmpeg_bin,"-v","error","-y","-i",f"{out}/png/f%04d.png","-vf","scale=360:640,tile=6x1",f"{out}-preview.png"],env=env,cwd=ffmpeg_cwd,stderr=subprocess.DEVNULL)
    if r.returncode!=0 or not os.path.exists(f"{out}-preview.png"):
        tile_6x1_cg(f"{out}/png",len(times),f"{out}-preview.png")
    print("preview:",os.path.relpath(f"{out}-preview.png",os.getcwd()))
else:
    subprocess.run([ffmpeg_bin,"-v","error","-y","-framerate","30","-i",f"{out}/png/f%04d.png","-c:v","libx264","-preset","slow","-crf","17","-pix_fmt","yuv420p","-movflags","+faststart",f"{out}.mp4"],check=True,env=env,cwd=ffmpeg_cwd)
    print("video:",os.path.relpath(f"{out}.mp4",os.getcwd()))
