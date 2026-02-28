"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BadgeCheck, Star, X } from 'lucide-react';
import LeftPanel from '@/components/LeftPanel';
import TopNavigation from '@/components/TopNavigation';
import PricingCard from '@/components/PricingCard';
import Checkout from '@/components/Checkout';

export default function GetVerificationPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(''); 
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<{title: string, price: number} | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE;
        if (!apiUrl || !token) return;

        const response = await fetch(`${apiUrl}/integrations/payments/methods`, {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const methods = Array.isArray(data) ? data : (data.data || []);
          if (methods.length > 0) {
            setPaymentMethods(methods);
            console.log('GetVerification - Fetched payment methods:', methods);
          }
        }
      } catch (error) {
        console.error('Failed to fetch payment methods in GetVerification', error);
      }
    };

    fetchPaymentMethods();
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  // Pricing Configuration
  const pricing = {
    personal: {
      monthly: { price: 350 },
      yearly: { price: 122, total: 1470, savings: '65% OFF' }
    },
    business: {
      monthly: { price: 999 },
      yearly: { price: 350, total: 4196, savings: '65% OFF' }
    }
  };

  const benefits = {
    personal: [
      "Verified badge on your profile",
      "Prioritized in search results",
      "Access to exclusive workshops",
      "Unlimited connection requests",
      "Profile analytics insights"
    ],
    business: [
      "Gold verified badge for company",
      "Post unlimited job listings",
      "Advanced candidate filtering",
      "Featured company profile",
      "Dedicated account support",
      "Team management tools"
    ]
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
        
        {selectedPlan && (
          <Checkout 
            amount={selectedPlan.price}
            itemTitle={`${selectedPlan.title} Verification`}
            itemDescription={`${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'} Subscription`}
            onClose={() => setSelectedPlan(null)}
            isDarkMode={isDarkMode}
          />
        )}

        {/* TOP NAVIGATION BAR */}
        <TopNavigation 
          title="Get Verified" 
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          showSearch={false}
          showBack={true}
          isDarkMode={isDarkMode}
        />

        {/* MOBILE DRAWER */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>
            
            <div className={`absolute top-0 left-0 w-full h-full shadow-2xl flex flex-col overflow-y-auto animate-slide-in-left ${
              isDarkMode ? 'bg-black border-r border-[#E70008]/20' : 'bg-white'
            }`}>
              <div className={`p-4 border-b flex items-center justify-between sticky top-0 z-10 ${
                isDarkMode ? 'bg-black border-[#E70008]/20' : 'bg-white border-gray-100'
              }`}>
                <Link href="/" className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-lg bg-[#E70008] flex items-center justify-center shadow-lg">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                      </svg>
                   </div>
                   <span className="text-lg font-bold tracking-tight">
                      <span className="text-[#F4A261]">Magna</span>
                      <span className="text-[#E70008]">Coders</span>
                   </span>
                </Link>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`p-2 rounded-full hover:bg-gray-100 ${isDarkMode ? 'text-gray-400 hover:bg-[#E70008]/10' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-4 space-y-6 pb-20">
                <LeftPanel 
                  activeTab={activeTab} 
                  setActiveTab={setActiveTab} 
                  closeMenu={() => setIsMobileMenuOpen(false)} 
                  isMobile={true}
                  isDarkMode={isDarkMode}
                  toggleTheme={toggleTheme}
                />
              </div>
            </div>
          </div>
        )}

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto pt-[65px] md:pt-[80px]">
          <div className="max-w-5xl mx-auto w-full p-4 md:p-10">
            
            <div className="text-center mb-10">
              <h2 className={`text-3xl font-bold mb-3 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Choose Your Verification Badge</h2>
              <p className={`max-w-lg mx-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Boost your credibility, stand out to recruiters, and unlock exclusive features with a verified badge.
              </p>

              {/* BILLING TOGGLE */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <span className={`text-sm font-bold ${billingCycle === 'monthly' ? (isDarkMode ? 'text-[#F9E4AD]' : 'text-black') : 'text-gray-400'}`}>Monthly</span>
                <button 
                  onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                  className={`w-14 h-8 rounded-full relative transition-colors duration-300 ${isDarkMode ? 'bg-[#222]' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 rounded-full bg-[#E50914] shadow-sm transition-all duration-300 ${billingCycle === 'yearly' ? 'left-7' : 'left-1'}`}></div>
                </button>
                <span className={`text-sm font-bold ${billingCycle === 'yearly' ? (isDarkMode ? 'text-[#F9E4AD]' : 'text-black') : 'text-gray-400'}`}>
                  Yearly <span className="text-[#E50914] text-xs ml-1">(Save 65%)</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              
              {/* PERSONAL PLAN */}
              <PricingCard
                title="Personal"
                subtitle="For developers & creators"
                icon={<BadgeCheck size={20} className="text-[#E50914]" />}
                price={billingCycle === 'yearly' ? pricing.personal.yearly.price : pricing.personal.monthly.price}
                billingCycle={billingCycle}
                yearlyTotal={pricing.personal.yearly.total}
                savings={pricing.personal.yearly.savings}
                buttonText="Get Personal Badge"
                buttonClass="bg-black text-white hover:bg-gray-800"
                benefits={benefits.personal}
                gradientClass="bg-gradient-to-r from-[#F4A261] to-[#E50914]"
                checkColorClass="text-[#E50914]"
                checkBgClass="bg-[#E50914]/10"
                isDarkMode={isDarkMode}
                onSelect={() => setSelectedPlan({
                  title: 'Personal',
                  price: billingCycle === 'yearly' ? pricing.personal.yearly.total : pricing.personal.monthly.price
                })}
              />

              {/* BUSINESS PLAN */}
              <PricingCard
                title="Business"
                subtitle="For companies & startups"
                icon={<BadgeCheck size={20} className="text-blue-500" />}
                price={billingCycle === 'yearly' ? pricing.business.yearly.price : pricing.business.monthly.price}
                billingCycle={billingCycle}
                yearlyTotal={pricing.business.yearly.total}
                savings={pricing.business.yearly.savings}
                buttonText="Get Business Badge"
                buttonClass="bg-blue-500 text-white hover:bg-blue-600"
                benefits={benefits.business}
                gradientClass="bg-gradient-to-r from-blue-800 to-black"
                checkColorClass="text-blue-500"
                checkBgClass="bg-blue-500/10"
                isDarkMode={isDarkMode}
                onSelect={() => setSelectedPlan({
                  title: 'Business',
                  price: billingCycle === 'yearly' ? pricing.business.yearly.total : pricing.business.monthly.price
                })}
              />

            </div>

            <div className="mt-16 text-center text-sm text-gray-400">
              <p>Secure payment via M-Pesa or Card. Cancel anytime.</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
