import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
const file=process.argv[2];
if(!file || process.argv[3]!=='--confirm'){console.error('Phục hồi sẽ thay thế dữ liệu hiện có. Cách dùng: node scripts/restore.js backups/<ten-file>.sql --confirm');process.exit(1);}
const root=resolve('backups'),target=resolve(file),rel=relative(root,target);
if(!rel||rel.startsWith('..')||isAbsolute(rel)||!target.endsWith('.sql'))throw new Error('Chỉ phục hồi tệp .sql trong thư mục backups.');
const input=await readFile(target);
function run(args,options={}){const r=spawnSync('docker',args,{stdio:'inherit',...options});if(r.error)throw r.error;if(r.status!==0)throw new Error('Docker thất bại: '+args.slice(0,3).join(' '));}
run(['compose','stop','app']);
try {
  run(['compose','exec','-T','db','sh','-c','MYSQL_PWD="$MYSQL_PASSWORD" exec mysql --user="$MYSQL_USER" --default-character-set=utf8mb4 "$MYSQL_DATABASE"'],{input,stdio:['pipe','inherit','inherit']});
  console.log('Đã phục hồi cơ sở dữ liệu. Kiểm tra lại đăng nhập và số lượng công việc.');
} finally {run(['compose','start','app']);}
