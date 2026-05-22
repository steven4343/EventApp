import { Event, Club } from './types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://eventapp-production-9af6.up.railway.app/api';

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
  return { uri: url || 'https://picsum.photos/seed/event/400' };
}

function toClubImage(url: string): { uri: string } {
  return { uri: url || 'https://picsum.photos/seed/club/400' };
}

class UserApi {
  private currentUser: any = null;
  private clubsCache: BackendClub[] | null = null;

  getCurrentUser() {
    return this.currentUser;
  }

  setCurrentUser(user: any) {
    this.currentUser = user;
  }

  async login(email: string, password: string) {
    const res = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return null;
    const result = await res.json();
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
    return result.user || result;
  }

  async logout(): Promise<void> {
    this.currentUser = null;
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
    if (!this.currentUser) return [];
    const res = await fetch(`${BASE_URL}/tickets/${this.currentUser.id}`);
    return res.json();
  }

  async getSavedEvents() {
    if (!this.currentUser) return [];
    const res = await fetch(`${BASE_URL}/saved/${this.currentUser.id}`);
    return res.json();
  }

  async getUserClubs() {
    if (!this.currentUser) return [];
    const res = await fetch(`${BASE_URL}/user-clubs/${this.currentUser.id}`);
    return res.json();
  }

  async saveEvent(eventId: string): Promise<void> {
    if (!this.currentUser) return;
    await fetch(`${BASE_URL}/saved`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: this.currentUser.id, eventId }),
    });
  }

  async unsaveEvent(eventId: string): Promise<void> {
    if (!this.currentUser) return;
    await fetch(`${BASE_URL}/saved/${this.currentUser.id}/${eventId}`, {
      method: 'DELETE',
    });
  }

  async joinClub(clubId: string): Promise<void> {
    if (!this.currentUser) return;
    await fetch(`${BASE_URL}/user-clubs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: this.currentUser.id, clubId, role: 'Member' }),
    });
    const club = await this.getClubById(clubId);
    if (club) {
      await fetch(`${BASE_URL}/clubs/${clubId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: club.members + 1 }),
      });
    }
  }

  async leaveClub(clubId: string): Promise<void> {
    if (!this.currentUser) return;
    await fetch(`${BASE_URL}/user-clubs/${this.currentUser.id}/${clubId}`, {
      method: 'DELETE',
    });
    const club = await this.getClubById(clubId);
    if (club) {
      await fetch(`${BASE_URL}/clubs/${clubId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: Math.max(0, club.members - 1) }),
      });
    }
  }

  async purchaseTicket(eventId: string, seat: string, price: number) {
    if (!this.currentUser) throw new Error('Not logged in');
    const res = await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: this.currentUser.id, eventId, seat, status: 'Confirmed', price }),
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
