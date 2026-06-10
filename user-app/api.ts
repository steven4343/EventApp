import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event, Club } from './types';

const BASE_URL = process.env.API_URL || process.env.EXPO_PUBLIC_API_URL || 'https://eventapp-production-9af6.up.railway.app/api';
const TOKEN_KEY = 'cuz_events_token';

interface BackendEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  clubId: string;
  description: string;
  image: string;
  price: number;
  attendees: number;
  maxCapacity: number;
  rating: number;
  reviews: number;
  status: string;
  createdAt: string;
  createdBy: string;
}

interface BackendClub {
  id: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  image: string;
  members: number;
  meetingTime: string;
  meetingLocation: string;
  leaders: { name: string; role: string; email: string }[];
  status: string;
  rating: number;
  reviews: number;
  established: string;
}

function toEventImage(url: string): { uri: string } {
  if (!url) return { uri: 'https://picsum.photos/seed/event/400' };
  if (url.startsWith('http') || url.startsWith('data:')) return { uri: url };
  return { uri: `https://picsum.photos/seed/${url}/400` };
}

function toClubImage(url: string): { uri: string } {
  if (!url) return { uri: 'https://picsum.photos/seed/club/400' };
  if (url.startsWith('http') || url.startsWith('data:')) return { uri: url };
  return { uri: `https://picsum.photos/seed/${url}/400` };
}

class UserApi {
  private currentUser: any = null;
  private clubsCache: BackendClub[] | null = null;
  private authToken: string | null = null;

  private authHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getToken(): string | null {
    return this.authToken;
  }

  async setToken(token: string | null): Promise<void> {
    this.authToken = token;
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(token));
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  }

  async loadToken(): Promise<string | null> {
    try {
      const stored = await AsyncStorage.getItem(TOKEN_KEY);
      if (stored) {
        this.authToken = JSON.parse(stored);
        return this.authToken;
      }
    } catch (e) {
      console.error('Failed to load token:', e);
    }
    return null;
  }

  setCurrentUser(user: any) {
    this.currentUser = user;
  }

  private async authFetch(url: string, options?: RequestInit): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return fetch(url, { ...options, headers });
  }

  async login(email: string, password: string) {
    const res = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return null;
    const result = await res.json();
    if (result.token) {
      await this.setToken(result.token);
    }
    const user = result.user || result;
    this.currentUser = user;
    return user;
  }

  async registerPushToken(token: string): Promise<void> {
    if (!this.authToken) return;
    try {
      await this.authFetch(`${BASE_URL}/push-tokens/register`, {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
    } catch {}
  }

  async register(userData: { name: string; email: string; password: string; studentId?: string; faculty?: string; year?: number }) {
    const res = await fetch(`${BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!res.ok) return null;
    const result = await res.json();
    if (result.token) {
      await this.setToken(result.token);
    }
    this.currentUser = result.user;
    return result.user;
  }

  async googleLogin(idToken: string) {
    const res = await fetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.token) {
      await this.setToken(data.token);
    }
    this.currentUser = data.user;
    return data;
  }

  async logout(): Promise<void> {
    await this.setToken(null);
    this.currentUser = null;
    try {
      await fetch(`${BASE_URL}/auth/logout`, { method: 'POST' });
    } catch {}
  }

  async getClubs(): Promise<BackendClub[]> {
    if (this.clubsCache) return this.clubsCache;
    const res = await fetch(`${BASE_URL}/clubs?status=Active`);
    const clubs = await res.json() as BackendClub[];
    this.clubsCache = clubs;
    return clubs;
  }

  async getClubById(id: string): Promise<BackendClub | null> {
    const res = await fetch(`${BASE_URL}/clubs/${id}`);
    if (!res.ok) return null;
    return res.json();
  }

  async getEvents(): Promise<Event[]> {
    const [backendEvents, clubs] = await Promise.all([
      fetch(`${BASE_URL}/events?status=Published`).then(r => r.json()) as Promise<BackendEvent[]>,
      this.getClubs(),
    ]);

    const clubMap = new Map(clubs.map(c => [c.id, c.name]));

    return backendEvents.map(e => ({
      id: e.id,
      title: e.title,
      image: toEventImage(e.image),
      date: e.date,
      time: e.time,
      location: e.location,
      category: e.category,
      club: clubMap.get(e.clubId) || 'Unknown',
      clubId: e.clubId,
      description: e.description,
      price: e.price,
      attendees: e.attendees,
      maxCapacity: e.maxCapacity,
      rating: e.rating,
      reviews: e.reviews,
    }));
  }

  async getEventById(id: string): Promise<Event | null> {
    const res = await fetch(`${BASE_URL}/events/${id}`);
    if (!res.ok) return null;
    const e = await res.json() as BackendEvent;
    const clubs = await this.getClubs();
    const clubMap = new Map(clubs.map(c => [c.id, c.name]));
    return {
      id: e.id,
      title: e.title,
      image: toEventImage(e.image),
      date: e.date,
      time: e.time,
      location: e.location,
      category: e.category,
      club: clubMap.get(e.clubId) || 'Unknown',
      clubId: e.clubId,
      description: e.description,
      price: e.price,
      attendees: e.attendees,
      maxCapacity: e.maxCapacity,
      rating: e.rating,
      reviews: e.reviews,
    };
  }

  async getRecentEvents(after: string): Promise<BackendEvent[]> {
    const res = await fetch(`${BASE_URL}/events/recent?after=${encodeURIComponent(after)}`);
    if (!res.ok) return [];
    return res.json();
  }

  async getClubsForScreen(): Promise<Club[]> {
    const backendClubs = await this.getClubs();
    return backendClubs.map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
      description: c.description,
      shortDescription: c.shortDescription,
      image: toClubImage(c.image),
      members: c.members,
      meetingTime: c.meetingTime,
      meetingLocation: c.meetingLocation,
      leaders: c.leaders,
      status: c.status.toLowerCase() as 'active' | 'pending' | 'inactive',
    }));
  }

  async getClubForScreenById(id: string): Promise<Club | null> {
    const c = await this.getClubById(id);
    if (!c) return null;
    return {
      id: c.id,
      name: c.name,
      category: c.category,
      description: c.description,
      shortDescription: c.shortDescription,
      image: toClubImage(c.image),
      members: c.members,
      meetingTime: c.meetingTime,
      meetingLocation: c.meetingLocation,
      leaders: c.leaders,
      status: c.status.toLowerCase() as 'active' | 'pending' | 'inactive',
    };
  }

  async getTickets() {
    if (!this.authToken) return [];
    const res = await this.authFetch(`${BASE_URL}/tickets/me`);
    return res.json();
  }

  async getSavedEvents() {
    if (!this.authToken) return [];
    const res = await this.authFetch(`${BASE_URL}/saved/me`);
    return res.json();
  }

  async getUserClubs() {
    if (!this.authToken) return [];
    const res = await this.authFetch(`${BASE_URL}/user-clubs/me`);
    return res.json();
  }

  async saveEvent(eventId: string): Promise<void> {
    if (!this.authToken) return;
    await this.authFetch(`${BASE_URL}/saved`, {
      method: 'POST',
      body: JSON.stringify({ eventId }),
    });
  }

  async unsaveEvent(eventId: string): Promise<void> {
    if (!this.authToken || !this.currentUser) return;
    await this.authFetch(`${BASE_URL}/saved/${this.currentUser.id}/${eventId}`, {
      method: 'DELETE',
    });
  }

  async requestJoinClub(clubId: string): Promise<void> {
    if (!this.authToken) return;
    const res = await this.authFetch(`${BASE_URL}/user-clubs/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clubId }),
    });
    if (!res.ok) throw new Error('Failed to request join');
  }

  async leaveClub(clubId: string): Promise<void> {
    if (!this.authToken || !this.currentUser) return;
    await this.authFetch(`${BASE_URL}/user-clubs/${this.currentUser.id}/${clubId}`, {
      method: 'DELETE',
    });
  }

  async getClubMembership(clubId: string): Promise<{ role: string } | null> {
    if (!this.authToken || !this.currentUser) return null;
    const res = await this.authFetch(`${BASE_URL}/user-clubs/${this.currentUser.id}/${clubId}`);
    if (!res.ok) return null;
    return res.json();
  }

  async getReviews() {
    if (!this.authToken) return [];
    const res = await this.authFetch(`${BASE_URL}/reviews/me`);
    return res.json();
  }

  async addReview(itemId: string, itemType: 'event' | 'club', rating: number, comment: string) {
    if (!this.authToken) throw new Error('Not logged in');
    const res = await this.authFetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ itemId, itemType, rating, comment }),
    });
    return res.json();
  }

  async updateProfile(userId: string, updates: { name?: string; faculty?: string; year?: number; avatar?: string }) {
    const res = await this.authFetch(`${BASE_URL}/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    const data = await res.json();
    return data.user || data;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const res = await this.authFetch(`${BASE_URL}/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ password: newPassword }),
    });
    if (!res.ok) throw new Error('Failed to change password');
    return true;
  }

  async verifyClubAdmin(clubId: string, password: string) {
    const res = await fetch(`${BASE_URL}/clubs/${clubId}/verify-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    return res.ok;
  }

  async getClubMembers(clubId: string) {
    const res = await fetch(`${BASE_URL}/clubs/${clubId}/members`);
    return res.json();
  }

  async addClubMember(clubId: string, userId: string, role: string, presidentId: string) {
    const res = await this.authFetch(`${BASE_URL}/clubs/${clubId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });
    if (!res.ok) throw new Error('Failed to add member');
    return res.json();
  }

  async removeClubMember(clubId: string, userId: string) {
    const res = await this.authFetch(`${BASE_URL}/clubs/${clubId}/members/${userId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to remove member');
  }

  async searchUser(email: string) {
    const res = await fetch(`${BASE_URL}/users/search?email=${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    return res.json();
  }

  async getPendingMembers(clubId: string) {
    const res = await fetch(`${BASE_URL}/clubs/${clubId}/members/pending`);
    if (!res.ok) return [];
    return res.json();
  }

  async approveMember(clubId: string, userId: string) {
    const res = await this.authFetch(`${BASE_URL}/clubs/${clubId}/members/${userId}/approve`, {
      method: 'PUT',
    });
    if (!res.ok) throw new Error('Failed to approve member');
  }

  async rejectMember(clubId: string, userId: string) {
    const res = await this.authFetch(`${BASE_URL}/clubs/${clubId}/members/${userId}/reject`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to reject member');
  }

  async updateClub(clubId: string, updates: any) {
    const res = await this.authFetch(`${BASE_URL}/clubs/${clubId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update club');
    return res.json();
  }

  async purchaseTicket(eventId: string, seat: string, price: number) {
    if (!this.authToken) throw new Error('Not logged in');
    const res = await this.authFetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      body: JSON.stringify({ eventId, seat, status: 'Confirmed', price }),
    });
    const ticket = await res.json();
    const event = await fetch(`${BASE_URL}/events/${eventId}`).then(r => r.json());
    if (event) {
      await fetch(`${BASE_URL}/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendees: event.attendees + 1 }),
      });
    }
    return ticket;
  }
}

export const userApi = new UserApi();
export default userApi;
