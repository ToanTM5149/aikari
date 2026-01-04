# 🔄 HƯỚNG DẪN CHUYỂN TỪ WORKFLOW SANG CHAT APP

## ⚠️ Lưu Ý Quan Trọng

**Chat App và Workflow khác nhau:**

- **Workflow:** Nhận `inputs` → Xử lý → Trả về `outputs` (structured data)
- **Chat App:** Nhận `query` + `inputs` → Trả về `answer` (text response)

**Với Chat App, bạn cần:**
1. Cấu hình System Prompt trong Dify Chat App (không phải trong code)
2. Thay đổi cách gọi API từ `run_workflow` sang `chat_completion`
3. Parse response khác (lấy `answer` thay vì `outputs`)
4. Có thể cần parse JSON từ text answer nếu cần structured data

---

## 📋 Checklist Thay Đổi

### Backend Changes

- [ ] Thêm config cho Chat App IDs trong `config.py`
- [ ] Cập nhật `GenerationService` để dùng `chat_completion` thay vì `run_workflow`
- [ ] Parse response từ `answer` (text) thay vì `outputs` (structured)
- [ ] Parse JSON từ text answer nếu cần (cho test và paragraph)

### Dify Chat App Setup

- [ ] Tạo Chat App trong Dify (hoặc 3 apps riêng: test, paragraph, Q&A)
- [ ] Cấu hình System Prompt với variables
- [ ] Cấu hình Input Variables (study_context, total_questions, etc.)
- [ ] Test Chat App trong Dify UI
- [ ] Lấy Chat App ID (App ID)

---

## 🔧 Backend Changes

### Bước 1: Thêm Config Cho Chat App IDs

**File:** `backend/app/core/config.py`

Thêm vào class `Settings`:

```python
# Dify Chat App IDs (nếu dùng Chat App thay vì Workflow)
DIFY_CHAT_APP_TEST_ID: str | None = None
DIFY_CHAT_APP_PARAGRAPH_ID: str | None = None
DIFY_CHAT_APP_QA_ID: str | None = None
# Hoặc dùng 1 Chat App cho tất cả (không khuyến nghị vì khó phân biệt)
DIFY_CHAT_APP_UNIFIED_ID: str | None = None
```

**Update `.env`:**
```env
# Chat App IDs (thay vì Workflow IDs)
DIFY_CHAT_APP_TEST_ID=app-xxxxxxxxxxxxx
DIFY_CHAT_APP_PARAGRAPH_ID=app-yyyyyyyyyyyy
DIFY_CHAT_APP_QA_ID=app-zzzzzzzzzzzz
```

### Bước 2: Cập Nhật GenerationService

**File:** `backend/app/services/generation_service.py`

**Thay đổi method `generate_test_from_params`:**

```python
async def generate_test_from_params(
    self,
    studyset_id: uuid.UUID,
    params: dict[str, Any],
    user_id: uuid.UUID,
    session: Session,
) -> dict[str, Any]:
    """
    Generate test từ collected params - Dùng Chat App
    """
    try:
        # Prepare context
        study_context = self.prepare_study_context(studyset_id, session)
        
        from app.core.config import settings
        
        # Kiểm tra xem dùng Chat App hay Workflow
        use_chat_app = settings.DIFY_CHAT_APP_TEST_ID is not None
        
        if use_chat_app:
            # Dùng Chat App
            # Tạo query với action và params
            query = f"""Tạo {params.get('total_questions', 10)} câu hỏi {params.get('question_types', ['MULTIPLE_CHOICE'])[0]}.
            
Yêu cầu:
- Số câu hỏi: {params.get('total_questions', 10)}
- Loại câu hỏi: {params.get('question_types', ['MULTIPLE_CHOICE'])}
- Thời gian: {params.get('time_limit', 'không giới hạn')} phút

Trả về JSON với format:
{{
  "questions": [
    {{
      "term_text": "Tên term",
      "question_text": "Câu hỏi",
      "question_type": "MULTIPLE_CHOICE",
      "correct_answer": "Đáp án đúng",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "explanation": "Giải thích"
    }}
  ],
  "total_questions": {params.get('total_questions', 10)},
  "time_limit": {params.get('time_limit')}
}}"""

            logger.info(f"Calling Dify Chat App to generate test for studyset {studyset_id}")
            result = await dify_service.chat_completion(
                query=query,
                user=str(user_id),
                response_mode="blocking",
                inputs={
                    "study_context": study_context,
                    "total_questions": params.get("total_questions", 10),
                    "question_types": params.get("question_types", ["MULTIPLE_CHOICE"]),
                    "time_limit": params.get("time_limit"),
                },
            )
            
            # Parse response từ Chat App
            answer = result.get("answer", "")
            if not answer:
                raise ValueError("Dify Chat App returned no answer")
            
            # Parse JSON từ text answer
            import json
            import re
            
            # Loại bỏ markdown code blocks nếu có
            text = answer.strip()
            if text.startswith("```"):
                match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
                if match:
                    text = match.group(1)
                else:
                    text = re.sub(r'```json\s*', '', text)
                    text = re.sub(r'```\s*$', '', text)
            
            test_data = json.loads(text)
            
        else:
            # Dùng Workflow (code cũ)
            # ... (giữ nguyên code workflow)
            pass
        
        # Validate và parse questions
        questions = test_data.get("questions", [])
        if not questions:
            raise ValueError("No questions in test data")
        
        # ... (phần còn lại giữ nguyên)
```

**Tương tự cho `generate_paragraph` và `answer_academic_question`**

### Bước 3: Cập Nhật DifyService (Nếu Cần)

**File:** `backend/app/services/dify_service.py`

Method `chat_completion` đã có sẵn, nhưng có thể cần thêm `app_id` parameter:

```python
async def chat_completion(
    self,
    query: str,
    user: str | None = None,
    conversation_id: str | None = None,
    response_mode: str = "blocking",
    inputs: dict[str, Any] | None = None,  # Thêm inputs parameter
    app_id: str | None = None,  # Thêm app_id parameter
    **kwargs: Any,
) -> dict[str, Any]:
    """
    Gửi chat message đến Dify Chat App
    """
    data: dict[str, Any] = {
        "inputs": inputs or {},  # Input variables cho Chat App
        "query": query,
        "response_mode": response_mode,
    }

    if user:
        data["user"] = user

    if conversation_id:
        data["conversation_id"] = conversation_id
    
    if app_id:
        data["app_id"] = app_id  # Nếu cần specify app_id

    data.update(kwargs)

    return await self._request("POST", "chat-messages", data=data)
```

---

## 🎯 Dify Chat App Setup

### Cách 1: Tạo 3 Chat Apps Riêng (Khuyến nghị)

#### Chat App 1: Generate Test

1. **Tạo Chat App:**
   - Applications → Create App → Chat Application
   - Name: `generate_test_chat_app`

2. **Cấu hình System Prompt:**
   ```
   Bạn là giáo viên chuyên tạo bài test từ nội dung học tập.

   ## Nhiệm vụ:
   Tạo câu hỏi từ nội dung học tập được cung cấp.

   ## Nội dung học tập:
   {study_context}

   ## Yêu cầu:
   - Số câu hỏi: {total_questions}
   - Loại câu hỏi: {question_types}
   - Thời gian: {time_limit} phút (nếu có)
   - Mỗi câu hỏi PHẢI dựa trên một term cụ thể trong study_context
   - Đáp án đúng phải chính xác 100%

   ## Format output (QUAN TRỌNG - phải là JSON hợp lệ):
   {{
     "questions": [
       {{
         "term_text": "Tên term (PHẢI khớp chính xác với term trong study_context)",
         "question_text": "Câu hỏi đầy đủ...",
         "question_type": "MULTIPLE_CHOICE",
         "correct_answer": "Đáp án đúng",
         "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
         "explanation": "Giải thích"
       }}
     ],
     "total_questions": {total_questions},
     "time_limit": {time_limit}
   }}

   ## Lưu ý:
   - Output PHẢI là JSON hợp lệ, không có text thừa
   - term_text PHẢI khớp chính xác với term trong study_context
   ```

3. **Cấu hình Input Variables:**
   - `study_context` (String, Required)
   - `total_questions` (Number, Optional, Default: 10)
   - `question_types` (Array, Optional, Default: ["MULTIPLE_CHOICE"])
   - `time_limit` (Number, Optional)

4. **Lấy App ID:**
   - Settings → API → Copy App ID

#### Chat App 2: Generate Paragraph

Tương tự, nhưng System Prompt khác:

```
Bạn là giáo viên viết đoạn văn minh họa khái niệm học tập.

## Nội dung học tập:
{study_context}

## Yêu cầu:
- Độ dài: 200-300 từ
- Style: {style} (formal, academic, clear, dễ hiểu)

## Format output (JSON):
{{
  "paragraph": "Đoạn văn đầy đủ 200-300 từ...",
  "key_concepts": ["concept1", "concept2"],
  "word_count": 250
}}
```

**Input Variables:**
- `study_context` (String, Required)
- `style` (String, Optional, Default: "academic")

#### Chat App 3: Answer Question

System Prompt:

```
Bạn là trợ lý học tập AI giúp sinh viên học bài từ studyset.

## Context học tập:
{study_context}

## Quy tắc:
- Chỉ trả lời về nội dung học thuật trong study_context
- Từ chối câu hỏi không liên quan đến học tập
- Format câu trả lời rõ ràng, dễ hiểu
- Sử dụng ví dụ cụ thể từ study_context
```

**Input Variables:**
- `study_context` (String, Required)
- `query` (String, Required) - Câu hỏi của user

### Cách 2: Dùng 1 Chat App Cho Tất Cả (Không khuyến nghị)

Có thể dùng 1 Chat App với System Prompt phân biệt action_type, nhưng phức tạp hơn và khó maintain.

---

## ⚠️ Lưu Ý Quan Trọng

### 1. Parse JSON Từ Text Answer

Chat App trả về text, không phải structured JSON. Cần parse:

```python
import json
import re

# Loại bỏ markdown code blocks
text = answer.strip()
if text.startswith("```"):
    match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if match:
        text = match.group(1)

test_data = json.loads(text)
```

### 2. Error Handling

Chat App có thể trả về text không phải JSON hợp lệ. Cần handle:

```python
try:
    test_data = json.loads(text)
except json.JSONDecodeError:
    # Retry hoặc fallback
    raise ValueError("Chat App returned invalid JSON")
```

### 3. System Prompt Phải Rõ Ràng

System Prompt trong Chat App phải yêu cầu LLM trả về JSON format cụ thể, không được có text thừa.

### 4. Input Variables

Input Variables trong Chat App được truyền qua `inputs` parameter, và có thể dùng trong System Prompt với `{variable_name}`.

---

## 🧪 Test

### Test Chat App Trong Dify UI

1. Vào Chat App → Test
2. Nhập inputs:
   ```json
   {
     "study_context": "StudySet: Biology\n\nTerms:\n- Photosynthesis: ...",
     "total_questions": 2,
     "question_types": ["MULTIPLE_CHOICE"],
     "time_limit": 15
   }
   ```
3. Gửi query: "Tạo test"
4. Kiểm tra answer có phải JSON hợp lệ không

### Test Từ Backend

Sau khi cập nhật code, test qua chatbot UI hoặc API.

---

## 📊 So Sánh Workflow vs Chat App

| Feature | Workflow | Chat App |
|---------|----------|----------|
| Input | `inputs` (structured) | `query` + `inputs` |
| Output | `outputs` (structured) | `answer` (text) |
| System Prompt | Trong LLM Node | Trong Chat App Settings |
| Parse Response | Trực tiếp từ `outputs` | Parse JSON từ `answer` |
| Flexibility | Structured, dễ parse | Flexible, nhưng cần parse |
| Use Case | Generate structured data | Q&A, flexible responses |

---

## 💡 Khuyến Nghị

**Nên dùng Workflow nếu:**
- Cần structured output (test, paragraph)
- Cần validate và transform data
- Cần logic phức tạp với nhiều steps

**Nên dùng Chat App nếu:**
- Chỉ cần Q&A (answer_question)
- Cần flexibility trong response
- Không cần structured data

**Hybrid Approach (Khuyến nghị):**
- Workflow cho `generate_test` và `generate_paragraph` (cần structured JSON)
- Chat App cho `answer_question` (chỉ cần text answer)

---

Nếu bạn muốn, tôi có thể giúp implement các thay đổi này!

