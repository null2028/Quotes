# V3.3 Stagecraft Master Specification: 6 Motif Sân Khấu Học Thuật, Đạo Diễn Hài Bẻ Lái (`Deadpan Bathos`) & Xưởng Đạo Cụ `100×100`

> **Mục đích tài liệu (`V3_3_STAGE_MOTIFS_AND_PROP_FOUNDRY_SPEC.md`):** Tài liệu này hướng dẫn AI Coding Agent (Antigravity) nâng cấp toàn diện hệ thống Đạo diễn Cảnh & Kiểm duyệt Thị giác tại `/Volumes/Data/Quotes`, xóa bỏ hoàn toàn lối mòn *"1 người đi trên 1 đường kẻ"* của bản V3.2 bằng:
> 1. **Hệ thống 6 Motif Sân Khấu** được đúc kết từ các nghiên cứu học thuật về ẩn dụ thị giác (Steinberg, Forceville, McCloud, Dudok de Wit, YesBut & Misdirection Gag).
> 2. **Cơ chế Đạo diễn Tổng quát cho dòng Quote "Bẻ Lái – Tếu Táo – Tỉnh Bơ" (`Deadpan Bathos`):** Dựng Hồi đầu nghiêm trang đánh lừa kỳ vọng + Nhịp khựng `0.25s` + Cú lật vật lý / lùi góc máy dứt khoát (`1.0s`) tại `pivotFrame`.
> 3. **Xưởng Rèn Đạo Cụ Cấu Trúc Lưới `100×100` (`src/kit/props/`):** Giúp LLM tự vẽ bất kỳ đồ vật đời thường nào (bát cơm nóng, núi hồ sơ, mái nhà xóm nhỏ, tờ hóa đơn, chiếc ghế công viên...) sắc nét, đúng DNA nét bút của kênh **Trà Nguội** và phóng lớn theo **Tỷ lệ Tâm lý của Saul Steinberg (`160–250px`)**.
> 4. **Giám khảo Vision QA nâng cấp lên "Bài Kiểm Tra Che Chữ & Cấm Lối Mòn Đi Bộ".**

## 1. Ma Trận 6 Motif Sân Khấu Chuẩn Hóa Cho Mọi Thể Loại Thơ & Văn

Cập nhật `DirectorIdeationSchema` trong `server/sceneGeneratorService.ts` để bắt buộc AI chọn đúng **1 trong 6 Motif Sân Khấu** dưới đây (nghiêm cấm dùng `DE_WIT_HORIZON_PARABLE` cho các bài không nói về hành trình đường đời!):

| Mã Motif (`stageMotif`) | Cơ Sở Lý Thuyết | Cấu Trúc Dàn Cảnh Trên Khung `540 × 480` | Khi Nào Bắt Buộc Chọn? |
| :--- | :--- | :--- | :--- |
| **`STEINBERG_OBJECT_SPOTLIGHT`** | Tỷ lệ tâm lý của Saul Steinberg (*Scale = Importance*) | **KHÔNG vẽ người toàn thân!** Đặt **1–2 đồ vật biểu tượng phóng lớn (`180–250px`)** chiếm chính giữa sân khấu. Hồi I ở trạng thái lạnh/rỗng/tắt; Hồi II bật chi tiết Đỏ Gạch ấm áp từ tâm đồ vật. | Khi bài thơ có một vật thể/biểu tượng trung tâm đắt giá (*bát cơm mẹ nấu, tách trà nguội, chiếc chìa khóa, tờ lịch, màn hình tin nhắn*). |
| **`YES_BUT_DIPTYCH`** | Đối chiếu nghịch lý *Yes, But* & *Visualize Value* | Chia sân khấu thành **Vùng Trái (`cx = 145`)** và **Vùng Phải (`cx = 395`)** cách nhau khoảng trống sạch. Trái = *Thiên hạ / Kỳ vọng*; Phải = *Thực tại của mình* rồi lật thế cờ bằng Đạo cụ Đỏ tại `pivotWord`. | Khi bài thơ có cấu trúc so sánh 2 vế (*Thiên hạ vs. Phần mình*, *Tưởng thế này vs. Thực tế thế khác*). |
| **`MISDIRECTION_PULLBACK`** | Hài thị giác Buster Keaton (*Off-frame Camera Reveal*) | **Chuyên trị Quote Bẻ Lái Tếu Táo!** Hồi I zoom cận (`cameraScale = 1.75`) khiến người xem tưởng cảnh hùng vĩ/bi tráng (ví dụ: đứng trên đỉnh núi cao) $\rightarrow$ Tại `pivotFrame`, máy quay lùi nhanh (`cameraScale -> 0.88` trong `1.0s`) lộ ra "đỉnh núi" thực chất là đỉnh tờ hóa đơn/đống nợ Đỏ Gạch! | Khi câu cuối lật tẩy một ảo tưởng to tát bằng một sự thật đời thường hài hước (*Bathos*). |
| **`FORCEVILLE_METAMORPHOSIS`** | Ẩn dụ lai ghép & biến hình của Charles Forceville | Một vật thể ở tâm trực tiếp **xoay góc hoặc biến đổi hình dạng** thành một vật thể hoàn toàn khác mang màu Đỏ Gạch tại `pivotWord` (ví dụ: *vầng trăng khuyết lãng mạn xoay ngửa 90° biến thành... cái bát bún bốc khói Đỏ Gạch*; *cuộn dây rối hóa cánh chim*). | Khi bài thơ chuyển hóa trực tiếp trạng thái nội tâm hoặc hạ độ cao từ thơ mộng xuống thực tế ăn uống/cơm áo (*Bathos Morph*). |
| **`MCCLOUD_STILL_VIGNETTE`** | Chuyển cảnh *Aspect-to-Aspect* của Scott McCloud | Góc tĩnh lặng cỡ lớn (`160–220px`: *chiếc ghế gỗ dưới cột đèn, hai chén trà trên bàn, hiên nhà*). Nhân vật ngồi tĩnh hoặc vắng bóng; thời gian trôi qua bóng nắng, lá đỏ rơi và ánh đèn. | Bài giàu chất thơ tĩnh, hoài niệm, chiều muộn, khoảng lặng không kịch tính. |
| **`DE_WIT_HORIZON_PARABLE`** | *Father and Daughter* của Michaël Dudok de Wit | Kẻ Lữ Hành Áo Choàng tương tác với Địa hình / Vật cản lớn (`>= 70px`) trên đường dốc hoặc ngã ba đường. | **CHỈ DÙNG (< 20% số bài)** khi câu chữ thực sự nói về bước đi đường đời, leo dốc, rẽ lối qua giông bão. |

## 2. Cơ Chế Nhịp Vật Lý Kép: "Trầm Lắng (`CONTEMPLATIVE`)" vs. "Bẻ Lái Tếu Táo (`WRY_BATHOS`)"

Cập nhật `src/engine/motionPhysics.ts` và `VideoInputSchema` (thêm trường tùy chọn `pacingMode: z.enum(['CONTEMPLATIVE', 'WRY_BATHOS']).default('CONTEMPLATIVE')`):
* **Nếu `pacingMode === 'CONTEMPLATIVE'` (Thơ/Đời sâu lắng):** Giữ nguyên nhịp **Slow-Cinema** mượt mà (`beat2SettleGlow` kéo dài `2.4s` bằng `Easing.inOut(Easing.cubic)`).
* **Nếu `pacingMode === 'WRY_BATHOS'` (Quote bẻ lái, hài ngầm, tếu táo như *"lương về ting ting"*):**
  1. **Setup mặt tỉnh (`0 -> pivotFrame - 15`):** Chuyển động nghiêm trang, đều đặn như phim nghệ thuật nghiêm túc (Deadpan).
  2. **Nhịp khựng lấy đà (`pivotFrame - 15 -> pivotFrame`):** Mọi dao động dừng khựng lại `0.25s` (Comedic Beat).
  3. **Cú lật dứt khoát (`frame >= pivotFrame`):** `beat2SettleGlow` dùng `spring({ frame: frame - pivotFrame, fps, config: { damping: 12, stiffness: 115 } })` (diễn ra gọn trong `~0.95 giây` có độ nảy duyên dáng nhẹ khoảng `5%`) để cú bẻ lái bật ra đúng tích tắc mắt đọc chạm từ khóa Đỏ Gạch!

## 3. Xưởng Rèn Đạo Cụ Cấu Trúc Lưới `100 × 100` (`src/kit/props/PropFoundry.tsx`)

Tạo thư mục `src/kit/props/` chứa các Đạo cụ mang **Nét Bút Đặc Trưng Của `Trà Nguội`** (mọi đạo cụ đều vẽ trong hệ tọa độ chuẩn `viewBox="0 0 100 100"` với `strokeLinecap="round"`, `strokeLinejoin="round"`, nét hở thoáng tinh tế, nhận vào `size: number`, `inkColor: string`, `accentColor: string`, `accentProgress: number`):

Khởi tạo sẵn bộ Đạo cụ Đời sống Việt Nam cỡ lớn trong `src/kit/props/SignatureProps.tsx` (và cho phép AI tự rèn thêm Prop mới theo đúng khuôn `100×100` này khi cần):
1. **`SteamingBowlProp` (`100×100` – Bát cơm / Bát phở nóng xóm nhỏ):**
   * Miệng bát hơi cong `M 16 54 Q 50 60 84 54`, thân bát tròn đầy `M 16 54 Q 50 92 84 54`, chân đế `M 36 86 L 64 86`.
   * Gợn cơm trắng đầy đặn `M 22 53 Q 38 38 52 46 Q 66 38 78 53` + đôi đũa nghiêng thanh thoát `M 54 46 L 90 20` và `M 58 49 L 92 27`.
   * Điểm nhấn Đỏ Gạch (`accentProgress`): Viền họa tiết nhỏ trên thân bát + 2 làn khói chữ `S` màu `accentColor` uốn lượn bay lên ấm sực!
2. **`CozyVillageWindowProp` (`100×100` – Mái ngói xóm nhỏ & Ô cửa sáng đèn ấm):**
   * Nét mái hiên cong nhẹ kiểu nhà Việt `M 10 48 Q 50 18 90 48`, hai vách tường hở chân thoáng `M 22 44 L 22 86` và `M 78 44 L 78 86`.
   * Giữa nhà là ô cửa sổ vuông bo góc `rect(38, 50, 24, 24, rx=3)` bừng sáng màu `accentColor` (kèm quầng sáng ấm lan tỏa) khi `accentProgress > 0`!
3. **`ToweringPaperStackProp` (`100×100` – Núi hồ sơ / Công việc chất chồng):**
   * 6 tập hồ sơ xếp chồng nghiêng ngả chữ Z từ `y = 88` cao vút lên `y = 14`; khi `accentProgress` tăng lên (`0 -> 1`), các tập hồ sơ bên trên bung nhẹ bay dạt sang hai bên hoặc xẹp xuống gọn gàng!
4. **`PaydayBellBadgeProp` (`100×100` – Chuông thông báo / Thẻ "Ting Ting" Đỏ Gạch cỡ lớn):**
   * Thẻ thông báo bo tròn nổi bật màu `accentColor` kèm biểu tượng tia sáng lấp lánh và 2 vòng sóng âm lan tỏa rõ nét (khi render ở `size = 110..140px`, nhìn trên điện thoại rõ mồn một từ xa!).
5. **`WinterCoupleScarfProp` (`100×100` – Đôi người quàng chung khăn ấm):**
   * Hai bóng người nghiêng đầu sát nhau, nối liền bằng một dải khăn quàng cổ bay nhẹ trong gió.

**Quy tắc bắt buộc trong Prompt `build-tsx` khi AI cần tự vẽ thêm bất kỳ Đạo cụ mới nào:**
> *"Khi cần vẽ một vật thể mới chưa có trong `SignatureProps.tsx`, BẮT BUỘC khai báo một sub-component riêng có `viewBox='0 0 100 100'`, ghi chú rõ tọa độ từng bộ phận (Đỉnh, Thân, Đáy trong khoảng 10..90), dùng đường cong Quadratic/Cubic (`Q`, `C`) mềm mại với `strokeLinecap='round'`, và đặt lên sân khấu với kích thước hiển thị `size >= 130px` (cho vật chính) để áp dụng đúng Quy luật Tỷ lệ Tâm lý của Saul Steinberg!"*

## 4. Nâng Cấp Giám Khảo `visualCriticService.ts`: Bài Kiểm Tra Che Chữ (`The Mute Story Test`)

Cập nhật `VISUAL_CRITIC_SYSTEM_PROMPT` trong `server/visualCriticService.ts` với **3 điều kiện đánh trượt thẳng tay (`score <= 4/10`, bắt buộc sửa lại)**:

1. **Điều kiện Liệt 1 – Lối mòn "1 Người Đi Trên Đường Kẻ":** Nếu câu thơ KHÔNG nói về chuyện đi đường/leo dốc mà trên ảnh chỉ có 1 bóng người nhỏ đi trên 1 vạch thẳng cầm vật bé xíu `< 25px` $\rightarrow$ **Chấm tối đa `3/10`**, yêu cầu đổi ngay sang `STEINBERG_OBJECT_SPOTLIGHT` hoặc `YES_BUT_DIPTYCH`!
2. **Điều kiện Liệt 2 – Vi phạm Tỷ lệ Tâm lý Steinberg (`Tiny Focal Object`):** Nếu đạo cụ mang linh hồn bài thơ (ví dụ: bát cơm, ngôi nhà, núi công việc, chuông báo lương...) chiếm diện tích nhỏ hơn `18%` chiều ngang sân khấu (`< 95px`) khiến nhìn trên điện thoại không nhận ra hình gì $\rightarrow$ **Chấm tối đa `4/10`**, yêu cầu phóng đại vật thể chính lên `160–240px`!
3. **Điều kiện Liệt 3 – Bài Kiểm Tra Che Chữ (`Mute Legibility`):** Hãy tưởng tượng người xem tắt tiếng và che phần chữ đi: nhìn sự khác biệt giữa Ảnh 1 (Hồi I) và Ảnh 2–3 (Hồi II–III) có đoán ra được chủ đề và cú twist (tếu táo hoặc sâu lắng) của câu quote không? Phải đạt **$\ge 8.0/10$** mới được thông qua!

## 5. Nhiệm Vụ Thực Thi Kiểm Chứng Ngay Trên `CHÉN 04` & `CHÉN 05`

Sau khi cập nhật `SignatureProps.tsx`, `motionPhysics.ts` (`WRY_BATHOS`), `sceneGeneratorService.ts` (6 Motif) và `visualCriticService.ts`:
1. **Tái đạo diễn & Xuất lại `CHÉN 04 — ẤM`** (*"Sáng nay gió bấc đầu mùa / Thiên hạ tíu tít đón đưa hẹn hò / Phần mình việc ngập cả kho / Ấm lòng nhất lúc lương về ting ting"*):
   * Phải tự động nhận diện `pacingMode: 'WRY_BATHOS'` và `stageMotif: 'YES_BUT_DIPTYCH'`:
     - **Nửa Trái (`x ≈ 145`):** Đôi người quàng khăn sánh bước êm đềm (`WinterCoupleScarfProp`, cỡ rõ ràng `115px`, `opacity: 0.48`) dưới làn gió thu đông.
     - **Nửa Phải (`x ≈ 385`):** Nhân vật lọt thỏm sau **Núi hồ sơ cao ngất (`ToweringPaperStackProp`, cỡ lớn `150px`)** rung lắc trong gió lạnh.
     - **Chạm `"lương về"` (Nhịp nảy `WRY_BATHOS`):** Biểu tượng thông báo lương **Đỏ Gạch lớn (`PaydayBellBadgeProp`)** bật tung lên với sóng *"ting ting!"*, đánh bay đống hồ sơ nặng nề dạt ra xa và nhân vật ngả người thư thái tận hưởng hơi ấm!
2. **Tái đạo diễn & Xuất lại `CHÉN 05 — ĐỦ ẤM`** (*"Danh bạ nghìn người xanh chấm sáng / Đêm sâu chẳng biết gửi lòng ai / Bỗng ấm dòng tin từ xóm nhỏ: / Ăn cơm chưa đó, ngủ đi con."*):
   * Phải tự động nhận diện `pacingMode: 'CONTEMPLATIVE'` và `stageMotif: 'STEINBERG_OBJECT_SPOTLIGHT'` (**KHÔNG vẽ người đi bộ trên vạch kẻ!**):
     - **Hồi I (`0–7s`):** Giữa màn đêm sâu, hàng chục chấm tròn nhỏ lướt trôi lạnh lẽo qua lại như những chấm danh bạ xa cách không chạm tới nhau.
     - **Hồi II & III (Chạm `"Ăn cơm chưa"`):** Các chấm lạnh lẽo mờ dần dạt ra rìa, nhường trọn trung tâm sân khấu cho **Ô cửa sáng đèn của mái nhà xóm nhỏ & Bát cơm nóng đôi đũa cỡ lớn (`190–220px`)** tự phác nét hiện ra, tỏa làn khói màu Đỏ Gạch ấm áp bay lên giữa đêm khuya!
3. Chạy kiểm duyệt `visualCriticService` (đảm bảo cả hai đều vượt mốc **$\ge 8.0/10$** thực chất!) và xuất ra 2 file `quote-004.mp4`, `quote-005.mp4`.
