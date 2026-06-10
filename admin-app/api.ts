import { Event, Club, User } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://eventapp-production-9af6.up.railway.app/api';
const ADMIN_STORAGE_KEY = 'cuz_events_admin';
const TOKEN_KEY = 'cuz_events_admin_token';

async function apiFetch(url: string, options?: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

class AdminApi {
  private currentAdmin: User | null = null;
  private authToken: string | null = null;

  private authHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  private async authFetch(url: string, options?: RequestInit): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return apiFetch(url, { ...options, headers });
  }

  async init(): Promise<void> {
    try {
      const [stored, token] = await Promise.all([
        AsyncStorage.getItem(ADMIN_STORAGE_KEY),
        AsyncStorage.getItem(TOKEN_KEY),
      ]);
      if (stored) {
        this.currentAdmin = JSON.parse(stored);
      }
      if (token) {
        this.authToken = JSON.parse(token);
      }
    } catch (e) {
      console.error('Failed to load stored admin:', e);
    }
  }

  async login(email: string, password: string): Promise<User | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) return null;
    const result = await res.json();
    const user = result.user;
    if (!user || user.role !== 'admin') return null;
    if (result.token) {
      this.authToken = result.token;
      await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(result.token));
    }
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
    this.authToken = null;
    await Promise.all([
      AsyncStorage.removeItem(ADMIN_STORAGE_KEY),
      AsyncStorage.removeItem(TOKEN_KEY),
    ]);
    try {
      await fetch(`${BASE_URL}/auth/logout`, { method: 'POST' });
    } catch {}
  }

  async getEvents(status?: string, category?: string): Promise<Event[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (category) params.set('category', category);
    const qs = params.toString();
    const url = qs ? `${BASE_URL}/events?${qs}` : `${BASE_URL}/events`;
    const res = await apiFetch(url);
    return res.json();
  }

  async getEventById(id: string): Promise<Event | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(`${BASE_URL}/events/${id}`, { signal: controller.signal });
      if (!res.ok) return null;
      return res.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  async createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'createdBy' | 'clubId'> & { clubId?: string }): Promise<Event> {
    const body: Record<string, any> = { ...eventData };
    const res = await this.authFetch(`${BASE_URL}/events`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return res.json();
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<void> {
    await this.authFetch(`${BASE_URL}/events/${id}`, {
      method: 'PUT',
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
    await this.authFetch(`${BASE_URL}/events/${id}`, { method: 'DELETE' });
  }

  async getClubs(status?: string): Promise<Club[]> {
    const url = status ? `${BASE_URL}/clubs?status=${status}` : `${BASE_URL}/clubs`;
    const res = await apiFetch(url);
    return res.json();
  }

  async getClubById(id: string): Promise<Club | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(`${BASE_URL}/clubs/${id}`, { signal: controller.signal });
      if (!res.ok) return null;
      return res.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  async createClub(clubData: Omit<Club, 'id' | 'established'>): Promise<Club> {
    const res = await this.authFetch(`${BASE_URL}/clubs`, {
      method: 'POST',
      body: JSON.stringify(clubData),
    });
    return res.json();
  }

  async updateClub(id: string, updates: Partial<Club>): Promise<void> {
    await this.authFetch(`${BASE_URL}/clubs/${id}`, {
      method: 'PUT',
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
    await this.authFetch(`${BASE_URL}/clubs/${id}`, { method: 'DELETE' });
  }

  async getPresidentClubs(userId: string): Promise<Club[]> {
    const res = await apiFetch(`${BASE_URL}/users/${userId}/president-clubs`);
    return res.json();
  }

  async getPendingMembers(clubId: string): Promise<any[]> {
    const res = await this.authFetch(`${BASE_URL}/clubs/${clubId}/members/pending`);
    return res.json();
  }

  async approveMember(clubId: string, userId: string): Promise<void> {
    await this.authFetch(`${BASE_URL}/clubs/${clubId}/members/${userId}/approve`, {
      method: 'PUT',
    });
  }

  async rejectMember(clubId: string, userId: string): Promise<void> {
    await this.authFetch(`${BASE_URL}/clubs/${clubId}/members/${userId}/reject`, {
      method: 'DELETE',
    });
  }

  async getPayments(status?: string): Promise<any[]> {
    const url = status ? `${BASE_URL}/tickets?status=${status}` : `${BASE_URL}/tickets`;
    const res = await this.authFetch(url);
    return res.json();
  }

  async verifyPayment(ticketId: string): Promise<void> {
    await this.authFetch(`${BASE_URL}/tickets/${ticketId}/verify`, {
      method: 'PUT',
    });
  }

  async rejectPayment(ticketId: string): Promise<void> {
    await this.authFetch(`${BASE_URL}/tickets/${ticketId}/reject`, {
      method: 'PUT',
    });
  }

  async getUsers(): Promise<User[]> {
    const res = await this.authFetch(`${BASE_URL}/users`);
    return res.json();
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    await this.authFetch(`${BASE_URL}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getStats(): Promise<any> {
    const res = await this.authFetch(`${BASE_URL}/stats`);
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
