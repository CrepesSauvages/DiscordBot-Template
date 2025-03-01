import React from 'react';
import { motion } from 'framer-motion';

export function Card({
  children,
  className = '',
  hover = false,
  animate = true,
  padding = 'md',
  shadow = 'sm',
  border = false,
  onClick,
  ...props
}) {
  // Définir les classes de padding
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  // Définir les classes d'ombre
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm hover:shadow',
    md: 'shadow hover:shadow-md',
    lg: 'shadow-md hover:shadow-lg',
  };

  // Classes de base pour la carte
  const baseClasses = `
    bg-card 
    rounded-lg 
    ${paddingClasses[padding] || paddingClasses.md}
    ${shadowClasses[shadow] || shadowClasses.sm}
    ${border ? 'border border-gray-200 dark:border-gray-800' : ''}
    ${hover ? 'transition-all duration-200' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `;

  // Si l'animation est activée, utiliser motion.div
  if (animate) {
    return (
      <motion.div
        className={baseClasses}
        whileHover={hover ? { y: -5 } : {}}
        onClick={onClick}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  // Sinon, utiliser un div standard
  return (
    <div className={baseClasses} onClick={onClick} {...props}>
      {children}
    </div>
  );
}

// Sous-composants pour une utilisation plus structurée
Card.Header = function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

Card.Title = function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-xl font-bold ${className}`} {...props}>
      {children}
    </h3>
  );
};

Card.Subtitle = function CardSubtitle({ children, className = '', ...props }) {
  return (
    <p className={`text-sm text-gray-500 dark:text-gray-400 mt-1 ${className}`} {...props}>
      {children}
    </p>
  );
};

Card.Body = function CardBody({ children, className = '', ...props }) {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
};

Card.Footer = function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 ${className}`} {...props}>
      {children}
    </div>
  );
};

// Exemple d'utilisation:
// <Card>
//   <Card.Header>
//     <Card.Title>Titre de la carte</Card.Title>
//     <Card.Subtitle>Sous-titre de la carte</Card.Subtitle>
//   </Card.Header>
//   <Card.Body>
//     Contenu de la carte
//   </Card.Body>
//   <Card.Footer>
//     Pied de la carte
//   </Card.Footer>
// </Card>