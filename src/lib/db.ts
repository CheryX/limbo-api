import { Pool } from 'pg';
import fs from 'fs';

console.log("Attempting to connect with user:", process.env.DB_USER);

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: String(process.env.DB_PASSWORD),
    port: 5432,
});

export default async function query(text: string, params: any[] = []) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        return res.rows;
    } catch (err) {
        console.error('Query Error:', err);
        return -1;
    }
}

export async function init_db() {
    const init_sql = fs.readFileSync('./src/schemas/init_db.sql', 'utf-8');
    
    try {
        await pool.query(init_sql);
        console.log("Database initialized successfully");
    } catch (err) {
        console.error("Initialization failed:", err);
    }
}