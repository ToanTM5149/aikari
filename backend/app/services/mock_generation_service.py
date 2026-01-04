"""
Mock Generation Service để test chatbot logic trước khi có Dify
Sau khi có Dify, thay bằng GenerationService thật
"""
import uuid
from typing import Any

from sqlmodel import Session


class MockGenerationService:
    """Mock service để test chatbot logic trước khi có Dify"""
    
    def __init__(self, session: Session):
        self.session = session
    
    async def generate_test_from_params(
        self,
        studyset_id: uuid.UUID,
        params: dict[str, Any],
        user_id: uuid.UUID,
        session: Session,
    ) -> dict[str, Any]:
        """Mock generate test - trả về test_id giả"""
        total_questions = params.get("total_questions", 10)
        return {
            "message": f"✅ Đã tạo bài test thành công với {total_questions} câu hỏi! (MOCK - Chưa có Dify)",
            "metadata": {
                "test_id": str(uuid.uuid4()),  # Mock test_id
                "total_questions": total_questions,
                "ai_content_id": str(uuid.uuid4()),
            },
        }
    
    async def generate_paragraph(
        self,
        studyset_id: uuid.UUID,
        user_id: uuid.UUID,
        session: Session,
    ) -> dict[str, Any]:
        """Mock generate paragraph"""
        return {
            "message": (
                "📄 Đoạn văn đã được tạo:\n\n"
                "[MOCK] Quá trình quang hợp là một trong những quá trình quan trọng nhất trong sinh học. "
                "Quá trình này diễn ra trong chloroplast, nơi chứa chất diệp lục. "
                "Thực vật sử dụng ánh sáng mặt trời để chuyển đổi carbon dioxide và nước thành glucose và oxy. "
                "Năng lượng được tạo ra trong quá trình này được lưu trữ trong các phân tử ATP, "
                "sau đó được sử dụng bởi mitochondria để cung cấp năng lượng cho tế bào."
            ),
            "metadata": {
                "paragraph": "[MOCK] Paragraph text here...",
                "key_concepts": ["Photosynthesis", "Chloroplast", "Mitochondria"],
                "word_count": 250,
                "ai_content_id": str(uuid.uuid4()),
            },
        }
    
    async def answer_academic_question(
        self,
        question: str,
        studyset_id: uuid.UUID,
        user_id: uuid.UUID,
        session: Session,
    ) -> dict[str, Any]:
        """Mock answer question"""
        return {
            "answer": (
                f"[MOCK ANSWER] Câu trả lời cho câu hỏi: {question}\n\n"
                "Đây là câu trả lời mẫu. Khi có Dify, câu trả lời sẽ được generate từ AI dựa trên "
                "nội dung học tập trong studyset."
            ),
        }

