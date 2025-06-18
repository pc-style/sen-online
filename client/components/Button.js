import React from 'react';
import { motion } from 'framer-motion';
import soundEffects from '../utils/soundEffects.js';

const Button = ({ 
  children, 
  onClick, 
  className = '', 
  variant = 'primary',
  size = 'medium',
  disabled = false,
  soundEnabled = true,
  ...props 
}) => {
  const handleClick = (e) => {
    if (disabled) return;
    
    if (soundEnabled) {
      soundEffects.buttonClick();
    }
    
    if (onClick) {
      onClick(e);
    }
  };

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.02,
      transition: { duration: 0.2 }
    },
    tap: { 
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  };

  const baseClasses = 'btn';
  const variantClasses = {
    primary: '',
    secondary: 'btn-secondary',
    tertiary: 'btn-tertiary',
    error: 'btn-error',
    success: 'btn-success'
  };
  
  const sizeClasses = {
    small: 'btn-small',
    medium: '',
    large: 'btn-large'
  };

  const buttonClasses = [
    baseClasses,
    variantClasses[variant] || '',
    sizeClasses[size] || '',
    disabled ? 'btn-disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <motion.button
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled}
      variants={buttonVariants}
      initial="initial"
      whileHover={!disabled ? "hover" : "initial"}
      whileTap={!disabled ? "tap" : "initial"}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button; 