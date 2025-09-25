"use client";

import { type ReactNode, useEffect, useState } from "react";

interface SmoothTransitionProps {
  children: ReactNode;
  isVisible: boolean;
  duration?: number;
  className?: string;
}

export default function SmoothTransition({
  children,
  isVisible,
  duration = 300,
  className = "",
}: SmoothTransitionProps) {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setIsAnimating(true);

      // Force reflow to ensure animation starts
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);

      const timer = setTimeout(() => {
        setShouldRender(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  if (!shouldRender) return null;

  return (
    <div
      className={className}
      style={{
        transition: `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        opacity: isAnimating ? 1 : 0,
        transform: isAnimating ? "translateY(0)" : "translateY(10px)",
      }}
    >
      {children}
    </div>
  );
}

// Variant for fade-in only
export function FadeTransition({
  children,
  isVisible,
  duration = 300,
  className = "",
}: SmoothTransitionProps) {
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  if (!shouldRender) return null;

  return (
    <div
      className={className}
      style={{
        transition: `opacity ${duration}ms ease-in-out`,
        opacity: isVisible ? 1 : 0,
      }}
    >
      {children}
    </div>
  );
}

// Variant for slide transitions
export function SlideTransition({
  children,
  isVisible,
  direction = "up",
  duration = 300,
  className = "",
}: SmoothTransitionProps & { direction?: "up" | "down" | "left" | "right" }) {
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  const getTransform = () => {
    if (!isVisible) {
      switch (direction) {
        case "up":
          return "translateY(20px)";
        case "down":
          return "translateY(-20px)";
        case "left":
          return "translateX(20px)";
        case "right":
          return "translateX(-20px)";
        default:
          return "translateY(20px)";
      }
    }
    return "translate(0)";
  };

  if (!shouldRender) return null;

  return (
    <div
      className={className}
      style={{
        transition: `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
      }}
    >
      {children}
    </div>
  );
}
