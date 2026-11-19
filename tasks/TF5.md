Bạn là Gemini trong Antigravity, project Trà Nguội. Làm ĐÚNG task này rồi dừng. Model: Neon.
CÁCH LÀM VIỆC (bắt buộc): đọc AGENTS.md (nhất là MỤC ĐÍCH GỐC), docs/BAN-DO-HE-THONG.md, docs/DE-XUAT.md (#2, #3). Chỉ đọc thêm file code nêu trong task. Hiểu cần sửa gì thì SỬA NGAY. Ngoài phạm vi: ghi 1 dòng, không làm. Không thêm luật mới. Cập nhật dòng tương ứng trong BAN-DO-HE-THONG.md. Báo xong kèm bằng chứng thật.
Đọc thêm: src/engine/visualDnaResolver.ts, src/stage/trackCompiler.ts (khối "Khai bút Mở màn 4 Pha V8.6.1" ~2180–2300), src/stage/legacySceneIds.ts (isFreeModeStageScript).

TF5. Làn tự do: engine KHÔNG tự thêm gì kịch bản không ghi
Bằng chứng: Chén 20 tu_do bị seed bốc shotMode MACRO_PROP → Lữ khách mờ còn 14%; tu_do vẫn bị bốc ngẫu nhiên layout (WINDOW_FRAME), gobo ánh sáng, pivotMechanic camera; nhân vật có enterAt bị ép hiện nét đúng 1.5s.
Nguyên tắc: kịch bản tu_do ghi gì thì theo đó; không ghi thì dùng mặc định TĨNH, không ngẫu nhiên.
1. visualDnaResolver: với isFreeModeStageScript → shotMode 'SOLID_SCENE', layout 'CLASSIC_TOP_STAGE', lightingGobo 'NONE', pivotMechanic không đổi camera (camera chỉ theo timeline kịch bản) — trừ khi kịch bản/spec ghi rõ. Seed chỉ còn đổi chi tiết chống trùng (chân trời, bụi giấy, tâm vignette), giống Gói Chén.
2. trackCompiler mở màn V8.6.1 với tu_do: vật/nhân vật nào kịch bản đã tự định nhịp (có cue drawProgress trong timeline, hoặc enterAt kèm fadeDuration) → dùng đúng nhịp kịch bản, không min/không ép 1.5s. Vật/nhân vật kịch bản không định nhịp → giữ nghi thức mở màn mặc định như hiện tại.
3. Không đổi gì với Gói Chén (semantic_v1) và 51 kịch bản legacy.
KIỂM TRA: typecheck 0 lỗi. In visualDNA của quote-019 và quote-020 trước/sau (shotMode, layout, gobo, pivotMechanic). Xoá tạm forceSolidStyle/tag solid_style khỏi bản sao quote-020 → preview Lữ khách vẫn đậm 100%. Preview C19 + Chén 20 → qa-artifacts-ci/TF5.png. check-goi q001 vẫn OK (Gói Chén không đổi).
Báo cáo tối đa 4 dòng vào tasks/REPORT-TF.md (thêm cuối). Không commit git.
