# HƯỚNG DẪN SETUP DIFY WORKFLOWS - CHI TIẾT TỪNG BƯỚC

File này hướng dẫn chi tiết cách setup Dify workflows từ đầu đến cuối, bao gồm:
- Start workflow như nào
- Nhận gì từ Backend
- Rẽ nhánh logic
- Gọi LLM như nào
- Set system prompt
- Trả về Backend như nào

---

## 📋 MỤC LỤC

1. [Chuẩn bị](#chuẩn-bị)
2. [Workflow Tổng Hợp: Generate Test/Paragraph/Q&A (Recommended)](#workflow-tổng-hợp)
3. [Workflow Riêng: Generate Test (Alternative)](#workflow-riêng-generate-test)
4. [Workflow Riêng: Generate Paragraph (Alternative)](#workflow-riêng-generate-paragraph)
5. [Chat App: Q&A (Alternative)](#chat-app-qa-alternative)
6. [Test và Verify](#test-và-verify)

---

## 🔧 CHUẨN BỊ

### Bước 1: Đăng nhập Dify Dashboard

1. Truy cập Dify instance của bạn (VD: `https://your-dify-instance.com`)
2. Đăng nhập với tài khoản admin
3. Bạn sẽ thấy dashboard

### Bước 2: Tạo API Key

1. Click **Settings** (⚙️) ở góc dưới bên trái
2. Chọn **API Keys**
3. Click **Create API Key**
4. Đặt tên: `Aikari Backend API Key`
5. **Copy API key ngay** (sẽ không hiển thị lại)
6. Lưu vào file `.env`:
   ```env
   DIFY_API_KEY=app-xxxxxxxxxxxxx
   DIFY_BASE_URL=https://your-dify-instance.com/v1
   ```

### Bước 3: Cấu hình Backend (Sau khi tạo workflow)

**Sau khi tạo workflow tổng hợp, bạn cần lấy Workflow App ID:**

1. Vào **Applications** → Chọn workflow `ai_generation_workflow`
2. Click **Settings** (⚙️) hoặc **API** tab
3. Copy **App ID** (hoặc **Workflow ID**)
4. Thêm vào file `.env`:
   ```env
   # Dùng workflow tổng hợp (RECOMMENDED)
   DIFY_WORKFLOW_UNIFIED_APP_ID=workflow-xxxxxxxxxxxxx
   
   # Hoặc dùng workflow riêng (nếu không dùng unified)
   # DIFY_WORKFLOW_TEST_APP_ID=workflow-test-xxxxx
   # DIFY_WORKFLOW_PARAGRAPH_APP_ID=workflow-paragraph-xxxxx
   ```

**Lưu ý:**
- Nếu dùng **workflow tổng hợp** (recommended): Chỉ cần set `DIFY_WORKFLOW_UNIFIED_APP_ID`
- Nếu dùng **workflow riêng**: Set `DIFY_WORKFLOW_TEST_APP_ID` và `DIFY_WORKFLOW_PARAGRAPH_APP_ID`
- Backend sẽ tự động detect và dùng workflow phù hợp

---

## 🎯 WORKFLOW TỔNG HỢP: GENERATE TEST/PARAGRAPH/Q&A (RECOMMENDED)

### Tổng quan Flow

```
Backend → Dify Workflow
  ↓
START Node (nhận inputs + action_type)
  ↓
IF/ELSE Node (phân nhánh theo action_type)
  ├─ IF action_type == "generate_test" → LLM Node Test
  ├─ ELIF action_type == "generate_paragraph" → LLM Node Paragraph
  └─ ELSE → LLM Node Q&A
  ↓
Code Node (validate JSON) - Optional
  ↓
END Node (trả về output tương ứng)
  ↓
Backend nhận response
```

**Lợi ích:**
- ✅ Chỉ cần 1 workflow thay vì 3
- ✅ Dễ quản lý và maintain
- ✅ Có thể mở rộng thêm actions sau này

---

### Bước 1: Tạo Workflow

1. **Applications** → **Create App** → **Workflow**
2. **Name:** `ai_generation_workflow` (hoặc `unified_generation_workflow`)
3. Click **Create**

---

### Bước 2: Thêm Input Variables (START Node)

**Input Variables:**

| Variable Name | Type | Required | Description | Example |
|--------------|------|----------|-------------|---------|
| `action_type` | String | ✅ | Loại action: "generate_test", "generate_paragraph", "answer_question" | `"generate_test"` |
| `study_context` | String | ✅ | Nội dung học tập | `"StudySet: ...\nTerms: ..."` |
| `total_questions` | Number | ❌ | Số câu hỏi (chỉ cho generate_test) | `10` |
| `question_types` | Array | ❌ | Loại câu hỏi (chỉ cho generate_test) | `["MULTIPLE_CHOICE"]` |
| `time_limit` | Number | ❌ | Time limit phút (chỉ cho generate_test) | `15` |
| `style` | String | ❌ | Style paragraph (chỉ cho generate_paragraph) | `"academic"` |
| `query` | String | ❌ | Câu hỏi của user (chỉ cho answer_question) | `"Quá trình quang hợp là gì?"` |

**Thêm từng variable:**

1. **action_type:**
   - Name: `action_type`
   - Type: `String`
   - Required: ✅
   - Description: `Loại action: generate_test, generate_paragraph, answer_question`

2. **study_context:**
   - Name: `study_context`
   - Type: `String`
   - Required: ✅
   - Description: `Nội dung học tập từ studyset`

3. **total_questions:**
   - Name: `total_questions`
   - Type: `Number`
   - Required: ❌
   - Default: `10`

4. **question_types:**
   - Name: `question_types`
   - Type: `Array`
   - Required: ❌
   - Default: `["MULTIPLE_CHOICE"]`

5. **time_limit:**
   - Name: `time_limit`
   - Type: `Number`
   - Required: ❌

6. **style:**
   - Name: `style`
   - Type: `String`
   - Required: ❌
   - Default: `"academic"`

7. **query:**
   - Name: `query`
   - Type: `String`
   - Required: ❌
   - Description: `Câu hỏi của user (cho answer_question)`

---

### Bước 3: Tạo IF/ELSE Node

**IF/ELSE Node để phân nhánh theo action_type.**

1. **Thêm IF/ELSE Node:**
   - Click **+ Node** → Chọn **IF/ELSE**
   - Đặt tên: `Route by Action Type`

2. **Kết nối START → IF/ELSE:**
   - Kéo từ **START** → **IF/ELSE**

3. **Cấu hình Conditions:**

   **Condition 1: Generate Test**
   - **Condition:** `{{action_type}} == "generate_test"`
   - **Label:** `Generate Test`

   **Condition 2: Generate Paragraph**
   - **Condition:** `{{action_type}} == "generate_paragraph"`
   - **Label:** `Generate Paragraph`

   **Condition 3: Answer Question (ELSE)**
   - **Condition:** `ELSE` (hoặc `{{action_type}} == "answer_question"`)
   - **Label:** `Answer Question`

---

### Bước 4: Tạo LLM Node cho Generate Test

1. **Thêm LLM Node:**
   - Click **+ Node** → Chọn **LLM**
   - Đặt tên: `Generate Test Questions`

2. **Kết nối:**
   - Kéo từ **IF/ELSE** (nhánh "Generate Test") → **LLM Node**

3. **Cấu hình Model:**
   - **Model:** GPT-4 hoặc Claude
   - **Temperature:** `0.7`
   - **Max Tokens:** `3000`

4. **⚠️ QUAN TRỌNG: Cấu hình Input Variables cho LLM Node**
   
   **LLM Node PHẢI có input variables được map từ START node, nếu không sẽ báo lỗi "contents are required"**
   
   **Các bước:**
   1. **Click vào LLM Node** → Tab **Variables** hoặc **Input Variables**
   2. **Thêm các Input Variables:**
      
      - **Input Variable 1:**
        - **Name:** `study_context`
        - **Type:** `String`
        - **Value:** `{{study_context}}` (chọn từ dropdown: START → study_context)
      
      - **Input Variable 2:**
        - **Name:** `total_questions`
        - **Type:** `Number`
        - **Value:** `{{total_questions}}` (chọn từ dropdown: START → total_questions)
      
      - **Input Variable 3:**
        - **Name:** `question_types`
        - **Type:** `Array`
        - **Value:** `{{question_types}}` (chọn từ dropdown: START → question_types)
      
      - **Input Variable 4:**
        - **Name:** `time_limit`
        - **Type:** `Number`
        - **Value:** `{{time_limit}}` (chọn từ dropdown: START → time_limit)
   
   **⚠️ Lưu ý:**
   - Tên input variables phải khớp với tên dùng trong System Prompt
   - Nếu không map input variables, LLM Node sẽ không nhận được data và báo lỗi "contents are required"
   - Có thể thêm input variables sau khi tạo System Prompt

5. **Cấu hình Prompt:**

   **⚠️ QUAN TRỌNG:** LLM Node có 2 loại prompt: **System Prompt** và **User Prompt**
   
   **System Prompt (Bắt buộc):**
   - Định nghĩa role và nhiệm vụ của AI
   - Hướng dẫn cách xử lý và format output
   - Paste vào tab **"System Prompt"** hoặc **"Prompt"** → **"System"**
   
   ```
   Bạn là giáo viên chuyên tạo bài test từ nội dung học tập.

   ## Nhiệm vụ:
   Tạo câu hỏi từ nội dung học tập được cung cấp.

   ## Yêu cầu:
   - Mỗi câu hỏi PHẢI dựa trên một term cụ thể trong study_context
   - Đáp án đúng phải chính xác 100%
   - Options phải hợp lý và có tính phân biệt
   - Explanation rõ ràng, dễ hiểu

   ## Format output (QUAN TRỌNG - phải là JSON hợp lệ):
   {
     "questions": [
       {
         "term_text": "Tên term (PHẢI khớp chính xác với term trong study_context)",
         "question_text": "Câu hỏi đầy đủ...",
         "question_type": "MULTIPLE_CHOICE",
         "correct_answer": "Đáp án đúng (chỉ text, không có A/B/C/D)",
         "options": [
           "A. Option 1",
           "B. Option 2",
           "C. Option 3",
           "D. Option 4"
         ],
         "explanation": "Giải thích tại sao đáp án đúng"
       }
     ],
     "total_questions": {{total_questions}},
     "time_limit": {{time_limit}}
   }

   ## Lưu ý QUAN TRỌNG:
   1. **term_text** PHẢI khớp chính xác với term trong study_context
   2. Mỗi question PHẢI dựa trên một term cụ thể
   3. Nếu question_type là TRUE_FALSE: options = ["True", "False"]
   4. Nếu question_type là ESSAY: options = null
   5. Output PHẢI là JSON hợp lệ, không có text thừa
   ```
   
   **User Prompt (Khuyến nghị - để truyền context và yêu cầu cụ thể):**
   - Chứa nội dung học tập và yêu cầu cụ thể
   - Paste vào tab **"User Prompt"** hoặc **"Prompt"** → **"User"**
   - Có thể để trống nếu đã có trong System Prompt
   
   ```
   ## Nội dung học tập:
   {{#study_context}}{{study_context}}{{/study_context}}

   ## Yêu cầu cụ thể:
   - Số câu hỏi: {{total_questions}}
   - Loại câu hỏi: {{question_types}}
   - Giới hạn thời gian: {{time_limit}} phút (nếu có)

   Hãy tạo bài test theo yêu cầu trên.
   ```
   
   **Hoặc có thể gộp tất cả vào System Prompt:**
   - Nếu không có tab User Prompt riêng, paste tất cả vào System Prompt
   - Như ví dụ ban đầu (đã có study_context và các variables trong System Prompt)

---

### Bước 5: Tạo LLM Node cho Generate Paragraph

1. **Thêm LLM Node:**
   - Click **+ Node** → Chọn **LLM**
   - Đặt tên: `Generate Paragraph`

2. **Kết nối:**
   - Kéo từ **IF/ELSE** (nhánh "Generate Paragraph") → **LLM Node**

3. **Cấu hình Model:**
   - **Model:** GPT-4 hoặc Claude
   - **Temperature:** `0.7`
   - **Max Tokens:** `1000`

4. **System Prompt:**
   ```
   Bạn là giáo viên viết đoạn văn minh họa khái niệm học tập.

   ## Nhiệm vụ:
   Viết một đoạn văn 200-300 từ giải thích các khái niệm trong nội dung học tập.

   ## Nội dung học tập:
   {{#study_context}}{{study_context}}{{/study_context}}

   ## Yêu cầu:
   - Độ dài: 200-300 từ
   - Style: {{style}} (formal, academic, clear, dễ hiểu)
   - Giải thích các khái niệm một cách logic và dễ hiểu
   - Sử dụng ví dụ cụ thể từ study_context
   - Kết nối các khái niệm với nhau
   - Paragraph phải mạch lạc, có cấu trúc
   - Không lặp lại thông tin

   ## Format output (QUAN TRỌNG - phải là JSON hợp lệ):
   {
     "paragraph": "Đoạn văn đầy đủ 200-300 từ...",
     "key_concepts": ["concept1", "concept2", "concept3"],
     "word_count": 250
   }

   ## Lưu ý:
   - Output PHẢI là JSON hợp lệ, không có text thừa
   - Không được có markdown code blocks
   - Paragraph phải đầy đủ, không bị cắt
   ```

---

### Bước 6: Tạo LLM Node cho Answer Question

1. **Thêm LLM Node:**
   - Click **+ Node** → Chọn **LLM**
   - Đặt tên: `Answer Question`

2. **Kết nối:**
   - Kéo từ **IF/ELSE** (nhánh "Answer Question") → **LLM Node**

3. **Cấu hình Model:**
   - **Model:** GPT-4 hoặc Claude
   - **Temperature:** `0.7`
   - **Max Tokens:** `1000`

4. **System Prompt:**
   ```
   Bạn là trợ lý học tập AI giúp sinh viên học bài từ studyset.

   ## Nhiệm vụ:
   Trả lời câu hỏi học thuật dựa trên nội dung học tập được cung cấp.

   ## Context học tập:
   {{#study_context}}{{study_context}}{{/study_context}}

   ## Quy tắc:
   - Chỉ trả lời về nội dung học thuật trong study_context
   - Từ chối câu hỏi không liên quan đến học tập
   - Format câu trả lời rõ ràng, dễ hiểu
   - Sử dụng ví dụ cụ thể từ study_context
   - Giải thích một cách logic và dễ hiểu

   ## Câu hỏi của user:
   {{query}}

   ## Lưu ý:
   - Nếu câu hỏi không liên quan đến study_context, hãy nói rõ
   - Luôn tham khảo study_context khi trả lời
   - Câu trả lời phải chính xác và dựa trên facts trong study_context
   ```

---

### Bước 7: Tạo Code Node (Optional - Validate JSON)

**Code Node để validate output từ các LLM nodes.**

**⚠️ QUAN TRỌNG:** Vì có 2 LLM nodes (Test và Paragraph) kết nối đến cùng 1 Code node, bạn có 2 cách:

#### Cách 1: Tạo 2 Code Nodes riêng (Recommended - Dễ hơn)

**7a. Code Node cho Test:**

1. **Thêm Code Node:**
   - Click **+ Node** → Chọn **Code**
   - Đặt tên: `Validate Test Output`

2. **Kết nối:**
   - Kéo từ **LLM Node "Generate Test Questions"** → **Code Node "Validate Test Output"**

3. **Cấu hình Input Variables trong Code Node:**
   - Click vào Code Node → Tab **Variables**
   - **Input Variable 1:**
     - **Name:** `llm_output`
     - **Type:** `String`
     - **Value:** `{{Generate Test Questions.text}}` hoặc `{{Generate Test Questions.output}}`
     - ⚠️ **Lưu ý:** Tên node phải khớp chính xác với tên bạn đặt cho LLM node (ví dụ: "Generate Test Questions")
   
   - **Input Variable 2:**
     - **Name:** `action_type`
     - **Type:** `String`
     - **Value:** `{{action_type}}` (từ START node)
   
   - **Input Variable 3:**
     - **Name:** `study_context`
     - **Type:** `String`
     - **Value:** `{{study_context}}` (từ START node)

4. **Code (Python):**
   ```python
   import json
   import re

   def main(llm_output: str, action_type: str, study_context: str) -> dict:
       """
       Parse và validate JSON từ LLM output cho Test
       """
       try:
           # Parse JSON
           text = llm_output.strip()
           
           # Loại bỏ markdown code blocks nếu có
           if text.startswith("```"):
               match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
               if match:
                   text = match.group(1)
               else:
                   text = re.sub(r'```json\s*', '', text)
                   text = re.sub(r'```\s*$', '', text)
           
           data = json.loads(text)
           
           # Validate test structure
           if "questions" not in data:
               raise ValueError("Missing 'questions' field")
           
           if not isinstance(data["questions"], list):
               raise ValueError("'questions' must be a list")
           
           if len(data["questions"]) == 0:
               raise ValueError("'questions' list is empty")
           
           # Validate each question
           for i, q in enumerate(data["questions"]):
               required_fields = ["term_text", "question_text", "question_type", "correct_answer"]
               for field in required_fields:
                   if field not in q:
                       raise ValueError(f"Question {i} missing field: {field}")
           
           return {
               "output": data,
               "valid": True,
               "error": None
           }
           
       except Exception as e:
           return {
               "output": None,
               "valid": False,
               "error": str(e)
           }
   ```

**7b. Code Node cho Paragraph:**

1. **Thêm Code Node:**
   - Click **+ Node** → Chọn **Code**
   - Đặt tên: `Validate Paragraph Output`

2. **Kết nối:**
   - Kéo từ **LLM Node "Generate Paragraph"** → **Code Node "Validate Paragraph Output"`

3. **Cấu hình Input Variables:**
   - **Input Variable 1:**
     - **Name:** `llm_output`
     - **Type:** `String`
     - **Value:** `{{Generate Paragraph.text}}` hoặc `{{Generate Paragraph.output}}`
   
   - **Input Variable 2:**
     - **Name:** `action_type`
     - **Type:** `String`
     - **Value:** `{{action_type}}`
   
   - **Input Variable 3:**
     - **Name:** `study_context`
     - **Type:** `String`
     - **Value:** `{{study_context}}`

4. **Code (Python):**
   ```python
   import json
   import re

   def main(llm_output: str, action_type: str, study_context: str) -> dict:
       """
       Parse và validate JSON từ LLM output cho Paragraph
       """
       try:
           # Parse JSON
           text = llm_output.strip()
           
           # Loại bỏ markdown code blocks nếu có
           if text.startswith("```"):
               match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
               if match:
                   text = match.group(1)
               else:
                   text = re.sub(r'```json\s*', '', text)
                   text = re.sub(r'```\s*$', '', text)
           
           data = json.loads(text)
           
           # Validate paragraph structure
           if "paragraph" not in data:
               raise ValueError("Missing 'paragraph' field")
           
           if len(data["paragraph"]) < 100:
               raise ValueError("Paragraph too short (min 100 chars)")
           
           return {
               "output": data,
               "valid": True,
               "error": None
           }
           
       except Exception as e:
           return {
               "output": None,
               "valid": False,
               "error": str(e)
           }
   ```

#### Cách 2: Dùng 1 Code Node chung (Advanced)

Nếu muốn dùng 1 Code Node cho cả 2 LLM nodes:

1. **Kết nối cả 2 LLM nodes đến cùng 1 Code Node**
2. **Trong Code Node, check xem input nào có giá trị:**
   ```python
   def main(
       generate_test_questions_output: str = None,
       generate_paragraph_output: str = None,
       action_type: str = None,
       study_context: str = None
   ) -> dict:
       # Determine which output to use
       llm_output = generate_test_questions_output or generate_paragraph_output
       # ... rest of code
   ```
3. **Input Variables:**
   - `generate_test_questions_output`: `{{Generate Test Questions.text}}`
   - `generate_paragraph_output`: `{{Generate Paragraph.text}}`
   - `action_type`: `{{action_type}}`
   - `study_context`: `{{study_context}}`

**⚠️ Lưu ý:** Cách 1 (2 Code Nodes riêng) dễ hơn và rõ ràng hơn. Khuyến nghị dùng Cách 1.

**📝 Lưu ý về LLM Node Q&A:**
- LLM Node Q&A có thể bỏ qua Code Node vì output là text (không cần validate JSON)
- Kết nối trực tiếp từ **LLM Node "Answer Question"** → **END Node**

---

### Bước 8: Tạo END Node

1. **Thêm End Node:**
   - Kéo **End** node vào canvas

2. **Kết nối:**
   - Từ **Code Node "Validate Test Output"** → **End Node** (cho test)
   - Từ **Code Node "Validate Paragraph Output"** → **End Node** (cho paragraph)
   - Từ **LLM Node "Answer Question"** → **End Node** (cho Q&A - không qua Code Node)

3. **Cấu hình Output:**

   **Cách 1: Dùng Template trong OUTPUT VARIABLE**
   
   ⚠️ **QUAN TRỌNG:** END Node chỉ có trường **Value** để nhập template, không có dropdown chọn Type.
   
   **Các bước:**
   
   1. **Click vào END Node** → Tab **SETTINGS**
   2. **Tìm phần "OUTPUT VARIABLE"** → Click **"Add Output Variable"** hoặc **"+"**
   3. **Cấu hình Output Variable:**
      - **Variable Name:** `result` (hoặc tên khác bạn muốn)
      - **Value:** ⚠️ **Đây là nơi bạn nhập template** - Paste template code vào đây (Dify sẽ tự động detect type từ nội dung):
   
   **Template để paste vào trường Value:**
   ```json
   {
     "action_type": "{{action_type}}",
     "data": {
       {{#if action_type == "generate_test"}}
       "test_data": {{Validate Test Output.output.output}}
       {{else if action_type == "generate_paragraph"}}
       "paragraph_data": {{Validate Paragraph Output.output.output}}
       {{else}}
       "answer": "{{Answer Question.text}}"
       {{/if}}
     }
   }
   ```
   
   **Lưu ý:**
   - Paste toàn bộ template vào trường **Value** (không phải code editor riêng)
   - Dify sẽ tự động parse template syntax `{{...}}` và `{{#if...}}`
   - Nếu template không hoạt động, thử dùng Cách 2 (Code Node format output)
   
   **⚠️ Lưu ý về Output Path:**
   - Code Node trả về: `{"output": {...}, "valid": true, "error": null}`
   - Vậy để lấy data thực tế, dùng: `{{Validate Test Output.output.output}}`
   - Hoặc nếu Code Node trả về trực tiếp data, dùng: `{{Validate Test Output.output}}`
   - LLM Node trả về text, dùng: `{{Answer Question.text}}` hoặc `{{Answer Question.output}}`
   
   **💡 Tip:** Nếu không chắc output path, bạn có thể:
   1. Test workflow và xem response structure
   2. Hoặc dùng Code Node format output (Cách 2 bên dưới)
   
   **Cách 2: Dùng Code Node để format output (Khuyến nghị - Dễ hơn và linh hoạt hơn)**
   
   ⚠️ **Tại sao dùng Cách 2?**
   - Template syntax trong END Node có thể phức tạp và khó debug
   - Code Node cho phép logic phức tạp hơn và dễ test
   - Dễ maintain và mở rộng sau này
   
   **Các bước chi tiết:**
   
   **Bước 2.1: Thêm Code Node "Format Output"**
   
   1. **Thêm Code Node:**
      - Click **+ Node** → Chọn **Code**
      - Đặt tên: `Format Output` (hoặc tên khác bạn muốn)
   
   2. **Kết nối các nodes đến Code Node:**
      - Kéo từ **Code Node "Validate Test Output"** → **Code Node "Format Output"**
      - Kéo từ **Code Node "Validate Paragraph Output"** → **Code Node "Format Output"**
      - Kéo từ **LLM Node "Answer Question"** → **Code Node "Format Output"**
      - ⚠️ **Lưu ý:** Cả 3 nodes đều kết nối đến cùng 1 Code Node "Format Output"
   
   **Bước 2.2: Cấu hình Input Variables trong Code Node "Format Output"**
   
   1. **Click vào Code Node "Format Output"** → Tab **Variables** (hoặc **Input Variables**)
   
   2. **Thêm Input Variable 1:**
      - **Name:** `action_type` ⚠️ Phải khớp với parameter trong function
      - **Type:** `String`
      - **Value:** `{{action_type}}` (từ START node)
   
   3. **Thêm Input Variable 2:**
      - **Name:** `test_output` ⚠️ Phải khớp với parameter trong function
      - **Type:** `Object` hoặc `String` (tùy Code Node trả về gì)
      - **Value:** `{{CODE.result}}` hoặc `{{validate test output.result}}`
      - ⚠️ **QUAN TRỌNG:** 
        - Tên node phải khớp chính xác với tên Code Node "Validate Test Output" của bạn
        - Trong dropdown, chọn từ **CODE** node → `result` variable
        - Nếu Code Node trả về JSON string, bạn cần parse trong Python code
        - Nếu Code Node trả về Object, dùng trực tiếp
      - **Cách tìm đúng:**
        1. Click vào dropdown của `test_output`
        2. Tìm node **CODE** (hoặc tên bạn đặt cho Code Node validate test)
        3. Chọn `result` (hoặc output variable name bạn đặt trong Code Node đó)
   
   4. **Thêm Input Variable 3:**
      - **Name:** `paragraph_output` ⚠️ Phải khớp với parameter trong function
      - **Type:** `Object` hoặc `String` (tùy Code Node trả về gì)
      - **Value:** `{{CODE 2.result}}` hoặc `{{validate paragraph.result}}`
      - ⚠️ **QUAN TRỌNG:**
        - Tên node phải khớp chính xác với tên Code Node "Validate Paragraph Output" của bạn
        - Trong dropdown, chọn từ **CODE 2** node → `result` variable
        - Tương tự như test_output
      - **Cách tìm đúng:**
        1. Click vào dropdown của `paragraph_output`
        2. Tìm node **CODE 2** (hoặc tên bạn đặt cho Code Node validate paragraph)
        3. Chọn `result` (hoặc output variable name bạn đặt trong Code Node đó)
   
   5. **Thêm Input Variable 4:**
      - **Name:** `answer_output` ⚠️ Phải khớp với parameter trong function
      - **Type:** `String`
      - **Value:** `{{QA.text}}` hoặc `{{answer question.text}}`
      - ⚠️ **QUAN TRỌNG:**
        - Tên node phải khớp chính xác với tên LLM Node "Answer Question" của bạn
        - Trong dropdown, chọn từ **QA** node (hoặc tên bạn đặt) → `text` variable
        - LLM Node thường có output: `text`, `reasoning_content`, `usage`
        - Chọn `text` để lấy câu trả lời
      - **Cách tìm đúng:**
        1. Click vào dropdown của `answer_output`
        2. Tìm node **QA** (hoặc "Answer Question" - tên bạn đặt)
        3. Chọn `text` variable
   
   **Bước 2.3: Viết Code trong Code Node "Format Output"**
   
   1. **Click vào Code Node "Format Output"** → Tab **Code** (hoặc **Python**)
   
   2. **Paste code sau:**
   ```python
   import json
   
   def main(action_type: str, test_output: dict | str = None, paragraph_output: dict | str = None, answer_output: str = None) -> dict:
       """
       Format output theo action_type để trả về cho Backend
       
       Args:
           action_type: "generate_test" | "generate_paragraph" | "answer_question"
           test_output: Output từ Code Node "Validate Test Output" (dict hoặc JSON string)
           paragraph_output: Output từ Code Node "Validate Paragraph Output" (dict hoặc JSON string)
           answer_output: Output từ LLM Node "Answer Question" (string)
       
       Returns:
           dict: Formatted output với structure:
           {
               "action_type": "...",
               "data": {
                   "test_data": {...} hoặc
                   "paragraph_data": {...} hoặc
                   "answer": "..."
               }
           }
       """
       # Parse test_output nếu là string
       if action_type == "generate_test":
           if isinstance(test_output, str):
               try:
                   test_output = json.loads(test_output)
               except json.JSONDecodeError:
                   # Nếu là string không phải JSON, có thể là output từ Code Node
                   # Code Node có thể trả về: {"output": {...}, "valid": true}
                   # Hoặc chỉ là JSON string của data
                   test_output = json.loads(test_output) if test_output else None
           
           # Nếu test_output là dict có key "output", lấy value của "output"
           if isinstance(test_output, dict) and "output" in test_output:
               test_output = test_output["output"]
           
           return {
               "action_type": action_type,
               "data": {
                   "test_data": test_output
               }
           }
       
       elif action_type == "generate_paragraph":
           # Parse paragraph_output nếu là string
           if isinstance(paragraph_output, str):
               try:
                   paragraph_output = json.loads(paragraph_output)
               except json.JSONDecodeError:
                   paragraph_output = json.loads(paragraph_output) if paragraph_output else None
           
           # Nếu paragraph_output là dict có key "output", lấy value của "output"
           if isinstance(paragraph_output, dict) and "output" in paragraph_output:
               paragraph_output = paragraph_output["output"]
           
           return {
               "action_type": action_type,
               "data": {
                   "paragraph_data": paragraph_output
               }
           }
       
       else:  # answer_question
           return {
               "action_type": action_type,
               "data": {
                   "answer": answer_output or ""
               }
           }
   ```
   
   **Bước 2.4: Cấu hình Output Variable trong Code Node**
   
   1. **Trong Code Node "Format Output"**, tìm phần **Output Variables**
   2. **Thêm Output Variable:**
      - **Name:** `output` (hoặc tên khác, nhưng phải khớp với return của function)
      - **Type:** `Object`
      - **Value:** Tự động từ return của function `main()`
   
   **Bước 2.5: Kết nối Code Node "Format Output" → END Node**
   
   1. **Kéo từ Code Node "Format Output"** → **END Node**
   2. ⚠️ **Lưu ý:** Chỉ kết nối Code Node "Format Output" đến END Node, không kết nối trực tiếp các nodes khác
   
   **Bước 2.6: Cấu hình END Node**
   
   1. **Click vào END Node** → Tab **SETTINGS**
   2. **Tìm phần "OUTPUT VARIABLE"** → Click **"Add Output Variable"** hoặc **"+"**
   3. **Cấu hình:**
      - **Variable Name:** `result` (hoặc tên khác bạn muốn)
      - **Value:** `{{Format Output.output}}`
      - ⚠️ **Lưu ý:** 
        - Tên "Format Output" phải khớp chính xác với tên Code Node bạn đặt
        - `.output` là output variable name trong Code Node
        - Dify sẽ tự động detect type từ nội dung
   
   **Bước 2.7: Test và Verify**
   
   1. **Test workflow** với các action_type khác nhau
   2. **Kiểm tra output structure:**
      - `outputs.result.action_type` → phải có giá trị đúng
      - `outputs.result.data.test_data` → cho generate_test
      - `outputs.result.data.paragraph_data` → cho generate_paragraph
      - `outputs.result.data.answer` → cho answer_question
   
   **⚠️ Lưu ý quan trọng:**
   - Backend sẽ parse response như sau:
     ```python
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
   - Đảm bảo tên input variables khớp với parameter names trong function
   - Test từng nhánh (test, paragraph, Q&A) để đảm bảo output đúng

---

### Bước 9: Test Workflow

**Test Case 1: Generate Test**
```json
{
  "action_type": "generate_test",
  "study_context": "StudySet: Biology\n\nTerms:\n- Photosynthesis: ...",
  "total_questions": 2,
  "question_types": ["MULTIPLE_CHOICE"],
  "time_limit": 15
}
```

**Test Case 2: Generate Paragraph**
```json
{
  "action_type": "generate_paragraph",
  "study_context": "StudySet: Biology\n\nTerms:\n- Photosynthesis: ...",
  "style": "academic"
}
```

**Test Case 3: Answer Question**
```json
{
  "action_type": "answer_question",
  "study_context": "StudySet: Biology\n\nTerms:\n- Photosynthesis: ...",
  "query": "Quá trình quang hợp là gì?"
}
```

---

## 📝 BACKEND SẼ GỬI GÌ LÊN DIFY?

### Workflow Tổng Hợp (Unified Workflow)

**Generate Test:**
```json
{
  "action_type": "generate_test",
  "study_context": "StudySet: Biology\n\nTerms:\n- Photosynthesis: ...",
  "total_questions": 10,
  "question_types": ["MULTIPLE_CHOICE", "TRUE_FALSE"],
  "time_limit": 15
}
```

**Generate Paragraph:**
```json
{
  "action_type": "generate_paragraph",
  "study_context": "StudySet: Biology\n\nTerms:\n- Photosynthesis: ...",
  "style": "academic"
}
```

**Answer Question:**
```json
{
  "action_type": "answer_question",
  "study_context": "StudySet: Biology\n\nTerms:\n- Photosynthesis: ...",
  "query": "Quá trình quang hợp là gì?"
}
```

### Dify Trả Về Gì?

**Response Structure:**
```json
{
  "outputs": {
    "data": {
      "test_data": { ... },        // Cho generate_test
      "paragraph_data": { ... },   // Cho generate_paragraph
      "answer": "..."              // Cho answer_question
    }
  },
  "metadata": { ... }
}
```

**Backend sẽ parse:**
- `outputs.data.test_data` → Tạo Test và TestQuestions trong DB
- `outputs.data.paragraph_data` → Lưu vào AIGeneratedContents
- `outputs.data.answer` → Trả về cho user

---

## 🔵 WORKFLOW RIÊNG: GENERATE TEST (ALTERNATIVE)

### Tổng quan Flow

```
Backend → Dify Workflow
  ↓
START Node (nhận inputs)
  ↓
LLM Node (generate questions)
  ↓
Code Node (validate JSON) - Optional
  ↓
END Node (trả về test_data)
  ↓
Backend nhận response
```

---

### Bước 1: Tạo Workflow

1. **Vào Applications:**
   - Click **Applications** trong menu trái
   - Click **Create App**

2. **Chọn loại:**
   - Chọn **Workflow** (không phải Chat Application)
   - Click **Next**

3. **Đặt tên:**
   - **Name:** `generate_test_workflow`
   - **Description:** `Generate test questions from studyset content`
   - Click **Create**

---

### Bước 2: Thêm Input Variables (START Node)

**Input Variables là dữ liệu Backend sẽ gửi lên.**

1. **Mở Variables panel:**
   - Ở bên trái canvas, tìm tab **Variables** hoặc **Inputs**
   - Click vào đó

2. **Thêm từng variable:**

   **Variable 1: study_context**
   - Click **+ Add Variable** hoặc **Add Input**
   - **Variable Name:** `study_context`
   - **Type:** `String`
   - **Description:** `Nội dung học tập từ studyset (terms và definitions)`
   - **Required:** ✅ (check)
   - Click **Save**

   **Variable 2: total_questions**
   - **Variable Name:** `total_questions`
   - **Type:** `Number`
   - **Description:** `Số câu hỏi muốn tạo`
   - **Default Value:** `10`
   - **Required:** ✅
   - Click **Save**

   **Variable 3: question_types**
   - **Variable Name:** `question_types`
   - **Type:** `Array` hoặc `Select`
   - **Description:** `Loại câu hỏi: MULTIPLE_CHOICE, TRUE_FALSE, ESSAY`
   - **Default Value:** `["MULTIPLE_CHOICE"]` (nếu là Array)
   - **Required:** ✅
   - Click **Save**

   **Variable 4: time_limit**
   - **Variable Name:** `time_limit`
   - **Type:** `Number`
   - **Description:** `Giới hạn thời gian (phút)`
   - **Default Value:** (để trống - optional)
   - **Required:** ❌ (không check)
   - Click **Save**

3. **Kiểm tra lại:**
   - Bạn sẽ thấy 4 variables trong danh sách
   - Có thể edit/delete nếu sai

---

### Bước 3: Tạo LLM Node

**LLM Node sẽ gọi AI model để generate questions.**

1. **Thêm LLM Node:**
   - Ở canvas, tìm button **+ Node** hoặc kéo thả từ panel bên trái
   - Chọn **LLM** node
   - Node sẽ xuất hiện trên canvas

2. **Kết nối START → LLM:**
   - Kéo từ **START** node → **LLM** node
   - Đảm bảo có mũi tên kết nối

3. **Cấu hình Model:**
   - Click vào LLM node
   - Ở panel bên phải, tìm **Model**
   - Chọn model: **GPT-4**, **GPT-3.5**, hoặc **Claude** (tùy bạn có)
   - **Temperature:** `0.7` (để có output đa dạng nhưng vẫn chính xác)
   - **Max Tokens:** `3000` (đủ cho 10-20 câu hỏi)

4. **Viết System Prompt:**
   - Tìm textarea **System Prompt** hoặc **Prompt**
   - Paste prompt sau:

   ```
   Bạn là giáo viên chuyên tạo bài test từ nội dung học tập.

   ## Nhiệm vụ:
   Tạo {{total_questions}} câu hỏi từ nội dung học tập được cung cấp.

   ## Nội dung học tập:
   {{#study_context}}{{study_context}}{{/study_context}}

   ## Yêu cầu:
   - Loại câu hỏi: {{question_types}}
   - Giới hạn thời gian: {{time_limit}} phút (nếu có)
   - Mỗi câu hỏi PHẢI dựa trên một term cụ thể trong study_context
   - Đáp án đúng phải chính xác 100%
   - Options phải hợp lý và có tính phân biệt
   - Explanation rõ ràng, dễ hiểu

   ## Format output (QUAN TRỌNG - phải là JSON hợp lệ):
   {
     "questions": [
       {
         "term_text": "Tên term (PHẢI khớp chính xác với term trong study_context)",
         "question_text": "Câu hỏi đầy đủ...",
         "question_type": "MULTIPLE_CHOICE",
         "correct_answer": "Đáp án đúng (chỉ text, không có A/B/C/D)",
         "options": [
           "A. Option 1",
           "B. Option 2",
           "C. Option 3",
           "D. Option 4"
         ],
         "explanation": "Giải thích tại sao đáp án đúng"
       }
     ],
     "total_questions": {{total_questions}},
     "time_limit": {{time_limit}}
   }

   ## Lưu ý QUAN TRỌNG:
   1. **term_text** PHẢI khớp chính xác với term trong study_context (để backend map với term_id)
   2. Mỗi question PHẢI dựa trên một term cụ thể
   3. Nếu question_type là TRUE_FALSE: options = ["True", "False"]
   4. Nếu question_type là ESSAY: options = null, correct_answer = "Sample answer"
   5. Output PHẢI là JSON hợp lệ, không có text thừa
   6. Không được có markdown code blocks (```json) trong output
   ```

   **Giải thích:**
   - `{{study_context}}` - sẽ được thay bằng giá trị từ input variable
   - `{{total_questions}}` - tương tự
   - Prompt yêu cầu JSON output rõ ràng
   - Yêu cầu `term_text` khớp chính xác

5. **Đặt tên Node:**
   - Click vào node, đổi tên: `Generate Questions`

---

### Bước 4: Tạo Code Node (Optional - Validate JSON)

**Code Node để validate và format JSON output từ LLM.**

1. **Thêm Code Node:**
   - Click **+ Node** → Chọn **Code** hoặc **Python**
   - Đặt tên: `Validate JSON`

2. **Kết nối:**
   - Kéo từ **LLM Node** → **Code Node**

3. **Viết Code:**
   - Click vào Code Node
   - Chọn **Python**
   - Paste code:

   ```python
   import json
   import re

   def main(llm_output: str, study_context: str) -> dict:
       """
       Parse và validate JSON từ LLM output
       Map term_text với study_context để tìm term
       """
       try:
           # Parse JSON
           text = llm_output.strip()
           
           # Loại bỏ markdown code blocks nếu có
           if text.startswith("```"):
               match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
               if match:
                   text = match.group(1)
               else:
                   text = re.sub(r'```json\s*', '', text)
                   text = re.sub(r'```\s*$', '', text)
           
           data = json.loads(text)
           
           # Validate structure
           if "questions" not in data:
               raise ValueError("Missing 'questions' field")
           
           if not isinstance(data["questions"], list):
               raise ValueError("'questions' must be an array")
           
           # Extract terms từ study_context
           terms_map = {}
           lines = study_context.split("\n")
           for line in lines:
               if line.strip().startswith("- "):
                   parts = line.strip()[2:].split(":", 1)
                   if len(parts) >= 1:
                       term_text = parts[0].strip()
                       definition = parts[1].strip() if len(parts) > 1 else ""
                       terms_map[term_text.lower()] = {
                           "term_text": term_text,
                           "definition": definition
                       }
           
           # Validate và map từng question
           validated_questions = []
           for i, q in enumerate(data["questions"]):
               # Required fields
               required = ["question_text", "question_type", "correct_answer", "term_text"]
               for field in required:
                   if field not in q:
                       raise ValueError(f"Question {i+1} missing '{field}'")
               
               # Map term_text với study_context
               term_text = q.get("term_text", "").strip()
               term_lower = term_text.lower()
               
               if term_lower not in terms_map:
                   # Try fuzzy matching
                   found = False
                   for key, value in terms_map.items():
                       if term_lower in key or key in term_lower:
                           q["term_text"] = value["term_text"]
                           found = True
                           break
                   
                   if not found:
                       # Use first term as fallback
                       if terms_map:
                           first_term = list(terms_map.values())[0]
                           q["term_text"] = first_term["term_text"]
               
               # Validate question_type
               valid_types = ["MULTIPLE_CHOICE", "TRUE_FALSE", "ESSAY"]
               if q["question_type"] not in valid_types:
                   q["question_type"] = "MULTIPLE_CHOICE"
               
               # Validate options
               if q["question_type"] == "MULTIPLE_CHOICE":
                   if "options" not in q or not isinstance(q["options"], list):
                       raise ValueError(f"Question {i+1} (MULTIPLE_CHOICE) missing 'options' array")
                   if len(q["options"]) < 2:
                       raise ValueError(f"Question {i+1} needs at least 2 options")
               elif q["question_type"] == "TRUE_FALSE":
                   q["options"] = ["True", "False"]
               elif q["question_type"] == "ESSAY":
                   q["options"] = None
               
               # Add order
               q["order"] = i
               
               validated_questions.append(q)
           
           return {
               "output": {
                   "questions": validated_questions,
                   "total_questions": len(validated_questions),
                   "time_limit": data.get("time_limit")
               },
               "valid": True,
               "error": None
           }
           
       except json.JSONDecodeError as e:
           return {
               "output": None,
               "valid": False,
               "error": f"Invalid JSON: {str(e)}"
           }
       except Exception as e:
           return {
               "output": None,
               "valid": False,
               "error": str(e)
           }
   ```

4. **Cấu hình Input:**
   - Input variable 1: `llm_output` (từ LLM node output)
   - Input variable 2: `study_context` (từ START node)
   - Output variable: `validated_data`

---

### Bước 5: Tạo Output Node (END)

**Output Node để trả về kết quả cho Backend.**

1. **Thêm End Node:**
   - Tìm **End** node hoặc **Output** node
   - Kéo vào canvas

2. **Kết nối:**
   - Kéo từ **Code Node** (hoặc **LLM Node** nếu không dùng Code) → **End Node**

3. **Cấu hình Output:**
   - Click vào **End** node
   - Tìm **Output Variables** hoặc **Return**
   - Thêm output variable:
     - **Name:** `test_data`
     - **Type:** `Object` hoặc `JSON`
     - **Value:** `{{Validate JSON.output}}` (nếu dùng Code Node)
     - Hoặc `{{Generate Questions.output}}` (nếu không dùng Code Node)

---

### Bước 6: Test Workflow

1. **Mở Test Panel:**
   - Click button **Run** hoặc **Test** ở góc trên
   - Hoặc click **Preview** tab

2. **Nhập Test Inputs:**
   ```json
   {
     "study_context": "StudySet: Biology Basics\nDescription: Các khái niệm cơ bản\n\nTerms:\n- Photosynthesis: Quá trình thực vật chuyển đổi ánh sáng mặt trời thành năng lượng hóa học\n- Mitochondria: Bào quan sản xuất năng lượng trong tế bào",
     "total_questions": 2,
     "question_types": ["MULTIPLE_CHOICE"],
     "time_limit": 15
   }
   ```

3. **Chạy Test:**
   - Click **Run** hoặc **Execute**
   - Đợi vài giây (LLM cần thời gian generate)

4. **Kiểm tra Output:**
   - Xem output ở panel bên dưới hoặc bên phải
   - Phải có JSON với structure:
     ```json
     {
       "test_data": {
         "questions": [
           {
             "term_text": "Photosynthesis",
             "question_text": "...",
             "question_type": "MULTIPLE_CHOICE",
             "correct_answer": "...",
             "options": [...],
             "explanation": "...",
             "order": 0
           }
         ],
         "total_questions": 2,
         "time_limit": 15
       }
     }
     ```

5. **Nếu có lỗi:**
   - Kiểm tra prompt có yêu cầu JSON rõ ràng
   - Kiểm tra Code Node có parse đúng không
   - Thử lại với input khác

---

### Bước 7: Lưu và Lấy Workflow ID

1. **Lưu Workflow:**
   - Click **Save** (Ctrl+S hoặc Cmd+S)

2. **Publish (nếu cần):**
   - Click **Publish** hoặc **Deploy**

3. **Lấy Workflow ID:**
   - Vào **Settings** → **API**
   - Copy **Workflow ID** (VD: `workflow-abc123xyz`)
   - Lưu lại để dùng trong backend (nếu cần)

---

## 🟢 WORKFLOW 2: GENERATE PARAGRAPH

### Tổng quan Flow

```
Backend → Dify Workflow
  ↓
START Node (nhận inputs)
  ↓
LLM Node (generate paragraph)
  ↓
Code Node (validate) - Optional
  ↓
END Node (trả về paragraph_data)
  ↓
Backend nhận response
```

---

### Bước 1: Tạo Workflow

1. **Applications** → **Create App** → **Workflow**
2. **Name:** `generate_paragraph_workflow`
3. Click **Create**

---

### Bước 2: Input Variables

| Variable Name | Type | Required | Description |
|--------------|------|----------|-------------|
| `study_context` | String | ✅ | Nội dung học tập |
| `style` | String | ❌ | Style: "academic" (default) |

---

### Bước 3: LLM Node

**System Prompt:**
```
Bạn là giáo viên viết đoạn văn minh họa khái niệm học tập.

## Nhiệm vụ:
Viết một đoạn văn 200-300 từ giải thích các khái niệm trong nội dung học tập.

## Nội dung học tập:
{{#study_context}}{{study_context}}{{/study_context}}

## Yêu cầu:
- Độ dài: 200-300 từ
- Style: {{style}} (formal, academic, clear, dễ hiểu)
- Giải thích các khái niệm một cách logic và dễ hiểu
- Sử dụng ví dụ cụ thể từ study_context
- Kết nối các khái niệm với nhau
- Paragraph phải mạch lạc, có cấu trúc
- Không lặp lại thông tin

## Format output (QUAN TRỌNG - phải là JSON hợp lệ):
{
  "paragraph": "Đoạn văn đầy đủ 200-300 từ...",
  "key_concepts": ["concept1", "concept2", "concept3"],
  "word_count": 250
}

## Lưu ý:
- Output PHẢI là JSON hợp lệ, không có text thừa
- Không được có markdown code blocks
- Paragraph phải đầy đủ, không bị cắt
```

**Model Settings:**
- **Model:** GPT-4 hoặc Claude
- **Temperature:** `0.7`
- **Max Tokens:** `1000`

---

### Bước 4: Code Node (Optional)

```python
import json
import re

def main(llm_output: str) -> dict:
    try:
        text = llm_output.strip()
        if text.startswith("```"):
            match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
            if match:
                text = match.group(1)
        
        data = json.loads(text)
        
        if "paragraph" not in data:
            raise ValueError("Missing 'paragraph' field")
        
        if len(data["paragraph"]) < 100:
            raise ValueError("Paragraph too short (min 100 chars)")
        
        return {
            "output": data,
            "valid": True
        }
    except Exception as e:
        return {
            "output": None,
            "valid": False,
            "error": str(e)
        }
```

---

### Bước 5: Output Node

- **Output Variable:** `paragraph_data`
- **Type:** Object/JSON
- **Value:** `{{LLM Node.output}}` hoặc `{{Code Node.output}}`

---

### Bước 6: Test và Lấy Workflow ID

- Test với sample `study_context`
- Lấy Workflow ID từ Settings → API

---

## 💬 CHAT APP: Q&A

### Tổng quan Flow

```
Backend → Dify Chat App
  ↓
System Prompt (với study_context)
  ↓
User Query
  ↓
LLM (Chat Completion)
  ↓
Response (text answer)
  ↓
Backend nhận answer
```

---

### Bước 1: Tạo Chat Application

1. **Applications** → **Create App** → **Chat Application**
2. **Name:** `studyset_chatbot`
3. Click **Create**

---

### Bước 2: Cấu hình System Prompt

**Vào tab Prompt, paste:**

```
Bạn là trợ lý học tập AI giúp sinh viên học bài từ studyset.

## Nhiệm vụ của bạn:
Trả lời câu hỏi học thuật dựa trên nội dung học tập được cung cấp.

## Context học tập:
{study_context}

## Quy tắc:
- Chỉ trả lời về nội dung học thuật trong study_context
- Từ chối câu hỏi không liên quan đến học tập
- Format câu trả lời rõ ràng, dễ hiểu
- Sử dụng ví dụ cụ thể từ study_context
- Giải thích một cách logic và dễ hiểu

## Lưu ý:
- Nếu user hỏi về nội dung không có trong study_context, hãy nói rõ
- Luôn tham khảo study_context khi trả lời
- Câu trả lời phải chính xác và dựa trên facts trong study_context
```

**Giải thích:**
- `{study_context}` - sẽ được inject từ backend qua inputs
- Prompt yêu cầu chỉ trả lời về nội dung trong context

---

### Bước 3: Cấu hình Variables

1. **Vào tab Variables hoặc Context**
2. **Thêm variable:**
   - **Name:** `study_context`
   - **Type:** `String`
   - **Description:** `Nội dung học tập từ studyset`
   - **Default Value:** (để trống)

---

### Bước 4: Model Settings

1. **Vào tab Model**
2. **Chọn model:** GPT-4 hoặc Claude
3. **Temperature:** `0.7`
4. **Max Tokens:** `1000`

---

### Bước 5: Lấy App ID

1. **Settings** → **API**
2. Copy **App ID** (VD: `app-abc123`)
3. Lưu vào backend config (nếu cần)

---

### Bước 6: Test Chat App

1. **Vào tab Run**
2. **Nhập test message:** "Quá trình quang hợp là gì?"
3. **Xem response** → Nếu OK thì setup thành công

---

## 🔄 FLOW CHI TIẾT: BACKEND → DIFY → BACKEND

### Scenario 1: Generate Test

#### Bước 1: Backend gửi lên Dify

**Endpoint:** `POST {DIFY_BASE_URL}/workflows/run`

**Request:**
```json
{
  "inputs": {
    "study_context": "StudySet: Biology\n\nTerms:\n- Photosynthesis: ...",
    "total_questions": 10,
    "question_types": ["MULTIPLE_CHOICE"],
    "time_limit": 15
  },
  "user": "user-uuid",
  "response_mode": "blocking"
}
```

#### Bước 2: Dify Workflow xử lý

1. **START Node nhận inputs:**
   - `study_context` → String
   - `total_questions` → Number (10)
   - `question_types` → Array (["MULTIPLE_CHOICE"])
   - `time_limit` → Number (15)

2. **LLM Node:**
   - Nhận `study_context` từ START
   - Inject vào System Prompt: `{{study_context}}`
   - Inject `total_questions`, `question_types`, `time_limit` vào prompt
   - Gọi LLM (GPT-4/Claude) với prompt đầy đủ
   - LLM generate JSON với questions array

3. **Code Node (nếu có):**
   - Nhận output từ LLM Node
   - Parse JSON
   - Validate structure
   - Map `term_text` với `study_context`
   - Return validated data

4. **END Node:**
   - Nhận output từ Code Node (hoặc LLM Node)
   - Format thành `test_data` object
   - Trả về cho Backend

#### Bước 3: Dify trả về Backend

**Response:**
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
            "term_text": "Photosynthesis",
            "question_text": "...",
            "question_type": "MULTIPLE_CHOICE",
            "correct_answer": "...",
            "options": [...],
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

#### Bước 4: Backend xử lý

1. **Parse response:**
   ```python
   outputs = result.get("outputs") or result.get("data", {}).get("outputs", {})
   test_data = outputs.get("test_data")
   questions = test_data.get("questions", [])
   ```

2. **Map term_text → term_id:**
   ```python
   for q in questions:
       term_text = q.get("term_text")
       term_id = map_term_text_to_id(term_text, studyset_id, session)
   ```

3. **Tạo Test và TestQuestion records**
4. **Lưu vào AIGeneratedContents**
5. **Trả về cho Frontend**

---

### Scenario 2: Generate Paragraph

#### Bước 1: Backend gửi lên Dify

**Request:**
```json
{
  "inputs": {
    "study_context": "StudySet: Biology\n\nTerms:\n- ...",
    "style": "academic"
  },
  "user": "user-uuid",
  "response_mode": "blocking"
}
```

#### Bước 2: Dify Workflow xử lý

1. **START Node nhận inputs**
2. **LLM Node:**
   - Inject `study_context` vào System Prompt
   - Inject `style` vào prompt
   - Gọi LLM generate paragraph
   - LLM return JSON với paragraph text

3. **END Node:**
   - Format thành `paragraph_data` object
   - Trả về cho Backend

#### Bước 3: Dify trả về Backend

**Response:**
```json
{
  "data": {
    "outputs": {
      "paragraph_data": {
        "paragraph": "Quá trình quang hợp là...",
        "key_concepts": ["Photosynthesis", "Chloroplast"],
        "word_count": 250
      }
    }
  }
}
```

#### Bước 4: Backend xử lý

1. **Parse response**
2. **Lưu vào AIGeneratedContents**
3. **Trả về cho Frontend**

---

### Scenario 3: Answer Question

#### Bước 1: Backend gửi lên Dify

**Endpoint:** `POST {DIFY_BASE_URL}/chat-messages`

**Request:**
```json
{
  "inputs": {
    "study_context": "StudySet: Biology\n\nTerms:\n- ..."
  },
  "query": "Quá trình quang hợp diễn ra như thế nào?",
  "user": "user-uuid",
  "conversation_id": "conv-id",
  "response_mode": "blocking"
}
```

#### Bước 2: Dify Chat App xử lý

1. **System Prompt:**
   - Inject `study_context` vào System Prompt
   - System Prompt: "Bạn là trợ lý học tập... Context: {study_context}"

2. **User Query:**
   - Nhận `query` từ request
   - Format: "Quá trình quang hợp diễn ra như thế nào?"

3. **LLM Chat Completion:**
   - Gọi LLM với System Prompt + User Query
   - LLM generate answer dựa trên study_context
   - Return text answer

#### Bước 3: Dify trả về Backend

**Response:**
```json
{
  "id": "msg-xyz789",
  "answer": "Quá trình quang hợp diễn ra trong chloroplast...",
  "conversation_id": "conv-abc123"
}
```

#### Bước 4: Backend xử lý

1. **Lấy answer từ response**
2. **Trả về cho Frontend**

---

## 🎯 RẼ NHÁNH LOGIC (Nếu cần)

### Option: IF/ELSE Node để phân biệt Test/Paragraph

Nếu muốn dùng 1 workflow cho cả test và paragraph:

1. **Thêm Input Variable:**
   - `content_type`: String ("test" | "paragraph")

2. **Thêm IF/ELSE Node:**
   - Condition: `{{content_type}} == "test"`
   - IF: → LLM Node cho Test
   - ELSE: → LLM Node cho Paragraph

3. **Kết nối:**
   - START → IF/ELSE
   - IF/ELSE → LLM Node 1 (Test)
   - IF/ELSE → LLM Node 2 (Paragraph)
   - LLM Nodes → END

**Nhưng khuyến nghị:** Dùng 2 workflows riêng (đơn giản hơn)

---

## 📝 SYSTEM PROMPT TEMPLATES

### Template 1: Generate Test

```
Bạn là giáo viên chuyên tạo bài test từ nội dung học tập.

## Nhiệm vụ:
Tạo {{total_questions}} câu hỏi từ nội dung học tập được cung cấp.

## Nội dung học tập:
{{#study_context}}{{study_context}}{{/study_context}}

## Yêu cầu:
- Loại câu hỏi: {{question_types}}
- Giới hạn thời gian: {{time_limit}} phút (nếu có)
- Mỗi câu hỏi PHẢI dựa trên một term cụ thể
- Đáp án đúng phải chính xác 100%
- Options phải hợp lý và có tính phân biệt

## Format output (JSON):
{
  "questions": [
    {
      "term_text": "Tên term",
      "question_text": "...",
      "question_type": "MULTIPLE_CHOICE",
      "correct_answer": "...",
      "options": [...],
      "explanation": "..."
    }
  ]
}
```

### Template 2: Generate Paragraph

```
Bạn là giáo viên viết đoạn văn minh họa khái niệm học tập.

## Nội dung học tập:
{{#study_context}}{{study_context}}{{/study_context}}

## Yêu cầu:
- Độ dài: 200-300 từ
- Style: {{style}}
- Giải thích các khái niệm logic và dễ hiểu
- Sử dụng ví dụ cụ thể

## Format output (JSON):
{
  "paragraph": "...",
  "key_concepts": [...],
  "word_count": 250
}
```

### Template 3: Q&A Chat

```
Bạn là trợ lý học tập AI.

## Context học tập:
{study_context}

## Quy tắc:
- Chỉ trả lời về nội dung trong study_context
- Từ chối câu hỏi không liên quan
- Format rõ ràng, dễ hiểu
```

---

## ✅ CHECKLIST SETUP

### Workflow: Generate Test
- [ ] Tạo workflow `generate_test_workflow`
- [ ] Thêm input variables: `study_context`, `total_questions`, `question_types`, `time_limit`
- [ ] Tạo LLM Node với system prompt
- [ ] Tạo Code Node validate JSON (optional)
- [ ] Tạo END Node với output `test_data`
- [ ] Test workflow với sample data
- [ ] Lưu và lấy Workflow ID

### Workflow: Generate Paragraph
- [ ] Tạo workflow `generate_paragraph_workflow`
- [ ] Thêm input variables: `study_context`, `style`
- [ ] Tạo LLM Node với system prompt
- [ ] Tạo END Node với output `paragraph_data`
- [ ] Test workflow
- [ ] Lưu và lấy Workflow ID

### Chat App: Q&A
- [ ] Tạo Chat App `studyset_chatbot`
- [ ] Cấu hình System Prompt với `{study_context}`
- [ ] Thêm variable `study_context`
- [ ] Test chat app
- [ ] Lấy App ID

### Backend Config
- [ ] Cập nhật `.env` với `DIFY_API_KEY` và `DIFY_BASE_URL`
- [ ] Test connection: `python scripts/test_dify_connection.py`

---

## 🧪 TEST WORKFLOWS

### Test Generate Test Workflow

**Input:**
```json
{
  "study_context": "StudySet: Biology\n\nTerms:\n- Photosynthesis: Quá trình thực vật chuyển đổi ánh sáng mặt trời thành năng lượng\n- Mitochondria: Bào quan sản xuất năng lượng",
  "total_questions": 2,
  "question_types": ["MULTIPLE_CHOICE"],
  "time_limit": 15
}
```

**Expected Output:**
```json
{
  "test_data": {
    "questions": [
      {
        "term_text": "Photosynthesis",
        "question_text": "...",
        "question_type": "MULTIPLE_CHOICE",
        "correct_answer": "...",
        "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
        "explanation": "...",
        "order": 0
      }
    ],
    "total_questions": 2,
    "time_limit": 15
  }
}
```

### Test Generate Paragraph Workflow

**Input:**
```json
{
  "study_context": "StudySet: Biology\n\nTerms:\n- Photosynthesis: ...\n- Mitochondria: ...",
  "style": "academic"
}
```

**Expected Output:**
```json
{
  "paragraph_data": {
    "paragraph": "Quá trình quang hợp là một trong những quá trình quan trọng nhất...",
    "key_concepts": ["Photosynthesis", "Mitochondria"],
    "word_count": 250
  }
}
```

---

## 🔑 ĐIỂM QUAN TRỌNG

### 1. System Prompt Variables
- Dùng `{{variable_name}}` để inject variables
- Dùng `{{#study_context}}{{study_context}}{{/study_context}}` cho multiline text
- Variables phải khớp chính xác với Input Variables

### 2. JSON Output
- **QUAN TRỌNG:** Prompt phải yêu cầu JSON output rõ ràng
- Yêu cầu: "Output PHẢI là JSON hợp lệ, không có text thừa"
- Yêu cầu: "Không được có markdown code blocks"

### 3. Term Text Mapping
- `term_text` trong output phải khớp với term trong `study_context`
- Backend sẽ dùng để map với `term_id`
- Code Node có thể validate và map

### 4. Error Handling
- Code Node nên validate JSON
- Handle missing fields
- Provide fallback values

---

## 📚 TÀI LIỆU THAM KHẢO

- [Dify Workflow Documentation](https://docs.dify.ai/guides/workflows)
- [Dify Prompt Engineering](https://docs.dify.ai/guides/prompt-engineering)
- [Dify API Reference](https://docs.dify.ai/guides/application-development/api-reference)

---

**Status:** ✅ Hướng dẫn setup Dify hoàn chỉnh!

