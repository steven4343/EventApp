import pool from './db';

async function check() {
  const clubs = await pool.query("SELECT id, name, length(image) as image_length FROM clubs");
  console.log('Club images:');
  clubs.rows.forEach((r: any) => console.log(`  ${r.id} (${r.name}): ${r.image_length} chars`));
  
  const events = await pool.query("SELECT id, title, length(image) as image_length FROM events");
  console.log('Event images:');
  events.rows.forEach((r: any) => console.log(`  ${r.id} (${r.title}): ${r.image_length} chars`));
  
  const images = await pool.query("SELECT count(*) as count FROM images");
  console.log(`\nImages table: ${images.rows[0].count} rows`);
  
  process.exit(0);
}

check().catch((e) => { console.error(e.message); process.exit(1); });
