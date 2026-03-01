export interface CourseDetail {
  title: string;
  description: string;
  category: string;
  level: string;
  rating: number;
  students: number;
  lastUpdated: string;
  price: number;
  features: string[];
  instructor: {
    name: string;
    avatar: string;
    rating: number;
    students: number;
    courses: number;
    bio: string;
    role: string;
  };
}

export interface CurriculumSection {
  title: string;
  videos: number;
  duration: string;
  lessons: Lesson[];
}

export interface Lesson {
  type: 'video' | 'text';
  title: string;
  duration?: string;
}

export interface Instructor {
  name: string;
  avatar: string;
  role: string;
  rating: number;
  students: number;
  courses: number;
  bio: string;
}