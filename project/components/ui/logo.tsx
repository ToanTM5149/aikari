import React from "react";

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
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-6xl",
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div
        className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-4/5 h-4/5 text-white"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* AI Circuit Pattern */}
          <path
            d="M12 2L13.5 6.5L18 8L13.5 9.5L12 14L10.5 9.5L6 8L10.5 6.5L12 2Z"
            fill="currentColor"
          />
          {/* Neural Network Nodes */}
          <circle cx="7" cy="17" r="1.5" fill="currentColor" />
          <circle cx="12" cy="19" r="1.5" fill="currentColor" />
          <circle cx="17" cy="17" r="1.5" fill="currentColor" />
          {/* Connecting Lines */}
          <path
            d="M7 17L12 14M12 14L17 17M7 17L12 19M12 19L17 17"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.5"
          />
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <span
          className={`font-semibold text-foreground ${textSizeClasses[size]}`}
        >
          AIKARI
        </span>
      )}
    </div>
  );
};