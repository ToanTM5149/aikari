/**
 * Chatbot API Endpoints
 * 
 * RTK Query endpoints cho chatbot functionality
 * Sync với backend: /api/v1/chatbot
 */

import { baseApi } from '../../store/api/baseApi';
import type { ChatRequest, ChatResponse } from './types';

/**
 * Chatbot API Endpoints
 * 
 * Inject endpoints vào baseApi
 */
export const chatbotApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Send Chat Message
     * POST /api/v1/chatbot/studysets/{studyset_id}/chat
     */
    sendChatMessage: builder.mutation<ChatResponse, ChatRequest & { studyset_id: string }>({
      query: ({ studyset_id, ...body }) => ({
        url: `/chatbot/studysets/${studyset_id}/chat`,
        method: 'POST',
        body,  // body không chứa studyset_id, chỉ có message, conversation_id, button_clicked
      }),
      // Không cache vì mỗi message là unique
    }),
  }),
});

export const {
  useSendChatMessageMutation,
} = chatbotApi;

