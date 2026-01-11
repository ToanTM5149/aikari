import logging
import uuid
from typing import Any

from sqlmodel import Session, select

from app.models.conversation import ChatConversation, ChatMessage
from app.models.enums import ConversationIntent, ConversationState
from app.models.studyset import StudySet
from app.schemas.chatbot import ChatResponse, QuickReplyButton
from app.services.generation_service import GenerationService

logger = logging.getLogger(__name__)


class ChatbotService:
    """Service xử lý logic chatbot conversation"""
    
    def __init__(self, session: Session, use_mock: bool = False):
        self.session = session
        self.generation_service = GenerationService(session)
    
    def get_or_create_conversation(
        self,
        studyset_id: uuid.UUID,
        user_id: uuid.UUID,
        conversation_id: uuid.UUID | None,
        session: Session,
    ) -> ChatConversation:
        """
        Lấy conversation hiện tại hoặc tạo mới
        """
        if conversation_id:
            # Load existing conversation
            statement = select(ChatConversation).where(
                ChatConversation.conversation_id == conversation_id,
                ChatConversation.studyset_id == studyset_id,
                ChatConversation.user_id == user_id,
            )
            conversation = session.exec(statement).first()
            if conversation:
                return conversation
        
        # Create new conversation
        conversation = ChatConversation(
            studyset_id=studyset_id,
            user_id=user_id,
            state=ConversationState.INITIAL,
        )
        session.add(conversation)
        session.commit()
        session.refresh(conversation)
        
        return conversation
    
    def detect_user_intent(
        self,
        message: str,
        conversation: ChatConversation,
    ) -> ConversationIntent:
        """
        Detect user intent từ message
        Simple keyword matching (có thể nâng cấp thành LLM classification)
        """
        message_lower = message.lower().strip()
        
        # Check keywords
        if any(keyword in message_lower for keyword in ["tạo test", "generate test", "test", "bài test", "gen_test"]):
            return ConversationIntent.GEN_TEST
        elif any(keyword in message_lower for keyword in ["tạo paragraph", "paragraph", "đoạn văn", "ví dụ", "gen_paragraph"]):
            return ConversationIntent.GEN_PARAGRAPH
        elif any(keyword in message_lower for keyword in ["hỏi", "câu hỏi", "giải thích", "là gì", "ask_question"]):
            return ConversationIntent.ASK_QUESTION
        else:
            # Default: ask question
            return ConversationIntent.ASK_QUESTION
    
    def handle_initial_message(
        self,
        conversation: ChatConversation,
        session: Session,
    ) -> ChatResponse:
        """
        Xử lý message đầu tiên - gửi welcome message với options
        """
        # Update state
        conversation.state = ConversationState.WAITING_INTENT
        session.add(conversation)
        session.commit()
        
        # Create welcome message
        welcome_text = "Hello! How can I help you?"
        
        # Check if user is member only (không cho phép gen test)
        is_member = self.is_member_only(
            studyset_id=conversation.studyset_id,
            user_id=conversation.user_id,
            session=session
        )
        
        # Create quick reply buttons
        quick_replies = []
        
        # Chỉ hiển thị "Tạo bài test" nếu không phải member only
        if not is_member:
            quick_replies.append(
                QuickReplyButton(
                    label="Create Test",
                    value="gen_test",
                )
            )
        
        quick_replies.extend([
            QuickReplyButton(
                label="Create Paragraph",
                value="gen_paragraph",
            ),
            QuickReplyButton(
                label="Ask Question",
                value="ask_question",
            ),
        ])
        
        # Save bot message
        bot_message = ChatMessage(
            conversation_id=conversation.conversation_id,
            role="assistant",
            content=welcome_text,
            message_metadata={"quick_replies": [btn.model_dump() for btn in quick_replies]},
        )
        session.add(bot_message)
        session.commit()
        
        return ChatResponse(
            conversation_id=conversation.conversation_id,
            message=welcome_text,
            state=conversation.state,
            quick_replies=quick_replies,
            show_input=True,
        )
    
    async def handle_message(
        self,
        message: str,
        conversation: ChatConversation,
        session: Session,
        term_id: uuid.UUID | None = None,  # Optional: term_id khi generate paragraph
    ) -> ChatResponse:
        """
        Main handler cho tất cả messages
        """
        # Handle initial message or empty message
        if not message or message.strip() == "" or message == "__INIT__" or conversation.state == ConversationState.INITIAL:
            return self.handle_initial_message(conversation, session)
        
        # Save user message (skip for initial/empty messages)
        user_message = ChatMessage(
            conversation_id=conversation.conversation_id,
            role="user",
            content=message,
        )
        session.add(user_message)
        session.commit()
        
        # Handle based on state
        if conversation.state == ConversationState.INITIAL:
            return self.handle_initial_message(conversation, session)
        
        elif conversation.state == ConversationState.WAITING_INTENT:
            return await self.handle_intent_selection(message, conversation, session, term_id=term_id)
        
        elif conversation.state == ConversationState.COLLECTING_TEST_PARAMS:
            return await self.handle_test_param_collection(message, conversation, session)
        
        elif conversation.state == ConversationState.GENERATING:
            # Still generating, ignore message
            return ChatResponse(
                conversation_id=conversation.conversation_id,
                message="Processing, please wait...",
                state=conversation.state,
                show_input=False,
            )
        
        elif conversation.state == ConversationState.COMPLETED:
            # Conversation completed - only handle free questions, don't ask params again
            return await self.handle_free_question(message, conversation, session)
        
        else:
            # Unknown state - treat as new question
            return await self.handle_free_question(message, conversation, session)
    
    async def handle_intent_selection(
        self,
        message: str,
        conversation: ChatConversation,
        session: Session,
        term_id: uuid.UUID | None = None,  # Optional: term_id khi generate paragraph
    ) -> ChatResponse:
        """
        Xử lý khi user chọn intent (gen_test, gen_paragraph, ask_question)
        """
        # Detect intent từ message hoặc button value
        intent_value = message.strip()
        
        if intent_value == "gen_test" or "test" in intent_value.lower():
            # Kiểm tra quyền: member không được gen test
            is_member = self.is_member_only(
                studyset_id=conversation.studyset_id,
                user_id=conversation.user_id,
                session=session
            )
            
            if is_member:
                # Member không được phép gen test
                return ChatResponse(
                    conversation_id=conversation.conversation_id,
                    message="You don't have permission to create tests. You can only create paragraphs or ask questions.",
                    state=conversation.state,
                    show_input=True,
                )
            
            # Start collecting test params
            conversation.intent = ConversationIntent.GEN_TEST
            conversation.state = ConversationState.COLLECTING_TEST_PARAMS
            conversation.collected_params = {}
            session.add(conversation)
            session.commit()
            
            # Ask for number of questions
            return self._ask_for_question_count(conversation, session)
        
        elif intent_value == "gen_paragraph" or "paragraph" in intent_value.lower():
            # Generate paragraph immediately
            conversation.intent = ConversationIntent.GEN_PARAGRAPH
            conversation.state = ConversationState.GENERATING
            session.add(conversation)
            session.commit()
            
            # Generate paragraph - truyền term_id nếu có
            result = await self.generation_service.generate_paragraph(
                studyset_id=conversation.studyset_id,
                user_id=conversation.user_id,
                session=session,
                term_id=term_id,  # Truyền term_id nếu có
            )
            
            # Update state
            conversation.state = ConversationState.COMPLETED
            session.add(conversation)
            session.commit()
            
            return ChatResponse(
                conversation_id=conversation.conversation_id,
                message=result["message"],
                state=conversation.state,
                metadata=result.get("metadata"),
                show_input=True,
            )
        
        else:
            # Treat as free question
            return await self.handle_free_question(message, conversation, session)
    
    def _ask_for_question_count(
        self,
        conversation: ChatConversation,
        session: Session,
    ) -> ChatResponse:
        """Hỏi số câu hỏi"""
        message_text = "How many questions do you want in the test?"
        
        quick_replies = [
            QuickReplyButton(label="5 questions", value="5", type="number"),
            QuickReplyButton(label="10 questions", value="10", type="number"),
            QuickReplyButton(label="15 questions", value="15", type="number"),
            QuickReplyButton(label="20 questions", value="20", type="number"),
        ]
        
        # Save bot message
        bot_message = ChatMessage(
            conversation_id=conversation.conversation_id,
            role="assistant",
            content=message_text,
            message_metadata={"step": "question_count", "quick_replies": [btn.model_dump() for btn in quick_replies]},
        )
        session.add(bot_message)
        session.commit()
        
        return ChatResponse(
            conversation_id=conversation.conversation_id,
            message=message_text,
            state=conversation.state,
            quick_replies=quick_replies,
            show_input=True,
        )
    
    async def handle_test_param_collection(
        self,
        message: str,
        conversation: ChatConversation,
        session: Session,
    ) -> ChatResponse:
        """
        Collect test parameters: số câu → loại câu hỏi → time limit
        """
        # Refresh conversation from DB to get latest params
        session.refresh(conversation)
        # IMPORTANT: Ensure params is a proper dict (not a JSONB proxy object)
        params = dict(conversation.collected_params) if conversation.collected_params else {}
        if not isinstance(params, dict):
            params = {}
            conversation.collected_params = params
        
        # Debug logging
        logger.info(f"handle_test_param_collection - message: '{message}', params: {params}")
        
        # Check if all params are collected (confirmation step)
        has_total_questions = "total_questions" in params and params.get("total_questions") is not None
        has_question_types = "question_types" in params and params.get("question_types") and len(params.get("question_types", [])) > 0
        has_time_limit = "time_limit" in params  # None is valid for time_limit
        
        logger.info(f"Params check - total_questions: {has_total_questions}, question_types: {has_question_types}, time_limit: {has_time_limit}")
        
        # Step 4: Handle confirmation if all params collected
        if has_total_questions and has_question_types and has_time_limit:
            logger.info("All params collected - handling confirmation")
            # Handle confirmation or generate
            if message.lower().strip() in ["xác nhận", "ok", "tạo", "yes", "confirm"]:
                # Generate test
                conversation.state = ConversationState.GENERATING
                session.add(conversation)
                session.commit()
                
                result = await self.generation_service.generate_test_from_params(
                    studyset_id=conversation.studyset_id,
                    params=params,
                    user_id=conversation.user_id,
                    session=session,
                )
                
                conversation.state = ConversationState.COMPLETED
                conversation.collected_params = {}  # Clear params after completion
                session.add(conversation)
                session.commit()
                
                return ChatResponse(
                    conversation_id=conversation.conversation_id,
                    message=result["message"],
                    state=conversation.state,
                    metadata=result.get("metadata"),
                    show_input=True,
                )
            elif message.lower().strip() in ["hủy", "cancel", "sửa lại", "edit", "reset"]:
                # Reset and start over
                conversation.collected_params = {}
                conversation.state = ConversationState.WAITING_INTENT
                session.add(conversation)
                session.commit()
                return self.handle_initial_message(conversation, session)
            else:
                # Still waiting for confirmation - show confirmation again
                return self._show_test_confirmation(conversation, session)
        
        # Step 1: Collect question count
        elif "total_questions" not in params:
            # Check if message is a valid number
            try:
                count = int(message.strip())
                if count < 1 or count > 50:
                    return ChatResponse(
                        conversation_id=conversation.conversation_id,
                        message="Please enter a number between 1 and 50",
                        state=conversation.state,
                        quick_replies=[
                            QuickReplyButton(label="5 questions", value="5", type="number"),
                            QuickReplyButton(label="10 questions", value="10", type="number"),
                            QuickReplyButton(label="15 questions", value="15", type="number"),
                            QuickReplyButton(label="20 questions", value="20", type="number"),
                        ],
                        show_input=True,
                    )
                # Valid number - save and move to next step
                # IMPORTANT: Update params dict and save to conversation
                params = conversation.collected_params or {}
                params["total_questions"] = count
                conversation.collected_params = params
                session.add(conversation)
                session.commit()
                session.refresh(conversation)  # Refresh to ensure params are updated
                
                logger.info(f"After saving total_questions, params: {conversation.collected_params}")
                
                # Ask for question type
                return self._ask_for_question_type(conversation, session)
            except ValueError:
                # Not a number - show error with buttons
                return ChatResponse(
                    conversation_id=conversation.conversation_id,
                    message="Please enter a valid number or choose from the options below:",
                    state=conversation.state,
                    quick_replies=[
                        QuickReplyButton(label="5 questions", value="5", type="number"),
                        QuickReplyButton(label="10 questions", value="10", type="number"),
                        QuickReplyButton(label="15 questions", value="15", type="number"),
                        QuickReplyButton(label="20 questions", value="20", type="number"),
                    ],
                    show_input=True,
                )
        
        # Step 2: Collect question type
        elif "question_types" not in params or not params.get("question_types"):
            logger.info(f"Step 2: Collecting question type, message: '{message}', current params: {params}")
            # Check if message is a valid question type
            valid_types = {
                "MULTIPLE_CHOICE": "MULTIPLE_CHOICE",
                "TRUE_FALSE": "TRUE_FALSE",
                "ESSAY": "ESSAY",
                "MIXED": "MIXED",
            }
            
            type_mapping = {
                "multiple_choice": "MULTIPLE_CHOICE",
                "trắc nghiệm": "MULTIPLE_CHOICE",
                "true_false": "TRUE_FALSE",
                "đúng/sai": "TRUE_FALSE",
                "essay": "ESSAY",
                "tự luận": "ESSAY",
                "mixed": "MIXED",
                "hỗn hợp": "MIXED",
            }
            
            message_upper = message.strip().upper()
            message_lower = message.lower().strip()
            question_type = None
            
            logger.info(f"Checking message_upper: '{message_upper}', message_lower: '{message_lower}'")
            
            # Check if it's a direct type value (MULTIPLE_CHOICE, etc.)
            if message_upper in valid_types:
                question_type = message_upper
                logger.info(f"Found direct type: {question_type}")
            else:
                # Check mapping
                for key, value in type_mapping.items():
                    if key in message_lower:
                        question_type = value
                        logger.info(f"Found mapped type: {question_type} from key: {key}")
                        break
            
            # If still not found, show error with buttons
            if not question_type:
                logger.warning(f"Question type not found for message: '{message}'")
                return ChatResponse(
                    conversation_id=conversation.conversation_id,
                    message="Please select a question type from the options below:",
                    state=conversation.state,
                    quick_replies=[
                        QuickReplyButton(label="Multiple Choice", value="MULTIPLE_CHOICE", type="option"),
                        QuickReplyButton(label="True/False", value="TRUE_FALSE", type="option"),
                        QuickReplyButton(label="Essay", value="ESSAY", type="option"),
                        QuickReplyButton(label="Mixed", value="MIXED", type="option"),
                    ],
                    show_input=True,
                )
            
            # Valid type - save and move to next step
            # IMPORTANT: Get fresh params from conversation before updating
            params = dict(conversation.collected_params) if conversation.collected_params else {}
            params["question_types"] = [question_type]
            conversation.collected_params = params
            session.add(conversation)
            session.commit()
            session.refresh(conversation)  # Refresh to ensure params are updated
            
            # Double check params after refresh
            refreshed_params = conversation.collected_params or {}
            logger.info(f"After saving question_types, params before refresh: {params}")
            logger.info(f"After saving question_types, params after refresh: {refreshed_params}")
            
            # Verify question_types was saved
            if "question_types" not in refreshed_params:
                logger.error(f"ERROR: question_types not saved! Params: {refreshed_params}")
                # Try to save again
                refreshed_params["question_types"] = [question_type]
                conversation.collected_params = refreshed_params
                session.add(conversation)
                session.commit()
                session.refresh(conversation)
                logger.info(f"Retry save question_types, params: {conversation.collected_params}")
            
            # Ask for time limit
            return self._ask_for_time_limit(conversation, session)
        
        # Step 3: Collect time limit (only if we have question_types and total_questions)
        elif "time_limit" not in params and "question_types" in params and "total_questions" in params:
            try:
                message_lower = message.lower().strip()
                # IMPORTANT: Get fresh params and ensure it's a dict
                params = dict(conversation.collected_params) if conversation.collected_params else {}
                
                if message_lower in ["không", "không giới hạn", "none", "no", "unlimited", "no limit"]:
                    params["time_limit"] = None
                else:
                    limit = int(message.strip())
                    if limit < 1:
                        return ChatResponse(
                            conversation_id=conversation.conversation_id,
                            message="Please enter a valid number of minutes (≥1) or choose from the options below:",
                            state=conversation.state,
                            quick_replies=[
                                QuickReplyButton(label="10 minutes", value="10", type="number"),
                                QuickReplyButton(label="15 minutes", value="15", type="number"),
                                QuickReplyButton(label="20 minutes", value="20", type="number"),
                                QuickReplyButton(label="30 minutes", value="30", type="number"),
                                QuickReplyButton(label="Unlimited", value="none", type="text"),
                            ],
                            show_input=True,
                        )
                    params["time_limit"] = limit
                
                # Save time_limit
                conversation.collected_params = params
                session.add(conversation)
                session.commit()
                session.refresh(conversation)  # Refresh to ensure params are updated
                
                # Verify params were saved
                refreshed_params = conversation.collected_params or {}
                logger.info(f"After saving time_limit, params: {refreshed_params}")
                
                # IMPORTANT: Always show confirmation after time_limit is saved
                # Show simple confirmation message with confirm button
                return self._show_test_confirmation(conversation, session)
            except ValueError:
                return ChatResponse(
                    conversation_id=conversation.conversation_id,
                    message="Please enter a valid number of minutes or choose from the options below:",
                    state=conversation.state,
                    quick_replies=[
                        QuickReplyButton(label="10 minutes", value="10", type="number"),
                        QuickReplyButton(label="15 minutes", value="15", type="number"),
                        QuickReplyButton(label="20 minutes", value="20", type="number"),
                        QuickReplyButton(label="30 minutes", value="30", type="number"),
                        QuickReplyButton(label="Unlimited", value="none", type="text"),
                    ],
                    show_input=True,
                )
        
        else:
            # Invalid input - show current step's question again with buttons
            if "total_questions" not in params:
                return self._ask_for_question_count(conversation, session)
            elif "question_types" not in params:
                return self._ask_for_question_type(conversation, session)
            elif "time_limit" not in params:
                return self._ask_for_time_limit(conversation, session)
            else:
                # All params collected, show confirmation
                return self._show_test_confirmation(conversation, session)
    
    def _ask_for_question_type(
        self,
        conversation: ChatConversation,
        session: Session,
    ) -> ChatResponse:
        """Hỏi loại câu hỏi"""
        message_text = "What type of questions do you want?"
        
        quick_replies = [
            QuickReplyButton(label="Multiple Choice", value="MULTIPLE_CHOICE"),
            QuickReplyButton(label="True/False", value="TRUE_FALSE"),
            QuickReplyButton(label="Essay", value="ESSAY"),
            QuickReplyButton(label="Mixed", value="MIXED"),
        ]
        
        bot_message = ChatMessage(
            conversation_id=conversation.conversation_id,
            role="assistant",
            content=message_text,
            message_metadata={"step": "question_type", "quick_replies": [btn.model_dump() for btn in quick_replies]},
        )
        session.add(bot_message)
        session.commit()
        
        return ChatResponse(
            conversation_id=conversation.conversation_id,
            message=message_text,
            state=conversation.state,
            quick_replies=quick_replies,
            show_input=True,
        )
    
    def _ask_for_time_limit(
        self,
        conversation: ChatConversation,
        session: Session,
    ) -> ChatResponse:
        """Hỏi giới hạn thời gian"""
        message_text = "What is the time limit in minutes?"
        
        quick_replies = [
            QuickReplyButton(label="10 minutes", value="10", type="number"),
            QuickReplyButton(label="15 minutes", value="15", type="number"),
            QuickReplyButton(label="20 minutes", value="20", type="number"),
            QuickReplyButton(label="30 minutes", value="30", type="number"),
            QuickReplyButton(label="Unlimited", value="none", type="text"),
        ]
        
        bot_message = ChatMessage(
            conversation_id=conversation.conversation_id,
            role="assistant",
            content=message_text,
            message_metadata={"step": "time_limit", "quick_replies": [btn.model_dump() for btn in quick_replies]},
        )
        session.add(bot_message)
        session.commit()
        
        return ChatResponse(
            conversation_id=conversation.conversation_id,
            message=message_text,
            state=conversation.state,
            quick_replies=quick_replies,
            show_input=True,
        )
    
    def _show_test_confirmation(
        self,
        conversation: ChatConversation,
        session: Session,
    ) -> ChatResponse:
        """Hiển thị confirmation trước khi generate"""
        params = conversation.collected_params
        time_text = f"{params['time_limit']} minutes" if params.get('time_limit') else "Unlimited"
        
        question_type_map = {
            "MULTIPLE_CHOICE": "Multiple Choice",
            "TRUE_FALSE": "True/False",
            "ESSAY": "Essay",
            "MIXED": "Mixed"
        }
        question_type_display = question_type_map.get(params['question_types'][0], params['question_types'][0])
        
        message_text = (
            f"Create test with:\n"
            f"- Questions: {params['total_questions']}\n"
            f"- Type: {question_type_display}\n"
            f"- Time limit: {time_text}\n\n"
            f"Confirm to create test?"
        )
        
        quick_replies = [
            QuickReplyButton(label="Confirm", value="confirm"),
            QuickReplyButton(label="Edit", value="edit"),
        ]
        
        bot_message = ChatMessage(
            conversation_id=conversation.conversation_id,
            role="assistant",
            content=message_text,
            message_metadata={"step": "confirmation", "quick_replies": [btn.model_dump() for btn in quick_replies]},
        )
        session.add(bot_message)
        session.commit()
        
        return ChatResponse(
            conversation_id=conversation.conversation_id,
            message=message_text,
            state=conversation.state,
            quick_replies=quick_replies,
            show_input=True,
        )
    
    async def handle_free_question(
        self,
        message: str,
        conversation: ChatConversation,
        session: Session,
    ) -> ChatResponse:
        """
        Xử lý câu hỏi tự do - gọi Dify chat completion
        """
        result = await self.generation_service.answer_academic_question(
            question=message,
            studyset_id=conversation.studyset_id,
            user_id=conversation.user_id,
            session=session,
        )
        
        return ChatResponse(
            conversation_id=conversation.conversation_id,
            message=result["answer"],
            state=conversation.state,
            show_input=True,
        )
    
    def validate_studyset_access(
        self,
        studyset_id: uuid.UUID,
        user_id: uuid.UUID,
        session: Session,
    ) -> bool:
        """
        Kiểm tra user có quyền truy cập studyset không
        User có quyền truy cập nếu:
        1. Họ là owner của studyset, HOẶC
        2. Studyset thuộc về một class mà họ là member active
        """
        from app.models import ClassStudySet, ClassMember
        from app.models.enums import MembershipStatus
        
        statement = select(StudySet).where(StudySet.studyset_id == studyset_id)
        studyset = session.exec(statement).first()
        
        if not studyset:
            return False
        
        # Check ownership
        if studyset.owner_id == user_id:
            return True
        
        # Check if studyset is in any class where user is an active member
        class_studyset_statement = (
            select(ClassStudySet)
            .join(ClassMember, ClassMember.class_id == ClassStudySet.class_id)
            .where(ClassStudySet.studyset_id == studyset_id)
            .where(ClassMember.user_id == user_id)
            .where(ClassMember.status == MembershipStatus.ACTIVE)
        )
        class_studyset = session.exec(class_studyset_statement).first()
        
        return class_studyset is not None
    
    def is_member_only(
        self,
        studyset_id: uuid.UUID,
        user_id: uuid.UUID,
        session: Session,
    ) -> bool:
        """
        Kiểm tra user có phải là MEMBER (không phải owner/co-teacher) không
        Trả về True nếu user chỉ là MEMBER, False nếu là owner hoặc co-teacher
        """
        from app.models import ClassStudySet, ClassMember
        from app.models.enums import MembershipStatus, ClassRole
        
        statement = select(StudySet).where(StudySet.studyset_id == studyset_id)
        studyset = session.exec(statement).first()
        
        if not studyset:
            return False
        
        # Nếu user là owner của studyset → không phải member only
        if studyset.owner_id == user_id:
            return False
        
        # Kiểm tra role trong class
        class_member_statement = (
            select(ClassMember)
            .join(ClassStudySet, ClassMember.class_id == ClassStudySet.class_id)
            .where(ClassStudySet.studyset_id == studyset_id)
            .where(ClassMember.user_id == user_id)
            .where(ClassMember.status == MembershipStatus.ACTIVE)
        )
        class_member = session.exec(class_member_statement).first()
        
        # Nếu không tìm thấy membership → không phải member
        if not class_member:
            return False
        
        # Nếu role là MEMBER → là member only
        return class_member.role == ClassRole.MEMBER

