# Hướng dẫn Test Response từ Dify Chat App

## Mục đích

Script này giúp bạn kiểm tra xem backend có nhận được response từ Dify Chat App đúng format không, trước khi test qua chatbot UI.

## Cách sử dụng

### 1. Đảm bảo có config trong `backend/.env`:

```env
DIFY_API_KEY=app-xxxxx
DIFY_BASE_URL=http://localhost/v1
DIFY_CHAT_APP_TEST_ID=your_chat_app_id
```

### 2. Chạy script test:

```bash
# Activate virtual environment
source backend/.venv/bin/activate

# Chạy script
python test_dify_response_simple.py
```

### 3. Xem kết quả:

Script sẽ hiển thị:
- ✅ **RAW RESPONSE**: Response gốc từ Dify (toàn bộ JSON)
- ✅ **ANSWER TEXT**: Phần `answer` text từ response
- ✅ **PARSED JSON**: JSON sau khi parse từ answer text
- ✅ **VALIDATION**: Kiểm tra các fields bắt buộc

## Kết quả mong đợi

Nếu thành công, bạn sẽ thấy:

```
✅ Parse JSON thành công!
✅ Có 10 câu hỏi
✅ Câu hỏi có đủ fields
✅ total_questions: 10
✅ time_limit: 2
```

## Nếu có lỗi

### Lỗi "DIFY_CHAT_APP_TEST_ID chưa được set"
- Kiểm tra file `backend/.env` có `DIFY_CHAT_APP_TEST_ID` chưa
- Lấy Chat App ID từ Dify dashboard

### Lỗi "Parse JSON failed"
- Dify có thể trả về format khác
- Kiểm tra phần "ANSWER TEXT" để xem Dify trả về gì
- Có thể cần điều chỉnh prompt trong Dify Chat App

### Lỗi HTTP 401/403
- Kiểm tra `DIFY_API_KEY` có đúng không
- Kiểm tra API key có quyền truy cập Chat App không

## So sánh với Backend

Script này mô phỏng chính xác cách backend xử lý:
1. Gọi Dify Chat App API
2. Lấy `answer` từ response
3. Loại bỏ markdown code blocks (nếu có)
4. Parse JSON
5. Validate structure

Nếu script này chạy thành công, backend cũng sẽ nhận được response tương tự.

## Next Steps

Sau khi script test thành công:
1. Test qua chatbot UI (frontend)
2. Kiểm tra logs trong backend khi gọi Dify
3. Verify test được lưu vào database đúng format

