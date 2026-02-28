
'use client';
import React, { useEffect, useState } from 'react';
import FilterPill from './FilterPill';

// Types
export interface Tag {
  id: string;
  name: string;
  count?: number;
}

interface FeedFiltersProps {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  isDarkMode: boolean;
}

export default function FeedFilters({ activeFilter, setActiveFilter, isDarkMode }: FeedFiltersProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const filters = ['All', 'Projects', 'Opportunities', 'Posts', 'Tech News'];

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/tags`);
        if (!res.ok) throw new Error('Failed to fetch tags');
        const data = await res.json();
        setTags(data);
      } catch (error) {
        console.error('Failed to fetch tags:', error);
        setTags([]);
      }
    };
    
    fetchTags();
  }, []);

  return (
    <div className="flex gap-3 mb-2 overflow-x-auto pb-2 scrollbar-hide">
      {filters.map(filter => (
        <FilterPill 
          key={filter}
          label={filter} 
          active={activeFilter === filter} 
          onClick={() => setActiveFilter(filter)} 
          isDarkMode={isDarkMode} 
        />
      ))}
      {tags.map(tag => (
        <FilterPill
          key={tag.id}
          label={tag.name}
          active={activeFilter === tag.name}
          onClick={() => setActiveFilter(tag.name)}
          isDarkMode={isDarkMode}
        />
      ))}
    </div>
  );
}
