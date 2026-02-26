'use client';

import React, { useState } from 'react';
import { X, Check, Shield } from 'lucide-react';

interface CreateWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  isDarkMode?: boolean;
}

export default function CreateWalletModal({ 
  isOpen, 
  onClose, 
  onCreate,
  isDarkMode = false
}: CreateWalletModalProps) {
  const [step, setStep] = useState<'terms' | 'name'>('terms');
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletName.trim()) return;

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onCreate(walletName);
      // Reset form
      setWalletName('');
      setStep('terms');
      setHasReadTerms(false);
      onClose();
    } catch (error) {
      console.error('Failed to create wallet', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={`relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl transform transition-all flex flex-col max-h-[90vh] ${isDarkMode ? 'bg-[#111] border border-[#E70008]/20' : 'bg-white'}`}>
        
        {/* Header */}
        <div className={`p-4 flex items-center justify-between flex-shrink-0 ${isDarkMode ? 'border-b border-[#333]' : 'border-b border-gray-100'}`}>
          <h2 className={`font-bold text-lg ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>
            {step === 'terms' ? 'Terms & Conditions' : 'Name Your Wallet'}
          </h2>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-[#222] text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {step === 'terms' ? (
            <div className="space-y-6">
              <div className={`flex items-center gap-3 p-4 rounded-xl ${isDarkMode ? 'bg-[#E50914]/10 border border-[#E50914]/20' : 'bg-red-50 border border-red-100'}`}>
                <Shield className="text-[#E50914] flex-shrink-0" size={24} />
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Please review the terms and conditions carefully before creating a new wallet.
                </p>
              </div>

              <div className={`h-64 overflow-y-auto p-4 rounded-xl text-sm leading-relaxed ${isDarkMode ? 'bg-[#222] text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                <h3 className="font-bold mb-2">1. Introduction</h3>
                <p className="mb-4">
                  Welcome to Magna Coin Wallet. By creating a wallet, you agree to be bound by these Terms and Conditions.
                </p>
                
                <h3 className="font-bold mb-2">2. User Responsibilities</h3>
                <p className="mb-4">
                  You are responsible for maintaining the confidentiality of your wallet credentials and Wallet ID. Do not share your Wallet ID or private keys with anyone you do not trust. Magna Coders is not liable for any loss of funds due to unauthorized access resulting from user negligence.
                </p>

                <h3 className="font-bold mb-2">3. Virtual Currency</h3>
                <p className="mb-4">
                  Magna Coin (MC) is a virtual currency used exclusively within the Magna Coders ecosystem. It has no monetary value outside of this platform and cannot be exchanged for fiat currency unless explicitly authorized.
                </p>

                <h3 className="font-bold mb-2">4. Transactions</h3>
                <p className="mb-4">
                  All transactions are final. Please verify recipient details carefully before sending coins. We reserve the right to reverse transactions in case of technical errors or fraud.
                </p>

                <h3 className="font-bold mb-2">5. Termination</h3>
                <p className="mb-4">
                  We reserve the right to suspend or terminate your wallet if you violate these terms or engage in fraudulent activity.
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors mt-0.5 ${
                  hasReadTerms 
                    ? 'bg-[#E50914] border-[#E50914]' 
                    : (isDarkMode ? 'border-gray-600 bg-[#333]' : 'border-gray-300 bg-white')
                }`}>
                  {hasReadTerms && <Check size={14} className="text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={hasReadTerms}
                  onChange={(e) => setHasReadTerms(e.target.checked)}
                />
                <span className={`text-sm select-none ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  I have read and agree to the Magna Coin Wallet Terms and Conditions.
                </span>
              </label>

              <button 
                onClick={() => setStep('name')}
                disabled={!hasReadTerms}
                className="w-full py-3 px-4 bg-[#E50914] hover:bg-[#cc0812] text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Wallet Name
                </label>
                <input 
                  type="text" 
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  placeholder="e.g. Savings, Project Fund"
                  className={`w-full p-4 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#E50914] ${
                    isDarkMode 
                      ? 'bg-[#222] text-white placeholder-gray-600' 
                      : 'bg-gray-50 text-gray-900 placeholder-gray-400'
                  }`}
                  autoFocus
                  required
                />
                <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Give your wallet a unique name to easily identify it.
                </p>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setStep('terms')}
                  className={`flex-1 py-3 px-4 font-bold rounded-xl transition-all ${
                    isDarkMode 
                      ? 'bg-[#333] hover:bg-[#444] text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  Back
                </button>
                <button 
                  type="submit"
                  disabled={!walletName.trim() || isLoading}
                  className="flex-[2] py-3 px-4 bg-[#E50914] hover:bg-[#cc0812] text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Creating...' : 'Create Wallet'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
