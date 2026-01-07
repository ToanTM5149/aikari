# Thuật toán Spaced Repetition (SM-2)

## Tổng quan

Hệ thống sử dụng thuật toán **SM-2 (SuperMemo 2)** để tối ưu hóa việc học flashcards thông qua spaced repetition (lặp lại ngắt quãng). Thuật toán này tự động điều chỉnh khoảng thời gian giữa các lần ôn tập dựa trên khả năng nhớ lại của người học.

## Các thành phần chính

### 1. Easiness Factor (EF)
- **Giá trị khởi tạo**: 2.5
- **Giá trị tối thiểu**: 1.3
- **Ý nghĩa**: Hệ số đánh giá độ dễ của một flashcard. EF càng cao, flashcard càng dễ nhớ và khoảng thời gian giữa các lần ôn tập càng dài.

### 2. Recall Score (q)
- **Thang điểm**: 0-5
- **Ý nghĩa**: Đánh giá chất lượng nhớ lại của người học
  - **0**: Hoàn toàn không nhớ (complete blackout)
  - **1-2**: Nhớ rất kém
  - **3**: Nhớ được nhưng khó khăn
  - **4**: Nhớ tốt
  - **5**: Nhớ hoàn hảo (perfect recall)

### 3. Interval (Khoảng thời gian)
- **Đơn vị**: Ngày
- **Ý nghĩa**: Số ngày cho đến lần ôn tập tiếp theo

### 4. Repetitions
- **Ý nghĩa**: Số lần trả lời đúng liên tiếp

## Công thức tính toán

### Cập nhật Easiness Factor (EF)

```
EF' = EF + (0.1 - (5 - q) × (0.08 + (5 - q) × 0.02))
EF' = max(EF', 1.3)  // Giới hạn tối thiểu là 1.3
```

**Ví dụ:**
- Nếu q = 5 (perfect recall): EF tăng 0.1
- Nếu q = 4: EF tăng khoảng 0.06
- Nếu q = 3: EF tăng khoảng 0.02
- Nếu q < 3: EF giảm (có thể xuống tối thiểu 1.3)

### Tính khoảng thời gian (Interval)

**Nếu recall_score < 3 (trả lời sai):**
- `new_interval = 1` (ngày)
- `new_repetitions = 0` (reset về 0)

**Nếu recall_score >= 3 (trả lời đúng):**
- `new_repetitions = repetitions + 1`
- Tính interval:
  - **Lần 1** (repetitions = 1): `interval = 1` ngày
  - **Lần 2** (repetitions = 2): `interval = 6` ngày
  - **Lần 3+** (repetitions >= 3): `interval = current_interval × EF`

### Tính ngày ôn tập tiếp theo

```
next_review_date = current_date + interval (ngày)
```

## Ví dụ minh họa

### Scenario 1: Học lần đầu (New Term)
- **EF ban đầu**: 2.5
- **Interval ban đầu**: 0
- **Repetitions**: 0

**Lần học 1:**
- User trả lời đúng với recall_score = 4
- EF mới = 2.5 + 0.06 ≈ 2.56
- Repetitions = 1
- Interval = 1 ngày
- **Next review**: Hôm nay + 1 ngày

**Lần học 2 (sau 1 ngày):**
- User trả lời đúng với recall_score = 5
- EF mới = 2.56 + 0.1 = 2.66
- Repetitions = 2
- Interval = 6 ngày
- **Next review**: Hôm nay + 6 ngày

**Lần học 3 (sau 6 ngày):**
- User trả lời đúng với recall_score = 5
- EF mới = 2.66 + 0.1 = 2.76
- Repetitions = 3
- Interval = 6 × 2.76 ≈ 16 ngày
- **Next review**: Hôm nay + 16 ngày

**Lần học 4 (sau 16 ngày):**
- User trả lời đúng với recall_score = 5
- EF mới = 2.76 + 0.1 = 2.86
- Repetitions = 4
- Interval = 16 × 2.86 ≈ 45 ngày
- **Next review**: Hôm nay + 45 ngày

### Scenario 2: Trả lời sai
- **EF hiện tại**: 2.5
- **Interval hiện tại**: 10 ngày
- **Repetitions**: 3

**Lần học:**
- User trả lời sai với recall_score = 2
- EF mới = 2.5 - 0.14 ≈ 2.36 (nhưng tối thiểu 1.3)
- Repetitions = 0 (reset)
- Interval = 1 ngày (reset)
- **Next review**: Hôm nay + 1 ngày (phải ôn lại ngay)

## Ưu tiên chọn flashcard để học

Hệ thống chọn flashcard theo thứ tự ưu tiên:

1. **Due terms** (Đến hạn ôn tập)
   - Các flashcard có `next_review_date <= now`
   - Sắp xếp theo ngày đến hạn (cũ nhất trước)

2. **New terms** (Chưa học)
   - Các flashcard chưa từng được học

3. **Reviewed terms** (Đã học nhưng chưa đến hạn)
   - Sắp xếp theo EF (thấp nhất trước - khó nhất trước)

## Phân loại trạng thái flashcard

### Mastered (Đã thuộc)
- **Điều kiện**: `EF > 2.5` VÀ `interval > 21 ngày`
- **Ý nghĩa**: Flashcard đã được ghi nhớ tốt, không cần ôn tập thường xuyên

### Reviewing (Đang ôn tập)
- **Điều kiện**: `recall_score >= 3` nhưng chưa đạt điều kiện Mastered
- **Ý nghĩa**: Flashcard đang trong quá trình học, cần ôn tập định kỳ

### Forgotten (Đã quên)
- **Điều kiện**: `recall_score < 3`
- **Ý nghĩa**: Flashcard khó nhớ, cần ôn tập lại ngay

## Lợi ích của thuật toán

1. **Tối ưu thời gian học**: Tập trung vào các flashcard khó nhớ
2. **Tăng hiệu quả ghi nhớ**: Ôn tập đúng thời điểm (khi sắp quên)
3. **Cá nhân hóa**: Mỗi flashcard có lịch ôn tập riêng dựa trên khả năng của người học
4. **Tự động điều chỉnh**: EF tự động thay đổi theo hiệu suất học tập

## Implementation trong code

### File chính
- `backend/app/services/learning_service.py`: Chứa class `SpacedRepetitionSM2` và `LearningService`
- `backend/app/api/routes/learning.py`: API endpoints cho learning

### Các hàm quan trọng
- `SpacedRepetitionSM2.calculate_next_review()`: Tính toán EF, interval, và next_review_date
- `LearningService.get_next_term_to_review()`: Chọn flashcard tiếp theo để học
- `LearningService.record_review()`: Ghi nhận kết quả học và cập nhật thông tin
- `LearningService.update_progress_summary()`: Cập nhật tiến độ tổng thể

## Database Schema

### StudyActivity Table
- `ef`: Easiness Factor (float)
- `interval`: Khoảng thời gian đến lần ôn tiếp theo (int, ngày)
- `next_review_date`: Ngày ôn tập tiếp theo (datetime)
- `recall_score`: Điểm đánh giá (0-5)
- `is_correct`: Đúng/Sai (boolean)

### ProgressSummary Table
- `mastered_terms`: Số flashcard đã thuộc
- `reviewing_terms`: Số flashcard đang ôn tập
- `forgotten_terms`: Số flashcard đã quên
- `completion_rate`: Tỷ lệ hoàn thành (%)
- `next_due_date`: Ngày ôn tập sớm nhất tiếp theo

