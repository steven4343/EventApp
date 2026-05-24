import pool from './db';
import { Event, Club } from './types';

async function updateImages() {
  // Update event images
  const events: Event[] = require('./data/events.json');
  for (const event of events) {
    if (event.image && event.image.startsWith('data:')) {
      await pool.query('UPDATE events SET image = $1 WHERE id = $2', [event.image, event.id]);
      console.log(`Updated event ${event.id} image`);
    }
  }

  // Update club images
  const clubs: Club[] = require('./data/clubs.json');
  for (const club of clubs) {
    if (club.image && club.image.startsWith('data:')) {
      await pool.query('UPDATE clubs SET image = $1 WHERE id = $2', [club.image, club.id]);
      console.log(`Updated club ${club.id} image`);
    }
  }

  console.log('Image update complete');
  process.exit(0);
}

updateImages().catch(err => {
  console.error('Update failed:', err);
  process.exit(1);
});
