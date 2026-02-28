import React from 'react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  isDarkMode: boolean;
}

export default function CategoryFilter({ categories, selectedCategory, onSelectCategory, isDarkMode }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-6 no-scrollbar">
      {categories.map(category => (
        <button
          key={category}
          onClick={() => onSelectCategory(category)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            selectedCategory === category
              ? 'bg-[#E50914] text-white shadow-md'
              : isDarkMode 
                ? 'bg-[#222] text-gray-300 border border-gray-700 hover:bg-[#333]' 
                : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
