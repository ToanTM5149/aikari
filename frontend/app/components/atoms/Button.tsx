import React from 'react';
import { Button as ChakraButton } from '@chakra-ui/react';

export interface ButtonProps {
  variant?: 'solid' | 'outline' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactElement;
  rightIcon?: React.ReactElement;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  isDisabled?: boolean;
  children?: React.ReactNode;
  [key: string]: any; 
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'solid', 
  size = 'md', 
  children, 
  leftIcon,
  rightIcon,
  ...props 
}) => {
  return (
    <ChakraButton 
      variant={variant} 
      size={size} 
      leftIcon={leftIcon}
      rightIcon={rightIcon}
      {...props}
    >
      {children}
    </ChakraButton>
  );
};
