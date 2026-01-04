# HƯỚNG DẪN TRIỂN KHAI AI CHATBOT - TỔNG HỢP

File này là hướng dẫn duy nhất, thống nhất cho toàn bộ quá trình triển khai AI Chatbot.

---

## 📋 MỤC LỤC

1. [Backend → Dify: Gửi gì và khi nào](#backend--dify)
2. [Dify → Backend: Trả về gì và khi nào](#dify--backend)
3. [Kế hoạch implement Backend tiếp theo](#backend-implementation)
4. [Kế hoạch implement Frontend tiếp theo](#frontend-implementation)

---

## 🔵 BACKEND → DIFY: GỬI GÌ VÀ KHI NÀO

### Bước 1: Generate Test - Backend gửi lên Dify

**Khi nào:** User chọn "Tạo bài test" → Collect params xong → User xác nhận

**Endpoint Dify:**
```
POST {DIFY_BASE_URL}/workflows/run
```

**Request Body:**
```json
{
  "inputs": {
    "study_context": "StudySet: {title}\nDescription: {description}\n\nTerms:\n- {term_text}: {definition}\n- {term_text}: {definition}",
    "total_questions": 10,
    "question_types": ["MULTIPLE_CHOICE"],
    "time_limit": 15
  },
  "user": "user-uuid-string",
  "response_mode": "blocking"
}
```

**Chi tiết inputs:**

| Field | Type | Mô tả | Ví dụ |
|-------|------|-------|-------|
| `study_context` | String | **QUAN TRỌNG** - Format: "Term: Definition" mỗi dòng | "Photosynthesis: Quá trình..." |
| `total_questions` | Number | Số câu hỏi muốn tạo | `10` |
| `question_types` | Array | Loại câu hỏi | `["MULTIPLE_CHOICE"]` |
| `time_limit` | Number \| null | Giới hạn thời gian (phút) | `15` hoặc `null` |

**Format `study_context` (QUAN TRỌNG):**
```
StudySet: Biology Basics
Description: Các khái niệm cơ bản

Terms:
- Photosynthesis: Quá trình thực vật chuyển đổi ánh sáng mặt trời thành năng lượng hóa học
- Mitochondria: Bào quan sản xuất năng lượng trong tế bào
- Chloroplast: Bào quan chứa chất diệp lục
```

**Lưu ý:**
- `term_text` phải khớp chính xác với `Term.term_text` trong database
- Mỗi term phải có format: `- {term_text}: {definition}`
- Backend sẽ dùng `term_text` để map với `term_id` khi lưu `TestQuestion`

**Code Backend:**
```python
# File: backend/app/services/generation_service.py (sẽ tạo)

workflow_inputs = {
    "study_context": prepare_study_context(studyset_id),  # String
    "total_questions": params.get("total_questions", 10),  # Number
    "question_types": params.get("question_types", ["MULTIPLE_CHOICE"]),  # Array
    "time_limit": params.get("time_limit"),  # Number hoặc None
}

result = await dify_service.run_workflow(
    inputs=workflow_inputs,
    user=str(user_id),
    response_mode="blocking"
)
```

---

### Bước 2: Generate Paragraph - Backend gửi lên Dify

**Khi nào:** User chọn "Tạo paragraph" → Generate ngay

**Endpoint Dify:**
```
POST {DIFY_BASE_URL}/workflows/run
```

**Request Body:**
```json
{
  "inputs": {
    "study_context": "StudySet: {title}\n\nTerms:\n- {term_text}: {definition}\n- {term_text}: {definition}",
    "style": "academic"
  },
  "user": "user-uuid-string",
  "response_mode": "blocking"
}
```

**Chi tiết inputs:**

| Field | Type | Mô tả |
|-------|------|-------|
| `study_context` | String | Nội dung học tập (format giống test) |
| `style` | String | Style: "academic" (default) |

**Code Backend:**
```python
workflow_inputs = {
    "study_context": prepare_study_context(studyset_id),
    "style": "academic",
}

result = await dify_service.run_workflow(
    inputs=workflow_inputs,
    user=str(user_id),
    response_mode="blocking"
)
```

---

### Bước 3: Answer Question - Backend gửi lên Dify

**Khi nào:** User hỏi câu hỏi tự do về nội dung studyset

**Endpoint Dify:**
```
POST {DIFY_BASE_URL}/chat-messages
```

**Request Body:**
```json
{
  "inputs": {
    "study_context": "StudySet: {title}\n\nTerms:\n- {term_text}: {definition}"
  },
  "query": "Quá trình quang hợp diễn ra như thế nào?",
  "user": "user-uuid-string",
  "conversation_id": "conv-id-from-dify",
  "response_mode": "blocking"
}
```

**Chi tiết:**

| Field | Type | Mô tả |
|-------|------|-------|
| `inputs.study_context` | String | Nội dung học tập (inject vào system prompt) |
| `query` | String | **QUAN TRỌNG** - Câu hỏi của user |
| `conversation_id` | String \| null | ID conversation (để tiếp tục chat) |
| `user` | String | User ID |

**Code Backend:**
```python
result = await dify_service.chat_completion(
    query=question,  # String: câu hỏi của user
    user=str(user_id),
    conversation_id=conversation_id,  # Optional
    inputs={"study_context": study_context},
    response_mode="blocking"
)
```

---

## 🟢 DIFY → BACKEND: TRẢ VỀ GÌ VÀ KHI NÀO

### Response 1: Generate Test - Dify trả về

**Khi nào:** Sau khi Backend gửi workflow run cho generate test

**Response Structure:**
```json
{
  "task_id": "task-abc123",
  "workflow_run_id": "run-xyz789",
  "data": {
    "status": "succeeded",
    "outputs": {
      "test_data": {
        "questions": [
          {
            "term_text": "Photosynthesis",  // QUAN TRỌNG: để map với term_id
            "question_text": "Quá trình quang hợp diễn ra ở đâu?",
            "question_type": "MULTIPLE_CHOICE",
            "correct_answer": "Chloroplast",
            "options": [
              "A. Mitochondria",
              "B. Chloroplast",
              "C. Nucleus",
              "D. Ribosome"
            ],
            "explanation": "Chloroplast là bào quan...",
            "order": 0
          }
        ],
        "total_questions": 10,
        "time_limit": 15
      }
    }
  }
}
```

**Backend parse và làm gì:**

1. **Parse `test_data.questions`**
2. **Map `term_text` → `term_id`** (từ database)
3. **Tạo `Test` record:**
   ```python
   Test(
       studyset_id=studyset_id,
       title="AI Generated Test - 10 questions",
       total_questions=10,
       question_types=["MULTIPLE_CHOICE"],
       time_limit=15 * 60,  # Convert minutes to seconds
       created_by=user_id,
   )
   ```

4. **Tạo `TestQuestion` records:**
   ```python
   for q in questions:
       TestQuestion(
           test_id=test.test_id,
           term_id=term_id,  # Mapped từ term_text
           question_type=QuestionType(q["question_type"]),
           question_text=q["question_text"],
           correct_answer=q["correct_answer"],
           options=q["options"],  # list[str] hoặc None
           order=q["order"],
       )
   ```

5. **Lưu vào `AIGeneratedContents`:**
   ```python
   AIGeneratedContents(
       studyset_id=studyset_id,
       source_model="Dify Workflow",
       generate_type=GenerateType.TEST,
       prompt=str(workflow_inputs),
       output=test_data,
   )
   ```

---

### Response 2: Generate Paragraph - Dify trả về

**Khi nào:** Sau khi Backend gửi workflow run cho generate paragraph

**Response Structure:**
```json
{
  "task_id": "task-def456",
  "workflow_run_id": "run-uvw012",
  "data": {
    "status": "succeeded",
    "outputs": {
      "paragraph_data": {
        "paragraph": "Quá trình quang hợp là một trong những quá trình quan trọng nhất trong sinh học. Quá trình này diễn ra trong chloroplast...",
        "key_concepts": ["Photosynthesis", "Chloroplast", "Mitochondria"],
        "word_count": 250
      }
    }
  }
}
```

**Backend parse và làm gì:**

1. **Parse `paragraph_data`**
2. **Lưu vào `AIGeneratedContents`:**
   ```python
   AIGeneratedContents(
       studyset_id=studyset_id,
       source_model="Dify Workflow",
       generate_type=GenerateType.PARAGRAPH,
       prompt=str(workflow_inputs),
       output=paragraph_data,  # JSONB
   )
   ```

3. **Trả về cho Frontend:**
   ```python
   {
       "message": f"📄 Đoạn văn đã được tạo:\n\n{paragraph_data['paragraph']}",
       "metadata": {
           "paragraph": paragraph_data["paragraph"],
           "key_concepts": paragraph_data.get("key_concepts", []),
           "word_count": paragraph_data.get("word_count", 0),
           "ai_content_id": str(ai_content.ai_content_id),
       },
   }
   ```

---

### Response 3: Answer Question - Dify trả về

**Khi nào:** Sau khi Backend gửi chat completion

**Response Structure:**
```json
{
  "id": "msg-xyz789",
  "answer": "Quá trình quang hợp diễn ra trong chloroplast của thực vật. Quá trình này bao gồm hai giai đoạn chính: pha sáng và pha tối...",
  "conversation_id": "conv-abc123",
  "metadata": {
    "usage": {
      "prompt_tokens": 150,
      "completion_tokens": 80,
      "total_tokens": 230
    }
  }
}
```

**Backend parse và làm gì:**

1. **Lấy `answer` từ response**
2. **Trả về cho Frontend:**
   ```python
   {
       "answer": result.get("answer", ""),
       "metadata": {
           "conversation_id": result.get("conversation_id"),
       },
   }
   ```

---

## 🔧 BACKEND IMPLEMENTATION - KẾ HOẠCH TIẾP THEO

### ✅ Đã hoàn thành

1. ✅ Models & Enums (`ChatConversation`, `ChatMessage`, `ConversationIntent`, `ConversationState`)
2. ✅ Schemas (`ChatRequest`, `ChatResponse`, `QuickReplyButton`)
3. ✅ Chatbot Service (conversation logic đầy đủ)
4. ✅ Mock Generation Service (để test)
5. ✅ API Endpoints (`POST /api/v1/chatbot/studysets/{id}/chat`)

### ⏳ Cần làm tiếp

#### Bước 1: Database Migration (Ưu tiên cao)

**File:** `backend/app/alembic/versions/xxxx_add_chat_conversation.py`

**Chạy:**
```bash
cd backend
alembic revision --autogenerate -m "add_chat_conversation_models"
alembic upgrade head
```

**Verify:**
- Table `ChatConversation` đã được tạo
- Table `ChatMessage` đã được tạo
- Foreign keys đúng

---

#### Bước 2: Generation Service (Cần Dify)

**File:** `backend/app/services/generation_service.py` (tạo mới)

**Cần implement:**

1. **`prepare_study_context(studyset_id, session) -> str`**
   ```python
   def prepare_study_context(studyset_id, session) -> str:
       """Format study_context để gửi lên Dify"""
       studyset = session.get(StudySet, studyset_id)
       terms = session.exec(
           select(Term).where(Term.studyset_id == studyset_id)
       ).all()
       
       parts = [f"StudySet: {studyset.title}"]
       if studyset.description:
           parts.append(f"Description: {studyset.description}")
       
       parts.append("\nTerms:")
       for term in terms:
           term_line = f"- {term.term_text}"
           if term.definition:
               term_line += f": {term.definition}"
           parts.append(term_line)
       
       return "\n".join(parts)
   ```

2. **`generate_test_from_params(studyset_id, params, user_id, session)`**
   ```python
   async def generate_test_from_params(...):
       # 1. Prepare study_context
       study_context = self.prepare_study_context(studyset_id, session)
       
       # 2. Prepare Dify inputs
       workflow_inputs = {
           "study_context": study_context,
           "total_questions": params.get("total_questions", 10),
           "question_types": params.get("question_types", ["MULTIPLE_CHOICE"]),
           "time_limit": params.get("time_limit"),
       }
       
       # 3. Call Dify workflow
       result = await dify_service.run_workflow(
           inputs=workflow_inputs,
           user=str(user_id),
       )
       
       # 4. Parse response
       outputs = result.get("outputs") or result.get("data", {}).get("outputs", {})
       test_data = outputs.get("test_data")
       
       # 5. Map term_text → term_id
       # 6. Create Test và TestQuestion records
       # 7. Save to AIGeneratedContents
       # 8. Return response
   ```

3. **`generate_paragraph(studyset_id, user_id, session)`**
   ```python
   async def generate_paragraph(...):
       # 1. Prepare study_context
       # 2. Call Dify workflow
       # 3. Parse response
       # 4. Save to AIGeneratedContents
       # 5. Return response
   ```

4. **`answer_academic_question(question, studyset_id, user_id, session)`**
   ```python
   async def answer_academic_question(...):
       # 1. Prepare study_context
       # 2. Call Dify chat_completion
       # 3. Return answer
   ```

5. **`map_term_text_to_id(term_text, studyset_id, session) -> uuid.UUID`**
   ```python
   def map_term_text_to_id(term_text, studyset_id, session) -> uuid.UUID:
       """Map term_text từ Dify output → term_id trong database"""
       terms = session.exec(
           select(Term).where(Term.studyset_id == studyset_id)
       ).all()
       
       term_lower = term_text.lower().strip()
       
       # Exact match
       for term in terms:
           if term.term_text.lower() == term_lower:
               return term.term_id
       
       # Fuzzy match
       for term in terms:
           if term_lower in term.term_text.lower() or term.term_text.lower() in term_lower:
               return term.term_id
       
       # Fallback: first term
       if terms:
           return terms[0].term_id
       
       raise ValueError(f"No terms found for studyset {studyset_id}")
   ```

---

#### Bước 3: Replace Mock với Real Service

**File:** `backend/app/services/chatbot_service.py`

**Thay đổi:**
```python
# Dòng 22-25, thay:
self.generation_service = MockGenerationService(session)

# Bằng:
from app.services.generation_service import GenerationService
self.generation_service = GenerationService(session)
```

---

#### Bước 4: Testing

**Files:**
- `backend/tests/services/test_chatbot_service.py`
- `backend/tests/api/test_chatbot.py`

**Test cases:**
- Test conversation flow
- Test param collection
- Test generate test với Dify thật
- Test generate paragraph với Dify thật
- Test Q&A với Dify thật

---

## 🎨 FRONTEND IMPLEMENTATION - KẾ HOẠCH TIẾP THEO

### ⏳ Cần làm

#### Bước 1: Redux API Client

**File:** `frontend/app/redux/features/chatbot/chatbotApi.ts` (tạo mới)

**Code:**
```typescript
import { baseApi } from '../store/api/baseApi';

export interface ChatRequest {
  studyset_id: string;
  message: string;
  conversation_id?: string | null;
  button_clicked?: string | null;
}

export interface QuickReplyButton {
  label: string;
  value: string;
  type?: "text" | "number" | "option";
  icon?: string | null;
}

export interface ChatResponse {
  conversation_id: string;
  message: string;
  state: "initial" | "waiting_intent" | "collecting_test_params" | "generating" | "completed";
  quick_replies?: QuickReplyButton[] | null;
  metadata?: {
    test_id?: string;
    total_questions?: number;
    paragraph?: string;
    key_concepts?: string[];
    word_count?: number;
    ai_content_id?: string;
  } | null;
  show_input: boolean;
}

export const chatbotApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    chatWithStudyset: builder.mutation<ChatResponse, ChatRequest>({
      query: ({ studyset_id, ...body }) => ({
        url: `/chatbot/studysets/${studyset_id}/chat`,
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useChatWithStudysetMutation } = chatbotApi;
```

---

#### Bước 2: UI Components

**File:** `frontend/app/components/shared/chatbot.tsx` (update hoặc tạo mới)

**Cần implement:**

1. **Chat Container**
   - Messages list (user/assistant)
   - Scroll to bottom
   - Loading states

2. **Quick Reply Buttons Component**
   ```typescript
   interface QuickReplyButtonsProps {
     buttons: QuickReplyButton[];
     onButtonClick: (value: string) => void;
     disabled?: boolean;
   }
   
   export function QuickReplyButtons({ buttons, onButtonClick, disabled }: QuickReplyButtonsProps) {
     return (
       <div className="quick-replies">
         {buttons.map((btn) => (
           <button
             key={btn.value}
             onClick={() => onButtonClick(btn.value)}
             disabled={disabled}
           >
             {btn.icon && <span>{btn.icon}</span>}
             {btn.label}
           </button>
         ))}
       </div>
     );
   }
   ```

3. **Text Input**
   - Show/hide based on `show_input` từ response
   - Handle Enter key
   - Disable khi `state = GENERATING`

4. **Message Bubbles**
   - User messages (right aligned)
   - Assistant messages (left aligned)
   - Format text với line breaks

5. **Loading Indicator**
   - Show khi `state = GENERATING`
   - Disable buttons và input

---

#### Bước 3: Integration với StudySet Detail

**File:** `frontend/app/components/pages/dashboard/studyset-detail.tsx`

**Cần thêm:**

1. **Chatbot Button/Modal**
   ```typescript
   const [showChatbot, setShowChatbot] = useState(false);
   
   // Add button to open chatbot
   <Button onClick={() => setShowChatbot(true)}>
     <MessageSquare /> Chat với AI
   </Button>
   
   // Chatbot modal/drawer
   {showChatbot && (
     <Chatbot
       studysetId={studysetId}
       onClose={() => setShowChatbot(false)}
     />
   )}
   ```

2. **Handle Navigation**
   ```typescript
   // Khi có test_id trong metadata
   if (response.metadata?.test_id) {
     navigate(`/dashboard/tests/${response.metadata.test_id}`);
   }
   ```

---

#### Bước 4: State Management

**Cần quản lý:**
- `conversation_id` - Lưu và gửi lại trong request tiếp theo
- `messages` - Array of messages để render
- `currentQuickReplies` - Buttons hiện tại
- `isLoading` - Loading state

**Code mẫu:**
```typescript
const [conversationId, setConversationId] = useState<string | null>(null);
const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
const [currentQuickReplies, setCurrentQuickReplies] = useState<QuickReplyButton[] | null>(null);
const [isLoading, setIsLoading] = useState(false);

const [chatMutation] = useChatWithStudysetMutation();

const sendMessage = async (message: string, buttonValue?: string) => {
  setIsLoading(true);
  try {
    const response = await chatMutation({
      studyset_id: studysetId,
      message: message || buttonValue || '',
      conversation_id: conversationId,
      button_clicked: buttonValue || null,
    }).unwrap();

    // Update conversation_id
    setConversationId(response.conversation_id);

    // Add messages
    setMessages(prev => [...prev, 
      { role: 'user', content: message || buttonValue || '' },
      { role: 'assistant', content: response.message }
    ]);

    // Update quick replies
    setCurrentQuickReplies(response.quick_replies || null);

    // Handle metadata (navigate nếu có test_id)
    if (response.metadata?.test_id) {
      navigate(`/dashboard/tests/${response.metadata.test_id}`);
    }
  } catch (error) {
    console.error('Chat error:', error);
  } finally {
    setIsLoading(false);
  }
};
```

---

## 📋 CHECKLIST TỔNG HỢP

### Backend

#### ✅ Đã hoàn thành
- [x] Models & Enums
- [x] Schemas
- [x] Chatbot Service
- [x] Mock Generation Service
- [x] API Routes

#### ⏳ Cần làm
- [ ] **Chạy Database Migration** ← QUAN TRỌNG!
- [ ] Setup Dify Workflows
- [ ] Tạo Generation Service (real)
- [ ] Replace Mock với Real Service
- [ ] Test với Dify thật

### Frontend

#### ⏳ Cần làm
- [ ] Redux API Client
- [ ] Chatbot UI Component
- [ ] Quick Reply Buttons Component
- [ ] Integration với StudySet Detail
- [ ] State Management
- [ ] Navigation khi có test_id

---

## 🎯 FLOW HOÀN CHỈNH

### Scenario: User tạo test

```
1. Frontend → Backend:
   POST /api/v1/chatbot/studysets/{id}/chat
   { studyset_id, message: "", conversation_id: null }
   
2. Backend → Frontend:
   { conversation_id, message: "Xin chào!", quick_replies: [...] }
   
3. User click "Tạo bài test"
   Frontend → Backend:
   { studyset_id, message: "gen_test", conversation_id: "..." }
   
4. Backend → Frontend:
   { message: "Bạn muốn bao nhiêu câu?", quick_replies: [5, 10, 15, 20] }
   
5. User click "10"
   Frontend → Backend:
   { studyset_id, message: "10", conversation_id: "..." }
   
6. Backend → Frontend:
   { message: "Loại câu hỏi?", quick_replies: [Trắc nghiệm, Đúng/Sai, ...] }
   
7. User click "Trắc nghiệm"
   Frontend → Backend:
   { studyset_id, message: "MULTIPLE_CHOICE", conversation_id: "..." }
   
8. Backend → Frontend:
   { message: "Time limit?", quick_replies: [10, 15, 20, ...] }
   
9. User click "15"
   Frontend → Backend:
   { studyset_id, message: "15", conversation_id: "..." }
   
10. Backend → Frontend:
    { message: "Xác nhận tạo test?", quick_replies: [Xác nhận, Sửa lại] }
    
11. User click "Xác nhận"
    Frontend → Backend:
    { studyset_id, message: "confirm", conversation_id: "..." }
    
12. Backend → Dify:
    POST /workflows/run
    { inputs: { study_context, total_questions: 10, ... } }
    
13. Dify → Backend:
    { data: { outputs: { test_data: { questions: [...] } } } }
    
14. Backend:
    - Parse questions
    - Map term_text → term_id
    - Create Test và TestQuestion records
    - Save to AIGeneratedContents
    
15. Backend → Frontend:
    { message: "✅ Đã tạo test!", metadata: { test_id: "..." } }
    
16. Frontend:
    - Navigate to test page
    - Hoặc show success message
```

---

## 🔑 ĐIỂM QUAN TRỌNG

### Backend → Dify

1. **`study_context` format:**
   - Phải có format: `"- {term_text}: {definition}"`
   - `term_text` phải khớp với database

2. **Input variables:**
   - Tên phải khớp 100% với Dify workflow
   - Case-sensitive

3. **Time limit:**
   - Dify nhận **phút** (minutes)
   - Database lưu **giây** (seconds)
   - Backend convert: `time_limit * 60`

### Dify → Backend

1. **Parse response:**
   - Check `outputs` hoặc `data.outputs`
   - Validate JSON structure

2. **Term mapping:**
   - Dùng `term_text` từ Dify output
   - Map với `term_id` trong database
   - Fallback nếu không tìm thấy

3. **Error handling:**
   - Handle invalid JSON
   - Handle missing fields
   - Handle Dify API errors

### Frontend → Backend

1. **Conversation ID:**
   - Lưu từ response
   - Gửi lại trong request tiếp theo
   - `null` = conversation mới

2. **Message:**
   - Có thể là text user type
   - Hoặc button value khi click

3. **State management:**
   - Track `conversation_id`
   - Track `messages`
   - Track `quick_replies`

---

## 📚 TÀI LIỆU THAM KHẢO

- Dify API: https://docs.dify.ai/guides/application-development/api-reference
- Dify Workflows: https://docs.dify.ai/guides/workflows
- FastAPI: https://fastapi.tiangolo.com/
- React Router: https://reactrouter.com/

---

**Status:** 🟡 Backend core logic hoàn thành, đang chờ Dify setup và Frontend implementation

