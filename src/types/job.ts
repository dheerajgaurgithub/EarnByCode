export interface Salary {
  min: number;
  max: number;
  currency: string;
  period: 'year' | 'month' | 'hour';
}

export interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  description: string;
  requirements: string[];
  responsibilities: string[];
  salary?: Salary;
  status: 'open' | 'closed' | 'draft';
  createdAt: string;
  updatedAt: string;
  slug: string;
  experienceLevel?: 'Entry Level' | 'Mid Level' | 'Senior' | 'Lead';
  skills?: string[];
  benefits?: string[];
  applicationDeadline?: string;
  remote?: boolean;
  applicationLink?: string;
  views?: number;
  applications?: number;
  hiringManager?: string;
  team?: string;
  workHours?: string;
  travelRequired?: boolean;
  educationRequirements?: string[];
  certifications?: string[];
  languages?: Array<{
    language: string;
    proficiency: 'Basic' | 'Intermediate' | 'Fluent' | 'Native';
  }>;
  securityClearanceRequired?: boolean;
  relocationAssistance?: boolean;
  visaSponsorship?: boolean;
}
