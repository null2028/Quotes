Bạn là Gemini trong Antigravity, project Trà Nguội. Làm ĐÚNG task này rồi dừng. Model: Neon. Chạy SAU TS1.
CÁCH LÀM VIỆC (bắt buộc): đọc AGENTS.md (nhất là MỤC ĐÍCH GỐC). Chỉ sửa scripts/gen-stage-skill.mjs rồi chạy npm run gen:skill (KHÔNG sửa tay SKILL.md/lan-tu-do.md). Không thêm luật mới — chỉ cho skill nói ĐÚNG những gì engine đang làm. SKILL.md vẫn ≤ 80 dòng.
Đọc thêm: docs/THUAT-TOAN-NHIP-CHU-VA-THOI-LUONG.md, docs/DE-XUAT.md (#1), tasks/REPORT-TF.md (TF5, TF6, PA-B).

TF7. Đồng bộ skill đạo diễn với engine sau TF5/TF6/PA-B/TS1
1. Độ dài câu: bỏ "14–28 âm tiết" và "2–4 dòng" ở Bước 1 SKILL.md và mục segments trong lan-tu-do.md. Thay bằng: độ dài theo 4 dải S 6–13 · M 14–28 · L 29–42 · XL 43–58 âm tiết (trần 48 tự sáng tác, 58 trích dẫn có tác giả), thời lượng video engine tự tính 8.5–24s; giới hạn thật là khung chữ.
2. Bước 1: nếu câu đã chốt từ skill sáng tác `sang-tac-tra-nguoi` → giữ nguyên văn, chỉ chia dòng + đề xuất ký hiệu nhịp + cụm lật, không chấm/sửa lại câu.
3. lan-tu-do.md, mục camera/timeline, thêm 3 dòng sự thật của engine (TF5): máy KHÔNG tự đẩy/kéo/rung camera ở cú lật — muốn thì tự ghi cue target "camera"; không cần visualDNA/forceSolidStyle/solid_style (mặc định đã nét đậm, bố cục chuẩn, không gobo); vật/nhân vật có cue drawProgress → vẽ nét đúng nhịp đó, có enterAt + fadeDuration → mờ dần vào đúng thời lượng đó, không ghi gì → nghi thức mở màn mặc định.
4. lan-tu-do.md, mục timeline, thêm 2 mẹo: neo động tác theo "line_N"/"pivot" (±s) thay vì "start+Xs" dài, vì thời lượng co giãn theo câu; không cho 2 lệnh di chuyển (toX/toY) cùng một target chồng thời gian — gộp thành 1 lệnh liền (engine sẽ cắt ngắn lệnh đầu).
KIỂM TRA: npm run gen:skill sạch, SKILL.md ≤ 80 dòng; grep cho thấy không còn "14–28 âm tiết" đơn lẻ và "2–4 dòng" trong 2 file; zip khớp file (unzip -p … | diff). Dán đoạn đã đổi vào báo cáo.
Báo cáo tối đa 4 dòng vào tasks/REPORT-TF.md (thêm cuối). Không commit git.
