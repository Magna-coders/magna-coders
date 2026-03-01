'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Construction, X } from 'lucide-react';

interface FeatureComingSoonBannerProps {
  message?: string;
  className?: string;
  position?: 'top' | 'bottom' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showCloseButton?: boolean;
}

export default function FeatureComingSoonBanner({ 
  message = " Feature Coming Soon!", 
  className = "",
  position = 'top',
  showCloseButton = true
}: FeatureComingSoonBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  const positionClasses = {
    'top': 'fixed top-4 left-1/2 transform -translate-x-1/2',
    'bottom': 'fixed bottom-4 left-1/2 transform -translate-x-1/2',
    'top-right': 'fixed top-4 right-4',
    'top-left': 'fixed top-4 left-4',
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className={`${positionClasses[position]} z-50 max-w-md ${className}`}
        >
          <div className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 text-white rounded-lg shadow-2xl border border-orange-300">
            <div className="flex items-center space-x-3 p-4">
              <div className="flex-shrink-0">
                <Construction size={24} className="animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold tracking-wide">
                  {message}
                </p>
                <p className="text-xs text-orange-100 mt-1">
                  We're working hard to bring you this feature. Stay tuned!
                </p>
              </div>
              {showCloseButton && (
                <button
                  onClick={() => setIsVisible(false)}
                  className="flex-shrink-0 p-1 rounded-full hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            {/* Animated progress bar */}
            <div className="h-1 bg-orange-300 bg-opacity-30 rounded-b-lg overflow-hidden">
              <motion.div
                className="h-full bg-white bg-opacity-90"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}