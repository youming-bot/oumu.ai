'use client';

import { useState, ReactNode } from 'react';

interface HoverCardProps {
  children: ReactNode;
  hoverContent: ReactNode;
  className?: string;
  hoverClassName?: string;
  delay?: number;
}

export default function HoverCard({
  children,
  hoverContent,
  className = '',
  hoverClassName = '',
  delay = 100
}: HoverCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showHover, setShowHover] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setTimeout(() => {
      if (isHovered) {
        setShowHover(true);
      }
    }, delay);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowHover(false);
  };

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {showHover && (
        <div 
          className={`
            absolute z-50 bg-card border rounded-lg shadow-lg p-3 
            transform origin-top transition-all duration-200
            scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100
            ${hoverClassName}
          `}
          style={{
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%) translateY(8px)',
            minWidth: '200px'
          }}
        >
          {/* Arrow */}
          <div 
            className="absolute -top-2 left-1/2 transform -translate-x-1/2
                     w-4 h-4 bg-card border-t border-l rotate-45"
          ></div>
          
          {/* Content */}
          <div className="relative z-10">
            {hoverContent}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple hover effect component
export function HoverEffect({
  children,
  className = '',
  hoverClassName = 'scale-105'
}: {
  children: ReactNode;
  className?: string;
  hoverClassName?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`
        transition-all duration-200 ease-out
        ${isHovered ? hoverClassName : ''}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
}

// Gradient hover effect
export function GradientHover({
  children,
  className = '',
  gradientFrom = 'from-blue-500/10',
  gradientTo = 'to-purple-500/10'
}: {
  children: ReactNode;
  className?: string;
  gradientFrom?: string;
  gradientTo?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`
        relative overflow-hidden
        transition-all duration-300 ease-out
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      
      {/* Gradient overlay */}
      <div
        className={`
          absolute inset-0 bg-gradient-to-r ${gradientFrom} ${gradientTo}
          transition-opacity duration-300
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}
      />
    </div>
  );
}