import React from "react";
import { Box, Flex, Text, useColorModeValue } from "@chakra-ui/react";


interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  showText = true,
  className = "",
}) => {
  const sizeMap: Record<string, string> = {
    sm: "2rem", // 8
    md: "3rem", // 12
    lg: "4rem", // 16
    xl: "6rem", // 24
  };

  const textSizeMap: Record<string, string> = {
    sm: "lg",
    md: "2xl",
    lg: "4xl",
    xl: "6xl",
  };

  const gradientStart = useColorModeValue("blue.400", "blue.500");
  const gradientEnd = useColorModeValue("blue.600", "blue.700");

  return (
    <Flex align="center" gap={3} className={className}>
      {/* Logo Icon */}
      <Flex
        w={sizeMap[size]}
        h={sizeMap[size]}
        bgGradient={`linear(to-br, ${gradientStart}, ${gradientEnd})`}
        rounded="xl"
        align="center"
        justify="center"
        boxShadow="lg"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          width="60%"
          height="60%"
          style={{ color: "white" }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* AI Circuit Pattern */}
          <path
            d="M12 2L13.5 6.5L18 8L13.5 9.5L12 14L10.5 9.5L6 8L10.5 6.5L12 2Z"
            fill="currentColor"
            opacity="0.9"
          />
          {/* Neural Network Nodes */}
          <circle cx="7" cy="17" r="1.5" fill="currentColor" opacity="0.7" />
          <circle cx="12" cy="19" r="1.5" fill="currentColor" opacity="0.7" />
          <circle cx="17" cy="17" r="1.5" fill="currentColor" opacity="0.7" />
          {/* Connecting Lines */}
          <path
            d="M7 17L12 14M12 14L17 17M7 17L12 19M12 19L17 17"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.5"
          />
        </svg>
      </Flex>

      {/* App Name */}
      {showText && (
        <Flex direction="column">
          <Text
            fontSize={textSizeMap[size]}
            fontWeight="bold"
            bgGradient="linear(to-r, blue.600, blue.800)"
            bgClip="text"
            color="transparent"
            letterSpacing="-0.5px"
          >
            AIKARI
          </Text>
          {(size === "lg" || size === "xl") && (
            <Text color="blue.600" opacity={0.7} fontSize="sm" letterSpacing="wide" textTransform="uppercase">
              AI Assistant
            </Text>
          )}
        </Flex>
      )}
    </Flex>
  );
};
