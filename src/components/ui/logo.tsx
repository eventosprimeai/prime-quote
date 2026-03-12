"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { container: "w-8 h-8", text: "text-base", subtext: "text-[8px]" },
  md: { container: "w-10 h-10", text: "text-xl", subtext: "text-[10px]" },
  lg: { container: "w-14 h-14", text: "text-2xl", subtext: "text-xs" },
};

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const s = sizes[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* SVG Logo - Line based, no background */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        className={cn(s.container, "relative flex items-center justify-center cursor-pointer")}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Animated outer hexagon */}
          <motion.path
            d="M24 4L42 14V34L24 44L6 34V14L24 4Z"
            stroke="url(#neonGradient1)"
            strokeWidth="1.5"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            style={{ filter: "drop-shadow(0 0 4px oklch(0.75 0.18 195 / 60%))" }}
          />
          
          {/* Inner P shape with lines */}
          <motion.path
            d="M18 36V12H26C30.4183 12 34 15.5817 34 20C34 24.4183 30.4183 28 26 28H18"
            stroke="url(#neonGradient2)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
            style={{ filter: "drop-shadow(0 0 6px oklch(0.7 0.25 330 / 70%))" }}
          />
          
          {/* Decorative corner lines */}
          <motion.line
            x1="12" y1="18" x2="12" y2="22"
            stroke="oklch(0.75 0.18 195)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            style={{ filter: "drop-shadow(0 0 3px oklch(0.75 0.18 195))" }}
          />
          <motion.line
            x1="36" y1="26" x2="36" y2="30"
            stroke="oklch(0.7 0.25 330)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            style={{ filter: "drop-shadow(0 0 3px oklch(0.7 0.25 330))" }}
          />
          
          {/* Small accent dots */}
          <motion.circle
            cx="26" cy="20"
            r="2"
            fill="oklch(0.8 0.2 150)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            style={{ filter: "drop-shadow(0 0 4px oklch(0.8 0.2 150))" }}
          />
          
          {/* Gradients */}
          <defs>
            <linearGradient id="neonGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="oklch(0.75 0.18 195)" />
              <stop offset="50%" stopColor="oklch(0.7 0.25 330)" />
              <stop offset="100%" stopColor="oklch(0.75 0.18 195)" />
            </linearGradient>
            <linearGradient id="neonGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="oklch(0.7 0.25 330)" />
              <stop offset="100%" stopColor="oklch(0.8 0.2 150)" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
      
      {/* Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <motion.span 
            className={cn(s.text, "font-bold tracking-tight")}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-neon-cyan" style={{ textShadow: "0 0 10px oklch(0.75 0.18 195 / 40%)" }}>Prime</span>
            <span className="text-neon-magenta ml-1" style={{ textShadow: "0 0 10px oklch(0.7 0.25 330 / 40%)" }}>Quote</span>
          </motion.span>
          {size !== "sm" && (
            <motion.span 
              className={cn(s.subtext, "text-muted-foreground mt-1 tracking-widest uppercase")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Eventos Prime
            </motion.span>
          )}
        </div>
      )}
    </div>
  );
}

// Alternative minimal version for headers
export function LogoMinimal({ className }: { className?: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={cn("w-10 h-10 relative", className)}
    >
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Animated hexagon outline */}
        <motion.path
          d="M24 4L42 14V34L24 44L6 34V14L24 4Z"
          stroke="url(#miniGrad1)"
          strokeWidth="1.5"
          fill="none"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ filter: "drop-shadow(0 0 4px oklch(0.75 0.18 195 / 50%))" }}
        />
        
        {/* P letter */}
        <motion.path
          d="M18 36V12H26C30.4183 12 34 15.5817 34 20C34 24.4183 30.4183 28 26 28H18"
          stroke="url(#miniGrad2)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ filter: "drop-shadow(0 0 5px oklch(0.7 0.25 330 / 60%))" }}
        />
        
        <defs>
          <linearGradient id="miniGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.75 0.18 195)" />
            <stop offset="100%" stopColor="oklch(0.7 0.25 330)" />
          </linearGradient>
          <linearGradient id="miniGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.7 0.25 330)" />
            <stop offset="100%" stopColor="oklch(0.8 0.2 150)" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
}
