# Kịch bản trình diễn và gợi ý bảo vệ

## Chuẩn bị

Mở Docker Desktop, chạy `docker compose up -d`, truy cập cổng PORT trong `.env` (máy hiện tại 3100). Chuẩn bị ba cửa sổ trình duyệt hoặc đăng xuất/đăng nhập để đổi vai trò. Mật khẩu mẫu nằm ở SEED_PASSWORD trong `.env`.

## Trình diễn khoảng 10 phút

1. **1 phút:** giới thiệu bài toán giao việc nhóm, ba vai trò và kiến trúc trình duyệt → Express → MySQL.
2. **1 phút:** đăng nhập admin, tạo một tài khoản thành viên; cho thấy danh sách tài khoản và thao tác khóa.
3. **2 phút:** đăng nhập manager, tạo dự án “Chuẩn bị báo cáo”, thêm user@task.vn; tạo việc, đặt ưu tiên và hạn, giao cho thành viên.
4. **2 phút:** đăng nhập member, xem việc được giao, đổi trạng thái sang đang làm rồi hoàn thành; gửi bình luận. Cho thấy thành viên không có nút quản lý tài khoản/tạo dự án và máy chủ kiểm tra quyền bằng kiểm thử tích hợp.
5. **1 phút:** trở lại manager, xem thống kê, lọc dự án và xem lịch sử. Giải thích quá hạn chỉ áp dụng khi hạn nhỏ hơn ngày hiện tại và việc chưa hoàn thành.
6. **2 phút:** mở terminal: `docker compose ps`, `docker compose logs --tail 10 app`, `node scripts/backup.js`. Giải thích volume lưu MySQL và quy trình phục hồi. Chỉ phục hồi trực tiếp khi đã tạo bản sao hiện trạng và có thời gian kiểm tra.
7. **1 phút:** trình bày kết quả kiểm thử và các giới hạn còn lại.

## Câu hỏi thường gặp

**Vì sao chọn MySQL?** Dữ liệu có quan hệ rõ giữa tài khoản, dự án, thành viên và công việc. Khóa ngoại kiểm soát tính toàn vẹn; giao dịch bảo đảm cập nhật công việc và ghi lịch sử cùng thành công hoặc cùng hoàn tác.

**Ẩn nút trên giao diện có đủ phân quyền không?** Không. API tải lại tài khoản đang hoạt động ở mỗi yêu cầu, kiểm tra vai trò, chủ dự án và quan hệ thành viên trước khi truy cập tài nguyên.

**Phiên đăng nhập được lưu ở đâu?** Cookie chứa mã phiên được ký, dữ liệu phiên lưu bảng sessions trong MySQL. Cookie có HttpOnly và SameSite=Lax; thời hạn tối đa 8 giờ, phiên hết hạn được dọn định kỳ. Chạy HTTPS cần bật Secure.

**Mật khẩu được bảo vệ như thế nào?** bcrypt băm với cost 12, không lưu mật khẩu rõ trong bảng users. API không trả password_hash. Các tài khoản mẫu ban đầu dùng chung SEED_PASSWORD để trình diễn; phải đổi trước khi dùng dữ liệu thật.

**Nếu container bị xóa thì có mất dữ liệu không?** Dữ liệu MySQL nằm trong named volume. Tạo lại container không xóa volume. Nếu volume hỏng hoặc bị xóa thì cần bản sao lưu ngoài volume.

**Sao lưu khác phục hồi thế nào?** Sao lưu tạo tệp SQL nhất quán cho các bảng InnoDB; phục hồi nhập lại tệp để đưa dữ liệu về thời điểm sao lưu. Cần dừng app khi phục hồi và xác minh sau khi nhập.

**Ngăn SQL injection và XSS thế nào?** Truy vấn nhận dữ liệu qua placeholder; giao diện mã hóa các ký tự HTML trước khi đưa nội dung người dùng vào DOM. Helmet bổ sung header bảo vệ. Cần kiểm thử bảo mật sâu hơn khi đưa vào sử dụng rộng rãi.

**Hạn chế hiện tại?** Chưa có email đặt lại mật khẩu, tệp đính kèm, thông báo thời gian thực, phân trang đầy đủ, giám sát tập trung, kiểm thử tải hoặc triển khai HTTPS công khai. Danh sách công việc giới hạn 1.000 bản ghi gần nhất; thống kê giao diện tính trên tập này.

**Phân biệt cập nhật và rollback?** Cập nhật thay phiên bản ứng dụng sau khi sao lưu và kiểm thử. Rollback dùng mã/image trước; nếu schema không tương thích phải có kế hoạch dữ liệu riêng, không nhập bản sao cũ một cách tùy ý vì sẽ mất dữ liệu mới.
