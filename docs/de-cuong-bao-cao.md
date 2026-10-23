# Đề cương bài thi kết thúc học phần

## Thông tin đề tài

- Trường: Trường Đại học Công nghệ Thông tin và Truyền thông – Đại học Thái Nguyên.
- Học phần: Triển khai và quản trị hệ thống phần mềm.
- Đề tài số 24: Hệ thống Quản lý Công việc / Task Tracker.
- Học kỳ I, năm học 2026–2027.
- Sinh viên, mã sinh viên, lớp, giảng viên: cần người thực hiện xác nhận trước khi đưa vào bản nộp.

Tài liệu này là đề xuất phạm vi, chưa phải báo cáo kết quả triển khai. Các yêu cầu phải được đối chiếu với đề bài chính thức của giảng viên.

## 1. Mục tiêu và phạm vi đề xuất

Xây dựng ứng dụng web hỗ trợ nhóm tạo dự án, giao việc, theo dõi tiến độ và quản lý thời hạn. Người dùng đăng nhập trước khi truy cập dữ liệu. Hệ thống kiểm tra quyền ở máy chủ.

Vai trò dự kiến:

| Vai trò | Quyền chính |
| --- | --- |
| Quản trị viên | Quản lý tài khoản, khóa tài khoản, xem tổng quan |
| Trưởng nhóm | Tạo dự án, quản lý thành viên, giao và cập nhật công việc trong dự án phụ trách |
| Thành viên | Xem dự án được tham gia, cập nhật công việc được giao, bình luận |

Chức năng cốt lõi:

1. Đăng nhập, đăng xuất, đổi mật khẩu; lưu mật khẩu dưới dạng băm.
2. Quản lý dự án và thành viên dự án.
3. Tạo, sửa, xóa và giao công việc; kiểm tra người nhận thuộc dự án.
4. Theo dõi trạng thái: Cần làm, Đang làm, Hoàn thành.
5. Đặt mức ưu tiên và hạn hoàn thành; đánh dấu quá hạn khi chưa hoàn thành.
6. Tìm kiếm và lọc theo trạng thái, người phụ trách, dự án.
7. Bình luận và lưu lịch sử thay đổi công việc.
8. Thống kê công việc theo trạng thái và thời hạn.

## 2. Phân tích và thiết kế

- Đặc tả tác nhân, sơ đồ ca sử dụng và luồng xử lý chính.
- Mô hình dữ liệu dự kiến: users, projects, project_members, tasks, comments, activity_logs.
- Thiết kế quan hệ, khóa chính, khóa ngoại và ràng buộc dữ liệu.
- Ma trận quyền cho từng thao tác; quy định quyền truy cập chéo giữa các dự án.
- Thiết kế giao diện đăng nhập, tổng quan, danh sách dự án, bảng công việc và quản lý người dùng.

## 3. Xây dựng hệ thống

- Chọn công nghệ sau khi xác nhận yêu cầu học phần.
- Tách cấu hình môi trường khỏi mã nguồn, không ghi mật khẩu thật vào kho mã.
- Kiểm tra dữ liệu đầu vào, phân quyền, chống truy vấn chèn lệnh và bảo vệ thao tác thay đổi dữ liệu.
- Cung cấp dữ liệu mẫu và hướng dẫn chạy để giảng viên có thể tái hiện.

## 4. Triển khai và quản trị

- Mô tả kiến trúc triển khai, môi trường và các phiên bản phần mềm thực tế.
- Hướng dẫn cài đặt từ môi trường mới; khởi tạo cơ sở dữ liệu và tài khoản quản trị.
- Cấu hình dịch vụ, cổng truy cập, biến môi trường và HTTPS nếu triển khai lên máy chủ.
- Hướng dẫn khởi động, dừng, kiểm tra trạng thái và đọc nhật ký lỗi.
- Quy trình sao lưu, phục hồi cơ sở dữ liệu; thực hiện phục hồi thử và ghi nhận kết quả.
- Quy trình cập nhật phiên bản, sao lưu trước cập nhật và quay lại phiên bản trước khi lỗi.
- Quản lý tài khoản, quyền truy cập và xử lý các lỗi vận hành thường gặp.

## 5. Kiểm thử và đánh giá

| Nhóm | Tình huống cần kiểm tra |
| --- | --- |
| Xác thực | Đăng nhập đúng/sai, đăng xuất, truy cập khi chưa đăng nhập |
| Phân quyền | Thành viên không quản lý được tài khoản và không truy cập dự án ngoài quyền |
| Công việc | Tạo/sửa/xóa, giao cho thành viên hợp lệ, đổi trạng thái, lọc dữ liệu |
| Dữ liệu | Thiếu trường bắt buộc, ngày không hợp lệ, bản ghi không tồn tại |
| Vận hành | Khởi động lại vẫn giữ dữ liệu; sao lưu và phục hồi thành công |

Ghi rõ dữ liệu đầu vào, kết quả mong đợi, kết quả thực tế và trạng thái đạt/chưa đạt. Chỉ ghi kết quả sau khi chạy kiểm thử; không tự tạo số liệu hiệu năng hoặc bằng chứng triển khai.

## 6. Bố cục báo cáo dự kiến

1. Trang bìa, mục lục, danh mục hình và bảng.
2. Chương 1: Tổng quan đề tài, bài toán và phạm vi.
3. Chương 2: Phân tích yêu cầu và thiết kế hệ thống.
4. Chương 3: Công nghệ và xây dựng ứng dụng.
5. Chương 4: Triển khai và quản trị hệ thống.
6. Chương 5: Kiểm thử, kết quả và đánh giá.
7. Kết luận, hạn chế, hướng phát triển.
8. Tài liệu tham khảo thực sự sử dụng và phụ lục hướng dẫn cài đặt.

## 7. Sản phẩm bàn giao dự kiến

- Mã nguồn ứng dụng và cấu hình mẫu.
- Cơ sở dữ liệu mẫu hoặc lệnh khởi tạo dữ liệu.
- Hướng dẫn cài đặt, vận hành, sao lưu và phục hồi.
- Báo cáo bám sát chức năng đã thực hiện, có ảnh chụp chạy thật.
- Kịch bản trình diễn: đăng nhập → tạo dự án → thêm thành viên → giao việc → cập nhật trạng thái → xem thống kê → minh họa phân quyền → sao lưu và phục hồi.
