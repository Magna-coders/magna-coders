import React from 'react';
import { CreditCard } from 'lucide-react';

export interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface PaymentMethodListProps {
  methods: PaymentMethod[];
  selectedMethodId: string | null;
  onSelect: (id: string) => void;
  isDarkMode: boolean;
}

export default function PaymentMethodList({ methods, selectedMethodId, onSelect, isDarkMode }: PaymentMethodListProps) {
  return (
    <div className="mb-8">
      <h2 className={`text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>
        <CreditCard className="text-[#E50914]" />
        Payment Method
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {methods.map((method) => (
          <div
            key={method.id}
            onClick={() => onSelect(method.id)}
            className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedMethodId === method.id
                ? 'border-[#E50914] bg-[#E50914]/5'
                : isDarkMode
                  ? 'border-[#333] bg-[#111] hover:bg-[#222]'
                  : 'border-gray-100 bg-white hover:bg-gray-50'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
              method.id === 'mpesa' ? 'bg-[#2ECC71] text-white' :
              method.id === 'paypal' ? 'bg-[#003087] text-white' :
              'bg-gray-800 text-white'
            }`}>
              {method.icon}
            </div>
            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {method.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
