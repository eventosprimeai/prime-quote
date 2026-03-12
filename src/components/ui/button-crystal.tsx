"use client";

import { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface ButtonCrystalProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "accent";
  size?: "sm" | "md" | "lg";
}

const buttonVariants = {
  primary: "btn-crystal",
  secondary: "btn-crystal-secondary",
  accent: "btn-crystal-accent",
};

const buttonSizes = {
  sm: "h-9 px-4 text-sm rounded-lg",
  md: "h-11 px-5 text-base rounded-[0.625rem]",
  lg: "h-13 px-7 text-lg rounded-[0.625rem]",
};

export const ButtonCrystal = forwardRef<HTMLButtonElement, ButtonCrystalProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          buttonVariants[variant],
          buttonSizes[size],
          "font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

ButtonCrystal.displayName = "ButtonCrystal";

// Icon Button variant
interface IconButtonProps extends Omit<ButtonCrystalProps, "size"> {
  size?: "sm" | "md" | "lg";
}

const iconButtonSizes = {
  sm: "w-9 h-9",
  md: "w-11 h-11",
  lg: "w-13 h-13",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          buttonVariants[variant],
          iconButtonSizes[size],
          "rounded-xl inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

IconButton.displayName = "IconButton";
