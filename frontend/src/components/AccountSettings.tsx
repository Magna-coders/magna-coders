import React, { useState } from 'react';
import { Camera, Chrome, ChevronRight, Github, Loader2, Linkedin, Twitter, MessageCircle, RefreshCw } from 'lucide-react';
import { InputField, Button } from './SettingsHelpers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AccountSettings({ isDarkMode }: { isDarkMode?: boolean }) {
  const [isConnectingGitHub, setIsConnectingGitHub] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [isConnectingLinkedIn, setIsConnectingLinkedIn] = useState(false);
  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [isConnectingTwitter, setIsConnectingTwitter] = useState(false);
  const [twitterConnected, setTwitterConnected] = useState(false);
  const [isConnectingDiscord, setIsConnectingDiscord] = useState(false);
  const [discordConnected, setDiscordConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Profile Update State
  const [isSaving, setIsSaving] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    location: '',
    website: '',
    github: '',
    linkedin: '',
    twitter: '',
    instagram: '',
    whatsapp: ''
  });

  // Fetch initial profile data
  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Check both userId and userid for compatibility
        const userId = localStorage.getItem('userId') || localStorage.getItem('userid');
        const token = localStorage.getItem('accessToken');
        if (!userId || !token || !API_BASE) return;

        const response = await fetch(`${API_BASE}/api/auth/profile/${userId}`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          const data = result.data || result;
          
          // Set profile picture
          setProfilePicture(data.avatar_url || null);
          
          // Set username for display
          setUserName(data.username || data.email?.split('@')[0] || 'User');
          
          // Split full name if needed
          const fullName = data.name || data.username || '';
          const [firstName, ...lastNameParts] = fullName.split(' ');
          
          setFormData({
            username: data.username || '',
            firstName: firstName || '',
            lastName: lastNameParts.join(' ') || '',
            email: data.email || '',
            bio: data.bio || '',
            location: data.location || '',
            website: data.website_url || '',
            github: data.github_url || '',
            linkedin: data.linkedin_url || '',
            twitter: data.twitter_url || '',
            instagram: data.instagram_url || '',
            whatsapp: data.whatsapp_url || ''
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile', error);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setIsUploadingPicture(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token || !API_BASE) {
        alert('Authentication error');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/api/auth/profile/upload-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setProfilePicture(result.avatar_url);
        alert('Profile picture updated successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload profile picture');
      }
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      alert(error.message || 'Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Check both userId and userid for compatibility
      const userId = localStorage.getItem('userId') || localStorage.getItem('userid');
      const token = localStorage.getItem('accessToken');
      
      if (!userId || !token || !API_BASE) {
        alert('Authentication error');
        return;
      }

      const payload = {
        username: formData.username,
        bio: formData.bio,
        location: formData.location,
        website_url: formData.website,
        github_url: formData.github,
        linkedin_url: formData.linkedin,
        twitter_url: formData.twitter,
        instagram_url: formData.instagram,
        whatsapp_url: formData.whatsapp
      };

      const response = await fetch(`${API_BASE}/api/auth/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Profile updated successfully!');
        // Refresh the profile data
        window.location.reload();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  React.useEffect(() => {
    // Check for success/error query params from backend redirect
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const platform = urlParams.get('platform');
    const message = urlParams.get('message');

    if (status === 'success' && platform) {
      const setStateMap: Record<string, (val: boolean) => void> = {
        'github': setGithubConnected,
        'linkedin': setLinkedinConnected,
        'twitter': setTwitterConnected,
        'discord': setDiscordConnected
      };
      
      if (setStateMap[platform.toLowerCase()]) {
        setStateMap[platform.toLowerCase()](true);
        alert(`${platform} connected successfully!`);
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    } else if (status === 'error') {
      alert(`Failed to connect ${platform || 'account'}: ${message || 'Unknown error'}`);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleSync = async () => {
    alert('Social platform sync feature is coming soon!');
  };

  const handleDisconnect = async (platform: string) => {
    alert(`${platform} disconnect feature is coming soon!`);
  };

  const handleGitHubConnect = () => {
    alert('GitHub integration is coming soon!');
  };

  const handleLinkedInConnect = () => {
    alert('LinkedIn integration is coming soon!');
  };

  const handleTwitterConnect = () => {
    alert('Twitter integration is coming soon!');
  };

  const handleDiscordConnect = () => {
    alert('Discord integration is coming soon!');
  };

  return (
    <div className="space-y-6">
      <div className={`rounded-[24px] p-6 md:p-8 shadow-sm ${isDarkMode ? 'bg-[#111] border border-[#E70008]/20' : 'bg-white'}`}>
        <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-[#F4A261]' : 'text-black'}`}>Profile Information</h2>
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex flex-col items-center gap-4 mx-auto md:mx-0">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F4A261] to-[#E50914] flex items-center justify-center text-white font-bold text-3xl shadow-md relative overflow-hidden">
              {profilePicture ? (
                <img 
                  src={`${API_BASE}${profilePicture}`}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{userName.charAt(0).toUpperCase()}</span>
              )}
              <div 
                onClick={handleProfilePictureClick}
                className={`absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-colors border ${isDarkMode ? 'bg-[#222] border-gray-700 hover:bg-[#333]' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
              >
                <Camera size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button 
              onClick={handleProfilePictureClick}
              disabled={isUploadingPicture}
              className="text-sm font-semibold text-[#E50914] hover:text-[#cc0812] transition-colors disabled:opacity-50"
            >
              {isUploadingPicture ? 'Uploading...' : 'Change Photo'}
            </button>
          </div>
          <div className="flex-1 w-full space-y-6">
            <InputField label="Username" name="username" value={formData.username} onChange={handleInputChange} isDarkMode={isDarkMode} placeholder="Choose a unique username" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} isDarkMode={isDarkMode} />
              <InputField label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} isDarkMode={isDarkMode} />
            </div>
            <InputField label="Email Address" name="email" value={formData.email} type="email" disabled isDarkMode={isDarkMode} />
            <div className="space-y-2">
              <label className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Bio</label>
              <textarea 
                name="bio"
                rows={4}
                value={formData.bio}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] focus:outline-none transition-all text-sm resize-none ${
                  isDarkMode ? 'bg-[#222] border-gray-700 text-white' : 'bg-gray-50 border-gray-100 text-black'
                }`}
              ></textarea>
            </div>
            <InputField label="Location" name="location" value={formData.location} onChange={handleInputChange} isDarkMode={isDarkMode} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Website (optional)" name="website" placeholder="https://yourwebsite.com" value={formData.website} onChange={handleInputChange} isDarkMode={isDarkMode} />
                <InputField label="GitHub (optional)" name="github" placeholder="https://github.com/username" value={formData.github} onChange={handleInputChange} isDarkMode={isDarkMode} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="LinkedIn (optional)" name="linkedin" placeholder="https://linkedin.com/in/username" value={formData.linkedin} onChange={handleInputChange} isDarkMode={isDarkMode} />
                <InputField label="Twitter (optional)" name="twitter" placeholder="https://twitter.com/username" value={formData.twitter} onChange={handleInputChange} isDarkMode={isDarkMode} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Instagram (optional)" name="instagram" placeholder="https://instagram.com/username" value={formData.instagram} onChange={handleInputChange} isDarkMode={isDarkMode} />
                <InputField label="WhatsApp (optional)" name="whatsapp" placeholder="+254..." value={formData.whatsapp} onChange={handleInputChange} isDarkMode={isDarkMode} />
            </div>

            <div className="pt-4 flex gap-4">
              <Button primary onClick={handleSaveProfile} disabled={isSaving} isDarkMode={isDarkMode}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button onClick={() => window.location.reload()} isDarkMode={isDarkMode}>Cancel</Button>
            </div>
          </div>
        </div>
      </div>

      <div className={`rounded-[24px] p-6 md:p-8 shadow-sm ${isDarkMode ? 'bg-[#111] border border-[#E70008]/20' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Connected Accounts</h2>
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isDarkMode 
                ? 'bg-[#222] text-gray-300 hover:text-white hover:bg-[#333] disabled:opacity-50' 
                : 'bg-gray-100 text-gray-600 hover:text-black hover:bg-gray-200 disabled:opacity-50'
            }`}
            title="Sync data from all connected platforms"
          >
            <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
        <div className="space-y-4">
          {/* Google */}
          <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
            isDarkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-100 hover:border-gray-200'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#222]' : 'bg-gray-50'}`}>
                <Chrome className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`} />
              </div>
              <div>
                <h3 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>Google</h3>
                <p className="text-xs text-gray-500">{formData.email || 'Connected'}</p>
              </div>
            </div>
            <button className={`px-4 py-2 rounded-full border text-xs font-semibold transition-all ${
              isDarkMode 
                ? 'border-green-500 text-green-500 bg-green-500/10' 
                : 'border-green-600 text-green-600 bg-green-50'
            }`}>
              Connected
            </button>
          </div>

          {/* GitHub */}
          <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
            isDarkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-100 hover:border-gray-200'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#222]' : 'bg-gray-50'}`}>
                <Linkedin className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`} />
              </div>
              <div>
                <h3 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>LinkedIn</h3>
                <p className="text-xs text-gray-500">{linkedinConnected ? 'Connected' : 'Connect your LinkedIn account'}</p>
              </div>
            </div>
            <button 
              onClick={() => linkedinConnected ? handleDisconnect('linkedin') : handleLinkedInConnect()}
              disabled={isConnectingLinkedIn}
              className={`px-4 py-2 rounded-full border text-xs font-semibold transition-all flex items-center gap-2 ${
              linkedinConnected
                ? (isDarkMode ? 'border-green-500 text-green-500 bg-green-500/10 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500' : 'border-green-600 text-green-600 bg-green-50 hover:bg-red-50 hover:text-red-600 hover:border-red-600')
                : (isDarkMode 
                  ? 'bg-[#E50914] border-[#E50914] text-white hover:bg-[#cc0812]' 
                  : 'bg-black border-black text-white hover:bg-gray-800')
            }`}>
              {isConnectingLinkedIn ? <Loader2 size={14} className="animate-spin" /> : null}
              {linkedinConnected ? 'Disconnect' : (isConnectingLinkedIn ? 'Connecting...' : 'Connect')}
            </button>
          </div>
          {/* Twitter */}
          <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
            isDarkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-100 hover:border-gray-200'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#222]' : 'bg-gray-50'}`}>
                <Twitter className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`} />
              </div>
              <div>
                <h3 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>Twitter</h3>
                <p className="text-xs text-gray-500">{twitterConnected ? 'Connected' : 'Connect your Twitter account'}</p>
              </div>
            </div>
            <button 
              onClick={() => twitterConnected ? handleDisconnect('twitter') : handleTwitterConnect()}
              disabled={isConnectingTwitter}
              className={`px-4 py-2 rounded-full border text-xs font-semibold transition-all flex items-center gap-2 ${
              twitterConnected
                ? (isDarkMode ? 'border-green-500 text-green-500 bg-green-500/10 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500' : 'border-green-600 text-green-600 bg-green-50 hover:bg-red-50 hover:text-red-600 hover:border-red-600')
                : (isDarkMode 
                  ? 'bg-[#E50914] border-[#E50914] text-white hover:bg-[#cc0812]' 
                  : 'bg-black border-black text-white hover:bg-gray-800')
            }`}>
              {isConnectingTwitter ? <Loader2 size={14} className="animate-spin" /> : null}
              {twitterConnected ? 'Disconnect' : (isConnectingTwitter ? 'Connecting...' : 'Connect')}
            </button>
          </div>
          {/* Discord */}
          <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
            isDarkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-100 hover:border-gray-200'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#222]' : 'bg-gray-50'}`}>
                <MessageCircle className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`} />
              </div>
              <div>
                <h3 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>Discord</h3>
                <p className="text-xs text-gray-500">{discordConnected ? 'Connected' : 'Connect your Discord account'}</p>
              </div>
            </div>
            <button 
              onClick={() => discordConnected ? handleDisconnect('discord') : handleDiscordConnect()}
              disabled={isConnectingDiscord}
              className={`px-4 py-2 rounded-full border text-xs font-semibold transition-all flex items-center gap-2 ${
              discordConnected
                ? (isDarkMode ? 'border-green-500 text-green-500 bg-green-500/10 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500' : 'border-green-600 text-green-600 bg-green-50 hover:bg-red-50 hover:text-red-600 hover:border-red-600')
                : (isDarkMode 
                  ? 'bg-[#E50914] border-[#E50914] text-white hover:bg-[#cc0812]' 
                  : 'bg-black border-black text-white hover:bg-gray-800')
            }`}>
              {isConnectingDiscord ? <Loader2 size={14} className="animate-spin" /> : null}
              {discordConnected ? 'Disconnect' : (isConnectingDiscord ? 'Connecting...' : 'Connect')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
