export interface User {
  id: string;
  name: string;
  email: string;
  studentId: string;
  password: string;
  faculty: string;
  year: number;
  avatar: string;
  joinedAt: string;
  isActive: boolean;
  role: 'student' | 'admin';
}

export interface Event {
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
  status: 'Published' | 'Draft' | 'Cancelled';
  createdAt: string;
  createdBy: string;
}

export interface Club {
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
  status: 'Active' | 'Pending' | 'Inactive';
  rating: number;
  reviews: number;
  established: string;
}

export interface Ticket {
  id: string;
  userId: string;
  eventId: string;
  seat: string;
  status: 'Confirmed' | 'Used' | 'Cancelled';
  price: number;
  purchasedAt: string;
}

export interface SavedEvent {
  id: string;
  userId: string;
  eventId: string;
  savedAt: string;
}

export interface UserClub {
  id: string;
  userId: string;
  clubId: string;
  role: string;
  joinedAt: string;
}

export interface UserReview {
  id: string;
  userId: string;
  itemId: string;
  itemType: 'event' | 'club';
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Image {
  id: string;
  entityType: 'event' | 'club';
  entityId: string;
  imageData: string;
  createdAt: string;
}