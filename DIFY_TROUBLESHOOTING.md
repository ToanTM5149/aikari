# 🔧 DIFY TROUBLESHOOTING GUIDE

## ❌ Lỗi: "contents are required" trong LLM Node

### Nguyên nhân

Lỗi này xảy ra khi **LLM Node không nhận được input variables** cần thiết. Có thể do:

1. **Input variables chưa được map vào LLM Node**
2. **Template syntax trong prompt không được resolve**
3. **Input variables từ START node chưa được kết nối**
4. **Variable name không khớp**

---

## ✅ Cách Sửa

### Bước 1: Kiểm tra Input Variables trong LLM Node

**⚠️ QUAN TRỌNG:** LLM Node trong Dify cần có **Input Variables** được map từ START node. Nếu không có, sẽ báo lỗi "contents are required".

1. **Click vào LLM Node** (ví dụ: "Generate Test Questions")
2. **Tìm tab "Variables"** hoặc **"Input Variables"** hoặc **"Context Variables"**
   - Có thể nằm trong tab **"SETTINGS"** → Scroll xuống tìm **"INPUT VARIABLES"**
   - Hoặc có thể có tab riêng **"Variables"** bên cạnh **"Prompt"**, **"Model"**

3. **Kiểm tra các input variables:**

   **Phải có:**
   - `study_context` → Value: `{{study_context}}` (từ START node)
   - `total_questions` → Value: `{{total_questions}}` (từ START node)
   - `question_types` → Value: `{{question_types}}` (từ START node)
   - `time_limit` → Value: `{{time_limit}}` (từ START node)

4. **Nếu thiếu hoặc không thấy chỗ thêm:**

   **Cách 1: Thêm trong tab Variables/Input Variables**
   - Click **"Add Variable"** hoặc **"+"** hoặc **"Add Input Variable"**
   - **Variable Name:** `study_context`
   - **Type:** `String`
   - **Value:** Click vào dropdown → Chọn **START** → Chọn `study_context`
   - Hoặc gõ trực tiếp: `{{study_context}}`

   **Cách 2: Thêm trong System Prompt (Context Variables)**
   - Một số version Dify cho phép thêm variables trực tiếp trong prompt editor
   - Khi gõ `{{study_context}}` trong prompt, Dify sẽ tự động suggest để add variable
   - Click vào suggestion để add variable

   **Cách 3: Nếu không thấy tab Variables**
   - Có thể LLM Node đang ở chế độ "Simple" mode
   - Tìm button **"Advanced"** hoặc **"Show Variables"** để chuyển sang advanced mode
   - Hoặc click vào **"..."** (menu) trên LLM Node để xem options

### Bước 2: Kiểm tra System Prompt

**LLM Node phải có System Prompt với template syntax:**

1. **Click vào LLM Node** → Tab **Prompt** hoặc **Settings**
2. **Kiểm tra System Prompt:**

   ✅ **ĐÚNG:**
   ```
   Bạn là giáo viên chuyên tạo bài test từ nội dung học tập.

   ## Nội dung học tập:
   {{#study_context}}{{study_context}}{{/study_context}}
   
   ## Yêu cầu:
   - Số câu hỏi: {{total_questions}}
   - Loại câu hỏi: {{question_types}}
   - Thời gian: {{time_limit}} phút
   ```

   ❌ **SAI:**
   ```
   Bạn là giáo viên...
   
   ## Nội dung học tập:
   study_context  ← Thiếu {{...}}
   ```

3. **Đảm bảo:**
   - Tất cả variables đều có `{{variable_name}}`
   - Nếu variable là optional, dùng `{{#variable_name}}...{{/variable_name}}`
   - Không có typo trong tên variable

### Bước 3: Kiểm tra Kết Nối START → LLM Node

1. **Kiểm tra workflow diagram:**
   - START node phải có kết nối đến LLM Node
   - Hoặc START → IF/ELSE → LLM Node

2. **Nếu chưa kết nối:**
   - Kéo từ START node → LLM Node
   - Hoặc START → IF/ELSE → LLM Node

### Bước 4: Kiểm tra Input Variables trong START Node

1. **Click vào START node**
2. **Kiểm tra các input variables đã được định nghĩa:**
   - `action_type` (String, Required)
   - `study_context` (String, Required)
   - `total_questions` (Number, Optional)
   - `question_types` (Array, Optional)
   - `time_limit` (Number, Optional)

3. **Nếu thiếu, thêm vào START node**

### Bước 5: Test với Input Đầy Đủ

**Khi test trong Dify UI, đảm bảo nhập đầy đủ:**

```json
{
  "action_type": "generate_test",
  "study_context": "StudySet: Biology\n\nTerms:\n- Photosynthesis: Quá trình thực vật chuyển đổi ánh sáng thành năng lượng",
  "total_questions": 2,
  "question_types": ["MULTIPLE_CHOICE"],
  "time_limit": 15
}
```

**⚠️ Lưu ý:**
- `study_context` phải có giá trị (không được rỗng)
- Các optional fields có thể bỏ qua, nhưng nếu LLM prompt dùng thì phải có

---

## 🔍 Debug Chi Tiết

### Xem Logs trong Dify

1. **Vào Dify Dashboard** → Workflow của bạn
2. **Click "Runs"** hoặc **"History"**
3. **Click vào run bị lỗi**
4. **Xem "Tracing"** hoặc **"Logs"**:
   - Input variables nhận được
   - LLM Node nhận được gì
   - Error message chi tiết

### Kiểm tra Node Settings

**Trong LLM Node:**

1. **Model Settings:**
   - Model đã được chọn chưa?
   - Temperature, Max Tokens đã set chưa?

2. **Prompt Settings:**
   - System Prompt có nội dung không?
   - User Prompt (nếu có) có đúng không?
   - Template variables có được resolve không?

3. **Input Variables:**
   - Tất cả variables đã được map chưa?
   - Variable names có khớp với prompt không?

---

## 🎯 Checklist Sửa Lỗi

- [ ] LLM Node có input variables được map từ START node
- [ ] System Prompt có dùng template syntax `{{variable_name}}`
- [ ] Tên variables trong prompt khớp với input variables
- [ ] START node đã định nghĩa đầy đủ input variables
- [ ] START node đã kết nối đến LLM Node (hoặc qua IF/ELSE)
- [ ] Test input có đầy đủ required fields
- [ ] Không có typo trong variable names

---

## 📝 Ví Dụ Cấu Hình Đúng

### LLM Node "Generate Test Questions"

**Input Variables:**
- `study_context`: `{{study_context}}` (String, từ START)
- `total_questions`: `{{total_questions}}` (Number, từ START)
- `question_types`: `{{question_types}}` (Array, từ START)
- `time_limit`: `{{time_limit}}` (Number, từ START)

**System Prompt:**
```
Bạn là giáo viên chuyên tạo bài test từ nội dung học tập.

## Nhiệm vụ:
Tạo {{total_questions}} câu hỏi từ nội dung học tập được cung cấp.

## Nội dung học tập:
{{#study_context}}{{study_context}}{{/study_context}}

## Yêu cầu:
- Loại câu hỏi: {{question_types}}
- Giới hạn thời gian: {{time_limit}} phút (nếu có)
```

**Kết nối:**
- START → IF/ELSE (action_type == "generate_test") → LLM Node

---

## 🔄 Nếu Vẫn Lỗi

1. **Kiểm tra lại từng bước** trong checklist
2. **Xem logs chi tiết** trong Dify Tracing
3. **Test với input đơn giản nhất:**
   ```json
   {
     "action_type": "generate_test",
     "study_context": "Test content",
     "total_questions": 1,
     "question_types": ["MULTIPLE_CHOICE"]
   }
   ```
4. **Thử tạo LLM Node mới** và cấu hình lại từ đầu
5. **Kiểm tra Dify version** - có thể cần update

---

## 💡 Tips

- **Luôn test trong Dify UI trước** khi tích hợp với backend
- **Dùng input đơn giản** để test trước, sau đó mới dùng input phức tạp
- **Kiểm tra variable names** - case-sensitive và không có space thừa
- **Nếu dùng IF/ELSE**, đảm bảo condition đúng và kết nối đúng nhánh

