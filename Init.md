# Hướng dẫn Khởi tạo Dự án AIKARI

## Tổng quan Dự án
Dự án AIKARI là một full-stack application với:
- **Frontend**: React Router v7 + TypeScript + Tailwind CSS v4 + Flowbite React
- **Backend**: FastAPI + Python
- **Styling**: Tailwind CSS v4 với Flowbite components
- **Font**: Inter (Google Fonts)

## 🚀 Bước 1: Khởi tạo Dự án

### 1.1 Tạo thư mục dự án
```bash
mkdir AIKARI
cd AIKARI
```

### 1.2 Khởi tạo Git repository
```bash
git init
```

## 🎨 Bước 2: Setup Frontend (React Router v7)

### 2.1 Tạo React Router project
```bash
npx create-react-router@latest frontend
cd frontend
```

### 2.2 Cài đặt dependencies chính
```bash
# Dependencies
npm install flowbite flowbite-react

# Dev Dependencies (đã có sẵn)
npm install -D @tailwindcss/vite tailwindcss@^4.1.13 typescript@^5.8.3
```
### 2.3 Cấu hình CSS (app/app.css)
```css
@import "tailwindcss";

html,
body {
  background-color: white;
  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  html,
  body {
    background-color: #030712;
    color-scheme: dark;
  }
}
```

## 🐍 Bước 3: Setup Backend (FastAPI)

### 3.1 Tạo thư mục backend
```bash
cd ..
mkdir backend
cd backend
```

### 3.2 Tạo virtual environment
```bash
python -m venv venv

# macOS/Linux
source venv/bin/activate

# Windows (Terminal/cmd/powershell)
venv\Scripts\activate

# Windows (Git Bash)
source venv/Scripts/activate
```

### 3.3 Cài đặt dependencies
```bash
pip install fastapi uvicorn python-dotenv
```

### 3.4 Tạo file requirements.txt
```bash
pip freeze > requirements.txt
```

### 3.5 Tạo file main.py
```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello World"}
```

## 📁 Bước 4: Cấu trúc Thư mục Cuối cùng

```
AIKARI/
├── frontend/
│   ├── app/
│   │   ├── app.css
│   │   ├── root.tsx
│   │   ├── routes/
│   │   │   ├── home.tsx
│   │   │   └── +types/
│   │   ├── welcome/
│   │   │   ├── welcome.tsx
│   │   │   ├── logo-dark.svg
│   │   │   └── logo-light.svg
│   │   └── +types/
│   ├── public/
│   │   └── favicon.ico
│   ├── .vscode/
│   │   ├── settings.json
│   │   └── extensions.json
│   ├── package.json
│   ├── package-lock.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── react-router.config.ts
│   └── README.md
├── backend/
│   ├── venv/
│   ├── main.py
│   └── requirements.txt
├── .gitignore
└── Init.md
```

## 🚀 Bước 5: Chạy Dự án

### 5.1 Chạy Frontend
```bash
cd frontend
npm run dev
```
Frontend sẽ chạy tại: `http://localhost:5173`

### 5.2 Chạy Backend
```bash
cd backend
# Kích hoạt virtual environment
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux
# source venv/Scripts/activate # Windows (Git Bash)

# Chạy server
uvicorn main:app --reload
```
Backend sẽ chạy tại: `http://localhost:8000`

## 📦 Bước 6: Package.json Scripts

### Frontend Scripts
```json
{
  "scripts": {
    "build": "react-router build",
    "dev": "react-router dev",
    "start": "react-router-serve ./build/server/index.js",
    "typecheck": "react-router typegen && tsc"
  }
}
```

## 📚 Tài liệu Tham khảo

- [React Router v7 Docs](https://reactrouter.com/docs)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [Flowbite React Docs](https://flowbite.com/docs/getting-started/react/)
- [FastAPI Docs](https://fastapi.tiangolo.com/)

## 🐛 Troubleshooting

### Lỗi thường gặp:

1. **"Unknown at rule @import"**: Đảm bảo sử dụng Tailwind CSS v4
2. **"Unknown at rule @apply"**: Không cần PostCSS config với Tailwind v4
3. **Flowbite components không hiển thị**: Kiểm tra content paths trong tailwind.config.js
4. **Font Inter không load**: Kiểm tra Google Fonts link trong root.tsx

---

**Dự án đã sẵn sàng để phát triển! 🎉**
