import pool from './db';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

function fileToDataUri(filePath: string): string | null {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp',
  };
  const mime = mimeMap[ext];
  if (!mime) return null;
  const base64 = fs.readFileSync(filePath, { encoding: 'base64' });
  return `data:${mime};base64,${base64}`;
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function seedImagesFromBase64() {
  // Copy existing base64 images from events and clubs tables into the images table
  for (const entityType of ['event', 'club']) {
    const rows = await pool.query(
      `SELECT id, image FROM ${entityType}s WHERE image IS NOT NULL AND image != ''`
    );
    for (const row of rows.rows) {
      const exists = await pool.query(
        'SELECT id FROM images WHERE entity_type = $1 AND entity_id = $2',
        [entityType, row.id]
      );
      if (exists.rows.length === 0) {
        await pool.query(
          `INSERT INTO images (id, entity_type, entity_id, image_data, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [`img_${uuidv4()}`, entityType, row.id, row.image]
        );
        console.log(`Seeded ${entityType} ${row.id} from base64`);
      }
    }
  }
}

async function seedImagesFromFiles() {
  const imagesDir = path.join(__dirname, 'public', 'images');
  if (!fs.existsSync(imagesDir)) return;

  const clubNameMap: Record<string, string> = {};
  const clubRows = await pool.query('SELECT id, name FROM clubs');
  for (const row of clubRows.rows) {
    const key = normalize(row.name);
    // Also index by individual words
    clubNameMap[key] = row.id;
    for (const word of row.name.split(/[\s,()&]+/)) {
      const w = normalize(word);
      if (w.length > 2) clubNameMap[w] = row.id;
    }
  }

  const eventNameMap: Record<string, string> = {};
  const eventRows = await pool.query('SELECT id, title FROM events');
  for (const row of eventRows.rows) {
    const key = normalize(row.title);
    eventNameMap[key] = row.id;
    for (const word of row.title.split(/[\s,()&]+/)) {
      const w = normalize(word);
      if (w.length > 2) eventNameMap[w] = row.id;
    }
  }

  // Manual overrides for tricky filenames -> entity IDs
  const manualClub: Record<string, string> = {};
  const manualEvent: Record<string, string> = {};

  const files = fs.readdirSync(imagesDir);
  for (const file of files) {
    const filePath = path.join(imagesDir, file);
    if (!fs.statSync(filePath).isFile()) continue;

    const dataUri = fileToDataUri(filePath);
    if (!dataUri) continue;

    const baseName = path.basename(file, path.extname(file));
    const normalized = normalize(baseName);

    // Skip app icons
    if (['icon', 'favicon', 'splash-icon', 'adaptive-icon'].includes(normalized)) continue;

    // Try to match to a club
    let entityType = 'club';
    let entityId = manualClub[normalized] || clubNameMap[normalized];

    // Try to match to an event if no club match
    if (!entityId) {
      entityType = 'event';
      entityId = manualEvent[normalized] || eventNameMap[normalized];
    }

    // If still no match, try contains matching
    if (!entityId) {
      for (const [key, id] of Object.entries(clubNameMap)) {
        if (normalized.includes(key) || key.includes(normalized)) {
          entityType = 'club';
          entityId = id;
          break;
        }
      }
    }

    if (!entityId) {
      for (const [key, id] of Object.entries(eventNameMap)) {
        if (normalized.includes(key) || key.includes(normalized)) {
          entityType = 'event';
          entityId = id;
          break;
        }
      }
    }

    if (entityId) {
      const exists = await pool.query(
        'SELECT id FROM images WHERE entity_type = $1 AND entity_id = $2',
        [entityType, entityId]
      );
      if (exists.rows.length === 0) {
        await pool.query(
          `INSERT INTO images (id, entity_type, entity_id, image_data, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [`img_${uuidv4()}`, entityType, entityId, dataUri]
        );
        console.log(`Seeded ${entityType} ${entityId} from file: ${file}`);
      } else {
        console.log(`Skipped ${file} -> ${entityType} ${entityId} (already has image)`);
      }
    } else {
      console.log(`No match for file: ${file}`);
    }
  }
}

async function updateImages() {
  console.log('Seeding images from existing base64 data...');
  await seedImagesFromBase64();

  console.log('Seeding images from physical files...');
  await seedImagesFromFiles();

  console.log('Image seeding complete');
  process.exit(0);
}

updateImages().catch(err => {
  console.error('Update failed:', err);
  process.exit(1);
});
