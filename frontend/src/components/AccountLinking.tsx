'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Chrome, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AccountLinkingProps {
  isDarkMode?: boolean;
}

export default function AccountLinking({ isDarkMode = false }: AccountLinkingProps) {
  const [isLinking, setIsLinking] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLinkGoogle = async () => {
    try {
      setIsLinking(true);
      setMessage(null);
      
      // signIn with redirect: true will redirect the page, so we won't reach the code below on success
      await signIn('google', {
        callbackUrl: '/settings?linked=true',
        redirect: true,
        // Pass linking intent
        linking: 'true'
      });
      
      // If we reach here, there was an error (redirect didn't happen)
      setMessage({
        type: 'error',
        text: 'Failed to link account. Email mismatch or account already linked.'
      });
      setIsLinking(false);
    } catch (err) {
      console.error('Account linking error:', err);
      setMessage({
        type: 'error',
        text: 'Connection error. Please try again.'
      });
      setIsLinking(false);
    }
  };

  const theme = {
    cardBg: isDarkMode 
      ? 'bg-[#1A1A1A]/60 border-white/10' 
      : 'bg-white/40 border-white/40',
    textPrimary: isDarkMode ? 'text-white' : 'text-black',
    textSecondary: isDarkMode ? 'text-[#CCCCCC]' : 'text-[#444444]',
    textMuted: isDarkMode ? 'text-[#999999]' : 'text-[#777777]',
    buttonBg: isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white/60 hover:bg-white/80',
  };

  return (
    <div className={`backdrop-blur-xl rounded-2xl border p-6 ${theme.cardBg} transition-all duration-300`}>
      <div className="space-y-4">
        <div>
          <h3 className={`text-lg font-semibold mb-2 ${theme.textPrimary}`}>
            Link Google Account
          </h3>
          <p className={`text-sm ${theme.textMuted}`}>
            Connect your Google account to enable sign-in with Google. Your Google email must match your registered email address.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`flex items-start gap-3 p-4 rounded-lg border ${
                message.type === 'success'
                  ? 'bg-green-500/10 border-green-500/20 text-green-500'
                  : 'bg-red-500/10 border-red-500/20 text-red-500'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{message.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={handleLinkGoogle}
          disabled={isLinking}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full flex items-center justify-center gap-3 py-3 px-6 rounded-full border border-transparent transition-all duration-200 ${theme.buttonBg} ${theme.textPrimary} disabled:opacity-70 disabled:cursor-not-allowed`}
        >
          {isLinking ? (
            <>
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">Linking...</span>
            </>
          ) : (
            <>
              <Chrome className="w-5 h-5" />
              <span className="font-medium">Link Google Account</span>
            </>
          )}
        </motion.button>

        <p className={`text-xs ${theme.textMuted} text-center`}>
          You&apos;ll be redirected to Google to authorize the connection
        </p>
      </div>
    </div>
  );
}
