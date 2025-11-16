# Redux Toolkit Setup Guide - AIKARI Frontend

## 📚 Mục Lục

1. [Giới Thiệu](#giới-thiệu)
2. [Cấu Trúc Thư Mục](#cấu-trúc-thư-mục)
3. [Core Concepts](#core-concepts)
4. [Cách Sử Dụng](#cách-sử-dụng)
5. [Best Practices](#best-practices)
6. [Examples](#examples)

---

## 🎯 Giới Thiệu

Redux Toolkit là official, opinionated toolset để sử dụng Redux hiệu quả. Nó giải quyết 3 vấn đề lớn của Redux:

1. **"Configuring a Redux store is too complicated"** → `configureStore()` tự động setup
2. **"I have to add a lot of packages to get Redux to do anything useful"** → Tích hợp sẵn các packages cần thiết
3. **"Redux requires too much boilerplate code"** → `createSlice()` giảm boilerplate xuống 90%

---

## 📁 Cấu Trúc Thư Mục

```
app/store/
├── index.ts                 # Redux store configuration & exports
├── Provider.tsx             # Redux Provider component
├── types.ts                 # TypeScript types cho state
├── hooks.ts                 # Custom hooks
├── slices/                  # Redux slices
│   ├── authSlice.ts        # Authentication state
│   └── userSlice.ts        # User state & preferences
├── services/                # RTK Query API services
│   └── apiService.ts       # API endpoints definition
└── middleware/              # Custom middleware (nếu cần)
```

### 📝 Giải Thích Cấu Trúc

#### **1. `index.ts` - Store Configuration**
- Central configuration cho Redux store
- Combine tất cả reducers thành rootReducer
- Setup middleware (RTK Query, logger, etc.)
- Export typed hooks (`useAppDispatch`, `useAppSelector`)

#### **2. `types.ts` - Type Definitions**
- Định nghĩa tất cả TypeScript types cho state
- User types, Auth types, API types
- Giúp maintain type safety trong toàn bộ app

#### **3. `slices/` - Redux Slices**
Mỗi slice quản lý một phần của global state:
- **authSlice**: Authentication, tokens, login/logout
- **userSlice**: User profile, preferences, settings

#### **4. `services/` - RTK Query Services**
- API endpoints definition với RTK Query
- Automatic caching, refetching, loading states
- Tag-based cache invalidation

#### **5. `hooks.ts` - Custom Hooks**
- Các hooks tái sử dụng để work với Redux
- `useAuth()`, `useUserPreferences()`, etc.

---

## 🧠 Core Concepts

### 1. Redux Toolkit Store

```typescript
// app/store/index.ts
export const store = configureStore({
  reducer: {
    auth: authReducer,      // Auth state
    user: userReducer,      // User state
    api: apiService.reducer // RTK Query cache
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiService.middleware),
});
```

**Giải thích:**
- `configureStore()`: Tự động setup Redux DevTools, thunk middleware
- `reducer`: Combine các slice reducers
- `middleware`: Thêm RTK Query middleware cho API caching

### 2. Redux Slices (với createSlice)

```typescript
// Trước Redux Toolkit (traditional Redux)
// Cần viết: action types, action creators, reducer - 3 files riêng biệt!

// Với Redux Toolkit - CHỈ 1 FILE!
const authSlice = createSlice({
  name: 'auth',           // Prefix cho action types
  initialState,           // Initial state
  reducers: {             // Sync actions
    setCredentials: (state, action) => {
      // ✅ Có thể "mutate" state trực tiếp nhờ Immer
      state.user = action.payload.user;
    },
  },
  extraReducers: (builder) => {  // Async actions
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.isAuthenticated = true;
    });
  },
});
```

**Ưu điểm:**
- Tự động generate action creators và action types
- Immer cho phép "mutate" state (thực tế vẫn immutable)
- Giảm boilerplate code xuống 90%

### 3. Async Thunks (với createAsyncThunk)

```typescript
// Login Async Thunk
export const loginUser = createAsyncThunk<
  TokenResponse,          // Return type (fulfilled)
  LoginCredentials,       // Argument type
  { rejectValue: string } // Reject type (rejected)
>(
  'auth/login',           // Action type prefix
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/login', { ... });
      return response.json(); // → fulfilled
    } catch (error) {
      return rejectWithValue('Login failed'); // → rejected
    }
  }
);
```

**Tự động generate 3 action types:**
- `auth/login/pending` → Khi bắt đầu
- `auth/login/fulfilled` → Khi thành công
- `auth/login/rejected` → Khi thất bại

### 4. RTK Query - API Service Layer

```typescript
export const apiService = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v1' }),
  tagTypes: ['User', 'Class'],  // Tags cho cache invalidation
  endpoints: (builder) => ({
    // Query = GET (fetch data)
    getUser: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: ['User'],  // Provide tags
    }),
    
    // Mutation = POST/PUT/DELETE (modify data)
    updateUser: builder.mutation<User, Partial<User>>({
      query: (data) => ({
        url: `/users/${data.id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],  // Invalidate để refetch
    }),
  }),
});
```

**RTK Query tự động:**
- Caching responses
- Deduplicating requests
- Managing loading states
- Refetching khi cache invalidated
- Polling (auto-refresh)

---

## 🚀 Cách Sử Dụng

### Setup 1: Wrap App với ReduxProvider

```tsx
// app/root.tsx
import { ReduxProvider } from '~/store/Provider';

export default function App() {
  return (
    <ReduxProvider>
      <YourApp />
    </ReduxProvider>
  );
}
```

### Usage 1: Authentication với useAuth Hook

```tsx
import { useAuth } from '~/store/hooks';

function LoginPage() {
  const { login, loading, error, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    await login({ email, password });
    // Auto redirect nếu thành công
  };

  return (
    <form onSubmit={handleLogin}>
      {error && <Alert>{error}</Alert>}
      <Input type="email" />
      <Input type="password" />
      <Button disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
}
```

### Usage 2: Read State với useAppSelector

```tsx
import { useAppSelector } from '~/store';
import { selectCurrentUser } from '~/store/slices/authSlice';

function UserProfile() {
  // ✅ Type-safe selector
  const user = useAppSelector(selectCurrentUser);
  
  return <div>Welcome, {user?.full_name}!</div>;
}
```

### Usage 3: Dispatch Actions với useAppDispatch

```tsx
import { useAppDispatch } from '~/store';
import { updatePreferences } from '~/store/slices/userSlice';

function SettingsPage() {
  const dispatch = useAppDispatch();

  const handleThemeChange = (theme: 'light' | 'dark') => {
    dispatch(updatePreferences({ theme }));
  };

  return <Button onClick={() => handleThemeChange('dark')}>Dark Mode</Button>;
}
```

### Usage 4: RTK Query Hooks

```tsx
import { useGetClassesQuery, useCreateClassMutation } from '~/store/services/apiService';

function ClassList() {
  // Auto fetch, cache, loading states
  const { data: classes, isLoading, refetch } = useGetClassesQuery();
  
  const [createClass] = useCreateClassMutation();

  const handleCreate = async () => {
    await createClass({ name: 'New Class' }).unwrap();
    // Auto refetch nhờ cache invalidation!
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {classes?.map(c => <div key={c.id}>{c.name}</div>)}
      <Button onClick={handleCreate}>Create</Button>
    </div>
  );
}
```

---

## 🎯 Best Practices

### 1. ✅ Always Use Typed Hooks

```tsx
// ❌ BAD - No type safety
import { useDispatch, useSelector } from 'react-redux';

// ✅ GOOD - Type safe
import { useAppDispatch, useAppSelector } from '~/store';
```

### 2. ✅ Define Selectors in Slice Files

```tsx
// ❌ BAD - Inline selector
const user = useAppSelector(state => state.auth.user);

// ✅ GOOD - Reusable selector
const user = useAppSelector(selectCurrentUser);
```

**Lý do:** Reusable, testable, memoizable với `createSelector`

### 3. ✅ Use RTK Query cho API Calls

```tsx
// ❌ BAD - Manual fetch với useEffect
useEffect(() => {
  setLoading(true);
  fetch('/api/users')
    .then(res => res.json())
    .then(data => setUsers(data))
    .finally(() => setLoading(false));
}, []);

// ✅ GOOD - RTK Query
const { data: users, isLoading } = useGetUsersQuery();
```

**Lý do:** Automatic caching, deduplication, loading states

### 4. ✅ Use createAsyncThunk cho Async Logic

```tsx
// ❌ BAD - Manual async trong component
const handleLogin = async () => {
  setLoading(true);
  try {
    const res = await fetch('/api/login', { ... });
    dispatch(setUser(res.data));
  } catch (error) {
    setError(error);
  }
  setLoading(false);
};

// ✅ GOOD - Async thunk
const handleLogin = () => {
  dispatch(loginUser({ email, password }));
};
```

### 5. ✅ Normalize State Shape

```tsx
// ❌ BAD - Nested data
{
  classes: [
    { id: 1, name: 'Math', students: [{ id: 1, name: 'John' }] }
  ]
}

// ✅ GOOD - Normalized
{
  classes: { 1: { id: 1, name: 'Math', studentIds: [1] } },
  students: { 1: { id: 1, name: 'John' } }
}
```

**Lý do:** Dễ update, tránh duplication, performance tốt hơn

### 6. ✅ Use Tags cho Cache Invalidation

```tsx
// RTK Query endpoint
getUsers: builder.query<User[], void>({
  query: () => '/users',
  providesTags: ['User'],  // ✅ Provide tags
}),

updateUser: builder.mutation<User, Partial<User>>({
  query: (data) => ({ url: `/users/${data.id}`, method: 'PUT', body: data }),
  invalidatesTags: ['User'],  // ✅ Invalidate để auto refetch
}),
```

### 7. ✅ Handle Loading và Error States

```tsx
function MyComponent() {
  const { data, isLoading, isError, error } = useGetDataQuery();

  if (isLoading) return <Spinner />;
  if (isError) return <Error message={error.message} />;
  
  return <DataDisplay data={data} />;
}
```

---

## 📖 Examples

### Example 1: Protected Route Component

```tsx
import { useAuth } from '~/store/hooks';
import { Navigate } from 'react-router';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return <>{children}</>;
}

// Usage
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

### Example 2: Theme Switcher với Preferences

```tsx
import { useUserPreferences } from '~/store/hooks';

function ThemeSwitcher() {
  const { theme, updateTheme } = useUserPreferences();

  return (
    <select value={theme} onChange={(e) => updateTheme(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  );
}
```

### Example 3: Optimistic Update

```tsx
const [updateClass] = useUpdateClassMutation();

const handleUpdate = async (id: string, name: string) => {
  try {
    await updateClass({
      id,
      data: { name },
    }).unwrap();
    
    toast.success('Updated successfully!');
  } catch (error) {
    toast.error('Update failed');
  }
};
```

---

## 🔧 Advanced Topics

### Custom Middleware

```typescript
// app/store/middleware/logger.ts
import { Middleware } from '@reduxjs/toolkit';

export const loggerMiddleware: Middleware = (store) => (next) => (action) => {
  console.log('Dispatching:', action);
  const result = next(action);
  console.log('Next state:', store.getState());
  return result;
};
```

### Selector Memoization với createSelector

```typescript
import { createSelector } from '@reduxjs/toolkit';

// Memoized selector - only recompute khi dependencies thay đổi
export const selectActiveUsers = createSelector(
  [(state) => state.users.list],
  (users) => users.filter(user => user.is_active)
);
```

### Persist State với localStorage

```typescript
// Load state từ localStorage
const loadState = () => {
  try {
    const serialized = localStorage.getItem('state');
    return serialized ? JSON.parse(serialized) : undefined;
  } catch (err) {
    return undefined;
  }
};

// Save state vào localStorage
store.subscribe(() => {
  const state = store.getState();
  localStorage.setItem('state', JSON.stringify({
    auth: state.auth,
    user: state.user.preferences,
  }));
});
```

---

## 📚 Resources

- [Redux Toolkit Official Docs](https://redux-toolkit.js.org/)
- [RTK Query Tutorial](https://redux-toolkit.js.org/rtk-query/overview)
- [Redux Style Guide](https://redux.js.org/style-guide/)

---

## 🎓 Tổng Kết

**Redux Toolkit giúp bạn:**
1. ✅ Viết ít code hơn (90% less boilerplate)
2. ✅ Type safety với TypeScript
3. ✅ Automatic caching với RTK Query
4. ✅ DevTools sẵn có
5. ✅ Best practices được enforce

**Khi nào dùng Redux Toolkit:**
- App có nhiều state cần share giữa nhiều components
- State logic phức tạp
- Cần caching và data synchronization
- Team development (consistent patterns)

**Khi nào KHÔNG cần Redux:**
- App nhỏ với ít state
- State chỉ dùng trong 1-2 components
- Có thể dùng React Context đơn giản

Happy coding! 🚀
