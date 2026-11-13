# V3 System Specification: "Trà Nguội Studio" Web UI & Kho Kịch Bản Tự Mở Rộng (Self-Expanding Story Vault)

> **Mục đích tài liệu (`V3_TRA_NGUOI_STUDIO_SPEC.md`):** Tài liệu này hướng dẫn AI Coding Agent (Antigravity) nâng cấp dự án tại `/Volumes/Data/Quotes` (trên nền tảng chuẩn thẩm mỹ V2.5 đã nghiệm thu) thành một **Ứng dụng Web Sản xuất Video Tự động Hoàn chỉnh (`Trà Nguội Studio`)**, kết hợp **Kho Kịch Bản Đã Kiểm Chứng (`Story Vault`)** với **Đạo Diễn AI Sinh Cảnh Code Độc Bản (`Generative TSX Scene Engine`)**.

## 1. Tổng Quan Kiến Trúc Hệ Thống V3 (Full-Stack Local Studio)

Toàn bộ hệ thống chạy ngay trên máy local chỉ bằng một câu lệnh `npm run app`, bao gồm 3 khối liên kết chặt chẽ:

```text
/Volumes/Data/Quotes/
├── data/                                    # Cơ sở dữ liệu JSON lưu trữ bền vững trên máy
│   ├── settings.json                        # Lưu cấu hình AI Provider (Gemini / OpenAI / Claude), API Key, Model
│   ├── cups.json                            # Danh sách toàn bộ các Chén (Chén 01 -> Chén N), trạng thái & đường dẫn MP4
│   └── vault-meta.json                      # Metadata của toàn bộ Kịch bản trong Kho (mô tả 3 hồi, tags, số lần dùng)
├── public/
│   └── audio/                               # Kho file nhạc nền (.mp3 / .wav) dùng chung cho cả Web UI & Remotion Render
├── output/                                  # Thư mục chứa các video .mp4, ảnh bìa -thumb.png và metadata.json đã xuất
├── src/                                     # Lõi Remotion dùng chung cho cả @remotion/player (Web UI) & @remotion/renderer
│   ├── kit/                                 # [MỚI - Phase A] Bộ Khung Diễn Viên & Thế Giới Chuẩn DNA Trà Nguội
│   │   ├── CloakedTraveler.tsx              # Nhân vật Áo Choàng đa tư thế (walk, push, sit_lean, hold_up, look_up, give)
│   │   ├── WorldStage.tsx                   # Hệ tọa độ mặt đất (FlatGround, SlopedGround, ForkRoad, CliffBridge, WaterSurface)
│   │   └── Atmosphere.tsx                   # Thời tiết Slow-Cinema (SlowRain, FallingLeaves, RisingSteam, DistantBirds, RedSun)
│   ├── scenes/                              # [MỚI - Phase A & B] Kho Kịch Bản Tự Mở Rộng (Story Vault)
│   │   ├── vaultIndex.ts                    # Registry đăng ký mọi Scene Component (dùng chung cho Vite HMR & Webpack Bundle)
│   │   ├── built-in/                        # 12 Kịch bản chuẩn khởi điểm (6 kịch bản V2.5 + 6 kịch bản mới)
│   │   └── custom/                          # Các file CustomScene_xxx.tsx do AI tự động code & vượt qua kiểm tra TypeScript
│   └── ... (theme, schemas, engine, components, compositions của bản chuẩn V2.5)
├── server/                                  # [MỚI - Phase B] Backend API Server (Express + TypeScript chạy cổng 3301)
│   ├── index.ts                             # Khởi tạo API Server & phục vụ file tĩnh từ output/ và public/audio/
│   ├── aiProviders.ts                       # Unified Adapter gọi Gemini, OpenAI và Claude (Anthropic)
│   ├── quoteWriterService.ts                # Dịch vụ "AI Pha Trà": Sáng tác Thơ/Quote mới đúng chất Trà Nguội
│   ├── vaultMatcherService.ts               # So khớp Quote với Kho Kịch bản + Bộ lọc Cooldown (tránh lặp 8 Chén gần nhất)
│   ├── sceneGeneratorService.ts             # AI viết cốt truyện 3 Hồi -> Sinh code .tsx mới -> Chạy tsc tự kiểm lỗi -> Lưu vào Kho
│   └── renderQueueService.ts                # Hàng đợi xuất MP4 hàng loạt ngầm, phát tiến độ % thời gian thực (SSE / Polling)
└── studio-ui/                               # [MỚI - Phase C] Giao diện Web React + Vite + Tailwind + @remotion/player (cổng 3300)
    ├── index.html
    ├── vite.config.ts
    └── src/
        ├── App.tsx                          # Bố cục 3 cột chuẩn Studio sản xuất chuyên nghiệp
        ├── components/
        │   ├── CupQueueSidebar.tsx          # Cột Trái: Quản lý danh sách Chén, Batch Paste & Tab "🍵 AI Pha Trà"
        │   ├── StoryDirectorDesk.tsx        # Cột Giữa: Sửa chữ, chọn pivotWord, chọn Nhạc (có cắt giây), Đạo diễn Cảnh
        │   ├── LivePhonePreview.tsx         # Cột Phải: @remotion/player 60fps + Bật/Tắt khung iPhone TikTok + Render Queue
        │   └── AISettingsModal.tsx          # Hộp thoại cài đặt API Key (Gemini / OpenAI / Claude)
```

## 2. Lộ Trình 4 Phase Triển Khai Tuần Tự (Để AI Coding Agent Thực Thi Chắc Chắn)

AI Coding Agent cần xây dựng lần lượt từng Phase và kiểm tra `typecheck` sau mỗi Phase:

### Phase A: Đóng Gói `TraNguoi Core Kit` & Mở Rộng Kho Kịch Bản Lên 12 Truyện (`src/kit/` & `src/scenes/`)

#### A.1. Chuẩn hóa Bộ Khung Nguyên Tử (`src/kit/`)
Để bất kỳ cảnh mới nào do AI tự code sau này cũng đẹp chuẩn thẩm mỹ V2.5 (không bao giờ bị lỗi chân lơ lửng hay nét vẽ xấu), tách 3 module dùng chung:
1. **`src/kit/CloakedTraveler.tsx`:**
   * Gốc tọa độ `(0, 0)` luôn nằm chính xác tại **điểm chạm đất dưới hai bàn chân**.
   * Props: `x: number`, `y: number`, `scale?: number`, `facing?: 'left' | 'right'`, `pose: 'walk' | 'stand' | 'push' | 'sit_lean' | 'look_up' | 'reach_out'`, `walkPhase?: number`, `color: string`, `opacity?: number`.
2. **`src/kit/WorldStage.tsx`:**
   * Cung cấp `<SlopedStage angleDeg={-15.5} originX={275} originY={295}>` và `<FlatHorizon y={350} startX={55} endX={485}>` để mọi nhân vật và đạo cụ đặt bên trong tự động bám khít mặt đất `y = 0`.
3. **`src/kit/Atmosphere.tsx`:**
   * Cung cấp sẵn các thành phần môi trường tốc độ chậm (Slow-Cinema): `<SlowRain opacity={...} frame={...} />`, `<FallingLeaves count={8} ... />`, `<RisingSteam x={...} y={...} color={palette.accent} />`, `<DistantBirds progress={...} />`, `<CelestialBody type="sun" | "crescent" x={...} y={...} color={palette.accent} />`.

#### A.2. Hệ Thống Registry Kho Kịch Bản (`src/scenes/vaultIndex.ts` & `data/vault-meta.json`)
* Chuyển `sceneId` trong `VideoInputSchema` từ enum cứng sang `z.string().default('BOULDER_TO_BENCH')` để chấp nhận không giới hạn các kịch bản mới sinh ra trong tương lai!
* Khởi tạo **12 kịch bản chuẩn trong `src/scenes/built-in/`** (6 kịch bản hiện có của V2.5 + 6 kịch bản mới dùng `Core Kit`):
  1. `BOULDER_TO_BENCH` *(Đẩy tảng đá lên dốc $\rightarrow$ Ngồi tựa lưng vào đá uống trà ngắm hoàng hôn)*
  2. `RAIN_UMBRELLA_PARTING` *(Che chung chiếc ô đỏ qua mưa bão $\rightarrow$ Nắng lên người kia rẽ ngang)*
  3. `KNOT_TO_BIRD` *(Cuộn chỉ rối bời trong tâm trí $\rightarrow$ Tự tháo gỡ hóa cánh chim đỏ bay lên)*
  4. `KEY_CHANGED_LOCK` *(Chìa khóa cũ tìm về $\rightarrow$ Ổ khóa đã xoay chiều đóng lại)*
  5. `MATCH_LIGHTING_CANDLE` *(Que diêm tự cháy cong mình để thắp sáng ngọn nến lớn)*
  6. `PASSING_CLOCK_HANDS` *(Hai kim đồng hồ chỉ gặp nhau đúng một tích tắc rồi buộc phải đi tiếp)*
  7. `PAPER_BOAT_STREAM` *(Kẻ lữ hành thả chiếc thuyền giấy Đỏ Gạch trôi qua dòng nước gợn sóng ra biển rộng)*
  8. `KITE_RELEASE_WIND` *(Gồng tay giữ sợi dây diều căng cứng trong gió ngược $\rightarrow$ Buông dây cho cánh diều Đỏ Gạch bay bổng)*
  9. `LADDER_MOON_REFLECTION` *(Bắc thang cao định với tới vầng trăng trên trời $\rightarrow$ Bước xuống ngồi bên hồ ngắm trăng đỏ dưới mặt nước)*
  10. `STREETLAMP_SOLO_BENCH` *(Hai người ngồi trên ghế dài dưới đèn đường $\rightarrow$ Một người đứng dậy đi khuất, lá đỏ rơi xuống chỗ trống)*
  11. `BROKEN_BRANCH_SPROUT` *(Cành cây khô gãy gập sau bão $\rightarrow$ Từ vết gãy nảy lên một mầm lá non màu Đỏ Gạch)*
  12. `HOURGLASS_TEA_BREW` *(Cát chảy cạn trong đồng hồ cát $\rightarrow$ Hóa thành giọt trà Đỏ Gạch rơi xuống tách ấm)*

### Phase B: Xây Dựng Backend API, Đa Nhà Cung Cấp AI & Động Cơ Sinh Cảnh Mới (`server/`)

#### B.1. Hỗ trợ Đa Nhà Cung Cấp AI (`server/aiProviders.ts`)
Đọc cấu hình từ `data/settings.json` (có thể cập nhật trực tiếp từ giao diện Web UI):
```typescript
export interface AISettings {
  provider: 'gemini' | 'openai' | 'anthropic';
  geminiApiKey?: string;
  geminiModel?: string;      // Mặc định: 'gemini-2.5-pro' hoặc 'gemini-2.5-flash'
  openaiApiKey?: string;
  openaiModel?: string;      // Mặc định: 'gpt-4o'
  anthropicApiKey?: string;
  anthropicModel?: string;   // Mặc định: 'claude-3-7-sonnet-latest'
}
```
Viết hàm thống nhất `generateStructuredJSON(systemPrompt, userPrompt)` và `generateTypeScriptCode(systemPrompt, userPrompt)` hỗ trợ cả 3 hãng **Gemini**, **OpenAI** và **Claude (Anthropic)**.

#### B.2. Dịch vụ "AI Pha Trà" – Sáng Tác Thơ & Quote Chuẩn Giọng Kênh (`server/quoteWriterService.ts`)
* **Endpoint:** `POST /api/ai/write-quotes` (`{ topic: string, format: 'POEM' | 'PROSE' | 'MIXED', count: number }`)
* **System Prompt cốt lõi:**
  > *"Bạn là tác giả của kênh Trà Nguội (@tranguoi.15s) với triết lý: 'Chút thơ, chút đời, chút ngẫm — chát ở đầu môi nhưng ngọt ở câu cuối'. Từ chủ đề người dùng đưa ra, hãy sáng tác các câu Thơ ngắn (4 dòng, 5–7 chữ/dòng) hoặc Văn xuôi ngắn (2–3 mệnh đề). Tuyệt đối không sến súa bi lụy, không giáo điều sách vở. Nửa đầu câu nói chạm vào hiện thực đời thường (cơm áo, tình người, sự mệt mỏi, những hiểu lầm), dòng cuối có một cú bẻ lái nhẹ nhàng, hóm hỉnh hoặc thấu suốt kèm `pivotWord` đắt giá."*

#### B.3. Cơ Chế Kép: So Khớp Kho Kịch Bản + AI Tự Code Cảnh Mới (`vaultMatcherService.ts` & `sceneGeneratorService.ts`)
1. **So khớp thông minh kèm Cooldown (`POST /api/scenes/match`):**
   * Đọc 8 Chén gần nhất trong `data/cups.json` để lập danh sách `recentSceneIds` (đang trong thời gian nghỉ Cooldown).
   * Gửi danh sách kịch bản khả dụng trong `data/vault-meta.json` cùng câu quote cho LLM chấm điểm `matchScore` (`0–100`):
     * Nếu `matchScore >= 85`: Đề xuất dùng kịch bản có sẵn trong Kho + tự trích xuất `pivotWord`.
     * Nếu `matchScore < 85` (hoặc người dùng bấm **"✨ Đạo diễn Cảnh Mới"**): Chuyển sang quy trình sinh cảnh độc bản 2 bước.
2. **Quy trình Sinh Cảnh Độc Bản & Kết Tinh Vào Kho (`POST /api/scenes/ideate` & `POST /api/scenes/build-tsx`):**
   * **Bước 1 (`ideate`):** AI trả về bản tóm tắt cốt truyện 3 Hồi bằng tiếng Việt (`act1`, `act2AtPivot`, `act3Afterimage`, `redPropDescription`, `suggestedSceneId`) để người dùng đọc duyệt hoặc sửa chữ trên Web UI.
   * **Bước 2 (`build-tsx`):** Khi người dùng bấm **"Dựng Cảnh Lên Màn Hình"**:
     1. LLM nhận định nghĩa interface `ArchetypeComponentProps` + API của `CloakedTraveler`, `WorldStage`, `Atmosphere`, `evolvePath` và viết một file React Component hoàn chỉnh `src/scenes/custom/<sceneId>.tsx` (tuân thủ nghiêm ngặt quy tắc: chỉ dùng `palette.inkPrimary`, `palette.inkSecondary` và duy nhất 1 đạo cụ màu `palette.accent`, sử dụng `state.beat1StopClear`, `state.beat2SettleGlow`, `state.beat3LingeringWalk` để giữ nhịp Slow-Cinema).
     2. Server ghi file tạm và chạy kiểm tra `npx tsc --noEmit`. Nếu có lỗi biên dịch TypeScript, tự động gửi thông báo lỗi cho LLM sửa lại tối đa 2 lần cho tới khi `exit code === 0`.
     3. Tự động cập nhật `src/scenes/vaultIndex.ts` và thêm mục mới vào `data/vault-meta.json`! Nhờ Vite HMR, màn hình `<Player>` trên Web UI lập tức hiển thị bộ phim mới tạo ngay sau 0.5 giây!

#### B.4. Hàng Đợi Xuất Video Ngầm (`server/renderQueueService.ts`)
* **Endpoints:**
  * `POST /api/render/enqueue` (`{ cupIds: string[] }`): Đưa 1 hoặc nhiều Chén vào hàng đợi xuất MP4.
  * `GET /api/render/status`: Trả về trạng thái từng job (`queued | bundling | rendering | completed | failed`), phần trăm tiến độ (`onProgress` của `renderMedia()`), đường dẫn xem/tải file `.mp4` và nội dung caption chuẩn TikTok.

### Phase C: Giao Diện Web `Trà Nguội Studio` (`studio-ui/`)

Thiết kế giao diện Web hiện đại, mang chính tông màu ấm thanh lịch của **Trà Nguội**, gồm 3 cột:
1. **Thanh Topbar:** Logo `• TRÀ NGUỘI STUDIO`, trạng thái kết nối AI Provider, nút **Cài đặt AI Key** (`AISettingsModal`), và nút **Quản lý Kho Kịch Bản (`Vault Explorer` — xem toàn bộ các kịch bản hiện có)**.
2. **Cột Trái (`CupQueueSidebar` – Rộng 300px):**
   * Danh sách các Chén (`Chén 01 — Nghỉ`, `Chén 02 — Ngược lối`...), hiển thị nhãn trạng thái (`Nháp`, `Đang xuất 64%`, `Đã xong ✔`), nút chọn nhiều Chén để **Render Hàng Loạt**.
   * Nút **"+ Thêm Chén Mới"** (hỗ trợ dán 1 bài hoặc dán nhiều bài cách nhau bằng dòng `---`) và nút mở ngăn **"🍵 AI Pha Trà"** (nhập chủ đề $\rightarrow$ sinh 5 gợi ý Quote $\rightarrow$ bấm *"Đưa vào Chén mới"*).
3. **Cột Giữa (`StoryDirectorDesk` – Linh hoạt):**
   * **Khung Biên tập Chữ:** Nhập Tiêu đề (ví dụ: `NGHỈ`), chọn `Thơ (POEM)` / `Văn xuôi (PROSE)`, sửa từng dòng `segments`, và **hiển thị các chip từ vựng ở dòng cuối để click 1 chạm chọn `pivotWord`** (hoặc gõ trực tiếp).
   * **Khung Đạo diễn Cảnh 3 Hồi:**
     * Tab 1: **Chọn từ Kho Kịch Bản (`Story Vault`)** — có nút *"🤖 AI Tự Chọn Cảnh Hợp Nhất"* kèm cảnh báo nếu cảnh đó vừa dùng gần đây.
     * Tab 2: **✨ AI Đạo Diễn Cảnh Độc Bản Mới** — bấm *"1. Phác thảo cốt truyện 3 Hồi"* $\rightarrow$ chỉnh sửa mô tả câu chuyện nếu muốn $\rightarrow$ bấm *"2. Code cảnh & Nạp vào Kho"*.
   * **Khung Thẩm mỹ & Nhạc nền:**
     * Chọn bảng màu (`Warm Tea Paper`, `Roasted Tea Charcoal`, `Aged Parchment`, `Celadon Tea Mist`).
     * Chỉnh thời lượng video (`targetDurationSeconds`: mặc định **`15s`**, có thanh trượt / ô nhập từ `8s` đến `30s`).
     * Chọn file nhạc trong `public/audio/` + nút **Upload thêm file `.mp3` mới** + thanh trượt chọn giây bắt đầu (`bgmStartSeconds`) có nút **Nghe thử 5 giây đoạn nhạc đã cắt**.
4. **Cột Phải (`LivePhonePreview` – Rộng 380px):**
   * Tích hợp trực tiếp `<Player>` từ `@remotion/player` hiển thị đúng `QuoteVideoComposition` ở 60fps thời gian thực!
   * Nút gạt **"📱 Hiện khung giao diện iPhone TikTok thật"** (mô phỏng chính xác phần cắt viền 9:19.5, thanh tìm kiếm trên, nút Avatar/Tim bên phải và vùng tối caption dưới để kiểm tra trực quan ngay trước khi xuất).
   * Cụm nút hành động: **"🎬 Xuất MP4 Chén Này"**, **"📋 Copy Caption TikTok"** và nút **"Tải MP4 / Xem Ảnh Bìa"**.

### Phase D: Kiểm Thử Tích Hợp Đầu-Cuối & Đóng Gói Lệnh Chạy

Cập nhật `package.json` gốc tại `/Volumes/Data/Quotes`:
* Thêm `@remotion/player`, `express`, `cors`, `multer` (upload nhạc `.mp3`), `concurrently` và cấu hình Vite.
* Câu lệnh khởi động duy nhất: **`npm run app`** $\rightarrow$ Mở đồng thời API Server (`http://localhost:3301`) và Giao diện Web `Trà Nguội Studio` (`http://localhost:3300`), nạp sẵn `Chén 01` và `Chén 02` từ dữ liệu hiện có vào `data/cups.json`.
