'use client';

import React, { useState, useEffect } from 'react';
import { X, Wallet, Send, User, Users, Search, Check } from 'lucide-react';

interface Friend {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
}

interface SendCoinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (amount: number, recipientId: string, note: string) => Promise<void>;
  isDarkMode?: boolean;
  balance?: number;
  walletName?: string;
  wallets?: Array<{ id: string; name: string; balance: number }>;
}

type RecipientMode = 'manual' | 'friend' | 'self';

export default function SendCoinsModal({ 
  isOpen, 
  onClose, 
  onSend,
  isDarkMode = false,
  balance = 2500,
  walletName = 'Main Wallet',
  wallets = []
}: SendCoinsModalProps) {
  const [mode, setMode] = useState<RecipientMode>('manual');
  const [amount, setAmount] = useState<string>('');
  const [recipientId, setRecipientId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  
  const currentBalance = balance;

  // Fetch friends from API when in friend mode
  useEffect(() => {
    if (mode === 'friend' && friends.length === 0) {
      fetchFriends();
    }
  }, [mode]);

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      // Check both userId and userid for compatibility
      const userId = localStorage.getItem('userId') || localStorage.getItem('userid');
      
      if (!userId) {
        console.warn('No user ID found');
        return;
      }

      const response = await fetch(`${apiUrl}/api/social/following/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFriends(data.map((user: any) => ({
          id: user.id,
          name: user.username || 'Unknown',
          username: user.username,
          avatar: user.avatar_url
        })));
      }
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    } finally {
      setLoadingFriends(false);
    }
  }; 

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseInt(amount, 10);
    if (value > 0 && value <= currentBalance && recipientId) {
      setIsLoading(true);
      try {
        await onSend(value, recipientId, note);
        // Reset form
        setAmount('');
        setRecipientId('');
        setNote('');
        setMode('manual');
        onClose();
      } catch (error) {
        console.error('Failed to send coins', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const filteredFriends = friends.filter(friend => 
    friend.name.toLowerCase().includes(friendSearch.toLowerCase()) || 
    friend.username?.toLowerCase().includes(friendSearch.toLowerCase())
  );

  const selectFriend = (friend: Friend) => {
    setRecipientId(friend.username || friend.id.toString());
    setMode('manual'); // Switch back to manual view to show selected recipient
  };

  const selectWallet = (wallet: { id: string; name: string }) => {
    setRecipientId(wallet.id);
    setMode('manual');
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
      <div className={`relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl transform transition-all flex flex-col max-h-[90vh] ${isDarkMode ? 'bg-[#111] border border-[#E70008]/20' : 'bg-white'}`}>
        
        {/* Header */}
        <div className={`p-4 flex items-center justify-between flex-shrink-0 ${isDarkMode ? 'border-b border-[#333]' : 'border-b border-gray-100'}`}>
          <h2 className={`font-bold text-lg ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Send Magna Coins</h2>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-[#222] text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {/* Tabs */}
          <div className={`flex p-1 rounded-xl mb-6 ${isDarkMode ? 'bg-[#222]' : 'bg-gray-100'}`}>
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                mode === 'manual'
                  ? (isDarkMode ? 'bg-[#333] text-white shadow-sm' : 'bg-white text-black shadow-sm')
                  : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black')
              }`}
            >
              <User size={16} />
              Direct Input
            </button>
            <button
              onClick={() => setMode('friend')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                mode === 'friend'
                  ? (isDarkMode ? 'bg-[#333] text-white shadow-sm' : 'bg-white text-black shadow-sm')
                  : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black')
              }`}
            >
              <Users size={16} />
              Select Friend
            </button>
            <button
              onClick={() => setMode('self')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                mode === 'self'
                  ? (isDarkMode ? 'bg-[#333] text-white shadow-sm' : 'bg-white text-black shadow-sm')
                  : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black')
              }`}
            >
              <Wallet size={16} />
              My Wallets
            </button>
          </div>

          {mode === 'manual' ? (
            <>
              {/* Balance Display */}
              <div className={`mb-6 p-4 rounded-2xl flex items-center justify-between ${isDarkMode ? 'bg-[#222]' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${isDarkMode ? 'bg-[#333] text-[#E50914]' : 'bg-white text-[#E50914] shadow-sm'}`}>
                    <Wallet size={24} />
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Current Balance</p>
                    <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{currentBalance.toLocaleString()} MC</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Recipient (Wallet ID or Username)
                  </label>
                  <input 
                    type="text" 
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    placeholder="e.g. user123 or wallet-xyz"
                    className={`w-full p-4 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#E50914] ${
                      isDarkMode 
                        ? 'bg-[#222] text-white placeholder-gray-600' 
                        : 'bg-gray-50 text-gray-900 placeholder-gray-400'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Amount to Send
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      min="1"
                      max={currentBalance}
                      className={`w-full p-4 pr-12 rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#E50914] ${
                        isDarkMode 
                          ? 'bg-[#222] text-white placeholder-gray-600' 
                          : 'bg-gray-50 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#E50914] font-bold">MC</span>
                  </div>
                  {parseInt(amount) > currentBalance && (
                    <p className="text-red-500 text-xs mt-2">Insufficient balance</p>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Note (Optional)
                  </label>
                  <input 
                    type="text" 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What's this for?"
                    className={`w-full p-4 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#E50914] ${
                      isDarkMode 
                        ? 'bg-[#222] text-white placeholder-gray-600' 
                        : 'bg-gray-50 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={!amount || !recipientId || parseInt(amount) <= 0 || parseInt(amount) > currentBalance || isLoading}
                  className="w-full py-3 px-4 bg-[#E50914] hover:bg-[#cc0812] text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Sending...' : (
                    <>
                      <Send size={18} />
                      Send Coins
                    </>
                  )}
                </button>
              </form>
            </>
          ) : mode === 'friend' ? (
            <div className="flex flex-col h-[400px]">
              {/* Friend Search */}
              <div className="relative mb-4">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} size={18} />
                <input 
                  type="text" 
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  placeholder="Search friends..."
                  className={`w-full py-3 pl-10 pr-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E50914] ${
                    isDarkMode 
                      ? 'bg-[#222] text-white placeholder-gray-600' 
                      : 'bg-gray-50 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Friends List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {loadingFriends ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Loading friends...
                  </div>
                ) : filteredFriends.length > 0 ? (
                  filteredFriends.map(friend => (
                    <button
                      key={friend.id}
                      onClick={() => selectFriend(friend)}
                      className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                        isDarkMode 
                          ? 'hover:bg-[#222] border border-transparent hover:border-[#333]' 
                          : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                         {friend.avatar ? (
                           <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center bg-[#E50914] text-white font-bold">
                             {friend.name.charAt(0)}
                           </div>
                         )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{friend.name}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>@{friend.username || `user${friend.id}`}</p>
                      </div>
                      {recipientId === (friend.username || friend.id.toString()) && (
                        <Check size={18} className="text-[#E50914]" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    {friendSearch ? `No friends found matching "${friendSearch}"` : 'No friends yet. Start following people!'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-[400px]">
              {/* My Wallets List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {wallets && wallets.length > 0 ? (
                  wallets.map(wallet => (
                    <button
                      key={wallet.id}
                      onClick={() => selectWallet(wallet)}
                      className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                        isDarkMode 
                          ? 'hover:bg-[#222] border border-transparent hover:border-[#333]' 
                          : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isDarkMode ? 'bg-[#333] text-[#E50914]' : 'bg-gray-100 text-[#E50914]'
                      }`}>
                         <Wallet size={20} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{wallet.name}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          Balance: {wallet.balance.toLocaleString()} MC
                        </p>
                      </div>
                      {recipientId === wallet.id && (
                        <Check size={18} className="text-[#E50914]" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No other wallets available.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
