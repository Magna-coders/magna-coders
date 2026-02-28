"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronRight, ChevronLeft, Check, User, MapPin, Briefcase, Award, Target, Sun, Moon, Lightbulb, Code, Palette, TrendingUp, Sprout, GraduationCap, UserPlus, LineChart, Headphones, Users, Handshake, Globe, DollarSign, LayoutTemplate, Server, Layers, Smartphone, Gamepad2, ShieldCheck, Blocks, Bot, BarChart, Cpu, Settings, Database, Layout, Box, Image as ImageIcon, Video, PenTool, Search, MousePointer, Type, Grid, Star, Bug, Table, PieChart, Calculator, Split, ClipboardList, Scale, Map, Crown, ShieldAlert, Repeat, Smile, Wrench, MessageSquare, Puzzle, Tag, Clock, MessageCircle, Rocket, Ruler, Eye, Gavel, Flag, Brain, Mic, Network, Filter, Flame, DoorOpen, Gift, Building, Bird, Compass, Dumbbell, Presentation, Ear, ClipboardCheck, Hourglass, Atom, Ship, RefreshCw, Feather, Anchor, Share2, Cloud, GitBranch, FileText, Megaphone, BookOpen, Heart, Zap, Mail } from 'lucide-react';
import TopNavigation from '@/components/TopNavigation';
import BottomNavigation from '@/components/BottomNavigation';
import LeftPanel from '@/components/LeftPanel';

// --- Constants ---

const ROLES = [
  { id: 'visionary', label: 'Visionary', description: 'Turning ideas into reality', icon: Lightbulb },
  { id: 'developer', label: 'Developer', description: 'Bringing ideas to life through code', icon: Code },
  { id: 'designer', label: 'Designer', description: 'Designing seamless and engaging user interfaces', icon: Palette },
  { id: 'growth_strategist', label: 'Growth Strategist', description: 'Expanding reach and accelerating product growth', icon: TrendingUp },
  { id: 'seed_investor', label: 'Seed Investor', description: 'Empowering the next generation of startups', icon: Sprout },
  { id: 'mentor', label: 'Mentor', description: 'Guiding founders and teams towards success', icon: GraduationCap },
  { id: 'talent_seeker', label: 'Talent Seeker', description: 'Building teams and hiring top talent', icon: UserPlus },
  { id: 'research_analyst', label: 'Research/Analyst', description: 'Analyzing data and trends to drive informed decisions', icon: LineChart },
  { id: 'business_strategy', label: 'Business/Strategy', description: 'Leading projects and driving business growth', icon: Briefcase },
  { id: 'support', label: 'Support', description: 'Helping users and building strong communities', icon: Headphones },
];

const GOALS = [
  { id: 'team_member', label: 'Team Member', description: 'Collaborate and grow with a team', icon: Users },
  { id: 'accountability_partner', label: 'Accountability Partner', description: 'Stay on track and motivated together', icon: Handshake },
  { id: 'mentor_goal', label: 'Mentor', description: 'Receive expert guidance and mentorship', icon: GraduationCap },
  { id: 'networking', label: 'Networking & Opportunities', description: 'Connect and offer your skills and services', icon: Globe },
  { id: 'investment', label: 'Investment Prospect', description: 'Discover promising startups to invest in', icon: DollarSign },
  { id: 'technical_cofounder', label: 'Technical Co-founder', description: 'Partner to build and scale the product', icon: Code },
  { id: 'design_assistance', label: 'Design Assistance', description: 'UI/UX and product design', icon: Palette },
];

const ROLE_SUB_CATEGORIES = {
    "Developer": [
      "Frontend Developer", "Backend Developer", "Fullstack Developer", "Mobile App Developer",
      "DevOps Engineer", "Data Engineer", "AI/ML Engineer", "Blockchain Developer",
      "Game Developer", "Embedded Systems Developer"
    ],
    "Designer": [
      "UI Designer", "UX Designer", "Product Designer", "Graphic Designer",
      "Motion Designer", "Web Designer", "Branding/Identity Designer"
    ],
    "Research/Analyst": [
      "Data Scientist", "Data Analyst", "Business Analyst", "Market Researcher",
      "QA/Test Engineer", "User Researcher", "Security Analyst"
    ],
    "Business/Strategy": [
      "Project Manager", "Product Manager", "Business Development", "Marketing Specialist",
      "Sales & Partnerships", "Finance & Operations", "Legal/Compliance Advisor"
    ],
    "Support": [
      "Community Manager", "Technical Writer", "Content Creator", "Mentor/Coach",
      "Customer Support", "Recruiter/Talent Scout", "Educator/Trainer"
    ],
    "Visionary": [
      "Product Innovator", "Tech Futurist", "Social Entrepreneur", "Startup Founder",
      "Strategic Planner", "Change Maker", "Creative Director", "Industry Disruptor",
      "Concept Architect", "Impact Leader"
    ],
    "Growth Strategist": [
      "Growth Hacker", "Digital Marketer", "SEO Specialist", "Conversion Rate Optimizer",
      "User Acquisition Manager", "Retention Specialist", "Brand Strategist", "Go-to-Market Lead",
      "Sales Funnel Architect", "Revenue Operations"
    ],
    "Talent Seeker": [
      "Technical Recruiter", "HR Manager", "Talent Acquisition Specialist", "Headhunter",
      "People Operations", "Team Builder", "Culture Specialist", "Hiring Manager",
      "Staffing Coordinator", "Employer Branding Specialist"
    ],
    "Seed Investor": [
      "Angel Investor", "Venture Capitalist", "Private Equity Investor", "Early-Stage Backer",
      "Impact Investor", "Tech Investor", "Crowdfunding Backer", "Incubator Partner",
      "Accelerator Mentor", "Portfolio Manager"
    ],
    "Mentor": [
      "Career Coach", "Technical Mentor", "Leadership Coach", "Startup Advisor",
      "Life Coach", "Executive Mentor", "Peer Mentor", "Skills Trainer",
      "Industry Veteran", "Workshop Facilitator"
    ]
};

const ROLE_SKILLS = {
    "Developer": [
      "JavaScript", "TypeScript", "Python", "Java", "C++", "React", "Node.js", 
      "AWS", "Docker", "Kubernetes", "SQL", "NoSQL", "Git", "CI/CD", "GraphQL"
    ],
    "Designer": [
      "Figma", "Adobe XD", "Photoshop", "Illustrator", "Sketch", "Prototyping", 
      "User Research", "Wireframing", "Interaction Design", "Typography", "Color Theory", 
      "Design Systems", "HTML/CSS", "Animation", "Branding"
    ],
    "Research/Analyst": [
      "Data Analysis", "Python", "R", "SQL", "Excel", "Tableau", "Power BI", 
      "Statistical Modeling", "Market Research", "Machine Learning", "Data Visualization", 
      "Business Intelligence", "Qualitative Research", "Quantitative Research", "A/B Testing"
    ],
    "Business/Strategy": [
      "Strategic Planning", "Project Management", "Business Development", "Financial Analysis", 
      "Market Analysis", "Leadership", "Negotiation", "Risk Management", "Product Management", 
      "Sales Strategy", "Marketing Strategy", "Operations Management", "Change Management", "Stakeholder Management", "Agile Methodologies"
    ],
    "Support": [
      "Customer Service", "Technical Support", "Communication", "Problem Solving", "CRM Tools", 
      "Ticket Management", "Documentation", "Empathy", "Conflict Resolution", "Time Management", 
      "Troubleshooting", "Team Collaboration", "Training", "Feedback Analysis", "Community Management"
    ],
    "Visionary": [
      "Innovation", "Strategic Thinking", "Leadership", "Public Speaking", "Networking", 
      "Storytelling", "Trend Analysis", "Creative Problem Solving", "Concept Development", 
      "Vision Planning", "Team Building", "Fundraising", "Risk Assessment", "Decision Making", "Change Leadership"
    ],
    "Growth Strategist": [
      "SEO", "SEM", "Content Marketing", "Social Media Marketing", "Email Marketing", 
      "Analytics", "A/B Testing", "Conversion Rate Optimization", "Customer Acquisition", 
      "Retention Strategies", "Viral Marketing", "PPC Advertising", "Copywriting", "Funnel Optimization", "Market Trends"
    ],
    "Talent Seeker": [
      "Recruitment", "Sourcing", "Interviewing", "HR Policies", "Employee Relations", 
      "Talent Management", "Onboarding", "Performance Management", "Compensation & Benefits", 
      "Employer Branding", "Negotiation", "Networking", "Candidate Experience", "Diversity & Inclusion", "Labor Laws"
    ],
    "Seed Investor": [
      "Due Diligence", "Financial Modeling", "Valuation", "Market Analysis", "Deal Structuring", 
      "Risk Assessment", "Portfolio Management", "Networking", "Negotiation", "Investment Strategy", 
      "Trend Forecasting", "Legal Knowledge", "Mentorship", "Exit Strategies", "Fundraising"
    ],
    "Mentor": [
      "Coaching", "Active Listening", "Feedback", "Goal Setting", "Motivation", 
      "Career Guidance", "Leadership Development", "Skill Assessment", "Conflict Resolution", 
      "Emotional Intelligence", "Communication", "Patience", "Empathy", "Networking", "Knowledge Sharing"
    ]
};

const SPECIALISATIONS = [
  'Frontend', 'Backend', 'Full-stack', 'Mobile', 'Gaming', 
  'Cyber-security', 'Web 3', 'Artificial/Machine Learning', 'Data Analyst', 'Robotics'
];

const SKILLS = [
  'Node.js', 'Angular', 'Vue.js', 'Python', 'React', 'TypeScript', 'PostgreSQL', 'MongoDB',
  'React Native', 'Rust', 'AWS', 'Docker', 'Go', 'Kotlin', 'Swift', 'Flutter'
];

const AVAILABILITY = [
  'Fulltime roles', 'Side projects', 'Contract work'
];

const COUNTIES = [
  'Baringo County', 'Bomet County', 'Bungoma County', 'Busia County', 'Elgeyo/Marakwet County',
  'Embu County', 'Garissa County', 'Homa Bay County', 'Isiolo County', 'Kajiado County',
  'Kakamega County', 'Kericho County', 'Kiambu County', 'Kilifi County', 'Kirinyaga County',
  'Kisii County', 'Kisumu County', 'Kitui County', 'Kwale County', 'Laikipia County',
  'Lamu County', 'Machakos County', 'Makueni County', 'Mandera County', 'Marsabit County',
  'Meru County', 'Migori County', 'Mombasa County', "Murang'a County", 'Nairobi City County',
  'Nakuru County', 'Nandi County', 'Narok County', 'Nyamira County', 'Nyandarua County',
  'Nyeri County', 'Samburu County', 'Siaya County', 'Taita/Taveta County', 'Tana River County',
  'Tharaka-Nithi County', 'Trans Nzoia County', 'Turkana County', 'Uasin Gishu County',
  'Vihiga County', 'Wajir County', 'West Pokot County'
];

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
  'Figma': PenTool, 'Adobe XD': PenTool, 'Photoshop': ImageIcon, 'Illustrator': PenTool, 'Sketch': PenTool,
  'User Research': Search, 'Wireframing': Layout, 'Interaction Design': MousePointer, 'Typography': Type,
  'Color Theory': Palette, 'Design Systems': Grid, 'HTML/CSS': Code, 'Animation': Video, 'Branding': Star,

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

// --- Types ---

type FormData = {
  gender: string;
  profilePicture: File | null;
  roles: string[];
  goals: string[];
  specialisation: string[];
  skills: string[];
  availability: string[];
  bio: string;
  country: string;
  county: string;
};

// --- Main Component ---

export default function UserGuidePage() {
  const [step, setStep] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Theme management
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setIsDarkMode(true);
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    window.dispatchEvent(new Event('themeChanged'));
  };

  const [formData, setFormData] = useState<FormData>({
    gender: '',
    profilePicture: null,
    roles: [],
    goals: [],
    specialisation: [],
    skills: [],
    availability: [],
    bio: '',
    country: '',
    county: '',
  });
  const [customSkill, setCustomSkill] = useState('');

  const totalSteps = 6;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const updateFormData = (key: keyof FormData, value: FormData[keyof FormData]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleSelection = (key: 'roles' | 'goals' | 'skills' | 'availability' | 'specialisation', value: string, max?: number) => {
    setFormData(prev => {
      const current = prev[key];
      const exists = current.includes(value);
      
      if (exists) {
        return { ...prev, [key]: current.filter(item => item !== value) };
      } else {
        if (max && current.length >= max) return prev;
        return { ...prev, [key]: [...current, value] };
      }
    });
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (!trimmed) return;
    
    if (formData.skills.includes(trimmed)) {
        setCustomSkill('');
        return;
    }

    if (formData.skills.length >= 6) {
        return;
    }

    toggleSelection('skills', trimmed, 6);
    setCustomSkill('');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className={`text-2xl font-extrabold text-center mb-8 ${isDarkMode ? 'text-[#F4A261]' : 'text-black'}`}>How do you identify?</h2>
            <div className="space-y-4 max-w-md mx-auto">
              {['Male', 'Female', 'Prefer not to say'].map((option) => (
                <button
                  key={option}
                  onClick={() => updateFormData('gender', option)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                    formData.gender === option 
                      ? 'border-[#E50914] bg-[#E50914]/5 text-[#E50914]' 
                      : isDarkMode 
                        ? 'border-gray-700 hover:border-gray-600 bg-[#222]' 
                        : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={`font-bold ${isDarkMode ? 'text-[#F4A261]' : 'text-black'}`}>{option}</span>
                  {formData.gender === option && <Check size={20} />}
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 text-center">
            <h2 className={`text-2xl font-extrabold mb-2 ${isDarkMode ? 'text-[#F4A261]' : 'text-black'}`}>Add a profile picture</h2>
            <p className={`${isDarkMode ? 'text-[#F4A261]' : 'text-gray-500'} mb-8`}>Put a face to the name</p>
            
            <div className={`relative w-40 h-40 mx-auto rounded-full flex items-center justify-center overflow-hidden border-4 shadow-lg group cursor-pointer ${isDarkMode ? 'bg-[#222] border-[#333]' : 'bg-gray-100 border-white'}`}>
              {formData.profilePicture ? (
                <Image 
                  src={URL.createObjectURL(formData.profilePicture)} 
                  alt="Profile" 
                  fill
                  className="object-cover"
                />
              ) : (
                <User size={64} className="text-gray-300" />
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Camera className="text-white" size={32} />
              </div>
              <input 
                type="file" 
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    updateFormData('profilePicture', e.target.files[0]);
                  }
                }}
              />
            </div>
            
            <button className="text-[#E50914] font-medium text-sm hover:underline mt-4">
              Choose a different photo
            </button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className={`text-2xl font-extrabold mb-2 ${isDarkMode ? 'text-[#F4A261]' : 'text-black'}`}>What describes you best?</h2>
              <p className={isDarkMode ? 'text-[#F4A261]' : 'text-gray-500'}>Select up to two options</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  onClick={() => toggleSelection('roles', role.id, 2)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    formData.roles.includes(role.id)
                      ? 'border-[#E50914] bg-[#E50914]/5' 
                      : isDarkMode 
                        ? 'border-gray-700 hover:border-gray-600 bg-[#222]' 
                        : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`font-extrabold mb-1 flex justify-between items-center ${isDarkMode ? 'text-[#F4A261]' : 'text-black'}`}>
                    <div className="flex items-center gap-3">
                      <role.icon size={24} className={formData.roles.includes(role.id) ? 'text-[#E50914]' : isDarkMode ? 'text-[#E50914]' : 'text-gray-600'} />
                      {role.label}
                    </div>
                    {formData.roles.includes(role.id) && <Check size={18} className="text-[#E50914]" />}
                  </div>
                  <div className={`text-xs mt-2 ${isDarkMode ? 'text-[#F4A261]' : 'text-gray-500'}`}>{role.description}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className={`text-2xl font-extrabold mb-2 ${isDarkMode ? 'text-[#F4A261]' : 'text-black'}`}>What are you looking for?</h2>
              <p className={isDarkMode ? 'text-[#F4A261]' : 'text-gray-500'}>Select up to three options</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GOALS.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => toggleSelection('goals', goal.id, 3)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    formData.goals.includes(goal.id)
                      ? 'border-[#F4A261] bg-[#F4A261]/5' 
                      : isDarkMode 
                        ? 'border-gray-700 hover:border-gray-600 bg-[#222]' 
                        : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`font-extrabold mb-1 flex justify-between items-center ${isDarkMode ? 'text-[#F4A261]' : 'text-black'}`}>
                    <div className="flex items-center gap-3">
                      <goal.icon size={24} className={formData.goals.includes(goal.id) ? 'text-[#F4A261]' : isDarkMode ? 'text-[#E50914]' : 'text-gray-600'} />
                      {goal.label}
                    </div>
                    {formData.goals.includes(goal.id) && <Check size={18} className="text-[#F4A261]" />}
                  </div>
                  <div className={`text-xs mt-2 ${isDarkMode ? 'text-[#F4A261]' : 'text-gray-500'}`}>{goal.description}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        const selectedRoleLabels = formData.roles
          .map(roleId => ROLES.find(r => r.id === roleId)?.label)
          .filter((label): label is string => !!label);

        const displaySpecialisations = selectedRoleLabels.length > 0
          ? Array.from(new Set(selectedRoleLabels.flatMap(label => ROLE_SUB_CATEGORIES[label as keyof typeof ROLE_SUB_CATEGORIES] || [])))
          : SPECIALISATIONS;

        const displaySkills = selectedRoleLabels.length > 0
          ? Array.from(new Set(selectedRoleLabels.flatMap(label => ROLE_SKILLS[label as keyof typeof ROLE_SKILLS] || [])))
          : SKILLS;

        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className={`text-2xl font-extrabold mb-2 ${isDarkMode ? 'text-[#F4A261]' : 'text-black'}`}>Tell us more</h2>
              <p className={isDarkMode ? 'text-[#F4A261]' : 'text-gray-500'}>This makes it easy to find better matches for you</p>
            </div>

            {/* Specialisation */}
            <div>
              <h3 className={`font-extrabold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-[#F4A261]' : 'text-black'}`}>
                <Briefcase size={18} className="text-[#E50914]" />
                Specialisation <span className={`text-xs font-normal ml-2 ${isDarkMode ? 'text-[#F4A261]/80' : 'text-gray-400'}`}>(Max 3)</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {displaySpecialisations.map((spec) => {
                  const Icon = ICON_MAP[spec] || Briefcase;
                  return (
                    <button
                      key={spec}
                      onClick={() => toggleSelection('specialisation', spec, 3)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all flex items-center gap-2 ${
                        formData.specialisation.includes(spec)
                          ? 'bg-[#E50914] text-white border-[#E50914]'
                          : isDarkMode
                            ? 'bg-[#222] text-[#F4A261] border-gray-700 hover:border-gray-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={14} className={!formData.specialisation.includes(spec) && isDarkMode ? 'text-[#E50914]' : ''} />
                      {spec}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Top Skills */}
            <div>
              <h3 className={`font-extrabold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-[#F4A261]' : 'text-black'}`}>
                <Award size={18} className="text-[#F4A261]" />
                Top Skills <span className={`text-xs font-normal ml-2 ${isDarkMode ? 'text-[#F4A261]/80' : 'text-gray-400'}`}>(Max 6)</span>
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {displaySkills.map((skill) => {
                  const Icon = ICON_MAP[skill] || Award;
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSelection('skills', skill, 6)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all flex items-center gap-2 ${
                        formData.skills.includes(skill)
                          ? 'bg-[#F4A261] text-white border-[#F4A261]'
                          : isDarkMode
                            ? 'bg-[#222] text-[#F4A261] border-gray-700 hover:border-gray-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={14} className={!formData.skills.includes(skill) && isDarkMode ? 'text-[#E50914]' : ''} />
                      {skill}
                    </button>
                  );
                })}
                {formData.skills
                  .filter(skill => !displaySkills.includes(skill))
                  .map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleSelection('skills', skill, 6)}
                      className="px-4 py-2 rounded-full text-sm font-medium border transition-all bg-[#F4A261] text-white border-[#F4A261] flex items-center gap-2"
                    >
                      <Award size={14} />
                      {skill}
                    </button>
                  ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomSkill()}
                  placeholder="Add other skill..."
                  className={`flex-1 px-4 py-2 rounded-full text-sm border focus:outline-none focus:border-[#F4A261] ${
                    isDarkMode 
                      ? 'bg-[#222] border-gray-700 text-[#F4A261] placeholder-[#F4A261]/70' 
                      : 'border-gray-200 text-black'
                  }`}
                />
                <button
                  onClick={addCustomSkill}
                  disabled={!customSkill.trim() || formData.skills.length >= 6}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-[#F4A261] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Availability */}
            <div>
              <h3 className={`font-extrabold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-[#F4A261]' : 'text-black'}`}>
                <Target size={18} className="text-[#2ECC71]" />
                Available for
              </h3>
              <div className="flex flex-wrap gap-2">
                {AVAILABILITY.map((avail) => (
                  <button
                    key={avail}
                    onClick={() => toggleSelection('availability', avail)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      formData.availability.includes(avail)
                        ? 'bg-[#2ECC71] text-white border-[#2ECC71]'
                        : isDarkMode
                          ? 'bg-[#222] text-[#F4A261] border-gray-700 hover:border-gray-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {avail}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-8">
            <div className="text-center mb-6">
              <h2 className={`text-2xl font-extrabold mb-2 ${isDarkMode ? 'text-[#F4A261]' : 'text-black'}`}>Final touches</h2>
              <p className={isDarkMode ? 'text-[#F4A261]' : 'text-gray-500'}>Let others know who you are</p>
            </div>

            {/* Bio */}
            <div>
              <label className={`block font-bold mb-2 ${isDarkMode ? 'text-[#F4A261]' : 'text-black'}`}>Share a bit info about you</label>
              <textarea
                value={formData.bio}
                onChange={(e) => updateFormData('bio', e.target.value)}
                placeholder="Tell us about your journey, interests, and what drives you..."
                className={`w-full h-32 p-4 rounded-xl border focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none resize-none ${
                  isDarkMode 
                    ? 'bg-[#222] border-gray-700 text-[#F4A261] placeholder-[#F4A261]/70' 
                    : 'bg-gray-50 border-gray-200 text-black'
                }`}
              />
              <div className="text-right mt-1">
                <span className={`text-xs ${formData.bio.length > 0 && formData.bio.length < 40 ? 'text-red-500' : isDarkMode ? 'text-[#F4A261]/70' : 'text-gray-400'}`}>
                  {formData.bio.length} / 40 minimum characters
                </span>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className={`block font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-[#F4A261]' : 'text-black'}`}>
                <MapPin size={18} />
                Location
              </label>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Country (e.g. Kenya)"
                  value={formData.country}
                  onChange={(e) => updateFormData('country', e.target.value)}
                  className={`w-full p-4 rounded-xl border focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none ${
                    isDarkMode 
                      ? 'bg-[#222] border-gray-700 text-[#F4A261] placeholder-[#F4A261]/70' 
                      : 'bg-white border-gray-200 text-black'
                  }`}
                />

                {formData.country.toLowerCase() === 'kenya' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <label className={`block text-sm font-bold ${isDarkMode ? 'text-[#F4A261]' : 'text-black'}`}>Select County</label>
                    <select
                      value={formData.county}
                      onChange={(e) => updateFormData('county', e.target.value)}
                      className={`w-full p-4 rounded-xl border focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none appearance-none ${
                        isDarkMode 
                          ? 'bg-[#222] border-gray-700 text-[#F4A261]' 
                          : 'bg-white border-gray-200 text-black'
                      }`}
                    >
                      <option value="">Select a county...</option>
                      {COUNTIES.map((county) => (
                        <option key={county} value={county}>{county}</option>
                      ))}
                    </select>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isNextDisabled = () => {
    switch (step) {
      case 1: return !formData.gender;
      case 2: return false; // Optional? Or force? Assuming optional for now as user can "skip" usually, but prompt implies sequential. Let's make it optional.
      case 3: return formData.roles.length === 0;
      case 4: return formData.goals.length === 0;
      case 5: return !formData.specialisation || formData.skills.length === 0 || formData.availability.length === 0;
      case 6: return formData.bio.length < 40 || !formData.country || (formData.country.toLowerCase() === 'kenya' && !formData.county);
      default: return false;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0A0A0A]' : 'bg-[#FDF8F5]'} transition-colors duration-300`}>
      <TopNavigation 
        title="User Guide"
        onMobileMenuOpen={() => {}}
        showSearch={false}
        className="!left-0"
        isDarkMode={isDarkMode}
        showBack={true}
        customAction={
          <button 
            onClick={toggleTheme}
            className={`relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#E50914] ${isDarkMode ? 'bg-gray-800' : 'bg-[#FBE6A4] border border-[#F4A261]/30'}`}
          >
            <div className="absolute inset-0 flex justify-between items-center px-2">
              <Sun className="w-4 h-4 text-[#E50914]" />
              <Moon className="w-4 h-4 text-[#F4A261]" />
            </div>
            <motion.div 
              className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md"
              animate={{ x: isDarkMode ? 32 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        }
      />

      <div className="pt-24 pb-8 px-4 flex items-center justify-center min-h-screen">
        <div className={`w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden flex flex-col min-h-[600px] ${isDarkMode ? 'bg-[#111] border border-[#E70008]/20' : 'bg-white'}`}>
          {/* Progress Bar */}
          <div className={`h-2 w-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <div 
              className="h-full bg-gradient-to-r from-[#F4A261] to-[#E50914] transition-all duration-300 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-8 md:p-12 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Navigation */}
          <div className={`p-8 border-t flex justify-between items-center ${isDarkMode ? 'border-gray-800 bg-[#161616]' : 'border-gray-100 bg-gray-50'}`}>
            <button
              onClick={handleBack}
              disabled={step === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                step === 1 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : isDarkMode ? 'text-[#F4A261] hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ChevronLeft size={20} />
              Back
            </button>

            <div className="flex gap-2">
              <div className={`text-sm font-medium flex items-center mr-4 ${isDarkMode ? 'text-[#F4A261]' : 'text-gray-400'}`}>
                Step {step} of {totalSteps}
              </div>
              <button
                onClick={handleNext}
                disabled={isNextDisabled()}
                className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold text-white transition-all shadow-md ${
                  isNextDisabled()
                    ? 'bg-gray-300 cursor-not-allowed shadow-none'
                    : 'bg-[#E50914] hover:bg-[#cc0812] hover:shadow-lg'
                }`}
              >
                {step === totalSteps ? 'Complete' : 'Next'}
                {step !== totalSteps && <ChevronRight size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
