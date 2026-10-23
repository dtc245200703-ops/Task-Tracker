import 'dotenv/config';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdir, writeFile } from 'node:fs/promises';
const base=`http://localhost:${process.env.PORT||3000}`;
function run(script,args=[]){const result=spawnSync(process.execPath,[script,...args],{encoding:'utf8'});if(result.status!==0)throw new Error(result.stderr||result.stdout);console.log(result.stdout.trim());}
async function login(){let cookie='',csrf='';const api=async(path,method='GET',body)=>{const response=await fetch(base+'/api'+path,{method,headers:{cookie,'x-csrf-token':csrf,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});if(response.headers.getSetCookie().length)cookie=response.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');const data=await response.json();if(data.csrf)csrf=data.csrf;if(!response.ok)throw new Error(data.error);return data;};await api('/session');await api('/login','POST',{email:'admin@task.local',password:process.env.SEED_PASSWORD});return api;}
const api=await login();const projects=await api('/projects'),tasks=await api('/tasks');
run('scripts/backup.js');const files=(await readdir('backups')).filter(f=>f.endsWith('.sql')).sort();const file='backups/'+files.at(-1);
const marker=await api('/projects','POST',{name:'RESTORE_VERIFICATION_'+Date.now(),description:'Bản ghi đánh dấu sau sao lưu'});
assert.equal((await api('/projects')).length,projects.length+1);
run('scripts/restore.js',[file,'--confirm']);
let ready=false;for(let i=0;i<30;i++){try{const r=await fetch(base+'/api/health');if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,1000));}
assert.ok(ready,'Dịch vụ sẵn sàng sau phục hồi');
const after=await login();const restored=await after('/projects'),restoredTasks=await after('/tasks');
assert.equal(restored.length,projects.length);assert.equal(restoredTasks.length,tasks.length);assert.ok(!restored.some(p=>p.id===marker.id));
assert.deepEqual(restoredTasks.map(t=>[t.id,t.title,t.status]),tasks.map(t=>[t.id,t.title,t.status]));
const result={status:'PASS',file,projectsBefore:projects.length,projectsAfter:restored.length,tasksBefore:tasks.length,tasksAfter:restoredTasks.length,markerRemoved:true,vietnameseDataMatched:true,loginAfterRestore:true};
await writeFile('docs/restore-result.json',JSON.stringify(result,null,2));console.log('PASS: phục hồi đúng số bản ghi, bỏ bản ghi sau sao lưu, giữ tiếng Việt và đăng nhập được.');
