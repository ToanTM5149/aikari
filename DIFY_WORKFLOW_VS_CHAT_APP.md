# 🔄 PHÂN BIỆT WORKFLOW APP VÀ CHAT APP TRONG DIFY

## 📊 Tổng Quan

### Workflow App
- **Mục đích:** Xử lý structured data, automation, multi-step processes
- **Input:** Dictionary với các variables (structured)
- **Output:** Dictionary với các outputs (structured)
- **Use Case:** Generate structured data (JSON), data transformation, validation

### Chat App
- **Mục đích:** Conversational AI, Q&A, flexible text responses
- **Input:** Text query + optional variables
- **Output:** Text answer
- **Use Case:** Chatbot, Q&A, flexible responses

---

## 🔍 So Sánh Chi Tiết

| Feature | Workflow App | Chat App |
|---------|--------------|----------|
| **Input Format** | `inputs: {variable1: value1, variable2: value2}` | `query: "text"` + `inputs: {variable1: value1}` |
| **Output Format** | `outputs: {output1: value1, output2: value2}` | `answer: "text response"` |
| **Structure** | Structured (dict/JSON) | Unstructured (text) |
| **System Prompt** | Trong LLM Node (có thể có nhiều nodes) | Trong Chat App Settings (1 prompt) |
| **Multi-step Processing** | ✅ Có (IF/ELSE, Code Node, nhiều LLM nodes) | ❌ Không (chỉ 1 LLM call) |
| **Data Validation** | ✅ Có (Code Node để validate) | ❌ Không (phải parse từ text) |
| **Parse Response** | Trực tiếp từ `outputs` | Phải parse JSON từ `answer` text |
| **Flexibility** | Structured, predictable | Flexible, nhưng unpredictable |
| **Best For** | Generate structured data, automation | Q&A, conversational |

---

## ✅ Workflow App CÓ THỂ Làm Được Các Tác Vụ Này

### 1. Generate Test ✅

**Workflow App hoàn toàn phù hợp:**

```
START Node
  ↓
IF/ELSE Node (action_type == "generate_test")
  ↓
LLM Node (generate questions với system prompt)
  ↓
Code Node (validate JSON, parse questions)
  ↓
END Node (trả về test_data)
```

**Ưu điểm:**
- ✅ Output structured (JSON) → Dễ parse
- ✅ Có thể validate data trong Code Node
- ✅ Có thể transform data trước khi trả về
- ✅ Predictable output format

**Input:**
```json
{
  "action_type": "generate_test",
  "study_context": "...",
  "total_questions": 10,
  "question_types": ["MULTIPLE_CHOICE"],
  "time_limit": 15
}
```

**Output:**
```json
{
  "outputs": {
    "result": {
      "action_type": "generate_test",
      "data": {
        "test_data": {
          "questions": [...],
          "total_questions": 10,
          "time_limit": 15
        }
      }
    }
  }
}
```

### 2. Generate Paragraph ✅

**Workflow App hoàn toàn phù hợp:**

```
START Node
  ↓
IF/ELSE Node (action_type == "generate_paragraph")
  ↓
LLM Node (generate paragraph với system prompt)
  ↓
Code Node (validate JSON, check word count)
  ↓
END Node (trả về paragraph_data)
```

**Ưu điểm:**
- ✅ Output structured (JSON với paragraph, key_concepts, word_count)
- ✅ Có thể validate word count, structure
- ✅ Dễ parse và lưu vào database

**Input:**
```json
{
  "action_type": "generate_paragraph",
  "study_context": "...",
  "style": "academic"
}
```

**Output:**
```json
{
  "outputs": {
    "result": {
      "action_type": "generate_paragraph",
      "data": {
        "paragraph_data": {
          "paragraph": "...",
          "key_concepts": [...],
          "word_count": 250
        }
      }
    }
  }
}
```

### 3. Answer Question ✅ (Nhưng Chat App tốt hơn)

**Workflow App có thể làm, nhưng Chat App phù hợp hơn:**

```
START Node
  ↓
IF/ELSE Node (action_type == "answer_question")
  ↓
LLM Node (answer question với system prompt)
  ↓
END Node (trả về answer text)
```

**Workflow App:**
- ✅ Có thể làm được
- ✅ Output structured (có thể wrap trong JSON)
- ⚠️ Hơi phức tạp cho use case đơn giản

**Chat App:**
- ✅ Phù hợp hơn cho Q&A
- ✅ Designed cho conversational use case
- ✅ Đơn giản hơn
- ✅ Có conversation history tự động

**Input:**
```json
{
  "action_type": "answer_question",
  "study_context": "...",
  "query": "Quá trình quang hợp là gì?"
}
```

**Output (Workflow):**
```json
{
  "outputs": {
    "result": {
      "action_type": "answer_question",
      "data": {
        "answer": "Quá trình quang hợp là..."
      }
    }
  }
}
```

**Output (Chat App):**
```json
{
  "answer": "Quá trình quang hợp là...",
  "conversation_id": "..."
}
```

---

## 🎯 Khuyến Nghị

### Option 1: Dùng Workflow App Cho Tất Cả (Recommended)

**Ưu điểm:**
- ✅ Consistent API (tất cả dùng `run_workflow`)
- ✅ Structured output cho tất cả
- ✅ Có thể validate và transform data
- ✅ Dễ maintain (1 workflow thay vì 3 apps)
- ✅ Có thể mở rộng thêm actions sau này

**Nhược điểm:**
- ⚠️ Hơi phức tạp cho Q&A (nhưng vẫn làm được)
- ⚠️ Không có conversation history tự động cho Q&A

**Implementation:**
- 1 Workflow với IF/ELSE để phân nhánh
- 3 LLM Nodes (Test, Paragraph, Q&A)
- Code Nodes để validate (cho Test và Paragraph)
- END Node format output

### Option 2: Hybrid (Workflow + Chat App)

**Ưu điểm:**
- ✅ Workflow cho Test và Paragraph (structured)
- ✅ Chat App cho Q&A (conversational, có history)

**Nhược điểm:**
- ⚠️ Phải maintain 2 loại apps
- ⚠️ API khác nhau (`run_workflow` vs `chat_completion`)

**Implementation:**
- Workflow cho `generate_test` và `generate_paragraph`
- Chat App cho `answer_question`

### Option 3: Chỉ Dùng Chat App

**Ưu điểm:**
- ✅ Đơn giản (chỉ 1 loại app)
- ✅ Phù hợp cho Q&A

**Nhược điểm:**
- ❌ Phải parse JSON từ text (khó và dễ lỗi)
- ❌ Không có validation tự động
- ❌ Output không predictable
- ❌ Không có multi-step processing

---

## 💡 Kết Luận

### Workflow App CÓ THỂ làm được tất cả 3 tác vụ:

1. ✅ **Generate Test** - Rất phù hợp (structured output)
2. ✅ **Generate Paragraph** - Rất phù hợp (structured output)
3. ✅ **Answer Question** - Làm được (nhưng Chat App tốt hơn)

### Khuyến Nghị Cuối Cùng:

**Dùng Workflow App cho tất cả** vì:
- ✅ Tất cả đều cần structured output (Test và Paragraph cần JSON, Q&A có thể wrap trong JSON)
- ✅ Consistent API
- ✅ Có thể validate data
- ✅ Dễ maintain và mở rộng
- ✅ Backend code đơn giản hơn (chỉ dùng 1 method: `run_workflow`)

**Nếu muốn tối ưu Q&A:**
- Có thể dùng Chat App riêng cho Q&A
- Nhưng phải maintain 2 loại apps và 2 API methods

---

## 📝 Ví Dụ: Workflow App Cho Tất Cả

### Workflow Structure:

```
START Node
  ├─ Input Variables:
  │   ├─ action_type (String, Required)
  │   ├─ study_context (String, Required)
  │   ├─ total_questions (Number, Optional)
  │   ├─ question_types (Array, Optional)
  │   ├─ time_limit (Number, Optional)
  │   ├─ style (String, Optional)
  │   └─ query (String, Optional)
  ↓
IF/ELSE Node
  ├─ IF action_type == "generate_test"
  │   → LLM Node "Generate Test"
  │   → Code Node "Validate Test"
  │   → END Node
  ├─ ELIF action_type == "generate_paragraph"
  │   → LLM Node "Generate Paragraph"
  │   → Code Node "Validate Paragraph"
  │   → END Node
  └─ ELSE (answer_question)
      → LLM Node "Answer Question"
      → END Node
```

### Backend Code:

```python
# Tất cả đều dùng run_workflow
result = await dify_service.run_workflow(
    inputs={
        "action_type": "generate_test",  # hoặc "generate_paragraph", "answer_question"
        "study_context": study_context,
        "total_questions": 10,  # chỉ cho generate_test
        "question_types": ["MULTIPLE_CHOICE"],  # chỉ cho generate_test
        "time_limit": 15,  # chỉ cho generate_test
        "style": "academic",  # chỉ cho generate_paragraph
        "query": "Câu hỏi?",  # chỉ cho answer_question
    },
    user=str(user_id),
    response_mode="blocking",
    app_id=settings.DIFY_WORKFLOW_UNIFIED_APP_ID,
)

# Parse response (consistent cho tất cả)
outputs = result.get("outputs") or result.get("data", {}).get("outputs", {})
result_data = outputs.get("result", {})
action_type = result_data.get("action_type")
data = result_data.get("data", {})

if action_type == "generate_test":
    test_data = data.get("test_data")
elif action_type == "generate_paragraph":
    paragraph_data = data.get("paragraph_data")
else:  # answer_question
    answer = data.get("answer")
```

---

## ✅ Tóm Tắt

**Workflow App CÓ THỂ làm được tất cả 3 tác vụ:**
- ✅ Generate Test - Rất phù hợp
- ✅ Generate Paragraph - Rất phù hợp  
- ✅ Answer Question - Làm được (Chat App tốt hơn nhưng không bắt buộc)

**Khuyến nghị: Dùng Workflow App cho tất cả** để:
- Consistent API
- Structured output
- Dễ maintain
- Có thể validate data

