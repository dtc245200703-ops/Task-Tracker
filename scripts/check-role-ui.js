import { chromium } from 'playwright';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Browser checks against fixed API fixtures; does not require or modify MySQL.
const browser=await chromium.launch({channel:'msedge',headless:true});
await mkdir('docs/images',{recursive:true});
try {
  for(const [role,id,expected] of [['admin',1,3],['manager',2,2],['member',3,1]]) {
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const users=[{id:1,name:'Admin',role:'admin',active:1},{id:2,name:'Trưởng nhóm',role:'manager',active:1},{id:3,name:'Thành viên',role:'member',active:1}];
    const projects=[{id:1,name:'Website',owner_id:2},{id:2,name:'Vận hành',owner_id:1}];
    const tasks=[{id:1,project_id:1,title:'Việc của thành viên',assignee_id:3,status:'doing',priority:'high',due_date:'2026-10-01'}, {id:2,project_id:1,title:'Việc chưa giao',assignee_id:null,status:'todo',priority:'medium'}, {id:3,project_id:2,title:'Việc vận hành',assignee_id:1,status:'done',priority:'low'}];
    await page.route('http://taskflow.test/**',async route=>{
      const path=new URL(route.request().url()).pathname;
      if(path.startsWith('/api/')) {
        const data=path==='/api/session'?{user:users.find(u=>u.id===id),csrf:'fixture'}:path==='/api/projects'?projects:path==='/api/tasks'?tasks:path==='/api/users'?users:[];
        await route.fulfill({json:data});
      } else {
        const file=path==='/'?'index.html':path.slice(1);
        await route.fulfill({body:await readFile(new URL('../public/'+file,import.meta.url)),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});
      }
    });
    await page.goto('http://taskflow.test/');await page.locator('.role-banner.'+role).waitFor();
    assert.equal(await page.locator('.task-card').count(),expected);
    assert.equal(await page.locator('#create-task').isVisible(),role!=='member');
    assert.equal(await page.locator('#users-nav').isVisible(),role==='admin');
    assert.ok(!(await page.locator('.role-banner').innerText()).includes('???'));
    await page.screenshot({path:`docs/images/demo-${role}.png`,fullPage:true});
    await page.setViewportSize({width:390,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile overflow: '+role);
    await page.locator('[data-overview-page]').click();
    await page.locator(role==='admin'?'table':role==='manager'?'.project-grid':'.board').waitFor();
    if(role==='member') assert.equal(await page.locator('.task-card').count(),3,'Project board remains available');
    assert.deepEqual(errors,[]);await page.close();
  }
  console.log('PASS: three role dashboards, task scope, actions, mobile layout; fixture API only.');
} finally { await browser.close(); }
