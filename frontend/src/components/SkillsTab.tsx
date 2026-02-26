"use client";

import React from 'react';
import { 
  BadgeCheck, LayoutTemplate, Server, Layers, Smartphone, Gamepad2, ShieldCheck, Blocks, Bot, BarChart, Cpu, Settings, Database, 
  Code, Atom, Cloud, Box, Ship, GitBranch, RefreshCw, Network, Layout, User, ImageIcon, Video, Globe, PenTool, Search, 
  MousePointer, Type, Palette, Grid, Star, LineChart, Bug, Users, Table, PieChart, TrendingUp, Lightbulb, FileText, Calculator, 
  Split, ClipboardList, Megaphone, Handshake, DollarSign, Scale, Map, Crown, ShieldAlert, Target, Repeat, Smile, Wrench, 
  MessageSquare, Puzzle, Tag, Clock, BookOpen, Heart, Rocket, Zap, Ruler, Eye, Gavel, Flag, Brain, Mic, Filter, Mail, Anchor, 
  Flame, DoorOpen, Gift, Feather, Building, Briefcase, Sprout, Bird, Compass, Dumbbell, Award, Presentation, Ear, ClipboardCheck, 
  Hourglass, Share2, GraduationCap, Headphones, UserPlus, MessageCircle, Sun
} from 'lucide-react';
import { Skill } from '@/app/user-profile/data';

const ICON_MAP: Record<string, any> = {
  // Tech
  'Frontend': LayoutTemplate, 'Backend': Server, 'Full-stack': Layers, 'Mobile': Smartphone, 'Gaming': Gamepad2,
  'Cyber-security': ShieldCheck, 'Web 3': Blocks, 'Artificial/Machine Learning': Bot, 'Data Analyst': BarChart, 'Robotics': Cpu,
  'Frontend Developer': LayoutTemplate, 'Backend Developer': Server, 'Fullstack Developer': Layers, 'Mobile App Developer': Smartphone,
  'DevOps Engineer': Settings, 'Data Engineer': Database, 'AI/ML Engineer': Bot, 'Blockchain Developer': Blocks,
  'Game Developer': Gamepad2, 'Embedded Systems Developer': Cpu,
  'JavaScript': Code, 'TypeScript': Code, 'Python': Code, 'Java': Code, 'C++': Code, 'React': Atom, 'Node.js': Server,
  'AWS': Cloud, 'Docker': Box, 'Kubernetes': Ship, 'SQL': Database, 'NoSQL': Database, 'Git': GitBranch, 'CI/CD': RefreshCw, 'GraphQL': Network,

  // Design
  'UI Designer': Layout, 'UX Designer': User, 'Product Designer': Box, 'Graphic Designer': ImageIcon,
  'Motion Designer': Video, 'Web Designer': Globe, 'Branding/Identity Designer': PenTool,
  'Figma': PenTool, 'Adobe XD': PenTool, 'Photoshop': ImageIcon, 'Illustrator': PenTool, 'Sketch': PenTool, 'Prototyping': Layers,
  'User Research': Search, 'Wireframing': Layout, 'Interaction Design': MousePointer, 'Typography': Type,
  'Color Theory': Palette, 'Design Systems': Grid, 'HTML/CSS': Code, 'Animation': Video, 'Branding': Star, 'UI/UX Design': Layout,

  // Research/Analyst
  'Data Scientist': BarChart, 'Business Analyst': LineChart, 'Market Researcher': Search,
  'QA/Test Engineer': Bug, 'User Researcher': Users, 'Security Analyst': ShieldCheck,
  'Data Analysis': BarChart, 'R': Code, 'Excel': Table, 'Tableau': PieChart, 'Power BI': BarChart,
  'Statistical Modeling': TrendingUp, 'Market Research': Search, 'Machine Learning': Bot, 'Data Visualization': PieChart,
  'Business Intelligence': Lightbulb, 'Qualitative Research': FileText, 'Quantitative Research': Calculator, 'A/B Testing': Split,

  // Business/Strategy
  'Project Manager': ClipboardList, 'Product Manager': Box, 'Business Development': TrendingUp, 'Marketing Specialist': Megaphone,
  'Sales & Partnerships': Handshake, 'Finance & Operations': DollarSign, 'Legal/Compliance Advisor': Scale,
  'Strategic Planning': Map, 'Project Management': ClipboardList, 'Financial Analysis': DollarSign, 'Market Analysis': LineChart,
  'Leadership': Crown, 'Negotiation': Handshake, 'Risk Management': ShieldAlert, 'Sales Strategy': Target,
  'Marketing Strategy': Megaphone, 'Operations Management': Settings, 'Change Management': RefreshCw, 'Stakeholder Management': Users, 'Agile Methodologies': Repeat,

  // Support
  'Community Manager': Users, 'Technical Writer': FileText, 'Content Creator': Video, 'Mentor/Coach': GraduationCap,
  'Customer Support': Headphones, 'Recruiter/Talent Scout': UserPlus, 'Educator/Trainer': BookOpen,
  'Customer Service': Smile, 'Technical Support': Wrench, 'Communication': MessageSquare, 'Problem Solving': Puzzle,
  'CRM Tools': Database, 'Ticket Management': Tag, 'Documentation': FileText, 'Empathy': Heart,
  'Conflict Resolution': Handshake, 'Time Management': Clock, 'Troubleshooting': Wrench, 'Team Collaboration': Users,
  'Training': BookOpen, 'Feedback Analysis': MessageCircle, 'Community Management': Users,

  // Visionary
  'Product Innovator': Lightbulb, 'Tech Futurist': Rocket, 'Social Entrepreneur': Heart, 'Startup Founder': Rocket,
  'Strategic Planner': Map, 'Change Maker': Zap, 'Creative Director': Palette, 'Industry Disruptor': Zap,
  'Concept Architect': Ruler, 'Impact Leader': Globe,
  'Innovation': Lightbulb, 'Strategic Thinking': Brain, 'Public Speaking': Mic, 'Networking': Network,
  'Storytelling': BookOpen, 'Trend Analysis': TrendingUp, 'Creative Problem Solving': Puzzle, 'Concept Development': Lightbulb,
  'Vision Planning': Eye, 'Team Building': Users, 'Fundraising': DollarSign, 'Risk Assessment': ShieldAlert, 'Decision Making': Gavel, 'Change Leadership': Flag,

  // Growth Strategist
  'Growth Hacker': Rocket, 'Digital Marketer': Globe, 'SEO Specialist': Search, 'Conversion Rate Optimizer': TrendingUp,
  'User Acquisition Manager': UserPlus, 'Retention Specialist': Anchor, 'Brand Strategist': Star, 'Go-to-Market Lead': Rocket,
  'Sales Funnel Architect': Filter, 'Revenue Operations': DollarSign,
  'SEO': Search, 'SEM': Search, 'Content Marketing': FileText, 'Social Media Marketing': Share2, 'Email Marketing': Mail,
  'Analytics': BarChart, 'Conversion Rate Optimization': TrendingUp, 'Customer Acquisition': UserPlus,
  'Retention Strategies': Anchor, 'Viral Marketing': Flame, 'PPC Advertising': DollarSign, 'Copywriting': PenTool,
  'Funnel Optimization': Filter, 'Market Trends': TrendingUp,

  // Talent Seeker
  'Technical Recruiter': UserPlus, 'HR Manager': Users, 'Talent Acquisition Specialist': Search, 'Headhunter': Target,
  'People Operations': Users, 'Team Builder': Blocks, 'Culture Specialist': Heart, 'Hiring Manager': Briefcase,
  'Staffing Coordinator': ClipboardList, 'Employer Branding Specialist': Star,
  'Recruitment': UserPlus, 'Sourcing': Search, 'Interviewing': MessageSquare, 'HR Policies': FileText, 'Employee Relations': Handshake,
  'Talent Management': Users, 'Onboarding': DoorOpen, 'Performance Management': TrendingUp, 'Compensation & Benefits': Gift,
  'Employer Branding': Star, 'Candidate Experience': Smile, 'Diversity & Inclusion': Globe, 'Labor Laws': Scale,

  // Seed Investor
  'Angel Investor': Feather, 'Venture Capitalist': Building, 'Private Equity Investor': Briefcase, 'Early-Stage Backer': Sprout,
  'Impact Investor': Heart, 'Tech Investor': Cpu, 'Crowdfunding Backer': Users, 'Incubator Partner': Bird,
  'Accelerator Mentor': Rocket, 'Portfolio Manager': PieChart,
  'Due Diligence': Search, 'Financial Modeling': Calculator, 'Valuation': DollarSign, 'Deal Structuring': Handshake,
  'Investment Strategy': Target, 'Trend Forecasting': TrendingUp, 'Legal Knowledge': Scale, 'Mentorship': GraduationCap,
  'Exit Strategies': DoorOpen,

  // Mentor
  'Career Coach': Compass, 'Technical Mentor': Code, 'Leadership Coach': Crown, 'Startup Advisor': Rocket,
  'Life Coach': Sun, 'Executive Mentor': Briefcase, 'Peer Mentor': Users, 'Skills Trainer': Dumbbell,
  'Industry Veteran': Award, 'Workshop Facilitator': Presentation,
  'Coaching': Share2, 'Active Listening': Ear, 'Feedback': MessageSquare, 'Goal Setting': Target, 'Motivation': Zap,
  'Career Guidance': Compass, 'Leadership Development': Crown, 'Skill Assessment': ClipboardCheck,
  'Emotional Intelligence': Heart, 'Patience': Hourglass, 'Knowledge Sharing': Share2,
};

interface SkillsTabProps {
  skills: Skill[];
  isDarkMode: boolean;
}

export default function SkillsTab({ skills, isDarkMode }: SkillsTabProps) {
  return (
    <div className={`rounded-2xl p-4 md:p-6 border shadow-sm ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
      <h3 className={`font-bold text-lg mb-6 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Skills & Expertise</h3>
      <div className="grid grid-cols-4 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
        {skills.map((skill, index) => {
          const Icon = ICON_MAP[skill.name] || BadgeCheck;
          return (
            <div key={index} className={`flex flex-col md:flex-row items-center md:items-center p-2 md:p-4 rounded-xl border hover:border-[#F4A261]/30 transition-all ${isDarkMode ? 'bg-[#222] border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shadow-sm text-[#E50914] mb-2 md:mb-0 md:mr-3 flex-shrink-0 ${isDarkMode ? 'bg-[#333]' : 'bg-white'}`}>
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="text-center md:text-left min-w-0 w-full">
                <h4 className={`font-bold text-[10px] md:text-sm truncate leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>{skill.name}</h4>
                <p className="text-xs text-gray-500 truncate hidden md:block">{skill.level}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
