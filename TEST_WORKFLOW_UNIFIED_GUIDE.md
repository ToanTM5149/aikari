# Hướng dẫn Test Dify Workflow Unified App

## Lỗi "not_workflow_app"

Nếu bạn gặp lỗi:
```json
{
  "code": "not_workflow_app",
  "message": "Please check if your app mode matches the right API route.",
  "status": 400
}
```

**Nguyên nhân**: App ID trong `DIFY_WORKFLOW_UNIFIED_APP_ID` không phải là **Workflow App**.

## Cách kiểm tra và sửa

### 1. Kiểm tra App Mode trong Dify Dashboard

1. Vào Dify Dashboard
2. Tìm app có ID = `DIFY_WORKFLOW_UNIFIED_APP_ID` của bạn
3. Vào **App Settings** hoặc **Overview**
4. Kiểm tra **App Mode**:
   - ✅ Phải là **"Workflow"** (hoặc "Workflow App")
   - ❌ KHÔNG phải "Chat" hoặc "Agent" hoặc "Chat Flow"

### 2. Nếu App Mode không đúng

**Cách 1: Tạo Workflow App mới**
1. Tạo mới một **Workflow App** trong Dify
2. Copy **App ID** (UUID format)
3. Cập nhật `DIFY_WORKFLOW_UNIFIED_APP_ID` trong `backend/.env`

**Cách 2: Sử dụng App ID đúng**
- Nếu bạn đã có Workflow App, đảm bảo copy đúng App ID
- App ID thường có format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (UUID)

### 3. Cấu hình Workflow App

Workflow App cần có:
- ✅ **Input Variables**:
  - `action_type` (string) - "generate_test", "generate_paragraph", "answer_question"
  - `study_context` (string)
  - `total_questions` (number) - cho generate_test
  - `question_types` (array) - cho generate_test
  - `time_limit` (number) - cho generate_test (optional)
  
- ✅ **Output Variables**:
  - `test_data` (object) - cho generate_test
  - Hoặc `data.test_data` nếu dùng nested structure

### 4. Test lại

Sau khi sửa, chạy lại script test:

```bash
source backend/.venv/bin/activate
python test_dify_workflow_backend.py
```

## Scripts test

### `test_dify_workflow_backend.py` (Recommended)
- Sử dụng backend `DifyService` trực tiếp
- Logic giống hệt với `GenerationService`
- Đảm bảo test chính xác

### `test_dify_workflow_unified.py`
- Script standalone, không cần import backend
- Dùng httpx trực tiếp
- Hữu ích để debug endpoint

## Expected Response Structure

Khi thành công, response sẽ có structure:

```json
{
  "outputs": {
    "data": {
      "test_data": {
        "questions": [...],
        "total_questions": 10,
        "time_limit": 2
      }
    }
  }
}
```

Hoặc:

```json
{
  "outputs": {
    "test_data": {
      "questions": [...],
      "total_questions": 10,
      "time_limit": 2
    }
  }
}
```

## Troubleshooting

### Lỗi "Không tìm thấy test_data"
- Kiểm tra END node trong Workflow có map output variable `test_data` không
- Kiểm tra output variable name có đúng không (case-sensitive)

### Lỗi "action_type is required"
- Đảm bảo START node có input variable `action_type`
- Đảm bảo gửi `action_type: "generate_test"` trong request

### Lỗi HTTP 401/403
- Kiểm tra `DIFY_API_KEY` có đúng không
- Kiểm tra API key có quyền truy cập Workflow App không

