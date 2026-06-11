import express from 'express';
import cors from 'cors';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import { database } from './database';
import { User, Event, Club, Ticket, SavedEvent, UserClub, UserReview, Image, Notification } from './types';
import { initNotificationService, createNotification } from './notificationService';
import { signToken, authMiddleware } from './auth';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/images', express.static('public/images'));

// Initialize database
database.initialize().catch(console.error);

// Seed in background after server starts
async function seedDB() {
  try {
    const existingClubs = await database.getClubs();
    if (existingClubs.length > 0) {
      const uc = await database.getAllUserClubs();
      if (uc.length >= 10) { console.log('DB already seeded (skipping re-seed)'); }
      console.log('Re-seeding user_clubs...');
      for (const u of uc) await database.removeUserClub(u.userId, u.clubId);
    }
    if (existingClubs.length === 0 || (await database.getAllUserClubs()).length === 0) {
      console.log('Seeding database...');
      const users: any[] = require('./data/users.json');
      for (const u of users) {
        try { await database.createUser(u); } catch (e: any) { console.log('User exists:', u.id); }
      }
      const clubs: any[] = require('./data/clubs.json');
      for (const c of clubs) {
        try { await database.addClub(c); } catch (e: any) { await database.updateClub(c.id, { image: c.image }); console.log('Updated club image:', c.id); }
      }
      const events: any[] = require('./data/events.json');
      for (const e of events) {
        try { await database.addEvent(e); } catch (ex: any) { await database.updateEvent(e.id, { image: e.image }); console.log('Updated event image:', e.id); }
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
    const { v4: uuidv4 } = require('uuid');

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

    // Manual mapping: hash filename -> event_id (from mvp project's mock data)
    const eventImageMap: Record<string, string[]> = {
      '7903ba759388609c8cc053af8ae8dc4c60a50dd0.png': ['event_1'],      // Mr & Miss Cavendish
      'd7ae4b74561b5c62377c6e8e1ada58ad3e80fef4.png': ['event_2', 'event_3', 'event_5'], // Fresher's Bash, Intl Welcome, Career Expo
      'entrenuer ship.jpg': ['event_7'], // Entrepreneurship Summit
      '9740598005f689306f597b4d692dc46014798202.png': ['event_4'],      // Cultural Day Festival
      '6356727368ab75ac3f4eea867fb27bcc7ccd9258.png': ['event_6'],      // ZUSA Games
      'ed7bfb12660b2fe3e71ec2eb1a6f020bb7f683fa.png': ['event_8'],      // Medical Faculty Guest Lecture
      'dfe3dd58b825e2385a751187d0e16cf5736a02da.png': ['event_3'],      // International Students Welcome (was unused in mvp)
      'dev3pack_logo.jpg': ['event_dev3pack_hackathon'],
      'colour-run.jpg': ['event_colour_run'],
    };

    // Manual mapping: filename -> club_id
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

      // Check event mapping first
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

      // Check club mapping
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

const httpServer = http.createServer(app);
initNotificationService(httpServer);

httpServer.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  await seedDB();
});

// ==================== USER ROUTES ====================

async function enrichUserAvatar(user: User | undefined): Promise<User | undefined> {
  if (!user) return user;
  const images = await database.getImagesByEntity('user', user.id);
  if (images.length > 0) user.avatar = images[0].imageData;
  return user;
}

app.get('/api/users', async (_req, res) => {
  let users = await database.getUsers();
  users = await Promise.all(users.map(u => enrichUserAvatar(u))) as User[];
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

  const token = signToken({ id: newUser.id, email: newUser.email, role: newUser.role });
  res.status(201).json({ token, user: newUser });
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

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.json({ token, user });
});

app.put('/api/users/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
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
    res.json({ user: updated });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
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

app.post('/api/events', authMiddleware, async (req, res) => {
  const event = req.body as Event;
  event.id = `event_${uuidv4()}`;
  event.createdAt = new Date().toISOString().split('T')[0];
  await database.addEvent(event);

  if (event.clubId && event.status === 'Published') {
    const club = await database.getClubById(event.clubId);
    if (club) {
      const members = await database.getClubMembers(event.clubId);
      for (const member of members) {
        if (member.user_id !== event.createdBy) {
          await createNotification(
            member.user_id,
            'New Event Posted',
            `${club.name} posted a new event: ${event.title}`,
            'event_update',
            'event',
            event.id,
          );
        }
      }
    }
  }

  res.status(201).json(event);
});

app.put('/api/events/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  await database.updateEvent(id, req.body);
  const event = await database.getEventById(id);
  if (event) {
    res.json(event);
  } else {
    res.status(404).json({ error: 'Event not found' });
  }
});

app.delete('/api/events/:id', authMiddleware, async (req, res) => {
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

app.post('/api/clubs', async (req, res) => {
  const club: Club = {
    ...req.body,
    id: `club_${uuidv4()}`,
    established: new Date().toISOString().split('T')[0],
  };
  await database.addClub(club);
  res.status(201).json(club);
});

app.post('/api/clubs/:clubId/notify-all', async (req, res) => {
  const { clubId } = req.params;
  const { title, message, presidentId } = req.body;
  if (!presidentId || !await requirePresident(presidentId, clubId)) {
    return res.status(403).json({ error: 'Only club presidents can send notifications' });
  }
  const members = await database.getClubMembers(clubId);
  for (const member of members) {
    await createNotification(member.user_id, title, message, 'info', 'club', clubId);
  }
  res.json({ message: 'Notifications sent' });
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
    const images = await database.getImagesByEntity('club', club.id);
    if (images.length > 0) club.image = images[0].imageData;
    res.json(club);
  } else {
    res.status(404).json({ error: 'Club not found' });
  }
});

app.put('/api/clubs/:id', async (req, res) => {
  const { id } = req.params;
  const { presidentId } = req.query;

  if (presidentId && !await requirePresident(presidentId as string, id)) {
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

app.get('/api/tickets/:userId', async (req, res) => {
  const tickets = await database.getTicketsByUser(req.params.userId);
  res.json(tickets);
});

app.post('/api/tickets', async (req, res) => {
  const ticket = req.body as Ticket;
  ticket.id = `ticket_${uuidv4()}`;
  ticket.purchasedAt = new Date().toISOString();
  await database.addTicket(ticket);

  const event = await database.getEventById(ticket.eventId);
  if (event) {
    await createNotification(
      ticket.userId,
      'Ticket Confirmed',
      `Your ticket for ${event.title} is confirmed!`,
      'ticket_sold',
      'event',
      event.id,
    );
  }

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

app.get('/api/user-clubs/:userId/:clubId', async (req, res) => {
  const { userId, clubId } = req.params;
  const membership = await database.getUserClub(userId, clubId);
  if (membership) {
    res.json(membership);
  } else {
    res.status(404).json({ error: 'Not a member' });
  }
});

app.post('/api/user-clubs/request', async (req, res) => {
  const { userId, clubId } = req.body;
  if (!userId || !clubId) {
    return res.status(400).json({ error: 'userId and clubId required' });
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

  const club = await database.getClubById(clubId);
  if (club) {
    const members = await database.getClubMembers(clubId);
    for (const member of members) {
      if (member.role === 'President') {
        try {
          const user = await database.getUserById(userId);
          await createNotification(
            member.user_id,
            'New Club Join Request',
            `${user?.name || 'Someone'} wants to join ${club.name}`,
            'club',
            'club',
            clubId,
          );
        } catch {}
      }
    }
  }

  res.status(201).json(userClub);
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

// ==================== CLUB MEMBER MANAGEMENT (President) ====================

app.get('/api/clubs/:clubId/members/pending', async (req, res) => {
  const { clubId } = req.params;
  const members = await database.getClubPendingMembers(clubId);
  res.json(members);
});

app.put('/api/clubs/:clubId/members/:userId/approve', async (req, res) => {
  const { clubId, userId } = req.params;
  await database.approveClubMember(userId, clubId);

  const club = await database.getClubById(clubId);
  if (club) {
    await createNotification(
      userId,
      'Club Membership Approved',
      `You have been approved as a member of ${club.name}!`,
      'success',
      'club',
      clubId,
    );
  }

  res.json({ message: 'Member approved' });
});

app.delete('/api/clubs/:clubId/members/:userId/reject', async (req, res) => {
  const { clubId, userId } = req.params;
  const club = await database.getClubById(clubId);

  await database.removeUserClub(userId, clubId);

  if (club) {
    await createNotification(
      userId,
      'Club Membership Rejected',
      `Your request to join ${club.name} was declined.`,
      'error',
      'club',
      clubId,
    );
  }

  res.json({ message: 'Member rejected' });
});

app.get('/api/users/:userId/president-clubs', async (req, res) => {
  const { userId } = req.params;
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

app.post('/api/clubs/:clubId/members', async (req, res) => {
  const { clubId } = req.params;
  const { userId: targetUserId, role } = req.body;
  const { presidentId } = req.query;

  if (!presidentId || !await requirePresident(presidentId as string, clubId)) {
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

app.delete('/api/clubs/:clubId/members/:userId', async (req, res) => {
  const { clubId, userId } = req.params;
  const { presidentId } = req.query;

  if (!presidentId || !await requirePresident(presidentId as string, clubId)) {
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

// ==================== DEBUG SEED ====================

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

// ==================== IMAGE ROUTES ====================

app.get('/api/images/:entityType/:entityId', async (req, res) => {
  const { entityType, entityId } = req.params;
  const images = await database.getImagesByEntity(entityType, entityId);
  res.json(images);
});

app.post('/api/images', async (req, res) => {
  const image: Image = {
    ...req.body,
    id: `img_${uuidv4()}`,
    createdAt: new Date().toISOString(),
  };
  await database.addImage(image);
  res.status(201).json(image);
});

app.delete('/api/images/:id', async (req, res) => {
  const { id } = req.params;
  await database.deleteImage(id);
  res.json({ message: 'Image deleted' });
});

app.delete('/api/images/:entityType/:entityId', async (req, res) => {
  const { entityType, entityId } = req.params;
  await database.deleteImagesByEntity(entityType, entityId);
  res.json({ message: 'Images deleted' });
});

// ==================== NOTIFICATION ROUTES ====================

app.get('/api/notifications/:userId', async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await database.getNotifications(userId, page, limit);
  res.json(result);
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  await database.markNotificationRead(id, userId);
  res.json({ message: 'Notification marked as read' });
});

app.post('/api/notifications/read-all', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  await database.markAllNotificationsRead(userId);
  res.json({ message: 'All notifications marked as read' });
});

// ==================== STATS ====================

app.get('/api/stats', async (_req, res) => {
  const stats = await database.getStats();
  res.json(stats);
});


