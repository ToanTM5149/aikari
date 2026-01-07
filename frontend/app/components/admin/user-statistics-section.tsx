/**
 * User Statistics Section
 * Hiển thị thống kê users và top active users
 */

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import type { UserStatistics } from "~/redux/store/api/adminApi";

interface UserStatisticsSectionProps {
  data: UserStatistics;
  isLoading?: boolean;
}

export function UserStatisticsSection({ data, isLoading }: UserStatisticsSectionProps) {
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">User Statistics</h2>
      
      {/* Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Role Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.role_distribution.map((role) => (
              <div key={role.role} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={
                    role.role === 'ADMIN' ? 'destructive' :
                    role.role === 'TEACHER' ? 'default' :
                    'secondary'
                  }>
                    {role.role}
                  </Badge>
                  <span className="text-sm font-medium">{role.count} users</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${role.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {role.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Active Users */}
      <Card>
        <CardHeader>
          <CardTitle>Top Active Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.top_active_users.map((user, index) => (
              <div key={user.user_id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm font-bold text-muted-foreground w-6">
                    #{index + 1}
                  </span>
                  <Avatar>
                    <AvatarFallback>
                      {user.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-bold">{user.total_studysets}</p>
                    <p className="text-xs text-muted-foreground">Sets</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{user.total_activities}</p>
                    <p className="text-xs text-muted-foreground">Activities</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{Math.round(user.total_study_time_minutes / 60)}h</p>
                    <p className="text-xs text-muted-foreground">Study Time</p>
                  </div>
                </div>
                <Badge variant={
                  user.role === 'ADMIN' ? 'destructive' :
                  user.role === 'TEACHER' ? 'default' :
                  'secondary'
                }>
                  {user.role}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
