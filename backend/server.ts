import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { database } from './database';
import { User, Event, Club, Ticket, SavedEvent, UserClub, UserReview } from './types';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json());

// Initialize database and seed if empty
async function initDB() {
  await database.initialize();
  const existingEvents = await database.getEvents();
  if (existingEvents.length === 0) {
    console.log('Seeding database...');
    const users: User[] = require('./data/users.json');
    for (const u of users) await database.createUser(u);
    const clubs: Club[] = require('./data/clubs.json');
    for (const c of clubs) await database.addClub(c);
    const events: Event[] = require('./data/events.json');
    for (const e of events) await database.addEvent(e);
    const tickets: Ticket[] = require('./data/tickets.json');
    for (const t of tickets) await database.addTicket(t);
    const savedEvents: SavedEvent[] = require('./data/saved_events.json');
    for (const s of savedEvents) await database.addSaved(s);
    const userClubs: UserClub[] = require('./data/user_clubs.json');
    for (const uc of userClubs) await database.addUserClub(uc);
    console.log('Seed complete');
  } else {
    console.log('Database already seeded');
  }
}
initDB().catch(console.error);

// ==================== USER ROUTES ====================

app.get('/api/users', async (_req, res) => {
  const users = await database.getUsers();
  res.json(users);
});

app.post('/api/users/register', async (req, res) => {
  const { name, email, password, studentId, faculty, year } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const existing = await database.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const newUser: User = {
    id: `user_${uuidv4()}`,
    name,
    email,
    studentId: studentId || '',
    password,
    faculty: faculty || '',
    year: year || 1,
    avatar: 'https://picsum.photos/seed/user/200',
    joinedAt: new Date().toISOString().split('T')[0],
    isActive: true,
    role: 'student',
  };

  await database.createUser(newUser);
  res.status(201).json({ user: newUser });
});

app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await database.authenticateUser(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json({ user });
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  await database.updateUser(id, updates);
  const updated = await database.getUserById(id);
  if (updated) {
    res.json({ user: updated });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// ==================== EVENT ROUTES ====================

app.get('/api/events', async (req, res) => {
  const { status, category } = req.query;
  const events = await database.getEvents(status as string, category as string);
  res.json(events);
});

app.get('/api/events/:id', async (req, res) => {
  const event = await database.getEventById(req.params.id);
  if (event) {
    res.json(event);
  } else {
    res.status(404).json({ error: 'Event not found' });
  }
});

app.post('/api/events', async (req, res) => {
  const event = req.body as Event;
  event.id = `event_${uuidv4()}`;
  event.createdAt = new Date().toISOString().split('T')[0];
  await database.addEvent(event);
  res.status(201).json(event);
});

app.put('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  await database.updateEvent(id, req.body);
  const event = await database.getEventById(id);
  if (event) {
    res.json(event);
  } else {
    res.status(404).json({ error: 'Event not found' });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  const event = await database.getEventById(id);
  if (event) {
    await database.deleteEvent(id);
    res.json({ message: 'Event deleted' });
  } else {
    res.status(404).json({ error: 'Event not found' });
  }
});

// ==================== CLUB ROUTES ====================

app.get('/api/clubs', async (req, res) => {
  const { status } = req.query;
  const clubs = await database.getClubs(status as string);
  res.json(clubs);
});

app.post('/api/clubs', async (req, res) => {
  const club: Club = {
    ...req.body,
    id: `club_${uuidv4()}`,
    established: new Date().toISOString().split('T')[0],
  };
  await database.addClub(club);
  res.status(201).json(club);
});

app.delete('/api/clubs/:id', async (req, res) => {
  const { id } = req.params;
  const club = await database.getClubById(id);
  if (club) {
    await database.deleteClub(id);
    res.json({ message: 'Club deleted' });
  } else {
    res.status(404).json({ error: 'Club not found' });
  }
});

app.get('/api/clubs/:id', async (req, res) => {
  const club = await database.getClubById(req.params.id);
  if (club) {
    res.json(club);
  } else {
    res.status(404).json({ error: 'Club not found' });
  }
});

app.put('/api/clubs/:id', async (req, res) => {
  const { id } = req.params;
  await database.updateClub(id, req.body);
  const club = await database.getClubById(id);
  if (club) {
    res.json(club);
  } else {
    res.status(404).json({ error: 'Club not found' });
  }
});

// ==================== TICKET ROUTES ====================

app.get('/api/tickets/:userId', async (req, res) => {
  const tickets = await database.getTicketsByUser(req.params.userId);
  res.json(tickets);
});

app.post('/api/tickets', async (req, res) => {
  const ticket = req.body as Ticket;
  ticket.id = `ticket_${uuidv4()}`;
  ticket.purchasedAt = new Date().toISOString();
  await database.addTicket(ticket);
  res.status(201).json(ticket);
});

app.get('/api/tickets', async (req, res) => {
  const { status } = req.query;
  const tickets = await database.getAllTickets();
  const ticketsWithUsers = [];
  for (const ticket of tickets) {
    const user = await database.getUserById(ticket.userId);
    const event = await database.getEventById(ticket.eventId);
    ticketsWithUsers.push({
      ...ticket,
      user_name: user?.name || 'Unknown',
      user_email: user?.email || 'unknown',
      event_title: event?.title || 'Unknown',
      reference: `TXN-${ticket.id.slice(-8).toUpperCase()}`,
      method: 'mobile_money',
      amount: ticket.price || 0,
    });
  }
  const filtered = status ? ticketsWithUsers.filter(t => t.status === status) : ticketsWithUsers;
  res.json(filtered);
});

app.put('/api/tickets/:id/verify', async (req, res) => {
  const { id } = req.params;
  await database.updateTicketStatus(id, 'verified');
  res.json({ message: 'Ticket verified' });
});

app.put('/api/tickets/:id/reject', async (req, res) => {
  const { id } = req.params;
  await database.updateTicketStatus(id, 'rejected');
  res.json({ message: 'Ticket rejected' });
});

// ==================== SAVED EVENTS ROUTES ====================

app.get('/api/saved/:userId', async (req, res) => {
  const saved = await database.getSavedByUser(req.params.userId);
  const savedWithEvents = await Promise.all(
    saved.map(async (s) => {
      const event = await database.getEventById(s.eventId);
      return { ...s, ...(event || {}) };
    })
  );
  res.json(savedWithEvents);
});

app.post('/api/saved', async (req, res) => {
  const saved: SavedEvent = {
    ...req.body,
    id: `saved_${uuidv4()}`,
    savedAt: new Date().toISOString(),
  };
  await database.addSaved(saved);
  res.status(201).json(saved);
});

app.delete('/api/saved/:userId/:eventId', async (req, res) => {
  const { userId, eventId } = req.params;
  await database.removeSaved(userId, eventId);
  res.json({ message: 'Saved event removed' });
});

// ==================== USER CLUBS ROUTES ====================

app.get('/api/user-clubs/:userId', async (req, res) => {
  const userClubs = await database.getUserClubs(req.params.userId);
  const clubsWithDetails = await Promise.all(
    userClubs.map(async (uc) => {
      const club = await database.getClubById(uc.clubId);
      return { ...uc, ...(club || {}) };
    })
  );
  res.json(clubsWithDetails);
});

app.post('/api/user-clubs', async (req, res) => {
  const userClub: UserClub = {
    ...req.body,
    id: `uc_${uuidv4()}`,
    joinedAt: new Date().toISOString(),
  };
  await database.addUserClub(userClub);
  res.status(201).json(userClub);
});

app.delete('/api/user-clubs/:userId/:clubId', async (req, res) => {
  const { userId, clubId } = req.params;
  await database.removeUserClub(userId, clubId);
  res.json({ message: 'Club left' });
});

// ==================== REVIEWS ROUTES ====================

app.get('/api/reviews/:userId', async (req, res) => {
  const reviews = await database.getReviewsByUser(req.params.userId);
  res.json(reviews);
});

app.post('/api/reviews', async (req, res) => {
  const review: UserReview = {
    ...req.body,
    id: `review_${uuidv4()}`,
    createdAt: new Date().toISOString(),
  };
  await database.addReview(review);
  res.status(201).json(review);
});

// ==================== STATS ====================

app.get('/api/stats', async (_req, res) => {
  const stats = await database.getStats();
  res.json(stats);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
