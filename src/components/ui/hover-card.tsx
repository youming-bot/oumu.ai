"use client";

import { type ReactNode, useState } from "react";

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
  className = "",
  hoverClassName = "",
  delay = 100,
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
    <section
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label="Hover card"
    >
      {children}

      {showHover && (
        <div
          className={`absolute z-50 origin-top scale-95 transform rounded-lg border bg-card p-3 opacity-0 shadow-lg transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 ${hoverClassName}
          `}
          style={{
            top: "100%",
            left: "50%",
            transform: "translateX(-50%) translateY(8px)",
            minWidth: "200px",
          }}
        >
          {/* Arrow */}
          <div className="-top-2 -translate-x-1/2 absolute left-1/2 h-4 w-4 rotate-45 transform border-t border-l bg-card"></div>

          {/* Content */}
          <div className="relative z-10">{hoverContent}</div>
        </div>
      )}
    </section>
  );
}

// Simple hover effect component
export function HoverEffect({
  children,
  className = "",
  hoverClassName = "scale-105",
}: {
  children: ReactNode;
  className?: string;
  hoverClassName?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <fieldset
      className={`transition-all duration-200 ease-out ${isHovered ? hoverClassName : ""}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </fieldset>
  );
}

// Gradient hover effect
export function GradientHover({
  children,
  className = "",
  gradientFrom = "from-blue-500/10",
  gradientTo = "to-purple-500/10",
}: {
  children: ReactNode;
  className?: string;
  gradientFrom?: string;
  gradientTo?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <fieldset
      className={`relative overflow-hidden transition-all duration-300 ease-out ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}

      {/* Gradient overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${gradientFrom} ${gradientTo}transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"}
        `}
      />
    </fieldset>
  );
}
