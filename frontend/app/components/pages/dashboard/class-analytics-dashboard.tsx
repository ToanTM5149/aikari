/**
 * Class Analytics Dashboard
 * Comprehensive analytics view for class teachers
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  useGetClassAnalyticsOverviewQuery,
  useGetClassStudentProgressQuery,
  useGetClassLeaderboardQuery,
  useGetClassTimeSeriesAnalyticsQuery,
} from '~/redux/features/class';
import {
  Users,
  BookOpen,
  Target,
  Clock,
  TrendingUp,
  Trophy,
  Activity,
  AlertCircle,
  ArrowLeft,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from 'recharts';

/**
 * Format time in seconds to readable string
 */
function formatStudyTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format percentage
 */
function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Stat Card Component
 */
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
}

function StatCard({ title, value, icon, description, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Overview Tab - Key metrics and statistics
 */
function OverviewTab({ classId }: { classId: string }) {
  const { data: overview, isLoading, error } = useGetClassAnalyticsOverviewQuery(classId);

  if (isLoading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (error || !overview) {
    return (
      <div className="text-center py-8 text-destructive">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p>Failed to load analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Members"
          value={overview.total_members}
          icon={<Users className="h-4 w-4" />}
          description={`${overview.active_members} active in last 7 days`}
        />
        <StatCard
          title="Study Sets"
          value={overview.total_studysets}
          icon={<BookOpen className="h-4 w-4" />}
          description={`${overview.total_terms} total terms`}
        />
        <StatCard
          title="Avg Reviewed"
          value={formatPercentage(overview.average_completion_rate)}
          icon={<Target className="h-4 w-4" />}
          description="Class card reviewed average"
        />
      </div>

      {/* Study Activity Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Study Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Sessions</span>
              <span className="text-2xl font-bold">{overview.total_study_sessions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Study Time</span>
              <span className="text-2xl font-bold">
                {formatStudyTime(overview.total_study_time)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Active Students</span>
              <span className="text-2xl font-bold">
                {overview.active_members} / {overview.total_members}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Top & Bottom Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.most_active_student && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Most Active Student</p>
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                  <div>
                    <p className="font-medium">{overview.most_active_student.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {overview.most_active_student.total_terms_studied} terms studied
                    </p>
                  </div>
                  <Badge variant="default">
                    {formatStudyTime(overview.most_active_student.total_study_time)}
                  </Badge>
                </div>
              </div>
            )}

            {overview.least_active_student && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Needs Attention</p>
                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                  <div>
                    <p className="font-medium">{overview.least_active_student.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {overview.least_active_student.total_terms_studied} terms studied
                    </p>
                  </div>
                  <Badge variant="outline">
                    {formatStudyTime(overview.least_active_student.total_study_time)}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Students Tab - Detailed student progress table
 */
function StudentsTab({ classId }: { classId: string }) {
  const { data: progressData, isLoading, error } = useGetClassStudentProgressQuery(classId);
  const [sortBy, setSortBy] = useState<'mastery' | 'time'>('mastery');

  if (isLoading) {
    return <div className="text-center py-8">Loading student progress...</div>;
  }

  if (error || !progressData) {
    return (
      <div className="text-center py-8 text-destructive">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p>Failed to load student progress</p>
      </div>
    );
  }

  // Sort students based on selected criteria
  const sortedStudents = [...progressData.data].sort((a, b) => {
    switch (sortBy) {
      case 'time':
        return b.total_study_time - a.total_study_time;
      case 'mastery':
      default:
        return b.mastery_percentage - a.mastery_percentage;
    }
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Student Progress</h3>
          <p className="text-sm text-muted-foreground">
            {progressData.count} students enrolled
          </p>
        </div>
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mastery">By Mastery</SelectItem>
            <SelectItem value="time">By Study Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Student Cards */}
      <div className="space-y-3">
        {sortedStudents.map((student, index) => (
          <Card key={student.user_id}>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Student Info */}
                <div className="md:col-span-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{student.username}</p>
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Mastery</p>
                    <p className="text-lg font-bold">
                      {formatPercentage(student.mastery_percentage)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Terms Studied</p>
                    <p className="text-lg font-bold">{student.total_terms_studied}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Study Time</p>
                    <p className="text-lg font-bold">
                      {formatStudyTime(student.total_study_time)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${student.mastery_percentage}%` }}
                  />
                </div>
              </div>

              {/* Weak Terms Warning */}
              {student.weak_terms_count > 0 && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-orange-600">
                    {student.weak_terms_count} weak terms
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Leaderboard Tab
 */
function LeaderboardTab({ classId }: { classId: string }) {
  const [sortBy, setSortBy] = useState<'mastery' | 'cards' | 'streak' | 'time'>('mastery');
  const { data: leaderboard, isLoading, error } = useGetClassLeaderboardQuery({
    classId,
    sortBy,
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading leaderboard...</div>;
  }

  if (error || !leaderboard) {
    return (
      <div className="text-center py-8 text-destructive">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p>Failed to load leaderboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Class Leaderboard</h3>
          <p className="text-sm text-muted-foreground">
            Top performers in the class
          </p>
        </div>
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mastery">By Terms Mastered</SelectItem>
            <SelectItem value="cards">By Cards Reviewed</SelectItem>
            <SelectItem value="streak">By Streak</SelectItem>
            <SelectItem value="time">By Study Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leaderboard */}
      <div className="space-y-2">
        {leaderboard.entries.map((entry: any) => (
          <Card key={entry.user_id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Rank Badge */}
                <div className="flex-shrink-0">
                  {entry.rank <= 3 ? (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      entry.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                      entry.rank === 2 ? 'bg-gray-100 text-gray-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {entry.rank === 1 && '🥇'}
                      {entry.rank === 2 && '🥈'}
                      {entry.rank === 3 && '🥉'}
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center font-bold text-lg">
                      #{entry.rank}
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <p className="font-medium">{entry.username}</p>
                  <p className="text-sm text-muted-foreground">{entry.email}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-6 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Mastered</p>
                    <p className="font-bold">{entry.total_terms_mastered}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Review</p>
                    <p className="font-bold">{entry.total_cards_reviewed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Streak</p>
                    <p className="font-bold">{entry.study_streak_days}d</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="font-bold">{formatStudyTime(entry.total_study_time)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Charts Tab - Visual analytics with graphs and charts
 */
function ChartsTab({ classId }: { classId: string }) {
  const { data: overview } = useGetClassAnalyticsOverviewQuery(classId);
  const { data: progressData } = useGetClassStudentProgressQuery(classId);
  const { data: leaderboard } = useGetClassLeaderboardQuery({ 
    classId, 
    sortBy: 'mastery' 
  });
  const { data: timeSeriesData, isLoading: isLoadingTimeSeries } = useGetClassTimeSeriesAnalyticsQuery({
    classId,
    days: 7,
    weeks: 4,
  });

  // Use real data from backend
  const studyTimeData = timeSeriesData?.daily_study_time.map(item => ({
    day: item.date,
    hours: item.hours,
    sessions: item.sessions,
  })) || [];

  const retentionData = timeSeriesData?.weekly_retention.map(item => ({
    week: item.week,
    remember: item.remember,
    forget: item.forget,
  })) || [];

  // Activity distribution from time-series data or fallback to student data
  const activityDistribution = timeSeriesData?.study_categories.length > 0
    ? timeSeriesData.study_categories.map(item => ({
        name: item.name,
        value: item.value,
        color: item.color || '#3b82f6',
      }))
    : progressData?.data ? [
        { 
          name: 'High Activity', 
          value: progressData.data.filter(s => s.total_study_time > 3600).length,
          color: '#10b981' 
        },
        { 
          name: 'Medium Activity', 
          value: progressData.data.filter(s => s.total_study_time > 1800 && s.total_study_time <= 3600).length,
          color: '#f59e0b' 
        },
        { 
          name: 'Low Activity', 
          value: progressData.data.filter(s => s.total_study_time <= 1800).length,
          color: '#ef4444' 
        },
      ].filter(item => item.value > 0) : [];

  // Test performance data from time-series
  const testPerformanceData = timeSeriesData?.test_performance.map(item => ({
    test: item.test_name.length > 15 ? item.test_name.substring(0, 15) + '...' : item.test_name,
    score: item.score,
    average: item.average,
  })) || [];

  // Top students progress
  const topStudentsData = leaderboard?.entries?.slice(0, 8).map(student => ({
    name: student.username.length > 10 ? student.username.substring(0, 10) + '...' : student.username,
    mastery: student.total_terms_mastered, // Using terms mastered as proxy for mastery
    reviewed: student.total_cards_reviewed,
  })) || [];

  // Progress over time from time-series data
  const progressOverTimeData = timeSeriesData?.progress_over_time.map(item => ({
    month: item.period,
    mastered: item.mastered,
    learning: item.learning,
    new: item.new,
  })) || [];

  // Overall progress radial
  const overallProgress = overview ? [
    { name: 'Completion', value: overview.average_completion_rate, fill: '#3b82f6' }
  ] : [];

  // Pass/Fail distribution from time-series
  const passFailData = timeSeriesData?.pass_fail_distribution ? [
    { name: 'Passed', value: timeSeriesData.pass_fail_distribution.passed, color: '#10b981' },
    { name: 'Failed', value: timeSeriesData.pass_fail_distribution.failed, color: '#ef4444' },
  ].filter(item => item.value > 0) : [];

  if (!overview || !progressData || isLoadingTimeSeries) {
    return <div className="text-center py-8">Loading charts...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Study Time & Retention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Study Time Trend
            </CardTitle>
            <CardDescription>Average hours per day this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={studyTimeData}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorHours)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Memory Retention
            </CardTitle>
            <CardDescription>Remember vs Forget by week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={retentionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="remember" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="forget" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Test Performance */}
      {testPerformanceData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Test Performance Trend
            </CardTitle>
            <CardDescription>Test scores compared to class average</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={testPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="test" className="text-xs" />
                <YAxis domain={[0, 100]} className="text-xs" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 6 }}
                  activeDot={{ r: 8 }}
                  name="Your Score"
                />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#94a3b8', r: 4 }}
                  name="Class Average"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Progress Over Time */}
      {progressOverTimeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Learning Progress Timeline
            </CardTitle>
            <CardDescription>Terms mastered, learning, and new over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={progressOverTimeData}>
                <defs>
                  <linearGradient id="colorMastered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorLearning" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="mastered"
                  stackId="1"
                  stroke="#10b981"
                  fill="url(#colorMastered)"
                  name="Mastered"
                />
                <Area
                  type="monotone"
                  dataKey="learning"
                  stackId="1"
                  stroke="#f59e0b"
                  fill="url(#colorLearning)"
                  name="Learning"
                />
                <Area
                  type="monotone"
                  dataKey="new"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="url(#colorNew)"
                  name="New"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Students Performance */}
      {topStudentsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Top Students Performance
            </CardTitle>
            <CardDescription>Terms mastered vs Cards reviewed comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={topStudentsData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="mastery"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Terms Mastered"
                />
                <Line
                  type="monotone"
                  dataKey="reviewed"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#8b5cf6', r: 4 }}
                  name="Cards Reviewed"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activityDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Level
              </CardTitle>
              <CardDescription>Student engagement</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={activityDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {activityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {passFailData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Test Results
              </CardTitle>
              <CardDescription>Pass/Fail distribution</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={passFailData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {passFailData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Overall Progress
            </CardTitle>
            <CardDescription>Class reviewed rate</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                data={overallProgress}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  minAngle={15}
                  background
                  clockWise
                  dataKey="value"
                  cornerRadius={10}
                />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-3xl font-bold fill-foreground"
                >
                  {overview.average_completion_rate.toFixed(0)}%
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Main Class Analytics Dashboard Component
 */
export function ClassAnalyticsDashboard() {
  const params = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const classId = params.classId;

  if (!classId) {
    return <div>Class ID is required</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/dashboard/class/${classId}`)}
          className="flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Class Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for your class
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="charts">
            <BarChart3 className="h-4 w-4 mr-2" />
            Charts
          </TabsTrigger>
          <TabsTrigger value="students">Members</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab classId={classId} />
        </TabsContent>

        <TabsContent value="charts" className="mt-6">
          <ChartsTab classId={classId} />
        </TabsContent>

        <TabsContent value="students" className="mt-6">
          <StudentsTab classId={classId} />
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          <LeaderboardTab classId={classId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
