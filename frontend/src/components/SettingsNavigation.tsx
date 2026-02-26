import React from 'react';
import { ChevronRight } from 'lucide-react';
import { settingsModules } from '@/app/settings/data';

interface SettingsNavigationProps {
  activeModule: string;
  setActiveModule: (id: string) => void;
  isDarkMode: boolean;
  getModuleContent: (id: string) => React.ReactNode;
}

export default function SettingsNavigation({ activeModule, setActiveModule, isDarkMode, getModuleContent }: SettingsNavigationProps) {
  return (
    <div className="w-full lg:w-64 flex-shrink-0">
      <div className={`rounded-[24px] shadow-sm overflow-hidden sticky top-8 ${isDarkMode ? 'bg-[#111] border border-[#E70008]/20' : 'bg-white'}`}>
        <div className="p-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 px-2">General</h3>
          <nav className="space-y-1">
            {settingsModules.map((module) => (
              <div key={module.id} className="flex flex-col">
                <button
                  onClick={() => setActiveModule(activeModule === module.id ? '' : module.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeModule === module.id
                      ? 'bg-[#E50914]/10 text-[#E50914]'
                      : isDarkMode ? 'text-[#F4A261] hover:bg-[#222]' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {module.icon}
                  {module.label}
                  <ChevronRight 
                    size={16} 
                    className={`ml-auto opacity-50 transition-transform duration-200 ${
                      activeModule === module.id ? 'rotate-90 lg:rotate-0' : ''
                    }`} 
                  />
                </button>

                {/* Mobile Accordion Content */}
                <div className={`lg:hidden grid transition-all duration-300 ease-in-out ${
                  activeModule === module.id ? 'grid-rows-[1fr] opacity-100 mt-2 mb-4' : 'grid-rows-[0fr] opacity-0'
                }`}>
                  <div className="overflow-hidden">
                    {activeModule === module.id && getModuleContent(module.id)}
                  </div>
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
