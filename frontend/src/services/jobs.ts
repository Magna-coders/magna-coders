import { apiFetch } from './apiClient';

export interface Job {
  id: string;
  userId: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE' | 'INTERNSHIP';
  description: string;
  requirements?: string[];
  skills?: string[];
  benefits?: string[];
  applicationUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    fullName: string;
    profilePicture?: string;
  };
}

export interface CreateJobData {
  title: string;
  company: string;
  location: string;
  salary?: string;
  jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE' | 'INTERNSHIP';
  description: string;
  requirements?: string[];
  skills?: string[];
  benefits?: string[];
  applicationUrl?: string;
}

export interface GetJobsParams {
  limit?: number;
  offset?: number;
  search?: string;
  jobType?: string;
  location?: string;
}

/**
 * Fetch jobs from the backend
 */
export const getJobs = async (params: GetJobsParams = {}): Promise<Job[]> => {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.offset) searchParams.set('offset', String(params.offset));
  if (params.search) searchParams.set('search', params.search);
  if (params.jobType) searchParams.set('jobType', params.jobType);
  if (params.location) searchParams.set('location', params.location);

  const query = searchParams.toString();
  const data = await apiFetch<any>(`/jobs${query ? `?${query}` : ''}`, { method: 'GET' });

  if (Array.isArray(data)) {
    return data;
  }
  if (data?.jobs && Array.isArray(data.jobs)) {
    return data.jobs;
  }
  if (data?.data && Array.isArray(data.data)) {
    return data.data;
  }
  return [];
};

/**
 * Fetch a single job by ID
 */
export const getJobById = async (id: string): Promise<Job | null> => {
  try {
    const data = await apiFetch<any>(`/jobs/${id}`, { method: 'GET' });
    return data?.job || data || null;
  } catch (error) {
    console.error('Error fetching job:', error);
    return null;
  }
};

/**
 * Create a new job posting
 */
export const createJob = async (jobData: CreateJobData): Promise<Job> => {
  const data = await apiFetch<any>('/jobs', {
    method: 'POST',
    data: jobData,
  });
  return data?.job || data;
};

/**
 * Update a job posting
 */
export const updateJob = async (id: string, jobData: Partial<CreateJobData>): Promise<Job> => {
  const data = await apiFetch<any>(`/jobs/${id}`, {
    method: 'PUT',
    data: jobData,
  });
  return data?.job || data;
};

/**
 * Delete a job posting
 */
export const deleteJob = async (id: string): Promise<void> => {
  await apiFetch(`/jobs/${id}`, { method: 'DELETE' });
};
