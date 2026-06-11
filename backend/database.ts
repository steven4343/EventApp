import pool from './db';
import { User, Event, Club, Ticket, SavedEvent, UserClub, UserReview, Image, Notification } from './types';

class Database {
  async initialize(): Promise<void> {
    const fs = require('fs');
    const path = require('path');
    const sql = fs.readFileSync(path.join(__dirname, 'migrations', '001_initial.sql'), 'utf-8');
    await pool.query(sql);
    const sql2 = fs.readFileSync(path.join(__dirname, 'migrations', '002_images.sql'), 'utf-8');
    await pool.query(sql2);
    const sql3 = fs.readFileSync(path.join(__dirname, 'migrations', '003_club_admin_password.sql'), 'utf-8');
    await pool.query(sql3);
    console.log('Database initialized');
  }

  async getUsers(): Promise<User[]> {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY name');
    return rows.map(mapUser);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows.length ? mapUser(rows[0]) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows.length ? mapUser(rows[0]) : undefined;
  }

  async authenticateUser(email: string, password: string): Promise<User | undefined> {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
    return rows.length ? mapUser(rows[0]) : undefined;
  }

  async createUser(user: User): Promise<void> {
    await pool.query(
      `INSERT INTO users (id, name, email, student_id, password, faculty, year, avatar, joined_at, is_active, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [user.id, user.name, user.email, user.studentId, user.password, user.faculty, user.year, user.avatar, user.joinedAt, user.isActive, user.role]
    );
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const fields = mapUserUpdate(updates);
    if (Object.keys(fields).length === 0) return;
    const setClauses = Object.keys(fields).map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = Object.values(fields);
    await pool.query(`UPDATE users SET ${setClauses} WHERE id = $1`, [id, ...values]);
  }

  async getEvents(status?: string, category?: string): Promise<Event[]> {
    let query = 'SELECT * FROM events';
    const conditions: string[] = [];
    const params: any[] = [];
    if (status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }
    if (category) {
      conditions.push(`category = $${params.length + 1}`);
      params.push(category);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY date DESC';
    const { rows } = await pool.query(query, params);
    return rows.map(mapEvent);
  }

  async getEventById(id: string): Promise<Event | undefined> {
    const { rows } = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    return rows.length ? mapEvent(rows[0]) : undefined;
  }

  async addEvent(event: Event): Promise<void> {
    await pool.query(
      `INSERT INTO events (id, title, date, time, location, category, club_id, description, image, price, attendees, max_capacity, rating, reviews, status, created_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [event.id, event.title, event.date, event.time, event.location, event.category, event.clubId, event.description, event.image, event.price, event.attendees, event.maxCapacity, event.rating, event.reviews, event.status, event.createdAt, event.createdBy]
    );
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<void> {
    const fields = mapEventUpdate(updates);
    if (Object.keys(fields).length === 0) return;
    const setClauses = Object.keys(fields).map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = Object.values(fields);
    await pool.query(`UPDATE events SET ${setClauses} WHERE id = $1`, [id, ...values]);
  }

  async deleteEvent(id: string): Promise<void> {
    await pool.query('DELETE FROM events WHERE id = $1', [id]);
  }

  async getClubs(status?: string): Promise<Club[]> {
    let query = 'SELECT * FROM clubs';
    const params: any[] = [];
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    query += ' ORDER BY name';
    const { rows } = await pool.query(query, params);
    return rows.map(mapClub);
  }

  async getClubById(id: string): Promise<Club | undefined> {
    const { rows } = await pool.query('SELECT * FROM clubs WHERE id = $1', [id]);
    return rows.length ? mapClub(rows[0]) : undefined;
  }

  async addClub(club: Club): Promise<void> {
    await pool.query(
       `INSERT INTO clubs (id, name, category, short_description, description, image, members, meeting_time, meeting_location, leaders, status, rating, reviews, established)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [club.id, club.name, club.category, club.shortDescription, club.description, club.image, club.members, club.meetingTime, club.meetingLocation, JSON.stringify(club.leaders), club.status, club.rating, club.reviews, club.established]
    );
  }

  async updateClub(id: string, updates: Partial<Club>): Promise<void> {
    const fields = mapClubUpdate(updates);
    if (Object.keys(fields).length === 0) return;
    const setClauses = Object.keys(fields).map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = Object.values(fields);
    await pool.query(`UPDATE clubs SET ${setClauses} WHERE id = $1`, [id, ...values]);
  }

  async deleteClub(id: string): Promise<void> {
    await pool.query('DELETE FROM clubs WHERE id = $1', [id]);
  }

  async getTicketsByUser(userId: string): Promise<Ticket[]> {
    const { rows } = await pool.query('SELECT * FROM tickets WHERE user_id = $1 ORDER BY purchased_at DESC', [userId]);
    return rows.map(mapTicket);
  }

  async getAllTickets(): Promise<Ticket[]> {
    const { rows } = await pool.query('SELECT * FROM tickets ORDER BY purchased_at DESC');
    return rows.map(mapTicket);
  }

  async updateTicketStatus(id: string, status: string): Promise<void> {
    await pool.query('UPDATE tickets SET status = $1 WHERE id = $2', [status, id]);
  }

  async addTicket(ticket: Ticket): Promise<void> {
    await pool.query(
      `INSERT INTO tickets (id, user_id, event_id, seat, status, price, purchased_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [ticket.id, ticket.userId, ticket.eventId, ticket.seat, ticket.status, ticket.price, ticket.purchasedAt]
    );
  }

  async getSavedByUser(userId: string): Promise<SavedEvent[]> {
    const { rows } = await pool.query('SELECT * FROM saved_events WHERE user_id = $1 ORDER BY saved_at DESC', [userId]);
    return rows.map(mapSavedEvent);
  }

  async addSaved(saved: SavedEvent): Promise<void> {
    await pool.query(
      `INSERT INTO saved_events (id, user_id, event_id, saved_at)
       VALUES ($1, $2, $3, $4)`,
      [saved.id, saved.userId, saved.eventId, saved.savedAt]
    );
  }

  async removeSaved(userId: string, eventId: string): Promise<void> {
    await pool.query('DELETE FROM saved_events WHERE user_id = $1 AND event_id = $2', [userId, eventId]);
  }

  async getAllUserClubs(): Promise<UserClub[]> {
    const { rows } = await pool.query('SELECT * FROM user_clubs');
    return rows.map(mapUserClub);
  }

  async getUserClubs(userId: string): Promise<UserClub[]> {
    const { rows } = await pool.query('SELECT * FROM user_clubs WHERE user_id = $1 ORDER BY joined_at DESC', [userId]);
    return rows.map(mapUserClub);
  }

  async getUserClub(userId: string, clubId: string): Promise<UserClub | undefined> {
    const { rows } = await pool.query('SELECT * FROM user_clubs WHERE user_id = $1 AND club_id = $2', [userId, clubId]);
    return rows.length ? mapUserClub(rows[0]) : undefined;
  }

  async addUserClub(userClub: UserClub): Promise<void> {
    await pool.query(
      `INSERT INTO user_clubs (id, user_id, club_id, role, joined_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [userClub.id, userClub.userId, userClub.clubId, userClub.role, userClub.joinedAt]
    );
  }

  async updateUserClubRole(userId: string, clubId: string, role: string): Promise<void> {
    await pool.query('UPDATE user_clubs SET role = $1 WHERE user_id = $2 AND club_id = $3', [role, userId, clubId]);
  }

  async removeUserClub(userId: string, clubId: string): Promise<void> {
    await pool.query('DELETE FROM user_clubs WHERE user_id = $1 AND club_id = $2', [userId, clubId]);
  }

  async getClubPendingMembers(clubId: string): Promise<any[]> {
    const { rows } = await pool.query(`
      SELECT uc.*, u.name, u.email
      FROM user_clubs uc
      JOIN users u ON u.id = uc.user_id
      WHERE uc.club_id = $1 AND uc.role = 'Pending'
      ORDER BY uc.joined_at DESC
    `, [clubId]);
    return rows;
  }

  async getClubMembers(clubId: string): Promise<any[]> {
    const { rows } = await pool.query(`
      SELECT uc.*, u.name, u.email
      FROM user_clubs uc
      JOIN users u ON u.id = uc.user_id
      WHERE uc.club_id = $1 AND uc.role != 'Pending'
      ORDER BY uc.role, u.name
    `, [clubId]);
    return rows;
  }

  async approveClubMember(userId: string, clubId: string): Promise<void> {
    await this.updateUserClubRole(userId, clubId, 'Member');
    const club = await this.getClubById(clubId);
    if (club) {
      await pool.query('UPDATE clubs SET members = members + 1 WHERE id = $1', [clubId]);
    }
  }

  async getPresidentClubs(userId: string): Promise<Club[]> {
    const { rows } = await pool.query(`
      SELECT c.* FROM clubs c
      JOIN user_clubs uc ON uc.club_id = c.id
      WHERE uc.user_id = $1 AND uc.role = 'President'
      ORDER BY c.name
    `, [userId]);
    return rows.map(mapClub);
  }

  async addReview(review: UserReview): Promise<void> {
    await pool.query(
      `INSERT INTO user_reviews (id, user_id, item_id, item_type, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [review.id, review.userId, review.itemId, review.itemType, review.rating, review.comment, review.createdAt]
    );
  }

  async getReviewsByUser(userId: string): Promise<UserReview[]> {
    const { rows } = await pool.query('SELECT * FROM user_reviews WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return rows.map(mapUserReview);
  }

  async getStats(): Promise<any> {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM events) AS events,
        (SELECT COUNT(*) FROM clubs) AS clubs,
        (SELECT COUNT(*) FROM tickets) AS tickets,
        (SELECT COUNT(*) FROM saved_events) AS saved_events,
        (SELECT COUNT(*) FROM user_clubs) AS user_clubs
    `);
    return rows[0];
  }

  async getImagesByEntity(entityType: string, entityId: string): Promise<Image[]> {
    const { rows } = await pool.query(
      'SELECT * FROM images WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC',
      [entityType, entityId]
    );
    return rows.map(mapImage);
  }

  async addImage(image: Image): Promise<void> {
    await pool.query(
      `INSERT INTO images (id, entity_type, entity_id, image_data, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [image.id, image.entityType, image.entityId, image.imageData, image.createdAt]
    );
  }

  async deleteImage(id: string): Promise<void> {
    await pool.query('DELETE FROM images WHERE id = $1', [id]);
  }

  async deleteImagesByEntity(entityType: string, entityId: string): Promise<void> {
    await pool.query('DELETE FROM images WHERE entity_type = $1 AND entity_id = $2', [entityType, entityId]);
  }

  async verifyClubAdmin(clubId: string, password: string): Promise<boolean> {
    const { rows } = await pool.query('SELECT admin_password FROM clubs WHERE id = $1', [clubId]);
    if (rows.length === 0) return false;
    return rows[0].admin_password === password;
  }

  async createNotification(notification: Notification): Promise<void> {
    await pool.query(
      `INSERT INTO notifications (id, user_id, title, message, type, reference_type, reference_id, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [notification.id, notification.userId, notification.title, notification.message,
       notification.type, notification.referenceType || null, notification.referenceId || null,
       notification.isRead, notification.createdAt]
    );
  }

  async getNotifications(userId: string, page: number = 1, limit: number = 20): Promise<{ notifications: Notification[], unreadCount: number }> {
    const offset = (page - 1) * limit;
    const { rows } = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return {
      notifications: rows.map(mapNotification),
      unreadCount: parseInt(countResult.rows[0].count),
    };
  }

  async markNotificationRead(id: string, userId: string): Promise<void> {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );
  }

  async reset(): Promise<void> {
    await pool.query('DELETE FROM images');
    await pool.query('DELETE FROM user_reviews');
    await pool.query('DELETE FROM user_clubs');
    await pool.query('DELETE FROM saved_events');
    await pool.query('DELETE FROM tickets');
    await pool.query('DELETE FROM events');
    await pool.query('DELETE FROM clubs');
    await pool.query('DELETE FROM users');
  }
}

function mapUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    studentId: row.student_id,
    password: row.password,
    faculty: row.faculty,
    year: row.year,
    avatar: row.avatar,
    joinedAt: row.joined_at,
    isActive: row.is_active,
    role: row.role,
  };
}

function mapUserUpdate(u: Partial<User>): Record<string, any> {
  const fields: Record<string, any> = {};
  if (u.name !== undefined) fields.name = u.name;
  if (u.email !== undefined) fields.email = u.email;
  if (u.studentId !== undefined) fields.student_id = u.studentId;
  if (u.password !== undefined) fields.password = u.password;
  if (u.faculty !== undefined) fields.faculty = u.faculty;
  if (u.year !== undefined) fields.year = u.year;
  if (u.avatar !== undefined) fields.avatar = u.avatar;
  if (u.isActive !== undefined) fields.is_active = u.isActive;
  if (u.role !== undefined) fields.role = u.role;
  return fields;
}

function mapEvent(row: any): Event {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    time: row.time,
    location: row.location,
    category: row.category,
    clubId: row.club_id,
    description: row.description,
    image: row.image,
    price: parseFloat(row.price) || 0,
    attendees: row.attendees,
    maxCapacity: row.max_capacity,
    rating: parseFloat(row.rating) || 0,
    reviews: row.reviews,
    status: row.status,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

function mapEventUpdate(e: Partial<Event>): Record<string, any> {
  const fields: Record<string, any> = {};
  if (e.title !== undefined) fields.title = e.title;
  if (e.date !== undefined) fields.date = e.date;
  if (e.time !== undefined) fields.time = e.time;
  if (e.location !== undefined) fields.location = e.location;
  if (e.category !== undefined) fields.category = e.category;
  if (e.clubId !== undefined) fields.club_id = e.clubId;
  if (e.description !== undefined) fields.description = e.description;
  if (e.image !== undefined) fields.image = e.image;
  if (e.price !== undefined) fields.price = e.price;
  if (e.attendees !== undefined) fields.attendees = e.attendees;
  if (e.maxCapacity !== undefined) fields.max_capacity = e.maxCapacity;
  if (e.rating !== undefined) fields.rating = e.rating;
  if (e.reviews !== undefined) fields.reviews = e.reviews;
  if (e.status !== undefined) fields.status = e.status;
  if (e.createdBy !== undefined) fields.created_by = e.createdBy;
  return fields;
}

function mapClub(row: any): Club {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    shortDescription: row.short_description,
    description: row.description,
    image: row.image,
    members: row.members,
    meetingTime: row.meeting_time,
    meetingLocation: row.meeting_location,
    leaders: typeof row.leaders === 'string' ? JSON.parse(row.leaders) : (row.leaders || []),
    status: row.status,
    rating: parseFloat(row.rating) || 0,
    reviews: row.reviews,
    established: row.established,
  };
}

function mapClubUpdate(c: Partial<Club>): Record<string, any> {
  const fields: Record<string, any> = {};
  if (c.name !== undefined) fields.name = c.name;
  if (c.category !== undefined) fields.category = c.category;
  if (c.shortDescription !== undefined) fields.short_description = c.shortDescription;
  if (c.description !== undefined) fields.description = c.description;
  if (c.image !== undefined) fields.image = c.image;
  if (c.members !== undefined) fields.members = c.members;
  if (c.meetingTime !== undefined) fields.meeting_time = c.meetingTime;
  if (c.meetingLocation !== undefined) fields.meeting_location = c.meetingLocation;
  if (c.leaders !== undefined) fields.leaders = JSON.stringify(c.leaders);
  if (c.status !== undefined) fields.status = c.status;
  if (c.rating !== undefined) fields.rating = c.rating;
  if (c.reviews !== undefined) fields.reviews = c.reviews;
  if (c.established !== undefined) fields.established = c.established;
  if (c.adminPassword !== undefined) fields.admin_password = c.adminPassword;
  return fields;
}

function mapTicket(row: any): Ticket {
  return {
    id: row.id,
    userId: row.user_id,
    eventId: row.event_id,
    seat: row.seat,
    status: row.status,
    price: parseFloat(row.price) || 0,
    purchasedAt: row.purchased_at,
  };
}

function mapSavedEvent(row: any): SavedEvent {
  return {
    id: row.id,
    userId: row.user_id,
    eventId: row.event_id,
    savedAt: row.saved_at,
  };
}

function mapUserClub(row: any): UserClub {
  return {
    id: row.id,
    userId: row.user_id,
    clubId: row.club_id,
    role: row.role,
    joinedAt: row.joined_at,
  };
}

function mapUserReview(row: any): UserReview {
  return {
    id: row.id,
    userId: row.user_id,
    itemId: row.item_id,
    itemType: row.item_type,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
  };
}

function mapNotification(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type,
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

function mapImage(row: any): Image {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    imageData: row.image_data,
    createdAt: row.created_at,
  };
}

export const database = new Database();
export default database;
