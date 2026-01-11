import uuid
from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID

from app.api.deps import CurrentUser, SessionDep
from app.schemas.chatbot import ChatRequest, ChatResponse
from app.services.chatbot_service import ChatbotService

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post(
    "/studysets/{studyset_id}/chat",
    response_model=ChatResponse
)
async def chat_with_studyset(
    studyset_id: UUID,
    request: ChatRequest,
    current_user: CurrentUser,
    session: SessionDep,
):
    """
    Main chatbot endpoint - xử lý tất cả conversation logic
    
    - **studyset_id**: ID của studyset đang chat
    - **message**: Text message hoặc button value từ user
    - **conversation_id**: ID của conversation (null = conversation mới)
    - **button_clicked**: Optional - value của button được click
    """
    # Dùng real Dify service (đã setup xong)
    # Nếu muốn test với mock, đổi thành use_mock=True
    chatbot_service = ChatbotService(session, use_mock=False)
    
    # Validate access
    if not chatbot_service.validate_studyset_access(
        studyset_id, current_user.user_id, session
    ):
        raise HTTPException(
            status_code=403,
            detail="Không có quyền truy cập studyset này"
        )
    
    # Get or create conversation
    conversation = chatbot_service.get_or_create_conversation(
        studyset_id=studyset_id,
        user_id=current_user.user_id,
        conversation_id=request.conversation_id,
        session=session
    )
    
    # Use button_clicked if provided, otherwise use message
    message_to_send = request.button_clicked or request.message
    
    # Handle message
    response = await chatbot_service.handle_message(
        message=message_to_send,
        conversation=conversation,
        session=session,
        term_id=request.term_id,  # Truyền term_id nếu có
    )
    
    return response

