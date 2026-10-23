import session from 'express-session';

// express-session Store API; all SQL goes through the application's mysql2 pool.
export class MySQLSessionStore extends session.Store {
  constructor(db) {
    super(); this.db=db;
    this.timer=setInterval(()=>db.execute('DELETE FROM sessions WHERE expires < ?',[Date.now()]).catch(e=>console.error('Session cleanup:',e.code)),900000);
    this.timer.unref();
  }
  async ready() {
    await this.db.query('CREATE TABLE IF NOT EXISTS sessions (sid VARCHAR(128) CHARACTER SET ascii PRIMARY KEY, expires BIGINT UNSIGNED NOT NULL, data MEDIUMTEXT NOT NULL, INDEX idx_session_expiry (expires)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
  }
  get(sid,callback) {
    this.db.execute('SELECT data FROM sessions WHERE sid=? AND expires>?',[sid,Date.now()])
      .then(([rows])=>callback(null,rows[0]?JSON.parse(rows[0].data):null)).catch(callback);
  }
  set(sid,value,callback=()=>{}) {
    const expires=value.cookie.expires?new Date(value.cookie.expires).getTime():Date.now()+28800000;
    this.db.execute('INSERT INTO sessions (sid,expires,data) VALUES (?,?,?) ON DUPLICATE KEY UPDATE expires=?,data=?',[sid,expires,JSON.stringify(value),expires,JSON.stringify(value)]).then(()=>callback()).catch(callback);
  }
  destroy(sid,callback=()=>{}) { this.db.execute('DELETE FROM sessions WHERE sid=?',[sid]).then(()=>callback()).catch(callback); }
  touch(sid,value,callback=()=>{}) {
    const expires=value.cookie.expires?new Date(value.cookie.expires).getTime():Date.now()+28800000;
    this.db.execute('UPDATE sessions SET expires=? WHERE sid=?',[expires,sid]).then(()=>callback()).catch(callback);
  }
  close(){clearInterval(this.timer);}
}
