Bạn là Gemini trong Antigravity, project Trà Nguội. Làm ĐÚNG task này rồi dừng. Model: Neon. Task CHỈ viết tài liệu, KHÔNG sửa code.

T-MAP. Bản đồ hệ thống — để người điều phối (Claude) và mọi agent sau hiểu đúng những gì đang có
Vấn đề: nhiều cơ chế đã có trong project (vd Visual DNA 4 trục, gobo, bố cục khung vòm, thời lượng động, tự chuyển vật lên tay khi vật đỏ nhỏ, cue zoom 1.14…) nhưng người viết task không biết → task mới chồng chéo, hai hệ thống cùng điều khiển một thứ.

1. Viết docs/BAN-DO-HE-THONG.md (ngắn gọn, dạng bảng, tối đa ~250 dòng):
   a. Luồng chính (1 sơ đồ chữ): Gói Chén → goiChenParser → semanticStage → trackCompiler → stageValidator → DeclarativeStagePlayer → render (studio/CLI). Luồng cũ (stage-scripts legacy, scenes built-in/custom, archetypes) chạy song song ở đâu.
   b. BẢNG CƠ CHẾ: mỗi dòng 1 cơ chế đang ảnh hưởng tới hình/chuyển động/thời gian/âm thanh của video: Tên | Làm gì | File chính | Bật khi nào (mặc định / seed / do Gói Chén / do UI) | Hằng số chính | Có thể xung đột với. BẮT BUỘC liệt kê đủ: Visual DNA (4 trục, từng lựa chọn), gobo ánh sáng, bố cục khung, durationMode/thời lượng động, pivotMechanic, mở màn, đẩy máy cú lật, cỡ nhân vật, TEMPO, khí quyển, legacy/strictValidation, foley/bgm, typography (tách chữ lật, hiện chữ), loop, mọi "tự động sửa" (auto-fix) trong geminiBundleBridge/semanticStage.
   c. Mục "HÀNH VI NGẦM": mọi chỗ code tự thay đổi kịch bản mà kịch bản không yêu cầu (tự nâng/tự gộp/tự đổi/tự chọn ngẫu nhiên). Mỗi dòng ghi có cảnh báo cho người dùng hay không.
   d. Mục "CHỒNG CHÉO ĐÃ BIẾT": các cặp cơ chế cùng điều khiển một thứ (vd Trục 4 Đẩy cận + đẩy máy cú lật).
2. Viết docs/NHAT-KY-QUYET-DINH.md: các quyết định chủ kênh đã chốt (lấy từ docs/KE-HOACH.md, docs/QUY-TRINH-LAM-VIEC.md, tasks/REPORT-*.md, git log từ cf1ad53): ngày | quyết định | lý do ngắn. Vd: Lữ khách bóng mực không mắt; cỡ nhân vật cố định 0.28; Nhịp Trà Nguội; khí quyển mặc định tắt; 1 vật đỏ giữ đến hết; đẩy máy cú lật ≤2.2; mở màn trái→phải; Gói Chén không toạ độ…
3. AGENTS.md ở gốc repo ĐÃ CÓ nhưng lỗi thời (ghi V8.3.1, quy trình GitHub-only, chưa biết Gói Chén/tn-core/skill mới). Viết lại gọn ≤ 60 dòng — file mọi agent đọc đầu tiên; giữ các phần còn đúng (bản sắc kênh, Airtable, chuẩn xuất video), bỏ/sửa phần sai; thêm: dự án là gì; đọc BAN-DO-HE-THONG.md và NHAT-KY-QUYET-DINH.md trước khi làm; 4 luật làm việc:
   - Trước khi thêm cơ chế mới: tra bản đồ xem đã có cơ chế cùng việc chưa; có thì mở rộng cái cũ, không làm cái thứ hai.
   - Không thêm HÀNH VI NGẦM ngoài yêu cầu task. Nếu thấy cần → ghi "ĐỀ XUẤT" trong báo cáo, mặc định TẮT.
   - Mỗi task thay đổi hành vi → cập nhật đúng dòng trong BAN-DO-HE-THONG.md + thêm 1 dòng vào báo cáo mục "Thay đổi hành vi".
   - Báo xong phải kèm BẰNG CHỨNG thật (output lệnh, ảnh từ luồng render thật), không mô tả suông.
Báo cáo tối đa 4 dòng vào tasks/REPORT-T-MAP.md: số cơ chế, số hành vi ngầm, số chồng chéo phát hiện. Không commit git.
