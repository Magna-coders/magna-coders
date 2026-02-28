import React, { useState } from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';

export function InputField({ label, type = "text", value, defaultValue, placeholder, isDarkMode, onChange, name, disabled }: { label: string; type?: string; value?: string; defaultValue?: string; placeholder?: string; isDarkMode?: boolean; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; name?: string; disabled?: boolean }) {
  return (
    <div className="space-y-2">
      <label className={`text-sm font-semibold ${isDarkMode ? 'text-[#F4A261]' : 'text-gray-700'}`}>{label}</label>
      <input 
        name={name}
        type={type}  
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-3 rounded-xl border focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] focus:outline-none transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
          isDarkMode ? 'bg-[#222] border-gray-700 text-[#F4A261] placeholder-gray-600' : 'bg-gray-50 border-gray-100 text-black'
        }`}
      />
    </div>
  );
}

export function Button({ children, primary, icon, isDarkMode, onClick, type = "button", disabled }: { children: React.ReactNode; primary?: boolean; icon?: React.ReactNode; isDarkMode?: boolean; onClick?: () => void; type?: "button" | "submit" | "reset"; disabled?: boolean }) {
  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 rounded-full text-sm font-semibold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
      primary 
        ? 'bg-[#E50914] text-white hover:bg-[#cc0812] shadow-md' 
        : isDarkMode 
          ? 'bg-transparent border border-gray-700 text-gray-300 hover:bg-[#222]' 
          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
    }`}>
      {icon}
      {children}
    </button>
  );
}

export function ToggleRow({ title, description, defaultChecked, isDarkMode }: { title: string; description: string; defaultChecked?: boolean; isDarkMode?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked || false);
  return (
    <div className={`flex items-center justify-between py-4 first:pt-0 ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
      <div>
        <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{title}</h4>
        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{description}</p>
      </div>
      <button 
        onClick={() => setChecked(!checked)}
        className={`transition-colors ${checked ? 'text-[#E50914]' : isDarkMode ? 'text-gray-600' : 'text-gray-300'}`}
      >
        {checked ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
      </button>
    </div>
  );
}

export function ThemeCard({ icon, label, active, isDarkMode, onClick }: { icon: React.ReactNode; label: string; active?: boolean; isDarkMode?: boolean; onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-xl border flex flex-col items-center gap-3 cursor-pointer transition-all ${
      active 
        ? 'border-[#E50914] bg-[#E50914]/5 text-[#E50914]' 
        : isDarkMode 
          ? 'border-gray-700 bg-[#222] text-gray-400 hover:bg-[#333]' 
          : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
    }`}>
      {icon}
      <span className="text-xs font-bold">{label}</span>
    </div>
  );
}

export function ColorSwatch({ color, active, onClick }: { color: string; active?: boolean; onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`w-10 h-10 rounded-full cursor-pointer flex items-center justify-center transition-transform hover:scale-110 ${active ? 'ring-2 ring-offset-2 ring-gray-300' : ''}`}
      style={{ backgroundColor: color }}
    >
      {active && <div className="w-3 h-3 bg-white rounded-full opacity-50"></div>}
    </div>
  );
}
