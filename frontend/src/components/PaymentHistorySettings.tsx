import React, { useState, useEffect } from 'react';
import { paymentHistoryData as mockHistory } from '@/app/settings/data';

export default function PaymentHistorySettings({ isDarkMode }: { isDarkMode?: boolean }) {
  const [history, setHistory] = useState(mockHistory);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE;
        if (!apiUrl) throw new Error('API URL is not defined');
        if (!token) return;

        const response = await fetch(`${apiUrl}/integrations/payments/history`, {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Assuming backend returns array of history items or { data: [] }
          const historyData = Array.isArray(data) ? data : (data.data || []);
          
          if (historyData.length > 0) {
            // Map backend data to frontend structure if needed
            // For now assuming backend returns compatible structure or using raw
            setHistory(historyData.map((item: any) => ({
              title: item.description || item.title || 'Payment',
              date: item.created_at ? new Date(item.created_at).toLocaleDateString() : item.date,
              invoice: item.invoice_id || item.invoice || 'INV-UNKNOWN',
              amount: item.amount_formatted || item.amount || '$0.00',
              status: item.status || 'Completed'
            })));
          }
        }
      } catch (error) {
        console.error('Failed to fetch payment history', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className={`rounded-[24px] p-6 md:p-8 shadow-sm ${isDarkMode ? 'bg-[#111] border border-[#E70008]/20' : 'bg-white'}`}>
      <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Payment History</h2>
      
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading history...</div>
      ) : (
      <div className="space-y-4">
        {history.map((item, i) => (
            <div key={i} className={`flex items-center justify-between p-4 rounded-xl ${isDarkMode ? 'bg-[#222]' : 'bg-gray-50'}`}>
                <div>
                    <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{item.title}</p>
                    <p className="text-xs text-gray-500">{item.date} • {item.invoice}</p>
                </div>
                <div className="text-right">
                    <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{item.amount}</p>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      isDarkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-600'
                    }`}>{item.status}</span>
                </div>
            </div>
        ))}
        {history.length === 0 && (
            <div className="text-center py-8 text-gray-500">No payment history found.</div>
        )}
      </div>
      )}
    </div>
  );
}
