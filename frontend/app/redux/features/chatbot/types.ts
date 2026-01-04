/**
 * Chatbot Types
 * 
 * Types cho chatbot feature, sync với backend schemas
 */

export interface QuickReplyButton {
  label: string;
  value: string;
  type: "text" | "number" | "option";
  icon?: string | null;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string | null;
  button_clicked?: string | null;
}

export type ConversationState = 
  | "INITIAL"
  | "WAITING_INTENT"
  | "COLLECTING_TEST_PARAMS"
  | "GENERATING"
  | "COMPLETED";

export interface ChatResponse {
  conversation_id: string;
  message: string;
  state: ConversationState;
  quick_replies?: QuickReplyButton[] | null;
  metadata?: Record<string, any> | null;
  show_input: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  quick_replies?: QuickReplyButton[];
  metadata?: Record<string, any>;
}

