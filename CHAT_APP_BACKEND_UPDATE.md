# 🔄 CẬP NHẬT BACKEND ĐỂ DÙNG CHAT APP

## ✅ Đã Hoàn Thành

### 1. Cập Nhật Config (`backend/app/core/config.py`)

Đã thêm Chat App IDs:
```python
# Chat App IDs (nếu dùng Chat App)
DIFY_CHAT_APP_TEST_ID: str | None = None
DIFY_CHAT_APP_PARAGRAPH_ID: str | None = None
DIFY_CHAT_APP_QA_ID: str | None = None
```

### 2. Cập Nhật DifyService (`backend/app/services/dify_service.py`)

Đã thêm parameters `inputs` và `app_id` vào `chat_completion`:
```python
async def chat_completion(
    self,
    query: str,
    user: str | None = None,
    conversation_id: str | None = None,
    response_mode: str = "blocking",
    inputs: dict[str, Any] | None = None,  # ✅ Đã thêm
    app_id: str | None = None,  # ✅ Đã thêm
    **kwargs: Any,
) -> dict[str, Any]:
```

### 3. Cập Nhật GenerationService (`backend/app/services/generation_service.py`)

**Đã cập nhật 3 methods:**

#### `generate_test_from_params`
- ✅ Kiểm tra `DIFY_CHAT_APP_TEST_ID`
- ✅ Nếu có → dùng `chat_completion` với query và inputs
- ✅ Parse JSON từ text answer
- ✅ Fallback về Workflow nếu không có Chat App ID

#### `generate_paragraph`
- ✅ Kiểm tra `DIFY_CHAT_APP_PARAGRAPH_ID`
- ✅ Nếu có → dùng `chat_completion` với query và inputs
- ✅ Parse JSON từ text answer
- ✅ Fallback về Workflow nếu không có Chat App ID

#### `answer_academic_question`
- ✅ Kiểm tra `DIFY_CHAT_APP_QA_ID`
- ✅ Nếu có → dùng `chat_completion` với query và inputs
- ✅ Fallback về Workflow hoặc chat completion cũ

---

## 📋 Cấu Hình `.env`

Thêm vào file `.env`:

```env
# Chat App IDs (nếu dùng Chat App)
DIFY_CHAT_APP_TEST_ID=app-xxxxxxxxxxxxx
DIFY_CHAT_APP_PARAGRAPH_ID=app-yyyyyyyyyyyy
DIFY_CHAT_APP_QA_ID=app-zzzzzzzzzzzz

# Hoặc giữ Workflow IDs nếu vẫn dùng Workflow
# DIFY_WORKFLOW_UNIFIED_APP_ID=workflow-xxxxxxxxxxxxx
```

**Lưu ý:**
- Nếu set Chat App IDs → Backend sẽ dùng Chat App
- Nếu không set Chat App IDs → Backend sẽ dùng Workflow (backward compatible)

---

## 🔄 Logic Hoạt Động

### Generate Test

1. **Kiểm tra:** `DIFY_CHAT_APP_TEST_ID` có giá trị không?
2. **Nếu có:**
   - Tạo query với yêu cầu cụ thể
   - Gọi `chat_completion` với:
     - `query`: Yêu cầu tạo test
     - `inputs`: `{study_context, total_questions, question_types, time_limit}`
     - `app_id`: `DIFY_CHAT_APP_TEST_ID`
   - Parse JSON từ `answer` (text)
3. **Nếu không:**
   - Dùng Workflow như cũ (backward compatible)

### Generate Paragraph

Tương tự, nhưng dùng `DIFY_CHAT_APP_PARAGRAPH_ID`

### Answer Question

Tương tự, nhưng dùng `DIFY_CHAT_APP_QA_ID`

---

## ⚠️ Lưu Ý Quan Trọng

### 1. Parse JSON Từ Text Answer

Chat App trả về text, không phải structured JSON. Backend sẽ:
- Loại bỏ markdown code blocks (` ```json ... ``` `)
- Parse JSON từ text
- Handle errors nếu JSON không hợp lệ

### 2. Error Handling

Nếu Chat App trả về text không phải JSON hợp lệ:
- Log error với 200 ký tự đầu của answer
- Raise `ValueError` với message rõ ràng

### 3. Backward Compatibility

Backend vẫn hỗ trợ Workflow:
- Nếu không set Chat App IDs → dùng Workflow
- Nếu set Chat App IDs → dùng Chat App
- Có thể mix (ví dụ: Test dùng Chat App, Paragraph dùng Workflow)

---

## 🧪 Test

### Test Generate Test với Chat App

1. **Set `.env`:**
   ```env
   DIFY_CHAT_APP_TEST_ID=app-xxxxxxxxxxxxx
   ```

2. **Restart backend**

3. **Test qua chatbot UI:**
   - Chọn "Tạo test"
   - Nhập số câu, loại câu, thời gian
   - Xác nhận
   - Kiểm tra logs: Phải thấy "Calling Dify Chat App to generate test"

4. **Kiểm tra output:**
   - Test được tạo thành công
   - Questions có đầy đủ fields
   - `source_model` trong AIGeneratedContents = "Dify Chat App"

### Test Generate Paragraph với Chat App

Tương tự, nhưng dùng `DIFY_CHAT_APP_PARAGRAPH_ID`

### Test Answer Question với Chat App

Tương tự, nhưng dùng `DIFY_CHAT_APP_QA_ID`

---

## 📝 Checklist

- [ ] Đã thêm Chat App IDs vào `.env`
- [ ] Restart backend
- [ ] Test Generate Test → Phải thấy "Calling Dify Chat App" trong logs
- [ ] Test Generate Paragraph → Phải thấy "Calling Dify Chat App" trong logs
- [ ] Test Answer Question → Phải thấy "Calling Dify Chat App" trong logs
- [ ] Kiểm tra output đúng format
- [ ] Kiểm tra `source_model` trong database = "Dify Chat App"

---

## 🔍 Debug

### Nếu Chat App trả về text không phải JSON

**Logs sẽ hiển thị:**
```
Failed to parse JSON from Chat App answer: ...
Chat App returned invalid JSON: ...
```

**Giải pháp:**
1. Kiểm tra System Prompt trong Chat App có yêu cầu JSON output không
2. Kiểm tra Chat App có trả về JSON hợp lệ không
3. Test Chat App trong Dify UI trước

### Nếu vẫn dùng Workflow

**Kiểm tra:**
- `.env` có set Chat App IDs chưa?
- Backend đã restart chưa?
- Logs có hiển thị "Calling Dify Chat App" không?

---

Backend đã sẵn sàng để dùng Chat App! Chỉ cần set Chat App IDs trong `.env` và restart backend.

