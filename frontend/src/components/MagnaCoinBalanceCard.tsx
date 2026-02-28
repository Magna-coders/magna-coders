import React, { useState } from 'react';
import { Wallet, Eye, EyeOff, Copy, Check } from 'lucide-react';

interface MagnaCoinBalanceCardProps {
  balance: number;
  maxCoins: number;
  isDarkMode: boolean;
  onSendClick?: () => void;
  walletName?: string;
  walletId?: string;
}

export default function MagnaCoinBalanceCard({ 
  balance, 
  maxCoins, 
  isDarkMode, 
  onSendClick, 
  walletName,
  walletId 
}: MagnaCoinBalanceCardProps) {
  const [isIdVisible, setIsIdVisible] = useState(false);
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (walletId) {
      navigator.clipboard.writeText(walletId);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className={`rounded-3xl p-5 md:p-8 relative overflow-hidden transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-[#1a1a1a] to-black border border-[#E70008]/30 hover:border-[#E70008]/50' 
        : 'bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] text-white shadow-xl hover:shadow-2xl'
    }`}>
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#E50914] rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/3"></div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 text-gray-400 font-medium">
            <Wallet size={20} />
            <span>{walletName ? `${walletName} Balance` : 'Current Balance'}</span>
          </div>
          
          <div className="flex items-baseline gap-2 mb-4 group">
            <span className={`text-4xl md:text-5xl font-bold ${isDarkMode ? 'text-[#F4A261]' : 'text-white'}`}>
              {isBalanceVisible ? balance.toLocaleString() : '••••'}
            </span>
            <span className="text-lg md:text-xl font-bold text-[#E50914]">MC</span>
            <button 
              onClick={() => setIsBalanceVisible(!isBalanceVisible)}
              className="ml-2 text-gray-400 hover:text-white transition-colors p-1"
              title={isBalanceVisible ? "Hide Balance" : "Show Balance"}
            >
              {isBalanceVisible ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {walletId && (
            <div className="flex items-center gap-3 mb-6 bg-black/20 p-2 rounded-lg w-fit">
              <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">ID:</span>
              <span className={`font-mono text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-200'}`}>
                {isIdVisible ? walletId : '••••••••••••'}
              </span>
              <button 
                onClick={() => setIsIdVisible(!isIdVisible)}
                className="text-gray-400 hover:text-white transition-colors p-1"
                title={isIdVisible ? "Hide ID" : "Show ID"}
              >
                {isIdVisible ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button 
                onClick={handleCopy}
                className="text-gray-400 hover:text-[#E50914] transition-colors p-1"
                title="Copy ID"
              >
                {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
          )}

          {onSendClick && (
            <button 
              onClick={onSendClick}
              className="px-4 py-2 bg-[#E50914] hover:bg-[#cc0812] text-white rounded-lg text-sm font-bold shadow-lg shadow-red-500/20 transition-all flex items-center gap-2"
            >
              Send Coins
            </button>
          )}
        </div>
        
        <div className="w-full md:w-1/3">
          <div className="flex justify-between text-sm mb-2 font-medium">
            <span className="text-gray-400">Wallet Capacity</span>
            <span className={isDarkMode ? 'text-[#F4A261]' : 'text-white'}>{Math.round((balance / maxCoins) * 100)}%</span>
          </div>
          <div className="w-full h-3 bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className="h-full bg-gradient-to-r from-[#F4A261] to-[#E50914] transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(229,9,20,0.5)]"
              style={{ width: `${Math.min((balance / maxCoins) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-2 text-gray-500">
            <span>0 MC</span>
            <span>{maxCoins.toLocaleString()} MC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
