# VISUAL DIRECTION & ANIMATION AUTHORING SPECIFICATION
## Shot `PL6-BIRD-FORMATION` (`[96.00s, 102.00s]` + Continuity Verification at `108.00s`)
**Project:** `"Nơi Ta Đến"` — `PL. VI: CHÂN TRỜI MỞ RỘNG // THE RAY OF FREEDOM` (`[83.65s, 116.50s)`)  
**Workflow Stage:** `Visual Thesis → Storyboard → Animation Guide → Shot Specification → [HUMAN APPROVAL GATE]`  
**Engine Baseline Inspected:** `@mv-engine/contracts`, `@mv-engine/scene` (`SpatialContourValleyEvaluator`), `@mv-engine/renderer-webgl` (`WebGL2SpatialRenderer`, `LineBatch`), `@mv-engine/audio` (`DeterministicAudioEngine`)

---

## A. VISUAL DIRECTION STATEMENT (Tuyên ngôn Đạo diễn Thị giác)

Trong 12 giây đầu của `PL. VI` (`83.65s – 96.00s`), thung lũng đường đồng mức (`contour valley`) là một kiến trúc địa hình thuần túy kỷ hà: 44 lát cắt ngang uốn lượn theo sóng âm và 16 vệt sáng thẳng đứng (`vertical light streaks`) dựng lên hai bên vách hẻm núi như những cột mốc đo đạc không gian vô tri. Nếu ở giây `98.50s`, 16 cột sáng ấy chỉ đơn thuần mờ đi để 16 ký hiệu hình chữ V hiện đè lên, khoảnh khắc quan trọng nhất của bài hát — khi câu hát *"Thay cho tiếng còi bằng chim hót vang đó đây"* vang lên — sẽ chỉ là một thủ thuật thay thế đồ họa (mesh swap), không tạo ra sự giải phóng cảm xúc.

**Ý niệm trung tâm của Shot `PL6-BIRD-FORMATION` (`96.00s – 102.00s`) là sự thức tỉnh hình thái (Morphogenesis): một cấu trúc ánh sáng kỷ hà tự uốn cong, tự phân nhánh và tìm ra cơ học sự sống của chính nó.** Người xem phải chứng kiến từng sợi ánh sáng thẳng đứng vốn đang bị khóa chặt theo phương trọng lực (`+Y`) bắt đầu chịu lực hút của chân trời phía trước (`+Z`): đỉnh vệt sáng kết tụ thành mũi dẫn hướng (head apex), trục dọc uốn cong thành sống lưng (dorsal keel), năng lượng từ tâm trục tách đôi sang hai bên thành khớp vai và sải cánh gấp khúc hai tầng (inner carpal & outer primary wings), trước khi phần đuôi tách nhánh và phóng vệt quỹ đạo bay vào không gian. Khi 16 cá thể hoàn tất quá trình tự kiến tạo ở `102.00s`, chúng không còn là những vạch sáng tĩnh gắn vào vách đá, mà đã trở thành một đàn sinh vật wireframe trừu tượng có trọng lượng khí động học, có nhịp thở bất đối xứng và có ý chí bay về phía chân trời tự do.

---

## B. STORYBOARD — 5 NHỊP HÀNH ĐỘNG LIÊN TỤC (`[96.00s, 102.00s]` & Kiểm chứng `108.00s`)

Toàn bộ 5 nhịp hành động (Beats A → E) được ánh xạ **trực tiếp trên đường cong chuẩn `birdMorph(t) = smoothstep(98.50, 102.20, t)` và `streakPresence(t) = smoothstep(86.50, 90.00, t) * (1.0 - smoothstep(101.00, 105.00, t))` đã khóa trong `SpatialContourValleyEvaluator`** — tuyệt đối không thay đổi công thức evaluator hay cắt cảnh:

| Beat & Tên nhịp | Khoảng thời gian `t` (`lt = t - 83.65s`) | Giá trị `birdMorph(t)` & `streakPresence(t)` | Lời bài hát & Bối cảnh Âm nhạc (`LyricsData` & `AudioData`) | Diễn tiến Hình thái & Hành động Chủ thể (16 Cá thể) | Bố cục Không gian & Quan hệ với Camera (`FOV`, `Roll`, `CamPos`) | Mục đích Thị giác (Visual Intent) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Beat A**<br>**The Signal**<br>*(Tín hiệu Tĩnh trong Hẻm núi)* | **`96.00s – 98.50s`**<br>(`lt: 12.35s – 14.85s`)<br>*(2.50 giây)* | `birdMorph`: **`0.00000`**<br>`streakPresence`: **`1.00000`** | Kết câu *"Nơi ta đến nơi tự do..."* (`96.0s`), câu bè vàng `#FFB84D` *"ECHO // (Ở nơi chẳng phải lo)"* (`96.5s – 98.0s`), mở đầu câu *"Thay cho tiếng còi..."* (`98.0s`). | 16 vệt sáng là các trục thẳng đứng thuần túy (`length = 2.2m * sc`) phân bố dọc hai vách thung lũng ở độ sâu `zRel ∈ [6.2m, 21.7m]`. Đỉnh mỗi vệt có điểm hạt nhân sáng (`4.4px` capsule cap). **Hoàn toàn chưa có bất kỳ nét cánh hay silhouette chữ V nào.** Trong nửa cuối Beat A (`97.8s – 98.5s`), phần ba trên của vệt sáng bắt đầu hơi nghiêng nhẹ về phía `+Z` do vận tốc tương đối của thung lũng. | Camera đang lao nhanh trong `PHASE 03 // FLY THROUGH` (`speedBoost = 1.25 → 1.44`), `FOV` mở rộng từ **`57.11°` (`96.0s`) lên `64.13°` (`98.5s`)**, camera nghiêng cánh trái (`roll: +0.0011 → -0.0441 rad`). 16 cột sáng tạo thành hàng cột kiến trúc dẫn mắt về phía lõi tín hiệu cam `#FF6324` ở tâm hẻm núi. | Khẳng định xuất phát điểm thuần túy hình học: 16 chủ thể vẫn thuộc về cấu trúc địa hình của thung lũng trước khi biến đổi. |
| **Beat B**<br>**The Bending & Spine Ignition**<br>*(Uốn trục & Phân tách Khớp vai)* | **`98.50s – 99.65s`**<br>(`lt: 14.85s – 16.00s`)<br>*(1.15 giây)* | `birdMorph`: **`0.00000 → 0.23150`**<br>*(Mốc `99.0s`: `0.04985`; `99.5s`: `0.17965`)*<br>`streakPresence`: **`1.00000`** | Chữ *"tiếng còi"* → *"bằng"* (`99.10s – 100.30s`). Tín hiệu thành thị ("tiếng còi") bắt đầu nhường chỗ cho thiên nhiên. | **Giai đoạn 1 của biến hình (`localMorph m_i ∈ [0.0, 0.30]`):** Do độ trễ pha cá thể hóa (`staggerOffset_i`), các cá thể tiền cảnh/dẫn đầu bắt đầu biến đổi trước: (1) Vệt sáng thẳng đứng uốn cong thành một cung parabol lao về phía `+Z`, thu ngắn chiều dài dọc từ `2.2m` xuống `1.3m` để cô đọng thành **trục sống lưng (`dorsal spine`)**; (2) Điểm sáng trên đỉnh trượt về phía mũi trước tạo thành **đầu mũi (`head apex`)**; (3) Từ điểm `1/3` thân phía trước, hai tia sáng tách ra khỏi trục chính tạo thành **khung vai hình thoi (`shoulder diamond`)** và **khớp cổ tay cánh trong (`inner carpal wrist`)** đang khép gọn. | `FOV` đạt **`64.13° → 65.88°`**, camera đạt độ nghiêng cực đại (`roll = -0.0538 rad`). Các vệt sáng không biến mất mà **chính sợi dây sáng đang gập lại trong không gian 3D**, tạo cảm giác lực căng cơ học trước khi bung cánh. | Tạo khoảnh khắc "chuyển pha vật chất": người xem thấy rõ trục thẳng đứng uốn thành trục thân ngang và nảy mầm hai khớp vai. |
| **Beat C**<br>**The Formation**<br>*(Triển khai Cấu trúc Cánh 2 Tầng)* | **`99.65s – 100.85s`**<br>(`lt: 16.00s – 17.20s`)<br>*(1.20 giây)* | `birdMorph`: **`0.23150 → 0.69760`**<br>*(Mốc `100.0s`: `0.35980`; `100.35s`: `0.50000`; `100.5s`: `0.56068`)*<br>`streakPresence`: **`1.00000`** | Chữ *"bằng"* → *"chim"* (`100.30s – 101.45s`). Đúng tại từ **"chim"**, cấu trúc cánh mở ra rõ rệt. | **Giai đoạn 2 của biến hình (`localMorph m_i ∈ [0.30, 0.75]`):** Thứ tự hình thành có cấu trúc 3 bước nối tiếp: (1) **Cánh trong (`shoulder → wrist`)** bung rộng sang hai bên theo góc dihedral dương; (2) Từ khớp `wrist`, **cánh ngoài (`wrist → primary tip`)** trượt dài ra theo góc vuốt ngược (`sweep-back`) đặc trưng của từng họ hình thái, đồng thời thanh giằng mép sau (`trailing-edge spar: tip → rearWingNode → tailRoot`) khép kín tạo thành **mặt phẳng cánh tam giác wireframe**; (3) Phần đuôi tách thành **chạc đuôi chữ V (`tailForkL / tailForkR`)** trong khi phần dư của vệt sáng dọc ban đầu co rút dần về phía đuôi để chuyển hóa thành vệt quỹ đạo bay (`flight wake`). | Chuyển sang `PHASE 04 // THE BIRDS` tại `100.00s`. `FOV` chạm đỉnh **`66.00°`** và giữ ổn định; camera bắt đầu đảo chiều lượn sang phải (`camX: -0.09m → +0.34m`). Sự mở rộng FOV đúng lúc sải cánh bung ra làm tăng cảm giác giải phóng không gian. | Chứng minh quá trình kiến tạo hình thái có thứ tự giải phẫu học (`Thân → Cánh trong → Cánh ngoài & Mặt cánh → Chạc đuôi`), tuyệt đối không nhảy cóc. |
| **Beat D**<br>**The Living Flock**<br>*(Nhịp đập Bất đối xứng & Tách đàn)* | **`100.85s – 101.65s`**<br>(`lt: 17.20s – 18.00s`)<br>*(0.80 giây)* | `birdMorph`: **`0.69760 → 0.94120`**<br>*(Mốc `101.0s`: `0.75267`; `101.5s`: `0.90617`)*<br>`streakPresence`: **`1.00000 → 0.92200`** | Chữ *"chim"* → *"hót"* (`100.86s – 101.99s`). Năng lượng `high` và `mid` của giọng hát ở cao trào điệp khúc. | **Giai đoạn 3 (`localMorph m_i ∈ [0.75, 0.95]`):** Cánh bắt đầu chu kỳ vỗ khí động học đầu tiên với **nhịp bất đối xứng** (downstroke dứt khoát nâng thân chim lên nhẹ, upstroke thu khớp cổ tay mềm mại có độ trễ pha giữa cánh trong và đầu cánh ngoài). Đồng thời, 16 cá thể rời khỏi tọa độ hàng cột cứng nhắc trên vách núi, trượt theo vector vận tốc riêng vào **3 tầng độ sâu của đội hình bất đối xứng** (Dẫn đầu, Đàn chính, Cá thể tách biên), nghiêng mình (`bank roll`) theo hướng rẽ của thung lũng. | Camera lượn qua trục giữa (`camX: +0.34m → +0.72m`, `roll: -0.053 → -0.046 rad`). 16 cá thể có vận tốc tiến (`+Z`) và vận tốc ngang/dọc riêng nên cắt qua các đường đồng mức nền với thị sai (parallax) rõ rệt. | Chuyển từ "biến hình hình học" sang "hành vi sinh học trừu tượng": mỗi cá thể có sải cánh, góc nghiêng, nhịp vỗ và đường bay riêng. |
| **Beat E**<br>**The Handoff**<br>*(Hoàn thiện Hình thái & Phóng về Chân trời)* | **`101.65s – 102.00s`**<br>*(Kiểm chứng tiếp nối tới `108.00s`)* | Tại `102.00s`:<br>`birdMorph`: **`0.99155`**<br>`streakPresence`: **`0.84375`**<br>Tại `108.00s`:<br>`birdMorph`: **`1.00000`**<br>`streakPresence`: **`0.00000`** | Chữ *"vang"* bắt đầu tại `101.998s` (`0.4%` wipe tại `102.00s`) → *"vang đó đây"* (`102.0s – 103.8s`) → `108.0s` (*"Sáng sớm thức giấc dậy..."*). | Tại `102.00s` (`birdMorph = 0.99155`), 16 cá thể đã đạt `99.2%` hình thái hoàn chỉnh; `streakPresence = 0.84375` không còn vẽ một thanh dọc xuyên qua thân chim nữa mà đã **hòa nhập hoàn toàn vào luồng sáng thoát ra ở chạc đuôi (`wake filament`)**, rồi tan hẳn về `0.0` ở `105.00s`. Từ `102.00s` sang `108.00s`, đàn chim giữ nguyên cấu trúc giải phẫu wireframe sắc nét, mở rộng đội hình theo độ mở của hẻm núi (`corridorWidth: 2.20m → 2.26m`) và bay hướng vào vùng sáng chân trời cam `#FF6324` (`horizon.intensity: 0.3225 → 0.9613`). | Tại `102.00s`, đàn chim chiếm vùng không gian `Y ∈ [18%..52% H]`, hoàn toàn thông thoáng phía trên lõi tín hiệu cam (`vpY = 44% H`) và cách xa vùng chữ Karaoke (`Y = 82% H`). Động lượng tiến và nâng độ cao tiếp diễn mượt mà sang `PHASE 05 // HORIZON` (`108.00s`). | Đảm bảo tại keyframe chuẩn `102.00s` hình thái chim đạt độ tinh xảo cao nhất, đồng thời chuyển giao động lượng liền mạch sang `108.00s` mà không khựng hay đổi mô hình. |

---

## C. ANIMATION GUIDE — QUY LUẬT HÌNH THÁI, BIẾN HÌNH & CHUYỂN ĐỘNG

### C.1. Bird Morphology (Giải phẫu Wireframe Trừu tượng & Luật Tiến hóa Liên tục từ Vệt sáng)

Để xóa bỏ hoàn toàn cảm giác "hình chữ V lặp lại" hoặc "tắt vệt sáng bật hình chim", mỗi cá thể được định nghĩa bằng một **Đồ thị Khung dây Giải phẫu 3D Thống nhất (Unified 11-Vertex / 14-Segment Topological Wireframe Graph)** tồn tại xuyên suốt từ `birdMorph = 0.0` đến `birdMorph = 1.0`.

#### 1. Cấu trúc 11 Đỉnh (Vertices) trong Hệ tọa độ Cục bộ 3D `(lx, ly, lz)` của từng cá thể
Hệ trục cục bộ của chim: **`+Z` là hướng bay tới trước (Head/Flight Vector)**, **`+Y` là hướng lưng lên trên (Dorsal Up)**, **`+X` là hướng sải cánh phải (Starboard Right)**:

```
                     pNose (0, +zNose) [Đỉnh Đầu / Mũi Dẫn Hướng]
                       /   |   \
                      /    |    \
         pShoulderL (-xSh) |     pShoulderR (+xSh) [Khớp Vai Trái / Phải]
            /      \       |       /      \
   [Cánh Trong]     \    pCrest   /     [Cánh Trong]
          /          \  (Sống lưng)        \
     pWristL          \    |    /          pWristR [Khớp Cổ Tay / Carpal Joint]
      /    \           \   |   /           /    \
 [Cánh Ngoài]\          \  |  /           / [Cánh Ngoài]
    /         \          \ | /           /        \
 pTipL ---- pRearWingL -- pTailRoot -- pRearWingR ---- pTipR [Đầu Cánh Chính & Giằng Sau]
                          /     \
                   pTailForkL   pTailForkR [Chạc Đuôi Định Hướng Bay]
```

| Nhóm Giải phẫu | Ký hiệu Đỉnh / Cạnh | Vai trò Hình thái & Nhận diện Silhouette ở `1080p` | Độ dày nét (`LineBatch` Width) & Độ sáng |
| :--- | :--- | :--- | :--- |
| **1. Trục Thân & Hướng Đầu**<br>*(Body Axis & Heading)* | `pNose` → `pCrest` → `pTailRoot` + khung thoi `pNose ↔ pShoulderL/R ↔ pTailRoot` | Tạo thành một **thân hình thoi có sống lưng nổi khối 3D (tetrahedral keel)**. Đỉnh `pNose` nhô rõ về phía trước (`+Z`) và hơi chếch lên theo góc ngóc đầu (`pitch`), giúp mắt người nhận ra ngay đâu là đầu, đâu là thân, và chim đang lao về hướng nào. | Sống lưng & Mũi: **`1.75 * s`** (`100%` `bAlpha`)<br>Cạnh bên thân: **`1.15 * s`** (`88%` `bAlpha`) |
| **2. Khớp Nối Vai & Cánh Trong**<br>*(Inner Carpal Wing)* | `pShoulderL → pWristL` và `pShoulderR → pWristR` | Xuất phát từ hai đỉnh vai `pShoulderL/R` (không mọc trực tiếp từ 1 điểm trùng với mũi), nâng lên theo góc dihedral dương về phía khớp cổ tay `pWristL/R`. Tạo độ mở ngực và chiều dày cơ học cho gốc cánh. | Nét dẫn đầu (Leading edge): **`2.10 * s`** ở tiền cảnh (`zRel < 13.5m`), **`1.38 * s`** ở hậu cảnh (`100%` `bAlpha`) |
| **3. Đường Viền Cánh Ngoài & Nhánh Giằng Mặt Cánh**<br>*(Outer Primary Wing & Structural Facet)* | Mép trước: `pWristL → pTipL`, `pWristR → pTipR`<br>Mép sau: `pTipL → pRearWingL → pTailRoot` và nhánh chéo `pWristL → pRearWingL` *(tương tự bên phải)* | Thay vì 1 nét đơn mảnh mai dễ trông giống chữ V, mỗi bên cánh là một **khung tam giác kép (triangulated wing truss)** gồm mép cánh trước dày sắc nét và mép cánh sau mảnh hơn nối qua điểm giằng `pRearWingL/R`. Khi nhìn nghiêng trong không gian 3D, diện tích mặt cánh hiện lên rõ ràng mà vẫn thuần túy wireframe. | Mép trước ngoài: **`1.85 * s` / `1.25 * s`** (`95%` `bAlpha`)<br>Mép sau & thanh giằng: **`0.95 * s` / `0.78 * s`** (`72%` `bAlpha`) |
| **4. Đuôi & Hướng Phóng Quỹ Đạo**<br>*(Swept Split Tail)* | `pTailRoot → pTailForkL` và `pTailRoot → pTailForkR` | Hai nhánh đuôi tách chữ V ngược phía sau `pTailRoot`, định hình rõ chiều dài cơ thể (head-to-tail axis) và là điểm neo vật lý nơi vệt quỹ đạo (`flight trail`) phóng ra. | **`1.15 * s`** (`88%` `bAlpha`) |

#### 2. Quy luật Biến hình Liên tục 4 Giai đoạn (Unified Topological Morphogenesis — Không Mesh Swap)
Gọi $m_i(t) \in [0, 1]$ là tiến trình biến hình cục bộ của cá thể $i$, được dẫn xuất trực tiếp từ `b.morph = birdMorph(t)` có bù độ trễ pha cá thể $\Delta m_i \in [-0.08, +0.08]$:
$$m_i(t) = \text{clamp}\!\left(\frac{\text{birdMorph}(t) - \sigma_i}{1 - |\sigma_i|},\; 0.0,\; 1.0\right), \quad \sigma_i \in [0.0,\; 0.14]$$

Thay vì vẽ `Vertical Streak` và `Bird` như hai vật thể rời nhau, **chính các đỉnh của vệt sáng phân tách thành 11 đỉnh của chim** theo 4 giai đoạn nối tiếp của $m_i$:

1. **Giai đoạn I — Uốn Trục & Tụ Đỉnh Đầu ($m_i \in [0.00, 0.25]$, tương ứng Beat B):**
   * Khi $m_i = 0$, cả 11 đỉnh của đồ thị nằm chập trên trục thẳng đứng của vệt sáng (`lx = 0`, `ly ∈ [-1.1, +1.1]`, `lz = 0`).
   * Khi $m_i$ tăng từ `0.00` lên `0.25` ($u_1 = \text{smoothstep}(0.0, 0.25, m_i)$):
     * Trục dọc xoay nghiêng về phía trước (`+Z`) một góc $\theta_{\text{bend}} = u_1 \cdot 74^\circ$, biến chiều cao thẳng đứng thành chiều dài trục thân (`pTailRoot` ở phía sau `-Z`, `pNose` vươn về phía trước `+Z`).
     * Hạt sáng đỉnh (`top cap`) của vệt sáng trượt thẳng về vị trí `pNose`, trở thành điểm dẫn hướng đầu chim.
2. **Giai đoạn II — Nảy Mầm Khớp Vai & Khung Thân ($m_i \in [0.18, 0.50]$, giao thoa Beat B → Beat C):**
   * Với $u_2 = \text{smoothstep}(0.18, 0.50, m_i)$:
     * Từ trục sống lưng, hai đỉnh vai `pShoulderL/R` tách sang hai bên (`±shoulderX * u_2`), đỉnh `pCrest` nâng lên (`+0.25 * u_2`), và hai khớp cổ tay `pWristL/R` vươn ra tới `100%` độ rộng cánh trong (`±innerSpan * u_2`).
     * Lúc này đầu cánh ngoài `pTipL/R` vẫn còn thu gọn sát khớp cổ tay (`pWristL/R`), tạo hình dáng một sinh vật ánh sáng đang mở khớp vai chuẩn bị tung cánh.
3. **Giai đoạn III — Bung Sải Cánh Ngoài & Khép Mặt Cánh Tam Giác ($m_i \in [0.42, 0.82]$, tương ứng Beat C):**
   * Với $u_3 = \text{smoothstep}(0.42, 0.82, m_i)$:
     * Hai đầu cánh chính `pTipL/R` duỗi bung từ `pWristL/R` ra toàn bộ sải cánh (`±span`) đồng thời vuốt ngược về phía sau (`tipSweepZ`), kéo căng hai thanh giằng `pRearWingL/R` và tách đôi chạc đuôi `pTailForkL/R`.
4. **Giai đoạn IV — Truyền Năng Lượng Vệt Sáng Dọc vào Đuôi Quỹ Đạo ($m_i \in [0.65, 1.00]$ & `streakPresence(t)`):**
   * Khi $m_i > 0.65$, phần cốt lõi của vệt sáng ban đầu không còn cắt ngang thân chim mà co điểm đầu về đúng `pTailRoot` (`syW` và `szW` hội tụ vào `pTailRoot`), nối tiếp liền mạch với vệt `Flight Trail` phía sau đuôi trước khi `streakPresence(t)` giảm dần từ `1.0` (`101.0s`) xuống `0.84375` (`102.0s`) và tắt hẳn ở `105.0s`.

---

### C.2. Individual Variation (3 Họ Hình Thái & Cá Thể Hóa 16 Cá Thể Deterministic)

Tuyệt đối không dùng `Math.random()`. Mọi thông số biến thể của cá thể $i \in \{0, 1, \dots, 15\}$ được tính tất định từ `birdId = i` thông qua hàm băm nguyên `hashInt01(i * prime + salt)` trong `@mv-engine/core` và phân vào **3 Họ Hình thái (Morphological Families)** dễ nhận biết bằng mắt thường:

| Họ Hình thái (Family) | Các Bird ID trực thuộc (`16` cá thể) | Đặc trưng Hình học & Khí động học | Thông số Cấu trúc Cơ sở (`Base Proportions`) |
| :--- | :--- | :--- | :--- |
| **Họ I: Albatross Glider**<br>*(Chim Lướt Sải Dài)* | `id ∈ {0, 3, 6, 9, 12, 15}`<br>*(6 cá thể — gồm 2 cá thể cam `#FF6324`: `id 0, 12`)* | Sải cánh rất rộng, tỷ lệ khung cánh mảnh (high aspect-ratio), khớp cổ tay nâng cao kiểu cánh hải âu, mũi dài thanh thoát, nhịp vỗ chậm và sâu, thiên về lướt gió. | `span`: `1.48 – 1.62`<br>`bodyLen`: `1.60 – 1.72`<br>`wingArch`: `+0.22` (cong vòm cao)<br>`flapFreqMult`: `0.84×`<br>`flapAmp`: `0.42` |
| **Họ II: Swept Delta Swift**<br>*(Chim Én Cánh Delta Vuốt Ngược)* | `id ∈ {1, 4, 7, 10, 13}`<br>*(5 cá thể — gồm 1 cá thể cam `#FF6324`: `id 4`)* | Cánh ngoài vuốt ngược sâu về phía sau (`tipSweepZ` âm lớn) tạo dáng mũi tên delta sắc gọn, bản cánh gần thân rộng, chạc đuôi chữ V tách rộng như đuôi én. | `span`: `1.18 – 1.32`<br>`bodyLen`: `1.40 – 1.52`<br>`tipSweepZ`: `-0.62 – -0.74`<br>`tailForkX`: `0.24 – 0.28`<br>`flapFreqMult`: `1.02×` |
| **Họ III: Angular Falcon Scout**<br>*(Chim Cắt Đột Kích Góc Cạnh)* | `id ∈ {2, 5, 8, 11, 14}`<br>*(5 cá thể — gồm 1 cá thể cam `#FF6324`: `id 8`)* | Sải cánh gọn và săn chắc, trục thân dài với sống lưng `pCrest` cao, góc nghiêng thân (`bankAngle`) lớn khi ôm cua trong thung lũng, nhịp vỗ cánh nhanh và dứt khoát. | `span`: `0.94 – 1.08`<br>`bodyLen`: `1.68 – 1.82`<br>`tipSweepZ`: `-0.30 – -0.40`<br>`bankBias`: `1.25×`<br>`flapFreqMult`: `1.18×` |

Ngoài sự khác biệt giữa 3 họ, mỗi cá thể $i$ còn có biến thiên riêng dựa trên $h_1 = \text{hashInt01}(i \cdot 37 + 11)$, $h_2 = \text{hashInt01}(i \cdot 73 + 29)$, $h_3 = \text{hashInt01}(i \cdot 109 + 53)$:
* **Biến thiên Sải cánh (`span_i`):** $\text{span}_{\text{family}} \cdot (0.92 + 0.16 \cdot h_1)$
* **Biến thiên Tỷ lệ Thân/Cánh (`bodyToWingRatio_i`):** $\text{ratio}_{\text{family}} \cdot (0.90 + 0.20 \cdot h_2)$
* **Biến thiên Độ trễ Khởi phát Biến hình (`staggerOffset_i`):** $\sigma_i = 0.13 \cdot h_3$ (tương đương độ lệch thời gian khởi phát `0.0s – 0.48s` trên cửa sổ `3.70s` của `birdMorph`, giúp các cá thể thức tỉnh nối tiếp nhau như hiệu ứng domino ánh sáng thay vì biến hình cùng một khắc).

---

### C.3. Wing Motion (Cơ học Vỗ Cánh Bất Đối Xứng & Độ Trễ Khớp Cánh Hai Tầng)

Trong tự nhiên cũng như trong điêu khắc động học (kinetic sculpture), chuyển động cánh chim không phải là hàm $\sin(\phi)$ đối xứng đơn điệu trên một thanh cứng:
1. **Nhịp Vỗ Bất Đối Xứng (Asymmetric Downstroke / Upstroke Shaping):**
   * Từ pha cơ sở `wPhase` của evaluator (`b.wingPhase = lt * (7.5 + (i % 3) * 1.2) + seed + high * 1.8`), ta điều biến tốc độ tần số theo họ hình thái (`flapFreqMult_i ∈ [0.84, 1.18]`, giảm nhẹ tần số tổng thể xuống `0.68×` để cánh đập đĩnh đạc, không bị rung nhiễu ở 60 FPS):
     $$\psi_i(t) = b.\text{wingPhase} \cdot 0.68 \cdot \text{flapFreqMult}_i + \phi_{0,i}$$
   * Áp dụng hàm uốn pha bất đối xứng (`asymmetric wave shaping` với hệ số skew $k = 0.28$):
     $$\tilde{\psi}_i = \psi_i + 0.28 \cdot \sin(\psi_i)$$
     Nhờ $\tilde{\psi}_i$, **nhịp đập xuống (`downstroke`, chiếm `~38%` chu kỳ) diễn ra mạnh và dứt khoát**, tạo lực nâng đẩy trục thân nhích lên (`bodyLift = -0.06 * cos(\tilde{\psi}_i)`), trong khi **nhịp nâng cánh lên (`upstroke`, chiếm `~62%` chu kỳ) diễn ra êm và thư thả**.
2. **Độ Trễ Pha Giữa Cánh Trong và Cánh Ngoài (Two-Stage Carpal-to-Primary Whip):**
   * **Cánh trong (`pWristL/R`)** dẫn nhịp trước:
     $$y_{\text{wrist}} = y_{0,\text{wrist}} + A_{\text{inner},i} \cdot \sin(\tilde{\psi}_i)$$
   * **Đầu cánh ngoài (`pTipL/R`)** trễ pha sau khớp cổ tay một góc $\Delta\phi_{\text{whip}} = 0.68\text{ rad}$ (`~39°`):
     $$y_{\text{tip}} = y_{\text{wrist}} + A_{\text{outer},i} \cdot \sin(\tilde{\psi}_i - 0.68)$$
   * Khi khớp cổ tay bắt đầu hạ xuống trong nhịp downstroke, đầu cánh ngoài vẫn còn hơi vểnh cao rồi mới quất xuống theo; khi khớp cổ tay nâng lên, đầu cánh ngoài rũ nhẹ xuống trước khi vươn lên. Chính độ trễ pha 2 khớp này xóa sạch cảm giác "hai que cứng gập lên gập xuống" và tạo ra đường cong chữ S mềm mại của sải cánh đang cưỡi gió.
3. **Chế độ Lướt Gió Xen Kẽ (Intermittent Glide Modulation):**
   * Mỗi cá thể có một chu kỳ lướt gió chậm `glideEnv_i(t) = 0.58 + 0.42 * sin(lt * (0.45 + 0.12 * h_1) + i * 2.3)`. Khi `glideEnv_i` xuống thấp (`0.58`), biên độ vỗ cánh thu nhỏ lại để cá thể **căng cánh lướt tĩnh trong luồng khí**, giúp đội hình luôn có những cá thể đang vỗ cánh xen lẫn những cá thể đang căng cánh lướt êm.

---

### C.4. Flock Behaviour (Tổ chức Đội hình 3 Lớp Chiều sâu, Phân vai & Chống Giao Cắt)

Đàn chim 16 cá thể không xếp thành một chữ V quân sự cứng nhắc mà được tổ chức thành **3 Phân đội Không gian Bất đối xứng (3 Asymmetric Spatial Echelons)** trải dọc chiều sâu `zRel ∈ [7.2m, 19.5m]`:

| Phân đội (Flock Role) | Số lượng & Bird ID | Độ sâu Tương đối `zRel` (`bz - camZ`) | Vị trí Không gian `(X, Y)` & Hành vi Đường bay |
| :--- | :--- | :---: | :--- |
| **1. Vanguard Leaders**<br>*(Tiên phong Dẫn hướng)* | **3 cá thể:**<br>`id = 0` (`#FF6324`), `id = 1`, `id = 4` (`#FF6324`) | **Lớp gần – trung tâm:**<br>`zRel ∈ [7.8m, 10.4m]`<br>*(Kích thước lớn nhất trên khung hình)* | Bay ở độ cao trung-cao (`Y ∈ [3.1m, 4.0m]`), lệch nhẹ sang hai bên trục tín hiệu cam (`X ∈ [-1.45m, +1.55m]`) để **không bao giờ đè lên lõi cầu sáng cam `#FF6324`**. Định hình hướng tiến chủ đạo của cả đàn. |
| **2. Core Squadron**<br>*(Đàn Chính Phân Tầng)* | **9 cá thể:**<br>`id ∈ {2, 3, 5, 6, 7, 8 (#FF6324), 9, 10, 11}` | **Lớp trung cảnh đa tầng:**<br>`zRel ∈ [10.8m, 15.8m]`<br>*(Kích thước trung bình)* | Phân bố thành hai dải sườn nghiêng bất đối xứng (5 cá thể bên sườn trái, 4 cá thể bên sườn phải) ở các cao độ lệch tầng nhau (`Y ∈ [2.8m, 4.9m]`), lượn sóng nhẹ theo độ mở của vách núi với vận tốc dọc trục `Z` nhanh chậm khác nhau (`speedVar_i ∈ [0.88, 1.14]`). |
| **3. Outliers & High Scouts**<br>*(Cá thể Tách biên & Trinh sát Cao độ)* | **4 cá thể:**<br>`id = 12` (`#FF6324`), `id = 13, 14, 15` | **Lớp ngoại vi & chiều sâu xa:**<br>`zRel ∈ [7.2m (sườn rộng), 16.5m – 19.2m (hậu cảnh)]` | `id = 6, 14` tách rộng ra gần sườn vách đồng mức (`|X| ∈ [3.4m, 4.2m]`) tạo chiều rộng bao quát cho khung hình `16:9`; trong khi `id = 12, 13, 15` bay cao hơn ở hậu cảnh (`Y ∈ [4.6m, 5.4m]`, `zRel > 15.5m`) hướng thẳng về phía vòm sáng chân trời. |

#### Luật Khử Giao Cắt / Chồng Lấn Không Chủ Đích (Deterministic Elliptical Separation Law)
Trong không gian chiếu phối cảnh, ngay cả khi 2 cá thể cách nhau theo trục `Z`, hình chiếu 2D của chúng trên màn hình vẫn có thể đè lên nhau làm rối nét wireframe. Do đó, sau khi nội suy vị trí từ tọa độ `b.position` của evaluator sang tọa độ đội hình theo trọng số $\text{smoothstep}(0.15, 0.85, \text{birdMorph}(t))$, tầng biểu diễn áp dụng **3 vòng lặp Tách Elliptical Tất định (3-Iteration Deterministic Screen-Space Separation)**:
* Với mọi cặp cá thể $(a, c)$ có `morph > 0.15`, khoảng cách tối thiểu được quy định bởi bán kính bao elip theo sải cánh chiếu:
  $$R_x(a, c) = 1.15 \cdot (\text{wingSpanPx}_a + \text{wingSpanPx}_c), \quad R_y(a, c) = 1.25 \cdot (\text{bodyHeightPx}_a + \text{bodyHeightPx}_c)$$
* Nếu khoảng cách chuẩn hóa $d_{\text{norm}} = \sqrt{(\Delta x / R_x)^2 + (\Delta y / R_y)^2} < 1.0$, hai cá thể được đẩy tách ra một cách trơn tru theo vector pháp tuyến ưu tiên phương ngang và phương cao độ (`±bx, ±by`), đảm bảo **100% sải cánh của 16 cá thể có khoảng thở độc lập trên màn hình**.
* Đồng thời, toàn bộ 16 cá thể được sắp xếp theo thứ tự chiều sâu giảm dần (`zRel` từ xa về gần — Painter's Algorithm) trước khi đưa vào `LineBatch`.

---

### C.5. Flight Trails (Quỹ Đạo Bay Thực Tế & Quy Luật Tan Mờ)

1. **Xuất phát từ Chuyển động Thực tế (True Kinematic History Evaluation — Không Dùng Sóng Sin Trang Trí):**
   * Trong code hiện tại (`packages/renderer-webgl/src/index.ts`, dòng `635`), vệt đuôi đang dùng công thức trang trí `wxTrail = bx + Math.sin(wu * 3.0 + b.id) * 0.22 * wu`, không phản ánh đường bay thực của chim.
   * Trong thiết kế mới, mỗi điểm nút thứ $k \in \{0, \dots, 9\}$ ($u = k/9 \in [0, 1]$) của vệt `Flight Trail` được tính bằng **vị trí lịch sử thực tế của gốc đuôi `pTailRoot` tại thời điểm lùi $\tau_k = t - u \cdot \Delta T_{\text{trail},i}$**:
     $$\mathbf{P}_{\text{trail},i}(t, u) = \mathbf{P}_{\text{tailRoot},i}\!\left(t - u \cdot \Delta T_{\text{trail},i}\right)$$
     trong đó $\Delta T_{\text{trail},i} = (0.28 + 0.14 \cdot \text{speedVar}_i) \cdot \text{birdMorph}(t)$ giây (`~0.28s – 0.42s` lịch sử quỹ đạo thực!).
   * Vì mọi hàm vị trí đều là hàm đóng tất định theo $t$, việc lấy mẫu $\mathbf{P}_{\text{tailRoot},i}(t - u \cdot \Delta T)$ tốn chi phí tính toán không đáng kể nhưng bảo đảm **vệt sáng phía sau trùng khớp 100% với đường lượn, góc nghiêng và nhịp nâng thực tế mà cá thể đó vừa bay qua**.
2. **Độ Dài, Độ Sáng & Không Che Khuất Silhouette Chim:**
   * Vệt trail bắt đầu **chính xác tại `pTailRoot`** (`u = 0`) và chỉ kéo dài về phía sau đuôi (`-Z`), tuyệt đối không cắt qua thân hay cánh của chính cá thể đó.
   * Độ mờ giảm theo hàm lũy thừa bậc hai kết hợp điều biến nhẹ từ dải tần cao `high`:
     $$\alpha_{\text{trail}}(u) = \text{bAlpha} \cdot \left(c_{\text{base}} + 0.12 \cdot \text{high}\right) \cdot (1 - u)^{1.85}$$
     với $c_{\text{base}} = 0.46$ cho 4 cá thể cam `#FF6324` và $c_{\text{base}} = 0.32$ cho 12 cá thể bạc `#96969B`, độ dày nét giảm dần từ `1.10 * s` ở gốc đuôi xuống `0.55 * s` ở chóp đuôi.

---

## D. CAMERA, AUDIO & SHOT SPECIFICATION (`PL6-BIRD-FORMATION`)

### D.1. Camera & Spatial Continuity (Quan hệ với Camera & Vùng An Toàn Thị Giác)
* **Giữ nguyên 100% quỹ đạo Camera của `evaluatePL6(t)`:**
  * Trong `[96.00s, 102.00s]`, camera dịch chuyển dọc trục `Z` từ `95.82m` tới `184.88m` (quãng đường `89.06m`, vận tốc trung bình `14.84 m/s`), lượn ngang `camX` từ `-1.35m` (sườn trái) qua `0.00m` (`100.18s`) sang `+0.86m` (sườn phải), `FOV` mở rộng từ `57.11°` lên `66.00°`, và góc nghiêng `roll` chuyển từ `+0.0011 rad` qua đỉnh nghiêng `-0.0549 rad` (`100.0s`) về `-0.0424 rad` (`102.0s`).
* **Chuyển động Tương đối Thực sự so với Địa hình & Camera:**
  * Nhờ mỗi cá thể có hệ số vận tốc tiến riêng `speedVar_i ∈ [0.88, 1.14]` trên chu kỳ `zCycle` và biên độ lượn ngang/dọc độc lập với `camX, camY`, một số cá thể vượt nhanh về phía trước camera trong khi số khác lướt chậm hơn ở tầng gần, tạo **thị sai chiều sâu 3 lớp** giữa: `(1) Lưới đồng mức vách núi` ↔ `(2) 3 phân đội chim wireframe` ↔ `(3) Lõi tín hiệu cam dẫn đường`.
* **Bảo vệ Vùng Hiển thị Lyrics & HUD (Safe Zone Discipline):**
  * Độ cao `by` của cả 16 cá thể trong `[96.00s, 108.00s]` được giới hạn chặt trong hành lang không gian phía trên đường chân trời (`screenY ∈ [14% H, 54% H]`), không bao giờ hạ thấp xuống vùng Scrim & Lyrics Karaoke (`screenY ∈ [74% H, 92% H]`) hay vùng HUD góc trên (`screenY < 9% H`).

### D.2. Audio Relationship (Quan hệ Âm thanh Có Kiểm Soát — Không Rung Nhiễu)
Giữ nguyên `envFps: 10` và không tạo onset giả:
1. **`birdMorph(t)` (`smoothstep(98.50, 102.20, t)`):** Là **nguồn điều khiển hình thái duy nhất (`100%` authority)** quyết định tiến trình biến hình từ vệt sáng sang chim. Âm thanh tuyệt đối không làm co giãn ngược lại `birdMorph`.
2. **`low` & `rms` (`audio.sampleEnv('low', t)`, `audio.sampleEnv('rms', t)`):**
   * Đã điều khiển sóng địa hình đồng mức (`kickWave`, `ridgeFold` với độ trễ `0.55s`).
   * Đối với đàn chim, `low` chỉ tạo một **lực nâng dòng khí nhiệt (thermal updraft lift) rất êm** lên độ cao toàn đàn: $\Delta y_{\text{thermal}} = +0.14 \cdot \text{low} \cdot \text{birdMorph}(t)$ (tối đa `~14cm` trong không gian 3D), giúp đàn chim hơi nâng mình lên theo nhịp bass trầm mà không giật cục.
3. **`high` (`audio.sampleEnv('high', t)`):**
   * Giữ nguyên đóng góp nhẹ vào pha cánh trong evaluator (`+ high * 1.8`).
   * Trong renderer, `high` chỉ điều biến tinh tế **độ sáng hạt nhân mũi dẫn hướng (`pNose` luminance boost `+15% * high`) và độ ngân sáng của vệt `Flight Trail` (`+0.12 * high`)**, tạo sự gắn kết thị giác với âm sắc giọng hát cao và tiếng chim hót ở câu *"bằng chim hót vang đó đây"*.

---

### D.3. Cấu trúc Dữ liệu `ShotSpecification` & Phân loại Ánh xạ Kiến trúc

Dưới đây là đặc tả đầy đủ của Shot `PL6-BIRD-FORMATION`, kèm bảng phân định rõ **(1) Trường đã có trong Engine**, **(2) Trường mở rộng tùy chọn đề xuất cho `SceneSpec.params` / `MotionSpec`**, và **(3) Logic thuộc về `WebGL2SpatialRenderer`**:

```json
{
  "shotId": "PL6-BIRD-FORMATION",
  "parentSceneId": "canyon",
  "plateCode": "PL. VI",
  "timeRange": {
    "startSec": 96.00,
    "endSec": 102.00,
    "durationSec": 6.00,
    "continuityCheckSec": 108.00,
    "localTimeRangeSec": [12.35, 18.35],
    "sceneProgressRange": [0.375951, 0.558600]
  },
  "narrativePurpose": "Chuyển hóa hình thái (Morphogenesis) đúng tại câu điệp khúc 'Thay cho tiếng còi bằng chim hót vang đó đây': 16 cột sáng đo đạc vô tri trong hẻm núi tự uốn trục, kết tụ mũi dẫn hướng, phân nhánh khớp vai và mở sải cánh wireframe 2 tầng để trở thành một đàn sinh vật ánh sáng bay về chân trời tự do.",
  "visualEvent": "Continuous 4-stage topological metamorphosis of 16 vertical light streaks into 3 distinct families of 3D articulated wireframe birds with kinematic flight wakes.",
  "focalSubject": {
    "subjectId": "pl6-wireframe-flock",
    "entityCount": 16,
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
      "vanguardLeadersZRel": [7.8, 10.4],
      "coreSquadronZRel": [10.8, 15.8],
      "highOutliersZRel": [15.5, 19.2]
    },
    "screenSpaceSeparation": {
      "enabled": true,
      "relaxationIterations": 3,
      "minHorizontalSpanMultiplier": 1.15,
      "minVerticalHeightMultiplier": 1.25
    }
  },
  "morphology": {
    "topology": "unified-11vertex-14segment-wireframe",
    "vertices": [
      "pNose", "pCrest", "pShoulderL", "pShoulderR", "pTailRoot",
      "pTailForkL", "pTailForkR", "pWristL", "pWristR",
      "pTipL", "pTipR", "pRearWingL", "pRearWingR"
    ],
    "morphSubStages": [
      { "stage": "1-spine-bend-and-nose-ignition", "localMorphWindow": [0.00, 0.25] },
      { "stage": "2-shoulder-diamond-and-carpal-bud", "localMorphWindow": [0.18, 0.50] },
      { "stage": "3-primary-wing-unfurl-and-truss", "localMorphWindow": [0.42, 0.82] },
      { "stage": "4-streak-absorption-into-tail-wake", "localMorphWindow": [0.65, 1.00] }
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
        "flapFreqMultiplier": 0.84
      },
      {
        "familyId": "swept-delta-swift",
        "birdIds": [1, 4, 7, 10, 13],
        "wingspanRange": [1.18, 1.32],
        "innerWingRatio": 0.39,
        "tipSweepZ": -0.68,
        "noseLengthZ": 0.78,
        "tailForkSpreadX": 0.25,
        "flapFreqMultiplier": 1.02
      },
      {
        "familyId": "angular-falcon-scout",
        "birdIds": [2, 5, 8, 11, 14],
        "wingspanRange": [0.94, 1.08],
        "innerWingRatio": 0.41,
        "tipSweepZ": -0.34,
        "noseLengthZ": 0.94,
        "tailForkSpreadX": 0.14,
        "flapFreqMultiplier": 1.18
      }
    ]
  },
  "motionStates": {
    "beatA_TheSignal": { "tSec": [96.00, 98.50], "birdMorph": [0.00000, 0.00000], "streakPresence": [1.00000, 1.00000] },
    "beatB_TheBending": { "tSec": [98.50, 99.65], "birdMorph": [0.00000, 0.23150], "streakPresence": [1.00000, 1.00000] },
    "beatC_TheFormation": { "tSec": [99.65, 100.85], "birdMorph": [0.23150, 0.69760], "streakPresence": [1.00000, 1.00000] },
    "beatD_TheFlight": { "tSec": [100.85, 101.65], "birdMorph": [0.69760, 0.94120], "streakPresence": [1.00000, 0.92200] },
    "beatE_TheHandoff": { "tSec": [101.65, 102.00], "birdMorph": [0.94120, 0.99155], "streakPresence": [0.92200, 0.84375] },
    "wingKinematics": {
      "globalFreqScale": 0.68,
      "downstrokeAsymmetrySkew": 0.28,
      "outerTipPhaseLagRad": 0.68,
      "intermittentGlideDepth": 0.42
    },
    "flightTrails": {
      "mode": "true-kinematic-tail-history",
      "historyHorizonSecRange": [0.28, 0.42],
      "segmentCount": 9,
      "falloffPower": 1.85
    }
  },
  "individualVariations": {
    "seedPolicy": "deterministic-hashInt01-by-birdId",
    "morphStaggerMaxOffset": 0.14,
    "wingspanJitterPct": 0.08,
    "scaleRange": [0.68, 1.28],
    "speedMultiplierRange": [0.88, 1.14],
    "bankAngleRangeRad": [-0.32, 0.32]
  },
  "cameraRelationship": {
    "evaluatorCameraLocked": true,
    "fovProgressionDeg": [57.1111, 66.0000],
    "rollProgressionRad": [0.0011, -0.0549, -0.0424],
    "parallaxPolicy": "independent-3d-world-velocity-relative-to-camera-and-contours"
  },
  "audioBindings": {
    "primaryMorphDriver": "birdMorph(t) [time-driven smoothstep(98.5, 102.2, t)]",
    "lowBand": { "target": "flockThermalLiftY", "gain": 0.14, "maxDisplacementMeters": 0.14 },
    "rmsBand": { "target": "contourValleyTurbulenceAndSignalTail", "gain": 0.75 },
    "highBand": { "target": "wingPhaseSubtleModAndWakeLuminance", "wingPhaseGain": 1.8, "wakeAlphaGain": 0.12 }
  },
  "transitionIn": {
    "atSec": 96.00,
    "state": "16 vertical light streaks anchored in PHASE 03 // FLY THROUGH canyon walls (birdMorph = 0.0, streakPresence = 1.0)"
  },
  "transitionOut": {
    "atSec": 102.00,
    "state": "16 fully articulated 3D wireframe birds in asymmetric 3-layer flock formation (birdMorph = 0.99155, streakPresence = 0.84375 absorbed into tail wakes), continuing seamlessly into PHASE 05 // HORIZON (108.00s)"
  },
  "continuityConstraints": [
    "evaluatePL6(t) in @mv-engine/scene must remain 100% unmodified (0.0 mathematical parity with prototype).",
    "birdMorph(96.0) === 0.00000, birdMorph(102.0) === 0.99155, birdMorph(108.0) === 1.00000.",
    "streakPresence(96.0) === 1.00000, streakPresence(102.0) === 0.84375, streakPresence(108.0) === 0.00000.",
    "Zero sudden mesh pop at t = 98.50s or t = 102.20s; C1-continuous vertex trajectories across [96.00s, 108.00s]."
  ],
  "acceptanceCriteria": [
    "At t = 96.00s, 0% bird silhouette is pre-drawn; only 16 vertical light streaks with top caps exist.",
    "At t = 99.50s and 100.35s, intermediate keyframes clearly show spine bending, shoulder budding, and progressive wing unfurling.",
    "At t = 102.00s and 108.00s (1080p & 4K), head direction, diamond fuselage, 2-stage wings, and forked tail are unmistakably legible as abstract wireframe birds (not flat V-icons).",
    "Zero unintentional wing/body intersections among the 16 birds across all frames in [96.00s, 108.00s].",
    "Flight wakes originate strictly from each bird's tail root along its true historical 3D path and never occlude the bird's own body."
  ]
}
```

#### Phân loại Ánh xạ Kiến trúc (Engine Support Matrix)

| Nhóm Tham số trong `ShotSpecification` | 1. Đã hỗ trợ sẵn trong Engine (`@mv-engine/*`) | 2. Đề xuất bổ sung tùy chọn vào `SceneSpec.params` / `MotionSpec` *(Không tạo package mới)* | 3. Thuộc về Tầng Thực thi `WebGL2SpatialRenderer` (`@mv-engine/renderer-webgl`) |
| :--- | :--- | :--- | :--- |
| **Thời gian & Đường cong Chuẩn** | `startSec`, `endSec`, `birdCount: 16`, `accentEveryN: 4`, `birdMorphProgressWindow`, `streakAppearProgressWindow`, `streakFadeProgressWindow` trong `SpatialContourValleyParams`. | Không cần sửa schema bắt buộc; có thể thêm trường tùy chọn `flockMorphologyConfig?: { morphStaggerMax?: number; downstrokeSkew?: number; minSeparationScale?: number }` vào `SpatialContourValleyParams` nếu muốn tinh chỉnh từ JSON. | Nội suy tiến trình cục bộ $m_i(t)$ từ `b.morph` và `b.streak` có sẵn của `EvaluatedBirdState`. |
| **Camera & Audio Modulation** | `camera.position`, `camera.target`, `camera.fov`, `camera.roll`, `audio.sampleEnv('low'/'rms'/'high')`, `b.wingPhase` trong `SpatialContourValleyEvaluator`. | Không cần thêm trường schema mới; dùng trực tiếp `audioEngine.sampleEnv('low'/'high', tSec)` đã truyền vào `renderPL6SpatialPass`. | Áp dụng lực nâng nhiệt $\Delta y_{\text{thermal}} = 0.14 \cdot \text{low} \cdot m_i$ và độ ngân sáng wake theo `high`. |
| **Hình thái 11 Đỉnh, 3 Họ Chim, Đội hình 3 Lớp & Quỹ đạo Thực** | `LineBatch` instanced capsule renderer (`pushSegment`), `project3D`, `hashInt01`, `clamp`, `lerp`, `smoothstep`. | Không yêu cầu thay đổi `@mv-engine/contracts` hay `@mv-engine/scene`. | Thực thi hàm tạo 11 đỉnh theo 4 giai đoạn $m_i \in [0, 1]$, phép quay 3D `(yaw, pitch, roll)`, 3 vòng lặp chống chồng lấn elip, và hàm lấy mẫu lịch sử $\mathbf{P}_{\text{tailRoot},i}(t - u\Delta T)$ cho `Flight Trail`. |

---

## E. IMPLEMENTATION MAPPING (Ánh xạ Module & Hàm Thực thi)

Khi được phê duyệt để chuyển sang bước triển khai, việc hiện thực hóa sẽ **chỉ tác động có kiểm soát vào `@mv-engine/renderer-webgl`**, giữ nguyên tuyệt đối `@mv-engine/scene` (`evaluatePL6(t)`), `@mv-engine/core`, `@mv-engine/audio` và `@mv-engine/contracts`:

| Module / File trong Monorepo | Hàm / Lớp Hiện Có | Trạng thái Tác động | Chi tiết Sử dụng hoặc Thay đổi sau khi Duyệt |
| :--- | :--- | :---: | :--- |
| `packages/scene/src/index.ts` | `SpatialContourValleyEvaluator.evaluate(tSec, audio)` | **GIỮ NGUYÊN 100%** *(Zero edits)* | Tiếp tục xuất `SpatialContourValleyState` với `183` floats (`732` bytes), giữ nguyên `b.morph`, `b.streak`, `b.position`, `b.zRel`, `b.scale`, `b.wingPhase`, `b.opacity` và `0.0` sai lệch toán học so với prototype. |
| `packages/core/src/index.ts` | `clamp`, `lerp`, `smoothstep`, `hashInt01` | **GIỮ NGUYÊN 100%** *(Zero edits)* | Dùng trực tiếp `smoothstep` cho 4 giai đoạn biến hình cục bộ $u_1, u_2, u_3, u_4$ và `hashInt01` để sinh biến thể deterministic theo `b.id`. |
| `packages/audio/src/index.ts` | `DeterministicAudioEngine.sampleEnv(band, tSec)` | **GIỮ NGUYÊN 100%** *(Zero edits)* | Cung cấp `low`, `rms`, `high` tất định từ envelope `10 Hz` đã làm mượt. |
| `packages/renderer-webgl/src/index.ts` | `WebGL2SpatialRenderer.renderPL6SpatialPass(...)` & `pushSegment(...)` | **CẬP NHẬT TRONG LỚP L2** *(Lines `523–652`)* | Thay thế khối vẽ tách rời `A. Vertical Streak` + `B. 6-Vertex Bird` bằng pipeline **Unified Morphogenesis L2**:<br>1. **`evaluateBirdKinematicPose(b, tDelta, st, low, high)`:** Hàm đóng tính tọa độ 3D `(wx, wy, wz)` và góc `(yaw, pitch, roll)` của cá thể `b.id` tại bất kỳ thời điểm $t - \Delta t$ nào (phục vụ cả vị trí hiện tại $\Delta t = 0$ lẫn 9 nút lịch sử của `Flight Trail` $\Delta t = u \cdot \Delta T_{\text{trail}}$).<br>2. **`relaxFlockScreenSeparation(activeBirds, W, H, s)`:** 3 vòng lặp khử chồng lấn elip trên màn hình + sắp xếp thứ tự chiều sâu `zRel` từ xa về gần.<br>3. **`emitUnifiedMorphologySegments(bPose, project3D, pushSegment)`:** Nội suy 11 đỉnh giải phẫu theo 4 giai đoạn $m_i \in [0, 1]$ (từ cột sáng dọc ở $m_i = 0$, uốn sống lưng ở $m_i \in [0, 0.25]$, tách vai ở $m_i \in [0.18, 0.50]$, bung cánh 2 tầng & mặt tam giác ở $m_i \in [0.42, 0.82]$, đến thu hồi phần dư vệt sáng vào chạc đuôi ở $m_i \in [0.65, 1.0]$). |

---

## F. SELF-CRITIQUE (Tự Phản Biện 3 Nguy Cơ Lớn Nhất & Tiêu Chí Kiểm Chứng)

### Nguy cơ 1: Hình thái sau khi biến hình vẫn trông giống các ký hiệu chữ V phẳng (`Flat V-Chevron Syndrome`)
* **Nguyên nhân tiềm ẩn:** Khi camera nhìn dọc theo trục `+Z` về phía điểm tụ (`vpX, vpY`), mọi độ lệch theo chiều sâu `ΔZ` (như mũi `pNose` nhô về `+Z` và đuôi `pTailRoot` lùi về `-Z`) bị nén phối cảnh (foreshortening) rất mạnh nếu cá thể bay ngang bằng (`pitch = 0, roll = 0`). Khi đó, dù có thêm đỉnh mũi và đuôi trong 3D, hình chiếu 2D trên màn hình vẫn suy biến thành một vạch ngang hình chữ V.
* **Giải pháp phòng ngừa trong thiết kế:**
  1. Bắt buộc mỗi cá thể có **góc ngóc đầu dương (`pitch ∈ [14°, 24°]`) kết hợp góc nghiêng sườn (`bankRoll ∈ [10°, 22°]`)** và góc hướng bay (`yaw`), để mặt phẳng lưng-bụng và mặt phẳng cánh luôn nghiêng một góc rõ rệt so với tia nhìn của camera.
  2. Khung thân là **khối tứ diện có sống lưng nổi (`pCrest` cao hơn `pShoulderL/R`)** và mỗi bên cánh là **khung tam giác kép có thanh giằng mép sau (`pTip → pRearWing → pTailRoot`)** với độ dày nét phân cấp (`leading edge 2.1px` vs `trailing spar 0.95px`).
* **Tiêu chí Kiểm chứng Định lượng (Acceptance Test):**
  * Trên ảnh render `1080p` và `4K` tại `t = 100.50s`, `102.00s` và `108.00s`, tỷ lệ giữa **chiều dài trục thân chiếu trên màn hình** $\|\text{proj}(\text{pNose}) - \text{proj}(\text{pTailRoot})\|_2$ và **sải cánh chiếu trên màn hình** $\|\text{proj}(\text{pTipL}) - \text{proj}(\text{pTipR})\|_2$ của ít nhất `12/16` cá thể phải đạt **$\ge 0.22$** (tức trục đầu-thân-đuôi có độ dài 2D tối thiểu bằng `22%` sải cánh, không bao giờ bị bẹp thành một đường thẳng 1D).

### Nguy cơ 2: Đàn chim thiếu cá tính hoặc chuyển động quá đồng bộ (`Synchronized Clone Army Syndrome`)
* **Nguyên nhân tiềm ẩn:** Trong evaluator gốc, cả 16 cá thể dùng chung một biến `birdMorph(t)` và tần số vỗ cánh `7.5 + (i % 3) * 1.2` chỉ có 3 giá trị lặp lại, dễ dẫn tới việc cả 16 vệt sáng gập lại cùng một tích tắc ở `98.50s` và đập cánh cùng nhịp.
* **Giải pháp phòng ngừa trong thiết kế:**
  1. Áp dụng **độ trễ khởi phát cá thể hóa `staggerOffset_i ∈ [0.00, 0.14]`** trên đường cong `birdMorph(t)`: tại `t = 99.20s`, các cá thể tiên phong (`id = 0, 1, 4`) đã bước sang giai đoạn tách khớp vai (`Beat B/C`), trong khi các cá thể hậu cảnh (`id = 13, 15`) mới bắt đầu uốn cong đỉnh vệt sáng.
  2. Kết hợp **3 Họ Hình thái** (`Albatross`, `Delta Swift`, `Falcon Scout`), điều biến tần số `flapFreqMult_i ∈ [0.84, 1.18]`, sóng vỗ cánh bất đối xứng (`downstroke 38% / upstroke 62%`), độ trễ khớp cổ tay – đầu cánh (`0.68 rad`), và chu kỳ lướt gió xen kẽ (`glideEnv_i`).
* **Tiêu chí Kiểm chứng Định lượng (Acceptance Test):**
  * Tại bất kỳ frame nào trong `[100.00s, 108.00s]`, độ lệch chuẩn của góc nâng cánh hiệu dụng giữa 16 cá thể phải đạt $\sigma(\text{flapAngle}) > 0.35\text{ rad}$, và tại `t = 99.50s` (`birdMorph = 0.17965`), phải quan sát thấy đồng thời ít nhất **2 giai đoạn biến hình khác nhau** giữa nhóm tiên phong và nhóm hậu cảnh.

### Nguy cơ 3: Chuyển động của đàn chim không hòa nhập với chiều sâu thung lũng và Camera (`HUD Sticker / Floating Overlay Syndrome`)
* **Nguyên nhân tiềm ẩn:** Nếu tọa độ `(bx, by, bz)` của đàn chim bị khóa cứng theo `(camX, camY, camZ)` với độ lệch không đổi, đàn chim sẽ trôi cứng theo ống kính máy quay như một lớp nhãn dán 2D đè lên thung lũng 3D, và vệt `Flight Trail` vẽ bằng hàm `Math.sin` giả tạo sẽ lệch khỏi hướng di chuyển thực.
* **Giải pháp phòng ngừa trong thiết kế:**
  1. Mỗi cá thể có vận tốc tiến dọc trục `Z` riêng (`zCycle` trong evaluator kết hợp phân tầng 3 lớp `zRel ∈ [7.2m, 19.2m]`) và quỹ đạo lượn trong **hệ tọa độ thế giới (World Space)** có quán tính trễ so với `camX`, tạo ra chuyển động tương đối (parallax) rõ rệt khi camera nghiêng cánh (`roll`) và đảo sườn từ trái sang phải.
  2. Vệt `Flight Trail` được tính bằng **hàm lịch sử quỹ đạo thế giới thực $\mathbf{P}_{\text{tailRoot},i}(t - u\Delta T)$** rồi mới chiếu qua camera hiện tại `project3D`, nên vệt khói sáng neo chặt vào không gian 3D của hẻm núi.
  3. Độ sáng và độ dày nét của từng cá thể tuân thủ cùng quy luật suy hao khí quyển theo `zRel` (`leadW` giảm từ `2.10 * s` ở gần xuống `1.35 * s` ở xa) như các đường đồng mức `L1`.
* **Tiêu chí Kiểm chứng Định lượng (Acceptance Test):**
  * Kiểm tra trên chuỗi frame liên tục `96.00s → 102.00s → 108.00s`: (a) Các cá thể lớp gần (`Vanguard`, `zRel ~ 8.5m`) có vận tốc góc trên màn hình lớn hơn tối thiểu `1.6×` so với các cá thể lớp xa (`Outliers`, `zRel ~ 17.5m`); (b) Vector tiếp tuyến tại gốc `Flight Trail` (`u = 0 → u = 0.11`) trùng khít với vector vận tốc màn hình thực tế của `pTailRoot` (sai lệch góc $< 5^\circ$); và (c) `0%` diện tích đàn chim xâm phạm vào vùng chữ Karaoke (`Y > 74% H`).
