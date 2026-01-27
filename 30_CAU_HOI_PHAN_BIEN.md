# 30 CÂU HỎI PHẢN BIỆN VỀ HỆ THỐNG AIKARI
## Vai trò: Phó Giáo sư, Tiến sĩ - Đánh giá hệ thống học tập Flashcard tích hợp AI

---

## PHẦN 1: KIẾN TRÚC VÀ THIẾT KẾ HỆ THỐNG (10 câu)

### 1. **Vấn đề về Cascade Deletion và Data Integrity**
Trong `backend/app/crud/term.py`, khi xóa một Term, hệ thống phải xóa thủ công các TestAnswer trước khi xóa TestQuestion để tránh lỗi NOT NULL constraint. Tại sao không sử dụng database-level cascade hoặc soft delete để tránh mất dữ liệu lịch sử học tập của học sinh? Làm thế nào hệ thống đảm bảo tính toàn vẹn dữ liệu khi có nhiều người dùng xóa đồng thời?

### 2. **Timezone Handling và Consistency**
Trong `backend/app/services/learning_service.py`, hệ thống hardcode timezone UTC+7 cho việc tính toán `next_review_date`. Điều này sẽ gây vấn đề gì khi người dùng ở múi giờ khác? Tại sao không lưu timezone preference của user và tính toán động? Làm thế nào xử lý Daylight Saving Time (DST)?

### 3. **N+1 Query Problem và Performance**
Mặc dù có optimization trong `backend/app/api/routes/studysets.py` với bulk queries, nhưng trong `learning_service.py` vẫn có nhiều vòng lặp query database. Với 10,000 users và mỗi user có 100 studysets, hệ thống sẽ phải thực hiện bao nhiêu queries? Có kế hoạch nào để implement database indexing và query optimization không?

### 4. **Transaction Management và Rollback Strategy**
Trong `generation_service.py`, có nhiều `session.commit()` và `session.flush()` nhưng không thấy transaction wrapper. Nếu AI generation thành công nhưng lưu vào database thất bại ở bước cuối, dữ liệu sẽ ở trạng thái nào? Có cơ chế retry hoặc compensation transaction không?

### 5. **Relationship Design: N:M vs Denormalization**
Hệ thống sử dụng junction table `StudySetTerm` cho quan hệ N:M giữa Term và StudySet, nhưng trong `SessionReview` lại có field `studyset_id` (denormalization). Tại sao lại có sự không nhất quán này? Khi nào nên denormalize và khi nào nên giữ normalized?

### 6. **Error Handling và User Experience**
Khi Dify API fail trong `dify_service.py`, hệ thống chỉ log error và raise exception. Người dùng sẽ thấy gì? Có cơ chế fallback hoặc retry với exponential backoff không? Làm thế nào để user biết được lỗi là tạm thời hay vĩnh viễn?

### 7. **Security: JWT Token Management**
Trong `security.py`, access token có JTI nhưng không có blacklist mechanism. Nếu một token bị compromise, làm thế nào để revoke ngay lập tức? Refresh token được lưu trong cookie, nhưng nếu user logout trên nhiều devices, làm thế nào đảm bảo tất cả tokens đều bị revoke?

### 8. **Scalability: Database Connection Pooling**
Trong `db.py`, connection pool size là 10 với max_overflow 20. Với 1000 concurrent users, mỗi request cần 2-3 queries, hệ thống sẽ xử lý như thế nào? Có monitoring và alerting khi pool exhausted không?

### 9. **Data Consistency: Race Conditions**
Khi nhiều users cùng học một Term và update `StudyActivity` đồng thời, có race condition không? Làm thế nào đảm bảo `repetitions` và `ef` được tính toán chính xác? Có sử dụng database locks hoặc optimistic locking không?

### 10. **API Design: RESTful vs RPC-style**
Một số endpoints như `/chatbot/studysets/{id}/chat` là RPC-style, trong khi các endpoints khác là RESTful. Tại sao không nhất quán? Có kế hoạch nào để standardize API design pattern không?

---

## PHẦN 2: BUSINESS LOGIC VÀ ALGORITHM (8 câu)

### 11. **SM-2 Algorithm Implementation**
Thuật toán SM-2 trong `learning_service.py` có hardcode các giá trị như `INITIAL_EF = 2.5`, `MIN_EF = 1.3`. Có nghiên cứu nào chứng minh các giá trị này phù hợp với người Việt Nam không? Tại sao không cho phép user customize các tham số này?

### 12. **Learning Progress Calculation**
Trong `update_progress_summary()`, hệ thống tính `mastered_terms` dựa trên `ef > 2.5 AND interval > 21`. Tiêu chí này có được validate với nghiên cứu giáo dục không? Làm thế nào xử lý trường hợp user học "vẹt" (memorize without understanding)?

### 13. **Term Reusability và Data Duplication**
Một Term có thể thuộc nhiều StudySet (N:M relationship). Khi user sửa Term trong StudySet A, nó có ảnh hưởng đến StudySet B không? Nếu có, đây có phải là bug hay feature? Làm thế nào để user biết Term đang được dùng ở đâu?

### 14. **AI Generation Quality Control**
Khi AI generate test questions trong `generation_service.py`, hệ thống không có validation về chất lượng câu hỏi. Làm thế nào đảm bảo câu hỏi không có bias, không offensive, và phù hợp với trình độ học sinh? Có cơ chế human review không?

### 15. **Session Management và State**
`LearningSession` có status ACTIVE, COMPLETED, ABANDONED. Nếu user đóng browser giữa chừng, session sẽ ở trạng thái nào? Có timeout mechanism không? Làm thế nào để resume một abandoned session?

### 16. **Test Attempt và Reattempt Logic**
Trong model `ReattemptRequest`, học sinh có thể yêu cầu làm lại test. Logic phê duyệt này được implement ở đâu? Làm thế nào đảm bảo teacher không bị spam requests? Có rate limiting không?

### 17. **Class Membership và Access Control**
Trong `check_studyset_access()`, user có access nếu là owner hoặc active member của class. Nhưng nếu user bị remove khỏi class giữa chừng, các test attempts đã làm sẽ như thế nào? Có audit log để track access changes không?

### 18. **Paragraph Generation và Storage**
Khi generate paragraph cho một Term, hệ thống lưu vào `term.paragraphs` (JSONB array). Nếu generate nhiều lần, array sẽ phình to. Có giới hạn số lượng paragraphs không? Làm thế nào để user quản lý và xóa paragraphs cũ?

---

## PHẦN 3: SECURITY VÀ PRIVACY (6 câu)

### 19. **Password Security và Hashing**
Hệ thống sử dụng bcrypt để hash password, nhưng không thấy mention về password policy (minimum length, complexity). Có validation ở đâu? Làm thế nào ngăn chặn brute force attacks? Có account lockout mechanism không?

### 20. **API Rate Limiting**
Không thấy rate limiting middleware trong codebase. Làm thế nào ngăn chặn DDoS attacks hoặc abuse? Một user có thể gửi 1000 requests/second để generate tests, hệ thống sẽ xử lý như thế nào?

### 21. **Input Validation và SQL Injection**
Mặc dù SQLModel/SQLAlchemy có parameterized queries, nhưng trong một số nơi có sử dụng `f"%{q}%"` với `ilike()`. Có nguy cơ SQL injection không? Làm thế nào validate và sanitize user input, đặc biệt là trong chatbot messages?

### 22. **CORS và XSS Protection**
CORS được config trong `settings.py`, nhưng không thấy CSRF token mechanism. Làm thế nào bảo vệ khỏi CSRF attacks? Frontend có implement Content Security Policy (CSP) không?

### 23. **Data Privacy và GDPR Compliance**
Hệ thống lưu trữ learning data của học sinh. Có cơ chế nào để user export hoặc delete toàn bộ data của mình không? Làm thế nào đảm bảo compliance với GDPR hoặc các quy định bảo vệ dữ liệu cá nhân?

### 24. **Third-party API Security**
Dify API key được lưu trong environment variable, nhưng khi gửi request, có logging không? Nếu log chứa API key, đây là security risk. Làm thế nào đảm bảo API keys không bị leak qua logs hoặc error messages?

---

## PHẦN 4: TESTING VÀ QUALITY ASSURANCE (6 câu)

### 25. **Test Coverage và Edge Cases**
Trong `tests/crud/test_deletion_bugfixes.py`, có test cho deletion scenarios. Nhưng coverage cho toàn bộ codebase là bao nhiêu? Có test cho race conditions, concurrent updates không? Làm thế nào test AI generation với mock responses?

### 26. **Integration Testing với External Services**
Hệ thống phụ thuộc vào Dify API. Làm thế nào test khi Dify API down hoặc trả về unexpected response? Có contract testing hoặc API mocking strategy không?

### 27. **Performance Testing và Load Testing**
Với 1000 concurrent users, mỗi user có 50 studysets, hệ thống sẽ xử lý như thế nào? Có load testing results không? Database có thể handle bao nhiêu queries per second? Có bottleneck nào không?

### 28. **Error Monitoring và Observability**
Hệ thống có logging, nhưng có centralized error tracking (Sentry) không? Làm thế nào monitor và alert khi có errors? Có metrics dashboard để track system health không?

### 29. **Data Migration và Backward Compatibility**
Có nhiều Alembic migrations trong codebase. Làm thế nào đảm bảo migrations không break production data? Có rollback strategy không? Làm thế nào test migrations với production-like data?

### 30. **Documentation và Code Maintainability**
Codebase có README, nhưng có API documentation (OpenAPI/Swagger) không? Có architecture decision records (ADRs) không? Làm thế nào developer mới có thể onboard nhanh chóng? Code comments có đủ để hiểu business logic không?

---

## PHẦN 5: 3 CÂU HỎI VỀ SỬ DỤNG CODE VÀ THÊM TÍNH NĂNG NHỎ

### 31. **Thêm validation cho recall_score trong API**
Hiện tại trong `learning_service.py`, `recall_score` được truyền vào hàm `record_review()` nhưng không có validation ở API layer. Làm thế nào để:
- Thêm Pydantic validator trong schema để đảm bảo `recall_score` chỉ nhận giá trị 0-5?
- Trả về error message rõ ràng nếu user gửi giá trị ngoài range?
- Cần sửa file nào: `app/schemas/learning.py` và `app/api/routes/learning.py`?

### 32. **Thêm endpoint đếm số cards due today**
Trong `learning_service.py` đã có hàm `get_all_due_cards()`, nhưng chưa có endpoint đơn giản để lấy chỉ số lượng. Làm thế nào để:
- Tạo endpoint `GET /api/v1/learning/due-cards/count` trả về `{"due_today": 5, "due_this_week": 12}`?
- Tối ưu query để chỉ count, không load toàn bộ data?
- Cần thêm vào file nào: `app/api/routes/learning.py`?

### 33. **Thêm sort option cho studysets list**
Endpoint `GET /api/v1/studysets/` hiện tại chỉ sort theo `created_at DESC`. Làm thế nào để:
- Thêm query parameter `sort_by` với options: `created_at`, `last_activity`, `title`, `term_count`?
- Thêm `order` parameter: `asc` hoặc `desc`?
- Implement sorting logic trong `app/api/routes/studysets.py` mà không làm chậm query?

---

## KẾT LUẬN

Những câu hỏi trên nhằm mục đích:
1. **Đánh giá tính robust** của hệ thống
2. **Xác định potential issues** trước khi scale
3. **Đảm bảo security và privacy** compliance
4. **Cải thiện user experience** và maintainability
5. **Chuẩn bị cho future enhancements**

Hệ thống có foundation tốt, nhưng cần address các vấn đề về scalability, security, và error handling trước khi deploy production với scale lớn.
