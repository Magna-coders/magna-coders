import React from 'react';
import { ToggleRow } from './SettingsHelpers';

export default function LocalDiscoverySettings({ isDarkMode }: { isDarkMode?: boolean }) {
  return (
    <div className={`lg:rounded-[24px] lg:p-8 lg:shadow-sm ${isDarkMode ? 'lg:bg-[#111] lg:border lg:border-[#E70008]/20' : 'lg:bg-white'}`}>
      <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Local Discovery</h2>
      
      <div className="space-y-8">
        <ToggleRow title="Enable Location" description="Allow us to use your location to find jobs and events near you." defaultChecked isDarkMode={isDarkMode} />
        
        <div>
          <div className="flex justify-between mb-2">
            <label className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Discovery Radius</label>
            <span className="text-sm font-bold text-[#E50914]">50 km</span>
          </div>
          <input type="range" className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#E50914] ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <div className={`flex justify-between mt-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <span>10 km</span>
            <span>500 km</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl h-48 flex items-center justify-center text-sm border border-dashed ${isDarkMode ? 'bg-[#222] border-gray-700 text-gray-500' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
          Map Preview Component
        </div>
      </div>
    </div>
  );
}
