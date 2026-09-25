import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const isSslEnabled = process.env.DB_SSL === 'true' || Boolean(process.env.MYSQL_URL || process.env.DATABASE_URL);

export const pool = process.env.DATABASE_URL || process.env.MYSQL_URL
  ? mysql.createPool({
      uri: process.env.DATABASE_URL || process.env.MYSQL_URL,
      waitForConnections: true,
      connectionLimit: 25,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      decimalNumbers: true,
      ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false },
    })
  : mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cricket_conquest',
      waitForConnections: true,
      connectionLimit: 25,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      decimalNumbers: true,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });

export async function testDbConnection(): Promise<void> {
  let retries = 5;
  while (retries > 0) {
    try {
      const connection = await pool.getConnection();
      console.log(`[DB] Connected to database: ${process.env.DB_NAME || 'cricket_conquest'}`);
      connection.release();
      return;
    } catch (error: any) {
      retries--;
      console.warn(`[DB] Connection attempt failed (${retries} retries left):`, error.message);
      if (retries === 0) throw error;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}
