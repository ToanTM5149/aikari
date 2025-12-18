# Cập nhật Header và Sidebar cho Frontend

## Tổng kết thay đổi

Đã tạo header và sidebar mới từ ui-preview cho các trang authenticated, đồng thời giữ nguyên header hiện tại cho trang landing page (user chưa đăng nhập).

## Files đã tạo

### 1. Components mới
```
frontend/app/components/layout/authenticated/
├── AppHeader.tsx      # Header với search bar và notification bell
├── AppSidebar.tsx     # Sidebar với menu điều hướng (4 items)
└── index.ts           # Export file
```

### 2. Layout mới
```
frontend/app/routes/_layouts/authenticated-layout.tsx
```
Layout này sử dụng AppSidebar và AppHeader, được thiết kế cho các trang yêu cầu đăng nhập.

### 3. Demo page
```
frontend/app/routes/dashboard/home.tsx
```
Trang demo để test authenticated layout.

### 4. Documentation
```
frontend/AUTHENTICATED_LAYOUT_GUIDE.md
```

## Sidebar Menu Items

Sidebar chỉ giữ lại 4 mục như yêu cầu:
1. ✅ **Home** - Trang chủ dashboard
2. ✅ **Class** - Quản lý lớp học  
3. ✅ **Create Flashcards** - Tạo flashcards mới
4. ✅ **Flashcard Set** - Quản lý bộ flashcards

❌ Đã loại bỏ: Search, Folder

## Phân biệt 2 loại Header

### Header cho user CHƯA đăng nhập (giữ nguyên)
- **Location**: `frontend/app/components/layout/header/Header.tsx`
- **Layout**: `frontend/app/routes/_layouts/main-layout.tsx`
- **Features**: 
  - Logo
  - Sign In button
  - Đơn giản, minimal
- **Sử dụng cho**: Landing page, public pages

### Header cho user ĐÃ đăng nhập (mới)
- **Location**: `frontend/app/components/layout/authenticated/AppHeader.tsx`
- **Layout**: `frontend/app/routes/_layouts/authenticated-layout.tsx`
- **Features**:
  - Search bar (ở giữa)
  - Notification bell
  - Sidebar kèm theo
- **Sử dụng cho**: Dashboard, app pages sau khi login

## Sidebar Features

### Navigation Menu
- 4 menu items với icon và text
- Active state highlighting
- Click để điều hướng giữa các trang

### User Profile Section
- Avatar với initials
- Username display
- Email display
- Click để xem profile

### Logout Button
- Ở footer của sidebar
- Toast notification khi logout
- Redirect về trang login

## Cách sử dụng

### Bước 1: Cập nhật routes config
Mở `frontend/app/routes/index.ts` và thêm:

```typescript
layout("routes/_layouts/authenticated-layout.tsx", [
  route("dashboard/home", "routes/dashboard/home.tsx"),
  route("class", "routes/class/index.tsx"),
  route("create", "routes/create/index.tsx"),
  route("flashcard", "routes/flashcard/index.tsx"),
]),
```

### Bước 2: Tạo các page components
Tạo các file component cho từng route (class, create, flashcard).

### Bước 3: Implement authentication logic
Trong `authenticated-layout.tsx`, cập nhật:
- Lấy thông tin user từ Redux store
- Implement logout logic
- Add authentication guard

## Dependencies

Components sử dụng các UI components có sẵn:
- ✅ `sidebar` (đã có)
- ✅ `input` (đã có)
- ✅ `button` (đã có)
- ✅ `avatar` (đã có)
- ✅ `logo` (đã có)
- ✅ `sonner` (toast notifications - đã có)
- ✅ `lucide-react` icons (đã có)

Không cần cài thêm package nào.

## Next Steps

1. **Test layout mới**:
   - Chạy frontend và test authenticated layout
   - Kiểm tra responsive design
   - Test navigation giữa các tab

2. **Integrate với auth system**:
   - Connect với Redux auth store
   - Lấy thông tin user thực
   - Implement logout logic thực sự

3. **Tạo các pages còn lại**:
   - Class page
   - Create flashcards page  
   - Flashcard set page

4. **Add route guards**:
   - Protect authenticated routes
   - Redirect nếu chưa login

5. **Styling adjustments** (nếu cần):
   - Điều chỉnh colors, spacing
   - Customize theo design system

## Kiểm tra

Để test layout mới:

1. Tạm thời thêm route vào `frontend/app/routes/index.ts`:
```typescript
layout("routes/_layouts/authenticated-layout.tsx", [
  route("dashboard/home", "routes/dashboard/home.tsx"),
]),
```

2. Start dev server và truy cập: `http://localhost:5173/dashboard/home`

3. Bạn sẽ thấy:
   - Sidebar bên trái với 4 menu items
   - Header với search bar
   - Content area với demo content
