# 📝 HƯỚNG DẪN THÊM INPUT VARIABLES VÀO LLM NODE TRONG DIFY

## ❌ Vấn Đề

Khi test workflow, LLM Node báo lỗi:
- `"contents are required"`
- Hoặc khi test riêng, thấy variables đang `null`
- Không biết chỗ nào để truyền input variables vào LLM Node

---

## ✅ Giải Pháp: Cách Thêm Input Variables

### Phương Pháp 1: Thêm Trong Tab Variables/Input Variables (Khuyến nghị)

1. **Click vào LLM Node** trên canvas (ví dụ: "Generate Test Questions")

2. **Tìm tab "Variables" hoặc "Input Variables":**
   - Có thể nằm trong tab **"SETTINGS"** → Scroll xuống tìm phần **"INPUT VARIABLES"**
   - Hoặc có tab riêng **"Variables"** bên cạnh **"Prompt"**, **"Model"**, **"Settings"**
   - Hoặc trong panel bên phải, tìm section **"Context Variables"** hoặc **"Input Variables"**

3. **Thêm Input Variable:**
   - Click button **"Add Variable"** hoặc **"+"** hoặc **"Add Input Variable"**
   - Một form sẽ hiện ra với các trường:
     - **Variable Name:** `study_context` (tên variable, phải khớp với tên dùng trong prompt)
     - **Type:** `String` (hoặc `Number`, `Array` tùy loại)
     - **Value:** Click vào dropdown → Chọn **START** → Chọn `study_context`
     - Hoặc gõ trực tiếp: `{{study_context}}`

4. **Lặp lại cho các variables khác:**
   - `total_questions` → `{{total_questions}}` (Type: Number)
   - `question_types` → `{{question_types}}` (Type: Array)
   - `time_limit` → `{{time_limit}}` (Type: Number)

5. **Save** hoặc click ra ngoài để lưu

---

### Phương Pháp 2: Thêm Trong Prompt Editor (Auto-suggest)

1. **Click vào LLM Node** → Tab **"Prompt"** hoặc **"System Prompt"**

2. **Gõ template syntax trong prompt:**
   ```
   {{study_context}}
   ```

3. **Dify sẽ tự động suggest:**
   - Khi bạn gõ `{{`, Dify sẽ hiện dropdown với các variables có sẵn
   - Hoặc khi bạn gõ xong `{{study_context}}`, Dify sẽ highlight và suggest "Add as variable"

4. **Click vào suggestion** để add variable vào Input Variables list

5. **Map variable:**
   - Chọn từ **START** node → `study_context`
   - Hoặc chọn từ node khác nếu cần

---

### Phương Pháp 3: Thêm Trong Advanced Mode

1. **Tìm button "Advanced" hoặc "Show Variables":**
   - Có thể nằm ở góc trên bên phải của LLM Node settings
   - Hoặc trong menu **"..."** (three dots)

2. **Click để chuyển sang Advanced Mode**

3. **Bây giờ sẽ thấy tab "Variables" hoặc "Input Variables"**

4. **Thêm variables như Phương Pháp 1**

---

## 🔍 Nếu Vẫn Không Thấy Chỗ Thêm

### Kiểm Tra 1: LLM Node Type

- Đảm bảo bạn đang dùng **LLM Node** (không phải Chat Node hay Completion Node)
- LLM Node thường có icon brain/AI hoặc label "LLM"

### Kiểm Tra 2: Dify Version

- Một số version Dify có UI khác nhau
- Thử refresh page hoặc update Dify

### Kiểm Tra 3: Node Settings Panel

1. **Click vào LLM Node**
2. **Panel bên phải sẽ hiện settings**
3. **Tìm các tab:**
   - **"Prompt"** - Chứa System Prompt
   - **"Model"** - Chứa Model settings
   - **"Variables"** hoặc **"Input Variables"** - Chứa input variables
   - **"Settings"** - Chứa các settings khác

4. **Nếu không thấy tab "Variables":**
   - Scroll xuống trong tab "Settings"
   - Tìm section "Context Variables" hoặc "Input Variables"
   - Hoặc tìm button "Add Variable" ở đâu đó trong settings

---

## 📋 Checklist Để Đảm Bảo Đúng

Sau khi thêm input variables, kiểm tra:

- [ ] LLM Node có section "Input Variables" hoặc "Variables"
- [ ] Các variables đã được thêm: `study_context`, `total_questions`, `question_types`, `time_limit`
- [ ] Mỗi variable có **Value** được map từ START node (ví dụ: `{{study_context}}`)
- [ ] Tên variable trong Input Variables khớp với tên dùng trong System Prompt
- [ ] Type của variable đúng (String, Number, Array)

---

## 🎯 Ví Dụ Cụ Thể: LLM Node "Generate Test Questions"

### Input Variables Phải Có:

1. **study_context**
   - **Name:** `study_context`
   - **Type:** `String`
   - **Value:** `{{study_context}}` (từ START node)

2. **total_questions**
   - **Name:** `total_questions`
   - **Type:** `Number`
   - **Value:** `{{total_questions}}` (từ START node)

3. **question_types**
   - **Name:** `question_types`
   - **Type:** `Array`
   - **Value:** `{{question_types}}` (từ START node)

4. **time_limit**
   - **Name:** `time_limit`
   - **Type:** `Number`
   - **Value:** `{{time_limit}}` (từ START node)

### System Prompt Sử Dụng:

```
Bạn là giáo viên chuyên tạo bài test từ nội dung học tập.

## Nội dung học tập:
{{#study_context}}{{study_context}}{{/study_context}}

## Yêu cầu:
- Số câu hỏi: {{total_questions}}
- Loại câu hỏi: {{question_types}}
- Thời gian: {{time_limit}} phút
```

**⚠️ Lưu ý:** Tên variables trong prompt (`{{study_context}}`, `{{total_questions}}`, etc.) phải khớp với tên trong Input Variables.

---

## 🐛 Debug Nếu Vẫn Null

1. **Kiểm tra START node:**
   - START node có định nghĩa các input variables chưa?
   - Variables có được set là Required hoặc có Default Value chưa?

2. **Kiểm tra kết nối:**
   - START node có kết nối đến LLM Node không?
   - Hoặc START → IF/ELSE → LLM Node?

3. **Kiểm tra test input:**
   - Khi test trong Dify UI, có nhập đầy đủ inputs không?
   - `study_context` có giá trị không (không được rỗng)?

4. **Xem logs:**
   - Vào Dify Dashboard → Workflow → Runs
   - Click vào run bị lỗi → Xem "Tracing"
   - Xem LLM Node nhận được gì trong "Input Variables"

---

## 💡 Tips

- **Luôn test trong Dify UI trước** để xem variables có được map đúng không
- **Dùng input đơn giản** để test trước (ví dụ: `study_context = "Test"`)
- **Kiểm tra variable names** - case-sensitive và không có space thừa
- **Nếu dùng IF/ELSE**, đảm bảo kết nối đúng nhánh đến LLM Node

---

## 📸 Screenshot Locations (Tham khảo)

Trong Dify UI, input variables thường nằm ở:

1. **Panel bên phải** khi click vào LLM Node:
   ```
   [LLM Node Settings]
   ├─ Prompt
   ├─ Model
   ├─ Variables  ← ĐÂY
   └─ Settings
   ```

2. **Hoặc trong tab Settings:**
   ```
   [Settings Tab]
   ├─ Model Configuration
   ├─ Prompt Configuration
   └─ Input Variables  ← ĐÂY
       ├─ study_context: {{study_context}}
       ├─ total_questions: {{total_questions}}
       └─ ...
   ```

3. **Hoặc trong Prompt Editor:**
   ```
   [Prompt Editor]
   System Prompt: ...
   {{study_context}}  ← Click vào đây để add variable
   ```

---

Nếu vẫn không tìm thấy, hãy mô tả UI bạn đang thấy, tôi sẽ hướng dẫn cụ thể hơn!

