import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { db } from '../src/db.js';

try {
  const schema = await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8');
  for (const statement of schema.split(';').map(s => s.trim()).filter(Boolean)) await db.query(statement);
  const [[{ count }]] = await db.query('SELECT COUNT(*) AS count FROM users');
  if (!count) {
    if (!process.env.SEED_PASSWORD || process.env.SEED_PASSWORD.length < 10) throw new Error('SEED_PASSWORD cần ít nhất 10 ký tự.');
    const hash = await bcrypt.hash(process.env.SEED_PASSWORD, 12);
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?),(?,?,?,?),(?,?,?,?)',
        ['Quản trị viên','admin@task.vn',hash,'admin','Trưởng nhóm','nhom@task.vn',hash,'manager','Thành viên','user@task.vn',hash,'member']);
      const [[admin]] = await conn.query("SELECT id FROM users WHERE email='admin@task.vn'");
      const [[manager]] = await conn.query("SELECT id FROM users WHERE email='nhom@task.vn'");
      const [[member]] = await conn.query("SELECT id FROM users WHERE email='user@task.vn'");
      const [project] = await conn.execute('INSERT INTO projects (name,description,owner_id) VALUES (?,?,?)', ['Bài thi quản lý công việc','Phát triển và triển khai hệ thống Task Tracker',manager.id]);
      for (const uid of [admin.id,manager.id,member.id]) await conn.execute('INSERT INTO project_members VALUES (?,?)',[project.insertId,uid]);
      for (const [title,status,priority,offset] of [['Phân tích yêu cầu','done','high',-2],['Thiết kế cơ sở dữ liệu','done','high',-1],['Xây dựng giao diện','doing','medium',3],['Kiểm thử phân quyền','todo','high',5],['Viết báo cáo triển khai','todo','medium',7]]) {
        await conn.execute('INSERT INTO tasks (project_id,title,description,assignee_id,status,priority,due_date,created_by) VALUES (?,?,?,?,?,?,DATE_ADD(CURRENT_DATE, INTERVAL ? DAY),?)', [project.insertId,title,'Công việc mẫu phục vụ trình diễn',member.id,status,priority,offset,manager.id]);
      }
      await conn.commit();
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
    console.log('Đã tạo dữ liệu mẫu. Email: admin@task.vn, nhom@task.vn, user@task.vn. Mật khẩu: giá trị SEED_PASSWORD trong .env.');
  }
  console.log('Cơ sở dữ liệu đã sẵn sàng.');
} catch (e) { console.error(e.message); process.exitCode = 1; }
finally { await db.end(); }
