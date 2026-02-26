import { apiFetch } from './apiClient';

type ListOpportunitiesParams = {
  limit?: number;
  offset?: number;
  search?: string;
  category?: string;
};

type ListOpportunitiesResponse = {
  items: any[];
  total?: number;
};

export const listOpportunities = async (
  params: ListOpportunitiesParams = {}
): Promise<ListOpportunitiesResponse> => {
  const searchParams = new URLSearchParams();
  if (typeof params.limit === 'number') searchParams.set('limit', String(params.limit));
  if (typeof params.offset === 'number') searchParams.set('offset', String(params.offset));
  if (params.search) searchParams.set('search', params.search);
  if (params.category) searchParams.set('category', params.category);

  const query = searchParams.toString();
  const data = await apiFetch<any>(`/jobs${query ? `?${query}` : ''}`, { method: 'GET' });

  if (Array.isArray(data)) {
    return { items: data };
  }

  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.data)
      ? data.data
      : [];

  return { items, total: data?.total ?? data?.count };
};
