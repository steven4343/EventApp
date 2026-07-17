import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { database } from './database';
import pool from './db';
import { User, Event, Club, Ticket, SavedEvent, UserClub, UserReview, Image } from './types';
import { getFirebaseAuth } from './firebase';
import { OAuth2Client } from 'google-auth-library';
import {
  generateToken,
  setTokenCookie,
  clearTokenCookie,
  authenticate,
  optionalAuth,
  authorize,
} from './auth';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: true, credentials: true },
});

const PORT = parseInt(process.env.PORT || '3001', 10);

const JWT_SECRET = process.env.JWT_SECRET || 'cuz-events-jwt-secret-dev';

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use('/images', express.static('public/images'));

// Socket.IO: track connected users
io.on('connection', (socket: any) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on('register', (userId: string) => {
    socket.data.userId = userId;
    socket.join(`user:${userId}`);
    console.log(`Socket ${socket.id} registered as user ${userId}`);
  });
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

function emitStatusChange(event: { id: string; title: string; status: string }) {
  io.emit('event:status', { eventId: event.id, title: event.title, status: event.status, timestamp: new Date().toISOString() });
}

database.initialize().catch(console.error);

async function seedDB() {
  try {
    const existingClubs = await database.getClubs();
    if (existingClubs.length > 0) {
      const uc = await database.getAllUserClubs();
      if (uc.length >= 10) { console.log('DB already seeded (skipping re-seed)'); }
      console.log('Re-seeding user_clubs...');
      for (const u of uc) await database.removeUserClub(u.userId, u.clubId);
    }
    const users: any[] = require('./data/users.json');
    for (const u of users) {
      try { await database.createUser(u); } catch (e: any) { console.log('User exists:', u.id); }
    }
    const events: any[] = require('./data/events.json');
    for (const e of events) {
      try { await database.addEvent(e); } catch (ex: any) { await database.updateEvent(e.id, { image: e.image }); console.log('Updated event image:', e.id); }
    }
    if (existingClubs.length === 0 || (await database.getAllUserClubs()).length === 0) {
      console.log('Seeding database...');
      const clubs: any[] = require('./data/clubs.json');
      for (const c of clubs) {
        try { await database.addClub(c); } catch (e: any) { await database.updateClub(c.id, { image: c.image }); console.log('Updated club image:', c.id); }
      }
      const tickets: any[] = require('./data/tickets.json');
      for (const t of tickets) {
        try { await database.addTicket(t); } catch (e: any) { console.log('Ticket exists:', t.id); }
      }
      const savedEvents: any[] = require('./data/saved_events.json');
      for (const s of savedEvents) {
        try { await database.addSaved(s); } catch (e: any) { console.log('Saved exists:', s.id); }
      }
      const uclubs: any[] = require('./data/user_clubs.json');
      for (const uc of uclubs) {
        try { await database.addUserClub(uc); } catch (e: any) { console.log('UC exists:', uc.id); }
      }
      console.log('Seed complete');
    }
  } catch (e) {
    console.error('Seed failed:', e);
  }

  await seedImages();
}

async function seedImages() {
  try {
    const fs = require('fs');
    const path = require('path');

    const imagesDir = path.join(__dirname, 'public', 'images');
    if (!fs.existsSync(imagesDir)) return;

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

    const eventImageMap: Record<string, string[]> = {
      '7903ba759388609c8cc053af8ae8dc4c60a50dd0.png': ['event_1'],
      'd7ae4b74561b5c62377c6e8e1ada58ad3e80fef4.png': ['event_2', 'event_3', 'event_5'],
      '9740598005f689306c597b4d692dc46014798202.png': ['event_4'],
      '6356727368ab75ac3f4eea867fb27bcc7ccd9258.png': ['event_6'],
      'ed7bfb12660b2fe3e71ec2eb1a6f020bb7f683fa.png': ['event_8'],
      'dfe3dd58b825e2385a751187d0e16cf5736a02da.png': ['event_3'],
      'dev3pack_logo.jpg': ['event_dev3pack_hackathon'],
    };

    const clubImageMap: Record<string, string> = {
      'chess.jpg': 'club_9',
      'CUZITA Club.jpeg': 'club_10',
      'debate club.png': 'club_4',
      'photography.jpg': 'club_8',
    };

    const skipFiles = ['icon.png', 'favicon.png', 'splash-icon.png', 'adaptive-icon.png', 'dev3pack.png'];

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
          await database.deleteImagesByEntity('event', eventId);
          await database.addImage({
            id: `img_${uuidv4()}`,
            entityType: 'event',
            entityId: eventId,
            imageData: dataUri,
            createdAt: new Date().toISOString(),
          });
          console.log(`Seeded event image for ${eventId} from ${file}`);
        }
        continue;
      }
      const clubId = clubImageMap[file];
      if (clubId) {
        await database.deleteImagesByEntity('club', clubId);
        await database.addImage({
          id: `img_${uuidv4()}`,
          entityType: 'club',
          entityId: clubId,
          imageData: dataUri,
          createdAt: new Date().toISOString(),
        });
        console.log(`Seeded club image for ${clubId} from ${file}`);
      } else {
        console.log(`No mapping for image file: ${file}`);
      }
    }
  } catch (e) {
    console.error('Image seeding error:', e);
  }
}

httpServer.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  await seedDB();
});

// ==================== HELPERS ====================

async function enrichUserAvatar(user: User | undefined): Promise<User | undefined> {
  if (!user) return user;
  const images = await database.getImagesByEntity('user', user.id);
  if (images.length > 0) user.avatar = images[0].imageData;
  return user;
}

function issueTokenResponse(user: User, res: express.Response) {
  const tokenPayload = { id: user.id, email: user.email, role: user.role };
  const token = generateToken(tokenPayload);
  setTokenCookie(res, token);
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      faculty: user.faculty,
      year: user.year,
      avatar: user.avatar,
      role: user.role,
    },
  };
}

function sanitizeUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    studentId: user.studentId,
    faculty: user.faculty,
    year: user.year,
    avatar: user.avatar,
    role: user.role,
  };
}

// ==================== USER ROUTES ====================

app.get('/api/users', async (_req, res) => {
  let users = await database.getUsers();
  users = await Promise.all(users.map(u => enrichUserAvatar(u))) as User[];
  res.json(users);
});

app.post('/api/users/register', async (req, res) => {
  const { name, email, password, studentId, faculty, year, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const existing = await database.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const userRole = (role === 'organizer') ? 'organizer' : 'student';
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser: User = {
    id: `user_${uuidv4()}`,
    name,
    email,
    studentId: studentId || '',
    password: hashedPassword,
    faculty: faculty || '',
    year: year || 1,
    avatar: 'https://picsum.photos/seed/user/200',
    joinedAt: new Date().toISOString().split('T')[0],
    isActive: true,
    role: userRole,
  };

  await database.createUser(newUser);
  const result = issueTokenResponse(newUser, res);
  res.status(201).json(result);
});

app.post('/api/seed/admin', async (req, res) => {
  const { email, password, name, secret } = req.body;
  if (secret !== (process.env.SEED_KEY || 'cuz-admin-seed-2024')) {
    return res.status(403).json({ error: 'Invalid seed key' });
  }
  const existing = await database.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  const adminUser: User = {
    id: `user_${uuidv4()}`,
    name: name || 'Admin',
    email,
    password,
    studentId: '',
    faculty: 'Administration',
    year: 0,
    avatar: 'https://picsum.photos/seed/admin/200',
    joinedAt: new Date().toISOString().split('T')[0],
    isActive: true,
    role: 'admin',
  };
  await database.createUser(adminUser);
  const result = issueTokenResponse(adminUser, res);
  res.status(201).json(result);
});

app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  let user = await database.authenticateUser(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  user = await enrichUserAvatar(user);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const result = issueTokenResponse(user, res);
  res.json(result);
});

app.put('/api/users/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  if (req.user!.id !== id) {
    return res.status(403).json({ error: 'Cannot modify another user\'s profile' });
  }
  const updates = req.body;

  if (updates.avatar && updates.avatar.startsWith('data:')) {
    const existing = await database.getImagesByEntity('user', id);
    for (const img of existing) await database.deleteImage(img.id);
    await database.addImage({
      id: `img_${uuidv4()}`,
      entityType: 'user',
      entityId: id,
      imageData: updates.avatar,
      createdAt: new Date().toISOString(),
    });
    delete updates.avatar;
  }

  await database.updateUser(id, updates);
  let updated = await database.getUserById(id);
  updated = await enrichUserAvatar(updated);
  if (updated) {
    res.json({ user: sanitizeUser(updated) });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// ==================== AUTH ROUTES ====================

app.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'idToken is required' });
    }

    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID || '700346203891-kpecio7217rlnudo7a246qo2jrvnuehk.apps.googleusercontent.com',
    });
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    const { email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Email is required from Google account' });
    }

    let user = await database.getUserByEmail(email);

    if (user) {
      user.provider = 'google';
      if (picture) {
        user.avatarUrl = picture;
        user.avatar = picture;
      }
    } else {
      user = await database.createGoogleUser(email, name || email.split('@')[0], picture || '');
    }

    const result = issueTokenResponse(user, res);
    res.json(result);
  } catch (e: any) {
    console.error('Google auth error:', e);
    res.status(401).json({ error: 'Invalid or expired Google token' });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  clearTokenCookie(res);
  res.json({ message: 'Logged out' });
});

// ==================== EVENT ROUTES ====================

app.get('/api/events', async (req, res) => {
  const { status, category } = req.query;
  const events = await database.getEvents(status as string, category as string);
  for (const event of events) {
    const images = await database.getImagesByEntity('event', event.id);
    if (images.length > 0) event.image = images[0].imageData;
  }
  res.json(events);
});

app.get('/api/events/recent', async (req, res) => {
  try {
    const after = req.query.after as string;
    if (!after) return res.status(400).json({ error: 'after query param required (ISO date)' });
    const events = await database.getRecentEvents(after);
    for (const event of events) {
      const images = await database.getImagesByEntity('event', event.id);
      if (images.length > 0) event.image = images[0].imageData;
    }
    res.json(events);
  } catch (e: any) {
    console.error('Failed to fetch recent events:', e);
    res.status(500).json({ error: 'Failed to fetch recent events' });
  }
});

app.get('/api/events/:id', async (req, res) => {
  const event = await database.getEventById(req.params.id);
  if (event) {
    const images = await database.getImagesByEntity('event', event.id);
    if (images.length > 0) event.image = images[0].imageData;
    res.json(event);
  } else {
    res.status(404).json({ error: 'Event not found' });
  }
});

app.post('/api/events', authenticate, async (req, res) => {
  try {
    const event = req.body as Event;
    if (!event.title || !event.date || !event.location) {
      return res.status(400).json({ error: 'Title, date, and location are required' });
    }
    const now = new Date().toISOString();
    event.id = `event_${uuidv4()}`;
    event.createdBy = req.user!.id;
    event.createdAt = now.split('T')[0];
    event.updatedAt = now;

    if (req.user!.role === 'admin') {
      if (event.status === 'Published') {
        event.publishedAt = now;
      }
    } else {
      event.status = 'Pending';
    }

    await database.addEvent(event);
    io.emit('event:created', { id: event.id, title: event.title, status: event.status, timestamp: new Date().toISOString() });
    if (event.status === 'Published') {
      sendPushNotifications('New Event Posted', event.title);
      emitStatusChange({ id: event.id, title: event.title, status: 'Published' });
    }
    res.status(201).json(event);
  } catch (e: any) {
    console.error('Failed to create event:', e);
    res.status(500).json({ error: 'Failed to create event', details: e.message });
  }
});

async function sendPushNotifications(title: string, body: string): Promise<void> {
  try {
    const tokens = await database.getPushTokens();
    if (tokens.length === 0) return;
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      priority: 'high',
    }));
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
  } catch (e) {
    console.error('Failed to send push notifications:', e);
  }
}

app.put('/api/events/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const before = await database.getEventById(id);
    if (!before) return res.status(404).json({ error: 'Event not found' });
    const now = new Date().toISOString();
    req.body.updatedAt = now;
    if (before.status !== 'Published' && req.body.status === 'Published') {
      req.body.publishedAt = now;
    }
    await database.updateEvent(id, req.body);
    const event = await database.getEventById(id);
    if (event) {
      if (before.status !== 'Published' && event.status === 'Published') {
        sendPushNotifications('New Event Posted', event.title);
      }
      if (before.status !== event.status) {
        emitStatusChange({ id: event.id, title: event.title, status: event.status });
      }
      res.json(event);
    } else {
      res.status(404).json({ error: 'Event not found' });
    }
  } catch (e: any) {
    console.error('Failed to update event:', e);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

app.delete('/api/events/:id', authenticate, async (req, res) => {
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
  for (const club of clubs) {
    const images = await database.getImagesByEntity('club', club.id);
    if (images.length > 0) club.image = images[0].imageData;
  }
  res.json(clubs);
});

app.post('/api/clubs', authenticate, async (req, res) => {
  try {
    const club: Club = {
      ...req.body,
      id: `club_${uuidv4()}`,
      established: new Date().toISOString().split('T')[0],
    };
    await database.addClub(club);
    io.emit('club:created', { id: club.id, name: club.name, timestamp: new Date().toISOString() });
    res.status(201).json(club);
  } catch (e: any) {
    console.error('Failed to create club:', e);
    res.status(500).json({ error: 'Failed to create club', details: e.message });
  }
});

app.delete('/api/clubs/:id', authenticate, async (req, res) => {
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
    const images = await database.getImagesByEntity('club', club.id);
    if (images.length > 0) club.image = images[0].imageData;
    res.json(club);
  } else {
    res.status(404).json({ error: 'Club not found' });
  }
});

app.put('/api/clubs/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  if (!await requirePresident(req.user!.id, id)) {
    return res.status(403).json({ error: 'Only club presidents can update the club' });
  }
  await database.updateClub(id, req.body);
  const club = await database.getClubById(id);
  if (club) {
    res.json(club);
  } else {
    res.status(404).json({ error: 'Club not found' });
  }
});

app.post('/api/clubs/:clubId/verify-admin', async (req, res) => {
  const { clubId } = req.params;
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });
  const valid = await database.verifyClubAdmin(clubId, password);
  if (valid) {
    res.json({ verified: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// ==================== TICKET ROUTES ====================

app.get('/api/tickets/me', authenticate, async (req, res) => {
  const tickets = await database.getTicketsByUser(req.user!.id);
  res.json(tickets);
});

// Legacy route (kept for backward compatibility, validates userId matches token)
app.get('/api/tickets/:userId', authenticate, async (req, res) => {
  if (req.user!.id !== req.params.userId) {
    return res.status(403).json({ error: 'Cannot view another user\'s tickets' });
  }
  const tickets = await database.getTicketsByUser(req.user!.id);
  res.json(tickets);
});

app.post('/api/tickets', authenticate, async (req, res) => {
  const ticket: Ticket = {
    ...req.body,
    userId: req.user!.id,
    id: `ticket_${uuidv4()}`,
    purchasedAt: new Date().toISOString(),
  };
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

app.put('/api/tickets/:id/verify', authenticate, async (req, res) => {
  const { id } = req.params;
  await database.updateTicketStatus(id, 'verified');
  const ticket = await database.getTicketById(id);
  if (ticket) {
    const event = await database.getEventById(ticket.eventId);
    io.emit('ticket:verified', { ticketId: id, eventTitle: event?.title || 'Unknown', timestamp: new Date().toISOString() });
  }
  res.json({ message: 'Ticket verified' });
});

app.put('/api/tickets/:id/reject', authenticate, async (req, res) => {
  const { id } = req.params;
  await database.updateTicketStatus(id, 'rejected');
  res.json({ message: 'Ticket rejected' });
});

app.get('/api/tickets/lookup/:id', async (req, res) => {
  const { id } = req.params;
  const ticket = await database.getTicketById(id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  const user = await database.getUserById(ticket.userId);
  const event = await database.getEventById(ticket.eventId);
  res.json({
    ...ticket,
    user_name: user?.name || 'Unknown',
    user_email: user?.email || 'unknown',
    event_title: event?.title || 'Unknown',
    event_date: event?.date || '',
    event_time: event?.time || '',
    event_location: event?.location || '',
  });
});

app.put('/api/tickets/:id/use', authenticate, async (req, res) => {
  const { id } = req.params;
  const ticket = await database.getTicketById(id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  await database.updateTicketStatus(id, 'Used');
  res.json({ message: 'Ticket marked as used' });
});

// ==================== SAVED EVENTS ROUTES ====================

app.get('/api/saved/me', authenticate, async (req, res) => {
  const saved = await database.getSavedByUser(req.user!.id);
  const savedWithEvents = await Promise.all(
    saved.map(async (s) => {
      const event = await database.getEventById(s.eventId);
      return { ...s, ...(event || {}) };
    })
  );
  res.json(savedWithEvents);
});

app.get('/api/saved/:userId', authenticate, async (req, res) => {
  if (req.user!.id !== req.params.userId) {
    return res.status(403).json({ error: 'Cannot view another user\'s saved events' });
  }
  const saved = await database.getSavedByUser(req.user!.id);
  const savedWithEvents = await Promise.all(
    saved.map(async (s) => {
      const event = await database.getEventById(s.eventId);
      return { ...s, ...(event || {}) };
    })
  );
  res.json(savedWithEvents);
});

app.post('/api/saved', authenticate, async (req, res) => {
  const saved: SavedEvent = {
    ...req.body,
    userId: req.user!.id,
    id: `saved_${uuidv4()}`,
    savedAt: new Date().toISOString(),
  };
  await database.addSaved(saved);
  res.status(201).json(saved);
});

app.delete('/api/saved/:userId/:eventId', authenticate, async (req, res) => {
  const { userId, eventId } = req.params;
  if (req.user!.id !== userId) {
    return res.status(403).json({ error: 'Cannot modify another user\'s saved events' });
  }
  await database.removeSaved(userId, eventId);
  res.json({ message: 'Saved event removed' });
});

// ==================== USER CLUBS ROUTES ====================

app.get('/api/user-clubs/me', authenticate, async (req, res) => {
  const userClubs = await database.getUserClubs(req.user!.id);
  const clubsWithDetails = await Promise.all(
    userClubs.map(async (uc) => {
      const club = await database.getClubById(uc.clubId);
      return { ...uc, ...(club || {}) };
    })
  );
  res.json(clubsWithDetails);
});

app.get('/api/user-clubs/:userId', authenticate, async (req, res) => {
  if (req.user!.id !== req.params.userId) {
    return res.status(403).json({ error: 'Cannot view another user\'s clubs' });
  }
  const userClubs = await database.getUserClubs(req.user!.id);
  const clubsWithDetails = await Promise.all(
    userClubs.map(async (uc) => {
      const club = await database.getClubById(uc.clubId);
      return { ...uc, ...(club || {}) };
    })
  );
  res.json(clubsWithDetails);
});

app.get('/api/user-clubs/:userId/:clubId', authenticate, async (req, res) => {
  const { userId, clubId } = req.params;
  if (req.user!.id !== userId) {
    return res.status(403).json({ error: 'Cannot view another user\'s membership' });
  }
  const membership = await database.getUserClub(userId, clubId);
  if (membership) {
    res.json(membership);
  } else {
    res.status(404).json({ error: 'Not a member' });
  }
});

app.post('/api/user-clubs/request', authenticate, async (req, res) => {
  const { clubId } = req.body;
  const userId = req.user!.id;
  if (!clubId) {
    return res.status(400).json({ error: 'clubId required' });
  }
  const existing = await database.getUserClub(userId, clubId);
  if (existing) {
    return res.status(400).json({ error: 'Already requested or joined' });
  }
  const userClub: UserClub = {
    id: `uc_${uuidv4()}`,
    userId,
    clubId,
    role: 'Pending',
    joinedAt: new Date().toISOString(),
  };
  await database.addUserClub(userClub);
  res.status(201).json(userClub);
});

app.post('/api/user-clubs', authenticate, async (req, res) => {
  const userClub: UserClub = {
    ...req.body,
    userId: req.user!.id,
    id: `uc_${uuidv4()}`,
    joinedAt: new Date().toISOString(),
  };
  await database.addUserClub(userClub);
  res.status(201).json(userClub);
});

app.delete('/api/user-clubs/:userId/:clubId', authenticate, async (req, res) => {
  const { userId, clubId } = req.params;
  if (req.user!.id !== userId) {
    return res.status(403).json({ error: 'Cannot remove another user\'s membership' });
  }
  await database.removeUserClub(userId, clubId);
  res.json({ message: 'Club left' });
});

// ==================== CLUB MEMBER MANAGEMENT (President) ====================

app.get('/api/clubs/:clubId/members/pending', async (req, res) => {
  const { clubId } = req.params;
  const members = await database.getClubPendingMembers(clubId);
  res.json(members);
});

app.put('/api/clubs/:clubId/members/:userId/approve', authenticate, async (req, res) => {
  const { clubId, userId } = req.params;
  if (!await requirePresident(req.user!.id, clubId)) {
    return res.status(403).json({ error: 'Only club presidents can approve members' });
  }
  await database.approveClubMember(userId, clubId);
  res.json({ message: 'Member approved' });
});

app.delete('/api/clubs/:clubId/members/:userId/reject', authenticate, async (req, res) => {
  const { clubId, userId } = req.params;
  if (!await requirePresident(req.user!.id, clubId)) {
    return res.status(403).json({ error: 'Only club presidents can reject members' });
  }
  await database.removeUserClub(userId, clubId);
  res.json({ message: 'Member rejected' });
});

app.get('/api/users/:userId/president-clubs', authenticate, async (req, res) => {
  const { userId } = req.params;
  if (req.user!.id !== userId) {
    return res.status(403).json({ error: 'Cannot view another user\'s president clubs' });
  }
  const clubs = await database.getPresidentClubs(userId);
  res.json(clubs);
});

// ==================== CLUB PRESIDENT MANAGEMENT ====================

async function requirePresident(userId: string, clubId: string): Promise<boolean> {
  const membership = await database.getUserClub(userId, clubId);
  return !!membership && membership.role === 'President';
}

app.get('/api/clubs/:clubId/members', async (req, res) => {
  const { clubId } = req.params;
  const members = await database.getClubMembers(clubId);
  res.json(members);
});

app.post('/api/clubs/:clubId/members', authenticate, async (req, res) => {
  const { clubId } = req.params;
  const { userId: targetUserId, role } = req.body;

  if (!await requirePresident(req.user!.id, clubId)) {
    return res.status(403).json({ error: 'Only club presidents can add members' });
  }
  if (!targetUserId || !role) {
    return res.status(400).json({ error: 'userId and role required' });
  }

  const existing = await database.getUserClub(targetUserId, clubId);
  if (existing) {
    return res.status(400).json({ error: 'User is already a member' });
  }

  const userClub: UserClub = {
    id: `uc_${uuidv4()}`,
    userId: targetUserId,
    clubId,
    role,
    joinedAt: new Date().toISOString(),
  };
  await database.addUserClub(userClub);

  const club = await database.getClubById(clubId);
  if (club) await database.updateClub(clubId, { members: club.members + 1 });

  res.status(201).json(userClub);
});

app.delete('/api/clubs/:clubId/members/:userId', authenticate, async (req, res) => {
  const { clubId, userId } = req.params;

  if (!await requirePresident(req.user!.id, clubId)) {
    return res.status(403).json({ error: 'Only club presidents can remove members' });
  }

  const membership = await database.getUserClub(userId, clubId);
  if (!membership) {
    return res.status(404).json({ error: 'User is not a member' });
  }
  if (membership.role === 'President') {
    return res.status(400).json({ error: 'Cannot remove a club president' });
  }

  await database.removeUserClub(userId, clubId);
  const club = await database.getClubById(clubId);
  if (club) await database.updateClub(clubId, { members: Math.max(0, club.members - 1) });

  res.json({ message: 'Member removed' });
});

app.get('/api/users/search', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'email query required' });
  const user = await database.getUserByEmail(email as string);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, name: user.name, email: user.email });
});

// ==================== REVIEWS ROUTES ====================

app.get('/api/reviews/me', authenticate, async (req, res) => {
  const reviews = await database.getReviewsByUser(req.user!.id);
  res.json(reviews);
});

app.get('/api/reviews/:userId', authenticate, async (req, res) => {
  if (req.user!.id !== req.params.userId) {
    return res.status(403).json({ error: 'Cannot view another user\'s reviews' });
  }
  const reviews = await database.getReviewsByUser(req.user!.id);
  res.json(reviews);
});

app.post('/api/reviews', authenticate, async (req, res) => {
  const review: UserReview = {
    ...req.body,
    userId: req.user!.id,
    id: `review_${uuidv4()}`,
    createdAt: new Date().toISOString(),
  };
  await database.addReview(review);
  const updated = await database.getEventById(review.itemId);
  io.emit('feedback:submitted', { eventId: review.itemId, eventTitle: updated?.title || 'Unknown', rating: review.rating, timestamp: new Date().toISOString() });
  res.status(201).json({ review, event: updated });
});

app.get('/api/events/:id/reviews', async (req, res) => {
  const reviews = await database.getReviewsByEvent(req.params.id);
  const event = await database.getEventById(req.params.id);
  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  res.json({
    reviews,
    stats: {
      averageRating: Math.round(avg * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution: [1, 2, 3, 4, 5].map(n => ({ stars: n, count: reviews.filter(r => r.rating === n).length })),
    },
  });
});

// ==================== DEBUG SEED ====================

app.get('/api/debug/reseed', async (_req, res) => {
  const results: string[] = [];
  const users: any[] = require('./data/users.json');
  for (const u of users) {
    const existing = await database.getUserByEmail(u.email);
    if (!existing) {
      try { await database.createUser(u); results.push(`Created: ${u.email}`); } catch (e: any) { results.push(`Error ${u.email}: ${e.message}`); }
    } else {
      try {
        const bcrypt = require('bcrypt');
        const hashed = await bcrypt.hash(u.password, 10);
        await pool.query('UPDATE users SET password=$1, role=$2 WHERE email=$3', [hashed, u.role, u.email]);
        results.push(`Updated password+role: ${u.email}`);
      } catch (e: any) { results.push(`Update error ${u.email}: ${e.message}`); }
    }
  }
  const events: any[] = require('./data/events.json');
  for (const e of events) {
    try { await database.addEvent(e); results.push(`Created event: ${e.id}`); } catch (ex: any) { results.push(`Event exists: ${e.id}`); }
  }
  res.json({ results });
});

app.get('/api/debug/seed', async (_req, res) => {
  try {
    const clubs = require('./data/clubs.json');
    let lastError = '';
    for (const c of clubs) {
      try {
        await database.addClub(c);
      } catch (e: any) {
        lastError = `Club ${c.id}: ${e.message}`;
        break;
      }
    }
    if (lastError) {
      return res.json({ error: lastError });
    }
    const events = require('./data/events.json');
    for (const e of events) {
      try {
        await database.addEvent(e);
      } catch (ex: any) {
        lastError = `Event ${e.id}: ${ex.message}`;
        break;
      }
    }
    res.json({ message: 'Seed debug done', lastError });
  } catch (e: any) {
    res.json({ error: e.message });
  }
});

// ==================== PUSH NOTIFICATION ROUTES ====================

app.post('/api/push-tokens/register', authenticate, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'token required' });
    await database.registerPushToken(req.user!.id, token);
    res.json({ registered: true });
  } catch (e: any) {
    console.error('Failed to register push token:', e);
    res.status(500).json({ error: 'Failed to register push token' });
  }
});

// ==================== IMAGE ROUTES ====================

app.get('/api/images/:entityType/:entityId', async (req, res) => {
  const { entityType, entityId } = req.params;
  const images = await database.getImagesByEntity(entityType, entityId);
  res.json(images);
});

app.post('/api/images', authenticate, async (req, res) => {
  const image: Image = {
    ...req.body,
    id: `img_${uuidv4()}`,
    createdAt: new Date().toISOString(),
  };
  await database.addImage(image);
  res.status(201).json(image);
});

app.delete('/api/images/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  await database.deleteImage(id);
  res.json({ message: 'Image deleted' });
});

app.delete('/api/images/:entityType/:entityId', authenticate, async (req, res) => {
  const { entityType, entityId } = req.params;
  await database.deleteImagesByEntity(entityType, entityId);
  res.json({ message: 'Images deleted' });
});

// ==================== STATS ====================

app.get('/api/stats', async (_req, res) => {
  const stats = await database.getStats();
  res.json(stats);
});

// ==================== ORGANIZER ROUTES ====================

app.get('/api/events/organizer/mine', authenticate, async (req, res) => {
  try {
    const events = await database.getEventsByCreator(req.user!.id);
    for (const event of events) {
      const images = await database.getImagesByEntity('event', event.id);
      if (images.length > 0) event.image = images[0].imageData;
    }
    res.json(events);
  } catch (e: any) {
    console.error('Failed to fetch organizer events:', e);
    res.status(500).json({ error: 'Failed to fetch organizer events' });
  }
});

// ==================== ADMIN APPROVAL ROUTES ====================

app.get('/api/events/pending', authenticate, authorize('admin'), async (req, res) => {
  try {
    const events = await database.getPendingEvents();
    for (const event of events) {
      const images = await database.getImagesByEntity('event', event.id);
      if (images.length > 0) event.image = images[0].imageData;
    }
    res.json(events);
  } catch (e: any) {
    console.error('Failed to fetch pending events:', e);
    res.status(500).json({ error: 'Failed to fetch pending events' });
  }
});

app.put('/api/events/:id/approve', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const event = await database.getEventById(id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.status !== 'Pending') return res.status(400).json({ error: 'Event is not pending' });

    await database.approveEvent(id, req.user!.id);
    const updated = await database.getEventById(id);
    if (updated) {
      sendPushNotifications('Event Approved', updated.title);
      emitStatusChange({ id: updated.id, title: updated.title, status: 'Published' });
      io.emit('event:approved', { eventId: updated.id, title: updated.title, timestamp: new Date().toISOString() });
    }
    res.json({ message: 'Event approved', event: updated });
  } catch (e: any) {
    console.error('Failed to approve event:', e);
    res.status(500).json({ error: 'Failed to approve event' });
  }
});

app.put('/api/events/:id/reject', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const event = await database.getEventById(id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.status !== 'Pending') return res.status(400).json({ error: 'Event is not pending' });

    await database.rejectEvent(id, req.user!.id, reason || '');
    const updated = await database.getEventById(id);
    if (updated) {
      emitStatusChange({ id: updated.id, title: updated.title, status: 'Rejected' });
      io.emit('event:rejected', { eventId: updated.id, title: updated.title, reason: reason || '', timestamp: new Date().toISOString() });
    }
    res.json({ message: 'Event rejected', event: updated });
  } catch (e: any) {
    console.error('Failed to reject event:', e);
    res.status(500).json({ error: 'Failed to reject event' });
  }
});

// ==================== ADMIN USER MANAGEMENT ====================

app.get('/api/admin/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    let users = await database.getUsers();
    users = await Promise.all(users.map(u => enrichUserAvatar(u))) as User[];
    res.json(users.map(sanitizeUser));
  } catch (e: any) {
    console.error('Failed to fetch users:', e);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.put('/api/admin/users/:id/toggle-active', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await database.getUserById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot deactivate admin users' });

    await database.updateUser(id, { isActive: !user.isActive });
    const updated = await database.getUserById(id);
    res.json({ message: `User ${updated?.isActive ? 'activated' : 'deactivated'}`, user: sanitizeUser(updated!) });
  } catch (e: any) {
    console.error('Failed to toggle user:', e);
    res.status(500).json({ error: 'Failed to toggle user status' });
  }
});

app.put('/api/admin/users/:id/role', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['student', 'organizer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const user = await database.getUserById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await database.updateUser(id, { role });
    const updated = await database.getUserById(id);
    res.json({ message: 'Role updated', user: sanitizeUser(updated!) });
  } catch (e: any) {
    console.error('Failed to update role:', e);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

app.delete('/api/admin/users/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await database.getUserById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot delete admin users' });

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted' });
  } catch (e: any) {
    console.error('Failed to delete user:', e);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ==================== ADMIN PARTICIPATION REPORTS ====================

app.get('/api/events/:id/participants', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const event = await database.getEventById(id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const attendees = await database.getEventAttendees(id);
    const reviews = await database.getReviewsByEvent(id);
    res.json({
      event: { id: event.id, title: event.title, date: event.date, status: event.status },
      participants: attendees,
      stats: {
        totalRegistered: attendees.length,
        maxCapacity: event.maxCapacity,
        totalReviews: reviews.length,
        averageRating: event.rating,
      },
    });
  } catch (e: any) {
    console.error('Failed to fetch participants:', e);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});

app.get('/api/admin/events/report', authenticate, authorize('admin'), async (req, res) => {
  try {
    const events = await database.getEventsWithAttendeeCount();
    res.json(events.map(e => ({
      id: e.id,
      title: e.title,
      date: e.date,
      status: e.status,
      category: e.category,
      registeredCount: parseInt(e.registered_count) || 0,
      maxCapacity: e.max_capacity,
      avgRating: parseFloat(e.avg_rating) || 0,
      reviewCount: parseInt(e.review_count) || 0,
    })));
  } catch (e: any) {
    console.error('Failed to fetch event report:', e);
    res.status(500).json({ error: 'Failed to fetch event report' });
  }
});

// ==================== SCHEDULED REMINDERS ====================

async function checkAndSendReminders(): Promise<void> {
  try {
    const events = await database.getEventsByStatus('Published');
    const now = new Date();

    for (const event of events) {
      if (!event.date || !event.time) continue;
      const eventDateTime = new Date(`${event.date}T${event.time}`);
      const diffMs = eventDateTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours > 0 && diffHours <= 1) {
        sendPushNotifications('Event Starting Soon!', `${event.title} starts in 1 hour at ${event.location}`);
      } else if (diffHours > 1 && diffHours <= 24) {
        sendPushNotifications('Event Tomorrow', `${event.title} is tomorrow at ${event.time} in ${event.location}`);
      }
    }
  } catch (e) {
    console.error('Reminder check failed:', e);
  }
}

setInterval(checkAndSendReminders, 60 * 60 * 1000);

// ==================== ADMIN IMPORTS FOR POOL ====================

// Global error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err?.message || '' });
});
