# 📝 HƯỚNG DẪN CẬP NHẬT PROMPT TRÊN DIFY ĐỂ HỖ TRỢ CÁC LOẠI CÂU HỎI

## 📋 Mục Lục

1. [Tổng Quan về Các Loại Câu Hỏi](#tổng-quan-về-các-loại-câu-hỏi)
2. [Format JSON cho Từng Loại Câu Hỏi](#format-json-cho-từng-loại-câu-hỏi)
3. [Cập Nhật System Prompt trong Dify](#cập-nhật-system-prompt-trong-dify)
4. [Cập Nhật User Prompt trong Dify](#cập-nhật-user-prompt-trong-dify)
5. [Ví Dụ Prompt cho Từng Loại](#ví-dụ-prompt-cho-từng-loại)
6. [Xử Lý MIXED (Hỗn Hợp)](#xử-lý-mixed-hỗn-hợp)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Tổng Quan về Các Loại Câu Hỏi

Hệ thống hỗ trợ **4 loại câu hỏi**:

1. **MULTIPLE_CHOICE** - Câu hỏi trắc nghiệm (4 lựa chọn)
2. **TRUE_FALSE** - Câu hỏi đúng/sai
3. **ESSAY** - Câu hỏi tự luận
4. **MIXED** - Hỗn hợp các loại câu hỏi trên

---

## 📊 Format JSON cho Từng Loại Câu Hỏi

### 1. MULTIPLE_CHOICE (Trắc Nghiệm)

```json
{
  "term_text": "Tên term (PHẢI khớp chính xác với term trong study_context)",
  "question_text": "Câu hỏi trắc nghiệm đầy đủ...",
  "question_type": "MULTIPLE_CHOICE",
  "correct_answer": "Đáp án đúng (chỉ text, không có A/B/C/D)",
  "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
  "explanation": "Giải thích tại sao đáp án đúng"
}
```

**Yêu cầu:**
- Phải có đúng 4 options
- Options phải có prefix A., B., C., D.
- `correct_answer` chỉ chứa text, không có prefix A/B/C/D
- `term_text` PHẢI khớp chính xác với term trong `study_context`

### 2. TRUE_FALSE (Đúng/Sai)

```json
{
  "term_text": "Tên term (PHẢI khớp chính xác với term trong study_context)",
  "question_text": "Câu hỏi đúng/sai đầy đủ...",
  "question_type": "TRUE_FALSE",
  "correct_answer": "True" hoặc "False",
  "options": ["True", "False"],
  "explanation": "Giải thích tại sao đáp án đúng"
}
```

**Yêu cầu:**
- `options` luôn là `["True", "False"]`
- `correct_answer` phải là `"True"` hoặc `"False"` (chính xác, phân biệt hoa thường)
- `term_text` PHẢI khớp chính xác với term trong `study_context`

### 3. ESSAY (Tự Luận)

```json
{
  "term_text": "Tên term (PHẢI khớp chính xác với term trong study_context)",
  "question_text": "Câu hỏi tự luận đầy đủ...",
  "question_type": "ESSAY",
  "correct_answer": "Đáp án mẫu hoặc từ khóa chính (để chấm điểm)",
  "options": null,
  "explanation": "Giải thích đáp án và cách chấm điểm"
}
```

**Yêu cầu:**
- `options` phải là `null` (không có lựa chọn)
- `correct_answer` nên chứa đáp án mẫu hoặc từ khóa chính để hỗ trợ chấm điểm
- `term_text` PHẢI khớp chính xác với term trong `study_context`

### 4. MIXED (Hỗn Hợp)

Khi `question_types` là `["MIXED"]` hoặc có nhiều loại, tạo đa dạng các loại câu hỏi:

```json
{
  "questions": [
    {
      "term_text": "Term 1",
      "question_text": "Câu hỏi trắc nghiệm...",
      "question_type": "MULTIPLE_CHOICE",
      "correct_answer": "Đáp án đúng",
      "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
      "explanation": "Giải thích"
    },
    {
      "term_text": "Term 2",
      "question_text": "Câu hỏi đúng/sai...",
      "question_type": "TRUE_FALSE",
      "correct_answer": "True",
      "options": ["True", "False"],
      "explanation": "Giải thích"
    },
    {
      "term_text": "Term 3",
      "question_text": "Câu hỏi tự luận...",
      "question_type": "ESSAY",
      "correct_answer": "Đáp án mẫu",
      "options": null,
      "explanation": "Giải thích"
    }
  ]
}
```

---

## 🔧 Cập Nhật System Prompt trong Dify

### Bước 1: Truy cập Dify Chat App

1. Đăng nhập vào Dify Dashboard
2. Chọn Chat App bạn muốn cập nhật (Unified Chat App hoặc Test Chat App)
3. Vào tab **"Prompt"** hoặc **"Orchestrate"**

### Bước 2: Cập Nhật System Prompt

**System Prompt mẫu (hỗ trợ tất cả loại câu hỏi):**

```
Bạn là giáo viên chuyên tạo bài test từ nội dung học tập.

## Nhiệm vụ:
Tạo câu hỏi từ nội dung học tập được cung cấp trong study_context.

## Các loại câu hỏi được hỗ trợ:
1. MULTIPLE_CHOICE - Câu hỏi trắc nghiệm (4 lựa chọn)
2. TRUE_FALSE - Câu hỏi đúng/sai
3. ESSAY - Câu hỏi tự luận
4. MIXED - Hỗn hợp các loại trên

## Quy tắc QUAN TRỌNG:
1. PHẢI tạo đúng loại câu hỏi được yêu cầu trong question_types
2. Nếu không thể tạo loại câu hỏi đó, vẫn PHẢI trả về JSON hợp lệ với field "error" chứa thông báo lỗi
3. KHÔNG BAO GIỜ trả về chỉ text thông báo, luôn phải trả về JSON hợp lệ
4. term_text PHẢI khớp chính xác với term trong study_context (phân biệt hoa thường, dấu câu)

## Format JSON bắt buộc:
- MULTIPLE_CHOICE: phải có 4 options với prefix A., B., C., D.
- TRUE_FALSE: options luôn là ["True", "False"], correct_answer là "True" hoặc "False"
- ESSAY: options phải là null
- MIXED: tạo đa dạng các loại câu hỏi

## Yêu cầu chất lượng:
- Câu hỏi phải rõ ràng, dễ hiểu
- Options phải hợp lý và có tính phân biệt
- Explanation phải giải thích rõ ràng tại sao đáp án đúng
- Đáp án đúng phải chính xác 100%
```

---

## 📝 Cập Nhật User Prompt trong Dify

### ⚠️ Lưu Ý Quan Trọng

**Một LLM Node chỉ có 1 System Prompt và 1 User Prompt.**

Tuy nhiên, bạn có **3 cách** để xử lý 4 loại câu hỏi:

1. **Cách 1: Một User Prompt thông minh (Khuyến nghị)** - Dùng conditional logic trong prompt
2. **Cách 2: Code Node để tạo prompt động** - Tạo prompt dựa trên question_types trước khi gửi vào LLM
3. **Cách 3: IF/ELSE Node với nhiều LLM Node** - Tách riêng từng loại câu hỏi (phức tạp hơn)

---

### Cấu trúc User Prompt

User Prompt sẽ nhận các biến từ backend:
- `{{study_context}}` - Nội dung học tập (terms và definitions)
- `{{total_questions}}` - Số câu hỏi cần tạo
- `{{question_types}}` - Loại câu hỏi (có thể là MULTIPLE_CHOICE, TRUE_FALSE, ESSAY, hoặc MIXED)
- `{{time_limit}}` - Thời gian giới hạn (phút)

---

## 🎯 CÁCH 1: MỘT USER PROMPT THÔNG MINH (KHUYẾN NGHỊ)

**Ưu điểm:**
- ✅ Đơn giản, chỉ cần 1 LLM Node
- ✅ Dễ maintain
- ✅ AI tự động chọn format phù hợp

**Cách làm:** Tạo một User Prompt thông minh với hướng dẫn rõ ràng cho từng loại câu hỏi.

### User Prompt mẫu (hỗ trợ tất cả loại):

```
Tạo {{total_questions}} câu hỏi {{question_types}}.

## Nội dung học tập:
{{study_context}}

## Yêu cầu:
- Số câu hỏi: {{total_questions}}
- Loại câu hỏi: {{question_types}}
- Thời gian: {{time_limit}} phút

## Format JSON bắt buộc:

### Nếu question_types là MULTIPLE_CHOICE:
```json
{
  "questions": [
    {
      "term_text": "Tên term (PHẢI khớp chính xác với term trong study_context)",
      "question_text": "Câu hỏi trắc nghiệm đầy đủ...",
      "question_type": "MULTIPLE_CHOICE",
      "correct_answer": "Đáp án đúng (chỉ text, không có A/B/C/D)",
      "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
      "explanation": "Giải thích tại sao đáp án đúng"
    }
  ],
  "total_questions": {{total_questions}},
  "time_limit": {{time_limit}}
}
```

### Nếu question_types là TRUE_FALSE:
```json
{
  "questions": [
    {
      "term_text": "Tên term (PHẢI khớp chính xác với term trong study_context)",
      "question_text": "Câu hỏi đúng/sai đầy đủ...",
      "question_type": "TRUE_FALSE",
      "correct_answer": "True" hoặc "False",
      "options": ["True", "False"],
      "explanation": "Giải thích tại sao đáp án đúng"
    }
  ],
  "total_questions": {{total_questions}},
  "time_limit": {{time_limit}}
}
```

### Nếu question_types là ESSAY:
```json
{
  "questions": [
    {
      "term_text": "Tên term (PHẢI khớp chính xác với term trong study_context)",
      "question_text": "Câu hỏi tự luận đầy đủ...",
      "question_type": "ESSAY",
      "correct_answer": "Đáp án mẫu hoặc từ khóa chính (để chấm điểm)",
      "options": null,
      "explanation": "Giải thích đáp án"
    }
  ],
  "total_questions": {{total_questions}},
  "time_limit": {{time_limit}}
}
```

### Nếu question_types là MIXED hoặc có nhiều loại:
Tạo đa dạng các loại câu hỏi (MULTIPLE_CHOICE, TRUE_FALSE, ESSAY) trong cùng một test.

## QUAN TRỌNG:
1. PHẢI tạo đúng loại câu hỏi được yêu cầu trong {{question_types}}
2. Nếu không thể tạo loại câu hỏi đó, vẫn PHẢI trả về JSON hợp lệ với field "error"
3. KHÔNG BAO GIỜ trả về chỉ text thông báo
4. term_text PHẢI khớp chính xác với term trong study_context

## Hướng dẫn chọn format:
- Nếu {{question_types}} chứa "MULTIPLE_CHOICE": dùng format MULTIPLE_CHOICE
- Nếu {{question_types}} chứa "TRUE_FALSE": dùng format TRUE_FALSE
- Nếu {{question_types}} chứa "ESSAY": dùng format ESSAY
- Nếu {{question_types}} chứa "MIXED" hoặc có nhiều loại: tạo đa dạng các loại
```

---

## 🔧 CÁCH 2: CODE NODE ĐỂ TẠO PROMPT ĐỘNG

**Ưu điểm:**
- ✅ Prompt được tạo động, rõ ràng hơn cho từng loại
- ✅ Có thể customize chi tiết cho từng loại câu hỏi
- ✅ Dễ debug và test

**Nhược điểm:**
- ❌ Phức tạp hơn, cần thêm Code Node
- ❌ Cần maintain code logic

### Cách làm:

1. **Thêm Code Node trước LLM Node:**
   - START → Code Node → LLM Node

2. **Code Node tạo prompt động:**

```python
def main(question_types: str, total_questions: int, study_context: str, time_limit: int = None):
    # Parse question_types (có thể là string hoặc array)
    if isinstance(question_types, str):
        types = [question_types]
    else:
        types = question_types if isinstance(question_types, list) else [question_types]
    
    # Xác định loại câu hỏi chính
    primary_type = types[0] if types else "MULTIPLE_CHOICE"
    is_mixed = "MIXED" in types or len(types) > 1
    
    # Tạo format examples dựa trên loại
    format_examples = []
    
    if "MULTIPLE_CHOICE" in types or is_mixed:
        format_examples.append("""
    {
      "term_text": "Tên term (PHẢI khớp chính xác)",
      "question_text": "Câu hỏi trắc nghiệm...",
      "question_type": "MULTIPLE_CHOICE",
      "correct_answer": "Đáp án đúng",
      "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
      "explanation": "Giải thích"
    }""")
    
    if "TRUE_FALSE" in types or is_mixed:
        format_examples.append("""
    {
      "term_text": "Tên term (PHẢI khớp chính xác)",
      "question_text": "Câu hỏi đúng/sai...",
      "question_type": "TRUE_FALSE",
      "correct_answer": "True" hoặc "False",
      "options": ["True", "False"],
      "explanation": "Giải thích"
    }""")
    
    if "ESSAY" in types or is_mixed:
        format_examples.append("""
    {
      "term_text": "Tên term (PHẢI khớp chính xác)",
      "question_text": "Câu hỏi tự luận...",
      "question_type": "ESSAY",
      "correct_answer": "Đáp án mẫu",
      "options": null,
      "explanation": "Giải thích"
    }""")
    
    format_example = ",\n".join(format_examples)
    
    # Tạo prompt động
    prompt = f"""Tạo {total_questions} câu hỏi {'hỗn hợp' if is_mixed else primary_type.lower()}.

## Nội dung học tập:
{study_context}

## Yêu cầu:
- Số câu hỏi: {total_questions}
- Loại câu hỏi: {', '.join(types) if not is_mixed else 'Hỗn hợp (MULTIPLE_CHOICE, TRUE_FALSE, ESSAY)'}
- Thời gian: {time_limit if time_limit else 'không giới hạn'} phút

## Format JSON bắt buộc:
{{
  "questions": [
{format_example}
  ],
  "total_questions": {total_questions},
  "time_limit": {time_limit if time_limit else None}
}}

## QUAN TRỌNG:
1. PHẢI tạo đúng loại câu hỏi được yêu cầu
2. Nếu không thể tạo, vẫn PHẢI trả về JSON hợp lệ với field "error"
3. KHÔNG BAO GIỜ trả về chỉ text thông báo
4. term_text PHẢI khớp chính xác với term trong study_context"""
    
    return {
        "dynamic_prompt": prompt
    }
```

3. **LLM Node nhận prompt từ Code Node:**
   - System Prompt: Giữ nguyên (như Cách 1)
   - User Prompt: `{{dynamic_prompt}}`

---

## 🔀 CÁCH 3: IF/ELSE NODE VỚI NHIỀU LLM NODE

**Ưu điểm:**
- ✅ Mỗi loại câu hỏi có prompt riêng, rất rõ ràng
- ✅ Dễ customize cho từng loại

**Nhược điểm:**
- ❌ Phức tạp, nhiều nodes
- ❌ Khó maintain khi có nhiều loại
- ❌ Không khuyến nghị cho trường hợp này

### Cách làm:

1. **Thêm IF/ELSE Node sau START:**
   - START → IF/ELSE Node

2. **Cấu hình IF/ELSE với 4 nhánh:**
   - Condition 1: `{{question_types}} == "MULTIPLE_CHOICE"` → LLM Node 1
   - Condition 2: `{{question_types}} == "TRUE_FALSE"` → LLM Node 2
   - Condition 3: `{{question_types}} == "ESSAY"` → LLM Node 3
   - Condition 4: `{{question_types}} == "MIXED"` hoặc ELSE → LLM Node 4

3. **Mỗi LLM Node có prompt riêng:**
   - LLM Node 1: Prompt cho MULTIPLE_CHOICE
   - LLM Node 2: Prompt cho TRUE_FALSE
   - LLM Node 3: Prompt cho ESSAY
   - LLM Node 4: Prompt cho MIXED

4. **Kết nối tất cả LLM Nodes → END Node**

**⚠️ Lưu ý:** Cách này không khuyến nghị vì phức tạp và khó maintain.

---

## ✅ So Sánh 3 Cách

| Tiêu chí | Cách 1: Prompt Thông Minh | Cách 2: Code Node | Cách 3: IF/ELSE + Nhiều LLM |
|----------|---------------------------|------------------|----------------------------|
| **Độ phức tạp** | ⭐ Đơn giản | ⭐⭐ Trung bình | ⭐⭐⭐ Phức tạp |
| **Dễ maintain** | ✅ Rất dễ | ✅ Dễ | ❌ Khó |
| **Hiệu suất** | ✅ Tốt | ✅ Tốt | ⚠️ Nhiều nodes |
| **Flexibility** | ✅ Cao | ✅✅ Rất cao | ✅✅✅ Rất cao |
| **Khuyến nghị** | ✅✅✅ **Tốt nhất** | ✅✅ Tốt | ⚠️ Không khuyến nghị |

---

## 🎯 KHUYẾN NGHỊ

**Sử dụng Cách 1 (Prompt Thông Minh)** vì:
- Đơn giản nhất
- Dễ maintain
- AI hiện đại (GPT-4, Claude) có thể xử lý tốt conditional logic trong prompt
- Đủ linh hoạt cho hầu hết các trường hợp

**Chỉ dùng Cách 2 (Code Node)** nếu:
- Cần logic phức tạp hơn
- Cần customize chi tiết cho từng loại
- Cần validate hoặc transform data trước khi gửi vào LLM

**Tránh Cách 3** trừ khi thực sự cần thiết.

---

## 💡 Ví Dụ Prompt cho Từng Loại

### Ví Dụ 1: MULTIPLE_CHOICE

**Input Variables:**
- `study_context`: "Photosynthesis: Quá trình thực vật chuyển đổi ánh sáng thành năng lượng..."
- `total_questions`: "5"
- `question_types`: "MULTIPLE_CHOICE"
- `time_limit`: "10"

**Expected Output:**
```json
{
  "questions": [
    {
      "term_text": "Photosynthesis",
      "question_text": "Quá trình quang hợp diễn ra ở đâu trong tế bào thực vật?",
      "question_type": "MULTIPLE_CHOICE",
      "correct_answer": "Chloroplast",
      "options": ["A. Mitochondria", "B. Chloroplast", "C. Nucleus", "D. Ribosome"],
      "explanation": "Quang hợp diễn ra trong chloroplast, nơi chứa chlorophyll để hấp thụ ánh sáng."
    }
  ],
  "total_questions": 5,
  "time_limit": 10
}
```

### Ví Dụ 2: TRUE_FALSE

**Input Variables:**
- `question_types`: "TRUE_FALSE"

**Expected Output:**
```json
{
  "questions": [
    {
      "term_text": "Photosynthesis",
      "question_text": "Quá trình quang hợp tạo ra oxygen.",
      "question_type": "TRUE_FALSE",
      "correct_answer": "True",
      "options": ["True", "False"],
      "explanation": "Đúng, quá trình quang hợp tạo ra oxygen như một sản phẩm phụ."
    }
  ]
}
```

### Ví Dụ 3: ESSAY

**Input Variables:**
- `question_types`: "ESSAY"

**Expected Output:**
```json
{
  "questions": [
    {
      "term_text": "Photosynthesis",
      "question_text": "Hãy giải thích quá trình quang hợp diễn ra như thế nào?",
      "question_type": "ESSAY",
      "correct_answer": "Quá trình quang hợp bao gồm: 1) Hấp thụ ánh sáng, 2) Chuyển đổi CO2 và H2O thành glucose, 3) Tạo ra oxygen",
      "options": null,
      "explanation": "Quá trình quang hợp là quá trình thực vật sử dụng ánh sáng mặt trời để chuyển đổi carbon dioxide và nước thành glucose và oxygen."
    }
  ]
}
```

---

## 🔀 Xử Lý MIXED (Hỗn Hợp)

Khi `question_types` là `["MIXED"]` hoặc có nhiều loại, cần tạo đa dạng các loại câu hỏi.

### Prompt cho MIXED:

```
Tạo {{total_questions}} câu hỏi hỗn hợp (MIXED).

Yêu cầu:
- Tạo đa dạng các loại câu hỏi: MULTIPLE_CHOICE, TRUE_FALSE, ESSAY
- Phân bổ hợp lý: khoảng 50% MULTIPLE_CHOICE, 30% TRUE_FALSE, 20% ESSAY
- Mỗi câu hỏi phải dựa trên một term khác nhau trong study_context

Format JSON:
{
  "questions": [
    // Câu hỏi MULTIPLE_CHOICE
    {
      "term_text": "Term 1",
      "question_type": "MULTIPLE_CHOICE",
      ...
    },
    // Câu hỏi TRUE_FALSE
    {
      "term_text": "Term 2",
      "question_type": "TRUE_FALSE",
      ...
    },
    // Câu hỏi ESSAY
    {
      "term_text": "Term 3",
      "question_type": "ESSAY",
      ...
    }
  ]
}
```

---

## ✅ Best Practices

### 1. Luôn Trả Về JSON Hợp Lệ

**❌ SAI:**
```
Tôi xin lỗi, tôi chỉ có thể tạo câu hỏi trắc nghiệm (MULTIPLE_CHOICE).
```

**✅ ĐÚNG:**
```json
{
  "error": "Tôi chỉ có thể tạo câu hỏi trắc nghiệm (MULTIPLE_CHOICE). Vui lòng chọn loại câu hỏi khác.",
  "questions": [],
  "total_questions": 0,
  "time_limit": null
}
```

### 2. Kiểm Tra term_text Chính Xác

- `term_text` PHẢI khớp **chính xác** với term trong `study_context`
- Phân biệt hoa thường
- Phân biệt dấu câu
- Không được thêm/bớt khoảng trắng

**Ví dụ:**
- Study context có: `"Photosynthesis"`
- ✅ Đúng: `"term_text": "Photosynthesis"`
- ❌ Sai: `"term_text": "photosynthesis"` (sai chữ hoa)
- ❌ Sai: `"term_text": "Photo synthesis"` (thêm khoảng trắng)

### 3. Format Options Đúng

**MULTIPLE_CHOICE:**
- ✅ Đúng: `["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"]`
- ❌ Sai: `["Option 1", "Option 2", "Option 3", "Option 4"]` (thiếu prefix)

**TRUE_FALSE:**
- ✅ Đúng: `["True", "False"]`
- ❌ Sai: `["true", "false"]` (sai chữ hoa)
- ❌ Sai: `["Đúng", "Sai"]` (phải dùng tiếng Anh)

**ESSAY:**
- ✅ Đúng: `null`
- ❌ Sai: `[]` (phải là null, không phải array rỗng)

### 4. Xử Lý Edge Cases

- Nếu `study_context` không có đủ terms: Tạo ít câu hỏi hơn, không báo lỗi
- Nếu `question_types` không hợp lệ: Trả về JSON với field `error`
- Nếu không thể tạo loại câu hỏi: Vẫn trả về JSON hợp lệ với `error`

---

## 🔍 Troubleshooting

### Vấn Đề 1: Chat App trả về text thay vì JSON

**Nguyên nhân:**
- System Prompt không yêu cầu rõ ràng phải trả về JSON
- Chat App từ chối tạo loại câu hỏi không được hỗ trợ

**Giải pháp:**
1. Cập nhật System Prompt với yêu cầu rõ ràng: "KHÔNG BAO GIỜ trả về chỉ text, luôn phải trả về JSON hợp lệ"
2. Thêm vào System Prompt: "Nếu không thể tạo loại câu hỏi, trả về JSON với field 'error'"

### Vấn Đề 2: term_text không khớp

**Nguyên nhân:**
- AI không kiểm tra chính xác term trong study_context
- Format study_context không rõ ràng

**Giải pháp:**
1. Trong System Prompt, nhấn mạnh: "term_text PHẢI khớp chính xác với term trong study_context (phân biệt hoa thường, dấu câu)"
2. Trong User Prompt, format study_context rõ ràng: `"- Term: Definition"`

### Vấn Đề 3: Options không đúng format

**Nguyên nhân:**
- AI không hiểu format yêu cầu
- Prompt không có ví dụ cụ thể

**Giải pháp:**
1. Thêm ví dụ cụ thể vào System Prompt
2. Trong User Prompt, liệt kê rõ format cho từng loại câu hỏi

### Vấn Đề 4: ESSAY có options thay vì null

**Nguyên nhân:**
- AI nhầm lẫn giữa các loại câu hỏi
- Prompt không rõ ràng về ESSAY

**Giải pháp:**
1. Trong System Prompt, nhấn mạnh: "ESSAY: options phải là null"
2. Thêm ví dụ cụ thể cho ESSAY trong User Prompt

---

## 📚 Tài Liệu Tham Khảo

- [DIFY_PROMPT_GUIDE.md](./DIFY_PROMPT_GUIDE.md) - Hướng dẫn cấu hình prompt trong Dify
- [DIFY_SETUP_GUIDE.md](./DIFY_SETUP_GUIDE.md) - Hướng dẫn setup Dify
- [TEST_DIFY_INTEGRATION.md](./TEST_DIFY_INTEGRATION.md) - Hướng dẫn tích hợp test với Dify

---

## 🎯 Checklist Cập Nhật Prompt

- [ ] System Prompt có yêu cầu rõ ràng về các loại câu hỏi
- [ ] System Prompt yêu cầu luôn trả về JSON hợp lệ
- [ ] System Prompt nhấn mạnh term_text phải khớp chính xác
- [ ] User Prompt có format examples cho từng loại câu hỏi
- [ ] User Prompt có hướng dẫn xử lý MIXED
- [ ] User Prompt có xử lý edge cases
- [ ] Đã test với MULTIPLE_CHOICE
- [ ] Đã test với TRUE_FALSE
- [ ] Đã test với ESSAY
- [ ] Đã test với MIXED
- [ ] Đã test với các trường hợp lỗi (không thể tạo loại câu hỏi)

---

**Lưu ý:** Sau khi cập nhật prompt, hãy test kỹ với từng loại câu hỏi để đảm bảo Chat App trả về đúng format JSON mong đợi.

