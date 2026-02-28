import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface MagnaCoinBenefitsProps {
  isDarkMode: boolean;
}

export default function MagnaCoinBenefits({ isDarkMode }: MagnaCoinBenefitsProps) {
  const benefits = [
    'Unlock premium job applications',
    'Boost your project visibility',
    'Access advanced AI features',
    'Tip content creators'
  ];

  return (
    <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-[#111] border border-[#333]' : 'bg-white border border-gray-100'}`}>
      <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>
        <ShieldCheck size={18} className="text-[#E50914]" />
        Why Buy Magna Coins?
      </h3>
      <ul className="space-y-3">
        {benefits.map((benefit, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <div className="w-5 h-5 rounded-full bg-[#E50914]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-[#E50914]"></div>
            </div>
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
