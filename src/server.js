import 'dotenv/config';
import { MySQLSessionStore } from './session-store.js';
import { db } from './db.js';
import { createApp } from './app.js';

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32 || process.env.SESSION_SECRET.startsWith('replace_')) throw new Error('Cần cấu hình SESSION_SECRET ngẫu nhiên ít nhất 32 ký tự trong .env.');
await db.query('SELECT 1');
const store = new MySQLSessionStore(db);
await store.ready();
const server = createApp(db,store).listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log(`Task Tracker: http://localhost:${process.env.PORT || 3000}`));
async function shutdown() {
  server.close(async () => { await store.close(); await db.end(); process.exit(0); });
  setTimeout(()=>process.exit(1),10000).unref();
}
process.on('SIGINT',shutdown); process.on('SIGTERM',shutdown);
