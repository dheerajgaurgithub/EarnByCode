export interface Contest {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
  status?: 'upcoming' | 'ongoing' | 'completed';
  rules?: string[];
  isRegistered?: boolean;
  participants?: string[];
}

export interface ContestResponse {
  contest?: Contest;
  _id?: string;
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  status?: 'upcoming' | 'ongoing' | 'completed';
  rules?: string[];
}
