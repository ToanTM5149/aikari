import { motion } from 'framer-motion';
import { MdCheck } from 'react-icons/md';
import { Box, Flex, Text, Circle } from '@chakra-ui/react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export function ProgressIndicator({ currentStep, totalSteps, stepLabels }: ProgressIndicatorProps) {
  return (
    <Box mb={8}>
      <Flex align="center" justify="space-between">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <Flex key={index} direction="column" align="center">
              <Flex align="center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Circle
                    size="32px"
                    bg={
                      isCompleted
                        ? 'green.500'
                        : isCurrent
                        ? 'blue.500'
                        : 'gray.200'
                    }
                    color={
                      isCompleted || isCurrent
                        ? 'white'
                        : 'gray.500'
                    }
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    transition="all 0.3s"
                  >
                    {isCompleted ? (
                      <MdCheck size="16px" />
                    ) : (
                      <Text fontSize="sm" fontWeight="medium">{stepNumber}</Text>
                    )}
                  </Circle>
                </motion.div>
                
                {index < totalSteps - 1 && (
                  <Box w="64px" h="1px" mx={2} bg="gray.200" position="relative">
                    <motion.div
                      style={{
                        height: '100%',
                        backgroundColor: '#3182ce',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                      }}
                      initial={{ width: "0%" }}
                      animate={{ width: isCompleted ? "100%" : "0%" }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    />
                  </Box>
                )}
              </Flex>
              
              <Text
                fontSize="xs"
                mt={2}
                textAlign="center"
                color={isCurrent ? 'gray.900' : 'gray.500'}
              >
                {label}
              </Text>
            </Flex>
          );
        })}
      </Flex>
    </Box>
  );
}