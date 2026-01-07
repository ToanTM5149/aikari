# 🧪 HƯỚNG DẪN TEST DIFY INTEGRATION

## 📋 Checklist Trước Khi Test

- [ ] Dify workflow đã được setup và publish
- [ ] Đã lấy **Workflow ID** (App ID) từ Dify
- [ ] Đã cấu hình `.env` với:
  - `DIFY_API_KEY`
  - `DIFY_BASE_URL`
  - `DIFY_WORKFLOW_UNIFIED_APP_ID` (hoặc `DIFY_WORKFLOW_TEST_APP_ID`, `DIFY_WORKFLOW_PARAGRAPH_APP_ID`)
- [ ] Backend đang chạy
- [ ] Database đã có studyset và terms để test

---

## ⚙️ Bước 0: Switch Từ Mock Service Sang Real Service

**Quan trọng:** Backend hiện đang dùng mock service. Cần switch sang real service để test với Dify.

### Cách 1: Đã tự động switch (Recommended)

File `backend/app/api/routes/chatbot.py` đã được cập nhật để dùng real service:
```python
chatbot_service = ChatbotService(session, use_mock=False)
```

**Nếu chưa được cập nhật, làm thủ công:**

1. **Mở file:** `backend/app/api/routes/chatbot.py`
2. **Tìm dòng:** `chatbot_service = ChatbotService(session, use_mock=True)`
3. **Đổi thành:** `chatbot_service = ChatbotService(session, use_mock=False)`
4. **Restart backend**

### Cách 2: Kiểm tra lại

```bash
# Kiểm tra file có đúng không
grep "use_mock" backend/app/api/routes/chatbot.py
# Phải thấy: use_mock=False
```

---

## 🎯 Bước 1: Test Trong Dify UI (Khuyến nghị làm trước)

**Mục đích:** Đảm bảo workflow hoạt động đúng trước khi tích hợp với backend.

### Test Case 1: Generate Test

1. **Vào Dify Dashboard** → Workflow của bạn
2. **Click "Run"** hoặc **"Test"** button
3. **Nhập test inputs:**
   ```json
   {
     "action_type": "generate_test",
     "study_context": "StudySet: Biology\n\nTerms:\n- Photosynthesis: Quá trình thực vật chuyển đổi ánh sáng thành năng lượng\n- Chlorophyll: Sắc tố xanh lá cây trong thực vật\n- Mitochondria: Bào quan sản xuất năng lượng trong tế bào\n- DNA: Phân tử mang thông tin di truyền",
     "total_questions": 2,
     "question_types": ["MULTIPLE_CHOICE"],
     "time_limit": 15
   }
   ```
4. **Click "Run"** và xem kết quả
5. **Kiểm tra output:**
   - Phải có `result.action_type = "generate_test"`
   - Phải có `result.data.test_data.questions` (array)
   - Mỗi question phải có: `term_text`, `question_text`, `question_type`, `correct_answer`, `options`
   - `term_text` phải khớp chính xác với term trong study_context

**Ví dụ output mong đợi:**
```json
{
  "outputs": {
    "result": {
      "action_type": "generate_test",
      "data": {
        "test_data": {
          "questions": [
            {
              "term_text": "Photosynthesis",
              "question_text": "Quá trình nào sau đây mô tả chính xác nhất về quang hợp?",
              "question_type": "MULTIPLE_CHOICE",
              "correct_answer": "Quá trình thực vật chuyển đổi ánh sáng thành năng lượng",
              "options": [
                "A. Quá trình hô hấp của thực vật",
                "B. Quá trình thực vật chuyển đổi ánh sáng thành năng lượng",
                "C. Quá trình hấp thụ nước",
                "D. Quá trình vận chuyển chất dinh dưỡng"
              ],
              "explanation": "Quang hợp là quá trình thực vật sử dụng ánh sáng mặt trời để tạo năng lượng."
            },
            {
              "term_text": "Chlorophyll",
              "question_text": "Chlorophyll đóng vai trò gì trong quá trình quang hợp?",
              "question_type": "MULTIPLE_CHOICE",
              "correct_answer": "Sắc tố xanh lá cây trong thực vật",
              "options": [
                "A. Chất dinh dưỡng chính",
                "B. Sắc tố xanh lá cây trong thực vật",
                "C. Hormone tăng trưởng",
                "D. Chất bảo vệ cây"
              ],
              "explanation": "Chlorophyll là sắc tố màu xanh lá cây giúp hấp thụ ánh sáng mặt trời."
            }
          ],
          "total_questions": 2,
          "time_limit": 15
        }
      }
    }
  }
}
```

### Test Case 2: Generate Paragraph

1. **Vào Dify Dashboard** → Workflow của bạn
2. **Click "Run"** hoặc **"Test"** button
3. **Nhập test inputs:**
   ```json
   {
     "action_type": "generate_paragraph",
     "study_context": "StudySet: Biology\n\nTerms:\n- Photosynthesis: Quá trình thực vật chuyển đổi ánh sáng thành năng lượng\n- Chlorophyll: Sắc tố xanh lá cây trong thực vật\n- Mitochondria: Bào quan sản xuất năng lượng trong tế bào\n- DNA: Phân tử mang thông tin di truyền",
     "style": "academic"
   }
   ```
4. **Click "Run"** và xem kết quả
5. **Kiểm tra output:**
   - Phải có `result.action_type = "generate_paragraph"`
   - Phải có `result.data.paragraph_data.paragraph` (string, 200-300 từ)
   - Phải có `result.data.paragraph_data.key_concepts` (array)
   - Phải có `result.data.paragraph_data.word_count` (number)

**Ví dụ output mong đợi:**
```json
{
  "outputs": {
    "result": {
      "action_type": "generate_paragraph",
      "data": {
        "paragraph_data": {
          "paragraph": "Quá trình quang hợp là một trong những quá trình sinh học quan trọng nhất trên Trái Đất. Thực vật sử dụng chlorophyll, một sắc tố màu xanh lá cây, để hấp thụ ánh sáng mặt trời và chuyển đổi nó thành năng lượng hóa học. Quá trình này diễn ra trong chloroplast, nơi ánh sáng được sử dụng để tạo ra glucose từ carbon dioxide và nước. Năng lượng được tạo ra từ quang hợp sau đó được sử dụng bởi mitochondria, bào quan sản xuất năng lượng trong tế bào, để tạo ra ATP - nguồn năng lượng chính cho các hoạt động sống. Thông tin di truyền về các quá trình này được lưu trữ trong DNA, phân tử mang mã di truyền quyết định đặc điểm và chức năng của mọi sinh vật.",
          "key_concepts": [
            "Photosynthesis",
            "Chlorophyll",
            "Mitochondria",
            "DNA"
          ],
          "word_count": 250
        }
      }
    }
  }
}
```

### Test Case 3: Answer Question

1. **Vào Dify Dashboard** → Workflow của bạn
2. **Click "Run"** hoặc **"Test"** button
3. **Nhập test inputs:**
   ```json
   {
     "action_type": "answer_question",
     "study_context": "StudySet: Biology\n\nTerms:\n- Photosynthesis: Quá trình thực vật chuyển đổi ánh sáng thành năng lượng\n- Chlorophyll: Sắc tố xanh lá cây trong thực vật\n- Mitochondria: Bào quan sản xuất năng lượng trong tế bào\n- DNA: Phân tử mang thông tin di truyền",
     "query": "Quá trình quang hợp là gì?"
   }
   ```
4. **Click "Run"** và xem kết quả
5. **Kiểm tra output:**
   - Phải có `result.action_type = "answer_question"`
   - Phải có `result.data.answer` (string)
   - Answer phải liên quan đến study_context
   - Answer phải rõ ràng, dễ hiểu

**Ví dụ output mong đợi:**
```json
{
  "outputs": {
    "result": {
      "action_type": "answer_question",
      "data": {
        "answer": "Quá trình quang hợp là quá trình thực vật chuyển đổi ánh sáng thành năng lượng. Quá trình này diễn ra trong chloroplast, nơi có chứa chlorophyll - sắc tố xanh lá cây giúp hấp thụ ánh sáng mặt trời. Thực vật sử dụng ánh sáng, nước và carbon dioxide để tạo ra glucose và oxy. Năng lượng từ quang hợp sau đó được sử dụng bởi mitochondria để tạo ra ATP, nguồn năng lượng chính cho các hoạt động sống của tế bào."
      }
    }
  }
}
```

---

## 🔧 Bước 2: Kiểm Tra Cấu Hình Backend

### 2.1. Kiểm tra `.env` file

```bash
cd backend
cat .env | grep DIFY
```

**Phải có:**
```env
DIFY_API_KEY=app-xxxxxxxxxxxxx
DIFY_BASE_URL=https://your-dify-instance.com/v1
DIFY_WORKFLOW_UNIFIED_APP_ID=workflow-xxxxxxxxxxxxx
```

### 2.2. Kiểm tra Backend đang chạy

```bash
# Kiểm tra backend đang chạy
curl http://localhost:8000/health
# Hoặc
curl http://localhost:8000/api/v1/health
```

### 2.3. Test Dify Connection (Optional)

```bash
cd backend
source .venv/bin/activate  # hoặc .venv\Scripts\activate trên Windows
python -m app.scripts.test_dify_connection
```

---

## 🧪 Bước 3: Test Từ Backend API

### 3.1. Test Generate Test (Qua Chatbot)

**Cách 1: Test qua Chatbot UI (Khuyến nghị)**

1. **Mở Frontend:** `http://localhost:5173`
2. **Login** và vào một studyset
3. **Mở Chatbot** (sidebar bên phải)
4. **Chat với bot:**
   - Bot sẽ hỏi: "Bạn muốn làm gì?"
   - Chọn: "Tạo test"
   - Nhập số câu: `5`
   - Chọn loại: "Trắc nghiệm"
   - Chọn thời gian: `15`
   - Click "Xác nhận"
5. **Kiểm tra:**
   - Bot trả về: "✅ Đã tạo test!"
   - Có `test_id` trong metadata
   - Navigate đến test page

**Cách 2: Test trực tiếp qua API**

```bash
# 1. Login để lấy token
TOKEN=$(curl -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' \
  | jq -r '.access_token')

# 2. Lấy studyset_id (thay bằng ID thật)
STUDYSET_ID="your-studyset-id"

# 3. Tạo conversation và test
curl -X POST "http://localhost:8000/api/v1/chatbot/studysets/${STUDYSET_ID}/chat" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "",
    "conversation_id": null
  }'

# 4. Tiếp tục conversation (thay CONVERSATION_ID)
CONVERSATION_ID="conversation-id-from-step-3"
curl -X POST "http://localhost:8000/api/v1/chatbot/studysets/${STUDYSET_ID}/chat" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tạo test",
    "conversation_id": "'${CONVERSATION_ID}'"
  }'
```

### 3.2. Test Generate Paragraph

**Qua Chatbot:**
1. Mở Chatbot
2. Chọn: "Tạo đoạn văn"
3. Chọn style: "Academic"
4. Xác nhận

**Qua API:**
```bash
curl -X POST "http://localhost:8000/api/v1/chatbot/studysets/${STUDYSET_ID}/chat" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tạo đoạn văn",
    "conversation_id": "'${CONVERSATION_ID}'"
  }'
```

### 3.3. Test Answer Question

**Qua Chatbot:**
1. Mở Chatbot
2. Chọn: "Hỏi đáp"
3. Nhập câu hỏi: "Quá trình quang hợp là gì?"
4. Xem câu trả lời

**Qua API:**
```bash
curl -X POST "http://localhost:8000/api/v1/chatbot/studysets/${STUDYSET_ID}/chat" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Quá trình quang hợp là gì?",
    "conversation_id": "'${CONVERSATION_ID}'"
  }'
```

---

## 🐛 Debug Nếu Có Lỗi

### Lỗi 1: "DIFY_WORKFLOW_UNIFIED_APP_ID not configured"

**Nguyên nhân:** Chưa set `DIFY_WORKFLOW_UNIFIED_APP_ID` trong `.env`

**Giải pháp:**
1. Lấy Workflow ID từ Dify Dashboard
2. Thêm vào `.env`:
   ```env
   DIFY_WORKFLOW_UNIFIED_APP_ID=workflow-xxxxxxxxxxxxx
   ```
3. Restart backend

### Lỗi 2: "404 Not Found" hoặc "Invalid app_id"

**Nguyên nhân:** Workflow ID sai hoặc workflow chưa được publish

**Giải pháp:**
1. Kiểm tra Workflow ID trong Dify Dashboard → Settings → API
2. Đảm bảo workflow đã được **Publish**
3. Kiểm tra `DIFY_BASE_URL` có đúng không

### Lỗi 3: "Invalid JSON" hoặc "Missing 'questions' field"

**Nguyên nhân:** LLM output không đúng format hoặc Code Node validate không hoạt động

**Giải pháp:**
1. Test workflow trong Dify UI trước
2. Kiểm tra LLM prompt có yêu cầu JSON output không
3. Kiểm tra Code Node validate có parse đúng không
4. Xem logs trong Dify Dashboard → Workflow Runs

### Lỗi 4: "term_text not found" hoặc "Cannot map term_text to term_id"

**Nguyên nhân:** `term_text` trong question không khớp với term trong database

**Giải pháp:**
1. Kiểm tra `term_text` trong Dify output có khớp chính xác với term trong studyset không
2. Kiểm tra LLM prompt có yêu cầu `term_text` phải khớp chính xác không
3. Xem logs backend để biết `term_text` nào không tìm thấy

### Lỗi 5: Response structure không đúng

**Nguyên nhân:** END Node output structure không khớp với backend expect

**Giải pháp:**
1. Kiểm tra END Node output variable name
2. Kiểm tra Code Node "Format Output" có return đúng structure không
3. Xem backend code parse response:
   ```python
   # backend/app/services/generation_service.py
   outputs = result.get("outputs") or result.get("data", {}).get("outputs", {})
   result_data = outputs.get("result", {})  # hoặc outputs.get("data", {})
   ```

---

## 📊 Kiểm Tra Logs

### Backend Logs

```bash
# Xem logs backend
tail -f backend/logs/app.log
# Hoặc nếu chạy với uvicorn
# Logs sẽ hiển thị trong terminal
```

**Tìm các log:**
- `Calling Dify workflow to generate test...`
- `Dify workflow response: ...`
- `Parsed test_data: ...`
- `Created test with ID: ...`

### Dify Dashboard Logs

1. **Vào Dify Dashboard** → Workflow của bạn
2. **Click "Runs"** hoặc **"History"**
3. **Xem từng run:**
   - Inputs
   - Outputs
   - Errors (nếu có)
   - Execution time

---

## ✅ Checklist Sau Khi Test

- [ ] Test Case 1 (Generate Test) hoạt động
- [ ] Test Case 2 (Generate Paragraph) hoạt động
- [ ] Test Case 3 (Answer Question) hoạt động
- [ ] Data được lưu vào database đúng
- [ ] Frontend hiển thị kết quả đúng
- [ ] Không có lỗi trong logs
- [ ] Performance acceptable (< 30s cho generate test)

---

## 🚀 Next Steps

Sau khi test thành công:

1. **Tối ưu prompts** trong Dify để output tốt hơn
2. **Tối ưu Code Node validate** để handle edge cases
3. **Thêm error handling** trong backend
4. **Thêm retry logic** nếu Dify timeout
5. **Monitor performance** và optimize nếu cần

---

## 📝 Notes

- Nếu test fail, check logs cả backend và Dify
- Test từng case một, không test tất cả cùng lúc
- Đảm bảo studyset có đủ terms để generate test
- Nếu dùng mock service, switch về real service để test

