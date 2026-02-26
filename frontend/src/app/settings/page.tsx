"use client";

import React, { useState, useEffect } from 'react';
import TopNavigation from '@/components/TopNavigation';
import LeftPanel from '@/components/LeftPanel';
import SettingsMobileDrawer from '@/components/SettingsMobileDrawer';
import SettingsNavigation from '@/components/SettingsNavigation';
import AccountSettings from '@/components/AccountSettings';
import PaymentMethodSettings from '@/components/PaymentMethodSettings';
import PaymentHistorySettings from '@/components/PaymentHistorySettings';
import MyProjectsSettings from '@/components/MyProjectsSettings';
import MyJobOpportunitiesSettings from '@/components/MyJobOpportunitiesSettings';
import NotificationsSettings from '@/components/NotificationsSettings';
import PrivacySettings from '@/components/PrivacySettings';
import AppearanceSettings from '@/components/AppearanceSettings';
import SecuritySettings from '@/components/SecuritySettings';
import LocalDiscoverySettings from '@/components/LocalDiscoverySettings';
import HelpCenterSettings from '@/components/HelpCenterSettings';

export default function SettingsPage() {
  const [activeModule, setActiveModule] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Settings');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    window.dispatchEvent(new Event('themeChanged'));
  };

  const getModuleContent = (moduleId: string) => {
    switch (moduleId) {
      case 'Account': return <AccountSettings isDarkMode={isDarkMode} />;
      case 'Payment Method': return <PaymentMethodSettings isDarkMode={isDarkMode} />;
      case 'Payment History': return <PaymentHistorySettings isDarkMode={isDarkMode} />;
      case 'My Projects': return <MyProjectsSettings isDarkMode={isDarkMode} />;
      case 'My Job Opportunities': return <MyJobOpportunitiesSettings isDarkMode={isDarkMode} />;
      case 'Notifications': return <NotificationsSettings isDarkMode={isDarkMode} />;
      case 'Privacy': return <PrivacySettings isDarkMode={isDarkMode} />;
      case 'Appearance': return <AppearanceSettings isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
      case 'Security': return <SecuritySettings isDarkMode={isDarkMode} />;
      case 'Local Discovery': return <LocalDiscoverySettings isDarkMode={isDarkMode} />;
      case 'Help Center': return <HelpCenterSettings isDarkMode={isDarkMode} />;
      default: return <AccountSettings isDarkMode={isDarkMode} />;
    }
  };

  return (
    <div className={`h-screen font-sans flex overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-black text-[#F9E4AD]' : 'bg-[#FDF8F5] text-[#444444]'}`}>
      
      {/* LEFT SIDEBAR */}
      <LeftPanel 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />

      {/* MAIN CONTENT */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden relative md:ml-[88px] ${isSidebarExpanded ? 'lg:ml-[260px]' : 'lg:ml-[88px]'} transition-all duration-300`}>
        
        {/* TOP NAVIGATION BAR */}
        <TopNavigation 
          title="Settings" 
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          isDarkMode={isDarkMode}
        />

        {/* MOBILE DRAWER */}
        <SettingsMobileDrawer 
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto pt-[65px] md:pt-[80px]">
          <div className="max-w-7xl mx-auto p-4 md:p-8 mb-20 md:mb-0">
            
            {/* Header */}
            <div className="mb-8">
              <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Settings</h1>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Manage your account preferences and settings</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Settings Navigation Module */}
              <SettingsNavigation 
                activeModule={activeModule} 
                setActiveModule={setActiveModule} 
                isDarkMode={isDarkMode} 
                getModuleContent={getModuleContent}
              />

              {/* Desktop Module Content Area */}
              <div className="hidden lg:block flex-1 min-w-0">
                {getModuleContent(activeModule || 'Account')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
