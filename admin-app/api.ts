import { Event, Club, User } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://eventapp-vf9u.onrender.com/api';
const ADMIN_STORAGE_KEY = 'cuz_events_admin';

const TOKEN_KEY = 'cuz_events_admin_token';

type AuthCallback = () => void;

class AdminApi {
  private currentAdmin: User | null = null;
  private token: string | null = null;
  onUnauthorized: AuthCallback | null = null;

  private authHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    return headers;
  }

  private async checkAuth(res: Response): Promise<Response> {
    if (res.status === 401) {
      await this.logout();
      this.onUnauthorized?.();
      throw new Error('Session expired. Please login again.');
    }
    return res;
  }

  async init(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(ADMIN_STORAGE_KEY);
      if (stored) this.currentAdmin = JSON.parse(stored);
      this.token = await AsyncStorage.getItem(TOKEN_KEY);
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
    this.token = result.token;
    this.currentAdmin = user;
    await AsyncStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(user));
    if (this.token) await AsyncStorage.setItem(TOKEN_KEY, this.token);
    return user;
  }

  getCurrentAdmin() {
    return this.currentAdmin;
  }

  getToken() {
    return this.token;
  }

  setGuestAdmin(guest: User) {
    this.currentAdmin = guest;
  }

  async persistCurrentAdmin(): Promise<void> {
    if (this.currentAdmin) {
      await AsyncStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(this.currentAdmin));
    }
  }

  async logout(): Promise<void> {
    this.currentAdmin = null;
    this.token = null;
    await AsyncStorage.removeItem(ADMIN_STORAGE_KEY);
    await AsyncStorage.removeItem(TOKEN_KEY);
  }

  async getEvents(status?: string, category?: string): Promise<Event[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (category) params.set('category', category);
    const qs = params.toString();
    const url = qs ? `${BASE_URL}/events?${qs}` : `${BASE_URL}/events`;
    const res = await this.checkAuth(await fetch(url, { headers: this.authHeaders() }));
    return res.json();
  }

  async getEventById(id: string): Promise<Event | null> {
    const res = await this.checkAuth(await fetch(`${BASE_URL}/events/${id}`, { headers: this.authHeaders() }));
    if (!res.ok) return null;
    return res.json();
  }

  async createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'createdBy' | 'clubId'> & { clubId?: string }): Promise<Event> {
    const body: Record<string, any> = { ...eventData, createdBy: this.currentAdmin?.id || 'admin_001' };
    if (!body.clubId) body.clubId = null;
    const res = await this.checkAuth(await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify(body),
    }));
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error || 'Failed to create event');
    }
    return res.json();
  }

  async getEventReviews(eventId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/events/${eventId}/reviews`, { headers: this.authHeaders() });
    return res.json();
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<void> {
    const res = await this.checkAuth(await fetch(`${BASE_URL}/events/${id}`, {
      method: 'PUT',
      headers: this.authHeaders(),
      body: JSON.stringify(updates),
    }));
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update event' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
  }

  async publishEvent(id: string): Promise<void> {
    await this.updateEvent(id, { status: 'Published' });
  }

  async unpublishEvent(id: string): Promise<void> {
    await this.updateEvent(id, { status: 'Draft' });
  }

  async deleteEvent(id: string): Promise<void> {
    await this.checkAuth(await fetch(`${BASE_URL}/events/${id}`, { method: 'DELETE', headers: this.authHeaders() }));
  }

  async uploadImage(entityType: 'event' | 'club' | 'user', entityId: string, imageData: string): Promise<void> {
    const res = await this.checkAuth(await fetch(`${BASE_URL}/images`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify({ entityType, entityId, imageData }),
    }));
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to upload image' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
  }

  async getClubs(status?: string): Promise<Club[]> {
    const url = status ? `${BASE_URL}/clubs?status=${status}` : `${BASE_URL}/clubs`;
    const res = await this.checkAuth(await fetch(url, { headers: this.authHeaders() }));
    return res.json();
  }

  async getClubById(id: string): Promise<Club | null> {
    const res = await this.checkAuth(await fetch(`${BASE_URL}/clubs/${id}`, { headers: this.authHeaders() }));
    if (!res.ok) return null;
    return res.json();
  }

  async createClub(clubData: Omit<Club, 'id' | 'established'>): Promise<Club> {
    const res = await this.checkAuth(await fetch(`${BASE_URL}/clubs`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify(clubData),
    }));
    return res.json();
  }

  async updateClub(id: string, updates: Partial<Club>): Promise<void> {
    await this.checkAuth(await fetch(`${BASE_URL}/clubs/${id}`, {
      method: 'PUT',
      headers: this.authHeaders(),
      body: JSON.stringify(updates),
    }));
  }

  async approveClub(id: string): Promise<void> {
    await this.updateClub(id, { status: 'Active' });
  }

  async deactivateClub(id: string): Promise<void> {
    await this.updateClub(id, { status: 'Inactive' });
  }

  async reactivateClub(id: string): Promise<void> {
    await this.updateClub(id, { status: 'Active' });
  }

  async deleteClub(id: string): Promise<void> {
    await this.checkAuth(await fetch(`${BASE_URL}/clubs/${id}`, { method: 'DELETE', headers: this.authHeaders() }));
  }

  async getPresidentClubs(userId: string): Promise<Club[]> {
    const res = await this.checkAuth(await fetch(`${BASE_URL}/users/${userId}/president-clubs`, { headers: this.authHeaders() }));
    return res.json();
  }

  async getPendingMembers(clubId: string): Promise<any[]> {
    const res = await this.checkAuth(await fetch(`${BASE_URL}/clubs/${clubId}/members/pending`, { headers: this.authHeaders() }));
    return res.json();
  }

  async approveMember(clubId: string, userId: string): Promise<void> {
    await this.checkAuth(await fetch(`${BASE_URL}/clubs/${clubId}/members/${userId}/approve`, {
      method: 'PUT',
      headers: this.authHeaders(),
    }));
  }

  async rejectMember(clubId: string, userId: string): Promise<void> {
    await this.checkAuth(await fetch(`${BASE_URL}/clubs/${clubId}/members/${userId}/reject`, {
      method: 'DELETE',
      headers: this.authHeaders(),
    }));
  }

  async getPayments(status?: string): Promise<any[]> {
    const url = status ? `${BASE_URL}/tickets?status=${status}` : `${BASE_URL}/tickets`;
    const res = await this.checkAuth(await fetch(url, { headers: this.authHeaders() }));
    return res.json();
  }

  async verifyPayment(ticketId: string, adminId: string): Promise<void> {
    await this.checkAuth(await fetch(`${BASE_URL}/tickets/${ticketId}/verify`, {
      method: 'PUT',
      headers: this.authHeaders(),
      body: JSON.stringify({ adminId }),
    }));
  }

  async rejectPayment(ticketId: string, adminId: string): Promise<void> {
    await this.checkAuth(await fetch(`${BASE_URL}/tickets/${ticketId}/reject`, {
      method: 'PUT',
      headers: this.authHeaders(),
      body: JSON.stringify({ adminId }),
    }));
  }

  async getUsers(): Promise<User[]> {
    const res = await this.checkAuth(await fetch(`${BASE_URL}/users`, { headers: this.authHeaders() }));
    return res.json();
  }

  async updateUser(id: string, updates: Partial<User>): Promise<any> {
    const res = await this.checkAuth(await fetch(`${BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: this.authHeaders(),
      body: JSON.stringify(updates),
    }));
    const data = await res.json();
    return data.user || data;
  }

  async lookupTicket(id: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/tickets/lookup/${id}`);
    if (!res.ok) return null;
    return res.json();
  }

  async markTicketUsed(id: string): Promise<void> {
    await this.checkAuth(await fetch(`${BASE_URL}/tickets/${id}/use`, {
      method: 'PUT',
      headers: this.authHeaders(),
    }));
  }

  async getStats(): Promise<any> {
    const res = await fetch(`${BASE_URL}/stats`, { headers: this.authHeaders() });
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
        pending: events.filter(e => e.status === 'Pending').length,
      },
      clubs: {
        total: clubs.length,
        active: clubs.filter(c => c.status === 'Active').length,
        pending: clubs.filter(c => c.status === 'Pending').length,
        inactive: clubs.filter(c => c.status === 'Inactive').length,
      },
    };
  }

  async getPendingEvents(): Promise<Event[]> {
    const res = await this.checkAuth(await fetch(`${BASE_URL}/events/pending`, { headers: this.authHeaders() }));
    return res.json();
  }

  async approveEvent(eventId: string): Promise<any> {
    const res = await this.checkAuth(await fetch(`${BASE_URL}/events/${eventId}/approve`, {
      method: 'PUT',
      headers: this.authHeaders(),
    }));
    return res.json();
  }

  async rejectEvent(eventId: string, reason: string): Promise<any> {
    const res = await this.checkAuth(await fetch(`${BASE_URL}/events/${eventId}/reject`, {
      method: 'PUT',
      headers: this.authHeaders(),
      body: JSON.stringify({ reason }),
    }));
    return res.json();
  }

  async getAdminUsers(): Promise<User[]> {
    const res = await this.checkAuth(await fetch(`${BASE_URL}/admin/users`, { headers: this.authHeaders() }));
    return res.json();
  }

  async toggleUserActive(userId: string): Promise<any> {
    const res = await this.checkAuth(await fetch(`${BASE_URL}/admin/users/${userId}/toggle-active`, {
      method: 'PUT',
      headers: this.authHeaders(),
    }));
    return res.json();
  }

  async updateUserRole(userId: string, role: string): Promise<any> {
    const res = await this.checkAuth(await fetch(`${BASE_URL}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: this.authHeaders(),
      body: JSON.stringify({ role }),
    }));
    return res.json();
  }

  async deleteUser(userId: string): Promise<any> {
    const res = await this.checkAuth(await fetch(`${BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: this.authHeaders(),
    }));
    return res.json();
  }

  async getEventParticipants(eventId: string): Promise<any> {
    const res = await this.checkAuth(await fetch(`${BASE_URL}/events/${eventId}/participants`, { headers: this.authHeaders() }));
    return res.json();
  }

  async getEventReport(): Promise<any[]> {
    const res = await this.checkAuth(await fetch(`${BASE_URL}/admin/events/report`, { headers: this.authHeaders() }));
    return res.json();
  }
}

export const adminApi = new AdminApi();
export default adminApi;
