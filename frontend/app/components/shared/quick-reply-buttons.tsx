/**
 * Quick Reply Buttons Component
 * 
 * Hiển thị quick reply buttons từ chatbot response
 */

import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import type { QuickReplyButton as QuickReplyButtonType } from "~/redux/features/chatbot/types";

interface QuickReplyButtonsProps {
  buttons: QuickReplyButtonType[];
  onButtonClick: (value: string) => void;
  disabled?: boolean;
}

export function QuickReplyButtons({ buttons, onButtonClick, disabled }: QuickReplyButtonsProps) {
  if (!buttons || buttons.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {buttons.map((button, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => !disabled && onButtonClick(button.value)}
          disabled={disabled}
          className="text-sm rounded-lg shadow-md hover:shadow-lg transition-shadow border !bg-white !text-blue-600 hover:!bg-blue-50 hover:!text-blue-700"
        >
          {button.label}
        </Button>
      ))}
    </div>
  );
}

