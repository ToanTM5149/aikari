# Danh sách các chức năng chính cần phân rã Use Case

Dựa trên biểu đồ Use Case tổng quan và phân tích hệ thống, các chức năng sau đây cần được phân rã thành các use case chi tiết do tính phức tạp và có nhiều bước con:

## 1. Quản lý flashcard (Student)

**Use case gốc:** Quản lý flashcard

**Các use case con cần phân rã:**
- Tạo bộ flashcard mới
- Chỉnh sửa thông tin bộ flashcard
- Xóa bộ flashcard
- Thêm flashcard vào bộ
- Chỉnh sửa flashcard
- Xóa flashcard
- Quản lý flashcard theo category (gán category, thay đổi category)
- Sao chép flashcard
- Import/Export flashcard

**Lý do phân rã:** Chức năng này bao gồm nhiều hoạt động CRUD khác nhau, mỗi hoạt động có quy trình và luồng xử lý riêng.

\textbf{Kết luận:} \textbf{Biểu đồ \ref{fig:usecase_quanlyflashcard}} mô tả cách học sinh thực hiện các thao tác quản lý flashcard trên hệ thống. Thông qua Use Case chính là "Quản lý flashcard", học sinh có thể tạo, chỉnh sửa, xóa bộ flashcard và các flashcard cá nhân, đồng thời quản lý chúng theo category và thực hiện các thao tác sao chép, import/export. Các chức năng này cho phép học sinh tổ chức hiệu quả nội dung học tập của mình, đảm bảo tính linh hoạt và dễ dàng trong việc quản lý tài liệu học tập.

---

## 2. Học flashcard (Student)

**Use case gốc:** Học flashcard

**Các use case con cần phân rã:**
- Bắt đầu phiên học flashcard
- Học flashcard theo chế độ lặp lại (spaced repetition)
- Học flashcard theo chế độ kiểm tra nhanh
- Học flashcard theo chế độ ngẫu nhiên (random)
- Xem mặt trước flashcard
- Lật flashcard để xem mặt sau
- Đánh giá mức độ nhớ (recall score)
- Kết thúc phiên học
- Tương tác với AI trong quá trình học (hỏi đáp, yêu cầu giải thích)
- Yêu cầu AI sinh test/quiz từ flashcard
- Yêu cầu AI sinh đoạn văn minh họa

**Lý do phân rã:** Chức năng học có nhiều chế độ khác nhau, tích hợp AI, và có nhiều bước trong quy trình học tập.

\textbf{Kết luận:} \textbf{Biểu đồ \ref{fig:usecase_hocflashcard}} mô tả cách học sinh thực hiện quá trình học tập với flashcard trên hệ thống. Thông qua Use Case chính là "Học flashcard", học sinh có thể bắt đầu phiên học, học theo nhiều chế độ khác nhau (lặp lại, kiểm tra nhanh, ngẫu nhiên), đánh giá mức độ nhớ, và tương tác với AI để được hỗ trợ học tập. Các chức năng này cho phép học sinh học tập hiệu quả với nhiều phương thức khác nhau, tận dụng công nghệ AI để nâng cao trải nghiệm học tập và củng cố kiến thức.

---

## 3. Làm kiểm tra (Student)

**Use case gốc:** Làm kiểm tra

**Các use case con cần phân rã:**
- Xem danh sách bài kiểm tra có sẵn
- Bắt đầu làm bài kiểm tra
- Trả lời câu hỏi trắc nghiệm
- Trả lời câu hỏi điền từ
- Trả lời câu hỏi tự luận
- Xem lại câu trả lời trước khi nộp
- Nộp bài kiểm tra
- Xem kết quả bài kiểm tra
- Xem đáp án đúng (nếu được phép)
- Yêu cầu làm lại bài kiểm tra (nếu được phép)
- Xem lịch sử các lần làm bài

**Lý do phân rã:** Quy trình làm bài kiểm tra có nhiều bước, nhiều loại câu hỏi khác nhau, và có các luồng xử lý phức tạp.

\textbf{Kết luận:} \textbf{Biểu đồ \ref{fig:usecase_lamkiemtra}} mô tả cách học sinh thực hiện các thao tác làm bài kiểm tra trên hệ thống. Thông qua Use Case chính là "Làm kiểm tra", học sinh có thể xem danh sách bài kiểm tra, bắt đầu làm bài, trả lời các loại câu hỏi khác nhau (trắc nghiệm, điền từ, tự luận), nộp bài và xem kết quả. Các chức năng này cho phép học sinh đánh giá kiến thức một cách toàn diện, theo dõi tiến độ học tập và cải thiện hiệu quả học tập thông qua việc làm lại bài kiểm tra khi được phép.

---

## 4. Quản lý lịch sử kiểm tra (Student)

**Use case gốc:** Quản lý lịch sử kiểm tra

**Các use case con cần phân rã:**
- Xem danh sách lịch sử kiểm tra
- Xem chi tiết kết quả một bài kiểm tra
- Lọc lịch sử theo thời gian
- Lọc lịch sử theo bộ flashcard
- Lọc lịch sử theo lớp học
- Xem thống kê tổng hợp kết quả
- Xuất báo cáo kết quả

**Lý do phân rã:** Có nhiều cách xem và phân tích lịch sử, cần các use case riêng cho từng chức năng.

\textbf{Kết luận:} \textbf{Biểu đồ \ref{fig:usecase_quanlylichsukiemtra}} mô tả cách học sinh quản lý và xem lại lịch sử kiểm tra trên hệ thống. Thông qua Use Case chính là "Quản lý lịch sử kiểm tra", học sinh có thể xem danh sách và chi tiết kết quả các bài kiểm tra đã làm, lọc lịch sử theo nhiều tiêu chí khác nhau, và xuất báo cáo kết quả. Các chức năng này cho phép học sinh theo dõi tiến độ học tập một cách chi tiết, phân tích hiệu suất học tập và đưa ra các quyết định cải thiện phù hợp.

---

## 5. Quản lý lớp học (Teacher)

**Use case gốc:** Quản lý lớp học

**Các use case con cần phân rã:**
- Tạo lớp học mới
- Chỉnh sửa thông tin lớp học
- Xóa lớp học
- Mời học sinh vào lớp (theo email/username)
- Chấp nhận yêu cầu tham gia lớp
- Từ chối yêu cầu tham gia lớp
- Xóa học sinh khỏi lớp
- Thay đổi vai trò học sinh (thành co-teacher)
- Thêm bộ flashcard vào lớp
- Xóa bộ flashcard khỏi lớp
- Tạo mã tham gia lớp (class code)
- Xem danh sách thành viên lớp

**Lý do phân rã:** Quản lý lớp học bao gồm nhiều hoạt động quản lý thành viên, quản lý nội dung, và các quy trình phê duyệt.

\textbf{Kết luận:} \textbf{Biểu đồ \ref{fig:usecase_quanlylophoc}} mô tả cách giáo viên thực hiện các thao tác quản lý lớp học trên hệ thống. Thông qua Use Case chính là "Quản lý lớp học", giáo viên có thể tạo, chỉnh sửa, xóa lớp học, quản lý thành viên (mời, chấp nhận, từ chối, xóa), quản lý nội dung học tập và tạo mã tham gia lớp. Các chức năng này cho phép giáo viên kiểm soát hiệu quả hoạt động của lớp học, quản lý học sinh và nội dung giảng dạy một cách có tổ chức, đảm bảo môi trường học tập tốt nhất cho học sinh.

---

## 6. Quản lý bài kiểm tra (Teacher)

**Use case gốc:** Quản lý bài kiểm tra

**Các use case con cần phân rã:**
- Tạo bài kiểm tra mới
- Chỉnh sửa thông tin bài kiểm tra
- Xóa bài kiểm tra
- Cấu hình loại câu hỏi (trắc nghiệm, điền từ, tự luận)
- Cấu hình số lượng câu hỏi
- Cấu hình thời gian làm bài
- Cấu hình hiển thị đáp án
- Xem danh sách câu hỏi trong bài kiểm tra
- Xem kết quả làm bài của học sinh
- Xử lý yêu cầu làm lại bài (reattempt request)
- Chấp nhận/từ chối yêu cầu làm lại
- Yêu cầu AI tạo bài kiểm tra tự động

**Lý do phân rã:** Tạo và quản lý bài kiểm tra có nhiều bước cấu hình, quản lý câu hỏi, và xử lý kết quả.

\textbf{Kết luận:} \textbf{Biểu đồ \ref{fig:usecase_quanlybaikiemtra} mô tả cách giáo viên thực hiện các thao tác quản lý bài kiểm tra trên hệ thống. Thông qua Use Case chính là "Quản lý bài kiểm tra", giáo viên có thể tạo, chỉnh sửa, xóa bài kiểm tra, cấu hình các thông số (loại câu hỏi, số lượng, thời gian, hiển thị đáp án), xem kết quả làm bài của học sinh và xử lý yêu cầu làm lại bài. Các chức năng này cho phép giáo viên tạo và quản lý bài kiểm tra một cách linh hoạt, đánh giá chính xác năng lực học sinh và hỗ trợ học sinh cải thiện kết quả học tập.

---

## 7. Quản lý nội dung học tập (Teacher)

**Use case gốc:** Quản lý nội dung học tập

**Các use case con cần phân rã:**
- Tạo bộ flashcard cho lớp học
- Chỉnh sửa bộ flashcard
- Xóa bộ flashcard
- Gán bộ flashcard cho lớp học
- Hủy gán bộ flashcard khỏi lớp học
- Tạo tài liệu học tập
- Chỉnh sửa tài liệu học tập
- Xóa tài liệu học tập
- Phân loại nội dung theo chủ đề

**Lý do phân rã:** Quản lý nội dung bao gồm nhiều loại tài nguyên khác nhau và các hoạt động quản lý riêng biệt.

\textbf{Kết luận:} \textbf{Biểu đồ \ref{fig:usecase_quanlynoidunghoctap}} mô tả cách giáo viên thực hiện các thao tác quản lý nội dung học tập trên hệ thống. Thông qua Use Case chính là "Quản lý nội dung học tập", giáo viên có thể tạo, chỉnh sửa, xóa bộ flashcard và tài liệu học tập, gán hoặc hủy gán nội dung cho lớp học, và phân loại nội dung theo chủ đề. Các chức năng này cho phép giáo viên tổ chức và quản lý tài nguyên học tập một cách hiệu quả, đảm bảo học sinh có đầy đủ tài liệu cần thiết cho việc học tập.

---

## 8. Xem thống kê lớp học (Teacher)

**Use case gốc:** Xem thống kê lớp học

**Các use case con cần phân rã:**
- Xem thống kê tổng quan lớp học
- Xem tiến độ học tập của từng học sinh
- Xem thống kê tỉ lệ nhớ/quên
- Xem thống kê số flashcard đã hoàn thành
- Xem thống kê mức độ tiến bộ theo thời gian
- Xem thống kê kết quả bài kiểm tra
- Lọc thống kê theo khoảng thời gian
- Lọc thống kê theo bộ flashcard
- Xuất báo cáo thống kê

**Lý do phân rã:** Có nhiều loại thống kê khác nhau, mỗi loại có cách hiển thị và phân tích riêng.

\textbf{Kết luận:} \textbf{Biểu đồ \ref{fig:usecase_xemthongkelophoc}} mô tả cách giáo viên xem và phân tích thống kê lớp học trên hệ thống. Thông qua Use Case chính là "Xem thống kê lớp học", giáo viên có thể xem thống kê tổng quan, tiến độ học tập của từng học sinh, tỉ lệ nhớ/quên, số flashcard đã hoàn thành, mức độ tiến bộ theo thời gian và kết quả bài kiểm tra. Các chức năng này cho phép giáo viên theo dõi và đánh giá hiệu quả học tập của lớp học một cách chi tiết, từ đó đưa ra các biện pháp hỗ trợ và cải thiện phù hợp cho học sinh.

---

## 9. Tham gia vào lớp học (Student)

**Use case gốc:** Tham gia vào lớp học

**Các use case con cần phân rã:**
- Tìm kiếm lớp học công khai
- Tham gia lớp học bằng mã lớp (class code)
- Gửi yêu cầu tham gia lớp học
- Xem danh sách lớp học đã tham gia
- Xem chi tiết lớp học
- Rời khỏi lớp học
- Xem danh sách bộ flashcard trong lớp
- Xem danh sách bài kiểm tra trong lớp

**Lý do phân rã:** Quy trình tham gia lớp học có nhiều cách thức và các bước xử lý khác nhau.

\textbf{Kết luận:} \textbf{Biểu đồ \ref{fig:usecase_thamgialophoc}} mô tả cách học sinh tham gia và tương tác với lớp học trên hệ thống. Thông qua Use Case chính là "Tham gia vào lớp học", học sinh có thể tìm kiếm lớp học công khai, tham gia bằng mã lớp, gửi yêu cầu tham gia, xem danh sách và chi tiết lớp học, rời khỏi lớp học, và xem các tài nguyên học tập trong lớp. Các chức năng này cho phép học sinh dễ dàng tham gia vào các lớp học phù hợp, tiếp cận nội dung học tập và bài kiểm tra một cách thuận tiện.

---

## 10. Xem tiến độ học tập (Student)

**Use case gốc:** Xem tiến độ học tập

**Các use case con cần phân rã:**
- Xem tổng quan tiến độ học tập
- Xem số flashcard đã học
- Xem tỉ lệ nhớ/quên
- Xem thời gian học tập
- Xem tiến độ theo từng bộ flashcard
- Xem biểu đồ tiến độ theo thời gian
- Xem flashcard cần ôn lại (due cards)
- Lọc tiến độ theo khoảng thời gian
- Xuất báo cáo tiến độ

**Lý do phân rã:** Có nhiều cách xem và phân tích tiến độ, mỗi cách có mục đích và cách hiển thị riêng.

\textbf{Kết luận:} \textbf{Biểu đồ \ref{fig:usecase_xemtiendohoctap}} mô tả cách học sinh xem và theo dõi tiến độ học tập trên hệ thống. Thông qua Use Case chính là "Xem tiến độ học tập", học sinh có thể xem tổng quan tiến độ, số flashcard đã học, tỉ lệ nhớ/quên, thời gian học tập, tiến độ theo từng bộ flashcard, biểu đồ tiến độ theo thời gian và danh sách flashcard cần ôn lại. Các chức năng này cho phép học sinh tự đánh giá hiệu quả học tập của mình, xác định các điểm cần cải thiện và lập kế hoạch học tập phù hợp.

---

## 11. Quản lý category (Student)

**Use case gốc:** Quản lý category

**Các use case con cần phân rã:**
- Tạo category mới
- Chỉnh sửa category
- Xóa category
- Gán flashcard vào category
- Xóa flashcard khỏi category
- Xem danh sách flashcard theo category
- Sắp xếp category

**Lý do phân rã:** Quản lý category bao gồm các hoạt động CRUD và quản lý mối quan hệ với flashcard.

\textbf{Kết luận:} \textbf{Biểu đồ \ref{fig:usecase_quanlycategory} mô tả cách học sinh quản lý danh mục (category) để phân loại flashcard trên hệ thống. Thông qua Use Case chính là "Quản lý category", học sinh có thể tạo, chỉnh sửa, xóa category, gán hoặc xóa flashcard khỏi category, xem danh sách flashcard theo category và sắp xếp category. Các chức năng này cho phép học sinh tổ chức flashcard một cách có hệ thống, dễ dàng tìm kiếm và quản lý nội dung học tập theo các chủ đề khác nhau.

---

## 12. Quản lý người dùng (Admin)

**Use case gốc:** Quản lý người dùng

**Các use case con cần phân rã:**
- Xem danh sách người dùng
- Tạo tài khoản người dùng mới
- Chỉnh sửa thông tin người dùng
- Xóa tài khoản người dùng
- Thay đổi vai trò người dùng (Student/Teacher/Admin)
- Khóa/Mở khóa tài khoản
- Xem chi tiết hoạt động của người dùng
- Tìm kiếm người dùng
- Lọc người dùng theo vai trò
- Lọc người dùng theo trạng thái

**Lý do phân rã:** Quản lý người dùng là chức năng quan trọng với nhiều hoạt động quản trị khác nhau.

\textbf{Kết luận:} \textbf{Biểu đồ \ref{fig:usecase_quanlynguoidung}} mô tả cách quản trị viên thực hiện các thao tác quản trị người dùng trên hệ thống. Thông qua Use Case chính là "Quản lý người dùng", Admin có thể xem danh sách, tạo mới, chỉnh sửa và xóa người dùng, thay đổi vai trò, khóa/mở khóa tài khoản, xem chi tiết hoạt động, tìm kiếm và lọc người dùng. Các chức năng này cho phép quản trị viên kiểm soát hiệu quả cơ sở dữ liệu người dùng, đảm bảo tính chính xác, bảo mật và cập nhật thông tin kịp thời.

---

## 13. Xem thống kê toàn hệ thống (Admin)

**Use case gốc:** Xem thống kê toàn hệ thống

**Các use case con cần phân rã:**
- Xem tổng quan hệ thống
- Xem thống kê số lượng người dùng
- Xem thống kê hoạt động học tập
- Xem thống kê hiệu suất sử dụng hệ thống
- Xem thống kê theo vai trò người dùng
- Xem thống kê theo khoảng thời gian
- Xem thống kê lớp học
- Xem thống kê flashcard
- Xuất báo cáo hệ thống

**Lý do phân rã:** Có nhiều loại thống kê khác nhau cần theo dõi và phân tích.

\textbf{Kết luận:} \textbf{Biểu đồ \ref{fig:usecase_xemthongketoanhethong}} mô tả cách quản trị viên xem và phân tích thống kê toàn hệ thống. Thông qua Use Case chính là "Xem thống kê toàn hệ thống", Admin có thể xem tổng quan hệ thống, thống kê số lượng người dùng, hoạt động học tập, hiệu suất sử dụng hệ thống, thống kê theo vai trò, theo khoảng thời gian, thống kê lớp học và flashcard. Các chức năng này cho phép quản trị viên theo dõi và đánh giá hiệu quả hoạt động của toàn bộ hệ thống, từ đó đưa ra các quyết định quản lý và cải thiện hệ thống phù hợp.

---

## 14. Quản lý thông tin cá nhân (Student/Teacher)

**Use case gốc:** Quản lý thông tin người dùng

**Các use case con cần phân rã:**
- Xem thông tin cá nhân
- Cập nhật thông tin cá nhân
- Thay đổi mật khẩu
- Cập nhật ảnh đại diện
- Cập nhật thông tin liên hệ
- Xem lịch sử hoạt động cá nhân

**Lý do phân rã:** Quản lý thông tin cá nhân bao gồm nhiều loại thông tin và các hoạt động cập nhật khác nhau.

\textbf{Kết luận:} \textbf{Biểu đồ \ref{fig:usecase_quanlythongtincanhan}} mô tả cách người dùng (học sinh và giáo viên) quản lý thông tin cá nhân trên hệ thống. Thông qua Use Case chính là "Quản lý thông tin người dùng", người dùng có thể xem, cập nhật thông tin cá nhân, thay đổi mật khẩu, cập nhật ảnh đại diện, thông tin liên hệ và xem lịch sử hoạt động cá nhân. Các chức năng này cho phép người dùng duy trì thông tin tài khoản chính xác và cập nhật, đảm bảo tính bảo mật và theo dõi hoạt động học tập của bản thân.

---

## Tổng kết

Các chức năng trên đều có tính phức tạp cao, bao gồm nhiều bước xử lý, nhiều luồng nghiệp vụ, hoặc tích hợp với các hệ thống khác (như AI). Việc phân rã các use case này sẽ giúp:

1. **Làm rõ quy trình:** Mỗi use case con mô tả một bước hoặc một luồng xử lý cụ thể
2. **Dễ dàng phát triển:** Có thể phát triển và test từng use case con độc lập
3. **Dễ bảo trì:** Khi có thay đổi, chỉ cần cập nhật use case con liên quan
4. **Tài liệu hóa tốt hơn:** Mô tả chi tiết hơn về cách hệ thống hoạt động
