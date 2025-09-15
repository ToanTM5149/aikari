import React from 'react';
import { Checkbox as ChakraCheckbox } from '@chakra-ui/react';

export interface CheckboxProps {
  id?: string;
  isChecked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckedChange?: (checked: boolean) => void;
  children?: React.ReactNode;
  [key: string]: any; // Allow other props to pass through
}

export const Checkbox: React.FC<CheckboxProps> = ({ 
  onCheckedChange, 
  onChange,
  ...props 
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onCheckedChange) {
      onCheckedChange(e.target.checked);
    }
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <ChakraCheckbox 
      colorScheme="blue"
      onChange={handleChange}
      {...props}
    />
  );
};
