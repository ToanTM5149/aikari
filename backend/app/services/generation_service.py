"""
Generation Service - Xử lý AI generation (test, paragraph) với Dify
"""
import logging
import re
import uuid
from datetime import datetime
from typing import Any

from sqlmodel import Session, select

from app.models.content import AIGeneratedContents
from app.models.enums import GenerateType, QuestionType
from app.models.studyset import StudySet
from app.models.term import Term
from app.models.studyset_term import StudySetTerm
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
        # PHASE 3.2: Read from StudySetTerm junction table
        terms_statement = (
            select(Term)
            .join(StudySetTerm, StudySetTerm.term_id == Term.term_id)
            .where(StudySetTerm.studyset_id == studyset_id)
        )
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
    
    def prepare_term_context(
        self,
        term_id: uuid.UUID,
        session: Session,
        studyset_id: uuid.UUID | None = None,
    ) -> str:
        """
        Chuẩn bị context từ một term cụ thể
        Format: "StudySet: {title}\n\nTerm: {term_text}\nDefinition: {definition}"

        Args:
            term_id: ID của term
            session: Database session
            studyset_id: Optional studyset ID (if term is in multiple studysets)

        Returns:
            Formatted context string cho term đó

        Raises:
            ValueError: Nếu term không tồn tại
        """
        term = session.exec(select(Term).where(Term.term_id == term_id)).first()

        if not term:
            raise ValueError(f"Term {term_id} not found")

        # Load studyset để lấy title
        # If studyset_id provided, use it; otherwise get first studyset from junction table
        if not studyset_id:
            studyset_term = session.exec(
                select(StudySetTerm)
                .where(StudySetTerm.term_id == term_id)
                .order_by(StudySetTerm.added_at)
            ).first()
            if studyset_term:
                studyset_id = studyset_term.studyset_id

        studyset = None
        if studyset_id:
            studyset = session.exec(
                select(StudySet).where(StudySet.studyset_id == studyset_id)
            ).first()
        
        # Format context chỉ cho term này
        context_parts = []
        if studyset:
            context_parts.append(f"StudySet: {studyset.title}")
            if studyset.description:
                context_parts.append(f"Description: {studyset.description}")
            context_parts.append("")
        
        context_parts.append(f"Term: {term.term_text}")
        if term.definition:
            context_parts.append(f"Definition: {term.definition}")
        if term.example:
            context_parts.append(f"Example: {term.example}")
        
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
        # PHASE 3.2: Read from StudySetTerm junction table
        terms_statement = (
            select(Term)
            .join(StudySetTerm, StudySetTerm.term_id == Term.term_id)
            .where(StudySetTerm.studyset_id == studyset_id)
        )
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
            
            from app.core.config import settings
            
            total_questions = params.get("total_questions", 10)
            question_types_list = params.get("question_types", ["MULTIPLE_CHOICE"])
            time_limit = params.get("time_limit")
            
            # Convert question_types array to string (Chat App input form expects string)
            question_types_str = ",".join(question_types_list) if isinstance(question_types_list, list) else str(question_types_list)
            
            # Query chỉ gửi 1 chữ cái
            query = "a"
            
            # Chuẩn bị inputs
            inputs = {
                "action_type": "generate_test",
                "study_context": study_context,
                "total_questions": str(total_questions),
                "question_types": question_types_str,
                "time_limit": str(time_limit) if time_limit else "",
            }
            
            # Log đầy đủ data trước khi gửi đến Dify
            logger.info("=" * 80)
            logger.info("=== REQUEST DATA GỬI ĐẾN DIFY ===")
            logger.info(f"Studyset ID: {studyset_id}")
            logger.info(f"User ID: {user_id}")
            logger.info(f"Query: '{query}'")
            logger.info(f"Response Mode: blocking")
            logger.info("Inputs:")
            for key, value in inputs.items():
                if key == "study_context":
                    logger.info(f"  - {key}: (length={len(str(value))} characters)")
                    logger.info(f"    Preview: {str(value)[:200]}...")
                else:
                    logger.info(f"  - {key}: {value}")
            logger.info("=" * 80)
            
            result = await dify_service.chat_completion(
                query=query,
                user=str(user_id),
                response_mode="blocking",
                inputs=inputs,
            )
            
            # Log toàn bộ response từ Dify
            logger.info("=" * 80)
            logger.info("=== RESPONSE TỪ DIFY ===")
            logger.info(f"Full result object keys: {list(result.keys()) if isinstance(result, dict) else 'N/A'}")
            logger.info(f"Full result: {result}")
            logger.info("=" * 80)
            
            # Parse response từ Chat App (text answer)
            answer = result.get("answer", "")
            if not answer:
                logger.error(f"Dify Chat App returned no answer. Full result: {result}")
                raise ValueError("Dify Chat App returned no answer")
            
            # Log answer trước khi parse
            logger.info("=" * 80)
            logger.info("=== ANSWER TỪ DIFY (trước khi parse) ===")
            logger.info(f"Answer type: {type(answer)}")
            logger.info(f"Answer length: {len(str(answer))} characters")
            logger.info(f"Full answer:\n{answer}")
            logger.info("=" * 80)
            
            # Parse JSON từ text answer
            import json
            
            # Strategy 1: Tìm JSON trong markdown code block (có thể có text trước đó)
            text = answer.strip()
            json_text = None
            
            # Tìm markdown code block chứa JSON (có thể có text trước đó)
            markdown_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
            if markdown_match:
                json_text = markdown_match.group(1)
                logger.info("Extracted JSON from markdown code block (có text trước đó)")
            else:
                # Strategy 2: Tìm JSON object trực tiếp trong text (bắt đầu từ {)
                # Tìm vị trí của { đầu tiên
                first_brace = text.find('{')
                if first_brace != -1:
                    # Tìm { cuối cùng để lấy toàn bộ JSON object
                    # Dùng stack để tìm matching braces
                    brace_count = 0
                    start_pos = first_brace
                    end_pos = -1
                    
                    for i in range(first_brace, len(text)):
                        if text[i] == '{':
                            brace_count += 1
                        elif text[i] == '}':
                            brace_count -= 1
                            if brace_count == 0:
                                end_pos = i + 1
                                break
                    
                    if end_pos != -1:
                        json_text = text[start_pos:end_pos]
                        logger.info("Extracted JSON object directly from text (tìm { đầu tiên)")
            
            # Strategy 3: Nếu vẫn không tìm thấy, thử parse toàn bộ text
            if not json_text:
                json_text = text
                logger.info("Using full text as JSON (fallback)")
            
            logger.info(f"JSON text to parse (first 500 chars): {json_text[:500]}...")
            
            try:
                test_data = json.loads(json_text)
                logger.info(f"Successfully parsed JSON. Keys: {list(test_data.keys()) if isinstance(test_data, dict) else 'N/A'}")
            except json.JSONDecodeError as e:
                logger.error("=" * 80)
                logger.error("=== LỖI PARSE JSON ===")
                logger.error(f"JSONDecodeError: {str(e)}")
                logger.error(f"Answer (first 500 chars): {answer[:500]}")
                logger.error(f"Answer (last 500 chars): {answer[-500:]}")
                logger.error(f"Full answer length: {len(answer)}")
                logger.error("=" * 80)
                raise ValueError(f"Chat App returned invalid JSON: {str(e)}")
            
            # Validate và parse questions
            questions = test_data.get("questions", [])
            if not questions:
                raise ValueError("No questions in test data")
            
            # Create Test in database
            # Lưu created_by là user_id (người yêu cầu), nhưng đánh dấu là AI-generated
            test = Test(
                studyset_id=studyset_id,
                title=f"AI Generated Test - {len(questions)} questions",
                description="Generated by AI chatbot",
                total_questions=len(questions),
                question_types=params.get("question_types", []),
                time_limit=params.get("time_limit") * 60 if params.get("time_limit") else None,  # Convert minutes to seconds
                created_by=user_id,  # User yêu cầu AI tạo
                is_ai_generated=True,  # Đánh dấu là AI-generated
                ai_generated_by=user_id,  # User yêu cầu AI tạo
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
                        # PHASE 3.2: Read from StudySetTerm junction table
                        terms = session.exec(
                            select(Term)
                            .join(StudySetTerm, StudySetTerm.term_id == Term.term_id)
                            .where(StudySetTerm.studyset_id == studyset_id)
                        ).all()
                        if terms:
                            term_id = terms[0].term_id

                # Fallback nếu không có term_text hoặc không tìm thấy
                if not term_id:
                    # PHASE 3.2: Read from StudySetTerm junction table
                    terms = session.exec(
                        select(Term)
                        .join(StudySetTerm, StudySetTerm.term_id == Term.term_id)
                        .where(StudySetTerm.studyset_id == studyset_id)
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
                
                # Create question with explanation
                question = TestQuestion(
                    test_id=test.test_id,
                    term_id=term_id,
                    question_type=question_type,
                    question_text=q_data.get("question_text", ""),
                    correct_answer=q_data.get("correct_answer", ""),
                    options=options,
                    explanation=q_data.get("explanation"),  # Save explanation from AI
                    order=idx,
                )
                session.add(question)
            
            session.commit()
            
            # Save to AIGeneratedContents
            from app.core.config import settings
            # Determine source model based on which app was used
            # Chỉ dùng Unified Chat App
            source_model = "Dify Chat App Unified"
            prompt_data = params
            
            ai_content = AIGeneratedContents(
                studyset_id=studyset_id,
                source_model=source_model,
                generate_type=GenerateType.TEST,
                prompt=str(prompt_data),
                output=test_data,
            )
            session.add(ai_content)
            session.commit()
            
            logger.info(f"Successfully generated test {test.test_id} with {len(questions)} questions")
            
            return {
                "message": f"Test created successfully with {len(questions)} questions!",
                "metadata": {
                    "test_id": str(test.test_id),
                    "total_questions": len(questions),
                    "ai_content_id": str(ai_content.ai_content_id),
                },
            }
            
        except Exception as e:
            logger.error(f"Error generating test: {str(e)}", exc_info=True)
            raise ValueError(f"Error creating test: {str(e)}")
    
    async def generate_paragraph(
        self,
        studyset_id: uuid.UUID,
        user_id: uuid.UUID,
        session: Session,
        term_id: uuid.UUID | None = None,  # Optional: nếu có thì chỉ generate cho term này
    ) -> dict[str, Any]:
        """
        Generate paragraph từ studyset hoặc một term cụ thể
        
        Args:
            studyset_id: ID của studyset
            user_id: ID của user
            session: Database session
            term_id: Optional - nếu có thì chỉ generate cho term này, không thì generate cho toàn bộ studyset
            
        Returns:
            Dict với message và metadata (paragraph, key_concepts, word_count)
            
        Raises:
            ValueError: Nếu có lỗi trong quá trình generate
        """
        try:
            # Nếu có term_id, chỉ lấy context từ term đó
            if term_id:
                study_context = self.prepare_term_context(term_id, session, studyset_id)
            else:
                # Fallback: lấy context từ toàn bộ studyset (giữ backward compatibility)
                study_context = self.prepare_study_context(studyset_id, session)
            
            from app.core.config import settings
            
            style = "academic"
                
            # Query chỉ gửi 1 chữ cái
            query = "a"
            
            # Chuẩn bị inputs
            inputs = {
                "action_type": "generate_paragraph",
                "study_context": study_context,
                "style": style,
            }
            
            # Log đầy đủ data trước khi gửi đến Dify
            logger.info("=" * 80)
            logger.info("=== REQUEST DATA GỬI ĐẾN DIFY (PARAGRAPH) ===")
            logger.info(f"Studyset ID: {studyset_id}")
            if term_id:
                logger.info(f"Term ID: {term_id}")
            logger.info(f"User ID: {user_id}")
            logger.info(f"Query: '{query}'")
            logger.info(f"Response Mode: blocking")
            logger.info("Inputs:")
            for key, value in inputs.items():
                if key == "study_context":
                    logger.info(f"  - {key}: (length={len(str(value))} characters)")
                    logger.info(f"    Preview: {str(value)[:200]}...")
                else:
                    logger.info(f"  - {key}: {value}")
            logger.info("=" * 80)
            
            result = await dify_service.chat_completion(
                query=query,
                user=str(user_id),
                response_mode="blocking",
                inputs=inputs,
            )
            
            # Log toàn bộ response từ Dify
            logger.info("=" * 80)
            logger.info("=== RESPONSE TỪ DIFY (PARAGRAPH) ===")
            logger.info(f"Full result object keys: {list(result.keys()) if isinstance(result, dict) else 'N/A'}")
            logger.info("=" * 80)
            
            # Parse response từ Chat App (text answer)
            answer = result.get("answer", "")
            if not answer:
                logger.error(f"Dify Chat App returned no answer. Full result: {result}")
                raise ValueError("Dify Chat App returned no answer")
            
            # Log answer trước khi parse
            logger.info("=" * 80)
            logger.info("=== ANSWER TỪ DIFY (trước khi parse) ===")
            logger.info(f"Answer type: {type(answer)}")
            logger.info(f"Answer length: {len(str(answer))} characters")
            logger.info(f"Full answer:\n{answer}")
            logger.info("=" * 80)
            
            # Parse JSON từ text answer
            import json
            
            # Strategy 1: Tìm JSON trong markdown code block (có thể có text trước đó)
            text = answer.strip()
            json_text = None
            
            # Tìm markdown code block chứa JSON (có thể có text trước đó)
            markdown_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
            if markdown_match:
                json_text = markdown_match.group(1)
                logger.info("Extracted JSON from markdown code block (có text trước đó)")
            else:
                # Strategy 2: Tìm JSON object trực tiếp trong text (bắt đầu từ {)
                first_brace = text.find('{')
                if first_brace != -1:
                    # Tìm { cuối cùng để lấy toàn bộ JSON object
                    brace_count = 0
                    start_pos = first_brace
                    end_pos = -1
                    
                    for i in range(first_brace, len(text)):
                        if text[i] == '{':
                            brace_count += 1
                        elif text[i] == '}':
                            brace_count -= 1
                            if brace_count == 0:
                                end_pos = i + 1
                                break
                    
                    if end_pos != -1:
                        json_text = text[start_pos:end_pos]
                        logger.info("Extracted JSON object directly from text (tìm { đầu tiên)")
            
            # Strategy 3: Nếu vẫn không tìm thấy, thử parse toàn bộ text
            if not json_text:
                json_text = text
                logger.info("Using full text as JSON (fallback)")
            
            logger.info(f"JSON text to parse (first 500 chars): {json_text[:500]}...")
            
            try:
                paragraph_data = json.loads(json_text)
                logger.info(f"Successfully parsed JSON. Keys: {list(paragraph_data.keys()) if isinstance(paragraph_data, dict) else 'N/A'}")
            except json.JSONDecodeError as e:
                logger.error("=" * 80)
                logger.error("=== LỖI PARSE JSON ===")
                logger.error(f"JSONDecodeError: {str(e)}")
                logger.error(f"Answer (first 500 chars): {answer[:500]}")
                logger.error(f"Answer (last 500 chars): {answer[-500:]}")
                logger.error(f"Full answer length: {len(answer)}")
                logger.error("=" * 80)
                raise ValueError(f"Chat App returned invalid JSON: {str(e)}")
            
            paragraph_text = paragraph_data.get("paragraph", "")
            if not paragraph_text:
                raise ValueError("No paragraph text in output")
            
            # Nếu có term_id, chỉ lưu vào term đó
            if term_id:
                term = session.exec(select(Term).where(Term.term_id == term_id)).first()
                if not term:
                    raise ValueError(f"Term {term_id} not found")
                
                logger.info(f"Found term {term_id} ({term.term_text}). Current paragraphs: {term.paragraphs}")
                logger.info(f"Current paragraphs type: {type(term.paragraphs)}")
                logger.info(f"Current attributes: {term.attributes}")
                
                # Lấy paragraphs hiện tại hoặc tạo mới
                # Nếu None hoặc không phải list, tạo list rỗng
                if term.paragraphs is None:
                    current_paragraphs = []
                    logger.info("paragraphs is None, initializing to empty list")
                    
                    # Migrate dữ liệu cũ từ attributes.paragraph sang paragraphs nếu có
                    if term.attributes and term.attributes.get("paragraph"):
                        logger.info("Found old paragraph in attributes, migrating to paragraphs field")
                        old_paragraph = {
                            "paragraph": term.attributes["paragraph"],
                            "metadata": term.attributes.get("paragraph_metadata", {})
                        }
                        current_paragraphs = [old_paragraph]
                        logger.info(f"Migrated old paragraph: {old_paragraph}")
                elif not isinstance(term.paragraphs, list):
                    # Nếu paragraphs không phải list, reset về list rỗng
                    logger.warning(f"paragraphs is not a list, resetting. Current value: {term.paragraphs}, type: {type(term.paragraphs)}")
                    current_paragraphs = []
                else:
                    current_paragraphs = term.paragraphs
                    logger.info(f"Using existing paragraphs list with {len(current_paragraphs)} items")
                
                # Tạo paragraph entry mới
                new_paragraph = {
                    "paragraph": paragraph_text,
                    "metadata": {
                        "key_concepts": paragraph_data.get("key_concepts", []),
                        "word_count": paragraph_data.get("word_count", 0),
                        "style": style,
                        "generated_at": datetime.utcnow().isoformat() + "Z",  # Thêm Z để đánh dấu UTC
                    }
                }
                
                logger.info(f"New paragraph to add: {new_paragraph}")
                
                # Tạo list mới với paragraph mới ở đầu (mới nhất ở đầu)
                # Tạo list mới để SQLModel detect thay đổi
                updated_paragraphs = [new_paragraph] + current_paragraphs
                
                logger.info(f"Updated paragraphs (total: {len(updated_paragraphs)}): {updated_paragraphs}")
                
                # Gán list mới vào term.paragraphs (tạo object mới để SQLModel detect change)
                term.paragraphs = updated_paragraphs
                term.updated_at = datetime.utcnow()
                
                # Xóa dữ liệu cũ trong attributes.paragraph sau khi đã migrate sang paragraphs
                if term.attributes and ("paragraph" in term.attributes or "paragraph_metadata" in term.attributes):
                    logger.info("Removing old paragraph data from attributes after migration")
                    if "paragraph" in term.attributes:
                        del term.attributes["paragraph"]
                    if "paragraph_metadata" in term.attributes:
                        del term.attributes["paragraph_metadata"]
                    # Nếu attributes rỗng sau khi xóa, set về None
                    if not term.attributes:
                        term.attributes = None
                
                logger.info(f"Set term.paragraphs to: {term.paragraphs}")
                logger.info(f"Term attributes after cleanup: {term.attributes}")
                
                session.add(term)
                
                try:
                    # Log trước khi flush
                    logger.info(f"About to flush. term.paragraphs before flush: {term.paragraphs}")
                    logger.info(f"term.paragraphs type: {type(term.paragraphs)}")
                    logger.info(f"term.paragraphs length: {len(term.paragraphs) if term.paragraphs else 0}")
                    
                    # Flush trước để đảm bảo dữ liệu được gửi đến DB
                    session.flush()
                    logger.info(f"Flushed paragraph data to database for term {term_id}")
                    
                    # Log sau flush, trước commit
                    logger.info(f"After flush, before commit. term.paragraphs: {term.paragraphs}")
                    
                    # Commit transaction
                    session.commit()
                    logger.info(f"Committed paragraph to database for term {term_id}")
                    
                    # Expunge term khỏi session để force reload
                    session.expunge(term)
                    
                    # Query lại term từ database để verify
                    term_after_commit = session.exec(
                        select(Term).where(Term.term_id == term_id)
                    ).first()
                    
                    if term_after_commit:
                        logger.info(f"Queried term after commit. Paragraphs: {term_after_commit.paragraphs}")
                        logger.info(f"Paragraphs type: {type(term_after_commit.paragraphs)}")
                        logger.info(f"Paragraphs length: {len(term_after_commit.paragraphs) if term_after_commit.paragraphs else 0}")
                        # Update term object với dữ liệu mới
                        term = term_after_commit
                    else:
                        logger.error(f"Could not query term {term_id} after commit")
                        raise ValueError(f"Could not query term {term_id} after commit")
                    
                    # Verify: Kiểm tra lại xem paragraph có được lưu không
                    if term.paragraphs is None:
                        logger.error(f"WARNING: Paragraphs is None after commit! Term: {term}")
                        raise ValueError("Paragraph was not saved to database: paragraphs is None")
                    
                    if len(term.paragraphs) == 0:
                        logger.error(f"WARNING: Paragraphs is empty after commit! Term: {term}")
                        raise ValueError("Paragraph was not saved to database: paragraphs is empty")
                    
                    logger.info(f"✅ Verification passed! Paragraphs saved successfully. Total: {len(term.paragraphs)}")
                    
                except Exception as commit_error:
                    logger.error(f"Error committing paragraph to database: {str(commit_error)}", exc_info=True)
                    session.rollback()
                    raise ValueError(f"Lỗi khi lưu paragraph vào database: {str(commit_error)}")
                
                logger.info(f"Successfully generated paragraph for term {term_id} ({term.term_text}). Total paragraphs: {len(term.paragraphs)}")
                
                return {
                    "message": f"Paragraph created for term '{term.term_text}':\n\n{paragraph_text}",
                    "metadata": {
                        "paragraph": paragraph_text,
                        "key_concepts": paragraph_data.get("key_concepts", []),
                        "word_count": paragraph_data.get("word_count", 0),
                        "term_id": str(term_id),
                        "term_text": term.term_text,
                        "total_paragraphs": len(term.paragraphs),
                    },
                }
            else:
                # Fallback: lưu vào tất cả terms (giữ backward compatibility)
                # PHASE 3.2: Read from StudySetTerm junction table
                terms = session.exec(
                    select(Term)
                    .join(StudySetTerm, StudySetTerm.term_id == Term.term_id)
                    .where(StudySetTerm.studyset_id == studyset_id)
                ).all()
                
                if not terms:
                    raise ValueError(f"StudySet {studyset_id} has no terms")
                
                # Lưu paragraph vào attributes của mỗi term
                updated_count = 0
                for term in terms:
                    # Lấy attributes hiện tại hoặc tạo mới
                    current_attributes = term.attributes or {}
                    
                    # Thêm paragraph vào attributes
                    current_attributes["paragraph"] = paragraph_text
                    current_attributes["paragraph_metadata"] = {
                        "key_concepts": paragraph_data.get("key_concepts", []),
                        "word_count": paragraph_data.get("word_count", 0),
                        "style": style,
                        "generated_at": datetime.utcnow().isoformat() + "Z",  # Thêm Z để đánh dấu UTC
                    }
                    
                    # Cập nhật term
                    term.attributes = current_attributes
                    term.updated_at = datetime.utcnow()
                    session.add(term)
                    updated_count += 1
                
            session.commit()
            
            logger.info(f"Successfully generated paragraph for studyset {studyset_id} and saved to {updated_count} terms")
            
            return {
                "message": f"Paragraph created and saved to {updated_count} terms:\n\n{paragraph_text}",
                "metadata": {
                    "paragraph": paragraph_text,
                    "key_concepts": paragraph_data.get("key_concepts", []),
                    "word_count": paragraph_data.get("word_count", 0),
                    "terms_updated": updated_count,
                },
            }
            
        except Exception as e:
            logger.error(f"Error generating paragraph: {str(e)}", exc_info=True)
            raise ValueError(f"Error creating paragraph: {str(e)}")
    
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
            
            # Query là câu hỏi thực tế của user
            query = question
            
            # Chuẩn bị inputs với action_type
            inputs = {
                "action_type": "answer_question",
                "study_context": study_context,
                "query": question,
            }
            
            result = await dify_service.chat_completion(
                query=query,
                user=str(user_id),
                inputs=inputs,
                response_mode="blocking",
            )
            
            # Parse response từ Chat App (text answer)
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
                "answer": f"Sorry, an error occurred while answering the question: {str(e)}",
                "metadata": {"error": str(e)},
            }

