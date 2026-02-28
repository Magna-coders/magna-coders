import React from 'react';
import { 
  User, 
  CreditCard, 
  History, 
  FolderKanban, 
  Briefcase, 
  Bell, 
  Lock, 
  Palette, 
  ShieldCheck, 
  MapPin, 
  HelpCircle 
} from 'lucide-react';

export const settingsModules = [
  { id: 'Account', icon: <User size={18} />, label: 'Account' },
  { id: 'Payment Method', icon: <CreditCard size={18} />, label: 'Payment Method' },
  { id: 'Payment History', icon: <History size={18} />, label: 'Payment History' },
  { id: 'My Projects', icon: <FolderKanban size={18} />, label: 'My Projects' },
  { id: 'My Job Opportunities', icon: <Briefcase size={18} />, label: 'My Job Opportunities' },
  { id: 'Notifications', icon: <Bell size={18} />, label: 'Notifications' },
  { id: 'Privacy', icon: <Lock size={18} />, label: 'Privacy' },
  { id: 'Appearance', icon: <Palette size={18} />, label: 'Appearance' },
  { id: 'Security', icon: <ShieldCheck size={18} />, label: 'Security' },
  { id: 'Local Discovery', icon: <MapPin size={18} />, label: 'Local Discovery' },
  { id: 'Help Center', icon: <HelpCircle size={18} />, label: 'Help Center' },
];

export const paymentHistoryData = [
  { title: 'Paid Magna School', date: 'Oct 24, 2023', amount: 'KES 2,900', status: 'Paid', invoice: '#INV-2023-001' },
  { title: 'Magna Verification', date: 'Sep 24, 2023', amount: 'KES 4,100', status: 'Paid', invoice: '#INV-2023-002' },
  { title: 'Magna Coins', date: 'Aug 24, 2023', amount: 'KES 800', status: 'Paid', invoice: '#INV-2023-003' },
];

export const faqsData = [
  'How do I reset my password?', 
  'Can I change my username?', 
  'How do I delete my account?'
];
