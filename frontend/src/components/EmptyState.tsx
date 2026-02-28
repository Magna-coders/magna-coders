import React from 'react';
import { Search } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="text-center py-20 text-gray-400">
      <Search size={48} className="mx-auto mb-4 opacity-20" />
      <p>No courses found matching your criteria</p>
    </div>
  );
}
