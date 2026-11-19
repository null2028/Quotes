---
name: sang-tac-tra-nguoi
description: Sáng tác hoặc tinh chỉnh câu quote/thơ tiếng Việt cho kênh Trà Nguội (@tranguoi.15s) — từ một câu có sẵn, một ý tưởng, hoặc viết mới theo cùng motif với câu mẫu. Dùng TRƯỚC skill dao-dien-tra-nguoi.
---

# Sáng Tác Câu Chữ Trà Nguội

Câu chữ là chính, hình là phụ. Một câu Trà Nguội: 2–4 dòng (phần tử `cau`), **dòng cuối lật nghĩa cả câu**, cụm lật gắn được với **một vật đời thường vẽ được** (để bước đạo diễn có vật đỏ). **Thời lượng video không cố định** — engine tự tính theo số âm tiết; giới hạn thật là **khung chữ trên màn hình** (xem mục Độ dài).

## Đọc trước mỗi lần làm
- `references/giong-tra-nguoi.md` — DNA giọng kênh, **kho vàng** (câu đã chứng minh hiệu quả) và **các cặp đối chứng** (bản tinh chỉnh bị chê và vì sao).
- `references/loi-mon.md` — khuôn câu / từ / ý đã mòn trong chính kho của kênh, kèm đường thay. **Đây là file quan trọng nhất.**
- `references/motif.md` — 8 motif (M1–M8) và 5 kiểu chơi chữ, viết dưới dạng bản lề.

## Ba vai — không ai tự chấm bài mình
| Vai | Ai | Việc |
|---|---|---|
| Người sinh | Gemini (hoặc mô hình đang viết) | Bước 0–1: bóc hạt nhân, viết thô nhiều bản |
| Người lọc | `scripts/kiem_cau.py` + một lượt biên tập RIÊNG (mô hình khác, hoặc lượt sau với vai "biên tập khó tính") | Bước 2: loại lỗi cơ học, chấm rubric |
| Người chốt | Chủ kênh | Bước 3: chọn 1 bản |
Không viết và chấm trong cùng một câu trả lời: mô hình luôn khen bản vừa viết.

## Hai chế độ
- **A. Tinh chỉnh** — chủ kênh đưa câu gốc (của mình, sưu tầm, văn học).
- **B. Sáng tác theo motif** — chủ kênh đưa câu mẫu ("viết câu khác cùng kiểu này") hoặc một ý tưởng / chủ đề.

## Bước 0 — Bóc hạt nhân (ghi ra 6 dòng, chưa viết câu)
1. **Motif**: M1–M8 (xem `motif.md`).
2. **Kiểu chơi chữ** (nếu có): nói lái · đảo vế · bẻ lái · slang công sở · đồng âm.
3. **Bản lề**: "Người nghe tưởng A → dòng cuối lật thành B."
4. **Cặp khóa**: hai chữ/hai vế va nhau (vd `người lạ ↔ người nhà`, `Vitamin C ↔ Vitamin Em`).
5. **Vật gánh cú lật**: một vật/việc đời thường thấy được. **Không cần có sẵn trong kho đạo cụ** — bước đạo diễn tự vẽ. Chỉ cần: nhận ra được qua một bóng mực đơn giản, đủ to để nhìn rõ trên khung hình (hoá đơn, ví, ô, ghế trống: được; một hạt bụi, một ý nghĩ: không). Không tìm được vật → hạt nhân quá trừu tượng, đổi bản lề trước khi viết.
6. **Giọng**: thả thính duyên · hài đời thường/công sở · tự trào · suy ngẫm nhẹ · trầm.
7. **Dải độ dài** (chọn trước khi viết, xem bảng dưới).

## Độ dài — chọn dải theo ý, không theo đồng hồ
Nguồn: `docs/nghien-cuu/Nghiên Cứu Tốc Độ Hiện Chữ Thị Giác & Thời Lượng Động…` và `visualDnaResolver.ts`.
| Dải | Âm tiết | Video ≈ | Hợp với | Ghi chú cho bước đạo diễn |
|---|---|---|---|---|
| **S — Chớp vị** | 6–13 | 8.5–11.5s | châm ngôn 2 vế, chơi chữ một nhát | 1 cử chỉ duy nhất |
| **M — Chuẩn thơ** | 14–28 | 12–16s | thơ 4 câu, **thả thính (toàn bộ kho vàng)**, hài công sở | 3 hồi chuẩn |
| **L — Tự sự** | 29–42 | 16–19.5s | chiêm nghiệm mở rộng, đối thoại, thơ dài | cần thêm 1 biến chuyển sân khấu phụ giữa bài |
| **XL — Văn học** | 43–58 | 19.5–24s | **chỉ** trích dẫn nguyên tác có tên tác giả | sân khấu tĩnh, 2 nhịp vi mô |
Trần cứng:
- Tự sáng tác **≤ 48 âm tiết** (≈ 7 dòng hiển thị); trích dẫn có tác giả **≤ 58** (≈ 8 dòng hiển thị). Vượt trần → khối chữ dính đáy khung, thành "bức tường chữ".
- Mỗi dòng hiển thị chứa ~7–8 âm tiết ở cỡ chữ 42 px; một phần tử `cau` dài 20 âm tiết sẽ tự xuống thành 3 dòng hiển thị.
- Trên 28 âm tiết, engine tự loại layout hẹp `ASYMMETRIC_THIRD` (không ảnh hưởng 3 bố cục chọn được trong Gói Chén).
- Gói Chén vẫn giới hạn **2–4 phần tử `cau`**: câu dài thì mỗi phần tử dài hơn, không thêm phần tử.
Luật chọn dải:
- **Dài hơn phải đáng.** Lên dải L chỉ khi ý cần không gian (đối thoại, hai vế cần dựng kỹ), không phải vì chưa cắt. "Kiệm lời" = không có chữ thừa, không có nghĩa là ngắn.
- Thả thính / hài / chơi chữ: mặc định dải **M** (hoặc S). Cú lật hài chết khi phải chờ.
- Trích dẫn văn học: giữ nguyên văn, dải nào cũng được miễn ≤ 58.

Chế độ B: chỉ được mang sang từ câu mẫu **dòng 2 (kiểu chơi chữ) và dòng 3 (bản lề)**. Mọi chất liệu (bối cảnh, vật, nghề, chữ) phải mới.

## Bước 1 — Viết thô 12 bản (4 khuôn × 3)
Viết theo dải đã chọn ở Bước 0 (được viết 1–2 bản thử ở dải liền kề nếu bản lề hợp). Ép mỗi bản vào một khuôn khác nhau để không quy về cùng một giọng:
1. **Thơ 5 hoặc 7 chữ, 4 dòng, có vần** (khuôn mạnh nhất của kho vàng).
2. **Lục bát 2–4 dòng.**
3. **Văn xuôi khẩu ngữ 2–3 dòng**, như một câu nói thật ngoài đời.
4. **Khuôn chơi chữ**: liệt kê 3 mục rồi mục thứ 4 lạc loài · lặp vế rồi lệch nghĩa · nói lái · đồng âm.
Luật cho từng bản:
- Có ít nhất 1 vật hoặc 1 hành động cụ thể (thấy được bằng mắt).
- Cụm lật ≤ 5 âm tiết, nằm trong dòng cuối, thường ở cuối; nên có "…" ngay trước để tạo khoảng nín. Được có đuôi ngắn sau cụm lật chỉ khi đuôi làm cú lật sắc hơn ("Vitamin Em… gây nhớ, gây thương").
- Cú lật tốt nhất **dùng lại chính chữ/khuôn của dòng đầu** rồi bẻ nó (xem kho vàng).
- Không dính khuôn ĐỎ trong `loi-mon.md`.
- Không giải thích, không kết luận đạo lý sau cú lật ("vì…", "bởi…", thêm một câu bài học).

## Bước 2 — Lọc (vai biên tập, lượt riêng)
1. Chạy `python3 scripts/kiem_cau.py <file.json>` (định dạng ở đầu script). Bản dính lỗi ĐỎ → loại thẳng.
2. Chấm 5 tiêu chí, mỗi tiêu chí 0–2 (tối đa 10). **Dưới 8 → loại.**
   - **Lật**: đọc dòng cuối xong, ba dòng trên đổi nghĩa (không chỉ "thêm ý").
   - **Cụ thể**: có vật/việc thấy được; cụm lật gắn được với một vật vẽ được bằng bóng mực, đủ to để nhìn rõ.
   - **Kiệm**: không chữ thừa, không chữ giải thích; đúng dải đã chọn, không vượt trần (48 / 58).
   - **Tươi**: không khuôn mòn; thử hỏi "câu này có thể nằm trên bất kỳ trang quote nào không?" — có → 0 điểm.
   - **Đọc to**: đọc thành tiếng trôi, có vần/nhịp, chỗ nín trước cụm lật.
3. Chế độ A thêm phép thử **"hơn gốc ở đâu"**: nói được bằng 1 câu cụ thể (vd "dời cú lật về cuối", "đổi 'hạnh phúc' thành 'bát cơm'"). Không nói được → bản đó thua gốc.

## Bước 3 — Trình bày, DỪNG chờ chốt
- Chế độ A: **Bản 0 = câu gốc nguyên văn** (luôn có, và được phép thắng).
- Đưa **3 bản** điểm cao nhất, khác khuôn nhau. Mỗi bản:
  - Câu chia dòng · cụm lật · dải (S/M/L/XL, số âm tiết) · bản lề "tưởng A → lật B" · vật đỏ gợi ý (vật đời thường, tả ngắn) · điểm /10 · (A) hơn gốc ở đâu.
- Không đưa 12 bản thô, trừ khi chủ kênh hỏi.
- Sau khi chốt: chuyển sang `dao-dien-tra-nguoi` Bước 2 (câu đã chốt giữ nguyên văn 100%).

## Luật riêng cho chế độ A — Tinh chỉnh là BỚT, không THÊM
Chỉ được dùng 5 thao tác:
1. **Cắt** — bỏ chữ giải thích, kết luận, hư từ.
2. **Cụ thể hoá** — đổi một chữ trừu tượng thành một vật/việc thấy được.
3. **Dời lật** — đưa cụm bất ngờ về cuối dòng cuối.
4. **Nén** — gộp dòng, bỏ chữ thừa cho vừa dải hợp với ý (không bắt buộc phải về dải M).
5. **Gieo vần / chỉnh nhịp** — chỉ khi gốc đã là thơ.
Cấm:
- Thêm ý, thêm vế, thêm "bài học" không có trong gốc.
- **Xoá vật cụ thể có sẵn trong gốc** (bàn trà, hoá đơn, bát cơm…) — đó là tài sản của câu.
- Giải nghĩa chỗ mơ hồ có giá trị.
- Bản tinh chỉnh dài hơn gốc.
- Quote văn học/tác giả thật: giữ nguyên văn, ghi nguồn, nhắc chủ kênh kiểm tra quyền trích dẫn trước khi đăng.
