import React from 'react';

interface AuthBackgroundProps {
  isDarkMode: boolean;
}

export default function AuthBackground({ isDarkMode }: AuthBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {isDarkMode ? (
        <>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#5C2400] opacity-20 rounded-full blur-[100px]"></div>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03]"></div>
        </>
      ) : (
        <>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#F4A261] opacity-10 rounded-full blur-[100px]"></div>
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
        </>
      )}
    </div>
  );
}
