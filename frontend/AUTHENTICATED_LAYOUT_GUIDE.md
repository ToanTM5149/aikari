# Authenticated Layout - Hướng dẫn sử dụng

## Tổng quan
Layout này được tạo cho các trang yêu cầu đăng nhập. Nó bao gồm:
- **AppSidebar**: Thanh điều hướng bên trái với menu và thông tin user
- **AppHeader**: Header với thanh tìm kiếm và thông báo

## Cấu trúc
```
frontend/app/components/layout/authenticated/
├── AppHeader.tsx      # Header cho authenticated pages
├── AppSidebar.tsx     # Sidebar với menu điều hướng
└── index.ts           # Export file
```

## Sidebar Menu
Sidebar chỉ giữ lại 4 mục như yêu cầu:
1. **Home** - Trang chủ
2. **Class** - Quản lý lớp học
3. **Create Flashcards** - Tạo flashcards mới
4. **Flashcard Set** - Quản lý bộ flashcards

## Cách sử dụng trong Routes

### 1. Import layout vào routes
```typescript
// frontend/app/routes/index.ts
import { type RouteConfig, route, layout } from "@react-router/dev/routes";

export default [
  // ... existing routes ...
  
  // Routes cho authenticated users
  layout("routes/_layouts/authenticated-layout.tsx", [
    route("home", "routes/home.tsx"),
    route("class", "routes/class/index.tsx"),
    route("create", "routes/create/index.tsx"),
    route("flashcard", "routes/flashcard/index.tsx"),
    route("profile", "routes/profile/index.tsx"),
  ]),
] satisfies RouteConfig;
```

### 2. Tạo các page components
Mỗi route cần một component tương ứng, ví dụ:

```typescript
// frontend/app/routes/class/index.tsx
export default function ClassPage() {
  return (
    <div className="container mx-auto p-6">
      <h1>Class Management</h1>
      {/* Your class content here */}
    </div>
  );
}
```

## Phân biệt với Main Layout
- **Main Layout** (`main-layout.tsx`): Dành cho user chưa đăng nhập
  - Header đơn giản với nút "Sign In"
  - Không có sidebar
  - Sử dụng cho landing page, public pages
  
- **Authenticated Layout** (`authenticated-layout.tsx`): Dành cho user đã đăng nhập
  - Header với search và notifications
  - Sidebar với menu điều hướng đầy đủ
  - User profile section ở footer của sidebar

## Tùy chỉnh

### Cập nhật thông tin user
Trong `authenticated-layout.tsx`, bạn có thể lấy thông tin user từ Redux store hoặc context:

```typescript
import { useAppSelector } from "~/redux/store";

export default function AuthenticatedLayout() {
  const user = useAppSelector((state) => state.auth.user);
  
  return (
    <SidebarProvider>
      <AppSidebar
        userName={user?.name || "Guest"}
        userEmail={user?.email || "guest@example.com"}
        // ...
      />
    </SidebarProvider>
  );
}
```

### Implement logout logic
Cập nhật hàm `handleLogout` trong `authenticated-layout.tsx`:

```typescript
import { logout } from "~/redux/features/auth/authSlice";

const handleLogout = () => {
  dispatch(logout());
  navigate("/");
};
```

## Next Steps
1. Tạo các page components cho từng route (home, class, create, flashcard)
2. Integrate với Redux store để lấy thông tin user
3. Implement authentication guards để protect các routes này
4. Thêm logic logout thực sự
