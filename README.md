# Hệ thống Học tập Flashcard tích hợp AI

## 📋 Yêu cầu hệ thống

- **Python**: 3.10 trở lên
- **Node.js**: 18.x trở lên
- **PostgreSQL**: 12 trở lên
- **uv**: Package manager cho Python (cài đặt từ [https://docs.astral.sh/uv/](https://docs.astral.sh/uv/))
- **npm**: Đi kèm với Node.js

## 🛠️ Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd aikari
```

### 2. Cài đặt Backend

```bash
cd backend

# Cài đặt dependencies với uv
uv sync

# Kích hoạt virtual environment
source .venv/bin/activate  # Linux/Mac
# hoặc
.venv\Scripts\activate  # Windows
```

### 3. Cài đặt Frontend

```bash
cd ../frontend

# Cài đặt dependencies
npm install
```

### 4. Cấu hình Database

Tạo file `.env` trong thư mục `backend/`:

```env
# Database
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=aikari
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aikari

# Security
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Frontend
FRONTEND_HOST=http://localhost:5173
BACKEND_CORS_ORIGINS=["http://localhost:5173"]

# Dify AI (nếu sử dụng)
DIFY_API_KEY=your-dify-api-key
DIFY_BASE_URL=https://api.dify.ai/v1

# Environment
ENVIRONMENT=local
```

### 5. Khởi tạo Database

Đảm bảo PostgreSQL đang chạy, sau đó:

```bash
cd backend

# Chạy migrations
alembic upgrade head

# (Tùy chọn) Seed dữ liệu test
python scripts/seed_test_data.py
```

## ▶️ Chạy ứng dụng

### Chạy Backend

```bash
cd backend

# Kích hoạt virtual environment (nếu chưa kích hoạt)
source .venv/bin/activate

# Chạy development server
fastapi dev app/main.py
```

Backend sẽ chạy tại: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

### Chạy Frontend

Mở terminal mới:

```bash
cd frontend

# Chạy development server
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

## 🧪 Chạy Tests

### Backend Tests

```bash
cd backend

# Chạy tất cả tests
pytest

# Chạy với coverage
pytest --cov=app --cov-report=html

# Xem coverage report
open htmlcov/index.html  # Mac
# hoặc
start htmlcov/index.html  # Windows
```

### Frontend Tests

```bash
cd frontend

# Chạy tests (nếu có)
npm test
```

## 📦 Database Migrations

Khi thay đổi models, tạo migration mới:

```bash
cd backend

# Tạo migration mới
alembic revision --autogenerate -m "Mô tả thay đổi"

# Áp dụng migration
alembic upgrade head

# Rollback migration (nếu cần)
alembic downgrade -1
```

## 🏗️ Build cho Production

### Backend

```bash
cd backend

# Build không cần thiết cho Python, nhưng có thể tạo Docker image
docker build -t aikari-backend .
```

### Frontend

```bash
cd frontend

# Build production
npm run build

# Chạy production build
npm start
```

## 🐳 Chạy với Docker (Tùy chọn)

Nếu có file `docker-compose.yml`:

```bash
# Build và chạy tất cả services
docker compose up -d

# Xem logs
docker compose logs -f

# Dừng services
docker compose down
```

## 📁 Cấu trúc Project

```
aikari/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/         # API routes
│   │   ├── core/        # Core config, database, security
│   │   ├── models/      # SQLModel models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic
│   │   └── crud/        # CRUD operations
│   ├── alembic/         # Database migrations
│   └── tests/           # Test files
│
├── frontend/            # React Router v7 frontend
│   ├── app/
│   │   ├── components/  # React components
│   │   ├── routes/     # Route definitions
│   │   ├── redux/       # Redux state management
│   │   └── utils/       # Utility functions
│   └── public/          # Static assets
│
└── README.md            # File này
```

## 🔑 Các tài khoản mặc định (nếu có seed data)

Kiểm tra file `backend/scripts/seed_test_data.py` để xem các tài khoản test mặc định.

## 🛠️ Công nghệ sử dụng

### Backend
- **FastAPI**: Web framework
- **SQLModel**: ORM
- **PostgreSQL**: Database
- **Alembic**: Database migrations
- **Pydantic**: Data validation
- **JWT**: Authentication

### Frontend
- **React Router v7**: Framework
- **TypeScript**: Type safety
- **Redux Toolkit**: State management
- **Tailwind CSS**: Styling
- **Radix UI**: UI components

## 📝 Scripts hữu ích

### Backend

```bash
# Format code
ruff format .

# Lint code
ruff check .

# Type checking
mypy app/

# Reset database (cẩn thận!)
python scripts/reset_database.py
```

### Frontend

```bash
# Type checking
npm run typecheck

# Build
npm run build
```

## 🐛 Troubleshooting

### Lỗi kết nối Database

- Kiểm tra PostgreSQL đang chạy: `pg_isready`
- Kiểm tra thông tin trong file `.env`
- Kiểm tra database đã được tạo chưa

### Lỗi migration

- Đảm bảo đã chạy `alembic upgrade head`
- Kiểm tra file migration có lỗi syntax không

### Lỗi CORS

- Kiểm tra `BACKEND_CORS_ORIGINS` trong `.env`
- Đảm bảo frontend URL được thêm vào danh sách

### Lỗi Dify API

- Kiểm tra `DIFY_API_KEY` và `DIFY_BASE_URL` trong `.env`
- Kiểm tra kết nối internet và API key hợp lệ
