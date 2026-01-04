# 📝 HƯỚNG DẪN CẤU HÌNH PROMPT TRONG DIFY LLM NODE

## 🔍 Tổng Quan

Trong Dify LLM Node, có **2 loại prompt**:

1. **System Prompt** - Định nghĩa role, nhiệm vụ, quy tắc (bắt buộc)
2. **User Prompt** - Chứa context, yêu cầu cụ thể, user input (khuyến nghị)

---

## 📊 System Prompt vs User Prompt

### System Prompt
- **Mục đích:** Định nghĩa AI assistant, role, cách xử lý
- **Nội dung:** Quy tắc, format output, best practices
- **Vị trí:** Tab **"System Prompt"** hoặc **"Prompt"** → **"System"**
- **Bắt buộc:** ✅ Có (LLM Node phải có System Prompt)

### User Prompt
- **Mục đích:** Truyền context, data, yêu cầu cụ thể cho từng request
- **Nội dung:** Variables, user input, specific requirements
- **Vị trí:** Tab **"User Prompt"** hoặc **"Prompt"** → **"User"**
- **Bắt buộc:** ❌ Không (có thể để trống hoặc gộp vào System Prompt)

---

## 🎯 Cách Sử Dụng

### Cách 1: Tách System Prompt và User Prompt (Khuyến nghị)

**Ưu điểm:**
- ✅ System Prompt ngắn gọn, tập trung vào role và quy tắc
- ✅ User Prompt linh hoạt, dễ thay đổi context
- ✅ Dễ maintain và debug
- ✅ Phù hợp với best practices của LLM

**System Prompt:**
```
Bạn là giáo viên chuyên tạo bài test từ nội dung học tập.

## Nhiệm vụ:
Tạo câu hỏi từ nội dung học tập được cung cấp.

## Yêu cầu:
- Mỗi câu hỏi PHẢI dựa trên một term cụ thể
- Đáp án đúng phải chính xác 100%
- Options phải hợp lý và có tính phân biệt
- Explanation rõ ràng, dễ hiểu

## Format output (JSON):
{
  "questions": [...],
  "total_questions": {{total_questions}},
  "time_limit": {{time_limit}}
}
```

**User Prompt:**
```
## Nội dung học tập:
{{#study_context}}{{study_context}}{{/study_context}}

## Yêu cầu cụ thể:
- Số câu hỏi: {{total_questions}}
- Loại câu hỏi: {{question_types}}
- Thời gian: {{time_limit}} phút

Hãy tạo bài test theo yêu cầu trên.
```

### Cách 2: Gộp Tất Cả Vào System Prompt

**Khi nào dùng:**
- Dify version không có User Prompt riêng
- Muốn đơn giản hóa
- Context không thay đổi nhiều

**System Prompt (gộp tất cả):**
```
Bạn là giáo viên chuyên tạo bài test từ nội dung học tập.

## Nhiệm vụ:
Tạo {{total_questions}} câu hỏi từ nội dung học tập được cung cấp.

## Nội dung học tập:
{{#study_context}}{{study_context}}{{/study_context}}

## Yêu cầu:
- Số câu hỏi: {{total_questions}}
- Loại câu hỏi: {{question_types}}
- Thời gian: {{time_limit}} phút
- Mỗi câu hỏi PHẢI dựa trên một term cụ thể
- Đáp án đúng phải chính xác 100%

## Format output (JSON):
{
  "questions": [...],
  "total_questions": {{total_questions}},
  "time_limit": {{time_limit}}
}
```

---

## 📋 Ví Dụ Cụ Thể Cho Từng Use Case

### 1. Generate Test

**System Prompt:**
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

**User Prompt:**
```
## Nội dung học tập:
{{#study_context}}{{study_context}}{{/study_context}}

## Yêu cầu cụ thể:
- Số câu hỏi: {{total_questions}}
- Loại câu hỏi: {{question_types}}
- Giới hạn thời gian: {{time_limit}} phút (nếu có)

Hãy tạo bài test theo yêu cầu trên.
```

### 2. Generate Paragraph

**System Prompt:**
```
Bạn là giáo viên viết đoạn văn minh họa khái niệm học tập.

## Nhiệm vụ:
Viết một đoạn văn 200-300 từ giải thích các khái niệm trong nội dung học tập.

## Yêu cầu:
- Độ dài: 200-300 từ
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

**User Prompt:**
```
## Nội dung học tập:
{{#study_context}}{{study_context}}{{/study_context}}

## Yêu cầu cụ thể:
- Style: {{style}} (formal, academic, clear, dễ hiểu)
- Độ dài: 200-300 từ

Hãy viết đoạn văn theo yêu cầu trên.
```

### 3. Answer Question

**System Prompt:**
```
Bạn là trợ lý học tập AI giúp sinh viên học bài từ studyset.

## Nhiệm vụ:
Trả lời câu hỏi học thuật dựa trên nội dung học tập được cung cấp.

## Quy tắc:
- Chỉ trả lời về nội dung học thuật trong study_context
- Từ chối câu hỏi không liên quan đến học tập
- Format câu trả lời rõ ràng, dễ hiểu
- Sử dụng ví dụ cụ thể từ study_context
- Giải thích một cách logic và dễ hiểu
- Nếu câu hỏi không liên quan đến study_context, hãy nói rõ
- Luôn tham khảo study_context khi trả lời
- Câu trả lời phải chính xác và dựa trên facts trong study_context
```

**User Prompt:**
```
## Context học tập:
{{#study_context}}{{study_context}}{{/study_context}}

## Câu hỏi của user:
{{query}}

Hãy trả lời câu hỏi dựa trên context học tập trên.
```

---

## ⚠️ Lưu Ý Quan Trọng

### 1. Variables trong Prompt

- **System Prompt:** Có thể dùng variables, nhưng nên dùng cho quy tắc chung
- **User Prompt:** Nên dùng variables cho context và yêu cầu cụ thể
- **Template syntax:** `{{variable_name}}` hoặc `{{#variable_name}}...{{/variable_name}}`

### 2. Khi Nào Dùng User Prompt

**Nên dùng User Prompt khi:**
- ✅ Context thay đổi theo từng request (study_context, query)
- ✅ Yêu cầu cụ thể thay đổi (total_questions, style)
- ✅ Muốn tách biệt role (System) và data (User)

**Có thể gộp vào System Prompt khi:**
- ✅ Context ít thay đổi
- ✅ Dify version không có User Prompt riêng
- ✅ Muốn đơn giản hóa

### 3. Best Practices

**System Prompt:**
- ✅ Ngắn gọn, tập trung vào role và quy tắc
- ✅ Định nghĩa format output rõ ràng
- ✅ Không nên quá dài (tối đa 1000-2000 tokens)

**User Prompt:**
- ✅ Chứa context và data cụ thể
- ✅ Yêu cầu rõ ràng, cụ thể
- ✅ Có thể dài hơn System Prompt (context có thể lớn)

### 4. Template Syntax

**Dùng `{{variable}}` cho simple variables:**
```
Số câu hỏi: {{total_questions}}
```

**Dùng `{{#variable}}...{{/variable}}` cho conditional/block:**
```
{{#study_context}}
## Nội dung học tập:
{{study_context}}
{{/study_context}}
```

**Dùng `{{#if condition}}...{{/if}}` cho conditional (nếu Dify hỗ trợ):**
```
{{#if time_limit}}
Thời gian: {{time_limit}} phút
{{/if}}
```

---

## 🔧 Cách Cấu Hình Trong Dify UI

### Bước 1: Tìm Tab Prompt

1. **Click vào LLM Node**
2. **Tìm tab "Prompt"** hoặc **"Settings"** → **"Prompt"**
3. **Sẽ thấy 2 sections:**
   - **System Prompt** (hoặc "System")
   - **User Prompt** (hoặc "User")

### Bước 2: Nhập System Prompt

1. **Click vào System Prompt editor**
2. **Paste System Prompt** (role, quy tắc, format)
3. **Save**

### Bước 3: Nhập User Prompt (Nếu có)

1. **Click vào User Prompt editor**
2. **Paste User Prompt** (context, variables, yêu cầu)
3. **Save**

### Bước 4: Kiểm Tra Variables

- Đảm bảo tất cả variables trong prompt đã được thêm vào **Input Variables**
- Variables phải được map từ START node

---

## ✅ Checklist

Sau khi cấu hình prompt, kiểm tra:

- [ ] System Prompt có định nghĩa role và nhiệm vụ rõ ràng
- [ ] System Prompt có format output cụ thể (JSON structure)
- [ ] User Prompt có context và yêu cầu cụ thể (nếu dùng)
- [ ] Tất cả variables trong prompt đã được thêm vào Input Variables
- [ ] Variables được map từ START node
- [ ] Template syntax đúng (`{{variable}}` hoặc `{{#variable}}...{{/variable}}`)
- [ ] Không có typo trong variable names

---

## 💡 Tips

1. **Test prompt trong Dify UI** trước khi tích hợp với backend
2. **Dùng input đơn giản** để test trước
3. **Kiểm tra output format** có đúng JSON không
4. **Nếu output không đúng format**, điều chỉnh prompt (thêm yêu cầu rõ ràng hơn)
5. **System Prompt nên ngắn gọn**, User Prompt có thể dài hơn

---

Nếu Dify version của bạn không có User Prompt riêng, có thể gộp tất cả vào System Prompt như hướng dẫn ban đầu!

