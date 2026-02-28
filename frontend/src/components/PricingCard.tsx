import React from 'react';
import { Check } from 'lucide-react';

interface PricingCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  yearlyTotal?: number;
  savings?: string;
  buttonText: string;
  buttonClass: string;
  benefits: string[];
  gradientClass: string;
  checkColorClass: string;
  checkBgClass: string;
  onSelect?: () => void;
  isDarkMode?: boolean;
}

export default function PricingCard({
  title,
  subtitle,
  icon,
  price,
  billingCycle,
  yearlyTotal,
  savings,
  buttonText,
  buttonClass,
  benefits,
  gradientClass,
  checkColorClass,
  checkBgClass,
  onSelect,
  isDarkMode = false
}: PricingCardProps) {
  return (
    <div className={`rounded-3xl p-8 border shadow-sm hover:shadow-xl transition-all relative overflow-hidden group ${
      isDarkMode 
        ? 'bg-[#111] border-[#E70008]/30 shadow-[0_0_15px_rgba(231,0,8,0.1)]' 
        : 'bg-white border-gray-100'
    }`}>
      <div className={`absolute top-0 left-0 w-full h-2 ${gradientClass}`}></div>
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>
            {title}
            {icon}
          </h3>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>
        </div>
        {billingCycle === 'yearly' && savings && (
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            isDarkMode ? 'bg-[#2ECC71]/20 text-[#2ECC71]' : 'bg-green-100 text-green-700'
          }`}>
            {savings}
          </span>
        )}
      </div>

      <div className="mb-8">
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl font-bold ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>
            KES {price}
          </span>
          <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>/month</span>
        </div>
        {billingCycle === 'yearly' && yearlyTotal && (
          <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Billed yearly at KES {yearlyTotal}
          </p>
        )}
      </div>

      <button 
        onClick={onSelect}
        className={`w-full py-3 rounded-xl font-bold mb-8 transition-all shadow-md ${buttonClass}`}
      >
        {buttonText}
      </button>

      <div className="space-y-4">
        <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>What&apos;s included</p>
        {benefits.map((benefit, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${checkBgClass}`}>
              <Check size={12} className={checkColorClass} />
            </div>
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{benefit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
