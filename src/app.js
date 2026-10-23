import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ensure, id, str, choice, date } from './validation.js';

export function createApp(db, store) {
  const app = express();
  if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '32kb' }));
  app.use(session({ secret: process.env.SESSION_SECRET, store, resave: false, saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.COOKIE_SECURE === 'true', maxAge: 8 * 60 * 60 * 1000 } }));
  const rows = async (sql, values = []) => (await db.execute(sql, values))[0];
  const one = async (sql, values = []) => (await rows(sql, values))[0];
  const safeUser = u => ({ id: u.id, name: u.name, email: u.email, role: u.role });
  const csrf = req => req.session.csrf ||= randomBytes(24).toString('hex');
  app.get('/api/health', async (req,res) => { await db.query('SELECT 1'); res.json({ status: 'ok' }); });
  app.get('/api/session', async (req,res) => {
    const u = req.session.userId ? await one('SELECT * FROM users WHERE id=? AND active=1',[req.session.userId]) : null;
    res.json({ user: u ? safeUser(u) : null, csrf: csrf(req) });
  });
  app.use('/api', (req,res,next) => {
    if (!['GET','HEAD','OPTIONS'].includes(req.method)) {
      const supplied = Buffer.from(req.get('x-csrf-token') || '');
      const expected = Buffer.from(req.session.csrf || '');
      ensure(supplied.length > 0 && supplied.length === expected.length && timingSafeEqual(supplied,expected),403,'Phiên làm việc không hợp lệ. Hãy tải lại trang.');
    }
    next();
  });
  app.post('/api/login', rateLimit({ windowMs: 15*60*1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Thử đăng nhập quá nhiều lần. Vui lòng đợi 15 phút.' } }), async (req,res) => {
    const email = str(req.body.email,190,'Email').toLowerCase();
    const password = str(req.body.password,128,'Mật khẩu');
    const u = await one('SELECT * FROM users WHERE email=?',[email]);
    ensure(u && u.active && await bcrypt.compare(password,u.password_hash),401,'Email hoặc mật khẩu không đúng.');
    await new Promise((resolve,reject)=>req.session.regenerate(e=>e?reject(e):resolve()));
    req.session.userId = u.id;
    res.json({ user: safeUser(u), csrf: csrf(req) });
  });
  app.use('/api', async (req,res,next) => {
    const u = req.session.userId ? await one('SELECT * FROM users WHERE id=? AND active=1',[req.session.userId]) : null;
    ensure(u,401,'Vui lòng đăng nhập.'); req.user = safeUser(u); next();
  });
  app.post('/api/logout', async (req,res) => {
    await new Promise((resolve,reject)=>req.session.destroy(e=>e?reject(e):resolve())); res.clearCookie('connect.sid'); res.json({ok:true});
  });
  app.post('/api/password', async (req,res) => {
    const password = str(req.body.password,72,'Mật khẩu mới');
    ensure(password.length >= 10 && Buffer.byteLength(password) <= 72,400,'Mật khẩu mới cần ít nhất 10 ký tự và tối đa 72 byte.');
    const current = str(req.body.current,128,'Mật khẩu hiện tại');
    const u = await one('SELECT * FROM users WHERE id=?',[req.user.id]);
    ensure(await bcrypt.compare(current,u.password_hash),400,'Mật khẩu hiện tại không đúng.');
    await rows('UPDATE users SET password_hash=? WHERE id=?',[await bcrypt.hash(password,12),u.id]); res.json({ok:true});
  });
  const isAdmin = req => ensure(req.user.role === 'admin',403,'Chỉ quản trị viên được thực hiện.');
  const projectAccess = async (req,projectId,write=false) => {
    const p = await one('SELECT * FROM projects WHERE id=?',[id(projectId)]);
    ensure(p,404,'Không tìm thấy dự án.');
    const privileged = req.user.role === 'admin' || (req.user.role === 'manager' && p.owner_id === req.user.id);
    ensure(privileged || (!write && await one('SELECT 1 FROM project_members WHERE project_id=? AND user_id=?',[p.id,req.user.id])),403,'Bạn không có quyền với dự án này.');
    return p;
  };
  const taskAccess = async req => {
    const t = await one('SELECT * FROM tasks WHERE id=?',[id(req.params.id)]);
    ensure(t,404,'Không tìm thấy công việc.'); await projectAccess(req,t.project_id); return t;
  };
  app.get('/api/users', async (req,res) => {
    isAdmin(req); res.json(await rows('SELECT id,name,email,role,active FROM users ORDER BY id'));
  });
  app.post('/api/users', async (req,res) => {
    isAdmin(req);
    const name = str(req.body.name,100,'Họ tên'); const email = str(req.body.email,190,'Email').toLowerCase();
    ensure(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),400,'Email không hợp lệ.');
    const password = str(req.body.password,72,'Mật khẩu');
    ensure(password.length >= 10 && Buffer.byteLength(password)<=72,400,'Mật khẩu cần ít nhất 10 ký tự và tối đa 72 byte.');
    const role = choice(req.body.role,['admin','manager','member']);
    const result = await rows('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)',[name,email,await bcrypt.hash(password,12),role]);
    res.status(201).json({id:result.insertId});
  });
  app.patch('/api/users/:id', async (req,res) => {
    isAdmin(req); const uid = id(req.params.id);
    ensure(uid !== req.user.id,400,'Không thể khóa tài khoản đang sử dụng.');
    ensure(typeof req.body.active === 'boolean',400,'Trạng thái không hợp lệ.');
    const result = await rows('UPDATE users SET active=? WHERE id=?',[req.body.active,uid]);
    ensure(result.affectedRows,404,'Không tìm thấy tài khoản.'); res.json({ok:true});
  });
  app.get('/api/projects', async (req,res) => {
    const sql = 'SELECT p.*,u.name AS owner_name,(SELECT COUNT(*) FROM tasks t WHERE t.project_id=p.id) AS task_count FROM projects p JOIN users u ON u.id=p.owner_id';
    res.json(await rows(sql + (req.user.role === 'admin' ? '' : ' WHERE p.owner_id=? OR EXISTS (SELECT 1 FROM project_members m WHERE m.project_id=p.id AND m.user_id=?)') + ' ORDER BY p.id DESC',req.user.role === 'admin' ? [] : [req.user.id,req.user.id]));
  });
  app.post('/api/projects', async (req,res) => {
    ensure(['admin','manager'].includes(req.user.role),403,'Chỉ quản trị viên và trưởng nhóm được tạo dự án.');
    const name = str(req.body.name,150,'Tên dự án'); const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    ensure(description.length<=5000,400,'Mô tả quá dài.');
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [p] = await conn.execute('INSERT INTO projects (name,description,owner_id) VALUES (?,?,?)',[name,description,req.user.id]);
      await conn.execute('INSERT INTO project_members VALUES (?,?)',[p.insertId,req.user.id]);
      await conn.commit(); res.status(201).json({id:p.insertId});
    } catch(e) { await conn.rollback(); throw e; } finally { conn.release(); }
  });
  app.patch('/api/projects/:id', async (req,res) => {
    const p = await projectAccess(req,req.params.id,true);
    const name = str(req.body.name,150,'Tên dự án'); const description = str(req.body.description || 'Chưa có mô tả',5000,'Mô tả');
    await rows('UPDATE projects SET name=?,description=? WHERE id=?',[name,description,p.id]); res.json({ok:true});
  });
  app.delete('/api/projects/:id', async (req,res) => {
    const p = await projectAccess(req,req.params.id,true); await rows('DELETE FROM projects WHERE id=?',[p.id]); res.json({ok:true});
  });
  app.get('/api/projects/:id/members', async (req,res) => {
    const p = await projectAccess(req,req.params.id);
    res.json(await rows('SELECT u.id,u.name,u.email,u.role,u.active FROM project_members m JOIN users u ON u.id=m.user_id WHERE m.project_id=? ORDER BY u.name',[p.id]));
  });
  app.post('/api/projects/:id/members', async (req,res) => {
    const p = await projectAccess(req,req.params.id,true);
    const email = str(req.body.email,190,'Email').toLowerCase();
    const u = await one('SELECT id FROM users WHERE email=? AND active=1',[email]);
    ensure(u,404,'Không tìm thấy tài khoản đang hoạt động với email này.');
    await rows('INSERT IGNORE INTO project_members (project_id,user_id) VALUES (?,?)',[p.id,u.id]); res.status(201).json({ok:true});
  });
  app.delete('/api/projects/:id/members/:userId', async (req,res) => {
    const p = await projectAccess(req,req.params.id,true); const uid = id(req.params.userId);
    ensure(uid !== p.owner_id,400,'Không thể xóa chủ dự án khỏi nhóm.');
    ensure(!await one('SELECT id FROM tasks WHERE project_id=? AND assignee_id=? LIMIT 1',[p.id,uid]),409,'Cần chuyển các công việc của thành viên trước khi xóa khỏi nhóm.');
    await rows('DELETE FROM project_members WHERE project_id=? AND user_id=?',[p.id,uid]); res.json({ok:true});
  });
  app.get('/api/tasks', async (req,res) => {
    const values=[]; const where=[];
    if (req.user.role !== 'admin') { where.push('(p.owner_id=? OR EXISTS (SELECT 1 FROM project_members m WHERE m.project_id=p.id AND m.user_id=?))'); values.push(req.user.id,req.user.id); }
    if (req.query.project) { where.push('t.project_id=?'); values.push(id(req.query.project)); }
    if (req.query.status) { where.push('t.status=?'); values.push(choice(req.query.status,['todo','doing','done'])); }
    if (req.query.assignee) { where.push('t.assignee_id=?'); values.push(id(req.query.assignee)); }
    if (req.query.q) { where.push('(t.title LIKE ? OR t.description LIKE ?)'); const q = '%' + str(req.query.q,200,'Từ khóa') + '%'; values.push(q,q); }
    res.json(await rows(`SELECT t.*,p.name AS project_name,u.name AS assignee_name FROM tasks t JOIN projects p ON p.id=t.project_id LEFT JOIN users u ON u.id=t.assignee_id ${where.length ? 'WHERE '+where.join(' AND ') : ''} ORDER BY t.id DESC LIMIT 1000`,values));
  });
  const taskValues = async (body,pid) => {
    const title = str(body.title,200,'Tên công việc');
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    ensure(description.length <= 5000,400,'Mô tả tối đa 5000 ký tự.');
    const assignee = body.assignee_id ? id(body.assignee_id) : null;
    if (assignee) ensure(await one('SELECT 1 FROM project_members m JOIN users u ON u.id=m.user_id WHERE m.project_id=? AND m.user_id=? AND u.active=1',[pid,assignee]),400,'Người nhận phải là thành viên đang hoạt động trong dự án.');
    return [title,description,assignee,choice(body.status,['todo','doing','done']),choice(body.priority,['low','medium','high']),date(body.due_date)];
  };
  app.post('/api/tasks', async (req,res) => {
    const p = await projectAccess(req,req.body.project_id,true); const values = await taskValues(req.body,p.id);
    const result = await rows('INSERT INTO tasks (project_id,title,description,assignee_id,status,priority,due_date,created_by) VALUES (?,?,?,?,?,?,?,?)',[p.id,...values,req.user.id]);
    res.status(201).json({id:result.insertId});
  });
  app.patch('/api/tasks/:id', async (req,res) => {
    const t = await taskAccess(req);
    const p = await projectAccess(req,t.project_id);
    const manager = req.user.role === 'admin' || (req.user.role === 'manager' && p.owner_id === req.user.id);
    let sql,values,action;
    if (manager) {
      values = await taskValues(req.body,t.project_id);
      sql = 'UPDATE tasks SET title=?,description=?,assignee_id=?,status=?,priority=?,due_date=? WHERE id=?';
      action = `Cập nhật công việc: ${values[0]}; trạng thái ${t.status} → ${values[3]}`;
    } else {
      ensure(t.assignee_id === req.user.id,403,'Bạn chỉ được đổi trạng thái công việc được giao.');
      ensure(Object.keys(req.body).length===1 && Object.hasOwn(req.body,'status'),403,'Thành viên chỉ được đổi trạng thái.');
      values = [choice(req.body.status,['todo','doing','done'])]; sql = 'UPDATE tasks SET status=? WHERE id=?'; action = `Trạng thái ${t.status} → ${values[0]}`;
    }
    const conn = await db.getConnection();
    try { await conn.beginTransaction(); await conn.execute(sql,[...values,t.id]); await conn.execute('INSERT INTO activity_logs (task_id,user_id,action) VALUES (?,?,?)',[t.id,req.user.id,action]); await conn.commit(); }
    catch(e) { await conn.rollback(); throw e; } finally { conn.release(); }
    res.json({ok:true});
  });
  app.delete('/api/tasks/:id', async (req,res) => {
    const t = await taskAccess(req); await projectAccess(req,t.project_id,true); await rows('DELETE FROM tasks WHERE id=?',[t.id]); res.json({ok:true});
  });
  app.get('/api/tasks/:id/discussion', async (req,res) => {
    const t = await taskAccess(req);
    const comments = await rows('SELECT c.*,u.name FROM comments c JOIN users u ON u.id=c.user_id WHERE c.task_id=? ORDER BY c.id',[t.id]);
    const history = await rows('SELECT l.*,u.name FROM activity_logs l JOIN users u ON u.id=l.user_id WHERE l.task_id=? ORDER BY l.id DESC',[t.id]);
    res.json({comments,history});
  });
  app.post('/api/tasks/:id/comments', async (req,res) => {
    const t = await taskAccess(req); const body = str(req.body.body,2000,'Bình luận');
    await rows('INSERT INTO comments (task_id,user_id,body) VALUES (?,?,?)',[t.id,req.user.id,body]); res.status(201).json({ok:true});
  });
  app.use('/api', (req,res) => res.status(404).json({error:'Không tìm thấy API.'}));
  app.use(express.static(fileURLToPath(new URL('../public',import.meta.url))));
  app.use((error,req,res,next) => {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({error:'Email hoặc dữ liệu đã tồn tại.'});
    if (!error.status || error.status >= 500) console.error(JSON.stringify({time:new Date().toISOString(),method:req.method,path:req.path,code:error.code || 'SERVER_ERROR'}));
    res.status(error.status || 500).json({error: error.status && error.status < 500 ? error.message : 'Lỗi máy chủ. Vui lòng thử lại sau.'});
  });
  return app;
}
