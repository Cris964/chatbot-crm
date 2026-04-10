import React from 'react'

export default function NexusLogo({ size = 32, className = "" }) {
  return (
    <div className={`nexus-logo ${className}`} style={{ width: size, height: size, position: 'relative' }}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Modern 'N' Shape */}
        <path
          d="M25 20V80L45 50L75 80V20L55 50L25 20Z"
          fill="url(#logoGradient)"
          filter="url(#glow)"
        />
        
        {/* Abstract orbits/glitch elements */}
        <circle cx="25" cy="20" r="4" fill="#a5b4fc" />
        <circle cx="75" cy="80" r="4" fill="#6ee7b7" />
      </svg>
    </div>
  )
}
