# Admin Dashboard Frontend - Implementation Guide

## Overview

Frontend implementation cho Admin Statistics System, bao gồm:
- RTK Query API hooks để fetch admin statistics
- Reusable UI components
- Complete admin dashboard page với tabs
- Role-based navigation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Admin Dashboard Route                      │
│               /dashboard/admin                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              AdminDashboardPage Component                    │
│  - Tabs: Overview, Users, Learning, Classes, AI, Content    │
│  - useGetAdminDashboardQuery() hook                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Section Components                          │
│  - SystemOverviewSection                                     │
│  - UserStatisticsSection                                     │
│  - LearningStatisticsSection                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     RTK Query API                            │
│  adminApi với 9 endpoints                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend API                               │
│  /api/admin/* endpoints                                      │
└─────────────────────────────────────────────────────────────┘
```

## Files Created

### 1. API Layer
**`app/redux/store/api/adminApi.ts`**
- TypeScript interfaces cho tất cả admin statistics types
- 9 RTK Query endpoints:
  - `getAdminDashboard` - Complete dashboard
  - `getSystemOverview` - System overview stats
  - `getUserStatistics` - User statistics
  - `getLearningOverview` - Learning overview
  - `getLearningTrends` - Learning trends over time
  - `getClassStatistics` - Class statistics
  - `getAIUsageOverview` - AI usage overview
  - `getAIUsageTrends` - AI usage trends over time
  - `getContentStatistics` - Content statistics

### 2. Components

#### Base Components
**`app/components/admin/stat-card.tsx`**
- Reusable card component cho statistics
- Props: title, value, description, icon, trend
- Supports trend indicators (positive/negative)

#### Section Components
**`app/components/admin/system-overview-section.tsx`**
- Displays system overview statistics
- Grid layout với StatCards
- Groups: Users, Active Users, Content, AI Usage

**`app/components/admin/user-statistics-section.tsx`**
- Role distribution với progress bars
- Top active users list với metrics
- Avatar, badges cho user roles

**`app/components/admin/learning-statistics-section.tsx`**
- Learning overview stats
- Mastery rate progress bar
- Recent activity metrics

#### Page Component
**`app/components/pages/admin/admin-dashboard-page.tsx`**
- Main admin dashboard page
- Tabbed interface cho different sections
- Error handling cho unauthorized access
- Loading states
- Refresh functionality

### 3. Routes
**`app/routes/dashboard/admin.tsx`**
- Route wrapper component
- Path: `/dashboard/admin`

**`app/routes/index.ts`**
- Updated với admin route

### 4. Navigation
**`app/components/layout/authenticated/AppSidebar.tsx`**
- Added "Admin Dashboard" menu item
- Role-based filtering (ADMIN only)
- Shield icon

## Usage

### Access Admin Dashboard

**URL:** `http://localhost:5173/dashboard/admin`

**Requirements:**
- User must be logged in
- User must have ADMIN role
- Backend server must be running

### Using API Hooks

```typescript
import { useGetAdminDashboardQuery } from "~/redux/store/api/adminApi";

function MyComponent() {
  const { data, error, isLoading, refetch } = useGetAdminDashboardQuery();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;
  
  return (
    <div>
      <h1>Total Users: {data.system_overview.total_users}</h1>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

### Individual Statistics

```typescript
import { 
  useGetSystemOverviewQuery,
  useGetUserStatisticsQuery,
  useGetLearningTrendsQuery,
} from "~/redux/store/api/adminApi";

function MyComponent() {
  // System overview
  const overview = useGetSystemOverviewQuery();
  
  // User statistics với custom top limit
  const userStats = useGetUserStatisticsQuery({ topLimit: 5 });
  
  // Learning trends cho last 7 days
  const trends = useGetLearningTrendsQuery({ days: 7 });
  
  return <div>...</div>;
}
```

## Component Props

### StatCard

```typescript
interface StatCardProps {
  title: string;              // Card title
  value: string | number;     // Main value to display
  description?: string;       // Optional description
  icon?: LucideIcon;         // Optional icon
  trend?: {                  // Optional trend indicator
    value: number;           // Percentage change
    isPositive: boolean;     // Green (positive) or red (negative)
  };
  className?: string;        // Additional CSS classes
}
```

### SystemOverviewSection

```typescript
interface SystemOverviewSectionProps {
  data: SystemOverviewStats;  // System overview data
  isLoading?: boolean;        // Loading state
}
```

### UserStatisticsSection

```typescript
interface UserStatisticsSectionProps {
  data: UserStatistics;       // User statistics data
  isLoading?: boolean;        // Loading state
}
```

### LearningStatisticsSection

```typescript
interface LearningStatisticsSectionProps {
  data: LearningOverviewStats; // Learning statistics data
  isLoading?: boolean;         // Loading state
}
```

## Type Definitions

All TypeScript interfaces are defined in `adminApi.ts`:

```typescript
// System Overview
interface SystemOverviewStats {
  total_users: number;
  total_students: number;
  total_teachers: number;
  // ... more fields
}

// User Statistics
interface UserStatistics {
  total_users: number;
  active_users_today: number;
  role_distribution: UserRoleDistribution[];
  top_active_users: UserActivityMetrics[];
}

// ... and more
```

## Styling

Components use:
- **shadcn/ui** components (Card, Badge, Avatar, Tabs, etc.)
- **Tailwind CSS** for styling
- **Lucide React** icons
- **cn()** utility for conditional classes

## Error Handling

### 403 Forbidden
```typescript
if (error && 'status' in error && error.status === 403) {
  return <Alert>Access denied. Admin privileges required.</Alert>;
}
```

### Loading State
```typescript
if (isLoading) {
  return <LoadingSpinner />;
}
```

### Network Errors
RTK Query automatically handles retries và caching.

## Performance Considerations

### Caching
- RTK Query automatically caches all responses
- Cache invalidation via tags
- Refetch on window focus (configurable)

### Polling (Optional)
```typescript
const { data } = useGetSystemOverviewQuery(undefined, {
  pollingInterval: 60000, // Refetch every 60 seconds
});
```

### Selective Loading
```typescript
// Load only what you need
const overview = useGetSystemOverviewQuery();
const userStats = useGetUserStatisticsQuery({ topLimit: 5 });
// Don't load trends if not needed
```

## Responsive Design

All components are responsive:
- Mobile: 1 column
- Tablet: 2 columns (`md:grid-cols-2`)
- Desktop: 4 columns (`lg:grid-cols-4`)

## Accessibility

- Semantic HTML elements
- Proper heading hierarchy (h1, h2, h3)
- ARIA labels where needed
- Keyboard navigation support (via shadcn/ui)

## Testing

### Manual Testing
1. Login as admin user
2. Navigate to `/dashboard/admin`
3. Verify all tabs load correctly
4. Test refresh button
5. Check responsive design on different screen sizes

### Unit Testing (Future)
```typescript
import { render, screen } from '@testing-library/react';
import { SystemOverviewSection } from './system-overview-section';

test('renders system overview', () => {
  const mockData = { total_users: 100, /* ... */ };
  render(<SystemOverviewSection data={mockData} />);
  expect(screen.getByText('100')).toBeInTheDocument();
});
```

## Customization

### Adding New Stat Card

```typescript
<StatCard
  title="Your Metric"
  value={data.your_metric}
  description="Description"
  icon={YourIcon}
  trend={{ value: 10, isPositive: true }}
/>
```

### Adding New Tab

```tsx
<TabsContent value="your-tab" className="space-y-4">
  <YourCustomSection data={data.your_section} />
</TabsContent>
```

### Custom Colors

Use Tailwind classes:
```tsx
<div className="text-blue-600 bg-blue-50 border-blue-200">
  Custom colored content
</div>
```

## Future Enhancements

1. **Charts & Graphs**
   - Add Recharts or Chart.js
   - Line charts cho trends
   - Pie charts cho distributions

2. **Export Functionality**
   - Export to CSV/Excel
   - Print-friendly view
   - PDF generation

3. **Filtering & Date Range**
   - Date range picker
   - Custom filters
   - Comparison views

4. **Real-time Updates**
   - WebSocket integration
   - Live data updates
   - Push notifications

5. **Advanced Analytics**
   - Predictive insights
   - Anomaly detection
   - Custom dashboards

## Troubleshooting

### "Access Denied" Error
- Check if user has ADMIN role
- Verify JWT token is valid
- Check backend permissions

### Data Not Loading
- Check browser console for errors
- Verify backend server is running
- Check network tab for API calls
- Ensure CORS is configured correctly

### Types Not Working
```bash
# Regenerate types if needed
cd frontend
npm run typecheck
```

### Styling Issues
```bash
# Rebuild Tailwind
cd frontend
npm run dev
```

## Resources

- **RTK Query Docs:** https://redux-toolkit.js.org/rtk-query/overview
- **shadcn/ui:** https://ui.shadcn.com/
- **Tailwind CSS:** https://tailwindcss.com/
- **Lucide Icons:** https://lucide.dev/

## Related Files

- Backend API: `/backend/app/api/routes/admin.py`
- Backend Service: `/backend/app/services/admin_service.py`
- Backend Schemas: `/backend/app/schemas/admin.py`
- Backend Guide: `/ADMIN_STATISTICS_GUIDE.md`
