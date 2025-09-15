import React from 'react';
import { Box, Text } from '@chakra-ui/react';

export interface CardProps {
  children?: React.ReactNode;
  [key: string]: any; // Allow other props to pass through
}

export const Card: React.FC<CardProps> = ({ children, ...props }) => {
  return (
    <Box
      bg="white"
      borderRadius="lg"
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.200"
      {...props}
    >
      {children}
    </Box>
  );
};

export interface CardHeaderProps {
  children?: React.ReactNode;
  [key: string]: any; // Allow other props to pass through
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, ...props }) => {
  return (
    <Box p={6} pb={0} {...props}>
      {children}
    </Box>
  );
};

export interface CardContentProps {
  children?: React.ReactNode;
  [key: string]: any; // Allow other props to pass through
}

export const CardContent: React.FC<CardContentProps> = ({ children, ...props }) => {
  return (
    <Box p={6} {...props}>
      {children}
    </Box>
  );
};

export interface CardTitleProps {
  children?: React.ReactNode;
  [key: string]: any; // Allow other props to pass through
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, ...props }) => {
  return (
    <Text
      fontSize="xl"
      fontWeight="semibold"
      color="gray.900"
      mb={2}
      {...props}
    >
      {children}
    </Text>
  );
};

export interface CardDescriptionProps {
  children?: React.ReactNode;
  [key: string]: any; // Allow other props to pass through
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, ...props }) => {
  return (
    <Text
      fontSize="sm"
      color="gray.600"
      {...props}
    >
      {children}
    </Text>
  );
};
