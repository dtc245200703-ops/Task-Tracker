# TaskFlow – Hệ thống quản lý công việc

Bài thực hành đề tài 24, học phần **Triển khai và quản trị hệ thống phần mềm**. Backend Node.js/Express, MySQL; frontend HTML/CSS/JavaScript thuần. Giao diện tiếng Việt, ba vai trò quản trị viên / trưởng nhóm / thành viên.

## Chạy nhanh bằng Docker (khuyên dùng)

Yêu cầu: Node.js 22 trở lên để dùng các tiện ích, Docker Desktop đang chạy Linux containers, Docker Compose.

```powershell
node scripts/configure.js
docker compose up -d --build
```

Mở http://localhost:3000. Máy đang thực hiện dự án đã đổi `PORT=3100` trong `.env` vì cổng 3000 bị chiếm; địa chỉ hiện tại là **http://localhost:3100**. `PORT` là cổng trên máy; container app luôn dùng cổng 3000. Đổi `PORT` rồi chạy lại `docker compose up -d` khi cần.

Script configure chỉ tạo `.env` khi chưa tồn tại, sinh mật khẩu và khóa phiên ngẫu nhiên. Mở `.env` bằng trình soạn thảo và xem `SEED_PASSWORD` để đăng nhập các tài khoản mẫu:

| Email | Vai trò |
| --- | --- |
| admin@task.vn | Quản trị viên |
| nhom@task.vn | Trưởng nhóm |
| user@task.vn | Thành viên |

Dữ liệu mẫu chỉ tạo khi bảng users rỗng. Thay `SEED_PASSWORD` không đổi mật khẩu tài khoản đã có; dùng chức năng Đổi mật khẩu. Không nộp `.env`, `node_modules` hoặc tệp sao lưu chứa dữ liệu thật vào kho công khai.

Demo theo vai trò: admin xem tổng quan hệ thống và tài khoản; trưởng nhóm xem dự án phụ trách, việc chưa giao và phân bổ công việc; thành viên xem việc cá nhân, thời hạn ưu tiên. Bảng công việc vẫn cho xem các công việc trong dự án được phép truy cập.

Docker tự bổ sung ba dự án demo khi khởi động. Với MySQL chạy trực tiếp, chạy `npm.cmd run db:demo` sau `db:init`. Lệnh này giữ dữ liệu cũ và bỏ qua dự án demo đã tồn tại; không đặt lại mật khẩu hay trạng thái công việc. Hai thành viên bổ sung là `anh.demo@task.vn` và `bao.demo@task.vn`, mật khẩu ban đầu theo `SEED_PASSWORD`. Dự án Website có tài khoản `user@task.vn`; dự án Ứng dụng nội bộ không có tài khoản này; dự án Vận hành do admin quản lý và không có trưởng nhóm mẫu.

## Chạy trực tiếp với MySQL

1. Cài Node.js 22+ và MySQL 8.4. Tạo database `task_tracker` với charset `utf8mb4`, tạo user riêng và cấp quyền trên database này. Không chạy ứng dụng bằng root.
2. Chạy `node scripts/configure.js`, sửa các biến `DB_*` trong `.env` cho phù hợp máy.
3. Chạy:

```powershell
npm.cmd ci
npm.cmd run db:init
npm.cmd start
```

Trên Linux dùng `npm`. Windows dùng `npm.cmd` nếu PowerShell chặn npm.ps1. Không cần thay ExecutionPolicy.

Ví dụ lệnh SQL (thay mật khẩu minh họa bằng mật khẩu của bạn):

```sql
CREATE DATABASE task_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'task_app'@'localhost' IDENTIFIED BY 'CHANGE_THIS_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, INDEX, REFERENCES ON task_tracker.* TO 'task_app'@'localhost';
```

## Chức năng

- Đăng nhập, đăng xuất, đổi mật khẩu; khóa/mở khóa và tạo tài khoản.
- Tạo/sửa/xóa dự án, thêm/xóa thành viên theo email.
- Tạo/sửa/xóa/giao công việc, mức ưu tiên, thời hạn, bảng ba trạng thái.
- Tìm kiếm, lọc theo dự án, trạng thái, người phụ trách; thống kê trong phạm vi truy cập.
- Bình luận và lịch sử cập nhật công việc.
- Phiên đăng nhập lưu MySQL, CSRF token, cookie HttpOnly/SameSite, băm bcrypt, giới hạn thử đăng nhập, truy vấn tham số hóa.

Quản trị viên truy cập mọi dự án. Trưởng nhóm quản lý dự án mình sở hữu, dự án khác chỉ xem nếu là thành viên. Thành viên đọc/bình luận trong dự án tham gia, chỉ đổi trạng thái công việc được giao. Không xóa thành viên đang có công việc; cần chuyển công việc trước. Xóa dự án sẽ xóa các công việc và bình luận liên quan.

## Kiểm thử

```powershell
npm.cmd test
npm.cmd run check
$env:RUN_INTEGRATION='true'
$env:TEST_URL='http://localhost:3100'
npm.cmd test
```

Kiểm thử tích hợp cần ứng dụng đang chạy, ba tài khoản mẫu vẫn dùng `SEED_PASSWORD` và chưa bị khóa. Bài test tạo một tài khoản kiểm thử, khóa sau khi kết thúc; dự án kiểm thử được xóa. Chỉ chạy trên môi trường bài thực hành. Khi không đặt `RUN_INTEGRATION=true`, nhóm tích hợp sẽ được bỏ qua rõ ràng.

## Vận hành

```powershell
docker compose ps
docker compose logs --tail 100 app
docker compose logs --tail 100 db
docker compose restart app
docker compose stop
docker compose start
```

Kiểm tra `GET /api/health` trả JSON `{"status":"ok"}` và HTTP 200 khi truy vấn MySQL thành công. `docker compose down` bỏ container/network nhưng giữ volume. Không dùng `down -v` nếu cần giữ dữ liệu.

### Sao lưu và phục hồi

```powershell
node scripts/backup.js
node scripts/restore.js backups/<ten-file>.sql --confirm
```

Sao lưu dùng mysqldump của container, ghi SQL UTF-8 qua luồng nhị phân để tránh lỗi mã hóa PowerShell. Phục hồi dừng app, nhập tệp vào MySQL và khởi động app lại. Lệnh phục hồi thay thế dữ liệu trong các bảng có trong bản sao; chỉ dùng bản sao từ hệ thống này, tại thời điểm không có ghi đồng thời. Sao lưu hiện trạng trước khi phục hồi. Kiểm tra số bản ghi và đăng nhập sau thao tác. Các script này dành cho triển khai Docker; cài MySQL trực tiếp dùng công cụ mysql/mysqldump tương ứng.

### Triển khai máy chủ

Compose mặc định bind cổng app vào `127.0.0.1` và không công bố cổng MySQL. Nếu đưa lên máy chủ, dùng reverse proxy HTTPS; đặt `COOKIE_SECURE=true` và `TRUST_PROXY=true` trong cấu hình app (compose hiện đặt hai biến này thành false để chạy HTTP localhost). Chỉ bật trust proxy khi app nằm sau đúng một reverse proxy tin cậy. Tham khảo cấu hình [deploy/nginx.conf](deploy/nginx.conf); thay tên miền, chứng chỉ bằng thông tin thật. Chưa có chứng chỉ/triển khai internet trong bản thực hành này.

### Cập nhật và quay lui

1. Sao lưu dữ liệu, giữ mã nguồn/ảnh container phiên bản hiện tại.
2. Kiểm thử bản mới trong môi trường riêng trước.
3. Chạy `docker compose up -d --build`, kiểm tra health, đăng nhập và thao tác công việc.
4. Nếu lỗi, quay về mã nguồn cũ và dựng lại. Chỉ phục hồi dữ liệu khi thay đổi schema không tương thích và đã đánh giá các thay đổi sau thời điểm sao lưu.

## Cấu trúc

```text
src/                 API Express, truy cập MySQL, lưu phiên, kiểm tra dữ liệu
public/              Giao diện tiếng Việt
database/schema.sql  Cấu trúc dữ liệu
scripts/             Khởi tạo, cấu hình, sao lưu, phục hồi, xuất báo cáo
test/                Kiểm thử dữ liệu và tích hợp
docs/                Báo cáo, kịch bản bảo vệ và bằng chứng
deploy/              Mẫu reverse proxy
```

Báo cáo chính: [docs/bao-cao.md](docs/bao-cao.md), bản Word được tạo bằng `node scripts/export-report.js`. Cần điền thông tin cá nhân và giảng viên trước khi nộp.
