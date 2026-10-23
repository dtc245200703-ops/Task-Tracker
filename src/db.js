import 'dotenv/config';
import mysql from 'mysql2/promise';
export const db = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'task_tracker',
  waitForConnections: true, connectionLimit: 10, dateStrings: true,
  charset: 'utf8mb4', timezone: '+07:00'
});
db.pool.on('connection', connection => connection.query("SET time_zone = '+07:00'"));
