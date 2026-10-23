import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from '../src/db.js';

// Add a separate demo scenario; leave existing users and projects untouched.
export async function seedDemo() {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [users] = await conn.query("SELECT id,email FROM users WHERE email IN ('admin@task.vn','nhom@task.vn','user@task.vn')");
    if (users.length !== 3) throw new Error('Cần khởi tạo ba tài khoản mẫu trước.');
    const ids = Object.fromEntries(users.map(u => [u.email,u.id]));
    if (!process.env.SEED_PASSWORD || process.env.SEED_PASSWORD.length < 10) throw new Error('SEED_PASSWORD cần ít nhất 10 ký tự.');
    const hash = await bcrypt.hash(process.env.SEED_PASSWORD,12);
    for (const [name,email] of [['Minh Anh','anh.demo@task.vn'],['Quốc Bảo','bao.demo@task.vn']]) {
      await conn.execute('INSERT IGNORE INTO users (name,email,password_hash,role) VALUES (?,?,?,?)',[name,email,hash,'member']);
      const [[u]] = await conn.execute('SELECT id FROM users WHERE email=?',[email]); ids[email]=u.id;
    }
    const admin=ids['admin@task.vn'],manager=ids['nhom@task.vn'],member=ids['user@task.vn'],anh=ids['anh.demo@task.vn'],bao=ids['bao.demo@task.vn'];
    const scenarios=[
      ['Website bán hàng · Demo','Ra mắt website, phối hợp thiết kế, lập trình và kiểm thử.',manager,[manager,member,anh,bao],[
        ['Hoàn thiện trang sản phẩm',member,'doing','high',1],['Sửa lỗi giỏ hàng',member,'todo','high',-1],['Thiết kế giao diện thanh toán',anh,'done','medium',-2],['Kiểm thử đặt hàng',bao,'doing','high',2],['Tối ưu hiển thị di động',null,'todo','medium',4],['Bổ sung bộ lọc sản phẩm',anh,'todo','low',5]]],
      ['Ứng dụng nội bộ · Demo','Chuẩn hóa quy trình làm việc và tài liệu hướng dẫn của nhóm.',manager,[manager,anh,bao],[
        ['Khảo sát nhu cầu nhân sự',anh,'done','medium',-3],['Thiết kế luồng phê duyệt',bao,'doing','high',-1],['Viết hướng dẫn sử dụng',null,'todo','medium',6]]],
      ['Vận hành hệ thống · Demo','Theo dõi hạ tầng và kế hoạch sao lưu do quản trị viên phụ trách.',admin,[admin,bao],[
        ['Kiểm tra phục hồi dữ liệu',admin,'doing','high',2],['Rà soát tài khoản truy cập',admin,'todo','high',-1],['Cấu hình giám sát dịch vụ',bao,'done','medium',-2]]]
    ];
    for (const [name,description,owner,people,tasks] of scenarios) {
      const [[existing]]=await conn.execute('SELECT id FROM projects WHERE name=? AND owner_id=? LIMIT 1',[name,owner]);
      if(existing) continue;
      const [p]=await conn.execute('INSERT INTO projects (name,description,owner_id) VALUES (?,?,?)',[name,description,owner]);
      for(const uid of people) await conn.execute('INSERT INTO project_members VALUES (?,?)',[p.insertId,uid]);
      for(const [title,assignee,status,priority,offset] of tasks){
        const [t]=await conn.execute('INSERT INTO tasks (project_id,title,description,assignee_id,status,priority,due_date,created_by) VALUES (?,?,?,?,?,?,DATE_ADD(CURRENT_DATE, INTERVAL ? DAY),?)',[p.insertId,title,'Hoàn thành nội dung, kiểm tra kết quả và trao đổi trong phần bình luận trước khi bàn giao.',assignee,status,priority,offset,owner]);
        await conn.execute('INSERT INTO activity_logs (task_id,user_id,action) VALUES (?,?,?)',[t.insertId,owner,'Tạo công việc và thiết lập kế hoạch thực hiện']);
        if(assignee) await conn.execute('INSERT INTO comments (task_id,user_id,body) VALUES (?,?,?)',[t.insertId,assignee,status==='done'?'Đã hoàn thành, nhờ nhóm kiểm tra kết quả.':'Đã nhận việc. Tôi sẽ cập nhật tiến độ tại đây.']);
      }
    }
    await conn.commit();
    console.log('Đã bổ sung dữ liệu demo theo vai trò; giữ nguyên dữ liệu hiện có.');
  } catch(error) { await conn.rollback(); throw error; }
  finally { conn.release(); }
}
try { await seedDemo(); } catch(error) { console.error(error.message); process.exitCode=1; }
finally { await db.end(); }
