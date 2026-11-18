# Prototype dựng Chén bằng hệ mới (Claude, 17/11/2026)

Chén 10 — Người nhà, dựng lại bằng nhân vật Lữ khách vòng 7.

- `charlib.py`, `base.py`: thư viện vẽ nhân vật (thuỷ mặc, mặt sạch, lá trà, khăn len).
- `anim.py`: kịch bản + timeline của Chén 10 (hàm `frame(t)` trả về SVG 1080×1920), kèm `audit()` kiểm tra va chạm.
- `render.js`: xuất từng khung bằng Chromium (Playwright).

Chạy: `python3 anim.py && node render.js 450 png && ffmpeg -framerate 30 -i png/f%04d.png -c:v libx264 -crf 17 -pix_fmt yuv420p out.mp4`

Đây là bản thử nghiệm độc lập, chưa gắn vào engine Remotion.
