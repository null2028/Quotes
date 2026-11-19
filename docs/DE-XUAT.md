# Sổ Đề Xuất — ghi trong lúc làm Chén thật

> Mỗi đề xuất/lỗi thấy trên video thật ghi 1 dòng. **Chưa sửa gì.** Khi cùng một mục đạt **2 lần** trên video thật (2 Chén khác nhau, hoặc 1 Chén mà không tránh được bằng kịch bản) → Claude gom thành task.
> Ý tưởng R&D không có bằng chứng (chữ, nhịp thở, nét…) để ở `docs/TON-DONG.md`, không ghi ở đây.

Trạng thái: `chờ` (mới 1 lần) · `đủ 2 lần` · `đã thành task <tên>` · `bỏ` (tránh được bằng kịch bản, không cần sửa engine)

| # | Ngày | Chén | Thấy gì trên video | Nguyên nhân (nơi trong code) | Cách tránh tạm | Lần gặp | Trạng thái |
|---|---|---|---|---|---|---|---|
| 1 | 19/11 | Tảng đá & hoa dại (`SCRIPT_TANG_DA_HOA_DAI_KY_DIEU`) | Lữ khách đi nhanh đoạn đầu rồi mới chậm | 2 lệnh `toX` cùng nhân vật chồng thời gian → engine tự cắt ngắn lệnh đầu, không báo (`trackCompiler.ts`) | Gộp thành 1 lệnh đi liên tục | 1 | chờ |
| 2 | 19/11 | Tảng đá & hoa dại | (phát hiện khi đọc code cho #1) | Làn tự do vẫn bị áp nghi thức mở màn V8.6.1: nhân vật có `enterAt` bị ép hiện nét đúng 1.5s; đạo cụ chỉ chậm hơn được, không nhanh hơn (`trackCompiler.ts` ~2180–2300) | — | 1 | chờ |
