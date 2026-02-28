'use client';

import React, { useState, useEffect } from 'react';
import ContactInfoModal from './ContactInfoModal';
import { getContactInfo } from '@/app/messages/constants';

interface ContactInfoModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  chat: any;
  isDarkMode?: boolean;
}

export default function ContactInfoModalWrapper({ 
  isOpen, 
  onClose, 
  chat,
  isDarkMode = false
}: ContactInfoModalWrapperProps) {
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && chat) {
      setLoading(true);
      getContactInfo(chat).then(info => {
        setContactInfo(info);
        setLoading(false);
      });
    }
  }, [isOpen, chat]);

  if (!isOpen || loading || !contactInfo) return null;

  return (
    <ContactInfoModal
      isOpen={isOpen}
      onClose={onClose}
      contact={contactInfo}
      isDarkMode={isDarkMode}
    />
  );
}
