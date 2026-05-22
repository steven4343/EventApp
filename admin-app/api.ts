import { Event, Club, User } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://eventapp-production-9af6.up.railway.app/api';
const ADMIN_STORAGE_KEY = 'cuz_events_admin';

class AdminApi {
  private currentAdmin: User | null = null;

  async init(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(ADMIN_STORAGE_KEY);
      if (stored) {
        this.currentAdmin = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load stored admin:', e);
    }
  }

  async login(email: string, password: string): Promise<User | null> {
    const res = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return null;
    const result = await res.json();
    const user = result.user;
    if (!user || user.role !== 'admin') return null;
    this.currentAdmin = user;
    await AsyncStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(user));
    return user;
  }

  getCurrentAdmin() {
    return this.currentAdmin;
  }

  setGuestAdmin(guest: User) {
    this.currentAdmin = guest;
  }

  async logout(): Promise<void> {
    this.currentAdmin = null;
    await AsyncStorage.removeItem(ADMIN_STORAGE_KEY);
  }

  async getEvents(status?: string, category?: string): Promise<Event[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (category) params.set('category', category);
    const qs = params.toString();
    const url = qs ? `${BASE_URL}/events?${qs}` : `${BASE_URL}/events`;
    const res = await fetch(url);
    return res.json();
  }

  async getEventById(id: string): Promise<Event | null> {
    const res = await fetch(`${BASE_URL}/events/${id}`);
    if (!res.ok) return null;
    return res.json();
  }

  async createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'createdBy' | 'clubId'> & { clubId?: string }): Promise<Event> {
    const body: Record<string, any> = { ...eventData, createdBy: this.currentAdmin?.id || 'admin_001' };
    if (!body.clubId) body.clubId = null;
    const res = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<void> {
    await fetch(`${BASE_URL}/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  }

  async publishEvent(id: string): Promise<void> {
    await this.updateEvent(id, { status: 'Published' });
  }

  async unpublishEvent(id: string): Promise<void> {
    await this.updateEvent(id, { status: 'Draft' });
  }

  async deleteEvent(id: string): Promise<void> {
    await fetch(`${BASE_URL}/events/${id}`, { method: 'DELETE' });
  }

  async getClubs(status?: string): Promise<Club[]> {
    const url = status ? `${BASE_URL}/clubs?status=${status}` : `${BASE_URL}/clubs`;
    const res = await fetch(url);
    return res.json();
  }

  async getClubById(id: string): Promise<Club | null> {
    const res = await fetch(`${BASE_URL}/clubs/${id}`);
    if (!res.ok) return null;
    return res.json();
  }

  async createClub(clubData: Omit<Club, 'id' | 'established'>): Promise<Club> {
    const res = await fetch(`${BASE_URL}/clubs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clubData),
    });
    return res.json();
  }

  async updateClub(id: string, updates: Partial<Club>): Promise<void> {
    await fetch(`${BASE_URL}/clubs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  }

  async approveClub(id: string): Promise<void> {
    await this.updateClub(id, { status: 'Active' });
  }

  async deactivateClub(id: string): Promise<void> {
    await this.updateClub(id, { status: 'Inactive' });
  }

  async deleteClub(id: string): Promise<void> {
    await fetch(`${BASE_URL}/clubs/${id}`, { method: 'DELETE' });
  }

  async getPayments(status?: string): Promise<any[]> {
    const url = status ? `${BASE_URL}/payments?status=${status}` : `${BASE_URL}/payments`;
    const res = await fetch(url);
    return res.json();
  }

  async verifyPayment(ticketId: string, adminId: string): Promise<void> {
    await fetch(`${BASE_URL}/tickets/${ticketId}/verify`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId }),
    });
  }

  async rejectPayment(ticketId: string, adminId: string): Promise<void> {
    await fetch(`${BASE_URL}/tickets/${ticketId}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId }),
    });
  }

  async getUsers(): Promise<User[]> {
    const res = await fetch(`${BASE_URL}/users`);
    return res.json();
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    await fetch(`${BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  }

  async getStats(): Promise<any> {
    const res = await fetch(`${BASE_URL}/stats`);
    const stats = await res.json();
    const [events, clubs] = await Promise.all([
      this.getEvents(),
      this.getClubs(),
    ]);
    return {
      ...stats,
      events: {
        total: events.length,
        published: events.filter(e => e.status === 'Published').length,
        draft: events.filter(e => e.status === 'Draft').length,
      },
      clubs: {
        total: clubs.length,
        active: clubs.filter(c => c.status === 'Active').length,
        pending: clubs.filter(c => c.status === 'Pending').length,
        inactive: clubs.filter(c => c.status === 'Inactive').length,
      },
    };
  }
}

export const adminApi = new AdminApi();
export default adminApi;
