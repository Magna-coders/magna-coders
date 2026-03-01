
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/tags`);
        if (!res.ok) throw new Error('Failed to fetch tags');
        const data = await res.json();
        
        // Handle different response formats
        if (Array.isArray(data)) {
          setTags(data);
        } else if (data?.tags && Array.isArray(data.tags)) {
          setTags(data.tags);
        } else if (data?.data && Array.isArray(data.data)) {
          setTags(data.data);
        } else {
          console.warn('Unexpected tags data format:', data);
          setTags([]);
        }
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
      {tags.map(tag => {
        // Ensure tag has valid properties
        if (!tag || typeof tag !== 'object') return null;
        const tagId = tag.id || String(tag);
        const tagName = tag.name || String(tag);
        
        return (
          <FilterPill
            key={tagId}
            label={tagName}
            active={activeFilter === tagName}
            onClick={() => setActiveFilter(tagName)}
            isDarkMode={isDarkMode}
          />
        );
      })}
    </div>
  );
}
