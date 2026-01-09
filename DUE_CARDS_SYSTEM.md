# Due Cards & Quick Review System

## Tổng quan

Hệ thống thông báo và ôn tập nhanh các cards cần review dựa trên thuật toán SM-2 spaced repetition.

## Các tính năng đã thêm

### 1. Backend API Endpoints

#### `GET /api/v1/learning/due-cards/`
- **Mô tả**: Lấy tất cả cards cần review của user
- **Query Parameters**:
  - `include_future` (boolean): Bao gồm cards due trong 7 ngày tới (mặc định: false)
- **Response**:
  ```json
  {
    "total_due": 10,
    "due_today": 8,
    "due_this_week": 15,
    "cards": [...],
    "studysets_affected": ["uuid1", "uuid2"]
  }
  ```

#### `POST /api/v1/learning/quick-review/start/`
- **Mô tả**: Bắt đầu session review nhanh với due cards
- **Request Body**:
  ```json
  {
    "studyset_ids": null,  // null = tất cả studysets
    "max_cards": 20
  }
  ```
- **Response**:
  ```json
  {
    "session_id": "uuid",
    "total_cards": 10,
    "cards": [...],
    "studysets_included": ["uuid1", "uuid2"],
    "started_at": "2026-01-09T10:00:00"
  }
  ```

### 2. Frontend Components

#### `DueCardsBadge`
- **Location**: `frontend/app/components/shared/due-cards-badge.tsx`
- **Props**:
  - `variant`: "button" | "badge" (mặc định: "badge")
  - `showLabel`: boolean (hiển thị text "Cards Due")
  - `className`: string
- **Tính năng**:
  - Tự động fetch và hiển thị số cards due
  - Animate khi có nhiều cards (>10)
  - Click để navigate đến quick review page
  - Hiển thị tooltip với thông tin chi tiết

#### `QuickReviewPage`
- **Location**: `frontend/app/components/pages/dashboard/quick-review-page.tsx`
- **Route**: `/dashboard/quick-review`
- **Tính năng**:
  - Hiển thị setup screen với stats (total due, studysets affected, etc.)
  - Chọn số lượng cards tối đa (10, 20, 30, 50, 100)
  - Flashcard learning interface với 4 recall buttons
  - Tracking progress và difficulty distribution
  - Auto-complete khi review hết cards

### 3. Dashboard Integration

#### Home Page Updates
- Thêm `DueCardsBadge` ở header
- Card alert hiển thị khi có cards due
- Button "Start Review" navigate đến quick review

## Cách sử dụng

### 1. Hiển thị Due Cards Badge

```tsx
import { DueCardsBadge } from "~/components/shared/due-cards-badge";

// Badge variant
<DueCardsBadge variant="badge" />

// Button variant với label
<DueCardsBadge variant="button" showLabel />
```

### 2. Fetch Due Cards Data

```tsx
import { useGetAllDueCardsQuery } from "~/redux/features/learning";

function MyComponent() {
  const { data: dueCards, isLoading } = useGetAllDueCardsQuery({
    includeFuture: false
  });

  if (dueCards && dueCards.total_due > 0) {
    console.log(`You have ${dueCards.total_due} cards to review!`);
  }
}
```

### 3. Start Quick Review Session

```tsx
import { useStartQuickReviewMutation } from "~/redux/features/learning";

function MyComponent() {
  const [startQuickReview] = useStartQuickReviewMutation();

  const handleStart = async () => {
    const response = await startQuickReview({
      studyset_ids: null,  // Review all due cards
      max_cards: 20
    }).unwrap();
    
    console.log(`Session started with ${response.total_cards} cards`);
  };
}
```

## Database Schema

### StudyActivity
- `next_review_date`: Ngày cần review tiếp theo (calculated by SM-2)
- `ef`: Easiness Factor (độ dễ của card)
- `interval`: Số ngày đến lần review tiếp
- `repetitions`: Số lần trả lời đúng liên tiếp

### ProgressSummary
- `next_due_date`: Ngày review sớm nhất tiếp theo trong studyset

## Flow hoạt động

1. **User mở dashboard**
   - Frontend gọi `GET /api/v1/learning/due-cards/`
   - Backend query StudyActivity với `next_review_date <= now`
   - Trả về danh sách cards due và thống kê

2. **User click vào notification**
   - Navigate đến `/dashboard/quick-review`
   - Hiển thị setup screen với options

3. **User start review session**
   - Frontend gọi `POST /api/v1/learning/quick-review/start/`
   - Backend tạo session với cards due (sorted by priority)
   - Trả về list cards với studyset_id

4. **User review cards**
   - Mỗi card: hiển thị term → flip → chọn recall score (0-5)
   - Submit review: `POST /api/v1/learning/studysets/{id}/review/`
   - Backend update StudyActivity với SM-2 algorithm
   - Next card hoặc complete session

## Testing

### Backend Tests
```bash
cd backend
source .venv/Scripts/activate
python -m pytest tests/api/test_learning_due_cards.py -v
```

### Frontend Manual Testing
1. Tạo vài studysets với terms
2. Review các terms với recall_score < 5
3. Đợi next_review_date pass (hoặc manually update DB)
4. Mở dashboard → thấy due cards badge
5. Click vào badge → navigate đến quick review
6. Start session và review cards

## Notes

- **SM-2 Algorithm**: Cards due được tính dựa trên `next_review_date` field
- **Priority**: Cards được sắp xếp theo thứ tự: oldest due date → newest
- **Auto-refresh**: Due cards badge tự động re-fetch khi submit review
- **Multi-studyset**: Quick review có thể bao gồm cards từ nhiều studysets

## Future Enhancements

- [ ] Push notifications (web/email) khi có cards due
- [ ] Scheduled reminders (daily/weekly digest)
- [ ] Notification preferences trong user settings
- [ ] Due cards calendar view
- [ ] Statistics về review streak và completion rate
- [ ] Gamification: badges, points, leaderboard
