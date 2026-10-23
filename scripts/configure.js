import { access, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
try { await access('.env'); console.log('.env đã tồn tại; giữ cấu hình hiện có.'); }
catch {
  const secret = () => randomBytes(24).toString('hex');
  await writeFile('.env',`PORT=3000\nNODE_ENV=development\nDB_HOST=127.0.0.1\nDB_PORT=3306\nDB_NAME=task_tracker\nDB_USER=task_app\nDB_PASSWORD=${secret()}\nSESSION_SECRET=${secret()}\nSEED_PASSWORD=${secret()}\nMYSQL_ROOT_PASSWORD=${secret()}\n`,{flag:'wx'});
  console.log('Đã tạo .env với thông tin ngẫu nhiên. Xem SEED_PASSWORD trong .env để đăng nhập tài khoản mẫu. Không đưa .env vào bài nộp công khai.');
}
