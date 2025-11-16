# Redux Store - Quick Reference

## 📁 Cấu Trúc

```
app/store/
├── index.ts              # Store config + typed hooks
├── Provider.tsx          # Redux Provider
├── types.ts              # TypeScript types
├── hooks.ts              # Custom hooks (useAuth, etc.)
├── slices/
│   ├── authSlice.ts     # Auth state management
│   └── userSlice.ts     # User state management
└── services/
    └── apiService.ts    # RTK Query API
```

## 🚀 Quick Start

### 1. Wrap App với ReduxProvider
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

### 2. Sử dụng Hooks

```tsx
// Login
import { useAuth } from '~/store/hooks';

function LoginPage() {
  const { login, loading, error } = useAuth();
  
  await login({ email, password });
}

// Get Current User
import { useCurrentUser } from '~/store/hooks';

function Profile() {
  const user = useCurrentUser();
  return <div>{user?.full_name}</div>;
}

// RTK Query
import { useGetClassesQuery } from '~/store/services/apiService';

function ClassList() {
  const { data, isLoading } = useGetClassesQuery();
  return <div>{data?.map(c => c.name)}</div>;
}
```

## 📖 Full Documentation

Xem file [REDUX_GUIDE.md](./REDUX_GUIDE.md) để hiểu chi tiết về:
- Core concepts
- Best practices
- Advanced patterns
- Examples

## 🎯 Cheat Sheet

| Task | Hook/Function |
|------|---------------|
| Login | `const { login } = useAuth()` |
| Logout | `const { logout } = useAuth()` |
| Get User | `const user = useCurrentUser()` |
| Check Auth | `const { isAuthenticated } = useAuth()` |
| Change Theme | `const { updateTheme } = useUserPreferences()` |
| API Call | `const { data } = useGetXxxQuery()` |
| Mutation | `const [updateXxx] = useUpdateXxxMutation()` |
| Dispatch | `const dispatch = useAppDispatch()` |
| Select State | `const data = useAppSelector(selectXxx)` |
