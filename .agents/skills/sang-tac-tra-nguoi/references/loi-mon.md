# Lối Mòn — đo từ chính kho Trà Nguội

> Đếm trên 331 câu trong `data/airtable-cache.json` (Poetry Library, Wordplay Lab, Production Library — 2026-11-19).
> Lối mòn của kênh nằm ở **khuôn câu**, không nằm ở từ hoa mỹ. Cấm một từ thì mô hình sẽ đổi sang từ đồng nghĩa, vẫn trong khuôn cũ. Vì vậy mỗi mục dưới đây đều có **đường thay**.
> `scripts/kiem_cau.py` tự dò các mục có dấu ⚙.

## ĐỎ — gặp là loại bản đó
| # | Khuôn | Trong kho | Vì sao mòn | Đường thay |
|---|---|---|---|---|
| Đ1 ⚙ | Mở câu bằng **"Có những…"** | 37 câu mở đầu (11%), 59 lần | Khuôn mặc định của mọi trang quote | Mở giữa một việc đang xảy ra: "Cuối tháng tiền vơi…", "Mẹ anh bảo…", "Việc khó anh tính nhanh…" |
| Đ2 ⚙ | **"không phải… mà là…" / "chẳng phải… mà là…"** | 40 câu | Định nghĩa lại bằng phủ định, ai cũng viết được | Đặt hai vế cạnh nhau không nối; để dòng cuối tự lật |
| Đ3 ⚙ | **"Lớn lên/lớn rồi mới hiểu", "mới nhận ra", "mới biết", "hoá ra", "thì ra"** | 22+ câu | Kể ra bài học thay vì để người xem tự nhận ra | Cho vật/hành động tự lộ: thay "mới hiểu ông bà không còn" bằng "ghế của ông vẫn kê sát cửa" |
| Đ4 ⚙ | **"Sau tất cả", "Cuộc đời/cuộc sống là…", "Điều quan trọng nhất là…"** | ~40 câu | Giọng diễn giả, tổng kết | Bỏ hẳn; bắt đầu bằng chi tiết |
| Đ5 ⚙ | Dòng cuối là **lời khuyên**: "Đừng…", "Hãy…", "Bạn xứng đáng…", "Bạn không cần…" | "Đừng" 21 câu | Câu kết thành khẩu hiệu self-help; không còn cú lật | Dòng cuối phải là một sự việc/kết quả, không phải mệnh lệnh |
| Đ6 ⚙ | Kết bằng **an ủi**: "cũng không sao", "rồi sẽ ổn", "cả hai đều ổn", "cũng đủ rồi", "vậy là đủ" | rải rác | Xả hết căng thẳng → mất dư vị | Kết ở chỗ còn căng, để người xem tự gỡ |
| Đ7 ⚙ | **Giải thích sau cú lật** ("vì…", "bởi…", "nên…", hoặc đuôi > 6 âm tiết sau cụm lật) | — | Giải thích giết cú lật. Đuôi ngắn làm cú lật sắc hơn thì được ("Vitamin Em… gây nhớ, gây thương") | Cắt phần giải thích |
| Đ8 | (Chế độ A) **Xoá vật cụ thể có trong gốc** | Đối chứng ① ② | Mất tài sản duy nhất vẽ được | Giữ vật, chỉ nén phần chữ quanh nó |

## VÀNG — được dùng, nhưng tối đa 1 lần/câu và phải có lý do
| # | Khuôn / từ | Trong kho | Đường thay |
|---|---|---|---|
| V1 ⚙ | Hư từ nối mở dòng: **"Nhưng"**, **"Chỉ là"**, **"Đôi khi"** | nhưng 66 · chỉ là 27 · đôi khi 26 | Bỏ hư từ, xuống dòng là đủ chuyển ý; nếu cần nối thì dùng chữ đời thường ("Mà", "Vừa hay", "Ai ngờ") như kho vàng |
| V2 ⚙ | **"có lẽ"**, **"vẫn"** lặp ≥ 2 | có lẽ 17 · vẫn 71 | Nói chắc; ngập ngừng đã có "…" lo |
| V3 ⚙ | Trạng từ ru: **lặng lẽ, âm thầm, khẽ, chợt, thoáng, vội, nhẹ nhàng** | — | Thay bằng động từ mạnh có vật: "khẽ thở dài" → "đếm lại ví" |
| V4 ⚙ | Tính từ "bình yên": **bình yên, an yên, nhẹ lòng, nhẹ tênh, dịu dàng, mênh mang, thanh xuân, năm tháng** | bình yên 8 | Gọi tên cái cụ thể làm mình yên: "ấm trà nhạt", "chiều không phải vội" |
| V5 ⚙ | **tim / lòng / thương / nhớ** xuất hiện ≥ 2 lần | tim·lòng 15% câu | Một lần là đủ; ở mảng thả thính, nói bằng hành động ("tán lại gấp đôi") thay vì tim |
| V6 ⚙ | **Cụm lật là chữ trừu tượng**: kỳ diệu, hạnh phúc, cô đơn, thời gian, trưởng thành, bình yên, yêu thương, tự do, ký ức, bản lĩnh | Chén 19, 20 | Cụm lật nên là vật/việc ("hoá đơn", "người nhà", "để sang mai"). Nếu buộc giữ, ghi sẵn vật đời thường sẽ gánh nó ở bước đạo diễn — vật đó phải đủ to để nhìn rõ (chén, ấm trà nhỏ trên màn hình thì yếu) |
| V7 ⚙ | Bộ ba **"một X, một Y, một Z"** | — | Dùng được 1 lần nếu X/Y/Z là vật rất cụ thể; không dùng để liệt kê khái niệm |
| V8 ⚙ | **Dài quá dải hợp với giọng** — thả thính/hài/chơi chữ > 28 âm tiết; tự sáng tác > 42 (sát trần 48) | trung vị kho 29, 46 câu > 40 | Thả thính/hài: cắt về dải M. Suy ngẫm dài: kiểm từng chữ còn gánh việc không. **> 48 (tự sáng tác) hoặc > 58 (có tác giả) là ĐỎ** — vượt khung chữ |
| V9 ⚙ | **Ngôi "bạn"** dạy người xem | 7% câu | Kênh nói bằng "ta / tôi / anh / em" — kể chuyện mình, không dạy người |

## Ý mòn (không dò bằng script — vai biên tập tự soát)
Sống không hối tiếc · yêu bản thân trước · buông bỏ để nhẹ lòng · người đến rồi đi · thanh xuân qua nhanh · tiền không mua được hạnh phúc · trưởng thành là cô đơn · ai cũng có nỗi buồn riêng · hai nửa ghép thành một.
→ Không cấm chủ đề, nhưng **thu hẹp thành một tình huống có vật**: "tiền không mua được hạnh phúc" → "quyết tâm giữ ví… để sang mai".

## Ba phép thay khuôn (dùng khi bí)
1. **Bắt đầu giữa việc** — dòng 1 là một hành động hoặc một câu ai đó nói, không phải một nhận định.
2. **Để vật nói** — mỗi chỗ định viết cảm xúc, viết vật đang ở trước mặt nhân vật.
3. **Nói như người thật** — đọc to: ngoài đời có ai nói câu này không? Không ai nói → viết lại bằng khẩu ngữ.
