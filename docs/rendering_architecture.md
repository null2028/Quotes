# 4. HYBRID RENDERING ARCHITECTURE — Canvas 2D + WebGL2 Pipeline

**Document Status:** Approved Rendering Specification (Updated for M0/M1 Review)  
**Target Packages:** `@mv-engine/renderer-webgl`, `@mv-engine/renderer-canvas`, `@mv-engine/compositor`, `@mv-engine/graphics`  
**Reference Benchmarks:** `Nơi Ta Đến` (`PL. VI — The Ray of Freedom`) & [`mexicat/pdoom-video`](https://github.com/mexicat/pdoom-video/blob/main/docs/ENGINE.md) (`src/engine/gl.ts`, `lines.ts`, `post.ts`)

## 4.1 Technical Justification for Hybrid Canvas 2D + WebGL2

Neither pure Canvas 2D nor pure WebGL alone satisfies the requirements of the Music Video Engine:
1. **Why Pure Canvas 2D Fails (`Nơi Ta Đến` Prototype Bottleneck):**
   - Projecting 3,036 3D terrain vertices + 16 wireframe birds + 18 signal ribbon segments per sub-frame on the CPU (`project3D` in `lines 840–905`) lacks hardware depth buffering, frustum clipping, and instanced line antialiasing, and cannot execute raymarched SDFs, linear-HDR threshold bloom, or per-tile early-Z adaptive shutter sampling at 4K60.
2. **Why Pure WebGL Fails for Vietnamese Karaoke & Telemetry HUD:**
   - Vietnamese typography (`Inter` / `Cormorant Garamond` / `JetBrains Mono`) features complex stacked diacritics (`ấ, ề, ộ, ử, ẵ`) and dynamic per-frame clipping wipes (`renderLyricsLayer`, `lines 1497–1504`). Rendering crisp, hinted, sub-pixel anti-aliased multi-script text and 1px blueprint HUD hairlines in pure WebGL SDF font atlases introduces halo artifacts at small point sizes (`9.5px–12px` HUD labels).
3. **The Hybrid Solution (`Layer2D` Texture Bridge over Linear-HDR WebGL2):**
   - **WebGL2 (`@mv-engine/renderer-webgl`)** renders all 3D spatial geometry, procedural contour deformations, GPU capsule line batches (`LineBatch`), particle systems, camera projections, fullscreen SDF/horizon shaders (`FSPass`), shutter sub-frame accumulation, and linear-HDR post-processing.
   - **Canvas 2D (`@mv-engine/renderer-canvas`)** renders all word-synced karaoke lyrics, adlib vocal echoes, blueprint HUD frames, corner crop marks, `P(Tự Do)` readouts, 4-band EQ meters, and 2D vector graphic overlays into pre-scaled offscreen canvases (`Layer2D`), uploaded at **at most 2 Canvas texture uploads per master frame** and composited over the tone-mapped WebGL frame using premultiplied alpha.

## 4.2 Precise Separation of Responsibilities

| Domain / Visual Element | Assigned Renderer | Technical Mechanism | Shutter Motion Blur Policy |
| :--- | :--- | :--- | :--- |
| **3D Spatial Geometry & Topographic Contours** (`PL. II`, `PL. V`, `PL. VI`, `PL. IX`) | **WebGL2** (`@mv-engine/renderer-webgl`) | Instanced GPU capsule `LineBatch` or vertex-shader displaced ribbon meshes evaluated in 3D world space. | **Blurred** across $N$ shutter sub-frames (`t + offset_k`). |
| **Procedural Deformation & Wave Propagation** (`splitFactor`, `fbm`, delayed `low`/`rms` waves) | **WebGL2** (`@mv-engine/renderer-webgl`) | Evaluated into typed `Float32Array` vertex attributes or uniform buffers (`UBO` / DataTexture) per sub-frame. | **Blurred** across $N$ shutter sub-frames. |
| **Particles, Sparks & Wireframe Flocks** (`16 PL. VI birds`, `70 waterfall drops`, `sparkParticles`) | **WebGL2** (`@mv-engine/renderer-webgl`) | Additive/alpha GPU `LineBatch` + instanced point/quad billboards in linear HDR (`values > 1.0` bloom). | **Blurred** across $N$ shutter sub-frames (creates natural wing/spark streaks). |
| **Camera Projection & Frustum Clipping** (`PerspectiveCamera`, `fov`, `roll`, `lookAt`) | **WebGL2** (`@mv-engine/renderer-webgl`) | True `mat4` `viewProjectionMatrix = projMatrix * rollMatrix * lookAtMatrix` with GPU near-plane (`z = 0.35`) clipping. | **Blurred** across $N$ shutter sub-frames. |
| **Horizon Light, SDFs & Post-Processing** (Bloom, Halation, CA, Film Grain, Vignette) | **WebGL2** (`@mv-engine/compositor`) | Fullscreen GLSL3 passes (`FSPass`) on `HalfFloatType` (`RGBA16F`) render targets. | Horizon/SDFs **blurred**; Post-processing & grain evaluated **once per master frame** after sub-frame averaging. |
| **2D Scene Graphic Overlay (Optional)** (2D calibration rings, metronome frame, or custom 2D vectors) | **Canvas 2D Upload #1** (`graphic2DLayer: Layer2D`) | Optional scene-level `Layer2D` texture upload (skipped entirely if the scene uses pure WebGL `LineBatch`). | **Unblurred** (or replaced by 2D `LineBatch` when motion blur is desired). |
| **Lyrics, Karaoke Wipes, Adlibs & Global HUD** (`mainLine`, 50/50 row split, orange clip wipe, `ECHO //`, crop marks, `P(Tự Do)`, 4-Band EQ) | **Canvas 2D Upload #2** (`uiOverlayLayer: Layer2D`) | Logical Lyrics Pass (`renderLyricsLayer`) and Logical HUD Pass (`renderGlobalHUD`) draw sequentially onto a **single merged `uiOverlayLayer` (`Layer2D`)** before performing **one GPU texture upload** (`texSubImage2D`). | **Unblurred** (evaluated once per master frame at canonical $t$ so lyrics and HUD remain razor-sharp). |

## 4.3 Coordinate Systems & Multi-Aspect Resolution Policy

### 1. Three Distinct Coordinate Spaces
To support `16:9` Cinema, `9:16` TikTok Vertical, and `1:1` Square across `720p`, `1080p`, `1440p`, and `4K` without rewriting scene layouts:

```
+--------------------------------------------------------------------------------------------------+
| 1. WORLD SPACE (3D WebGL — Metric Space, +Z Forward along Canyon Corridor)                       |
|    - X: Lateral (-Left, +Right), Canyon width ~ [-16.5 .. +16.5], Corridor ~ [-1.8 .. +1.8]      |
|    - Y: Vertical Elevation (+Up, -Down), Camera Y ~ [1.8 .. 4.2], Valley Walls ~ [0 .. +6.5]     |
|    - Z: Forward Depth along Song Trajectory (+Forward from 0.0 to ~300.0; Far clip zRel = 36.0)  |
+--------------------------------------------------------------------------------------------------+
                                                |
                                                | mat4 View-Projection + Aspect-Aware FOV Scaling
                                                v
+--------------------------------------------------------------------------------------------------+
| 2. LOGICAL VIEWPORT SPACE (2D Layout Space — Aspect-Dependent, Resolution-Independent)           |
|    - Origin (0, 0) at Top-Left; +X Right [0 .. LW], +Y Down [0 .. LH]                            |
|    - Reference Short Side: L_SHORT = 1080 logical px (or 720 legacy compatibility factor s=1.5)  |
|      * 16:9 Cinema:   LW = 1920, LH = 1080  (Horizon Center Anchor: Y = 0.44 * LH)               |
|      * 9:16 TikTok:   LW = 1080, LH = 1920  (Horizon Center Anchor: Y = 0.36 * LH, clears HUD)   |
|      * 1:1  Square:   LW = 1080, LH = 1080  (Horizon Center Anchor: Y = 0.42 * LH)               |
+--------------------------------------------------------------------------------------------------+
                                                |
                                                | Physical Scale Factor: SCALE = PW / LW
                                                v
+--------------------------------------------------------------------------------------------------+
| 3. PHYSICAL DEVICE SPACE (Render Target & FFmpeg Output Pixels — PW x PH)                        |
|    - 720p  (SCALE = 0.6667): 1280x720  (16:9) | 720x1280  (9:16) | 720x720   (1:1)               |
|    - 1080p (SCALE = 1.0000): 1920x1080 (16:9) | 1080x1920 (9:16) | 1080x1080 (1:1)               |
|    - 1440p (SCALE = 1.3333): 2560x1440 (16:9) | 1440x2560 (9:16) | 1440x1440 (1:1)               |
|    - 4K    (SCALE = 2.0000): 3840x2160 (16:9) | 2160x3840 (9:16) | 2160x2160 (1:1)               |
+--------------------------------------------------------------------------------------------------+
```

### 2. Resolution Scaling Invariants
* **`Layer2D` Pre-Scaling:** Every `Layer2D` allocates a physical backing canvas of `PW × PH` (`LW * SCALE × LH * SCALE`) and immediately applies `ctx.scale(SCALE, SCALE)`. All Canvas 2D drawing code works exclusively in **Logical Viewport Space (`LW × LH`)**, so a `4K` render is a true physical `3840×2160` rasterization—never an upscale—and matches `1080p` framing.
* **GLSL `PX_SCALE` & `pxLine(d, a, b)`:** In GLSL3 shaders, `gl_FragCoord` and `fwidth()` operate on physical pixels. All shaders include `GLSL_COMMON` which defines `FRAG_PX = gl_FragCoord.xy / uPxScale` and `pxLine(d, a, b)` so procedural SDF strokes maintain constant logical thickness across `720p..4K` while gaining physical edge sharpness at `4K`.

## 4.4 Deterministic 8-Layer Stack (`L0` – `L7`) & Max-2-Upload Policy

### 1. The 8-Layer Compositing Stack (`L0` to `L7`)

Lyrics (`L6`) and Global HUD (`L7`) are maintained as **separate logical rendering modules** (`renderLyricsLayer` and `renderGlobalHUD`) so each can be toggled independently (`config.overlays.showLyrics`, `config.overlays.showHud`, `config.overlays.meterMode`), but they rasterize onto a **single shared `uiOverlayLayer` (`Layer2D`)** prior to GPU upload. This guarantees that **at most 2 Canvas 2D texture uploads** ever occur per master frame:
1. **Upload #1 (Optional):** `graphic2DLayer` (only when a scene explicitly uses a 2D Canvas graphic overlay; `0` uploads for pure WebGL scenes like `PL. VI`).
2. **Upload #2 (Standard):** Merged `uiOverlayLayer` containing both Logical Layer `L6` (Lyrics) and Logical Layer `L7` (Global HUD).

| Z-Layer | Layer Name | Producer & Target | GPU Texture Upload Cost | Blend Equation (Linear Space) |
| :---: | :--- | :--- | :--- | :--- |
| **L0** | **Void Base & Horizon Glow** | WebGL `FSPass` → `sceneRT` (`RGBA16F`) | `0` (Native GPU) | Overwrite (`fragColor = vec4(col, 1.0)`) |
| **L1** | **3D Terrain & Far/Mid Contours** | WebGL `LineBatch` / Ribbon Mesh → `sceneRT` (`RGBA16F`) | `0` (Native GPU) | Premultiplied Alpha-Over + Depth Test (`GL_LEQUAL`) |
| **L2** | **3D Flocks, Streaks & Particles** | WebGL `LineBatch` → `sceneRT` (`RGBA16F`) | `0` (Native GPU) | Normal or Additive (`GL_ONE, GL_ONE`) for glowing sparks |
| **L3** | **Foreground Signal Ribbon & Core** | WebGL `LineBatch` + `FSPass` → `sceneRT` (`RGBA16F`) | `0` (Native GPU) | Additive (`C_SIGNAL` HDR `> 1.0` drives bloom) |
| **L4** | **Shutter Sub-Frame Accumulator** | WebGL `AccumPass` → `accumRT` (`RGBA16F`) | `0` (Native GPU) | Exact $1 / N$ linear irradiance weighted sum |
| **L5** | **HDR Post-Processing & Optional 2D Graphic Overlay** | WebGL `PostChain` (+ optional `graphic2DLayer` **Upload #1**) → `postRT` | `0` or `1` (`graphic2DLayer`) | Bloom Pyramid + Halation + CA + ToneMap + Grain |
| **L6** | **Lyric Backdrop Scrim & Karaoke Wipe** *(Logical Canvas Pass A)* | `renderLyricsLayer(uiOverlayLayer.ctx)` | **Shared Upload #2** (`uiOverlayLayer` combines L6 + L7 into 1 `texSubImage2D` call) | Drawn first into `uiOverlayLayer` (Canvas 2D `source-over`) |
| **L7** | **Global Blueprint HUD & 4-Band EQ** *(Logical Canvas Pass B)* | `renderGlobalHUD(uiOverlayLayer.ctx)` → `uiOverlayLayer.upload()` | *(Included in Shared Upload #2)* | Drawn second into `uiOverlayLayer`, then composited onto `postRT` via Premultiplied Alpha-Over (`ONE, ONE_MINUS_SRC_ALPHA`) |

### 2. Color Management & Premultiplied Alpha Law (Zero Dark Halo Guarantee)
* **Linear-HDR Internal Pipeline:** All WebGL calculations (`L0–L5`) execute in **Linear sRGB / Rec.709 primaries with `HalfFloatType` (`RGBA16F`)** dynamic range.
* **Exact Linear Shutter Averaging (`L4`):**
  $$C_{\text{accum}}(x,y) = \frac{1}{N(x,y)} \sum_{k=1}^{N(x,y)} C_{\text{linear}}(x, y, t_k)$$
* **Eliminating Dark Halos on Karaoke Wipe Edges (`L6 + L7`):** HTML5 Canvas 2D stores pixels with premultiplied alpha in sRGB space. When `uiOverlayLayer.upload()` uploads the merged L6+L7 canvas to WebGL2 (`texSubImage2D`), the compositor configures `UNPACK_PREMULTIPLY_ALPHA_WEBGL = true` and performs premultiplied sRGB-to-linear conversion in the compositor shader before blending with `gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)`. This prevents double-multiplication of alpha on anti-aliased glyph edges and eliminates dark fringes around `#FF6324` karaoke wipes.

## 4.5 Resource Lifecycle & Shared Timestamp Evaluation

1. **`init(ctx: EngineContext): Promise<void>`**: Pre-allocates all GPU `BufferGeometry`, `LineBatch` capacity buffers, `ShaderMaterial` programs, `uiOverlayLayer` (`Layer2D`), and instance-scoped `Float32Array` state pools. **Zero heap allocations are permitted inside `evaluate()` or `render()`.**
2. **`evaluate(f: FrameContext, spec: SceneSpec): SceneState`**: Pure CPU function computing the mathematical state for timestamp `f.t` (clamped to the active scene window during shutter sub-sampling).
3. **`render(f: FrameContext, state: SceneState, out: WebGLRenderTarget): PostOverrides`**: Uploads updated vertex/uniform buffers to WebGL and executes draw calls into `out`.
4. **`dispose(): void`**: Explicitly frees all `BufferGeometry`, `Material`, `WebGLRenderTarget`, and `Texture` handles.
