import { apiFetch } from './apiClient';

// Apply to a job
export const applyToJob = async (opportunityId: string, data: {
  resumeUrl?: string;
  coverLetter?: string;
  metadata?: any;
}) => {
  return await apiFetch(`/applications/${opportunityId}/apply`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Get user's applications
export const getUserApplications = async () => {
  return await apiFetch('/applications/me', { method: 'GET' });
};

// Bookmark/save a job (toggle)
export const bookmarkJob = async (opportunityId: string) => {
  return await apiFetch(`/bookmarks/${opportunityId}/bookmark`, {
    method: 'POST'
  });
};

// Remove bookmark (use toggle instead)
export const removeBookmark = async (opportunityId: string) => {
  return await apiFetch(`/bookmarks/${opportunityId}/bookmark`, {
    method: 'POST'
  });
};

// Get bookmark state
export const getBookmarkState = async (opportunityId: string) => {
  return await apiFetch(`/bookmarks/${opportunityId}/bookmark`, {
    method: 'GET'
  });
};

// Get user's bookmarked jobs
export const getUserBookmarkedJobs = async () => {
  return await apiFetch('/bookmarks/me', {
    method: 'GET'
  });
};

// Get recommended jobs
export const getRecommendedJobs = async (limit: number = 10) => {
  return await apiFetch(`/opportunities/recommended?limit=${limit}`, {
    method: 'GET'
  });
};

// Get applications for a job (for job poster)
export const getJobApplications = async (opportunityId: string) => {
  return await apiFetch(`/applications/${opportunityId}/applications`, {
    method: 'GET'
  });
};

// Update application status (for job poster)
export const updateApplicationStatus = async (applicationId: string, status: string) => {
  return await apiFetch(`/applications/${applicationId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
};
