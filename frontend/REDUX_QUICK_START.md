# 🎯 Redux Toolkit - Quick Access Guide

## 🚀 TL;DR - Truy Cập Nhanh

```bash
# 1. Start dev server
cd frontend
npm run dev

# 2. Mở browser
http://localhost:5173/redux-examples
```

---

## 📍 3 Cách Truy Cập Examples

### ✅ Cách 1: Từ Home Page
1. Vào `http://localhost:5173/home`
2. Scroll xuống → Thấy card **"Redux Toolkit Examples"**
3. Click **"View Redux Examples"**

### ✅ Cách 2: Direct URL
```
http://localhost:5173/redux-examples
```

### ✅ Cách 3: Trong Code
```tsx
import { Link } from "react-router";

<Link to="/redux-examples">View Examples</Link>
```

---

## 📚 Tài Liệu

| File | Mô Tả | Khi Nào Đọc |
|------|-------|-------------|
| **[HOW_TO_ACCESS_EXAMPLES.md](./HOW_TO_ACCESS_EXAMPLES.md)** | Chi tiết cách truy cập | Đọc NGAY |
| **[REDUX_GUIDE.md](./REDUX_GUIDE.md)** | Complete guide về Redux | Học concepts |
| **[app/store/README.md](./app/store/README.md)** | Quick reference | Khi cần tra cứu |

---

## 🎯 Examples Có Gì?

### 1. **Overview Tab**
- ✅ Cấu trúc store
- ✅ Features list
- ✅ Architecture overview

### 2. **Authentication Tab**
- ✅ Login form demo
- ✅ useAuth() hook
- ✅ Error handling
- ✅ **Live working example**

### 3. **User Profile Tab**
- ✅ Profile display
- ✅ useCurrentUser() hook
- ✅ useAppSelector usage
- ✅ **Live working example**

### 4. **RTK Query Tab**
- ✅ API calls demo
- ✅ Auto caching
- ✅ Mutations (CRUD)
- ✅ **Live working example**

---

## 💻 Components Location

```
app/components/examples/
├── LoginExample.tsx           # Auth demo
├── UserProfileExample.tsx     # Profile demo
└── RTKQueryExample.tsx        # API calls demo
```

**Import:**
```tsx
import { LoginExample } from "~/components/examples/LoginExample";
import { UserProfileExample } from "~/components/examples/UserProfileExample";
import { RTKQueryExample } from "~/components/examples/RTKQueryExample";
```

---

## 🛠️ Usage trong Code

### Login Example
```tsx
import { useAuth } from '~/store/hooks';

const { login, loading, error } = useAuth();
await login({ email, password });
```

### User Profile
```tsx
import { useCurrentUser } from '~/store/hooks';

const user = useCurrentUser();
```

### RTK Query
```tsx
import { useGetClassesQuery } from '~/store/services/apiService';

const { data, isLoading } = useGetClassesQuery();
```

---

## 🎓 Learning Flow

1. **Start dev server** → `npm run dev`
2. **Visit examples page** → `http://localhost:5173/redux-examples`
3. **Read Overview tab** → Hiểu cấu trúc
4. **Try Auth example** → Test login
5. **Check Redux DevTools** → Xem state changes
6. **Read source code** → Học patterns
7. **Apply to your code** → Tạo features mới

---

## 🔧 Quick Commands

```bash
# Start frontend
cd frontend && npm run dev

# Start backend (for API testing)
cd backend && fastapi dev app/main.py

# Type check
cd frontend && npm run typecheck
```

---

## 🎯 Quick Reference

| Need | Use This |
|------|----------|
| Login/Logout | `useAuth()` |
| Get User | `useCurrentUser()` |
| Read State | `useAppSelector(selector)` |
| Dispatch Action | `useAppDispatch()` |
| API Call | `useGetXxxQuery()` |
| Mutation | `useXxxMutation()` |

---

## 📞 Need Help?

1. Check **[HOW_TO_ACCESS_EXAMPLES.md](./HOW_TO_ACCESS_EXAMPLES.md)** - Detailed guide
2. Check **[REDUX_GUIDE.md](./REDUX_GUIDE.md)** - Complete documentation
3. Check examples source code - Real implementations

---

**Happy Coding! 🚀**
