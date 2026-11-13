# 5. DETERMINISTIC CORE SPECIFICATION — `f(t)` Evaluation Contract

**Document Status:** Approved Architecture Specification (Updated for M0/M1 Review)

**Target Package:** `@mv-engine/core`

**Core Determinism Principle:**

> **Cùng đầu vào phải tạo ra `SceneState` giống hệt nhau (State Determinism). Kết quả rendering phải có tính xác định trong một môi trường đã khóa cấu hình; giữa các môi trường GPU khác nhau, sử dụng kiểm thử hình ảnh với sai số cho phép (Pixel Reproducibility).**

## 5.1 Two-Level Determinism Model: State Determinism vs. Pixel Reproducibility

To establish realistic, verifiable engineering contracts across heterogeneous hardware while maintaining strict mathematical rigor, the Music Video Engine separates determinism into **two distinct levels**:

| Determinism Level | Scope & Layer | Requirement & Enforcement | Verification Method & Threshold | 
| ----- | ----- | ----- | ----- | 
| **Level 1: State Determinism** *(Mandatory — Strict Bitwise Identity)* | Pure CPU Evaluation Layer (`@mv-engine/core`, `@mv-engine/audio`, `@mv-engine/timeline`, `@mv-engine/motion`, `@mv-engine/scene`) | Given identical `(Timestamp t, AudioData, LyricsData, SceneSpec, VisualSystem, EngineVersion)`, `evaluateFrame(t)` MUST produce the **exact same `SceneState`**, completely independent of evaluation order (forward, reverse, random-access, or concurrent workers) and render history. | **Bitwise equality (`Buffer.compare === 0` / `Object.is`)** on all numeric state fields and `Float32Array` buffers across 1,000+ timestamps in forward, reverse, and shuffled orders. | 
| **Level 2: Pixel Reproducibility** *(Environment-Locked Reproducibility)* | Hybrid GPU/Canvas Rendering Layer (`@mv-engine/renderer-webgl`, `@mv-engine/renderer-canvas`, `@mv-engine/compositor`) | Within a **locked renderer environment** (same GPU model, OS/Metal driver version, and pinned Electron/Chromium binary), repeated renders of timestamp `t` must be reproducible. Across **different GPUs, drivers, OS versions, or Chromium releases**, bit-identical pixels are NOT promised due to hardware rasterization rules, MSAA/capsule AA rounding, `HalfFloat` blending precision, and GPU transcendental approximations. | **Tolerance-based visual regression (`pixelmatch` / SSIM / PSNR)** against WebGL2 golden images (`< 0.05%` diff on locked CI hardware; `< 0.5%` tolerance across different GPU architectures). | 

## 5.2 Formal Mathematical Evaluation Contract (Level 1 — State Determinism)

Let:

* $t \in [0, D]$ be the canonical song timestamp in IEEE 754 double-precision seconds (`number`).

* $\mathcal{A}$ be the immutable validated `AudioData` payload (`schemaVersion: "1.0.0"`, with configurable `envFps`, e.g., `10 Hz` preserved for *Nơi Ta Đến*, and an independent `onsets` channel).

* $\mathcal{L}$ be the immutable validated `LyricsData` payload (`schemaVersion: "1.0.0"`).

* $\mathcal{S}$ be the immutable validated `SceneSpec[]` + `VisualSystem` configuration.

* $\mathcal{R}$ be the `RenderConfig` (`aspectRatio`, `qualityTier`, `fps`, `shutterFraction`, `motionBlurSamples`).

* $V_{\text{engine}}$ be the semantic engine version (`"1.0.0"`).

Then the **Pure State Evaluation Function** $\mathcal{E}$ is a **pure, referentially transparent function**:

$$
\text{SceneState}(t) = \mathcal{E}\!\left(t,\; \mathcal{A},\; \mathcal{L},\; \mathcal{S},\; \mathcal{R},\; V_{\text{engine}}\right)
$$

### Core Consequences of Referential Transparency

1. **Zero History Dependence (`stateful = false`):** Evaluating frame $F_{6120}$ ($t = 102.00\text{s}$) directly after startup produces the exact same `PL6State` and `Float32Array` buffers as playing sequentially from $F_0$ ($t = 0.00\text{s}$) to $F_{6120}$.

2. **Order-Independent Sub-Frame Sampling:** Within a frame's shutter window $\left[t - \frac{\sigma}{2f},\; t + \frac{\sigma}{2f}\right]$, sub-frames $t_k$ can be evaluated in any order without altering any sub-frame's state.

3. **Chunk-Parallel Multi-Worker Export:** Offscreen GPU workers rendering disjoint frame chunks require zero inter-worker state synchronization.

## 5.3 Support for Required Sampling & Rendering Modes

### 1. Random-Access Rendering & Scrubbing

* All positions, phases, particle trajectories, and envelope lookups are closed-form functions of `t` (or local scene time `lt = t - scene.startSec`):

  * **Looping Trajectories (e.g., `PL. VI` Birds Z-Cycle, `line 720`):**

    ```
    const zCycle = ((lt * (1.8 + (i % 4) * 0.25) + i * 1.9) % 15.5) + 6.2;
    
    ```

  * **Waterfall Drops (`PL. II`, `line 1112`):**

    ```
    const dropProgress = (f.t * (0.9 + (i % 7) * 0.12) + i * 0.073) % 1.0;
    
    ```

### 2. Multi-Rate Frame Sampling (`24` / `30` / `60` FPS) & Shutter-Constant `frameIdx(t)`

* For any target frame rate $F \in \{24, 30, 60\}$ and frame index $n \in \{0, 1, \dots, \lfloor D \cdot F \rfloor\}$: 

  $$
  t_n = \frac{n}{F}
  $$

* For shutter fraction $\sigma \in [0, 1]$ (default $\sigma = 0.2$) and $S$ sub-frames ($k \in \{0, \dots, S-1\}$), the raw sub-frame timestamp is: 

  $$
  t_{n,k}^{\text{raw}} = t_n + \left(\frac{k + 0.5}{S} - 0.5\right) \cdot \frac{\sigma}{F}
  $$

* **Mandatory Shutter-Window Clamping at Plate Boundaries (`83.65s` and `116.50s`):**

  * To prevent centered shutter offsets from sampling into the preceding Plate ($t < S_i.\text{startSec}$) or succeeding Plate ($t \ge S_i.\text{endSec}$), every sub-frame timestamp is strictly clamped to the active scene's half-open window: 

    $$
    t_{n,k} = \text{clamp}\!\left(t_{n,k}^{\text{raw}},\; S_i.\text{startSec},\; S_i.\text{endSec} - 10^{-6}\right)
    $$

* **Discrete Flicker Seed Rule (`frameIdx(t)` vs `Math.floor(t * fps)`):**

  * All discrete per-frame flicker must use `frameIdx(t_n, fps) = Math.round(t_n * fps)` passed down from the canonical master frame timestamp $t_n$, remaining **constant across all shutter sub-frames** $t_{n,k}$ **of frame** $n$.

### 3. Reproducible Scene Transitions

* **Boundary Exclusivity Rule (`[startSec, endSec)` half-open interval):**

  * Each scene $i$ owns the half-open interval $[S_i.\text{startSec},\; S_i.\text{endSec})$, except the final scene which owns $[S_{\text{last}}.\text{startSec},\; D]$.

  * This eliminates the boundary bug in `Nơi Ta Đến` (`line 569`: `tc >= start && tc <= end + 0.01`), where two plates overlapped by `10ms`.

### 4. Configurable `envFps` Audio Envelope Interpolation & Independent Onset Channel

* **`envFps` as a Per-Project `AudioData` Configuration Parameter:**

  * `envFps` is never hardcoded in `@mv-engine/core` or `@mv-engine/audio`; it is read dynamically from `audioData.envFps` (`10 Hz` preserved for *Nơi Ta Đến* in M0/M1; `60 Hz` supported as an optional advanced configuration for future projects).

* **Independent `onsets` Channel (No Fake Upsampling of `10 Hz` Envelopes):**

  * Discrete transient timestamps (`onsets.kick`, `onsets.snare`, `onsets.hat`, `onsets.vocal`) are stored in their own dedicated channel in `AudioData`, completely independent of the continuous `env` arrays.

  * The engine **never** interpolates `10 Hz` envelopes up to `60 Hz` and treats them as synthetic transients; when accurate transient onsets are required, they must be extracted directly from the source audio waveform.

* **Precomputed Deterministic Attack/Release Filtering (`buildSmoothedEnvelope`):**

  * Computed **once at initialization** over `audioData.env[band]` into a `Float32Array`, guaranteeing $O(1)$ zero-jitter random-access lookups for both current timestamp `t` and spatial Z-delayed timestamps `tDelayed = Math.max(0, t - zNorm * 0.55)`.

## 5.4 Complete Audit of Existing Nondeterminism in `Nơi Ta Đến` (and Fixes)

| \# | Location in `Nơi Ta Đến` HTML | Nondeterminism Mechanism | Impact on Render / Export | Deterministic Core Resolution | 
| ----- | ----- | ----- | ----- | ----- | 
| **1** | `tick(now)` (`lines 2131–2169`) & `startVideoRender()` (`lines 2060–2129`) | **Real-Time `requestAnimationFrame` + `MediaRecorder` Export:** Export advances `currentTime` via `songAudio.currentTime` or wall-clock `dt` while `MediaRecorder` samples asynchronously. | **Severe:** CPU/GPU load spikes drop frames, change `dt`, desynchronize audio/video, and produce a different video file on every export run. | Replace `MediaRecorder` with offline frame-stepped rendering (`renderAt(frameIdx / fps)`) piped deterministically to `ffmpeg`. | 
| **2** | `renderMasterFrame()` (`lines 1809–1825`) | **Centered Shutter Offset Crossing Discrete Boundary + Asymmetric Alpha:** At `t = 83.65s`, negative shutter offset (`83.648s`) evaluates `PL. V`, mixing two different Plates on cut boundaries, and `1.5 / samples` alpha weights later sub-frames unevenly. | **High:** Cut frames (`83.65s`, `116.50s`) ghost `PL. V`/`PL. VI`/`PL. VII` together. | Clamp sub-frame timestamps $t_{n,k}$ strictly within $[S_i.\text{startSec}, S_i.\text{endSec} - 10^{-6}]$ (`clampShutterTimestamp`) and accumulate in linear `RGBA16F` with exact $1/S$ weights. | 
| **3** | `drawSpark()` (`line 778`) | **Sub-Frame Boundary Hash Flip (`Math.floor(t * 24)`):** Evaluates inside `renderSingleSubFrame(t + offset)`. | **Medium:** Negative and positive shutter sub-frames straddling a `1/24s` boundary evaluate two different random spark states. | Lock discrete flicker seeds to the canonical master frame index `frameIdx(t_n, 24)`. | 
| **4** | `buildFrameContext(t)` (`lines 567–574`) | **Overlapping Plate Boundary Epsilon (`tc <= AUDIO_DATA.plates[i].end + 0.01`):** Adds `+ 0.01` to every plate's `end` during forward linear search. | **Medium:** Delays every scene cut by `10ms` (`0.6` frames at 60fps). | Enforce half-open interval `tc >= plate.start && tc < plate.end` (with `tc <= plate.end` on the final plate). | 
| **5** | `evaluatePL6(t)` (`lines 614–664`) & `renderPlateCanyon()` (`line 798`) | **Shared Mutable Module-Scope Singletons (`_pl6State`, `_pl6BirdsPool`, `_projOut`):** Mutates global objects in place on every `evaluatePL6(t)` call. | **Medium:** Causes race conditions if multiple viewports or workers evaluate concurrently in the same JS isolate. | Encapsulate pre-allocated `Float32Array` and object pools inside an instance-scoped `SpatialContourValleyEvaluator` class. | 
| **6** | `renderPlateOutro()` (`lines 1370–1375`) | **Recursive Live Scene Re-Dispatch During Rewind (`dispatchScene(ctx, W, H, vf)`):** Maps `4.31s` of outro backward across `210s` of song. | **Low/Medium:** Discrete frame steps land on different plates depending on FPS. | Pre-render canonical Plate Stills (`cache/plates/`) or evaluate against a locked virtual timeline table. | 
| **7** | External Google Fonts CDN (`lines 8–10`) | **Async WebFont Loading Race:** `<link href="https://fonts.googleapis.com/...">` loads fonts asynchronously over the network. | **High:** Rendering before fonts finish loading alters `ctx.measureText` widths and 50/50 line-split positions. | Bundle local `.ttf`/`.woff2` font files and parse glyph metrics deterministically via `opentype.js`. | 
| **8** | `hash1(n)` (`lines 524–526`) | **`Math.sin(n * 127.1 + 311.7) * 43758.5453123`:** Relies on JS engine `Math.sin` implementation for pseudo-randomness. | **Low:** Can drift by 1 ULP across JS/GPU runtimes for large arguments. | Provide `pcgHashU32` and `mulberry32` 32-bit unsigned integer PRNGs in `@mv-engine/core` while preserving exact `evaluatePL6(t)` trig formulas for ` < 1e-6` mathematical parity. | 
