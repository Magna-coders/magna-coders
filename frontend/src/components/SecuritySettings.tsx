import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { InputField, Button } from './SettingsHelpers';
import AccountLinking from './AccountLinking';

export default function SecuritySettings({ isDarkMode }: { isDarkMode?: boolean }) {
  return (
    <div className={`lg:rounded-[24px] lg:p-8 lg:shadow-sm ${isDarkMode ? 'lg:bg-[#111] lg:border lg:border-[#E70008]/20' : 'lg:bg-white'}`}>
      <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Security</h2>
      <div className="space-y-6">
        <div className={`p-4 rounded-xl border mb-6 ${isDarkMode ? 'bg-orange-900/20 border-orange-900/30' : 'bg-orange-50 border-orange-100'}`}>
          <div className="flex gap-3">
            <ShieldCheck className="text-[#F4A261] flex-shrink-0" size={24} />
            <div>
              <h4 className={`font-bold text-sm ${isDarkMode ? 'text-orange-400' : 'text-orange-800'}`}>Two-Factor Authentication</h4>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-orange-300/70' : 'text-orange-700'}`}>Add an extra layer of security to your account.</p>
              <button className="mt-2 text-xs font-bold text-[#E50914] hover:underline">Enable 2FA</button>
            </div>
          </div>
        </div>

        <h3 className={`text-sm font-bold uppercase ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Account Security</h3>
        <AccountLinking isDarkMode={isDarkMode} />
        
        <h3 className={`text-sm font-bold uppercase ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Change Password</h3>
        <InputField label="Current Password" type="password" isDarkMode={isDarkMode} />
        <InputField label="New Password" type="password" isDarkMode={isDarkMode} />
        <InputField label="Confirm New Password" type="password" isDarkMode={isDarkMode} />
        
        <div className="pt-2">
          <Button primary isDarkMode={isDarkMode}>Update Password</Button>
        </div>
      </div>
    </div>
  );
}
