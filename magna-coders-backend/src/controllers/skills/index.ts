import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * Get all available skills
 */
export const getAllSkills = async (req: Request, res: Response): Promise<void> => {
  try {
    const skills = await prisma.skills.findMany({
      orderBy: { name: 'asc' }
    });

    res.status(200).json({ success: true, skills });
  } catch (error: any) {
    console.error('Get all skills error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch skills' });
  }
};

/**
 * Get user's skills
 */
export const getUserSkills = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user as string;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const userSkills = await prisma.user_skills.findMany({
      where: { user_id: userId },
      include: {
        skills: true
      }
    });

    res.status(200).json({ 
      success: true, 
      skills: userSkills.map(us => us.skills)
    });
  } catch (error: any) {
    console.error('Get user skills error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user skills' });
  }
};

/**
 * Add skill to user
 */
export const addUserSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user as string;
    const { skillName } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!skillName) {
      res.status(400).json({ success: false, message: 'Skill name is required' });
      return;
    }

    // Find or create skill
    let skill = await prisma.skills.findUnique({
      where: { name: skillName }
    });

    if (!skill) {
      skill = await prisma.skills.create({
        data: {
          id: uuidv4(),
          name: skillName
        }
      });
    }

    // Check if user already has this skill
    const existing = await prisma.user_skills.findFirst({
      where: {
        user_id: userId,
        skill_id: skill.id
      }
    });

    if (existing) {
      res.status(400).json({ success: false, message: 'Skill already added' });
      return;
    }

    // Add skill to user
    await prisma.user_skills.create({
      data: {
        id: uuidv4(),
        user_id: userId,
        skill_id: skill.id
      }
    });

    res.status(201).json({ success: true, skill });
  } catch (error: any) {
    console.error('Add user skill error:', error);
    res.status(500).json({ success: false, message: 'Failed to add skill' });
  }
};

/**
 * Remove skill from user
 */
export const removeUserSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user as string;
    const { skillId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const userSkill = await prisma.user_skills.findFirst({
      where: {
        user_id: userId,
        skill_id: skillId
      }
    });

    if (!userSkill) {
      res.status(404).json({ success: false, message: 'Skill not found' });
      return;
    }

    await prisma.user_skills.delete({
      where: { id: userSkill.id }
    });

    res.status(200).json({ success: true, message: 'Skill removed' });
  } catch (error: any) {
    console.error('Remove user skill error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove skill' });
  }
};
