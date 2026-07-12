import pool from './db';

async function check() {
  const tables = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
  console.log('Tables:', tables.rows.map((r: any) => r.tablename).join(', '));
  
  const counts = await pool.query(`
    SELECT 
      (SELECT count(*) FROM users) as users,
      (SELECT count(*) FROM clubs) as clubs,
      (SELECT count(*) FROM events) as events,
      (SELECT count(*) FROM tickets) as tickets,
      (SELECT count(*) FROM saved_events) as saved_events,
      (SELECT count(*) FROM user_clubs) as user_clubs
  `);
  console.log('Counts:', JSON.stringify(counts.rows[0]));
  process.exit(0);
}

check().catch((e) => { console.error(e.message); process.exit(1); });
