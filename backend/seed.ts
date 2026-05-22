import { database } from './database';
import { User, Event, Club, Ticket, SavedEvent, UserClub } from './types';

async function seed() {
  await database.initialize();

  const existingUsers = await database.getUsers();
  if (existingUsers.length > 0) {
    console.log('Database already seeded, skipping');
    return;
  }

  // Seed users
  const users: User[] = require('./data/users.json');
  for (const user of users) {
    await database.createUser(user);
  }
  console.log(`Seeded ${users.length} users`);

  // Seed clubs
  const clubs: Club[] = require('./data/clubs.json');
  for (const club of clubs) {
    await database.addClub(club);
  }
  console.log(`Seeded ${clubs.length} clubs`);

  // Seed events
  const events: Event[] = require('./data/events.json');
  for (const event of events) {
    await database.addEvent(event);
  }
  console.log(`Seeded ${events.length} events`);

  // Seed tickets
  const tickets: Ticket[] = require('./data/tickets.json');
  for (const ticket of tickets) {
    await database.addTicket(ticket);
  }
  console.log(`Seeded ${tickets.length} tickets`);

  // Seed saved events
  const savedEvents: SavedEvent[] = require('./data/saved_events.json');
  for (const se of savedEvents) {
    await database.addSaved(se);
  }
  console.log(`Seeded ${savedEvents.length} saved events`);

  // Seed user clubs
  const userClubs: UserClub[] = require('./data/user_clubs.json');
  for (const uc of userClubs) {
    await database.addUserClub(uc);
  }
  console.log(`Seeded ${userClubs.length} user clubs`);

  console.log('Seed complete');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
