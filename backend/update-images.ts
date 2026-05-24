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

async function seedImagesFromFiles() {
  const imagesDir = path.join(__dirname, 'public', 'images');
  if (!fs.existsSync(imagesDir)) return;

  // Manual mapping: hash filename -> event_id (from mvp project's mock data)
  const eventImageMap: Record<string, string[]> = {
    '7903ba759388609c8cc053af8ae8dc4c60a50dd0.png': ['event_1'],
    'd7ae4b74561b5c62377c6e8e1ada58ad3e80fef4.png': ['event_2', 'event_3', 'event_5', 'event_7'],
    '9740598005f689306f597b4d692dc46014798202.png': ['event_4'],
    '6356727368ab75ac3f4eea867fb27bcc7ccd9258.png': ['event_6'],
    'ed7bfb12660b2fe3e71ec2eb1a6f020bb7f683fa.png': ['event_8'],
    'dfe3dd58b825e2385a751187d0e16cf5736a02da.png': ['event_3'],
    'dev3pack_logo.jpg': ['event_dev3pack_hackathon'],
  };

  // Manual mapping: filename -> club_id
  const clubImageMap: Record<string, string> = {
    'chess.jpg': 'club_9',
    'CUZITA Club.jpeg': 'club_10',
    'debate club.png': 'club_4',
    'photography.jpg': 'club_8',
  };

  const skipFiles = ['icon.png', 'favicon.png', 'splash-icon.png', 'adaptive-icon.png', 'colour-run.jpg', 'dev3pack.png'];

  const files = fs.readdirSync(imagesDir);
  for (const file of files) {
    if (skipFiles.includes(file)) continue;
    const filePath = path.join(imagesDir, file);
    if (!fs.statSync(filePath).isFile()) continue;

    const dataUri = fileToDataUri(filePath);
    if (!dataUri) continue;

    const eventIds = eventImageMap[file];
    if (eventIds) {
      for (const eventId of eventIds) {
        const existing = await pool.query(
          'SELECT id FROM images WHERE entity_type = $1 AND entity_id = $2',
          ['event', eventId]
        );
        if (existing.rows.length === 0) {
          await pool.query(
            `INSERT INTO images (id, entity_type, entity_id, image_data, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [`img_${uuidv4()}`, 'event', eventId, dataUri]
          );
          console.log(`Seeded event image for ${eventId} from ${file}`);
        }
      }
      continue;
    }

    const clubId = clubImageMap[file];
    if (clubId) {
      const existing = await pool.query(
        'SELECT id FROM images WHERE entity_type = $1 AND entity_id = $2',
        ['club', clubId]
      );
      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO images (id, entity_type, entity_id, image_data, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [`img_${uuidv4()}`, 'club', clubId, dataUri]
        );
        console.log(`Seeded club image for ${clubId} from ${file}`);
      }
    } else {
      console.log(`No mapping for image file: ${file}`);
    }
  }
}

async function updateImages() {
  await seedImagesFromFiles();
  console.log('Image seeding complete');
  process.exit(0);
}

updateImages().catch(err => {
  console.error('Update failed:', err);
  process.exit(1);
});
