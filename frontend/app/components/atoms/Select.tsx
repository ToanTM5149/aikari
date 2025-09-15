import React from 'react';
import { Select as ChakraSelect } from '@chakra-ui/react';

export interface SelectProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children?: React.ReactNode;
  [key: string]: any; // Allow other props to pass through
}

export const Select: React.FC<SelectProps> = ({ children, ...props }) => {
  return (
    <ChakraSelect 
      borderColor="gray.300"
      _hover={{ borderColor: 'gray.400' }}
      _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px #3182ce' }}
      {...props}
    >
      {children}
    </ChakraSelect>
  );
};

// For compatibility with the existing code structure
export const SelectContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const SelectItem: React.FC<{ value: string; children: React.ReactNode }> = ({ value, children }) => {
  return <option value={value}>{children}</option>;
};

export const SelectTrigger = Select;

export const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  // This is handled by the Select component's placeholder prop
  return null;
};
