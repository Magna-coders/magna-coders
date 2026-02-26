import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  MessageSquare, 
  Briefcase, 
  Settings, 
  GraduationCap, 
  BadgeCheck,
  ChevronRight,
  ChevronLeft,
  Plus,
  Search,
  BookOpen,
  Bot,
  Sun,
  Moon,
  Coins,
  LogOut,
  Mic
} from 'lucide-react';
import { NavItem } from './NavItem';

interface LeftPanelProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  closeMenu?: () => void;
  isMobile?: boolean;
  isSidebarExpanded?: boolean;
  setIsSidebarExpanded?: (expanded: boolean) => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

export default function LeftPanel({ 
  activeTab, 
  setActiveTab, 
  closeMenu, 
  isMobile,
  isSidebarExpanded = true,
  setIsSidebarExpanded,
  isDarkMode = false,
  toggleTheme
}: LeftPanelProps) {
  const router = useRouter();
  const [userName, setUserName] = React.useState('Loading...');
  const [userRole, setUserRole] = React.useState('Developer');
  const [userAvatar, setUserAvatar] = React.useState<string | null>(null);

  // Fetch user profile data
  React.useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Check both userId and userid for compatibility
        const userId = localStorage.getItem('userId') || localStorage.getItem('userid');
        const token = localStorage.getItem('accessToken');
        
        if (userId && token) {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/profile/${userId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            const profileData = result.data || result;
            
            setUserName(profileData.username || profileData.email?.split('@')[0] || 'User');
            setUserRole(profileData.role || 'Developer');
            setUserAvatar(profileData.avatar_url || null);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);
  
  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    if (closeMenu) closeMenu();
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const refreshToken = localStorage.getItem('refreshToken');
      
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Ensure local storage is cleared even if API fails
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      router.push('/login');
    }
  };

  // For now, use empty array - will be populated from backend later
  const groups: any[] = [];

  // Mobile Drawer Content
  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        {/* Navigation Menu */}
        <nav className="space-y-1 mb-6 mt-4">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'Dashboard'} 
            isMobile={isMobile} 
            isDarkMode={isDarkMode}
            onClick={() => handleNavClick('Dashboard')} 
          />
          <Link href="/builders" className="block">
            <NavItem 
              icon={<Users size={20} />} 
              label="Builders" 
              active={activeTab === 'Buiilders'} 
              isMobile={isMobile} 
              isDarkMode={isDarkMode}
              onClick={() => handleNavClick('Builders')} 
            />
          </Link>
          <Link href="/projects" className="block">
            <NavItem 
              icon={<FolderKanban size={20} />} 
              label="Projects" 
              badge="3" 
              active={activeTab === 'Projects'} 
              isMobile={isMobile} 
              isDarkMode={isDarkMode}
              onClick={() => handleNavClick('Projects')} 
            />
          </Link>
          <Link href="/messages" className="block">
            <NavItem 
              icon={<MessageSquare size={20} />} 
              label="Messages" 
              badge="12" 
              active={activeTab === 'Messages'} 
              isMobile={isMobile} 
              isDarkMode={isDarkMode}
              onClick={() => handleNavClick('Messages')} 
            />
          </Link>
          <Link href="/jobs" className="block">
            <NavItem 
              icon={<Briefcase size={20} />} 
              label="Opportunities" 
              active={activeTab === 'Opportunities'} 
              isMobile={isMobile} 
              isDarkMode={isDarkMode}
              onClick={() => handleNavClick('Opportunities')} 
            />
          </Link>
          <NavItem 
            icon={<Bot size={20} />} 
            label="Magna AI" 
            active={activeTab === 'Magna AI'} 
            isMobile={isMobile} 
            isDarkMode={isDarkMode}
            onClick={() => handleNavClick('Magna AI')} 
          />
          <Link href="/magna-coin" className="block">
            <NavItem 
              icon={<Coins size={20} />} 
              label="Magna Coin" 
              active={activeTab === 'Magna Coin'} 
              isMobile={isMobile} 
              isDarkMode={isDarkMode}
              onClick={() => handleNavClick('Magna Coin')} 
            />
          </Link>
        </nav>

        {/* Groups */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 px-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase">Your Groups</h4>
            <Link href="/messages?filter=groups" className="text-[#E50914] text-xs font-medium hover:underline">See All</Link>
          </div>
          <div className="space-y-1">
            {groups.map((group) => (
              <Link key={group.id} href={`/messages?id=${group.id}`} className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left group ${isDarkMode ? 'hover:bg-[#222]' : 'hover:bg-gray-50'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isDarkMode ? 'bg-[#222] text-gray-400 group-hover:bg-[#333]' : 'bg-gray-100 text-gray-500 group-hover:bg-white group-hover:shadow-sm'}`}>
                  <Users size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>{group.name}</h5>
                  <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{group.messages.length} messages</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Magna School */}
        <div className="mb-6">
          <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-[#2ECC71]/10 border-[#2ECC71]/20' : 'bg-gradient-to-br from-[#2ECC71]/10 to-[#2ECC71]/20 border-[#2ECC71]/20'}`}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#2ECC71] flex items-center justify-center text-white shadow-sm">
                <GraduationCap size={18} />
              </div>
              <div>
                <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>Magna School</h4>
                <p className={`text-xs leading-tight mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Upskill with top tech courses</p>
              </div>
            </div>
            <Link href="/magna-school" className={`block w-full py-2 rounded-lg text-xs font-bold shadow-sm transition-all text-center ${isDarkMode ? 'bg-[#2ECC71] text-white hover:bg-[#25a25a]' : 'bg-white text-[#2ECC71] hover:shadow-md'}`}>
              Start Learning
            </Link>
          </div>
        </div>

        {/* Verification Badge */}
        <div className="mb-6">
            <div className="bg-gradient-to-br from-[#E50914]/5 to-[#F4A261]/10 rounded-xl p-4 border border-[#E50914]/10">
              <div className="flex items-center gap-3 mb-2">
                <BadgeCheck size={20} className="text-[#E50914]" />
                <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>Get Verified</h4>
              </div>
              <p className={`text-xs mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Boost your credibility and unlock exclusive features.
              </p>
              <Link href="/get-verification" className="block w-full py-2 rounded-lg bg-[#E50914] text-white text-xs font-bold shadow-sm hover:bg-[#cc0812] transition-all text-center">
                Apply for Verification
              </Link>
            </div>
          </div>

          <nav className="space-y-1">
            <Link href="/settings" className="w-full block">
              <div className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${isDarkMode ? 'text-gray-400 hover:bg-[#222]' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Settings size={20} />
                <span className="text-sm font-medium">Settings</span>
              </div>
            </Link>
          </nav>
      </div>
    );
  }

  // Desktop Sidebar Content
  return (
    <aside className={`w-[88px] h-screen fixed left-0 top-0 border-r flex flex-col z-20 hidden md:flex transition-all duration-300 overflow-y-auto pb-10 ${
      isSidebarExpanded ? 'lg:w-[260px]' : 'lg:w-[88px]'
    } ${
      isDarkMode 
        ? 'bg-black border-[#E70008]/20' 
        : 'bg-white border-gray-100'
    }`}>
        {/* Top Branding */}
        <div className="p-6 relative">
          {/* Theme Toggle - Small, Top Left */}
          {toggleTheme && (
             <button 
               onClick={toggleTheme}
               className={`absolute top-2 left-6 p-1.5 rounded-full transition-colors z-40 ${
                 isDarkMode 
                   ? 'bg-[#222] text-[#F9E4AD] hover:bg-[#333]' 
                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
               }`}
             >
                {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
             </button>
          )}

          <Link href="/" className={`flex items-center gap-3 justify-center lg:justify-start transition-all duration-300 ${isSidebarExpanded ? 'mb-8' : 'mb-14'}`}>
            <div className="w-10 h-10 rounded-lg bg-black flex-shrink-0 flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[#E50914]">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className={`text-xl font-bold tracking-tight hidden ${isSidebarExpanded ? 'lg:block' : ''}`}>
              <span className="text-[#F4A261]">Magna</span>
              <span className="text-[#E50914]">Coders</span>
            </span>
          </Link>
          
          {/* Toggle Button */}
          {setIsSidebarExpanded && (
            <button 
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className={`absolute w-6 h-6 rounded-full flex items-center justify-center shadow-sm z-30 hidden lg:flex transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-black border border-[#E70008]/20 text-gray-400 hover:text-white' 
                  : 'bg-white border border-gray-200 text-gray-500 hover:text-[#E50914]'
              } ${
                isSidebarExpanded 
                  ? 'top-8 right-4' 
                  : 'top-20 left-1/2 -translate-x-1/2'
              }`}
            >
              {isSidebarExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
          )}

          {/* User Profile Card */}
          <div className={`flex items-center gap-3 p-0 rounded-xl mb-6 justify-center ${
            isSidebarExpanded 
              ? isDarkMode 
                ? 'lg:justify-start lg:p-3 lg:bg-[#111]' 
                : 'lg:justify-start lg:p-3 lg:bg-gray-50' 
              : 'lg:justify-center'
          }`}>
            <div className="relative flex-shrink-0">
              {userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt={userName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F4A261] to-[#E50914] flex items-center justify-center text-white font-bold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#2ECC71] border-2 border-white rounded-full"></div>
            </div>
            <div className={`flex-1 min-w-0 hidden ${isSidebarExpanded ? 'lg:block' : ''}`}>
              <h3 className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>{userName}</h3>
              <p className="text-xs text-gray-500 truncate">{userRole}</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            <Link href="/feed">
              <div className={`relative w-full flex items-center justify-center ${isSidebarExpanded ? 'lg:justify-between px-2 lg:px-4' : 'lg:justify-center px-0'} py-3 rounded-full transition-all text-sm font-medium cursor-pointer ${activeTab === 'Dashboard' ? 'bg-[#E50914] text-white shadow-md' : isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <LayoutDashboard size={20} />
                  <span className={`hidden ${isSidebarExpanded ? 'lg:block' : ''}`}>Dashboard</span>
                </div>
              </div>
            </Link>
            <Link href="/builders">
              <div className={`relative w-full flex items-center justify-center ${isSidebarExpanded ? 'lg:justify-between px-2 lg:px-4' : 'lg:justify-center px-0'} py-3 rounded-full transition-all text-sm font-medium cursor-pointer ${activeTab === 'Members' ? 'bg-[#E50914] text-white shadow-md' : isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <Users size={20} />
                  <span className={`hidden ${isSidebarExpanded ? 'lg:block' : ''}`}>Members</span>
                </div>
              </div>
            </Link>
            <Link href="/projects">
              <div className={`relative w-full flex items-center justify-center ${isSidebarExpanded ? 'lg:justify-between px-2 lg:px-4' : 'lg:justify-center px-0'} py-3 rounded-full transition-all text-sm font-medium cursor-pointer ${activeTab === 'Projects' ? 'bg-[#E50914] text-white shadow-md' : isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <FolderKanban size={20} />
                  <span className={`hidden ${isSidebarExpanded ? 'lg:block' : ''}`}>Projects</span>
                </div>
                <span className={`hidden w-5 h-5 bg-[#F4A261] text-white text-[10px] font-bold rounded-full items-center justify-center ${isSidebarExpanded ? 'lg:flex' : ''}`}>3</span>
              </div>
            </Link>
            <Link href="/messages">
              <div className={`relative w-full flex items-center justify-center ${isSidebarExpanded ? 'lg:justify-between px-2 lg:px-4' : 'lg:justify-center px-0'} py-3 rounded-full transition-all text-sm font-medium cursor-pointer ${activeTab === 'Messages' ? 'bg-[#E50914] text-white shadow-md' : isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <MessageSquare size={20} />
                  <span className={`hidden ${isSidebarExpanded ? 'lg:block' : ''}`}>Messages</span>
                </div>
                <span className={`hidden w-5 h-5 bg-[#E50914] text-white text-[10px] font-bold rounded-full items-center justify-center ${isSidebarExpanded ? 'lg:flex' : ''}`}>12</span>
              </div>
            </Link>
            <Link href="/jobs">
              <div className={`relative w-full flex items-center justify-center ${isSidebarExpanded ? 'lg:justify-between px-2 lg:px-4' : 'lg:justify-center px-0'} py-3 rounded-full transition-all text-sm font-medium cursor-pointer ${activeTab === 'Opportunities' ? 'bg-[#E50914] text-white shadow-md' : isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <Briefcase size={20} />
                  <span className={`hidden ${isSidebarExpanded ? 'lg:block' : ''}`}>Opportunities</span>
                </div>
              </div>
            </Link>
            <Link href="/magna-ai">
              <div className={`relative w-full flex items-center justify-center ${isSidebarExpanded ? 'lg:justify-between px-2 lg:px-4' : 'lg:justify-center px-0'} py-3 rounded-full transition-all text-sm font-medium cursor-pointer ${activeTab === 'Magna AI' ? 'bg-[#E50914] text-white shadow-md' : isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`} onClick={() => handleNavClick('Magna AI')}>
                <div className="flex items-center gap-3">
                  <Bot size={20} />
                  <span className={`hidden ${isSidebarExpanded ? 'lg:block' : ''}`}>Magna AI</span>
                </div>
              </div>
            </Link>
            <Link href="/magna-coin">
              <div className={`relative w-full flex items-center justify-center ${isSidebarExpanded ? 'lg:justify-between px-2 lg:px-4' : 'lg:justify-center px-0'} py-3 rounded-full transition-all text-sm font-medium cursor-pointer ${activeTab === 'Magna Coin' ? 'bg-[#E50914] text-white shadow-md' : isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`} onClick={() => handleNavClick('Magna Coin')}>
                <div className="flex items-center gap-3">
                  <Coins size={20} />
                  <span className={`hidden ${isSidebarExpanded ? 'lg:block' : ''}`}>Magna Coin</span>
                </div>
              </div>
            </Link>
            <Link href="/magna-podcast">
              <div className={`relative w-full flex items-center justify-center ${isSidebarExpanded ? 'lg:justify-between px-2 lg:px-4' : 'lg:justify-center px-0'} py-3 rounded-full transition-all text-sm font-medium cursor-pointer ${activeTab === 'Magna Podcast' ? 'bg-[#E50914] text-white shadow-md' : isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`} onClick={() => handleNavClick('Magna Podcast')}>
                <div className="flex items-center gap-3">
                  <Mic size={20} />
                  <span className={`hidden ${isSidebarExpanded ? 'lg:block' : ''}`}>Magna Podcast</span>
                </div>
              </div>
            </Link>
          </nav>

          {/* Quick Actions */}
          <div className={`mt-6 hidden ${isSidebarExpanded ? 'lg:block' : ''}`}>
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 px-2">Quick Actions</h4>
            <div className="space-y-3">
              <Link href="/create-post" className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-[#F4A261] to-[#E50914] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                <Plus size={18} />
                Create Post
              </Link>
              <button className="w-full py-2.5 px-4 rounded-full bg-white border border-gray-200 text-black text-sm font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                <Search size={18} />
                Find Collaborators
              </button>
              <button className="w-full py-2.5 px-4 rounded-full bg-white border border-gray-200 text-black text-sm font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                <BookOpen size={18} />
                Resources
              </button>
            </div>
          </div>

          {/* Groups */}
          <div className={`mt-6 hidden ${isSidebarExpanded ? 'lg:block' : ''}`}>
            <div className="flex items-center justify-between mb-3 px-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase">Your Groups</h4>
              <Link href="/messages?filter=groups" className="text-[#E50914] text-xs font-medium hover:underline">See All</Link>
            </div>
            <div className="space-y-1">
              {groups.map((group) => (
                <Link key={group.id} href={`/messages?id=${group.id}`} className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left group ${isDarkMode ? 'hover:bg-[#222]' : 'hover:bg-gray-50'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isDarkMode ? 'bg-[#222] text-gray-400 group-hover:bg-[#333]' : 'bg-gray-100 text-gray-500 group-hover:bg-white group-hover:shadow-sm'}`}>
                    <Users size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>{group.name}</h5>
                    <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{group.messages.length} messages</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Magna School */}
          <div className={`mt-6 hidden ${isSidebarExpanded ? 'lg:block' : ''}`}>
            <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-[#2ECC71]/10 border-[#2ECC71]/20' : 'bg-gradient-to-br from-[#2ECC71]/10 to-[#2ECC71]/20 border-[#2ECC71]/20'}`}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#2ECC71] flex items-center justify-center text-white shadow-sm">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>Magna School</h4>
                  <p className={`text-xs leading-tight mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Upskill with top tech courses</p>
                </div>
              </div>
              <Link href="/magna-school" className={`block w-full py-2 rounded-lg text-xs font-bold shadow-sm transition-all text-center ${isDarkMode ? 'bg-[#2ECC71] text-white hover:bg-[#25a25a]' : 'bg-white text-[#2ECC71] hover:shadow-md'}`}>
                Start Learning
              </Link>
            </div>
          </div>

          {/* Verification Badge */}
          <div className={`mt-6 mb-6 hidden ${isSidebarExpanded ? 'lg:block' : ''}`}>
            <div className="bg-gradient-to-br from-[#E50914]/5 to-[#F4A261]/10 rounded-xl p-4 border border-[#E50914]/10">
              <div className="flex items-center gap-3 mb-2">
                <BadgeCheck size={20} className="text-[#E50914]" />
                <h4 className="font-bold text-black text-sm">Get Verified</h4>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Boost your credibility and unlock exclusive features.
              </p>
              <Link href="/get-verification" className="block w-full py-2 rounded-lg bg-[#E50914] text-white text-xs font-bold shadow-sm hover:bg-[#cc0812] transition-all text-center">
                Apply for Verification
              </Link>
            </div>
          </div>

          <nav className="space-y-1">
            <Link href="/settings" className="w-full block">
              <div className={`relative w-full flex items-center justify-center ${isSidebarExpanded ? 'lg:justify-between px-2 lg:px-4' : 'lg:justify-center px-0'} py-3 rounded-full transition-all text-sm font-medium cursor-pointer ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <Settings size={20} />
                  <span className={`hidden ${isSidebarExpanded ? 'lg:block' : ''}`}>Settings</span>
                </div>
              </div>
            </Link>
            <button onClick={handleLogout} className="w-full block text-left">
              <div className={`relative w-full flex items-center justify-center ${isSidebarExpanded ? 'lg:justify-between px-2 lg:px-4' : 'lg:justify-center px-0'} py-3 rounded-full transition-all text-sm font-medium cursor-pointer text-[#E50914] hover:bg-[#E50914]/10`}>
                <div className="flex items-center gap-3">
                  <LogOut size={20} />
                  <span className={`hidden ${isSidebarExpanded ? 'lg:block' : ''}`}>Log Out</span>
                </div>
              </div>
            </button>
          </nav>
        </div>

        {/* Tablet Quick Actions (Icons only) */}
        <div className={`px-2 mt-4 pb-8 flex flex-col items-center gap-4 ${isSidebarExpanded ? 'lg:hidden' : 'lg:flex'}`}>
            <button className="w-10 h-10 rounded-full bg-gradient-to-r from-[#F4A261] to-[#E50914] text-white flex items-center justify-center shadow-md">
              <Plus size={20} />
            </button>
            
            {/* Tablet Groups Icon */}
            <button className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 hover:text-[#E50914] hover:bg-white hover:shadow-sm transition-all flex items-center justify-center">
              <Users size={20} />
            </button>

            {/* Tablet School Icon */}
            <Link href="/magna-school" className="w-10 h-10 rounded-xl bg-[#2ECC71]/10 text-[#2ECC71] hover:shadow-sm transition-all flex items-center justify-center">
              <GraduationCap size={20} />
            </Link>

            {/* Tablet Verification Icon */}
            <Link href="/get-verification" className="w-10 h-10 rounded-xl bg-[#E50914]/10 text-[#E50914] hover:shadow-sm transition-all flex items-center justify-center">
              <BadgeCheck size={20} />
            </Link>
        </div>
      </aside>
  );
}