export type Event = {
  id: string;
  title: string;
  image: { uri: string };
  date: string;
  time: string;
  location: string;
  category: string;
  club: string;
  clubId: string;
  description: string;
  price: number;
  attendees: number;
  maxCapacity: number;
  rating: number;
  reviews: number;
};

export const categories = ['All', 'Social', 'Cultural', 'Sports', 'Academic', 'Entertainment', 'Partnership'];

export type Club = {
  id: string;
  name: string;
  category: string;
  description: string;
  shortDescription: string;
  image: { uri: string };
  members: number;
  meetingTime: string;
  meetingLocation: string;
  leaders: { name: string; role: string; email: string }[];
  status: 'active' | 'pending' | 'inactive';
};
