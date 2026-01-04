"""
Generation Service - Xử lý AI generation (test, paragraph) với Dify
"""
import logging
import re
import uuid
from typing import Any

from sqlmodel import Session, select

from app.models.content import AIGeneratedContents
from app.models.enums import GenerateType, QuestionType
from app.models.studyset import StudySet
from app.models.term import Term
from app.models.test import Test, TestQuestion
from app.services import dify_service

logger = logging.getLogger(__name__)


class GenerationService:
    """Service xử lý AI generation (test, paragraph)"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def prepare_study_context(
        self,
        studyset_id: uuid.UUID,
        session: Session,
    ) -> str:
        """
        Chuẩn bị study context từ studyset và terms
        Format: "Term 1: Definition 1\nTerm 2: Definition 2..."
        
        Args:
            studyset_id: ID của studyset
            session: Database session
            
        Returns:
            Formatted study context string
            
        Raises:
            ValueError: Nếu studyset không tồn tại hoặc không có terms
        """
        statement = select(StudySet).where(StudySet.studyset_id == studyset_id)
        studyset = session.exec(statement).first()
        
        if not studyset:
            raise ValueError(f"StudySet {studyset_id} not found")
        
        # Load all terms
        terms_statement = select(Term).where(Term.studyset_id == studyset_id)
        terms = session.exec(terms_statement).all()
        
        if not terms:
            raise ValueError(f"StudySet {studyset_id} has no terms")
        
        # Format context
        context_parts = [f"StudySet: {studyset.title}"]
        if studyset.description:
            context_parts.append(f"Description: {studyset.description}")
        
        context_parts.append("\nTerms:")
        for term in terms:
            # QUAN TRỌNG: Format "- term_text: definition"
            term_line = f"- {term.term_text}"
            if term.definition:
                term_line += f": {term.definition}"
            context_parts.append(term_line)
        
        return "\n".join(context_parts)
    
    def map_term_text_to_id(
        self,
        term_text: str,
        studyset_id: uuid.UUID,
        session: Session,
    ) -> uuid.UUID:
        """
        Map term_text từ Dify output → term_id trong database
        
        Args:
            term_text: Term text từ Dify output
            studyset_id: ID của studyset
            session: Database session
            
        Returns:
            term_id (UUID)
            
        Raises:
            ValueError: Nếu không tìm thấy term nào
        """
        # Load all terms
        terms_statement = select(Term).where(Term.studyset_id == studyset_id)
        terms = session.exec(terms_statement).all()
        
        if not terms:
            raise ValueError(f"No terms found for studyset {studyset_id}")
        
        term_lower = term_text.lower().strip()
        
        # Exact match
        for term in terms:
            if term.term_text.lower() == term_lower:
                return term.term_id
        
        # Fuzzy match
        for term in terms:
            if term_lower in term.term_text.lower() or term.term_text.lower() in term_lower:
                return term.term_id
        
        # Fallback: use first term
        logger.warning(
            f"Could not find exact match for term_text '{term_text}', using first term as fallback"
        )
        return terms[0].term_id
    
    async def generate_test_from_params(
        self,
        studyset_id: uuid.UUID,
        params: dict[str, Any],
        user_id: uuid.UUID,
        session: Session,
    ) -> dict[str, Any]:
        """
        Generate test từ collected params
        
        Args:
            studyset_id: ID của studyset
            params: Collected params từ conversation
                - total_questions: int
                - question_types: list[str]
                - time_limit: int | None (minutes)
            user_id: ID của user
            session: Database session
            
        Returns:
            Dict với message và metadata (test_id, total_questions, ai_content_id)
            
        Raises:
            ValueError: Nếu có lỗi trong quá trình generate
        """
        try:
            # Prepare context
            study_context = self.prepare_study_context(studyset_id, session)
            
            # Prepare Dify workflow inputs
            # Nếu dùng workflow tổng hợp, thêm action_type
            from app.core.config import settings
            
            if settings.DIFY_WORKFLOW_UNIFIED_APP_ID:
                # Dùng workflow tổng hợp
                workflow_inputs = {
                    "action_type": "generate_test",
                    "study_context": study_context,
                    "total_questions": params.get("total_questions", 10),
                    "question_types": params.get("question_types", ["MULTIPLE_CHOICE"]),
                    "time_limit": params.get("time_limit"),  # minutes
                }
            else:
                # Dùng workflow riêng (backward compatible)
                workflow_inputs = {
                    "study_context": study_context,
                    "total_questions": params.get("total_questions", 10),
                    "question_types": params.get("question_types", ["MULTIPLE_CHOICE"]),
                    "time_limit": params.get("time_limit"),  # minutes
                }
            
            # Call Dify workflow
            logger.info(f"Calling Dify workflow to generate test for studyset {studyset_id}")
            # Nếu có unified app_id, dùng nó; nếu không, dùng API key's app_id
            app_id = settings.DIFY_WORKFLOW_UNIFIED_APP_ID or settings.DIFY_WORKFLOW_TEST_APP_ID
            result = await dify_service.run_workflow(
                inputs=workflow_inputs,
                user=str(user_id),
                response_mode="blocking",
                app_id=app_id,
            )
            
            # Parse response
            outputs = result.get("outputs") or result.get("data", {}).get("outputs", {})
            # Nếu dùng workflow tổng hợp, data có thể nằm trong data.test_data
            if settings.DIFY_WORKFLOW_UNIFIED_APP_ID:
                result_data = outputs.get("data", {})
                test_data = result_data.get("test_data") or outputs.get("test_data") or outputs.get("output")
            else:
                test_data = outputs.get("test_data") or outputs.get("output")
            
            if not test_data:
                raise ValueError("Dify workflow returned no test data")
            
            # Validate và parse questions
            questions = test_data.get("questions", [])
            if not questions:
                raise ValueError("No questions in test data")
            
            # Create Test in database
            test = Test(
                studyset_id=studyset_id,
                title=f"AI Generated Test - {len(questions)} questions",
                description="Generated by AI chatbot",
                total_questions=len(questions),
                question_types=params.get("question_types", []),
                time_limit=params.get("time_limit") * 60 if params.get("time_limit") else None,  # Convert minutes to seconds
                created_by=user_id,
            )
            session.add(test)
            session.commit()
            session.refresh(test)
            
            # Create TestQuestions
            for idx, q_data in enumerate(questions):
                # Map term_text → term_id
                term_text = q_data.get("term_text", "").strip()
                term_id = None
                
                if term_text:
                    try:
                        term_id = self.map_term_text_to_id(term_text, studyset_id, session)
                    except ValueError as e:
                        logger.warning(f"Could not map term_text '{term_text}': {e}")
                        # Fallback: use first term
                        terms = session.exec(
                            select(Term).where(Term.studyset_id == studyset_id)
                        ).all()
                        if terms:
                            term_id = terms[0].term_id
                
                # Fallback nếu không có term_text hoặc không tìm thấy
                if not term_id:
                    terms = session.exec(
                        select(Term).where(Term.studyset_id == studyset_id)
                    ).all()
                    if terms:
                        term_id = terms[0].term_id
                    else:
                        raise ValueError(f"No terms found for studyset {studyset_id}")
                
                # Validate question_type
                question_type_str = q_data.get("question_type", "MULTIPLE_CHOICE")
                try:
                    question_type = QuestionType(question_type_str)
                except ValueError:
                    logger.warning(f"Invalid question_type '{question_type_str}', using MULTIPLE_CHOICE")
                    question_type = QuestionType.MULTIPLE_CHOICE
                
                # Validate options
                options = q_data.get("options")
                if question_type == QuestionType.MULTIPLE_CHOICE:
                    if not options or not isinstance(options, list) or len(options) < 2:
                        logger.warning(f"Question {idx} missing valid options, skipping")
                        continue
                elif question_type == QuestionType.TRUE_FALSE:
                    options = ["True", "False"]
                elif question_type == QuestionType.ESSAY:
                    options = None
                
                # Create question
                question = TestQuestion(
                    test_id=test.test_id,
                    term_id=term_id,
                    question_type=question_type,
                    question_text=q_data.get("question_text", ""),
                    correct_answer=q_data.get("correct_answer", ""),
                    options=options,
                    order=idx,
                )
                session.add(question)
            
            session.commit()
            
            # Save to AIGeneratedContents
            ai_content = AIGeneratedContents(
                studyset_id=studyset_id,
                source_model="Dify Workflow",
                generate_type=GenerateType.TEST,
                prompt=str(workflow_inputs),
                output=test_data,
            )
            session.add(ai_content)
            session.commit()
            
            logger.info(f"Successfully generated test {test.test_id} with {len(questions)} questions")
            
            return {
                "message": f"✅ Đã tạo bài test thành công với {len(questions)} câu hỏi!",
                "metadata": {
                    "test_id": str(test.test_id),
                    "total_questions": len(questions),
                    "ai_content_id": str(ai_content.ai_content_id),
                },
            }
            
        except Exception as e:
            logger.error(f"Error generating test: {str(e)}", exc_info=True)
            raise ValueError(f"Lỗi khi tạo test: {str(e)}")
    
    async def generate_paragraph(
        self,
        studyset_id: uuid.UUID,
        user_id: uuid.UUID,
        session: Session,
    ) -> dict[str, Any]:
        """
        Generate paragraph từ studyset
        
        Args:
            studyset_id: ID của studyset
            user_id: ID của user
            session: Database session
            
        Returns:
            Dict với message và metadata (paragraph, key_concepts, word_count, ai_content_id)
            
        Raises:
            ValueError: Nếu có lỗi trong quá trình generate
        """
        try:
            # Prepare context
            study_context = self.prepare_study_context(studyset_id, session)
            
            # Prepare Dify workflow inputs
            from app.core.config import settings
            
            if settings.DIFY_WORKFLOW_UNIFIED_APP_ID:
                # Dùng workflow tổng hợp
                workflow_inputs = {
                    "action_type": "generate_paragraph",
                    "study_context": study_context,
                    "style": "academic",
                }
            else:
                # Dùng workflow riêng (backward compatible)
                workflow_inputs = {
                    "study_context": study_context,
                    "style": "academic",
                }
            
            # Call Dify workflow
            logger.info(f"Calling Dify workflow to generate paragraph for studyset {studyset_id}")
            # Nếu có unified app_id, dùng nó; nếu không, dùng paragraph app_id
            app_id = settings.DIFY_WORKFLOW_UNIFIED_APP_ID or settings.DIFY_WORKFLOW_PARAGRAPH_APP_ID
            result = await dify_service.run_workflow(
                inputs=workflow_inputs,
                user=str(user_id),
                response_mode="blocking",
                app_id=app_id,
            )
            
            # Parse response
            outputs = result.get("outputs") or result.get("data", {}).get("outputs", {})
            # Nếu dùng workflow tổng hợp, data có thể nằm trong data.paragraph_data
            if settings.DIFY_WORKFLOW_UNIFIED_APP_ID:
                result_data = outputs.get("data", {})
                paragraph_data = result_data.get("paragraph_data") or outputs.get("paragraph_data") or outputs.get("output")
            else:
                paragraph_data = outputs.get("paragraph_data") or outputs.get("output")
            
            if not paragraph_data:
                raise ValueError("Dify workflow returned no paragraph data")
            
            paragraph_text = paragraph_data.get("paragraph", "")
            if not paragraph_text:
                raise ValueError("No paragraph text in output")
            
            # Save to AIGeneratedContents
            ai_content = AIGeneratedContents(
                studyset_id=studyset_id,
                source_model="Dify Workflow",
                generate_type=GenerateType.PARAGRAPH,
                prompt=str(workflow_inputs),
                output=paragraph_data,
            )
            session.add(ai_content)
            session.commit()
            
            logger.info(f"Successfully generated paragraph for studyset {studyset_id}")
            
            return {
                "message": f"📄 Đoạn văn đã được tạo:\n\n{paragraph_text}",
                "metadata": {
                    "paragraph": paragraph_text,
                    "key_concepts": paragraph_data.get("key_concepts", []),
                    "word_count": paragraph_data.get("word_count", 0),
                    "ai_content_id": str(ai_content.ai_content_id),
                },
            }
            
        except Exception as e:
            logger.error(f"Error generating paragraph: {str(e)}", exc_info=True)
            raise ValueError(f"Lỗi khi tạo paragraph: {str(e)}")
    
    async def answer_academic_question(
        self,
        question: str,
        studyset_id: uuid.UUID,
        user_id: uuid.UUID,
        session: Session,
    ) -> dict[str, Any]:
        """
        Trả lời câu hỏi học thuật dựa trên study context
        
        Args:
            question: Câu hỏi của user
            studyset_id: ID của studyset
            user_id: ID của user
            session: Database session
            
        Returns:
            Dict với answer và metadata (conversation_id)
            
        Raises:
            ValueError: Nếu có lỗi trong quá trình answer
        """
        try:
            # Prepare context
            study_context = self.prepare_study_context(studyset_id, session)
            
            from app.core.config import settings
            
            # Nếu dùng workflow tổng hợp, dùng workflow thay vì chat completion
            if settings.DIFY_WORKFLOW_UNIFIED_APP_ID:
                # Dùng workflow tổng hợp
                workflow_inputs = {
                    "action_type": "answer_question",
                    "study_context": study_context,
                    "query": question,
                }
                
                logger.info(f"Calling Dify unified workflow to answer question for studyset {studyset_id}")
                result = await dify_service.run_workflow(
                    inputs=workflow_inputs,
                    user=str(user_id),
                    response_mode="blocking",
                    app_id=settings.DIFY_WORKFLOW_UNIFIED_APP_ID,
                )
                
                # Parse response từ workflow
                outputs = result.get("outputs") or result.get("data", {}).get("outputs", {})
                result_data = outputs.get("data", {})
                answer = result_data.get("answer") or outputs.get("answer") or outputs.get("output", "")
            else:
                # Dùng chat completion (backward compatible)
                logger.info(f"Calling Dify chat completion to answer question for studyset {studyset_id}")
                result = await dify_service.chat_completion(
                    query=question,
                    user=str(user_id),
                    inputs={"study_context": study_context},
                    response_mode="blocking",
                )
                answer = result.get("answer", "")
            
            # Basic validation: check if answer is off-topic
            if not answer or len(answer) < 10:
                answer = "Xin lỗi, tôi không thể trả lời câu hỏi này. Vui lòng hỏi về nội dung trong studyset."
            
            return {
                "answer": answer,
                "metadata": {
                    "conversation_id": result.get("conversation_id"),
                },
            }
            
        except Exception as e:
            logger.error(f"Error answering question: {str(e)}", exc_info=True)
            return {
                "answer": f"Xin lỗi, có lỗi xảy ra khi trả lời câu hỏi: {str(e)}",
                "metadata": {"error": str(e)},
            }

