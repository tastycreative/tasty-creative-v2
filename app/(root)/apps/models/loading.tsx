import React from 'react';

const Loader = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50 flex items-center justify-center">
      <div className="rocket-wrapper">
        <svg
          className="rocket"
          width="100"
          height="160"
          viewBox="0 0 100 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main rocket body */}
          <path
            className="rocket-body"
            d="M50 15 C50 5 50 5 50 5 C50 5 50 5 50 15 M50 15 C60 20 65 30 65 45 L65 100 C65 105 60 110 50 110 C40 110 35 105 35 100 L35 45 C35 30 40 20 50 15 Z"
            stroke="url(#bodyGradient)"
            strokeWidth="2.5"
            fill="none"
          />
          
          {/* Rocket body center line */}
          <line
            className="rocket-detail-1"
            x1="50"
            y1="25"
            x2="50"
            y2="95"
            stroke="url(#bodyGradient)"
            strokeWidth="1.5"
            opacity="0.6"
          />
          
          {/* Side boosters */}
          <path
            className="rocket-booster-left"
            d="M25 50 C20 50 18 52 18 55 L18 85 C18 88 20 90 22 90 L25 88 L25 50 Z"
            stroke="url(#boosterGradient)"
            strokeWidth="2"
            fill="none"
          />
          
          <path
            className="rocket-booster-right"
            d="M75 50 C80 50 82 52 82 55 L82 85 C82 88 80 90 78 90 L75 88 L75 50 Z"
            stroke="url(#boosterGradient)"
            strokeWidth="2"
            fill="none"
          />
          
          {/* Fins */}
          <path
            className="rocket-fin-left"
            d="M35 85 L20 105 C18 107 18 109 20 109 L30 109 L35 100 Z"
            stroke="url(#finGradient)"
            strokeWidth="2"
            fill="none"
          />
          
          <path
            className="rocket-fin-right"
            d="M65 85 L80 105 C82 107 82 109 80 109 L70 109 L65 100 Z"
            stroke="url(#finGradient)"
            strokeWidth="2"
            fill="none"
          />
          
          {/* Window */}
          <circle
            className="rocket-window-outer"
            cx="50"
            cy="40"
            r="12"
            stroke="url(#windowGradient)"
            strokeWidth="2"
            fill="none"
          />
          
          <circle
            className="rocket-window-inner"
            cx="50"
            cy="40"
            r="8"
            stroke="url(#windowGradient)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.7"
          />
          
          {/* Technical details */}
          <rect
            className="rocket-panel-1"
            x="42"
            y="60"
            width="16"
            height="8"
            rx="1"
            stroke="url(#bodyGradient)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.5"
          />
          
          <rect
            className="rocket-panel-2"
            x="42"
            y="72"
            width="16"
            height="8"
            rx="1"
            stroke="url(#bodyGradient)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.5"
          />
          
          {/* Engine nozzles */}
          <ellipse
            className="rocket-nozzle-main"
            cx="50"
            cy="108"
            rx="8"
            ry="4"
            stroke="url(#nozzleGradient)"
            strokeWidth="2"
            fill="none"
          />
          
          <ellipse
            className="rocket-nozzle-left"
            cx="22"
            cy="90"
            rx="4"
            ry="2"
            stroke="url(#nozzleGradient)"
            strokeWidth="1.5"
            fill="none"
          />
          
          <ellipse
            className="rocket-nozzle-right"
            cx="78"
            cy="90"
            rx="4"
            ry="2"
            stroke="url(#nozzleGradient)"
            strokeWidth="1.5"
            fill="none"
          />
          
          {/* Exhaust flames */}
          <path
            className="rocket-flame-main"
            d="M50 112 C45 117 43 127 45 137 C47 142 48 147 50 152 C52 147 53 142 55 137 C57 127 55 117 50 112 Z"
            stroke="url(#flameGradient)"
            strokeWidth="2"
            fill="none"
            opacity="0"
          />
          
          <path
            className="rocket-flame-left"
            d="M22 93 C20 96 19 100 20 105 C21 108 22 111 22 111 C22 111 23 108 24 105 C25 100 24 96 22 93 Z"
            stroke="url(#flameGradient2)"
            strokeWidth="1.5"
            fill="none"
            opacity="0"
          />
          
          <path
            className="rocket-flame-right"
            d="M78 93 C76 96 75 100 76 105 C77 108 78 111 78 111 C78 111 79 108 80 105 C81 100 80 96 78 93 Z"
            stroke="url(#flameGradient2)"
            strokeWidth="1.5"
            fill="none"
            opacity="0"
          />
          
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fce7f3" />
              <stop offset="50%" stopColor="#fbcfe8" />
              <stop offset="100%" stopColor="#f9a8d4" />
            </linearGradient>
            
            <linearGradient id="boosterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f3e8ff" />
              <stop offset="100%" stopColor="#e879f9" />
            </linearGradient>
            
            <linearGradient id="finGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#be185d" />
            </linearGradient>
            
            <linearGradient id="windowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            
            <linearGradient id="nozzleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#be185d" />
              <stop offset="100%" stopColor="#831843" />
            </linearGradient>
            
            <linearGradient id="flameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="30%" stopColor="#f59e0b" />
              <stop offset="60%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#be185d" />
            </linearGradient>
            
            <linearGradient id="flameGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#be185d" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Smoke particles */}
        <div className="smoke-particle smoke-1"></div>
        <div className="smoke-particle smoke-2"></div>
        <div className="smoke-particle smoke-3"></div>
      </div>
 
    </div>
  );
};

export default Loader;