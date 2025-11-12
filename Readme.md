# AIKARI - Full Stack Application

## 📋 Tổng quan

AIKARI là một ứng dụng full-stack hiện đại được xây dựng với:
- **Frontend**: React Router v7 + TypeScript + Tailwind CSS v4 + Chakra UI
- **Backend**: FastAPI + Python 3.10+ + SQLModel + PostgreSQL
- **Database**: PostgreSQL với Alembic migrations
- **Authentication**: JWT tokens với OAuth2
- **Email**: Hỗ trợ gửi email với MJML templates

## 🏗️ Cấu trúc Dự án

```
AIKARI/
├── backend/                 # Backend API (FastAPI)
│   ├── app/
│   │   ├── api/            # API routes và endpoints
│   │   │   ├── routes/     # Các route handlers
│   │   │   │   ├── login.py      # Authentication endpoints
│   │   │   │   ├── users.py      # User management
│   │   │   │   ├── items.py      # Items CRUD
│   │   │   │   ├── utils.py      # Utility endpoints
│   │   │   │   └── private.py    # Private endpoints (dev only)
│   │   │   ├── deps.py     # Dependencies (auth, database sessions)
│   │   │   └── main.py     # API router configuration
│   │   ├── core/           # Core configurations
│   │   │   ├── config.py   # Settings và environment variables
│   │   │   ├── db.py       # Database connection và initialization
│   │   │   └── security.py # Security utilities (JWT, password hashing)
│   │   ├── crud/           # CRUD operations
│   │   │   └── crud.py     # Database operations
│   │   ├── models/         # SQLModel models
│   │   │   └── models.py   # Database models (User, Item, etc.)
│   │   ├── schemas/        # Pydantic schemas (nếu có)
│   │   ├── services/       # Business logic services
│   │   ├── utils/          # Utility functions
│   │   │   └── utils.py    # Helper functions (email, tokens)
│   │   ├── email-templates/# Email templates
│   │   │   ├── src/        # MJML source files
│   │   │   └── build/      # Compiled HTML templates
│   │   ├── alembic/        # Database migrations
│   │   │   └── versions/   # Migration files
│   │   ├── backend_pre_start.py  # Pre-start initialization
│   │   └── main.py         # FastAPI application entry point
│   ├── tests/              # Test files
│   │   ├── api/            # API tests
│   │   ├── crud/           # CRUD tests
│   │   └── conftest.py     # Pytest configuration
│   ├── scripts/            # Utility scripts
│   │   ├── prestart.sh     # Pre-start script (migrations)
│   │   ├── test.sh         # Test runner
│   │   ├── format.sh       # Code formatter
│   │   └── lint.sh         # Linter
│   ├── Dockerfile          # Docker image cho backend
│   ├── pyproject.toml      # Python dependencies (uv)
│   ├── uv.lock             # Lock file cho dependencies
│   ├── alembic.ini         # Alembic configuration
│   └── main.py             # Entry point (simple)
│
├── frontend/               # Frontend application (React Router)
│   ├── app/
│   │   ├── components/     # React components
│   │   │   ├── atoms/      # Atomic components
│   │   │   ├── common/     # Common components
│   │   │   ├── layout/     # Layout components
│   │   │   └── shared/     # Shared components
│   │   ├── routes/         # Route components
│   │   │   ├── _layouts/   # Layout wrappers
│   │   │   │   ├── auth-layout.tsx    # Auth pages layout
│   │   │   │   └── main-layout.tsx    # Main pages layout
│   │   │   ├── auth/       # Authentication pages
│   │   │   │   ├── login.tsx
│   │   │   │   ├── signup.tsx
│   │   │   │   ├── forgot-password.tsx
│   │   │   │   └── reset-password.tsx
│   │   │   └── home.tsx    # Home page
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Library configurations
│   │   ├── root.tsx        # Root component
│   │   ├── routes.ts       # Route configuration
│   │   └── app.css         # Global styles (Tailwind)
│   ├── public/             # Static assets
│   ├── build/              # Build output
│   ├── Dockerfile          # Docker image cho frontend
│   ├── package.json        # Node dependencies
│   ├── vite.config.ts      # Vite configuration
│   ├── react-router.config.ts  # React Router config
│   └── tailwind.config.js # Tailwind CSS config
│
└── specs/                  # Project specifications và templates
    ├── memory/             # Project memory/constitution
    ├── scripts/            # Helper scripts
    └── templates/          # Template files
```

## 🚀 Hướng dẫn Cài đặt và Chạy

### Yêu cầu Hệ thống

- **Node.js**: >= 20.x
- **Python**: >= 3.10, < 4.0
- **PostgreSQL**: >= 12.x
- **uv**: Package manager cho Python (cài đặt từ [https://docs.astral.sh/uv/](https://docs.astral.sh/uv/))
- **npm** hoặc **yarn**: Package manager cho Node.js

### Bước 1: Clone Repository

```bash
git clone <repository-url>
cd AIKARI
```

### Bước 2: Cài đặt Backend

```bash
cd backend

# Cài đặt dependencies với uv
uv sync

# Kích hoạt virtual environment
# Windows (Git Bash)
source .venv/bin/activate

# Windows (PowerShell/CMD)
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate
```

### Bước 3: Cấu hình Backend

Tạo file `.env` trong thư mục `backend/` với nội dung:

```env
PROJECT_NAME=AIKARI
ENVIRONMENT=local
SECRET_KEY=changethis  # Thay đổi trong production!
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=changethis  # Thay đổi trong production!
POSTGRES_DB=aikari

# Superuser (tự động tạo khi khởi động lần đầu)
FIRST_SUPERUSER=admin@example.com
FIRST_SUPERUSER_PASSWORD=changethis  # Thay đổi trong production!

# CORS (tùy chọn)
BACKEND_CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Email (tùy chọn, để gửi email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAILS_FROM_EMAIL=noreply@example.com
EMAILS_FROM_NAME=AIKARI

# Sentry (tùy chọn, cho error tracking)
SENTRY_DSN=
```

### Bước 4: Setup Database

Đảm bảo PostgreSQL đang chạy và tạo database:

```bash
# Kết nối PostgreSQL
psql -U postgres

# Tạo database
CREATE DATABASE aikari;

# Thoát
\q
```

Chạy migrations:

```bash
# Từ thư mục backend/
alembic upgrade head
```

### Bước 5: Chạy Backend

```bash
# Từ thư mục backend/
fastapi dev app/main.py
```

Backend sẽ chạy tại: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

### Bước 6: Cài đặt Frontend

Mở terminal mới:

```bash
cd frontend

# Cài đặt dependencies
npm install
```

### Bước 7: Chạy Frontend

```bash
# Từ thư mục frontend/
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

## 🐳 Chạy với Docker

### Backend

```bash
cd backend
docker build -t aikari-backend .
docker run -p 8000:8000 --env-file .env aikari-backend
```

### Frontend

```bash
cd frontend
docker build -t aikari-frontend .
docker run -p 3000:3000 aikari-frontend
```

## 📚 Cấu trúc Chi tiết

### Backend Architecture

#### API Routes (`app/api/routes/`)

- **login.py**: Xử lý authentication
  - `POST /api/v1/login/access-token`: Đăng nhập và nhận JWT token
  - `POST /api/v1/login/test-token`: Kiểm tra token
  - `POST /api/v1/password-recovery/{email}`: Khôi phục mật khẩu
  - `POST /api/v1/reset-password/`: Đặt lại mật khẩu

- **users.py**: Quản lý người dùng
  - CRUD operations cho users
  - Chỉ superuser mới có quyền tạo/sửa/xóa users

- **items.py**: Quản lý items
  - CRUD operations cho items
  - Mỗi user chỉ có thể quản lý items của mình

- **utils.py**: Utility endpoints
  - Các endpoint tiện ích khác

- **private.py**: Private endpoints (chỉ trong môi trường local)
  - Các endpoint debug/development

#### Models (`app/models/models.py`)

- **User**: Model người dùng
  - `id`: UUID (primary key)
  - `email`: Email (unique, indexed)
  - `hashed_password`: Mật khẩu đã hash
  - `is_active`: Trạng thái active
  - `is_superuser`: Quyền superuser
  - `full_name`: Tên đầy đủ
  - `items`: Relationship với Item

- **Item**: Model items
  - `id`: UUID (primary key)
  - `title`: Tiêu đề
  - `description`: Mô tả
  - `owner_id`: Foreign key đến User
  - `owner`: Relationship với User

#### Core (`app/core/`)

- **config.py**: Quản lý settings từ environment variables
- **db.py**: Database connection và session management
- **security.py**: JWT tokens, password hashing/verification

#### CRUD (`app/crud/crud.py`)

- `create_user()`: Tạo user mới
- `update_user()`: Cập nhật user
- `get_user_by_email()`: Lấy user theo email
- `authenticate()`: Xác thực user
- `create_item()`: Tạo item mới

### Frontend Architecture

#### Routing (`app/routes.ts`)

- **Auth Layout**: Các trang authentication
  - `/auth/login`: Đăng nhập
  - `/auth/signup`: Đăng ký
  - `/auth/forgot-password`: Quên mật khẩu
  - `/auth/reset-password`: Đặt lại mật khẩu

- **Main Layout**: Các trang chính
  - `/home`: Trang chủ

#### Components

- **atoms/**: Các component nhỏ nhất (Logo, LogoWithText)
- **common/**: Components dùng chung
- **layout/**: Layout components (Header)
- **shared/**: Shared utilities (provider, toaster, tooltip)

## 🧪 Testing

### Backend Tests

```bash
cd backend
bash scripts/test.sh
```

Hoặc chạy trực tiếp:

```bash
pytest
```

### Test Coverage

Sau khi chạy tests, mở file `htmlcov/index.html` trong browser để xem coverage report.

## 🔄 Database Migrations

### Tạo Migration mới

```bash
cd backend
alembic revision --autogenerate -m "Mô tả thay đổi"
```

### Chạy Migrations

```bash
alembic upgrade head
```

### Rollback Migration

```bash
alembic downgrade -1
```

## 🛠️ Development Tools

### Code Formatting

```bash
# Backend
cd backend
bash scripts/format.sh

# Hoặc với ruff
ruff format .
```

### Linting

```bash
# Backend
cd backend
bash scripts/lint.sh

# Hoặc với ruff
ruff check .
```

### Type Checking

```bash
# Backend
mypy app/

# Frontend
cd frontend
npm run typecheck
```

## 📦 Dependencies Chính

### Backend

- **FastAPI**: Web framework
- **SQLModel**: ORM (tương thích với SQLAlchemy và Pydantic)
- **Alembic**: Database migrations
- **psycopg**: PostgreSQL driver
- **passlib**: Password hashing
- **pyjwt**: JWT tokens
- **pydantic-settings**: Settings management
- **emails**: Email sending
- **jinja2**: Template engine cho emails

### Frontend

- **React Router v7**: Framework và routing
- **React 19**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS v4**: Styling
- **Chakra UI**: Component library
- **Vite**: Build tool

## 🔐 Authentication Flow

1. User gửi credentials đến `/api/v1/login/access-token`
2. Backend xác thực và trả về JWT token
3. Frontend lưu token và gửi kèm trong header `Authorization: Bearer <token>`
4. Backend verify token trong `app/api/deps.py` (CurrentUser dependency)

## 📧 Email Templates

Email templates được viết bằng MJML và compile thành HTML:

1. Tạo file `.mjml` trong `backend/app/email-templates/src/`
2. Sử dụng VS Code extension "MJML" để export sang HTML
3. Lưu file HTML vào `backend/app/email-templates/build/`

## 🚨 Troubleshooting

### Backend không kết nối được database

- Kiểm tra PostgreSQL đang chạy
- Kiểm tra thông tin trong `.env` file
- Đảm bảo database đã được tạo

### Migration errors

```bash
# Xem trạng thái migrations
alembic current

# Xem lịch sử migrations
alembic history
```

### Frontend không kết nối được API

- Kiểm tra CORS settings trong `backend/app/core/config.py`
- Đảm bảo `BACKEND_CORS_ORIGINS` trong `.env` bao gồm frontend URL
- Kiểm tra backend đang chạy tại đúng port

### Port đã được sử dụng

```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8000 | xargs kill
```

## 📖 Tài liệu Tham khảo

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Router v7 Docs](https://reactrouter.com/)
- [SQLModel Documentation](https://sqlmodel.tiangolo.com/)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)

## 📝 Ghi chú

- Backend sử dụng `uv` thay vì `pip` để quản lý dependencies
- Frontend sử dụng React Router v7 với SSR enabled
- Database migrations được quản lý bằng Alembic
- JWT tokens có thời gian hết hạn mặc định là 8 ngày
- Superuser được tạo tự động khi khởi động lần đầu (từ `FIRST_SUPERUSER` trong `.env`)

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

[Thêm license nếu có]

---

**Chúc bạn phát triển vui vẻ với AIKARI! 🎉**

