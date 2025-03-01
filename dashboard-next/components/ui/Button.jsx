import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Variantes de boutons
const variants = {
  primary: 'bg-discord-blurple hover:bg-discord-blurple/90 text-white',
  secondary: 'bg-white dark:bg-discord-light-gray border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-discord-light-gray/90',
  success: 'bg-discord-green hover:bg-discord-green/90 text-white',
  danger: 'bg-discord-red hover:bg-discord-red/90 text-white',
  warning: 'bg-discord-yellow hover:bg-discord-yellow/90 text-white',
  info: 'bg-blue-500 hover:bg-blue-600 text-white',
  ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-discord-light-gray text-gray-700 dark:text-gray-200',
};

// Tailles de boutons
const sizes = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
  xl: 'px-6 py-3 text-lg',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  isExternal = false,
  className = '',
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  animate = true,
  onClick,
  type = 'button',
  ...props
}) {
  // Classes communes
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-md
    transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-discord-blurple
    ${variants[variant] || variants.primary}
    ${sizes[size] || sizes.md}
    ${fullWidth ? 'w-full' : ''}
    ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
    ${className}
  `;

  // Si le bouton est un lien
  if (href) {
    const linkProps = isExternal
      ? { target: '_blank', rel: 'noopener noreferrer' }
      : {};

    return (
      <Link href={href} {...linkProps} className={baseClasses} {...props}>
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </Link>
    );
  }

  // Si le bouton est un bouton standard
  const ButtonComponent = animate ? motion.button : 'button';
  const animateProps = animate
    ? {
        whileHover: { y: -2 },
        whileTap: { y: 0 },
      }
    : {};

  return (
    <ButtonComponent
      type={type}
      className={baseClasses}
      disabled={disabled}
      onClick={onClick}
      {...animateProps}
      {...props}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </ButtonComponent>
  );
}