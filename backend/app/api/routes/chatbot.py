import uuid
from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID

from app.api.deps import CurrentUser, SessionDep
from app.schemas.chatbot import ChatRequest, ChatResponse
from app.services.chatbot_service import ChatbotService

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


# Mock endpoint để test UI (có thể xóa sau khi có Dify)
@router.post(
    "/studysets/{studyset_id}/chat/mock",
    response_model=ChatResponse,
    include_in_schema=False,  # Ẩn trong docs
)
async def chat_with_studyset_mock(
    studyset_id: UUID,
    request: ChatRequest,
    current_user: CurrentUser,
):
    """
    Mock endpoint để test UI chatbot trước khi có Dify
    Trả về response giả để test UI flow
    """
    from app.models.enums import ConversationState
    from app.schemas.chatbot import QuickReplyButton
    
    # Mock conversation flow
    message = request.message or request.button_clicked or ""
    conversation_id = request.conversation_id or uuid.uuid4()
    
    # Initial message
    if not request.conversation_id:
        return ChatResponse(
            conversation_id=conversation_id,
            message="👋 Xin chào! Tôi có thể giúp bạn:\n\n• Tạo bài test từ flashcards\n• Tạo đoạn văn giải thích\n• Trả lời câu hỏi về nội dung học tập",
            state=ConversationState.WAITING_INTENT,
            quick_replies=[
                QuickReplyButton(label="📝 Tạo bài test", value="gen_test", type="text"),
                QuickReplyButton(label="📄 Tạo paragraph", value="gen_paragraph", type="text"),
                QuickReplyButton(label="❓ Đặt câu hỏi", value="ask_question", type="text"),
            ],
            show_input=True,
        )
    
    # Handle intent selection
    if message in ["gen_test", "Tạo bài test", "tạo test"]:
        return ChatResponse(
            conversation_id=conversation_id,
            message="Bạn muốn bao nhiêu câu hỏi?",
            state=ConversationState.COLLECTING_TEST_PARAMS,
            quick_replies=[
                QuickReplyButton(label="5 câu", value="5", type="number"),
                QuickReplyButton(label="10 câu", value="10", type="number"),
                QuickReplyButton(label="15 câu", value="15", type="number"),
                QuickReplyButton(label="20 câu", value="20", type="number"),
            ],
            show_input=True,
        )
    
    # Handle question count
    if message.isdigit() and int(message) in [5, 10, 15, 20]:
        return ChatResponse(
            conversation_id=conversation_id,
            message="Chọn loại câu hỏi:",
            state=ConversationState.COLLECTING_TEST_PARAMS,
            quick_replies=[
                QuickReplyButton(label="Trắc nghiệm", value="MULTIPLE_CHOICE", type="option"),
                QuickReplyButton(label="Đúng/Sai", value="TRUE_FALSE", type="option"),
                QuickReplyButton(label="Tự luận", value="ESSAY", type="option"),
            ],
            metadata={"total_questions": int(message)},
            show_input=True,
        )
    
    # Handle question type
    if message in ["MULTIPLE_CHOICE", "TRUE_FALSE", "ESSAY"]:
        return ChatResponse(
            conversation_id=conversation_id,
            message="Giới hạn thời gian (phút)?",
            state=ConversationState.COLLECTING_TEST_PARAMS,
            quick_replies=[
                QuickReplyButton(label="10 phút", value="10", type="number"),
                QuickReplyButton(label="15 phút", value="15", type="number"),
                QuickReplyButton(label="20 phút", value="20", type="number"),
                QuickReplyButton(label="Không giới hạn", value="none", type="text"),
            ],
            show_input=True,
        )
    
    # Handle time limit
    if message.isdigit() or message == "none":
        time_limit = int(message) if message.isdigit() else None
        return ChatResponse(
            conversation_id=conversation_id,
            message=f"Xác nhận tạo test:\n• Số câu: 10\n• Loại: Trắc nghiệm\n• Thời gian: {time_limit if time_limit else 'Không giới hạn'} phút",
            state=ConversationState.COLLECTING_TEST_PARAMS,
            quick_replies=[
                QuickReplyButton(label="✅ Xác nhận", value="confirm", type="text"),
                QuickReplyButton(label="✏️ Sửa lại", value="cancel", type="text"),
            ],
            show_input=True,
        )
    
    # Handle confirmation
    if message == "confirm":
        # Mock generate test
        mock_test_id = uuid.uuid4()
        return ChatResponse(
            conversation_id=conversation_id,
            message=f"✅ Đã tạo bài test thành công với 10 câu hỏi! (MOCK)\n\nTest ID: {mock_test_id}\n\nSẽ tự động chuyển đến trang test...",
            state=ConversationState.COMPLETED,
            metadata={
                "test_id": str(mock_test_id),
                "total_questions": 10,
            },
            show_input=True,
        )
    
    # Handle paragraph
    if message in ["gen_paragraph", "Tạo paragraph", "tạo paragraph"]:
        return ChatResponse(
            conversation_id=conversation_id,
            message="📄 Đoạn văn đã được tạo:\n\n[MOCK] Quá trình quang hợp là một trong những quá trình quan trọng nhất trong sinh học. Quá trình này diễn ra trong chloroplast, nơi chứa chất diệp lục. Thực vật sử dụng ánh sáng mặt trời để chuyển đổi carbon dioxide và nước thành glucose và oxy.",
            state=ConversationState.COMPLETED,
            metadata={
                "paragraph": "[MOCK] Paragraph text...",
                "key_concepts": ["Photosynthesis", "Chloroplast"],
                "word_count": 250,
            },
            show_input=True,
        )
    
    # Handle question
    if message in ["ask_question", "Đặt câu hỏi"]:
        return ChatResponse(
            conversation_id=conversation_id,
            message="Bạn muốn hỏi gì về nội dung học tập?",
            state=ConversationState.WAITING_INTENT,
            show_input=True,
        )
    
    # Default response
    return ChatResponse(
        conversation_id=conversation_id,
        message=f"[MOCK] Bạn đã gửi: {message}\n\nĐây là mock response để test UI. Khi có Dify, response sẽ được generate từ AI.",
        state=ConversationState.WAITING_INTENT,
        show_input=True,
    )


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
        session=session
    )
    
    return response

