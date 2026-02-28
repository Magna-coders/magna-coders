import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';

const LOGOS = {
  stripe: (
    <svg viewBox="0 0 60 25" className="h-6 w-auto" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.55 1.1c-4.85 0-6.83-2.5-6.83-6.35 0-4.81 2.87-9.39 8.16-9.39 4.2 0 5.42 2.74 5.42 7.24 0 .73-.03 1.77-.11 2.48zM56.23 9.7a3.1 3.1 0 0 0-3.04 1.87h6.05c0-1.25-.47-1.87-3.01-1.87zM43.08 4.79h4.3v15.17h-4.3zM45.23.47c1.35 0 2.45 1.05 2.45 2.34 0 1.29-1.1 2.34-2.45 2.34-1.36 0-2.46-1.05-2.46-2.34 0-1.29 1.1-2.34 2.46-2.34zM33.48 4.79h4.32v15.17h-4.32V10.7c0-2.3 1.5-3.35 2.84-3.35.43 0 .86.04 1.27.11V3.46c-.53-.1-1.03-.15-1.5-.15-2.03 0-3.26 1.14-3.9 2.5l-.04-.04v-1.1h-4.17zM26.32 17.5l-4.52-1.34V4.79h4.52v12.71zM14.65 14.85c0-1.9 1.4-2.4 2.62-2.4 1.53 0 3.02.48 4.2.97V9.75c-1.1-.42-2.5-.68-3.75-.68-3.7 0-6.73 1.9-6.73 5.8 0 5.46 7.5 4.56 7.5 6.9 0 .88-.8 1.34-2.02 1.34-1.6 0-3.4-.64-4.73-1.3v3.7c1.3.56 3.06.87 4.57.87 4.14 0 6.62-2.03 6.62-5.78 0-5.83-7.5-4.8-7.5-7.06zM7.16 4.79h4.4v15.17h-4.4zM9.36.47c1.36 0 2.46 1.05 2.46 2.34 0 1.29-1.1 2.34-2.46 2.34C8 5.15 6.9 4.1 6.9 2.8c0-1.29 1.1-2.34 2.46-2.34zM3.4 17.5l-4.5-1.34V.61L3.4 1.95v15.55z" />
    </svg>
  ),
  paypal: (
    <svg viewBox="0 0 120 32" className="h-6 w-auto" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
       <path d="M10.16 5.926l-.168 1.065h4.156c3.484 0 5.56 1.766 5.56 5.253 0 3.93-3.084 6.273-7.03 6.273h-2.14l-1.05 6.63h-3.66l2.36-14.92c.22-1.355 1.434-2.367 2.775-2.367h1.973zm-6.2 16.59l-.92 5.82H2.155l2.766-17.53c.22-1.355 1.434-2.367 2.775-2.367H11.5c.348 0 .684.025 1.01.07l-2.04 12.94c-.22 1.355-1.434 2.367-2.775 2.367H6.736zM32.8 13.065c-.585-2.483-2.61-3.65-5.32-3.65h-2.19l-2.12 13.43h3.768l.58-3.676h.63c2.71 0 4.88-1.17 5.26-3.65.11-.707.09-1.45-.06-2.17l-.55-2.28zm-2.46 1.63c-.15 1.01-.98 1.63-2.23 1.63h-.63l.79-5.01h.63c1.25 0 2.22.61 2.37 1.62.06.41.04.83-.07 1.23l-.86 3.03zM54.55 9.415l-2.15 13.65h-3.61l1.32-8.35-2.61 8.35h-3.95l-1.85-8.88-.93 5.89-1.05 6.63h-3.66l2.76-17.53h3.8l2.12 10.22 3.05-10.22h3.9l2.87-3.23zM67.88 9.415h-5.9l-.5 3.16h2.24c1.94 0 3.28.94 3.01 2.65l-.04.25h-3.4c-2.48 0-3.67 1.25-3.95 2.99-.25 1.58.55 2.83 2.5 2.83h1.7l-.46 2.94h3.66l2.12-13.43c.22-1.36-.82-1.39-1.36-1.39h.38zm-3.07 8.32h.38l-.6 3.81h-.4c-.75 0-1.04-.45-.94-1.06.11-.69.83-2.75 1.56-2.75zM81.56 3.558h-3.76l-4.48 21.14h3.76l4.48-21.14z"/>
    </svg>
  ),
  mpesa: (
    <svg viewBox="0 0 100 40" className="h-8 w-auto" xmlns="http://www.w3.org/2000/svg">
      <text x="5" y="30" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="32" fill="#000">M-</text>
      <text x="45" y="30" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="32" fill="#43B02A">PESA</text>
    </svg>
  )
};

export default function PaymentMethodSettings({ isDarkMode }: { isDarkMode?: boolean }) {
  const [isCreating, setIsCreating] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        setPaymentMethods(methods);
      }
    } catch (error) {
      console.error('Failed to fetch payment methods', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handleCreatePaymentMethod = async (type: 'card' | 'mpesa' | 'paypal' | 'stripe') => {
    setIsCreating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE;
      if (!apiUrl) throw new Error('API URL is not defined');
      if (!token) throw new Error('Not authenticated');

      // Mock payload based on type
      let payload;
      
      switch (type) {
        case 'mpesa':
          payload = {
            amount: 0,
            currency: "kes",
            paymentMethodId: "pm_mpesa_mock",
            description: "M-Pesa Account"
          };
          break;
        case 'paypal':
          payload = {
            amount: 0,
            currency: "usd",
            paymentMethodId: "pm_paypal_mock",
            description: "PayPal Account"
          };
          break;
        case 'stripe':
          payload = {
            amount: 0,
            currency: "usd",
            paymentMethodId: "pm_card_visa",
            description: "Stripe Card"
          };
          break;
        case 'card':
        default:
          payload = {
            amount: 0,
            currency: "usd",
            paymentMethodId: "pm_card_visa",
            description: "Credit Card"
          };
          break;
      }

      const response = await fetch(`${apiUrl}/integrations/payments/create`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to create payment method');
      }
      
      const data = await response.json();
      alert(`Payment method (${type}) added successfully!`);
      console.log('Payment created:', data);
      await fetchPaymentMethods();
    } catch (error: any) {
      console.error('Payment creation error:', error);
      alert(error.message || 'Failed to create payment method');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={`lg:rounded-[24px] lg:p-8 lg:shadow-sm ${isDarkMode ? 'lg:bg-[#111] lg:border lg:border-[#E70008]/20' : 'lg:bg-white'}`}>
      <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Payment Method</h2>
      
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className={`animate-spin ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
        ) : paymentMethods.length > 0 ? (
          paymentMethods.map((method: any, index: number) => (
            <div key={method.id || index} className={`p-4 border rounded-xl flex items-center justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-8 rounded flex items-center justify-center text-xs font-bold uppercase ${isDarkMode ? 'bg-[#222] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                      {method.brand || method.type || 'CARD'}
                    </div>
                    <div>
                        <p className={`text-sm font-bold ${isDarkMode ? 'text-[#F4A261]' : 'text-gray-800'}`}>•••• •••• •••• {method.last4 || '****'}</p>
                        <p className="text-xs text-gray-500">Expires {method.exp_month || 'MM'}/{method.exp_year?.toString().slice(-2) || 'YY'}</p>
                    </div>
                </div>
                <button className="text-xs font-bold text-red-500 hover:underline">Remove</button>
            </div>
          ))
        ) : (
          <div className={`text-center py-4 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            No payment methods added yet.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button 
            onClick={() => handleCreatePaymentMethod('stripe')}
            disabled={isCreating}
            className={`py-3 px-4 rounded-xl border font-bold text-sm transition-colors flex flex-col items-center justify-center gap-2 ${
            isDarkMode 
              ? 'border-gray-700 bg-[#111] text-gray-400 hover:border-[#635BFF] hover:text-[#635BFF]' 
              : 'border-gray-200 bg-white text-gray-600 hover:border-[#635BFF] hover:text-[#635BFF]'
          }`}>
            <svg viewBox="0 0 60 25" className="h-6 w-auto fill-current">
              <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.55 1.1c-4.85 0-6.83-2.5-6.83-6.35 0-4.89 2.92-8.25 7.54-8.25 4.87 0 5.46 4.83 4.65 8.58zm-4.65-5.32c-1.3-.01-2.48.56-2.94 1.95h5.53c.06-1.57-.96-1.95-2.59-1.95zM42.34 6.13h-4.32v13.88h4.32V6.13zm-2.03-5.07c1.37 0 2.27.88 2.27 2.18 0 1.29-.9 2.18-2.27 2.18a2.2 2.2 0 0 1-2.26-2.18c0-1.3.9-2.18 2.26-2.18zm-7.66 18.95h-4.32v-8.3c0-1.89-.5-2.59-1.8-2.59-1.38 0-2.43.76-2.98 1.87v9.02h-4.32V6.13h4.15v2.1c.9-1.37 2.4-2.48 4.64-2.48 2.93 0 4.63 1.83 4.63 5.37v8.89zM10.74 13.9c-.06 2.77-1.74 3.03-3.08 3.03-1.18 0-2.17-.3-2.9-.76v-3.72h5.98zm-5.98-2.43c0-1.79 1.43-2.67 3.23-2.67 1.82 0 2.7.94 2.74 2.67H4.76zm9.32 8.54V17.8c-.85 1.48-2.6 2.52-4.93 2.52-4.14 0-7.07-3-7.07-7.25 0-4.22 3.12-7.31 7.22-7.31 2.37 0 4.05 1.05 4.87 2.5V6.13h4.32v13.88h-4.4z"/>
            </svg>
            {isCreating ? <Loader2 size={16} className="animate-spin" /> : 'Stripe'}
          </button>

          <button 
            onClick={() => handleCreatePaymentMethod('mpesa')}
            disabled={isCreating}
            className={`py-3 px-4 rounded-xl border font-bold text-sm transition-colors flex flex-col items-center justify-center gap-2 ${
            isDarkMode 
              ? 'border-gray-700 bg-[#111] text-gray-400 hover:border-[#43B02A] hover:text-[#43B02A]' 
              : 'border-gray-200 bg-white text-gray-600 hover:border-[#43B02A] hover:text-[#43B02A]'
          }`}>
            <svg viewBox="0 0 100 40" className="h-8 w-auto">
               <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="24" fill="currentColor">M-PESA</text>
            </svg>
            {isCreating ? <Loader2 size={16} className="animate-spin" /> : 'M-Pesa'}
          </button>

          <button 
            onClick={() => handleCreatePaymentMethod('paypal')}
            disabled={isCreating}
            className={`py-3 px-4 rounded-xl border font-bold text-sm transition-colors flex flex-col items-center justify-center gap-2 ${
            isDarkMode 
              ? 'border-gray-700 bg-[#111] text-gray-400 hover:border-[#003087] hover:text-[#003087]' 
              : 'border-gray-200 bg-white text-gray-600 hover:border-[#003087] hover:text-[#003087]'
          }`}>
            <svg viewBox="0 0 24 24" className="h-6 w-auto fill-current">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.946 5.05-4.336 6.7-8.326 6.7H9.14c-.309 0-.587.219-.637.53l-1.427 7.573z"/>
            </svg>
            {isCreating ? <Loader2 size={16} className="animate-spin" /> : 'PayPal'}
          </button>
        </div>
      </div>
    </div>
  );
}
