import React from 'react';
import { Input as ChakraInput } from '@chakra-ui/react';

export interface InputProps {
  id?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isRequired?: boolean;
  [key: string]: any; // Allow other props to pass through
}

export const Input: React.FC<InputProps> = ({ ...props }) => {
  return (
    <ChakraInput 
      borderColor="gray.300"
      _hover={{ borderColor: 'gray.400' }}
      _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px #3182ce' }}
      {...props}
    />
  );
};
