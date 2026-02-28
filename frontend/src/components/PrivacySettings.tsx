import React from 'react';
import { ToggleRow } from './SettingsHelpers';

export default function PrivacySettings({ isDarkMode }: { isDarkMode?: boolean }) {
  return (
    <div className={`lg:rounded-[24px] lg:p-8 lg:shadow-sm ${isDarkMode ? 'lg:bg-[#111] lg:border lg:border-[#E70008]/20' : 'lg:bg-white'}`}>
      <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Privacy</h2>
      <div className={`space-y-6 divide-y ${isDarkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
        <div className="pt-4 first:pt-0">
          <label className={`text-sm font-semibold block mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Profile Visibility</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="visibility" className="text-[#E50914] focus:ring-[#E50914]" defaultChecked />
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Public</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="visibility" className="text-[#E50914] focus:ring-[#E50914]" />
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Private</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">Public profiles are visible to everyone.</p>
        </div>
        <ToggleRow title="Show Email Address" description="Allow others to see your email address." isDarkMode={isDarkMode} />
        <ToggleRow title="Allow Search Engines" description="Let search engines index your profile." defaultChecked isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}
