# VISUAL DIRECTION & ANIMATION AUTHORING SPECIFICATION (REVISED v1.1)

## Shot `PL6-BIRD-FORMATION` (`[96.00s, 102.00s]` + Continuity Verification at `108.00s`)

**Project:** `"Nơi Ta Đến"` — `PL. VI: CHÂN TRỜI MỞ RỘNG // THE RAY OF FREEDOM` (`[83.65s, 116.50s)`)

**Workflow Stage:** `Visual Thesis → Storyboard → Animation Guide → Shot Specification → [HUMAN APPROVAL GATE — REVISION v1.1]`

**Engine Baseline Inspected:** `@mv-engine/contracts`, `@mv-engine/scene` (`SpatialContourValleyEvaluator`), `@mv-engine/renderer-webgl` (`WebGL2SpatialRenderer`, `LineBatch`), `@mv-engine/audio` (`DeterministicAudioEngine`)

**Architectural Constraint:** `evaluatePL6(t)`, `@mv-engine/scene`, `@mv-engine/core`, `@mv-engine/audio`, and `@mv-engine/contracts` remain **100% unmodified**. All new morphological and kinematic logic is scoped strictly to `@mv-engine/renderer-webgl`.

## A. VISUAL DIRECTION STATEMENT (Tuyên ngôn Đạo diễn Thị giác — Đã Duyệt)

Trong 12 giây đầu của `PL. VI` (`83.65s – 96.00s`), thung lũng đường đồng mức (`contour valley`) là một kiến trúc địa hình thuần túy kỷ hà: 44 lát cắt ngang uốn lượn theo sóng âm và 16 vệt sáng thẳng đứng (`vertical light streaks`) dựng lên hai bên vách hẻm núi như những cột mốc đo đạc không gian vô tri. Nếu ở giây `98.50s`, 16 cột sáng ấy chỉ đơn thuần mờ đi để 16 ký hiệu hình chữ V hiện đè lên, khoảnh khắc quan trọng nhất của bài hát — khi câu hát *"Thay cho tiếng còi bằng chim hót vang đó đây"* vang lên — sẽ chỉ là một thủ thuật thay thế đồ họa (`mesh swap`), không tạo ra sự giải phóng cảm xúc.

**Ý niệm trung tâm của Shot `PL6-BIRD-FORMATION` (`96.00s – 102.00s`) là sự thức tỉnh hình thái (`Morphogenesis`): một cấu trúc ánh sáng kỷ hà tự uốn cong, tự phân nhánh và tìm ra cơ học sự sống của chính nó.** Người xem phải chứng kiến từng sợi ánh sáng thẳng đứng vốn đang bị khóa chặt theo phương trọng lực (`+Y`) bắt đầu chịu lực hút của chân trời phía trước (`+Z`): đỉnh vệt sáng kết tụ thành mũi dẫn hướng (`head apex`), trục dọc uốn cong thành sống lưng (`dorsal keel`), năng lượng từ tâm trục tách đôi sang hai bên thành khớp vai (`shoulder diamond`) và sải cánh gấp khúc hai tầng (`inner carpal` & `outer primary wings`), trước khi phần đuôi tách nhánh và phóng vệt quỹ đạo bay vào không gian. Khi 16 cá thể hoàn tất quá trình tự kiến tạo ở `102.00s`, chúng không còn là những vạch sáng tĩnh gắn vào vách đá, mà đã trở thành một đàn sinh vật wireframe trừu tượng có trọng lượng khí động học, có nhịp thở bất đối xứng và có ý chí bay về phía chân trời tự do.

## B. STORYBOARD — 5 NHỊP HÀNH ĐỘNG LIÊN TỤC (`[96.00s, 102.00s]` & Kiểm chứng `108.00s`)

Toàn bộ 5 nhịp hành động (`Beats A → E`) bám sát hai đường cong chuẩn đã khóa trong `SpatialContourValleyEvaluator`:

$$
\text{birdMorph}(t) = \text{smoothstep}(98.50,\; 102.20,\; t), \qquad \text{streakPresence}(t) = \text{smoothstep}(86.50,\; 90.00,\; t) \cdot \left(1.0 - \text{smoothstep}(101.00,\; 105.00,\; t)\right)
$$


và được đồng bộ chính xác với công thức **Stagger Thời gian Thực (`R2`)** cùng **Tách biệt Sự kiện Rời Cột sáng / Sự kiện Vỗ cánh (`R6`)**:

| Beat & Tên nhịp | Khoảng thời gian `t` (`lt = t - 83.65s`) | `birdMorph(t)`, `localMorph` $m_i(t)$ & `streakPresence(t)` | Lời bài hát & Bối cảnh Âm nhạc (`LyricsData` & `AudioData`) | Diễn tiến Hình thái & Hành động Chủ thể (16 Cá thể — Đồng bộ `R1`, `R2`, `R6`) | Bố cục Không gian & Quan hệ với Camera (`FOV`, `Roll`, `CamPos`) | Mục đích Thị giác (Visual Intent) | 
| ----- | ----- | ----- | ----- | ----- | ----- | ----- | 
| **Beat A**  **The Signal**  *(Tín hiệu Tĩnh trong Hẻm núi)* | **`96.00s – 98.50s`**  (`lt: 12.35s – 14.85s`)  *(2.50 giây)* | `birdMorph`: **`0.00000`**  `localMorph`: **`[0.0000, 0.0000]`**  `streak`: **`1.00000`** | Kết câu *"Nơi ta đến nơi tự do..."* (`96.0s`), câu bè vàng `#FFB84D` *"ECHO // (Ở nơi chẳng phải lo)"* (`96.5s – 98.0s`), mở đầu *"Thay cho tiếng còi..."* (`98.0s`). | 16 chủ thể là các trục thẳng đứng thuần túy (`length = 2.2m * sc`) phân bố dọc hai vách thung lũng (`zRel ∈ [6.2m, 21.7m]`), chỉ hiển thị **2 cạnh trục sống lưng nối tiếp (`E01`, `E02`) + thân dưới cột sáng (`basal stem`) và điểm sáng đỉnh (`pNose` cap)**. Hoàn toàn chưa có cạnh vai hay cánh nào được bật (`E03..E18` có `alpha = 0`), đảm bảo không chồng nét hay tăng độ sáng giả tạo. | Camera lao nhanh trong `PHASE 03 // FLY THROUGH` (`speedBoost = 1.25 → 1.44`), `FOV` mở rộng từ **`57.11°` (`96.0s`) lên `64.13°` (`98.5s`)**, `roll: +0.0011 → -0.0441 rad`. 16 cột sáng tạo thành hàng cột kiến trúc dẫn mắt về phía lõi tín hiệu cam `#FF6324`. | Khẳng định xuất phát điểm thuần túy hình học: không cá thể nào biến hình trước `98.50s`. | 
| **Beat B**  **The Bending & Spine Ignition**  *(Uốn trục & Khởi phát Khớp vai)* | **`98.50s – 99.65s`**  (`lt: 14.85s – 16.00s`)  *(1.15 giây)* | `birdMorph`: **`0.00000 → 0.22976`**  `localMorph`:  • `98.80s`: `[0.0000, 0.0187]`  • `99.20s`: `[0.0563, 0.0938]`  • `99.50s`: `[0.1457, 0.1797]`  • `99.65s`: `[0.1979, 0.2298]`  `streak`: **`1.00000`** | Chữ *"tiếng còi"* → *"bằng"* (`99.10s – 100.30s`). Tín hiệu thành thị nhường chỗ cho thiên nhiên. | **Stage I (`m_i ∈ [0.00, 0.25]`) sang đầu Stage II (`m_i ∈ [0.18, 0.50]`):**  • Tại `98.80s`: 11 cá thể có `delaySec <= 0.30s` bắt đầu uốn trục (`u1 > 0`), trong khi 5 cá thể trễ (`id = 2, 3, 4, 10, 11`) vẫn giữ nguyên cột thẳng đứng (`m_i = 0`).  • Tại `99.20s` (`m_i ∈ [0.0563, 0.0938]`): cả 16 cá thể đều đang trong **Stage I** với tiến trình uốn sống lưng `u1 ∈ [13.0%, 31.7%]` (`u2 = 0`, chưa tách vai).  • Tại `99.50s` (`m_i ∈ [0.1457, 0.1797]`): trục sống lưng (`E01`, `E02`) đã uốn nghiêng mạnh về `+Z` (`u1 ∈ [62.3%, 80.7%]`), hạt sáng đỉnh tụ thành mũi `pNose`.  • Từ `99.51s – 99.65s` (`m_i > 0.18`): các cạnh vai hình thoi (`E03..E06`) và mầm cổ tay (`E07..E08`) bắt đầu tách khỏi trục chính (`u2 ∈ [0.9%, 6.5%]` tại `99.65s`). | `FOV` đạt **`64.13° → 65.88°`**, camera đạt độ nghiêng cực đại (`roll = -0.0538 rad`). Người xem thấy rõ một sợi sáng thẳng đứng đang gập lại trong không gian 3D thành trục sống lưng có đầu mũi dẫn hướng trước khi nảy mầm hai vai. | Tạo khoảnh khắc "chuyển pha vật chất" tuần tự: uốn trục sống lưng hoàn chỉnh rồi mới tách khớp vai. | 
| **Beat C**  **The Formation**  *(Mở Cánh 2 Tầng & Nhập Quỹ Đạo)* | **`99.65s – 100.85s`**  (`lt: 16.00s – 17.20s`)  *(1.20 giây)* | `birdMorph`: **`0.22976 → 0.69777`**  `localMorph`:  • `100.00s`: `[0.3333, 0.3598]`  • `100.35s`: `[0.4793, 0.5000]`  • `100.50s`: `[0.5425, 0.5607]`  • `100.85s`: `[0.6853, 0.6978]`  `streak`: **`1.00000`** | Chữ *"bằng"* → **"chim"** (`100.30s – 101.45s`). Đúng tại từ **"chim"**, cấu trúc cánh mở ra rõ rệt. | **Stage II (`m_i ∈ [0.18, 0.50]`) → Stage III (`m_i ∈ [0.42, 0.82]`):**  • **Sự kiện 1 — Rời Cột sáng & Nhập Quỹ đạo (`m_i > 0.22`, từ `~99.63s`):** Cá thể bắt đầu tách khỏi neo cột sáng tĩnh (`wTraj = smoothstep(0.22, 0.85, m_i)`) để trượt vào vị trí đội hình 3D.  • Tại `100.35s` (`M = 0.5000`): khung thân hình thoi (`E03..E06`) và cánh trong (`E07..E08`) đã mở hoàn chỉnh (`u2 ∈ [98.8%, 100%]`), và **cánh ngoài (`E09..E10`), mặt giằng tam giác (`E11..E16`) cùng chạc đuôi (`E17..E18`) bắt đầu bung ra** (`u3 ∈ [5.9%, 10.4%]`, `wTraj ∈ [38.4%, 41.7%]`, chưa vỗ cánh `wFlap = 0`).  • Tại `100.50s` (`M = 0.5607`): sải cánh ngoài mở đạt `u3 ∈ [22.4%, 28.4%]`, và **Sự kiện 2 — Khởi phát Vỗ cánh (`m_i > 0.55`)** bắt đầu kích hoạt ở các cá thể dẫn đầu (`wFlap > 0`). | Chuyển sang `PHASE 04 // THE BIRDS` tại `100.00s`. `FOV` chạm đỉnh **`66.00°`** và giữ ổn định; camera đảo chiều lượn sang phải (`camX: -0.09m → +0.34m`). | Thể hiện rõ thứ tự giải phẫu (`Sống lưng → Khung vai & Cánh trong → Cánh ngoài & Mặt tam giác → Chạc đuôi`) và tách bạch việc trượt vào quỹ đạo (`99.65s`) với việc bắt đầu đập cánh (`100.50s`). | 
| **Beat D**  **The Living Flock**  *(Vỗ Cánh Bất Đối Xứng & Bay Đàn)* | **`100.85s – 101.65s`**  (`lt: 17.20s – 18.00s`)  *(0.80 giây)* | `birdMorph`: **`0.69777 → 0.94028`**  `localMorph`:  • `100.85s`: `[0.6853, 0.6978]`  • `101.00s`: `[0.7424, 0.7527]`  • `101.65s`: `[0.9378, 0.9403]`  `streak`: **`1.00000 → 0.92936`** | Chữ *"chim"* → *"hót"* (`100.86s – 101.99s`). Năng lượng `high` và `mid` của giọng hát ở cao trào điệp khúc. | **Cuối Stage III (`u3: 75% → 100%`) & Stage IV (`m_i ∈ [0.65, 1.00]`):**  • Ngay đầu Beat D (`100.85s`), biên độ vỗ cánh `wFlap = smoothstep(0.55, 0.90, m_i)` đã đạt **`33.6% – 38.4%`**, tăng lên **`58.6% – 62.6%` tại `101.00s`** và đạt **`100%` từ `101.48s`**. Nhịp vỗ bất đối xứng (downstroke dứt khoát, upstroke mềm có độ trễ cổ tay – đầu cánh) vận hành toàn diện.  • Đồng thời, phần thân dưới của cột sáng ban đầu (`basal stem`) co rút hoàn toàn vào `pTailRoot` (`u4: 3% → 92%`), truyền năng lượng sang vệt `Flight Trail` lịch sử thực phía sau đuôi. | Camera lượn qua trục giữa (`camX: +0.34m → +0.72m`, `roll: -0.053 → -0.046 rad`). 16 cá thể bay trong 3 phân đội chiều sâu (`Vanguard`, `Core`, `Outlier`) với góc `pitch` và `bank` có dấu riêng, cắt qua các đường đồng mức nền với thị sai rõ rệt. | Chuyển hóa hoàn toàn từ quá trình dựng hình sang chuyển động sống của một đàn chim wireframe có cá tính và đội hình. | 
| **Beat E**  **The Handoff**  *(Hoàn Thiện & Phóng về Chân Trời)* | **`101.65s – 102.00s`**  *(Kiểm chứng tiếp nối tới `108.00s`)* | Tại `102.00s`:  `birdMorph`: **`0.99155`**  `localMorph`: **`[0.9912, 0.9916]`**  `streak`: **`0.84375`**  Tại `108.00s`:  `birdMorph`: **`1.00000`**  `localMorph`: **`[1.0000, 1.0000]`**  `streak`: **`0.00000`** | Chữ *"vang"* bắt đầu tại `101.998s` (`0.4%` wipe tại `102.00s`) → *"vang đó đây"* (`102.0s – 103.8s`) → `108.0s` (*"Sáng sớm thức giấc dậy..."*). | Tại `102.00s` (`localMorph ≈ 0.9915`), cả 18 cạnh giải phẫu (`E01..E18`) đạt `100%` cấu trúc thiết kế (`u1 = u2 = u3 = 1.0, u4 = 0.998`); `streakPresence = 0.84375` chỉ còn đóng vai trò tăng cường độ sáng gốc đuôi trước khi tắt hẳn ở `105.00s`. Tại `102.20s`, mọi cá thể đạt `localMorph = 1.0000`. Từ `102.00s` sang `108.00s`, đàn chim giữ nguyên topology 13-đỉnh / 18-cạnh, mở rộng đội hình theo độ mở hẻm núi (`corridorWidth: 2.20m → 2.26m`) hướng vào chân trời cam `#FF6324`. | Đàn chim chiếm hành lang an toàn `screenY ∈ [14%..54% H]`, thông thoáng phía trên lõi tín hiệu cam (`vpY = 44% H`) và cách xa vùng Lyrics (`Y > 74% H`). Động lượng tiến tiếp diễn mượt sang `PHASE 05 // HORIZON` (`108.00s`). | Khóa hình thái chuẩn tại keyframe `102.00s` và bảo đảm tính liên tục tuyệt đối sang `108.00s`. | 

## C. ANIMATION GUIDE — QUY LUẬT HÌNH THÁI, BIẾN HÌNH & CHUYỂN ĐỘNG (ĐÃ HIỆU ĐÍNH `R1` – `R6`)

### C.1. Bird Morphology — Đồ Thị Khung Dây Thống Nhất `13-Vertex / 18-Edge` (`R1`)

Để đồng bộ tuyệt đối giữa mô tả, sơ đồ, JSON và code thực thi, cấu trúc giải phẫu của mỗi cá thể được khóa thành **Đồ thị Khung dây 3D `13 Đỉnh (Vertices) / 18 Cạnh (Edges)` (`unified-13vertex-18edge-wireframe`)**.

#### 1. Danh mục Chính thức 13 Đỉnh (`vertices[0..12]`) trong Hệ tọa độ Cục bộ 3D `(lx, ly, lz)`

Hệ trục cục bộ của từng cá thể: **`+Z` là hướng mũi/hướng bay tới trước (Forward Heading)**, **`+Y` là hướng lưng lên trên (Dorsal Up)**, **`+X` là hướng cánh phải (Starboard Right)**:

```
                        V00: pNose (0, +yNose, +zNose) [Đỉnh Đầu / Mũi Dẫn Hướng]
                          /        |         \
                      (E03)      (E01)       (E04)
                        /          |           \
       V03: pShoulderL (-xSh)  V01: pCrest   V04: pShoulderR (+xSh) [Khớp Vai & Đỉnh Sống Lưng]
          /          \             |             /          \
       (E07)        (E05)        (E02)        (E06)        (E08)
        /              \           |           /              \
  V05: pWristL          \          |          /          V06: pWristR [Khớp Cổ Tay / Carpal]
    /      \             \         |         /             /      \
 (E09)    (E15)           \        |        /           (E16)    (E10)
  /          \             \       |       /             /          \
V07: pTipL --(E11)-- V09: pRearWingL -(E13)- V02: pTailRoot -(E14)- V10: pRearWingR --(E12)-- V08: pTipR
                                              /          \
                                           (E17)        (E18)
                                            /              \
                                   V11: pTailForkL    V12: pTailForkR [Chạc Đuôi Định Hướng]

```

| Index | Vertex ID | Tọa độ Cục bộ Đích `(lx, ly, lz)` tại `localMorph = 1.0` *(đơn vị: `* sc`)* | Tọa độ Khởi điểm tại `localMorph = 0.0` *(Trục Vertical Streak)* | Vai trò Giải phẫu | 
| ----- | ----- | ----- | ----- | ----- | 
| `V00` | `pNose` | `(0.00, +0.16, +noseZ)` | `(0.00, +1.10, 0.00)` *(Đỉnh cột sáng)* | Mũi dẫn hướng & điểm gắn hạt sáng đỉnh (`top cap`) | 
| `V01` | `pCrest` | `(0.00, +0.25, +0.10)` | `(0.00, +0.45, 0.00)` *(Điểm 1/3 trên)* | Đỉnh sống lưng nổi khối 3D (`dorsal keel apex`) | 
| `V02` | `pTailRoot` | `(0.00, -0.06, -0.46)` | `(0.00, -0.25, 0.00)` *(Điểm giữa dưới)* | Gốc hội tụ thân sau & điểm neo gốc `Flight Trail` | 
| `V03` | `pShoulderL` | `(-shoulderX, +0.07, +0.22)` | `(0.00, +0.52, 0.00)` *(Chập trên trục dọc)* | Khớp bả vai trái (điểm nối thân và cánh trong) | 
| `V04` | `pShoulderR` | `(+shoulderX, +0.07, +0.22)` | `(0.00, +0.52, 0.00)` *(Chập trên trục dọc)* | Khớp bả vai phải (điểm nối thân và cánh trong) | 
| `V05` | `pWristL` | `(-innerSpan, +0.18 + flapInner, +wristSweepZ)` | `(0.00, +0.45, 0.00)` *(Chập tại `pCrest`)* | Khớp cổ tay trái (`carpal joint` — đỉnh gấp khúc cánh) | 
| `V06` | `pWristR` | `(+innerSpan, +0.18 + flapInner, +wristSweepZ)` | `(0.00, +0.45, 0.00)` *(Chập tại `pCrest`)* | Khớp cổ tay phải (`carpal joint` — đỉnh gấp khúc cánh) | 
| `V07` | `pTipL` | `(-span, +0.08 + flapOuter, +tipSweepZ)` | `(0.00, +0.45, 0.00)` *(Chập tại `pWristL`)* | Đầu mút cánh chính bên trái (`left primary wingtip`) | 
| `V08` | `pTipR` | `(+span, +0.08 + flapOuter, +tipSweepZ)` | `(0.00, +0.45, 0.00)` *(Chập tại `pWristR`)* | Đầu mút cánh chính bên phải (`right primary wingtip`) | 
| `V09` | `pRearWingL` | `(-0.72 * innerSpan, +0.04 + 0.6 * flapInner, -0.24)` | `(0.00, -0.10, 0.00)` *(Chập trên trục dọc)* | Nút giằng mép cánh sau bên trái (`left trailing-edge node`) | 
| `V10` | `pRearWingR` | `(+0.72 * innerSpan, +0.04 + 0.6 * flapInner, -0.24)` | `(0.00, -0.10, 0.00)` *(Chập trên trục dọc)* | Nút giằng mép cánh sau bên phải (`right trailing-edge node`) | 
| `V11` | `pTailForkL` | `(-tailForkX, -0.09, +tailZ)` | `(0.00, -0.25, 0.00)` *(Chập tại `pTailRoot`)* | Đầu chạc đuôi trái (`left tail stabilizer fin`) | 
| `V12` | `pTailForkR` | `(+tailForkX, -0.09, +tailZ)` | `(0.00, -0.25, 0.00)` *(Chập tại `pTailRoot`)* | Đầu chạc đuôi phải (`right tail stabilizer fin`) | 

*(Lưu ý: Phần chân cột sáng ban đầu từ `y = -0.25` xuống `y = -1.10` được biểu diễn bởi đoạn thân gốc `basalStreakStem: [pTailRoot, pStreakBase]` nơi `pStreakBase` thu ngắn dần về `pTailRoot` theo* $1 - u_4$ *trong Stage IV).*

#### 2. Danh mục Chính thức 18 Cạnh (`edges[0..17]`) & Luật Đóng/Mở Theo Giai đoạn (Chống Chồng Nét ở `m = 0` — `R1.5` & `R1.6`)

Để bảo đảm tại `localMorph = 0.0` (khi các đỉnh cùng nằm trên trục thẳng đứng) **tuyệt đối không có hai cạnh nào vẽ đè lên nhau làm tăng độ dày hoặc nhân đôi độ sáng**, mỗi nhóm cạnh có hàm cổng độ mờ `edgeAlpha(m_i)` riêng. Bất kỳ cạnh nào có `edgeAlpha <= 0.005` hoặc chiều dài chiếu `< 0.5 px` đều bị **loại bỏ trước khi gọi `pushSegment()`**:

| Edge ID | Cặp Đỉnh `[from, to]` | Nhóm Giải phẫu | Giai đoạn Kích hoạt (`activeStage`) | Công thức Cổng Độ mờ `edgeAlpha(m_i)` *(Chống chồng nét ở `m = 0`)* | Độ dày Nét (`widthPx`) | 
| ----- | ----- | ----- | ----- | ----- | ----- | 
| `E01` | `["pNose", "pCrest"]` | **1. Dorsal Spine** | Luôn bật (`m_i ∈ [0, 1]`) | `lerp(sAlpha, bAlpha, u1)` *(Tại `m=0`, nối từ `y=+1.10` xuống `y=+0.45`)* | `lerp(sW, spineW, u1)` | 
| `E02` | `["pCrest", "pTailRoot"]` | **1. Dorsal Spine** | Luôn bật (`m_i ∈ [0, 1]`) | `lerp(sAlpha, bAlpha * 0.92, u1)` *(Tại `m=0`, nối tiếp từ `y=+0.45` xuống `y=-0.25` — **0% chồng lấn với `E01`**)* | `lerp(sW, spineW * 0.90, u1)` | 
| `E03` | `["pNose", "pShoulderL"]` | **2. Shoulder Diamond** | **Stage II** (`m_i > 0.18`) | `bAlpha * 0.90 * smoothstep(0.18, 0.28, m_i)` *(Bằng `0` khi `m_i <= 0.18`)* | `spineW * 0.85` | 
| `E04` | `["pNose", "pShoulderR"]` | **2. Shoulder Diamond** | **Stage II** (`m_i > 0.18`) | `bAlpha * 0.90 * smoothstep(0.18, 0.28, m_i)` *(Bằng `0` khi `m_i <= 0.18`)* | `spineW * 0.85` | 
| `E05` | `["pShoulderL", "pTailRoot"]` | **2. Shoulder Diamond** | **Stage II** (`m_i > 0.18`) | `bAlpha * 0.82 * smoothstep(0.18, 0.30, m_i)` *(Bằng `0` khi `m_i <= 0.18`)* | `sparW` | 
| `E06` | `["pShoulderR", "pTailRoot"]` | **2. Shoulder Diamond** | **Stage II** (`m_i > 0.18`) | `bAlpha * 0.82 * smoothstep(0.18, 0.30, m_i)` *(Bằng `0` khi `m_i <= 0.18`)* | `sparW` | 
| `E07` | `["pShoulderL", "pWristL"]` | **3. Inner Carpal Wing** | **Stage II** (`m_i > 0.18`) | `bAlpha * 1.00 * smoothstep(0.18, 0.26, m_i)` *(Chỉ sáng lên khi `pWristL` tách khỏi trục)* | `leadW` | 
| `E08` | `["pShoulderR", "pWristR"]` | **3. Inner Carpal Wing** | **Stage II** (`m_i > 0.18`) | `bAlpha * 1.00 * smoothstep(0.18, 0.26, m_i)` *(Chỉ sáng lên khi `pWristR` tách khỏi trục)* | `leadW` | 
| `E09` | `["pWristL", "pTipL"]` | **4. Outer Primary Wing** | **Stage III** (`m_i > 0.42`) | `bAlpha * 0.96 * smoothstep(0.42, 0.50, m_i)` *(Bằng `0` khi `m_i <= 0.42`)* | `leadW * 0.92` | 
| `E10` | `["pWristR", "pTipR"]` | **4. Outer Primary Wing** | **Stage III** (`m_i > 0.42`) | `bAlpha * 0.96 * smoothstep(0.42, 0.50, m_i)` *(Bằng `0` khi `m_i <= 0.42`)* | `leadW * 0.92` | 
| `E11` | `["pTipL", "pRearWingL"]` | **5. Wing Trailing Truss** | **Stage III** (`m_i > 0.42`) | `bAlpha * 0.76 * smoothstep(0.45, 0.58, m_i)` *(Bằng `0` khi `m_i <= 0.45`)* | `sparW` | 
| `E12` | `["pTipR", "pRearWingR"]` | **5. Wing Trailing Truss** | **Stage III** (`m_i > 0.42`) | `bAlpha * 0.76 * smoothstep(0.45, 0.58, m_i)` *(Bằng `0` khi `m_i <= 0.45`)* | `sparW` | 
| `E13` | `["pRearWingL", "pTailRoot"]` | **5. Wing Trailing Truss** | **Stage III** (`m_i > 0.42`) | `bAlpha * 0.76 * smoothstep(0.45, 0.58, m_i)` *(Bằng `0` khi `m_i <= 0.45`)* | `sparW` | 
| `E14` | `["pRearWingR", "pTailRoot"]` | **5. Wing Trailing Truss** | **Stage III** (`m_i > 0.42`) | `bAlpha * 0.76 * smoothstep(0.45, 0.58, m_i)` *(Bằng `0` khi `m_i <= 0.45`)* | `sparW` | 
| `E15` | `["pWristL", "pRearWingL"]` | **5. Wing Trailing Truss** | **Stage III** (`m_i > 0.42`) | `bAlpha * 0.65 * smoothstep(0.48, 0.62, m_i)` *(Bằng `0` khi `m_i <= 0.48`)* | `sparW * 0.88` | 
| `E16` | `["pWristR", "pRearWingR"]` | **5. Wing Trailing Truss** | **Stage III** (`m_i > 0.42`) | `bAlpha * 0.65 * smoothstep(0.48, 0.62, m_i)` *(Bằng `0` khi `m_i <= 0.48`)* | `sparW * 0.88` | 
| `E17` | `["pTailRoot", "pTailForkL"]` | **6. Swept Forked Tail** | **Stage III** (`m_i > 0.42`) | `bAlpha * 0.88 * smoothstep(0.46, 0.60, m_i)` *(Bằng `0` khi `m_i <= 0.46`)* | `sparW * 1.05` | 
| `E18` | `["pTailRoot", "pTailForkR"]` | **6. Swept Forked Tail** | **Stage III** (`m_i > 0.42`) | `bAlpha * 0.88 * smoothstep(0.46, 0.60, m_i)` *(Bằng `0` khi `m_i <= 0.46`)* | `sparW * 1.05` | 

*Kiểm chứng chống chồng nét tại* $m_i = 0$*:* Tại $m_i = 0$, chỉ có `E01` (`y: +1.10 → +0.45`), `E02` (`y: +0.45 → -0.25`) và đoạn gốc `basalStreakStem` (`y: -0.25 → -1.10`) có `alpha > 0`. Ba đoạn thẳng này nối tiếp nhau không giao nhau dọc theo đoạn `[-1.10, +1.10]`, tạo thành **đúng 1 đường thẳng đứng duy nhất có độ dày chuẩn `sW` và độ sáng `sAlpha`**.

### C.2. Real-Time Stagger Formula & Multi-Timestamp Verification Table (`R2`)

Thay thế hoàn toàn cách trừ offset trực tiếp trong miền morph bằng **Công thức Độ trễ Thời gian Thực (`Real-Time Initiation Stagger`)** với độ trễ khởi phát tối đa `0.48 giây`:

```
const M = birdMorph(t); // smoothstep(98.50, 102.20, t)
const delaySec = 0.48 * hashInt01(birdId * 37 + 11); // ∈ [0.0025s, 0.4439s] ⊂ [0, 0.48s]
const startMorph = birdMorph(98.50 + delaySec);      // ∈ [0.000001, 0.039727]
const localMorph = clamp((M - startMorph) / (1.0 - startMorph), 0.0, 1.0);

```

Bốn tiến trình giai đoạn con ($u_1, u_2, u_3, u_4$) và hai trọng số hành vi ($w_{\text{traj}}, w_{\text{flap}}$) của cá thể $i$ được tính tất định từ `localMorph` ($m_i$):

* **Stage I (`u1` — Spine Bend & Nose Ignition):** $u_1 = \text{smoothstep}(0.00,\; 0.25,\; m_i)$

* **Stage II (`u2` — Shoulder Diamond & Carpal Bud):** $u_2 = \text{smoothstep}(0.18,\; 0.50,\; m_i)$

* **Stage III (`u3` — Primary Wing Unfurl & Truss):** $u_3 = \text{smoothstep}(0.42,\; 0.82,\; m_i)$

* **Stage IV (`u4` — Streak Basal Stem Absorption):** $u_4 = \text{smoothstep}(0.65,\; 1.00,\; m_i)$

* **Event 1 (`wTraj` — Trajectory Departure from Wall Anchor):** $w_{\text{traj}} = \text{smoothstep}(0.22,\; 0.85,\; m_i)$

* **Event 2 (`wFlap` — Asymmetric Wing Flap Activation):** $w_{\text{flap}} = \text{smoothstep}(0.55,\; 0.90,\; m_i)$

#### Bảng Kiểm Chứng Giá Trị Toán Học Thực Tế Trên Các Mốc Trọng Yếu (`96.00s – 108.00s`)

| Timestamp `t` (`s`) | Global `birdMorph(t)` & `streakPresence(t)` | Khoảng `localMorph` $m_i(t)$ (Min: `id=4` / Max: `id=14`) | `u1` (Spine Bend `[0.00, 0.25]`) | `u2` (Shoulder Bud `[0.18, 0.50]`) | `u3` (Primary Wing `[0.42, 0.82]`) | `u4` (Stem Absorb `[0.65, 1.00]`) | `wTraj` (`[0.22, 0.85]`) & `wFlap` (`[0.55, 0.90]`) | Trạng thái Hình thái Thực tế Quan sát được | 
| ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | 
| **`96.00s – 98.50s`** | `M = 0.00000`  `S = 1.00000` | **`0.0000 – 0.0000`** | `0.000 – 0.000` | `0.000 – 0.000` | `0.000 – 0.000` | `0.000 – 0.000` | `wTraj: 0.000`  `wFlap: 0.000` | **100% Cột sáng thẳng đứng (`E01 + E02 + stem`)**. Không cá thể nào biến hình trước `98.50s`. | 
| **`98.80s`** | `M = 0.01866`  `S = 1.00000` | **`0.0000 – 0.0187`** | `0.000 – 0.016` | `0.000 – 0.000` | `0.000 – 0.000` | `0.000 – 0.000` | `wTraj: 0.000`  `wFlap: 0.000` | **Khởi phát lệch pha:** 11 cá thể có `delaySec <= 0.30s` bắt đầu nghiêng đỉnh sống lưng (`u1 > 0`), trong khi 5 cá thể (`id = 2, 3, 4, 10, 11`) vẫn ở `m_i = 0.0000`. | 
| **`99.20s`** | `M = 0.09383`  `S = 1.00000` | **`0.0563 – 0.0938`**  *(Rep 0/1/2: `0.0905 / 0.0935 / 0.0684`)* | **`0.130 – 0.317`**  *(Rep: `29.8% / 31.5% / 18.4%`)* | `0.000 – 0.000` | `0.000 – 0.000` | `0.000 – 0.000` | `wTraj: 0.000`  `wFlap: 0.000` | **Thuần Stage I (Uốn trục):** Cả 16 cá thể đang uốn cong sống lưng với độ gấp khác nhau (`13.0%` đến `31.7%` của `74°`); **chưa cá thể nào chạm ngưỡng tách vai `0.18`**. | 
| **`99.50s`**  *(Prototype KF 1)* | `M = 0.17965`  `S = 1.00000` | **`0.1457 – 0.1797`**  *(Rep 0/1/2: `0.1766 / 0.1793 / 0.1567`)* | **`0.623 – 0.807`**  *(Rep: `79.2% / 80.5% / 68.6%`)* | `0.000 – 0.000` | `0.000 – 0.000` | `0.000 – 0.000` | `wTraj: 0.000`  `wFlap: 0.000` | **Cao điểm Stage I (Sát ngưỡng Stage II `0.18`):** Trục sống lưng đã gập mạnh về phía trước (`46° – 60°`), hạt sáng đỉnh kết tụ rõ ở `pNose`, sẵn sàng nảy mầm vai ở `99.51s`. | 
| **`99.65s`**  *(Beat B → C)* | `M = 0.22976`  `S = 1.00000` | **`0.1979 – 0.2298`**  *(Rep 0/1/2: `0.2269 / 0.2294 / 0.2082`)* | **`0.888 – 0.981`** | **`0.009 – 0.065`**  *(Rep: `5.8% / 6.4% / 2.2%`)* | `0.000 – 0.000` | `0.000 – 0.000` | `wTraj: 0.000–0.001`  `wFlap: 0.000` | **Khởi phát Stage II & Rời neo cột sáng:** Khung vai hình thoi (`E03..E06`) và mầm cổ tay (`E07..E08`) tách khỏi sống lưng; các cá thể sớm (`m_i > 0.22`) bắt đầu rời neo cột sáng (`wTraj > 0`). | 
| **`100.35s`**  *(Prototype KF 2)* | `M = 0.50000`  `S = 1.00000` | **`0.4793 – 0.5000`**  *(Rep 0/1/2: `0.4982 / 0.4998 / 0.4860`)* | `1.000 – 1.000` | **`0.988 – 1.000`** | **`0.059 – 0.104`**  *(Rep: `10.0% / 10.3% / 7.3%`)* | `0.000 – 0.000` | **`wTraj: 0.369–0.417`**  `wFlap: 0.000` | **Hoàn tất Stage II & Chớm mở Stage III:** Khung thân và cánh trong (`shoulder → wrist`) đã mở `~100%`; đầu cánh ngoài (`wrist → tip`) bắt đầu nhú ra (`6%–10%`); chim đang trượt vào đội hình (`wTraj ~ 40%`) với đôi cánh căng tĩnh (`wFlap = 0`). | 
| **`100.50s`**  *(Prototype KF 3)* | `M = 0.56068`  `S = 1.00000` | **`0.5425 – 0.5607`**  *(Rep 0/1/2: `0.5591 / 0.5605 / 0.5484`)* | `1.000 – 1.000` | `1.000 – 1.000` | **`0.224 – 0.284`**  *(Rep: `27.9% / 28.3% / 24.3%`)* | `0.000 – 0.000` | **`wTraj: 0.517–0.561`**  **`wFlap: 0.000–0.003`** | **Giữa Stage III & Điểm kích hoạt Vỗ cánh:** Sải cánh ngoài, mặt tam giác (`E11..E16`) và chạc đuôi (`E17..E18`) mở rõ (`~25%–28%`); các cá thể dẫn đầu (`id=0, 1`) vừa chạm ngưỡng bắt đầu chu kỳ vỗ cánh (`m_i > 0.55`). | 
| **`100.85s`**  *(Beat C → D)* | `M = 0.69777`  `S = 1.00000` | **`0.6853 – 0.6978`**  *(Rep 0/1/2: `0.6967 / 0.6976 / 0.6893`)* | `1.000 – 1.000` | `1.000 – 1.000` | **`0.736 – 0.777`** | **`0.028 – 0.051`** | **`wTraj: 0.825–0.853`**  **`wFlap: 0.336–0.384`** | **Bắt đầu Beat D (The Flight):** Cánh ngoài đã mở `~76%`, các cá thể đã nhập `~85%` vào quỹ đạo đội hình và đang đập cánh rõ rệt (`wFlap ~ 36%`), bắt đầu rút chân cột sáng vào đuôi (`u4 > 0`). | 
| **`102.00s`**  *(Prototype KF 4)* | `M = 0.99155`  `S = 0.84375` | **`0.9912 – 0.9916`**  *(Rep 0/1/2: `0.9915 / 0.9915 / 0.9913`)* | `1.000 – 1.000` | `1.000 – 1.000` | `1.000 – 1.000` | **`0.998 – 0.998`** | **`wTraj: 1.000`**  **`wFlap: 1.000`** | **Hoàn thiện tại Keyframe Chuẩn `102.00s`:** Cả 18 cạnh giải phẫu của 3 họ chim đạt `100%` biên độ thiết kế, vỗ cánh toàn phần và phóng vệt `Flight Trail` dài `[0.278s, 0.416s]` phía sau đuôi. | 
| **`102.20s – 108.00s`** | `M = 1.00000`  `S: 0.784 → 0.0` | **`1.0000 – 1.0000`** | `1.000 – 1.000` | `1.000 – 1.000` | `1.000 – 1.000` | `1.000 – 1.000` | `wTraj: 1.000`  `wFlap: 1.000` | **Khóa 100% Hình thái & Bay Liên tục sang `PHASE 05 // HORIZON` (`108.00s`).** | 

### C.3. Master Table 16 Cá Thể — Không Trùng Lặp Phân Nhóm (`R3`)

Mỗi `birdId` từ `0` đến `15` được gán duy nhất **một `familyId`** và **một `flockRole` cố định** (`3 Vanguard + 9 Core + 4 Outlier = 16 cá thể`). Cá thể `birdId = 6` thuộc cố định nhóm **`Core`** (vị trí sườn trái của đàn chính `targetPosition = [-2.95, 3.60, 13.5]` với biên độ lượn sóng ngang `±0.32m` trên quỹ đạo, không đổi nhóm sang Outlier):

| `birdId` | `familyId` *(3 Họ Hình Thái)* | `flockRole` *(3V + 9C + 4O = 16)* | `zRel` Đích (`m`) | `targetPosition` `[dX, Y, zRel]` (`m`, tương đối với `camX, camZ`) | `delaySec` (`s`) & `startMorph` (`R2`) | `speedMultiplier` (`∈ [0.88, 1.14]`) | `maxTrailHistorySec` tại `M=1` (`s`, `R5`) | `pitchBaseDeg` (`°`, `R6`) | `bankBaseDeg` Có Dấu (`°`, `R6`) | `accentColor` | 
| ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | 
| **`0`** *(Proto 1)* | `albatross-glider` | **`Vanguard`** | `8.40` | `[-1.25, 3.35, 8.40]` | `0.1308s` (`0.003661`) | `0.970` | `0.328s` | `+16.4°` | **`+12.6°`** *(Nghiêng phải)* | `#FF6324` | 
| **`1`** *(Proto 2)* | `swept-delta-swift` | **`Vanguard`** | `9.40` | `[+1.35, 3.50, 9.40]` | `0.0440s` (`0.000421`) | `1.059` | `0.376s` | `+18.8°` | **`-12.0°`** *(Nghiêng trái)* | `#EAEAEA` | 
| **`2`** *(Proto 3)* | `angular-falcon-scout` | **`Core`** | `11.20` | `[-1.95, 3.10, 11.20]` | `0.3649s` (`0.027260`) | `0.912` | `0.297s` | `+14.9°` | **`+12.3°`** *(Nghiêng phải)* | `#EAEAEA` | 
| **`3`** | `albatross-glider` | **`Core`** | `12.80` | `[-2.55, 3.95, 12.80]` | `0.3875s` (`0.030608`) | `0.930` | `0.307s` | `+15.4°` | **`-15.6°`** *(Đối trọng trái)* | `#EAEAEA` | 
| **`4`** | `swept-delta-swift` | **`Vanguard`** | `10.10` | `[+0.72, 3.85, 10.10]` | `0.4439s` (`0.039727`) | `1.124` | `0.411s` | `+20.6°` | **`-15.6°`** *(Nghiêng trái)* | `#FF6324` | 
| **`5`** | `angular-falcon-scout` | **`Core`** | `11.60` | `[+1.85, 3.25, 11.60]` | `0.1228s` (`0.003231`) | `0.910` | `0.296s` | `+14.8°` | **`-16.0°`** *(Nghiêng trái)* | `#EAEAEA` | 
| **`6`** | `albatross-glider` | **`Core`** | `13.50` | `[-2.95, 3.60, 13.50]` | `0.2060s` (`0.008954`) | `0.970` | `0.328s` | `+16.4°` | **`-10.3°`** *(Đối trọng trái)* | `#EAEAEA` | 
| **`7`** | `swept-delta-swift` | **`Core`** | `12.40` | `[+2.45, 4.10, 12.40]` | `0.2098s` (`0.009281`) | `1.073` | `0.384s` | `+19.2°` | **`-18.2°`** *(Nghiêng trái)* | `#EAEAEA` | 
| **`8`** | `angular-falcon-scout` | **`Core`** | `14.20` | `[-1.10, 4.35, 14.20]` | `0.1010s` (`0.002195`) | `1.003` | `0.346s` | `+17.3°` | **`+13.0°`** *(Nghiêng phải)* | `#FF6324` | 
| **`9`** | `albatross-glider` | **`Core`** | `14.80` | `[+1.15, 4.50, 14.80]` | `0.0430s` (`0.000402`) | `0.905` | `0.293s` | `+14.7°` | **`-11.3°`** *(Nghiêng trái)* | `#EAEAEA` | 
| **`10`** | `swept-delta-swift` | **`Core`** | `15.30` | `[-2.15, 4.65, 15.30]` | `0.3173s` (`0.020801`) | `1.104` | `0.401s` | `+20.0°` | **`-17.1°`** *(Đối trọng trái)* | `#EAEAEA` | 
| **`11`** | `angular-falcon-scout` | **`Core`** | `15.60` | `[+2.85, 3.75, 15.60]` | `0.4073s` (`0.033686`) | `1.089` | `0.393s` | `+19.6°` | **`-16.5°`** *(Nghiêng trái)* | `#EAEAEA` | 
| **`12`** | `albatross-glider` | **`Outlier`** | `17.40` | `[-1.65, 5.05, 17.40]` | `0.0302s` (`0.000199`) | `0.936` | `0.310s` | `+15.5°` | **`+15.7°`** *(Nghiêng phải)* | `#FF6324` | 
| **`13`** | `swept-delta-swift` | **`Outlier`** | `18.60` | `[+1.75, 5.20, 18.60]` | `0.2272s` (`0.010849`) | `0.907` | `0.295s` | `+14.7°` | **`+10.9°`** *(Đối trọng phải)* | `#EAEAEA` | 
| **`14`** | `angular-falcon-scout` | **`Outlier`** | `9.80` | `[-3.85, 3.40, 9.80]` | `0.0025s` (`0.000001`) | `0.918` | `0.300s` | `+15.0°` | **`+14.6°`** *(Nghiêng phải)* | `#EAEAEA` | 
| **`15`** | `albatross-glider` | **`Outlier`** | `13.90` | `[+3.95, 4.20, 13.90]` | `0.1073s` (`0.002474`) | `1.052` | `0.373s` | `+18.6°` | **`-11.3°`** *(Nghiêng trái)* | `#EAEAEA` | 

*Kiểm tổng phân nhóm:*

* **`Vanguard` (`3` cá thể):** `birdId ∈ {0, 1, 4}` (`zRel ∈ [8.4m, 10.1m]`)

* **`Core` (`9` cá thể):** `birdId ∈ {2, 3, 5, 6, 7, 8, 9, 10, 11}` (`zRel ∈ [11.2m, 15.6m]`)

* **`Outlier` (`4` cá thể):** `birdId ∈ {12, 13, 14, 15}` (`birdId = 14, 15` tách biên rộng sườn trái/phải; `birdId = 12, 13` bay tầm cao hậu cảnh `zRel ∈ [17.4m, 18.6m]`)

* **Tổng cộng:** `3 + 9 + 4 = 16` cá thể duy nhất, bao phủ đủ `birdId = 0..15`.

### C.4. Quy tắc Pitch, Signed Bank & Tách Biệt Sự Kiện Rời Cột Sáng / Sự Kiện Vỗ Cánh (`R6`)

1. **Phân biệt Tường minh `Pitch` (Góc ngóc đầu) và `Bank` (Góc nghiêng thân/cánh có dấu):**

   * **`Pitch` (`pitchRad_i ∈ [0.2443, 0.4189] rad`** $\equiv [14.0^\circ, 24.0^\circ]$**):**
     Là góc quay quanh trục ngang cục bộ `local X` hướng mũi `pNose` chếch lên trên theo hướng bay leo dốc:
     

     $$
     \text{pitchBaseRad}_i = \text{lerp}(0.2443,\; 0.3665,\; h_2) + 0.0524 \cdot \text{birdClimb}(t)
     $$

     $$
     \text{pitchRad}_i(t) = u_1 \cdot \left(\text{pitchBaseRad}_i - 0.045 \cdot w_{\text{flap},i} \cdot \cos(\tilde{\psi}_i)\right)
     $$

   * **`Bank` (`bankAngleRangeRad: [-0.3840, +0.3840] rad`** $\equiv [-22.0^\circ, +22.0^\circ]$**, Độ lớn cơ sở `bankMagnitudeRangeRad: [0.1745, 0.3840] rad`** $\equiv [10.0^\circ, 22.0^\circ]$**):**
     Là góc quay có dấu quanh trục dọc thân `local Z` (nghiêng cánh phải xuống `+` hoặc nghiêng cánh trái xuống `-`).

   * **Chính sách Hướng nghiêng (`bankDirectionPolicy: "counter-flank-inward-with-4-counter-bankers"`):**
     Để đàn chim không bao giờ nghiêng máy móc về cùng một phía, dấu nghiêng cơ sở `bankSign_i` được quy định theo vị trí sườn thung lũng kết hợp 4 cá thể đối trọng (`counter-bankers`):

     * Nhóm nghiêng phải (`bankSign = +1`, `6` cá thể: `id ∈ {0, 2, 8, 12, 13, 14}`): Gồm các cá thể sườn trái nghiêng hướng vào tâm thung lũng và cá thể trinh sát `id = 13`.

     * Nhóm nghiêng trái (`bankSign = -1`, `10` cá thể: `id ∈ {1, 3, 4, 5, 6, 7, 9, 10, 11, 15}`): Gồm các cá thể sườn phải nghiêng hướng vào tâm thung lũng và 3 cá thể sườn trái tách làn (`id = 3, 6, 10`).

     * Công thức góc `bankRad_i(t)` tại thời điểm $t$:
       

       $$
       \text{bankRad}_i(t) = \text{clamp}\!\left(\text{bankBaseRad}_i + 0.065 \cdot \sin\!\left(lt \cdot (1.1 + 0.3 h_1) + i \cdot 1.9\right),\; -0.3840,\; +0.3840\right) \cdot u_3
       $$

2. **Tách biệt Hai Sự kiện Động học (`Trajectory Departure` vs. `Wing Flap Initiation`):**

   * **Sự kiện 1 — Rời vị trí Cột sáng & Nhập quỹ đạo bay (`wTraj`):** Khởi phát tại **`localMorph = 0.22`** (`t ≈ 99.63s`, ngay khi sống lưng vừa gập xong và vai bắt đầu nhú) theo hàm $w_{\text{traj},i} = \text{smoothstep}(0.22, 0.85, m_i)$. Trong giai đoạn $m_i \in [0.22, 0.55]$, cấu trúc ánh sáng rời vị trí neo trên vách núi và **trượt lướt (glide) vào đội hình** trong khi đôi cánh đang duỗi mở.

   * **Sự kiện 2 — Bắt đầu Chu kỳ Vỗ cánh (`wFlap`):** Chỉ khởi phát tại **`localMorph = 0.55`** (`t ≈ 100.48s – 100.62s`, sau khi khung cánh ngoài `Stage III` đã bung đủ độ cứng cấu trúc) theo hàm $w_{\text{flap},i} = \text{smoothstep}(0.55, 0.90, m_i)$. Nhờ đó, tại thời điểm mở đầu **Beat D (`t = 100.85s`, `globalMorph = 0.6978`)**, cả 16 cá thể đã ở trạng thái đang vỗ cánh rõ rệt (`wFlap ∈ [33.6%, 38.4%]`) và đạt `100%` biên độ vỗ cánh ở `t = 101.48s` (`localMorph >= 0.90`).

### C.5. World-Space Primary Formation & Bounded Screen-Space Separation Policy (`R4`)

1. **Quỹ đạo World-Space là Nguồn Chuyển động Chính (`Primary Formation Authority`):**

   * Vị trí thế giới $\mathbf{P}_{\text{world},i}(t) = (wx_i(t), wy_i(t), wz_i(t))$ của cá thể $i$ tại thời điểm $t$ được xác định bởi phép nội suy mượt theo trọng số $w_{\text{traj},i}(t) = \text{smoothstep}(0.22, 0.85, m_i(t))$ từ tọa độ cột sáng của evaluator sang quỹ đạo đội hình 3D trong Bảng Master `R3`:
     

     $$
     wz_{\text{target},i}(t) = \text{camZ}(t) + \text{lerp}\!\left(b.\text{zRel}(t),\; \text{targetZRel}_i,\; 0.72 \cdot w_{\text{traj},i}(t)\right)
     $$

     $$
     wx_{\text{target},i}(t) = \text{camX}(t) + \text{targetX}_i \cdot (1.0 + 0.16 \cdot \text{birdClimb}(t)) + 0.28 \cdot \sin\!\left(lt \cdot 0.95 \cdot \text{speedMult}_i + i \cdot 2.17\right)
     $$

     $$
     wy_{\text{target},i}(t) = \text{targetY}_i + \text{birdClimb}(t) \cdot (2.4 + (i \bmod 4) \cdot 0.45) + 0.18 \cdot \cos\!\left(lt \cdot 1.25 \cdot \text{speedMult}_i + i \cdot 1.63\right) + 0.14 \cdot \text{low}(t) \cdot m_i(t)
     $$

     $$
     \mathbf{P}_{\text{world},i}(t) = \text{lerp}\!\left(b.\text{position}(t),\; \mathbf{P}_{\text{target},i}(t),\; w_{\text{traj},i}(t)\right)
     $$

2. **Định nghĩa Chính xác `halfWingSpanPx` và `fullWingSpanPx`:**

   * Gọi `halfWingSpanPx_i` là **bán sải cánh chiếu 2D trên màn hình** (khoảng cách pixel từ tâm sống lưng `pCrest` tới đầu mút cánh xa nhất):
     

     $$
     \text{halfWingSpanPx}_i = \max\!\left(\|\text{proj}(\text{pTipL}_i) - \text{proj}(\text{pCrest}_i)\|_2,\; \|\text{proj}(\text{pTipR}_i) - \text{proj}(\text{pCrest}_i)\|_2\right)
     $$

     
     và `fullWingSpanPx_i = 2.0 * halfWingSpanPx_i` là toàn bộ sải cánh.

   * Bán kính khoảng thở elip giữa hai cá thể $(a, c)$ được tính từ **tổng hai bán sải cánh (`halfWingSpanPx_a + halfWingSpanPx_c`)** (tương đương nửa tổng toàn sải cánh):
     

     $$
     R_x(a, c) = 1.08 \cdot \left(\text{halfWingSpanPx}_a + \text{halfWingSpanPx}_c\right), \qquad R_y(a, c) = 1.15 \cdot \left(\text{halfBodyHeightPx}_a + \text{halfBodyHeightPx}_c\right)
     $$

3. **Screen-Space Separation là Lớp Hiệu Chỉnh Nhỏ Có Giới Hạn (`Bounded Soft Correction`):**

   * Chỉ thực hiện **2 vòng lặp hiệu chỉnh nhẹ** (`relaxationIterations = 2`, hệ số đẩy mềm `stiffness = 0.22`) cho các cặp có $d_{\text{norm}} < 1.0$ và $|\Delta z_{\text{Rel}}| < 4.5\text{m}$.

   * **Giới hạn dịch chuyển tối đa (`Max Displacement Cap`):** Tổng vector hiệu chỉnh thế giới $\Delta \mathbf{p}_{\text{sep},i}(t)$ của mỗi cá thể bị kẹp chặt trong quả cầu bán kính **`maxSeparationDisplacementMeters = 0.32m`** (tương đương tối đa `~24 px` ở `1080p`), không bao giờ phá vỡ cấu trúc đội hình.

   * **Ràng buộc Vùng An toàn (`Safe-Zone Hard Clamp`):** Sau hiệu chỉnh, độ cao thế giới `wy_i` được kẹp sao cho tọa độ màn hình `screenY_i` luôn nằm trong **`[0.14 * H, 0.54 * H]`**, tuyệt đối không đẩy bất kỳ cá thể nào vào vùng HUD trên (`< 0.09 * H`) hoặc vùng Lyrics dưới (`> 0.74 * H`).

### C.6. Công thức Chuẩn Hóa `Flight Trail` Theo Lịch Sử Quỹ Đạo Thực (`R5`)

1. **Công thức Thời gian Lịch sử Chuẩn hóa (`trailHistorySec ∈ [0.28s, 0.42s]` tại `birdMorph = 1.0`):**
   Với `speedVar = speedMultiplier_i ∈ [0.88, 1.14]`:

   ```
   const speedNorm = clamp((speedVar - 0.88) / (1.14 - 0.88), 0.0, 1.0);
   const trailHistorySec = (0.28 + 0.14 * speedNorm) * birdMorph(t);
   
   ```

   * Khi `speedVar = 0.88` $\implies \text{speedNorm} = 0.0 \implies \text{trailHistorySec} = 0.280\text{s} \cdot \text{birdMorph}(t)$.

   * Khi `speedVar = 1.14` $\implies \text{speedNorm} = 1.0 \implies \text{trailHistorySec} = 0.420\text{s} \cdot \text{birdMorph}(t)$.

2. **Đánh giá Quỹ đạo Thực bằng Cùng Một Hàm Đóng (Zero Mutable History Buffer & Zero Separation Seam):**

   * Với mỗi điểm nút $k \in \{0, \dots, 9\}$ ($u = k/9 \in [0, 1]$), thời điểm quá khứ là $\tau_k = t - u \cdot \text{trailHistorySec}$.

   * Gọi cùng hàm đóng `evaluateBirdWorldTailRoot(birdId, τ_k, audio)` để lấy tọa độ thế giới 3D thực tế của đỉnh gốc đuôi `pTailRoot` tại thời điểm $\tau_k$, sau đó cộng phần suy hao mượt của độ dịch chuyển separation hiện tại $(1 - u)^2 \cdot \Delta \mathbf{p}_{\text{sep},i}(t)$ và chiếu qua **ma trận camera hiện tại tại thời điểm** $t$ (`project3D_at_t`):
     

     $$
     \mathbf{W}_{\text{trail},i}(t, u) = \mathbf{P}_{\text{tailRoot,world},i}\!\left(t - u \cdot \text{trailHistorySec}\right) + (1 - u)^2 \cdot \Delta \mathbf{p}_{\text{sep},i}(t)
     $$

   * **4 Bảo đảm Kỹ thuật:**

     1. Tại $u = 0$ ($\tau_0 = t$), $(1 - 0)^2 = 1 \implies \mathbf{W}_{\text{trail},i}(t, 0)$ **trùng khít tuyệt đối (`0.0 px` sai lệch) với đỉnh `pTailRoot` hiện tại của cá thể**.

     2. Khi cá thể đang rẽ ngang, nghiêng cánh hoặc nâng độ cao, $\mathbf{W}_{\text{trail},i}(t, u)$ **uốn cong chính xác theo quỹ đạo 3D thực tế trong quá khứ**, không ép thành đường thẳng dọc `-Z`.

     3. Vì vận tốc tiến dọc trục `+Z` của cá thể luôn dương ($dz/dt > 6.5\text{ m/s}$) và `pTailRoot` là điểm cực sau của thân, toàn bộ các điểm $u > 0$ có $Z(\tau_k) < Z(t)$ nằm phía sau đuôi, không cắt qua silhouette thân/cánh của chính cá thể đó.

     4. Không lưu bất kỳ mảng lịch sử khả biến (`mutable ring buffer`) nào giữa các frame: render tiến, render lùi hay nhảy ngẫu nhiên (`random-access`) tới bất kỳ timestamp $t$ nào đều cho kết quả `Flight Trail` giống hệt nhau 100%.

## D. SHOT SPECIFICATION ĐỒNG BỘ (`PL6-BIRD-FORMATION` — REVISED v1.1)

```
{
  "shotId": "PL6-BIRD-FORMATION",
  "specRevision": "1.1.0",
  "parentSceneId": "canyon",
  "plateCode": "PL. VI",
  "timeRange": {
    "startSec": 96.00,
    "endSec": 102.00,
    "durationSec": 6.00,
    "continuityCheckSec": 108.00,
    "prototypeInspectionKeyframesSec": [99.50, 100.35, 100.50, 102.00],
    "localTimeRangeSec": [12.35, 18.35],
    "sceneProgressRange": [0.375951, 0.558600]
  },
  "narrativePurpose": "Chuyển hóa hình thái (Morphogenesis) đúng tại câu điệp khúc 'Thay cho tiếng còi bằng chim hót vang đó đây': 16 cột sáng đo đạc vô tri trong hẻm núi tự uốn trục sống lưng, kết tụ mũi dẫn hướng, tách khớp vai hình thoi và mở sải cánh wireframe 2 tầng để trở thành một đàn sinh vật ánh sáng bay về chân trời tự do.",
  "visualEvent": "Continuous 4-stage topological metamorphosis of 16 vertical light streaks into 3 distinct families of 13-vertex / 18-edge 3D articulated wireframe birds with closed-form historical flight trails.",
  "focalSubject": {
    "subjectId": "pl6-wireframe-flock",
    "entityCount": 16,
    "prototypeRepresentativeIds": [0, 1, 2],
    "accentIndices": [0, 4, 8, 12],
    "baseColorHex": "#EAEAEA",
    "accentColorHex": "#FF6324",
    "wakeColorHex": "#96969B"
  },
  "composition": {
    "vanishingPointAnchor": [0.50, 0.44],
    "flockVerticalSafeBandNorm": [0.14, 0.54],
    "lyricsProtectedBandNorm": [0.74, 0.96],
    "hudProtectedTopBandNorm": [0.00, 0.09],
    "depthLayersMeters": {
      "vanguardLeadersZRel": [8.4, 10.1],
      "coreSquadronZRel": [11.2, 15.6],
      "outliersZRel": [9.8, 18.6]
    },
    "separationPolicy": {
      "primaryAuthority": "deterministic-world-space-trajectories",
      "screenSpaceCorrectionEnabled": true,
      "wingSpanMetric": "halfWingSpanPx (center pCrest to outer pTip)",
      "relaxationIterations": 2,
      "softStiffness": 0.22,
      "minHorizontalHalfSpanMultiplier": 1.08,
      "minVerticalHalfHeightMultiplier": 1.15,
      "maxDisplacementMeters": 0.32,
      "enforceSafeBandClamp": true,
      "trailAttachmentDecayPower": 2.0
    }
  },
  "morphology": {
    "topologyId": "unified-13vertex-18edge-wireframe",
    "vertexCount": 13,
    "edgeCount": 18,
    "vertices": [
      "pNose", "pCrest", "pTailRoot",
      "pShoulderL", "pShoulderR",
      "pWristL", "pWristR",
      "pTipL", "pTipR",
      "pRearWingL", "pRearWingR",
      "pTailForkL", "pTailForkR"
    ],
    "edges": [
      { "edgeId": "E01", "from": "pNose", "to": "pCrest", "group": "dorsal-spine", "activeMorphRange": [0.00, 1.00] },
      { "edgeId": "E02", "from": "pCrest", "to": "pTailRoot", "group": "dorsal-spine", "activeMorphRange": [0.00, 1.00] },
      { "edgeId": "E03", "from": "pNose", "to": "pShoulderL", "group": "shoulder-diamond", "activeMorphRange": [0.18, 0.28] },
      { "edgeId": "E04", "from": "pNose", "to": "pShoulderR", "group": "shoulder-diamond", "activeMorphRange": [0.18, 0.28] },
      { "edgeId": "E05", "from": "pShoulderL", "to": "pTailRoot", "group": "shoulder-diamond", "activeMorphRange": [0.18, 0.30] },
      { "edgeId": "E06", "from": "pShoulderR", "to": "pTailRoot", "group": "shoulder-diamond", "activeMorphRange": [0.18, 0.30] },
      { "edgeId": "E07", "from": "pShoulderL", "to": "pWristL", "group": "inner-carpal-wing", "activeMorphRange": [0.18, 0.26] },
      { "edgeId": "E08", "from": "pShoulderR", "to": "pWristR", "group": "inner-carpal-wing", "activeMorphRange": [0.18, 0.26] },
      { "edgeId": "E09", "from": "pWristL", "to": "pTipL", "group": "outer-primary-wing", "activeMorphRange": [0.42, 0.50] },
      { "edgeId": "E10", "from": "pWristR", "to": "pTipR", "group": "outer-primary-wing", "activeMorphRange": [0.42, 0.50] },
      { "edgeId": "E11", "from": "pTipL", "to": "pRearWingL", "group": "wing-trailing-truss", "activeMorphRange": [0.45, 0.58] },
      { "edgeId": "E12", "from": "pTipR", "to": "pRearWingR", "group": "wing-trailing-truss", "activeMorphRange": [0.45, 0.58] },
      { "edgeId": "E13", "from": "pRearWingL", "to": "pTailRoot", "group": "wing-trailing-truss", "activeMorphRange": [0.45, 0.58] },
      { "edgeId": "E14", "from": "pRearWingR", "to": "pTailRoot", "group": "wing-trailing-truss", "activeMorphRange": [0.45, 0.58] },
      { "edgeId": "E15", "from": "pWristL", "to": "pRearWingL", "group": "wing-trailing-truss", "activeMorphRange": [0.48, 0.62] },
      { "edgeId": "E16", "from": "pWristR", "to": "pRearWingR", "group": "wing-trailing-truss", "activeMorphRange": [0.48, 0.62] },
      { "edgeId": "E17", "from": "pTailRoot", "to": "pTailForkL", "group": "swept-forked-tail", "activeMorphRange": [0.46, 0.60] },
      { "edgeId": "E18", "from": "pTailRoot", "to": "pTailForkR", "group": "swept-forked-tail", "activeMorphRange": [0.46, 0.60] }
    ],
    "morphSubStages": [
      { "stage": "1-spine-bend-and-nose-ignition", "localMorphWindow": [0.00, 0.25] },
      { "stage": "2-shoulder-diamond-and-carpal-bud", "localMorphWindow": [0.18, 0.50] },
      { "stage": "3-primary-wing-unfurl-and-truss", "localMorphWindow": [0.42, 0.82] },
      { "stage": "4-streak-basal-stem-absorption", "localMorphWindow": [0.65, 1.00] }
    ],
    "families": [
      {
        "familyId": "albatross-glider",
        "birdIds": [0, 3, 6, 9, 12, 15],
        "wingspanRange": [1.48, 1.62],
        "innerWingRatio": 0.37,
        "tipSweepZ": -0.46,
        "noseLengthZ": 0.88,
        "tailForkSpreadX": 0.16,
        "flapFreqMultiplier": 0.84,
        "bankBias": 0.90
      },
      {
        "familyId": "swept-delta-swift",
        "birdIds": [1, 4, 7, 10, 13],
        "wingspanRange": [1.18, 1.32],
        "innerWingRatio": 0.39,
        "tipSweepZ": -0.68,
        "noseLengthZ": 0.78,
        "tailForkSpreadX": 0.25,
        "flapFreqMultiplier": 1.02,
        "bankBias": 1.00
      },
      {
        "familyId": "angular-falcon-scout",
        "birdIds": [2, 5, 8, 11, 14],
        "wingspanRange": [0.94, 1.08],
        "innerWingRatio": 0.41,
        "tipSweepZ": -0.34,
        "noseLengthZ": 0.94,
        "tailForkSpreadX": 0.14,
        "flapFreqMultiplier": 1.18,
        "bankBias": 1.15
      }
    ]
  },
  "motionStates": {
    "staggerFormula": "delaySec = 0.48 * hashInt01(birdId * 37 + 11); startMorph = birdMorph(98.50 + delaySec); localMorph = clamp((M - startMorph) / (1 - startMorph), 0, 1)",
    "trajectoryDepartureLocalMorphWindow": [0.22, 0.85],
    "wingFlapActivationLocalMorphWindow": [0.55, 0.90],
    "beatA_TheSignal": { "tSec": [96.00, 98.50], "globalMorph": [0.00000, 0.00000], "localMorphMinMax": [0.0000, 0.0000], "streakPresence": [1.00000, 1.00000] },
    "beatB_TheBending": { "tSec": [98.50, 99.65], "globalMorph": [0.00000, 0.22976], "localMorphMinMaxAtEnd": [0.1979, 0.2298], "streakPresence": [1.00000, 1.00000] },
    "beatC_TheFormation": { "tSec": [99.65, 100.85], "globalMorph": [0.22976, 0.69777], "localMorphMinMaxAtEnd": [0.6853, 0.6978], "streakPresence": [1.00000, 1.00000] },
    "beatD_TheFlight": { "tSec": [100.85, 101.65], "globalMorph": [0.69777, 0.94028], "localMorphMinMaxAtEnd": [0.9378, 0.9403], "streakPresence": [1.00000, 0.92936] },
    "beatE_TheHandoff": { "tSec": [101.65, 102.00], "globalMorph": [0.94028, 0.99155], "localMorphMinMaxAtEnd": [0.9912, 0.9916], "streakPresence": [0.92936, 0.84375] },
    "wingKinematics": {
      "globalFreqScale": 0.68,
      "downstrokeAsymmetrySkew": 0.28,
      "outerTipPhaseLagRad": 0.68,
      "intermittentGlideDepth": 0.42
    },
    "flightTrails": {
      "mode": "closed-form-historical-tailroot-evaluation",
      "formula": "speedNorm = (speedVar - 0.88) / (1.14 - 0.88); trailHistorySec = (0.28 + 0.14 * speedNorm) * birdMorph(t)",
      "historyHorizonSecRangeAtFullMorph": [0.28, 0.42],
      "segmentCount": 9,
      "falloffPower": 1.85
    }
  },
  "individualVariations": {
    "seedPolicy": "deterministic-hashInt01-by-birdId (prime=37, salt=11)",
    "maxInitiationDelaySec": 0.48,
    "wingspanJitterPct": 0.08,
    "scaleRange": [0.68, 1.28],
    "speedMultiplierRange": [0.88, 1.14],
    "pitchRangeRad": [0.2443, 0.4189],
    "pitchRangeDeg": [14.0, 24.0],
    "bankMagnitudeRangeRad": [0.1745, 0.3840],
    "bankAngleRangeRad": [-0.3840, 0.3840],
    "bankAngleRangeDeg": [-22.0, 22.0],
    "bankDirectionPolicy": "counter-flank-inward-with-4-counter-bankers (positive starboardIds=[0,2,8,12,13,14], negative portIds=[1,3,4,5,6,7,9,10,11,15])"
  },
  "cameraRelationship": {
    "evaluatorCameraLocked": true,
    "fovProgressionDeg": [57.1111, 66.0000],
    "rollProgressionRad": [0.0011, -0.0549, -0.0424],
    "parallaxPolicy": "independent-3d-world-velocity-relative-to-camera-and-contours"
  },
  "audioBindings": {
    "primaryMorphDriver": "birdMorph(t) [time-driven smoothstep(98.50, 102.20, t)]",
    "lowBand": { "target": "flockThermalLiftY", "gain": 0.14, "maxDisplacementMeters": 0.14 },
    "rmsBand": { "target": "contourValleyTurbulenceAndSignalTail", "gain": 0.75 },
    "highBand": { "target": "wingPhaseSubtleModAndWakeLuminance", "wingPhaseGain": 1.8, "wakeAlphaGain": 0.12 }
  },
  "transitionIn": {
    "atSec": 96.00,
    "state": "16 single-coverage vertical light streaks anchored in PHASE 03 // FLY THROUGH canyon walls (birdMorph = 0.0, localMorph = 0.0, streakPresence = 1.0, activeEdges = [E01, E02, basalStem])"
  },
  "transitionOut": {
    "atSec": 102.00,
    "state": "16 articulated 13-vertex / 18-edge 3D wireframe birds in 3-role flock formation (birdMorph = 0.99155, localMorph ∈ [0.9912, 0.9916], streakPresence = 0.84375), continuing seamlessly into PHASE 05 // HORIZON (108.00s)"
  },
  "continuityConstraints": [
    "evaluatePL6(t) in @mv-engine/scene must remain 100% unmodified (0.0 mathematical parity with prototype).",
    "No changes to @mv-engine/contracts, @mv-engine/core, @mv-engine/audio, or @mv-engine/scene.",
    "At t <= 98.50s, localMorph === 0.0 for all 16 birds; at t >= 102.20s, localMorph === 1.0 for all 16 birds.",
    "Zero mutable frame-to-frame state buffers; 100% random-access and worker-thread deterministic."
  ],
  "acceptanceCriteria": [
    "AC-1 (Zero Overdraw at m=0): At t = 96.00s..98.50s, only E01, E02, and basalStem are emitted with zero overlapping segments and zero unintended luminance multiplication.",
    "AC-2 (4-Keyframe Prototype Verification on 3 Representatives id=0,1,2): At 99.50s (Stage I spine bend u1 ∈ [68.6%, 80.5%], u2=0), 100.35s (Stage II complete u2 ~ 100%, Stage III outer wing initiation u3 ∈ [7.3%, 10.3%], gliding wTraj ~ 40%, wFlap=0), 100.50s (Stage III outer wing unfurl u3 ∈ [24.3%, 28.3%], flap initiation wFlap > 0), and 102.00s (100% 13-vertex/18-edge bird + historical trail), visual progression is unmistakable at 1080p.",
    "AC-3 (Anti-Flat-V Body-to-Span Ratio): At t = 102.00s and 108.00s, projected 2D body-axis length ||pNose - pTailRoot||_2 / ||pTipL - pTipR||_2 >= 0.22 for at least 12/16 birds.",
    "AC-4 (Quantitative Overlap & Safe-Zone Metrics): Across [96.00s, 108.00s], pairs with 2D bounding-box IoU > 0.05 <= 1 per frame (0 on benchmark keyframes), max pairwise overlap ratio < 8.0%, max separation displacement <= 0.32m, and 0 safe-zone violations (screenY strictly within [0.09H, 0.74H]).",
    "AC-5 (True Historical Flight Trail): At u=0, trail attaches with 0.0px error to pTailRoot; trail tangent matches historical 3D velocity (< 5 deg error); 0 self-silhouette intersections; 100% bit-identical across forward, reverse, and random-access evaluation."
  ]
}

```

## E. IMPLEMENTATION MAPPING (Ánh xạ Thực thi — Giới hạn Nghiêm ngặt trong `@mv-engine/renderer-webgl`)

Tuân thủ Mục 3 của yêu cầu hiệu đính: **không mở rộng `@mv-engine/contracts`, `@mv-engine/scene`, `@mv-engine/core` hay `@mv-engine/audio`**. Toàn bộ cấu hình hình thái (`FLOCK_MORPHOLOGY_CONFIG` và bảng 16 cá thể) được đặt làm hằng số cấu hình nội bộ có kiểu dữ liệu tường minh (`Readonly<FlockMorphologyRendererConfig>`) bên trong `packages/renderer-webgl/src/index.ts`:

| Thành phần trong `packages/renderer-webgl/src/index.ts` | Chức năng & Công thức Thực thi (Sau khi Duyệt) | Giai đoạn Triển khai | 
| ----- | ----- | ----- | 
| **`FLOCK_MASTER_TABLE` (`16` entries) & `computeLocalMorph(tSec, birdId)`** | Lưu bảng 16 cá thể (`R3`) và tính `localMorph` theo đúng công thức thời gian thực `R2` (`delaySec = 0.48 * hashInt01(id * 37 + 11)`), trả về `{ localMorph, u1, u2, u3, u4, wTraj, wFlap }`. | **Bước 1 (Prototype 3 cá thể `id = 0, 1, 2`)** → Mở rộng 16 cá thể ở Bước 2. | 
| **`evaluateBirdWorldPoseAt(birdId, queryTimeSec, st, audio)`** | Hàm đóng thuần túy (pure closed-form function) tính vị trí thế giới $\mathbf{P}_{\text{world},i}(\tau)$, hướng `(yaw, pitch, bank)` (`R6`), và 13 đỉnh cục bộ `V00..V12` (`R1`) tại bất kỳ thời điểm $\tau$ nào (dùng cho cả thời điểm hiện tại $\tau = t$ lẫn 9 điểm lịch sử $\tau_k = t - u \cdot \text{trailHistorySec}$ của `Flight Trail` `R5`). | **Bước 1 & Bước 2.** | 
| **`applyBoundedScreenSeparation(activeBirds, W, H, s)`** | Thực thi 2 vòng lặp hiệu chỉnh nhẹ dựa trên `halfWingSpanPx` (`R4`), kẹp chặt $\|\Delta \mathbf{p}_{\text{sep},i}\|_2 \le 0.32\text{$ và `screenY ∈ [0.14H, 0.54H]`, đồng thời xuất telemetry kiểm chứng overlap (`overlappingPairCount`, `maxPairOverlapRatio`, `maxSeparationDisplacementMeters`). | **Bước 2 (Khi bật đủ 16 cá thể).** | 
| **`emitUnified13Vertex18EdgeBird(birdPose, project3D, pushSegment)`** | Duyệt đúng 18 cạnh `E01..E18` (`R1`) với cổng độ mờ `edgeAlpha(m_i)` (loại bỏ mọi cạnh có `alpha <= 0.005` để chống chồng nét ở `m = 0`), vẽ đoạn gốc `basalStreakStem` co rút theo $1 - u_4$, và vẽ 9 đoạn `Flight Trail` nối từ `pTailRoot` theo lịch sử thực `R5`. | **Bước 1 & Bước 2.** | 

## F. SELF-CRITIQUE & TIÊU CHÍ KIỂM CHỨNG ĐỊNH LƯỢNG (ĐÃ CẬP NHẬT ĐỒNG BỘ `R1` – `R6`)

### 1. Nguy cơ 1: Hình thái vẫn giống các ký hiệu chữ V phẳng (`Flat V-Chevron Syndrome`)

* **Cơ chế khóa trong đặc tả v1.1 (`R1` & `R6`):**

  * Đồ thị `13-Vertex / 18-Edge` tách biệt rõ **trục thân 6 cạnh (`E01..E06`) + chạc đuôi 2 cạnh (`E17..E18`)** khỏi **cánh 2 tầng 10 cạnh (`E07..E16`)**.

  * Cấu hình có thẩm quyền khóa chặt `pitchRangeRad: [0.2443, 0.4189]` (`[14.0°, 24.0°]`) và `bankAngleRangeRad: [-0.3840, +0.3840]` (`[-22.0°, +22.0°]`) với `6` cá thể nghiêng phải và `10` cá thể nghiêng trái (`bankDirectionPolicy`), giúp mặt phẳng thân và mặt phẳng cánh luôn có độ mở khối 3D rõ rệt trước ống kính.

* **Tiêu chí Kiểm chứng Định lượng (`AC-3`):**

  * Tỷ lệ chiều dài trục thân chiếu 2D chia cho toàn sải cánh chiếu 2D $\frac{\|\text{proj}(\text{pNose}) - \text{proj}(\text{pTailRoot})\|_2}{\text{fullWingSpanPx}} \ge 0.22$ trên cả 3 cá thể đại diện (`id = 0, 1, 2`) tại `102.00s` và trên tối thiểu `12/16` cá thể khi mở rộng toàn đàn.

### 2. Nguy cơ 2: Đàn chim thiếu cá tính hoặc biến hình/vỗ cánh đồng bộ (`Synchronized Clone Army Syndrome`)

* **Cơ chế khóa trong đặc tả v1.1 (`R2`, `R3`, `R6`):**

  * Theo công thức stagger thời gian thực `R2`, thời điểm khởi phát trải từ `98.5025s` (`id = 14`) đến `98.9439s` (`id = 4`).

  * Tại `t = 98.80s`, 11 cá thể đã bước vào Stage I (`u1 > 0`) trong khi 5 cá thể vẫn là cột sáng thẳng đứng (`localMorph = 0`). Tại `t = 99.20s` và `99.50s`, cả 16 cá thể đều ở trong Stage I nhưng có độ uốn sống lưng phân hóa rộng (`u1 ∈ [13.0%, 31.7%]` tại `99.20s` và `u1 ∈ [62.3%, 80.7%]` tại `99.50s`). Tại `t = 100.50s`, các cá thể dẫn đầu (`id = 0, 1`) vừa bắt đầu kích hoạt chu kỳ vỗ cánh (`wFlap > 0`) trong khi nhóm trễ (`id = 2, 3, 4, 10, 11`) vẫn đang căng cánh mở khung Stage III (`wFlap = 0`).

* **Tiêu chí Kiểm chứng Định lượng (`AC-2`):**

  * Kiểm chứng trực tiếp trên 4 keyframe của Prototype 3 cá thể (`99.50s`, `100.35s`, `100.50s`, `102.00s`): mỗi keyframe phải thể hiện đúng trạng thái giải phẫu định lượng trong Bảng `C.2`, và độ lệch chuẩn pha cánh giữa các cá thể đang bay đạt $\sigma(\tilde{\psi}_i) > 0.35\text{ rad}$.

### 3. Nguy cơ 3: Chồng lấn rối nét hoặc lệch quỹ đạo `Flight Trail` (`Overlap & Trail Disconnect Syndrome`)

* **Cơ chế khóa trong đặc tả v1.1 (`R4` & `R5`):**

  * Đội hình được định hình chính bởi tọa độ 3D trong Bảng Master `R3`, kết hợp hiệu chỉnh mềm giới hạn $\|\Delta \mathbf{p}_{\text{sep},i}\|_2 \le 0.32\text{m}$ dựa trên `halfWingSpanPx` và suy hao $(1 - u)^2$ dọc theo `Flight Trail` lịch sử thực $\mathbf{P}_{\text{tailRoot,world},i}(t - u \cdot \text{trailHistorySec})$.

* **Tiêu chí Kiểm chứng Định lượng (`AC-4` & `AC-5`):**

  * Báo cáo tự động từ script render kiểm chứng:

    1. `overlappingPairCount` ($\text{IoU}_{2D} > 0.05$): $\le 1$ **cặp/frame** (`0` cặp tại các keyframe chuẩn).

    2. `maxPairOverlapRatio`: **`< 8.0%`** (`0` frame vượt ngưỡng `8.0%`).

    3. `maxSeparationDisplacementMeters`: **`<= 0.32m`**.

    4. `safeZoneViolationCount`: **`0` lần** xâm phạm `screenY < 0.09H` hoặc `screenY > 0.74H`.

    5. Sai số điểm nối `Flight Trail` tại $u = 0$ so với `pTailRoot`: **`0.0 px`**.

## G. KẾ HOẠCH CỔNG PHÊ DUYỆT TIẾP THEO (TWO-STEP PROTOTYPE GATE PLAN)

Ngay sau khi bản đặc tả v1.1 này được phê duyệt, quá trình triển khai sẽ tuân thủ nghiêm ngặt **2 bước có cổng kiểm soát**:

1. **Bước 1 — Prototype Giới hạn 3 Cá thể Đại diện (`id = 0` Albatross Glider `#FF6324`, `id = 1` Swept Delta Swift `#EAEAEA`, `id = 2` Angular Falcon Scout `#EAEAEA`):**

   * Chỉ bật 3 cá thể đại diện (`id ∈ {0, 1, 2}`) trong `WebGL2SpatialRenderer` và render kiểm tra tại đúng **4 keyframe**:

     * **`t = 99.50s`:** Kiểm tra Stage I (`u1 = 79.2%, 80.5%, 68.6%`, `u2 = 0`) — cột sáng uốn cong thành sống lưng và tụ mũi `pNose`.

     * **`t = 100.35s`:** Kiểm tra hoàn tất Stage II (`u2 ≈ 100%`) & khởi phát Stage III (`u3 = 10.0%, 10.3%, 7.3%`) — khung vai hình thoi, cánh trong đã mở, đầu cánh ngoài bắt đầu nhú, đang trượt lướt (`wTraj ≈ 40%`, `wFlap = 0`).

     * **`t = 100.50s`:** Kiểm tra giữa Stage III (`u3 = 27.9%, 28.3%, 24.3%`) & khởi phát vỗ cánh (`wFlap > 0` ở `id = 0, 1`).

     * **`t = 102.00s`:** Kiểm tra hình thái hoàn chỉnh `13-Vertex / 18-Edge` của cả 3 họ hình thái ở `1080p` kèm `Flight Trail` lịch sử thực.

2. **Bước 2 — Mở rộng Toàn đàn 16 Cá thể (`[96.00s, 108.00s]`):**

   * Chỉ thực hiện sau khi hình thái của 3 cá thể đại diện ở Bước 1 đạt yêu cầu thẩm mỹ và kỹ thuật.

## H. REVISION LOG (Nhật ký Chỉnh sửa v1.0 → v1.1)

| Mã Yêu cầu | Nội dung Mâu thuẫn ở Bản v1.0 | Nội dung Đã Chỉnh sửa & Đồng bộ ở Bản v1.1 | Lý do Kỹ thuật & Nghệ thuật | 
| ----- | ----- | ----- | ----- | 
| **`R1`** | Gọi tên topology là `11-Vertex / 14-Segment` nhưng mảng JSON liệt kê `13` đỉnh; chưa định nghĩa mảng `edges[]` tường minh và chưa có quy tắc chống chồng nét khi các đỉnh chập làm một ở `m = 0`. | Chuẩn hóa tên và cấu trúc thành **`13-Vertex / 18-Edge` (`unified-13vertex-18edge-wireframe`)** xuyên suốt sơ đồ, bảng giải phẫu, JSON và Implementation Mapping. Khai báo đầy đủ `vertices[0..12]` và `edges[E01..E18]`. Bổ sung cổng `edgeAlpha(m_i)` để tại `m = 0` chỉ bật `E01`, `E02` và `basalStem` nối tiếp không giao nhau (`0%` overdraw). | Đảm bảo nguồn sự thật duy nhất (Single Source of Truth) và ngăn hiện tượng nhân đôi độ dày/độ sáng cột sáng ở Beat A. | 
| **`R2`** | Dùng `sigma_i` trong miền morph nhưng diễn giải như giây thực, dẫn tới mô tả sai tại `99.20s` (`M = 0.09383 < 0.18` nhưng lại viết đã có cá thể vào Stage II). | Thay bằng công thức stagger thời gian thực: `delaySec = 0.48 * hashInt01(birdId * 37 + 11)`, `startMorph = birdMorph(98.50 + delaySec)`, `localMorph = clamp((M - startMorph)/(1 - startMorph), 0, 1)`. Tính lại toàn bộ bảng giá trị tại `98.80s, 99.20s, 99.50s, 99.65s, 100.35s, 100.50s, 100.85s, 102.00s, 102.20s` và cập nhật Storyboard + Self-Critique + Acceptance Criteria. | Bảo đảm tính chính xác toán học 100%: không cá thể nào biến hình trước `98.50s`, tất cả đạt `1.0` tại `102.20s`, hoàn toàn deterministic và random-access safe. | 
| **`R3`** | Cá thể `id = 6` vừa nằm trong danh sách `Core Squadron` vừa bị nhắc tên trong mô tả vị trí nhóm `Outliers`. | Lập **Bảng Master 16 Cá thể duy nhất (`Mục C.3`)** với đầy đủ 8 trường bắt buộc. Khóa `id = 6` cố định thuộc `Core` (`3 Vanguard + 9 Core + 4 Outlier = 16`). Mọi dao động ngang của `id = 6` được mô tả là biên độ quỹ đạo, không đổi vai trò. | Xóa bỏ hoàn toàn sự nhập nhằng phân nhóm khi ánh xạ vào dữ liệu cấu hình renderer. | 
| **`R4`** | Tuyên bố 3 vòng relaxation bảo đảm tuyệt đối `100%` không giao cắt; chưa làm rõ `wingSpanPx` là toàn sải cánh hay bán sải cánh; nguy cơ đẩy cá thể lệch khỏi đầu `Flight Trail` hoặc vào vùng Lyrics/HUD. | Xác lập World-Space Trajectory là nguồn chính; định nghĩa rõ `halfWingSpanPx` (từ `pCrest` tới `pTip`); giới hạn separation thành lớp hiệu chỉnh mềm 2 vòng với $\|\Delta \mathbf{p}_{\text{sep}}\|_2 \le 0.32\text{$, kẹp vùng an toàn `screenY ∈ [0.14H, 0.54H]`, và suy hao $$(1-u)$ dọc theo trail. Thay tuyên bố tuyệt đối bằng 5 chỉ số kiểm chứng định lượng (`AC-4`). | Giữ đội hình tự nhiên, có khoảng thở mà không bị tán xạ cơ học hay làm đứt gãy gốc `Flight Trail`. | 
| **`R5`** | Công thức `(0.28 + 0.14 * speedVar) * birdMorph(t)` cho ra `[0.403, 0.440]` thay vì `[0.28, 0.42]` khi `speedVar ∈ [0.88, 1.14]`; một số chỗ còn mô tả trail kéo theo `-Z`. | Chuẩn hóa `speedNorm = (speedVar - 0.88) / (1.14 - 0.88)` và `trailHistorySec = (0.28 + 0.14 * speedNorm) * birdMorph(t)`. Khẳng định trail đánh giá từ hàm đóng $\mathbf{P}_{\text{tailRoot,world},i}(t - u \cdot \text{trailHistorySec})$ rồi chiếu qua camera hiện tại. | Đảm bảo khoảng thời gian lịch sử đúng `[0.28s, 0.42s]` ở `M = 1.0`, trail uốn theo đúng đường bay 3D thực tế và random-access safe 100%. | 
| **`R6`** | Thiếu `pitchRangeRad` và `bankDirectionPolicy` trong JSON; chưa khớp mô tả `bankRoll ∈ [10°, 22°]` với `[-0.32, 0.32]`; thời điểm bắt đầu vỗ cánh (`m_i = 0.75`) lệch với đầu Beat D (`M = 0.6978`). | Bổ sung `pitchRangeRad: [0.2443, 0.4189]` (`[14°, 24°]`), `bankMagnitudeRangeRad: [0.1745, 0.3840]` (`[10°, 22°]`), `bankAngleRangeRad: [-0.3840, +0.3840]` (`[-22°, +22°]`), và `bankDirectionPolicy` (`6` nghiêng phải / `10` nghiêng trái). Tách rõ **Sự kiện 1: Rời cột sáng (`m_i ∈ [0.22, 0.85]`)** và **Sự kiện 2: Bắt đầu vỗ cánh (`m_i ∈ [0.55, 0.90]`)**. | Đồng bộ hoàn toàn thông số góc giữa văn bản và JSON; giúp cá thể lướt vào quỹ đạo trước (`m_i > 0.22`) rồi mới đập cánh (`m_i > 0.55`), đạt `~36%` biên độ vỗ ngay khi mở Beat D (`100.85s`). | 
