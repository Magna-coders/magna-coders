export interface Course {
  id: string;
  title: string;
  instructor: string;
  role: string;
  rating: number;
  students: number;
  duration: string;
  price: number;
  bestseller?: boolean;
  certificate?: boolean;
}