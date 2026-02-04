import fs from 'fs';

export default async function query(query: string, params: any[] = []) {

    const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.ACCOUNT_ID}/d1/database/${process.env.DB_ID}/query`;
    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${process.env.TOKEN}`,
        },
        method: "POST",
        body: `{ "sql": "${query}", "params": ["${params.join('", "')}"] }`
    });

    const data = await response.json();

    if (!data || !data.success) {
        console.log(data.errors)
        return -1;
    }

    return data.result[0].results;

}

export function init_db() {
    const init_sql = fs.readFileSync('./src/schemas/init_db.sql', 'utf-8');
    const statements = init_sql.split(';').map(stmt => stmt.trim()).filter(stmt => stmt.length > 0);

    statements.forEach(async (stmt) => {
        await query(stmt);
    });
}