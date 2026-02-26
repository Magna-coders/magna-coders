interface PaginationResult {
  startIndex: number;
  results: {
    previous: { page: number; limit: number } | null;
    next: { page: number; limit: number } | null;
  };
}

const paginateResults = (
  page: number,
  limit: number,
  totalCount: number
): PaginationResult => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const results: PaginationResult['results'] = {
    previous: null,
    next: null,
  };

  if (endIndex < totalCount) {
    results.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    results.previous = {
      page: page - 1,
      limit,
    };
  }

  return {
    startIndex,
    results,
  };
};

export default paginateResults;