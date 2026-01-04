# 🔧 SỬA LỖI: INPUT NULL TRONG LLM NODE

## ❌ Vấn Đề

Khi chạy workflow, LLM Node báo:
- `input: null`
- Variables trong prompt vẫn là template syntax (`{{total_questions}}`, `{{time_limit}}`) chưa được resolve
- Prompt đã render nhưng variables không có giá trị

**Ví dụ từ log:**
```
input: null
process data: {
  "prompts": [
    {
      "role": "system",
      "text": "...total_questions: {{total_questions}}..."  ← Vẫn là template!
    },
    {
      "role": "user",
      "text": "...Số câu hỏi: 2..."  ← Hardcoded value thay vì variable
    }
  ]
}
```

---

## ✅ Nguyên Nhân

**Input Variables chưa được map vào LLM Node từ START node.**

Mặc dù:
- ✅ Đã có System Prompt và User Prompt
- ✅ Đã có template syntax trong prompt (`{{variable_name}}`)
- ✅ Đã có Input Variables trong START node

Nhưng:
- ❌ LLM Node chưa có Input Variables được map từ START node
- ❌ Hoặc Input Variables có tên không khớp

---

## 🔧 Cách Sửa

### Bước 1: Kiểm Tra Input Variables Trong LLM Node

1. **Click vào LLM Node** (ví dụ: "Generate Test Questions")

2. **Tìm tab "Variables" hoặc "Input Variables":**
   - Có thể nằm trong tab **"SETTINGS"** → Scroll xuống tìm **"INPUT VARIABLES"**
   - Hoặc có tab riêng **"Variables"** bên cạnh **"Prompt"**, **"Model"**
   - Hoặc trong panel bên phải, tìm section **"Context Variables"** hoặc **"Input Variables"**

3. **Kiểm tra xem có Input Variables chưa:**
   - Nếu **KHÔNG CÓ** → Cần thêm (xem Bước 2)
   - Nếu **CÓ** → Kiểm tra mapping (xem Bước 3)

### Bước 2: Thêm Input Variables Vào LLM Node

1. **Click "Add Variable"** hoặc **"+"** hoặc **"Add Input Variable"**

2. **Thêm từng variable:**

   **Variable 1: study_context**
   - **Name:** `study_context`
   - **Type:** `String`
   - **Value:** Click dropdown → Chọn **START** → Chọn `study_context`
   - Hoặc gõ: `{{study_context}}`

   **Variable 2: total_questions**
   - **Name:** `total_questions`
   - **Type:** `Number`
   - **Value:** `{{total_questions}}` (từ START node)

   **Variable 3: question_types**
   - **Name:** `question_types`
   - **Type:** `Array`
   - **Value:** `{{question_types}}` (từ START node)

   **Variable 4: time_limit**
   - **Name:** `time_limit`
   - **Type:** `Number`
   - **Value:** `{{time_limit}}` (từ START node)

3. **Save** hoặc click ra ngoài để lưu

### Bước 3: Kiểm Tra Mapping

**Sau khi thêm Input Variables, kiểm tra:**

1. **Tên variable trong Input Variables** phải khớp với tên dùng trong prompt:
   - Prompt có `{{total_questions}}` → Input Variable phải có name `total_questions`
   - Prompt có `{{time_limit}}` → Input Variable phải có name `time_limit`
   - Prompt có `{{study_context}}` → Input Variable phải có name `study_context`

2. **Value của Input Variable** phải map từ START node:
   - `{{study_context}}` → từ START node
   - `{{total_questions}}` → từ START node
   - `{{question_types}}` → từ START node
   - `{{time_limit}}` → từ START node

3. **START node phải có các Input Variables này:**
   - Kiểm tra START node có định nghĩa `study_context`, `total_questions`, `question_types`, `time_limit` chưa
   - Nếu chưa có, thêm vào START node

### Bước 4: Kiểm Tra Kết Nối

1. **START node phải kết nối đến LLM Node:**
   - Hoặc START → IF/ELSE → LLM Node
   - Đảm bảo có mũi tên kết nối

2. **Nếu dùng IF/ELSE:**
   - Đảm bảo kết nối đúng nhánh
   - Condition phải đúng (ví dụ: `action_type == "generate_test"`)

---

## 🔍 Debug Chi Tiết

### Kiểm Tra 1: Xem Input Variables Trong LLM Node

1. **Click vào LLM Node**
2. **Vào tab "Variables" hoặc "Input Variables"**
3. **Xem danh sách variables:**
   - Phải có: `study_context`, `total_questions`, `question_types`, `time_limit`
   - Mỗi variable phải có **Value** được map từ START node

### Kiểm Tra 2: Xem Logs Trong Dify Tracing

1. **Vào Dify Dashboard** → Workflow → Runs
2. **Click vào run bị lỗi** → **"Tracing"**
3. **Click vào LLM Node** → Xem:
   - **Input Variables:** Phải có giá trị, không phải null
   - **Prompts:** Variables trong prompt phải được resolve (không còn `{{...}}`)

### Kiểm Tra 3: Test Với Input Đơn Giản

**Test với input đầy đủ:**
```json
{
  "action_type": "generate_test",
  "study_context": "Test content",
  "total_questions": 2,
  "question_types": ["MULTIPLE_CHOICE"],
  "time_limit": 15
}
```

**Sau khi test, xem logs:**
- Input Variables trong LLM Node phải có giá trị
- Prompts phải không còn template syntax

---

## ⚠️ Lưu Ý Quan Trọng

### 1. Tên Variables Phải Khớp Chính Xác

**Trong Prompt:**
```
{{total_questions}}
{{time_limit}}
{{study_context}}
```

**Trong Input Variables:**
- Name: `total_questions` ✅
- Name: `time_limit` ✅
- Name: `study_context` ✅

**❌ SAI:**
- Name: `totalQuestions` (camelCase)
- Name: `total_questions_` (có underscore thừa)
- Name: `Total_Questions` (case-sensitive)

### 2. Variables Phải Được Map Từ START Node

**Input Variable Value phải là:**
- `{{study_context}}` (từ START node)
- `{{total_questions}}` (từ START node)

**❌ SAI:**
- Value: `study_context` (thiếu `{{}}`)
- Value: `"study_context"` (có quotes)
- Value: `{{START.study_context}}` (sai syntax)

### 3. START Node Phải Có Variables

**START node phải định nghĩa:**
- `study_context` (String, Required)
- `total_questions` (Number, Optional)
- `question_types` (Array, Optional)
- `time_limit` (Number, Optional)

---

## 📋 Checklist Sửa Lỗi

- [ ] LLM Node có tab "Variables" hoặc "Input Variables"
- [ ] Đã thêm Input Variables: `study_context`, `total_questions`, `question_types`, `time_limit`
- [ ] Mỗi Input Variable có **Value** được map từ START node (`{{variable_name}}`)
- [ ] Tên Input Variables khớp với tên dùng trong prompt
- [ ] START node đã định nghĩa đầy đủ Input Variables
- [ ] START node đã kết nối đến LLM Node (hoặc qua IF/ELSE)
- [ ] Test input có đầy đủ required fields
- [ ] Sau khi test, xem logs - Input Variables phải có giá trị (không null)

---

## 🎯 Ví Dụ Cấu Hình Đúng

### LLM Node "Generate Test Questions"

**Input Variables (phải có):**
```
study_context: {{study_context}} (String, từ START)
total_questions: {{total_questions}} (Number, từ START)
question_types: {{question_types}} (Array, từ START)
time_limit: {{time_limit}} (Number, từ START)
```

**System Prompt:**
```
Bạn là giáo viên chuyên tạo bài test từ nội dung học tập.

## Nhiệm vụ:
Tạo câu hỏi từ nội dung học tập được cung cấp.

## Format output (JSON):
{
  "questions": [...],
  "total_questions": {{total_questions}},  ← Sẽ được resolve từ Input Variable
  "time_limit": {{time_limit}}  ← Sẽ được resolve từ Input Variable
}
```

**User Prompt:**
```
## Nội dung học tập:
{{#study_context}}{{study_context}}{{/study_context}}  ← Sẽ được resolve từ Input Variable

## Yêu cầu cụ thể:
- Số câu hỏi: {{total_questions}}  ← Sẽ được resolve từ Input Variable
- Loại câu hỏi: {{question_types}}  ← Sẽ được resolve từ Input Variable
```

**Kết nối:**
- START → IF/ELSE (action_type == "generate_test") → LLM Node

---

## 🔄 Nếu Vẫn Null Sau Khi Sửa

1. **Refresh page** và test lại
2. **Kiểm tra lại từng bước** trong checklist
3. **Xem logs chi tiết** trong Dify Tracing
4. **Thử tạo LLM Node mới** và cấu hình lại từ đầu
5. **Kiểm tra Dify version** - có thể cần update

---

## 💡 Tips

- **Luôn kiểm tra Input Variables** trước khi test workflow
- **Dùng input đơn giản** để test trước
- **Xem logs trong Tracing** để debug
- **Đảm bảo tên variables khớp chính xác** (case-sensitive)

