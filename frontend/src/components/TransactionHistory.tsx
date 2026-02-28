import React from 'react';
import { History } from 'lucide-react';

export interface Transaction {
  type: string;
  amount: string;
  date: string;
  color: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  isDarkMode: boolean;
}

export default function TransactionHistory({ transactions, isDarkMode }: TransactionHistoryProps) {
  return (
    <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-[#111] border border-[#333]' : 'bg-white border border-gray-100'}`}>
      <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>
        <History size={18} className="text-[#E50914]" />
        Recent Transactions
      </h3>
      <div className="space-y-4">
        {transactions.map((tx, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div>
              <div className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{tx.type}</div>
              <div className="text-xs text-gray-500">{tx.date}</div>
            </div>
            <div className={`font-bold ${tx.color}`}>{tx.amount} MC</div>
          </div>
        ))}
      </div>
    </div>
  );
}
