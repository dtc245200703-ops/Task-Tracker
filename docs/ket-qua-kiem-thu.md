# Kết quả kiểm thử thực tế

Ngày thực hiện: 21/10/2026, múi giờ Việt Nam. Môi trường: Windows, Node.js v24.21.0, Docker Engine 26.1.4; app Node.js 24/Express 5, database MySQL 8.4. Cổng trình diễn 3100.

## 1. Dữ liệu và nghiệp vụ API

Lệnh đã chạy:

```powershell
$env:RUN_INTEGRATION='true'
$env:TEST_URL='http://localhost:3100'
npm.cmd test
npm.cmd run check
```

Kết quả: **23 pass, 0 fail, 0 skipped**, bao gồm 19 tình huống tích hợp, 3 kiểm thử đơn vị và 1 mục kiểm thử cha được Node tính trong tổng. Kiểm tra cú pháp máy chủ/giao diện đạt.

Các tình huống kiểm tra: chưa đăng nhập, thiếu CSRF, sai mật khẩu; chặn thành viên quản lý tài khoản/tạo dự án; quản trị viên tạo tài khoản; trưởng nhóm tạo dự án; chặn người ngoài dự án; kiểm tra người nhận việc; cập nhật trạng thái và lịch sử; chặn sửa/xóa trái quyền; bình luận tiếng Việt; bộ lọc; ngày sai; không xóa người đang có việc; khóa tài khoản và đăng xuất vô hiệu hóa phiên. Chi tiết mã kiểm thử nằm trong test/integration.test.js và test/validation.test.js.

## 2. Trình duyệt

Lệnh: `node scripts/browser-check.js`.

Microsoft Edge qua Playwright, màn hình 1440×1000 và 390×844. **8 nhóm kiểm tra đạt**, không phát hiện pageerror JavaScript; màn hình nhỏ không có tràn ngang. Đã thực hiện đăng nhập manager/admin, mở tổng quan, dự án, tạo công việc qua form, gửi bình luận, xóa việc kiểm thử, đăng xuất và xem tài khoản. Đã lưu 6 ảnh PNG trong docs/images. Dữ liệu có cấu trúc ở browser-result.json.

## 3. Triển khai và sao lưu/phục hồi

`docker compose ps`: app Up, db healthy. Cổng MySQL không được publish ra host. Health API trả HTTP 200.

Lệnh: `node scripts/verify-restore.js`.

Quy trình thực tế: đọc danh sách dự án/công việc → tạo backup → thêm một dự án đánh dấu → dừng app → nhập backup → khởi động app → đăng nhập lại và đối chiếu dữ liệu.

Kết quả **PASS**: 1 dự án trước/sau, 5 công việc trước/sau; dự án đánh dấu phát sinh sau sao lưu không còn; ID/tiêu đề/trạng thái công việc khớp chính xác, giữ tiếng Việt và đăng nhập thành công. Dữ liệu có cấu trúc ở restore-result.json. Đây là xác minh trên tập dữ liệu mẫu nhỏ, chưa đo thời gian phục hồi tập lớn.

## 4. Dependency và giới hạn

Lần cài dependency cuối: npm báo **0 vulnerabilities**. Bản mysql2 cuối được khóa trong package-lock.json; thư viện lưu phiên dùng trực tiếp pool mysql2 hiện hành. Chưa có kiểm thử tải, kiểm thử xâm nhập chuyên sâu hoặc triển khai TLS công khai. Không dùng kết quả ở đây để khẳng định khả năng chịu tải hay mức an toàn tuyệt đối.
