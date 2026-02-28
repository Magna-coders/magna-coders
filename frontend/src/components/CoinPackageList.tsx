import React from 'react';
import { Coins } from 'lucide-react';

export interface CoinPackage {
  id: number;
  coins: number;
  price: number;
  bonus: number;
  popular: boolean;
}

interface CoinPackageListProps {
  packages: CoinPackage[];
  selectedPackageId: number | null;
  onSelect: (id: number) => void;
  isDarkMode: boolean;
}

export default function CoinPackageList({ packages, selectedPackageId, onSelect, isDarkMode }: CoinPackageListProps) {
  return (
    <div className="mb-6 md:mb-8">
      <h2 className={`text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>
        <Coins className="text-[#E50914]" />
        Select Package
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <div 
            key={pkg.id}
            onClick={() => onSelect(pkg.id)}
            className={`relative rounded-2xl p-6 border-2 cursor-pointer transition-all ${
              selectedPackageId === pkg.id 
                ? 'border-[#E50914] bg-[#E50914]/5 shadow-md scale-105' 
                : isDarkMode 
                  ? 'border-[#333] bg-[#111] hover:border-[#E50914]/50' 
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
            }`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E50914] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                POPULAR
              </div>
            )}
            
            <div className="text-center mb-4">
              <div className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>
                {pkg.coins}
              </div>
              <div className="text-xs font-bold text-[#E50914] uppercase tracking-wider">Magna Coins</div>
            </div>

            {pkg.bonus > 0 && (
              <div className="flex justify-center mb-4">
                <span className="bg-[#2ECC71]/10 text-[#2ECC71] text-xs font-bold px-2 py-1 rounded-lg">
                  +{pkg.bonus} Bonus
                </span>
              </div>
            )}

            <div className={`text-center py-3 rounded-xl font-bold text-lg ${
              selectedPackageId === pkg.id
                ? 'bg-[#E50914] text-white'
                : isDarkMode ? 'bg-[#222] text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}>
              KES {pkg.price}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
