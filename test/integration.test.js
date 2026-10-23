import test from 'node:test';
import assert from 'node:assert/strict';
import 'dotenv/config';

test('Luồng nghiệp vụ và phân quyền trên Express + MySQL thật', {skip:process.env.RUN_INTEGRATION!=='true'}, async t=>{
  const base=process.env.TEST_URL||'http://localhost:3000';
  function client(){let cookie='',csrf='';return async(path,method='GET',body)=>{const r=await fetch(base+'/api'+path,{method,headers:{'content-type':'application/json',cookie,'x-csrf-token':csrf},body:body?JSON.stringify(body):undefined});const set=r.headers.getSetCookie();if(set.length)cookie=set.map(s=>s.split(';')[0]).join('; ');const data=await r.json();if(data.csrf)csrf=data.csrf;return {status:r.status,data};};}
  async function login(email){const c=client();await c('/session');assert.equal((await c('/login','POST',{email,password:process.env.SEED_PASSWORD})).status,200);return c;}
  const anon=client();let admin,manager,member,outsider,pid,tid,uid;
  const suffix=Date.now();
  try {
    await t.test('API riêng tư yêu cầu đăng nhập',async()=>assert.equal((await anon('/tasks')).status,401));
    await t.test('Chặn POST thiếu CSRF',async()=>assert.equal((await anon('/login','POST',{email:'admin@task.vn',password:'wrong'})).status,403));
    await t.test('Đăng nhập sai không tạo phiên người dùng',async()=>{await anon('/session');assert.equal((await anon('/login','POST',{email:'admin@task.vn',password:'wrong'})).status,401);});
    admin=await login('admin@task.vn');manager=await login('nhom@task.vn');member=await login('user@task.vn');
    await t.test('Thành viên không xem danh sách tài khoản',async()=>assert.equal((await member('/users')).status,403));
    await t.test('Thành viên không tạo được dự án',async()=>assert.equal((await member('/projects','POST',{name:'Forbidden'})).status,403));
    await t.test('Quản trị viên tạo tài khoản',async()=>{const r=await admin('/users','POST',{name:'Kiểm thử quyền '+suffix,email:`outsider${suffix}@task.local`,password:process.env.SEED_PASSWORD,role:'member'});assert.equal(r.status,201);uid=r.data.id;outsider=await login(`outsider${suffix}@task.local`);});
    await t.test('Trưởng nhóm tạo dự án',async()=>{const r=await manager('/projects','POST',{name:'Integration '+suffix,description:'Dữ liệu kiểm thử tự động'});assert.equal(r.status,201);pid=r.data.id;});
    await t.test('Người ngoài không đọc dự án',async()=>{assert.equal((await outsider(`/projects/${pid}/members`)).status,403);assert.ok(!(await outsider('/projects')).data.some(p=>p.id===pid));});
    await t.test('Không giao việc cho người ngoài dự án',async()=>{assert.equal((await manager('/tasks','POST',{project_id:pid,title:'Không hợp lệ',assignee_id:uid,status:'todo',priority:'high'})).status,400);});
    await t.test('Thêm thành viên và giao công việc',async()=>{assert.equal((await manager(`/projects/${pid}/members`,'POST',{email:'user@task.vn'})).status,201);const users=(await manager(`/projects/${pid}/members`)).data;const user=users.find(u=>u.email==='user@task.vn');const r=await manager('/tasks','POST',{project_id:pid,title:'Tác vụ kiểm thử',description:'<script>alert(1)</script>',assignee_id:user.id,status:'todo',priority:'high',due_date:'2026-10-01'});assert.equal(r.status,201);tid=r.data.id;});
    await t.test('Thành viên đổi trạng thái và có lịch sử',async()=>{assert.equal((await member(`/tasks/${tid}`,'PATCH',{status:'doing'})).status,200);assert.equal((await member(`/tasks/${tid}/discussion`)).data.history.length,1);});
    await t.test('Thành viên không sửa tiêu đề hoặc xóa việc',async()=>{assert.equal((await member(`/tasks/${tid}`,'PATCH',{title:'Chiếm quyền',status:'done'})).status,403);assert.equal((await member(`/tasks/${tid}`,'DELETE')).status,403);});
    await t.test('Người ngoài không đọc hay bình luận công việc',async()=>{assert.equal((await outsider(`/tasks/${tid}/discussion`)).status,403);assert.equal((await outsider(`/tasks/${tid}/comments`,'POST',{body:'test'})).status,403);});
    await t.test('Thành viên bình luận và dữ liệu lưu chính xác',async()=>{const text='Đã kiểm thử tiếng Việt ✓';assert.equal((await member(`/tasks/${tid}/comments`,'POST',{body:text})).status,201);assert.equal((await member(`/tasks/${tid}/discussion`)).data.comments[0].body,text);});
    await t.test('Lọc công việc theo dự án/trạng thái/từ khóa',async()=>{const r=await member(`/tasks?project=${pid}&status=doing&q=${encodeURIComponent('Tác vụ')}`);assert.equal(r.status,200);assert.equal(r.data.length,1);assert.equal(r.data[0].id,tid);});
    await t.test('Chặn ngày không tồn tại',async()=>{assert.equal((await manager('/tasks','POST',{project_id:pid,title:'Ngày sai',status:'todo',priority:'low',due_date:'2026-02-30'})).status,400);});
    await t.test('Không xóa thành viên đang được giao công việc',async()=>{const users=(await manager(`/projects/${pid}/members`)).data;const user=users.find(u=>u.email==='user@task.vn');assert.equal((await manager(`/projects/${pid}/members/${user.id}`,'DELETE')).status,409);});
    await t.test('Khóa tài khoản vô hiệu hóa phiên đã đăng nhập',async()=>{assert.equal((await admin(`/users/${uid}`,'PATCH',{active:false})).status,200);assert.equal((await outsider('/projects')).status,401);});
    await t.test('Đăng xuất vô hiệu hóa phiên',async()=>{assert.equal((await member('/logout','POST',{})).status,200);assert.equal((await member('/tasks')).status,401);});
  } finally {
    if(pid&&manager)await manager(`/projects/${pid}`,'DELETE');
    if(uid&&admin)await admin(`/users/${uid}`,'PATCH',{active:false});
  }
});
