"use client";

import React, { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";

export default function WhatsAppWidget() {
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Phone number including country code without the '+'
  // e.g. for Bangladesh +8801742805845 -> 8801742805845
  const WHATSAPP_NUMBER = "8801742805845"; 
  const DEFAULT_MESSAGE = encodeURIComponent("Hello MangoDB! I have a question regarding my order.");

  // Delay the entrance animation so it doesn't block initial page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000); // 2 seconds after mount
    
    const tooltipTimer = setTimeout(() => {
      setShowTooltip(true);
      // Hide tooltip after 5 seconds
      setTimeout(() => setShowTooltip(false), 5000);
    }, 3000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(tooltipTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans animate-fade-in">
      
      {/* Tooltip Bubble */}
      {showTooltip && (
        <div className="relative animate-slide-up">
          <div className="bg-card backdrop-blur-md border border-border shadow-lg p-3 rounded-2xl max-w-[200px] flex items-start gap-2 relative">
            <div className="flex-1">
              <p className="text-[11px] font-bold text-hero-text">Need help?</p>
              <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                Chat with our farm experts directly on WhatsApp.
              </p>
            </div>
            <button 
              onClick={() => setShowTooltip(false)}
              className="text-muted-foreground hover:text-hero-text -mr-1 -mt-1 p-0.5 rounded-full hover:bg-muted-bg"
            >
              <X className="w-3 h-3" />
            </button>
            {/* Tooltip arrow */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-card border-r border-b border-border rotate-45" />
          </div>
        </div>
      )}

      {/* WhatsApp Button */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${DEFAULT_MESSAGE}`}
        target="_blank"
        rel="noopener noreferrer"
        className="relative group flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:shadow-[0_4px_25px_rgba(37,211,102,0.6)] hover:scale-110 transition-all duration-300 cursor-pointer"
        aria-label="Chat with us on WhatsApp"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Pulse rings */}
        <div className="absolute inset-0 rounded-full border-2 border-[#25D366] animate-ping opacity-20" />
        
        {/* Generic Message icon mimicking WhatsApp */}
        <svg 
          viewBox="0 0 24 24" 
          width="28" 
          height="28" 
          stroke="currentColor" 
          strokeWidth="2" 
          fill="none" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="relative z-10 fill-current"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      </a>
    </div>
  );
}
