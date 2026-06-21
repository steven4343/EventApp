import { Event, Club } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.API_URL || process.env.EXPO_PUBLIC_API_URL || 'https://eventapp-production-9af6.up.railway.app/api';
const TOKEN_KEY = 'cuz_events_user_token';

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
  private token: string | null = null;
  private clubsCache: BackendClub[] | null = null;

  private authHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    return headers;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  setCurrentUser(user: any) {
    this.currentUser = user;
  }

  getToken() {
    return this.token;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  async loadToken(): Promise<void> {
    try {
      this.token = await AsyncStorage.getItem(TOKEN_KEY);
    } catch {}
  }

  async login(email: string, password: string) {
    const res = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return null;
    const result = await res.json();
    this.token = result.token;
    if (this.token) await AsyncStorage.setItem(TOKEN_KEY, this.token);
    const user = result.user || result;
    this.currentUser = user;
    return user;
  }

  async register(userData: { name: string; email: string; password: string; studentId?: string; faculty?: string; year?: number }) {
    const res = await fetch(`${BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!res.ok) return null;
    const result = await res.json();
    this.token = result.token;
    if (this.token) await AsyncStorage.setItem(TOKEN_KEY, this.token);
    return result.user || result;
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    this.token = null;
    await AsyncStorage.removeItem(TOKEN_KEY);
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

  async getRecentEvents(after: string): Promise<Event[]> {
    try {
      const res = await fetch(`${BASE_URL}/events/recent?after=${encodeURIComponent(after)}`);
      if (!res.ok) return [];
      const backendEvents: BackendEvent[] = await res.json();
      const clubs = await this.getClubs();
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
    } catch {
      return [];
    }
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
      status: (c.status || 'active').toLowerCase() as 'active' | 'pending' | 'inactive',
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
      status: (c.status || 'active').toLowerCase() as 'active' | 'pending' | 'inactive',
    };
  }

  async getTickets() {
    if (!this.currentUser) return [];
    const res = await fetch(`${BASE_URL}/tickets/${this.currentUser.id}`, { headers: this.authHeaders() });
    return res.json();
  }

  async getSavedEvents() {
    if (!this.currentUser) return [];
    const res = await fetch(`${BASE_URL}/saved/${this.currentUser.id}`, { headers: this.authHeaders() });
    return res.json();
  }

  async getUserClubs() {
    if (!this.currentUser) return [];
    const res = await fetch(`${BASE_URL}/user-clubs/${this.currentUser.id}`, { headers: this.authHeaders() });
    return res.json();
  }

  async saveEvent(eventId: string): Promise<void> {
    if (!this.currentUser) return;
    await fetch(`${BASE_URL}/saved`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify({ userId: this.currentUser.id, eventId }),
    });
  }

  async unsaveEvent(eventId: string): Promise<void> {
    if (!this.currentUser) return;
    await fetch(`${BASE_URL}/saved/${this.currentUser.id}/${eventId}`, {
      method: 'DELETE',
      headers: this.authHeaders(),
    });
  }

  async requestJoinClub(clubId: string): Promise<void> {
    if (!this.currentUser) return;
    const res = await fetch(`${BASE_URL}/user-clubs/request`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify({ userId: this.currentUser.id, clubId }),
    });
    if (!res.ok) throw new Error('Failed to request join');
  }

  async leaveClub(clubId: string): Promise<void> {
    if (!this.currentUser) return;
    await fetch(`${BASE_URL}/user-clubs/${this.currentUser.id}/${clubId}`, {
      method: 'DELETE',
      headers: this.authHeaders(),
    });
  }

  async getClubMembership(clubId: string): Promise<{ role: string } | null> {
    if (!this.currentUser) return null;
    const res = await fetch(`${BASE_URL}/user-clubs/${this.currentUser.id}/${clubId}`, { headers: this.authHeaders() });
    if (!res.ok) return null;
    return res.json();
  }

  async getReviews() {
    if (!this.currentUser) return [];
    const res = await fetch(`${BASE_URL}/reviews/${this.currentUser.id}`, { headers: this.authHeaders() });
    return res.json();
  }

  async addReview(itemId: string, itemType: 'event' | 'club', rating: number, comment: string) {
    if (!this.currentUser) throw new Error('Not logged in');
    const res = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify({ userId: this.currentUser.id, itemId, itemType, rating, comment }),
    });
    return res.json();
  }

  async getEventReviews(eventId: string) {
    const res = await fetch(`${BASE_URL}/events/${eventId}/reviews`);
    return res.json();
  }

  async updateProfile(userId: string, updates: { name?: string; faculty?: string; year?: number; avatar?: string }) {
    const res = await fetch(`${BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: this.authHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    const data = await res.json();
    return data.user || data;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const res = await fetch(`${BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`${BASE_URL}/clubs/${clubId}/members`, { headers: this.authHeaders() });
    return res.json();
  }

  async addClubMember(clubId: string, userId: string, role: string, presidentId: string) {
    const res = await fetch(`${BASE_URL}/clubs/${clubId}/members?presidentId=${presidentId}`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify({ userId, role }),
    });
    if (!res.ok) throw new Error('Failed to add member');
    return res.json();
  }

  async removeClubMember(clubId: string, userId: string, presidentId: string) {
    const res = await fetch(`${BASE_URL}/clubs/${clubId}/members/${userId}?presidentId=${presidentId}`, {
      method: 'DELETE',
      headers: this.authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to remove member');
  }

  async searchUser(email: string) {
    const res = await fetch(`${BASE_URL}/users/search?email=${encodeURIComponent(email)}`, { headers: this.authHeaders() });
    if (!res.ok) return null;
    return res.json();
  }

  async getPendingMembers(clubId: string) {
    const res = await fetch(`${BASE_URL}/clubs/${clubId}/members/pending`, { headers: this.authHeaders() });
    if (!res.ok) return [];
    return res.json();
  }

  async approveMember(clubId: string, userId: string) {
    const res = await fetch(`${BASE_URL}/clubs/${clubId}/members/${userId}/approve`, {
      method: 'PUT',
      headers: this.authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to approve member');
  }

  async rejectMember(clubId: string, userId: string) {
    const res = await fetch(`${BASE_URL}/clubs/${clubId}/members/${userId}/reject`, {
      method: 'DELETE',
      headers: this.authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to reject member');
  }

  async updateClub(clubId: string, updates: any, presidentId: string) {
    const res = await fetch(`${BASE_URL}/clubs/${clubId}?presidentId=${presidentId}`, {
      method: 'PUT',
      headers: this.authHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update club');
    return res.json();
  }

  async registerPushToken(token: string): Promise<void> {
    if (!this.currentUser) return;
    try {
      await fetch(`${BASE_URL}/push-tokens/register`, {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify({ token, userId: this.currentUser.id }),
      });
    } catch { /* silent */ }
  }

  async purchaseTicket(eventId: string, seat: string, price: number) {
    if (!this.currentUser) throw new Error('Not logged in');
    const res = await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify({ userId: this.currentUser.id, eventId, seat, status: 'Confirmed', price }),
    });
    const ticket = await res.json();
    const event = await fetch(`${BASE_URL}/events/${eventId}`, { headers: this.authHeaders() }).then(r => r.json());
    if (event) {
      await fetch(`${BASE_URL}/events/${eventId}`, {
        method: 'PUT',
        headers: this.authHeaders(),
        body: JSON.stringify({ attendees: event.attendees + 1 }),
      });
    }
    return ticket;
  }
}

export const userApi = new UserApi();
export default userApi;
