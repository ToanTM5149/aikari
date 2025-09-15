import React from 'react';
import { FormLabel } from '@chakra-ui/react';

export interface LabelProps {
  htmlFor?: string;
  children?: React.ReactNode;
  [key: string]: any; // Allow other props to pass through
}

export const Label: React.FC<LabelProps> = ({ children, ...props }) => {
  return (
    <FormLabel 
      fontSize="sm" 
      fontWeight="medium" 
      color="gray.700"
      mb={1}
      {...props}
    >
      {children}
    </FormLabel>
  );
};
