'use client';

import React from 'react';
import Toast from '@/components/Toast';
import MagnaChatSidebar from '@/components/MagnaChatSidebar';
import MagnaChatInput from '@/components/MagnaChatInput';
import MagnaWelcomeScreen from '@/components/MagnaWelcomeScreen';
import MagnaActiveChat from '@/components/MagnaActiveChat';
import MagnaHeader from '@/components/MagnaHeader';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { useMagnaChat } from '@/hooks/useMagnaChat';

export default function MagnaAIPage() {
  const {
    isHistoryOpen,
    setIsHistoryOpen,
    searchQuery,
    setSearchQuery,
    selectedChat,
    setSelectedChat,
    messages,
    isTyping,
    showChatOptions,
    setShowChatOptions,
    showDeleteConfirm,
    setShowDeleteConfirm,
    toastConfig,
    setToastConfig,
    isDarkMode,
    mobileInputRef,
    desktopInputRef,
    messagesEndRef,
    conversations,
    handleServiceClick,
    handleSendMessage,
    handleEditMessage,
    handleNewChat,
    handleArchiveChat,
    handleDeleteClick,
    confirmDelete,
    handleChatSelect
  } = useMagnaChat();

  return (
    <div className={`h-[100dvh] font-sans flex overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-black text-[#F9E4AD]' : 'bg-[#FDF8F5] text-[#444444]'}`}>
      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 w-full transition-all duration-300 relative h-full flex overflow-hidden">
        
        {/* MOBILE BACKDROP */}
        {isHistoryOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setIsHistoryOpen(false)}
          />
        )}

        {/* HISTORY PANEL (Retractable) */}
        <MagnaChatSidebar
           conversations={conversations}
           isHistoryOpen={isHistoryOpen}
           setIsHistoryOpen={setIsHistoryOpen}
           selectedChat={selectedChat}
           handleNewChat={handleNewChat}
           handleChatSelect={handleChatSelect}
           isDarkMode={isDarkMode}
        />

        {/* CHAT INTERFACE CONTAINER */}
        <div className="flex-1 flex flex-col relative h-full">

          <MagnaHeader 
            selectedChat={selectedChat}
            isHistoryOpen={isHistoryOpen}
            setIsHistoryOpen={setIsHistoryOpen}
          />
        
          {/* AI INTERFACE CONTENT */}
          <div className="flex-1 flex flex-col h-full relative">
            
            {selectedChat ? (
              /* ACTIVE CHAT VIEW */
              <MagnaActiveChat 
                selectedChat={selectedChat}
                setSelectedChat={setSelectedChat}
                isDarkMode={isDarkMode}
                showChatOptions={showChatOptions}
                setShowChatOptions={setShowChatOptions}
                handleArchiveChat={handleArchiveChat}
                handleDeleteClick={handleDeleteClick}
                messages={messages}
                handleEditMessage={handleEditMessage}
                isTyping={isTyping}
                messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleSendMessage={handleSendMessage}
                inputRef={desktopInputRef as React.RefObject<HTMLTextAreaElement>}
              />
            ) : (
              /* DEFAULT GREETING VIEW */
              <MagnaWelcomeScreen 
                userName="John"
                isDarkMode={isDarkMode}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleSendMessage={handleSendMessage}
                handleServiceClick={handleServiceClick}
                inputRef={desktopInputRef as React.RefObject<HTMLTextAreaElement>}
              />
            )}

            {/* Fixed Bottom Input Area for Mobile */}
            <div className={`fixed bottom-[80px] left-0 right-0 p-4 bg-transparent pb-0 md:hidden ${isHistoryOpen ? 'z-0' : 'z-[60]'}`}>
              <div className="max-w-4xl mx-auto w-full">
                 <MagnaChatInput 
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleSendMessage={handleSendMessage}
                    isDarkMode={isDarkMode}
                    inputRef={mobileInputRef as React.RefObject<HTMLTextAreaElement>}
                    className={isDarkMode ? 'bg-[#111] border border-[#333]' : 'bg-[#F0F4F9]'}
                 />
              </div>
            </div>
          </div>
        </div>
      </main>

      <DeleteConfirmationModal
        isVisible={showDeleteConfirm}
        isDarkMode={isDarkMode}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
      />

      <Toast 
        message={toastConfig.message}
        isVisible={toastConfig.isVisible}
        onClose={() => setToastConfig(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
