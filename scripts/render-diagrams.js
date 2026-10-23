import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
const start=(w,h)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#50785b"/></marker></defs><rect width="100%" height="100%" fill="#fafbf7"/>`;
const text=(x,y,s,size=18)=>`<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" fill="#254535">${s}</text>`;
const box=(x,y,w,h,title,lines=[])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="white" stroke="#9bb091" stroke-width="2"/><rect x="${x}" y="${y}" width="${w}" height="42" rx="10" fill="#e1ebd8"/>${text(x+16,y+27,title,19)}${lines.map((s,i)=>text(x+16,y+68+i*25,s,16)).join('')}`;
const line=(x1,y1,x2,y2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#50785b" stroke-width="2" marker-end="url(#arrow)"/>`;
const architecture=start(1100,600)+text(35,40,'KIẾN TRÚC TRIỂN KHAI TASKFLOW',25)+
box(35,100,270,155,'Trình duyệt',['HTML / CSS / JavaScript','Giao diện và fetch API','http://localhost:3100'])+
box(410,100,305,210,'Container app · Express',['Node.js 24 · cổng 3000','Session / CSRF / kiểm tra quyền','Nghiệp vụ và truy vấn mysql2','API JSON cùng origin'])+
box(805,100,265,210,'Container db · MySQL',['MySQL 8.4 · cổng 3306','Bảng nghiệp vụ và sessions','Không publish cổng DB','Mạng nội bộ Compose'])+
line(305,180,410,180)+text(321,155,'HTTP',15)+line(715,180,805,180)+text(730,155,'SQL',15)+
box(805,410,265,115,'Volume mysql_data',['Dữ liệu giữ qua lần tạo lại'])+line(938,310,938,410)+
box(410,410,305,115,'Tệp sao lưu trên máy',['backups/*.sql · mysqldump'])+line(805,470,715,470)+
text(35,360,'Máy chủ triển khai internet (đề xuất):',17)+text(35,390,'Nginx + HTTPS → Express',17)+text(35,555,'Cấu hình hiện tại: HTTP trên loopback; chưa triển khai tên miền / TLS công khai.',17)+'</svg>';
const erd=start(1200,810)+text(35,40,'MÔ HÌNH QUAN HỆ DỮ LIỆU',25)+
box(35,95,290,220,'users',['PK id','UNIQUE email','name, password_hash','role, active, created_at'])+
box(455,95,290,195,'projects',['PK id','FK owner_id → users.id','name, description','created_at'])+
box(870,95,290,170,'project_members',['PK / FK project_id','PK / FK user_id','Quan hệ dự án – tài khoản'])+
box(455,395,290,240,'tasks',['PK id; FK project_id','FK assignee_id, created_by','title, description','status, priority, due_date','created_at, updated_at'])+
box(35,455,290,170,'comments',['PK id; FK task_id, user_id','body','created_at'])+
box(870,455,290,170,'activity_logs',['PK id; FK task_id, user_id','action','created_at'])+
line(325,160,455,160)+text(350,145,'1 : N',16)+line(745,170,870,170)+text(780,155,'1 : N',16)+
`<path d="M180 95 V65 H1015 V95" fill="none" stroke="#50785b" stroke-width="2" marker-end="url(#arrow)"/>`+text(750,80,'users 1 : N members',14)+
line(600,290,600,395)+text(615,350,'1 : N',16)+line(455,535,325,535)+text(365,520,'1 : N',16)+line(745,535,870,535)+text(780,520,'1 : N',16)+
text(35,695,'Các khóa ngoại user_id, assignee_id và created_by tham chiếu users.id.',17)+
text(35,725,'sessions: PK sid, expires, data; dữ liệu phiên tách khỏi các bảng nghiệp vụ.',17)+
text(35,755,'ON DELETE CASCADE: dự án → công việc/thành viên; công việc → bình luận/lịch sử.',17)+'</svg>';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{const page=await browser.newPage();for(const [name,svg] of [['07-kien-truc',architecture],['08-erd',erd]]){await writeFile(`docs/images/${name}.svg`,svg);await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);await page.locator('svg').screenshot({path:`docs/images/${name}.png`});}console.log('Đã tạo sơ đồ kiến trúc và cơ sở dữ liệu từ SVG.');}finally{await browser.close();}
