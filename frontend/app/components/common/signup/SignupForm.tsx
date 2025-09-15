import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  VStack, 
  HStack, 
  Grid, 
  GridItem, 
  Text, 
  Link,
  Divider,
  Flex,
  Spacer,
  IconButton,
  InputGroup,
  InputRightElement
} from '@chakra-ui/react';
import { Button } from '../../atoms/Button';
import { Input } from '../../atoms/Input';
import { Label } from '../../atoms/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../atoms/Card';
import { Select } from '../../atoms/Select';
import { Checkbox } from '../../atoms/Checkbox';
import { ProgressIndicator } from './ProgressIndicator';
import { SocialLoginButtons } from './SocialLoginButton';
import { FaEye, FaEyeSlash } from "react-icons/fa";  
import { HiChevronRight, HiChevronLeft } from "react-icons/hi"; 


interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  company: string;
  role: string;
  agreeToTerms: boolean;
  receiveUpdates: boolean;
}

const stepLabels = ['Personal', 'Security', 'Preferences'];

export function SignupForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    role: '',
    agreeToTerms: false,
    receiveUpdates: true,
  });

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission here
  };

  const isStep1Valid = formData.firstName && formData.lastName && formData.email;
  const isStep2Valid = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
  const isStep3Valid = formData.agreeToTerms;

  const canProceed = 
    (currentStep === 1 && isStep1Valid) ||
    (currentStep === 2 && isStep2Valid) ||
    (currentStep === 3 && isStep3Valid);

  return (
    <Box h="100vh" display="flex" alignItems="center" justifyContent="center" p={8}>
      <Card w="full" maxW="md">
        <CardHeader textAlign="center">
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Get started with your free account today
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <VStack spacing={6}>
          <ProgressIndicator
            currentStep={currentStep}
            totalSteps={3}
            stepLabels={stepLabels}
          />

            <Box as="form" onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <VStack spacing={4}>
                      <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                        <GridItem>
                          <VStack spacing={2} align="start">
                            <Label htmlFor="firstName">First name</Label>
                            <Input
                              id="firstName"
                              placeholder="John"
                              value={formData.firstName}
                              onChange={(e) => updateFormData('firstName', e.target.value)}
                              isRequired
                            />
                          </VStack>
                        </GridItem>
                        <GridItem>
                          <VStack spacing={2} align="start">
                            <Label htmlFor="lastName">Last name</Label>
                            <Input
                              id="lastName"
                              placeholder="Doe"
                              value={formData.lastName}
                              onChange={(e) => updateFormData('lastName', e.target.value)}
                              isRequired
                            />
                          </VStack>
                        </GridItem>
                      </Grid>
                      
                      <VStack spacing={2} align="start" w="full">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={(e) => updateFormData('email', e.target.value)}
                          isRequired
                        />
                      </VStack>
                    </VStack>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <VStack spacing={4}>
                      <VStack spacing={2} align="start" w="full">
                        <Label htmlFor="password">Password</Label>
                        <InputGroup>
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password"
                            value={formData.password}
                            onChange={(e) => updateFormData('password', e.target.value)}
                            isRequired
                          />
                          <InputRightElement>
                            <IconButton
                              aria-label={showPassword ? "Hide password" : "Show password"}
                              icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowPassword(!showPassword)}
                            />
                          </InputRightElement>
                        </InputGroup>
                      </VStack>
                      
                      <VStack spacing={2} align="start" w="full">
                        <Label htmlFor="confirmPassword">Confirm password</Label>
                        <InputGroup>
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                            isRequired
                          />
                          <InputRightElement>
                            <IconButton
                              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                              icon={showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            />
                          </InputRightElement>
                        </InputGroup>
                      </VStack>

                      {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <Text fontSize="sm" color="red.500">Passwords do not match</Text>
                      )}
                    </VStack>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <VStack spacing={4}>
                      <VStack spacing={2} align="start" w="full">
                        <Label htmlFor="company">Company (optional)</Label>
                        <Input
                          id="company"
                          placeholder="Your company name"
                          value={formData.company}
                          onChange={(e) => updateFormData('company', e.target.value)}
                        />
                      </VStack>
                      
                      <VStack spacing={2} align="start" w="full">
                        <Label htmlFor="role">Role (optional)</Label>
                        <Select 
                          placeholder="Select your role"
                          value={formData.role}
                          onChange={(e) => updateFormData('role', e.target.value)}
                        >
                          <option value="">Select your role</option>
                          <option value="developer">Developer</option>
                          <option value="designer">Designer</option>
                          <option value="manager">Manager</option>
                          <option value="founder">Founder</option>
                          <option value="student">Student</option>
                          <option value="other">Other</option>
                        </Select>
                      </VStack>

                      <VStack spacing={4} w="full">
                        <HStack align="start" w="full">
                          <Checkbox
                            id="agreeToTerms"
                            isChecked={formData.agreeToTerms}
                            onChange={(e) => updateFormData('agreeToTerms', e.target.checked)}
                          />
                          <Text fontSize="sm">
                            I agree to the <Link color="blue.500" textDecoration="underline">Terms of Service</Link> and{' '}
                            <Link color="blue.500" textDecoration="underline">Privacy Policy</Link>
                          </Text>
                        </HStack>
                        
                        <HStack align="start" w="full">
                          <Checkbox
                            id="receiveUpdates"
                            isChecked={formData.receiveUpdates}
                            onChange={(e) => updateFormData('receiveUpdates', e.target.checked)}
                          />
                          <Text fontSize="sm">
                            Send me product updates and news
                          </Text>
                        </HStack>
                      </VStack>
                    </VStack>
                  </motion.div>
                )}
            </AnimatePresence>

              <Flex justify="space-between" pt={6}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  isDisabled={currentStep === 1}
                  leftIcon={<HiChevronLeft />}
                >
                  Previous
                </Button>
                
                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    isDisabled={!canProceed}
                    rightIcon={<HiChevronRight />}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    isDisabled={!canProceed}
                  >
                    Create Account
                  </Button>
                )}
              </Flex>
            </Box>

            <Box position="relative">
              <Divider />
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                bg="white"
                px={2}
              >
                <Text fontSize="xs" textTransform="uppercase" color="gray.500">
                  Or continue with
                </Text>
              </Box>
            </Box>

            <SocialLoginButtons />

            <Text textAlign="center" fontSize="sm" color="gray.600">
              Already have an account?{' '}
              <Link color="blue.500" textDecoration="underline">
                Sign in here
              </Link>
            </Text>
          </VStack>
        </CardContent>
      </Card>
    </Box>
  );
}