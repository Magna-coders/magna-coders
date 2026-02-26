"use client";

import React, { Suspense } from 'react';
import { MessageSquare } from 'lucide-react';

import TopNavigation from '@/components/TopNavigation';
import ChatHeader from '@/components/ChatHeader';
import ChatInput from '@/components/ChatInput';
import CreateGroupModal from '@/components/CreateGroupModal';
import GroupInfoModal from '@/components/GroupInfoModal';
import StartChatModal from '@/components/StartChatModal';
import ContactInfoModal from '@/components/ContactInfoModal';
import AttachmentModal from '@/components/AttachmentModal';
import SendCoinsModal from '@/components/SendCoinsModal';
import DiscoverGroupsModal from '@/components/DiscoverGroupsModal';
import ConversationItem from '@/components/ConversationItem';
import MessageBubble from '@/components/MessageBubble';
import ChatDetailPanel from '@/components/ChatDetailPanel';
import ChatSidebar from '@/components/ChatSidebar';
import FloatingActionMenu from '@/components/FloatingActionMenu';
import MobileDrawer from '@/components/MobileDrawer';

import { getGroupMembers, getContactInfo } from './constants';
import { useMessages } from './useMessages';

export default function MessagesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const {
    // State
    selectedChatId,
    setSelectedChatId,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    activeTab,
    setActiveTab,
    isActionModalOpen,
    setIsActionModalOpen,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    messageInput,
    setMessageInput,
    isCreateGroupModalOpen,
    setIsCreateGroupModalOpen,
    isGroupInfoModalOpen,
    setIsGroupInfoModalOpen,
    isStartChatModalOpen,
    setIsStartChatModalOpen,
    isContactInfoModalOpen,
    setIsContactInfoModalOpen,
    isAttachmentModalOpen,
    setIsAttachmentModalOpen,
    isSendCoinsModalOpen,
    setIsSendCoinsModalOpen,
    isDiscoverGroupsModalOpen,
    setIsDiscoverGroupsModalOpen,
    isDarkMode,
    toggleTheme,

    // Refs
    fileInputRef,
    messagesEndRef,

    // Derived State
    selectedChat,
    filteredConversations,

    // Handlers
    handleSendMessage,
    handleSendCoins,
    handleDeleteConversation,
    handleDeleteMessage,
    handleArchiveConversation,
    handleCreateGroup,
    handleFileUpload,
    handleUpdateGroup,
    handleLeaveGroup,
    handleRemoveMember,
    handlePromoteMember,
    handleAttachmentSelect,
    handleStartChat,
    handleJoinGroup,
    chatDetails
  } = useMessages();

  return (
    <div className={`h-screen font-sans flex overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-black text-[#F9E4AD]' : 'bg-[#FDF8F5] text-[#444444]'}`}>
      
      {/* TOP NAVIGATION BAR */}
      <div className={`${selectedChatId ? 'hidden md:block' : 'block'}`}>
        <TopNavigation 
          title="Messages" 
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          className="md:!left-0 lg:!left-0"
          searchPlaceholder="Search messages..."
          searchValue={searchQuery}
          onSearchChange={(e) => setSearchQuery(e.target.value)}
          isDarkMode={isDarkMode}
          showBack={true}
        />
      </div>

      {/* MOBILE DRAWER */}
      <MobileDrawer 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        isDarkMode={isDarkMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        toggleTheme={toggleTheme}
      />

      {/* MESSAGES LAYOUT */}
      <div className={`flex-1 flex overflow-hidden ${selectedChatId ? 'pt-0 md:pt-[71px]' : 'pt-[65px] md:pt-[71px]'}`}>
        
        {/* 1. CONVERSATIONS LIST (Left Panel) */}
        <div className={`${selectedChatId ? 'hidden md:flex' : 'flex'} h-full`}>
          <ChatSidebar 
            isDarkMode={isDarkMode}
            filter={filter}
            setFilter={setFilter}
            onOpenDiscoverGroups={() => setIsDiscoverGroupsModalOpen(true)}
            onCreateChat={() => setIsStartChatModalOpen(true)}
            onCreateGroup={() => setIsCreateGroupModalOpen(true)}
          >
            {filteredConversations.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p>No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((chat) => (
                <ConversationItem 
                  key={chat.id}
                  name={chat.name}
                  message={chat.lastMessage}
                  time={chat.time}
                  unread={chat.unread}
                  isTyping={chat.isTyping}
                  active={selectedChatId === chat.id}
                  avatarColor={chat.avatarColor}
                  onClick={() => setSelectedChatId(chat.id)}
                  isDarkMode={isDarkMode}
                />
              ))
            )}
          </ChatSidebar>
        </div>

        {/* 2. CHAT WINDOW (Middle Panel) */}
        <div className={`flex-1 flex flex-col h-full md:pb-0 ${!selectedChatId ? 'hidden md:flex' : 'flex'} ${isDarkMode ? 'bg-black' : 'bg-[#FDF8F5]'}`}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <ChatHeader 
                selectedChat={selectedChat}
                isDarkMode={isDarkMode}
                onBack={() => setSelectedChatId(null)}
                onOpenGroupInfo={() => setIsGroupInfoModalOpen(true)}
                onOpenContactInfo={() => setIsContactInfoModalOpen(true)}
                onArchiveChat={handleArchiveConversation}
                onDeleteChat={handleDeleteConversation}
              />

              {/* Chat Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex justify-center my-4">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${isDarkMode ? 'bg-[#222] text-gray-400' : 'bg-gray-200 text-gray-500'}`}>Today</span>
                </div>

                {selectedChat.messages.map((msg) => (
                  <MessageBubble 
                    key={msg.id}
                    message={msg}
                    onDelete={() => handleDeleteMessage(selectedChat.id, msg.id)}
                    isDarkMode={isDarkMode}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <ChatInput 
                isDarkMode={isDarkMode}
                messageInput={messageInput}
                setMessageInput={setMessageInput}
                onSendMessage={handleSendMessage}
                onAttachClick={() => setIsAttachmentModalOpen(true)}
                onSendCoinsClick={() => setIsSendCoinsModalOpen(true)}
                onFileSelect={handleFileUpload}
                fileInputRef={fileInputRef}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isDarkMode ? 'bg-[#222]' : 'bg-gray-100'}`}>
                <MessageSquare size={40} className="text-gray-300" />
              </div>
              <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Select a Conversation</h2>
              <p className="max-w-xs">Choose a chat from the left to start messaging or create a new group.</p>
            </div>
          )}
        </div>

        {/* 3. GROUP INFO (Right Panel) - Hidden on smaller screens */}
        {selectedChat && (
          <ChatDetailPanel 
            selectedChat={selectedChat}
            isDarkMode={isDarkMode}
            description={chatDetails?.description}
          />
        )}

      </div>

      {/* FLOATING ACTION BUTTON & MODAL */}
      <FloatingActionMenu 
        isDarkMode={isDarkMode}
        isOpen={isActionModalOpen}
        onToggle={() => setIsActionModalOpen(!isActionModalOpen)}
        onCreateGroup={() => setIsCreateGroupModalOpen(true)}
        onStartChat={() => setIsStartChatModalOpen(true)}
        isHidden={!!selectedChatId}
      />

      <CreateGroupModal 
        isOpen={isCreateGroupModalOpen} 
        onClose={() => setIsCreateGroupModalOpen(false)} 
        onCreateGroup={handleCreateGroup} 
        isDarkMode={isDarkMode}
      />

      <StartChatModal
        isOpen={isStartChatModalOpen}
        onClose={() => setIsStartChatModalOpen(false)}
        onStartChat={handleStartChat}
        isDarkMode={isDarkMode}
      />

      {selectedChat && selectedChat.isGroup && (
        <GroupInfoModal 
          isOpen={isGroupInfoModalOpen}
          onClose={() => setIsGroupInfoModalOpen(false)}
          group={{
            id: selectedChat.id,
            name: selectedChat.name,
            description: "A group for discussing project details and updates.", // Mock description
            avatarColor: selectedChat.avatarColor,
            members: getGroupMembers(selectedChat)
          }}
          onUpdateGroup={handleUpdateGroup}
          onLeaveGroup={handleLeaveGroup}
          onRemoveMember={handleRemoveMember}
          onPromoteMember={handlePromoteMember}
          isDarkMode={isDarkMode}
        />
      )}

      {selectedChat && !selectedChat.isGroup && (
        <ContactInfoModal
          isOpen={isContactInfoModalOpen}
          onClose={() => setIsContactInfoModalOpen(false)}
          contact={getContactInfo(selectedChat)}
          isDarkMode={isDarkMode}
        />
      )}

      <AttachmentModal
        isOpen={isAttachmentModalOpen}
        onClose={() => setIsAttachmentModalOpen(false)}
        onSelectType={handleAttachmentSelect}
      />

      <SendCoinsModal
        isOpen={isSendCoinsModalOpen}
        onClose={() => setIsSendCoinsModalOpen(false)}
        onSend={handleSendCoins}
        isDarkMode={isDarkMode}
      />

      <DiscoverGroupsModal
        isOpen={isDiscoverGroupsModalOpen}
        onClose={() => setIsDiscoverGroupsModalOpen(false)}
        onJoinGroup={handleJoinGroup}
        isDarkMode={isDarkMode}
      />

    </div>
  );
}
