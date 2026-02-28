import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface ProjectListHeaderProps {
  title: string;
  description: string;
  createLink: string;
  createLabel: string;
}

export default function ProjectListHeader({ title, description, createLink, createLabel }: ProjectListHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">{title}</h1>
        <p className="text-gray-500">{description}</p>
      </div>
      <Link href={createLink} className="flex items-center justify-center gap-2 px-6 py-3 bg-[#E50914] text-white rounded-xl font-bold shadow-md hover:bg-[#cc0812] transition-all active:scale-95">
        <Plus size={20} />
        <span>{createLabel}</span>
      </Link>
    </div>
  );
}
