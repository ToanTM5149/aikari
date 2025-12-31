# 📚 AI-Powered Flashcard Learning System

## 1. Giới thiệu tổng quan

Hệ thống **Flashcard Web tích hợp Trợ lý ảo AI** là một nền tảng học tập thông minh, cho phép người dùng học tập hiệu quả thông qua flashcard, lớp học và nội dung được cá nhân hóa bởi AI.

Hệ thống được thiết kế theo hướng:
- Triển khai thực tế
- Dễ bảo trì – dễ mở rộng
- AI tích hợp sâu vào từng hoạt động học tập
- Tự xây dựng và host hệ thống workflow AI

---

## 2. Mục tiêu hệ thống

- Cung cấp nền tảng học tập bằng flashcard cho nhiều đối tượng người dùng
- Tích hợp trợ lý ảo AI hỗ trợ học tập theo ngữ cảnh
- Đề xuất nội dung học dựa trên hiệu suất và tiến độ người dùng
- Quản lý lớp học, thống kê học tập cho giáo viên
- Thiết kế kiến trúc backend mở rộng, dễ phát triển lâu dài

---

## 3. Các vai trò người dùng (User Roles)

Hệ thống hỗ trợ **3 vai trò chính**:

| Role     | Mô tả |
|----------|------|
| Admin    | Quản trị toàn hệ thống |
| Teacher  | Giáo viên / người hướng dẫn |
| Student  | Người học |

---

## 4. Chức năng theo từng vai trò

### 4.1 Student (Người học)

#### 📌 Quản lý flashcard cá nhân
- Tạo flashcard mới  
- Xóa flashcard do mình tạo  
- Quản lý flashcard theo **category**  
- Học các flashcard cá nhân  

#### 📌 Học tập & theo dõi tiến độ
- Học flashcard theo nhiều chế độ (lặp lại, kiểm tra nhanh, …)  
- Xem thống kê tiến độ học tập cá nhân:
  - Số flashcard đã học
  - Tỉ lệ nhớ / quên
  - Thời gian học

#### 📌 AI hỗ trợ học tập
- Tương tác với **trợ lý ảo AI trong quá trình học**
- Dùng AI để:
  - Sinh bài test
  - Sinh quiz
  - Sinh đoạn văn (paragraph) dựa trên flashcard đang học

#### 📌 Lớp học
- Tìm kiếm lớp học  
- Tham gia lớp học  

---

### 4.2 Teacher (Giáo viên)

Teacher có **toàn bộ chức năng của Student**, đồng thời có thêm:

#### 📌 Quản lý lớp học
- Tạo lớp học  
- Xóa lớp học  
- Quản lý danh sách học viên trong lớp  

#### 📌 Thống kê & phân tích lớp học
- Xem tiến độ học tập của toàn bộ lớp
- Thống kê:
  - Tỉ lệ nhớ / quên
  - Số flashcard đã hoàn thành
  - Mức độ tiến bộ theo thời gian

---

### 4.3 Admin (Quản trị viên)

#### 📌 Quản lý & giám sát hệ thống
- Xem thống kê toàn bộ hệ thống
- Theo dõi:
  - Số lượng người dùng
  - Hoạt động học tập
  - Hiệu suất sử dụng hệ thống

---

## 5. Trợ lý ảo AI (AI Assistant)

### 5.1 Tích hợp trong từng hoạt động học
- AI được tích hợp trực tiếp trong màn hình học flashcard
- Người dùng có thể đặt câu hỏi hoặc yêu cầu AI hỗ trợ theo ngữ cảnh hiện tại

### 5.2 Chức năng của AI
- Sinh test / quiz theo flashcard set
- Sinh đoạn văn minh họa, giải thích
- Hỗ trợ củng cố kiến thức theo tiến độ học

---

## 6. Backend & Hệ thống đề xuất

### 6.1 Backend đề xuất nội dung
- Phân tích hiệu suất học tập của người dùng
- Đề xuất:
  - Flashcard cần ôn lại
  - Nội dung học phù hợp tiếp theo

### 6.2 Khả năng mở rộng & bảo trì
- Kiến trúc backend theo hướng module hóa
- Dễ mở rộng thêm:
  - Feature học tập
  - AI capability
  - Analytics

---

## 7. Hệ thống AI Workflow (Self-hosted)

- Tự xây dựng và host hệ thống workflow AI
- Không phụ thuộc hoàn toàn vào nền tảng bên thứ ba
- Dễ kiểm soát:
  - Logic xử lý
  - Chi phí
  - Hiệu năng

---

## 8. Tổng kết

Hệ thống hướng đến:
- Một nền tảng học flashcard **thông minh – cá nhân hóa**
- AI không chỉ là chatbot mà là **trợ lý học tập thực thụ**
- Kiến trúc sẵn sàng cho triển khai thực tế và mở rộng lâu dài

