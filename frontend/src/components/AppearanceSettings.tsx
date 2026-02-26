import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { ThemeCard, ColorSwatch } from './SettingsHelpers';

export default function AppearanceSettings({ isDarkMode, toggleTheme }: { isDarkMode?: boolean; toggleTheme?: () => void }) {
  const [accentColor, setAccentColor] = useState('#E50914');

  const colors = [
    "#E50914", // Red
    "#F4A261", // Orange
    "#2ECC71", // Green
    "#3498DB", // Blue
    "#9B59B6"  // Purple
  ];

  useEffect(() => {
    const savedColor = localStorage.getItem('accentColor');
    if (savedColor) {
      setAccentColor(savedColor);
    }
  }, []);

  const handleColorChange = (color: string) => {
    setAccentColor(color);
    localStorage.setItem('accentColor', color);
    document.documentElement.style.setProperty('--primary-color', color);
    
    // Dispatch event for other components to listen to if needed
    window.dispatchEvent(new CustomEvent('accentColorChanged', { detail: { color } }));
  };

  return (
    <div className={`lg:rounded-[24px] lg:p-8 lg:shadow-sm ${isDarkMode ? 'lg:bg-[#111] lg:border lg:border-[#E70008]/20' : 'lg:bg-white'}`}>
      <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Appearance</h2>
      
      <div className="mb-8">
        <label className={`text-sm font-semibold block mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Theme</label>
        <div className="grid grid-cols-3 gap-4">
          <ThemeCard icon={<Sun size={24} />} label="Light" active={!isDarkMode} isDarkMode={isDarkMode} onClick={() => isDarkMode && toggleTheme && toggleTheme()} />
          <ThemeCard icon={<Moon size={24} />} label="Dark" active={isDarkMode} isDarkMode={isDarkMode} onClick={() => !isDarkMode && toggleTheme && toggleTheme()} />
          <ThemeCard icon={<Monitor size={24} />} label="System" isDarkMode={isDarkMode} />
        </div>
      </div>

      <div>
        <label className={`text-sm font-semibold block mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Accent Color</label>
        <div className="flex gap-4">
          {colors.map((color) => (
            <ColorSwatch 
              key={color} 
              color={color} 
              active={accentColor === color} 
              onClick={() => handleColorChange(color)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
