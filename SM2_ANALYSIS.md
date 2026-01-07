# Phân tích thuật toán SM-2

## Danh sách các file liên quan đến SM-2

### 1. Backend - Core Implementation
- **`backend/app/services/learning_service.py`** ⭐ (File chính)
  - Class `SpacedRepetitionSM2`: Implementation thuật toán SM-2
  - Class `LearningService`: Service quản lý học tập và tiến độ
  - Hàm `calculate_next_review()`: Tính toán EF, interval, repetitions, next_review_date
  - Hàm `record_review()`: Ghi nhận kết quả học và cập nhật
  - Hàm `get_next_term_to_review()`: Chọn flashcard tiếp theo để học
  - Hàm `update_progress_summary()`: Cập nhật tiến độ tổng thể

### 2. Backend - API Routes
- **`backend/app/api/routes/learning.py`**
  - Endpoint `GET /studysets/{studyset_id}/next/`: Lấy flashcard tiếp theo
  - Endpoint `POST /studysets/{studyset_id}/review/`: Submit review
  - Endpoint `POST /session/start/`: Bắt đầu session học
  - Endpoint `POST /session/end/`: Kết thúc session
  - Endpoint `GET /progress/studysets/{studyset_id}/`: Lấy tiến độ

### 3. Backend - Models
- **`backend/app/models/activity.py`**
  - Model `StudyActivity`: Lưu trữ thông tin mỗi lần học
    - `ef`: Easiness Factor (float, default=2.5)
    - `interval`: Khoảng thời gian đến lần ôn tiếp theo (int, ngày)
    - `next_review_date`: Ngày ôn tập tiếp theo (datetime)
    - `recall_score`: Điểm đánh giá (0-5)
    - `is_correct`: Đúng/Sai (boolean)

- **`backend/app/models/progress.py`**
  - Model `ProgressSummary`: Tổng hợp tiến độ
    - `mastered_terms`: Số flashcard đã thuộc
    - `reviewing_terms`: Số flashcard đang ôn tập
    - `forgotten_terms`: Số flashcard đã quên
    - `completion_rate`: Tỷ lệ hoàn thành (%)

### 4. Backend - Schemas
- **`backend/app/schemas/learning.py`**
  - `ReviewSubmission`: Schema cho việc submit review
  - `ReviewResponse`: Response sau khi submit review
  - `NextTermResponse`: Response cho flashcard tiếp theo
  - `ProgressSummaryPublic`: Schema công khai cho tiến độ

### 5. Documentation
- **`SPACED_REPETITION_ALGORITHM.md`**
  - Tài liệu chi tiết về thuật toán SM-2
  - Công thức tính toán
  - Ví dụ minh họa
  - Database schema

### 6. Frontend (Tham khảo)
- **`frontend/app/components/pages/learn/flashcard-learning-page.tsx`**
  - Component UI cho việc học flashcards với spaced repetition

---

## Phân tích logic cơ bản của SM-2

### ✅ Logic đúng

#### 1. Công thức tính EF (Easiness Factor)
```python
new_ef = current_ef + (0.1 - (5 - recall_score) * (0.08 + (5 - recall_score) * 0.02))
new_ef = max(new_ef, 1.3)  # Giới hạn tối thiểu
```
✅ **Đúng**: Công thức này khớp với SM-2 chuẩn

#### 2. Tính interval khi recall_score < 3
```python
if recall_score < 3:
    new_interval = 1
    new_repetitions = 0
```
✅ **Đúng**: Khi trả lời sai, reset về interval = 1 ngày và repetitions = 0

#### 3. Tính interval khi recall_score >= 3
```python
if new_repetitions == 1:
    new_interval = 1
elif new_repetitions == 2:
    new_interval = 6
else:
    new_interval = int(current_interval * new_ef)
```
✅ **Đúng**: Logic này khớp với SM-2:
- Lần 1: interval = 1 ngày
- Lần 2: interval = 6 ngày
- Lần 3+: interval = current_interval × EF

#### 4. Tính next_review_date
```python
next_review_date = datetime.utcnow() + timedelta(days=new_interval)
```
✅ **Đúng**: Ngày ôn tập tiếp theo = hôm nay + interval

#### 5. Giá trị khởi tạo
```python
MIN_EF = 1.3
INITIAL_EF = 2.5
```
✅ **Đúng**: Khớp với SM-2 chuẩn

---

## ⚠️ Vấn đề logic phát hiện được

### 🔴 Vấn đề nghiêm trọng: Tính repetitions không chính xác

**Vị trí**: `backend/app/services/learning_service.py`, hàm `record_review()` (dòng 312-317)

**Code hiện tại**:
```python
repetitions = 0

if prev_activity and prev_activity.is_correct:
    # Count consecutive correct answers
    repetitions = 1
    # Could track this better with a counter field
```

**Vấn đề**:
1. ❌ Logic này **KHÔNG đếm số lần trả lời đúng liên tiếp** thực sự
2. ❌ Chỉ set `repetitions = 1` nếu lần trước đúng, nhưng không tính từ các lần trước đó
3. ❌ Nếu user trả lời đúng 5 lần liên tiếp, code vẫn chỉ set `repetitions = 1`

**Ví dụ minh họa vấn đề**:
- Lần 1: Trả lời đúng (recall_score=5) → repetitions = 1 ✅
- Lần 2: Trả lời đúng (recall_score=5) → repetitions = 1 ❌ (nên là 2)
- Lần 3: Trả lời đúng (recall_score=5) → repetitions = 1 ❌ (nên là 3)
- Lần 4: Trả lời đúng (recall_score=5) → repetitions = 1 ❌ (nên là 4)

**Hậu quả**:
- Interval sẽ luôn được tính như lần đầu tiên (1 ngày hoặc 6 ngày)
- Không bao giờ đạt được interval lớn hơn 6 ngày (trừ khi EF rất cao và current_interval đã lớn)
- Thuật toán SM-2 không hoạt động đúng như mong đợi

**Giải pháp đề xuất**:
Cần đếm số lần trả lời đúng liên tiếp từ các activity trước đó:

```python
# Đếm số lần trả lời đúng liên tiếp
repetitions = 0
if prev_activity and prev_activity.is_correct:
    # Lấy tất cả activities cho term này, sắp xếp theo thời gian giảm dần
    all_activities_statement = (
        select(StudyActivity)
        .where(
            StudyActivity.user_id == user_id,
            StudyActivity.term_id == term_id
        )
        .order_by(StudyActivity.created_at.desc())
    )
    all_activities = session.exec(all_activities_statement).all()
    
    # Đếm số lần trả lời đúng liên tiếp từ lần gần nhất
    for activity in all_activities:
        if activity.is_correct and activity.recall_score >= 3:
            repetitions += 1
        else:
            break  # Dừng khi gặp lần trả lời sai
```

**Hoặc giải pháp tốt hơn**: Lưu `repetitions` vào database trong `StudyActivity` để dễ dàng truy vấn.

---

### ⚠️ Vấn đề nhỏ: Không lưu repetitions vào database

**Vị trí**: `backend/app/models/activity.py`

**Vấn đề**:
- Model `StudyActivity` không có field `repetitions`
- Phải tính lại mỗi lần, không hiệu quả

**Giải pháp đề xuất**:
Thêm field `repetitions` vào `StudyActivity`:
```python
repetitions: int = Field(default=0)  # Số lần trả lời đúng liên tiếp
```

---

### ⚠️ Vấn đề tiềm ẩn: Logic phân loại "Forgotten"

**Vị trí**: `backend/app/services/learning_service.py`, hàm `update_progress_summary()` (dòng 420)

**Code hiện tại**:
```python
elif activity.recall_score < 3:
    forgotten += 1
```

**Vấn đề**:
- Chỉ kiểm tra `recall_score < 3` của activity gần nhất
- Nếu user trả lời sai lần 1, nhưng sau đó trả lời đúng lần 2, term vẫn có thể bị phân loại là "forgotten" nếu logic không đúng

**Giải pháp**:
Logic này có vẻ đúng vì chỉ xét activity gần nhất, nhưng nên rõ ràng hơn trong comment.

---

## Tóm tắt

### ✅ Điểm mạnh
1. Công thức tính EF đúng chuẩn SM-2
2. Logic tính interval đúng
3. Cấu trúc code rõ ràng, dễ maintain
4. Có tài liệu chi tiết

### 🔴 Điểm yếu cần sửa
1. **CRITICAL**: Logic tính `repetitions` không chính xác - cần sửa ngay
2. Nên lưu `repetitions` vào database để tối ưu hiệu suất
3. Cần thêm test cases để đảm bảo logic đúng

### 📋 Khuyến nghị
1. **Ưu tiên cao**: Sửa logic tính `repetitions` trong `record_review()`
2. **Ưu tiên trung bình**: Thêm field `repetitions` vào model `StudyActivity`
3. **Ưu tiên thấp**: Thêm unit tests cho thuật toán SM-2

