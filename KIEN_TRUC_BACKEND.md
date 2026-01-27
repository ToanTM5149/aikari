# PHÂN TÍCH KIẾN TRÚC BACKEND - AIKARI

## 📋 TỔNG QUAN

Backend của AIKARI được xây dựng bằng **FastAPI** (Python 3.10+), sử dụng kiến trúc **Layered Architecture** (Kiến trúc phân tầng) với các tầng rõ ràng, tách biệt responsibilities.

---

## 🏗️ KIẾN TRÚC TỔNG QUAN - LAYERED ARCHITECTURE

### **Sơ đồ các tầng**:

```
┌─────────────────────────────────────────┐
│  1. API Layer (Presentation Layer)     │  ← HTTP Requests/Responses
├─────────────────────────────────────────┤
│  2. Service Layer (Business Logic)     │  ← Business Rules, Algorithms
├─────────────────────────────────────────┤
│  3. CRUD Layer (Data Access)           │  ← Database Operations
├─────────────────────────────────────────┤
│  4. Model Layer (Data Models)          │  ← Database Schema
└─────────────────────────────────────────┘
```

### **Luồng xử lý**:

```
HTTP Request
    ↓
API Layer (routes)        → Validate, Authenticate, Authorize
    ↓
Service Layer (services)   → Business Logic, Algorithms, External APIs
    ↓
CRUD Layer (crud)         → Database Queries, Transactions
    ↓
Model Layer (models)       → ORM Mapping
    ↓
PostgreSQL Database
```

---

## 📦 PHÂN TÍCH TỪNG TẦNG

### **TẦNG 1: API LAYER (Presentation Layer)**

#### **Nhiệm vụ**:
- Nhận và xử lý HTTP requests
- Validation input (Pydantic schemas)
- Authentication & Authorization
- Serialize responses
- Error handling

#### **Folder thực hiện**: `app/api/`

**Cấu trúc**:
```
app/api/
├── main.py              # Tập hợp tất cả routers
├── deps.py              # Dependencies (DB session, auth)
└── routes/              # Route handlers
    ├── login.py         # Authentication endpoints
    ├── users.py         # User management
    ├── studysets.py     # StudySet CRUD
    ├── learning.py      # Learning session endpoints
    ├── tests.py         # Test management
    ├── chatbot.py       # AI chatbot
    ├── classes.py       # Class management
    ├── categories.py    # Category management
    ├── session.py       # Session tracking
    ├── enrollment.py    # Class enrollment
    ├── admin.py         # Admin operations
    ├── utils.py         # Utility endpoints
    ├── private.py       # Dev-only endpoints
    └── ai.py            # AI generation
```

**14 route modules**, mỗi module quản lý một domain cụ thể.

---

### **TẦNG 2: SERVICE LAYER (Business Logic Layer)**

#### **Nhiệm vụ**:
- Business logic và business rules
- Algorithms (SM-2 spaced repetition)
- External API integration (Dify AI)
- Data transformation
- Complex calculations

#### **Folder thực hiện**: `app/services/`

**Cấu trúc**:
```
app/services/
├── learning_service.py      # Spaced repetition algorithm (SM-2)
├── generation_service.py    # AI test & paragraph generation
├── chatbot_service.py      # Chatbot conversation management
├── dify_service.py         # Dify AI API client
├── session_service.py      # Learning session tracking
├── auth_service.py         # Authentication logic
├── email_service.py        # Email sending
├── analytics_service.py    # Statistics & analytics
└── admin_service.py        # Admin operations
```

**10 service modules**, mỗi service xử lý một business domain:

#### **learning_service.py**
- **Mục đích**: Quản lý logic học tập với thuật toán Spaced Repetition (SM-2)
- **Chức năng chính**:
  - Tính toán next review date dựa trên SM-2 algorithm
  - Lấy term tiếp theo cần review (priority-based)
  - Ghi nhận kết quả học tập và cập nhật progress
  - Tính toán statistics (mastered, reviewing, forgotten terms)
  - Lấy danh sách cards due today/this week (optimized queries)

#### **generation_service.py**
- **Mục đích**: Tạo test questions và paragraphs bằng AI
- **Chức năng chính**:
  - Generate test từ parameters (total_questions, question_types, time_limit)
  - Generate paragraph cho term hoặc studyset
  - Chuẩn bị context để gửi đến Dify AI
  - Parse và validate response từ AI
  - Lưu generated content vào database

#### **chatbot_service.py**
- **Mục đích**: Quản lý conversation flow với AI chatbot
- **Chức năng chính**:
  - State machine cho conversation (initial, collecting_params, generating, completed)
  - Intent detection (gen_test, gen_paragraph, ask_question)
  - Parameter collection từ user messages
  - Điều phối calls đến generation_service
  - Tạo quick reply buttons

#### **dify_service.py**
- **Mục đích**: HTTP client để giao tiếp với Dify AI platform
- **Chức năng chính**:
  - Chat completion API
  - Completion API
  - Conversation history management
  - Workflow execution
  - Error handling và retry logic

#### **session_service.py**
- **Mục đích**: Quản lý learning sessions
- **Chức năng chính**:
  - Tạo và quản lý learning sessions
  - Track session progress
  - Session statistics

#### **auth_service.py**
- **Mục đích**: Logic authentication
- **Chức năng chính**:
  - Login logic
  - Token refresh
  - Password reset

#### **email_service.py**
- **Mục đích**: Gửi email notifications
- **Chức năng chính**:
  - SMTP integration
  - Email templates
  - Send emails (welcome, password reset, etc.)

#### **analytics_service.py**
- **Mục đích**: Tính toán statistics và analytics
- **Chức năng chính**:
  - User statistics
  - Learning progress analytics
  - System metrics

#### **admin_service.py**
- **Mục đích**: Admin operations
- **Chức năng chính**:
  - User management
  - System configuration
  - Admin dashboard data

---

### **TẦNG 3: CRUD LAYER (Data Access Layer)**

#### **Nhiệm vụ**:
- Database operations (Create, Read, Update, Delete)
- Query optimization
- Transaction management
- Relationship handling (N:M via junction tables)
- Cascade deletion logic

#### **Folder thực hiện**: `app/crud/`

**Cấu trúc**:
```
app/crud/
├── user.py              # User CRUD operations
├── studyset.py          # StudySet CRUD operations
├── term.py              # Term CRUD (với cascade deletion)
├── studyset_term.py     # Junction table operations (N:M)
├── student_studyset.py  # Enrollment tracking
├── class_crud.py        # Class management
├── class_member.py      # Membership management
├── category.py          # Category CRUD
└── crud.py              # Base CRUD utilities
```

**10 CRUD modules**, mỗi module quản lý database operations cho một domain:

#### **user.py**
- **Mục đích**: User account operations
- **Chức năng**: Create, read, update, delete users; authentication

#### **studyset.py**
- **Mục đích**: StudySet operations
- **Chức năng**: CRUD studysets; cascade deletion khi xóa studyset

#### **term.py**
- **Mục đích**: Term (flashcard) operations
- **Chức năng**: CRUD terms; manual cascade deletion (StudyActivity, TestAnswer, TestQuestion)

#### **studyset_term.py**
- **Mục đích**: Junction table operations (StudySet ↔ Term N:M)
- **Chức năng**: Add/remove term từ studyset; check term belongs to studyset

#### **student_studyset.py**
- **Mục đích**: Enrollment tracking
- **Chức năng**: Track student enrollment; update last_studied_at

#### **class_crud.py**
- **Mục đích**: Class management
- **Chức năng**: CRUD classes

#### **class_member.py**
- **Mục đích**: Class membership
- **Chức năng**: Add/remove members; manage membership status

#### **category.py**
- **Mục đích**: Category management
- **Chức năng**: CRUD categories

---

### **TẦNG 4: MODEL LAYER (Data Models)**

#### **Nhiệm vụ**:
- Định nghĩa database schema (SQLModel)
- Relationships giữa các models
- Type definitions
- Validation rules

#### **Folder thực hiện**: `app/models/`

**Cấu trúc**:
```
app/models/
├── base.py              # Base model (timestamps)
├── enums.py             # Enum definitions (UserRole, ClassRole, etc.)
├── user.py              # User model
├── studyset.py          # StudySet model
├── term.py              # Term model
├── studyset_term.py     # Junction table model (N:M)
├── test.py              # Test, TestQuestion, TestAnswer, TestAttempt models
├── class_.py            # Class, ClassMember, ClassStudySet models
├── learning_session.py  # LearningSession, SessionReview models
├── student_studyset.py  # Enrollment model
├── activity.py          # StudyActivity model
├── progress.py          # ProgressSummary model
├── content.py           # AIGeneratedContents model
├── category.py          # Category model
├── refresh_token.py     # RefreshToken model
└── conversation.py      # ChatConversation, ChatMessage models
```

**17 model files**, định nghĩa database schema:

#### **base.py**
- **Mục đích**: Base model với common fields
- **Fields**: `created_at`, `updated_at`

#### **enums.py**
- **Mục đích**: Type-safe enumerations
- **Enums**: UserRole, ClassRole, MembershipStatus, QuestionType, etc.

#### **user.py**
- **Mục đích**: User account model
- **Relationships**: study_sets, class_memberships, test_attempts, etc.

#### **studyset.py**
- **Mục đích**: StudySet model
- **Relationships**: owner, category, studyset_terms (N:M), tests, etc.

#### **term.py**
- **Mục đích**: Term (flashcard) model
- **Fields**: term_text, definition, example, image_url, paragraphs (JSONB)
- **Relationships**: studyset_terms (N:M), study_activities

#### **studyset_term.py**
- **Mục đích**: Junction table (StudySet ↔ Term N:M)
- **Fields**: studyset_id, term_id, added_by, added_at, order

#### **test.py**
- **Mục đích**: Test-related models
- **Models**: Test, TestQuestion, TestAnswer, TestAttempt, ReattemptRequest

#### **class_.py**
- **Mục đích**: Class management models
- **Models**: Class, ClassMember, ClassStudySet

#### **learning_session.py**
- **Mục đích**: Learning session tracking
- **Models**: LearningSession, SessionReview

#### **student_studyset.py**
- **Mục đích**: Enrollment tracking
- **Fields**: student_id, studyset_id, last_studied_at

#### **activity.py**
- **Mục đích**: Study activity tracking
- **Fields**: recall_score, ef, interval, repetitions, next_review_date

#### **progress.py**
- **Mục đích**: Progress summary
- **Fields**: mastered_terms, reviewing_terms, forgotten_terms, completion_rate

#### **content.py**
- **Mục đích**: AI-generated content tracking
- **Fields**: source_model, generate_type, prompt, output

#### **category.py**
- **Mục đích**: Category model
- **Relationships**: owner, study_sets

#### **refresh_token.py**
- **Mục đích**: Refresh token management
- **Fields**: jti, user_id, expires_at, revoked

#### **conversation.py**
- **Mục đích**: Chatbot conversation tracking
- **Models**: ChatConversation, ChatMessage

---

## 🔧 CORE COMPONENTS

### **Configuration** (`app/core/config.py`)
- **Mục đích**: Application settings
- **Chức năng**: Load environment variables, validate settings, computed fields (CORS, DB URI)

### **Database** (`app/core/db.py`)
- **Mục đích**: Database connection management
- **Chức năng**: Create engine, connection pooling, connection lifecycle events

### **Security** (`app/core/security.py`)
- **Mục đích**: Security utilities
- **Chức năng**: JWT token creation/validation, password hashing, token revocation

### **Dependencies** (`app/api/deps.py`)
- **Mục đích**: Dependency injection
- **Chức năng**: DB session generator, authentication, authorization helpers

---

## 📊 SCHEMAS LAYER

### **Folder**: `app/schemas/`

**Nhiệm vụ**: API request/response validation (Pydantic)

**Cấu trúc**:
```
app/schemas/
├── user.py              # User schemas (Create, Update, Public)
├── studyset.py          # StudySet schemas
├── term.py              # Term schemas
├── test.py              # Test schemas
├── class_.py            # Class schemas
├── category.py          # Category schemas
├── learning.py          # Learning schemas
├── session.py           # Session schemas
├── chatbot.py           # Chatbot schemas
├── student_studyset.py  # Enrollment schemas
├── admin.py             # Admin schemas
└── common.py            # Common schemas (Message, TokenResponse)
```

**13 schema modules**, mỗi module có:
- `*Create` - Input validation cho create operations
- `*Update` - Input validation cho update operations
- `*Public` - Response models (exclude sensitive data)

---

## 🔄 DATA FLOW TỔNG QUAN

### **Request Flow**:
```
HTTP Request
    ↓
API Layer (routes)        → Validate, Authenticate
    ↓
Service Layer (services)  → Business Logic
    ↓
CRUD Layer (crud)         → Database Operations
    ↓
Model Layer (models)      → ORM Mapping
    ↓
PostgreSQL
```

### **Response Flow**:
```
PostgreSQL
    ↓
Model Layer (models)      → ORM Results
    ↓
CRUD Layer (crud)         → Return Models
    ↓
Service Layer (services)  → Transform Data
    ↓
API Layer (routes)        → Serialize to Schema
    ↓
JSON Response
```

---

## 🎯 DESIGN PATTERNS SỬ DỤNG

1. **Layered Architecture**: Tách biệt concerns theo tầng
2. **Dependency Injection**: FastAPI `Depends()` cho DB sessions, auth
3. **Repository Pattern**: CRUD layer abstracts database operations
4. **Service Layer Pattern**: Business logic tách biệt khỏi API layer
5. **Factory Pattern**: Token creation, DB session generation

---

## 📝 KẾT LUẬN

Backend AIKARI sử dụng **Layered Architecture** với 4 tầng chính:
- ✅ **API Layer**: HTTP handling, validation, auth
- ✅ **Service Layer**: Business logic, algorithms, external APIs
- ✅ **CRUD Layer**: Database operations
- ✅ **Model Layer**: Database schema definition

Kiến trúc này giúp:
- **Separation of Concerns**: Mỗi tầng có responsibility rõ ràng
- **Maintainability**: Dễ maintain và test
- **Scalability**: Có thể scale từng tầng độc lập
- **Reusability**: Services và CRUD có thể reuse
