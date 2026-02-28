"use client";

import React, { useState, useEffect } from 'react';
import { getUserSkills, addUserSkill, removeUserSkill, Skill } from '@/services/skills';
import { Plus, X, Code } from 'lucide-react';

interface SkillsTabProps {
  isDarkMode: boolean;
  isOwnProfile: boolean;
}

export default function SkillsTab({ isDarkMode, isOwnProfile }: SkillsTabProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const data = await getUserSkills();
      setSkills(data);
    } catch (error) {
      console.error('Failed to fetch skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkillName.trim()) {
      setError('Please enter a skill name');
      return;
    }

    setAdding(true);
    setError('');
    try {
      const skill = await addUserSkill(newSkillName.trim());
      setSkills([...skills, skill]);
      setNewSkillName('');
    } catch (error: any) {
      setError(error.message || 'Failed to add skill');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    try {
      await removeUserSkill(skillId);
      setSkills(skills.filter(s => s.id !== skillId));
    } catch (error) {
      console.error('Failed to remove skill:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E70008]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Skill Section (only for own profile) */}
      {isOwnProfile && (
        <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-[#444444]'}`}>
            Add New Skill
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
              placeholder="e.g., React, Python, Node.js"
              className={`flex-1 px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-[#0a0a0a] border-[#2a2a2a] text-[#F9E4AD] placeholder-[#F9E4AD]/50'
                  : 'bg-white border-gray-300 text-[#444444] placeholder-gray-400'
              } focus:outline-none focus:border-[#E70008]`}
            />
            <button
              onClick={handleAddSkill}
              disabled={adding}
              className="px-6 py-2 bg-[#E70008] hover:bg-[#c50007] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {adding ? 'Adding...' : 'Add'}
            </button>
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>
      )}

      {/* Skills List */}
      <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-[#444444]'}`}>
          <Code className="w-5 h-5" />
          Skills ({skills.length})
        </h3>
        
        {skills.length === 0 ? (
          <div className="text-center py-8">
            <Code className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-[#F9E4AD]/30' : 'text-gray-300'}`} />
            <p className={`${isDarkMode ? 'text-[#F9E4AD]/70' : 'text-gray-600'}`}>
              {isOwnProfile ? 'No skills added yet. Add your first skill above!' : 'No skills added yet'}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  isDarkMode
                    ? 'bg-[#2a2a2a] text-[#F9E4AD]'
                    : 'bg-gray-100 text-[#444444]'
                }`}
              >
                <span>{skill.name}</span>
                {isOwnProfile && (
                  <button
                    onClick={() => handleRemoveSkill(skill.id)}
                    className={`hover:text-[#E70008] transition-colors ${
                      isDarkMode ? 'text-[#F9E4AD]/50' : 'text-gray-400'
                    }`}
                    title="Remove skill"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
