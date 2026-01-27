# PHÂN TÍCH KIẾN TRÚC FRONTEND - AIKARI

## 📋 TỔNG QUAN

Frontend của AIKARI được xây dựng bằng **React Router v7** (SSR-capable framework), **TypeScript**, **Redux Toolkit** cho state management, và **Radix UI** cho component library.

---

## 🏗️ KIẾN TRÚC TỔNG THỂ

```
frontend/
├── app/
│   ├── root.tsx                # Root component & providers
│   ├── routes.ts               # Route configuration
│   ├── routes/                 # Route components
│   │   ├── _layouts/          # Layout components
│   │   ├── auth/              # Auth routes
│   │   └── [feature routes]   # Feature-specific routes
│   ├── components/             # React components
│   │   ├── pages/             # Page components
│   │   ├── layout/            # Layout components
│   │   ├── ui/                # Radix UI components
│   │   └── shared/            # Shared components
│   ├── redux/                  # Redux state management
│   │   ├── store/             # Store configuration
│   │   │   ├── api/           # RTK Query base API
│   │   │   └── index.ts       # Store setup
│   │   └── features/          # Feature slices
│   │       ├── auth/          # Auth slice & API
│   │       ├── user/          # User slice & API
│   │       ├── studyset/       # StudySet API
│   │       ├── learning/       # Learning slice & API
│   │       └── [other features]
│   ├── hooks/                  # Custom React hooks
│   ├── utils/                  # Utility functions
│   └── i18n/                   # Internationalization
└── public/                     # Static assets
```

---

## 📦 CÁC TẦNG KIẾN TRÚC

### 1. **Routing Layer** (`app/routes/`)

**Framework**: React Router v7 (file-based routing)

**Cấu trúc Routes**:
```typescript
// routes/index.ts
export default [
  // Auth routes
  layout("routes/_layouts/auth-layout.tsx", [
    route("login", "routes/auth/login.tsx"),
    route("signup", "routes/auth/signup.tsx"),
  ]),
  
  // Public routes
  layout("routes/_layouts/main-layout.tsx", [
    index("components/pages/homepage/home.tsx"),
  ]),
  
  // Authenticated routes
  layout("routes/_layouts/authenticated-layout.tsx", [
    route("home", "routes/home.tsx"),
    route("studysets", "routes/studysets/index.tsx"),
    route("studysets/:studysetId", "routes/studysets/$studysetId.tsx"),
    // ... more routes
  ]),
];
```

**Layout Hierarchy**:
1. **Root Layout** (`root.tsx`): Providers (Redux, Theme, Auth)
2. **Auth Layout**: Login/Signup pages
3. **Main Layout**: Public landing page
4. **Authenticated Layout**: App với sidebar & header

**Route Features**:
- ✅ File-based routing
- ✅ Nested layouts
- ✅ Dynamic routes (`:studysetId`)
- ✅ Route loaders (data fetching)
- ✅ Error boundaries

---

### 2. **State Management Layer** (`app/redux/`)

**Architecture**: Redux Toolkit + RTK Query

#### **Store Configuration** (`redux/store/index.ts`)

**Structure**:
```typescript
const rootReducer = combineReducers({
  auth: authReducer,           // Auth state
  user: userReducer,           // User preferences
  learning: learningReducer,   // Learning session state
  session: sessionReducer,      // Session tracking
  [baseApi.reducerPath]: baseApi.reducer, // RTK Query cache
});
```

**Middleware Stack**:
1. Default middleware (thunk, serializable check)
2. RTK Query middleware (caching, invalidation)

#### **RTK Query Base API** (`redux/store/api/baseApi.ts`)

**Features**:
- ✅ Automatic token injection
- ✅ Token refresh on 401
- ✅ HTTP-only cookie support
- ✅ Tag-based cache invalidation

**Base Query với Reauth**:
```typescript
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  // Auto-refresh on 401
  if (result.error?.status === 401) {
    const refreshResult = await baseQuery('/login/refresh-token', api, extraOptions);
    if (refreshResult.data) {
      // Update token in store
      // Retry original request
    }
  }
  
  return result;
};
```

**Tag Types** (Cache Invalidation):
- `User`, `StudySet`, `Term`, `Class`, `Test`, `Session`, etc.

#### **Feature Slices** (`redux/features/`)

**Pattern**: Mỗi feature có:
- `slice.ts` - Redux slice (nếu cần local state)
- `api.ts` - RTK Query endpoints
- `types.ts` - TypeScript types
- `hooks.ts` - Typed hooks (optional)

**Ví dụ: Auth Feature**:
```typescript
// features/auth/slice.ts
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
    },
    logout: (state) => {
      state.accessToken = null;
      state.user = null;
    },
  },
});

// features/auth/api.ts
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/login/access-token',
        method: 'POST',
        body: credentials,
      }),
    }),
  }),
});
```

**Features**:
- `auth/` - Authentication & authorization
- `user/` - User profile & preferences
- `studyset/` - StudySet CRUD operations
- `learning/` - Learning session management
- `session/` - Session tracking
- `test/` - Test management
- `class/` - Class management
- `category/` - Category management
- `chatbot/` - AI chatbot integration
- `enrollment/` - Class enrollment

---

### 3. **Component Layer** (`app/components/`)

#### **Component Organization**:

**Pages** (`components/pages/`):
- Page-level components cho mỗi route
- `dashboard/` - Dashboard pages (37 files)
- `admin/` - Admin pages
- `auth/` - Auth pages
- `learn/` - Learning pages
- `progress/` - Progress tracking

**Layout** (`components/layout/`):
- `authenticated/` - AppHeader, AppSidebar
- `header/` - Public header

**UI Components** (`components/ui/`):
- 50+ Radix UI-based components
- Reusable, accessible components
- Examples: Button, Dialog, Dropdown, Form, etc.

**Shared** (`components/shared/`):
- `auth-initializer.tsx` - Auth state initialization
- `chatbot.tsx` - Chatbot component
- `flashcard.tsx` - Flashcard component
- `studyset-card.tsx` - StudySet card
- `term-edit-dialog.tsx` - Term editing

#### **Component Patterns**:

**Container/Presentational**:
- Routes = Containers (data fetching, state)
- Pages = Presentational (UI rendering)

**Example**:
```typescript
// Route (Container)
export default function StudySetRoute() {
  const { studysetId } = useParams();
  const { data } = useGetStudySetQuery(studysetId);
  
  return <StudySetPage data={data} />;
}

// Page (Presentational)
export function StudySetPage({ data }) {
  return <div>{/* UI */}</div>;
}
```

---

### 4. **Authentication Flow**

#### **Auth Initializer** (`components/shared/auth-initializer.tsx`)

**Chức năng**: Initialize auth state on app load

**Flow**:
1. Check for stored access token
2. Validate token với backend
3. Fetch user profile
4. Set auth state in Redux

#### **Protected Routes** (`routes/_layouts/authenticated-layout.tsx`)

**Features**:
- ✅ Route protection (redirect to login if not authenticated)
- ✅ Role-based access control
- ✅ Sidebar navigation
- ✅ Header với user menu

**Role-based Routing**:
```typescript
useEffect(() => {
  const userRole = user?.role.toUpperCase();
  const adminOnlyRoutes = ['/admin'];
  const studentTeacherOnlyRoutes = ['/home', '/studysets'];
  
  // Redirect based on role
  if (userRole === 'ADMIN' && studentTeacherOnlyRoutes.includes(path)) {
    navigate('/admin');
  }
}, [user, location]);
```

---

### 5. **API Integration**

#### **RTK Query Endpoints**

**Pattern**: Feature-based API endpoints

**Example: StudySet API**:
```typescript
export const studysetApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStudySets: builder.query<StudySet[], void>({
      query: () => '/studysets/',
      providesTags: ['StudySet'],
    }),
    createStudySet: builder.mutation<StudySet, StudySetCreate>({
      query: (data) => ({
        url: '/studysets/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['StudySet'],
    }),
  }),
});

// Auto-generated hooks
export const { useGetStudySetsQuery, useCreateStudySetMutation } = studysetApi;
```

**Features**:
- ✅ Automatic caching
- ✅ Cache invalidation via tags
- ✅ Loading & error states
- ✅ Optimistic updates
- ✅ Polling support

---

### 6. **Styling**

#### **Tailwind CSS**
- Utility-first CSS framework
- Custom theme configuration
- Responsive design

#### **Radix UI**
- Accessible component primitives
- Unstyled, customizable
- 50+ components

#### **Framer Motion**
- Animation library
- Smooth transitions

---

## 🔄 DATA FLOW

### **Request Flow**:
```
User Action (Click, Form Submit)
    ↓
Component Event Handler
    ↓
RTK Query Mutation/Query Hook
    ↓
Base API (add auth token)
    ↓
HTTP Request (fetchBaseQuery)
    ↓
Backend API
```

### **Response Flow**:
```
Backend API Response
    ↓
RTK Query (parse, cache)
    ↓
Redux Store Update
    ↓
Component Re-render (useSelector)
    ↓
UI Update
```

### **Cache Invalidation Flow**:
```
Mutation Success
    ↓
Invalidate Tags
    ↓
Refetch Queries with Matching Tags
    ↓
Update Cache
    ↓
Component Re-render
```

---

## 🎨 UI/UX PATTERNS

### **Layout Structure**:

**Authenticated Layout**:
```
┌─────────────────────────────────┐
│ AppHeader (user menu, search)   │
├──────────┬──────────────────────┤
│          │                      │
│ Sidebar  │  Main Content        │
│ (nav)    │  (Outlet)            │
│          │                      │
└──────────┴──────────────────────┘
```

**Features**:
- ✅ Collapsible sidebar
- ✅ Responsive (mobile-friendly)
- ✅ Active route highlighting
- ✅ Role-based menu items

---

## 🔐 SECURITY

### **Token Management**:
- ✅ Access token: Redux store (memory)
- ✅ Refresh token: HTTP-only cookie (secure)
- ✅ Auto-refresh on 401
- ✅ Logout clears all state

### **XSS Protection**:
- ✅ React auto-escaping
- ✅ No `dangerouslySetInnerHTML` (trừ trusted content)

### **CSRF Protection**:
- ✅ SameSite cookie attribute
- ✅ CORS configuration

---

## 📱 RESPONSIVE DESIGN

### **Breakpoints** (Tailwind):
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### **Mobile-First**:
- ✅ Responsive layouts
- ✅ Touch-friendly components
- ✅ Mobile navigation

---

## 🚀 PERFORMANCE OPTIMIZATIONS

### **Code Splitting**:
- ✅ Route-based splitting (React Router)
- ✅ Lazy loading components

### **Caching**:
- ✅ RTK Query automatic caching
- ✅ Tag-based invalidation
- ✅ Stale-while-revalidate pattern

### **Optimistic Updates**:
- ✅ RTK Query optimistic updates
- ✅ Immediate UI feedback

### **Memoization**:
- ✅ React.memo cho expensive components
- ✅ useMemo, useCallback cho computations

---

## 🧪 TESTING STRATEGY

### **Test Types**:
- ⚠️ No test files found (có thể thêm)
- ✅ TypeScript type checking
- ✅ ESLint/Prettier

### **Potential Testing**:
- Unit tests: Components, hooks, utils
- Integration tests: API calls, state updates
- E2E tests: User flows

---

## 📦 DEPENDENCIES

### **Core**:
- `react`: ^19.1.0
- `react-router`: ^7.7.1 (SSR-capable)
- `@reduxjs/toolkit`: ^2.10.1
- `react-redux`: ^9.2.0

### **UI**:
- `@radix-ui/*`: Component library (50+ packages)
- `tailwindcss`: ^4.1.13
- `framer-motion`: ^12.23.12
- `lucide-react`: Icons

### **Forms**:
- `react-hook-form`: ^7.66.0

### **Utilities**:
- `clsx`: Class name utility
- `tailwind-merge`: Tailwind class merging

---

## 🎯 DESIGN PATTERNS

### **1. Container/Presentational**
- Routes = Containers
- Pages = Presentational

### **2. Custom Hooks**
- `useAppDispatch`, `useAppSelector` - Typed Redux hooks
- Feature-specific hooks trong `hooks.ts`

### **3. Compound Components**
- Radix UI compound components
- Shared component composition

### **4. Provider Pattern**
- ReduxProvider, ThemeProvider, AuthInitializer

---

## ⚠️ POTENTIAL IMPROVEMENTS

### **1. Error Handling**
- ✅ Error boundaries trong routes
- ⚠️ Có thể thêm global error handler
- ⚠️ User-friendly error messages

### **2. Loading States**
- ✅ RTK Query loading states
- ⚠️ Có thể thêm skeleton loaders

### **3. Offline Support**
- ❌ No service worker
- ✅ Có thể thêm PWA features

### **4. Internationalization**
- ✅ i18n folder structure
- ⚠️ Cần implement translation logic

### **5. Accessibility**
- ✅ Radix UI (accessible by default)
- ⚠️ Cần audit a11y

### **6. Performance Monitoring**
- ❌ No performance monitoring
- ✅ Có thể thêm Web Vitals

---

## 📝 KẾT LUẬN

Frontend của AIKARI có **kiến trúc hiện đại, scalable**:
- ✅ **React Router v7**: File-based routing, SSR-ready
- ✅ **Redux Toolkit**: Predictable state management
- ✅ **RTK Query**: Efficient API integration với caching
- ✅ **TypeScript**: Type safety throughout
- ✅ **Radix UI**: Accessible, customizable components
- ✅ **Tailwind CSS**: Utility-first styling
- ⚠️ **Cần cải thiện**: Testing, error handling, i18n implementation

Kiến trúc này phù hợp cho **production application** và có thể scale với team lớn hơn.
