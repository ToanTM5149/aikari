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
} from 'lucide-react';

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          title="Avg Completion"
          value={formatPercentage(overview.average_completion_rate)}
          icon={<Target className="h-4 w-4" />}
          description="Class average mastery"
        />
        <StatCard
          title="Avg Accuracy"
          value={formatPercentage(overview.average_accuracy)}
          icon={<TrendingUp className="h-4 w-4" />}
          description="Across all students"
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
                    {formatPercentage(overview.most_active_student.average_accuracy)}
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
                    {formatPercentage(overview.least_active_student.average_accuracy)}
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
  const [sortBy, setSortBy] = useState<'mastery' | 'accuracy' | 'time'>('mastery');

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
      case 'accuracy':
        return b.average_accuracy - a.average_accuracy;
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
            <SelectItem value="accuracy">By Accuracy</SelectItem>
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
                <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Mastery</p>
                    <p className="text-lg font-bold">
                      {formatPercentage(student.mastery_percentage)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Accuracy</p>
                    <p className="text-lg font-bold">
                      {formatPercentage(student.average_accuracy)}
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
  const [sortBy, setSortBy] = useState<'mastery' | 'accuracy' | 'streak' | 'time'>('mastery');
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
            <SelectItem value="accuracy">By Accuracy</SelectItem>
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
                    <p className="text-xs text-muted-foreground">Accuracy</p>
                    <p className="font-bold">{formatPercentage(entry.accuracy)}</p>
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Members</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab classId={classId} />
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
