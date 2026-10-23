import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
await mkdir('backups',{recursive:true});
const file=resolve('backups',`task-tracker-${new Date().toISOString().replace(/[:.]/g,'-')}.sql`);
const child=spawn('docker',['compose','exec','-T','db','sh','-c','MYSQL_PWD="$MYSQL_PASSWORD" exec mysqldump --user="$MYSQL_USER" --single-transaction --no-tablespaces --set-gtid-purged=OFF --default-character-set=utf8mb4 "$MYSQL_DATABASE"'],{stdio:['ignore','pipe','pipe']});
const out=[],errors=[];child.stdout.on('data',d=>out.push(d));child.stderr.on('data',d=>errors.push(d));
child.on('error',e=>{console.error(e.message);process.exitCode=1;});
child.on('close',async code=>{if(code!==0){console.error(Buffer.concat(errors).toString());process.exitCode=1;return;}await writeFile(file,Buffer.concat(out),{flag:'wx'});console.log('Đã sao lưu: '+file);});
