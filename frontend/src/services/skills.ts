import { apiFetch } from './apiClient';

export interface Skill {
  id: string;
  name: string;
  description?: string;
}

/**
 * Get all available skills
 */
export const getAllSkills = async (): Promise<Skill[]> => {
  const data = await apiFetch<{ success: boolean; skills: Skill[] }>('/skills', {
    method: 'GET'
  });
  return data.skills;
};

/**
 * Get user's skills
 */
export const getUserSkills = async (): Promise<Skill[]> => {
  const data = await apiFetch<{ success: boolean; skills: Skill[] }>('/skills/me', {
    method: 'GET'
  });
  return data.skills;
};

/**
 * Add skill to user
 */
export const addUserSkill = async (skillName: string): Promise<Skill> => {
  const data = await apiFetch<{ success: boolean; skill: Skill }>('/skills/me', {
    method: 'POST',
    body: JSON.stringify({ skillName })
  });
  return data.skill;
};

/**
 * Remove skill from user
 */
export const removeUserSkill = async (skillId: string): Promise<void> => {
  await apiFetch(`/skills/me/${skillId}`, {
    method: 'DELETE'
  });
};
